import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTOPILOT_FOUNDATION_DEFAULT_STATUSES } from '../../data/autopilot/status.ts';
import { AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED } from '../../data/autopilot/types.ts';

/**
 * Documents the Prisma defaults that must stay aligned with Phase 1B.1 constants.
 * Does not connect to a database.
 */
test('Prisma AutopilotTopic status defaults match Phase 1B.1 foundation defaults', () => {
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.topicStatus, 'DISCOVERED');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.decisionStatus, 'NOT_READY');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.briefStatus, 'NOT_STARTED');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.draftStatus, 'NOT_STARTED');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.mediaStatus, 'NOT_REQUIRED');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.publishingStatus, 'NOT_READY');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.performanceStatus, 'NOT_TRACKED');
});

test('locked auto-publish setting key is stable for migration and future APIs', () => {
  assert.equal(AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED, 'autoPublishEnabled');
});
