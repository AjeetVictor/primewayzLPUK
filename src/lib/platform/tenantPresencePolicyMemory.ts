import type {
  TenantPresencePolicyAuditRecord,
  TenantPresencePolicyRecord,
  TenantPresencePolicyStore,
} from './tenantPresencePolicy.ts';

export function createMemoryTenantPresencePolicyStore(): TenantPresencePolicyStore {
  const records = new Map<string, TenantPresencePolicyRecord>();
  const audits: TenantPresencePolicyAuditRecord[] = [];
  let nextAuditId = 1;

  return {
    async find(tenantId) {
      return records.get(tenantId) ?? null;
    },
    async list(tenantIds) {
      const rows = [...records.values()];
      if (!tenantIds) return rows;
      const allowed = new Set(tenantIds);
      return rows.filter((row) => allowed.has(row.tenantId));
    },
    async recentAudits(tenantId, limit) {
      return audits
        .filter((entry) => entry.tenantId === tenantId)
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id - left.id)
        .slice(0, limit);
    },
    async set(input) {
      const existing = records.get(input.tenantId);
      const row: TenantPresencePolicyRecord = {
        tenantId: input.tenantId,
        policy: input.policy,
        reason: input.reason,
        updatedByUserId: input.actorUserId,
        createdAt: existing?.createdAt ?? input.at,
        updatedAt: input.at,
      };
      records.set(input.tenantId, row);
      audits.push({
        id: nextAuditId,
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        policy: input.policy,
        reason: input.reason,
        createdAt: input.at,
      });
      nextAuditId += 1;
      return row;
    },
  };
}
