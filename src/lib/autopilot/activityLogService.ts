import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  AutopilotActorType,
  AutopilotEntityType,
  AutopilotEventSource,
  AutopilotEventType,
} from '../../data/autopilot/eventTypes.ts';

export type PrismaLike = PrismaClient | Prisma.TransactionClient;

export const SENSITIVE_KEYS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'authorizationCode',
  'cookie',
  'secret',
  'apiKey',
  'clientSecret',
  'refreshTokenCiphertext',
  'refreshTokenIv',
  'refreshTokenAuthTag',
  'encryptionKey',
  'oauthState',
  'authTag',
  'ciphertext',
  'iv',
] as const;

const SENSITIVE_KEY_SET = new Set(
  SENSITIVE_KEYS.map((key) => key.toLowerCase()),
);

const REDACTED = '[REDACTED]';

export type AppendActivityLogInput = {
  entityType: AutopilotEntityType | string;
  entityId: string;
  eventType: AutopilotEventType | string;
  actorType: AutopilotActorType | string;
  /** Trusted server session / internal caller only — never from client body. */
  actorId?: number | null;
  actorDisplayName?: string | null;
  source: AutopilotEventSource | string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
  reason?: string | null;
  correlationId?: string | null;
};

export type ListActivityLogsQuery = {
  entityType?: string;
  entityId?: string;
  eventType?: string;
  limit: number;
  offset: number;
};

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_SET.has(key.toLowerCase());
}

export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      result[key] = isSensitiveKey(key) ? REDACTED : redactSensitive(nested);
    }
    return result;
  }

  return value;
}

function toNullableJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.DbNull | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return Prisma.DbNull;
  }
  return redactSensitive(value) as Prisma.InputJsonValue;
}

export function buildActivitySummary(
  eventType: string,
  metadata?: Record<string, unknown> | null,
): string {
  const title =
    typeof metadata?.workingTitle === 'string' ? metadata.workingTitle.trim() : '';
  const key =
    typeof metadata?.key === 'string'
      ? metadata.key.trim()
      : typeof metadata?.settingKey === 'string'
        ? metadata.settingKey.trim()
        : '';

  switch (eventType) {
    case 'topic_created':
      return title ? `Topic created: ${title}` : 'Topic created';
    case 'topic_updated':
      return title ? `Topic updated: ${title}` : 'Topic updated';
    case 'research_started':
      return 'Research started';
    case 'research_completed':
      return 'Research completed';
    case 'research_failed':
      return 'Research failed';
    case 'research_snapshot_created':
      return 'Research snapshot created';
    case 'research_snapshot_updated':
      return 'Research snapshot updated';
    case 'research_overlap_analysed':
      return 'Research overlap analysed';
    case 'research_marked_ready':
      return 'Research marked ready';
    case 'research_snapshot_confirmed':
      return 'Research snapshot confirmed';
    case 'research_snapshot_superseded':
      return 'Research snapshot superseded';
    case 'research_returned_to_draft':
      return 'Research returned to draft';
    case 'score_calculated':
      return 'Score calculated';
    case 'score_overridden':
      return 'Score inputs overridden';
    case 'category_recommended':
      return 'Category recommended';
    case 'category_overridden':
      return 'Category overridden';
    case 'decision_submitted':
      return 'Decision submitted for review';
    case 'decision_approved':
      return 'Decision approved';
    case 'decision_rejected':
      return 'Decision rejected';
    case 'decision_deferred':
      return 'Decision deferred';
    case 'more_research_requested':
      return 'More research requested';
    case 'topic_archived':
      return title ? `Topic archived: ${title}` : 'Topic archived';
    case 'workflow_queued':
      return 'Workflow queued';
    case 'workflow_started':
      return 'Workflow started';
    case 'workflow_succeeded':
      return 'Workflow succeeded';
    case 'workflow_failed':
      return 'Workflow failed';
    case 'setting_changed':
      return key ? `Setting changed: ${key}` : 'Setting changed';
    case 'keyword_import_started':
      return 'Keyword import started';
    case 'keyword_import_completed':
      return 'Keyword import completed';
    case 'keyword_import_completed_with_errors':
      return 'Keyword import completed with errors';
    case 'keyword_import_failed':
      return 'Keyword import failed';
    case 'keyword_candidate_reviewed':
      return 'Keyword candidate reviewed';
    case 'keyword_candidate_accepted':
      return 'Keyword candidate accepted';
    case 'keyword_candidate_rejected':
      return 'Keyword candidate rejected';
    case 'keyword_candidate_deferred':
      return 'Keyword candidate deferred';
    case 'keyword_candidate_marked_duplicate':
      return 'Keyword candidate marked duplicate';
    case 'keyword_candidate_converted_to_topic':
      return 'Keyword candidate converted to topic';
    case 'gsc_oauth_started':
      return 'Google Search Console OAuth started';
    case 'gsc_connected':
      return 'Google Search Console connected';
    case 'gsc_connection_failed':
      return 'Google Search Console connection failed';
    case 'gsc_property_selected':
      return 'Google Search Console property selected';
    case 'gsc_sync_started':
      return 'Google Search Console sync started';
    case 'gsc_sync_completed':
      return 'Google Search Console sync completed';
    case 'gsc_sync_failed':
      return 'Google Search Console sync failed';
    case 'gsc_disconnected':
      return 'Google Search Console disconnected';
    default:
      return `Autopilot event: ${eventType}`;
  }
}

export async function appendActivityLog(
  db: PrismaLike,
  input: AppendActivityLogInput,
) {
  return db.autopilotActivityLog.create({
    data: {
      entityType: input.entityType,
      entityId: input.entityId,
      eventType: input.eventType,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorDisplayName: input.actorDisplayName ?? null,
      source: input.source,
      previousValue: toNullableJson(input.previousValue),
      newValue: toNullableJson(input.newValue),
      metadata: toNullableJson(input.metadata),
      reason: input.reason ?? null,
      correlationId: input.correlationId ?? null,
    },
  });
}

export async function listActivityLogs(db: PrismaLike, query: ListActivityLogsQuery) {
  const where: Prisma.AutopilotActivityLogWhereInput = {};

  if (query.entityType) {
    where.entityType = query.entityType;
  }
  if (query.entityId) {
    where.entityId = query.entityId;
  }
  if (query.eventType) {
    where.eventType = query.eventType;
  }

  const [items, total] = await Promise.all([
    db.autopilotActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    db.autopilotActivityLog.count({ where }),
  ]);

  return {
    items,
    total,
    limit: query.limit,
    offset: query.offset,
  };
}
