/**
 * GA4 performance reporting from stored Ga4PageMetric rows.
 * Read-only — never calls Google Analytics 4.
 */

import type { PrismaClient } from '@prisma/client';
import { validationError } from '../autopilot/apiErrors.ts';
import { addDaysToDateString, enumerateDateStringsInclusive } from '../autopilot/gscDateUtils.ts';
import { getGa4ConfigMissing } from './ga4Config.ts';
import {
  absoluteChange,
  addGa4RowToAccumulator,
  createGa4MetricAccumulator,
  decimalToNumber,
  pctChange,
  summariseGa4Accumulator,
} from './ga4MetricMath.ts';
import {
  countInclusiveCalendarDays,
  GA4_SYNC_MAX_RANGE_DAYS,
  resolveGa4SyncDateBounds,
  validateGa4SyncDateRange,
} from './ga4SyncDateValidation.ts';

export const GA4_PERFORMANCE_MAX_RANGE_DAYS = GA4_SYNC_MAX_RANGE_DAYS;

export type Ga4PerformanceQuery = {
  dateFrom?: string | null;
  dateTo?: string | null;
  comparisonDateFrom?: string | null;
  comparisonDateTo?: string | null;
  compare?: boolean | string | null;
  seoPageId?: number | null;
  page?: string | null;
  channelGroup?: string | null;
  source?: string | null;
  medium?: string | null;
  limit?: number;
  offset?: number;
};

export type Ga4PerformanceSummary = {
  sessions: number;
  organicSessions: number;
  engagedSessions: number;
  engagementRate: number | null;
  averageEngagementTime: number | null;
  keyEvents: number;
  generateLeadEvents: number;
  contactFormConversions: number;
  bookingConversions: number;
  pageCount: number;
  metricRowCount: number;
};

export type Ga4PerformanceComparison = {
  current: Ga4PerformanceSummary;
  previous: Ga4PerformanceSummary | null;
  sessionsChange: number | null;
  organicSessionsChange: number | null;
  engagedSessionsChange: number | null;
  engagementRateChange: number | null;
  averageEngagementTimeChange: number | null;
  keyEventsChange: number | null;
  generateLeadEventsChange: number | null;
  contactFormConversionsChange: number | null;
  bookingConversionsChange: number | null;
  sessionsPctChange: number | null;
  organicSessionsPctChange: number | null;
  engagedSessionsPctChange: number | null;
  keyEventsPctChange: number | null;
  generateLeadEventsPctChange: number | null;
};

export type Ga4PerformanceTrendPoint = {
  date: string;
  sessions: number;
  organicSessions: number;
  engagedSessions: number;
  keyEvents: number;
  generateLeadEvents: number;
};

export type Ga4PerformanceTopPage = {
  seoPageId: number | null;
  canonicalUrl: string | null;
  observedLandingPage: string;
  matchStatus: 'matched' | 'unmatched';
  sessions: number;
  organicSessions: number;
  engagedSessions: number;
  engagementRate: number | null;
  averageEngagementTime: number | null;
  keyEvents: number;
  generateLeadEvents: number;
  contactFormConversions: number;
  bookingConversions: number;
};

export type Ga4PerformanceDataQuality = {
  configured: boolean;
  dateFrom: string;
  dateTo: string;
  latestMetricDate: string | null;
  missingDates: string[];
  stale: boolean;
  matchedRowCount: number;
  unmatchedRowCount: number;
  unmatchedLandingPageCount: number;
  lastSuccessfulSyncAt: string | null;
};

export type Ga4PerformanceReport = {
  configured: boolean;
  summary: Ga4PerformanceSummary | null;
  comparison: Ga4PerformanceComparison | null;
  trend: Ga4PerformanceTrendPoint[];
  topPages: Ga4PerformanceTopPage[];
  topPagesTotal: number;
  dataQuality: Ga4PerformanceDataQuality | null;
  period: { dateFrom: string; dateTo: string } | null;
  comparisonPeriod: { dateFrom: string; dateTo: string } | null;
};

type MetricRow = {
  metricDate: Date;
  seoPageId: number | null;
  observedLandingPage: string;
  normalisedLandingPage: string;
  defaultChannelGroup: string;
  source: string;
  medium: string;
  sessions: unknown;
  organicSessions: unknown;
  engagedSessions: unknown;
  engagementRate: unknown;
  averageEngagementTime: unknown;
  keyEvents: unknown;
  generateLeadEvents: unknown;
  contactFormConversions: unknown;
  bookingConversions: unknown;
  seoPage?: { canonicalUrl: string } | null;
};

function dateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function resolveReportDateRange(input: Ga4PerformanceQuery, now = new Date()) {
  const bounds = resolveGa4SyncDateBounds(process.env, now);
  const resolved = validateGa4SyncDateRange({
    dateFrom: input.dateFrom ?? bounds.defaultDateFrom,
    dateTo: input.dateTo ?? bounds.defaultDateTo,
    now,
    bounds: { ...bounds, maxRangeDays: GA4_PERFORMANCE_MAX_RANGE_DAYS },
  });

  if (resolved.calendarDayCount > GA4_PERFORMANCE_MAX_RANGE_DAYS) {
    throw validationError(
      `Report range exceeds maximum of ${GA4_PERFORMANCE_MAX_RANGE_DAYS} days.`,
      { dateFrom: resolved.dateFrom, dateTo: resolved.dateTo },
    );
  }

  return resolved;
}

function resolveComparisonRange(
  input: Ga4PerformanceQuery,
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
  dateFrom: string,
  dateTo: string,
  filters: {
    seoPageId?: number | null;
    page?: string | null;
    channelGroup?: string | null;
    source?: string | null;
    medium?: string | null;
  },
) {
  const where: {
    metricDate: { gte: Date; lte: Date };
    seoPageId?: number;
    defaultChannelGroup?: string;
    source?: string;
    medium?: string;
    OR?: Array<
      | { observedLandingPage: { contains: string } }
      | { normalisedLandingPage: { contains: string } }
    >;
  } = {
    metricDate: {
      gte: new Date(`${dateFrom}T00:00:00.000Z`),
      lte: new Date(`${dateTo}T00:00:00.000Z`),
    },
  };

  if (filters.seoPageId != null && Number.isInteger(filters.seoPageId)) {
    where.seoPageId = filters.seoPageId;
  }
  if (filters.channelGroup?.trim()) {
    where.defaultChannelGroup = filters.channelGroup.trim();
  }
  if (filters.source?.trim()) {
    where.source = filters.source.trim();
  }
  if (filters.medium?.trim()) {
    where.medium = filters.medium.trim();
  }
  if (filters.page?.trim()) {
    const page = filters.page.trim();
    where.OR = [
      { observedLandingPage: { contains: page } },
      { normalisedLandingPage: { contains: page } },
    ];
  }

  return where;
}

async function fetchMetricRows(
  prisma: PrismaClient,
  dateFrom: string,
  dateTo: string,
  filters: {
    seoPageId?: number | null;
    page?: string | null;
    channelGroup?: string | null;
    source?: string | null;
    medium?: string | null;
  },
): Promise<MetricRow[]> {
  return prisma.ga4PageMetric.findMany({
    where: buildRowWhere(dateFrom, dateTo, filters),
    select: {
      metricDate: true,
      seoPageId: true,
      observedLandingPage: true,
      normalisedLandingPage: true,
      defaultChannelGroup: true,
      source: true,
      medium: true,
      sessions: true,
      organicSessions: true,
      engagedSessions: true,
      engagementRate: true,
      averageEngagementTime: true,
      keyEvents: true,
      generateLeadEvents: true,
      contactFormConversions: true,
      bookingConversions: true,
      seoPage: { select: { canonicalUrl: true } },
    },
  }) as Promise<MetricRow[]>;
}

function aggregateSummary(rows: MetricRow[]): Ga4PerformanceSummary {
  const acc = createGa4MetricAccumulator();
  const pages = new Set<string>();

  for (const row of rows) {
    addGa4RowToAccumulator(acc, row);
    pages.add(row.normalisedLandingPage);
  }

  const base = summariseGa4Accumulator(acc);
  return {
    ...base,
    pageCount: pages.size,
  };
}

