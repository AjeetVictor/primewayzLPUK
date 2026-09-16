import type { PlatformBrand, PlatformTenantId, PrimewayzMarket } from './sourceContext.ts';
import type { TenantCapabilityMap } from './tenantCapabilities.ts';

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

/** Live admin filters: active tenants only, plus All entities. Inactive markets stay registered but unselectable. */
export const ADMIN_TENANT_FILTER_OPTIONS = [
  ...PLATFORM_TENANTS.filter((tenant) => tenant.active).map((tenant) => ({
    value: tenant.tenantId,
    label: tenant.displayName,
  })),
  { value: 'all', label: 'All entities' },
] as const;
