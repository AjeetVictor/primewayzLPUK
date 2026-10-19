/**
 * Tenant, site, and origin administration for Primewayz Chat Platform.
 * Host/Owner changes lifecycle. Operators edit only granted contact details.
 * An origin is not authorized until the probe proves ownership.
 */

import { randomBytes } from 'node:crypto';
import type { OriginProbe } from './tenantOriginVerification.ts';
import { getTenantById, isTenantActive, PLATFORM_TENANTS, type PlatformTenantConfig } from './tenantRegistry.ts';
import {
  activationBlockReason,
  buildPlatformOverview,
  defaultCapabilities,
  deletionBlockReason,
  hashVerificationToken,
  nextLifecycle,
  parseBrand,
  parseCapabilityMap,
  parseContactEmail,
  parseDisplayText,
  parseExactOrigin,
  parseMarket,
  parseSiteTechnology,
  parseTenantId,
  type LifecycleAction,
  type TenantAccountRecord,
  type TenantReferenceCounts,
  type TenantSiteStatus,
} from './tenantAccountModel.ts';
import type { TenantAccountStore } from './tenantAccountStore.ts';

export class TenantAccountError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'TenantAccountError';
    this.status = status;
    this.code = code;
  }
}

export type TenantAccountPrincipal = {
  id: number;
  role: string;
  isPlatformOwner: boolean;
  tenantIds: readonly string[];
};

const OPERATIONS = new Set(['super_admin', 'admin', 'editor', 'viewer']);

function fail(status: number, code: string, message: string): never {
  throw new TenantAccountError(status, code, message);
}

function assertReader(principal: TenantAccountPrincipal): void {
  if (!principal.isPlatformOwner && !OPERATIONS.has(principal.role)) {
    fail(403, 'admin_access_required', 'Authenticated admin access is required.');
  }
}

function assertOwner(principal: TenantAccountPrincipal): void {
  if (!principal.isPlatformOwner) {
    fail(403, 'platform_owner_required', 'This action is restricted to the platform Host/Owner.');
  }
}

