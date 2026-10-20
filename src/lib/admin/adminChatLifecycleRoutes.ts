/**
 * Authenticated archive, restore and permanent deletion for one chat session.
 * The tenant comes from the stored session and the admin filter, never from the body.
 * Permanent deletion is limited to platform owners and admin roles.
 */

import type { Request, RequestHandler, Response } from 'express';
import { AdminTenantAccessError, type AdminTenantPrincipal } from './adminTenantAccess.ts';
import {
  AdminChatAccessError,
  assertAdminCanAccessChatSession,
  assertOperationalChatWriteAllowed,
  createAdminChatFailureResponder,
  requestedTenantFilter,
  type OperationalChatAccessResolver,
} from './adminChatRoutes.ts';
import { assertChatSessionIdShape } from '../chat/publicChatGuards.ts';
import {
  archiveConversation,
  ChatConversationConflictError,
  ChatLifecycleNotFoundError,
  purgeConversation,
  restoreConversation,
  type ChatConversationStore,
  type PurgeConversationResult,
  type StatusTransitionResult,
} from '../chat/chatConversationService.ts';

export function adminMayPurgeChat(principal: { role: string; isPlatformOwner?: boolean }): boolean {
  return Boolean(principal.isPlatformOwner) || principal.role === 'admin' || principal.role === 'super_admin';
}

export type AdminChatLifecycleDeps = {
  conversations: ChatConversationStore;
  isDatabaseUnavailableError(err: unknown): boolean;
  logUnavailable(context: string, err: unknown): void;
  resolveChatAccess: OperationalChatAccessResolver;
  removeUploads?: (urls: readonly string[]) => Promise<number>;
};

type AdminRequest = Request & { adminUser?: AdminTenantPrincipal };

function principalFor(req: Request): AdminTenantPrincipal {
  const principal = (req as AdminRequest).adminUser;
  if (!principal) {
    throw new AdminTenantAccessError(401, 'admin_access_required', 'Authenticated admin access is required.');
  }
  return principal;
}

export function createAdminChatLifecycleHandlers(deps: AdminChatLifecycleDeps): {
  archive: RequestHandler;
  restore: RequestHandler;
  purge: RequestHandler;
} {
  const fail = createAdminChatFailureResponder(deps);
  const unavailable = { error: 'Chat is temporarily unavailable', unavailable: true };

  const run = (action: 'archive' | 'restore' | 'delete') => async (req: AdminRequest, res: Response) => {
    try {
      const principal = principalFor(req);
      if (action === 'delete' && !adminMayPurgeChat(principal)) {
        throw new AdminChatAccessError(403, 'chat_purge_forbidden', 'You do not have permission to delete this conversation.');
      }
      const tenantFilter = requestedTenantFilter(req);
      const sessionId = assertChatSessionIdShape(req.params.sessionId);
      const owned = assertAdminCanAccessChatSession(
        await deps.conversations.findSession(sessionId),
        tenantFilter,
        principal,
      );
      await assertOperationalChatWriteAllowed(owned.tenantId, deps.resolveChatAccess);
      const actorId = String(principal.id);
      const runLifecycle = async <T>(
        fn: (tx: Parameters<Parameters<ChatConversationStore['transaction']>[0]>[0]) => Promise<T>,
      ) => deps.conversations.transaction(fn);

      if (action === 'delete') {
        const purged: PurgeConversationResult = await runLifecycle(async (tx) => {
          const session = await tx.findSession(sessionId);
          if (!session || session.tenantId !== owned.tenantId) throw new ChatLifecycleNotFoundError();
          return purgeConversation(tx, { session, actorKind: 'admin', actorId });
        });
        if (deps.removeUploads) {
          try {
            await deps.removeUploads(purged.snapshot.attachmentUrls);
          } catch (err) {
            deps.logUnavailable('chat purge upload cleanup', err);
          }
        }
        return res.json({
          ok: true,
          action,
          changed: purged.changed,
          sessionId,
          leadRetained: purged.snapshot.leadRetained,
          messageCount: purged.snapshot.messageCount,
          attachmentCount: purged.snapshot.attachmentCount,
        });
      }

      const outcome: StatusTransitionResult = await runLifecycle(async (tx) => {
        const session = await tx.findSession(sessionId);
        if (!session || session.tenantId !== owned.tenantId) throw new ChatLifecycleNotFoundError();
        if (action === 'archive') {
          return archiveConversation(tx, {
            session,
            actorKind: 'admin',
            actorId,
            archivedById: principal.id,
          });
        }
        return restoreConversation(tx, { session, actorKind: 'admin', actorId });
      });
      return res.json({ ok: true, action, changed: outcome.changed, sessionId, status: outcome.toStatus });
    } catch (err) {
      if (err instanceof ChatLifecycleNotFoundError) {
        return fail(res, new AdminChatAccessError(404, 'chat_session_not_found', 'Chat session not found.'), 'Chat lifecycle unavailable', unavailable);
      }
      if (err instanceof ChatConversationConflictError) {
        return res.status(409).json({ error: err.message, code: err.code });
      }
      return fail(res, err, 'Chat lifecycle unavailable', unavailable);
    }
  };

  return {
    archive: run('archive'),
    restore: run('restore'),
    purge: run('delete'),
  };
}
