/**
 * GSC performance reporting from stored GscQueryPageMetric rows.
 * Read-only — never calls Google Search Console.
 */

import type { PrismaClient } from '@prisma/client';
import { validationError } from './apiErrors.ts';
import { findRetainedGscConnection } from './gscConnectionService.ts';
import {
  countInclusiveCalendarDays,
  resolveGscSyncDateBounds,
  validateGscSyncDateRange,
} from './gscSyncDateValidation.ts';
import {
  addDaysToDateString,
  enumerateDateStringsInclusive,
} from './gscDateUtils.ts';
import {
  absoluteChange,
  addRowToAccumulator,
  createMetricAccumulator,
  decimalToNumber,
  pctChange,
  safeAveragePosition,
  safeCtr,
  summariseAccumulator,
} from './gscMetricMath.ts';

export const GSC_PERFORMANCE_MAX_RANGE_DAYS = 400;

export type GscPerformanceQuery = {
  dateFrom?: string | null;
  dateTo?: string | null;
  comparisonDateFrom?: string | null;
  comparisonDateTo?: string | null;
  compare?: boolean | string | null;
  page?: string | null;
  query?: string | null;
  limit?: number;
  offset?: number;
};

export type GscPerformanceSummary = {
  totalClicks: number;
  totalImpressions: number;
  ctr: number | null;
  averagePosition: number | null;
  queryCount: number;
  pageCount: number;
  metricRowCount: number;
};

export type GscPerformanceComparison = {
  clicksChange: number | null;
  impressionsChange: number | null;
  ctrChange: number | null;
  positionChange: number | null;
  queryCountChange: number | null;
  pageCountChange: number | null;
};

export type GscPerformanceTrendPoint = {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  averagePosition: number | null;
};

export type GscPerformanceTopQuery = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  averagePosition: number | null;
  landingPageCount: number;
};

export type GscPerformanceTopPage = {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  averagePosition: number | null;
  queryCount: number;
};

export type GscPerformanceDataQuality = {
  dateFrom: string;
  dateTo: string;
  latestMetricDate: string | null;
  missingDates: string[];
  stale: boolean;
  sourceRowCount: number;
  lastSuccessfulSyncAt: string | null;
};

