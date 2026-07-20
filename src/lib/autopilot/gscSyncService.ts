/**
 * Google Search Console sync engine (manual + schedule-ready).
 */

import { createHash, randomBytes } from 'node:crypto';
import { Prisma, type GscSyncTrigger, type PrismaClient } from '@prisma/client';
import { appendActivityLog } from './activityLogService.ts';
import {
  AutopilotError,
  AUTOPILOT_ERROR_CODES,
  conflict,
  validationError,
} from './apiErrors.ts';
import { assertGscConfigured, getGscPublicConfigStatus } from './gscConfig.ts';
import {
  classifyGscGoogleError,
  createDefaultGscGoogleApi,
  decryptStoredRefreshToken,
  sanitizeGscErrorMessage,
  type GscGoogleApi,
  type GscSearchAnalyticsRow,
} from './gscClient.ts';
import { loadActiveGscConnectionForSync } from './gscConnectionService.ts';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';

export const GSC_SYNC_ROW_LIMIT = 25000;
export const GSC_SYNC_MAX_PAGES_PER_DAY = 40;
export const GSC_SYNC_UPSERT_CHUNK = 400;
export const GSC_SYNC_LOCK_STALE_MS = 60 * 60 * 1000;
export const GSC_PACIFIC_TZ = 'America/Los_Angeles';

export type RunGscSyncInput = {
  actorId?: number | null;
  trigger: GscSyncTrigger;
  dateFrom?: string | Date;
  dateTo?: string | Date;
  searchType?: string;
  correlationId?: string | null;
  googleApi?: GscGoogleApi;
  now?: Date;
};

export type GscSyncResultDto = {
  syncRun: Record<string, unknown>;
  connectionId: number;
};

export type GscDateWindow = {
  dateFrom: string;
  dateTo: string;
};

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Calendar date in America/Los_Angeles as YYYY-MM-DD. */
export function getPacificDateString(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: GSC_PACIFIC_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !d) {
    throw new Error('Unable to resolve Pacific calendar date.');
  }
  return `${y}-${m}-${d}`;
}

export function addDaysToDateString(dateStr: string, deltaDays: number): string {
  const [y, m, d] = dateStr.split('-').map((v) => Number.parseInt(v, 10));
  const utc = Date.UTC(y, m - 1, d) + deltaDays * 24 * 60 * 60 * 1000;
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export function computeDefaultGscDateWindow(
  now: Date = new Date(),
  options?: { lookbackDays?: number; dataDelayDays?: number },
): GscDateWindow {
  const publicCfg = getGscPublicConfigStatus();
  const lookbackDays = options?.lookbackDays ?? publicCfg.lookbackDays;
  const dataDelayDays = options?.dataDelayDays ?? publicCfg.dataDelayDays;
  const todayPacific = getPacificDateString(now);
  const dateTo = addDaysToDateString(todayPacific, -dataDelayDays);
  const dateFrom = addDaysToDateString(dateTo, -(lookbackDays - 1));
  return { dateFrom, dateTo };
}

export function enumerateDateStringsInclusive(dateFrom: string, dateTo: string): string[] {
  if (dateFrom > dateTo) {
    throw validationError('dateFrom must be on or before dateTo.', { dateFrom, dateTo });
  }
  const days: string[] = [];
  let cursor = dateFrom;
  let guard = 0;
  while (cursor <= dateTo) {
    days.push(cursor);
    cursor = addDaysToDateString(cursor, 1);
    guard += 1;
    if (guard > 400) {
      throw validationError('Date range is too large.', { dateFrom, dateTo });
    }
  }
  return days;
}

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function parseDateInput(value: string | Date | undefined, field: string): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw validationError(`Invalid ${field}.`, { field });
    }
    return value.toISOString().slice(0, 10);
  }
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw validationError(`Invalid ${field}; expected YYYY-MM-DD.`, { field });
  }
  return trimmed;
}

function dateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function serializeSyncRun(run: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...run };
  for (const key of ['dateFrom', 'dateTo', 'startedAt', 'completedAt', 'createdAt', 'updatedAt'] as const) {
    const value = out[key];
    if (value instanceof Date) {
      out[key] =
        key === 'dateFrom' || key === 'dateTo'
          ? value.toISOString().slice(0, 10)
          : value.toISOString();
    }
  }
  return out;
}

function toDecimal(value: number | null | undefined): Prisma.Decimal {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return new Prisma.Decimal(n);
}

export type PreparedMetricRow = {
  metricDate: Date;
  rawQuery: string;
  normalisedQuery: string;
  queryHash: string;
  page: string;
  pageHash: string;
  searchType: string;
  clicks: Prisma.Decimal;
  impressions: Prisma.Decimal;
  ctr: Prisma.Decimal;
  position: Prisma.Decimal;
};

