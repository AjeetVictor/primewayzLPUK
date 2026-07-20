import { useEffect, useMemo, useState } from 'react';
import { Link2, RefreshCcw, Unplug } from 'lucide-react';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import { useToast } from '../../ui/AppToast';
import { AppConfirmDialog } from '../../ui/AppConfirmDialog';
import { AutopilotErrorState } from './AutopilotErrorState';

type GscConnectionPanelProps = {
  refreshKey: number;
  canManageGsc: boolean;
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

export function GscConnectionPanel({ refreshKey, canManageGsc }: GscConnectionPanelProps) {
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

  const handleSync = async () => {
    if (!canManageGsc || syncing) return;
    setSyncing(true);
    setStatusMessage(null);
    try {
      const result = await adminAutopilotApi.runGscSync();
      const run = result.syncRun;
      showToast({ type: 'success', message: 'Search Console sync completed.' });
      setStatusMessage(
        `Sync succeeded — fetched ${String(run.rowsFetched ?? 0)} rows, stored ${String(run.rowsUpserted ?? 0)}.`,
      );
      await load();
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sync failed.';
      setStatusMessage(message);
      showToast({ type: 'error', message });
      await load();
    } finally {
      setSyncing(false);
    }
  };

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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSync()}
                disabled={syncing || connection.syncLocked || connection.status !== 'ACTIVE'}
                className={btnPrimary}
              >
                {syncing ? 'Syncing…' : 'Sync now'}
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
                disabled={connecting || !formValid}
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
          ) : null}
        </div>
      ) : null}

      {data?.recentSyncRuns?.length ? (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-zinc-900">Recent sync runs</h4>
          <ul className="mt-3 divide-y divide-zinc-100 rounded-2xl border border-zinc-100">
            {data.recentSyncRuns.map((run) => (
              <li key={String(run.id)} className="px-3 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-zinc-900">
                    {String(run.dateFrom)} → {String(run.dateTo)}
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {String(run.status)} · {String(run.trigger)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  Fetched {String(run.rowsFetched ?? 0)} · stored {String(run.rowsUpserted ?? 0)}
                  {run.startedAt
                    ? ` · started ${formatAutopilotDate(String(run.startedAt))}`
                    : ''}
                  {run.completedAt
                    ? ` · completed ${formatAutopilotDate(String(run.completedAt))}`
                    : ''}
                </p>
                {run.errorMessage ? (
                  <p className="mt-1 text-xs text-rose-700">{String(run.errorMessage)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
