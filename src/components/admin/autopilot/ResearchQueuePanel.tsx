import { useEffect, useState } from 'react';
import { BLOG_CATEGORIES } from '../../../data/blog/categories';
import { AUTOPILOT_TOPIC_STATUSES } from '../../../data/autopilot/status';
import {
  AUTOPILOT_RESEARCH_SNAPSHOT_STATUSES,
} from '../../../data/autopilot/researchStatus';
import {
  adminAutopilotApi,
  AutopilotClientError,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  DEFAULT_RESEARCH_QUEUE_FILTERS,
  formatCompletenessDisplay,
  getResearchSnapshotStatusLabel,
  serializeResearchQueueFilters,
  type AutopilotResearchQueueFilters,
} from '../../../lib/autopilot/adminResearchHelpers';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import { getTopicStatusLabel } from '../../../lib/autopilot/adminAutopilotLabels';
import { TopicStatusBadge } from './TopicStatusBadge';
import { AutopilotEmptyState } from './AutopilotEmptyState';
import { AutopilotErrorState } from './AutopilotErrorState';

type ResearchQueuePanelProps = {
  filters: AutopilotResearchQueueFilters;
  onFiltersChange: (filters: AutopilotResearchQueueFilters) => void;
  refreshKey: number;
  canContribute: boolean;
  onOpenTopic: (id: number) => void;
  onStartResearch: (topicId: number) => void;
};

type QueueItem = Awaited<
  ReturnType<typeof adminAutopilotApi.listResearchQueue>
>['items'][number];

