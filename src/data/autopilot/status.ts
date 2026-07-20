/**
 * Article Autopilot 2.0 — foundation workflow status constants (Phase 1B.1).
 * Legacy statuses remain string-literal unions; draft-first persisted statuses mirror Prisma enums.
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

/** Draft-first user-facing queue statuses. Keep these separate from internal stages. */
export const AUTOPILOT_QUEUE_STATUSES = [
  'GENERATING',
  'READY_FOR_REVIEW',
  'NEEDS_ATTENTION',
  'SCHEDULED',
  'PUBLISHED',
  'REJECTED',
] as const;
export type AutopilotQueueStatus = (typeof AUTOPILOT_QUEUE_STATUSES)[number];

/** Internal orchestration stages. These belong in logs/progress, not separate user tasks. */
export const AUTOPILOT_PIPELINE_STAGES = [
  'QUEUED',
  'PLANNING',
  'RESEARCHING',
  'CHECKING_OVERLAP',
  'BUILDING_BRIEF',
  'WRITING',
  'GENERATING_METADATA',
  'AUTO_REVIEWING',
  'SANITISING',
  'COMPLETED',
  'FAILED',
] as const;
export type AutopilotPipelineStage = (typeof AUTOPILOT_PIPELINE_STAGES)[number];

export const AUTOPILOT_REVIEW_VERDICTS = [
  'NOT_REVIEWED',
  'PASS',
  'PASS_WITH_WARNINGS',
  'FAIL',
] as const;
export type AutopilotReviewVerdict = (typeof AUTOPILOT_REVIEW_VERDICTS)[number];

export const AUTOPILOT_HUMAN_REVIEW_STATUSES = [
  'PENDING',
  'IN_REVIEW',
  'APPROVED',
  'CHANGES_REQUESTED',
  'REJECTED',
] as const;
export type AutopilotHumanReviewStatus =
  (typeof AUTOPILOT_HUMAN_REVIEW_STATUSES)[number];

export const AUTOPILOT_DRAFT_FIRST_DEFAULT_STATUSES = {
  queueStatus: 'GENERATING',
  pipelineStage: 'QUEUED',
  reviewVerdict: 'NOT_REVIEWED',
  humanReviewStatus: 'PENDING',
} as const satisfies {
  queueStatus: AutopilotQueueStatus;
  pipelineStage: AutopilotPipelineStage;
  reviewVerdict: AutopilotReviewVerdict;
  humanReviewStatus: AutopilotHumanReviewStatus;
};
