import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAutopilotPublishingEligibility } from './publishingEligibility.ts';

const approvedBase = {
  humanReviewStatus: 'APPROVED' as const,
  approvedAt: new Date('2026-07-20T10:00:00Z'),
  currentVersionId: 3,
  approvedVersionId: 3,
};

test('immediate publishing requires explicit human approval of the current version', () => {
  const result = evaluateAutopilotPublishingEligibility({
    ...approvedBase,
    mode: 'immediate',
    queueStatus: 'READY_FOR_REVIEW',
  });
  assert.deepEqual(result, { eligible: true, issues: [] });
});

test('LLM scores or a stale approved version cannot make a draft publishable', () => {
  const result = evaluateAutopilotPublishingEligibility({
    mode: 'immediate',
    queueStatus: 'READY_FOR_REVIEW',
    humanReviewStatus: 'PENDING',
    approvedAt: null,
    currentVersionId: 4,
    approvedVersionId: 3,
  });
  assert.equal(result.eligible, false);
  assert.ok(result.issues.includes('HUMAN_APPROVAL_REQUIRED'));
  assert.ok(result.issues.includes('APPROVAL_TIMESTAMP_REQUIRED'));
  assert.ok(result.issues.includes('CURRENT_VERSION_DIFFERS_FROM_APPROVED_VERSION'));
});

test('scheduled publishing only becomes eligible when the approved schedule is due', () => {
  const future = evaluateAutopilotPublishingEligibility({
    ...approvedBase,
    mode: 'scheduled',
    queueStatus: 'SCHEDULED',
    scheduledFor: new Date('2026-07-21T10:00:00Z'),
    now: new Date('2026-07-20T10:00:00Z'),
  });
  assert.equal(future.eligible, false);
  assert.deepEqual(future.issues, ['SCHEDULE_NOT_DUE']);

  const due = evaluateAutopilotPublishingEligibility({
    ...approvedBase,
    mode: 'scheduled',
    queueStatus: 'SCHEDULED',
    scheduledFor: new Date('2026-07-20T09:59:00Z'),
    now: new Date('2026-07-20T10:00:00Z'),
  });
  assert.deepEqual(due, { eligible: true, issues: [] });
});