export function ResearchQueuePanel({
  filters,
  onFiltersChange,
  refreshKey,
  canContribute,
  onOpenTopic,
  onStartResearch,
}: ResearchQueuePanelProps) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminAutopilotApi.listResearchQueue(
        serializeResearchQueueFilters(filters),
      );
      setItems(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load research queue'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshKey, filters]);

  const setFilter = <K extends keyof AutopilotResearchQueueFilters>(
    key: K,
    value: AutopilotResearchQueueFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value, offset: key === 'offset' ? Number(value) : 0 });
  };

  if (loading && items.length === 0 && !error) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500 shadow-sm">
        Loading research queue…
      </div>
    );
  }

  if (error && items.length === 0) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  const allConfirmed =
    items.length > 0 && items.every((item) => item.snapshotStatus === 'confirmed');
  const noTopics = !loading && total === 0 && !filters.q && !filters.topicStatus && !filters.snapshotStatus;

  if (noTopics && !filters.hasExactConflict && !filters.hasHighOverlap && !filters.needsMoreResearch) {
    return (
      <AutopilotEmptyState
        title="No topics available for research"
        description="Create or import topics first. Research snapshots are human-led and do not invent SERP evidence."
      />
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="space-y-4">
        <FilterBar filters={filters} setFilter={setFilter} onFiltersChange={onFiltersChange} />
        <AutopilotEmptyState
          title={allConfirmed ? 'All visible topics have confirmed research' : 'No topics match filters'}
          description="Adjust filters or open the Topic Pipeline to find candidates needing research."
          actionLabel="Clear filters"
          onAction={() => onFiltersChange(DEFAULT_RESEARCH_QUEUE_FILTERS)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold text-zinc-900">Research Queue</h3>
        <p className="text-sm text-zinc-500">
          Human-led research snapshots and deterministic overlap advisories — not live search or AI research.
        </p>
      </div>

      <FilterBar filters={filters} setFilter={setFilter} onFiltersChange={onFiltersChange} />

      {error ? <AutopilotErrorState error={error} onRetry={() => void load()} /> : null}

      <div className="overflow-x-auto rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <tr>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Keyword</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Topic status</th>
              <th className="px-4 py-3">Snapshot</th>
              <th className="px-4 py-3">Completeness</th>
              <th className="px-4 py-3">Exact / High</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const topic = item.topic;
              const hasDraft =
                item.snapshotStatus === 'draft' || item.snapshotStatus === 'ready_for_confirmation';
              const actionLabel = !item.snapshotStatus
                ? 'Start Research'
                : hasDraft
                  ? 'Continue Research'
                  : item.snapshotStatus === 'confirmed'
                    ? 'Review Research'
                    : 'Open Topic';
              return (
                <tr key={topic.id} className="border-b border-zinc-50 align-top">
                  <td className="px-4 py-3 font-semibold text-zinc-900">{topic.workingTitle}</td>
                  <td className="px-4 py-3 text-zinc-600">{topic.primaryKeyword}</td>
                  <td className="px-4 py-3 text-zinc-600">{topic.primaryCategory || '—'}</td>
                  <td className="px-4 py-3">
                    <TopicStatusBadge status={topic.topicStatus} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {getResearchSnapshotStatusLabel(item.snapshotStatus)}
                    {item.snapshotVersion != null ? ` · v${item.snapshotVersion}` : ''}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {formatCompletenessDisplay(item.completeness)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.exactConflictCount} / {item.highOverlapCount}
                  </td>
                  <td className="px-4 py-3 text-zinc-500">{formatAutopilotDate(item.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {canContribute ? (
                        <button
                          type="button"
                          onClick={() => onStartResearch(topic.id)}
                          className="text-left text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          {actionLabel}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onOpenTopic(topic.id)}
                        className="text-left text-xs font-bold text-zinc-600 hover:text-zinc-900"
                      >
                        Open Topic
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          Showing {items.length} of {total}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={filters.offset <= 0}
            onClick={() => setFilter('offset', Math.max(0, filters.offset - filters.limit))}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={filters.offset + filters.limit >= total}
            onClick={() => setFilter('offset', filters.offset + filters.limit)}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function FilterBar({
  filters,
  setFilter,
  onFiltersChange,
}: {
  filters: AutopilotResearchQueueFilters;
  setFilter: <K extends keyof AutopilotResearchQueueFilters>(
    key: K,
    value: AutopilotResearchQueueFilters[K],
  ) => void;
  onFiltersChange: (filters: AutopilotResearchQueueFilters) => void;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <input
          value={filters.q}
          onChange={(e) => setFilter('q', e.target.value)}
          placeholder="Search title or keyword"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          aria-label="Search research queue"
        />
        <select
          value={filters.topicStatus}
          onChange={(e) => setFilter('topicStatus', e.target.value)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          aria-label="Filter by topic status"
        >
          <option value="">All topic statuses</option>
          {AUTOPILOT_TOPIC_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getTopicStatusLabel(status)}
            </option>
          ))}
        </select>
        <select
          value={filters.snapshotStatus}
          onChange={(e) => setFilter('snapshotStatus', e.target.value)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          aria-label="Filter by snapshot status"
        >
          <option value="">All snapshot statuses</option>
          {AUTOPILOT_RESEARCH_SNAPSHOT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {getResearchSnapshotStatusLabel(status)}
            </option>
          ))}
        </select>
        <select
          value={filters.primaryCategory}
          onChange={(e) => setFilter('primaryCategory', e.target.value)}
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {BLOG_CATEGORIES.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          value={filters.minCompleteness}
          onChange={(e) => setFilter('minCompleteness', e.target.value)}
          placeholder="Min completeness"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          aria-label="Minimum completeness"
        />
        <input
          value={filters.maxCompleteness}
          onChange={(e) => setFilter('maxCompleteness', e.target.value)}
          placeholder="Max completeness"
          className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          aria-label="Maximum completeness"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-zinc-700">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.hasExactConflict}
            onChange={(e) => setFilter('hasExactConflict', e.target.checked)}
          />
          Exact conflicts
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.hasHighOverlap}
            onChange={(e) => setFilter('hasHighOverlap', e.target.checked)}
          />
          High overlap
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={filters.needsMoreResearch}
            onChange={(e) => setFilter('needsMoreResearch', e.target.checked)}
          />
          Needs more research
        </label>
        <button
          type="button"
          onClick={() => onFiltersChange(DEFAULT_RESEARCH_QUEUE_FILTERS)}
          className="ml-auto text-xs font-bold text-zinc-500 hover:text-zinc-800"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
