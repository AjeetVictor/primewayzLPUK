/**
 * GSC opportunity detection from synced query/page metrics.
 * Creates or updates KeywordCandidate records for human review — never auto-publishes.
 *
 * Analysis uses explicit current vs comparison periods (not undifferentiated history).
 * Position is impression-weighted. Human review status and converted links are preserved on refresh.
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';
import {
  countInclusiveCalendarDays,
} from './gscSyncDateValidation.ts';
import { addDaysToDateString } from './gscDateUtils.ts';
import {
  addRowToAccumulator,
  createMetricAccumulator,
  decimalToNumber,
  safeAveragePosition,
  safeCtr,
  summariseAccumulator,
} from './gscMetricMath.ts';

export type GscOpportunityType =
  | 'near_ranking'
  | 'high_impression_low_ctr'
  | 'cannibalisation'
  | 'declining_page'
  | 'query_page_mismatch'
  | 'internal_link';

/** Legacy type aliases stored in older sourceData.opportunityType values. */
export const GSC_OPPORTUNITY_TYPE_ALIASES: Record<string, GscOpportunityType> = {
  position_8_30: 'near_ranking',
  high_impression_low_ctr: 'high_impression_low_ctr',
  cannibalisation: 'cannibalisation',
  declining_page: 'declining_page',
  query_page_mismatch: 'query_page_mismatch',
  internal_link: 'internal_link',
};

export type GscOpportunityThresholds = {
  positionMin: number;
  positionMax: number;
  minImpressions: number;
  lowCtrPercentile: number;
  decliningWindowDays: number;
  minDeclineImpressions: number;
  minDeclinePct: number;
  minConfidenceImpressions: number;
};

export const DEFAULT_GSC_OPPORTUNITY_THRESHOLDS: GscOpportunityThresholds = {
  positionMin: 8,
  positionMax: 30,
  minImpressions: 50,
  lowCtrPercentile: 0.35,
  decliningWindowDays: 28,
  minDeclineImpressions: 100,
  minDeclinePct: 0.15,
  minConfidenceImpressions: 200,
};

export type GscOpportunityEvidence = {
  currentPeriod: { dateFrom: string; dateTo: string };
  comparisonPeriod: { dateFrom: string; dateTo: string };
  currentValue: {
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
  };
  previousValue: {
    clicks: number;
    impressions: number;
    ctr: number | null;
    position: number | null;
  };
  absoluteChange: {
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
  };
  percentageChange: {
    clicks: number | null;
    impressions: number | null;
    ctr: number | null;
    position: number | null;
  };
  evidenceRowCount: number;
};

export type GscOpportunityFinding = {
  type: GscOpportunityType;
  normalisedQuery: string;
  displayQuery: string;
  page: string;
  targetPage?: string;
  impressions: number;
  clicks: number;
  ctr: number | null;
  position: number | null;
  confidence: 'low' | 'medium' | 'high';
  recommendation: string;
  evidencePeriod: string;
  evidence: GscOpportunityEvidence;
  dedupeKey: string;
};

type QueryPageAggregate = {
  query: string;
  displayQuery: string;
  page: string;
  acc: ReturnType<typeof createMetricAccumulator>;
};

type MetricRow = {
  metricDate: Date;
  rawQuery: string;
  normalisedQuery: string;
  page: string;
  clicks: unknown;
  impressions: unknown;
  position: unknown;
};

function dateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function pctChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return (current - previous) / previous;
}

function absChange(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null) return null;
  return current - previous;
}

function buildEvidence(
  currentRows: MetricRow[],
  comparisonRows: MetricRow[],
  currentPeriod: { dateFrom: string; dateTo: string },
  comparisonPeriod: { dateFrom: string; dateTo: string },
  filter: (row: MetricRow) => boolean,
): GscOpportunityEvidence {
  const currentAcc = createMetricAccumulator();
  const previousAcc = createMetricAccumulator();

  for (const row of currentRows) {
    if (filter(row)) addRowToAccumulator(currentAcc, row);
  }
  for (const row of comparisonRows) {
    if (filter(row)) addRowToAccumulator(previousAcc, row);
  }

  const current = summariseAccumulator(currentAcc);
  const previous = summariseAccumulator(previousAcc);

  return {
    currentPeriod,
    comparisonPeriod,
    currentValue: {
      clicks: current.clicks,
      impressions: current.impressions,
      ctr: current.ctr,
      position: current.averagePosition,
    },
    previousValue: {
      clicks: previous.clicks,
      impressions: previous.impressions,
      ctr: previous.ctr,
      position: previous.averagePosition,
    },
    absoluteChange: {
      clicks: absChange(current.clicks, previous.clicks),
      impressions: absChange(current.impressions, previous.impressions),
      ctr: absChange(current.ctr, previous.ctr),
      position: absChange(current.averagePosition, previous.averagePosition),
    },
    percentageChange: {
      clicks: pctChange(current.clicks, previous.clicks),
      impressions: pctChange(current.impressions, previous.impressions),
      ctr: pctChange(current.ctr, previous.ctr),
      position: pctChange(current.averagePosition, previous.averagePosition),
    },
    evidenceRowCount: currentAcc.rowCount + previousAcc.rowCount,
  };
}

