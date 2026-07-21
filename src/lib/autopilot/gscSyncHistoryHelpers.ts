/**
 * Display helpers for Google Search Console sync history in the admin UI.
 */

export type GscSyncRunRecord = {
  id: number | string;
  connectionId?: number;
  trigger?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  searchType?: string;
  dataState?: string;
  requestsMade?: number;
  daysProcessed?: number;
  rowsFetched?: number;
  rowsUpserted?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  createdAt?: string;
};

export type GscSyncStatusKind = 'succeeded' | 'failed' | 'running' | 'neutral';

export type GscSyncHistoryPartition = {
  running: GscSyncRunRecord | null;
  latestCompleted: GscSyncRunRecord | null;
  history: GscSyncRunRecord[];
};

export type GscSyncActivityFilters = {
  eventType: string;
  entityType: string;
  entityId: string;
  limit: number;
  offset: number;
};

export const DEFAULT_GSC_SYNC_ACTIVITY_FILTERS: GscSyncActivityFilters = {
  eventType: '',
  entityType: 'gsc_sync_run',
  entityId: '',
  limit: 20,
  offset: 0,
};

const TECHNICAL_DETAIL_DENY_KEYS =
  /password|secret|token|credential|ciphertext|encryption|authorization|cookie|apikey|api_key|refresh/i;

export function parseGscSyncRun(raw: Record<string, unknown>): GscSyncRunRecord {
  return {
    id: raw.id as number | string,
    connectionId: typeof raw.connectionId === 'number' ? raw.connectionId : undefined,
    trigger: typeof raw.trigger === 'string' ? raw.trigger : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    dateFrom: typeof raw.dateFrom === 'string' ? raw.dateFrom : undefined,
    dateTo: typeof raw.dateTo === 'string' ? raw.dateTo : undefined,
    searchType: typeof raw.searchType === 'string' ? raw.searchType : undefined,
    dataState: typeof raw.dataState === 'string' ? raw.dataState : undefined,
    requestsMade: typeof raw.requestsMade === 'number' ? raw.requestsMade : undefined,
    daysProcessed: typeof raw.daysProcessed === 'number' ? raw.daysProcessed : undefined,
    rowsFetched: typeof raw.rowsFetched === 'number' ? raw.rowsFetched : undefined,
    rowsUpserted: typeof raw.rowsUpserted === 'number' ? raw.rowsUpserted : undefined,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
    errorCode: typeof raw.errorCode === 'string' ? raw.errorCode : null,
    errorMessage: typeof raw.errorMessage === 'string' ? raw.errorMessage : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
  };
}

export function parseGscSyncRuns(
  runs: Array<Record<string, unknown>> | undefined | null,
): GscSyncRunRecord[] {
  if (!runs?.length) return [];
  return runs.map(parseGscSyncRun);
}

export function isActiveSyncStatus(status: string | undefined): boolean {
  return status === 'RUNNING' || status === 'QUEUED';
}

export function isCompletedSyncStatus(status: string | undefined): boolean {
  return status === 'SUCCEEDED' || status === 'FAILED' || status === 'SKIPPED';
}

export function getGscSyncStatusKind(status: string | undefined): GscSyncStatusKind {
  if (status === 'SUCCEEDED') return 'succeeded';
  if (status === 'FAILED') return 'failed';
  if (isActiveSyncStatus(status)) return 'running';
  return 'neutral';
}

export function getGscSyncStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'SUCCEEDED':
      return 'Succeeded';
    case 'FAILED':
      return 'Failed';
    case 'RUNNING':
      return 'Running';
    case 'QUEUED':
      return 'Queued';
    case 'SKIPPED':
      return 'Skipped';
    default:
      return status ? status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Unknown';
  }
}

export function getGscSyncTriggerLabel(trigger: string | undefined): string {
  switch (trigger) {
    case 'MANUAL':
      return 'Manual';
    case 'SCHEDULED':
      return 'Scheduled';
    case 'RECONCILIATION':
      return 'Reconciliation';
    default:
      return trigger ? trigger.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : 'Unknown';
  }
}

export function getGscSyncPhaseText(status: string | undefined): string {
  if (status === 'QUEUED') return 'Preparing sync…';
  return 'Fetching query and page metrics…';
}

export function getGscSyncHeadline(status: string | undefined): string {
  switch (status) {
    case 'SUCCEEDED':
      return 'Completed successfully';
    case 'FAILED':
      return 'Failed';
    case 'RUNNING':
    case 'QUEUED':
      return 'Sync currently running';
    case 'SKIPPED':
      return 'Skipped';
    default:
      return getGscSyncStatusLabel(status);
  }
}

function parseTimestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function calculateSyncDurationMs(
  startedAt: string | null | undefined,
  completedAt: string | null | undefined,
  nowMs: number = Date.now(),
): number | null {
  const startMs = parseTimestamp(startedAt);
  if (startMs == null) return null;
  const endMs = parseTimestamp(completedAt) ?? nowMs;
  const duration = endMs - startMs;
  return duration >= 0 ? duration : null;
}

export function formatSyncDuration(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes} min ${String(seconds).padStart(2, '0')} sec`;
  }
  return `${seconds}s`;
}

export function formatSyncDurationShort(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

export function formatSyncElapsedClock(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatDayMonth(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatYear(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return String(date.getFullYear());
}

export function formatGscDateRange(
  dateFrom: string | undefined,
  dateTo: string | undefined,
  fallback = '—',
): string {
  if (!dateFrom || !dateTo) return fallback;
  const fromYear = formatYear(dateFrom);
  const toYear = formatYear(dateTo);
  const fromLabel = formatDayMonth(dateFrom);
  const toLabel = formatDayMonth(dateTo);
  if (fromYear && toYear && fromYear === toYear) {
    return `${fromLabel} – ${toLabel} ${fromYear}`;
  }
  return `${fromLabel} ${fromYear} – ${toLabel} ${toYear}`.trim();
}

export function formatGscSyncTimestamp(
  value: string | Date | null | undefined,
  fallback = '—',
): string {
  if (value == null || value === '') return fallback;
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return fallback;
  }
}

export function buildSafeSyncTechnicalDetails(
  run: GscSyncRunRecord,
): Record<string, string | number | null> {
  const details: Record<string, string | number | null> = {
    'Run ID': run.id,
    'Connection ID': run.connectionId ?? null,
    Status: run.status ?? null,
    Trigger: run.trigger ?? null,
    'Search type': run.searchType ?? null,
    'Data state': run.dataState ?? null,
    'Requests made': run.requestsMade ?? null,
    'Days processed': run.daysProcessed ?? null,
    'Rows fetched': run.rowsFetched ?? null,
    'Rows stored': run.rowsUpserted ?? null,
    'Started at': run.startedAt ?? null,
    'Completed at': run.completedAt ?? null,
    'Error code': run.errorCode ?? null,
  };

  if (run.errorMessage && !TECHNICAL_DETAIL_DENY_KEYS.test(run.errorMessage)) {
    details['Error message'] = run.errorMessage;
  }

  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value != null && value !== ''),
  ) as Record<string, string | number | null>;
}

function runSortKey(run: GscSyncRunRecord): number {
  const candidates = [run.completedAt, run.startedAt, run.createdAt];
  for (const value of candidates) {
    const ms = parseTimestamp(value);
    if (ms != null) return ms;
  }
  return 0;
}

export function getCompletedSyncCardLabel(syncActive: boolean): string {
  return syncActive ? 'Last sync' : 'Latest sync';
}

export function partitionSyncRuns(
  runs: GscSyncRunRecord[],
  options?: {
    syncLocked?: boolean;
    optimisticRunning?: GscSyncRunRecord | null;
  },
): GscSyncHistoryPartition {
  const sorted = [...runs].sort((a, b) => runSortKey(b) - runSortKey(a));
  const syncActive = Boolean(options?.syncLocked || options?.optimisticRunning);

  let running =
    sorted.find((run) => isActiveSyncStatus(run.status)) ??
    options?.optimisticRunning ??
    null;

  if (!running && options?.syncLocked) {
    running = {
      id: 'active-lock',
      status: 'RUNNING',
      trigger: 'SCHEDULED',
      startedAt: new Date().toISOString(),
    };
  }

  const completedRuns = sorted.filter(
    (run) =>
      isCompletedSyncStatus(run.status) &&
      String(run.id) !== String(running?.id ?? ''),
  );

  const latestCompleted = syncActive
    ? (completedRuns.find((run) => run.status === 'SUCCEEDED') ?? completedRuns[0] ?? null)
    : (completedRuns[0] ?? null);

  const history = sorted
    .filter((run) => {
      if (String(run.id) === String(running?.id ?? '')) return false;
      if (
        latestCompleted &&
        String(run.id) === String(latestCompleted.id)
      ) {
        return false;
      }
      return true;
    })
    .slice(0, 5);

  return { running, latestCompleted, history };
}

export function mergeSyncRunIntoList(
  runs: GscSyncRunRecord[],
  updated: GscSyncRunRecord,
): GscSyncRunRecord[] {
  const next = runs.filter((run) => String(run.id) !== String(updated.id));
  next.unshift(updated);
  return next.sort((a, b) => runSortKey(b) - runSortKey(a));
}
