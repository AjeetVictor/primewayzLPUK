/**
 * GA4 aggregate sync engine with locking, partial-run policy, and safe errors.
 *
 * Partial-run policy (A): per-day committed upserts. Successfully imported days are retained.
 * If failure occurs after some days, status is PARTIAL when daysProcessed > 0, otherwise FAILED.
 */

import { createHash, randomBytes } from 'node:crypto';
import { Prisma, type Ga4SyncTrigger, type PrismaClient } from '@prisma/client';
import { appendActivityLog } from '../autopilot/activityLogService.ts';
import {
  AutopilotError,
  AUTOPILOT_ERROR_CODES,
  conflict,
} from '../autopilot/apiErrors.ts';
import { addDaysToDateString } from '../autopilot/gscDateUtils.ts';
import { assertGa4Configured, getGa4PublicConfigStatus } from './ga4Config.ts';
import {
  createDefaultGa4ReportingProvider,
  sanitizeGa4ErrorMessage,
  type Ga4ReportRow,
  type Ga4ReportingProvider,
} from './ga4ReportingProvider.ts';
import { validateGa4SyncDateRange } from './ga4SyncDateValidation.ts';
import { registerSeoPageAlias } from './seoPageIdentityService.ts';
import { hashSeoUrl, normaliseSeoPageUrl, classifySeoPagePath } from './seoUrlNormalization.ts';

export const GA4_SYNC_LOCK_STALE_MS = 60 * 60 * 1000;
export const GA4_SYNC_UPSERT_CHUNK = 200;

export type RunGa4SyncInput = {
  actorId?: number | null;
  trigger: Ga4SyncTrigger;
  dateFrom?: string;
  dateTo?: string;
  correlationId?: string | null;
  provider?: Ga4ReportingProvider;
  now?: Date;
};

export function computeGa4DimensionKeyHash(input: {
  normalisedLandingPage: string;
  defaultChannelGroup: string;
  source: string;
  medium: string;
}): string {
  const payload = [
    input.normalisedLandingPage,
    input.defaultChannelGroup,
    input.source,
    input.medium,
  ].join('\0');
  return createHash('sha256').update(payload).digest('hex');
}

function dateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function toOptionalDecimal(value: number | null): Prisma.Decimal | null {
  if (value == null || !Number.isFinite(value)) return null;
  return new Prisma.Decimal(value);
}

function computeUnclassifiedLeadEvents(row: Ga4ReportRow): number | null {
  const remainder =
    row.generateLeadEvents - row.contactFormConversions - row.bookingConversions;
  if (remainder <= 0) return remainder === 0 ? 0 : null;
  return remainder;
}

async function ensureGa4ConfigRow(prisma: PrismaClient) {
  const cfg = assertGa4Configured();
  return prisma.ga4ConfigurationState.upsert({
    where: { id: 1 },
    create: { id: 1, propertyId: cfg.propertyId },
    update: { propertyId: cfg.propertyId },
  });
}

async function acquireGa4SyncLock(
  prisma: PrismaClient,
  configId: number,
  now: Date,
): Promise<string> {
  const lockToken = randomBytes(24).toString('hex');
  const staleBefore = new Date(now.getTime() - GA4_SYNC_LOCK_STALE_MS);
  const acquired = await prisma.ga4ConfigurationState.updateMany({
    where: {
      id: configId,
      OR: [{ syncLockToken: null }, { syncLockedAt: { lt: staleBefore } }],
    },
    data: { syncLockToken: lockToken, syncLockedAt: now },
  });
  if (acquired.count !== 1) {
    throw conflict(
      'A Google Analytics 4 sync is already in progress.',
      { configId },
      AUTOPILOT_ERROR_CODES.GA4_SYNC_IN_PROGRESS,
    );
  }
  return lockToken;
}

async function releaseGa4SyncLock(
  prisma: PrismaClient,
  configId: number,
  lockToken: string,
): Promise<void> {
  await prisma.ga4ConfigurationState.updateMany({
    where: { id: configId, syncLockToken: lockToken },
    data: { syncLockToken: null, syncLockedAt: null },
  });
}