export function mapSearchAnalyticsRowsToMetrics(
  rows: GscSearchAnalyticsRow[],
  metricDate: string,
  searchType: string,
): PreparedMetricRow[] {
  const date = dateOnly(metricDate);
  const prepared: PreparedMetricRow[] = [];
  for (const row of rows) {
    const keys = row.keys ?? [];
    const rawQuery = typeof keys[0] === 'string' ? keys[0] : '';
    const page = typeof keys[1] === 'string' ? keys[1] : '';
    const normalised = normaliseAutopilotKeyword(rawQuery);
    prepared.push({
      metricDate: date,
      rawQuery,
      normalisedQuery: normalised.normalised,
      queryHash: sha256Hex(rawQuery),
      page,
      pageHash: sha256Hex(page),
      searchType,
      clicks: toDecimal(row.clicks ?? 0),
      impressions: toDecimal(row.impressions ?? 0),
      ctr: toDecimal(row.ctr ?? 0),
      position: toDecimal(row.position ?? 0),
    });
  }
  return prepared;
}

async function upsertMetricChunk(
  prisma: PrismaClient,
  connectionId: number,
  rows: PreparedMetricRow[],
): Promise<number> {
  let upserted = 0;
  for (let i = 0; i < rows.length; i += GSC_SYNC_UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + GSC_SYNC_UPSERT_CHUNK);
    await prisma.$transaction(
      chunk.map((row) =>
        prisma.gscQueryPageMetric.upsert({
          where: {
            connectionId_metricDate_queryHash_pageHash_searchType: {
              connectionId,
              metricDate: row.metricDate,
              queryHash: row.queryHash,
              pageHash: row.pageHash,
              searchType: row.searchType,
            },
          },
          create: {
            connectionId,
            metricDate: row.metricDate,
            rawQuery: row.rawQuery,
            normalisedQuery: row.normalisedQuery,
            queryHash: row.queryHash,
            page: row.page,
            pageHash: row.pageHash,
            searchType: row.searchType,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          },
          update: {
            rawQuery: row.rawQuery,
            normalisedQuery: row.normalisedQuery,
            page: row.page,
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
          },
        }),
      ),
    );
    upserted += chunk.length;
  }
  return upserted;
}

async function acquireSyncLock(
  prisma: PrismaClient,
  connectionId: number,
  now: Date,
): Promise<string> {
  const lockToken = randomBytes(24).toString('hex');
  const staleBefore = new Date(now.getTime() - GSC_SYNC_LOCK_STALE_MS);

  const acquired = await prisma.gscConnection.updateMany({
    where: {
      id: connectionId,
      OR: [{ syncLockToken: null }, { syncLockedAt: { lt: staleBefore } }],
    },
    data: {
      syncLockToken: lockToken,
      syncLockedAt: now,
    },
  });

  if (acquired.count !== 1) {
    throw conflict(
      'A Google Search Console sync is already in progress.',
      { connectionId },
      AUTOPILOT_ERROR_CODES.GSC_SYNC_IN_PROGRESS,
    );
  }

  return lockToken;
}

async function releaseSyncLock(
  prisma: PrismaClient,
  connectionId: number,
  lockToken: string,
): Promise<void> {
  await prisma.gscConnection.updateMany({
    where: { id: connectionId, syncLockToken: lockToken },
    data: { syncLockToken: null, syncLockedAt: null },
  });
}

