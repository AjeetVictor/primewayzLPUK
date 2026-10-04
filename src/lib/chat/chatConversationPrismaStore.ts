/**
 * Prisma implementation of ChatConversationStore. The only ChatSession write is the
 * conditional status updateMany; tenant / source attribution columns are never written.
 */

import type { Prisma, PrismaClient } from '@prisma/client';
import type {
  ChatConversationSessionRow,
  ChatConversationStore,
  ChatConversationTx,
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
  });

  return {
    ...methods(prisma, false),
    transaction: (fn) => prisma.$transaction((tx) => fn(methods(tx, true))),
  };
}
