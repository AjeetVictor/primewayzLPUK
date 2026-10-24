/**
 * PW-CHAT-PRESENCE-WS2 — Primewayz UK Admin operator-presence hardening.
 *
 * Couples authenticated UK Admin chat-agent sessions to tenant heartbeats.
 * Dashboard and visitor availability share resolveChatPresence (same store).
 * Does not activate Option 1 (presencePolicy stays Host-controlled / default legacy).
 * Does not grant WordPress / Silver presence-write scopes.
 */

import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  isAdminPresenceExpired,
  resolveChatPresence,
  type ChatPresencePolicy,
  type ResolvedChatPresence,
} from './chatPresence.ts';
import {
  countActiveTenantOperators,
  listActiveTenantOperators,
  type TenantChatPresenceReadPrisma,
  type TenantChatPresenceState,
} from './tenantChatPresenceStore.ts';
import {
  resolveEffectiveTenantChatRole,
  type TenantChatRole,
  type TenantChatRolePrincipal,
} from '../admin/tenantChatRole.ts';

export const UK_ADMIN_PRESENCE_OFFLINE_PATH = '/api/admin/presence/offline';

/** Fields that must never be accepted on UK Admin heartbeat / offline bodies. */
export const UK_ADMIN_PRESENCE_REJECTED_BODY_FIELDS = [
  'tenantId',
  'operatorUserId',
  'userId',
  'token',
  'password',
  'secret',
] as const;

export type UkAdminOperatorSessionView = {
  /** Admin JWT is present and chat-agent authorised for this tenant. */
  authenticatedChatAgent: boolean;
  chatRole: TenantChatRole;
  chatRoleBasis: string;
  /** This operator currently contributes a fresh heartbeat for the tenant. */
  contributing: boolean;
  ownLastSeenAt: string | null;
  ownExpiresAt: string | null;
  /** Session alone never implies human Online — heartbeat within TTL is required. */
  authIsNotAvailability: true;
};

export type UkAdminPresenceDashboardView = {
  /** Same status the visitor widget resolves from this tenant's store. */
  visitorStatus: ResolvedChatPresence['status'];
  teamStatus: ResolvedChatPresence['teamStatus'];
  /** Verified human Online: fresh authorised operator heartbeat under a mode that allows Online. */
  verifiedHumanOnline: boolean;
  /** Automated / assistant replies never flip this true by themselves. */
  automatedRepliesDoNotCreateHumanOnline: true;
  activeOperatorCount: number;
  presenceExpiresAt: string | null;
  heartbeatWindowMs: number;
  operatorSession: UkAdminOperatorSessionView;
  presencePolicy: ChatPresencePolicy;
  /** True only when Host has activated Option 1 (`heartbeat_required_online`) for this tenant. */
  option1Activated: boolean;
};

/** Option 1 = verified human Online requires an authorised fresh heartbeat. */
export function isOption1Activated(presencePolicy: ChatPresencePolicy): boolean {
  return presencePolicy === 'heartbeat_required_online';
}

export function assertUkAdminPresenceBodyClean(body: unknown): void {
  if (body == null || body === '') return;
  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('invalid_presence_body');
  }
  const record = body as Record<string, unknown>;
  for (const key of UK_ADMIN_PRESENCE_REJECTED_BODY_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      throw new Error(`rejected_presence_field:${key}`);
    }
  }
}

export function presenceExpiresAtFromLatest(
  latestAdminSeenAt: Date | null | undefined,
  windowMs: number = ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
): Date | null {
  if (!latestAdminSeenAt) return null;
  return new Date(latestAdminSeenAt.getTime() + windowMs);
}

/**
 * Verified human Online for UK dashboard / contracts.
 * Under legacy forced Online without a heartbeat this is false while visitor status may still be online.
 * Option 1 (not activated here) aligns visitor status with this signal.
 */
export function isVerifiedHumanOnline(resolved: ResolvedChatPresence): boolean {
  return resolved.hasActiveAdmin && resolved.status === 'online';
}

