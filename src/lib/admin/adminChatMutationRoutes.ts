/**
 * Authenticated Admin chat mutations (mounted behind requireAdmin + requireRole in server.ts):
 * conversation status, admin message edit / soft delete, chat alert status and appointment
 * request updates.
 *
 * Every mutation resolves the owning ChatSession of the target record and checks it against
 * the Admin-selected tenant filter (assertAdminCanAccessChatSession) before writing, the same
 * rule the Admin read and reply routes use. Response bodies for permitted requests are
 * unchanged from the previous inline handlers.
 */

import type { Request, RequestHandler } from 'express';
import {
  AdminChatAccessError,
  assertAdminCanAccessChatSession,
  createAdminChatFailureResponder,
  requestedTenantFilter,
  type AdminChatSessionOwnership,
} from './adminChatRoutes.ts';
import { assertChatSessionIdShape } from '../chat/publicChatGuards.ts';
import {
  conversationStatusData,
  isValidConversationStatus,
  type ConversationStatusData,
} from '../chat/chatConversationService.ts';

export type AdminChatMessageForMutation = {
  id: number;
  sessionId: string;
  sender: string;
  deletedAt: Date | null;
};

export type AdminChatMutationStore = {
  findSessionOwnership(sessionId: string): Promise<AdminChatSessionOwnership | null>;
  setSessionStatus(sessionId: string, data: ConversationStatusData): Promise<unknown>;
  findMessage(id: number): Promise<AdminChatMessageForMutation | null>;
  editMessage(id: number, text: string): Promise<unknown>;
  softDeleteMessage(id: number, deletedBy: number | null): Promise<unknown>;
  findAlert(id: number): Promise<{ id: number; sessionId: string } | null>;
  updateAlertStatus(id: number, status: string): Promise<unknown>;
  findAppointment(id: number): Promise<{ id: number; sessionId: string } | null>;
  updateAppointment(id: number, data: { status?: string; adminNote?: string }): Promise<unknown>;
};

export type AdminChatMutationDeps = {
  store: AdminChatMutationStore;
  isDatabaseUnavailableError(err: unknown): boolean;
  logUnavailable(context: string, err: unknown): void;
};

type AdminMutationRequest = Request & { adminUser?: { id: number } };

function parseRecordId(value: unknown): number | null {
  const id = Number.parseInt(String(value), 10);
  return Number.isFinite(id) ? id : null;
}

const notFound = (message: string) => new AdminChatAccessError(404, 'not_found', message);

/**
 * Loads the session owning a record and applies the Admin tenant rule. A record whose
 * session no longer exists is reported as the record itself not being found.
 */
async function assertRecordSessionInScope(
  store: AdminChatMutationStore,
  sessionId: string,
  tenantFilter: string | undefined,
  missing: () => AdminChatAccessError,
): Promise<void> {
  const ownership = await store.findSessionOwnership(sessionId);
  if (!ownership) throw missing();
  assertAdminCanAccessChatSession(ownership, tenantFilter);
}

export function createAdminChatMutationHandlers(deps: AdminChatMutationDeps): {
  updateSessionStatus: RequestHandler;
  editMessage: RequestHandler;
  deleteMessage: RequestHandler;
  updateAlertStatus: RequestHandler;
  updateAppointment: RequestHandler;
} {
  const { store } = deps;
  const fail = createAdminChatFailureResponder(deps);
  const unavailable = { error: 'Chat is temporarily unavailable', unavailable: true };

  return {
    updateSessionStatus: async (req: AdminMutationRequest, res) => {
      try {
        const status = typeof req.body?.status === 'string' ? req.body.status : '';
        if (!isValidConversationStatus(status)) {
          return res.status(400).json({ error: 'Invalid conversation status' });
        }
        const tenantFilter = requestedTenantFilter(req);
        const sessionId = assertChatSessionIdShape(req.params.sessionId);
        assertAdminCanAccessChatSession(await store.findSessionOwnership(sessionId), tenantFilter);
        const session = await store.setSessionStatus(
          sessionId,
          conversationStatusData(status, { closedById: req.adminUser?.id ?? null }),
        );
        return res.json(session);
      } catch (err) {
        return fail(res, err, 'Chat status update unavailable', unavailable);
      }
    },

    editMessage: async (req, res) => {
      try {
        const id = parseRecordId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid message id' });
        const tenantFilter = requestedTenantFilter(req);
        const existing = await store.findMessage(id);
        if (!existing) return res.status(404).json({ error: 'Message not found' });
        await assertRecordSessionInScope(store, existing.sessionId, tenantFilter, () => notFound('Message not found'));
        if (existing.sender !== 'admin') {
          return res.status(400).json({ error: 'Only admin messages can be edited' });
        }
        if (existing.deletedAt) return res.status(400).json({ error: 'Deleted messages cannot be edited' });

        const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
        if (!text) return res.status(400).json({ error: 'Message text is required' });

        return res.json(await store.editMessage(id, text));
      } catch (err) {
        return fail(res, err, 'Chat message edit unavailable', unavailable);
      }
    },

    deleteMessage: async (req: AdminMutationRequest, res) => {
      try {
        const id = parseRecordId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid message id' });
        const tenantFilter = requestedTenantFilter(req);
        const existing = await store.findMessage(id);
        if (!existing) return res.status(404).json({ error: 'Message not found' });
        await assertRecordSessionInScope(store, existing.sessionId, tenantFilter, () => notFound('Message not found'));
        if (existing.sender !== 'admin') {
          return res.status(400).json({ error: 'Only admin messages can be deleted' });
        }

        return res.json(await store.softDeleteMessage(id, req.adminUser?.id ?? null));
      } catch (err) {
        return fail(res, err, 'Chat message delete unavailable', unavailable);
      }
    },

    updateAlertStatus: async (req, res) => {
      try {
        const id = parseRecordId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid alert id' });
        const tenantFilter = requestedTenantFilter(req);
        const alert = await store.findAlert(id);
        if (!alert) return res.status(404).json({ error: 'Alert not found' });
        await assertRecordSessionInScope(store, alert.sessionId, tenantFilter, () => notFound('Alert not found'));

        const status = typeof req.body?.status === 'string' ? req.body.status : 'reviewed';
        return res.json(await store.updateAlertStatus(id, status));
      } catch (err) {
        return fail(res, err, 'Chat alert update unavailable', unavailable);
      }
    },

    updateAppointment: async (req, res) => {
      try {
        const id = parseRecordId(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid appointment id' });
        const tenantFilter = requestedTenantFilter(req);
        const appointment = await store.findAppointment(id);
        if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
        await assertRecordSessionInScope(store, appointment.sessionId, tenantFilter, () => notFound('Appointment not found'));

        return res.json(await store.updateAppointment(id, {
          status: typeof req.body?.status === 'string' ? req.body.status : undefined,
          adminNote: typeof req.body?.adminNote === 'string' ? req.body.adminNote : undefined,
        }));
      } catch (err) {
        return fail(res, err, 'Chat appointment update unavailable', unavailable);
      }
    },
  };
}
