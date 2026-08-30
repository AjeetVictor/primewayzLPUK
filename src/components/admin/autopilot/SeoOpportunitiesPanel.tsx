import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, RefreshCcw } from 'lucide-react';
import { AUTOPILOT_KEYWORD_CANDIDATE_STATUSES } from '../../../data/autopilot/keywordImportStatus';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  buildConversionPayload,
  suggestWorkingTitleFromKeyword,
} from '../../../lib/autopilot/adminKeywordImportHelpers';
import { calculatePaginationRange } from '../../../lib/autopilot/adminAutopilotPipelineHelpers';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import { useToast } from '../../ui/AppToast';
import { AutopilotEmptyState } from './AutopilotEmptyState';
import { AutopilotErrorState } from './AutopilotErrorState';

const OPPORTUNITY_TYPES = [
  { id: 'near_ranking', label: 'Near ranking' },
  { id: 'high_impression_low_ctr', label: 'High impressions / low CTR' },
  { id: 'cannibalisation', label: 'Cannibalisation' },
  { id: 'declining_page', label: 'Declining page' },
  { id: 'query_page_mismatch', label: 'Query/page mismatch' },
  { id: 'internal_link', label: 'Internal-link opportunity' },
] as const;

type SeoOpportunitiesPanelProps = {
  refreshKey: number;
  canContribute: boolean;
  onOpenTopic: (id: number) => void;
  onMutated: () => void;
};

type Filters = {
  q: string;
  opportunityType: string;
  status: string;
  minImpressions: string;
  minPosition: string;
  maxPosition: string;
  page: string;
  convertedOnly: boolean;
  unreviewedOnly: boolean;
  limit: number;
  offset: number;
};

const DEFAULT_FILTERS: Filters = {
  q: '',
  opportunityType: '',
  status: '',
  minImpressions: '',
  minPosition: '',
  maxPosition: '',
  page: '',
  convertedOnly: false,
  unreviewedOnly: false,
  limit: 25,
  offset: 0,
};

function formatMetric(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return String(value);
}

