import type { PlatformBrand, PlatformTenantId, PrimewayzMarket } from './sourceContext.ts';
import type { TenantCapabilityMap } from './tenantCapabilities.ts';

/** Public Chat visitor-facing copy that must stay tenant-owned (not UK-defaulted). */
export type TenantChatPresentation = {
  /** Explicit service-hours label; not inferred from market/timezone at runtime. */
  businessHours: string;
  /** Offline bot / follow-up team identity (e.g. "Primewayz UK team"). */
  teamLabel: string;
};

/** Neutral fallback when a tenant (or future client) has no explicit presentation config. */
export const NEUTRAL_CHAT_BUSINESS_HOURS = 'Mon-Fri, business hours';

/** Neutral team identity when tenant display metadata is unavailable. */
export const NEUTRAL_CHAT_TEAM_LABEL = 'our team';

/**
 * Neutral IANA fallback when a tenant has no explicit defaultTimeZone.
 * Used only when browser/request timezone is missing or invalid — not as visitor TZ.
 */
export const NEUTRAL_TENANT_TIMEZONE = 'UTC';

export type PlatformTenantConfig = {
  tenantId: PlatformTenantId;
  brand: PlatformBrand;
  market: PrimewayzMarket;
  sourceSite: string;
  displayName: string;
  active: boolean;
  allowedOrigins: readonly string[];
  notificationRecipientEnv?: string;
  capabilities: TenantCapabilityMap;
  /** Servicing-business IANA timezone; fallback when visitor timezone is unavailable. */
  defaultTimeZone?: string;
  chatPresentation?: TenantChatPresentation;
};

/** Compatibility alias for existing imports. */
export type PrimewayzTenantConfig = PlatformTenantConfig;

const FULL_PLATFORM_CAPABILITIES: TenantCapabilityMap = {
  audit: true,
  forms: true,
  chat: true,
  conversion: true,
  scheduling: true,
};

const INACTIVE_MARKET_CAPABILITIES: TenantCapabilityMap = {
  audit: false,
  forms: false,
  chat: false,
  conversion: false,
  scheduling: false,
};

/**
 * Canonical active + inactive tenant registry.
 * CORS, Chat, Audit defaults, Admin filters, and notifications derive from this list.
 * Future clients (Digiblend, SRH, …) onboard here — do not invent production domains until known.
 */
export const PLATFORM_TENANTS: readonly PlatformTenantConfig[] = [
  {
    tenantId: 'pw-uk',
    brand: 'Primewayz',
    market: 'UK',
    sourceSite: 'uk.primewayz.com',
    displayName: 'Primewayz UK',
    active: true,
    allowedOrigins: ['https://uk.primewayz.com'],
    notificationRecipientEnv: 'INTERNAL_NOTIFICATION_EMAIL',
    capabilities: FULL_PLATFORM_CAPABILITIES,
    defaultTimeZone: 'Europe/London',
    chatPresentation: {
      businessHours: 'Mon-Fri, UK business hours',
      teamLabel: 'Primewayz UK team',
    },
  },
  {
    tenantId: 'pw-infotech',
    brand: 'Primewayz',
    market: 'IN',
    sourceSite: 'primewayz.com',
    displayName: 'Primewayz Infotech',
    active: true,
    allowedOrigins: ['https://primewayz.com', 'https://www.primewayz.com'],
    notificationRecipientEnv: 'PW_INFOTECH_NOTIFICATION_EMAIL',
    capabilities: FULL_PLATFORM_CAPABILITIES,
    defaultTimeZone: 'Asia/Kolkata',
    chatPresentation: {
      businessHours: 'Mon-Fri, India business hours',
      teamLabel: 'Primewayz Infotech team',
    },
  },
  {
    tenantId: 'rrb',
    brand: 'RentReadBuy',
    market: 'IN',
    sourceSite: 'rentreadbuy.com',
    displayName: 'RentReadBuy',
    active: true,
    allowedOrigins: ['https://rentreadbuy.com', 'https://www.rentreadbuy.com'],
    notificationRecipientEnv: 'RRB_NOTIFICATION_EMAIL',
    capabilities: {
      audit: false,
      forms: false,
      chat: true,
      conversion: false,
      scheduling: false,
    },
    defaultTimeZone: 'Asia/Kolkata',
    chatPresentation: {
      businessHours: 'Mon-Fri, India business hours',
      teamLabel: 'RentReadBuy team',
    },
  },
  {
    tenantId: 'pw-us',
    brand: 'Primewayz',
    market: 'US',
    sourceSite: 'us.primewayz.com',
    displayName: 'Primewayz US',
    active: false,
    allowedOrigins: [],
    capabilities: INACTIVE_MARKET_CAPABILITIES,
  },
  {
    tenantId: 'pw-uae',
    brand: 'Primewayz',
    market: 'UAE',
    sourceSite: 'uae.primewayz.com',
    displayName: 'Primewayz UAE',
    active: false,
    allowedOrigins: [],
    capabilities: INACTIVE_MARKET_CAPABILITIES,
  },
  {
    tenantId: 'pw-mx',
    brand: 'Primewayz',
    market: 'MX',
    sourceSite: 'mx.primewayz.com',
    displayName: 'Primewayz Mexico',
    active: false,
    allowedOrigins: [],
    capabilities: INACTIVE_MARKET_CAPABILITIES,
  },
] as const;

