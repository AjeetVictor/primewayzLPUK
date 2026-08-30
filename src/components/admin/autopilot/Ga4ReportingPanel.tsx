import { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
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

export function Ga4ReportingPanel({ refreshKey, canManage }: Ga4ReportingPanelProps) {
  const { showToast } = useToast();
  const [data, setData] = useState<Awaited<ReturnType<typeof adminAutopilotApi.getGa4Status>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminAutopilotApi.getGa4Status());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load GA4 status'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshKey]);

  const handleSync = async () => {
    if (!canManage || syncing) return;
    setSyncing(true);
    try {
      await adminAutopilotApi.runGa4Sync();
      showToast({ type: 'success', message: 'Google Analytics 4 sync completed.' });
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

  const cfg = data?.configuration;
  const syncDisabled = syncing || cfg?.syncLocked || !cfg?.configured || !canManage;

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
          <p className="font-semibold text-zinc-900">Not configured</p>
          <p className="mt-1">
            Set the GA4 service account environment variables to enable aggregate sync. Missing:{' '}
            {cfg?.missing.join(', ') || 'GA4 credentials'}.
          </p>
        </div>
      ) : (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Property</dt>
            <dd className="mt-1 text-sm text-zinc-800">{cfg.propertyId || '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Latest safe date</dt>
            <dd className="mt-1 text-sm text-zinc-800">{cfg.latestSafeDate || '—'}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Last sync</dt>
            <dd className="mt-1 text-sm text-zinc-800">
              {cfg.lastSuccessfulSync ? formatAutopilotDate(cfg.lastSuccessfulSync) : 'Never'}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Default lookback</dt>
            <dd className="mt-1 text-sm text-zinc-800">{cfg.defaultLookback} days</dd>
          </div>
        </dl>
      )}

      {cfg?.currentErrorMessage ? (
        <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {cfg.currentErrorMessage}
        </p>
      ) : null}

      {canManage && cfg?.configured ? (
        <div className="mt-4">
          <button type="button" onClick={() => void handleSync()} disabled={syncDisabled} className={btnPrimary}>
            {syncing ? 'Syncing…' : 'Sync latest range'}
          </button>
        </div>
      ) : null}

      {data?.recentSyncRuns?.length ? (
        <div className="mt-4">
          <h4 className="text-sm font-bold text-zinc-900">Recent sync runs</h4>
          <ul className="mt-2 space-y-2 text-sm text-zinc-700">
            {data.recentSyncRuns.map((run) => (
              <li key={run.id} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                {run.dateFrom} → {run.dateTo} · {run.status} · {run.rowsUpserted} rows stored
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
