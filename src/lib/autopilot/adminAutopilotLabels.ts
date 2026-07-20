/**
 * Human-readable Autopilot labels for admin UI.
 * Machine values are preserved internally; labels never imply publication.
 */

import {
  AUTOPILOT_DECISION_STATUSES,
  AUTOPILOT_TOPIC_STATUSES,
  type AutopilotDecisionStatus,
  type AutopilotTopicStatus,
} from '../../data/autopilot/status.ts';
import {
  AUTOPILOT_RECOMMENDATION_BANDS,
  AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS,
  type AutopilotRecommendationBand,
} from '../../data/autopilot/scoringConfig.ts';
import {
  AUTOPILOT_EVENT_TYPES,
  type AutopilotEventType,
} from '../../data/autopilot/eventTypes.ts';

const TOPIC_STATUS_LABELS: Record<AutopilotTopicStatus, string> = {
  DISCOVERED: 'Discovered',
  RESEARCHING: 'Researching',
  RESEARCH_COMPLETE: 'Research complete',
  REJECTED: 'Rejected',
  DUPLICATE: 'Duplicate',
  DEFERRED: 'Deferred',
};

const DECISION_STATUS_LABELS: Record<AutopilotDecisionStatus, string> = {
  NOT_READY: 'Not ready',
  PENDING_REVIEW: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_MORE_RESEARCH: 'Needs more research',
  DEFERRED: 'Deferred',
};

const SCORE_BAND_LABELS: Record<AutopilotRecommendationBand, string> = {
  strong_approve_candidate: 'Strong candidate',
  review_carefully: 'Review carefully',
  defer_or_needs_research: 'Defer or needs research',
  likely_reject: 'Likely reject',
};

const EVENT_TYPE_LABELS: Record<AutopilotEventType, string> = {
  topic_created: 'Topic created',
  topic_updated: 'Topic updated',
  research_started: 'Research started',
  research_completed: 'Research completed',
  research_failed: 'Research failed',
  score_calculated: 'Score calculated',
  score_overridden: 'Score overridden',
  category_recommended: 'Category recommended',
  category_overridden: 'Category overridden',
  decision_submitted: 'Decision submitted',
  decision_approved: 'Decision approved',
  decision_rejected: 'Decision rejected',
  decision_deferred: 'Decision deferred',
  more_research_requested: 'More research requested',
  topic_archived: 'Topic archived',
  workflow_queued: 'Workflow queued',
  workflow_started: 'Workflow started',
  workflow_succeeded: 'Workflow succeeded',
  workflow_failed: 'Workflow failed',
  setting_changed: 'Setting changed',
  keyword_import_started: 'Keyword import started',
  keyword_import_completed: 'Keyword import completed',
  keyword_import_completed_with_errors: 'Keyword import completed with errors',
  keyword_import_failed: 'Keyword import failed',
  keyword_candidate_reviewed: 'Keyword candidate reviewed',
  keyword_candidate_accepted: 'Keyword candidate accepted',
  keyword_candidate_rejected: 'Keyword candidate rejected',
  keyword_candidate_deferred: 'Keyword candidate deferred',
  keyword_candidate_marked_duplicate: 'Keyword candidate marked duplicate',
  keyword_candidate_converted_to_topic: 'Keyword candidate converted to topic',
  research_snapshot_created: 'Research snapshot created',
  research_snapshot_updated: 'Research snapshot updated',
  research_overlap_analysed: 'Research overlap analysed',
  research_marked_ready: 'Research marked ready',
  research_snapshot_confirmed: 'Research snapshot confirmed',
  research_snapshot_superseded: 'Research snapshot superseded',
  research_returned_to_draft: 'Research returned to draft',
  gsc_oauth_started: 'GSC OAuth started',
  gsc_connected: 'GSC connected',
  gsc_connection_failed: 'GSC connection failed',
  gsc_identity_verified: 'GSC identity verified',
  gsc_identity_mismatch: 'GSC identity mismatch',
  gsc_property_selected: 'GSC property selected',
  gsc_property_validation_failed: 'GSC property validation failed',
  gsc_sync_started: 'GSC sync started',
  gsc_sync_completed: 'GSC sync completed',
  gsc_sync_failed: 'GSC sync failed',
  gsc_disconnected: 'GSC disconnected',
};

function titleCaseFallback(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getTopicStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  if ((AUTOPILOT_TOPIC_STATUSES as readonly string[]).includes(status)) {
    return TOPIC_STATUS_LABELS[status as AutopilotTopicStatus];
  }
  return titleCaseFallback(status);
}

export function getDecisionStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unknown';
  if ((AUTOPILOT_DECISION_STATUSES as readonly string[]).includes(status)) {
    return DECISION_STATUS_LABELS[status as AutopilotDecisionStatus];
  }
  return titleCaseFallback(status);
}

export function getScoreBandLabel(band: string | null | undefined): string {
  if (!band) return 'Not scored';
  if ((AUTOPILOT_RECOMMENDATION_BANDS as readonly string[]).includes(band)) {
    return SCORE_BAND_LABELS[band as AutopilotRecommendationBand];
  }
  const threshold = AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS.find((item) => item.band === band);
  if (threshold) return threshold.label;
  return titleCaseFallback(band);
}

export function getEventTypeLabel(eventType: string | null | undefined): string {
  if (!eventType) return 'Unknown event';
  if ((AUTOPILOT_EVENT_TYPES as readonly string[]).includes(eventType)) {
    return EVENT_TYPE_LABELS[eventType as AutopilotEventType];
  }
  return titleCaseFallback(eventType);
}

export function getEntityTypeLabel(entityType: string | null | undefined): string {
  if (!entityType) return 'Unknown';
  if (entityType === 'topic') return 'Topic';
  if (entityType === 'workflow_run') return 'Workflow run';
  if (entityType === 'setting') return 'Setting';
  if (entityType === 'keyword_import_batch') return 'Keyword import';
  if (entityType === 'keyword_candidate') return 'Keyword candidate';
  return titleCaseFallback(entityType);
}

export function getScoreDimensionLabel(key: string): string {
  const labels: Record<string, string> = {
    serviceRelevance: 'Service relevance',
    businessValue: 'Business value',
    buyerIntent: 'Buyer intent',
    topicalAuthorityFit: 'Topical authority fit',
    contentGap: 'Content gap',
    differentiationPotential: 'Differentiation potential',
    rankingFeasibility: 'Ranking feasibility',
    evidenceConfidence: 'Evidence confidence',
    internalLinkOpportunity: 'Internal-link opportunity',
    commercialPageSupport: 'Commercial-page support',
    cannibalisation: 'Cannibalisation',
    unsupportedClaimRisk: 'Unsupported-claim risk',
  };
  return labels[key] || titleCaseFallback(key);
}

/** Ensures every known machine value has a label (used by tests). */
export function listAllTopicStatusLabels(): Record<AutopilotTopicStatus, string> {
  return { ...TOPIC_STATUS_LABELS };
}

export function listAllDecisionStatusLabels(): Record<AutopilotDecisionStatus, string> {
  return { ...DECISION_STATUS_LABELS };
}

export function listAllScoreBandLabels(): Record<AutopilotRecommendationBand, string> {
  return { ...SCORE_BAND_LABELS };
}
