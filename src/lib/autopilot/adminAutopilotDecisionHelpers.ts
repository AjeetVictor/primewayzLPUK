/**
 * Topic Decision Card helpers — action visibility, patch extraction, score bounds.
 * Does not reimplement server transition or scoring logic.
 */

import type { AutopilotDecisionStatus } from '../../data/autopilot/status.ts';
import {
  AUTOPILOT_PENALTY_LIMITS,
  AUTOPILOT_SCORE_DIMENSION_KEYS,
  type AutopilotScoreDimensionKey,
} from '../../data/autopilot/scoringConfig.ts';
import type { AutopilotDecisionAction } from './apiValidation.ts';
import { canContributeTopics, canEditorialAutopilot } from './autopilotPermissions.ts';

export const APPROVAL_CONFIRMATION_COPY =
  'Approve this topic for the next editorial phase? This will not create, publish, or schedule an article.';

export type DecisionActionPresentation = {
  action: AutopilotDecisionAction;
  label: string;
  requiresRationale: boolean;
  requiresConfirm: boolean;
  confirmTitle: string;
  confirmBody: string;
  variant: 'default' | 'warning' | 'danger';
};

const ACTION_META: Record<
  AutopilotDecisionAction,
  Omit<DecisionActionPresentation, 'action'>
> = {
  submit: {
    label: 'Submit for Review',
    requiresRationale: false,
    requiresConfirm: false,
    confirmTitle: 'Submit for review',
    confirmBody: 'Submit this topic for editorial review?',
    variant: 'default',
  },
  approve: {
    label: 'Approve',
    requiresRationale: true,
    requiresConfirm: true,
    confirmTitle: 'Approve topic decision',
    confirmBody: APPROVAL_CONFIRMATION_COPY,
    variant: 'default',
  },
  reject: {
    label: 'Reject',
    requiresRationale: true,
    requiresConfirm: true,
    confirmTitle: 'Reject topic',
    confirmBody: 'Reject this topic decision? Audit history will be retained.',
    variant: 'danger',
  },
  defer: {
    label: 'Defer',
    requiresRationale: true,
    requiresConfirm: true,
    confirmTitle: 'Defer topic',
    confirmBody: 'Defer this topic for later review?',
    variant: 'warning',
  },
  needs_more_research: {
    label: 'Request More Research',
    requiresRationale: true,
    requiresConfirm: true,
    confirmTitle: 'Request more research',
    confirmBody: 'Request additional research before a final decision?',
    variant: 'warning',
  },
};

/**
 * UI-only permitted actions by decision status + role.
 * Server remains authoritative for transitions.
 */
export function getPermittedDecisionActions(
  decisionStatus: AutopilotDecisionStatus | string,
  role?: string,
): DecisionActionPresentation[] {
  const actions: AutopilotDecisionAction[] = [];

  if (!canContributeTopics(role)) return [];

  if (decisionStatus === 'NOT_READY') {
    actions.push('submit');
  } else if (decisionStatus === 'PENDING_REVIEW') {
    if (canEditorialAutopilot(role)) {
      actions.push('approve', 'reject', 'defer', 'needs_more_research');
    }
  } else if (decisionStatus === 'NEEDS_MORE_RESEARCH' || decisionStatus === 'DEFERRED') {
    actions.push('submit');
  }

  return actions.map((action) => ({ action, ...ACTION_META[action] }));
}

