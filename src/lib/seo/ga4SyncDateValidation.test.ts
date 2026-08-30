/**
 * Tests for GA4 sync date validation and presets.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGa4CustomSyncPayload,
  countInclusiveCalendarDays,
  resolveGa4DateRangePreset,
  resolveGa4SyncDateBounds,
  validateGa4SyncDateRange,
  GA4_SYNC_MAX_RANGE_DAYS,
} from './ga4SyncDateValidation.ts';

function setGa4Env() {
  process.env.GA4_PROPERTY_ID = '123456789';
  process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL = 'ga4@project.iam.gserviceaccount.com';
  process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----';
  process.env.GA4_DEFAULT_LOOKBACK_DAYS = '28';
  process.env.GA4_DATA_DELAY_DAYS = '1';
}

test('default sync bounds include latest safe date and lookback window', () => {
  setGa4Env();
  const now = new Date('2026-07-20T12:00:00.000Z');
  const bounds = resolveGa4SyncDateBounds(process.env, now);
  assert.equal(bounds.latestSafeDate, '2026-07-19');
  assert.equal(bounds.maxRangeDays, GA4_SYNC_MAX_RANGE_DAYS);
  assert.ok(bounds.defaultDateFrom <= bounds.defaultDateTo);
});

test('one-day custom range validates', () => {
  setGa4Env();
  const bounds = resolveGa4SyncDateBounds(process.env, new Date('2026-07-20T12:00:00.000Z'));
  const resolved = validateGa4SyncDateRange({
    dateFrom: '2026-07-01',
    dateTo: '2026-07-01',
    bounds,
  });
  assert.equal(resolved.calendarDayCount, 1);
});

test('rejects reversed range', () => {
  setGa4Env();
  const bounds = resolveGa4SyncDateBounds(process.env, new Date('2026-07-20T12:00:00.000Z'));
  assert.throws(() =>
    validateGa4SyncDateRange({ dateFrom: '2026-07-10', dateTo: '2026-07-01', bounds }),
  );
});

test('rejects date after latest safe date', () => {
  setGa4Env();
  const bounds = resolveGa4SyncDateBounds(process.env, new Date('2026-07-20T12:00:00.000Z'));
  assert.throws(() =>
    validateGa4SyncDateRange({ dateFrom: '2026-07-19', dateTo: '2026-07-20', bounds }),
  );
});

test('rejects impossible calendar date', () => {
  setGa4Env();
  const bounds = resolveGa4SyncDateBounds(process.env, new Date('2026-07-20T12:00:00.000Z'));
  assert.throws(() =>
    validateGa4SyncDateRange({ dateFrom: '2026-02-30', dateTo: '2026-02-30', bounds }),
  );
});

test('rejects range exceeding maximum days', () => {
  setGa4Env();
  const bounds = resolveGa4SyncDateBounds(process.env, new Date('2026-07-20T12:00:00.000Z'));
  assert.throws(() =>
    validateGa4SyncDateRange({
      dateFrom: '2024-01-01',
      dateTo: bounds.latestSafeDate,
      bounds,
    }),
  );
});

test('last 7 days preset resolves inclusive count', () => {
  setGa4Env();
  const bounds = resolveGa4SyncDateBounds(process.env, new Date('2026-07-20T12:00:00.000Z'));
  const preset = resolveGa4DateRangePreset('last_7_days', bounds);
  assert.equal(preset.calendarDayCount, 7);
  assert.equal(countInclusiveCalendarDays(preset.dateFrom, preset.dateTo), 7);
});

test('buildGa4CustomSyncPayload returns date pair only', () => {
  const payload = buildGa4CustomSyncPayload('2026-07-01', '2026-07-07');
  assert.deepEqual(payload, { dateFrom: '2026-07-01', dateTo: '2026-07-07' });
});
