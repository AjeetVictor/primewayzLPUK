/**
 * Tests for GA4 reporting configuration and sync behaviour.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { AutopilotError } from '../autopilot/apiErrors.ts';
import { getGa4ConfigMissing, getGa4PublicConfigStatus } from './ga4Config.ts';
import { computeGa4DimensionKeyHash, runGa4Sync } from './ga4SyncService.ts';
import {
  classifyGa4ProviderError,
  sanitizeGa4ErrorMessage,
  type Ga4ReportingProvider,
} from './ga4ReportingProvider.ts';

function setGa4Env() {
  process.env.GA4_PROPERTY_ID = '123456789';
  process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL = 'ga4@project.iam.gserviceaccount.com';
  process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----';
  process.env.GA4_DEFAULT_LOOKBACK_DAYS = '28';
  process.env.GA4_DATA_DELAY_DAYS = '1';
}

test('missing GA4 config returns safe status without secrets', () => {
  const status = getGa4PublicConfigStatus({});
  assert.equal(status.configured, false);
  assert.ok(status.missing.includes('GA4_PROPERTY_ID'));
  const serialised = JSON.stringify(status);
  assert.equal(serialised.includes('PRIVATE KEY'), false);
});

test('configuration status includes lookback and date bounds metadata', () => {
  setGa4Env();
  const status = getGa4PublicConfigStatus(process.env, {
    latestSafeDate: '2026-07-19',
    syncLocked: false,
  });
  assert.equal(status.configured, true);
  assert.equal(status.propertyIdConfigured, true);
  assert.equal(status.lookbackDays, 28);
  assert.equal(status.defaultDateFrom != null, true);
});

test('dimension key hash is deterministic', () => {
  const a = computeGa4DimensionKeyHash({
    normalisedLandingPage: 'https://uk.primewayz.com/services/crm',
    defaultChannelGroup: 'Organic Search',
    source: 'google',
    medium: 'organic',
  });
  const b = computeGa4DimensionKeyHash({
    normalisedLandingPage: 'https://uk.primewayz.com/services/crm',
    defaultChannelGroup: 'Organic Search',
    source: 'google',
    medium: 'organic',
  });
  assert.equal(a, b);
  assert.equal(a.length, 64);
});

test('successful aggregate sync stores rows without PII fields', async () => {
  setGa4Env();
  const metrics = new Map<string, Record<string, unknown>>();
  const syncRuns: Array<Record<string, unknown>> = [];
  let nextMetricId = 1n;
  let configLock: string | null = null;

  const provider: Ga4ReportingProvider = {
    validateConfiguration: () => ({ ok: true }),
    validatePropertyAccess: async () => ({ ok: true }),
    testConnection: async () => ({ ok: true }),
    runLandingPageReport: async () => [
      {
        landingPage: '/services/crm',
        source: 'google',
        medium: 'organic',
        defaultChannelGroup: 'Organic Search',
        sessions: 12,
        organicSessions: 12,
        engagedSessions: 8,
        engagementRate: 0.66,
        averageEngagementTime: 42,
        keyEvents: 2,
        generateLeadEvents: 1,
        contactFormConversions: 1,
        bookingConversions: 0,
      },
    ],
  };

  const prisma = {
    ga4ConfigurationState: {
      upsert: async () => ({ id: 1, propertyId: '123456789' }),
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if ('syncLockToken' in data && data.syncLockToken && where.OR) {
          if (configLock) return { count: 0 };
          configLock = String(data.syncLockToken);
          return { count: 1 };
        }
        if (data.syncLockToken === null) {
          configLock = null;
          return { count: 1 };
        }
        return { count: 1 };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => data,
      findUnique: async () => ({ id: 1, syncLockToken: configLock }),
    },
    ga4SyncRun: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: 1, ...data };
        syncRuns.push(row);
        return row;
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(syncRuns[0], data);
        return syncRuns[0];
      },
    },
    ga4PageMetric: {
      upsert: async ({ create }: { create: Record<string, unknown> }) => {
        const row = { id: nextMetricId++, ...create };
        metrics.set(String(create.dimensionKeyHash), row);
        return row;
      },
    },
    seoPage: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 9, ...data }),
      update: async () => ({}),
    },
    seoPageAlias: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 1, ...data }),
      update: async () => ({}),
    },
    autopilotActivityLog: { create: async () => ({}) },
    $transaction: async (ops: Array<Promise<unknown>>) => Promise.all(ops),
  };

  const result = await runGa4Sync(prisma as never, {
    actorId: 1,
    trigger: 'MANUAL',
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    provider,
  });

  assert.equal(result.syncRun.status, 'SUCCEEDED');
  assert.equal(metrics.size, 1);
  const stored = [...metrics.values()][0];
  assert.equal('clientId' in stored, false);
  assert.equal('email' in stored, false);
  assert.equal(stored.organicSessions, 12);
  assert.equal(stored.dimensionKeyHash != null, true);
});

test('partial sync retains imported days and marks PARTIAL', async () => {
  setGa4Env();
  let day = 0;
  const provider: Ga4ReportingProvider = {
    validateConfiguration: () => ({ ok: true }),
    validatePropertyAccess: async () => ({ ok: true }),
    testConnection: async () => ({ ok: true }),
    runLandingPageReport: async () => {
      day += 1;
      if (day > 1) throw new Error('provider failure');
      return [];
    },
  };

  let configLock: string | null = null;
  const syncRuns: Array<Record<string, unknown>> = [];
  const prisma = {
    ga4ConfigurationState: {
      upsert: async () => ({ id: 1 }),
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        if (data.syncLockToken && data.syncLockToken !== null) {
          configLock = String(data.syncLockToken);
          return { count: 1 };
        }
        configLock = null;
        return { count: 1 };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => data,
    },
    ga4SyncRun: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: 1, ...data };
        syncRuns.push(row);
        return row;
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        Object.assign(syncRuns[0], data);
        return syncRuns[0];
      },
    },
    ga4PageMetric: {
      upsert: async ({ create }: { create: Record<string, unknown> }) => create,
    },
    seoPage: { findUnique: async () => null },
    seoPageAlias: { findUnique: async () => null, create: async () => ({ id: 1 }), update: async () => ({}) },
    autopilotActivityLog: { create: async () => ({}) },
    $transaction: async (ops: Array<Promise<unknown>>) => Promise.all(ops),
  };

  await assert.rejects(
    () =>
      runGa4Sync(prisma as never, {
        actorId: 1,
        trigger: 'MANUAL',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-02',
        provider,
      }),
    (err: unknown) => err instanceof AutopilotError,
  );
  assert.equal(syncRuns[0].status, 'PARTIAL');
  assert.equal(syncRuns[0].daysProcessed, 1);
});

test('sync locking returns conflict when already running', async () => {
  setGa4Env();
  const provider: Ga4ReportingProvider = {
    validateConfiguration: () => ({ ok: true }),
    validatePropertyAccess: async () => ({ ok: true }),
    testConnection: async () => ({ ok: true }),
    runLandingPageReport: async () => [],
  };
  const prisma = {
    ga4ConfigurationState: {
      upsert: async () => ({ id: 1 }),
      updateMany: async () => ({ count: 0 }),
      update: async ({ data }: { data: Record<string, unknown> }) => data,
    },
    ga4SyncRun: {
      create: async ({ data }: { data: Record<string, unknown> }) => ({ id: 1, ...data }),
      update: async ({ data }: { data: Record<string, unknown> }) => data,
    },
    autopilotActivityLog: { create: async () => ({}) },
  };

  await assert.rejects(
    () =>
      runGa4Sync(prisma as never, {
        actorId: 1,
        trigger: 'MANUAL',
        dateFrom: '2026-07-01',
        dateTo: '2026-07-01',
        provider,
      }),
    (err: unknown) =>
      err instanceof AutopilotError && err.code === 'GA4_SYNC_IN_PROGRESS',
  );
});

test('provider errors are classified safely', () => {
  const denied = classifyGa4ProviderError(new Error('403 permission denied'));
  assert.equal(denied.errorCode, 'GA4_ACCESS_DENIED');
  const message = sanitizeGa4ErrorMessage('Request failed Bearer ya29.secret-token');
  assert.equal(message.includes('ya29.secret-token'), false);
});

test('getGa4ConfigMissing lists required variable names only', () => {
  const missing = getGa4ConfigMissing({});
  assert.deepEqual(missing, [
    'GA4_PROPERTY_ID',
    'GA4_SERVICE_ACCOUNT_CLIENT_EMAIL',
    'GA4_SERVICE_ACCOUNT_PRIVATE_KEY',
  ]);
});
