/**
 * Read-only operational chat views for a single, already-authorised tenant.
 *
 * The store contract below exposes no writes: these views never mark messages answered,
 * change status, touch timestamps, record presence or create sessions / messages.
 * Delegated WordPress writes (reply / resolve / reopen) go through the shared
 * chatConversationService instead, never through this store.
 *
 * Tenant ownership of a single session reuses the Admin rule
 * (assertAdminCanAccessChatSession) with a concrete tenant filter, so legacy NULL-tenant
 * sessions and other tenants' sessions are unreachable. Every query is additionally
 * scoped by tenant inside the store.
 */

import {
  AdminChatAccessError,
  assertAdminCanAccessChatSession,
  type AdminChatSessionOwnership,
} from './adminChatRoutes.ts';
import { CHAT_PRESENCE_SCOPE, resolveChatPresence, type ChatPresenceMode } from '../chat/chatPresence.ts';
import {
  conversationNeedsAttention,
  toChatActor,
  toOperationalConversationStatus,
  toOriginatingPagePath,
  toPlainTextPreview,
  toVisitorLabel,
  type ChatActor,
  type OperationalConversationStatus,
} from '../chat/chatOperationalSemantics.ts';
import {
  buildOperationalVisitorIntelligence,
  resolveVisitorPresence,
  type OperationalVisitor,
  type OperationalVisitorSession,
  type VisitorPresence,
  type VisitorProfileRow,
} from '../chat/visitorIntelligence.ts';
import { getMessageDisplayText } from '../chatTypes.ts';

export const RECENT_CONVERSATIONS_DEFAULT_LIMIT = 20;
export const RECENT_CONVERSATIONS_MAX_LIMIT = 50;
export const TRANSCRIPT_MESSAGE_LIMIT = 100;

export type OperationalSessionRow = {
  id: string;
  tenantId: string | null;
  name: string | null;
  status: string;
  serviceInterest: string | null;
  firstLandingPage: string | null;
  currentPageUrl: string | null;
  visitorLastSeenAt: Date | null;
  createdAt: Date;
};

/** Visible (non-internal) message as read from storage. */
export type OperationalMessageRow = {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  timestamp: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  replyToId: number | null;
  replyToIsInternalNote: boolean;
};

export type OperationalSessionActivity = { sessionId: string; lastActivityAt: Date };

export type OperationalChatStore = {
  checkDatabase(): Promise<void>;
  readTeamPresence(): Promise<{ mode: string | null; latestAdminSeenAt: Date | null }>;
  /** Sessions of the tenant ordered by latest visible message, newest first. */
  listRecentActivity(input: { tenantId: string; limit: number }): Promise<OperationalSessionActivity[]>;
  findSessions(input: { tenantId: string; sessionIds: string[] }): Promise<OperationalSessionRow[]>;
  findSessionOwnership(sessionId: string): Promise<AdminChatSessionOwnership | null>;
  findSession(input: { tenantId: string; sessionId: string }): Promise<OperationalSessionRow | null>;
  /** Latest visible message for each activity entry (ties may return several rows). */
  listLatestVisibleMessages(input: { tenantId: string; activity: OperationalSessionActivity[] }): Promise<OperationalMessageRow[]>;
  countUnansweredVisitorMessages(input: { tenantId: string; sessionIds: string[] }): Promise<Map<string, number>>;
  countVisibleMessages(input: { tenantId: string; sessionIds: string[] }): Promise<Map<string, number>>;
  countSessionsNeedingAttention(tenantId: string): Promise<number>;
  /** Newest-first visible messages of one session, at most `take`. */
  listLatestTranscript(input: { tenantId: string; sessionId: string; take: number }): Promise<OperationalMessageRow[]>;
  /** Allow-listed visitor columns of one tenant session (never raw IP / User-Agent / UTM / referrer). */
  findVisitorProfile(input: { tenantId: string; sessionId: string }): Promise<VisitorProfileRow | null>;
  /** Whether the same tenant has a session for this visitorId created before `createdBefore`. */
  hasEarlierVisitorSession(input: {
    tenantId: string;
    visitorId: string;
    sessionId: string;
    createdBefore: Date;
  }): Promise<boolean>;
};

export class OperationalChatNotFoundError extends Error {
  constructor() {
    super('Conversation not found.');
    this.name = 'OperationalChatNotFoundError';
  }
}

export type OperationalTeamPresence = {
  presenceScope: typeof CHAT_PRESENCE_SCOPE;
  status: 'available' | 'away' | 'offline' | 'not_online';
  mode: ChatPresenceMode;
  teamMemberRecentlyActive: boolean;
  canAcceptMessages: boolean;
};

const PRESENCE_STATUS_LABELS = {
  online: 'available',
  away: 'away',
  offline: 'offline',
  assistant: 'not_online',
} as const;

