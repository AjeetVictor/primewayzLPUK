import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { AUTOPILOT_SCORE_DIMENSION_KEYS } from '../../data/autopilot/scoringConfig.ts';
import { AutopilotError } from './apiErrors.ts';
import { applyTopicDecision } from './decisionService.ts';
import { recalculateAndPersistTopicScore } from './scorePersistenceService.ts';
import { createAutopilotTopic, patchAutopilotTopic, archiveAutopilotTopic } from './topicService.ts';
import { BLOG_CATEGORIES } from '../../data/blog/categories.ts';

function baseTopic(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 1,
    workingTitle: 'Monthly support for UK SMEs',
    primaryKeyword: 'monthly software support',
    supportingKeywords: [],
    keywordVariants: [],
    userProblem: 'Need steady capacity',
    audience: 'UK SME owners',
    market: 'United Kingdom',
    language: 'en-GB',
    location: null,
    source: 'manual',
    proposedSlug: null,
    primaryCategory: BLOG_CATEGORIES[0]!.slug,
    secondaryCategories: [],
    topicStatus: 'DISCOVERED',
    decisionStatus: 'NOT_READY',
    briefStatus: 'NOT_STARTED',
    draftStatus: 'NOT_STARTED',
    mediaStatus: 'NOT_REQUIRED',
    publishingStatus: 'NOT_READY',
    performanceStatus: 'NOT_TRACKED',
    searchIntent: null,
    serpEvidence: null,
    businessAlignment: null,
    contentArchitecture: null,
    riskAssessment: null,
    categoryRecommendation: null,
    scoreBreakdown: null,
    aiMetadata: null,
    serviceRelevance: null,
    businessValue: null,
    buyerIntent: null,
    topicalAuthorityFit: null,
    contentGap: null,
    differentiationPotential: null,
    rankingFeasibility: null,
    evidenceConfidence: null,
    internalLinkOpportunity: null,
    commercialPageSupport: null,
    cannibalisationPenalty: null,
    unsupportedClaimRiskPenalty: null,
    rawScore: null,
    totalScore: null,
    scoringVersion: null,
    assignedToId: null,
    createdById: 2,
    updatedById: 2,
    decidedById: null,
    decidedAt: null,
    decisionRationale: null,
    mergeIntoTopicId: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test('createAutopilotTopic writes explicit empty JSON arrays and server actor ids', async () => {
  let createdData: Record<string, unknown> = {};
  let activity: Record<string, unknown> = {};
  const prisma = {
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
    autopilotTopic: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        createdData = data;
        return baseTopic({ ...data, id: 11 });
      },
    },
    autopilotActivityLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        activity = data;
        return data;
      },
    },
  };

  const topic = await createAutopilotTopic(
    prisma as never,
    { id: 42, email: 'author@example.com', role: 'blog_author' },
    {
      workingTitle: 'New topic',
      primaryKeyword: 'keyword',
      userProblem: 'problem',
      audience: 'audience',
    },
    'corr-create01',
  );

  assert.deepEqual(createdData.supportingKeywords, []);
  assert.deepEqual(createdData.keywordVariants, []);
  assert.deepEqual(createdData.secondaryCategories, []);
  assert.equal(createdData.createdById, 42);
  assert.equal(createdData.updatedById, 42);
  assert.equal(createdData.topicStatus, 'DISCOVERED');
  assert.equal(activity.eventType, 'topic_created');
  assert.equal(topic.id, 11);
});

test('patchAutopilotTopic rejects privileged fields and empty patches', async () => {
  const prisma = {
    autopilotTopic: {
      findUnique: async () => baseTopic(),
    },
  };

  await assert.rejects(() =>
    patchAutopilotTopic(
      prisma as never,
      { id: 1, email: 'a@b.com', role: 'blog_author' },
      1,
      {},
      'corr-patch000',
      { canEditorial: false },
    ),
  );

  await assert.rejects(() =>
    patchAutopilotTopic(
      prisma as never,
      { id: 1, email: 'a@b.com', role: 'blog_author' },
      1,
      { rawScore: 99, workingTitle: 'X' },
      'corr-patch001',
      { canEditorial: false },
    ),
  );
});

