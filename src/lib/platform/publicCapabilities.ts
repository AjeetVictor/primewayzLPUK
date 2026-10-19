/**
 * Safe public platform capabilities DTO builder.
 * Never exposes secrets, webhook keys, or internal provider URIs.
 */

import type { TenantChatWidgetConfig } from '../chat/tenantChatWidget.ts';
import type { EffectiveTenantChatDecision } from './tenantChatEntitlement.ts';
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
  /** Present only for tenants with tenant-owned chat branding; absent keeps widget defaults. */
  chatWidget?: TenantChatWidgetConfig;
};

export function buildPublicPlatformCapabilities(
  source: SourceContext,
  env: NodeJS.ProcessEnv = process.env,
  presentation?: { displayName: string; capabilities: TenantCapabilityMap },
): PublicPlatformCapabilitiesResponse {
  const tenant = getTenantById(source.tenantId);
  if (!tenant) {
    if (!presentation) throw new Error(`Unknown tenant ${source.tenantId}`);
    return {
      tenant: {
        key: source.tenantId,
        displayName: presentation.displayName,
        market: source.market,
        brand: source.brand,
      },
      capabilities: presentation.capabilities,
      scheduling: toPublicSchedulingDto(getSchedulingAvailability(source, env)),
    };
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
    ...(tenant.chatWidget && capabilities.chat ? { chatWidget: tenant.chatWidget } : {}),
  };
}

export function listCapabilityKeys(): readonly TenantCapability[] {
  return ALL_TENANT_CAPABILITIES;
}

/**
 * Overlay the central chat decision onto the public capabilities DTO.
 * An allow leaves the compile-time map unchanged. A deny clears chat only
 * and drops tenant chat branding, matching the existing chatWidget rule.
 */
export function applyEffectiveChatToCapabilities(
  response: PublicPlatformCapabilitiesResponse,
  decision: EffectiveTenantChatDecision,
): PublicPlatformCapabilitiesResponse {
  if (decision.allowed) return response;
  const capabilities = { ...response.capabilities, chat: false };
  if (!response.chatWidget) return { ...response, capabilities };
  const { chatWidget: _chatWidget, ...withoutWidget } = response;
  return { ...withoutWidget, capabilities };
}
