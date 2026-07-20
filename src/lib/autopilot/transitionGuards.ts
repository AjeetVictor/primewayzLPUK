/**
 * Pure workflow transition guards for Autopilot foundation statuses.
 */

import type { AutopilotDecisionStatus, AutopilotTopicStatus } from '../../data/autopilot/status.ts';
import type {
  AutopilotCategoryAssignmentInput,
  AutopilotValidationResult,
} from '../../data/autopilot/types.ts';
import {
  mergeAutopilotValidationResults,
  validateAutopilotFinalCategoryAssignment,
} from './categoryValidation.ts';

export const AUTOPILOT_TOPIC_TRANSITIONS: Readonly<
  Record<AutopilotTopicStatus, readonly AutopilotTopicStatus[]>
> = {
  DISCOVERED: ['RESEARCHING', 'REJECTED', 'DUPLICATE', 'DEFERRED'],
  RESEARCHING: ['RESEARCH_COMPLETE', 'REJECTED', 'DUPLICATE', 'DEFERRED'],
  RESEARCH_COMPLETE: ['RESEARCHING', 'REJECTED', 'DUPLICATE', 'DEFERRED'],
  /** Deferred topics may return to research; not directly to complete. */
  DEFERRED: ['RESEARCHING', 'REJECTED', 'DUPLICATE'],
  REJECTED: [],
  DUPLICATE: [],
};

export const AUTOPILOT_DECISION_TRANSITIONS: Readonly<
  Record<AutopilotDecisionStatus, readonly AutopilotDecisionStatus[]>
> = {
  NOT_READY: ['PENDING_REVIEW'],
  PENDING_REVIEW: [
    'APPROVED',
    'REJECTED',
    'NEEDS_MORE_RESEARCH',
    'DEFERRED',
  ],
  /** Needs more research returns to not-ready until research is refreshed. */
  NEEDS_MORE_RESEARCH: ['NOT_READY', 'PENDING_REVIEW'],
  DEFERRED: ['NOT_READY', 'PENDING_REVIEW'],
  APPROVED: [],
  REJECTED: [],
};

function transitionResult(
  ok: boolean,
  code: string,
  message: string,
  field?: string,
): AutopilotValidationResult {
  if (ok) {
    return { ok: true, errors: [], warnings: [] };
  }
  return {
    ok: false,
    errors: [{ code, message, field, severity: 'error' }],
    warnings: [],
  };
}

export function canTransitionAutopilotTopicStatus(
  from: AutopilotTopicStatus,
  to: AutopilotTopicStatus,
): boolean {
  if (from === to) return true;
  return (AUTOPILOT_TOPIC_TRANSITIONS[from] || []).includes(to);
}

export function validateAutopilotTopicStatusTransition(
  from: AutopilotTopicStatus,
  to: AutopilotTopicStatus,
): AutopilotValidationResult {
  if (canTransitionAutopilotTopicStatus(from, to)) {
    return transitionResult(true, 'TOPIC_TRANSITION_OK', 'Topic status transition is allowed.');
  }
  return transitionResult(
    false,
    'TOPIC_TRANSITION_ILLEGAL',
    `Illegal topic status transition: ${from} → ${to}.`,
    'topicStatus',
  );
}

export function canTransitionAutopilotDecisionStatus(
  from: AutopilotDecisionStatus,
  to: AutopilotDecisionStatus,
): boolean {
  if (from === to) return true;
  return (AUTOPILOT_DECISION_TRANSITIONS[from] || []).includes(to);
}

export function validateAutopilotDecisionStatusTransition(
  from: AutopilotDecisionStatus,
  to: AutopilotDecisionStatus,
): AutopilotValidationResult {
  if (canTransitionAutopilotDecisionStatus(from, to)) {
    return transitionResult(
      true,
      'DECISION_TRANSITION_OK',
      'Decision status transition is allowed.',
    );
  }
  return transitionResult(
    false,
    'DECISION_TRANSITION_ILLEGAL',
    `Illegal decision status transition: ${from} → ${to}.`,
    'decisionStatus',
  );
}

/** Practical Phase 1B.1 approval card requirements (no brief/draft/media). */
export interface AutopilotDecisionApprovalInput {
  workingTitle?: string | null;
  primaryKeyword?: string | null;
  userProblem?: string | null;
  audience?: string | null;
  market?: string | null;
  language?: string | null;
  primaryCategory?: string | null;
  secondaryCategories?: Array<string | null | undefined> | null;
  decisionRationale?: string | null;
}

export function validateAutopilotDecisionCardForApproval(
  input: AutopilotDecisionApprovalInput,
): AutopilotValidationResult {
  const errors: AutopilotValidationResult['errors'] = [];

  const requiredText: Array<{ field: keyof AutopilotDecisionApprovalInput; code: string; label: string }> = [
    { field: 'workingTitle', code: 'WORKING_TITLE_REQUIRED', label: 'Working title' },
    { field: 'primaryKeyword', code: 'PRIMARY_KEYWORD_REQUIRED', label: 'Primary keyword' },
    { field: 'userProblem', code: 'USER_PROBLEM_REQUIRED', label: 'User problem' },
    { field: 'audience', code: 'AUDIENCE_REQUIRED', label: 'Audience' },
    { field: 'market', code: 'MARKET_REQUIRED', label: 'Market' },
    { field: 'language', code: 'LANGUAGE_REQUIRED', label: 'Language' },
  ];

  for (const item of requiredText) {
    const value = input[item.field];
    if (typeof value !== 'string' || !value.trim()) {
      errors.push({
        code: item.code,
        message: `${item.label} is required before approval.`,
        field: item.field,
        severity: 'error',
      });
    }
  }

  const categoryResult = validateAutopilotFinalCategoryAssignment({
    primaryCategory: input.primaryCategory,
    secondaryCategories: input.secondaryCategories,
  } satisfies AutopilotCategoryAssignmentInput);

  return mergeAutopilotValidationResults(
    { ok: errors.length === 0, errors, warnings: [] },
    categoryResult,
  );
}

/**
 * Validate moving a decision to APPROVED: transition legality + card readiness.
 */
export function validateAutopilotDecisionApproval(
  from: AutopilotDecisionStatus,
  input: AutopilotDecisionApprovalInput,
): AutopilotValidationResult {
  const transition = validateAutopilotDecisionStatusTransition(from, 'APPROVED');
  const card = validateAutopilotDecisionCardForApproval(input);
  return mergeAutopilotValidationResults(transition, card);
}

export function validateAutopilotDecisionRejection(
  from: AutopilotDecisionStatus,
  rationale?: string | null,
): AutopilotValidationResult {
  const transition = validateAutopilotDecisionStatusTransition(from, 'REJECTED');
  if (!transition.ok) return transition;

  if (typeof rationale === 'string' && rationale.trim()) {
    return transition;
  }

  return {
    ok: false,
    errors: [
      {
        code: 'DECISION_RATIONALE_REQUIRED',
        message: 'A rationale is required when rejecting a topic decision.',
        field: 'decisionRationale',
        severity: 'error',
      },
    ],
    warnings: [],
  };
}
