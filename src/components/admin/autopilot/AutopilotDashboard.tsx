import { useEffect, useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import type { AutopilotDashboardDto } from '../../../lib/autopilot/adminAutopilotService';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  formatAutopilotDate,
  buildSafeEventSummary,
  getActivityActorLabel,
} from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import {
  getDecisionStatusLabel,
  getScoreBandLabel,
  getTopicStatusLabel,
} from '../../../lib/autopilot/adminAutopilotLabels';
import { TopicStatusBadge } from './TopicStatusBadge';
import { DecisionStatusBadge } from './DecisionStatusBadge';
import { ScoreBadge } from './ScoreBadge';
import { AutopilotEmptyState } from './AutopilotEmptyState';
import { AutopilotErrorState } from './AutopilotErrorState';

type AutopilotDashboardProps = {
  refreshKey: number;
  canContribute: boolean;
  onOpenTopic: (id: number) => void;
  onOpenActivity: () => void;
  onCreateTopic: () => void;
  onOpenKeywordImports?: () => void;
  onOpenResearchQueue?: () => void;
};

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value}</p>
    </div>
  );
}

function countByStatus(
  counts: Array<{ status: string; count: number }>,
  status: string,
): number {
  return counts.find((item) => item.status === status)?.count ?? 0;
}

