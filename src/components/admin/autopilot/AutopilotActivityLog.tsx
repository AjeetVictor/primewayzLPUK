import { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import {
  AUTOPILOT_ENTITY_TYPES,
  AUTOPILOT_EVENT_TYPES,
} from '../../../data/autopilot/eventTypes';
import type { AutopilotActivityLogRecord } from '../../../data/autopilot/types';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  buildSafeEventSummary,
  canOpenTopicFromActivity,
  compactValuePreview,
  ensureRedactedMetadata,
  formatAutopilotDate,
  getActivityActorLabel,
  getTopicIdFromActivity,
} from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import {
  getEntityTypeLabel,
  getEventTypeLabel,
} from '../../../lib/autopilot/adminAutopilotLabels';
import { calculatePaginationRange } from '../../../lib/autopilot/adminAutopilotPipelineHelpers';
import { AutopilotEmptyState } from './AutopilotEmptyState';
import { AutopilotErrorState } from './AutopilotErrorState';

export type AutopilotActivityFilters = {
  eventType: string;
  entityType: string;
  entityId: string;
  limit: number;
  offset: number;
};

export const DEFAULT_ACTIVITY_FILTERS: AutopilotActivityFilters = {
  eventType: '',
  entityType: '',
  entityId: '',
  limit: 20,
  offset: 0,
};

type AutopilotActivityLogProps = {
  filters: AutopilotActivityFilters;
  onFiltersChange: (next: AutopilotActivityFilters) => void;
  refreshKey: number;
  onOpenTopic: (id: number) => void;
};

export function AutopilotActivityLog({
  filters,
  onFiltersChange,
  refreshKey,
  onOpenTopic,
}: AutopilotActivityLogProps) {
  const [items, setItems] = useState<AutopilotActivityLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const query = useMemo(() => {
    const params: Record<string, string | number | undefined> = {
      limit: filters.limit,
      offset: filters.offset,
    };
    if (filters.eventType) params.eventType = filters.eventType;
    if (filters.entityType) params.entityType = filters.entityType;
    if (filters.entityId.trim()) params.entityId = filters.entityId.trim();
    return params;
  }, [filters]);

  const range = calculatePaginationRange(total, filters.limit, filters.offset);

  const load = async (background = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await adminAutopilotApi.listActivity(query, controller.signal);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Failed to load activity'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load(refreshKey > 0);
    return () => abortRef.current?.abort();
  }, [JSON.stringify(query), refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateFilter = <K extends keyof AutopilotActivityFilters>(
    key: K,
    value: AutopilotActivityFilters[K],
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      offset: key === 'offset' ? (value as number) : 0,
    });
  };

  if (loading && items.length === 0 && !error) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500 shadow-sm">
        Loading activity log…
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
          <h3 className="text-xl font-bold text-zinc-900">Activity log</h3>
          <p className="text-sm text-zinc-500">Read-only Autopilot audit trail. Editing and deletion are not available.</p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          aria-label="Refresh activity log"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-activity-event">
              Event type
            </label>
            <select
              id="ap-activity-event"
              value={filters.eventType}
              onChange={(e) => updateFilter('eventType', e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All</option>
              {AUTOPILOT_EVENT_TYPES.map((event) => (
                <option key={event} value={event}>{getEventTypeLabel(event)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-activity-entity-type">
              Entity type
            </label>
            <select
              id="ap-activity-entity-type"
              value={filters.entityType}
              onChange={(e) => updateFilter('entityType', e.target.value)}
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">All</option>
              {AUTOPILOT_ENTITY_TYPES.map((entity) => (
                <option key={entity} value={entity}>{getEntityTypeLabel(entity)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-activity-entity-id">
              Entity ID
            </label>
            <input
              id="ap-activity-entity-id"
              value={filters.entityId}
              onChange={(e) => updateFilter('entityId', e.target.value)}
              placeholder="e.g. topic id"
              className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => onFiltersChange({ ...DEFAULT_ACTIVITY_FILTERS, limit: filters.limit })}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {error ? <AutopilotErrorState error={error} onRetry={() => void load(true)} /> : null}

      {!loading && items.length === 0 ? (
        <AutopilotEmptyState
          title="No activity yet"
          description="Autopilot actions will appear here as an immutable audit trail."
        />
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Time</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Event</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Entity type</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Entity</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Actor</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Source</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Summary</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {items.map((row) => {
                  const topicLink = canOpenTopicFromActivity(row);
                  const topicId = getTopicIdFromActivity(row);
                  const isExpanded = expandedId === row.id;
                  const safeMeta = ensureRedactedMetadata(row.metadata);

                  return (
                    <tr key={row.id} className="align-top hover:bg-zinc-50/50">
                      <td className="px-6 py-4 text-sm text-zinc-500 whitespace-nowrap">
                        {formatAutopilotDate(row.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                        {getEventTypeLabel(row.eventType)}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {getEntityTypeLabel(row.entityType)}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">
                        {topicLink && topicId != null ? (
                          <button
                            type="button"
                            onClick={() => onOpenTopic(topicId)}
                            className="font-semibold text-emerald-600 hover:text-emerald-700"
                          >
                            Topic #{topicId}
                          </button>
                        ) : (
                          row.entityId
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{getActivityActorLabel(row)}</td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{row.source || '—'}</td>
                      <td className="px-6 py-4 text-sm text-zinc-700">
                        <p>{buildSafeEventSummary(row)}</p>
                        <button
                          type="button"
                          className="mt-1 text-xs font-bold text-zinc-500 hover:text-zinc-800"
                          onClick={() => setExpandedId(isExpanded ? null : row.id)}
                          aria-expanded={isExpanded}
                        >
                          {isExpanded ? 'Hide technical detail' : 'Show technical detail'}
                        </button>
                        {isExpanded ? (
                          <div className="mt-2 space-y-1 rounded-xl bg-zinc-50 p-3 font-mono text-[11px] text-zinc-600">
                            <p>Correlation: {row.correlationId || '—'}</p>
                            <p>Previous: {compactValuePreview(row.previousValue)}</p>
                            <p>New: {compactValuePreview(row.newValue)}</p>
                            <p>Metadata: {compactValuePreview(safeMeta, 200)}</p>
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{row.reason || '—'}</td>
                    </tr>
                  );
                })}
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
