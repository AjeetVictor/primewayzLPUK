import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canTransitionAutopilotDecisionStatus,
  canTransitionAutopilotTopicStatus,
  validateAutopilotDecisionApproval,
  validateAutopilotDecisionRejection,
  validateAutopilotDecisionStatusTransition,
  validateAutopilotTopicStatusTransition,
} from './transitionGuards.ts';
import { BLOG_CATEGORIES } from '../../data/blog/categories.ts';

const primary = BLOG_CATEGORIES[0]!.slug;
const secondary = BLOG_CATEGORIES[1]!.slug;

const readyCard = {
  workingTitle: 'Monthly support for UK SMEs',
  primaryKeyword: 'monthly software support uk',
  userProblem: 'SMEs lack steady engineering capacity.',
  audience: 'UK SME owners',
  market: 'United Kingdom',
  language: 'en-GB',
  primaryCategory: primary,
  secondaryCategories: [secondary],
};

test('allowed topic transitions for foundation statuses', () => {
  const allowed: Array<[Parameters<typeof canTransitionAutopilotTopicStatus>[0], Parameters<typeof canTransitionAutopilotTopicStatus>[1]]> = [
    ['DISCOVERED', 'RESEARCHING'],
    ['DISCOVERED', 'REJECTED'],
    ['DISCOVERED', 'DUPLICATE'],
    ['DISCOVERED', 'DEFERRED'],
    ['RESEARCHING', 'RESEARCH_COMPLETE'],
    ['RESEARCHING', 'REJECTED'],
    ['RESEARCHING', 'DUPLICATE'],
    ['RESEARCHING', 'DEFERRED'],
    ['RESEARCH_COMPLETE', 'RESEARCHING'],
    ['RESEARCH_COMPLETE', 'REJECTED'],
    ['RESEARCH_COMPLETE', 'DUPLICATE'],
    ['RESEARCH_COMPLETE', 'DEFERRED'],
    ['DEFERRED', 'RESEARCHING'],
    ['DEFERRED', 'REJECTED'],
    ['DEFERRED', 'DUPLICATE'],
  ];

  for (const [from, to] of allowed) {
    assert.equal(canTransitionAutopilotTopicStatus(from, to), true, `${from} → ${to}`);
    assert.equal(validateAutopilotTopicStatusTransition(from, to).ok, true);
  }
});

test('illegal topic transitions are rejected', () => {
  assert.equal(canTransitionAutopilotTopicStatus('DISCOVERED', 'RESEARCH_COMPLETE'), false);
  assert.equal(canTransitionAutopilotTopicStatus('REJECTED', 'RESEARCHING'), false);
  assert.equal(canTransitionAutopilotTopicStatus('DUPLICATE', 'DISCOVERED'), false);
  assert.equal(canTransitionAutopilotTopicStatus('DEFERRED', 'RESEARCH_COMPLETE'), false);

  const result = validateAutopilotTopicStatusTransition('REJECTED', 'RESEARCHING');
  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.code, 'TOPIC_TRANSITION_ILLEGAL');
});

test('allowed decision transitions for foundation statuses', () => {
  assert.equal(canTransitionAutopilotDecisionStatus('NOT_READY', 'PENDING_REVIEW'), true);
  assert.equal(canTransitionAutopilotDecisionStatus('PENDING_REVIEW', 'APPROVED'), true);
  assert.equal(canTransitionAutopilotDecisionStatus('PENDING_REVIEW', 'REJECTED'), true);
  assert.equal(canTransitionAutopilotDecisionStatus('PENDING_REVIEW', 'NEEDS_MORE_RESEARCH'), true);
  assert.equal(canTransitionAutopilotDecisionStatus('PENDING_REVIEW', 'DEFERRED'), true);
  assert.equal(canTransitionAutopilotDecisionStatus('NEEDS_MORE_RESEARCH', 'NOT_READY'), true);
  assert.equal(canTransitionAutopilotDecisionStatus('DEFERRED', 'PENDING_REVIEW'), true);
});

test('illegal decision transitions are rejected', () => {
  assert.equal(canTransitionAutopilotDecisionStatus('NOT_READY', 'APPROVED'), false);
  assert.equal(canTransitionAutopilotDecisionStatus('APPROVED', 'PENDING_REVIEW'), false);
  assert.equal(canTransitionAutopilotDecisionStatus('REJECTED', 'APPROVED'), false);

  const result = validateAutopilotDecisionStatusTransition('NOT_READY', 'APPROVED');
  assert.equal(result.ok, false);
  assert.equal(result.errors[0]?.code, 'DECISION_TRANSITION_ILLEGAL');
});

test('approval requires pending review plus complete decision card and valid categories', () => {
  const ok = validateAutopilotDecisionApproval('PENDING_REVIEW', readyCard);
  assert.equal(ok.ok, true);

  const wrongStatus = validateAutopilotDecisionApproval('NOT_READY', readyCard);
  assert.equal(wrongStatus.ok, false);
  assert.ok(wrongStatus.errors.some((error) => error.code === 'DECISION_TRANSITION_ILLEGAL'));

  const missingTitle = validateAutopilotDecisionApproval('PENDING_REVIEW', {
    ...readyCard,
    workingTitle: '  ',
  });
  assert.equal(missingTitle.ok, false);
  assert.ok(missingTitle.errors.some((error) => error.code === 'WORKING_TITLE_REQUIRED'));

  const missingCategory = validateAutopilotDecisionApproval('PENDING_REVIEW', {
    ...readyCard,
    primaryCategory: undefined,
  });
  assert.equal(missingCategory.ok, false);
  assert.ok(missingCategory.errors.some((error) => error.code === 'PRIMARY_CATEGORY_REQUIRED'));

  const invalidCategory = validateAutopilotDecisionApproval('PENDING_REVIEW', {
    ...readyCard,
    primaryCategory: 'not-real',
  });
  assert.equal(invalidCategory.ok, false);
  assert.ok(invalidCategory.errors.some((error) => error.code === 'PRIMARY_CATEGORY_UNKNOWN'));

  const primaryInSecondary = validateAutopilotDecisionApproval('PENDING_REVIEW', {
    ...readyCard,
    secondaryCategories: [primary],
  });
  assert.equal(primaryInSecondary.ok, false);
  assert.ok(
    primaryInSecondary.errors.some((error) => error.code === 'SECONDARY_CONTAINS_PRIMARY'),
  );
});

test('rejection requires rationale and legal transition', () => {
  const ok = validateAutopilotDecisionRejection('PENDING_REVIEW', 'Overlaps existing guide.');
  assert.equal(ok.ok, true);

  const missing = validateAutopilotDecisionRejection('PENDING_REVIEW', '  ');
  assert.equal(missing.ok, false);
  assert.equal(missing.errors[0]?.code, 'DECISION_RATIONALE_REQUIRED');

  const illegal = validateAutopilotDecisionRejection('NOT_READY', 'Too early.');
  assert.equal(illegal.ok, false);
});
