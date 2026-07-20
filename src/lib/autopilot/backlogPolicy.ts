export const AUTOPILOT_DEFAULT_MAX_NEW_DRAFTS_PER_WEEK = 2;
export const AUTOPILOT_DEFAULT_MAX_UNREVIEWED_DRAFTS = 10;

export type AutopilotBacklogPolicyInput = {
  generatedThisWeek: number;
  unreviewedDraftCount: number;
  maxNewDraftsPerWeek?: number;
  maxUnreviewedDrafts?: number;
};

export type AutopilotBacklogPolicyResult = {
  canGenerateDraft: boolean;
  keywordDiscoveryContinues: true;
  reasons: Array<'WEEKLY_DRAFT_LIMIT_REACHED' | 'UNREVIEWED_BACKLOG_LIMIT_REACHED'>;
  limits: {
    maxNewDraftsPerWeek: number;
    maxUnreviewedDrafts: number;
  };
};

function asNonNegativeInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new TypeError(`${field} must be a non-negative integer.`);
  }
  return value;
}

function asPositiveInteger(value: number, field: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${field} must be a positive integer.`);
  }
  return value;
}

export function evaluateAutopilotBacklogPolicy(
  input: AutopilotBacklogPolicyInput,
): AutopilotBacklogPolicyResult {
  const generatedThisWeek = asNonNegativeInteger(input.generatedThisWeek, 'generatedThisWeek');
  const unreviewedDraftCount = asNonNegativeInteger(
    input.unreviewedDraftCount,
    'unreviewedDraftCount',
  );
  const maxNewDraftsPerWeek = asPositiveInteger(
    input.maxNewDraftsPerWeek ?? AUTOPILOT_DEFAULT_MAX_NEW_DRAFTS_PER_WEEK,
    'maxNewDraftsPerWeek',
  );
  const maxUnreviewedDrafts = asPositiveInteger(
    input.maxUnreviewedDrafts ?? AUTOPILOT_DEFAULT_MAX_UNREVIEWED_DRAFTS,
    'maxUnreviewedDrafts',
  );

  const reasons: AutopilotBacklogPolicyResult['reasons'] = [];
  if (generatedThisWeek >= maxNewDraftsPerWeek) reasons.push('WEEKLY_DRAFT_LIMIT_REACHED');
  if (unreviewedDraftCount >= maxUnreviewedDrafts) {
    reasons.push('UNREVIEWED_BACKLOG_LIMIT_REACHED');
  }

  return {
    canGenerateDraft: reasons.length === 0,
    keywordDiscoveryContinues: true,
    reasons,
    limits: { maxNewDraftsPerWeek, maxUnreviewedDrafts },
  };
}
