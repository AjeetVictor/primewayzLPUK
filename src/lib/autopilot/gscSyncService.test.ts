import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { AutopilotError } from './apiErrors.ts';
import { encryptGscRefreshToken } from './gscCrypto.ts';
import type { GscGoogleApi, GscSearchAnalyticsRow } from './gscClient.ts';
import {
  addDaysToDateString,
  computeDefaultGscDateWindow,
  GSC_SYNC_LOCK_STALE_MS,
  GSC_SYNC_ROW_LIMIT,
  mapSearchAnalyticsRowsToMetrics,
  runGscSync,
  sha256Hex,
} from './gscSyncService.ts';

const ENC_KEY = randomBytes(32);

function setGscEnv() {
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET = 'csecret';
  process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI =
    'http://localhost:3000/api/admin/autopilot/gsc/oauth/callback';
  process.env.AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY = ENC_KEY.toString('base64');
  process.env.AUTOPILOT_GSC_OAUTH_STATE_SECRET = 'u'.repeat(32);
  process.env.AUTOPILOT_GSC_DEFAULT_LOOKBACK_DAYS = '28';
  process.env.AUTOPILOT_GSC_DATA_DELAY_DAYS = '3';
}

function makeRows(count: number, prefix = 'q'): GscSearchAnalyticsRow[] {
  return Array.from({ length: count }, (_, i) => ({
    keys: [`${prefix}-${i}`, `https://uk.primewayz.com/page-${i}`],
    clicks: 1,
    impressions: 10,
    ctr: 0.1,
    position: 5,
  }));
}

function createSyncPrisma(options?: {
  lockToken?: string | null;
  lockedAt?: Date | null;
}) {
  const encrypted = encryptGscRefreshToken('refresh-token', ENC_KEY);
  const connection: Record<string, unknown> = {
    id: 1,
    status: 'ACTIVE',
    siteUrl: 'sc-domain:uk.primewayz.com',
    permissionLevel: 'siteOwner',
    refreshTokenCiphertext: encrypted.ciphertext,
    refreshTokenIv: encrypted.iv,
    refreshTokenAuthTag: encrypted.authTag,
    tokenKeyVersion: 1,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    connectedById: 1,
    connectedAt: new Date(),
    isActive: true,
    syncLockToken: options?.lockToken ?? null,
    syncLockedAt: options?.lockedAt ?? null,
    lastErrorCode: null,
    lastErrorMessage: null,
    lastValidatedAt: null,
    lastSuccessfulSyncAt: null,
    updatedAt: new Date(),
  };

  const metrics = new Map<string, Record<string, unknown>>();
  const syncRuns: Array<Record<string, unknown>> = [];
  const activity: Array<Record<string, unknown>> = [];
  let nextRunId = 1;
  let nextMetricId = 1n;

  const prisma = {
    gscConnection: {
      findFirst: async () => connection,
      updateMany: async ({
        where,
        data,
      }: {
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }) => {
        if (where.id !== connection.id) return { count: 0 };

        if ('syncLockToken' in data && data.syncLockToken && where.OR) {
          const or = where.OR as Array<Record<string, unknown>>;
          const staleBefore = (or[1]?.syncLockedAt as { lt: Date } | undefined)?.lt;
          const unlocked = connection.syncLockToken == null;
          const stale =
            connection.syncLockedAt instanceof Date &&
            staleBefore instanceof Date &&
            connection.syncLockedAt.getTime() < staleBefore.getTime();
          if (!unlocked && !stale) return { count: 0 };
          Object.assign(connection, data);
          return { count: 1 };
        }

        if (
          'syncLockToken' in data &&
          data.syncLockToken === null &&
          where.syncLockToken != null
        ) {
          if (connection.syncLockToken !== where.syncLockToken) return { count: 0 };
          Object.assign(connection, data);
          return { count: 1 };
        }

        Object.assign(connection, data);
        return { count: 1 };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(connection, data);
        return connection;
      },
    },
    gscSyncRun: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = {
          id: nextRunId++,
          createdAt: new Date(),
          updatedAt: new Date(),
          requestsMade: 0,
          daysProcessed: 0,
          rowsFetched: 0,
          rowsUpserted: 0,
          startedAt: null,
          completedAt: null,
          errorCode: null,
          errorMessage: null,
          ...data,
        };
        syncRuns.push(row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) => {
        const row = syncRuns.find((r) => r.id === where.id)!;
        Object.assign(row, data, { updatedAt: new Date() });
        return row;
      },
      findMany: async () => syncRuns,
      count: async () => syncRuns.length,
    },
    gscQueryPageMetric: {
      upsert: async ({
        where,
        create,
        update,
      }: {
        where: {
          connectionId_metricDate_queryHash_pageHash_searchType: {
            connectionId: number;
            metricDate: Date;
            queryHash: string;
            pageHash: string;
            searchType: string;
          };
        };
        create: Record<string, unknown>;
        update: Record<string, unknown>;
      }) => {
        const key = [
          where.connectionId_metricDate_queryHash_pageHash_searchType.connectionId,
          where.connectionId_metricDate_queryHash_pageHash_searchType.metricDate
            .toISOString()
            .slice(0, 10),
          where.connectionId_metricDate_queryHash_pageHash_searchType.queryHash,
          where.connectionId_metricDate_queryHash_pageHash_searchType.pageHash,
          where.connectionId_metricDate_queryHash_pageHash_searchType.searchType,
        ].join('|');
        const existing = metrics.get(key);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const created = { id: nextMetricId++, ...create };
        metrics.set(key, created);
        return created;
      },
    },
    autopilotActivityLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        activity.push(data);
        return data;
      },
    },
    $transaction: async (ops: Array<Promise<unknown>> | ((tx: unknown) => Promise<unknown>)) => {
      if (typeof ops === 'function') return ops(prisma);
      return Promise.all(ops);
    },
  };

  return { prisma, connection, metrics, syncRuns, activity };
}

