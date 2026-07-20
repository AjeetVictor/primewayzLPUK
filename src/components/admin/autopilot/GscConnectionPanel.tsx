import { useEffect, useState } from 'react';
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

const btnPrimary =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 active:bg-zinc-950 disabled:cursor-not-allowed disabled:opacity-50';
const btnSecondary =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 active:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50';
const btnDanger =
  'inline-flex min-w-[8.5rem] items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 active:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50';

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

export function GscConnectionPanel({ refreshKey, canManageGsc }: GscConnectionPanelProps) {
  const { showToast } = useToast();
  const [data, setData] = useState<GscStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [connecting, setConnecting] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [properties, setProperties] = useState<
    Array<{ siteUrl: string; permissionLevel: string | null }>
  >([]);
  const [selectedSiteUrl, setSelectedSiteUrl] = useState('');
  const [savingProperty, setSavingProperty] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await adminAutopilotApi.getGscStatus();
      setData(status);
      if (status.connection?.siteUrl) {
        setSelectedSiteUrl(status.connection.siteUrl);
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
    if (gsc === 'connected') {
      setStatusMessage('Google Search Console connected. Select a property to activate sync.');
      showToast({ type: 'success', message: 'Google Search Console connected.' });
    } else if (gsc === 'error') {
      const msg = params.get('gscMessage') || 'Google Search Console connection failed.';
      setStatusMessage(msg);
      showToast({ type: 'error', message: msg });
    }
  }, [showToast]);

  const connection = data?.connection ?? null;
  const configured = data?.configuration.configured ?? false;
  const isUnconfigured = connection?.status === 'CONNECTED_UNCONFIGURED';
  const isActive = connection?.status === 'ACTIVE';
  const needsReauth = connection?.status === 'NEEDS_REAUTHENTICATION';
  const busy =
    connecting || loadingProperties || savingProperty || syncing || disconnecting;

  const handleConnect = async () => {
    if (!canManageGsc || connecting) return;
    setConnecting(true);
    setStatusMessage(null);
    try {
      const result = await adminAutopilotApi.createGscAuthUrl();
      window.location.assign(result.authorizationUrl);
    } catch (err) {
      setConnecting(false);
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to start Google authorisation.';
      setStatusMessage(message);
      showToast({ type: 'error', message });
    }
  };

  const handleLoadProperties = async () => {
    if (!canManageGsc || loadingProperties) return;
    setLoadingProperties(true);
    setStatusMessage(null);
    try {
      const result = await adminAutopilotApi.listGscProperties();
      setProperties(result.properties);
      if (result.properties.length === 1) {
        setSelectedSiteUrl(result.properties[0].siteUrl);
      }
      setStatusMessage(
        result.properties.length
          ? `Loaded ${result.properties.length} accessible propert${result.properties.length === 1 ? 'y' : 'ies'}.`
          : 'No Search Console properties are accessible for this Google account.',
      );
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to list properties.';
      setStatusMessage(message);
      showToast({ type: 'error', message });
    } finally {
      setLoadingProperties(false);
    }
  };

  const handleSaveProperty = async () => {
    if (!canManageGsc || savingProperty || !selectedSiteUrl) return;
    setSavingProperty(true);
    setStatusMessage(null);
    try {
      await adminAutopilotApi.selectGscProperty(selectedSiteUrl);
      showToast({ type: 'success', message: 'Search Console property saved.' });
      setStatusMessage('Property saved. You can run a manual sync.');
      await load();
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to save property.';
      setStatusMessage(message);
      showToast({ type: 'error', message });
    } finally {
      setSavingProperty(false);
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
      setProperties([]);
      setSelectedSiteUrl('');
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

  const selectedPermission =
    properties.find((p) => p.siteUrl === selectedSiteUrl)?.permissionLevel ??
    connection?.permissionLevel ??
    null;

  return (
    <section
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
      aria-busy={busy || undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Google Search Console</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Connect GSC, select the Primewayz UK property, and run a manual performance sync.
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

      {!connection || connection.status === 'DISCONNECTED' ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium text-zinc-800">
            Google Search Console is not connected
          </p>
          {canManageGsc ? (
            <button
              type="button"
              onClick={() => void handleConnect()}
              disabled={!configured || connecting}
              className={btnPrimary}
            >
              <Link2 className="h-4 w-4" />
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          ) : (
            <p className="text-sm text-zinc-500">Ask a super admin to connect Search Console.</p>
          )}
        </div>
      ) : null}

      {connection && isUnconfigured ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-emerald-700">
            Connection successful. Select an accessible Search Console property.
          </p>
          {canManageGsc ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleLoadProperties()}
                  disabled={loadingProperties}
                  className={btnSecondary}
                >
                  {loadingProperties ? 'Loading…' : 'Load properties'}
                </button>
              </div>
              {properties.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Property
                  </label>
                  <select
                    value={selectedSiteUrl}
                    onChange={(event) => setSelectedSiteUrl(event.target.value)}
                    disabled={savingProperty}
                    className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800"
                  >
                    <option value="">Select a property…</option>
                    {properties.map((property) => (
                      <option key={property.siteUrl} value={property.siteUrl}>
                        {property.siteUrl}
                        {property.permissionLevel ? ` (${property.permissionLevel})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedPermission ? (
                    <p className="text-xs text-zinc-500">
                      Permission level: {selectedPermission}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleSaveProperty()}
                    disabled={!selectedSiteUrl || savingProperty}
                    className={btnPrimary}
                  >
                    {savingProperty ? 'Saving…' : 'Save property'}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-zinc-500">
              A super admin must select the property before sync can run.
            </p>
          )}
        </div>
      ) : null}

      {connection && (isActive || needsReauth || connection.status === 'ERROR') ? (
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
                Permission
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {connection.permissionLevel || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Health
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">{statusLabel(connection.status)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Last successful sync
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
              {needsReauth ? (
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  disabled={connecting}
                  className={btnPrimary}
                >
                  {connecting ? 'Connecting…' : 'Reconnect'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSync()}
                  disabled={syncing || connection.syncLocked}
                  className={btnPrimary}
                >
                  {syncing ? 'Syncing…' : 'Sync now'}
                </button>
              )}
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