function aggregateQueryPages(rows: MetricRow[]): Map<string, QueryPageAggregate> {
  const map = new Map<string, QueryPageAggregate>();
  for (const row of rows) {
    const key = `${row.normalisedQuery}::${row.page}`;
    const entry = map.get(key) ?? {
      query: row.normalisedQuery,
      displayQuery: row.rawQuery || row.normalisedQuery,
      page: row.page,
      acc: createMetricAccumulator(),
    };
    addRowToAccumulator(entry.acc, row);
    map.set(key, entry);
  }
  return map;
}

function confidenceFromImpressions(
  impressions: number,
  thresholds: GscOpportunityThresholds,
): 'low' | 'medium' | 'high' {
  if (impressions >= thresholds.minConfidenceImpressions * 2) return 'high';
  if (impressions >= thresholds.minConfidenceImpressions) return 'medium';
  return 'low';
}

function buildDedupeKey(
  type: GscOpportunityType,
  normalisedQuery: string,
  page: string,
  targetPage: string | undefined,
  evidencePeriod: string,
): string {
  return [type, normalisedQuery, page, targetPage ?? '', evidencePeriod].join('::');
}

function slugTokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/[\s/-]+/)
      .filter((t) => t.length > 2),
  );
}

function queryPageTokenOverlap(query: string, pageUrl: string): number {
  const queryTokens = slugTokens(query);
  const pageTokens = slugTokens(pageUrl);
  if (queryTokens.size === 0 || pageTokens.size === 0) return 0;
  let overlap = 0;
  for (const token of queryTokens) {
    if (pageTokens.has(token)) overlap += 1;
  }
  return overlap / queryTokens.size;
}

export type AnalyseGscOpportunitiesInput = {
  currentPeriod: { dateFrom: string; dateTo: string };
  comparisonPeriod: { dateFrom: string; dateTo: string };
  thresholds?: GscOpportunityThresholds;
};

