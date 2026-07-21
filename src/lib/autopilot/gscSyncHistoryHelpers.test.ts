import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSafeSyncTechnicalDetails,
  calculateSyncDurationMs,
  DEFAULT_GSC_SYNC_ACTIVITY_FILTERS,
  formatGscDateRange,
  formatGscSyncTimestamp,
  formatSyncDuration,
  formatSyncDurationShort,
  formatSyncElapsedClock,
  getCompletedSyncCardLabel,
  getGscSyncHeadline,
  getGscSyncPhaseText,
  getGscSyncStatusKind,
  getGscSyncStatusLabel,
  getGscSyncTriggerLabel,
  partitionSyncRuns,
  type GscSyncRunRecord,
} from './gscSyncHistoryHelpers.ts';

function makeRun(overrides: Partial<GscSyncRunRecord> = {}): GscSyncRunRecord {
  return {
    id: 1,
    trigger: 'MANUAL',
    status: 'SUCCEEDED',
    dateFrom: '2026-06-21',
    dateTo: '2026-07-18',
    rowsFetched: 179,
    rowsUpserted: 179,
    startedAt: '2026-07-21T11:05:00.000Z',
    completedAt: '2026-07-21T11:06:04.000Z',
    createdAt: '2026-07-21T11:05:00.000Z',
    ...overrides,
  };
}

test('successful sync display helpers', () => {
  const run = makeRun();
  assert.equal(getGscSyncStatusKind(run.status), 'succeeded');
  assert.equal(getGscSyncStatusLabel(run.status), 'Succeeded');
  assert.equal(getGscSyncTriggerLabel(run.trigger), 'Manual');
  assert.equal(getGscSyncHeadline(run.status), 'Completed successfully');
  assert.equal(formatGscDateRange(run.dateFrom, run.dateTo), '21 Jun – 18 Jul 2026');
});

test('failed sync display helpers', () => {
  const run = makeRun({
    id: 2,
    status: 'FAILED',
    trigger: 'SCHEDULED',
    errorMessage: 'Google API request failed',
    errorCode: 'GSC_API_ERROR',
    rowsFetched: 0,
    rowsUpserted: 0,
    completedAt: '2026-07-20T05:50:00.000Z',
  });

  assert.equal(getGscSyncStatusKind(run.status), 'failed');
  assert.equal(getGscSyncStatusLabel(run.status), 'Failed');
  assert.equal(getGscSyncTriggerLabel(run.trigger), 'Scheduled');
  assert.equal(getGscSyncHeadline(run.status), 'Failed');

  const partition = partitionSyncRuns([run]);
  assert.equal(partition.latestCompleted?.id, 2);
  assert.equal(partition.running, null);
});

test('running sync display helpers', () => {
  const running = makeRun({
    id: 3,
    status: 'RUNNING',
    completedAt: null,
    rowsFetched: 42,
    rowsUpserted: 40,
  });

  assert.equal(getGscSyncStatusKind(running.status), 'running');
  assert.equal(getGscSyncHeadline(running.status), 'Sync currently running');
  assert.equal(getGscSyncPhaseText('RUNNING'), 'Fetching query and page metrics…');
  assert.equal(getGscSyncPhaseText('QUEUED'), 'Preparing sync…');

  const partition = partitionSyncRuns([running], { syncLocked: true });
  assert.equal(partition.running?.id, 3);
});

test('duration calculation and formatting', () => {
  const startedAt = '2026-07-21T11:05:00.000Z';
  const completedAt = '2026-07-21T11:06:04.000Z';
  const durationMs = calculateSyncDurationMs(startedAt, completedAt);
  assert.equal(durationMs, 64_000);
  assert.equal(formatSyncDuration(durationMs), '1 min 04 sec');
  assert.equal(formatSyncDurationShort(durationMs), '1m 04s');
  assert.equal(formatSyncElapsedClock(durationMs), '01:04');
  assert.equal(formatSyncDuration(calculateSyncDurationMs(startedAt, null, Date.parse(startedAt) + 48_000)), '48s');
});

test('empty history partition', () => {
  const partition = partitionSyncRuns([]);
  assert.equal(partition.running, null);
  assert.equal(partition.latestCompleted, null);
  assert.deepEqual(partition.history, []);
});

test('activity log filtered navigation defaults', () => {
  assert.equal(DEFAULT_GSC_SYNC_ACTIVITY_FILTERS.entityType, 'gsc_sync_run');
  assert.equal(DEFAULT_GSC_SYNC_ACTIVITY_FILTERS.eventType, '');
  assert.equal(DEFAULT_GSC_SYNC_ACTIVITY_FILTERS.entityId, '');
  assert.equal(DEFAULT_GSC_SYNC_ACTIVITY_FILTERS.limit, 20);
  assert.equal(DEFAULT_GSC_SYNC_ACTIVITY_FILTERS.offset, 0);
});

test('partition keeps latest successful sync visible during active sync', () => {
  const previousSuccess = makeRun({
    id: 10,
    status: 'SUCCEEDED',
    completedAt: '2026-07-19T02:30:00.000Z',
  });
  const failed = makeRun({
    id: 11,
    status: 'FAILED',
    completedAt: '2026-07-20T05:50:00.000Z',
    errorMessage: 'Google API request failed',
  });
  const running = makeRun({
    id: 12,
    status: 'RUNNING',
    completedAt: null,
    startedAt: '2026-07-21T11:09:00.000Z',
  });

  const partition = partitionSyncRuns([running, failed, previousSuccess], {
    syncLocked: true,
  });

  assert.equal(partition.running?.id, 12);
  assert.equal(partition.latestCompleted?.id, 10);
  assert.equal(partition.history.some((run) => run.id === 11), true);
});

test('technical details omit sensitive values', () => {
  const details = buildSafeSyncTechnicalDetails(
    makeRun({
      errorMessage: 'refresh token expired for credential store',
    }),
  );

  assert.equal(details['Run ID'], 1);
  assert.equal(details['Rows fetched'], 179);
  assert.equal(details['Error message'], undefined);
});

test('completed sync card label reflects active sync state', () => {
  assert.equal(getCompletedSyncCardLabel(false), 'Latest sync');
  assert.equal(getCompletedSyncCardLabel(true), 'Last sync');
});

test('formatGscSyncTimestamp uses en-GB locale shape', () => {
  const formatted = formatGscSyncTimestamp('2026-07-21T11:09:00.000Z');
  assert.match(formatted, /21 Jul 2026/);
});
