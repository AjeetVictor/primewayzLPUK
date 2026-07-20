import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RefreshCcw } from 'lucide-react';
import { BLOG_CATEGORIES } from '../../../data/blog/categories';
import {
  AUTOPILOT_DECISION_STATUSES,
  AUTOPILOT_TOPIC_STATUSES,
} from '../../../data/autopilot/status';
import { AUTOPILOT_RECOMMENDATION_BANDS } from '../../../data/autopilot/scoringConfig';
import type { AutopilotTopicRecord } from '../../../data/autopilot/types';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  type AutopilotPipelineFilters,
  calculatePaginationRange,
  countActivePipelineFilters,
  resetPipelineFilters,
  serialisePipelineFilters,
  validateScoreRange,
} from '../../../lib/autopilot/adminAutopilotPipelineHelpers';
import {
  getDecisionStatusLabel,
  getScoreBandLabel,
  getTopicStatusLabel,
} from '../../../lib/autopilot/adminAutopilotLabels';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import { TopicStatusBadge } from './TopicStatusBadge';
import { DecisionStatusBadge } from './DecisionStatusBadge';
import { ScoreBadge } from './ScoreBadge';
import { AutopilotEmptyState } from './AutopilotEmptyState';
import { AutopilotErrorState } from './AutopilotErrorState';

type TopicPipelineProps = {
  filters: AutopilotPipelineFilters;
  onFiltersChange: (next: AutopilotPipelineFilters) => void;
  refreshKey: number;
  canContribute: boolean;
  onOpenTopic: (id: number) => void;
  onCreateTopic: () => void;
};

