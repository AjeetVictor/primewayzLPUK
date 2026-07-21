import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  MinusCircle,
} from 'lucide-react';
import {
  buildSafeSyncTechnicalDetails,
  calculateSyncDurationMs,
  formatGscDateRange,
  formatGscSyncTimestamp,
  formatSyncDuration,
  formatSyncDurationShort,
  formatSyncElapsedClock,
  getCompletedSyncCardLabel,
  getGscSyncHeadline,
  getGscSyncPhaseText,
  getGscSyncStatusKind,
  getGscSyncStatusLabel,
  getGscSyncTriggerLabel,
  isActiveSyncStatus,
  parseGscSyncRuns,
  partitionSyncRuns,
  type GscSyncRunRecord,
} from '../../../lib/autopilot/gscSyncHistoryHelpers';

type GscSyncHistoryProps = {
  syncRuns: Array<Record<string, unknown>>;
  syncLocked?: boolean;
  syncing?: boolean;
  optimisticRunning?: GscSyncRunRecord | null;
  onRefresh?: () => void | Promise<void>;
  onViewFullHistory?: () => void;
  /** When "external", the running card is rendered by the parent (e.g. below sync buttons). */
  runningCardPlacement?: 'top' | 'external';
};

const POLL_INTERVAL_MS = 3000;