function buildComparison(
  current: Ga4PerformanceSummary,
  previous: Ga4PerformanceSummary | null,
): Ga4PerformanceComparison | null {
  if (!previous) {
    return {
      current,
      previous: null,
      sessionsChange: null,
      organicSessionsChange: null,
      engagedSessionsChange: null,
      engagementRateChange: null,
      averageEngagementTimeChange: null,
      keyEventsChange: null,
      generateLeadEventsChange: null,
      contactFormConversionsChange: null,
      bookingConversionsChange: null,
      sessionsPctChange: null,
      organicSessionsPctChange: null,
      engagedSessionsPctChange: null,
      keyEventsPctChange: null,
      generateLeadEventsPctChange: null,
    };
  }

  return {
    current,
    previous,
    sessionsChange: absoluteChange(current.sessions, previous.sessions),
    organicSessionsChange: absoluteChange(current.organicSessions, previous.organicSessions),
    engagedSessionsChange: absoluteChange(current.engagedSessions, previous.engagedSessions),
    engagementRateChange: absoluteChange(current.engagementRate, previous.engagementRate),
    averageEngagementTimeChange: absoluteChange(
      current.averageEngagementTime,
      previous.averageEngagementTime,
    ),
    keyEventsChange: absoluteChange(current.keyEvents, previous.keyEvents),
    generateLeadEventsChange: absoluteChange(
      current.generateLeadEvents,
      previous.generateLeadEvents,
    ),
    contactFormConversionsChange: absoluteChange(
      current.contactFormConversions,
      previous.contactFormConversions,
    ),
    bookingConversionsChange: absoluteChange(
      current.bookingConversions,
      previous.bookingConversions,
    ),
    sessionsPctChange: pctChange(current.sessions, previous.sessions),
    organicSessionsPctChange: pctChange(current.organicSessions, previous.organicSessions),
    engagedSessionsPctChange: pctChange(current.engagedSessions, previous.engagedSessions),
    keyEventsPctChange: pctChange(current.keyEvents, previous.keyEvents),
    generateLeadEventsPctChange: pctChange(
      current.generateLeadEvents,
      previous.generateLeadEvents,
    ),
  };
}

function buildTrend(rows: MetricRow[], dateFrom: string, dateTo: string): Ga4PerformanceTrendPoint[] {
  const byDate = new Map<string, ReturnType<typeof createGa4MetricAccumulator>>();

  for (const row of rows) {
    const date = dateOnlyString(row.metricDate);
    const acc = byDate.get(date) ?? createGa4MetricAccumulator();
    addGa4RowToAccumulator(acc, row);
    byDate.set(date, acc);
  }

  const expectedDates = enumerateDateStringsInclusive(dateFrom, dateTo, GA4_PERFORMANCE_MAX_RANGE_DAYS);
  return expectedDates.map((date) => {
    const acc = byDate.get(date);
    if (!acc) {
      return {
        date,
        sessions: 0,
        organicSessions: 0,
        engagedSessions: 0,
        keyEvents: 0,
        generateLeadEvents: 0,
      };
    }
    const summary = summariseGa4Accumulator(acc);
    return {
      date,
      sessions: summary.sessions,
      organicSessions: summary.organicSessions,
      engagedSessions: summary.engagedSessions,
      keyEvents: summary.keyEvents,
      generateLeadEvents: summary.generateLeadEvents,
    };
  });
}

function aggregateTopPages(rows: MetricRow[]): Ga4PerformanceTopPage[] {
  const byPage = new Map<
    string,
    {
      seoPageId: number | null;
      canonicalUrl: string | null;
      observedLandingPage: string;
      acc: ReturnType<typeof createGa4MetricAccumulator>;
    }
  >();

  for (const row of rows) {
    const key = row.normalisedLandingPage;
    const entry = byPage.get(key) ?? {
      seoPageId: row.seoPageId,
      canonicalUrl: row.seoPage?.canonicalUrl ?? null,
      observedLandingPage: row.observedLandingPage,
      acc: createGa4MetricAccumulator(),
    };
    addGa4RowToAccumulator(entry.acc, row);
    if (row.seoPageId != null) entry.seoPageId = row.seoPageId;
    if (row.seoPage?.canonicalUrl) entry.canonicalUrl = row.seoPage.canonicalUrl;
    byPage.set(key, entry);
  }

  return Array.from(byPage.values())
    .map((entry) => {
      const summary = summariseGa4Accumulator(entry.acc);
      return {
        seoPageId: entry.seoPageId,
        canonicalUrl: entry.canonicalUrl,
        observedLandingPage: entry.observedLandingPage,
        matchStatus: entry.seoPageId != null ? ('matched' as const) : ('unmatched' as const),
        sessions: summary.sessions,
        organicSessions: summary.organicSessions,
        engagedSessions: summary.engagedSessions,
        engagementRate: summary.engagementRate,
        averageEngagementTime: summary.averageEngagementTime,
        keyEvents: summary.keyEvents,
        generateLeadEvents: summary.generateLeadEvents,
        contactFormConversions: summary.contactFormConversions,
        bookingConversions: summary.bookingConversions,
      };
    })
    .sort(
      (a, b) =>
        b.organicSessions - a.organicSessions ||
        b.sessions - a.sessions ||
        b.generateLeadEvents - a.generateLeadEvents,
    );
}