async function resolveSeoPageId(
  prisma: PrismaClient,
  landingPage: string,
): Promise<number | null> {
  try {
    const normalised = normaliseSeoPageUrl(landingPage);
    if (!normalised.ok) return null;
    const page = await prisma.seoPage.findUnique({
      where: { canonicalUrlHash: normalised.canonicalUrlHash },
      select: { id: true },
    });
    if (page) {
      await registerSeoPageAlias(prisma, {
        observedUrl: landingPage,
        source: 'GA4',
        pageType: classifySeoPagePath(normalised.path),
      });
      return page.id;
    }
    const registered = await registerSeoPageAlias(prisma, {
      observedUrl: landingPage,
      source: 'GA4',
      pageType: 'landing',
    });
    return registered.ok ? registered.seoPageId : null;
  } catch {
    return null;
  }
}

type PreparedMetricRow = {
  row: Ga4ReportRow;
  seoPageId: number | null;
  observedLandingPageHash: string;
  normalisedLandingPage: string;
  normalisedLandingPageHash: string;
  dimensionKeyHash: string;
};

async function prepareMetricRows(
  prisma: PrismaClient,
  rows: Ga4ReportRow[],
): Promise<PreparedMetricRow[]> {
  const prepared: PreparedMetricRow[] = [];
  for (const row of rows) {
    try {
      const observedLandingPageHash = hashSeoUrl(row.landingPage);
      const normalised = normaliseSeoPageUrl(row.landingPage);
      const normalisedLandingPage = normalised.ok
        ? normalised.canonicalUrl
        : row.landingPage;
      const normalisedLandingPageHash = normalised.ok
        ? normalised.canonicalUrlHash
        : observedLandingPageHash;
      const dimensionKeyHash = computeGa4DimensionKeyHash({
        normalisedLandingPage,
        defaultChannelGroup: row.defaultChannelGroup,
        source: row.source,
        medium: row.medium,
      });
      const seoPageId = await resolveSeoPageId(prisma, row.landingPage);
      prepared.push({
        row,
        seoPageId,
        observedLandingPageHash,
        normalisedLandingPage,
        normalisedLandingPageHash,
        dimensionKeyHash,
      });
    } catch {
      // Malformed landing page must not fail the entire sync.
    }
  }
  return prepared;
}

async function upsertGa4Metrics(
  prisma: PrismaClient,
  syncRunId: number,
  metricDate: string,
  rows: Ga4ReportRow[],
): Promise<{ upserted: number; unmatchedPages: number }> {
  let upserted = 0;
  let unmatchedPages = 0;
  const prepared = await prepareMetricRows(prisma, rows);
  for (const chunkStart of Array.from(
    { length: Math.ceil(prepared.length / GA4_SYNC_UPSERT_CHUNK) },
    (_, i) => i * GA4_SYNC_UPSERT_CHUNK,
  )) {
    const chunk = prepared.slice(chunkStart, chunkStart + GA4_SYNC_UPSERT_CHUNK);
    await prisma.$transaction(
      chunk.map((item) => {
        if (item.seoPageId == null) unmatchedPages += 1;
        const unclassifiedLeadEvents = computeUnclassifiedLeadEvents(item.row);
        return prisma.ga4PageMetric.upsert({
          where: {
            metricDate_dimensionKeyHash: {
              metricDate: dateOnly(metricDate),
              dimensionKeyHash: item.dimensionKeyHash,
            },
          },
          create: {
            syncRunId,
            metricDate: dateOnly(metricDate),
            seoPageId: item.seoPageId,
            observedLandingPage: item.row.landingPage,
            observedLandingPageHash: item.observedLandingPageHash,
            normalisedLandingPage: item.normalisedLandingPage,
            normalisedLandingPageHash: item.normalisedLandingPageHash,
            dimensionKeyHash: item.dimensionKeyHash,
            source: item.row.source,
            medium: item.row.medium,
            defaultChannelGroup: item.row.defaultChannelGroup,
            sessions: item.row.sessions,
            organicSessions: item.row.organicSessions,
            engagedSessions: item.row.engagedSessions,
            engagementRate: toOptionalDecimal(item.row.engagementRate),
            averageEngagementTime: toOptionalDecimal(item.row.averageEngagementTime),
            keyEvents: item.row.keyEvents,
            generateLeadEvents: item.row.generateLeadEvents,
            contactFormConversions: item.row.contactFormConversions,
            bookingConversions: item.row.bookingConversions,
            unclassifiedLeadEvents,
            qaLeadEvents: null,
          },
          update: {
            syncRunId,
            seoPageId: item.seoPageId,
            observedLandingPage: item.row.landingPage,
            observedLandingPageHash: item.observedLandingPageHash,
            normalisedLandingPage: item.normalisedLandingPage,
            normalisedLandingPageHash: item.normalisedLandingPageHash,
            sessions: item.row.sessions,
            organicSessions: item.row.organicSessions,
            engagedSessions: item.row.engagedSessions,
            engagementRate: toOptionalDecimal(item.row.engagementRate),
            averageEngagementTime: toOptionalDecimal(item.row.averageEngagementTime),
            keyEvents: item.row.keyEvents,
            generateLeadEvents: item.row.generateLeadEvents,
            contactFormConversions: item.row.contactFormConversions,
            bookingConversions: item.row.bookingConversions,
            unclassifiedLeadEvents,
          },
        });
      }),
    );
    upserted += chunk.length;
  }
  return { upserted, unmatchedPages };
}