export async function runGscSync(
  prisma: PrismaClient,
  input: RunGscSyncInput,
): Promise<GscSyncResultDto> {
  assertGscConfigured();
  const now = input.now ?? new Date();
  const searchType = (input.searchType ?? 'web').trim() || 'web';
  const defaults = computeDefaultGscDateWindow(now);
  const dateFrom = parseDateInput(input.dateFrom, 'dateFrom') ?? defaults.dateFrom;
  const dateTo = parseDateInput(input.dateTo, 'dateTo') ?? defaults.dateTo;
  const days = enumerateDateStringsInclusive(dateFrom, dateTo);

  const connection = await loadActiveGscConnectionForSync(prisma);
  const siteUrl = connection.siteUrl!;
  const googleApi = input.googleApi ?? createDefaultGscGoogleApi();

  const syncRun = await prisma.gscSyncRun.create({
    data: {
      connectionId: connection.id,
      trigger: input.trigger,
      status: 'QUEUED',
      dateFrom: dateOnly(dateFrom),
      dateTo: dateOnly(dateTo),
      searchType,
      dataState: 'final',
      requestedById: input.actorId ?? null,
    },
  });

  await appendActivityLog(prisma, {
    entityType: 'gsc_sync_run',
    entityId: String(syncRun.id),
    eventType: 'gsc_sync_started',
    actorType: input.actorId ? 'user' : 'system',
    actorId: input.actorId ?? null,
    source: input.trigger === 'MANUAL' ? 'admin' : 'worker',
    metadata: {
      connectionId: connection.id,
      siteUrl,
      trigger: input.trigger,
      dateFrom,
      dateTo,
      searchType,
    },
    correlationId: input.correlationId ?? null,
  });

  let lockToken: string | null = null;
  let requestsMade = 0;
  let daysProcessed = 0;
  let rowsFetched = 0;
  let rowsUpserted = 0;

  try {
    lockToken = await acquireSyncLock(prisma, connection.id, now);

    await prisma.gscSyncRun.update({
      where: { id: syncRun.id },
      data: { status: 'RUNNING', startedAt: now },
    });

    const refreshToken = decryptStoredRefreshToken(connection);

    for (const day of days) {
      let startRow = 0;
      for (let page = 0; page < GSC_SYNC_MAX_PAGES_PER_DAY; page += 1) {
        const rows = await googleApi.querySearchAnalytics(refreshToken, {
          siteUrl,
          startDate: day,
          endDate: day,
          dimensions: ['query', 'page'],
          type: searchType,
          dataState: 'final',
          aggregationType: 'auto',
          rowLimit: GSC_SYNC_ROW_LIMIT,
          startRow,
        });
        requestsMade += 1;

        if (!rows.length) break;

        rowsFetched += rows.length;
        const prepared = mapSearchAnalyticsRowsToMetrics(rows, day, searchType);
        rowsUpserted += await upsertMetricChunk(prisma, connection.id, prepared);

        if (rows.length < GSC_SYNC_ROW_LIMIT) break;
        startRow += GSC_SYNC_ROW_LIMIT;
      }
      daysProcessed += 1;

      await prisma.gscSyncRun.update({
        where: { id: syncRun.id },
        data: { requestsMade, daysProcessed, rowsFetched, rowsUpserted },
      });
    }

    const completedAt = new Date();
    const succeeded = await prisma.gscSyncRun.update({
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

    await prisma.gscConnection.update({
      where: { id: connection.id },
      data: {
        lastSuccessfulSyncAt: completedAt,
        lastValidatedAt: completedAt,
        lastErrorCode: null,
        lastErrorMessage: null,
      },
    });

    await appendActivityLog(prisma, {
      entityType: 'gsc_sync_run',
      entityId: String(succeeded.id),
      eventType: 'gsc_sync_completed',
      actorType: input.actorId ? 'user' : 'system',
      actorId: input.actorId ?? null,
      source: input.trigger === 'MANUAL' ? 'admin' : 'worker',
      metadata: {
        connectionId: connection.id,
        siteUrl,
        trigger: input.trigger,
        dateFrom,
        dateTo,
        requestsMade,
        daysProcessed,
        rowsFetched,
        rowsUpserted,
      },
      correlationId: input.correlationId ?? null,
    });

    return {
      syncRun: serializeSyncRun(succeeded as unknown as Record<string, unknown>),
      connectionId: connection.id,
    };
  } catch (error) {
    const classified = classifyGscGoogleError(error);
    const errorCode =
      error instanceof AutopilotError ? error.code : classified.code;
    const errorMessage =
      error instanceof AutopilotError
        ? error.message
        : sanitizeGscErrorMessage(error);

    const failed = await prisma.gscSyncRun.update({
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

    const connectionUpdate: Prisma.GscConnectionUpdateInput = {
      lastErrorCode: errorCode,
      lastErrorMessage: errorMessage,
    };
    if (classified.needsReauth || errorCode === AUTOPILOT_ERROR_CODES.GSC_REAUTHORISATION_REQUIRED) {
      connectionUpdate.status = 'NEEDS_REAUTHENTICATION';
    }
    await prisma.gscConnection.update({
      where: { id: connection.id },
      data: connectionUpdate,
    });

    await appendActivityLog(prisma, {
      entityType: 'gsc_sync_run',
      entityId: String(failed.id),
      eventType: 'gsc_sync_failed',
      actorType: input.actorId ? 'user' : 'system',
      actorId: input.actorId ?? null,
      source: input.trigger === 'MANUAL' ? 'admin' : 'worker',
      metadata: {
        connectionId: connection.id,
        siteUrl,
        trigger: input.trigger,
        dateFrom,
        dateTo,
        errorCode,
        requestsMade,
        daysProcessed,
        rowsFetched,
        rowsUpserted,
      },
      reason: errorMessage,
      correlationId: input.correlationId ?? null,
    }).catch(() => undefined);

    if (error instanceof AutopilotError) throw error;
    throw new AutopilotError(errorCode, errorMessage, classified.needsReauth ? 401 : 500);
  } finally {
    if (lockToken) {
      await releaseSyncLock(prisma, connection.id, lockToken);
    }
  }
}

export async function listGscSyncRuns(
  prisma: PrismaClient,
  query: { limit?: number; offset?: number } = {},
) {
  const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);
  const [items, total] = await Promise.all([
    prisma.gscSyncRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.gscSyncRun.count(),
  ]);

  return {
    items: items.map((run) => serializeSyncRun(run as unknown as Record<string, unknown>)),
    total,
    limit,
    offset,
  };
}
