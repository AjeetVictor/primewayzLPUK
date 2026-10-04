/**
 * Authoritative chat conversation writes shared by every operator surface:
 * the Primewayz UK Admin (AdminPanel / AdminMobileChat) and the delegated WordPress
 * operational API. Route handlers decide who may act on which session; this module
 * decides what a team reply or a status change does to the conversation.
 *
 * Rules:
 * - A non-internal team reply marks the session's visitor messages answered and moves a
 *   non-terminal conversation to admin_replied. Internal notes change neither.
 * - closed / spam are terminal and are never overwritten by an automatic transition.
 *   Every automatic transition is one conditional write (no read-then-write race).
 * - Inside a transaction, findSession is a locking read, so the status it returns is
 *   current and stays current until commit.
 */

export const CONVERSATION_STATUSES = [
  'new',
  'bot_replied',
  'admin_needed',
  'admin_replied',
  'lead_qualified',
  'follow_up_due',
  'booked_call',
  'closed',
  'spam',
] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const TERMINAL_CONVERSATION_STATUSES = ['closed', 'spam'] as const;

/** A reopened conversation re-enters the human attention queue. */
export const REOPEN_TARGET_STATUS = 'admin_needed' satisfies ConversationStatus;

export function isValidConversationStatus(status: unknown): status is ConversationStatus {
  return typeof status === 'string' && (CONVERSATION_STATUSES as readonly string[]).includes(status);
}

export function isTerminalConversationStatus(status: string | null | undefined): boolean {
  return Boolean(status) && (TERMINAL_CONVERSATION_STATUSES as readonly string[]).includes(status as string);
}

export type ConversationStatusData = { status: string; closedAt: Date | null; closedById: number | null };

/** Status write for an explicit operator status change: closedAt / closedById follow the target. */
export function conversationStatusData(
  status: ConversationStatus,
  input: { closedById?: number | null; now?: Date } = {},
): ConversationStatusData {
  if (isTerminalConversationStatus(status)) {
    return { status, closedAt: input.now ?? new Date(), closedById: input.closedById ?? null };
  }
  return { status, closedAt: null, closedById: null };
}

export type ChatConversationSessionRow = { id: string; tenantId: string | null; status: string };

export type ChatTeamMessageInput = {
  sessionId: string;
  text: string;
  isInternalNote: boolean;
  replyToId: number | null;
  attachmentIds?: number[];
};

export type ChatStoredMessage = {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  timestamp: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  replyToId: number | null;
};

export type ChatOperatorActionRecord = {
  id: string;
  integrationId: string;
  clientActionId: string;
  requestHash: string;
  requestId: string;
  source: string;
  tenantId: string;
  sessionId: string;
  action: string;
  actorExternalId: string;
  actorDisplayName: string | null;
  messageId: number | null;
  fromStatus: string | null;
  toStatus: string | null;
  changed: boolean;
  createdAt: Date;
};

export type ChatOperatorActionCreate = Omit<ChatOperatorActionRecord, 'id' | 'createdAt'>;

export type ChatConversationTx = {
  findSession(sessionId: string): Promise<ChatConversationSessionRow | null>;
  /**
   * Conditional status write. tenantId undefined = no tenant predicate, null = legacy rows only.
   * Returns the number of rows changed (0 when the guard no longer matches).
   */
  updateSessionStatus(input: {
    sessionId: string;
    tenantId?: string | null;
    statusIn?: readonly string[];
    statusNotIn?: readonly string[];
    data: { status: string; closedAt?: Date | null; closedById?: number | null };
  }): Promise<number>;
  createTeamMessage(input: ChatTeamMessageInput): Promise<ChatStoredMessage>;
  markVisitorMessagesAnswered(sessionId: string): Promise<number>;
  findMessage(id: number): Promise<ChatStoredMessage | null>;
  findOperatorAction(key: { integrationId: string; clientActionId: string }): Promise<ChatOperatorActionRecord | null>;
  createOperatorAction(data: ChatOperatorActionCreate): Promise<{ id: string }>;
  updateOperatorAction(
    id: string,
    data: Partial<Pick<ChatOperatorActionRecord, 'messageId' | 'fromStatus' | 'toStatus' | 'changed'>>,
  ): Promise<void>;
};

export type ChatConversationStore = ChatConversationTx & {
  /** All-or-nothing unit of work; any throw rolls back every write made through `tx`. */
  transaction<T>(fn: (tx: ChatConversationTx) => Promise<T>): Promise<T>;
};

export type ChatConversationConflictCode = 'conversation_closed' | 'invalid_transition';

export class ChatConversationConflictError extends Error {
  readonly code: ChatConversationConflictCode;

  constructor(code: ChatConversationConflictCode, message: string) {
    super(message);
    this.name = 'ChatConversationConflictError';
    this.code = code;
  }
}

const conversationClosed = () =>
  new ChatConversationConflictError('conversation_closed', 'The conversation is closed. Reopen it before replying.');