function serializeSyncRun(run: Record<string, unknown>) {
  const dateFrom = run.dateFrom instanceof Date ? run.dateFrom.toISOString().slice(0, 10) : run.dateFrom;
  const dateTo = run.dateTo instanceof Date ? run.dateTo.toISOString().slice(0, 10) : run.dateTo;
  return {
    id: run.id,
    trigger: run.trigger,
    status: run.status,
    dateFrom,
    dateTo,
    requestsMade: run.requestsMade,
    daysProcessed: run.daysProcessed,
    rowsFetched: run.rowsFetched,
    rowsUpserted: run.rowsUpserted,
    unmatchedPages: run.unmatchedPages ?? 0,
    startedAt:
      run.startedAt instanceof Date ? run.startedAt.toISOString() : (run.startedAt as string | null),
    completedAt:
      run.completedAt instanceof Date
        ? run.completedAt.toISOString()
        : (run.completedAt as string | null),
    errorCode: run.errorCode ?? null,
    errorMessage: run.errorMessage ?? null,
    createdAt:
      run.createdAt instanceof Date ? run.createdAt.toISOString() : (run.createdAt as string),
  };
}

export async function runGa4Sync(prisma: PrismaClient, input: RunGa4SyncInput) {
  assertGa4Configured();
  const cfg = assertGa4Configured();
  const now = input.now ?? new Date();
  const resolved = validateGa4SyncDateRange({
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
    now,
  });
  const { dateFrom, dateTo } = resolved;
  const provider = input.provider ?? createDefaultGa4ReportingProvider();

  const config = await ensureGa4ConfigRow(prisma);
  const syncRun = await prisma.ga4SyncRun.create({
    data: {
      configId: config.id,
      trigger: input.trigger,
      status: 'QUEUED',
      dateFrom: dateOnly(dateFrom),
      dateTo: dateOnly(dateTo),
      requestedById: input.actorId ?? null,
    },
  });

  await appendActivityLog(prisma, {
    entityType: 'ga4_sync_run',
    entityId: String(syncRun.id),
    eventType: 'ga4_sync_started',
    actorType: input.actorId ? 'user' : 'system',
    actorId: input.actorId ?? null,
    source: input.trigger === 'MANUAL' ? 'admin' : 'worker',
    metadata: { dateFrom, dateTo, propertyId: cfg.propertyId },
    correlationId: input.correlationId ?? null,
  });

  let lockToken: string | null = null;
  let requestsMade = 0;
  let daysProcessed = 0;
  let rowsFetched = 0;
  let rowsUpserted = 0;
  let unmatchedPages = 0;

  try {
    lockToken = await acquireGa4SyncLock(prisma, config.id, now);
    await prisma.ga4SyncRun.update({
      where: { id: syncRun.id },
      data: { status: 'RUNNING', startedAt: now },
    });

    let cursor = dateFrom;
    while (cursor <= dateTo) {
      const rows = await provider.runLandingPageReport({
        propertyId: cfg.propertyId,
        dateFrom: cursor,
        dateTo: cursor,
      });
      requestsMade += 1;
      rowsFetched += rows.length;
      const dayResult = await upsertGa4Metrics(prisma, syncRun.id, cursor, rows);
      rowsUpserted += dayResult.upserted;
      unmatchedPages += dayResult.unmatchedPages;
      daysProcessed += 1;
      cursor = addDaysToDateString(cursor, 1);
      await prisma.ga4SyncRun.update({
        where: { id: syncRun.id },
        data: { requestsMade, daysProcessed, rowsFetched, rowsUpserted, unmatchedPages },
      });
    }

    const completedAt = new Date();
    const succeeded = await prisma.ga4SyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'SUCCEEDED',
        completedAt,
        requestsMade,
        daysProcessed,
        rowsFetched,
        rowsUpserted,
        unmatchedPages,
        errorCode: null,
        errorMessage: null,
      },
    });

    await prisma.ga4ConfigurationState.update({
      where: { id: config.id },
      data: {
        lastSuccessfulSyncAt: completedAt,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });

    await appendActivityLog(prisma, {
      entityType: 'ga4_sync_run',
      entityId: String(syncRun.id),
      eventType: 'ga4_sync_succeeded',
      actorType: input.actorId ? 'user' : 'system',
      actorId: input.actorId ?? null,
      source: input.trigger === 'MANUAL' ? 'admin' : 'worker',
      metadata: { daysProcessed, rowsUpserted, unmatchedPages },
      correlationId: input.correlationId ?? null,
    });

    return { syncRun: serializeSyncRun(succeeded as unknown as Record<string, unknown>), configId: config.id };
  } catch (error) {
    const errorCode = error instanceof AutopilotError ? error.code : 'GA4_SYNC_FAILED';
    const errorMessage =
      error instanceof AutopilotError ? error.message : sanitizeGa4ErrorMessage(error);
    const finalStatus = daysProcessed > 0 ? 'PARTIAL' : 'FAILED';

    const failed = await prisma.ga4SyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        requestsMade,
        daysProcessed,
        rowsFetched,
        rowsUpserted,
        unmatchedPages,
        errorCode,
        errorMessage,
      },
    });

    await prisma.ga4ConfigurationState.update({
      where: { id: config.id },
      data: { lastErrorCode: errorCode, lastErrorMessage: errorMessage },
    });

    await appendActivityLog(prisma, {
      entityType: 'ga4_sync_run',
      entityId: String(syncRun.id),
      eventType: finalStatus === 'PARTIAL' ? 'ga4_sync_partial' : 'ga4_sync_failed',
      actorType: input.actorId ? 'user' : 'system',
      actorId: input.actorId ?? null,
      source: input.trigger === 'MANUAL' ? 'admin' : 'worker',
      metadata: { daysProcessed, errorCode },
      correlationId: input.correlationId ?? null,
    });

    if (error instanceof AutopilotError) throw error;
    throw new AutopilotError(errorCode, errorMessage, 500);
  } finally {
    if (lockToken) await releaseGa4SyncLock(prisma, config.id, lockToken);
  }
}

