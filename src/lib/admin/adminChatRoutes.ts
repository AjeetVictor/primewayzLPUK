/**
 * Authenticated Admin chat handlers (mounted behind requireAdmin + requireRole in server.ts).
 *
 * Admin authority is separate from visitor source resolution: the session tenant is read
 * from the stored ChatSession and checked against the Admin-selected tenant filter
 * (adminTenantFilter), never derived from the admin page's Origin / Host. One Primewayz UK
 * backend and database serve every tenant; tenantId is attribution, not infrastructure.
 *
 * The store intentionally exposes no ChatSession write: admin reads and replies cannot
 * change tenantId / market / sourceSite / sourceOrigin / sourceChannel.
 */

import type { Request, RequestHandler, Response } from 'express';
import { resolveAdminTenantFilter } from '../platform/adminTenantFilter.ts';
import { SourceResolutionError } from '../platform/sourceResolver.ts';
import { getTenantById } from '../platform/tenantRegistry.ts';
import { assertChatSessionIdShape, isPermittedAdminChatReplySender, PublicChatRequestError } from '../chat/publicChatGuards.ts';

export class AdminChatAccessError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'AdminChatAccessError';
    this.status = status;
    this.code = code;
  }
}

export type AdminChatSessionOwnership = { id: string; tenantId: string | null };

export type AdminChatReplyInput = {
  sessionId: string;
  sender: 'admin';
  text: string;
  isInternalNote: boolean;
  replyToId: number | null;
  attachmentIds?: number[];
};

export type AdminChatStore = {
  findSessionOwnership(sessionId: string): Promise<AdminChatSessionOwnership | null>;
  listMessages(filter: { tenantId?: string }): Promise<unknown[]>;
  listSessionMessages(sessionId: string): Promise<unknown[]>;
  listSessions(filter: { tenantId?: string }): Promise<unknown[]>;
  countMessagesInSession(messageId: number, sessionId: string): Promise<number>;
  countAttachmentsInSession(attachmentIds: number[], sessionId: string): Promise<number>;
  createAdminMessage(input: AdminChatReplyInput): Promise<unknown>;
};

export type AdminChatRouteDeps = {
  store: AdminChatStore;
  /** Marks visitor messages answered and moves the conversation to admin_replied (status only). */
  markVisitorMessagesAnswered(sessionId: string): Promise<void>;
  isDatabaseUnavailableError(err: unknown): boolean;
  logUnavailable(context: string, err: unknown): void;
};

function requestedTenantFilter(req: Request): string | undefined {
  return resolveAdminTenantFilter(typeof req.query.tenantId === 'string' ? req.query.tenantId : undefined);
}

/**
 * Admins may operate on sessions of active registered tenants that fall inside the selected
 * filter. Legacy NULL-tenant sessions are only reachable under "All entities", matching
 * adminTenantWhere.
 */
export function assertAdminCanAccessChatSession(
  session: AdminChatSessionOwnership | null,
  tenantFilter: string | undefined,
): AdminChatSessionOwnership {
  if (!session) throw new AdminChatAccessError(404, 'chat_session_not_found', 'Chat session not found.');
  if (session.tenantId && !getTenantById(session.tenantId)?.active) {
    throw new AdminChatAccessError(403, 'tenant_not_permitted', 'This chat belongs to an inactive platform entity.');
  }
  if (tenantFilter && session.tenantId !== tenantFilter) {
    throw new AdminChatAccessError(403, 'tenant_scope_mismatch', 'This chat is outside the selected platform entity.');
  }
  return session;
}

async function loadAuthorisedSession(
  store: AdminChatStore,
  rawSessionId: unknown,
  tenantFilter: string | undefined,
): Promise<AdminChatSessionOwnership> {
  const sessionId = assertChatSessionIdShape(rawSessionId);
  return assertAdminCanAccessChatSession(await store.findSessionOwnership(sessionId), tenantFilter);
}

function invalidReply(field: string, message: string): AdminChatAccessError {
  return new AdminChatAccessError(400, 'invalid_input', `${field}: ${message}`);
}

