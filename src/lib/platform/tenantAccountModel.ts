/**
 * Commercial tenant account rules for Primewayz Chat Platform.
 * Compile-time PLATFORM_TENANTS stay the compatibility catalog.
 * A database row with the same id is the same tenant, not a second identity.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import type { PlatformTenantConfig } from './tenantRegistry.ts';
import { getTenantById, isTenantActive, PLATFORM_TENANTS } from './tenantRegistry.ts';
import { ALL_TENANT_CAPABILITIES, type TenantCapabilityMap } from './tenantCapabilities.ts';

export const TENANT_LIFECYCLE_STATUSES = ['draft', 'active', 'suspended', 'archived'] as const;
export type TenantLifecycleStatus = (typeof TENANT_LIFECYCLE_STATUSES)[number];

export const TENANT_SITE_STATUSES = ['pending', 'active', 'suspended', 'archived'] as const;
export type TenantSiteStatus = (typeof TENANT_SITE_STATUSES)[number];

export const TENANT_SITE_TECHNOLOGIES = ['wordpress', 'shopify', 'custom', 'react', 'recorded'] as const;
export type TenantSiteTechnology = (typeof TENANT_SITE_TECHNOLOGIES)[number];

export const ORIGIN_VERIFICATION_STATUSES = ['pending', 'verified', 'failed'] as const;
export type OriginVerificationStatus = (typeof ORIGIN_VERIFICATION_STATUSES)[number];

export const ORIGIN_VERIFICATION_METHODS = ['dns_txt', 'https_well_known'] as const;
export type OriginVerificationMethod = (typeof ORIGIN_VERIFICATION_METHODS)[number];

export const TENANT_ACCOUNT_BRANDS = ['Primewayz', 'RentReadBuy', 'Customer'] as const;
export const TENANT_ACCOUNT_MARKETS = ['UK', 'IN', 'US', 'UAE', 'MX', 'OTHER'] as const;

export const TENANT_ID_PATTERN = /^[a-z][a-z0-9-]{1,31}$/;

/** Missing commercial-registry tables are the pre-migration path. Other read failures are not. */
export function isMissingTenantRegistryError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code?: unknown }).code === 'P2021') return true;
  const message = err instanceof Error ? err.message : '';
  return /does not exist|doesn't exist/i.test(message);
}

export type TenantAccountRecord = {
  tenantId: string;
  displayName: string;
  brand: string;
  market: string;
  organizationName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  lifecycleStatus: TenantLifecycleStatus;
  capabilities: TenantCapabilityMap;
  sourceKind: 'database' | 'commercial_record';
  explicitEntitlement: boolean;
  createdAt: Date;
  activatedAt: Date | null;
  suspendedAt: Date | null;
  archivedAt: Date | null;
  updatedAt: Date;
};

export type TenantSiteRecord = {
  id: string;
  tenantId: string;
  displayName: string;
  technology: TenantSiteTechnology;
  status: TenantSiteStatus;
  createdAt: Date;
  activatedAt: Date | null;
  updatedAt: Date;
};

export type TenantOriginRecord = {
  id: string;
  tenantId: string;
  siteId: string;
  origin: string;
  verificationStatus: OriginVerificationStatus;
  verificationTokenHash: string;
  verifiedMethod: OriginVerificationMethod | null;
  challengeIssuedAt: Date;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TenantAuditRecord = {
  id: number;
  tenantId: string;
  actorUserId: number | null;
  action: string;
  details: Record<string, unknown>;
  createdAt: Date;
};

export type SiteInstallationLink = {
  siteId: string;
  installationId: string;
  tenantId: string;
  createdAt: Date;
};

export type TenantReferenceCounts = {
  conversations: number;
  installations: number;
  grants: number;
  audits: number;
};

export type TenantAccountChatGate =
  | { availability: 'legacy' }
  | { availability: 'unavailable' }
  | {
      availability: 'ready';
      lifecycle: TenantLifecycleStatus;
      chatCapability: boolean;
      inCompileTimeRegistry: boolean;
      explicitEntitlement: boolean;
    };

export function hashVerificationToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function defaultCapabilities(chat = true): TenantCapabilityMap {
  return {
    audit: false,
    forms: false,
    chat,
    conversion: false,
    scheduling: false,
  };
}

export function parseCapabilityMap(value: unknown): TenantCapabilityMap | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const next: { -readonly [Key in keyof TenantCapabilityMap]: TenantCapabilityMap[Key] } = {
    audit: false,
    forms: false,
    chat: false,
    conversion: false,
    scheduling: false,
  };
  for (const key of ALL_TENANT_CAPABILITIES) {
    if (typeof record[key] !== 'boolean') return null;
    next[key] = record[key];
  }
  return next;
}

export function isTenantLifecycle(value: unknown): value is TenantLifecycleStatus {
  return typeof value === 'string' && (TENANT_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function parseTenantId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const id = value.trim().toLowerCase();
  if (!TENANT_ID_PATTERN.test(id)) return null;
  return id;
}

export function parseDisplayText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text || text.length > max || /[\u0000-\u001F]/.test(text)) return null;
  return text;
}

