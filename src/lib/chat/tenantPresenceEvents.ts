/**
 * Authenticated tenant presence operational events.
 *
 * Significant transitions only — never one permanent audit row per heartbeat.
 * Details are redacted before persist. Tenant isolation is enforced by caller-supplied tenantId.
 */

import { redactSensitive } from '../autopilot/activityLogService.ts';
import { sanitizeAuditDetails } from '../chatConnect/auditSanitize.ts';

export const TENANT_PRESENCE_EVENT_TYPES = [
  'policy_changed',
  'operator_authenticated',
  'operator_session_ended',
  'presence_available',
  'presence_away',
  'presence_offline',
  'presence_expired',
  'integration_auth_failed',
  'operator_activity',
] as const;

export type TenantPresenceEventType = (typeof TENANT_PRESENCE_EVENT_TYPES)[number];

export const TENANT_PRESENCE_EVENT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
export const TENANT_PRESENCE_EVENT_MAX_PER_TENANT = 5_000;
export const TENANT_PRESENCE_EVENT_CORRELATION_MAX = 64;
export const TENANT_PRESENCE_EVENT_DEDUPE_MAX = 128;
export const TENANT_PRESENCE_EVENT_ACTOR_REF_MAX = 64;

export type TenantPresenceEventRecord = {
  id: number;
  tenantId: string;
  eventType: TenantPresenceEventType;
  actorRef: string | null;
  actorUserId: number | null;
  correlationId: string | null;
  dedupeKey: string;
  details: Record<string, unknown>;
  createdAt: Date;
  duplicated: boolean;
};

export type AppendTenantPresenceEventInput = {
  tenantId: string;
  eventType: TenantPresenceEventType;
  actorRef?: string | null;
  actorUserId?: number | null;
  correlationId?: string | null;
  /** Stable key within (tenantId, eventType). Defaults to correlationId or actorRef+type. */
  dedupeKey?: string | null;
  details?: Record<string, unknown> | null;
  at?: Date;
};

export type TenantPresenceEventStore = {
  append(input: AppendTenantPresenceEventInput): Promise<TenantPresenceEventRecord>;
  list(filter: {
    tenantId?: string;
    tenantIds?: readonly string[];
    limit: number;
    beforeId?: number;
  }): Promise<TenantPresenceEventRecord[]>;
  prune(now?: Date): Promise<{ deletedByAge: number; deletedByCap: number }>;
};

export function isTenantPresenceEventType(value: unknown): value is TenantPresenceEventType {
  return typeof value === 'string' && (TENANT_PRESENCE_EVENT_TYPES as readonly string[]).includes(value);
}

export function sanitizePresenceEventDetails(details: unknown): Record<string, unknown> {
  const redacted = redactSensitive(details ?? {});
  return sanitizeAuditDetails(redacted);
}

export function buildPresenceEventDedupeKey(input: {
  eventType: TenantPresenceEventType;
  actorRef?: string | null;
  actorUserId?: number | null;
  correlationId?: string | null;
  dedupeKey?: string | null;
  at?: Date;
}): string {
  if (typeof input.dedupeKey === 'string' && input.dedupeKey.trim()) {
    return input.dedupeKey.trim().slice(0, TENANT_PRESENCE_EVENT_DEDUPE_MAX);
  }
  if (typeof input.correlationId === 'string' && input.correlationId.trim()) {
    return input.correlationId.trim().slice(0, TENANT_PRESENCE_EVENT_DEDUPE_MAX);
  }
  const actor =
    (typeof input.actorRef === 'string' && input.actorRef.trim())
    || (input.actorUserId != null ? `user:${input.actorUserId}` : 'system');
  // Minute bucket avoids one row per identical transition flood without requiring correlationId.
  const bucket = Math.floor((input.at ?? new Date()).getTime() / 60_000);
  return `${input.eventType}:${actor}:${bucket}`.slice(0, TENANT_PRESENCE_EVENT_DEDUPE_MAX);
}

export function normalizeActorRef(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TENANT_PRESENCE_EVENT_ACTOR_REF_MAX);
}

export function normalizeCorrelationId(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, TENANT_PRESENCE_EVENT_CORRELATION_MAX);
}
