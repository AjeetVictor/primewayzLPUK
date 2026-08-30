/**
 * SEO Opportunities — list and filter GSC-sourced keyword candidates.
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { parsePagination } from './apiValidation.ts';
import { serializeKeywordCandidate } from './keywordImportService.ts';
import { GSC_OPPORTUNITY_TYPE_ALIASES, type GscOpportunityType } from './gscOpportunityService.ts';

export type SeoOpportunityListQuery = Record<string, unknown>;

function parseOpportunityType(value: unknown): GscOpportunityType | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (trimmed in GSC_OPPORTUNITY_TYPE_ALIASES) {
    return GSC_OPPORTUNITY_TYPE_ALIASES[trimmed] as GscOpportunityType;
  }
  const valid: GscOpportunityType[] = [
    'near_ranking',
    'high_impression_low_ctr',
    'cannibalisation',
    'declining_page',
    'query_page_mismatch',
    'internal_link',
  ];
  return valid.includes(trimmed as GscOpportunityType) ? (trimmed as GscOpportunityType) : null;
}

function enrichCandidate(row: Record<string, unknown>) {
  const base = serializeKeywordCandidate(row);
  const sourceData =
    row.sourceData && typeof row.sourceData === 'object' && !Array.isArray(row.sourceData)
      ? (row.sourceData as Record<string, unknown>)
      : {};
  const rawType = typeof sourceData.opportunityType === 'string' ? sourceData.opportunityType : null;
  const opportunityType = rawType
    ? (GSC_OPPORTUNITY_TYPE_ALIASES[rawType] ?? rawType)
    : null;

  return {
    ...base,
    opportunityType,
    confidence: typeof sourceData.confidence === 'string' ? sourceData.confidence : null,
    evidencePeriod:
      typeof sourceData.evidencePeriod === 'string' ? sourceData.evidencePeriod : null,
    targetPage: typeof sourceData.targetPage === 'string' ? sourceData.targetPage : null,
    recommendation:
      typeof sourceData.recommendation === 'string' ? sourceData.recommendation : null,
    lastDetectedAt:
      typeof sourceData.lastDetectedAt === 'string' ? sourceData.lastDetectedAt : null,
    source: 'gsc_opportunity' as const,
  };
}

export async function listSeoOpportunities(prisma: PrismaClient, query: SeoOpportunityListQuery) {
  const { limit, offset } = parsePagination(query);
  const where: Prisma.AutopilotKeywordCandidateWhereInput = {
    sourceType: 'gsc_opportunity',
  };

  if (typeof query.q === 'string' && query.q.trim()) {
    const q = query.q.trim();
    where.OR = [{ keyword: { contains: q } }, { normalisedKeyword: { contains: q } }];
  }

  if (typeof query.status === 'string' && query.status.trim()) {
    where.status = query.status.trim();
  }

  if (typeof query.page === 'string' && query.page.trim()) {
    where.currentUrl = { contains: query.page.trim() };
  }

  if (query.convertedOnly === 'true' || query.convertedOnly === true) {
    where.convertedTopicId = { not: null };
  }
  if (query.unconvertedOnly === 'true' || query.unconvertedOnly === true) {
    where.convertedTopicId = null;
  }
  if (query.reviewedOnly === 'true' || query.reviewedOnly === true) {
    where.reviewedAt = { not: null };
  }
  if (query.unreviewedOnly === 'true' || query.unreviewedOnly === true) {
    where.reviewedAt = null;
    where.status = { in: ['new', 'reviewing'] };
  }

  if (typeof query.minImpressions === 'string' || typeof query.minImpressions === 'number') {
    const min = Number(query.minImpressions);
    if (Number.isFinite(min) && min >= 0) where.impressions = { gte: Math.floor(min) };
  }

  if (typeof query.minPosition === 'string' || typeof query.minPosition === 'number') {
    const min = Number(query.minPosition);
    if (Number.isFinite(min)) {
      where.averagePosition = {
        ...(typeof where.averagePosition === 'object' ? where.averagePosition : {}),
        gte: min,
      };
    }
  }
  if (typeof query.maxPosition === 'string' || typeof query.maxPosition === 'number') {
    const max = Number(query.maxPosition);
    if (Number.isFinite(max)) {
      where.averagePosition = {
        ...(typeof where.averagePosition === 'object' ? where.averagePosition : {}),
        lte: max,
      };
    }
  }

  const opportunityType = parseOpportunityType(query.opportunityType);
  const evidencePeriod =
    typeof query.evidencePeriod === 'string' && query.evidencePeriod.trim()
      ? query.evidencePeriod.trim()
      : null;

  const [totalBeforeFilter, itemsRaw] = await Promise.all([
    prisma.autopilotKeywordCandidate.count({ where }),
    prisma.autopilotKeywordCandidate.findMany({
      where,
      orderBy: [{ impressions: 'desc' }, { updatedAt: 'desc' }],
      take: Math.min(limit + offset + 200, 500),
      skip: 0,
    }),
  ]);

  let items = itemsRaw.map((row) =>
    enrichCandidate(row as unknown as Record<string, unknown>),
  );

  if (opportunityType) {
    items = items.filter((item) => item.opportunityType === opportunityType);
  }
  if (evidencePeriod) {
    items = items.filter((item) => item.evidencePeriod === evidencePeriod);
  }

  const total = opportunityType || evidencePeriod ? items.length : totalBeforeFilter;
  const page = items.slice(offset, offset + limit);

  return { items: page, total, limit, offset };
}
