/**
 * Prisma implementation of ChatConversationStore.
 * Status, archive and purge writes are conditional on the session id and tenant.
 * Tenant / source attribution columns are never written. Purge deletes message and
 * attachment rows and does not copy their text into ChatLifecycleAudit.
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  ChatConversationSessionRow,
  ChatConversationStore,
  ChatConversationTx,
  ChatLifecycleSessionRow,
  ChatPurgeSnapshot,
  ChatStoredMessage,
} from './chatConversationService.ts';

const sessionSelect = { id: true, tenantId: true, status: true } as const;

const storedMessageSelect = {
  id: true,
  sessionId: true,
  sender: true,
  text: true,
  timestamp: true,
  editedAt: true,
  deletedAt: true,
  replyToId: true,
} as const;

export function createPrismaChatConversationStore(
  prisma: PrismaClient,
  options: { messageInclude?: Prisma.ChatMessageInclude } = {},
): ChatConversationStore {
  const methods = (db: Prisma.TransactionClient, lockingReads: boolean): ChatConversationTx => ({
    async findSession(sessionId) {
      if (lockingReads) {
        const rows = await db.$queryRaw<ChatConversationSessionRow[]>`
          SELECT id, tenantId, status FROM \`ChatSession\` WHERE id = ${sessionId} FOR UPDATE`;
        return rows[0] ?? null;
      }
      return db.chatSession.findUnique({ where: { id: sessionId }, select: sessionSelect });
    },

    async updateSessionStatus({ sessionId, tenantId, statusIn, statusNotIn, data }) {
      const status = statusIn ? { in: [...statusIn] } : statusNotIn ? { notIn: [...statusNotIn] } : undefined;
      const result = await db.chatSession.updateMany({
        where: {
          id: sessionId,
          ...(tenantId !== undefined ? { tenantId } : {}),
          ...(status ? { status } : {}),
        },
        data,
      });
      return result.count;
    },

    async createTeamMessage(input) {
      const message = await db.chatMessage.create({
        data: {
          sessionId: input.sessionId,
          sender: 'admin',
          text: input.text,
          answered: true,
          isInternalNote: input.isInternalNote,
          replyToId: input.replyToId,
          attachments: input.attachmentIds?.length
            ? { connect: input.attachmentIds.map((id) => ({ id })) }
            : undefined,
        },
        include: options.messageInclude,
      });
      return message as ChatStoredMessage;
    },

    async markVisitorMessagesAnswered(sessionId) {
      const result = await db.chatMessage.updateMany({
        where: { sessionId, sender: 'user', answered: false },
        data: { answered: true },
      });
      return result.count;
    },

    findMessage: (id) => db.chatMessage.findUnique({ where: { id }, select: storedMessageSelect }),

    findOperatorAction: ({ integrationId, clientActionId }) =>
      db.chatOperatorAction.findUnique({ where: { integrationId_clientActionId: { integrationId, clientActionId } } }),

    createOperatorAction: (data) => db.chatOperatorAction.create({ data, select: { id: true } }),

    async updateOperatorAction(id, data) {
      await db.chatOperatorAction.update({ where: { id }, data });
    },

    async findLifecycleSession(sessionId): Promise<ChatLifecycleSessionRow | null> {
      if (lockingReads) {
        const rows = await db.$queryRaw<ChatLifecycleSessionRow[]>`
          SELECT id, tenantId, status, archivedAt, purgedAt, name, email, phone
          FROM \`ChatSession\` WHERE id = ${sessionId} FOR UPDATE`;
        const row = rows[0];
        return row
          ? {
            ...row,
            archivedAt: row.archivedAt ? new Date(row.archivedAt) : null,
            purgedAt: row.purgedAt ? new Date(row.purgedAt) : null,
          }
          : null;
      }
      return db.chatSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          tenantId: true,
          status: true,
          archivedAt: true,
          purgedAt: true,
          name: true,
          email: true,
          phone: true,
        },
      });
    },

    async setSessionArchived({ sessionId, tenantId, archivedAt, archivedById }) {
      const result = await db.chatSession.updateMany({
        where: {
          id: sessionId,
          tenantId,
          purgedAt: null,
          archivedAt: archivedAt ? null : { not: null },
        },
        data: { archivedAt, archivedById },
      });
      return result.count;
    },

    async purgeSessionContent({ sessionId, tenantId, purgedAt }): Promise<ChatPurgeSnapshot | null> {
      const session = await db.chatSession.findFirst({
        where: { id: sessionId, tenantId, purgedAt: null },
        select: { id: true, name: true, email: true, phone: true },
      });
      if (!session) return null;
      const [attachments, messageCount, appointments] = await Promise.all([
        db.chatAttachment.findMany({ where: { sessionId }, select: { url: true } }),
        db.chatMessage.count({ where: { sessionId } }),
        db.chatAppointmentRequest.findMany({
          where: { sessionId },
          select: { name: true, email: true, phone: true },
        }),
      ]);
      const leadRetained = Boolean(
        session.name || session.email || session.phone
        || appointments.some((row) => row.name || row.email || row.phone),
      );
      await db.chatAttachment.deleteMany({ where: { sessionId } });
      await db.chatMessage.updateMany({ where: { sessionId, replyToId: { not: null } }, data: { replyToId: null } });
      await db.chatMessage.deleteMany({ where: { sessionId } });
      await db.chatAppointmentRequest.updateMany({ where: { sessionId }, data: { message: null } });
      const stamped = await db.chatSession.updateMany({
        where: { id: sessionId, tenantId, purgedAt: null },
        data: { purgedAt, archivedAt: null, archivedById: null },
      });
      if (stamped.count === 0) return null;
      return {
        messageCount,
        attachmentCount: attachments.length,
        appointmentCount: appointments.length,
        leadRetained,
        attachmentUrls: attachments.map((row) => row.url),
      };
    },

    async recordLifecycleAudit(input) {
      await db.chatLifecycleAudit.create({ data: input });
    },
  });

  return {
    ...methods(prisma, false),
    transaction: (fn) => prisma.$transaction((tx) => fn(methods(tx, true))),
  };
}
