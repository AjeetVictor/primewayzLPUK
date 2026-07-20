import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTOPILOT_ACTOR_TYPES,
  AUTOPILOT_ENTITY_TYPES,
  AUTOPILOT_EVENT_SOURCES,
  AUTOPILOT_EVENT_TYPES,
} from '../../data/autopilot/eventTypes.ts';
import {
  AUTOPILOT_DECISION_STATUSES,
  AUTOPILOT_FOUNDATION_DEFAULT_STATUSES,
  AUTOPILOT_TOPIC_STATUSES,
} from '../../data/autopilot/status.ts';

test('event type values are unique', () => {
  assert.equal(AUTOPILOT_EVENT_TYPES.length, new Set(AUTOPILOT_EVENT_TYPES).size);
});

test('expected event vocabulary is present', () => {
  for (const event of [
    'topic_created',
    'topic_updated',
    'research_started',
    'research_completed',
    'research_failed',
    'score_calculated',
    'score_overridden',
    'category_recommended',
    'category_overridden',
    'decision_submitted',
    'decision_approved',
    'decision_rejected',
    'decision_deferred',
    'more_research_requested',
    'topic_archived',
    'workflow_queued',
    'workflow_started',
    'workflow_succeeded',
    'workflow_failed',
    'setting_changed',
    'keyword_import_started',
    'keyword_import_completed',
    'keyword_candidate_converted_to_topic',
  ] as const) {
    assert.ok(AUTOPILOT_EVENT_TYPES.includes(event), event);
  }
});

test('actor, entity, and source vocabularies remain present', () => {
  assert.deepEqual([...AUTOPILOT_ACTOR_TYPES], ['user', 'system', 'ai']);
  assert.ok(AUTOPILOT_ENTITY_TYPES.includes('topic'));
  assert.ok(AUTOPILOT_ENTITY_TYPES.includes('workflow_run'));
  assert.ok(AUTOPILOT_ENTITY_TYPES.includes('setting'));
  assert.ok(AUTOPILOT_ENTITY_TYPES.includes('keyword_import_batch'));
  assert.ok(AUTOPILOT_ENTITY_TYPES.includes('keyword_candidate'));
  assert.ok(AUTOPILOT_ENTITY_TYPES.includes('research_snapshot'));
  assert.deepEqual([...AUTOPILOT_EVENT_SOURCES], ['admin', 'api', 'worker', 'import']);
});

test('phase 2B research event vocabulary is present', () => {
  for (const event of [
    'research_snapshot_created',
    'research_snapshot_updated',
    'research_overlap_analysed',
    'research_marked_ready',
    'research_snapshot_confirmed',
    'research_snapshot_superseded',
    'research_returned_to_draft',
  ] as const) {
    assert.ok(AUTOPILOT_EVENT_TYPES.includes(event), event);
  }
});

test('foundation status defaults and vocabularies are stable', () => {
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.briefStatus, 'NOT_STARTED');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.draftStatus, 'NOT_STARTED');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.mediaStatus, 'NOT_REQUIRED');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.publishingStatus, 'NOT_READY');
  assert.equal(AUTOPILOT_FOUNDATION_DEFAULT_STATUSES.performanceStatus, 'NOT_TRACKED');
  assert.ok(AUTOPILOT_TOPIC_STATUSES.includes('DISCOVERED'));
  assert.ok(AUTOPILOT_DECISION_STATUSES.includes('PENDING_REVIEW'));
});
