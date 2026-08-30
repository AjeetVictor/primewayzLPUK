import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  resolveGa4DateRangePreset,
  type Ga4DateRangePresetId,
} from '../../../lib/seo/ga4SyncDateValidation';
import { AutopilotErrorState } from './AutopilotErrorState';

type Ga4PerformancePanelProps = {
  refreshKey: number;
};

type PerformanceData = Awaited<ReturnType<typeof adminAutopilotApi.getGa4Performance>>;

const PRESETS: Array<{ id: Ga4DateRangePresetId; label: string }> = [
  { id: 'last_7_days', label: 'Last 7 days' },
  { id: 'last_28_days', label: 'Last 28 days' },
  { id: 'last_90_days', label: 'Last 90 days' },
  { id: 'this_month', label: 'This month' },
  { id: 'previous_month', label: 'Previous month' },
  { id: 'custom', label: 'Custom' },
];

function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatPct(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${(value * 100).toFixed(2)}%`;
}

function formatDuration(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}s`;
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

export function Ga4PerformancePanel({ refreshKey }: Ga4PerformancePanelProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [preset, setPreset] = useState<Ga4DateRangePresetId>('last_28_days');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [tableOffset, setTableOffset] = useState(0);
  const tableLimit = 25;

  const load = async (params?: { dateFrom?: string; dateTo?: string; page?: string; offset?: number }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAutopilotApi.getGa4Performance({
        dateFrom: params?.dateFrom ?? dateFrom,
        dateTo: params?.dateTo ?? dateTo,
        page: (params?.page ?? pageSearch) || undefined,
        limit: tableLimit,
        offset: params?.offset ?? tableOffset,
        compare: true,
      });
      setData(result);
      if (result.period) {
        setDateFrom(result.period.dateFrom);
        setDateTo(result.period.dateTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load GA4 performance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshKey]);

  const bounds = useMemo(
    () => resolveGa4DateRangePreset('last_28_days', { latestSafeDate: dateTo || '2099-01-01' }),
    [dateTo],
  );

  useEffect(() => {
    if (preset === 'custom') return;
    const resolved = resolveGa4DateRangePreset(preset, {
      latestSafeDate: bounds.dateTo,
    });
    setDateFrom(resolved.dateFrom);
    setDateTo(resolved.dateTo);
  }, [preset, bounds.dateTo]);

  const summary = data?.summary;
  const quality = data?.dataQuality as
    | {
        matchedRowCount?: number;
        unmatchedRowCount?: number;
        unmatchedLandingPageCount?: number;
        latestMetricDate?: string | null;
        missingDates?: string[];
        stale?: boolean;
      }
    | null
    | undefined;

  if (!data?.configured) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-bold text-zinc-900">GA4 performance</h3>
        <p className="mt-2 text-sm text-zinc-500">
          Configure GA4 reporting credentials before viewing stored performance data.
        </p>
      </section>
    );
  }

  if (error && !data) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm" aria-busy={loading}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">GA4 performance</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Stored aggregate metrics — report filters never trigger a sync.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm">
          <RefreshCcw className={`inline h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setPreset(option.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              preset === option.id
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-200 bg-white text-zinc-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-zinc-600">
          From
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setPreset('custom');
              setDateFrom(e.target.value);
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-zinc-600">
          To
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setPreset('custom');
              setDateTo(e.target.value);
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs font-semibold text-zinc-600 sm:col-span-2">
          Page filter
          <input
            type="search"
            value={pageSearch}
            onChange={(e) => setPageSearch(e.target.value)}
            placeholder="/services/…"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <button
        type="button"
        className="mt-3 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        onClick={() => {
          setTableOffset(0);
          void load({ dateFrom, dateTo, page: pageSearch, offset: 0 });
        }}
      >
        Apply report filters
      </button>

      {!summary ? (
        <p className="mt-4 text-sm text-zinc-500">No data for the selected period.</p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard label="Organic sessions" value={formatNumber(summary.organicSessions)} />
          <MetricCard label="Engaged sessions" value={formatNumber(summary.engagedSessions)} />
          <MetricCard label="Engagement rate" value={formatPct(summary.engagementRate)} />
          <MetricCard
            label="Avg engagement time"
            value={formatDuration(summary.averageEngagementTime)}
          />
          <MetricCard label="Key events" value={formatNumber(summary.keyEvents)} />
          <MetricCard label="generate_lead" value={formatNumber(summary.generateLeadEvents)} />
        </div>
      )}

      {quality ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <p className="font-semibold text-zinc-900">Data quality</p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            <li>Matched rows: {quality.matchedRowCount ?? '—'}</li>
            <li>Unmatched rows: {quality.unmatchedRowCount ?? '—'}</li>
            <li>Unmatched landing pages: {quality.unmatchedLandingPageCount ?? '—'}</li>
            <li>Latest imported date: {quality.latestMetricDate || '—'}</li>
            <li>Missing dates: {quality.missingDates?.length ?? '—'}</li>
            <li>Stale: {quality.stale ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      ) : null}

      {data.topPages.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                <th className="px-2 py-2">Page</th>
                <th className="px-2 py-2">Organic</th>
                <th className="px-2 py-2">Engaged</th>
                <th className="px-2 py-2">Eng. rate</th>
                <th className="px-2 py-2">Avg time</th>
                <th className="px-2 py-2">Key events</th>
                <th className="px-2 py-2">Leads</th>
                <th className="px-2 py-2">Forms</th>
                <th className="px-2 py-2">Bookings</th>
                <th className="px-2 py-2">Match</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((row, index) => {
                const page = row as Record<string, unknown>;
                return (
                  <tr key={`${page.observedLandingPage}-${index}`} className="border-b border-zinc-100">
                    <td className="max-w-xs truncate px-2 py-2">
                      {String(page.canonicalUrl || page.observedLandingPage || '—')}
                    </td>
                    <td className="px-2 py-2">{formatNumber(page.organicSessions as number)}</td>
                    <td className="px-2 py-2">{formatNumber(page.engagedSessions as number)}</td>
                    <td className="px-2 py-2">{formatPct(page.engagementRate as number | null)}</td>
                    <td className="px-2 py-2">
                      {formatDuration(page.averageEngagementTime as number | null)}
                    </td>
                    <td className="px-2 py-2">{formatNumber(page.keyEvents as number)}</td>
                    <td className="px-2 py-2">{formatNumber(page.generateLeadEvents as number)}</td>
                    <td className="px-2 py-2">
                      {formatNumber(page.contactFormConversions as number)}
                    </td>
                    <td className="px-2 py-2">{formatNumber(page.bookingConversions as number)}</td>
                    <td className="px-2 py-2">
                      {page.matchStatus === 'matched' ? 'Matched' : 'Unmatched'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              disabled={tableOffset <= 0}
              className="rounded-lg border border-zinc-200 px-3 py-1 text-xs disabled:opacity-40"
              onClick={() => {
                const next = Math.max(tableOffset - tableLimit, 0);
                setTableOffset(next);
                void load({ offset: next });
              }}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={tableOffset + tableLimit >= (data.topPagesTotal ?? 0)}
              className="rounded-lg border border-zinc-200 px-3 py-1 text-xs disabled:opacity-40"
              onClick={() => {
                const next = tableOffset + tableLimit;
                setTableOffset(next);
                void load({ offset: next });
              }}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