export async function buildUkAdminPresenceDashboardView(input: {
  presencePrisma: TenantChatPresenceReadPrisma;
  tenantId: string;
  principal: TenantChatRolePrincipal;
  state: TenantChatPresenceState;
  presencePolicy: ChatPresencePolicy;
  now?: Date;
  env?: NodeJS.ProcessEnv;
}): Promise<UkAdminPresenceDashboardView> {
  const now = input.now ?? new Date();
  const resolved = resolveChatPresence({
    mode: input.state.setting?.mode,
    latestAdminSeenAt: input.state.latestAdminSeenAt,
    now: now.getTime(),
    presencePolicy: input.presencePolicy,
  });
  const roleDecision = resolveEffectiveTenantChatRole(input.principal, input.tenantId, input.env);
  const authenticatedChatAgent = roleDecision.role === 'agent';

  const [activeOperatorCount, activeOperators, ownRow] = await Promise.all([
    countActiveTenantOperators(input.presencePrisma.adminPresence, input.tenantId, now),
    listActiveTenantOperators(input.presencePrisma.adminPresence, input.tenantId, now),
    input.presencePrisma.adminPresence.findFirst({
      where: { tenantId: input.tenantId, userId: input.principal.id },
      select: { lastSeenAt: true, userId: true },
    }),
  ]);

  const ownLastSeenAt = ownRow?.lastSeenAt ?? null;
  const contributing =
    authenticatedChatAgent
    && !isAdminPresenceExpired(ownLastSeenAt, now.getTime())
    && activeOperators.some((row) => row.userId === input.principal.id);

  const latestExpiry = presenceExpiresAtFromLatest(input.state.latestAdminSeenAt);

  return {
    visitorStatus: resolved.status,
    teamStatus: resolved.teamStatus,
    verifiedHumanOnline: isVerifiedHumanOnline(resolved),
    automatedRepliesDoNotCreateHumanOnline: true,
    activeOperatorCount,
    presenceExpiresAt: latestExpiry?.toISOString() ?? null,
    heartbeatWindowMs: ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
    operatorSession: {
      authenticatedChatAgent,
      chatRole: roleDecision.role,
      chatRoleBasis: roleDecision.basis,
      contributing,
      ownLastSeenAt: ownLastSeenAt?.toISOString() ?? null,
      ownExpiresAt: ownLastSeenAt
        ? new Date(ownLastSeenAt.getTime() + ADMIN_PRESENCE_ACTIVE_WINDOW_MS).toISOString()
        : null,
      authIsNotAvailability: true,
    },
    // WS-2 never flips the durable policy row; Host activation remains WS-1 governance.
    presencePolicy: input.presencePolicy,
    option1Activated: isOption1Activated(input.presencePolicy),
  };
}

export type UkAdminPresenceClearResult = {
  cleared: number;
  tenantId: string;
  userId: number;
};

/**
 * Parse optional `notAfterMs` from an Offline body.
 * Used so a delayed Offline cannot clear a heartbeat written after this session ended.
 */
export function parseUkAdminPresenceNotAfterMs(body: unknown): Date | undefined {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return undefined;
  const raw = (body as Record<string, unknown>).notAfterMs;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/**
 * Drop this operator's heartbeat for one concrete tenant (disconnect / offline).
 * Does not rewrite ChatPresenceSetting modes.
 * Pass `notAfter` to refuse clearing heartbeats newer than the ending session.
 */
export async function clearUkAdminOperatorPresenceForTenant(
  clear: (input: { userId: number; tenantId: string; notAfter?: Date }) => Promise<number>,
  input: { userId: number; tenantId: string; notAfter?: Date },
): Promise<UkAdminPresenceClearResult> {
  const cleared = await clear({
    userId: input.userId,
    tenantId: input.tenantId,
    ...(input.notAfter ? { notAfter: input.notAfter } : {}),
  });
  return { cleared, tenantId: input.tenantId, userId: input.userId };
}
