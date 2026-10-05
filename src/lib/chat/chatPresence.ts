/**
 * Chat team presence resolution.
 *
 * Presence is TENANT-SCOPED: ChatPresenceSetting and AdminPresence rows carry a tenantId, and
 * callers must resolve presence from the rows of one concrete, already-authorised tenant only.
 * A tenant without rows resolves from defaults (auto, no active admin) — it never inherits
 * another tenant's latest state.
 */

export const ADMIN_PRESENCE_ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export type ChatPresenceMode = 'auto' | 'online' | 'away' | 'offline';
export type ChatPresenceStatus = 'online' | 'assistant' | 'away' | 'offline';

export const CHAT_PRESENCE_SCOPE = 'tenant' as const;

export type ResolvedChatPresence = {
  mode: ChatPresenceMode;
  hasActiveAdmin: boolean;
  computedStatus: 'online' | 'assistant';
  status: ChatPresenceStatus;
  canAcceptMessages: boolean;
};

export function resolveChatPresence(input: {
  mode: string | null | undefined;
  latestAdminSeenAt: Date | null | undefined;
  now?: number;
}): ResolvedChatPresence {
  const now = input.now ?? Date.now();
  const latestAdminSeenAt = input.latestAdminSeenAt ?? null;
  const hasActiveAdmin = latestAdminSeenAt
    ? now - latestAdminSeenAt.getTime() < ADMIN_PRESENCE_ACTIVE_WINDOW_MS
    : false;
  const mode = (input.mode || 'auto') as ChatPresenceMode;
  const computedStatus = hasActiveAdmin ? 'online' : 'assistant';
  const status = (mode === 'auto' ? computedStatus : mode === 'online' ? 'online' : mode) as ChatPresenceStatus;
  return {
    mode,
    hasActiveAdmin,
    computedStatus,
    status,
    canAcceptMessages: status !== 'offline',
  };
}
