import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTOPILOT_PENALTY_LIMITS,
  AUTOPILOT_SCORE_DIMENSION_KEYS,
  AUTOPILOT_SCORE_WEIGHTS,
  AUTOPILOT_SCORING_VERSION,
  getAutopilotRecommendationBand,
} from '../../data/autopilot/scoringConfig.ts';
import {
  calculateAutopilotScore,
  calculateAutopilotScoreFromBreakdown,
  clampAutopilotDimensionScore,
  clampAutopilotPenalty,
  roundAutopilotScore,
} from './scoringService.ts';

function allDimensions(value: number) {
  return Object.fromEntries(
    AUTOPILOT_SCORE_DIMENSION_KEYS.map((key) => [key, value]),
  ) as Record<(typeof AUTOPILOT_SCORE_DIMENSION_KEYS)[number], number>;
}

test('all dimensions at 100 with no penalties yields 100 and strong approve', () => {
  const result = calculateAutopilotScore({ dimensions: allDimensions(100) });
  assert.equal(result.rawWeightedScore, 100);
  assert.equal(result.totalScore, 100);
  assert.equal(result.recommendationBand, 'strong_approve_candidate');
  assert.equal(result.scoringVersion, AUTOPILOT_SCORING_VERSION);
});

test('all dimensions at 0 with no penalties yields 0 and likely reject', () => {
  const result = calculateAutopilotScore({ dimensions: allDimensions(0) });
  assert.equal(result.rawWeightedScore, 0);
  assert.equal(result.totalScore, 0);
  assert.equal(result.recommendationBand, 'likely_reject');
});

test('weighted calculation uses configured weights', () => {
  const dimensions = allDimensions(50);
  dimensions.serviceRelevance = 100;
  dimensions.businessValue = 0;

  const weightTotal = AUTOPILOT_SCORE_DIMENSION_KEYS.reduce(
    (sum, key) => sum + AUTOPILOT_SCORE_WEIGHTS[key],
    0,
  );
  const expectedRaw =
    (AUTOPILOT_SCORE_DIMENSION_KEYS.reduce(
      (sum, key) => sum + dimensions[key] * AUTOPILOT_SCORE_WEIGHTS[key],
      0,
    ) /
      weightTotal);

  const result = calculateAutopilotScore({ dimensions });
  assert.equal(result.rawWeightedScore, roundAutopilotScore(expectedRaw));
  assert.equal(result.totalScore, result.rawWeightedScore);
});

test('both penalties reduce total from raw score', () => {
  const result = calculateAutopilotScore({
    dimensions: allDimensions(80),
    penalties: { cannibalisation: 10, unsupportedClaimRisk: 5 },
  });
  assert.equal(result.rawWeightedScore, 80);
  assert.equal(result.totalScore, 65);
  assert.equal(result.recommendationBand, 'review_carefully');
});

test('maximum penalties are clamped to configured limits', () => {
  const result = calculateAutopilotScore({
    dimensions: allDimensions(100),
    penalties: { cannibalisation: 999, unsupportedClaimRisk: 999 },
  });
  assert.equal(result.penalties.cannibalisation, AUTOPILOT_PENALTY_LIMITS.cannibalisation.max);
  assert.equal(
    result.penalties.unsupportedClaimRisk,
    AUTOPILOT_PENALTY_LIMITS.unsupportedClaimRisk.max,
  );
  assert.equal(result.totalScore, 100 - 30 - 20);
});

test('invalid dimension scores are clamped to 0–100', () => {
  assert.equal(clampAutopilotDimensionScore(-20), 0);
  assert.equal(clampAutopilotDimensionScore(150), 100);
  assert.equal(clampAutopilotDimensionScore(Number.NaN), 0);

  const result = calculateAutopilotScore({
    dimensions: { ...allDimensions(50), serviceRelevance: 200, buyerIntent: -5 },
  });
  assert.equal(result.dimensions.serviceRelevance, 100);
  assert.equal(result.dimensions.buyerIntent, 0);
});

test('invalid penalties are clamped to configured ranges', () => {
  assert.equal(clampAutopilotPenalty('cannibalisation', -3), 0);
  assert.equal(clampAutopilotPenalty('cannibalisation', 40), 30);
  assert.equal(clampAutopilotPenalty('unsupportedClaimRisk', 25), 20);
});

test('recommendation band boundaries at 75, 60, 45 and just below', () => {
  assert.equal(getAutopilotRecommendationBand(75), 'strong_approve_candidate');
  assert.equal(getAutopilotRecommendationBand(74.9), 'review_carefully');
  assert.equal(getAutopilotRecommendationBand(60), 'review_carefully');
  assert.equal(getAutopilotRecommendationBand(59.9), 'defer_or_needs_research');
  assert.equal(getAutopilotRecommendationBand(45), 'defer_or_needs_research');
  assert.equal(getAutopilotRecommendationBand(44.9), 'likely_reject');

  assert.equal(
    calculateAutopilotScore({ dimensions: allDimensions(75) }).recommendationBand,
    'strong_approve_candidate',
  );
  assert.equal(
    calculateAutopilotScore({
      dimensions: allDimensions(75),
      penalties: { cannibalisation: 0.1, unsupportedClaimRisk: 0 },
    }).recommendationBand,
    'review_carefully',
  );
});

test('rounding is deterministic to one decimal place', () => {
  assert.equal(roundAutopilotScore(66.66), 66.7);
  assert.equal(roundAutopilotScore(66.64), 66.6);
  assert.equal(roundAutopilotScore(66.65), 66.7);

  const a = calculateAutopilotScore({
    dimensions: {
      ...allDimensions(66),
      differentiationPotential: 67,
      rankingFeasibility: 33,
    },
  });
  const b = calculateAutopilotScore({
    dimensions: {
      ...allDimensions(66),
      differentiationPotential: 67,
      rankingFeasibility: 33,
    },
  });
  assert.deepEqual(a, b);
});

test('scoring version is always included', () => {
  const result = calculateAutopilotScore();
  assert.equal(result.scoringVersion, AUTOPILOT_SCORING_VERSION);
});

test('AI-supplied totals are ignored and surfaced as ignoredAiSuggestedTotal', () => {
  const result = calculateAutopilotScore({
    dimensions: allDimensions(50),
    aiSuggestedTotal: 99,
  });
  assert.equal(result.totalScore, 50);
  assert.equal(result.ignoredAiSuggestedTotal, 99);
  assert.notEqual(result.totalScore, result.ignoredAiSuggestedTotal);

  const fromBreakdown = calculateAutopilotScoreFromBreakdown({
    dimensions: allDimensions(40),
    penalties: { cannibalisation: 0, unsupportedClaimRisk: 0 },
    aiSuggestedTotal: 100,
  });
  assert.equal(fromBreakdown.totalScore, 40);
  assert.equal(fromBreakdown.ignoredAiSuggestedTotal, 100);
});

test('dimension explanations are retained when supplied', () => {
  const result = calculateAutopilotScore({
    dimensions: allDimensions(70),
    explanations: {
      serviceRelevance: 'Strong fit to subscription delivery.',
      cannibalisation: 'Overlaps an existing support article.',
    },
    penalties: { cannibalisation: 5, unsupportedClaimRisk: 0 },
  });
  assert.equal(
    result.explanations?.serviceRelevance,
    'Strong fit to subscription delivery.',
  );
  assert.equal(result.explanations?.cannibalisation, 'Overlaps an existing support article.');
  assert.equal(result.totalScore, 65);
});
