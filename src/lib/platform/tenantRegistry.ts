import type { PrimewayzMarket, PrimewayzTenantId } from './sourceContext.ts';

export type PrimewayzTenantConfig = {
  tenantId: PrimewayzTenantId;
  brand: 'Primewayz';
  market: PrimewayzMarket;
  sourceSite: string;
  displayName: string;
  active: boolean;
  allowedOrigins: readonly string[];
  notificationRecipientEnv?: string;
};

export const PRIMEWAYZ_TENANTS: readonly PrimewayzTenantConfig[] = [
  { tenantId: 'pw-uk', brand: 'Primewayz', market: 'UK', sourceSite: 'uk.primewayz.com', displayName: 'Primewayz UK', active: true, allowedOrigins: ['https://uk.primewayz.com'], notificationRecipientEnv: 'INTERNAL_NOTIFICATION_EMAIL' },
  { tenantId: 'pw-infotech', brand: 'Primewayz', market: 'IN', sourceSite: 'primewayz.com', displayName: 'Primewayz Infotech', active: true, allowedOrigins: ['https://primewayz.com', 'https://www.primewayz.com'], notificationRecipientEnv: 'PW_INFOTECH_NOTIFICATION_EMAIL' },
  { tenantId: 'pw-us', brand: 'Primewayz', market: 'US', sourceSite: 'us.primewayz.com', displayName: 'Primewayz US', active: false, allowedOrigins: [] },
  { tenantId: 'pw-uae', brand: 'Primewayz', market: 'UAE', sourceSite: 'uae.primewayz.com', displayName: 'Primewayz UAE', active: false, allowedOrigins: [] },
  { tenantId: 'pw-mx', brand: 'Primewayz', market: 'MX', sourceSite: 'mx.primewayz.com', displayName: 'Primewayz Mexico', active: false, allowedOrigins: [] },
] as const;

export function getTenantById(id: string): PrimewayzTenantConfig | undefined { return PRIMEWAYZ_TENANTS.find((tenant) => tenant.tenantId === id); }
export function getTenantByOrigin(origin: string): PrimewayzTenantConfig | undefined { return PRIMEWAYZ_TENANTS.find((tenant) => tenant.active && tenant.allowedOrigins.includes(origin)); }
export function getTenantByHost(host: string): PrimewayzTenantConfig | undefined { return PRIMEWAYZ_TENANTS.find((tenant) => tenant.active && (tenant.sourceSite === host || tenant.allowedOrigins.some((origin) => new URL(origin).hostname === host))); }

export function getTenantDisplayName(tenantId: string | null | undefined): string {
  if (!tenantId) return 'Legacy / unknown';
  return getTenantById(tenantId)?.displayName ?? 'Legacy / unknown';
}

/** Live admin filters: active tenants only, plus All entities. Inactive markets stay registered but unselectable. */
export const ADMIN_TENANT_FILTER_OPTIONS = [
  ...PRIMEWAYZ_TENANTS.filter((tenant) => tenant.active).map((tenant) => ({
    value: tenant.tenantId,
    label: tenant.displayName,
  })),
  { value: 'all', label: 'All entities' },
] as const;
