/**
 * Article Autopilot 2.0 — controlled activity-event vocabulary (Phase 1B.1).
 * Persistence is intentionally out of scope for this step.
 */

export const AUTOPILOT_EVENT_TYPES = [
  'topic_created',
  'topic_updated',
  'research_started',
  'research_completed',
  'research_failed',
  'research_snapshot_created',
  'research_snapshot_updated',
  'research_overlap_analysed',
  'research_marked_ready',
  'research_snapshot_confirmed',
  'research_snapshot_superseded',
  'research_returned_to_draft',
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
  'keyword_import_completed_with_errors',
  'keyword_import_failed',
  'keyword_candidate_reviewed',
  'keyword_candidate_accepted',
  'keyword_candidate_rejected',
  'keyword_candidate_deferred',
  'keyword_candidate_marked_duplicate',
  'keyword_candidate_converted_to_topic',
  'gsc_oauth_started',
  'gsc_connected',
  'gsc_connection_failed',
  'gsc_identity_verified',
  'gsc_identity_mismatch',
  'gsc_property_selected',
  'gsc_property_validation_failed',
  'gsc_sync_started',
  'gsc_sync_completed',
  'gsc_sync_failed',
  'gsc_disconnected',
] as const;

export type AutopilotEventType = (typeof AUTOPILOT_EVENT_TYPES)[number];

export const AUTOPILOT_ACTOR_TYPES = ['user', 'system', 'ai'] as const;
export type AutopilotActorType = (typeof AUTOPILOT_ACTOR_TYPES)[number];

export const AUTOPILOT_ENTITY_TYPES = [
  'topic',
  'workflow_run',
  'setting',
  'keyword_import_batch',
  'keyword_candidate',
  'research_snapshot',
  'gsc_connection',
  'gsc_sync_run',
] as const;
export type AutopilotEntityType = (typeof AUTOPILOT_ENTITY_TYPES)[number];

export const AUTOPILOT_EVENT_SOURCES = ['admin', 'api', 'worker', 'import'] as const;
export type AutopilotEventSource = (typeof AUTOPILOT_EVENT_SOURCES)[number];