export async function getOperationalTeamPresence(
  store: OperationalChatStore,
  now: number = Date.now(),
): Promise<OperationalTeamPresence> {
  const raw = await store.readTeamPresence();
  const presence = resolveChatPresence({ mode: raw.mode, latestAdminSeenAt: raw.latestAdminSeenAt, now });
  return {
    presenceScope: CHAT_PRESENCE_SCOPE,
    status: PRESENCE_STATUS_LABELS[presence.status] ?? 'not_online',
    mode: presence.mode,
    teamMemberRecentlyActive: presence.hasActiveAdmin,
    canAcceptMessages: presence.canAcceptMessages,
  };
}

export type OperationalConversationSummary = {
  sessionId: string;
  visitorLabel: string;
  intent: string | null;
  originatingPage: string | null;
  lastMessagePreview: string | null;
  lastActor: ChatActor | null;
  lastActivityAt: string;
  status: OperationalConversationStatus;
  needsAttention: boolean;
  messageCount: number;
};

export type OperationalTranscriptMessage = {
  id: number;
  actor: ChatActor;
  text: string;
  createdAt: string;
  edited: boolean;
  deleted: boolean;
  replyToId: number | null;
};

function summarise(input: {
  session: OperationalSessionRow;
  lastMessage: OperationalMessageRow | null;
  lastActivityAt: Date;
  unansweredVisitorMessageCount: number;
  messageCount: number;
}): OperationalConversationSummary {
  const { session, lastMessage } = input;
  const needsAttention = conversationNeedsAttention({
    status: session.status,
    unansweredVisitorMessageCount: input.unansweredVisitorMessageCount,
  });
  const lastActor = lastMessage ? toChatActor(lastMessage.sender) : null;
  return {
    sessionId: session.id,
    visitorLabel: toVisitorLabel({ name: session.name, sessionId: session.id }),
    intent: session.serviceInterest?.trim() || null,
    originatingPage: toOriginatingPagePath(session.firstLandingPage) ?? toOriginatingPagePath(session.currentPageUrl),
    lastMessagePreview: lastMessage ? toPlainTextPreview(lastMessage) : null,
    lastActor,
    lastActivityAt: input.lastActivityAt.toISOString(),
    status: toOperationalConversationStatus({ status: session.status, needsAttention, lastActor }),
    needsAttention,
    messageCount: input.messageCount,
  };
}

function newestPerSession(messages: OperationalMessageRow[]): Map<string, OperationalMessageRow> {
  const latest = new Map<string, OperationalMessageRow>();
  for (const message of messages) {
    const current = latest.get(message.sessionId);
    if (
      !current
      || message.timestamp.getTime() > current.timestamp.getTime()
      || (message.timestamp.getTime() === current.timestamp.getTime() && message.id > current.id)
    ) {
      latest.set(message.sessionId, message);
    }
  }
  return latest;
}

export function clampRecentConversationLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isSafeInteger(limit) || limit < 1) return RECENT_CONVERSATIONS_DEFAULT_LIMIT;
  return Math.min(limit, RECENT_CONVERSATIONS_MAX_LIMIT);
}

/** Dashboard row: the summary plus lightweight presence only (no contact, device or location). */
export type OperationalDashboardConversation = OperationalConversationSummary & {
  visitorPresence: VisitorPresence;
  lastSeenAt: string | null;
};

/**
 * Bounded dashboard aggregation: one activity GROUP BY, then batched lookups for the
 * selected sessions (details, latest message, unanswered counts, message counts) and one
 * tenant-wide attention COUNT. No per-session queries, no transcripts.
 */
export async function getOperationalChatDashboard(
  store: OperationalChatStore,
  input: { tenantId: string; limit?: number; now?: number },
): Promise<{ attention: { count: number }; recentConversations: OperationalDashboardConversation[] }> {
  const { tenantId } = input;
  const now = input.now ?? Date.now();
  const limit = clampRecentConversationLimit(input.limit);

  const [activity, attentionCount] = await Promise.all([
    store.listRecentActivity({ tenantId, limit }),
    store.countSessionsNeedingAttention(tenantId),
  ]);
  const bounded = activity.slice(0, limit);
  const sessionIds = bounded.map((entry) => entry.sessionId);
  if (sessionIds.length === 0) return { attention: { count: attentionCount }, recentConversations: [] };

  const [sessions, latestMessages, unanswered, messageCounts] = await Promise.all([
    store.findSessions({ tenantId, sessionIds }),
    store.listLatestVisibleMessages({ tenantId, activity: bounded }),
    store.countUnansweredVisitorMessages({ tenantId, sessionIds }),
    store.countVisibleMessages({ tenantId, sessionIds }),
  ]);

  const sessionById = new Map(sessions.filter((session) => session.tenantId === tenantId).map((session) => [session.id, session]));
  const latestBySession = newestPerSession(latestMessages.filter((message) => sessionById.has(message.sessionId)));

  const recentConversations = bounded.flatMap((entry): OperationalDashboardConversation[] => {
    const session = sessionById.get(entry.sessionId);
    if (!session) return [];
    return [{
      ...summarise({
        session,
        lastMessage: latestBySession.get(entry.sessionId) ?? null,
        lastActivityAt: entry.lastActivityAt,
        unansweredVisitorMessageCount: unanswered.get(entry.sessionId) ?? 0,
        messageCount: messageCounts.get(entry.sessionId) ?? 0,
      }),
      visitorPresence: resolveVisitorPresence(session.visitorLastSeenAt, now),
      lastSeenAt: session.visitorLastSeenAt ? session.visitorLastSeenAt.toISOString() : null,
    }];
  });
  recentConversations.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));

  return { attention: { count: attentionCount }, recentConversations };
}