export type GscPerformanceReport = {
  configured: boolean;
  connectionId: number | null;
  summary: GscPerformanceSummary | null;
  comparison: GscPerformanceComparison | null;
  trend: GscPerformanceTrendPoint[];
  topQueries: GscPerformanceTopQuery[];
  topPages: GscPerformanceTopPage[];
  topQueriesTotal: number;
  topPagesTotal: number;
  dataQuality: GscPerformanceDataQuality | null;
  period: { dateFrom: string; dateTo: string } | null;
  comparisonPeriod: { dateFrom: string; dateTo: string } | null;
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

function resolveReportDateRange(input: GscPerformanceQuery, now = new Date()) {
  const bounds = resolveGscSyncDateBounds(process.env, now);
  const resolved = validateGscSyncDateRange({
    dateFrom: input.dateFrom ?? bounds.defaultDateFrom,
    dateTo: input.dateTo ?? bounds.defaultDateTo,
    now,
    bounds: { ...bounds, maxRangeDays: GSC_PERFORMANCE_MAX_RANGE_DAYS },
  });

  if (resolved.calendarDayCount > GSC_PERFORMANCE_MAX_RANGE_DAYS) {
    throw validationError(
      `Report range exceeds maximum of ${GSC_PERFORMANCE_MAX_RANGE_DAYS} days.`,
      { dateFrom: resolved.dateFrom, dateTo: resolved.dateTo },
    );
  }

  return resolved;
}

function resolveComparisonRange(
  input: GscPerformanceQuery,
  period: { dateFrom: string; dateTo: string },
): { dateFrom: string; dateTo: string } | null {
  if (input.comparisonDateFrom && input.comparisonDateTo) {
    const from = input.comparisonDateFrom.trim();
    const to = input.comparisonDateTo.trim();
    if (from && to) {
      if (from > to) {
        throw validationError('comparisonDateFrom must be on or before comparisonDateTo.');
      }
      return { dateFrom: from, dateTo: to };
    }
  }

  if (!input.comparisonDateFrom && !input.comparisonDateTo) {
    const dayCount = countInclusiveCalendarDays(period.dateFrom, period.dateTo);
    const comparisonDateTo = addDaysToDateString(period.dateFrom, -1);
    const comparisonDateFrom = addDaysToDateString(comparisonDateTo, -(dayCount - 1));
    return { dateFrom: comparisonDateFrom, dateTo: comparisonDateTo };
  }

  return null;
}

function buildRowWhere(
  connectionId: number,
  dateFrom: string,
  dateTo: string,
  filters: { page?: string | null; query?: string | null },
) {
  const where: {
    connectionId: number;
    metricDate: { gte: Date; lte: Date };
    page?: { contains: string };
    OR?: Array<{ rawQuery: { contains: string } } | { normalisedQuery: { contains: string } }>;
  } = {
    connectionId,
    metricDate: {
      gte: new Date(`${dateFrom}T00:00:00.000Z`),
      lte: new Date(`${dateTo}T00:00:00.000Z`),
    },
  };

  if (filters.page?.trim()) {
    where.page = { contains: filters.page.trim() };
  }
  if (filters.query?.trim()) {
    const q = filters.query.trim();
    where.OR = [{ rawQuery: { contains: q } }, { normalisedQuery: { contains: q } }];
  }

  return where;
}

async function fetchMetricRows(
  prisma: PrismaClient,
  connectionId: number,
  dateFrom: string,
  dateTo: string,
  filters: { page?: string | null; query?: string | null },
): Promise<MetricRow[]> {
  return prisma.gscQueryPageMetric.findMany({
    where: buildRowWhere(connectionId, dateFrom, dateTo, filters),
    select: {
      metricDate: true,
      rawQuery: true,
      normalisedQuery: true,
      page: true,
      clicks: true,
      impressions: true,
      position: true,
    },
  }) as Promise<MetricRow[]>;
}

function aggregateSummary(rows: MetricRow[]): GscPerformanceSummary {
  const acc = createMetricAccumulator();
  const queries = new Set<string>();
  const pages = new Set<string>();

  for (const row of rows) {
    addRowToAccumulator(acc, row);
    queries.add(row.normalisedQuery);
    pages.add(row.page);
  }

  const base = summariseAccumulator(acc);
  return {
    totalClicks: base.clicks,
    totalImpressions: base.impressions,
    ctr: base.ctr,
    averagePosition: base.averagePosition,
    queryCount: queries.size,
    pageCount: pages.size,
    metricRowCount: base.metricRowCount,
  };
}

function buildComparison(
  current: GscPerformanceSummary,
  previous: GscPerformanceSummary | null,
): GscPerformanceComparison | null {
  if (!previous) return null;
  return {
    clicksChange: absoluteChange(current.totalClicks, previous.totalClicks),
    impressionsChange: absoluteChange(current.totalImpressions, previous.totalImpressions),
    ctrChange: absoluteChange(current.ctr, previous.ctr),
    positionChange: absoluteChange(current.averagePosition, previous.averagePosition),
    queryCountChange: absoluteChange(current.queryCount, previous.queryCount),
    pageCountChange: absoluteChange(current.pageCount, previous.pageCount),
  };
}

function buildTrend(rows: MetricRow[], dateFrom: string, dateTo: string): GscPerformanceTrendPoint[] {
  const byDate = new Map<string, ReturnType<typeof createMetricAccumulator>>();

  for (const row of rows) {
    const date = dateOnlyString(row.metricDate);
    const acc = byDate.get(date) ?? createMetricAccumulator();
    addRowToAccumulator(acc, row);
    byDate.set(date, acc);
  }

  const expectedDates = enumerateDateStringsInclusive(dateFrom, dateTo, GSC_PERFORMANCE_MAX_RANGE_DAYS);
  return expectedDates.map((date) => {
    const acc = byDate.get(date);
    if (!acc) {
      return { date, clicks: 0, impressions: 0, ctr: null, averagePosition: null };
    }
    const summary = summariseAccumulator(acc);
    return {
      date,
      clicks: summary.clicks,
      impressions: summary.impressions,
      ctr: summary.ctr,
      averagePosition: summary.averagePosition,
    };
  });
}

function aggregateTopQueries(rows: MetricRow[]): GscPerformanceTopQuery[] {
  const byQuery = new Map<
    string,
    { query: string; acc: ReturnType<typeof createMetricAccumulator>; pages: Set<string> }
  >();

  for (const row of rows) {
    const key = row.normalisedQuery;
    const entry = byQuery.get(key) ?? {
      query: row.rawQuery || row.normalisedQuery,
      acc: createMetricAccumulator(),
      pages: new Set<string>(),
    };
    addRowToAccumulator(entry.acc, row);
    entry.pages.add(row.page);
    byQuery.set(key, entry);
  }

  return Array.from(byQuery.values())
    .map((entry) => {
      const summary = summariseAccumulator(entry.acc);
      return {
        query: entry.query,
        clicks: summary.clicks,
        impressions: summary.impressions,
        ctr: summary.ctr,
        averagePosition: summary.averagePosition,
        landingPageCount: entry.pages.size,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

function aggregateTopPages(rows: MetricRow[]): GscPerformanceTopPage[] {
  const byPage = new Map<
    string,
    { page: string; acc: ReturnType<typeof createMetricAccumulator>; queries: Set<string> }
  >();

  for (const row of rows) {
    const entry = byPage.get(row.page) ?? {
      page: row.page,
      acc: createMetricAccumulator(),
      queries: new Set<string>(),
    };
    addRowToAccumulator(entry.acc, row);
    entry.queries.add(row.normalisedQuery);
    byPage.set(row.page, entry);
  }

  return Array.from(byPage.values())
    .map((entry) => {
      const summary = summariseAccumulator(entry.acc);
      return {
        page: entry.page,
        clicks: summary.clicks,
        impressions: summary.impressions,
        ctr: summary.ctr,
        averagePosition: summary.averagePosition,
        queryCount: entry.queries.size,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
}

async function buildDataQuality(
  prisma: PrismaClient,
  connectionId: number,
  dateFrom: string,
  dateTo: string,
  sourceRowCount: number,
  lastSuccessfulSyncAt: Date | null,
): Promise<GscPerformanceDataQuality> {
  const latest = await prisma.gscQueryPageMetric.findFirst({
    where: { connectionId },
    orderBy: { metricDate: 'desc' },
    select: { metricDate: true },
  });

  const latestMetricDate = latest ? dateOnlyString(latest.metricDate) : null;

  const presentDates = await prisma.gscQueryPageMetric.findMany({
    where: {
      connectionId,
      metricDate: {
        gte: new Date(`${dateFrom}T00:00:00.000Z`),
        lte: new Date(`${dateTo}T00:00:00.000Z`),
      },
    },
    distinct: ['metricDate'],
    select: { metricDate: true },
  });

  const presentSet = new Set(presentDates.map((row) => dateOnlyString(row.metricDate)));
  const expectedDates = enumerateDateStringsInclusive(dateFrom, dateTo, GSC_PERFORMANCE_MAX_RANGE_DAYS);
  const missingDates = expectedDates.filter((d) => !presentSet.has(d));

  const bounds = resolveGscSyncDateBounds();
  const stale =
    latestMetricDate != null
      ? latestMetricDate < addDaysToDateString(bounds.latestSafeDate, -3)
      : true;

  return {
    dateFrom,
    dateTo,
    latestMetricDate,
    missingDates,
    stale,
    sourceRowCount,
    lastSuccessfulSyncAt: lastSuccessfulSyncAt?.toISOString() ?? null,
  };
}

export async function getGscPerformanceReport(
  prisma: PrismaClient,
  input: GscPerformanceQuery = {},
): Promise<GscPerformanceReport> {
  const connection = await findRetainedGscConnection(prisma);
  if (!connection || connection.status !== 'ACTIVE') {
    return {
      configured: false,
      connectionId: connection?.id ?? null,
      summary: null,
      comparison: null,
      trend: [],
      topQueries: [],
      topPages: [],
      topQueriesTotal: 0,
      topPagesTotal: 0,
      dataQuality: null,
      period: null,
      comparisonPeriod: null,
    };
  }

  const period = resolveReportDateRange(input);
  const compareEnabled = input.compare !== 'false' && input.compare !== false;
  const comparisonPeriod = compareEnabled
    ? input.comparisonDateFrom !== undefined || input.comparisonDateTo !== undefined
      ? resolveComparisonRange(input, period)
      : resolveComparisonRange({}, period)
    : null;

  const filters = { page: input.page, query: input.query };
  const currentRows = await fetchMetricRows(
    prisma,
    connection.id,
    period.dateFrom,
    period.dateTo,
    filters,
  );

  if (currentRows.length === 0) {
    const dataQuality = await buildDataQuality(
      prisma,
      connection.id,
      period.dateFrom,
      period.dateTo,
      0,
      connection.lastSuccessfulSyncAt,
    );
    return {
      configured: true,
      connectionId: connection.id,
      summary: null,
      comparison: null,
      trend: [],
      topQueries: [],
      topPages: [],
      topQueriesTotal: 0,
      topPagesTotal: 0,
      dataQuality,
      period: { dateFrom: period.dateFrom, dateTo: period.dateTo },
      comparisonPeriod,
    };
  }

  const summary = aggregateSummary(currentRows);

  let comparison: GscPerformanceComparison | null = null;
  if (comparisonPeriod) {
    const comparisonRows = await fetchMetricRows(
      prisma,
      connection.id,
      comparisonPeriod.dateFrom,
      comparisonPeriod.dateTo,
      filters,
    );
    const comparisonSummary =
      comparisonRows.length > 0 ? aggregateSummary(comparisonRows) : null;
    comparison = buildComparison(summary, comparisonSummary);
  }

  const allTopQueries = aggregateTopQueries(currentRows);
  const allTopPages = aggregateTopPages(currentRows);
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);

  const dataQuality = await buildDataQuality(
    prisma,
    connection.id,
    period.dateFrom,
    period.dateTo,
    currentRows.length,
    connection.lastSuccessfulSyncAt,
  );

  return {
    configured: true,
    connectionId: connection.id,
    summary,
    comparison,
    trend: buildTrend(currentRows, period.dateFrom, period.dateTo),
    topQueries: allTopQueries.slice(offset, offset + limit),
    topPages: allTopPages.slice(offset, offset + limit),
    topQueriesTotal: allTopQueries.length,
    topPagesTotal: allTopPages.length,
    dataQuality,
    period: { dateFrom: period.dateFrom, dateTo: period.dateTo },
    comparisonPeriod,
  };
}

/** Exported for tests — recompute CTR from totals. */
export { safeCtr, safeAveragePosition, pctChange, decimalToNumber };
