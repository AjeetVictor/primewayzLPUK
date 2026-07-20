/**
 * Typed admin Autopilot API client (Phase 1D).
 * Reuses apiUrl + credentials; never trusts client for security.
 */

import { apiUrl } from '../../utils/apiUrl.ts';
import type {
  AutopilotActivityLogRecord,
  AutopilotScoreCalculationResult,
  AutopilotSettingRecord,
  AutopilotSlugReservationResult,
  AutopilotTopicRecord,
  AutopilotValidationResult,
  AutopilotWorkflowRunRecord,
} from '../../data/autopilot/types.ts';
import type { AutopilotRecommendationBand } from '../../data/autopilot/scoringConfig.ts';
import type { AutopilotDecisionAction } from './apiValidation.ts';

export type AutopilotClientErrorKind =
  | 'validation'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'server'
  | 'network'
  | 'unavailable';

export class AutopilotClientError extends Error {
  readonly kind: AutopilotClientErrorKind;
  readonly status: number;
  readonly code: string;
  readonly correlationId: string | null;
  readonly details?: unknown;

  constructor(options: {
    message: string;
    kind: AutopilotClientErrorKind;
    status: number;
    code: string;
    correlationId?: string | null;
    details?: unknown;
  }) {
    super(options.message);
    this.name = 'AutopilotClientError';
    this.kind = options.kind;
    this.status = options.status;
    this.code = options.code;
    this.correlationId = options.correlationId ?? null;
    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}

export type AutopilotSlugAdvisoryDto = {
  proposedSlug: string | null;
  normalisedSlug: string;
  blocking: AutopilotSlugReservationResult;
  caseInsensitiveWarning?: {
    conflict: true;
    conflictSource: string;
    conflictValue: string;
    message: string;
  };
  candidateTopicWarning?: {
    conflictTopicIds: number[];
    message: string;
  };
};

export type AutopilotDashboardDto = {
  totalActiveTopics: number;
  archivedCount: number;
  topicStatusCounts: Array<{ status: string; count: number }>;
  decisionStatusCounts: Array<{ status: string; count: number }>;
  scoreBandCounts: Array<{ band: AutopilotRecommendationBand | string; label: string; count: number }>;
  recentTopics: AutopilotTopicRecord[];
  recentActivity: AutopilotActivityLogRecord[];
  recentFailedWorkflowRuns: AutopilotWorkflowRunRecord[];
  unreviewedKeywordCandidateCount?: number;
  duplicateKeywordCandidateCount?: number;
  convertedKeywordCandidateCount?: number;
  recentKeywordImports?: Array<{
    id: number;
    sourceType: string;
    sourceName: string | null;
    originalFileName: string | null;
    status: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    createdTopicCount: number;
    createdAt: string;
    completedAt: string | null;
  }>;
  researchStats?: {
    topicsResearching: number;
    readyForConfirmation: number;
    confirmedSnapshots: number;
    topicsNeedingResearch: number;
    topicsWithExactConflicts: number;
    topicsWithHighOverlap: number;
  } | null;
  recentResearchActivity?: AutopilotActivityLogRecord[];
  correlationId: string;
};

export type AutopilotTopicListDto = {
  items: AutopilotTopicRecord[];
  total: number;
  limit: number;
  offset: number;
  correlationId: string;
};

export type AutopilotTopicDetailDto = {
  topic: AutopilotTopicRecord;
  recommendationBand: AutopilotRecommendationBand | null;
  categoryValidation: AutopilotValidationResult;
  decisionReadiness: AutopilotValidationResult;
  slugAdvisory: AutopilotSlugAdvisoryDto;
  recentActivity: AutopilotActivityLogRecord[];
  correlationId: string;
};

export type AutopilotActivityListDto = {
  items: AutopilotActivityLogRecord[];
  total: number;
  limit: number;
  offset: number;
  correlationId: string;
};

export type CreateTopicInput = {
  workingTitle: string;
  primaryKeyword: string;
  userProblem: string;
  audience: string;
  supportingKeywords?: string[];
  keywordVariants?: string[];
  market?: string;
  language?: string;
  location?: string | null;
  proposedSlug?: string | null;
  source?: string;
};

export type RecommendCategoryInput = {
  primaryCategory?: string;
  secondaryCategories?: string[];
  confidence?: number;
  reasoning?: string;
  source?: 'rules' | 'ai' | 'human' | 'import';
};

export type DecisionInput = {
  action: AutopilotDecisionAction;
  rationale?: string;
};

type RequestOptions = {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
  query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>;
};

function buildQueryString(
  query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>,
): string {
  if (!query) return '';
  if (query instanceof URLSearchParams) {
    const s = query.toString();
    return s ? `?${s}` : '';
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function buildAutopilotRequestInit(init: RequestInit = {}): RequestInit {
  return {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  };
}

function kindFromStatus(status: number, code?: string): AutopilotClientErrorKind {
  if (status === 400) return 'validation';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status >= 500) {
    if (
      code === 'AUTOPILOT_INTERNAL_ERROR' ||
      /prisma|migration|table|does not exist/i.test(code || '')
    ) {
      return 'unavailable';
    }
    return 'server';
  }
  return 'server';
}

function safeUserMessage(status: number, code: string, message: string): string {
  if (status >= 500 || code === 'AUTOPILOT_INTERNAL_ERROR') {
    return 'Autopilot is temporarily unavailable. The database migration or server deployment may not yet be complete.';
  }
  if (status === 403 || code === 'AUTOPILOT_FORBIDDEN') {
    return 'You do not have permission to perform this Autopilot action.';
  }
  if (status === 404 || code === 'AUTOPILOT_NOT_FOUND') {
    return message || 'The requested Autopilot resource was not found.';
  }
  // Never surface stack traces or Prisma internals
  if (/prisma|stack|at\s+\w+\s+\(|SQL|ECONNREFUSED/i.test(message)) {
    return 'Autopilot request failed. Please try again or contact an administrator.';
  }
  return message || 'Autopilot request failed.';
}

export async function parseAutopilotErrorResponse(
  response: Response,
): Promise<AutopilotClientError> {
  const headerCorrelation = response.headers.get('x-correlation-id');
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const correlationId =
    (typeof record.correlationId === 'string' && record.correlationId) ||
    headerCorrelation ||
    null;

  // Middleware shape: { success: false, error: string }
  if (typeof record.error === 'string') {
    const status = response.status;
    const message = safeUserMessage(status, '', record.error);
    return new AutopilotClientError({
      message,
      kind: kindFromStatus(status),
      status,
      code: status === 401 ? 'NOT_AUTHENTICATED' : status === 403 ? 'FORBIDDEN' : 'REQUEST_FAILED',
      correlationId,
    });
  }

  // Autopilot shape: { error: { code, message, details }, correlationId }
  const nested =
    record.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>)
      : null;
  const code = typeof nested?.code === 'string' ? nested.code : `HTTP_${response.status}`;
  const rawMessage =
    typeof nested?.message === 'string'
      ? nested.message
      : typeof record.message === 'string'
        ? record.message
        : 'Autopilot request failed.';
  const details = nested?.details;

  let kind = kindFromStatus(response.status, code);
  if (
    /migration|not yet|table|unavailable|P2021|does not exist/i.test(rawMessage) ||
    /migration|table|P2021/i.test(String(details || ''))
  ) {
    kind = 'unavailable';
  }

  return new AutopilotClientError({
    message: safeUserMessage(response.status, code, rawMessage),
    kind,
    status: response.status,
    code,
    correlationId,
    details,
  });
}

async function autopilotRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const query = buildQueryString(options.query);
  const url = apiUrl(`${path}${query}`);
  const init = buildAutopilotRequestInit({
    method: options.method || 'GET',
    signal: options.signal,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new AutopilotClientError({
      message: 'Unable to reach the Autopilot API. Check your connection and try again.',
      kind: 'network',
      status: 0,
      code: 'NETWORK_ERROR',
      correlationId: null,
    });
  }

  if (!response.ok) {
    throw await parseAutopilotErrorResponse(response);
  }

  return (await response.json()) as T;
}

function normaliseActivityItems(
  items: AutopilotActivityLogRecord[],
): AutopilotActivityLogRecord[] {
  return items.map((item) => {
    const createdAt = item.createdAt as unknown;
    return {
      ...item,
      createdAt:
        createdAt instanceof Date
          ? createdAt.toISOString()
          : typeof createdAt === 'string'
            ? createdAt
            : String(createdAt || ''),
    };
  });
}

export const adminAutopilotApi = {
  getDashboard(signal?: AbortSignal) {
    return autopilotRequest<AutopilotDashboardDto>('/api/admin/autopilot/dashboard', { signal });
  },

  listTopics(
    query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
  ) {
    return autopilotRequest<AutopilotTopicListDto>('/api/admin/autopilot/topics', {
      query,
      signal,
    });
  },

  createTopic(input: CreateTopicInput, signal?: AbortSignal) {
    return autopilotRequest<{ topic: AutopilotTopicRecord; correlationId: string }>(
      '/api/admin/autopilot/topics',
      { method: 'POST', body: input, signal },
    );
  },

  getTopic(id: number, signal?: AbortSignal) {
    return autopilotRequest<AutopilotTopicDetailDto>(`/api/admin/autopilot/topics/${id}`, {
      signal,
    });
  },

  patchTopic(id: number, body: Record<string, unknown>, signal?: AbortSignal) {
    return autopilotRequest<{ topic: AutopilotTopicRecord; correlationId: string }>(
      `/api/admin/autopilot/topics/${id}`,
      { method: 'PATCH', body, signal },
    );
  },

  archiveTopic(id: number, reason: string, signal?: AbortSignal) {
    return autopilotRequest<{
      topic: AutopilotTopicRecord;
      alreadyArchived: boolean;
      correlationId: string;
    }>(`/api/admin/autopilot/topics/${id}/archive`, {
      method: 'POST',
      body: { reason },
      signal,
    });
  },

  scoreTopic(id: number, signal?: AbortSignal) {
    return autopilotRequest<{
      calculation: AutopilotScoreCalculationResult;
      topic: AutopilotTopicRecord;
      correlationId: string;
    }>(`/api/admin/autopilot/topics/${id}/score`, { method: 'POST', signal });
  },

  recommendCategory(id: number, input: RecommendCategoryInput, signal?: AbortSignal) {
    return autopilotRequest<{
      topic: AutopilotTopicRecord;
      categoryValidation: AutopilotValidationResult;
      correlationId: string;
    }>(`/api/admin/autopilot/topics/${id}/recommend-category`, {
      method: 'POST',
      body: input,
      signal,
    });
  },

  submitDecision(id: number, input: DecisionInput, signal?: AbortSignal) {
    return autopilotRequest<{ topic: AutopilotTopicRecord; correlationId: string }>(
      `/api/admin/autopilot/topics/${id}/decision`,
      { method: 'POST', body: input, signal },
    );
  },

  /** Phase 2 stub — always conflicts. Used only to surface server message. */
  startResearch(id: number, signal?: AbortSignal) {
    return autopilotRequest<{ correlationId: string }>(
      `/api/admin/autopilot/topics/${id}/research`,
      { method: 'POST', signal },
    );
  },

  getTopicActivity(
    id: number,
    query?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ) {
    return autopilotRequest<AutopilotActivityListDto>(
      `/api/admin/autopilot/topics/${id}/activity`,
      { query, signal },
    ).then((data) => ({ ...data, items: normaliseActivityItems(data.items) }));
  },

  listActivity(
    query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
  ) {
    return autopilotRequest<AutopilotActivityListDto>('/api/admin/autopilot/activity', {
      query,
      signal,
    }).then((data) => ({ ...data, items: normaliseActivityItems(data.items) }));
  },

  getWorkflowRun(id: number, signal?: AbortSignal) {
    return autopilotRequest<{ run: AutopilotWorkflowRunRecord; correlationId: string }>(
      `/api/admin/autopilot/workflow-runs/${id}`,
      { signal },
    );
  },

  getSettings(signal?: AbortSignal) {
    return autopilotRequest<{ settings: AutopilotSettingRecord[]; correlationId: string }>(
      '/api/admin/autopilot/settings',
      { signal },
    );
  },

  previewKeywordImport(body: Record<string, unknown>, signal?: AbortSignal) {
    return autopilotRequest<Record<string, unknown> & { correlationId: string }>(
      '/api/admin/autopilot/keyword-imports/preview',
      { method: 'POST', body, signal },
    );
  },

  commitKeywordImport(body: Record<string, unknown>, signal?: AbortSignal) {
    return autopilotRequest<Record<string, unknown> & { correlationId: string }>(
      '/api/admin/autopilot/keyword-imports',
      { method: 'POST', body, signal },
    );
  },

  listKeywordImports(
    query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      items: Array<Record<string, unknown>>;
      total: number;
      limit: number;
      offset: number;
      correlationId: string;
    }>('/api/admin/autopilot/keyword-imports', { query, signal });
  },

  getKeywordImport(id: number, signal?: AbortSignal) {
    return autopilotRequest<{
      batch: Record<string, unknown>;
      candidates: Array<Record<string, unknown>>;
      correlationId: string;
    }>(`/api/admin/autopilot/keyword-imports/${id}`, { signal });
  },

  listKeywordCandidates(
    query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      items: Array<Record<string, unknown>>;
      total: number;
      limit: number;
      offset: number;
      correlationId: string;
    }>('/api/admin/autopilot/keyword-candidates', { query, signal });
  },