export function clampScoreDimension(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function clampCannibalisationPenalty(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(
    AUTOPILOT_PENALTY_LIMITS.cannibalisation.min,
    Math.min(AUTOPILOT_PENALTY_LIMITS.cannibalisation.max, Math.round(value)),
  );
}

export function clampUnsupportedClaimPenalty(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(
    AUTOPILOT_PENALTY_LIMITS.unsupportedClaimRisk.min,
    Math.min(AUTOPILOT_PENALTY_LIMITS.unsupportedClaimRisk.max, Math.round(value)),
  );
}

export const SCORE_INPUT_BOUNDS = {
  dimension: { min: 0, max: 100 },
  cannibalisationPenalty: {
    min: AUTOPILOT_PENALTY_LIMITS.cannibalisation.min,
    max: AUTOPILOT_PENALTY_LIMITS.cannibalisation.max,
  },
  unsupportedClaimRiskPenalty: {
    min: AUTOPILOT_PENALTY_LIMITS.unsupportedClaimRisk.min,
    max: AUTOPILOT_PENALTY_LIMITS.unsupportedClaimRisk.max,
  },
} as const;

const ORDINARY_PATCH_KEYS = [
  'workingTitle',
  'primaryKeyword',
  'supportingKeywords',
  'keywordVariants',
  'userProblem',
  'audience',
  'market',
  'language',
  'location',
  'source',
  'proposedSlug',
  'searchIntent',
  'serpEvidence',
  'businessAlignment',
  'contentArchitecture',
  'riskAssessment',
] as const;

const CATEGORY_PATCH_KEYS = ['primaryCategory', 'secondaryCategories'] as const;

const SCORE_PATCH_KEYS = [
  ...AUTOPILOT_SCORE_DIMENSION_KEYS,
  'cannibalisationPenalty',
  'unsupportedClaimRiskPenalty',
] as const;

const FORBIDDEN_PATCH_KEYS = new Set([
  'id',
  'topicStatus',
  'decisionStatus',
  'briefStatus',
  'draftStatus',
  'mediaStatus',
  'publishingStatus',
  'performanceStatus',
  'rawScore',
  'totalScore',
  'scoreBreakdown',
  'scoringVersion',
  'createdById',
  'updatedById',
  'decidedById',
  'decidedAt',
  'archivedAt',
  'createdAt',
  'updatedAt',
  'mergeIntoTopicId',
  'aiMetadata',
  'categoryRecommendation',
  'assignedToId',
]);

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export type PatchExtractionResult = {
  payload: Record<string, unknown>;
  changedKeys: string[];
  requiresReason: boolean;
  error?: string;
};

/**
 * Build a PATCH payload containing only allowed changed fields.
 * Never includes raw/total score, creator/actor, or status fields.
 */
export function extractChangedPatchFields(options: {
  original: Record<string, unknown>;
  draft: Record<string, unknown>;
  section: 'identity' | 'research' | 'business' | 'architecture' | 'categories' | 'score';
  reason?: string;
}): PatchExtractionResult {
  const { original, draft, section, reason } = options;
  const payload: Record<string, unknown> = {};
  const changedKeys: string[] = [];

  let allowedKeys: readonly string[] = ORDINARY_PATCH_KEYS;
  let requiresReason = false;

  if (section === 'categories') {
    allowedKeys = CATEGORY_PATCH_KEYS;
    requiresReason = true;
  } else if (section === 'score') {
    allowedKeys = SCORE_PATCH_KEYS;
    requiresReason = true;
  } else if (section === 'research') {
    allowedKeys = ['searchIntent', 'serpEvidence'];
  } else if (section === 'business') {
    allowedKeys = ['businessAlignment'];
  } else if (section === 'architecture') {
    allowedKeys = ['contentArchitecture', 'riskAssessment'];
  } else if (section === 'identity') {
    allowedKeys = [
      'workingTitle',
      'primaryKeyword',
      'supportingKeywords',
      'keywordVariants',
      'userProblem',
      'audience',
      'market',
      'language',
      'location',
      'source',
      'proposedSlug',
    ];
  }

  for (const key of allowedKeys) {
    if (FORBIDDEN_PATCH_KEYS.has(key)) continue;
    if (!(key in draft)) continue;
    if (!deepEqual(draft[key], original[key])) {
      payload[key] = draft[key];
      changedKeys.push(key);
    }
  }

  // Guard: strip any accidental forbidden keys
  for (const key of Object.keys(payload)) {
    if (FORBIDDEN_PATCH_KEYS.has(key) || key === 'rawScore' || key === 'totalScore') {
      delete payload[key];
      const idx = changedKeys.indexOf(key);
      if (idx >= 0) changedKeys.splice(idx, 1);
    }
  }

  if (changedKeys.length === 0) {
    return { payload: {}, changedKeys: [], requiresReason };
  }

  if (requiresReason) {
    const trimmed = (reason || '').trim();
    if (!trimmed) {
      return {
        payload: {},
        changedKeys,
        requiresReason: true,
        error: 'A reason is required for this privileged change.',
      };
    }
    payload.reason = trimmed;
  }

  return { payload, changedKeys, requiresReason };
}

export function separateRecommendationFromFinal(options: {
  recommendationPrimary?: string | null;
  recommendationSecondary?: string[] | null;
  finalPrimary?: string | null;
  finalSecondary?: string[] | null;
}): {
  recommendation: { primary: string | null; secondary: string[] };
  final: { primary: string | null; secondary: string[] };
  areDistinctConcepts: true;
} {
  return {
    recommendation: {
      primary: options.recommendationPrimary ?? null,
      secondary: [...(options.recommendationSecondary || [])],
    },
    final: {
      primary: options.finalPrimary ?? null,
      secondary: [...(options.finalSecondary || [])],
    },
    areDistinctConcepts: true,
  };
}

export function dedupeSecondaryCategories(
  primary: string | null | undefined,
  secondary: string[],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of secondary) {
    const slug = raw.trim();
    if (!slug) continue;
    if (primary && slug === primary) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }
  return result;
}

export function approvalCopyImpliesPublication(copy: string): boolean {
  const lower = copy.toLowerCase();
  return (
    lower.includes('publish') &&
    !lower.includes('will not create, publish') &&
    !lower.includes('will not publish')
  );
}

export function isScoreDimensionKey(key: string): key is AutopilotScoreDimensionKey {
  return (AUTOPILOT_SCORE_DIMENSION_KEYS as readonly string[]).includes(key);
}
