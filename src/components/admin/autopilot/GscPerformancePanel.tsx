import { useEffect, useMemo, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  resolveGscDateRangePreset,
  type GscDateRangePresetId,
} from '../../../lib/autopilot/gscSyncDateValidation';
import { AutopilotErrorState } from './AutopilotErrorState';

type GscPerformancePanelProps = {
  refreshKey: number;
};

type PerformanceData = Awaited<ReturnType<typeof adminAutopilotApi.getGscPerformance>>;

const PRESETS: Array<{ id: GscDateRangePresetId; label: string }> = [
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

function formatPosition(value: number | null | undefined): string {
  if (value == null) return '—';
  return value.toFixed(1);
}

type ChangeDirection = 'positive' | 'negative' | 'neutral';

function changeDirection(
  value: number | null | undefined,
  invert = false,
): ChangeDirection {
  if (value == null || value === 0) return 'neutral';
  const positive = value > 0;
  if (invert) return positive ? 'negative' : 'positive';
  return positive ? 'positive' : 'negative';
}

function ChangeBadge({
  value,
  invert = false,
  label,
}: {
  value: number | null | undefined;
  invert?: boolean;
  label: string;
}) {
  if (value == null) {
    return <span className="text-xs text-zinc-400">{label}: —</span>;
  }
  const dir = changeDirection(value, invert);
  const color =
    dir === 'positive'
      ? 'text-emerald-700'
      : dir === 'negative'
        ? 'text-rose-700'
        : 'text-zinc-500';
  const prefix = value > 0 ? '+' : '';
  return (
    <span className={`text-xs font-semibold ${color}`} aria-label={`${label} change`}>
      {prefix}
      {typeof value === 'number' && Math.abs(value) < 1 && Math.abs(value) > 0
        ? formatPct(value)
        : formatNumber(value)}
    </span>
  );
}

function MetricCard({
  label,
  value,
  change,
  invertChange = false,
}: {
  label: string;
  value: string;
  change?: number | null;
  invertChange?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
      {change !== undefined ? (
        <div className="mt-1">
          <ChangeBadge value={change} invert={invertChange} label={`${label} vs previous period`} />
        </div>
      ) : null}
    </div>
  );
}

export function GscPerformancePanel({ refreshKey }: GscPerformancePanelProps) {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [preset, setPreset] = useState<GscDateRangePresetId>('last_28_days');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [querySearch, setQuerySearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [tableTab, setTableTab] = useState<'queries' | 'pages'>('queries');
  const [tableOffset, setTableOffset] = useState(0);
  const tableLimit = 25;

  const defaultBounds = useMemo(
    () => resolveGscDateRangePreset('last_28_days', { latestSafeDate: dateTo || '2099-01-01' }),
    [dateTo],
  );

  useEffect(() => {
    if (!dateFrom && !dateTo && data?.period) {
      setDateFrom(data.period.dateFrom);
      setDateTo(data.period.dateTo);
    }
  }, [data?.period, dateFrom, dateTo]);

  const load = async (params?: {
    dateFrom?: string;
    dateTo?: string;
    comparisonDateFrom?: string | null;
    query?: string;
    page?: string;
    offset?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const from = params?.dateFrom ?? dateFrom;
      const to = params?.dateTo ?? dateTo;
      const query: Parameters<typeof adminAutopilotApi.getGscPerformance>[0] = {
        dateFrom: from,
        dateTo: to,
        query: params?.query ?? (querySearch || undefined),
        page: params?.page ?? (pageSearch || undefined),
        limit: tableLimit,
        offset: params?.offset ?? tableOffset,
      };
      if (!compareEnabled) {
        query.compare = false;
      }
      const report = await adminAutopilotApi.getGscPerformance(query);
      setData(report);
      if (report.period) {
        setDateFrom(report.period.dateFrom);
        setDateTo(report.period.dateTo);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load GSC performance'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load({ offset: 0 });
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPreset = (id: GscDateRangePresetId) => {
    setPreset(id);
    if (id === 'custom') return;
    const resolved = resolveGscDateRangePreset(id, {
      latestSafeDate: data?.dataQuality?.latestMetricDate ?? defaultBounds.dateTo,
    });
    setDateFrom(resolved.dateFrom);
    setDateTo(resolved.dateTo);
  };

  const handleApply = () => {
    setTableOffset(0);
    void load({ dateFrom, dateTo, offset: 0 });
  };

  const handleReset = () => {
    applyPreset('last_28_days');
    const resolved = resolveGscDateRangePreset('last_28_days', {
      latestSafeDate: data?.dataQuality?.latestMetricDate ?? defaultBounds.dateTo,
    });
    setCompareEnabled(true);
    setQuerySearch('');
    setPageSearch('');
    setTableOffset(0);
    void load({
      dateFrom: resolved.dateFrom,
      dateTo: resolved.dateTo,
      query: '',
      page: '',
      offset: 0,
    });
  };

  if (loading && !data) {
    return (
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm" aria-busy="true">
        <p className="text-sm text-zinc-500">Loading Search Console performance…</p>
      </section>
    );
  }

  if (error && !data) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  const summary = data?.summary;
  const comparison = data?.comparison;
  const hasData = summary != null;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Search Console performance</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Report over stored metrics — changing the period does not trigger a new sync.
          </p>
          {data?.period ? (
            <p className="mt-1 text-xs font-semibold text-zinc-600">
              Period: {data.period.dateFrom} → {data.period.dateTo}
              {data.comparisonPeriod && compareEnabled
                ? ` · Compared with ${data.comparisonPeriod.dateFrom} → ${data.comparisonPeriod.dateTo}`
                : ''}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh report
        </button>
      </div>

      {!data?.configured ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          Google Search Console is not connected. Connect above to view performance data.
        </div>
      ) : null}

      <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => applyPreset(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                preset === item.id
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400" htmlFor="gsc-perf-from">
              From
            </label>
            <input
              id="gsc-perf-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setPreset('custom');
                setDateFrom(e.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400" htmlFor="gsc-perf-to">
              To
            </label>
            <input
              id="gsc-perf-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setPreset('custom');
                setDateTo(e.target.value);
              }}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={compareEnabled}
                onChange={(e) => setCompareEnabled(e.target.checked)}
              />
              Compare with previous period
            </label>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {error ? <AutopilotErrorState error={error} onRetry={() => void load()} /> : null}

      {!hasData && data?.configured ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
          No data available for the selected period. Try syncing Search Console or choosing a different date range.
        </div>
      ) : null}

      {hasData && summary ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard
              label="Clicks"
              value={formatNumber(summary.totalClicks)}
              change={comparison?.clicksChange}
            />
            <MetricCard
              label="Impressions"
              value={formatNumber(summary.totalImpressions)}
              change={comparison?.impressionsChange}
            />
            <MetricCard
              label="Search CTR"
              value={formatPct(summary.ctr)}
              change={comparison?.ctrChange}
            />
            <MetricCard
              label="Average position"
              value={formatPosition(summary.averagePosition)}
              change={comparison?.positionChange}
              invertChange
            />
            <MetricCard
              label="Ranking queries"
              value={formatNumber(summary.queryCount)}
              change={comparison?.queryCountChange}
            />
            <MetricCard
              label="Landing pages"
              value={formatNumber(summary.pageCount)}
              change={comparison?.pageCountChange}
            />
          </div>

          {data.trend.length > 0 ? (
            <div className="rounded-2xl border border-zinc-200 p-4">
              <h4 className="text-sm font-bold text-zinc-900">Clicks and impressions trend</h4>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 text-zinc-400">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Clicks</th>
                      <th className="py-2 pr-4">Impressions</th>
                      <th className="py-2 pr-4">CTR</th>
                      <th className="py-2">Avg. position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.trend.map((row) => (
                      <tr key={row.date} className="border-b border-zinc-50">
                        <td className="py-2 pr-4 font-medium text-zinc-800">{row.date}</td>
                        <td className="py-2 pr-4">{formatNumber(row.clicks)}</td>
                        <td className="py-2 pr-4">{formatNumber(row.impressions)}</td>
                        <td className="py-2 pr-4">{formatPct(row.ctr)}</td>
                        <td className="py-2">{formatPosition(row.averagePosition)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-zinc-200 p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTableTab('queries')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  tableTab === 'queries' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Top queries
              </button>
              <button
                type="button"
                onClick={() => setTableTab('pages')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  tableTab === 'pages' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}
              >
                Top pages
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                placeholder="Filter queries"
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                aria-label="Filter queries"
              />
              <input
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                placeholder="Filter pages"
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                aria-label="Filter pages"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setTableOffset(0);
                void load({ offset: 0 });
              }}
              className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
            >
              Apply table filters
            </button>

            {tableTab === 'queries' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-widest text-zinc-400">
                      <th className="py-2 pr-3">Query</th>
                      <th className="py-2 pr-3">Clicks</th>
                      <th className="py-2 pr-3">Impressions</th>
                      <th className="py-2 pr-3">CTR</th>
                      <th className="py-2 pr-3">Position</th>
                      <th className="py-2">Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topQueries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center italic text-zinc-400">
                          No queries in this period
                        </td>
                      </tr>
                    ) : (
                      data.topQueries.map((row) => (
                        <tr key={row.query} className="border-b border-zinc-50">
                          <td className="py-2 pr-3 font-medium text-zinc-900">{row.query}</td>
                          <td className="py-2 pr-3">{formatNumber(row.clicks)}</td>
                          <td className="py-2 pr-3">{formatNumber(row.impressions)}</td>
                          <td className="py-2 pr-3">{formatPct(row.ctr)}</td>
                          <td className="py-2 pr-3">{formatPosition(row.averagePosition)}</td>
                          <td className="py-2">{row.landingPageCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-widest text-zinc-400">
                      <th className="py-2 pr-3">Page</th>
                      <th className="py-2 pr-3">Clicks</th>
                      <th className="py-2 pr-3">Impressions</th>
                      <th className="py-2 pr-3">CTR</th>
                      <th className="py-2 pr-3">Position</th>
                      <th className="py-2">Queries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center italic text-zinc-400">
                          No pages in this period
                        </td>
                      </tr>
                    ) : (
                      data.topPages.map((row) => (
                        <tr key={row.page} className="border-b border-zinc-50">
                          <td className="py-2 pr-3 font-medium text-zinc-900 break-all">{row.page}</td>
                          <td className="py-2 pr-3">{formatNumber(row.clicks)}</td>
                          <td className="py-2 pr-3">{formatNumber(row.impressions)}</td>
                          <td className="py-2 pr-3">{formatPct(row.ctr)}</td>
                          <td className="py-2 pr-3">{formatPosition(row.averagePosition)}</td>
                          <td className="py-2">{row.queryCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>
                Showing {tableTab === 'queries' ? data.topQueries.length : data.topPages.length} of{' '}
                {tableTab === 'queries' ? data.topQueriesTotal : data.topPagesTotal}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={tableOffset === 0}
                  onClick={() => {
                    const next = Math.max(0, tableOffset - tableLimit);
                    setTableOffset(next);
                    void load({ offset: next });
                  }}
                  className="rounded-lg border border-zinc-200 px-2 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={
                    tableOffset + tableLimit >=
                    (tableTab === 'queries' ? data.topQueriesTotal : data.topPagesTotal)
                  }
                  onClick={() => {
                    const next = tableOffset + tableLimit;
                    setTableOffset(next);
                    void load({ offset: next });
                  }}
                  className="rounded-lg border border-zinc-200 px-2 py-1 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {data?.dataQuality ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          <h4 className="font-bold text-zinc-900">Data freshness</h4>
          <ul className="mt-2 space-y-1">
            <li>Latest metric date: {data.dataQuality.latestMetricDate ?? '—'}</li>
            <li>Stored rows in period: {data.dataQuality.sourceRowCount.toLocaleString()}</li>
            <li>Missing dates: {data.dataQuality.missingDates.length}</li>
            <li>Stale: {data.dataQuality.stale ? 'Yes' : 'No'}</li>
            <li>
              Last successful sync:{' '}
              {data.dataQuality.lastSuccessfulSyncAt
                ? new Date(data.dataQuality.lastSuccessfulSyncAt).toLocaleString()
                : 'Never'}
            </li>
          </ul>
        </div>
      ) : null}
    </section>
  );
}
