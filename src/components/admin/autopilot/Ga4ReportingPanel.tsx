import { useEffect, useMemo, useState } from 'react';
import { PlugZap, RefreshCcw } from 'lucide-react';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import {
  buildGa4CustomSyncPayload,
  countInclusiveCalendarDays,
  isGa4SyncControlsDisabled,
  resolveGa4DateRangePreset,
  type Ga4DateRangePresetId,
} from '../../../lib/seo/ga4SyncDateValidation';
import {
  formatGa4SyncDuration,
  mergeSyncRunIntoList,
  parseGa4SyncRun,
  parseGa4SyncRuns,
  type Ga4SyncRunRecord,
} from '../../../lib/seo/ga4SyncHistoryHelpers';
import { useToast } from '../../ui/AppToast';
import { AutopilotErrorState } from './AutopilotErrorState';

type Ga4ReportingPanelProps = {
  refreshKey: number;
  canManage: boolean;
};

const btnPrimary =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-50';
const inputClass =
  'mt-1 w-full max-w-xl rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60';

const PRESET_OPTIONS: Array<{ id: Ga4DateRangePresetId; label: string }> = [
  { id: 'last_7_days', label: 'Last 7 days' },
  { id: 'last_28_days', label: 'Last 28 days' },
  { id: 'last_90_days', label: 'Last 90 days' },
  { id: 'this_month', label: 'This month' },
  { id: 'previous_month', label: 'Previous month' },
  { id: 'custom', label: 'Custom' },
];

function formatDayCount(count: number): string {
  return `${count} calendar day${count === 1 ? '' : 's'} selected`;
}

function syncStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'SUCCEEDED':
      return 'Succeeded';
    case 'PARTIAL':
      return 'Partial';
    case 'FAILED':
      return 'Failed';
    case 'RUNNING':
      return 'Running';
    case 'QUEUED':
      return 'Queued';
    default:
      return status || 'Unknown';
  }
}