test('default date calculation uses delay and lookback', () => {
  setGscEnv();
  // Fixed instant: 2026-07-20 12:00 UTC ≈ Pacific morning of Jul 20
  const now = new Date('2026-07-20T19:00:00.000Z');
  const window = computeDefaultGscDateWindow(now, { lookbackDays: 28, dataDelayDays: 3 });
  assert.equal(window.dateTo, addDaysToDateString(window.dateTo, 0));
  const days =
    (Date.parse(`${window.dateTo}T00:00:00Z`) - Date.parse(`${window.dateFrom}T00:00:00Z`)) /
      86400000 +
    1;
  assert.equal(days, 28);
});

test('map rows preserve raw and normalised queries with sha256 hashes', () => {
  const prepared = mapSearchAnalyticsRowsToMetrics(
    [{ keys: ['  Hello WORLD  ', 'https://uk.primewayz.com/a'], clicks: 2, impressions: 20, ctr: 0.1, position: 3 }],
    '2026-07-01',
    'web',
  );
  assert.equal(prepared[0].rawQuery, '  Hello WORLD  ');
  assert.equal(prepared[0].normalisedQuery, 'hello world');
  assert.equal(prepared[0].queryHash, sha256Hex('  Hello WORLD  '));
  assert.equal(prepared[0].pageHash, sha256Hex('https://uk.primewayz.com/a'));
});

test('pagination stops on short page and counts requests', async () => {
  setGscEnv();
  const { prisma, syncRuns, metrics } = createSyncPrisma();
  const calls: Array<{ startRow: number; day: string }> = [];
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async (_token, input) => {
      calls.push({ startRow: input.startRow, day: input.startDate });
      if (input.startRow === 0) return makeRows(GSC_SYNC_ROW_LIMIT);
      if (input.startRow === GSC_SYNC_ROW_LIMIT) return makeRows(10, 'tail');
      return [];
    },
  };

  const result = await runGscSync(prisma as never, {
    actorId: 1,
    trigger: 'MANUAL',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    googleApi,
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].startRow, 0);
  assert.equal(calls[1].startRow, GSC_SYNC_ROW_LIMIT);
  assert.equal(result.syncRun.status, 'SUCCEEDED');
  assert.equal(result.syncRun.requestsMade, 2);
  assert.equal(result.syncRun.rowsFetched, GSC_SYNC_ROW_LIMIT + 10);
  assert.equal(metrics.size, GSC_SYNC_ROW_LIMIT + 10);
  assert.equal(syncRuns[0].status, 'SUCCEEDED');
});