export async function testGa4Connection(
  prisma: PrismaClient,
  provider?: Ga4ReportingProvider,
): Promise<{ ok: boolean; errorCode?: string; errorMessage?: string }> {
  assertGa4Configured();
  const cfg = assertGa4Configured();
  const resolvedProvider = provider ?? createDefaultGa4ReportingProvider();
  const configValidation = resolvedProvider.validateConfiguration();
  if (!configValidation.ok) return configValidation;
  const access = await resolvedProvider.testConnection(cfg.propertyId);
  if (access.ok) {
    await ensureGa4ConfigRow(prisma);
  }
  return access;
}

export async function listGa4SyncRuns(
  prisma: PrismaClient,
  query: { limit?: number; offset?: number } = {},
) {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);
  const [items, total] = await Promise.all([
    prisma.ga4SyncRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.ga4SyncRun.count(),
  ]);

  return {
    items: items.map((run) => serializeSyncRun(run as unknown as Record<string, unknown>)),
    total,
    limit,
    offset,
  };
}

export async function getGa4ReportingStatus(prisma: PrismaClient) {
  const config = await prisma.ga4ConfigurationState.findUnique({ where: { id: 1 } });
  const bounds = getGa4PublicConfigStatus(process.env, {
    lastSuccessfulSync: config?.lastSuccessfulSyncAt?.toISOString() ?? null,
    currentErrorCode: config?.lastErrorCode ?? null,
    currentErrorMessage: config?.lastErrorMessage ?? null,
    syncLocked: Boolean(config?.syncLockToken),
  });

  const latestMetric = await prisma.ga4PageMetric.findFirst({
    orderBy: { metricDate: 'desc' },
    select: { metricDate: true },
  });

  const recentSyncRuns = await prisma.ga4SyncRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    configuration: bounds,
    latestMetricDate: latestMetric?.metricDate.toISOString().slice(0, 10) ?? null,
    recentSyncRuns: recentSyncRuns.map((run) =>
      serializeSyncRun(run as unknown as Record<string, unknown>),
    ),
  };
}

/** @deprecated use resolveGa4SyncDateBounds from ga4SyncDateValidation */
export function computeGa4LatestSafeDate(now: Date = new Date()): string {
  const cfg = getGa4PublicConfigStatus(process.env, { now });
  return cfg.latestSafeDate ?? '';
}
