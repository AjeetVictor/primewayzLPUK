import type {
  AutopilotHumanReviewStatus,
  AutopilotPipelineStage,
  AutopilotQueueStatus,
} from '../../data/autopilot/status.ts';

export const AUTOPILOT_QUEUE_TRANSITIONS: Readonly<
  Record<AutopilotQueueStatus, readonly AutopilotQueueStatus[]>
> = {
  GENERATING: ['READY_FOR_REVIEW', 'NEEDS_ATTENTION', 'REJECTED'],
  READY_FOR_REVIEW: ['GENERATING', 'NEEDS_ATTENTION', 'SCHEDULED', 'PUBLISHED', 'REJECTED'],
  NEEDS_ATTENTION: ['GENERATING', 'READY_FOR_REVIEW', 'REJECTED'],
  SCHEDULED: ['READY_FOR_REVIEW', 'PUBLISHED', 'REJECTED'],
  PUBLISHED: [],
  REJECTED: [],
};

export const AUTOPILOT_PIPELINE_TRANSITIONS: Readonly<
  Record<AutopilotPipelineStage, readonly AutopilotPipelineStage[]>
> = {
  QUEUED: ['PLANNING', 'FAILED'],
  PLANNING: ['RESEARCHING', 'FAILED'],
  RESEARCHING: ['CHECKING_OVERLAP', 'FAILED'],
  CHECKING_OVERLAP: ['BUILDING_BRIEF', 'FAILED'],
  BUILDING_BRIEF: ['WRITING', 'FAILED'],
  WRITING: ['GENERATING_METADATA', 'FAILED'],
  GENERATING_METADATA: ['AUTO_REVIEWING', 'FAILED'],
  AUTO_REVIEWING: ['SANITISING', 'FAILED'],
  SANITISING: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: ['QUEUED'],
};

export const AUTOPILOT_HUMAN_REVIEW_TRANSITIONS: Readonly<
  Record<AutopilotHumanReviewStatus, readonly AutopilotHumanReviewStatus[]>
> = {
  PENDING: ['IN_REVIEW', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  IN_REVIEW: ['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'],
  APPROVED: ['CHANGES_REQUESTED'],
  CHANGES_REQUESTED: ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'],
  REJECTED: [],
};

function canTransition<T extends string>(
  transitions: Readonly<Record<T, readonly T[]>>,
  from: T,
  to: T,
): boolean {
  return from === to || transitions[from].includes(to);
}

export function canTransitionAutopilotQueueStatus(
  from: AutopilotQueueStatus,
  to: AutopilotQueueStatus,
): boolean {
  return canTransition(AUTOPILOT_QUEUE_TRANSITIONS, from, to);
}

export function canTransitionAutopilotPipelineStage(
  from: AutopilotPipelineStage,
  to: AutopilotPipelineStage,
): boolean {
  return canTransition(AUTOPILOT_PIPELINE_TRANSITIONS, from, to);
}

export function canTransitionAutopilotHumanReviewStatus(
  from: AutopilotHumanReviewStatus,
  to: AutopilotHumanReviewStatus,
): boolean {
  return canTransition(AUTOPILOT_HUMAN_REVIEW_TRANSITIONS, from, to);
}