async function buildDataQuality(
  prisma: PrismaClient,
  dateFrom: string,
  dateTo: string,
  rows: MetricRow[],
  configured: boolean,
): Promise<Ga4PerformanceDataQuality> {
  const config = await prisma.ga4ConfigurationState.findUnique({ where: { id: 1 } });

  const latest = await prisma.ga4PageMetric.findFirst({
    orderBy: { metricDate: 'desc' },
    select: { metricDate: true },
  });
  const latestMetricDate = latest ? dateOnlyString(latest.metricDate) : null;

  const presentDates = await prisma.ga4PageMetric.findMany({
    where: {
      metricDate: {
        gte: new Date(`${dateFrom}T00:00:00.000Z`),
        lte: new Date(`${dateTo}T00:00:00.000Z`),
      },
    },
    distinct: ['metricDate'],
    select: { metricDate: true },
  });

  const presentSet = new Set(presentDates.map((row) => dateOnlyString(row.metricDate)));
  const expectedDates = enumerateDateStringsInclusive(dateFrom, dateTo, GA4_PERFORMANCE_MAX_RANGE_DAYS);
  const missingDates = expectedDates.filter((d) => !presentSet.has(d));

  const bounds = resolveGa4SyncDateBounds();
  const stale =
    latestMetricDate != null
      ? latestMetricDate < addDaysToDateString(bounds.latestSafeDate, -3)
      : true;

  const matchedRowCount = rows.filter((row) => row.seoPageId != null).length;
  const unmatchedRowCount = rows.length - matchedRowCount;
  const unmatchedLandingPageCount = new Set(
    rows.filter((row) => row.seoPageId == null).map((row) => row.normalisedLandingPage),
  ).size;

  return {
    configured,
    dateFrom,
    dateTo,
    latestMetricDate,
    missingDates,
    stale,
    matchedRowCount,
    unmatchedRowCount,
    unmatchedLandingPageCount,
    lastSuccessfulSyncAt: config?.lastSuccessfulSyncAt?.toISOString() ?? null,
  };
}

export async function getGa4PerformanceReport(
  prisma: PrismaClient,
  input: Ga4PerformanceQuery = {},
): Promise<Ga4PerformanceReport> {
  const configured = getGa4ConfigMissing().length === 0;
  if (!configured) {
    return {
      configured: false,
      summary: null,
      comparison: null,
      trend: [],
      topPages: [],
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

  const filters = {
    seoPageId: input.seoPageId,
    page: input.page,
    channelGroup: input.channelGroup,
    source: input.source,
    medium: input.medium,
  };

  const currentRows = await fetchMetricRows(
    prisma,
    period.dateFrom,
    period.dateTo,
    filters,
  );

  if (currentRows.length === 0) {
    const dataQuality = await buildDataQuality(
      prisma,
      period.dateFrom,
      period.dateTo,
      [],
      true,
    );
    return {
      configured: true,
      summary: null,
      comparison: null,
      trend: [],
      topPages: [],
      topPagesTotal: 0,
      dataQuality,
      period: { dateFrom: period.dateFrom, dateTo: period.dateTo },
      comparisonPeriod,
    };
  }

  const summary = aggregateSummary(currentRows);

  let comparison: Ga4PerformanceComparison | null = null;
  if (comparisonPeriod) {
    const comparisonRows = await fetchMetricRows(
      prisma,
      comparisonPeriod.dateFrom,
      comparisonPeriod.dateTo,
      filters,
    );
    const comparisonSummary =
      comparisonRows.length > 0 ? aggregateSummary(comparisonRows) : null;
    comparison = buildComparison(summary, comparisonSummary);
  }

  const allTopPages = aggregateTopPages(currentRows);
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);
  const offset = Math.max(input.offset ?? 0, 0);

  const dataQuality = await buildDataQuality(
    prisma,
    period.dateFrom,
    period.dateTo,
    currentRows,
    true,
  );

  return {
    configured: true,
    summary,
    comparison,
    trend: buildTrend(currentRows, period.dateFrom, period.dateTo),
    topPages: allTopPages.slice(offset, offset + limit),
    topPagesTotal: allTopPages.length,
    dataQuality,
    period: { dateFrom: period.dateFrom, dateTo: period.dateTo },
    comparisonPeriod,
  };
}

export { decimalToNumber, pctChange };