export function validateAdminChatReplyInput(rawBody: unknown): AdminChatReplyInput {
  const body = rawBody && typeof rawBody === 'object' && !Array.isArray(rawBody)
    ? (rawBody as Record<string, unknown>)
    : {};
  const { sessionId, sender, text, replyToId, attachmentIds, isInternalNote } = body;
  if (!sessionId || !sender) {
    throw new AdminChatAccessError(400, 'invalid_input', 'sessionId and sender are required');
  }
  if (!isPermittedAdminChatReplySender(sender)) {
    throw new AdminChatAccessError(403, 'sender_not_allowed', 'Only admin replies can be posted to this endpoint.');
  }
  if (text !== undefined && text !== null && typeof text !== 'string') {
    throw invalidReply('text', 'must be a string.');
  }

  let parsedReplyToId: number | null = null;
  if (replyToId !== undefined && replyToId !== null && replyToId !== '') {
    if (!Number.isSafeInteger(replyToId) || (replyToId as number) <= 0) {
      throw invalidReply('replyToId', 'must be a positive integer.');
    }
    parsedReplyToId = replyToId as number;
  }

  let parsedAttachmentIds: number[] | undefined;
  if (attachmentIds !== undefined && attachmentIds !== null) {
    if (!Array.isArray(attachmentIds) || !attachmentIds.every((id) => Number.isSafeInteger(id) && id > 0)) {
      throw invalidReply('attachmentIds', 'must contain positive integer ids.');
    }
    parsedAttachmentIds = attachmentIds.length ? [...new Set(attachmentIds as number[])] : undefined;
  }

  return {
    sessionId: assertChatSessionIdShape(sessionId),
    sender: 'admin',
    text: (typeof text === 'string' && text) || 'Shared an attachment',
    isInternalNote: Boolean(isInternalNote),
    replyToId: parsedReplyToId,
    attachmentIds: parsedAttachmentIds,
  };
}

/** Admin replies may only quote / attach records from the same conversation (and therefore tenant). */
export async function assertAdminChatReferencesOwned(
  store: AdminChatStore,
  input: Pick<AdminChatReplyInput, 'sessionId' | 'replyToId' | 'attachmentIds'>,
): Promise<void> {
  if (input.replyToId !== null && (await store.countMessagesInSession(input.replyToId, input.sessionId)) === 0) {
    throw invalidReply('replyToId', 'reply target is not part of this chat.');
  }
  if (input.attachmentIds?.length) {
    const owned = await store.countAttachmentsInSession(input.attachmentIds, input.sessionId);
    if (owned !== input.attachmentIds.length) {
      throw invalidReply('attachmentIds', 'attachments are not part of this chat.');
    }
  }
}

export function createAdminChatRouteHandlers(deps: AdminChatRouteDeps): {
  listMessages: RequestHandler;
  listSessions: RequestHandler;
  sessionHistory: RequestHandler;
  reply: RequestHandler;
} {
  const { store } = deps;

  const fail = (res: Response, err: unknown, context: string, unavailableBody: Record<string, unknown>) => {
    if (err instanceof SourceResolutionError) {
      return res.status(400).json({ error: err.message, code: 'invalid_tenant_filter' });
    }
    if (err instanceof AdminChatAccessError) {
      return res.status(err.status).json({ error: err.message, code: err.code });
    }
    if (err instanceof PublicChatRequestError) {
      return res.status(err.status).json(err.toResponseBody());
    }
    if (deps.isDatabaseUnavailableError(err)) {
      deps.logUnavailable(context, err);
      return res.status(503).json(unavailableBody);
    }
    console.error(`[admin-chat] ${context}`, err instanceof Error ? err.message : err);
    return res.status(500).json({ error: 'Admin chat request failed' });
  };

  return {
    listMessages: async (req, res) => {
      try {
        res.json(await store.listMessages({ tenantId: requestedTenantFilter(req) }));
      } catch (err) {
        fail(res, err, 'Admin chat list unavailable', { error: 'Chat is temporarily unavailable', unavailable: true });
      }
    },

    listSessions: async (req, res) => {
      try {
        res.json(await store.listSessions({ tenantId: requestedTenantFilter(req) }));
      } catch (err) {
        fail(res, err, 'Admin session list unavailable', { error: 'Chat is temporarily unavailable', unavailable: true });
      }
    },

    sessionHistory: async (req, res) => {
      try {
        const session = await loadAuthorisedSession(store, req.params.sessionId, requestedTenantFilter(req));
        res.json(await store.listSessionMessages(session.id));
      } catch (err) {
        fail(res, err, 'Admin chat history unavailable', { error: 'Chat is temporarily unavailable', unavailable: true });
      }
    },

    reply: async (req, res) => {
      try {
        const input = validateAdminChatReplyInput(req.body);
        await loadAuthorisedSession(store, input.sessionId, requestedTenantFilter(req));
        await assertAdminChatReferencesOwned(store, input);
        const message = await store.createAdminMessage(input);
        if (!input.isInternalNote) await deps.markVisitorMessagesAnswered(input.sessionId);
        res.status(201).json(message);
      } catch (err) {
        fail(res, err, 'Chat message create unavailable', { error: 'Chat is temporarily unavailable', unavailable: true });
      }
    },
  };
}