export function AutopilotDashboard({
  refreshKey,
  canContribute,
  onOpenTopic,
  onOpenActivity,
  onCreateTopic,
  onOpenKeywordImports,
  onOpenResearchQueue,
}: AutopilotDashboardProps) {
  const [data, setData] = useState<AutopilotDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);

  const load = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const dashboard = await adminAutopilotApi.getDashboard();
      setData(dashboard);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err : new Error('Failed to load dashboard'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load(refreshKey > 0);
  }, [refreshKey]);

  if (loading && !data) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500 shadow-sm">
        Loading Autopilot dashboard…
      </div>
    );
  }

  if (error && !data) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  if (!data) return null;

  const pendingReview = countByStatus(data.decisionStatusCounts, 'PENDING_REVIEW');
  const approved = countByStatus(data.decisionStatusCounts, 'APPROVED');
  const researchComplete = countByStatus(data.topicStatusCounts, 'RESEARCH_COMPLETE');
  const failedRuns = data.recentFailedWorkflowRuns.length;

  const hasNoTopics = data.totalActiveTopics === 0 && data.archivedCount === 0;

  if (hasNoTopics) {
    return (
      <AutopilotEmptyState
        title="No Autopilot topics yet"
        description="Topics are reviewed before briefs or drafts are created. Create a candidate topic to begin the editorial pipeline."
        actionLabel={canContribute ? 'Create topic' : undefined}
        onAction={canContribute ? onCreateTopic : undefined}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Pipeline health</h3>
          <p className="text-sm text-zinc-500">Overview of Autopilot topic decisions — not published articles.</p>
        </div>
        <button
          type="button"
          onClick={() => void load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
          aria-label="Refresh dashboard"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error ? <AutopilotErrorState error={error} onRetry={() => void load(true)} /> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <SummaryCard label="Active topics" value={data.totalActiveTopics} />
        <SummaryCard label="Approved decisions" value={approved} />
        <SummaryCard label="Pending review" value={pendingReview} />
        <SummaryCard label="Research complete" value={researchComplete} />
        <SummaryCard label="Archived topics" value={data.archivedCount} />
        <SummaryCard label="Failed workflow runs" value={failedRuns} />
      </div>

      {typeof data.unreviewedKeywordCandidateCount === 'number' ||
      typeof data.duplicateKeywordCandidateCount === 'number' ||
      typeof data.convertedKeywordCandidateCount === 'number' ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-zinc-900">Keyword import triage</h4>
            {onOpenKeywordImports ? (
              <button
                type="button"
                onClick={onOpenKeywordImports}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Open keyword imports
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              label="Unreviewed candidates"
              value={data.unreviewedKeywordCandidateCount ?? 0}
            />
            <SummaryCard
              label="Duplicate candidates"
              value={data.duplicateKeywordCandidateCount ?? 0}
            />
            <SummaryCard
              label="Converted candidates"
              value={data.convertedKeywordCandidateCount ?? 0}
            />
          </div>
          {Array.isArray(data.recentKeywordImports) && data.recentKeywordImports.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {data.recentKeywordImports.map((batch) => (
                <li key={batch.id} className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-900">
                    {batch.sourceName || batch.originalFileName || batch.sourceType}
                  </span>
                  {' · '}
                  {batch.status}
                  {' · '}
                  {batch.totalRows} rows
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {data.researchStats ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-zinc-900">Research workspace</h4>
            {onOpenResearchQueue ? (
              <button
                type="button"
                onClick={onOpenResearchQueue}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
              >
                Open research queue
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            <SummaryCard label="Topics researching" value={data.researchStats.topicsResearching} />
            <SummaryCard
              label="Ready for confirmation"
              value={data.researchStats.readyForConfirmation}
            />
            <SummaryCard
              label="Confirmed research"
              value={data.researchStats.confirmedSnapshots}
            />
            <SummaryCard
              label="Needing more research"
              value={data.researchStats.topicsNeedingResearch}
            />
            <SummaryCard
              label="Exact content conflicts"
              value={data.researchStats.topicsWithExactConflicts}
            />
            <SummaryCard
              label="High-overlap advisories"
              value={data.researchStats.topicsWithHighOverlap}
            />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-bold text-zinc-900">Topic status</h4>
          <ul className="mt-3 space-y-2">
            {data.topicStatusCounts.map((item) => (
              <li key={item.status} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{getTopicStatusLabel(item.status)}</span>
                <span className="font-semibold text-zinc-900">{item.count}</span>
              </li>
            ))}
            {data.topicStatusCounts.length === 0 ? (
              <li className="text-sm italic text-zinc-400">No status data</li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-bold text-zinc-900">Decision status</h4>
          <ul className="mt-3 space-y-2">
            {data.decisionStatusCounts.map((item) => (
              <li key={item.status} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{getDecisionStatusLabel(item.status)}</span>
                <span className="font-semibold text-zinc-900">{item.count}</span>
              </li>
            ))}
            {data.decisionStatusCounts.length === 0 ? (
              <li className="text-sm italic text-zinc-400">No decision data</li>
            ) : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-bold text-zinc-900">Score bands</h4>
          <ul className="mt-3 space-y-2">
            {data.scoreBandCounts.map((item) => (
              <li key={item.band} className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">{item.label || getScoreBandLabel(item.band)}</span>
                <span className="font-semibold text-zinc-900">{item.count}</span>
              </li>
            ))}
            {data.scoreBandCounts.length === 0 ? (
              <li className="text-sm italic text-zinc-400">No scored topics</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-zinc-100 px-6 py-4">
          <h4 className="text-sm font-bold text-zinc-900">Recently updated topics</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Title</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Keyword</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Category</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Topic</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Decision</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Score</th>
                <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {data.recentTopics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm italic text-zinc-400">
                    No recent topics
                  </td>
                </tr>
              ) : (
                data.recentTopics.map((topic) => (
                  <tr
                    key={topic.id}
                    className="cursor-pointer hover:bg-zinc-50/50"
                    onClick={() => onOpenTopic(topic.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenTopic(topic.id);
                      }
                    }}
                    tabIndex={0}
                    role="link"
                    aria-label={`Open topic ${topic.workingTitle}`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900">{topic.workingTitle}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{topic.primaryKeyword}</td>
                    <td className="px-6 py-4 text-sm text-zinc-600">{topic.primaryCategory || '—'}</td>
                    <td className="px-6 py-4"><TopicStatusBadge status={topic.topicStatus} /></td>
                    <td className="px-6 py-4"><DecisionStatusBadge status={topic.decisionStatus} /></td>
                    <td className="px-6 py-4"><ScoreBadge totalScore={topic.totalScore} /></td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{formatAutopilotDate(topic.updatedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-zinc-900">Recent activity</h4>
            <button
              type="button"
              onClick={onOpenActivity}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              View full activity log
            </button>
          </div>
          <ul className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <li className="text-sm italic text-zinc-400">No recent activity</li>
            ) : (
              data.recentActivity.map((row) => (
                <li key={row.id} className="border-b border-zinc-50 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-zinc-900">{buildSafeEventSummary(row)}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {formatAutopilotDate(row.createdAt)} · {getActivityActorLabel(row)} · {row.entityType}/{row.entityId}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h4 className="mb-4 text-sm font-bold text-zinc-900">Failed workflow runs</h4>
          <ul className="space-y-3">
            {data.recentFailedWorkflowRuns.length === 0 ? (
              <li className="text-sm italic text-zinc-400">No failed runs</li>
            ) : (
              data.recentFailedWorkflowRuns.map((run) => (
                <li key={run.id} className="border-b border-zinc-50 pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-zinc-900">
                    {run.workflowType} · {run.entityType}/{run.entityId}
                  </p>
                  <p className="mt-1 text-xs text-rose-700">
                    {run.errorMessage || run.errorCode || 'Failed without a message'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">{formatAutopilotDate(run.updatedAt || run.createdAt)}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