export function TopicPipeline({
  filters,
  onFiltersChange,
  refreshKey,
  canContribute,
  onOpenTopic,
  onCreateTopic,
}: TopicPipelineProps) {
  const [items, setItems] = useState<AutopilotTopicRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [searchDraft, setSearchDraft] = useState(filters.q);
  const [scoreError, setScoreError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft === filters.q) return;
      onFiltersChange({ ...filters, q: searchDraft, offset: 0 });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const queryParams = useMemo(() => serialisePipelineFilters(filters), [filters]);
  const activeFilterCount = countActivePipelineFilters(filters);
  const range = calculatePaginationRange(total, filters.limit, filters.offset);

  const load = async (background = false) => {
    const rangeCheck = validateScoreRange(filters.minScore, filters.maxScore);
    if (!rangeCheck.ok) {
      setScoreError(rangeCheck.error || 'Invalid score range');
      setLoading(false);
      return;
    }
    setScoreError('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await adminAutopilotApi.listTopics(queryParams, controller.signal);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Failed to load topics'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load(refreshKey > 0);
    return () => abortRef.current?.abort();
  }, [queryParams.toString(), refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = <K extends keyof AutopilotPipelineFilters>(
    key: K,
    value: AutopilotPipelineFilters[K],
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      offset: key === 'offset' || key === 'limit' ? (key === 'limit' ? 0 : (value as number)) : 0,
      ...(key === 'limit' ? { limit: value as number, offset: 0 } : {}),
      ...(key === 'offset' ? { offset: value as number } : {}),
    });
  };

  const clearFilters = () => {
    setSearchDraft('');
    onFiltersChange(resetPipelineFilters(filters.limit));
  };

  if (loading && items.length === 0 && !error) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500 shadow-sm">
        Loading topic pipeline…
      </div>
    );
  }

  if (error && items.length === 0) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Topic pipeline</h3>
          <p className="text-sm text-zinc-500">
            Search and filter Autopilot topic candidates for editorial decisions.
            {activeFilterCount > 0 ? (
              <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
                {activeFilterCount} active filter{activeFilterCount === 1 ? '' : 's'}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            aria-label="Refresh topic pipeline"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canContribute ? (
            <button
              type="button"
              onClick={onCreateTopic}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Create topic
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-pipeline-search">
              Search
            </label>
            <input
              id="ap-pipeline-search"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Title or primary keyword"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-pipeline-topic-status">
              Topic status
            </label>
            <select
              id="ap-pipeline-topic-status"
              value={filters.topicStatus}
              onChange={(e) => updateFilter('topicStatus', e.target.value as AutopilotPipelineFilters['topicStatus'])}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All</option>
              {AUTOPILOT_TOPIC_STATUSES.map((status) => (
                <option key={status} value={status}>{getTopicStatusLabel(status)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-pipeline-decision-status">
              Decision status
            </label>
            <select
              id="ap-pipeline-decision-status"
              value={filters.decisionStatus}
              onChange={(e) => updateFilter('decisionStatus', e.target.value as AutopilotPipelineFilters['decisionStatus'])}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All</option>
              {AUTOPILOT_DECISION_STATUSES.map((status) => (
                <option key={status} value={status}>{getDecisionStatusLabel(status)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-pipeline-category">
              Primary category
            </label>
            <select
              id="ap-pipeline-category"
              value={filters.primaryCategory}
              onChange={(e) => updateFilter('primaryCategory', e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All</option>
              {BLOG_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-pipeline-band">
              Score band
            </label>
            <select
              id="ap-pipeline-band"
              value={filters.scoreBand}
              onChange={(e) => updateFilter('scoreBand', e.target.value as AutopilotPipelineFilters['scoreBand'])}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All</option>
              {AUTOPILOT_RECOMMENDATION_BANDS.map((band) => (
                <option key={band} value={band}>{getScoreBandLabel(band)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-pipeline-min-score">
              Min score
            </label>
            <input
              id="ap-pipeline-min-score"
              type="number"
              min={0}
              max={100}
              value={filters.minScore}
              onChange={(e) => updateFilter('minScore', e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-pipeline-max-score">
              Max score
            </label>
            <input
              id="ap-pipeline-max-score"
              type="number"
              min={0}
              max={100}
              value={filters.maxScore}
              onChange={(e) => updateFilter('maxScore', e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={filters.includeArchived}
                onChange={(e) => updateFilter('includeArchived', e.target.checked)}
                className="rounded border-zinc-300"
              />
              Include archived
            </label>
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Clear filters
            </button>
          </div>
        </div>
        {scoreError ? (
          <p className="mt-3 text-sm font-medium text-red-600" role="alert">{scoreError}</p>
        ) : null}
      </div>

      {error ? <AutopilotErrorState error={error} onRetry={() => void load(true)} /> : null}

      {!loading && items.length === 0 ? (
        <AutopilotEmptyState
          title="No topics match these filters"
          description="Topics are reviewed before briefs or drafts are created. Adjust filters or create a new candidate topic."
          actionLabel={canContribute ? 'Create topic' : undefined}
          onAction={canContribute ? onCreateTopic : undefined}
        />
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden" ref={tableRef}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Working title</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Primary keyword</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Category</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Topic status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Decision</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Score</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Assigned</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Updated</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((topic) => (
                  <tr
                    key={topic.id}
                    className="hover:bg-zinc-50/50 cursor-pointer"
                    onClick={() => onOpenTopic(topic.id)}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900">{topic.workingTitle}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{topic.primaryKeyword}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{topic.primaryCategory || '—'}</td>
                    <td className="px-6 py-4"><TopicStatusBadge status={topic.topicStatus} /></td>
                    <td className="px-6 py-4"><DecisionStatusBadge status={topic.decisionStatus} /></td>
                    <td className="px-6 py-4"><ScoreBadge totalScore={topic.totalScore} /></td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {topic.assignedToId != null ? `#${topic.assignedToId}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{formatAutopilotDate(topic.updatedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTopic(topic.id);
                        }}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4">
            <p className="text-sm text-zinc-500">
              {range.total === 0
                ? 'No results'
                : `Showing ${range.from}–${range.to} of ${range.total}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!range.hasPrev}
                onClick={() => updateFilter('offset', Math.max(0, filters.offset - filters.limit))}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!range.hasNext}
                onClick={() => updateFilter('offset', filters.offset + filters.limit)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
