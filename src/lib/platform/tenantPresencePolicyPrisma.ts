import type { PrismaClient } from '@prisma/client';
import {
  isTenantPresencePolicyMode,
  type TenantPresencePolicyAuditRecord,
  type TenantPresencePolicyMode,
  type TenantPresencePolicyRecord,
  type TenantPresencePolicyStore,
} from './tenantPresencePolicy.ts';

function asPolicy(value: string): TenantPresencePolicyMode {
  if (!isTenantPresencePolicyMode(value)) throw new Error('invalid_presence_policy');
  return value;
}

function toRecord(row: {
  tenantId: string;
  policy: string;
  reason: string;
  updatedByUserId: number | null;
  createdAt: Date;
  updatedAt: Date;
}): TenantPresencePolicyRecord {
  return { ...row, policy: asPolicy(row.policy) };
}

function toAudit(row: {
  id: number;
  tenantId: string;
  actorUserId: number | null;
  policy: string;
  reason: string;
  createdAt: Date;
}): TenantPresencePolicyAuditRecord {
  return { ...row, policy: asPolicy(row.policy) };
}

export function createPrismaTenantPresencePolicyStore(prisma: PrismaClient): TenantPresencePolicyStore {
  return {
    async find(tenantId) {
      const row = await prisma.tenantPresencePolicy.findUnique({ where: { tenantId } });
      return row ? toRecord(row) : null;
    },
    async list(tenantIds) {
      if (tenantIds && tenantIds.length === 0) return [];
      const rows = await prisma.tenantPresencePolicy.findMany({
        where: tenantIds ? { tenantId: { in: [...tenantIds] } } : undefined,
        orderBy: { tenantId: 'asc' },
      });
      return rows.map(toRecord);
    },
    async recentAudits(tenantId, limit) {
      const rows = await prisma.tenantPresencePolicyAudit.findMany({
        where: { tenantId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: limit,
      });
      return rows.map(toAudit);
    },
    async set(input) {
      return prisma.$transaction(async (tx) => {
        const row = await tx.tenantPresencePolicy.upsert({
          where: { tenantId: input.tenantId },
          create: {
            tenantId: input.tenantId,
            policy: input.policy,
            reason: input.reason,
            updatedByUserId: input.actorUserId,
          },
          update: {
            policy: input.policy,
            reason: input.reason,
            updatedByUserId: input.actorUserId,
          },
        });
        await tx.tenantPresencePolicyAudit.create({
          data: {
            tenantId: input.tenantId,
            actorUserId: input.actorUserId,
            policy: input.policy,
            reason: input.reason,
          },
        });
        return toRecord(row);
      });
    },
  };
}
