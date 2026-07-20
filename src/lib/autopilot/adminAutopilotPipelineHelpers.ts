/**
 * Topic pipeline filter serialisation, validation, and pagination helpers.
 */

import {
  AUTOPILOT_DECISION_STATUSES,
  AUTOPILOT_TOPIC_STATUSES,
  type AutopilotDecisionStatus,
  type AutopilotTopicStatus,
} from '../../data/autopilot/status.ts';
import {
  AUTOPILOT_RECOMMENDATION_BANDS,
  type AutopilotRecommendationBand,
} from '../../data/autopilot/scoringConfig.ts';
import { getScoreBandLabel } from './adminAutopilotLabels.ts';

export const AUTOPILOT_DEFAULT_PAGE_SIZE = 20;
export const AUTOPILOT_MAX_PAGE_SIZE = 100;

export type AutopilotPipelineFilters = {
  q: string;
  topicStatus: AutopilotTopicStatus | '';
  decisionStatus: AutopilotDecisionStatus | '';
  primaryCategory: string;
  scoreBand: AutopilotRecommendationBand | '';
  minScore: string;
  maxScore: string;
  includeArchived: boolean;
  assignedToId: string;
  limit: number;
  offset: number;
};

export const DEFAULT_PIPELINE_FILTERS: AutopilotPipelineFilters = {
  q: '',
  topicStatus: '',
  decisionStatus: '',
  primaryCategory: '',
  scoreBand: '',
  minScore: '',
  maxScore: '',
  includeArchived: false,
  assignedToId: '',
  limit: AUTOPILOT_DEFAULT_PAGE_SIZE,
  offset: 0,
};

export type ScoreRangeValidation = {
  ok: boolean;
  minScore?: number;
  maxScore?: number;
  error?: string;
};

export function validateScoreRange(
  minScoreRaw: string,
  maxScoreRaw: string,
): ScoreRangeValidation {
  const minTrimmed = minScoreRaw.trim();
  const maxTrimmed = maxScoreRaw.trim();

  let minScore: number | undefined;
  let maxScore: number | undefined;

  if (minTrimmed !== '') {
    minScore = Number(minTrimmed);
    if (!Number.isFinite(minScore) || minScore < 0 || minScore > 100) {
      return { ok: false, error: 'Minimum score must be a number between 0 and 100.' };
    }
  }

  if (maxTrimmed !== '') {
    maxScore = Number(maxTrimmed);
    if (!Number.isFinite(maxScore) || maxScore < 0 || maxScore > 100) {
      return { ok: false, error: 'Maximum score must be a number between 0 and 100.' };
    }
  }

  if (minScore !== undefined && maxScore !== undefined && minScore > maxScore) {
    return { ok: false, error: 'Minimum score cannot be greater than maximum score.' };
  }

  return { ok: true, minScore, maxScore };
}

export function countActivePipelineFilters(filters: AutopilotPipelineFilters): number {
  let count = 0;
  if (filters.q.trim()) count += 1;
  if (filters.topicStatus) count += 1;
  if (filters.decisionStatus) count += 1;
  if (filters.primaryCategory.trim()) count += 1;
  if (filters.scoreBand) count += 1;
  if (filters.minScore.trim()) count += 1;
  if (filters.maxScore.trim()) count += 1;
  if (filters.includeArchived) count += 1;
  if (filters.assignedToId.trim()) count += 1;
  return count;
}

export function resetPipelineFilters(
  preserveLimit = AUTOPILOT_DEFAULT_PAGE_SIZE,
): AutopilotPipelineFilters {
  return {
    ...DEFAULT_PIPELINE_FILTERS,
    limit: Math.min(Math.max(1, preserveLimit), AUTOPILOT_MAX_PAGE_SIZE),
    offset: 0,
  };
}

export function serialisePipelineFilters(
  filters: AutopilotPipelineFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  const q = filters.q.trim().slice(0, 200);
  if (q) params.set('q', q);

  if (
    filters.topicStatus &&
    (AUTOPILOT_TOPIC_STATUSES as readonly string[]).includes(filters.topicStatus)
  ) {
    params.set('topicStatus', filters.topicStatus);
  }

  if (
    filters.decisionStatus &&
    (AUTOPILOT_DECISION_STATUSES as readonly string[]).includes(filters.decisionStatus)
  ) {
    params.set('decisionStatus', filters.decisionStatus);
  }

  if (filters.primaryCategory.trim()) {
    params.set('primaryCategory', filters.primaryCategory.trim());
  }

  if (
    filters.scoreBand &&
    (AUTOPILOT_RECOMMENDATION_BANDS as readonly string[]).includes(filters.scoreBand)
  ) {
    params.set('scoreBand', filters.scoreBand);
  }

  const range = validateScoreRange(filters.minScore, filters.maxScore);
  if (range.ok) {
    if (range.minScore !== undefined) params.set('minScore', String(range.minScore));
    if (range.maxScore !== undefined) params.set('maxScore', String(range.maxScore));
  }

  if (filters.includeArchived) params.set('includeArchived', 'true');

  if (filters.assignedToId.trim()) {
    const assigned = Number.parseInt(filters.assignedToId.trim(), 10);
    if (Number.isInteger(assigned) && assigned > 0) {
      params.set('assignedToId', String(assigned));
    }
  }

  const limit = Math.min(
    Math.max(1, Number.isFinite(filters.limit) ? filters.limit : AUTOPILOT_DEFAULT_PAGE_SIZE),
    AUTOPILOT_MAX_PAGE_SIZE,
  );
  const offset = Math.max(0, Number.isFinite(filters.offset) ? filters.offset : 0);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  return params;
}

export function calculatePaginationRange(
  total: number,
  limit: number,
  offset: number,
): { from: number; to: number; total: number; hasPrev: boolean; hasNext: boolean } {
  const safeTotal = Math.max(0, total);
  const safeLimit = Math.max(1, limit);
  const safeOffset = Math.max(0, offset);

  if (safeTotal === 0) {
    return { from: 0, to: 0, total: 0, hasPrev: false, hasNext: false };
  }

  const from = Math.min(safeOffset + 1, safeTotal);
  const to = Math.min(safeOffset + safeLimit, safeTotal);

  return {
    from,
    to,
    total: safeTotal,
    hasPrev: safeOffset > 0,
    hasNext: safeOffset + safeLimit < safeTotal,
  };
}

export function formatScoreDisplay(
  totalScore: number | null | undefined,
  band?: string | null,
): { scoreText: string; bandLabel: string } {
  if (totalScore === null || totalScore === undefined || Number.isNaN(Number(totalScore))) {
    return { scoreText: 'Not scored', bandLabel: getScoreBandLabel(null) };
  }
  return {
    scoreText: String(Math.round(Number(totalScore))),
    bandLabel: getScoreBandLabel(band ?? null),
  };
}