export async function analyseGscOpportunities(
  prisma: PrismaClient,
  connectionId: number,
  input?: Partial<AnalyseGscOpportunitiesInput>,
  thresholds: GscOpportunityThresholds = DEFAULT_GSC_OPPORTUNITY_THRESHOLDS,
): Promise<GscOpportunityFinding[]> {
  const now = new Date();
  const defaultDateTo = input?.currentPeriod?.dateTo ?? dateOnlyString(now);
  const defaultDayCount = thresholds.decliningWindowDays;
  const currentPeriod = input?.currentPeriod ?? {
    dateFrom: addDaysToDateString(defaultDateTo, -(defaultDayCount - 1)),
    dateTo: defaultDateTo,
  };
  const comparisonPeriod = input?.comparisonPeriod ?? {
    dateFrom: addDaysToDateString(
      currentPeriod.dateFrom,
      -countInclusiveCalendarDays(currentPeriod.dateFrom, currentPeriod.dateTo),
    ),
    dateTo: addDaysToDateString(currentPeriod.dateFrom, -1),
  };

  const [currentRows, comparisonRows] = await Promise.all([
    prisma.gscQueryPageMetric.findMany({
      where: {
        connectionId,
        metricDate: {
          gte: new Date(`${currentPeriod.dateFrom}T00:00:00.000Z`),
          lte: new Date(`${currentPeriod.dateTo}T00:00:00.000Z`),
        },
      },
    }) as Promise<MetricRow[]>,
    prisma.gscQueryPageMetric.findMany({
      where: {
        connectionId,
        metricDate: {
          gte: new Date(`${comparisonPeriod.dateFrom}T00:00:00.000Z`),
          lte: new Date(`${comparisonPeriod.dateTo}T00:00:00.000Z`),
        },
      },
    }) as Promise<MetricRow[]>,
  ]);

  if (currentRows.length === 0) return [];

  const currentAgg = aggregateQueryPages(currentRows);
  const entries = Array.from(currentAgg.values()).map((entry) => {
    const summary = summariseAccumulator(entry.acc);
    return {
      ...entry,
      clicks: summary.clicks,
      impressions: summary.impressions,
      ctr: summary.ctr,
      position: summary.averagePosition,
    };
  });

  const ctrValues = entries
    .filter((e) => e.impressions >= thresholds.minImpressions)
    .map((e) => e.ctr ?? 0)
    .sort((a, b) => a - b);
  const lowCtrThreshold =
    ctrValues[Math.floor(ctrValues.length * thresholds.lowCtrPercentile)] ?? 0.01;

  const evidencePeriodLabel = `${currentPeriod.dateFrom} → ${currentPeriod.dateTo}`;
  const findings: GscOpportunityFinding[] = [];

  for (const entry of entries) {
    const filter = (row: MetricRow) =>
      row.normalisedQuery === entry.query && row.page === entry.page;

    const evidence = buildEvidence(
      currentRows,
      comparisonRows,
      currentPeriod,
      comparisonPeriod,
      filter,
    );

    if (
      entry.impressions >= thresholds.minImpressions
      && entry.position != null
      && entry.position >= thresholds.positionMin
      && entry.position <= thresholds.positionMax
    ) {
      findings.push({
        type: 'near_ranking',
        normalisedQuery: entry.query,
        displayQuery: entry.displayQuery,
        page: entry.page,
        impressions: entry.impressions,
        clicks: entry.clicks,
        ctr: entry.ctr,
        position: entry.position,
        confidence: confidenceFromImpressions(entry.impressions, thresholds),
        recommendation:
          'Query ranks on page 2–3 — review whether to strengthen this landing page or queue a dedicated topic.',
        evidencePeriod: evidencePeriodLabel,
        evidence,
        dedupeKey: buildDedupeKey(
          'near_ranking',
          entry.query,
          entry.page,
          undefined,
          evidencePeriodLabel,
        ),
      });
    }

    if (entry.impressions >= thresholds.minImpressions && (entry.ctr ?? 0) <= lowCtrThreshold) {
      findings.push({
        type: 'high_impression_low_ctr',
        normalisedQuery: entry.query,
        displayQuery: entry.displayQuery,
        page: entry.page,
        impressions: entry.impressions,
        clicks: entry.clicks,
        ctr: entry.ctr,
        position: entry.position,
        confidence: confidenceFromImpressions(entry.impressions, thresholds),
        recommendation:
          'High impressions with relatively low CTR — review title, meta description, and on-page intent alignment.',
        evidencePeriod: evidencePeriodLabel,
        evidence,
        dedupeKey: buildDedupeKey(
          'high_impression_low_ctr',
          entry.query,
          entry.page,
          undefined,
          evidencePeriodLabel,
        ),
      });
    }

    const overlap = queryPageTokenOverlap(entry.query, entry.page);
    if (
      entry.impressions >= thresholds.minImpressions
      && overlap < 0.25
      && (entry.position ?? 99) > 10
    ) {
      findings.push({
        type: 'query_page_mismatch',
        normalisedQuery: entry.query,
        displayQuery: entry.displayQuery,
        page: entry.page,
        impressions: entry.impressions,
        clicks: entry.clicks,
        ctr: entry.ctr,
        position: entry.position,
        confidence: 'low',
        recommendation:
          'Query intent may not match the ranking page — review whether a different page should target this query.',
        evidencePeriod: evidencePeriodLabel,
        evidence,
        dedupeKey: buildDedupeKey(
          'query_page_mismatch',
          entry.query,
          entry.page,
          undefined,
          evidencePeriodLabel,
        ),
      });
    }
  }

  const queryToPages = new Map<string, typeof entries>();
  for (const entry of entries) {
    const list = queryToPages.get(entry.query) ?? [];
    list.push(entry);
    queryToPages.set(entry.query, list);
  }

  for (const [query, pages] of queryToPages.entries()) {
    if (pages.length < 2) continue;
    const sorted = [...pages].sort((a, b) => b.impressions - a.impressions);
    const top = sorted[0];
    if (!top || top.impressions < thresholds.minImpressions) continue;

    const filter = (row: MetricRow) => row.normalisedQuery === query;
    const evidence = buildEvidence(
      currentRows,
      comparisonRows,
      currentPeriod,
      comparisonPeriod,
      filter,
    );

    findings.push({
      type: 'cannibalisation',
      normalisedQuery: query,
      displayQuery: top.displayQuery,
      page: top.page,
      targetPage: top.page,
      impressions: top.impressions,
      clicks: top.clicks,
      ctr: top.ctr,
      position: top.position,
      confidence: confidenceFromImpressions(top.impressions, thresholds),
      recommendation: `Multiple pages (${pages.length}) receive impressions for this query. Review for editorial consolidation — do not auto-merge.`,
      evidencePeriod: evidencePeriodLabel,
      evidence,
      dedupeKey: buildDedupeKey(
        'cannibalisation',
        query,
        top.page,
        top.page,
        evidencePeriodLabel,
      ),
    });
  }

  const pageAgg = new Map<string, ReturnType<typeof createMetricAccumulator>>();
  for (const row of currentRows) {
    const acc = pageAgg.get(row.page) ?? createMetricAccumulator();
    addRowToAccumulator(acc, row);
    pageAgg.set(row.page, acc);
  }

  const comparisonPageAgg = new Map<string, ReturnType<typeof createMetricAccumulator>>();
  for (const row of comparisonRows) {
    const acc = comparisonPageAgg.get(row.page) ?? createMetricAccumulator();
    addRowToAccumulator(acc, row);
    comparisonPageAgg.set(row.page, acc);
  }

  for (const [page, currentAcc] of pageAgg.entries()) {
    const current = summariseAccumulator(currentAcc);
    const previousAcc = comparisonPageAgg.get(page);
    const previous = previousAcc ? summariseAccumulator(previousAcc) : null;

    if (current.impressions < thresholds.minDeclineImpressions) continue;
    if (!previous || previous.impressions < thresholds.minDeclineImpressions) continue;

    const impressionDrop =
      previous.impressions > 0
        ? (previous.impressions - current.impressions) / previous.impressions
        : 0;

    if (impressionDrop < thresholds.minDeclinePct) continue;

    const filter = (row: MetricRow) => row.page === page;
    const evidence = buildEvidence(
      currentRows,
      comparisonRows,
      currentPeriod,
      comparisonPeriod,
      filter,
    );

    findings.push({
      type: 'declining_page',
      normalisedQuery: page,
      displayQuery: page,
      page,
      impressions: current.impressions,
      clicks: current.clicks,
      ctr: current.ctr,
      position: current.averagePosition,
      confidence: confidenceFromImpressions(current.impressions, thresholds),
      recommendation:
        'Landing page impressions declined versus the comparison period — review content freshness, rankings, and internal links.',
      evidencePeriod: evidencePeriodLabel,
      evidence,
      dedupeKey: buildDedupeKey('declining_page', page, page, undefined, evidencePeriodLabel),
    });
  }

  const highImpressionQueries = entries
    .filter((e) => e.impressions >= thresholds.minImpressions && (e.position ?? 99) > 15)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 30);

  const strongPages = Array.from(pageAgg.entries())
    .map(([page, acc]) => ({ page, ...summariseAccumulator(acc) }))
    .filter((p) => p.impressions >= thresholds.minImpressions && (p.averagePosition ?? 99) <= 10)
    .sort((a, b) => a.averagePosition! - b.averagePosition!);

  for (const queryEntry of highImpressionQueries) {
    const hub = strongPages.find((p) => {
      const overlap = queryPageTokenOverlap(queryEntry.query, p.page);
      return overlap >= 0.3 && p.page !== queryEntry.page;
    });
    if (!hub) continue;

    const filter = (row: MetricRow) =>
      row.normalisedQuery === queryEntry.query && row.page === queryEntry.page;
    const evidence = buildEvidence(
      currentRows,
      comparisonRows,
      currentPeriod,
      comparisonPeriod,
      filter,
    );

    findings.push({
      type: 'internal_link',
      normalisedQuery: queryEntry.query,
      displayQuery: queryEntry.displayQuery,
      page: queryEntry.page,
      targetPage: hub.page,
      impressions: queryEntry.impressions,
      clicks: queryEntry.clicks,
      ctr: queryEntry.ctr,
      position: queryEntry.position,
      confidence: 'medium',
      recommendation: `Consider an internal link from ${hub.page} to strengthen visibility for this query.`,
      evidencePeriod: evidencePeriodLabel,
      evidence,
      dedupeKey: buildDedupeKey(
        'internal_link',
        queryEntry.query,
        queryEntry.page,
        hub.page,
        evidencePeriodLabel,
      ),
    });
  }

  const seen = new Set<string>();
  return findings
    .filter((f) => {
      if (seen.has(f.dedupeKey)) return false;
      seen.add(f.dedupeKey);
      return true;
    })
    .slice(0, 200);
}