export function parseContactEmail(value: unknown): string | null {
  const email = parseDisplayText(value, 320);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email.toLowerCase();
}

export function parseBrand(value: unknown): (typeof TENANT_ACCOUNT_BRANDS)[number] | null {
  return typeof value === 'string' && (TENANT_ACCOUNT_BRANDS as readonly string[]).includes(value)
    ? value as (typeof TENANT_ACCOUNT_BRANDS)[number]
    : null;
}

export function parseMarket(value: unknown): (typeof TENANT_ACCOUNT_MARKETS)[number] | null {
  return typeof value === 'string' && (TENANT_ACCOUNT_MARKETS as readonly string[]).includes(value)
    ? value as (typeof TENANT_ACCOUNT_MARKETS)[number]
    : null;
}

export function parseSiteTechnology(value: unknown): TenantSiteTechnology | null {
  return typeof value === 'string' && (TENANT_SITE_TECHNOLOGIES as readonly string[]).includes(value)
    ? value as TenantSiteTechnology
    : null;
}

/**
 * Exact origin only. https, or http://localhost / http://127.0.0.1 outside production.
 * Paths, wildcards, and credentials are rejected.
 */
export function parseExactOrigin(value: unknown, allowLocalHttp: boolean): string | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().replace(/\/$/, '');
  if (!candidate || candidate.includes('*')) return null;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }
  if (url.origin !== candidate) return null;
  const localHttp = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if (url.protocol !== 'https:' && !(localHttp && allowLocalHttp)) return null;
  return candidate;
}

export type LifecycleAction = 'activate' | 'suspend' | 'reactivate' | 'archive' | 'restore';

export function nextLifecycle(current: TenantLifecycleStatus, action: LifecycleAction): TenantLifecycleStatus | null {
  if (action === 'activate' && current === 'draft') return 'active';
  if (action === 'suspend' && current === 'active') return 'suspended';
  if (action === 'reactivate' && current === 'suspended') return 'active';
  if (action === 'archive' && current !== 'archived') return 'archived';
  if (action === 'restore' && current === 'archived') return 'draft';
  return null;
}

export function deletionBlockReason(counts: TenantReferenceCounts): string | null {
  const reasons: string[] = [];
  if (counts.conversations > 0) reasons.push('conversations');
  if (counts.installations > 0) reasons.push('installations');
  if (counts.grants > 0) reasons.push('permissions');
  if (counts.audits > 0) reasons.push('audit logs');
  if (reasons.length === 0) return null;
  return `This tenant is referenced by ${reasons.join(', ')}. Archive it instead of deleting it.`;
}

export function compileTimeTenant(tenantId: string): PlatformTenantConfig | undefined {
  return getTenantById(tenantId);
}

export function accountChatGate(account: TenantAccountRecord | null): TenantAccountChatGate {
  if (!account) return { availability: 'legacy' };
  return {
    availability: 'ready',
    lifecycle: account.lifecycleStatus,
    chatCapability: account.capabilities.chat,
    inCompileTimeRegistry: Boolean(getTenantById(account.tenantId)),
    explicitEntitlement: account.explicitEntitlement,
  };
}

/**
 * Database lifecycle closes access even when the compile-time catalog still says active.
 * A missing row keeps the compile-time decision. An unavailable read does not.
 */
export function foldTenantAccountGate(input: {
  tenantId: string;
  env: NodeJS.ProcessEnv;
  gate: TenantAccountChatGate;
}): {
  known: boolean;
  active: boolean;
  compileTimeChat: boolean;
  requiresExplicitEntitlement: boolean;
  shortCircuit: 'store_unavailable' | null;
} {
  const tenant = getTenantById(input.tenantId);
  if (input.gate.availability === 'unavailable') {
    return {
      known: true,
      active: false,
      compileTimeChat: false,
      requiresExplicitEntitlement: false,
      shortCircuit: 'store_unavailable',
    };
  }
  if (input.gate.availability === 'legacy') {
    return {
      known: Boolean(tenant),
      active: Boolean(tenant && isTenantActive(tenant, input.env)),
      compileTimeChat: Boolean(tenant?.capabilities.chat),
      requiresExplicitEntitlement: false,
      shortCircuit: null,
    };
  }
  if (input.gate.lifecycle !== 'active') {
    return {
      known: true,
      active: false,
      compileTimeChat: tenant ? tenant.capabilities.chat : input.gate.chatCapability,
      requiresExplicitEntitlement: input.gate.explicitEntitlement,
      shortCircuit: null,
    };
  }
  if (tenant) {
    return {
      known: true,
      active: isTenantActive(tenant, input.env),
      compileTimeChat: tenant.capabilities.chat,
      requiresExplicitEntitlement: false,
      shortCircuit: null,
    };
  }
  return {
    known: true,
    active: true,
    compileTimeChat: input.gate.chatCapability,
    requiresExplicitEntitlement: input.gate.explicitEntitlement,
    shortCircuit: null,
  };
}

