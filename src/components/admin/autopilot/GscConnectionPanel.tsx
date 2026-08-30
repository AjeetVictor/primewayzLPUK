import { useEffect, useMemo, useState } from 'react';
import { Link2, RefreshCcw, Unplug } from 'lucide-react';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import {
  mergeSyncRunIntoList,
  parseGscSyncRun,
  parseGscSyncRuns,
  type GscSyncRunRecord,
} from '../../../lib/autopilot/gscSyncHistoryHelpers';
import {
  buildGscCustomSyncPayload,
  countInclusiveCalendarDays,
  isGscSyncControlsDisabled,
  resolveGscDateRangePreset,
  type GscDateRangePresetId,
} from '../../../lib/autopilot/gscSyncDateValidation';
import { GscSyncHistoryContent, RunningSyncCard, useGscSyncHistoryState } from './GscSyncHistory';
import { useToast } from '../../ui/AppToast';
import { AppConfirmDialog } from '../../ui/AppConfirmDialog';
import { AutopilotErrorState } from './AutopilotErrorState';

type GscConnectionPanelProps = {
  refreshKey: number;
  canManageGsc: boolean;
  onViewFullSyncHistory?: () => void;
};

type GscStatus = Awaited<ReturnType<typeof adminAutopilotApi.getGscStatus>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_REQUESTED_SITE_URL = 'https://uk.primewayz.com/';

const btnPrimary =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 active:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 active:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50';

const inputClass =
  'mt-1 w-full max-w-xl rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60';

function statusLabel(status: string | undefined): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'CONNECTED_UNCONFIGURED':
      return 'Connected — select a property';
    case 'NEEDS_REAUTHENTICATION':
      return 'Needs reauthentication';
    case 'DISCONNECTED':
      return 'Disconnected';
    case 'ERROR':
      return 'Error';
    default:
      return status || 'Unknown';
  }
}

