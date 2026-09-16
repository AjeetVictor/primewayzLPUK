/**
 * Public Scheduling availability resolver.
 * Chat and client frontends must use this — never hardcode tenant Calendly URLs in generic Chat logic.
 */

import type { SourceContext } from '../platform/sourceContext.ts';
import { tenantSupportsCapability } from '../platform/tenantCapabilities.ts';
import { resolveEnvSchedulingConfig } from './connectionRegistry.ts';
import type { PublicSchedulingAvailability } from './types.ts';

export function getSchedulingAvailability(
  source: Pick<SourceContext, 'tenantId'>,
  env: NodeJS.ProcessEnv = process.env,
): PublicSchedulingAvailability {
  if (!tenantSupportsCapability(source.tenantId, 'scheduling')) {
    return {
      enabled: false,
      provider: null,
      eventTypeKey: null,
      publicBookingUrl: null,
      canBookFromChat: false,
    };
  }

  const config = resolveEnvSchedulingConfig(source.tenantId, env);
  if (!config || config.connection.status !== 'active') {
    return {
      enabled: false,
      provider: null,
      eventTypeKey: null,
      publicBookingUrl: null,
      canBookFromChat: false,
    };
  }

  const eventType = config.eventTypes.find((item) => item.active) ?? null;
  const publicBookingUrl = eventType?.publicBookingUrl ?? null;
  const enabled = Boolean(publicBookingUrl);

  return {
    enabled,
    provider: enabled ? (config.connection.provider.toLowerCase() as PublicSchedulingAvailability['provider']) : null,
    eventTypeKey: enabled ? eventType?.key ?? null : null,
    publicBookingUrl: enabled ? publicBookingUrl : null,
    canBookFromChat: enabled,
  };
}

/** Safe public DTO — never includes secrets or internal provider URIs. */
export function toPublicSchedulingDto(
  availability: PublicSchedulingAvailability,
): {
  enabled: boolean;
  provider: string | null;
  eventTypeKey: string | null;
  publicBookingUrl: string | null;
} {
  return {
    enabled: availability.enabled,
    provider: availability.provider,
    eventTypeKey: availability.eventTypeKey,
    publicBookingUrl: availability.publicBookingUrl,
  };
}