export function activationBlockReason(input: {
  account: TenantAccountRecord;
  verifiedOriginCount: number;
  env: NodeJS.ProcessEnv;
}): string | null {
  const compiled = getTenantById(input.account.tenantId);
  if (compiled && !isTenantActive(compiled, input.env)) {
    return 'This tenant stays closed by its platform activation gate.';
  }
  if (input.account.sourceKind === 'database' && input.verifiedOriginCount < 1) {
    return 'Activate this tenant after at least one origin is verified.';
  }
  return null;
}

export function knownCompileTimeIds(): string[] {
  return PLATFORM_TENANTS.map((tenant) => tenant.tenantId);
}

export type OverviewAlert = { tone: 'warning' | 'danger' | 'neutral'; text: string };

export function buildPlatformOverview(input: {
  accounts: TenantAccountRecord[];
  compileTime: readonly PlatformTenantConfig[];
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
  recentEvents: Array<{ tenantId: string; action: string; createdAt: string }>;
}): {
  tenants: { registered: number; active: number; suspended: number; archived: number; draft: number; withoutCommercialRecord: number };
  entitlements: { entitled: number; suspended: number; revoked: number; unset: number };
  installations: {
    total: number;
    authorized: number;
    suspended: number;
    revoked: number;
    connected: number;
    stale: number;
    disconnected: number;
    unreported: number;
  };
  versions: Array<{ technology: string; addonVersion: string; widgetVersion: string; count: number }>;
  recentEvents: Array<{ tenantId: string; action: string; createdAt: string }>;
  alerts: OverviewAlert[];
} {
  const accountIds = new Set(input.accounts.map((account) => account.tenantId));
  const withoutCommercialRecord = input.compileTime.filter((tenant) => !accountIds.has(tenant.tenantId)).length;
  const registered = new Set([...input.compileTime.map((tenant) => tenant.tenantId), ...accountIds]).size;
  const countStatus = (status: TenantLifecycleStatus) => input.accounts.filter((account) => account.lifecycleStatus === status).length;
  const entitled = input.entitlements.filter((row) => row.status === 'entitled').length;
  const entitlementSuspended = input.entitlements.filter((row) => row.status === 'suspended').length;
  const revoked = input.entitlements.filter((row) => row.status === 'revoked').length;
  const healthCounts = { connected: 0, stale: 0, disconnected: 0, unreported: 0 };
  const versions = new Map<string, number>();
  for (const installation of input.installations) {
    const health = input.healthOf(installation);
    if (health === 'connected') healthCounts.connected += 1;
    else if (health === 'stale') healthCounts.stale += 1;
    else if (health === 'disconnected') healthCounts.disconnected += 1;
    else healthCounts.unreported += 1;
    const key = `${installation.integrationTechnology}|${installation.addonVersion ?? 'not reported'}|${installation.widgetVersion ?? 'not reported'}`;
    versions.set(key, (versions.get(key) ?? 0) + 1);
  }
  const alerts: OverviewAlert[] = [];
  if (countStatus('suspended') > 0) {
    alerts.push({ tone: 'warning', text: `${countStatus('suspended')} tenant account${countStatus('suspended') === 1 ? ' is' : 's are'} suspended.` });
  }
  if (entitlementSuspended + revoked > 0) {
    alerts.push({ tone: 'danger', text: `${entitlementSuspended + revoked} central chat entitlement${entitlementSuspended + revoked === 1 ? ' is' : 's are'} suspended or revoked.` });
  }
  if (healthCounts.unreported > 0) {
    alerts.push({ tone: 'neutral', text: `${healthCounts.unreported} installation${healthCounts.unreported === 1 ? ' has' : 's have'} no verified heartbeat. An API response is not connection health.` });
  }
  if (healthCounts.stale + healthCounts.disconnected > 0) {
    alerts.push({ tone: 'warning', text: `${healthCounts.stale} stale and ${healthCounts.disconnected} disconnected installation${healthCounts.stale + healthCounts.disconnected === 1 ? '' : 's'}.` });
  }
  return {
    tenants: {
      registered,
      active: countStatus('active'),
      suspended: countStatus('suspended'),
      archived: countStatus('archived'),
      draft: countStatus('draft'),
      withoutCommercialRecord,
    },
    entitlements: {
      entitled,
      suspended: entitlementSuspended,
      revoked,
      unset: Math.max(0, registered - input.entitlements.length),
    },
    installations: {
      total: input.installations.length,
      authorized: input.installations.filter((row) => row.authorizationStatus === 'active').length,
      suspended: input.installations.filter((row) => row.authorizationStatus === 'suspended').length,
      revoked: input.installations.filter((row) => row.authorizationStatus === 'revoked').length,
      ...healthCounts,
    },
    versions: [...versions.entries()].map(([key, count]) => {
      const [technology, addonVersion, widgetVersion] = key.split('|');
      return { technology, addonVersion, widgetVersion, count };
    }),
    recentEvents: input.recentEvents,
    alerts,
  };
}
