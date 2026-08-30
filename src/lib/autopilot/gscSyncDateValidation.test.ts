/**
 * Tests for GSC custom sync date-range validation and UI helpers.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { AutopilotError } from './apiErrors.ts';
import {
  addDaysToDateString,
  computeDefaultGscDateWindow,
} from './gscDateUtils.ts';
import {
  buildGscCustomSyncPayload,
  countInclusiveCalendarDays,
  GSC_SYNC_MAX_RANGE_DAYS,
  isGscSyncControlsDisabled,
  resolveGscDateRangePreset,
  resolveGscSyncDateBounds,
  validateGscSyncDateRange,
} from './gscSyncDateValidation.ts';

function setGscEnv() {
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET = 'csecret';
  process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI =
    'http://localhost:3000/api/admin/autopilot/gsc/oauth/callback';
  process.env.AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  process.env.AUTOPILOT_GSC_OAUTH_STATE_SECRET = 'u'.repeat(32);
  process.env.AUTOPILOT_GSC_DEFAULT_LOOKBACK_DAYS = '28';
  process.env.AUTOPILOT_GSC_DATA_DELAY_DAYS = '3';
}

function fixedBounds(now: Date) {
  const window = computeDefaultGscDateWindow(now, { lookbackDays: 28, dataDelayDays: 3 });
  return {
    latestSafeDate: window.dateTo,
    maxRangeDays: GSC_SYNC_MAX_RANGE_DAYS,
    defaultDateFrom: window.dateFrom,
    defaultDateTo: window.dateTo,
    lookbackDays: 28,
    dataDelayDays: 3,
  };
}

test('default range sync uses configured lookback window', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = resolveGscSyncDateBounds(process.env, now);
  const resolved = validateGscSyncDateRange({ now, bounds });
  assert.equal(resolved.dateFrom, bounds.defaultDateFrom);
  assert.equal(resolved.dateTo, bounds.defaultDateTo);
  assert.equal(resolved.searchType, 'web');
  assert.equal(resolved.calendarDayCount, 28);
});

test('seven-day preset resolves inclusive range ending at latest safe date', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = fixedBounds(now);
  const preset = resolveGscDateRangePreset('last_7_days', bounds, now);
  const resolved = validateGscSyncDateRange({
    dateFrom: preset.dateFrom,
    dateTo: preset.dateTo,
    now,
    bounds,
  });
  assert.equal(resolved.calendarDayCount, 7);
  assert.equal(resolved.dateTo, bounds.latestSafeDate);
});

test('twenty-eight-day preset matches default sync window length', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = fixedBounds(now);
  const preset = resolveGscDateRangePreset('last_28_days', bounds, now);
  const resolved = validateGscSyncDateRange({
    dateFrom: preset.dateFrom,
    dateTo: preset.dateTo,
    now,
    bounds,
  });
  assert.equal(resolved.calendarDayCount, 28);
});

test('previous-month preset covers full prior Pacific calendar month', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = fixedBounds(now);
  const preset = resolveGscDateRangePreset('previous_month', bounds, now);
  assert.equal(preset.dateFrom, '2026-06-01');
  assert.equal(preset.dateTo, '2026-06-30');
  validateGscSyncDateRange({
    dateFrom: preset.dateFrom,
    dateTo: preset.dateTo,
    now,
    bounds,
  });
});

test('custom valid range accepts explicit dates', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = fixedBounds(now);
  const resolved = validateGscSyncDateRange({
    dateFrom: '2026-07-01',
    dateTo: '2026-07-10',
    now,
    bounds,
  });
  assert.equal(resolved.calendarDayCount, 10);
});

test('one-day range is valid', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = fixedBounds(now);
  const resolved = validateGscSyncDateRange({
    dateFrom: bounds.latestSafeDate,
    dateTo: bounds.latestSafeDate,
    now,
    bounds,
  });
  assert.equal(resolved.calendarDayCount, 1);
});

test('invalid date format rejected', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom: '07/01/2026',
        dateTo: bounds.latestSafeDate,
        bounds,
      }),
    (err: unknown) => err instanceof AutopilotError && err.status === 400,
  );
});

test('impossible calendar date rejected', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom: '2026-02-31',
        dateTo: bounds.latestSafeDate,
        bounds,
      }),
    (err: unknown) =>
      err instanceof AutopilotError &&
      String(err.message).toLowerCase().includes('calendar date'),
  );
});

test('reversed date range rejected', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom: bounds.latestSafeDate,
        dateTo: addDaysToDateString(bounds.latestSafeDate, -3),
        bounds,
      }),
    (err: unknown) =>
      err instanceof AutopilotError &&
      String(err.message).toLowerCase().includes('on or before'),
  );
});

test('future date beyond latest safe date rejected', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = fixedBounds(now);
  const future = addDaysToDateString(bounds.latestSafeDate, 1);
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom: bounds.defaultDateFrom,
        dateTo: future,
        bounds,
        now,
      }),
    (err: unknown) =>
      err instanceof AutopilotError &&
      String(err.message).toLowerCase().includes('latest safe'),
  );
});

test('date after latestSafeDate rejected', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom: bounds.defaultDateFrom,
        dateTo: addDaysToDateString(bounds.latestSafeDate, 2),
        bounds,
      }),
    (err: unknown) => err instanceof AutopilotError,
  );
});

test('more than 400 inclusive days rejected', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  const dateFrom = addDaysToDateString(bounds.latestSafeDate, -(GSC_SYNC_MAX_RANGE_DAYS));
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom,
        dateTo: bounds.latestSafeDate,
        bounds,
      }),
    (err: unknown) =>
      err instanceof AutopilotError &&
      String(err.message).includes(String(GSC_SYNC_MAX_RANGE_DAYS)),
  );
});

test('exactly 400 inclusive days accepted', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  const dateFrom = addDaysToDateString(bounds.latestSafeDate, -(GSC_SYNC_MAX_RANGE_DAYS - 1));
  const resolved = validateGscSyncDateRange({
    dateFrom,
    dateTo: bounds.latestSafeDate,
    bounds,
  });
  assert.equal(resolved.calendarDayCount, GSC_SYNC_MAX_RANGE_DAYS);
});

test('partial custom range rejected when only one date supplied', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom: bounds.defaultDateFrom,
        bounds,
      }),
    (err: unknown) => err instanceof AutopilotError,
  );
});

test('unsupported search type rejected', () => {
  setGscEnv();
  const bounds = fixedBounds(new Date('2026-07-20T19:00:00.000Z'));
  assert.throws(
    () =>
      validateGscSyncDateRange({
        dateFrom: bounds.defaultDateFrom,
        dateTo: bounds.defaultDateTo,
        searchType: 'discover',
        bounds,
      }),
    (err: unknown) =>
      err instanceof AutopilotError &&
      String(err.message).toLowerCase().includes('searchtype'),
  );
});

test('UI payload contains dateFrom, dateTo and web searchType', () => {
  const payload = buildGscCustomSyncPayload('2026-06-01', '2026-06-30');
  assert.deepEqual(payload, {
    dateFrom: '2026-06-01',
    dateTo: '2026-06-30',
    searchType: 'web',
  });
});

test('UI disables sync controls while syncing or locked', () => {
  assert.equal(
    isGscSyncControlsDisabled({ syncing: true, syncLocked: false, connectionActive: true }),
    true,
  );
  assert.equal(
    isGscSyncControlsDisabled({ syncing: false, syncLocked: true, connectionActive: true }),
    true,
  );
  assert.equal(
    isGscSyncControlsDisabled({ syncing: false, syncLocked: false, connectionActive: false }),
    true,
  );
  assert.equal(
    isGscSyncControlsDisabled({ syncing: false, syncLocked: false, connectionActive: true }),
    false,
  );
});

test('countInclusiveCalendarDays matches preset metadata', () => {
  assert.equal(countInclusiveCalendarDays('2026-07-01', '2026-07-01'), 1);
  assert.equal(countInclusiveCalendarDays('2026-07-01', '2026-07-07'), 7);
});

test('status bounds expose authoritative server values', () => {
  setGscEnv();
  const now = new Date('2026-07-20T19:00:00.000Z');
  const bounds = resolveGscSyncDateBounds(process.env, now);
  assert.equal(bounds.maxRangeDays, GSC_SYNC_MAX_RANGE_DAYS);
  assert.equal(bounds.lookbackDays, 28);
  assert.equal(bounds.dataDelayDays, 3);
  assert.ok(bounds.latestSafeDate <= bounds.defaultDateTo);
  assert.equal(bounds.defaultDateFrom, addDaysToDateString(bounds.defaultDateTo, -27));
});