/** @deprecated Prefer PLATFORM_TENANTS — kept for existing imports. */
export const PRIMEWAYZ_TENANTS = PLATFORM_TENANTS;

export function getTenantById(id: string): PlatformTenantConfig | undefined {
  return PLATFORM_TENANTS.find((tenant) => tenant.tenantId === id);
}

export function getTenantByOrigin(origin: string): PlatformTenantConfig | undefined {
  return PLATFORM_TENANTS.find((tenant) => tenant.active && tenant.allowedOrigins.includes(origin));
}

export function getTenantByHost(host: string): PlatformTenantConfig | undefined {
  return PLATFORM_TENANTS.find(
    (tenant) =>
      tenant.active &&
      (tenant.sourceSite === host ||
        tenant.allowedOrigins.some((origin) => new URL(origin).hostname === host)),
  );
}

export function getTenantDisplayName(tenantId: string | null | undefined): string {
  if (!tenantId) return 'Legacy / unknown';
  return getTenantById(tenantId)?.displayName ?? 'Legacy / unknown';
}

/**
 * Resolve public Chat presentation for a tenant.
 * Unknown / future tenants without config get neutral business-hours + team labels.
 * Registered tenants without explicit teamLabel derive "<displayName> team".
 */
export function resolveTenantChatPresentation(
  tenantId: string | null | undefined,
): Required<TenantChatPresentation> {
  const tenant = tenantId ? getTenantById(tenantId) : undefined;
  const configured = tenant?.chatPresentation;
  return {
    businessHours: configured?.businessHours ?? NEUTRAL_CHAT_BUSINESS_HOURS,
    teamLabel:
      configured?.teamLabel ??
      (tenant?.displayName ? `${tenant.displayName} team` : NEUTRAL_CHAT_TEAM_LABEL),
  };
}

/**
 * Resolve servicing-business IANA timezone for a tenant.
 * Explicit registry config preferred; unconfigured / unknown tenants fall back to UTC.
 */
export function resolveTenantTimeZone(tenantId: string | null | undefined): string {
  const configured = tenantId ? getTenantById(tenantId)?.defaultTimeZone : undefined;
  return configured ?? NEUTRAL_TENANT_TIMEZONE;
}

/** Live admin filters: active tenants only, plus All entities. Inactive markets stay registered but unselectable. */
export const ADMIN_TENANT_FILTER_OPTIONS = [
  ...PLATFORM_TENANTS.filter((tenant) => tenant.active).map((tenant) => ({
    value: tenant.tenantId,
    label: tenant.displayName,
  })),
  { value: 'all', label: 'All entities' },
] as const;