const invalidTransition = (message: string) => new ChatConversationConflictError('invalid_transition', message);

export function markVisitorMessagesAnswered(tx: Pick<ChatConversationTx, 'markVisitorMessagesAnswered'>, sessionId: string): Promise<number> {
  return tx.markVisitorMessagesAnswered(sessionId);
}

/**
 * Moves a non-terminal conversation to `status` in one conditional write; closed / spam
 * are never overwritten. Returns whether the conversation changed.
 */
export async function advanceConversationStatus(
  tx: Pick<ChatConversationTx, 'updateSessionStatus'>,
  sessionId: string,
  status: ConversationStatus,
  tenantId?: string | null,
): Promise<boolean> {
  if (isTerminalConversationStatus(status)) return false;
  const changed = await tx.updateSessionStatus({
    sessionId,
    tenantId,
    statusNotIn: TERMINAL_CONVERSATION_STATUSES,
    data: { status },
  });
  return changed > 0;
}

/**
 * reject                        delegated operators: closed / spam returns conversation_closed
 * append_without_status_change  UK Admin: the reply is stored, a terminal status is kept
 */
export type TeamReplyTerminalPolicy = 'reject' | 'append_without_status_change';

export type TeamReplyResult = {
  message: ChatStoredMessage;
  fromStatus: string;
  toStatus: string;
  statusChanged: boolean;
};

/** The single team-reply implementation. Run inside store.transaction with an authorised session. */
export async function createTeamReply(
  tx: ChatConversationTx,
  input: {
    session: ChatConversationSessionRow;
    text: string;
    isInternalNote: boolean;
    replyToId: number | null;
    attachmentIds?: number[];
    terminalPolicy: TeamReplyTerminalPolicy;
  },
): Promise<TeamReplyResult> {
  const { session } = input;
  if (input.terminalPolicy === 'reject' && isTerminalConversationStatus(session.status)) throw conversationClosed();

  let statusChanged = false;
  if (!input.isInternalNote) {
    statusChanged = await advanceConversationStatus(tx, session.id, 'admin_replied', session.tenantId);
    if (!statusChanged && input.terminalPolicy === 'reject') throw conversationClosed();
  }

  const message = await tx.createTeamMessage({
    sessionId: session.id,
    text: input.text,
    isInternalNote: input.isInternalNote,
    replyToId: input.replyToId,
    attachmentIds: input.attachmentIds,
  });
  if (!input.isInternalNote) await markVisitorMessagesAnswered(tx, session.id);

  return {
    message,
    fromStatus: session.status,
    toStatus: statusChanged ? 'admin_replied' : session.status,
    statusChanged,
  };
}

export type StatusTransitionResult = { changed: boolean; fromStatus: string; toStatus: string };

/** Non-terminal -> closed. Already closed is a no-op; spam is never converted to closed. */
export async function resolveConversation(
  tx: ChatConversationTx,
  input: { session: ChatConversationSessionRow; now?: Date },
): Promise<StatusTransitionResult> {
  const { session } = input;
  if (session.status === 'closed') return { changed: false, fromStatus: 'closed', toStatus: 'closed' };
  if (session.status === 'spam') throw invalidTransition('Spam conversations cannot be resolved.');

  const changed = await tx.updateSessionStatus({
    sessionId: session.id,
    tenantId: session.tenantId,
    statusNotIn: TERMINAL_CONVERSATION_STATUSES,
    data: conversationStatusData('closed', { closedById: null, now: input.now }),
  });
  if (changed > 0) return { changed: true, fromStatus: session.status, toStatus: 'closed' };

  const current = await tx.findSession(session.id);
  if (current?.status === 'closed') return { changed: false, fromStatus: 'closed', toStatus: 'closed' };
  throw invalidTransition('The conversation can no longer be resolved.');
}

/** closed -> admin_needed. Already admin_needed is a no-op; spam and other states are rejected. */
export async function reopenConversation(
  tx: ChatConversationTx,
  input: { session: ChatConversationSessionRow },
): Promise<StatusTransitionResult> {
  const { session } = input;
  if (session.status === REOPEN_TARGET_STATUS) {
    return { changed: false, fromStatus: REOPEN_TARGET_STATUS, toStatus: REOPEN_TARGET_STATUS };
  }
  if (session.status !== 'closed') throw invalidTransition('Only closed conversations can be reopened.');

  const changed = await tx.updateSessionStatus({
    sessionId: session.id,
    tenantId: session.tenantId,
    statusIn: ['closed'],
    data: conversationStatusData(REOPEN_TARGET_STATUS),
  });
  if (changed > 0) return { changed: true, fromStatus: 'closed', toStatus: REOPEN_TARGET_STATUS };

  const current = await tx.findSession(session.id);
  if (current?.status === REOPEN_TARGET_STATUS) {
    return { changed: false, fromStatus: REOPEN_TARGET_STATUS, toStatus: REOPEN_TARGET_STATUS };
  }
  throw invalidTransition('Only closed conversations can be reopened.');
}