export function Ga4ReportingPanel({ refreshKey, canManage }: Ga4ReportingPanelProps) {
  const { showToast } = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof adminAutopilotApi.getGa4Status>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  const [customPreset, setCustomPreset] = useState<Ga4DateRangePresetId>('last_28_days');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [syncHistory, setSyncHistory] = useState<Ga4SyncRunRecord[]>([]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [status, history] = await Promise.all([
        adminAutopilotApi.getGa4Status(),
        adminAutopilotApi.listGa4SyncRuns({ limit: 10, offset: 0 }),
      ]);
      setData(status);
      setSyncHistory(parseGa4SyncRuns(history.items));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load GA4 status'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshKey]);

  const cfg = data?.configuration;
  const syncBounds = useMemo(() => {
    if (!cfg?.latestSafeDate || !cfg.defaultDateFrom || !cfg.defaultDateTo) return null;
    return {
      latestSafeDate: cfg.latestSafeDate,
      maxRangeDays: cfg.maxRangeDays ?? 400,
      defaultDateFrom: cfg.defaultDateFrom,
      defaultDateTo: cfg.defaultDateTo,
      lookbackDays: cfg.lookbackDays ?? cfg.defaultLookback,
      dataDelayDays: cfg.dataDelayDays,
    };
  }, [cfg]);

  useEffect(() => {
    if (!syncBounds) return;
    const preset = resolveGa4DateRangePreset(customPreset, syncBounds);
    setCustomDateFrom(preset.dateFrom);
    setCustomDateTo(preset.dateTo);
  }, [syncBounds, customPreset]);

  const customDayCount = useMemo(() => {
    if (!customDateFrom || !customDateTo || customDateFrom > customDateTo) return 0;
    return countInclusiveCalendarDays(customDateFrom, customDateTo);
  }, [customDateFrom, customDateTo]);

  const syncControlsDisabled = isGa4SyncControlsDisabled({
    syncing,
    syncLocked: cfg?.syncLocked ?? false,
    configured: cfg?.configured ?? false,
  });

  const handleSync = async (payload?: { dateFrom?: string; dateTo?: string }) => {
    if (!canManage || syncing) return;
    setSyncing(true);
    try {
      const result = await adminAutopilotApi.runGa4Sync(payload ?? {});
      const run = parseGa4SyncRun(result.syncRun);
      setSyncHistory((prev) => mergeSyncRunIntoList(prev, run));
      showToast({
        type: run.status === 'SUCCEEDED' ? 'success' : run.status === 'PARTIAL' ? 'warning' : 'error',
        message:
          run.status === 'SUCCEEDED'
            ? 'Google Analytics 4 sync completed.'
            : run.status === 'PARTIAL'
              ? 'GA4 sync partially completed — review sync history.'
              : 'GA4 sync failed.',
      });
      await load();
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'GA4 sync failed.';
      showToast({ type: 'error', message });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!canManage || testing) return;
    setTesting(true);
    try {
      const result = await adminAutopilotApi.testGa4Connection();
      showToast({
        type: result.ok ? 'success' : 'error',
        message: result.ok
          ? 'GA4 service account connection verified.'
          : result.errorMessage || 'GA4 connection test failed.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'GA4 connection test failed.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm" aria-busy="true">
        <p className="text-sm text-zinc-500">Loading Google Analytics 4 status…</p>
      </div>
    );
  }

  if (error && !data) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  const dataState = !cfg?.configured
    ? 'not_configured'
    : !cfg.lastSuccessfulSync
      ? 'never_synced'
      : syncing || cfg.syncLocked
        ? 'syncing'
        : cfg.currentErrorMessage
          ? 'sync_failed'
          : data?.latestMetricDate
            ? 'data_available'
            : 'no_data';

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm" aria-busy={syncing}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Google Analytics 4</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Read-only aggregate landing-page reporting for SEO Intelligence.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={syncing} className={btnSecondary}>
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {!cfg?.configured ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">Source not configured</p>
          <p className="mt-1">
            Set the GA4 service account environment variables to enable aggregate sync. Missing:{' '}
            {cfg?.missing.join(', ') || 'GA4 credentials'}.
          </p>
        </div>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property</dt>
            <dd className="mt-1 text-sm text-zinc-800">{cfg.propertyId || '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Authentication
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">
              {cfg.authenticationType === 'service_account' ? 'Service account (read-only)' : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Latest safe date
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">{cfg.latestSafeDate || '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Last sync</dt>
            <dd className="mt-1 text-sm text-zinc-800">
              {cfg.lastSuccessfulSync ? formatAutopilotDate(cfg.lastSuccessfulSync) : 'Never'}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Latest metric date
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">{data?.latestMetricDate || '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</dt>
            <dd className="mt-1 text-sm text-zinc-800">
              {dataState === 'syncing'
                ? 'Sync in progress'
                : dataState === 'sync_failed'
                  ? 'Last sync failed'
                  : dataState === 'never_synced'
                    ? 'Configured — never synced'
                    : dataState === 'no_data'
                      ? 'No imported data yet'
                      : 'Data available'}
            </dd>
          </div>
        </dl>
      )}

      {cfg?.currentErrorMessage ? (
        <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {cfg.currentErrorMessage}
        </p>
      ) : null}

      {canManage && cfg?.configured ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={syncControlsDisabled || !canManage}
            className={btnPrimary}
          >
            {syncing ? 'Syncing…' : 'Sync latest range'}
          </button>
          <button
            type="button"
            onClick={() => setCustomPanelOpen((open) => !open)}
            disabled={syncControlsDisabled}
            className={btnSecondary}
          >
            Custom date range
          </button>
          <button
            type="button"
            onClick={() => void handleTestConnection()}
            disabled={testing || syncing}
            className={btnSecondary}
          >
            <PlugZap className="h-4 w-4" />
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        </div>
      ) : null}

      {customPanelOpen && syncBounds ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">Custom sync range</p>
          <p className="mt-1 text-xs text-zinc-500">
            Sync controls are separate from performance report filters. Latest safe date:{' '}
            {syncBounds.latestSafeDate}. Max range: {syncBounds.maxRangeDays} days.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCustomPreset(option.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  customPreset === option.id
                    ? 'bg-zinc-900 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-zinc-600">
              From
              <input
                type="date"
                value={customDateFrom}
                max={syncBounds.latestSafeDate}
                onChange={(e) => {
                  setCustomPreset('custom');
                  setCustomDateFrom(e.target.value);
                }}
                disabled={syncControlsDisabled}
                className={inputClass}
              />
            </label>
            <label className="block text-xs font-semibold text-zinc-600">
              To
              <input
                type="date"
                value={customDateTo}
                max={syncBounds.latestSafeDate}
                onChange={(e) => {
                  setCustomPreset('custom');
                  setCustomDateTo(e.target.value);
                }}
                disabled={syncControlsDisabled}
                className={inputClass}
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {customDayCount > 0 ? formatDayCount(customDayCount) : 'Select a valid date range.'}
            {customDayCount > syncBounds.maxRangeDays ? (
              <span className="ml-2 font-semibold text-amber-700">
                Range exceeds maximum of {syncBounds.maxRangeDays} days.
              </span>
            ) : null}
          </p>
          <button
            type="button"
            className={`${btnPrimary} mt-3`}
            disabled={
              syncControlsDisabled ||
              !customDateFrom ||
              !customDateTo ||
              customDateFrom > customDateTo ||
              customDayCount > syncBounds.maxRangeDays
            }
            onClick={() =>
              void handleSync(buildGa4CustomSyncPayload(customDateFrom, customDateTo))
            }
          >
            Sync selected range
          </button>
        </div>
      ) : null}

      {syncHistory.length ? (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-zinc-900">Sync history</h4>
          <ul className="mt-2 space-y-2 text-sm text-zinc-700">
            {syncHistory.map((run) => (
              <li key={run.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900">
                    {run.dateFrom} → {run.dateTo}
                  </span>
                  <span>{syncStatusLabel(run.status)}</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {run.daysProcessed} days · {run.rowsUpserted} rows stored · {run.unmatchedPages}{' '}
                  unmatched · {formatGa4SyncDuration(run.startedAt, run.completedAt) || '—'}
                </p>
                {run.errorMessage ? (
                  <p className="mt-1 text-xs text-rose-700">{run.errorMessage}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