function formatPct(value: unknown): string {
  if (value == null) return '—';
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(2)}%`;
}

export function SeoOpportunitiesPanel({
  refreshKey,
  canContribute,
  onOpenTopic,
  onMutated,
}: SeoOpportunitiesPanelProps) {
  const { showToast } = useToast();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [convertForm, setConvertForm] = useState({
    workingTitle: '',
    userProblem: '',
    audience: '',
    market: 'United Kingdom',
    language: 'en-GB',
  });
  const [convertError, setConvertError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params: Record<string, string | number | boolean> = {
      limit: filters.limit,
      offset: filters.offset,
    };
    if (filters.q.trim()) params.q = filters.q.trim();
    if (filters.opportunityType) params.opportunityType = filters.opportunityType;
    if (filters.status) params.status = filters.status;
    if (filters.page.trim()) params.page = filters.page.trim();
    if (filters.minImpressions) params.minImpressions = filters.minImpressions;
    if (filters.minPosition) params.minPosition = filters.minPosition;
    if (filters.maxPosition) params.maxPosition = filters.maxPosition;
    if (filters.convertedOnly) params.convertedOnly = true;
    if (filters.unreviewedOnly) params.unreviewedOnly = true;
    return params;
  }, [filters]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAutopilotApi.listSeoOpportunities(query);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load SEO opportunities'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [query, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const range = calculatePaginationRange(total, filters.limit, filters.offset);

  const patchCandidate = async (
    id: number,
    body: Record<string, unknown>,
    successMessage: string,
  ) => {
    setBusyId(id);
    try {
      await adminAutopilotApi.patchKeywordCandidate(id, body);
      showToast({ type: 'success', message: successMessage });
      onMutated();
      await load();
    } catch (err) {
      showToast({
        type: 'error',
        message:
          err instanceof AutopilotClientError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Action failed.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const openConvert = (row: Record<string, unknown>) => {
    const keyword = String(row.keyword ?? '');
    setSelected(row);
    setConvertForm({
      workingTitle: suggestWorkingTitleFromKeyword(keyword),
      userProblem: '',
      audience: '',
      market: 'United Kingdom',
      language: 'en-GB',
    });
    setConvertError(null);
    setConvertOpen(true);
  };

  const handleConvert = async () => {
    if (!selected || !canContribute) return;
    const id = Number(selected.id);
    if (!Number.isInteger(id)) return;
    setBusyId(id);
    setConvertError(null);
    try {
      const result = await adminAutopilotApi.convertKeywordCandidate(
        id,
        buildConversionPayload(convertForm),
      );
      setConvertOpen(false);
      setSelected(null);
      showToast({
        type: 'success',
        message: 'Converted to topic. Start research when ready — it will not begin automatically.',
      });
      onMutated();
      onOpenTopic(Number(result.topic.id));
    } catch (err) {
      setConvertError(
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Conversion failed.',
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading && items.length === 0 && !error) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500">
        Loading SEO opportunities…
      </div>
    );
  }

  if (error && items.length === 0) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">SEO Opportunities</h3>
          <p className="text-sm text-zinc-500">
            Automatically detected findings from synced Search Console data. Review before converting to topics.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value, offset: 0 }))}
            placeholder="Search query"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            aria-label="Search query"
          />
          <select
            value={filters.opportunityType}
            onChange={(e) =>
              setFilters((f) => ({ ...f, opportunityType: e.target.value, offset: 0 }))
            }
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            aria-label="Opportunity type"
          >
            <option value="">All types</option>
            {OPPORTUNITY_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, offset: 0 }))}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            aria-label="Status"
          >
            <option value="">All statuses</option>
            {AUTOPILOT_KEYWORD_CANDIDATE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={filters.page}
            onChange={(e) => setFilters((f) => ({ ...f, page: e.target.value, offset: 0 }))}
            placeholder="Page URL contains"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            aria-label="Page filter"
          />
          <input
            value={filters.minImpressions}
            onChange={(e) =>
              setFilters((f) => ({ ...f, minImpressions: e.target.value, offset: 0 }))
            }
            placeholder="Min impressions"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            aria-label="Minimum impressions"
          />
          <input
            value={filters.minPosition}
            onChange={(e) => setFilters((f) => ({ ...f, minPosition: e.target.value, offset: 0 }))}
            placeholder="Min position"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            aria-label="Minimum position"
          />
          <input
            value={filters.maxPosition}
            onChange={(e) => setFilters((f) => ({ ...f, maxPosition: e.target.value, offset: 0 }))}
            placeholder="Max position"
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            aria-label="Maximum position"
          />
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={filters.unreviewedOnly}
              onChange={(e) =>
                setFilters((f) => ({ ...f, unreviewedOnly: e.target.checked, offset: 0 }))
              }
            />
            Unreviewed only
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={filters.convertedOnly}
              onChange={(e) =>
                setFilters((f) => ({ ...f, convertedOnly: e.target.checked, offset: 0 }))
              }
            />
            Converted only
          </label>
        </div>
      </div>

      {items.length === 0 ? (
        <AutopilotEmptyState
          title="No SEO opportunities yet"
          description="Run a Search Console sync to analyse stored metrics. Opportunities appear here after sync — not in Keyword Imports."
        />
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left border-collapse text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  {[
                    'Query',
                    'Type',
                    'Page',
                    'Target',
                    'Clicks',
                    'Impressions',
                    'CTR',
                    'Position',
                    'Evidence',
                    'Confidence',
                    'Status',
                    'Detected',
                    'Action',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((row) => {
                  const id = Number(row.id);
                  const busy = busyId === id;
                  const pageUrl = String(row.currentUrl ?? '—');
                  const targetPage = String(row.targetPage ?? '—');
                  return (
                    <tr key={id} className="hover:bg-zinc-50/40">
                      <td className="px-4 py-3 font-semibold text-zinc-900">{String(row.keyword)}</td>
                      <td className="px-4 py-3 text-zinc-600">{String(row.opportunityType ?? '—')}</td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-zinc-600" title={pageUrl}>
                        {pageUrl}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-zinc-600" title={targetPage}>
                        {targetPage}
                      </td>
                      <td className="px-4 py-3">{formatMetric(row.clicks)}</td>
                      <td className="px-4 py-3">{formatMetric(row.impressions)}</td>
                      <td className="px-4 py-3">{formatPct(row.ctr)}</td>
                      <td className="px-4 py-3">{formatMetric(row.averagePosition)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">{String(row.evidencePeriod ?? '—')}</td>
                      <td className="px-4 py-3 capitalize">{String(row.confidence ?? '—')}</td>
                      <td className="px-4 py-3">{String(row.status)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {row.lastDetectedAt
                          ? formatAutopilotDate(String(row.lastDetectedAt))
                          : formatAutopilotDate(String(row.updatedAt ?? row.createdAt ?? ''))}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {canContribute && row.status !== 'converted' ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void patchCandidate(id, { status: 'reviewing' }, 'Marked as reviewing.')
                                }
                                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-bold hover:bg-zinc-50"
                              >
                                Review
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void patchCandidate(
                                    id,
                                    { status: 'deferred' },
                                    'Deferred for later review.',
                                  )
                                }
                                className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-bold hover:bg-zinc-50"
                              >
                                Defer
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void patchCandidate(
                                    id,
                                    {
                                      status: 'rejected',
                                      reviewNotes: 'Dismissed from SEO opportunities review.',
                                    },
                                    'Dismissed.',
                                  )
                                }
                                className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50"
                              >
                                Dismiss
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => openConvert(row)}
                                className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-bold text-white hover:bg-zinc-800"
                              >
                                Convert
                              </button>
                            </>
                          ) : null}
                          {row.convertedTopicId ? (
                            <button
                              type="button"
                              onClick={() => onOpenTopic(Number(row.convertedTopicId))}
                              className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-700"
                            >
                              Open topic
                            </button>
                          ) : null}
                          {pageUrl.startsWith('http') ? (
                            <a
                              href={pageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg border border-zinc-200 px-2 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500">
            <span>
              {range.from}–{range.to} of {total}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={filters.offset === 0}
                onClick={() => setFilters((f) => ({ ...f, offset: Math.max(0, f.offset - f.limit) }))}
                className="rounded-lg border border-zinc-200 px-2 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={filters.offset + filters.limit >= total}
                onClick={() => setFilters((f) => ({ ...f, offset: f.offset + f.limit }))}
                className="rounded-lg border border-zinc-200 px-2 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {convertOpen && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h4 className="text-lg font-bold text-zinc-900">Convert to topic</h4>
            <p className="mt-1 text-sm text-zinc-500">
              Creates an editorial topic candidate only. Research and approval remain manual.
            </p>
            <div className="mt-4 space-y-3">
              <input
                value={convertForm.workingTitle}
                onChange={(e) => setConvertForm((f) => ({ ...f, workingTitle: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Working title"
              />
              <textarea
                value={convertForm.userProblem}
                onChange={(e) => setConvertForm((f) => ({ ...f, userProblem: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                rows={3}
                placeholder="User problem"
              />
              <input
                value={convertForm.audience}
                onChange={(e) => setConvertForm((f) => ({ ...f, audience: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Audience"
              />
            </div>
            {convertError ? <p className="mt-3 text-sm text-rose-700">{convertError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConvertOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConvert()}
                disabled={busyId != null}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Convert to topic
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