function assertTenantVisible(principal: TenantAccountPrincipal, tenantId: string): void {
  assertReader(principal);
  if (principal.isPlatformOwner) return;
  if (!principal.tenantIds.includes(tenantId)) {
    fail(403, 'tenant_access_denied', 'This account is not assigned to the selected tenant.');
  }
}

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(12).toString('hex')}`;
}

function issueToken(): { token: string; hash: string } {
  const token = `pwcv_${randomBytes(32).toString('base64url')}`;
  return { token, hash: hashVerificationToken(token) };
}

async function requireReadyStore(store: TenantAccountStore) {
  const listed = await store.listAccounts();
  if (listed.availability === 'unavailable') {
    fail(503, 'tenant_registry_unavailable', 'The tenant registry is temporarily unavailable.');
  }
  if (listed.availability === 'legacy') {
    fail(503, 'tenant_registry_unmigrated', 'The tenant registry migration has not been applied.');
  }
  return listed.accounts;
}

async function audit(
  store: TenantAccountStore,
  tenantId: string,
  actorUserId: number,
  action: string,
  details: Record<string, unknown>,
  at: Date,
) {
  await store.appendAudit({ tenantId, actorUserId, action, details, createdAt: at });
}

function publicAccount(account: TenantAccountRecord) {
  return {
    tenantId: account.tenantId,
    displayName: account.displayName,
    brand: account.brand,
    market: account.market,
    organizationName: account.organizationName,
    primaryContactName: account.primaryContactName,
    primaryContactEmail: account.primaryContactEmail,
    lifecycleStatus: account.lifecycleStatus,
    capabilities: account.capabilities,
    sourceKind: account.sourceKind,
    explicitEntitlement: account.explicitEntitlement,
    createdAt: account.createdAt.toISOString(),
    activatedAt: account.activatedAt?.toISOString() ?? null,
    suspendedAt: account.suspendedAt?.toISOString() ?? null,
    archivedAt: account.archivedAt?.toISOString() ?? null,
    updatedAt: account.updatedAt.toISOString(),
    compileTime: Boolean(getTenantById(account.tenantId)),
  };
}

function contactFrom(body: Record<string, unknown>) {
  const organizationName = parseDisplayText(body.organizationName, 160);
  const primaryContactName = parseDisplayText(body.primaryContactName, 120);
  const primaryContactEmail = parseContactEmail(body.primaryContactEmail);
  if (!organizationName || !primaryContactName || !primaryContactEmail) {
    fail(400, 'invalid_request', 'Organization name, contact name, and a valid contact email are required.');
  }
  return { organizationName, primaryContactName, primaryContactEmail };
}

export async function listTenantAccountViews(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  query: { q?: string; status?: string; page?: number; pageSize?: number; tenantId?: string | null },
) {
  assertReader(principal);
  const accounts = await requireReadyStore(store);
  const allowed = new Set(principal.isPlatformOwner ? accounts.map((account) => account.tenantId) : principal.tenantIds);
  let rows = accounts.filter((account) => allowed.has(account.tenantId));
  if (query.tenantId && query.tenantId !== 'all') {
    assertTenantVisible(principal, query.tenantId);
    rows = rows.filter((account) => account.tenantId === query.tenantId);
  }
  if (query.status && query.status !== 'all') {
    rows = rows.filter((account) => account.lifecycleStatus === query.status);
  }
  const q = query.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((account) =>
      `${account.displayName} ${account.organizationName} ${account.tenantId} ${account.primaryContactEmail}`.toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => a.displayName.localeCompare(b.displayName));
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 50);
  const page = Math.max(query.page ?? 1, 1);
  const start = (page - 1) * pageSize;
  return {
    total: rows.length,
    page,
    pageSize,
    tenants: rows.slice(start, start + pageSize).map(publicAccount),
    catalog: principal.isPlatformOwner
      ? PLATFORM_TENANTS.map((tenant) => ({
          tenantId: tenant.tenantId,
          displayName: tenant.displayName,
          hasCommercialRecord: accounts.some((account) => account.tenantId === tenant.tenantId),
          compileTimeActive: tenant.active,
        }))
      : [],
  };
}

export async function registerDatabaseTenant(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  body: Record<string, unknown>,
  at: Date,
) {
  assertOwner(principal);
  await requireReadyStore(store);
  const tenantId = parseTenantId(body.tenantId);
  const displayName = parseDisplayText(body.displayName, 120);
  const brand = parseBrand(body.brand);
  const market = parseMarket(body.market);
  if (!tenantId || !displayName || !brand || !market) {
    fail(400, 'invalid_request', 'Tenant id, display name, brand, and market are required.');
  }
  if (getTenantById(tenantId)) {
    fail(409, 'tenant_exists', 'This tenant id is already in the platform catalog. Open its commercial record instead of creating a second identity.');
  }
  if (await store.findAccount(tenantId)) fail(409, 'tenant_exists', 'A tenant with this id already exists.');
  const contact = contactFrom(body);
  const record: TenantAccountRecord = {
    tenantId,
    displayName,
    brand,
    market,
    ...contact,
    lifecycleStatus: 'draft',
    capabilities: defaultCapabilities(true),
    sourceKind: 'database',
    explicitEntitlement: true,
    createdAt: at,
    activatedAt: null,
    suspendedAt: null,
    archivedAt: null,
    updatedAt: at,
  };
  await store.insertAccount(record);
  await audit(store, tenantId, principal.id, 'tenant_registered', { displayName }, at);
  return publicAccount(record);
}

export async function openCommercialRecord(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  tenantId: string,
  body: Record<string, unknown>,
  at: Date,
  env: NodeJS.ProcessEnv,
) {
  assertOwner(principal);
  await requireReadyStore(store);
  const id = parseTenantId(tenantId);
  const compiled = id ? getTenantById(id) : undefined;
  if (!id || !compiled) fail(404, 'unknown_tenant', 'Unknown catalog tenant.');
  if (await store.findAccount(id)) fail(409, 'tenant_exists', 'This tenant already has a commercial record.');
  const contact = contactFrom(body);
  const requested = body.lifecycleStatus;
  let lifecycle: TenantAccountRecord['lifecycleStatus'] = 'active';
  if (requested === 'suspended') lifecycle = 'suspended';
  else if (requested === 'draft') lifecycle = 'draft';
  else if (requested != null && requested !== 'active') {
    fail(400, 'invalid_request', 'A new commercial record can start as draft, active, or suspended.');
  }
  if (lifecycle === 'active' && !isTenantActive(compiled, env)) {
    fail(409, 'activation_blocked', 'This tenant stays closed by its platform activation gate.');
  }
  const record: TenantAccountRecord = {
    tenantId: id,
    displayName: compiled.displayName,
    brand: compiled.brand,
    market: compiled.market,
    ...contact,
    lifecycleStatus: lifecycle,
    capabilities: { ...compiled.capabilities },
    sourceKind: 'commercial_record',
    explicitEntitlement: false,
    createdAt: at,
    activatedAt: lifecycle === 'active' ? at : null,
    suspendedAt: lifecycle === 'suspended' ? at : null,
    archivedAt: null,
    updatedAt: at,
  };
  await store.insertAccount(record);
  await audit(store, id, principal.id, 'commercial_record_opened', { lifecycleStatus: lifecycle }, at);
  return publicAccount(record);
}

export async function updateTenantAccount(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  tenantId: string,
  body: Record<string, unknown>,
  at: Date,
) {
  const id = parseTenantId(tenantId);
  if (!id) fail(400, 'invalid_request', 'Unknown tenant.');
  assertTenantVisible(principal, id);
  await requireReadyStore(store);
  const current = await store.findAccount(id);
  if (!current) fail(404, 'unknown_tenant', 'This tenant has no commercial record.');
  if (current.lifecycleStatus === 'archived') fail(409, 'tenant_archived', 'Restore the archived tenant before editing it.');
  const patch: Partial<TenantAccountRecord> = { updatedAt: at };
  if ('displayName' in body) {
    const displayName = parseDisplayText(body.displayName, 120);
    if (!displayName) fail(400, 'invalid_request', 'Display name is required.');
    patch.displayName = displayName;
  }
  if ('organizationName' in body || 'primaryContactName' in body || 'primaryContactEmail' in body) {
    Object.assign(patch, contactFrom({
      organizationName: body.organizationName ?? current.organizationName,
      primaryContactName: body.primaryContactName ?? current.primaryContactName,
      primaryContactEmail: body.primaryContactEmail ?? current.primaryContactEmail,
    }));
  }
  if ('capabilities' in body) {
    assertOwner(principal);
    const capabilities = parseCapabilityMap(body.capabilities);
    if (!capabilities) fail(400, 'invalid_request', 'Capabilities must include each platform capability as true or false.');
    if (current.sourceKind === 'commercial_record') {
      fail(409, 'capability_locked', 'Compile-time tenant capabilities stay in the platform build.');
    }
    patch.capabilities = capabilities;
  }
  const next = await store.updateAccount(id, patch);
  await audit(store, id, principal.id, 'tenant_updated', { fields: Object.keys(patch).filter((key) => key !== 'updatedAt') }, at);
  return publicAccount(next);
}

export async function changeTenantLifecycle(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  tenantId: string,
  action: LifecycleAction,
  at: Date,
  env: NodeJS.ProcessEnv,
) {
  assertOwner(principal);
  const id = parseTenantId(tenantId);
  if (!id) fail(400, 'invalid_request', 'Unknown tenant.');
  await requireReadyStore(store);
  const current = await store.findAccount(id);
  if (!current) fail(404, 'commercial_record_required', 'Create the commercial record before changing lifecycle.');
  const lifecycleStatus = nextLifecycle(current.lifecycleStatus, action);
  if (!lifecycleStatus) fail(409, 'invalid_transition', `Cannot ${action} a ${current.lifecycleStatus} tenant.`);
  if (lifecycleStatus === 'active') {
    const origins = await store.listOrigins({ tenantId: id });
    const reason = activationBlockReason({
      account: current,
      verifiedOriginCount: origins.filter((origin) => origin.verificationStatus === 'verified').length,
      env,
    });
    if (reason) fail(409, 'activation_blocked', reason);
  }
  const patch: Partial<TenantAccountRecord> = { lifecycleStatus, updatedAt: at };
  if (lifecycleStatus === 'active') patch.activatedAt = at;
  if (lifecycleStatus === 'suspended') patch.suspendedAt = at;
  if (lifecycleStatus === 'archived') patch.archivedAt = at;
  if (lifecycleStatus === 'draft') {
    patch.archivedAt = null;
    patch.activatedAt = null;
  }
  const next = await store.updateAccount(id, patch);
  await audit(store, id, principal.id, `tenant_${action}`, { from: current.lifecycleStatus, to: lifecycleStatus }, at);
  return publicAccount(next);
}

export async function addTenantSite(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  tenantId: string,
  body: Record<string, unknown>,
  at: Date,
) {
  assertOwner(principal);
  const id = parseTenantId(tenantId);
  if (!id) fail(400, 'invalid_request', 'Unknown tenant.');
  await requireReadyStore(store);
  const account = await store.findAccount(id);
  if (!account) fail(404, 'commercial_record_required', 'Create the commercial record before adding a site.');
  if (account.lifecycleStatus === 'archived') fail(409, 'tenant_archived', 'Archived tenants cannot gain sites.');
  const displayName = parseDisplayText(body.displayName, 120);
  const technology = parseSiteTechnology(body.technology);
  if (!displayName || !technology) fail(400, 'invalid_request', 'Site name and technology are required.');
  if (technology === 'recorded') {
    fail(400, 'unsupported_technology', 'Recorded is reserved. Choose WordPress, Shopify, custom, or the first-party React surface.');
  }
  const site = {
    id: newId('site'),
    tenantId: id,
    displayName,
    technology,
    status: 'pending' as TenantSiteStatus,
    createdAt: at,
    activatedAt: null,
    updatedAt: at,
  };
  await store.insertSite(site);
  await audit(store, id, principal.id, 'site_created', { siteId: site.id, technology }, at);
  return { ...site, createdAt: at.toISOString(), activatedAt: null, updatedAt: at.toISOString() };
}

export async function setSiteStatus(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  siteId: string,
  status: unknown,
  at: Date,
) {
  assertOwner(principal);
  await requireReadyStore(store);
  const site = await store.findSite(siteId);
  if (!site) fail(404, 'unknown_site', 'Unknown site.');
  if (status !== 'pending' && status !== 'active' && status !== 'suspended' && status !== 'archived') {
    fail(400, 'invalid_request', 'Site status must be pending, active, suspended, or archived.');
  }
  if (status === 'active') {
    const origins = await store.listOrigins({ siteId });
    if (!origins.some((origin) => origin.verificationStatus === 'verified')) {
      fail(409, 'origin_unverified', 'Activate a site after one of its origins is verified.');
    }
  }
  const next = await store.updateSite(siteId, {
    status,
    activatedAt: status === 'active' ? at : site.activatedAt,
    updatedAt: at,
  });
  await audit(store, site.tenantId, principal.id, 'site_status_changed', { siteId, status }, at);
  return next;
}

export async function addSiteOrigin(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  siteId: string,
  body: Record<string, unknown>,
  at: Date,
  env: NodeJS.ProcessEnv,
) {
  assertOwner(principal);
  await requireReadyStore(store);
  const site = await store.findSite(siteId);
  if (!site) fail(404, 'unknown_site', 'Unknown site.');
  const origin = parseExactOrigin(body.origin, env.NODE_ENV !== 'production');
  if (!origin) fail(400, 'invalid_origin', 'Enter one exact https origin. Wildcards, paths, and unverified text are not authorized.');
  const reserved = PLATFORM_TENANTS.flatMap((tenant) => tenant.tenantId === site.tenantId ? [] : [...tenant.allowedOrigins]);
  if (reserved.includes(origin)) {
    fail(409, 'origin_collision', 'That origin is already reserved by another tenant.');
  }
  const existing = await store.findOriginByValue(origin);
  if (existing) fail(409, 'origin_collision', 'That origin is already registered to a tenant.');
  const issued = issueToken();
  const row = {
    id: newId('origin'),
    tenantId: site.tenantId,
    siteId,
    origin,
    verificationStatus: 'pending' as const,
    verificationTokenHash: issued.hash,
    verifiedMethod: null,
    challengeIssuedAt: at,
    verifiedAt: null,
    createdAt: at,
    updatedAt: at,
  };
  await store.insertOrigin(row);
  await audit(store, site.tenantId, principal.id, 'origin_challenged', { originId: row.id, origin }, at);
  return {
    id: row.id,
    origin,
    verificationStatus: row.verificationStatus,
    verificationToken: issued.token,
    dnsHost: `_primewayz-chat.${new URL(origin).hostname}`,
    wellKnownPath: '/.well-known/primewayz-chat-verification.txt',
  };
}

export async function verifySiteOrigin(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  originId: string,
  probe: OriginProbe,
  at: Date,
) {
  assertOwner(principal);
  await requireReadyStore(store);
  const row = await store.findOriginById(originId);
  if (!row) fail(404, 'unknown_origin', 'Unknown origin.');
  if (row.verificationStatus === 'verified') {
    return { id: row.id, origin: row.origin, verificationStatus: row.verificationStatus, verifiedMethod: row.verifiedMethod };
  }
  const taken = await store.findOriginByValue(row.origin);
  if (taken && taken.id !== row.id) fail(409, 'origin_collision', 'That origin is already registered to a tenant.');
  let method: Awaited<ReturnType<OriginProbe>>;
  try {
    method = await probe({ origin: row.origin, tokenHash: row.verificationTokenHash });
  } catch {
    method = null;
  }
  if (method !== 'dns_txt' && method !== 'https_well_known') {
    await store.updateOrigin(row.id, { verificationStatus: 'failed', updatedAt: at });
    await audit(store, row.tenantId, principal.id, 'origin_verification_failed', { originId: row.id }, at);
    fail(409, 'origin_unverified', 'Ownership was not proved. The origin stays unauthorized.');
  }
  const next = await store.updateOrigin(row.id, {
    verificationStatus: 'verified',
    verifiedMethod: method,
    verifiedAt: at,
    updatedAt: at,
  });
  await audit(store, row.tenantId, principal.id, 'origin_verified', { originId: row.id, method }, at);
  return { id: next.id, origin: next.origin, verificationStatus: next.verificationStatus, verifiedMethod: next.verifiedMethod };
}

export async function reissueOriginChallenge(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  originId: string,
  at: Date,
) {
  assertOwner(principal);
  await requireReadyStore(store);
  const row = await store.findOriginById(originId);
  if (!row) fail(404, 'unknown_origin', 'Unknown origin.');
  const issued = issueToken();
  await store.updateOrigin(row.id, {
    verificationStatus: 'pending',
    verificationTokenHash: issued.hash,
    verifiedMethod: null,
    verifiedAt: null,
    challengeIssuedAt: at,
    updatedAt: at,
  });
  await audit(store, row.tenantId, principal.id, 'origin_challenge_reissued', { originId: row.id }, at);
  return { id: row.id, origin: row.origin, verificationToken: issued.token, verificationStatus: 'pending' as const };
}

export async function listSitesForPrincipal(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  tenantId: string | null,
) {
  assertReader(principal);
  await requireReadyStore(store);
  if (tenantId) assertTenantVisible(principal, tenantId);
  const tenantIds = principal.isPlatformOwner ? null : new Set(principal.tenantIds);
  const sites = (await store.listSites(tenantId ?? undefined)).filter((site) => !tenantIds || tenantIds.has(site.tenantId));
  const origins = await store.listOrigins(tenantId ? { tenantId } : undefined);
  const links = await store.listLinks(tenantId ?? undefined);
  return sites.filter((site) => !tenantIds || tenantIds.has(site.tenantId)).map((site) => ({
    id: site.id,
    tenantId: site.tenantId,
    displayName: site.displayName,
    technology: site.technology,
    status: site.status,
    createdAt: site.createdAt.toISOString(),
    activatedAt: site.activatedAt?.toISOString() ?? null,
    origins: origins.filter((origin) => origin.siteId === site.id).map((origin) => ({
      id: origin.id,
      origin: origin.origin,
      verificationStatus: origin.verificationStatus,
      verifiedMethod: origin.verifiedMethod,
      verifiedAt: origin.verifiedAt?.toISOString() ?? null,
    })),
    installations: links.filter((link) => link.siteId === site.id).map((link) => link.installationId),
  }));
}

export async function linkInstallationToSite(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  siteId: string,
  installationId: unknown,
  at: Date,
  installationTenantId: (id: string) => Promise<string | null>,
) {
  assertOwner(principal);
  await requireReadyStore(store);
  const site = await store.findSite(siteId);
  if (!site) fail(404, 'unknown_site', 'Unknown site.');
  if (typeof installationId !== 'string' || !/^[A-Za-z0-9_-]{4,64}$/.test(installationId)) {
    fail(400, 'invalid_request', 'Installation id is not valid.');
  }
  const ownerTenant = await installationTenantId(installationId);
  if (!ownerTenant) fail(404, 'unknown_installation', 'Unknown installation.');
  if (ownerTenant !== site.tenantId) fail(403, 'tenant_mismatch', 'An installation cannot be attached to another tenant.');
  const existing = await store.findLinkByInstallation(installationId);
  if (existing && existing.siteId !== siteId) fail(409, 'installation_linked', 'That installation is already linked to a site.');
  if (!existing) {
    await store.insertLink({ siteId, installationId, tenantId: site.tenantId, createdAt: at });
    await audit(store, site.tenantId, principal.id, 'installation_linked', { siteId, installationId }, at);
  }
  return { siteId, installationId, tenantId: site.tenantId };
}

export async function listTenantAudits(
  store: TenantAccountStore,
  principal: TenantAccountPrincipal,
  tenantId: string | null,
) {
  assertReader(principal);
  await requireReadyStore(store);
  if (tenantId) assertTenantVisible(principal, tenantId);
  const rows = await store.listAudits({ tenantId: tenantId ?? undefined, limit: 100 });
  const allowed = principal.isPlatformOwner ? null : new Set(principal.tenantIds);
  return rows.filter((row) => !allowed || allowed.has(row.tenantId)).map((row) => ({
    id: row.id,
    tenantId: row.tenantId,
    actorUserId: row.actorUserId,
    action: row.action,
    details: row.details,
    createdAt: row.createdAt.toISOString(),
  }));
}

export function explainTenantDeletion(counts: TenantReferenceCounts): { allowed: false; reason: string } | { allowed: true } {
  const reason = deletionBlockReason(counts);
  if (reason) return { allowed: false, reason };
  return { allowed: true };
}

export async function loadPlatformOverview(input: {
  store: TenantAccountStore;
  principal: TenantAccountPrincipal;
  entitlements: Array<{ tenantId: string; status: string }>;
  installations: Array<{
    tenantId: string;
    authorizationStatus: string;
    heartbeatProtocolAdopted: boolean;
    lastVerifiedHeartbeatAt: Date | null;
    integrationTechnology: string;
    addonVersion: string | null;
    widgetVersion: string | null;
  }>;
  healthOf: (installation: { heartbeatProtocolAdopted: boolean; lastVerifiedHeartbeatAt: Date | null }) => string;
}) {
  assertReader(input.principal);
  const listed = await input.store.listAccounts();
  if (listed.availability === 'unavailable') {
    fail(503, 'tenant_registry_unavailable', 'The tenant registry is temporarily unavailable.');
  }
  const allowed = input.principal.isPlatformOwner ? null : new Set(input.principal.tenantIds);
  const accounts = listed.accounts.filter((account) => !allowed || allowed.has(account.tenantId));
  const compileTime = (input.principal.isPlatformOwner
    ? PLATFORM_TENANTS
    : PLATFORM_TENANTS.filter((tenant) => allowed?.has(tenant.tenantId))) as readonly PlatformTenantConfig[];
  const installations = input.installations.filter((row) => !allowed || allowed.has(row.tenantId));
  const entitlements = input.entitlements.filter((row) => !allowed || allowed.has(row.tenantId));
  const audits = listed.availability === 'legacy'
    ? []
    : await input.store.listAudits({ limit: 8 });
  const recentEvents = audits
    .filter((row) => !allowed || allowed.has(row.tenantId))
    .map((row) => ({ tenantId: row.tenantId, action: row.action, createdAt: row.createdAt.toISOString() }));
  return {
    registry: listed.availability,
    ...buildPlatformOverview({
      accounts,
      compileTime,
      entitlements,
      installations,
      healthOf: input.healthOf,
      recentEvents,
    }),
  };
}
