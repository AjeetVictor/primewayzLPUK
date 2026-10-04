/**
 * Delegated WordPress operator writes: reply, resolve, reopen.
 *
 * Each action runs in one transaction that claims the idempotency key
 * (integrationId + clientActionId) by inserting a ChatOperatorAction row, applies the shared
 * chatConversationService write, and links the result back to that row. Any failure rolls
 * back the claim together with the message / status writes.
 *
 * The WordPress actor is audit context only: it never selects the tenant, never maps to a
 * UK Admin user and never widens what the integration credential may do.
 */

import { createHash } from 'node:crypto';
import { AdminChatAccessError, assertAdminCanAccessChatSession } from '../admin/adminChatRoutes.ts';
import {
  OperationalChatNotFoundError,
  toTranscriptMessage,
  type OperationalTranscriptMessage,
} from '../admin/operationalChatService.ts';
import {
  createTeamReply,
  reopenConversation,
  resolveConversation,
  type ChatConversationSessionRow,
  type ChatConversationStore,
  type ChatConversationTx,
  type ChatOperatorActionRecord,
  type ChatStoredMessage,
} from '../chat/chatConversationService.ts';

export const DELEGATED_CHAT_WRITE_ACTIONS = ['reply', 'resolve', 'reopen'] as const;
export type DelegatedChatWriteAction = (typeof DELEGATED_CHAT_WRITE_ACTIONS)[number];

export const OPERATOR_ACTION_SOURCE = 'wordpress_integration';

export type DelegatedActor = { externalUserId: string; displayName: string | null };

export type DelegatedChatWriteRequest =
  | { action: 'reply'; sessionId: string; clientActionId: string; actor: DelegatedActor; text: string }
  | { action: 'resolve' | 'reopen'; sessionId: string; clientActionId: string; actor: DelegatedActor };

export type DelegatedChatActionOutcome = {
  action: DelegatedChatWriteAction;
  clientActionId: string;
  replayed: boolean;
  changed: boolean;
  message: OperationalTranscriptMessage | null;
};

export class DelegatedChatActionError extends Error {
  readonly code = 'idempotency_key_conflict' as const;

  constructor() {
    super('clientActionId was already used for a different request.');
    this.name = 'DelegatedChatActionError';
  }
}

/**
 * Hash of the logical payload. actor.displayName is cosmetic and excluded, so a renamed
 * WordPress user retrying the same action still replays.
 */
export function computeDelegatedRequestHash(request: DelegatedChatWriteRequest): string {
  const logical = [
    request.action,
    request.sessionId,
    request.actor.externalUserId,
    request.action === 'reply' ? request.text : null,
  ];
  return createHash('sha256').update(JSON.stringify(logical), 'utf8').digest('hex');
}

function assertSessionInTenant(session: ChatConversationSessionRow | null, tenantId: string): ChatConversationSessionRow {
  try {
    assertAdminCanAccessChatSession(session, tenantId);
  } catch (err) {
    if (err instanceof AdminChatAccessError) throw new OperationalChatNotFoundError();
    throw err;
  }
  if (!session || session.tenantId !== tenantId) throw new OperationalChatNotFoundError();
  return session;
}

function toOperationalMessage(message: ChatStoredMessage | null, sessionId: string): OperationalTranscriptMessage | null {
  if (!message || message.sessionId !== sessionId) return null;
  return toTranscriptMessage({
    id: message.id,
    sessionId: message.sessionId,
    sender: message.sender,
    text: message.text,
    timestamp: message.timestamp,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    replyToId: message.replyToId,
    replyToIsInternalNote: false,
  });
}

async function replay(
  tx: ChatConversationTx,
  existing: ChatOperatorActionRecord,
  input: { tenantId: string; requestHash: string; request: DelegatedChatWriteRequest },
): Promise<DelegatedChatActionOutcome> {
  if (existing.requestHash !== input.requestHash || existing.tenantId !== input.tenantId) {
    throw new DelegatedChatActionError();
  }
  const message = existing.messageId !== null
    ? toOperationalMessage(await tx.findMessage(existing.messageId), existing.sessionId)
    : null;
  return {
    action: input.request.action,
    clientActionId: existing.clientActionId,
    replayed: true,
    changed: existing.changed,
    message,
  };
}

function isUniqueConstraintViolation(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as { code?: unknown }).code === 'P2002');
}

export async function executeDelegatedChatAction(
  store: ChatConversationStore,
  input: {
    integrationId: string;
    tenantId: string;
    requestId: string;
    request: DelegatedChatWriteRequest;
    now?: Date;
  },
): Promise<DelegatedChatActionOutcome> {
  const { integrationId, tenantId, request } = input;
  const requestHash = computeDelegatedRequestHash(request);

  const attempt = () => store.transaction(async (tx): Promise<DelegatedChatActionOutcome> => {
    const existing = await tx.findOperatorAction({ integrationId, clientActionId: request.clientActionId });
    if (existing) return replay(tx, existing, { tenantId, requestHash, request });

    const session = assertSessionInTenant(await tx.findSession(request.sessionId), tenantId);

    const claimed = await tx.createOperatorAction({
      integrationId,
      clientActionId: request.clientActionId,
      requestHash,
      requestId: input.requestId,
      source: OPERATOR_ACTION_SOURCE,
      tenantId,
      sessionId: session.id,
      action: request.action,
      actorExternalId: request.actor.externalUserId,
      actorDisplayName: request.actor.displayName,
      messageId: null,
      fromStatus: session.status,
      toStatus: null,
      changed: false,
    });

    if (request.action === 'reply') {
      const result = await createTeamReply(tx, {
        session,
        text: request.text,
        isInternalNote: false,
        replyToId: null,
        terminalPolicy: 'reject',
      });
      await tx.updateOperatorAction(claimed.id, {
        messageId: result.message.id,
        fromStatus: result.fromStatus,
        toStatus: result.toStatus,
        changed: true,
      });
      return {
        action: 'reply',
        clientActionId: request.clientActionId,
        replayed: false,
        changed: true,
        message: toOperationalMessage(result.message, session.id),
      };
    }

    const result = request.action === 'resolve'
      ? await resolveConversation(tx, { session, now: input.now })
      : await reopenConversation(tx, { session });
    await tx.updateOperatorAction(claimed.id, {
      fromStatus: result.fromStatus,
      toStatus: result.toStatus,
      changed: result.changed,
    });
    return {
      action: request.action,
      clientActionId: request.clientActionId,
      replayed: false,
      changed: result.changed,
      message: null,
    };
  });

  try {
    return await attempt();
  } catch (err) {
    // A concurrent request claimed the same key first; its committed row decides replay vs conflict.
    if (isUniqueConstraintViolation(err)) return attempt();
    throw err;
  }
}