test('score persistence rejects incomplete dimensions and ignores client totals', async () => {
  const incomplete = baseTopic();
  const prismaIncomplete = {
    autopilotTopic: { findUnique: async () => incomplete },
  };

  await assert.rejects(
    () =>
      recalculateAndPersistTopicScore(
        prismaIncomplete as never,
        1,
        { id: 1, email: 'a@b.com', role: 'blog_author' },
        'corr-score001',
      ),
    (error: unknown) =>
      error instanceof AutopilotError &&
      error.code === 'AUTOPILOT_SCORE_DIMENSIONS_INCOMPLETE',
  );

  const dimensions = Object.fromEntries(
    AUTOPILOT_SCORE_DIMENSION_KEYS.map((key) => [key, new Prisma.Decimal(80)]),
  );
  let updated: Record<string, unknown> = {};
  let activity: Record<string, unknown> = {};
  const complete = baseTopic({
    ...dimensions,
    cannibalisationPenalty: new Prisma.Decimal(5),
    unsupportedClaimRiskPenalty: new Prisma.Decimal(0),
    rawScore: new Prisma.Decimal(10),
    totalScore: new Prisma.Decimal(10),
  });

  const prismaComplete = {
    autopilotTopic: {
      findUnique: async () => complete,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updated = data;
        return baseTopic({ ...complete, ...data, id: 1 });
      },
    },
    autopilotActivityLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        activity = data;
        return data;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prismaComplete),
  };

  const result = await recalculateAndPersistTopicScore(
    prismaComplete as never,
    1,
    { id: 3, email: 'ed@example.com', role: 'blog_editor' },
    'corr-score002',
  );

  assert.equal(Number(updated.totalScore), 75);
  assert.equal(activity.eventType, 'score_calculated');
  assert.equal(result.calculation.totalScore, 75);
});

test('decision approve requires editorial readiness and never changes publishingStatus', async () => {
  const topic = baseTopic({ decisionStatus: 'PENDING_REVIEW' });
  let updateData: Record<string, unknown> = {};
  const prisma = {
    autopilotTopic: {
      findUnique: async () => topic,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        updateData = data;
        return { ...topic, ...data };
      },
    },
    autopilotActivityLog: { create: async () => ({}) },
    cmsBlogPost: {
      create: async () => {
        throw new Error('CMS must not be touched');
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  await assert.rejects(() =>
    applyTopicDecision(
      prisma as never,
      1,
      { id: 1, email: 'author@example.com', role: 'blog_author' },
      { action: 'approve', rationale: 'Looks good' },
      'corr-dec-0001',
    ),
  );

  const approved = await applyTopicDecision(
    prisma as never,
    1,
    { id: 2, email: 'editor@example.com', role: 'blog_editor' },
    { action: 'approve', rationale: 'Ready for later brief stage' },
    'corr-dec-0002',
  );

  assert.equal(updateData.decisionStatus, 'APPROVED');
  assert.equal('publishingStatus' in updateData, false);
  assert.equal(approved.decisionStatus, 'APPROVED');
  assert.equal(approved.publishingStatus, 'NOT_READY');
});

test('illegal decision transition returns conflict code', async () => {
  const prisma = {
    autopilotTopic: {
      findUnique: async () => baseTopic({ decisionStatus: 'NOT_READY' }),
    },
  };

  await assert.rejects(
    () =>
      applyTopicDecision(
        prisma as never,
        1,
        { id: 2, email: 'editor@example.com', role: 'blog_editor' },
        { action: 'approve', rationale: 'Too early' },
        'corr-dec-0003',
      ),
    (error: unknown) =>
      error instanceof AutopilotError && error.code === 'AUTOPILOT_ILLEGAL_TRANSITION',
  );
});

test('archive is soft and idempotent', async () => {
  const now = new Date();
  let topic: Record<string, unknown> = baseTopic();
  const logs: string[] = [];
  const prisma = {
    autopilotTopic: {
      findUnique: async () => topic,
      update: async ({ data }: { data: Record<string, unknown> }) => {
        topic = { ...topic, ...data };
        return topic;
      },
    },
    autopilotActivityLog: {
      create: async ({ data }: { data: { eventType: string } }) => {
        logs.push(data.eventType);
        return data;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  const first = await archiveAutopilotTopic(
    prisma as never,
    { id: 2, email: 'editor@example.com', role: 'blog_editor' },
    1,
    'Out of scope',
    'corr-arch-001',
  );
  assert.ok(first.topic.archivedAt);
  assert.equal(first.alreadyArchived, false);
  assert.deepEqual(logs, ['topic_archived']);

  topic = { ...topic, archivedAt: now };
  const second = await archiveAutopilotTopic(
    prisma as never,
    { id: 2, email: 'editor@example.com', role: 'blog_editor' },
    1,
    'Out of scope again',
    'corr-arch-002',
  );
  assert.equal(second.alreadyArchived, true);
  assert.deepEqual(logs, ['topic_archived']);
});