async function loadTenantSession(store: OperationalChatStore, tenantId: string, sessionId: string): Promise<OperationalSessionRow> {
  try {
    assertAdminCanAccessChatSession(await store.findSessionOwnership(sessionId), tenantId);
  } catch (err) {
    if (err instanceof AdminChatAccessError) throw new OperationalChatNotFoundError();
    throw err;
  }
  const session = await store.findSession({ tenantId, sessionId });
  if (!session || session.tenantId !== tenantId) throw new OperationalChatNotFoundError();
  return session;
}

export function toTranscriptMessage(message: OperationalMessageRow): OperationalTranscriptMessage | null {
  const actor = toChatActor(message.sender);
  if (!actor) return null;
  return {
    id: message.id,
    actor,
    text: getMessageDisplayText({ text: message.text, deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null }),
    createdAt: message.timestamp.toISOString(),
    edited: Boolean(message.editedAt) && !message.deletedAt,
    deleted: Boolean(message.deletedAt),
    replyToId: message.replyToId !== null && !message.replyToIsInternalNote ? message.replyToId : null,
  };
}

/**
 * Read-only, bounded transcript of one conversation owned by the tenant, plus the
 * tenant-scoped visitor / session context. At most one extra lookup (earlier session
 * for the same visitorId) runs, and only when a stable visitorId exists.
 */
export async function getOperationalConversation(
  store: OperationalChatStore,
  input: { tenantId: string; sessionId: string; now?: number },
): Promise<{
  conversation: Omit<OperationalConversationSummary, 'messageCount'>;
  visitor: OperationalVisitor;
  session: OperationalVisitorSession;
  messages: OperationalTranscriptMessage[];
  hasMore: boolean;
  messageLimit: number;
}> {
  const { tenantId } = input;
  const now = input.now ?? Date.now();
  const session = await loadTenantSession(store, tenantId, input.sessionId);

  const [newestFirst, unanswered, profile] = await Promise.all([
    store.listLatestTranscript({ tenantId, sessionId: session.id, take: TRANSCRIPT_MESSAGE_LIMIT + 1 }),
    store.countUnansweredVisitorMessages({ tenantId, sessionIds: [session.id] }),
    store.findVisitorProfile({ tenantId, sessionId: session.id }),
  ]);
  if (!profile || profile.id !== session.id || profile.tenantId !== tenantId) throw new OperationalChatNotFoundError();

  const ownMessages = newestFirst.filter((message) => message.sessionId === session.id);
  const hasMore = ownMessages.length > TRANSCRIPT_MESSAGE_LIMIT;
  const visible = ownMessages.slice(0, TRANSCRIPT_MESSAGE_LIMIT);
  const lastMessage = visible[0] ?? null;
  const lastActivityAt = lastMessage?.timestamp ?? session.createdAt;

  const { messageCount: _messageCount, ...conversation } = summarise({
    session,
    lastMessage,
    lastActivityAt,
    unansweredVisitorMessageCount: unanswered.get(session.id) ?? 0,
    messageCount: visible.length,
  });

  const returning = profile.visitorId
    ? await store.hasEarlierVisitorSession({
      tenantId,
      visitorId: profile.visitorId,
      sessionId: session.id,
      createdBefore: profile.createdAt,
    })
    : null;
  const intelligence = buildOperationalVisitorIntelligence({ profile, lastActivityAt, returning, now });

  const messages = visible
    .slice()
    .reverse()
    .map(toTranscriptMessage)
    .filter((message): message is OperationalTranscriptMessage => message !== null);

  return {
    conversation,
    visitor: intelligence.visitor,
    session: intelligence.session,
    messages,
    hasMore,
    messageLimit: TRANSCRIPT_MESSAGE_LIMIT,
  };
}

/** Current summary of one tenant conversation (no transcript): latest message + unanswered count. */
export async function getOperationalConversationSummary(
  store: OperationalChatStore,
  input: { tenantId: string; sessionId: string },
): Promise<Omit<OperationalConversationSummary, 'messageCount'>> {
  const { tenantId } = input;
  const session = await loadTenantSession(store, tenantId, input.sessionId);
  const [latest, unanswered] = await Promise.all([
    store.listLatestTranscript({ tenantId, sessionId: session.id, take: 1 }),
    store.countUnansweredVisitorMessages({ tenantId, sessionIds: [session.id] }),
  ]);
  const lastMessage = latest.find((message) => message.sessionId === session.id) ?? null;
  const { messageCount: _messageCount, ...conversation } = summarise({
    session,
    lastMessage,
    lastActivityAt: lastMessage?.timestamp ?? session.createdAt,
    unansweredVisitorMessageCount: unanswered.get(session.id) ?? 0,
    messageCount: 0,
  });
  return conversation;
}
