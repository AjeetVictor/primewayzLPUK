import { Prisma } from '@prisma/client';
import type { AutopilotRecommendationBand } from '../../data/autopilot/scoringConfig.ts';
import {
  AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS,
  getAutopilotRecommendationBand,
} from '../../data/autopilot/scoringConfig.ts';
import {
  AUTOPILOT_DECISION_STATUSES,
  AUTOPILOT_FOUNDATION_DEFAULT_STATUSES,
  AUTOPILOT_TOPIC_STATUSES,
  type AutopilotDecisionStatus,
  type AutopilotTopicStatus,
} from '../../data/autopilot/status.ts';
import { AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED } from '../../data/autopilot/types.ts';
import { isValidBlogCategorySlug } from '../../data/blog/categories.ts';
import { notFound, validationError } from './apiErrors.ts';
import type { PrismaLike } from './activityLogService.ts';

export type AdminActor = {
  id: number;
  email: string;
  role: string;
  displayName?: string;
};

export function actorDisplayName(actor: AdminActor): string {
  return actor.displayName?.trim() || actor.email;
}

export function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    const fn = (value as { toNumber: () => number }).toNumber;
    if (typeof fn === 'function') {
      const n = fn.call(value);
      return Number.isFinite(n) ? n : null;
    }
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function toDecimalOrNull(value: number | null | undefined): Prisma.Decimal | null {
  if (value === null || value === undefined) return null;
  return new Prisma.Decimal(value);
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
}

export function serializeTopicRow(row: Record<string, unknown>) {
  const scoreFields = [
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
    'cannibalisationPenalty',
    'unsupportedClaimRiskPenalty',
    'rawScore',
    'totalScore',
    'qualityScore',
    'factualScore',
    'brandVoiceScore',
    'originalityScore',
  ] as const;

  const out: Record<string, unknown> = { ...row };
  for (const key of scoreFields) {
    if (key in out) out[key] = decimalToNumber(out[key]);
  }
  out.supportingKeywords = asStringArray(out.supportingKeywords);
  out.keywordVariants = asStringArray(out.keywordVariants);
  out.secondaryCategories = asStringArray(out.secondaryCategories);
  for (const key of [
    'createdAt',
    'updatedAt',
    'decidedAt',
    'approvedAt',
    'rejectedAt',
    'lockedAt',
    'scheduledFor',
    'archivedAt',
  ] as const) {
    const v = out[key];
    if (v instanceof Date) out[key] = v.toISOString();
  }
  return out;
}

export function parseTopicStatusFilter(value: unknown): AutopilotTopicStatus | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string' || !AUTOPILOT_TOPIC_STATUSES.includes(value as AutopilotTopicStatus)) {
    throw validationError('Invalid topicStatus filter.', { field: 'topicStatus', value });
  }
  return value as AutopilotTopicStatus;
}

export function parseDecisionStatusFilter(value: unknown): AutopilotDecisionStatus | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (
    typeof value !== 'string' ||
    !AUTOPILOT_DECISION_STATUSES.includes(value as AutopilotDecisionStatus)
  ) {
    throw validationError('Invalid decisionStatus filter.', { field: 'decisionStatus', value });
  }
  return value as AutopilotDecisionStatus;
}

export function parseScoreBandFilter(value: unknown): AutopilotRecommendationBand | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const bands = AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS.map((entry) => entry.band);
  if (typeof value !== 'string' || !bands.includes(value as AutopilotRecommendationBand)) {
    throw validationError('Invalid scoreBand filter.', { field: 'scoreBand', value });
  }
  return value as AutopilotRecommendationBand;
}

export function scoreBandRange(band: AutopilotRecommendationBand): { min: number; max: number } {
  const entry = AUTOPILOT_RECOMMENDATION_BAND_THRESHOLDS.find((item) => item.band === band);
  if (!entry) throw validationError('Unknown score band.', { band });
  return { min: entry.min, max: entry.max };
}

export function recommendationBandForTopic(totalScore: unknown): AutopilotRecommendationBand | null {
  const score = decimalToNumber(totalScore);
  if (score === null) return null;
  return getAutopilotRecommendationBand(score);
}

export function parseOptionalCategorySlug(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw validationError(`${field} must be a string.`, { field });
  }
  const trimmed = value.trim();
  if (!isValidBlogCategorySlug(trimmed)) {
    throw validationError(`Unknown category slug: ${trimmed}`, { field, value: trimmed });
  }
  return trimmed;
}

export async function requireTopic(db: PrismaLike, id: number) {
  const topic = await db.autopilotTopic.findUnique({ where: { id } });
  if (!topic) throw notFound('Autopilot topic not found.', { id });
  return topic;
}

export { AUTOPILOT_FOUNDATION_DEFAULT_STATUSES, AUTOPILOT_SETTING_AUTO_PUBLISH_ENABLED };
