/**
 * GA4 aggregate sync engine with locking and safe errors.
 */

import { randomBytes } from 'node:crypto';
import { Prisma, type Ga4SyncTrigger, type PrismaClient } from '@prisma/client';
import { appendActivityLog } from '../autopilot/activityLogService.ts';
import {
  AutopilotError,
  AUTOPILOT_ERROR_CODES,
  conflict,
} from '../autopilot/apiErrors.ts';
import {
  addDaysToDateString,
  computeDefaultGscDateWindow,
  getPacificDateString,
} from '../autopilot/gscDateUtils.ts';
import { assertGa4Configured, getGa4PublicConfigStatus } from './ga4Config.ts';
import {
  createDefaultGa4ReportingProvider,
  sanitizeGa4ErrorMessage,
  type Ga4ReportingProvider,
  type Ga4ReportingRow,
} from './ga4ReportingProvider.ts';
import { registerSeoPageAlias } from './seoPageIdentityService.ts';
import { hashSeoUrl, normaliseSeoPageUrl } from './seoUrlNormalization.ts';

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

function computeDefaultGa4DateWindow(now: Date = new Date()) {
  const cfg = getGa4PublicConfigStatus();
  return computeDefaultGscDateWindow(now, {
    lookbackDays: cfg.defaultLookback,
    dataDelayDays: cfg.dataDelayDays,
  });
}

function dateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
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

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(Number.isFinite(value) ? value : 0);
}

async function resolveSeoPageId(
  prisma: PrismaClient,
  landingPage: string,
): Promise<number | null> {
  const normalised = normaliseSeoPageUrl(landingPage);
  if (!normalised.ok) return null;
  const page = await prisma.seoPage.findUnique({
    where: { canonicalUrlHash: normalised.canonicalUrlHash },
    select: { id: true },
  });
  if (page) return page.id;
  const registered = await registerSeoPageAlias(prisma, {
    observedUrl: landingPage,
    source: 'GA4',
    pageType: 'landing',
  });
  return registered.ok ? registered.seoPageId : null;
}

async function upsertGa4Metrics(
  prisma: PrismaClient,
  syncRunId: number,
  metricDate: string,
  rows: Ga4ReportingRow[],
): Promise<number> {
  let upserted = 0;
  for (let i = 0; i < rows.length; i += GA4_SYNC_UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + GA4_SYNC_UPSERT_CHUNK);
    const prepared = await Promise.all(
      chunk.map(async (row) => ({
        row,
        seoPageId: await resolveSeoPageId(prisma, row.landingPage),
        observedLandingPageHash: hashSeoUrl(row.landingPage),
      })),
    );

    await prisma.$transaction(
      prepared.map(({ row, seoPageId, observedLandingPageHash }) =>
        prisma.ga4PageMetric.upsert({
          where: {
            metricDate_observedLandingPageHash_source_medium_defaultChannelGroup: {
              metricDate: dateOnly(metricDate),
              observedLandingPageHash,
              source: row.source,
              medium: row.medium,
              defaultChannelGroup: row.defaultChannelGroup,
            },
          },
          create: {
            syncRunId,
            metricDate: dateOnly(metricDate),
            seoPageId,
            observedLandingPage: row.landingPage,
            observedLandingPageHash,
            source: row.source,
            medium: row.medium,
            defaultChannelGroup: row.defaultChannelGroup,
            sessions: toDecimal(row.sessions),
            organicSessions: toDecimal(row.organicSessions),
            engagedSessions: toDecimal(row.engagedSessions),
            engagementRate: toDecimal(row.engagementRate),
            averageEngagementTime: toDecimal(row.averageEngagementTime),
            keyEvents: toDecimal(row.keyEvents),
            generateLeadEvents: toDecimal(row.generateLeadEvents),
            contactFormConversions: toDecimal(row.contactFormConversions),
            bookingConversions: toDecimal(row.bookingConversions),
          },
          update: {
            syncRunId,
            seoPageId,
            observedLandingPage: row.landingPage,
            sessions: toDecimal(row.sessions),
            organicSessions: toDecimal(row.organicSessions),
            engagedSessions: toDecimal(row.engagedSessions),
            engagementRate: toDecimal(row.engagementRate),
            averageEngagementTime: toDecimal(row.averageEngagementTime),
            keyEvents: toDecimal(row.keyEvents),
            generateLeadEvents: toDecimal(row.generateLeadEvents),
            contactFormConversions: toDecimal(row.contactFormConversions),
            bookingConversions: toDecimal(row.bookingConversions),
          },
        }),
      ),
    );
    upserted += chunk.length;
  }
  return upserted;
}

