import { useCallback, useState } from 'react';
import {
  getAutopilotUiCapabilities,
} from '../../../lib/autopilot/adminAutopilotCapabilities';
import {
  adminAutopilotApi,
  AutopilotClientError,
  type CreateTopicInput,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  DEFAULT_PIPELINE_FILTERS,
  type AutopilotPipelineFilters,
} from '../../../lib/autopilot/adminAutopilotPipelineHelpers';
import { useToast } from '../../ui/AppToast';
import { AutopilotDashboard } from './AutopilotDashboard';
import { TopicPipeline } from './TopicPipeline';
import { TopicDecisionCard } from './TopicDecisionCard';
import {
  AutopilotActivityLog,
  DEFAULT_ACTIVITY_FILTERS,
  type AutopilotActivityFilters,
} from './AutopilotActivityLog';
import { CreateTopicDialog } from './CreateTopicDialog';
import { KeywordImportsPanel } from './KeywordImportsPanel';
import { ResearchQueuePanel } from './ResearchQueuePanel';
import {
  DEFAULT_RESEARCH_QUEUE_FILTERS,
  type AutopilotResearchQueueFilters,
} from '../../../lib/autopilot/adminResearchHelpers';

export type AutopilotSubView =
  | 'dashboard'
  | 'keyword-imports'
  | 'research-queue'
  | 'pipeline'
  | 'activity'
  | 'topic-detail';

type AutopilotPanelProps = {
  role?: string;
};

const SUBNAV: Array<{ id: Exclude<AutopilotSubView, 'topic-detail'>; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'keyword-imports', label: 'Keyword Imports' },
  { id: 'research-queue', label: 'Research Queue' },
  { id: 'pipeline', label: 'Topic Pipeline' },
  { id: 'activity', label: 'Activity Log' },
];

export function AutopilotPanel({ role }: AutopilotPanelProps) {
  const { showToast } = useToast();
  const caps = getAutopilotUiCapabilities(role);

  const [view, setView] = useState<AutopilotSubView>('dashboard');
  const [returnView, setReturnView] = useState<Exclude<AutopilotSubView, 'topic-detail'>>('pipeline');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [pipelineFilters, setPipelineFilters] =
    useState<AutopilotPipelineFilters>(DEFAULT_PIPELINE_FILTERS);
  const [activityFilters, setActivityFilters] =
    useState<AutopilotActivityFilters>(DEFAULT_ACTIVITY_FILTERS);
  const [researchFilters, setResearchFilters] =
    useState<AutopilotResearchQueueFilters>(DEFAULT_RESEARCH_QUEUE_FILTERS);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const bumpRefresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const openTopic = (id: number, from: Exclude<AutopilotSubView, 'topic-detail'> = 'pipeline') => {
    setReturnView(from);
    setSelectedTopicId(id);
    setView('topic-detail');
  };

  const backFromTopic = () => {
    setSelectedTopicId(null);
    setView(returnView);
    bumpRefresh();
  };

  const openActivityForTopic = (topicId: number) => {
    setActivityFilters({
      ...DEFAULT_ACTIVITY_FILTERS,
      entityType: 'topic',
      entityId: String(topicId),
    });
    setSelectedTopicId(null);
    setView('activity');
  };

  const handleCreateTopic = async (input: CreateTopicInput) => {
    setCreating(true);
    setCreateError(null);
    try {
      const result = await adminAutopilotApi.createTopic(input);
      setCreateOpen(false);
      showToast({ type: 'success', message: 'Topic created.' });
      bumpRefresh();
      openTopic(result.topic.id, 'pipeline');
    } catch (err) {
      setCreateError(
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create topic.',
      );
    } finally {
      setCreating(false);
    }
  };

  if (!caps.canRead) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-8 text-sm text-rose-800 shadow-sm" role="alert">
        You do not have permission to view Article Autopilot.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Article Autopilot</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Internal topic pipeline for editorial decisions. Topics are candidates — not published articles.
          </p>
        </div>
        {caps.canContribute && view !== 'topic-detail' ? (
          <button
            type="button"
            onClick={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
            className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Create topic
          </button>
        ) : null}
      </div>

      {view !== 'topic-detail' ? (
        <nav aria-label="Autopilot sections" className="flex flex-wrap gap-2 rounded-2xl bg-zinc-200/50 p-1 w-fit">
          {SUBNAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                  active
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      ) : null}

      {view === 'dashboard' ? (
        <AutopilotDashboard
          refreshKey={refreshKey}
          canContribute={caps.canContribute}
          onOpenTopic={(id) => openTopic(id, 'dashboard')}
          onOpenActivity={() => setView('activity')}
          onCreateTopic={() => setCreateOpen(true)}
          onOpenKeywordImports={() => setView('keyword-imports')}
          onOpenResearchQueue={() => setView('research-queue')}
        />
      ) : null}

      {view === 'keyword-imports' ? (
        <KeywordImportsPanel
          refreshKey={refreshKey}
          canContribute={caps.canContribute}
          onOpenTopic={(id) => openTopic(id, 'keyword-imports')}
          onMutated={bumpRefresh}
        />
      ) : null}

      {view === 'research-queue' ? (
        <ResearchQueuePanel
          filters={researchFilters}
          onFiltersChange={setResearchFilters}
          refreshKey={refreshKey}
          canContribute={caps.canContribute}
          onOpenTopic={(id) => openTopic(id, 'research-queue')}
          onStartResearch={(id) => openTopic(id, 'research-queue')}
        />
      ) : null}

      {view === 'pipeline' ? (
        <TopicPipeline
          filters={pipelineFilters}
          onFiltersChange={setPipelineFilters}
          refreshKey={refreshKey}
          canContribute={caps.canContribute}
          onOpenTopic={(id) => openTopic(id, 'pipeline')}
          onCreateTopic={() => setCreateOpen(true)}
        />
      ) : null}

      {view === 'activity' ? (
        <AutopilotActivityLog
          filters={activityFilters}
          onFiltersChange={setActivityFilters}
          refreshKey={refreshKey}
          onOpenTopic={(id) => openTopic(id, 'activity')}
        />
      ) : null}

      {view === 'topic-detail' && selectedTopicId != null ? (
        <TopicDecisionCard
          topicId={selectedTopicId}
          role={role}
          canContribute={caps.canContribute}
          canEditorial={caps.canEditorial}
          onBack={backFromTopic}
          onArchived={() => {
            setSelectedTopicId(null);
            setView('pipeline');
            bumpRefresh();
          }}
          onOpenActivityForTopic={openActivityForTopic}
          onMutated={bumpRefresh}
        />
      ) : null}

      <CreateTopicDialog
        open={createOpen}
        isSubmitting={creating}
        error={createError}
        onClose={() => {
          if (!creating) setCreateOpen(false);
        }}
        onSubmit={handleCreateTopic}
      />
    </div>
  );
}