const PRESET_OPTIONS: Array<{ id: GscDateRangePresetId; label: string }> = [
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

function isLikelyGscProperty(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.toLowerCase().startsWith('sc-domain:')) {
    return trimmed.length > 'sc-domain:'.length;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function GscConnectionPanel({
  refreshKey,
  canManageGsc,
  onViewFullSyncHistory,
}: GscConnectionPanelProps) {
  const { showToast } = useToast();
  const [data, setData] = useState<GscStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [requestedSiteUrl, setRequestedSiteUrl] = useState(DEFAULT_REQUESTED_SITE_URL);
  const [expectedEmail, setExpectedEmail] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [accessibleDiagnostics, setAccessibleDiagnostics] = useState<
    Array<{ siteUrl: string; permissionLevel: string | null }>
  >([]);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  const [customPreset, setCustomPreset] = useState<GscDateRangePresetId>('last_28_days');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [optimisticRunning, setOptimisticRunning] = useState<GscSyncRunRecord | null>(null);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await adminAutopilotApi.getGscStatus();
      setData(status);
      if (status.connection?.requestedSiteUrl) {
        setRequestedSiteUrl(status.connection.requestedSiteUrl);
      } else if (status.connection?.siteUrl) {
        setRequestedSiteUrl(status.connection.siteUrl);
      }
      if (status.connection?.expectedEmail) {
        setExpectedEmail(status.connection.expectedEmail);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Failed to load GSC status'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const gsc = params.get('gsc');
    if (gsc === 'error') {
      const msg = params.get('gscMessage') || 'Google Search Console connection failed.';
      const lower = msg.toLowerCase();
      if (lower.includes('does not match the expected email') || lower.includes('email')) {
        setStatusMessage(
          'The Google account authorised during consent does not match the expected email.',
        );
      } else if (
        lower.includes('does not have access') ||
        lower.includes('property') ||
        lower.includes('accessible')
      ) {
        setStatusMessage(
          'The authorised Google account does not have access to the requested Search Console property.',
        );
      } else {
        setStatusMessage(msg);
      }
      showToast({ type: 'error', message: msg });
    }
  }, [showToast]);

  const connection = data?.connection ?? null;
  const configured = data?.configuration.configured ?? false;
  const syncBounds = useMemo(() => {
    const cfg = data?.configuration;
    if (!cfg?.latestSafeDate || !cfg.defaultDateFrom || !cfg.defaultDateTo) return null;
    return {
      latestSafeDate: cfg.latestSafeDate,
      maxRangeDays: cfg.maxRangeDays ?? 400,
      defaultDateFrom: cfg.defaultDateFrom,
      defaultDateTo: cfg.defaultDateTo,
      lookbackDays: cfg.lookbackDays,
      dataDelayDays: cfg.dataDelayDays,
    };
  }, [data?.configuration]);

  useEffect(() => {
    if (!syncBounds) return;
    const preset = resolveGscDateRangePreset(customPreset, syncBounds);
    setCustomDateFrom(preset.dateFrom);
    setCustomDateTo(preset.dateTo);
  }, [syncBounds, customPreset]);

  const customDayCount = useMemo(() => {
    if (!customDateFrom || !customDateTo || customDateFrom > customDateTo) return 0;
    return countInclusiveCalendarDays(customDateFrom, customDateTo);
  }, [customDateFrom, customDateTo]);

  const syncControlsDisabled = isGscSyncControlsDisabled({
    syncing,
    syncLocked: connection?.syncLocked ?? false,
    connectionActive: connection?.status === 'ACTIVE',
  });
  const isActive = connection?.status === 'ACTIVE';
  const needsReauth = connection?.status === 'NEEDS_REAUTHENTICATION';
  const isDisconnected = !connection || connection.status === 'DISCONNECTED';
  const showOnboarding =
    isDisconnected || needsReauth || connection?.status === 'CONNECTED_UNCONFIGURED';
  const busy = connecting || syncing || disconnecting;

  const formValid = useMemo(() => {
    const email = expectedEmail.trim();
    return isLikelyGscProperty(requestedSiteUrl) && EMAIL_REGEX.test(email);
  }, [requestedSiteUrl, expectedEmail]);

  const handleConnect = async () => {
    if (!canManageGsc || connecting || !formValid) return;
    setConnecting(true);
    setStatusMessage(null);
    setAccessibleDiagnostics([]);
    setShowDiagnostics(false);
    try {
      const result = await adminAutopilotApi.createGscAuthUrl({
        requestedSiteUrl: requestedSiteUrl.trim(),
        expectedEmail: expectedEmail.trim(),
      });
      window.location.assign(result.authorizationUrl);
    } catch (err) {
      setConnecting(false);
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to start Google authorisation.';
      const details =
        err instanceof AutopilotClientError &&
        err.details &&
        typeof err.details === 'object'
          ? (err.details as {
              accessibleProperties?: Array<{
                siteUrl: string;
                permissionLevel: string | null;
              }>;
            })
          : null;
      if (details?.accessibleProperties?.length) {
        setAccessibleDiagnostics(details.accessibleProperties);
      }
      if (
        err instanceof AutopilotClientError &&
        (err.code === 'GSC_EMAIL_MISMATCH' || message.toLowerCase().includes('expected email'))
      ) {
        setStatusMessage(
          'The Google account authorised during consent does not match the expected email.',
        );
      } else if (
        err instanceof AutopilotClientError &&
        (err.code === 'GSC_PROPERTY_NOT_ACCESSIBLE' ||
          message.toLowerCase().includes('requested search console property'))
      ) {
        setStatusMessage(
          'The authorised Google account does not have access to the requested Search Console property.',
        );
      } else {
        setStatusMessage(message);
      }
      showToast({ type: 'error', message });
    }
  };

  const refreshStatus = async () => {
    try {
      const status = await adminAutopilotApi.getGscStatus();
      setData(status);
    } catch {
      // Background refresh — keep existing data visible.
    }
  };

  const applySyncResult = (result: Awaited<ReturnType<typeof adminAutopilotApi.runGscSync>>) => {
    const run = parseGscSyncRun(result.syncRun);
    showToast({ type: 'success', message: 'Search Console sync completed.' });
    let message = `Sync succeeded — fetched ${String(run.rowsFetched ?? 0)} rows, stored ${String(run.rowsUpserted ?? 0)}.`;
    if (result.opportunityRefresh?.status === 'failed') {
      message += ` Opportunity refresh failed: ${result.opportunityRefresh.errorMessage ?? 'unknown error'}.`;
    } else if (result.opportunityRefresh?.status === 'succeeded') {
      const created = result.opportunityRefresh.upsert?.created ?? 0;
      const updated = result.opportunityRefresh.upsert?.updated ?? 0;
      message += ` Opportunities refreshed — ${result.opportunityRefresh.findingsCount} findings (${created} new, ${updated} updated).`;
    }
    setStatusMessage(message);
    setData((current) =>
      current
        ? {
            ...current,
            recentSyncRuns: mergeSyncRunIntoList(
              parseGscSyncRuns(current.recentSyncRuns),
              run,
            ) as Array<Record<string, unknown>>,
            connection: current.connection
              ? {
                  ...current.connection,
                  syncLocked: false,
                  lastSuccessfulSyncAt:
                    run.status === 'SUCCEEDED' && run.completedAt
                      ? run.completedAt
                      : current.connection.lastSuccessfulSyncAt,
                }
              : current.connection,
          }
        : current,
    );
    void refreshStatus();
  };

  const beginOptimisticSync = () => {
    setOptimisticRunning({
      id: 'pending-manual-sync',
      status: 'RUNNING',
      trigger: 'MANUAL',
      startedAt: new Date().toISOString(),
    });
    void refreshStatus();
  };

  const handleSyncLatestRange = async () => {
    if (!canManageGsc || syncing) return;
    setSyncing(true);
    setStatusMessage(null);
    beginOptimisticSync();
    try {
      const result = await adminAutopilotApi.runGscSync();
      applySyncResult(result);
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sync failed.';
      setStatusMessage(message);
      showToast({ type: 'error', message });
      void refreshStatus();
    } finally {
      setSyncing(false);
      setOptimisticRunning(null);
    }
  };

  const handleCustomSync = async () => {
    if (!canManageGsc || syncing || !customDateFrom || !customDateTo) return;
    setSyncing(true);
    setStatusMessage(null);
    beginOptimisticSync();
    try {
      const payload = buildGscCustomSyncPayload(customDateFrom, customDateTo);
      const result = await adminAutopilotApi.runGscSync(payload);
      applySyncResult(result);
      setCustomPanelOpen(false);
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sync failed.';
      setStatusMessage(message);
      showToast({ type: 'error', message });
      void refreshStatus();
    } finally {
      setSyncing(false);
      setOptimisticRunning(null);
    }
  };

  const syncHistoryState = useGscSyncHistoryState({
    syncRuns: data?.recentSyncRuns ?? [],
    syncLocked: connection?.syncLocked ?? false,
    syncing,
    optimisticRunning,
    onRefresh: refreshStatus,
  });

  const handleDisconnect = async () => {
    if (!canManageGsc || disconnecting) return;
    setDisconnecting(true);
    try {
      await adminAutopilotApi.disconnectGsc();
      setDisconnectOpen(false);
      setAccessibleDiagnostics([]);
      setRequestedSiteUrl(DEFAULT_REQUESTED_SITE_URL);
      setExpectedEmail('');
      showToast({ type: 'success', message: 'Google Search Console disconnected.' });
      setStatusMessage('Google Search Console is not connected.');
      await load();
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to disconnect.';
      setStatusMessage(message);
      showToast({ type: 'error', message });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading && !data) {
    return (
      <div
        className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
        aria-busy="true"
      >
        <p className="text-sm text-zinc-500">Loading Google Search Console status…</p>
      </div>
    );
  }

  if (error && !data) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
      aria-busy={busy || undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Google Search Console</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Connect the Primewayz UK Search Console property with a verified Google account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className={btnSecondary}
          aria-label="Refresh GSC status"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="mt-3 min-h-[1.25rem]" aria-live="polite">
        {statusMessage ? (
          <p className="text-sm text-zinc-600">{statusMessage}</p>
        ) : null}
      </div>

      {!configured ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          GSC OAuth is not configured on this server. Set the Google Search Console environment
          variables, then reload.
        </div>
      ) : null}

      {showOnboarding && canManageGsc ? (
        <div className="mt-4 space-y-4">
          <h4 className="text-base font-bold text-zinc-900">
            Connect Primewayz UK Search Console
          </h4>
          <div>
            <label
              htmlFor="gsc-requested-site-url"
              className="block text-xs font-bold uppercase tracking-widest text-zinc-400"
            >
              Primewayz UK property
            </label>
            <input
              id="gsc-requested-site-url"
              type="text"
              value={requestedSiteUrl}
              onChange={(event) => setRequestedSiteUrl(event.target.value)}
              disabled={connecting || !configured}
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div>
            <label
              htmlFor="gsc-expected-email"
              className="block text-xs font-bold uppercase tracking-widest text-zinc-400"
            >
              Expected Google email
            </label>
            <input
              id="gsc-expected-email"
              type="email"
              value={expectedEmail}
              onChange={(event) => setExpectedEmail(event.target.value)}
              disabled={connecting || !configured}
              className={inputClass}
              autoComplete="email"
              placeholder="authorised-google-account@example.com"
            />
            <p className="mt-1.5 text-xs text-zinc-500">
              Use the Google account that already has access to this property in Search Console.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={!configured || connecting || !formValid}
            className={btnPrimary}
          >
            <Link2 className="h-4 w-4" />
            {connecting ? 'Connecting…' : 'Connect GSC'}
          </button>
          {needsReauth ? (
            <p className="text-sm text-amber-800">
              Reauthentication is required. Complete Connect GSC again with the same property and
              Google email.
            </p>
          ) : null}
        </div>
      ) : null}

      {showOnboarding && !canManageGsc ? (
        <div className="mt-4">
          <p className="text-sm text-zinc-500">Ask a super admin to connect Search Console.</p>
        </div>
      ) : null}

      {accessibleDiagnostics.length > 0 ? (
        <div className="mt-4">
          <button
            type="button"
            className="text-sm font-semibold text-zinc-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
            onClick={() => setShowDiagnostics((open) => !open)}
            aria-expanded={showDiagnostics}
          >
            {showDiagnostics ? 'Hide' : 'Show'} accessible property diagnostics
          </button>
          {showDiagnostics ? (
            <ul className="mt-2 space-y-1 rounded-2xl border border-zinc-100 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
              {accessibleDiagnostics.map((property) => (
                <li key={property.siteUrl} className="break-all">
                  {property.siteUrl}
                  {property.permissionLevel ? ` · ${property.permissionLevel}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs text-zinc-500">
            Diagnostics are informational only. Another property is never activated automatically.
          </p>
        </div>
      ) : null}

      {connection && (isActive || connection.status === 'ERROR') ? (
        <div className="mt-4 space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Property
              </dt>
              <dd className="mt-1 text-sm font-medium text-zinc-900 break-all">
                {connection.siteUrl || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Authorised Google email
              </dt>
              <dd className="mt-1 text-sm text-zinc-800 break-all">
                {connection.authorisedEmail || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Email verified
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {connection.authorisedEmailVerified === true
                  ? 'Yes'
                  : connection.authorisedEmailVerified === false
                    ? 'No'
                    : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Permission level
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {connection.permissionLevel || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Connection status
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">{statusLabel(connection.status)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Last sync
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {connection.lastSuccessfulSyncAt
                  ? formatAutopilotDate(connection.lastSuccessfulSyncAt)
                  : 'Never'}
              </dd>
            </div>
          </dl>

          {connection.lastErrorMessage ? (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {connection.lastErrorMessage}
            </p>
          ) : null}

          {canManageGsc ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSyncLatestRange()}
                  disabled={syncControlsDisabled}
                  className={btnPrimary}
                >
                  {syncing ? 'Syncing…' : 'Sync latest range'}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomPanelOpen((open) => !open)}
                  disabled={syncControlsDisabled}
                  className={btnSecondary}
                  aria-expanded={customPanelOpen}
                  aria-controls="gsc-custom-sync-panel"
                >
                  Custom date range
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (connection.requestedSiteUrl) {
                      setRequestedSiteUrl(connection.requestedSiteUrl);
                    }
                    if (connection.expectedEmail) {
                      setExpectedEmail(connection.expectedEmail);
                    }
                    void handleConnect();
                  }}
                  disabled={connecting || !formValid || syncing}
                  className={btnSecondary}
                >
                  {connecting ? 'Connecting…' : 'Reconnect'}
                </button>
                <button
                  type="button"
                  onClick={() => setDisconnectOpen(true)}
                  disabled={busy}
                  className={btnDanger}
                >
                  <Unplug className="h-4 w-4" />
                  Disconnect
                </button>
              </div>

              {customPanelOpen && syncBounds ? (
                <div
                  id="gsc-custom-sync-panel"
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <h4 className="text-sm font-bold text-zinc-900">Custom sync date range</h4>
                  <p className="mt-1 text-xs text-zinc-500">
                    Sync stored Search Console metrics for a chosen range. This does not change the
                    default latest-range sync.
                  </p>

                  <fieldset className="mt-3">
                    <legend className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Presets
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PRESET_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={syncControlsDisabled}
                          onClick={() => setCustomPreset(option.id)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 ${
                            customPreset === option.id
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="gsc-custom-date-from"
                        className="block text-xs font-bold uppercase tracking-widest text-zinc-400"
                      >
                        From date
                      </label>
                      <input
                        id="gsc-custom-date-from"
                        type="date"
                        value={customDateFrom}
                        max={customDateTo || syncBounds.latestSafeDate}
                        disabled={syncControlsDisabled || customPreset !== 'custom'}
                        onChange={(event) => {
                          setCustomPreset('custom');
                          setCustomDateFrom(event.target.value);
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="gsc-custom-date-to"
                        className="block text-xs font-bold uppercase tracking-widest text-zinc-400"
                      >
                        To date
                      </label>
                      <input
                        id="gsc-custom-date-to"
                        type="date"
                        value={customDateTo}
                        min={customDateFrom || undefined}
                        max={syncBounds.latestSafeDate}
                        disabled={syncControlsDisabled || customPreset !== 'custom'}
                        onChange={(event) => {
                          setCustomPreset('custom');
                          setCustomDateTo(event.target.value);
                        }}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Selected range
                      </dt>
                      <dd className="mt-1 font-medium text-zinc-800">
                        {customDayCount > 0 ? formatDayCount(customDayCount) : 'Select valid dates'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Latest safe GSC date
                      </dt>
                      <dd className="mt-1 font-medium text-zinc-800">{syncBounds.latestSafeDate}</dd>
                    </div>
                  </dl>

                  {customDayCount > 90 ? (
                    <p
                      className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                      role="status"
                    >
                      This range may take several minutes. Existing rows for these dates will be
                      refreshed.
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCustomSync()}
                      disabled={
                        syncControlsDisabled ||
                        !customDateFrom ||
                        !customDateTo ||
                        customDateFrom > customDateTo
                      }
                      className={btnPrimary}
                    >
                      {syncing ? 'Syncing…' : 'Run custom sync'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomPanelOpen(false)}
                      disabled={syncing}
                      className={btnSecondary}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {syncHistoryState.showRunning && syncHistoryState.running ? (
            <RunningSyncCard
              run={syncHistoryState.running}
              nowMs={syncHistoryState.nowMs}
            />
          ) : null}
        </div>
      ) : null}

      <GscSyncHistoryContent
        state={syncHistoryState}
        onViewFullHistory={onViewFullSyncHistory}
        runningCardPlacement="external"
      />

      <AppConfirmDialog
        open={disconnectOpen}
        title="Disconnect Google Search Console?"
        body="This clears stored credentials and stops sync until a super admin reconnects. Historical metric rows are kept."
        confirmLabel="Disconnect"
        variant="danger"
        isProcessing={disconnecting}
        onCancel={() => {
          if (!disconnecting) setDisconnectOpen(false);
        }}
        onConfirm={() => void handleDisconnect()}
      />
    </section>
  );
}
