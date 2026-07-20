/**
 * Transparent Autopilot topic scoring.
 * AI-suggested totals are ignored; totals always come from dimensions × weights − penalties.
 */

import {
  AUTOPILOT_PENALTY_LIMITS,
  AUTOPILOT_SCORE_DIMENSION_KEYS,
  AUTOPILOT_SCORE_WEIGHTS,
  AUTOPILOT_SCORING_VERSION,
  getAutopilotRecommendationBand,
  type AutopilotPenaltyKey,
  type AutopilotScoreDimensionKey,
} from '../../data/autopilot/scoringConfig.ts';
import type {
  AutopilotScoreBreakdown,
  AutopilotScoreCalculationResult,
  AutopilotScoreDimensions,
  AutopilotScoreExplanations,
  AutopilotScorePenalties,
} from '../../data/autopilot/types.ts';

const SCORE_MIN = 0;
const SCORE_MAX = 100;

const ZERO_PENALTIES: AutopilotScorePenalties = {
  cannibalisation: 0,
  unsupportedClaimRisk: 0,
};

function clampNumber(value: unknown, min: number, max: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? value : Number(value);
  const safe = Number.isFinite(numeric) ? numeric : min;
  return Math.min(max, Math.max(min, safe));
}

/** Round to one decimal place for stable, deterministic display and banding. */
export function roundAutopilotScore(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampAutopilotDimensionScore(value: unknown): number {
  return roundAutopilotScore(clampNumber(value, SCORE_MIN, SCORE_MAX));
}

export function clampAutopilotPenalty(
  key: AutopilotPenaltyKey,
  value: unknown,
): number {
  const limits = AUTOPILOT_PENALTY_LIMITS[key];
  return roundAutopilotScore(clampNumber(value, limits.min, limits.max));
}

export function normaliseAutopilotScoreDimensions(
  input?: Partial<AutopilotScoreDimensions> | null,
): AutopilotScoreDimensions {
  const dimensions = {} as AutopilotScoreDimensions;
  for (const key of AUTOPILOT_SCORE_DIMENSION_KEYS) {
    dimensions[key] = clampAutopilotDimensionScore(input?.[key] ?? 0);
  }
  return dimensions;
}

export function normaliseAutopilotPenalties(
  input?: Partial<AutopilotScorePenalties> | null,
): AutopilotScorePenalties {
  return {
    cannibalisation: clampAutopilotPenalty('cannibalisation', input?.cannibalisation ?? 0),
    unsupportedClaimRisk: clampAutopilotPenalty(
      'unsupportedClaimRisk',
      input?.unsupportedClaimRisk ?? 0,
    ),
  };
}

function sumWeights(): number {
  return AUTOPILOT_SCORE_DIMENSION_KEYS.reduce(
    (sum, key) => sum + AUTOPILOT_SCORE_WEIGHTS[key],
    0,
  );
}

/**
 * Calculate topic score from dimensions and penalties.
 * Does not invent search volume or difficulty. Ignores any AI-supplied total.
 */
export function calculateAutopilotScore(
  input: {
    dimensions?: Partial<AutopilotScoreDimensions> | null;
    penalties?: Partial<AutopilotScorePenalties> | null;
    explanations?: AutopilotScoreExplanations;
    /** Accepted only to surface that it was ignored — never used in totals. */
    aiSuggestedTotal?: number;
  } = {},
): AutopilotScoreCalculationResult {
  const dimensions = normaliseAutopilotScoreDimensions(input.dimensions);
  const penalties = normaliseAutopilotPenalties(input.penalties);
  const weightTotal = sumWeights();

  const weightedSum = AUTOPILOT_SCORE_DIMENSION_KEYS.reduce(
    (sum, key) => sum + dimensions[key] * AUTOPILOT_SCORE_WEIGHTS[key],
    0,
  );

  const rawWeightedScore = roundAutopilotScore(weightedSum / weightTotal);
  const penaltyTotal = penalties.cannibalisation + penalties.unsupportedClaimRisk;
  const totalScore = roundAutopilotScore(
    clampNumber(rawWeightedScore - penaltyTotal, SCORE_MIN, SCORE_MAX),
  );

  const result: AutopilotScoreCalculationResult = {
    dimensions,
    penalties,
    weights: { ...AUTOPILOT_SCORE_WEIGHTS },
    rawWeightedScore,
    totalScore,
    recommendationBand: getAutopilotRecommendationBand(totalScore),
    scoringVersion: AUTOPILOT_SCORING_VERSION,
  };

  if (input.explanations && Object.keys(input.explanations).length > 0) {
    result.explanations = { ...input.explanations };
  }

  if (typeof input.aiSuggestedTotal === 'number' && Number.isFinite(input.aiSuggestedTotal)) {
    result.ignoredAiSuggestedTotal = input.aiSuggestedTotal;
  }

  return result;
}

export function calculateAutopilotScoreFromBreakdown(
  breakdown: AutopilotScoreBreakdown,
): AutopilotScoreCalculationResult {
  return calculateAutopilotScore({
    dimensions: breakdown.dimensions,
    penalties: breakdown.penalties,
    explanations: breakdown.explanations,
    aiSuggestedTotal: breakdown.aiSuggestedTotal,
  });
}

export function createEmptyAutopilotScoreBreakdown(): AutopilotScoreBreakdown {
  return {
    dimensions: normaliseAutopilotScoreDimensions(null),
    penalties: { ...ZERO_PENALTIES },
  };
}

export function getAutopilotScoreWeight(key: AutopilotScoreDimensionKey): number {
  return AUTOPILOT_SCORE_WEIGHTS[key];
}
