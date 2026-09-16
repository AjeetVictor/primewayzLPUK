/**
 * Canonical tenant service-capability resolver.
 * Capability checks must go through this module — do not scatter per-service allowlists.
 */

import type { PlatformTenantId } from './sourceContext.ts';
import { getTenantById, PLATFORM_TENANTS } from './tenantRegistry.ts';

export type TenantCapability = 'audit' | 'forms' | 'chat' | 'conversion' | 'scheduling';

export type TenantCapabilityMap = Readonly<Record<TenantCapability, boolean>>;

export const ALL_TENANT_CAPABILITIES: readonly TenantCapability[] = [
  'audit',
  'forms',
  'chat',
  'conversion',
  'scheduling',
] as const;

export function getTenantCapabilities(tenantId: string): TenantCapabilityMap | null {
  const tenant = getTenantById(tenantId);
  if (!tenant) return null;
  return tenant.capabilities;
}

export function tenantSupportsCapability(
  tenantId: string,
  capability: TenantCapability,
): boolean {
  const capabilities = getTenantCapabilities(tenantId);
  return Boolean(capabilities?.[capability]);
}

export function resolveTenantCapability(
  tenantId: string,
  capability: TenantCapability,
): { tenantId: PlatformTenantId; capability: TenantCapability; enabled: boolean } | null {
  const tenant = getTenantById(tenantId);
  if (!tenant) return null;
  return {
    tenantId: tenant.tenantId,
    capability,
    enabled: tenant.capabilities[capability],
  };
}

/** Origins allowed for a public capability (active tenants only). */
export function getOriginsForCapability(capability: TenantCapability): readonly string[] {
  return PLATFORM_TENANTS.filter((tenant) => tenant.active && tenant.capabilities[capability]).flatMap(
    (tenant) => [...tenant.allowedOrigins],
  );
}
