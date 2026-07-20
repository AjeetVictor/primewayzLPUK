/**
 * Article Autopilot 2.0 — foundation workflow status constants (Phase 1B.1).
 * String-literal unions (project convention — no Prisma enums).
 */

export const AUTOPILOT_TOPIC_STATUSES = [
  'DISCOVERED',
  'RESEARCHING',
  'RESEARCH_COMPLETE',
  'REJECTED',
  'DUPLICATE',
  'DEFERRED',
] as const;

export type AutopilotTopicStatus = (typeof AUTOPILOT_TOPIC_STATUSES)[number];

export const AUTOPILOT_DECISION_STATUSES = [
  'NOT_READY',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'NEEDS_MORE_RESEARCH',
  'DEFERRED',
] as const;

export type AutopilotDecisionStatus = (typeof AUTOPILOT_DECISION_STATUSES)[number];

/** Later-phase placeholders with foundation defaults only. */
export const AUTOPILOT_BRIEF_STATUSES = ['NOT_STARTED'] as const;
export type AutopilotBriefStatus = (typeof AUTOPILOT_BRIEF_STATUSES)[number];

export const AUTOPILOT_DRAFT_STATUSES = ['NOT_STARTED'] as const;
export type AutopilotDraftStatus = (typeof AUTOPILOT_DRAFT_STATUSES)[number];

export const AUTOPILOT_MEDIA_STATUSES = ['NOT_REQUIRED', 'NOT_STARTED'] as const;
export type AutopilotMediaStatus = (typeof AUTOPILOT_MEDIA_STATUSES)[number];

export const AUTOPILOT_PUBLISHING_STATUSES = ['NOT_READY'] as const;
export type AutopilotPublishingStatus = (typeof AUTOPILOT_PUBLISHING_STATUSES)[number];

export const AUTOPILOT_PERFORMANCE_STATUSES = ['NOT_TRACKED'] as const;
export type AutopilotPerformanceStatus = (typeof AUTOPILOT_PERFORMANCE_STATUSES)[number];

export const AUTOPILOT_FOUNDATION_DEFAULT_STATUSES = {
  topicStatus: 'DISCOVERED',
  decisionStatus: 'NOT_READY',
  briefStatus: 'NOT_STARTED',
  draftStatus: 'NOT_STARTED',
  mediaStatus: 'NOT_REQUIRED',
  publishingStatus: 'NOT_READY',
  performanceStatus: 'NOT_TRACKED',
} as const satisfies {
  topicStatus: AutopilotTopicStatus;
  decisionStatus: AutopilotDecisionStatus;
  briefStatus: AutopilotBriefStatus;
  draftStatus: AutopilotDraftStatus;
  mediaStatus: AutopilotMediaStatus;
  publishingStatus: AutopilotPublishingStatus;
  performanceStatus: AutopilotPerformanceStatus;
};
