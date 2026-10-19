import { accountChatGate } from './tenantAccountModel.ts';
import type {
  SiteInstallationLink,
  TenantAccountRecord,
  TenantAuditRecord,
  TenantOriginRecord,
  TenantSiteRecord,
} from './tenantAccountModel.ts';
import type { TenantAccountStore } from './tenantAccountStore.ts';

export function createMemoryTenantAccountStore(): TenantAccountStore {
  const accounts = new Map<string, TenantAccountRecord>();
  const sites = new Map<string, TenantSiteRecord>();
  const origins = new Map<string, TenantOriginRecord>();
  const links = new Map<string, SiteInstallationLink>();
  const audits: TenantAuditRecord[] = [];
  let auditId = 1;

  return {
    async listAccounts() {
      return { availability: 'ready', accounts: [...accounts.values()] };
    },
    async findAccount(tenantId) {
      return accounts.get(tenantId) ?? null;
    },
    async gate(tenantId) {
      return accountChatGate(accounts.get(tenantId) ?? null);
    },
    async insertAccount(record) {
      if (accounts.has(record.tenantId)) throw new Error('duplicate_tenant');
      accounts.set(record.tenantId, record);
    },
    async updateAccount(tenantId, patch) {
      const current = accounts.get(tenantId);
      if (!current) throw new Error('missing_tenant');
      const next = { ...current, ...patch, tenantId };
      accounts.set(tenantId, next);
      return next;
    },
    async listSites(tenantId) {
      return [...sites.values()].filter((site) => !tenantId || site.tenantId === tenantId);
    },
    async findSite(id) {
      return sites.get(id) ?? null;
    },
    async insertSite(record) {
      sites.set(record.id, record);
    },
    async updateSite(id, patch) {
      const current = sites.get(id);
      if (!current) throw new Error('missing_site');
      const next = { ...current, ...patch, id };
      sites.set(id, next);
      return next;
    },
    async listOrigins(filter) {
      return [...origins.values()].filter((origin) => {
        if (filter?.tenantId && origin.tenantId !== filter.tenantId) return false;
        if (filter?.siteId && origin.siteId !== filter.siteId) return false;
        return true;
      });
    },
    async findOriginById(id) {
      return origins.get(id) ?? null;
    },
    async findOriginByValue(origin) {
      return [...origins.values()].find((row) => row.origin === origin) ?? null;
    },
    async insertOrigin(record) {
      if ([...origins.values()].some((row) => row.origin === record.origin)) throw new Error('duplicate_origin');
      origins.set(record.id, record);
    },
    async updateOrigin(id, patch) {
      const current = origins.get(id);
      if (!current) throw new Error('missing_origin');
      const next = { ...current, ...patch, id };
      origins.set(id, next);
      return next;
    },
    async listAudits(filter) {
      return audits
        .filter((entry) => !filter.tenantId || entry.tenantId === filter.tenantId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, filter.limit);
    },
    async appendAudit(entry) {
      const row = { ...entry, id: auditId };
      auditId += 1;
      audits.push(row);
      return row;
    },
    async listLinks(tenantId) {
      return [...links.values()].filter((link) => !tenantId || link.tenantId === tenantId);
    },
    async findLinkByInstallation(installationId) {
      return links.get(installationId) ?? null;
    },
    async insertLink(link) {
      if (links.has(link.installationId)) throw new Error('duplicate_installation_link');
      links.set(link.installationId, link);
    },
    async deleteLink(installationId) {
      links.delete(installationId);
    },
  };
}
