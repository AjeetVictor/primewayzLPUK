/**
 * Test-only in-memory ChatConversationStore. Transactions are serialised (like row locks)
 * and roll back every write on throw, so tests can assert "no partial state".
 */

import type {
  ChatConversationStore,
  ChatConversationTx,
  ChatLifecycleAuditWrite,
  ChatOperatorActionRecord,
  ChatPurgeSnapshot,
  ChatStoredMessage,
} from '../chatConversationService.ts';

export type MemorySessionRow = {
  id: string;
  tenantId: string | null;
  status: string;
  closedAt?: Date | null;
  closedById?: number | null;
  archivedAt?: Date | null;
  archivedById?: number | null;
  purgedAt?: Date | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type MemoryAttachmentRow = { id: number; sessionId: string; url: string };
export type MemoryAppointmentRow = {
  id: number;
  sessionId: string;
  message: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
};

export type MemoryMessageRow = {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  answered: boolean;
  isInternalNote: boolean;
  deletedAt: Date | null;
  editedAt: Date | null;
  replyToId: number | null;
  timestamp: Date;
};

export type MemoryChatState = {
  sessions: MemorySessionRow[];
  messages: MemoryMessageRow[];
  operatorActions: ChatOperatorActionRecord[];
  attachments?: MemoryAttachmentRow[];
  appointments?: MemoryAppointmentRow[];
  lifecycleAudits?: ChatLifecycleAuditWrite[];
};

type TxMethod = keyof ChatConversationTx;

/** Applies a change as if another transaction had committed it: it survives a rollback. */
export type ExternalCommit = (mutate: (state: MemoryChatState) => void) => void;

export type MemoryChatStoreHooks = {
  now?: () => Date;
  /** Called before every tx method; throw to simulate an outage or a mid-transaction failure. */
  before?: (method: TxMethod, args: unknown[], external: ExternalCommit) => void | Promise<void>;
};

const uniqueViolation = () => Object.assign(new Error('Unique constraint failed on ChatOperatorAction'), { code: 'P2002' });

function restore<T>(target: T[], source: T[]): void {
  target.splice(0, target.length, ...source);
}

export function createMemoryChatConversationStore(state: MemoryChatState, hooks: MemoryChatStoreHooks = {}): ChatConversationStore {
  const now = hooks.now ?? (() => new Date());
  let actionSeq = 0;
  let queue: Promise<unknown> = Promise.resolve();
  let activeSnapshot: MemoryChatState | null = null;
  const external: ExternalCommit = (mutate) => {
    mutate(state);
    if (activeSnapshot) mutate(activeSnapshot);
  };

  const toStored = (row: MemoryMessageRow): ChatStoredMessage => ({
    id: row.id,
    sessionId: row.sessionId,
    sender: row.sender,
    text: row.text,
    timestamp: row.timestamp,
    editedAt: row.editedAt,
    deletedAt: row.deletedAt,
    replyToId: row.replyToId,
  });

  const raw: ChatConversationTx = {
    async findSession(sessionId) {
      const session = state.sessions.find((row) => row.id === sessionId);
      return session ? { id: session.id, tenantId: session.tenantId, status: session.status } : null;
    },
    async updateSessionStatus({ sessionId, tenantId, statusIn, statusNotIn, data }) {
      const session = state.sessions.find((row) => row.id === sessionId);
      if (!session) return 0;
      if (tenantId !== undefined && session.tenantId !== tenantId) return 0;
      if (statusIn && !statusIn.includes(session.status)) return 0;
      if (statusNotIn && statusNotIn.includes(session.status)) return 0;
      Object.assign(session, data);
      return 1;
    },
    async createTeamMessage(input) {
      const row: MemoryMessageRow = {
        id: Math.max(0, ...state.messages.map((message) => message.id)) + 1,
        sessionId: input.sessionId,
        sender: 'admin',
        text: input.text,
        answered: true,
        isInternalNote: input.isInternalNote,
        deletedAt: null,
        editedAt: null,
        replyToId: input.replyToId,
        timestamp: now(),
      };
      state.messages.push(row);
      return toStored(row);
    },
    async markVisitorMessagesAnswered(sessionId) {
      let count = 0;
      for (const message of state.messages) {
        if (message.sessionId === sessionId && message.sender === 'user' && !message.answered) {
          message.answered = true;
          count += 1;
        }
      }
      return count;
    },
    async findMessage(id) {
      const row = state.messages.find((message) => message.id === id);
      return row ? toStored(row) : null;
    },
    async findOperatorAction({ integrationId, clientActionId }) {
      return state.operatorActions.find((row) => row.integrationId === integrationId && row.clientActionId === clientActionId) ?? null;
    },
    async createOperatorAction(data) {
      if (state.operatorActions.some((row) => row.integrationId === data.integrationId && row.clientActionId === data.clientActionId)) {
        throw uniqueViolation();
      }
      actionSeq += 1;
      const record: ChatOperatorActionRecord = { ...data, id: `action-${actionSeq}`, createdAt: now() };
      state.operatorActions.push(record);
      return { id: record.id };
    },
    async updateOperatorAction(id, data) {
      const record = state.operatorActions.find((row) => row.id === id);
      if (!record) throw new Error('operator action not found');
      Object.assign(record, data);
    },
    async findLifecycleSession(sessionId) {
      const session = state.sessions.find((row) => row.id === sessionId);
      if (!session) return null;
      return {
        id: session.id,
        tenantId: session.tenantId,
        status: session.status,
        archivedAt: session.archivedAt ?? null,
        purgedAt: session.purgedAt ?? null,
        name: session.name ?? null,
        email: session.email ?? null,
        phone: session.phone ?? null,
      };
    },
    async setSessionArchived({ sessionId, tenantId, archivedAt, archivedById }) {
      const session = state.sessions.find((row) => row.id === sessionId);
      if (!session || session.tenantId !== tenantId || session.purgedAt) return 0;
      const currentlyArchived = Boolean(session.archivedAt);
      if (Boolean(archivedAt) === currentlyArchived) return 0;
      session.archivedAt = archivedAt;
      session.archivedById = archivedById;
      return 1;
    },
    async purgeSessionContent({ sessionId, tenantId, purgedAt }): Promise<ChatPurgeSnapshot | null> {
      const session = state.sessions.find((row) => row.id === sessionId);
      if (!session || session.tenantId !== tenantId || session.purgedAt) return null;
      const messages = state.messages.filter((row) => row.sessionId === sessionId);
      const attachments = (state.attachments ?? []).filter((row) => row.sessionId === sessionId);
      const appointments = (state.appointments ?? []).filter((row) => row.sessionId === sessionId);
      const leadRetained = Boolean(
        session.name || session.email || session.phone
        || appointments.some((row) => row.name || row.email || row.phone),
      );
      for (let index = state.messages.length - 1; index >= 0; index -= 1) {
        if (state.messages[index]?.sessionId === sessionId) state.messages.splice(index, 1);
      }
      if (state.attachments) {
        for (let index = state.attachments.length - 1; index >= 0; index -= 1) {
          if (state.attachments[index]?.sessionId === sessionId) state.attachments.splice(index, 1);
        }
      }
      for (const appointment of appointments) appointment.message = null;
      session.purgedAt = purgedAt;
      session.archivedAt = null;
      session.archivedById = null;
      return {
        messageCount: messages.length,
        attachmentCount: attachments.length,
        appointmentCount: appointments.length,
        leadRetained,
        attachmentUrls: attachments.map((row) => row.url),
      };
    },
    async recordLifecycleAudit(input) {
      state.lifecycleAudits ??= [];
      state.lifecycleAudits.push({ ...input });
    },
  };

  const tx = Object.fromEntries(
    (Object.keys(raw) as TxMethod[]).map((method) => [
      method,
      async (...args: unknown[]) => {
        await hooks.before?.(method, args, external);
        return (raw[method] as (...a: unknown[]) => Promise<unknown>)(...args);
      },
    ]),
  ) as ChatConversationTx;

  return {
    ...tx,
    transaction<T>(fn: (inner: ChatConversationTx) => Promise<T>): Promise<T> {
      const run = queue.then(async () => {
        const saved = structuredClone(state);
        activeSnapshot = saved;
        try {
          return await fn(tx);
        } catch (err) {
          restore(state.sessions, saved.sessions);
          restore(state.messages, saved.messages);
          restore(state.operatorActions, saved.operatorActions);
          if (saved.attachments) {
            state.attachments ??= [];
            restore(state.attachments, saved.attachments);
          } else {
            delete state.attachments;
          }
          if (saved.appointments) {
            state.appointments ??= [];
            restore(state.appointments, saved.appointments);
          } else {
            delete state.appointments;
          }
          if (saved.lifecycleAudits) {
            state.lifecycleAudits ??= [];
            restore(state.lifecycleAudits, saved.lifecycleAudits);
          } else {
            delete state.lifecycleAudits;
          }
          throw err;
        } finally {
          activeSnapshot = null;
        }
      });
      queue = run.catch(() => undefined);
      return run;
    },
  };
}
