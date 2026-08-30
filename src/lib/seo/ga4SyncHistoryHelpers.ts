/**
 * GA4 sync history parsing helpers for admin UI.
 */

export type Ga4SyncRunRecord = {
  id: number;
  trigger: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  requestsMade: number;
  daysProcessed: number;
  rowsFetched: number;
  rowsUpserted: number;
  unmatchedPages: number;
  startedAt: string | null;
  completedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export function parseGa4SyncRun(raw: Record<string, unknown>): Ga4SyncRunRecord {
  return {
    id: Number(raw.id),
    trigger: String(raw.trigger ?? ''),
    status: String(raw.status ?? ''),
    dateFrom: String(raw.dateFrom ?? ''),
    dateTo: String(raw.dateTo ?? ''),
    requestsMade: Number(raw.requestsMade ?? 0),
    daysProcessed: Number(raw.daysProcessed ?? 0),
    rowsFetched: Number(raw.rowsFetched ?? 0),
    rowsUpserted: Number(raw.rowsUpserted ?? 0),
    unmatchedPages: Number(raw.unmatchedPages ?? 0),
    startedAt: raw.startedAt ? String(raw.startedAt) : null,
    completedAt: raw.completedAt ? String(raw.completedAt) : null,
    errorCode: raw.errorCode ? String(raw.errorCode) : null,
    errorMessage: raw.errorMessage ? String(raw.errorMessage) : null,
    createdAt: String(raw.createdAt ?? ''),
  };
}

export function parseGa4SyncRuns(raw: unknown): Ga4SyncRunRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => parseGa4SyncRun(item as Record<string, unknown>));
}

export function mergeSyncRunIntoList(
  list: Ga4SyncRunRecord[],
  run: Ga4SyncRunRecord,
): Ga4SyncRunRecord[] {
  const without = list.filter((item) => item.id !== run.id);
  return [run, ...without];
}

export function formatGa4SyncDuration(
  startedAt: string | null,
  completedAt: string | null,
): string | null {
  if (!startedAt || !completedAt) return null;
  const ms = Date.parse(completedAt) - Date.parse(startedAt);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}
