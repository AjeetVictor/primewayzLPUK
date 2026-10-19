import { Prisma, type PrismaClient } from '@prisma/client';
import {
  accountChatGate,
  isTenantLifecycle,
  parseCapabilityMap,
  type OriginVerificationMethod,
  type OriginVerificationStatus,
  type SiteInstallationLink,
  type TenantAccountRecord,
  type TenantAuditRecord,
  type TenantOriginRecord,
  type TenantSiteRecord,
  type TenantSiteStatus,
  type TenantSiteTechnology,
} from './tenantAccountModel.ts';
import type { TenantAccountStore } from './tenantAccountStore.ts';

function isMissingTable(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') return true;
  const message = err instanceof Error ? err.message : '';
  return /does not exist|doesn't exist/i.test(message);
}

function asCapabilities(value: unknown) {
  const parsed = parseCapabilityMap(value);
  if (!parsed) throw new Error('invalid_capabilities');
  return parsed;
}

function asAccount(row: {
  tenantId: string;
  displayName: string;
  brand: string;
  market: string;
  organizationName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  lifecycleStatus: string;
  capabilities: Prisma.JsonValue;
  sourceKind: string;
  explicitEntitlement: boolean;
  createdAt: Date;
  activatedAt: Date | null;
  suspendedAt: Date | null;
  archivedAt: Date | null;
  updatedAt: Date;
}): TenantAccountRecord {
  if (!isTenantLifecycle(row.lifecycleStatus)) throw new Error('invalid_lifecycle');
  if (row.sourceKind !== 'database' && row.sourceKind !== 'commercial_record') throw new Error('invalid_source');
  return {
    ...row,
    lifecycleStatus: row.lifecycleStatus,
    capabilities: asCapabilities(row.capabilities),
    sourceKind: row.sourceKind,
  };
}

export function createPrismaTenantAccountStore(prisma: PrismaClient): TenantAccountStore {
  return {
    async listAccounts() {
      try {
        const rows = await prisma.platformTenantAccount.findMany();
        return { availability: 'ready', accounts: rows.map(asAccount) };
      } catch (err) {
        if (isMissingTable(err)) return { availability: 'legacy', accounts: [] };
        return { availability: 'unavailable', accounts: [] };
      }
    },
    async findAccount(tenantId) {
      const row = await prisma.platformTenantAccount.findUnique({ where: { tenantId } });
      return row ? asAccount(row) : null;
    },
    async gate(tenantId) {
      try {
        const row = await prisma.platformTenantAccount.findUnique({ where: { tenantId } });
        return accountChatGate(row ? asAccount(row) : null);
      } catch (err) {
        if (isMissingTable(err)) return { availability: 'legacy' };
        throw err;
      }
    },
    async insertAccount(record) {
      await prisma.platformTenantAccount.create({ data: { ...record, capabilities: record.capabilities } });
    },
    async updateAccount(tenantId, patch) {
      const row = await prisma.platformTenantAccount.update({
        where: { tenantId },
        data: { ...patch, capabilities: patch.capabilities },
      });
      return asAccount(row);
    },
    async listSites(tenantId) {
      const rows = await prisma.platformTenantSite.findMany({ where: tenantId ? { tenantId } : undefined });
      return rows.map(asSite);
    },
    async findSite(id) {
      const row = await prisma.platformTenantSite.findUnique({ where: { id } });
      return row ? asSite(row) : null;
    },
    async insertSite(record) {
      await prisma.platformTenantSite.create({ data: record });
    },
    async updateSite(id, patch) {
      return asSite(await prisma.platformTenantSite.update({ where: { id }, data: patch }));
    },
    async listOrigins(filter) {
      const rows = await prisma.platformTenantOrigin.findMany({
        where: { tenantId: filter?.tenantId, siteId: filter?.siteId },
      });
      return rows.map(asOrigin);
    },
    async findOriginById(id) {
      const row = await prisma.platformTenantOrigin.findUnique({ where: { id } });
      return row ? asOrigin(row) : null;
    },
    async findOriginByValue(origin) {
      const row = await prisma.platformTenantOrigin.findUnique({ where: { origin } });
      return row ? asOrigin(row) : null;
    },
    async insertOrigin(record) {
      await prisma.platformTenantOrigin.create({ data: record });
    },
    async updateOrigin(id, patch) {
      return asOrigin(await prisma.platformTenantOrigin.update({ where: { id }, data: patch }));
    },
    async listAudits(filter) {
      const rows = await prisma.platformTenantAudit.findMany({
        where: filter.tenantId ? { tenantId: filter.tenantId } : undefined,
        orderBy: { createdAt: 'desc' },
        take: filter.limit,
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        actorUserId: row.actorUserId,
        action: row.action,
        details: asDetails(row.details),
        createdAt: row.createdAt,
      }));
    },
    async appendAudit(entry) {
      const row = await prisma.platformTenantAudit.create({
        data: {
          tenantId: entry.tenantId,
          actorUserId: entry.actorUserId,
          action: entry.action,
          details: entry.details as Prisma.InputJsonValue,
          createdAt: entry.createdAt,
        },
      });
      return { ...entry, id: row.id, details: asDetails(row.details) };
    },
    async listLinks(tenantId) {
      const rows = await prisma.platformTenantSiteInstallation.findMany({ where: tenantId ? { tenantId } : undefined });
      return rows.map(asLink);
    },
    async findLinkByInstallation(installationId) {
      const row = await prisma.platformTenantSiteInstallation.findUnique({ where: { installationId } });
      return row ? asLink(row) : null;
    },
    async insertLink(link) {
      await prisma.platformTenantSiteInstallation.create({ data: link });
    },
    async deleteLink(installationId) {
      await prisma.platformTenantSiteInstallation.delete({ where: { installationId } });
    },
  };
}

function asSite(row: {
  id: string;
  tenantId: string;
  displayName: string;
  technology: string;
  status: string;
  createdAt: Date;
  activatedAt: Date | null;
  updatedAt: Date;
}): TenantSiteRecord {
  return {
    ...row,
    technology: row.technology as TenantSiteTechnology,
    status: row.status as TenantSiteStatus,
  };
}

function asOrigin(row: {
  id: string;
  tenantId: string;
  siteId: string;
  origin: string;
  verificationStatus: string;
  verificationTokenHash: string;
  verifiedMethod: string | null;
  challengeIssuedAt: Date;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): TenantOriginRecord {
  return {
    ...row,
    verificationStatus: row.verificationStatus as OriginVerificationStatus,
    verifiedMethod: row.verifiedMethod as OriginVerificationMethod | null,
  };
}

function asLink(row: SiteInstallationLink): SiteInstallationLink {
  return row;
}

function asDetails(value: Prisma.JsonValue): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function countTenantReferences(prisma: PrismaClient, tenantId: string): Promise<{
  conversations: number;
  installations: number;
  grants: number;
  audits: number;
}> {
  const [conversations, installations, grants, audits] = await Promise.all([
    prisma.chatSession.count({ where: { tenantId } }),
    prisma.chatConnectInstallation.count({ where: { tenantId } }),
    prisma.userTenantGrant.count({ where: { tenantId } }),
    prisma.platformTenantAudit.count({ where: { tenantId } }),
  ]);
  return { conversations, installations, grants, audits };
}