const HUMAN_LOCKED_STATUSES = new Set(['rejected', 'converted', 'accepted', 'deferred']);

function parseSourceData(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function opportunityTypeFromSourceData(sourceData: unknown): string | null {
  const data = parseSourceData(sourceData);
  const raw = data.opportunityType;
  return typeof raw === 'string' ? raw : null;
}

export type UpsertGscOpportunityResult = {
  created: number;
  updated: number;
  skipped: number;
};

export async function upsertGscOpportunityCandidates(
  prisma: PrismaClient,
  findings: GscOpportunityFinding[],
): Promise<UpsertGscOpportunityResult> {
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const finding of findings) {
    const normalisedKeyword = normaliseAutopilotKeyword(finding.normalisedQuery).normalised;
    const targetPage = finding.targetPage ?? finding.page;

    const candidates = await prisma.autopilotKeywordCandidate.findMany({
      where: {
        sourceType: 'gsc_opportunity',
        normalisedKeyword,
        OR: [{ currentUrl: finding.page }, { currentUrl: targetPage }],
      },
    });

    const existing = candidates.find((c) => {
      const type = opportunityTypeFromSourceData(c.sourceData);
      const normalisedType = type ? (GSC_OPPORTUNITY_TYPE_ALIASES[type] ?? type) : null;
      return (
        normalisedType === finding.type
        && (c.currentUrl === finding.page || c.currentUrl === targetPage)
      );
    });

    const sourceData: Prisma.InputJsonValue = {
      opportunityType: finding.type,
      recommendation: finding.recommendation,
      evidencePeriod: finding.evidencePeriod,
      targetPage: finding.targetPage ?? null,
      confidence: finding.confidence,
      evidence: finding.evidence,
      dedupeKey: finding.dedupeKey,
      lastDetectedAt: new Date().toISOString(),
    };

    if (existing) {
      if (HUMAN_LOCKED_STATUSES.has(existing.status)) {
        await prisma.autopilotKeywordCandidate.update({
          where: { id: existing.id },
          data: {
            sourceData,
            impressions: Math.round(finding.impressions),
            clicks: Math.round(finding.clicks),
            ctr: finding.ctr,
            averagePosition: finding.position,
          },
        });
        skipped += 1;
        continue;
      }

      await prisma.autopilotKeywordCandidate.update({
        where: { id: existing.id },
        data: {
          keyword: finding.displayQuery,
          sourceData,
          impressions: Math.round(finding.impressions),
          clicks: Math.round(finding.clicks),
          ctr: finding.ctr,
          averagePosition: finding.position,
          currentUrl: finding.page,
          reviewNotes: existing.reviewNotes || finding.recommendation,
        },
      });
      updated += 1;
      continue;
    }

    await prisma.autopilotKeywordCandidate.create({
      data: {
        keyword: finding.displayQuery,
        normalisedKeyword,
        sourceType: 'gsc_opportunity',
        status: 'new',
        currentUrl: finding.page,
        impressions: Math.round(finding.impressions),
        clicks: Math.round(finding.clicks),
        ctr: finding.ctr,
        averagePosition: finding.position,
        sourceData,
        reviewNotes: finding.recommendation,
      },
    });
    created += 1;
  }

  return { created, updated, skipped };
}

export async function getGscOpportunitySummary(prisma: PrismaClient) {
  const [newCount, reviewedCount, convertedCount, dismissedCount] = await Promise.all([
    prisma.autopilotKeywordCandidate.count({
      where: { sourceType: 'gsc_opportunity', status: { in: ['new', 'reviewing'] } },
    }),
    prisma.autopilotKeywordCandidate.count({
      where: {
        sourceType: 'gsc_opportunity',
        status: { in: ['accepted', 'deferred'] },
        reviewedAt: { not: null },
      },
    }),
    prisma.autopilotKeywordCandidate.count({
      where: { sourceType: 'gsc_opportunity', status: 'converted' },
    }),
    prisma.autopilotKeywordCandidate.count({
      where: { sourceType: 'gsc_opportunity', status: 'rejected' },
    }),
  ]);

  return { newCount, reviewedCount, convertedCount, dismissedCount };
}
