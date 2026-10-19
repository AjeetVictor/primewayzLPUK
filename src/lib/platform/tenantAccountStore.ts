import type {
  SiteInstallationLink,
  TenantAccountChatGate,
  TenantAccountRecord,
  TenantAuditRecord,
  TenantOriginRecord,
  TenantSiteRecord,
} from './tenantAccountModel.ts';

export type TenantAccountListResult =
  | { availability: 'ready'; accounts: TenantAccountRecord[] }
  | { availability: 'legacy'; accounts: [] }
  | { availability: 'unavailable'; accounts: [] };

export type TenantAccountStore = {
  listAccounts(): Promise<TenantAccountListResult>;
  findAccount(tenantId: string): Promise<TenantAccountRecord | null>;
  gate(tenantId: string): Promise<TenantAccountChatGate>;
  insertAccount(record: TenantAccountRecord): Promise<void>;
  updateAccount(tenantId: string, patch: Partial<TenantAccountRecord>): Promise<TenantAccountRecord>;
  listSites(tenantId?: string): Promise<TenantSiteRecord[]>;
  findSite(id: string): Promise<TenantSiteRecord | null>;
  insertSite(record: TenantSiteRecord): Promise<void>;
  updateSite(id: string, patch: Partial<TenantSiteRecord>): Promise<TenantSiteRecord>;
  listOrigins(filter?: { tenantId?: string; siteId?: string }): Promise<TenantOriginRecord[]>;
  findOriginById(id: string): Promise<TenantOriginRecord | null>;
  findOriginByValue(origin: string): Promise<TenantOriginRecord | null>;
  insertOrigin(record: TenantOriginRecord): Promise<void>;
  updateOrigin(id: string, patch: Partial<TenantOriginRecord>): Promise<TenantOriginRecord>;
  listAudits(filter: { tenantId?: string; limit: number }): Promise<TenantAuditRecord[]>;
  appendAudit(entry: Omit<TenantAuditRecord, 'id'>): Promise<TenantAuditRecord>;
  listLinks(tenantId?: string): Promise<SiteInstallationLink[]>;
  findLinkByInstallation(installationId: string): Promise<SiteInstallationLink | null>;
  insertLink(link: SiteInstallationLink): Promise<void>;
  deleteLink(installationId: string): Promise<void>;
};
