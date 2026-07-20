import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTOPILOT_DEFAULT_MAX_NEW_DRAFTS_PER_WEEK,
  AUTOPILOT_DEFAULT_MAX_UNREVIEWED_DRAFTS,
  evaluateAutopilotBacklogPolicy,
} from './backlogPolicy.ts';

test('default backlog policy allows generation below both caps', () => {
  const result = evaluateAutopilotBacklogPolicy({
    generatedThisWeek: 1,
    unreviewedDraftCount: 9,
  });
  assert.equal(result.canGenerateDraft, true);
  assert.equal(result.keywordDiscoveryContinues, true);
  assert.deepEqual(result.reasons, []);
  assert.equal(result.limits.maxNewDraftsPerWeek, AUTOPILOT_DEFAULT_MAX_NEW_DRAFTS_PER_WEEK);
  assert.equal(result.limits.maxUnreviewedDrafts, AUTOPILOT_DEFAULT_MAX_UNREVIEWED_DRAFTS);
});

test('generation pauses at either safety cap while discovery continues', () => {
  const weekly = evaluateAutopilotBacklogPolicy({ generatedThisWeek: 2, unreviewedDraftCount: 1 });
  assert.equal(weekly.canGenerateDraft, false);
  assert.deepEqual(weekly.reasons, ['WEEKLY_DRAFT_LIMIT_REACHED']);
  assert.equal(weekly.keywordDiscoveryContinues, true);

  const backlog = evaluateAutopilotBacklogPolicy({ generatedThisWeek: 0, unreviewedDraftCount: 10 });
  assert.equal(backlog.canGenerateDraft, false);
  assert.deepEqual(backlog.reasons, ['UNREVIEWED_BACKLOG_LIMIT_REACHED']);
});

test('invalid counts and limits are rejected', () => {
  assert.throws(() => evaluateAutopilotBacklogPolicy({ generatedThisWeek: -1, unreviewedDraftCount: 0 }));
  assert.throws(() => evaluateAutopilotBacklogPolicy({ generatedThisWeek: 0, unreviewedDraftCount: 0, maxUnreviewedDrafts: 0 }));
});