export async function runGa4Sync(prisma: PrismaClient, input: RunGa4SyncInput) {
  assertGa4Configured();
  const cfg = assertGa4Configured();
  const now = input.now ?? new Date();
  const defaults = computeDefaultGa4DateWindow(now);
  const dateFrom = input.dateFrom ?? defaults.dateFrom;
  const dateTo = input.dateTo ?? defaults.dateTo;
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
      rowsUpserted += await upsertGa4Metrics(prisma, syncRun.id, cursor, rows);
      daysProcessed += 1;
      cursor = addDaysToDateString(cursor, 1);
      await prisma.ga4SyncRun.update({
        where: { id: syncRun.id },
        data: { requestsMade, daysProcessed, rowsFetched, rowsUpserted },
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

    return { syncRun: succeeded, configId: config.id };
  } catch (error) {
    const errorCode = error instanceof AutopilotError ? error.code : 'GA4_SYNC_FAILED';
    const errorMessage =
      error instanceof AutopilotError ? error.message : sanitizeGa4ErrorMessage(error);

    const failed = await prisma.ga4SyncRun.update({
      where: { id: syncRun.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        requestsMade,
        daysProcessed,
        rowsFetched,
        rowsUpserted,
        errorCode,
        errorMessage,
      },
    });

    await prisma.ga4ConfigurationState.update({
      where: { id: config.id },
      data: { lastErrorCode: errorCode, lastErrorMessage: errorMessage },
    });

    if (error instanceof AutopilotError) throw error;
    throw new AutopilotError(errorCode, errorMessage, 500);
  } finally {
    if (lockToken) await releaseGa4SyncLock(prisma, config.id, lockToken);
  }
}

export function computeGa4LatestSafeDate(now: Date = new Date()): string {
  const cfg = getGa4PublicConfigStatus();
  const todayPacific = getPacificDateString(now);
  return addDaysToDateString(todayPacific, -cfg.dataDelayDays);
}

export async function getGa4ReportingStatus(prisma: PrismaClient) {
  const config = await prisma.ga4ConfigurationState.findUnique({ where: { id: 1 } });
  const latestSafeDate = computeGa4LatestSafeDate();
  const recentSyncRuns = await prisma.ga4SyncRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return {
    configuration: getGa4PublicConfigStatus(process.env, {
      latestSafeDate,
      lastSuccessfulSync: config?.lastSuccessfulSyncAt?.toISOString() ?? null,
      currentErrorCode: config?.lastErrorCode ?? null,
      currentErrorMessage: config?.lastErrorMessage ?? null,
      syncLocked: Boolean(config?.syncLockToken),
    }),
    recentSyncRuns: recentSyncRuns.map((run) => ({
      id: run.id,
      trigger: run.trigger,
      status: run.status,
      dateFrom: run.dateFrom.toISOString().slice(0, 10),
      dateTo: run.dateTo.toISOString().slice(0, 10),
      requestsMade: run.requestsMade,
      daysProcessed: run.daysProcessed,
      rowsFetched: run.rowsFetched,
      rowsUpserted: run.rowsUpserted,
      startedAt: run.startedAt?.toISOString() ?? null,
      completedAt: run.completedAt?.toISOString() ?? null,
      errorCode: run.errorCode,
      errorMessage: run.errorMessage,
      createdAt: run.createdAt.toISOString(),
    })),
  };
}
