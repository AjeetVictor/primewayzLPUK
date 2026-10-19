import type { PrismaClient } from '@prisma/client';
import {
  isTenantChatEntitlementStatus,
  type TenantChatEntitlementAuditRecord,
  type TenantChatEntitlementRecord,
  type TenantChatEntitlementStatus,
  type TenantChatEntitlementStore,
} from './tenantChatEntitlement.ts';

function asStatus(value: string): TenantChatEntitlementStatus {
  if (!isTenantChatEntitlementStatus(value)) throw new Error('invalid_entitlement_status');
  return value;
}

function toRecord(row: {
  tenantId: string;
  status: string;
  reason: string;
  updatedByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
}): TenantChatEntitlementRecord {
  return { ...row, status: asStatus(row.status) };
}

function toAudit(row: {
  id: number;
  tenantId: string;
  actorUserId: number | null;
  status: string;
  reason: string;
  createdAt: Date;
}): TenantChatEntitlementAuditRecord {
  return { ...row, status: asStatus(row.status) };
}

export function createPrismaTenantChatEntitlementStore(prisma: PrismaClient): TenantChatEntitlementStore {
  return {
    async find(tenantId) {
      const row = await prisma.tenantChatEntitlement.findUnique({ where: { tenantId } });
      return row ? toRecord(row) : null;
    },
    async list(tenantIds) {
      if (tenantIds && tenantIds.length === 0) return [];
      const rows = await prisma.tenantChatEntitlement.findMany({
        where: tenantIds ? { tenantId: { in: [...tenantIds] } } : undefined,
        orderBy: { tenantId: 'asc' },
      });
      return rows.map(toRecord);
    },
    async recentAudits(tenantId, limit) {
      const rows = await prisma.tenantChatEntitlementAudit.findMany({
        where: { tenantId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
      });
      return rows.map(toAudit);
    },
    async set(input) {
      return prisma.$transaction(async (tx) => {
        const row = await tx.tenantChatEntitlement.upsert({
          where: { tenantId: input.tenantId },
          create: {
            tenantId: input.tenantId,
            status: input.status,
            reason: input.reason,
            updatedByUserId: input.actorUserId,
          },
          update: {
            status: input.status,
            reason: input.reason,
            updatedByUserId: input.actorUserId,
          },
        });
        await tx.tenantChatEntitlementAudit.create({
          data: {
            tenantId: input.tenantId,
            actorUserId: input.actorUserId,
            status: input.status,
            reason: input.reason,
          },
        });
        return toRecord(row);
      });
    },
  };
}
