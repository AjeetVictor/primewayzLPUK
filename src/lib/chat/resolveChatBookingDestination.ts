/**
 * Resolve chat booking destinations through the tenant-aware Scheduling service.
 * Shared Chat/platform paths must never hardcode the UK discovery destination.
 */

import { DISCOVERY_CALL_DESTINATION } from '../../constants/conversionCta.ts';

export type ChatBookingDestinationInput = {
  tenantId: string | null | undefined;
  canBookCall: boolean;
  publicBookingUrl: string | null | undefined;
};

/**
 * Returns a booking href only when scheduling is enabled for the resolved tenant.
 *
 * - RRB / capability-disabled → null (no UK leakage)
 * - Infotech without active config → null
 * - Infotech with config → Infotech publicBookingUrl
 * - pw-uk → UK contact-page discovery presentation (intentionally UK-owned UX)
 */
export function resolveChatBookingDestination(
  input: ChatBookingDestinationInput,
): string | null {
  if (!input.canBookCall) return null;
  if (!input.publicBookingUrl) return null;

  if (input.tenantId === 'pw-uk') {
    return DISCOVERY_CALL_DESTINATION;
  }

  // Never inherit UK discovery destination for other tenants.
  return input.publicBookingUrl;
}

export function isUkDiscoveryDestination(href: string | null | undefined): boolean {
  return href === DISCOVERY_CALL_DESTINATION;
}
