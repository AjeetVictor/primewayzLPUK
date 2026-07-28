/**
 * GSC opportunity detection from synced query/page metrics.
 * Creates or updates KeywordCandidate records for human review — never auto-publishes.
 */

import type { PrismaClient } from '@prisma/client';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';

export type GscOpportunityThresholds = {
  positionMin: number;
  positionMax: number;
  minImpressions: number;
  lowCtrPercentile: number;
  decliningWindowDays: number;
  minDeclineImpressions: number;
};

export const DEFAULT_GSC_OPPORTUNITY_THRESHOLDS: GscOpportunityThresholds = {
  positionMin: 8,
  positionMax: 30,
  minImpressions: 50,
  lowCtrPercentile: 0.35,
  decliningWindowDays: 28,
  minDeclineImpressions: 100,
};

export type GscOpportunityFinding = {
  type:
    | 'position_8_30'
    | 'high_impression_low_ctr'
    | 'query_page_mismatch'
    | 'cannibalisation'
    | 'declining_page'
    | 'internal_link';
  normalisedQuery: string;
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  recommendation: string;
  evidencePeriod: string;
  targetPage?: string;
};

function decimalToNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

export async function analyseGscOpportunities(
  prisma: PrismaClient,
  connectionId: number,
  thresholds: GscOpportunityThresholds = DEFAULT_GSC_OPPORTUNITY_THRESHOLDS,
): Promise<GscOpportunityFinding[]> {
  const rows = await prisma.gscQueryPageMetric.findMany({
    where: { connectionId },
    orderBy: [{ metricDate: 'desc' }],
    take: 50000,
  });

  if (rows.length === 0) return [];

  const aggregated = new Map<
    string,
    { query: string; page: string; impressions: number; clicks: number; positionSum: number; count: number }
  >();

  for (const row of rows) {
    const key = `${row.normalisedQuery}::${row.pageHash}`;
    const existing = aggregated.get(key) ?? {
      query: row.normalisedQuery,
      page: row.page,
      impressions: 0,
      clicks: 0,
      positionSum: 0,
      count: 0,
    };
    existing.impressions += decimalToNumber(row.impressions);
    existing.clicks += decimalToNumber(row.clicks);
    existing.positionSum += decimalToNumber(row.position);
    existing.count += 1;
    aggregated.set(key, existing);
  }

  const findings: GscOpportunityFinding[] = [];
  const entries = Array.from(aggregated.values()).map((entry) => ({
    ...entry,
    ctr: entry.impressions > 0 ? entry.clicks / entry.impressions : 0,
    position: entry.count > 0 ? entry.positionSum / entry.count : 0,
  }));

  const ctrValues = entries.map((e) => e.ctr).sort((a, b) => a - b);
  const lowCtrThreshold =
    ctrValues[Math.floor(ctrValues.length * thresholds.lowCtrPercentile)] ?? 0.01;

  for (const entry of entries) {
    if (
      entry.impressions >= thresholds.minImpressions
      && entry.position >= thresholds.positionMin
      && entry.position <= thresholds.positionMax
    ) {
      findings.push({
        type: 'position_8_30',
        normalisedQuery: entry.query,
        page: entry.page,
        impressions: entry.impressions,
        clicks: entry.clicks,
        ctr: entry.ctr,
        position: entry.position,
        recommendation: 'Review whether an existing page should be strengthened or a new topic queued.',
        evidencePeriod: `Latest synced GSC data (${rows.length} rows)`,
      });
    }

    if (entry.impressions >= thresholds.minImpressions && entry.ctr <= lowCtrThreshold) {
      findings.push({
        type: 'high_impression_low_ctr',
        normalisedQuery: entry.query,
        page: entry.page,
        impressions: entry.impressions,
        clicks: entry.clicks,
        ctr: entry.ctr,
        position: entry.position,
        recommendation: 'High impressions with relatively low CTR — review title, meta and on-page intent alignment.',
        evidencePeriod: `Relative CTR benchmark ≤ ${(lowCtrThreshold * 100).toFixed(2)}%`,
      });
    }
  }

  const queryToPages = new Map<string, Set<string>>();
  for (const entry of entries) {
    if (!queryToPages.has(entry.query)) queryToPages.set(entry.query, new Set());
    queryToPages.get(entry.query)!.add(entry.page);
  }

  for (const [query, pages] of queryToPages.entries()) {
    if (pages.size >= 2) {
      const top = entries.filter((e) => e.query === query).sort((a, b) => b.impressions - a.impressions);
      if (top[0] && top[0].impressions >= thresholds.minImpressions) {
        findings.push({
          type: 'cannibalisation',
          normalisedQuery: query,
          page: top[0].page,
          impressions: top[0].impressions,
          clicks: top[0].clicks,
          ctr: top[0].ctr,
          position: top[0].position,
          recommendation: `Multiple pages receive impressions for "${query}". Review for editorial consolidation — do not auto-merge.`,
          evidencePeriod: `${pages.size} pages`,
          targetPage: top[0].page,
        });
      }
    }
  }

  return findings.slice(0, 200);
}

export async function upsertGscOpportunityCandidates(
  prisma: PrismaClient,
  findings: GscOpportunityFinding[],
): Promise<number> {
  let created = 0;

  for (const finding of findings) {
    const normalisedKeyword = normaliseAutopilotKeyword(finding.normalisedQuery).normalised;
    const existing = await prisma.autopilotKeywordCandidate.findFirst({
      where: {
        normalisedKeyword,
        status: { notIn: ['rejected', 'converted'] },
      },
    });
    if (existing) continue;

    await prisma.autopilotKeywordCandidate.create({
      data: {
        keyword: finding.normalisedQuery,
        normalisedKeyword,
        sourceType: 'gsc_opportunity',
        status: 'new',
        currentUrl: finding.page,
        impressions: Math.round(finding.impressions),
        clicks: Math.round(finding.clicks),
        ctr: finding.ctr,
        averagePosition: finding.position,
        sourceData: {
          opportunityType: finding.type,
          recommendation: finding.recommendation,
          evidencePeriod: finding.evidencePeriod,
          targetPage: finding.targetPage,
        },
        reviewNotes: finding.recommendation,
      },
    });
    created += 1;
  }

  return created;
}
