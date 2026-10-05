/**
 * Prisma implementation of the read-only OperationalChatStore.
 * Only findMany / findFirst / findUnique / count / groupBy / SELECT 1 are used.
 */

import type { PrismaClient } from '@prisma/client';
import {
  ATTENTION_EXCLUDED_STATUSES,
  UNANSWERED_VISITOR_MESSAGE_WHERE,
} from '../chat/chatOperationalSemantics.ts';
import { readTenantChatPresence } from '../chat/tenantChatPresenceStore.ts';
import type { OperationalChatStore, OperationalMessageRow } from './operationalChatService.ts';

const sessionSelect = {
  id: true,
  tenantId: true,
  name: true,
  status: true,
  serviceInterest: true,
  firstLandingPage: true,
  currentPageUrl: true,
  visitorLastSeenAt: true,
  createdAt: true,
} as const;

/** Allow-list: never select referrer, UTM, source authority or any raw client context. */
const visitorProfileSelect = {
  id: true,
  tenantId: true,
  name: true,
  email: true,
  phone: true,
  visitorId: true,
  visitorLastSeenAt: true,
  visitStartedAt: true,
  firstLandingPage: true,
  currentPageUrl: true,
  deviceType: true,
  browser: true,
  operatingSystem: true,
  country: true,
  region: true,
  city: true,
  createdAt: true,
} as const;

const messageSelect = {
  id: true,
  sessionId: true,
  sender: true,
  text: true,
  timestamp: true,
  editedAt: true,
  deletedAt: true,
  replyToId: true,
  replyTo: { select: { isInternalNote: true } },
} as const;

type SelectedMessage = {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  timestamp: Date;
  editedAt: Date | null;
  deletedAt: Date | null;
  replyToId: number | null;
  replyTo: { isInternalNote: boolean } | null;
};

function toMessageRow(message: SelectedMessage): OperationalMessageRow {
  return {
    id: message.id,
    sessionId: message.sessionId,
    sender: message.sender,
    text: message.text,
    timestamp: message.timestamp,
    editedAt: message.editedAt,
    deletedAt: message.deletedAt,
    replyToId: message.replyToId,
    replyToIsInternalNote: Boolean(message.replyTo?.isInternalNote),
  };
}

export function createPrismaOperationalChatStore(prisma: PrismaClient): OperationalChatStore {
  return {
    async checkDatabase() {
      await prisma.$queryRaw`SELECT 1`;
    },

    async readTeamPresence(tenantId) {
      const { setting, latestAdminSeenAt } = await readTenantChatPresence(prisma, tenantId);
      return { mode: setting?.mode ?? null, latestAdminSeenAt };
    },

    async listRecentActivity({ tenantId, limit }) {
      const rows = await prisma.chatMessage.groupBy({
        by: ['sessionId'],
        where: { isInternalNote: false, session: { tenantId } },
        _max: { timestamp: true },
        orderBy: { _max: { timestamp: 'desc' } },
        take: limit,
      });
      return rows
        .filter((row) => row._max.timestamp)
        .map((row) => ({ sessionId: row.sessionId, lastActivityAt: row._max.timestamp as Date }));
    },

    findSessions: ({ tenantId, sessionIds }) =>
      prisma.chatSession.findMany({ where: { id: { in: sessionIds }, tenantId }, select: sessionSelect }),

    findSessionOwnership: (sessionId) =>
      prisma.chatSession.findUnique({ where: { id: sessionId }, select: { id: true, tenantId: true } }),

    findSession: ({ tenantId, sessionId }) =>
      prisma.chatSession.findFirst({ where: { id: sessionId, tenantId }, select: sessionSelect }),

    async listLatestVisibleMessages({ tenantId, activity }) {
      if (activity.length === 0) return [];
      const rows = await prisma.chatMessage.findMany({
        where: {
          isInternalNote: false,
          session: { tenantId },
          OR: activity.map((entry) => ({ sessionId: entry.sessionId, timestamp: entry.lastActivityAt })),
        },
        orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
        select: messageSelect,
      });
      return rows.map(toMessageRow);
    },

    async countUnansweredVisitorMessages({ tenantId, sessionIds }) {
      if (sessionIds.length === 0) return new Map();
      const rows = await prisma.chatMessage.groupBy({
        by: ['sessionId'],
        where: { ...UNANSWERED_VISITOR_MESSAGE_WHERE, sessionId: { in: sessionIds }, session: { tenantId } },
        _count: { _all: true },
      });
      return new Map(rows.map((row) => [row.sessionId, row._count._all]));
    },

    async countVisibleMessages({ tenantId, sessionIds }) {
      if (sessionIds.length === 0) return new Map();
      const rows = await prisma.chatMessage.groupBy({
        by: ['sessionId'],
        where: { isInternalNote: false, sessionId: { in: sessionIds }, session: { tenantId } },
        _count: { _all: true },
      });
      return new Map(rows.map((row) => [row.sessionId, row._count._all]));
    },

    countSessionsNeedingAttention: (tenantId) =>
      prisma.chatSession.count({
        where: {
          tenantId,
          status: { notIn: [...ATTENTION_EXCLUDED_STATUSES] },
          messages: { some: { ...UNANSWERED_VISITOR_MESSAGE_WHERE } },
        },
      }),

    async listLatestTranscript({ tenantId, sessionId, take }) {
      const rows = await prisma.chatMessage.findMany({
        where: { sessionId, isInternalNote: false, session: { tenantId } },
        orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
        take,
        select: messageSelect,
      });
      return rows.map(toMessageRow);
    },

    findVisitorProfile: ({ tenantId, sessionId }) =>
      prisma.chatSession.findFirst({ where: { id: sessionId, tenantId }, select: visitorProfileSelect }),

    async hasEarlierVisitorSession({ tenantId, visitorId, sessionId, createdBefore }) {
      const earlier = await prisma.chatSession.findFirst({
        where: { tenantId, visitorId, id: { not: sessionId }, createdAt: { lt: createdBefore } },
        select: { id: true },
      });
      return earlier !== null;
    },
  };
}
