import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canTransitionAutopilotHumanReviewStatus,
  canTransitionAutopilotPipelineStage,
  canTransitionAutopilotQueueStatus,
} from './draftFirstTransitions.ts';

test('queue transitions keep user-facing states simple and guarded', () => {
  assert.equal(canTransitionAutopilotQueueStatus('GENERATING', 'READY_FOR_REVIEW'), true);
  assert.equal(canTransitionAutopilotQueueStatus('READY_FOR_REVIEW', 'SCHEDULED'), true);
  assert.equal(canTransitionAutopilotQueueStatus('SCHEDULED', 'PUBLISHED'), true);
  assert.equal(canTransitionAutopilotQueueStatus('PUBLISHED', 'GENERATING'), false);
  assert.equal(canTransitionAutopilotQueueStatus('REJECTED', 'READY_FOR_REVIEW'), false);
});

test('pipeline stages follow the automated chain and only failed work retries', () => {
  assert.equal(canTransitionAutopilotPipelineStage('QUEUED', 'PLANNING'), true);
  assert.equal(canTransitionAutopilotPipelineStage('RESEARCHING', 'CHECKING_OVERLAP'), true);
  assert.equal(canTransitionAutopilotPipelineStage('SANITISING', 'COMPLETED'), true);
  assert.equal(canTransitionAutopilotPipelineStage('FAILED', 'QUEUED'), true);
  assert.equal(canTransitionAutopilotPipelineStage('WRITING', 'PUBLISHED' as never), false);
});

test('approval may be invalidated by changes but rejected review is terminal', () => {
  assert.equal(canTransitionAutopilotHumanReviewStatus('PENDING', 'APPROVED'), true);
  assert.equal(canTransitionAutopilotHumanReviewStatus('APPROVED', 'CHANGES_REQUESTED'), true);
  assert.equal(canTransitionAutopilotHumanReviewStatus('CHANGES_REQUESTED', 'PENDING'), true);
  assert.equal(canTransitionAutopilotHumanReviewStatus('REJECTED', 'PENDING'), false);
});
