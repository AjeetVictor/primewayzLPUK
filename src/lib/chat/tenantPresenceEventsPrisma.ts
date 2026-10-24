import type { Prisma, PrismaClient } from '@prisma/client';
import {
  TENANT_PRESENCE_EVENT_MAX_PER_TENANT,
  TENANT_PRESENCE_EVENT_RETENTION_MS,
  buildPresenceEventDedupeKey,
  isTenantPresenceEventType,
  normalizeActorRef,
  normalizeCorrelationId,
  sanitizePresenceEventDetails,
  type AppendTenantPresenceEventInput,
  type TenantPresenceEventRecord,
  type TenantPresenceEventStore,
  type TenantPresenceEventType,
} from './tenantPresenceEvents.ts';

function toRecord(row: {
  id: number;
  tenantId: string;
  eventType: string;
  actorRef: string | null;
  actorUserId: number | null;
  correlationId: string | null;
  dedupeKey: string;
  details: Prisma.JsonValue;
  createdAt: Date;
}, duplicated = false): TenantPresenceEventRecord {
  if (!isTenantPresenceEventType(row.eventType)) {
    throw new Error('invalid_presence_event_type');
  }
  const details =
    row.details && typeof row.details === 'object' && !Array.isArray(row.details)
      ? (row.details as Record<string, unknown>)
      : {};
  return {
    id: row.id,
    tenantId: row.tenantId,
    eventType: row.eventType as TenantPresenceEventType,
    actorRef: row.actorRef,
    actorUserId: row.actorUserId,
    correlationId: row.correlationId,
    dedupeKey: row.dedupeKey,
    details,
    createdAt: row.createdAt,
    duplicated,
  };
}

function isUniqueViolation(err: unknown): boolean {
  return Boolean(
    err
    && typeof err === 'object'
    && 'code' in err
    && (err as { code?: string }).code === 'P2002',
  );
}

export function createPrismaTenantPresenceEventStore(prisma: PrismaClient): TenantPresenceEventStore {
  return {
    async append(input: AppendTenantPresenceEventInput) {
      if (!isTenantPresenceEventType(input.eventType)) {
        throw new Error('invalid_presence_event_type');
      }
      const at = input.at ?? new Date();
      const dedupeKey = buildPresenceEventDedupeKey({
        eventType: input.eventType,
        actorRef: input.actorRef,
        actorUserId: input.actorUserId,
        correlationId: input.correlationId,
        dedupeKey: input.dedupeKey,
        at,
      });
      const details = sanitizePresenceEventDetails(input.details) as Prisma.InputJsonValue;
      try {
        const row = await prisma.tenantPresenceEvent.create({
          data: {
            tenantId: input.tenantId,
            eventType: input.eventType,
            actorRef: normalizeActorRef(input.actorRef),
            actorUserId: input.actorUserId ?? null,
            correlationId: normalizeCorrelationId(input.correlationId),
            dedupeKey,
            details,
            createdAt: at,
          },
        });
        return toRecord(row, false);
      } catch (err) {
        if (!isUniqueViolation(err)) throw err;
        const existing = await prisma.tenantPresenceEvent.findUnique({
          where: {
            tenantId_eventType_dedupeKey: {
              tenantId: input.tenantId,
              eventType: input.eventType,
              dedupeKey,
            },
          },
        });
        if (!existing) throw err;
        return toRecord(existing, true);
      }
    },

    async list(filter) {
      const where: Prisma.TenantPresenceEventWhereInput = {};
      if (filter.tenantId) where.tenantId = filter.tenantId;
      if (filter.tenantIds) where.tenantId = { in: [...filter.tenantIds] };
      if (filter.beforeId != null) where.id = { lt: filter.beforeId };
      const rows = await prisma.tenantPresenceEvent.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: filter.limit,
      });
      return rows.map((row) => toRecord(row));
    },

    async prune(now = new Date()) {
      const cutoff = new Date(now.getTime() - TENANT_PRESENCE_EVENT_RETENTION_MS);
      const age = await prisma.tenantPresenceEvent.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });

      let deletedByCap = 0;
      const tenants = await prisma.tenantPresenceEvent.groupBy({
        by: ['tenantId'],
        _count: { _all: true },
        having: { tenantId: { _count: { gt: TENANT_PRESENCE_EVENT_MAX_PER_TENANT } } },
      });
      for (const group of tenants) {
        const overflow = group._count._all - TENANT_PRESENCE_EVENT_MAX_PER_TENANT;
        if (overflow <= 0) continue;
        const stale = await prisma.tenantPresenceEvent.findMany({
          where: { tenantId: group.tenantId },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          take: overflow,
          select: { id: true },
        });
        if (stale.length === 0) continue;
        const result = await prisma.tenantPresenceEvent.deleteMany({
          where: { id: { in: stale.map((row) => row.id) } },
        });
        deletedByCap += result.count;
      }
      return { deletedByAge: age.count, deletedByCap };
    },
  };
}
