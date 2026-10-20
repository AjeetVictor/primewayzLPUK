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

/**
 * Permanent deletion retention. Archive and restore do not use this policy:
 * they only set or clear archivedAt and leave messages, attachments, leads and appointments in place.
 */
export const CHAT_PURGE_RETENTION = {
  messages: 'delete_rows',
  attachments: 'delete_rows_and_local_files',
  appointmentMessage: 'clear_text',
  appointmentLead: 'retain_contact_and_schedule',
  sessionLead: 'retain_name_email_phone_on_tombstone',
  operatorActions: 'retain_without_message_content',
  lifecycleAudit: 'retain_counts_only',
} as const;

export type ChatLifecycleSessionRow = ChatConversationSessionRow & {
  archivedAt: Date | null;
  purgedAt: Date | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type ChatPurgeSnapshot = {
  messageCount: number;
  attachmentCount: number;
  appointmentCount: number;
  leadRetained: boolean;
  attachmentUrls: string[];
};

export type ChatLifecycleAuditWrite = {
  tenantId: string;
  sessionId: string;
  action: 'archive' | 'restore' | 'delete';
  actorKind: 'admin' | 'wordpress_integration';
  actorId: string;
  messageCount: number | null;
  attachmentCount: number | null;
  appointmentCount: number | null;
  leadRetained: boolean;
};

export class ChatLifecycleNotFoundError extends Error {
  readonly code = 'conversation_not_found' as const;

  constructor() {
    super('Conversation not found.');
    this.name = 'ChatLifecycleNotFoundError';
  }
}

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
  findLifecycleSession(sessionId: string): Promise<ChatLifecycleSessionRow | null>;
  /**
   * Sets or clears archivedAt. tenantId null matches legacy rows only.
   * Returns 0 when the session is missing, belongs to another tenant, is purged,
   * or is already in the requested archive state.
   */
  setSessionArchived(input: {
    sessionId: string;
    tenantId: string | null;
    archivedAt: Date | null;
    archivedById: number | null;
  }): Promise<number>;
  /**
   * Deletes message and attachment rows for one tenant session, clears appointment message text,
   * and stamps purgedAt. Returns null when the session is missing, cross-tenant, or already purged.
   * The snapshot carries counts and local attachment URLs. It never carries message text.
   */
  purgeSessionContent(input: {
    sessionId: string;
    tenantId: string | null;
    purgedAt: Date;
  }): Promise<ChatPurgeSnapshot | null>;
  recordLifecycleAudit(input: ChatLifecycleAuditWrite): Promise<void>;
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

function auditTenantId(tenantId: string | null): string {
  return tenantId && tenantId.length > 0 ? tenantId : 'legacy';
}

async function requireLiveLifecycle(
  tx: ChatConversationTx,
  session: ChatConversationSessionRow,
): Promise<ChatLifecycleSessionRow> {
  const row = await tx.findLifecycleSession(session.id);
  if (!row || row.tenantId !== session.tenantId) throw new ChatLifecycleNotFoundError();
  if (row.purgedAt) throw new ChatLifecycleNotFoundError();
  return row;
}

/** Hide a conversation from the active inbox. Messages, attachments and leads stay. */
export async function archiveConversation(
  tx: ChatConversationTx,
  input: {
    session: ChatConversationSessionRow;
    actorKind: ChatLifecycleAuditWrite['actorKind'];
    actorId: string;
    archivedById?: number | null;
    now?: Date;
  },
): Promise<StatusTransitionResult> {
  const row = await requireLiveLifecycle(tx, input.session);
  if (row.archivedAt) return { changed: false, fromStatus: row.status, toStatus: row.status };
  const changed = await tx.setSessionArchived({
    sessionId: row.id,
    tenantId: row.tenantId,
    archivedAt: input.now ?? new Date(),
    archivedById: input.archivedById ?? null,
  });
  if (changed === 0) {
    const current = await tx.findLifecycleSession(row.id);
    if (current?.archivedAt && !current.purgedAt) return { changed: false, fromStatus: row.status, toStatus: row.status };
    throw new ChatLifecycleNotFoundError();
  }
  await tx.recordLifecycleAudit({
    tenantId: auditTenantId(row.tenantId),
    sessionId: row.id,
    action: 'archive',
    actorKind: input.actorKind,
    actorId: input.actorId,
    messageCount: null,
    attachmentCount: null,
    appointmentCount: null,
    leadRetained: false,
  });
  return { changed: true, fromStatus: row.status, toStatus: row.status };
}

/** Return an archived conversation to the active inbox. A purged conversation cannot be restored. */
export async function restoreConversation(
  tx: ChatConversationTx,
  input: {
    session: ChatConversationSessionRow;
    actorKind: ChatLifecycleAuditWrite['actorKind'];
    actorId: string;
  },
): Promise<StatusTransitionResult> {
  const row = await requireLiveLifecycle(tx, input.session);
  if (!row.archivedAt) return { changed: false, fromStatus: row.status, toStatus: row.status };
  const changed = await tx.setSessionArchived({
    sessionId: row.id,
    tenantId: row.tenantId,
    archivedAt: null,
    archivedById: null,
  });
  if (changed === 0) {
    const current = await tx.findLifecycleSession(row.id);
    if (current && !current.archivedAt && !current.purgedAt) return { changed: false, fromStatus: row.status, toStatus: row.status };
    throw new ChatLifecycleNotFoundError();
  }
  await tx.recordLifecycleAudit({
    tenantId: auditTenantId(row.tenantId),
    sessionId: row.id,
    action: 'restore',
    actorKind: input.actorKind,
    actorId: input.actorId,
    messageCount: null,
    attachmentCount: null,
    appointmentCount: null,
    leadRetained: false,
  });
  return { changed: true, fromStatus: row.status, toStatus: row.status };
}

export type PurgeConversationResult = StatusTransitionResult & {
  snapshot: ChatPurgeSnapshot;
};

/**
 * Permanently delete conversation content for one tenant.
 * The audit row records counts and whether lead identity was kept. It does not record message text.
 */
export async function purgeConversation(
  tx: ChatConversationTx,
  input: {
    session: ChatConversationSessionRow;
    actorKind: ChatLifecycleAuditWrite['actorKind'];
    actorId: string;
    now?: Date;
  },
): Promise<PurgeConversationResult> {
  const row = await tx.findLifecycleSession(input.session.id);
  if (!row || row.tenantId !== input.session.tenantId || row.purgedAt) throw new ChatLifecycleNotFoundError();
  const snapshot = await tx.purgeSessionContent({
    sessionId: row.id,
    tenantId: row.tenantId,
    purgedAt: input.now ?? new Date(),
  });
  if (!snapshot) throw new ChatLifecycleNotFoundError();
  await tx.recordLifecycleAudit({
    tenantId: auditTenantId(row.tenantId),
    sessionId: row.id,
    action: 'delete',
    actorKind: input.actorKind,
    actorId: input.actorId,
    messageCount: snapshot.messageCount,
    attachmentCount: snapshot.attachmentCount,
    appointmentCount: snapshot.appointmentCount,
    leadRetained: snapshot.leadRetained,
  });
  return { changed: true, fromStatus: row.status, toStatus: 'purged', snapshot };
}