export function useGscSyncHistoryState({
  syncRuns,
  syncLocked = false,
  syncing = false,
  optimisticRunning = null,
  onRefresh,
}: Pick<
  GscSyncHistoryProps,
  'syncRuns' | 'syncLocked' | 'syncing' | 'optimisticRunning' | 'onRefresh'
>) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const parsedRuns = useMemo(() => parseGscSyncRuns(syncRuns), [syncRuns]);
  const syncActive = syncing || syncLocked;
  const { running, latestCompleted, history } = useMemo(
    () =>
      partitionSyncRuns(parsedRuns, {
        syncLocked: syncActive,
        optimisticRunning: syncing ? optimisticRunning : null,
      }),
    [parsedRuns, syncActive, syncing, optimisticRunning],
  );

  const showRunning = Boolean(
    running && (syncActive || isActiveSyncStatus(running.status)),
  );

  useEffect(() => {
    if (!showRunning) return undefined;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [showRunning]);

  useEffect(() => {
    if (!showRunning || !onRefresh) return undefined;
    const timer = window.setInterval(() => {
      void onRefresh();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [showRunning, onRefresh]);

  const hasAnyHistory = parsedRuns.length > 0 || showRunning;

  return {
    nowMs,
    running,
    latestCompleted,
    history,
    showRunning,
    syncActive,
    hasAnyHistory,
  };
}

function StatusBadge({ status }: { status: string | undefined }) {
  const kind = getGscSyncStatusKind(status);
  const label = getGscSyncStatusLabel(status);

  const styles = {
    succeeded: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    failed: 'border-rose-200 bg-rose-50 text-rose-800',
    running: 'border-sky-200 bg-sky-50 text-sky-800',
    neutral: 'border-zinc-200 bg-zinc-50 text-zinc-700',
  } as const;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${styles[kind]}`}
    >
      {kind === 'succeeded' ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
      {kind === 'failed' ? (
        <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
      {kind === 'running' ? (
        <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" />
      ) : null}
      {kind === 'neutral' ? (
        <MinusCircle className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
      {label}
    </span>
  );
}

function TechnicalDetails({
  run,
  detailsId,
  expanded,
  onToggle,
}: {
  run: GscSyncRunRecord;
  detailsId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const details = useMemo(() => buildSafeSyncTechnicalDetails(run), [run]);

  return (
    <div className="mt-3">
      <button
        type="button"
        id={`${detailsId}-trigger`}
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={onToggle}
        className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-semibold text-zinc-600 underline-offset-2 transition hover:text-zinc-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Technical details
      </button>
      {expanded ? (
        <dl
          id={detailsId}
          role="region"
          aria-labelledby={`${detailsId}-trigger`}
          className="mt-2 grid gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 sm:grid-cols-2"
        >
          {Object.entries(details).map(([key, value]) => (
            <div key={key}>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{key}</dt>
              <dd className="mt-0.5 break-all text-xs text-zinc-700">{String(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export function CompletedSyncCard({
  run,
  nowMs,
  syncActive = false,
}: {
  run: GscSyncRunRecord;
  nowMs: number;
  syncActive?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const kind = getGscSyncStatusKind(run.status);
  const durationMs = calculateSyncDurationMs(run.startedAt, run.completedAt, nowMs);
  const completedLabel = formatGscSyncTimestamp(run.completedAt ?? run.startedAt);
  const cardLabel = getCompletedSyncCardLabel(syncActive);
  const isSubdued = syncActive;

  const cardTone = isSubdued
    ? 'border-zinc-200 bg-zinc-50/80'
    : kind === 'succeeded'
      ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white'
      : kind === 'failed'
        ? 'border-rose-200 bg-gradient-to-br from-rose-50/70 to-white'
        : 'border-zinc-200 bg-zinc-50/50';

  const countClass = isSubdued
    ? 'mt-1 text-xl font-bold tabular-nums text-zinc-900'
    : 'mt-1 text-2xl font-bold tabular-nums text-zinc-900';

  return (
    <article
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${cardTone}`}
      aria-labelledby={`completed-sync-title-${run.id}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            {cardLabel}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {kind === 'succeeded' ? (
              <CheckCircle2
                className={`h-5 w-5 shrink-0 ${isSubdued ? 'text-emerald-500' : 'text-emerald-600'}`}
                aria-hidden="true"
              />
            ) : null}
            {kind === 'failed' ? (
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
            ) : null}
            <h4
              id={`completed-sync-title-${run.id}`}
              className={`font-bold text-zinc-900 ${isSubdued ? 'text-sm' : 'text-base sm:text-lg'}`}
            >
              {getGscSyncHeadline(run.status)}
            </h4>
          </div>
          <p className="mt-1 text-sm text-zinc-600">{completedLabel}</p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      <dl className={`mt-4 grid gap-3 ${isSubdued ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Date range
          </dt>
          <dd className="mt-1 text-sm font-medium text-zinc-900">
            {formatGscDateRange(run.dateFrom, run.dateTo)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Rows fetched
          </dt>
          <dd className={countClass}>{run.rowsFetched ?? 0}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Rows stored
          </dt>
          <dd className={countClass}>{run.rowsUpserted ?? 0}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Duration
          </dt>
          <dd className="mt-1 text-sm font-semibold text-zinc-900">
            {formatSyncDuration(durationMs)}
          </dd>
        </div>
        {!isSubdued ? (
          <>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Started
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {formatGscSyncTimestamp(run.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Completed
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {formatGscSyncTimestamp(run.completedAt)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Trigger
              </dt>
              <dd className="mt-1 text-sm text-zinc-800">
                {getGscSyncTriggerLabel(run.trigger)}
              </dd>
            </div>
          </>
        ) : (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Trigger
            </dt>
            <dd className="mt-1 text-sm text-zinc-800">
              {getGscSyncTriggerLabel(run.trigger)}
            </dd>
          </div>
        )}
      </dl>

      {run.errorMessage ? (
        <p
          className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          role="alert"
        >
          {run.errorMessage}
        </p>
      ) : null}

      <TechnicalDetails
        run={run}
        detailsId={`completed-sync-details-${run.id}`}
        expanded={expanded}
        onToggle={() => setExpanded((open) => !open)}
      />
    </article>
  );
}

export function RunningSyncCard({
  run,
  nowMs,
}: {
  run: GscSyncRunRecord;
  nowMs: number;
}) {
  const elapsedMs = calculateSyncDurationMs(run.startedAt, null, nowMs);

  return (
    <article
      className="rounded-2xl border-2 border-sky-300 bg-gradient-to-br from-sky-50 to-white p-4 shadow-md sm:p-5"
      aria-live="polite"
      aria-busy="true"
      aria-labelledby="gsc-running-sync-title"
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-4 ring-sky-100/80"
          aria-hidden="true"
        >
          <Loader2 className="h-5 w-5 motion-safe:animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700">
            Current sync
          </p>
          <h4 id="gsc-running-sync-title" className="mt-0.5 text-base font-bold text-zinc-900 sm:text-lg">
            Sync currently running
          </h4>
          <p className="mt-1 text-sm text-sky-800">{getGscSyncPhaseText(run.status)}</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Elapsed
              </dt>
              <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-zinc-900">
                {formatSyncElapsedClock(elapsedMs)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Date range
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-zinc-800">
                {formatGscDateRange(run.dateFrom, run.dateTo)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Trigger
              </dt>
              <dd className="mt-0.5 text-sm text-zinc-800">
                {getGscSyncTriggerLabel(run.trigger)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}

function HistoryRunRow({
  run,
  nowMs,
}: {
  run: GscSyncRunRecord;
  nowMs: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const kind = getGscSyncStatusKind(run.status);
  const durationMs = calculateSyncDurationMs(run.startedAt, run.completedAt, nowMs);
  const timestamp = formatGscSyncTimestamp(run.completedAt ?? run.startedAt ?? run.createdAt);
  const iconClass =
    kind === 'succeeded'
      ? 'text-emerald-600'
      : kind === 'failed'
        ? 'text-rose-600'
        : 'text-zinc-400';

  return (
    <li className="relative pl-7">
      <span
        className="absolute left-0 top-1.5 flex h-4 w-4 items-center justify-center"
        aria-hidden="true"
      >
        {kind === 'succeeded' ? (
          <CheckCircle2 className={`h-4 w-4 ${iconClass}`} />
        ) : kind === 'failed' ? (
          <AlertCircle className={`h-4 w-4 ${iconClass}`} />
        ) : (
          <MinusCircle className={`h-4 w-4 ${iconClass}`} />
        )}
      </span>
      <div className="rounded-xl border border-zinc-100 bg-white px-3 py-3 transition hover:border-zinc-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900">{timestamp}</p>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={run.status} />
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
              {getGscSyncTriggerLabel(run.trigger)}
            </span>
          </div>
        </div>
        {kind === 'failed' && run.errorMessage ? (
          <p className="mt-1.5 text-xs text-rose-700">{run.errorMessage}</p>
        ) : (
          <p className="mt-1.5 text-xs text-zinc-500">
            {run.rowsFetched ?? 0} fetched · {run.rowsUpserted ?? 0} stored ·{' '}
            {formatSyncDurationShort(durationMs)}
          </p>
        )}
        <TechnicalDetails
          run={run}
          detailsId={`history-sync-details-${run.id}`}
          expanded={expanded}
          onToggle={() => setExpanded((open) => !open)}
        />
      </div>
    </li>
  );
}

export function GscSyncHistoryContent({
  state,
  onViewFullHistory,
  runningCardPlacement = 'external',
}: {
  state: ReturnType<typeof useGscSyncHistoryState>;
  onViewFullHistory?: () => void;
  runningCardPlacement?: 'top' | 'external';
}) {
  const { nowMs, running, latestCompleted, history, showRunning, hasAnyHistory } = state;

  if (!hasAnyHistory) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60 px-4 py-8 text-center">
        <History className="mx-auto h-6 w-6 text-zinc-400" aria-hidden="true" />
        <h4 className="mt-3 text-sm font-bold text-zinc-900">Sync history</h4>
        <p className="mt-1 text-sm text-zinc-500">
          No sync runs yet. Run your first sync to populate Search Console metrics.
        </p>
        {onViewFullHistory ? (
          <button
            type="button"
            onClick={onViewFullHistory}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          >
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            View full sync history
          </button>
        ) : null}
      </div>
    );
  }

  const showInlineRunning = showRunning && running && runningCardPlacement === 'top';

  return (
    <div className="mt-6 space-y-5">
      {showInlineRunning ? <RunningSyncCard run={running} nowMs={nowMs} /> : null}

      {latestCompleted ? (
        <CompletedSyncCard run={latestCompleted} nowMs={nowMs} syncActive={showRunning} />
      ) : null}

      <section aria-labelledby="gsc-sync-history-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 id="gsc-sync-history-heading" className="text-sm font-bold text-zinc-900">
            Sync history
          </h4>
          {onViewFullHistory ? (
            <button
              type="button"
              onClick={onViewFullHistory}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              <History className="h-3.5 w-3.5" aria-hidden="true" />
              View full sync history
            </button>
          ) : null}
        </div>

        {history.length > 0 ? (
          <ol className="relative space-y-3 border-l border-zinc-200 pl-4" aria-label="Recent sync runs">
            {history.map((run) => (
              <HistoryRunRow key={String(run.id)} run={run} nowMs={nowMs} />
            ))}
          </ol>
        ) : (
          <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-4 text-sm text-zinc-500">
            No additional sync runs to show.
          </p>
        )}
      </section>
    </div>
  );
}

export function GscSyncHistory({
  syncRuns,
  syncLocked = false,
  syncing = false,
  optimisticRunning = null,
  onRefresh,
  onViewFullHistory,
  runningCardPlacement = 'external',
}: GscSyncHistoryProps) {
  const state = useGscSyncHistoryState({
    syncRuns,
    syncLocked,
    syncing,
    optimisticRunning,
    onRefresh,
  });

  return (
    <GscSyncHistoryContent
      state={state}
      onViewFullHistory={onViewFullHistory}
      runningCardPlacement={runningCardPlacement}
    />
  );
}