  getKeywordCandidate(id: number, signal?: AbortSignal) {
    return autopilotRequest<{
      candidate: Record<string, unknown>;
      recentActivity: AutopilotActivityLogRecord[];
      correlationId: string;
    }>(`/api/admin/autopilot/keyword-candidates/${id}`, { signal });
  },

  patchKeywordCandidate(id: number, body: Record<string, unknown>, signal?: AbortSignal) {
    return autopilotRequest<{ candidate: Record<string, unknown>; correlationId: string }>(
      `/api/admin/autopilot/keyword-candidates/${id}`,
      { method: 'PATCH', body, signal },
    );
  },

  convertKeywordCandidate(id: number, body: Record<string, unknown>, signal?: AbortSignal) {
    return autopilotRequest<{
      candidate: Record<string, unknown>;
      topic: AutopilotTopicRecord;
      correlationId: string;
    }>(`/api/admin/autopilot/keyword-candidates/${id}/convert-to-topic`, {
      method: 'POST',
      body,
      signal,
    });
  },

  /* -------------------------------------------------------------------------- */
  /* Phase 2B — Research snapshots                                              */
  /* -------------------------------------------------------------------------- */

  listResearchSnapshots(
    topicId: number,
    query?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      items: Array<Record<string, unknown>>;
      total: number;
      limit: number;
      offset: number;
      correlationId: string;
    }>(`/api/admin/autopilot/topics/${topicId}/research-snapshots`, { query, signal });
  },

  createResearchSnapshot(
    topicId: number,
    body: Record<string, unknown> = {},
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      snapshot: Record<string, unknown>;
      completeness: Record<string, unknown>;
      readiness: Record<string, unknown>;
      reusedExistingDraft?: boolean;
      topic?: AutopilotTopicRecord;
      correlationId: string;
    }>(`/api/admin/autopilot/topics/${topicId}/research-snapshots`, {
      method: 'POST',
      body,
      signal,
    });
  },

  getResearchSnapshot(snapshotId: number, signal?: AbortSignal) {
    return autopilotRequest<{
      snapshot: Record<string, unknown>;
      completeness: Record<string, unknown>;
      readiness: Record<string, unknown>;
      correlationId: string;
    }>(`/api/admin/autopilot/research-snapshots/${snapshotId}`, { signal });
  },

  patchResearchSnapshot(
    snapshotId: number,
    body: Record<string, unknown>,
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      snapshot: Record<string, unknown>;
      completeness: Record<string, unknown>;
      readiness: Record<string, unknown>;
      correlationId: string;
    }>(`/api/admin/autopilot/research-snapshots/${snapshotId}`, {
      method: 'PATCH',
      body,
      signal,
    });
  },

  analyseResearchOverlap(snapshotId: number, signal?: AbortSignal) {
    return autopilotRequest<{
      snapshot: Record<string, unknown>;
      analysis: Record<string, unknown>;
      completeness: Record<string, unknown>;
      correlationId: string;
    }>(`/api/admin/autopilot/research-snapshots/${snapshotId}/analyse-overlap`, {
      method: 'POST',
      signal,
    });
  },

  markResearchReady(snapshotId: number, signal?: AbortSignal) {
    return autopilotRequest<{
      snapshot: Record<string, unknown>;
      completeness: Record<string, unknown>;
      readiness: Record<string, unknown>;
      correlationId: string;
    }>(`/api/admin/autopilot/research-snapshots/${snapshotId}/mark-ready`, {
      method: 'POST',
      signal,
    });
  },

  confirmResearchSnapshot(
    snapshotId: number,
    body: { confirmationNote: string },
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      snapshot: Record<string, unknown>;
      topic: AutopilotTopicRecord;
      supersededSnapshotId: number | null;
      correlationId: string;
    }>(`/api/admin/autopilot/research-snapshots/${snapshotId}/confirm`, {
      method: 'POST',
      body,
      signal,
    });
  },

  listResearchQueue(
    query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>,
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      items: Array<{
        topic: AutopilotTopicRecord;
        currentSnapshot: Record<string, unknown> | null;
        snapshotStatus: string | null;
        snapshotVersion: number | null;
        completeness: number | null;
        exactConflictCount: number;
        highOverlapCount: number;
        updatedAt: string;
      }>;
      total: number;
      limit: number;
      offset: number;
      correlationId: string;
    }>('/api/admin/autopilot/research-queue', { query, signal });
  },

  /* -------------------------------------------------------------------------- */
  /* Phase 2A — Google Search Console                                           */
  /* -------------------------------------------------------------------------- */

  getGscStatus(signal?: AbortSignal) {
    return autopilotRequest<{
      configuration: {
        configured: boolean;
        missing: string[];
        redirectUriConfigured: boolean;
        lookbackDays: number;
        dataDelayDays: number;
        scope: string;
      };
      connection: {
        id: number;
        status: string;
        siteUrl: string | null;
        permissionLevel: string | null;
        scope: string;
        connectedAt: string;
        lastValidatedAt: string | null;
        lastSuccessfulSyncAt: string | null;
        lastErrorCode: string | null;
        lastErrorMessage: string | null;
        isActive: boolean;
        hasRefreshToken: boolean;
        syncLocked: boolean;
      } | null;
      recentSyncRuns: Array<Record<string, unknown>>;
      correlationId: string;
    }>('/api/admin/autopilot/gsc/status', { signal });
  },

  createGscAuthUrl(signal?: AbortSignal) {
    return autopilotRequest<{
      authorizationUrl: string;
      expiresAt: string;
      correlationId: string;
    }>('/api/admin/autopilot/gsc/auth-url', { method: 'POST', signal });
  },

  listGscProperties(signal?: AbortSignal) {
    return autopilotRequest<{
      properties: Array<{ siteUrl: string; permissionLevel: string | null }>;
      correlationId: string;
    }>('/api/admin/autopilot/gsc/properties', { signal });
  },

  selectGscProperty(siteUrl: string, signal?: AbortSignal) {
    return autopilotRequest<{
      connection: Record<string, unknown>;
      correlationId: string;
    }>('/api/admin/autopilot/gsc/select-property', {
      method: 'POST',
      body: { siteUrl },
      signal,
    });
  },

  runGscSync(
    body: { dateFrom?: string; dateTo?: string; searchType?: string } = {},
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      syncRun: Record<string, unknown>;
      connectionId: number;
      correlationId: string;
    }>('/api/admin/autopilot/gsc/sync', { method: 'POST', body, signal });
  },

  listGscSyncRuns(
    query?: { limit?: number; offset?: number },
    signal?: AbortSignal,
  ) {
    return autopilotRequest<{
      items: Array<Record<string, unknown>>;
      total: number;
      limit: number;
      offset: number;
      correlationId: string;
    }>('/api/admin/autopilot/gsc/sync-runs', { query, signal });
  },

  disconnectGsc(signal?: AbortSignal) {
    return autopilotRequest<{
      connection: Record<string, unknown>;
      correlationId: string;
    }>('/api/admin/autopilot/gsc/disconnect', { method: 'POST', signal });
  },
};

/** Exported for unit tests — builds query strings without side effects. */
export function buildAutopilotQueryString(
  query?: URLSearchParams | Record<string, string | number | boolean | undefined | null>,
): string {
  return buildQueryString(query);
}
