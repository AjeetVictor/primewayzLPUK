import type {
  AutopilotHumanReviewStatus,
  AutopilotQueueStatus,
} from '../../data/autopilot/status.ts';

export type AutopilotPublishingMode = 'immediate' | 'scheduled';

export type AutopilotPublishingEligibilityInput = {
  mode: AutopilotPublishingMode;
  queueStatus: AutopilotQueueStatus;
  humanReviewStatus: AutopilotHumanReviewStatus;
  approvedAt: Date | string | null;
  currentVersionId: number | null;
  approvedVersionId: number | null;
  scheduledFor?: Date | string | null;
  now?: Date;
};

export type AutopilotPublishingEligibilityIssue =
  | 'QUEUE_STATUS_NOT_PUBLISHABLE'
  | 'HUMAN_APPROVAL_REQUIRED'
  | 'APPROVAL_TIMESTAMP_REQUIRED'
  | 'APPROVED_VERSION_REQUIRED'
  | 'CURRENT_VERSION_DIFFERS_FROM_APPROVED_VERSION'
  | 'SCHEDULE_REQUIRED'
  | 'SCHEDULE_NOT_DUE';

export type AutopilotPublishingEligibilityResult = {
  eligible: boolean;
  issues: AutopilotPublishingEligibilityIssue[];
};

function validDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function evaluateAutopilotPublishingEligibility(
  input: AutopilotPublishingEligibilityInput,
): AutopilotPublishingEligibilityResult {
  const issues: AutopilotPublishingEligibilityIssue[] = [];

  const expectedQueueStatus: AutopilotQueueStatus =
    input.mode === 'scheduled' ? 'SCHEDULED' : 'READY_FOR_REVIEW';
  if (input.queueStatus !== expectedQueueStatus) issues.push('QUEUE_STATUS_NOT_PUBLISHABLE');
  if (input.humanReviewStatus !== 'APPROVED') issues.push('HUMAN_APPROVAL_REQUIRED');
  if (!validDate(input.approvedAt)) issues.push('APPROVAL_TIMESTAMP_REQUIRED');

  if (!Number.isInteger(input.approvedVersionId) || (input.approvedVersionId ?? 0) < 1) {
    issues.push('APPROVED_VERSION_REQUIRED');
  } else if (input.currentVersionId !== input.approvedVersionId) {
    issues.push('CURRENT_VERSION_DIFFERS_FROM_APPROVED_VERSION');
  }

  if (input.mode === 'scheduled') {
    const scheduledFor = validDate(input.scheduledFor);
    if (!scheduledFor) {
      issues.push('SCHEDULE_REQUIRED');
    } else if (scheduledFor.getTime() > (input.now ?? new Date()).getTime()) {
      issues.push('SCHEDULE_NOT_DUE');
    }
  }

  return { eligible: issues.length === 0, issues };
}
