/**
 * Safe public platform capabilities DTO builder.
 * Never exposes secrets, webhook keys, or internal provider URIs.
 */

import type { SourceContext } from './sourceContext.ts';
import { getTenantById } from './tenantRegistry.ts';
import {
  ALL_TENANT_CAPABILITIES,
  getTenantCapabilities,
  type TenantCapability,
  type TenantCapabilityMap,
} from './tenantCapabilities.ts';
import {
  getSchedulingAvailability,
  toPublicSchedulingDto,
} from '../scheduling/availability.ts';

export type PublicPlatformCapabilitiesResponse = {
  tenant: {
    key: string;
    displayName: string;
    market: string;
    brand: string;
  };
  capabilities: TenantCapabilityMap;
  scheduling: {
    enabled: boolean;
    provider: string | null;
    eventTypeKey: string | null;
    publicBookingUrl: string | null;
  };
};

export function buildPublicPlatformCapabilities(
  source: SourceContext,
  env: NodeJS.ProcessEnv = process.env,
): PublicPlatformCapabilitiesResponse {
  const tenant = getTenantById(source.tenantId);
  if (!tenant) {
    throw new Error(`Unknown tenant ${source.tenantId}`);
  }
  const capabilities = getTenantCapabilities(source.tenantId) ?? {
    audit: false,
    forms: false,
    chat: false,
    conversion: false,
    scheduling: false,
  };
  const scheduling = toPublicSchedulingDto(getSchedulingAvailability(source, env));

  return {
    tenant: {
      key: tenant.tenantId,
      displayName: tenant.displayName,
      market: tenant.market,
      brand: tenant.brand,
    },
    capabilities,
    scheduling,
  };
}

export function listCapabilityKeys(): readonly TenantCapability[] {
  return ALL_TENANT_CAPABILITIES;
}