test('stops on empty first page', async () => {
  setGscEnv();
  const { prisma } = createSyncPrisma();
  let calls = 0;
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async () => {
      calls += 1;
      return [];
    },
  };
  const result = await runGscSync(prisma as never, {
    actorId: 1,
    trigger: 'MANUAL',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-02',
    googleApi,
  });
  assert.equal(calls, 2);
  assert.equal(result.syncRun.daysProcessed, 2);
  assert.equal(result.syncRun.rowsFetched, 0);
});

test('25000-row boundary continues pagination', async () => {
  setGscEnv();
  const { prisma } = createSyncPrisma();
  const startRows: number[] = [];
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async (_t, input) => {
      startRows.push(input.startRow);
      if (input.startRow === 0) return makeRows(25000);
      return makeRows(1, 'edge');
    },
  };
  await runGscSync(prisma as never, {
    actorId: 1,
    trigger: 'MANUAL',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    googleApi,
  });
  assert.deepEqual(startRows, [0, 25000]);
});

test('same rows upsert instead of duplicate', async () => {
  setGscEnv();
  const { prisma, metrics } = createSyncPrisma();
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async () => [
      { keys: ['crm software uk', 'https://uk.primewayz.com/crm'], clicks: 3, impressions: 30, ctr: 0.1, position: 4 },
    ],
  };

  await runGscSync(prisma as never, {
    actorId: 1,
    trigger: 'MANUAL',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    googleApi,
  });
  await runGscSync(prisma as never, {
    actorId: 1,
    trigger: 'MANUAL',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    googleApi: {
      ...googleApi,
      querySearchAnalytics: async () => [
        {
          keys: ['crm software uk', 'https://uk.primewayz.com/crm'],
          clicks: 9,
          impressions: 90,
          ctr: 0.1,
          position: 2,
        },
      ],
    },
  });

  assert.equal(metrics.size, 1);
  const only = [...metrics.values()][0];
  assert.equal(String(only.clicks), '9');
});

test('sync lock blocks concurrency', async () => {
  setGscEnv();
  const { prisma } = createSyncPrisma({
    lockToken: 'held',
    lockedAt: new Date(),
  });
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async () => [],
  };
  await assert.rejects(
    () =>
      runGscSync(prisma as never, {
        actorId: 1,
        trigger: 'MANUAL',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-01',
        googleApi,
      }),
    (err: unknown) =>
      err instanceof AutopilotError && err.code === 'GSC_SYNC_IN_PROGRESS',
  );
});

test('stale lock may be recovered and released after success', async () => {
  setGscEnv();
  const { prisma, connection } = createSyncPrisma({
    lockToken: 'stale-token',
    lockedAt: new Date(Date.now() - GSC_SYNC_LOCK_STALE_MS - 1000),
  });
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async () => makeRows(2),
  };
  const result = await runGscSync(prisma as never, {
    actorId: 1,
    trigger: 'MANUAL',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    googleApi,
  });
  assert.equal(result.syncRun.status, 'SUCCEEDED');
  assert.equal(connection.syncLockToken, null);
});

test('lock released after failure and invalid_grant marks reauth', async () => {
  setGscEnv();
  const { prisma, connection, syncRuns } = createSyncPrisma();
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async () => {
      throw Object.assign(new Error('invalid_grant'), { response: { data: { error: 'invalid_grant' } } });
    },
  };

  await assert.rejects(
    () =>
      runGscSync(prisma as never, {
        actorId: 1,
        trigger: 'MANUAL',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-01',
        googleApi,
      }),
    (err: unknown) => err instanceof AutopilotError,
  );

  assert.equal(connection.syncLockToken, null);
  assert.equal(connection.status, 'NEEDS_REAUTHENTICATION');
  assert.equal(syncRuns[0].status, 'FAILED');
  assert.equal(String(syncRuns[0].errorMessage || '').includes('ya29'), false);
});

test('persisted errors are sanitized', async () => {
  setGscEnv();
  const { prisma, syncRuns } = createSyncPrisma();
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async () => {
      throw new Error('failed bearer ya29.secret-access refresh_token=abc client_secret=xyz');
    },
  };
  await assert.rejects(() =>
    runGscSync(prisma as never, {
      actorId: 1,
      trigger: 'MANUAL',
      dateFrom: '2026-07-01',
      dateTo: '2026-07-01',
      googleApi,
    }),
  );
  const msg = String(syncRuns[0].errorMessage);
  assert.equal(msg.includes('ya29.secret-access'), false);
  assert.equal(msg.includes('client_secret=xyz'), false);
  assert.ok(msg.includes('[REDACTED]'));
});
