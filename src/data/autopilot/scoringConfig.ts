/**
 * Article Autopilot 2.0 — Git-tracked scoring configuration (Phase 1B.1).
 * Totals are always recalculated from dimensions × weights − penalties.
 * Search volume / keyword difficulty are intentionally not part of this model.
 */

export const AUTOPILOT_SCORING_VERSION = 'autopilot-scoring-v1' as const;

export const AUTOPILOT_SCORE_DIMENSION_KEYS = [
  'serviceRelevance',
  'businessValue',
  'buyerIntent',
  'topicalAuthorityFit',
  'contentGap',
  'differentiationPotential',
  'rankingFeasibility',
  'evidenceConfidence',
  'internalLinkOpportunity',
  'commercialPageSupport',
] as const;

export type AutopilotScoreDimensionKey = (typeof AUTOPILOT_SCORE_DIMENSION_KEYS)[number];

export const AUTOPILOT_SCORE_WEIGHTS: Readonly<Record<AutopilotScoreDimensionKey, number>> = {
  serviceRelevance: 1.2,
  businessValue: 1.2,
  buyerIntent: 1.0,
  topicalAuthorityFit: 1.0,
  contentGap: 1.0,
  differentiationPotential: 0.8,
  rankingFeasibility: 0.8,
  evidenceConfidence: 1.0,
  internalLinkOpportunity: 0.7,
  commercialPageSupport: 1.0,
};

export const AUTOPILOT_PENALTY_LIMITS = {
  cannibalisation: { min: 0, max: 30 },
  unsupportedClaimRisk: { min: 0, max: 20 },
} as const;

export type AutopilotPenaltyKey = keyof typeof AUTOPILOT_PENALTY_LIMITS;

/** Machine-readable recommendation bands (stable API values). */
export const AUTOPILOT_RECOMMENDATION_BANDS = [
  'strong_approve_candidate',
  'review_carefully',
  'defer_or_needs_research',
  'likely_reject',
] as const;

export type AutopilotRecommendationBand = (typeof AUTOPILOT_RECOMMENDATION_BANDS)[number];

export const AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS: ReadonlyArray<{
  band: AutopilotRecommendationBand;
  min: number;
  max: number;
  label: string;
}> = [
  {
    band: 'strong_approve_candidate',
    min: 75,
    max: 100,
    label: 'Strong approve candidate',
  },
  {
    band: 'review_carefully',
    min: 60,
    max: 74,
    label: 'Review carefully',
  },
  {
    band: 'defer_or_needs_research',
    min: 45,
    max: 59,
    label: 'Defer or needs research',
  },
  {
    band: 'likely_reject',
    min: 0,
    max: 44,
    label: 'Likely reject',
  },
];

export function getAutopilotRecommendationBand(totalScore: number): AutopilotRecommendationBand {
  const score = Math.max(0, Math.min(100, totalScore));
  if (score >= 75) return 'strong_approve_candidate';
  if (score >= 60) return 'review_carefully';
  if (score >= 45) return 'defer_or_needs_research';
  return 'likely_reject';
}
