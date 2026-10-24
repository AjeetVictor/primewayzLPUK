/**
 * Chat team presence resolution.
 *
 * Presence is TENANT-SCOPED: ChatPresenceSetting and AdminPresence rows carry a tenantId, and
 * callers must resolve presence from the rows of one concrete, already-authorised tenant only.
 * A tenant without rows resolves from defaults (auto, no active admin) — it never inherits
 * another tenant's latest state.
 *
 * Admin-facing explicit team statuses are Available / Away / Offline. Storage still accepts
 * the legacy `online` spelling as an alias of `available`. Visitor payloads keep
 * online | assistant | away | offline for widget compatibility.
 */

export const ADMIN_PRESENCE_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export type ChatPresenceMode = 'auto' | 'online' | 'available' | 'away' | 'offline';
export type ChatPresenceStatus = 'online' | 'assistant' | 'away' | 'offline';
/** Explicit per-tenant operator availability shown to Admin / WordPress team surfaces. */
export type ExplicitTeamPresenceStatus = 'available' | 'away' | 'offline';

/**
 * Per-tenant presence policy (WS-1). Omit / null / legacy_forced_online keeps today's
 * forced Available/Online behaviour. heartbeat_required_online is Option 1 (dark until Host activates).
 */
export type ChatPresencePolicy = 'legacy_forced_online' | 'heartbeat_required_online';
export const DEFAULT_CHAT_PRESENCE_POLICY: ChatPresencePolicy = 'legacy_forced_online';

export const CHAT_PRESENCE_SCOPE = 'tenant' as const;

export const EXPLICIT_TEAM_PRESENCE_STATUSES = ['available', 'away', 'offline'] as const;

export type ResolvedChatPresence = {
  mode: ChatPresenceMode;
  hasActiveAdmin: boolean;
  computedStatus: 'online' | 'assistant';
  status: ChatPresenceStatus;
  /** Explicit team status used by Admin and operational integrations. */
  teamStatus: ExplicitTeamPresenceStatus | 'not_online';
  canAcceptMessages: boolean;
};

export function isAdminPresenceExpired(
  latestAdminSeenAt: Date | null | undefined,
  now: number = Date.now(),
  windowMs: number = ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
): boolean {
  if (!latestAdminSeenAt) return true;
  return now - latestAdminSeenAt.getTime() >= windowMs;
}

export function normalizeChatPresenceMode(mode: string | null | undefined): ChatPresenceMode {
  if (mode === 'available' || mode === 'online' || mode === 'away' || mode === 'offline' || mode === 'auto') {
    return mode;
  }
  return 'auto';
}

/** Persist Admin PATCH values: available is preferred; online remains accepted. */
export function persistChatPresenceMode(mode: string | null | undefined): ChatPresenceMode {
  const normalized = normalizeChatPresenceMode(mode);
  return normalized === 'online' ? 'available' : normalized;
}

export function resolveChatPresence(input: {
  mode: string | null | undefined;
  latestAdminSeenAt: Date | null | undefined;
  now?: number;
  /**
   * When omitted or legacy_forced_online, forced available/online still yields visitor online
   * without a heartbeat (current production behaviour). When heartbeat_required_online,
   * forced Online cannot bypass the fresh authorised heartbeat requirement.
   */
  presencePolicy?: ChatPresencePolicy | null;
}): ResolvedChatPresence {
  const now = input.now ?? Date.now();
  const hasActiveAdmin = !isAdminPresenceExpired(input.latestAdminSeenAt, now);
  const mode = normalizeChatPresenceMode(input.mode);
  const policy = input.presencePolicy ?? DEFAULT_CHAT_PRESENCE_POLICY;
  const computedStatus = hasActiveAdmin ? 'online' : 'assistant';
  const forcedOnline = mode === 'online' || mode === 'available';
  const status = (
    mode === 'auto'
      ? computedStatus
      : forcedOnline
        ? (policy === 'heartbeat_required_online' && !hasActiveAdmin ? 'assistant' : 'online')
        : mode
  ) as ChatPresenceStatus;
  const teamStatus: ExplicitTeamPresenceStatus | 'not_online' =
    status === 'online' ? 'available' : status === 'assistant' ? 'not_online' : status;
  return {
    mode,
    hasActiveAdmin,
    computedStatus,
    status,
    teamStatus,
    canAcceptMessages: status !== 'offline',
  };
}
