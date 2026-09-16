/**
 * Env-backed Scheduling connection registry.
 * Database SchedulingConnection rows are additive for future OAuth / multi-event configs.
 * Tenant ownership is always derived from this mapping — never from webhook/browser tenantId.
 */

import { DEFAULT_PW_UK_CALENDLY_BOOKING_URL } from './calendlyDefaults.ts';
import type { SchedulingConnectionRef, SchedulingEventTypeRef, SchedulingProviderId } from './types.ts';

const DEFAULT_UK_EVENT: SchedulingEventTypeRef = {
  key: 'discovery_call',
  label: 'Discovery call',
  active: true,
  providerEventTypeUri: null,
  publicBookingUrl: DEFAULT_PW_UK_CALENDLY_BOOKING_URL,
};

function envOrNull(env: NodeJS.ProcessEnv, key: string): string | null {
  const value = env[key]?.trim();
  return value || null;
}

function buildEnvConnection(input: {
  connectionKey: string;
  tenantId: string;
  provider: SchedulingProviderId;
  env: NodeJS.ProcessEnv;
  publicBookingUrl: string | null;
  eventTypeKey: string;
  eventLabel: string;
  clientSideAnalyticsOwned: boolean;
  webhookSigningSecretEnv: string;
  providerUserUriEnv: string;
  providerOrganizationUriEnv: string;
}): { connection: SchedulingConnectionRef; eventTypes: SchedulingEventTypeRef[] } | null {
  const enabledFlag = envOrNull(input.env, `SCHEDULING_${input.tenantId.toUpperCase().replace(/-/g, '_')}_ENABLED`);
  const hasBookingUrl = Boolean(input.publicBookingUrl);
  // UK defaults enabled when booking URL exists; other tenants require explicit enable + URL.
  const enabled =
    input.tenantId === 'pw-uk'
      ? enabledFlag !== 'false' && hasBookingUrl
      : enabledFlag === 'true' && hasBookingUrl;

  if (!enabled) return null;

  return {
    connection: {
      connectionKey: input.connectionKey,
      tenantId: input.tenantId,
      provider: input.provider,
      status: 'active',
      credentialMode: 'environment',
      providerOrganizationUri: envOrNull(input.env, input.providerOrganizationUriEnv),
      providerUserUri: envOrNull(input.env, input.providerUserUriEnv),
      webhookSigningSecretEnv: input.webhookSigningSecretEnv,
      clientSideAnalyticsOwned: input.clientSideAnalyticsOwned,
    },
    eventTypes: [
      {
        key: input.eventTypeKey,
        label: input.eventLabel,
        active: true,
        providerEventTypeUri: envOrNull(
          input.env,
          `SCHEDULING_${input.tenantId.toUpperCase().replace(/-/g, '_')}_EVENT_TYPE_URI`,
        ),
        publicBookingUrl: input.publicBookingUrl,
      },
    ],
  };
}

export type ResolvedSchedulingConfig = {
  connection: SchedulingConnectionRef;
  eventTypes: SchedulingEventTypeRef[];
};

/** Resolve env-backed scheduling config for a tenant (null when not configured / disabled). */
export function resolveEnvSchedulingConfig(
  tenantId: string,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedSchedulingConfig | null {
  if (tenantId === 'pw-uk') {
    const bookingUrl =
      envOrNull(env, 'SCHEDULING_PW_UK_PUBLIC_BOOKING_URL') || DEFAULT_UK_EVENT.publicBookingUrl;
    return buildEnvConnection({
      connectionKey: 'pw-uk-calendly-default',
      tenantId: 'pw-uk',
      provider: 'CALENDLY',
      env,
      publicBookingUrl: bookingUrl,
      eventTypeKey: envOrNull(env, 'SCHEDULING_PW_UK_EVENT_TYPE_KEY') || 'discovery_call',
      eventLabel: envOrNull(env, 'SCHEDULING_PW_UK_EVENT_TYPE_LABEL') || 'Discovery call',
      clientSideAnalyticsOwned: true,
      webhookSigningSecretEnv: 'CALENDLY_WEBHOOK_SIGNING_KEY',
      providerUserUriEnv: 'SCHEDULING_PW_UK_CALENDLY_USER_URI',
      providerOrganizationUriEnv: 'SCHEDULING_PW_UK_CALENDLY_ORG_URI',
    });
  }

  if (tenantId === 'pw-infotech') {
    const bookingUrl = envOrNull(env, 'SCHEDULING_PW_INFOTECH_PUBLIC_BOOKING_URL');
    return buildEnvConnection({
      connectionKey: 'pw-infotech-calendly-default',
      tenantId: 'pw-infotech',
      provider: 'CALENDLY',
      env,
      publicBookingUrl: bookingUrl,
      eventTypeKey: envOrNull(env, 'SCHEDULING_PW_INFOTECH_EVENT_TYPE_KEY') || 'consultation',
      eventLabel: envOrNull(env, 'SCHEDULING_PW_INFOTECH_EVENT_TYPE_LABEL') || 'Consultation',
      clientSideAnalyticsOwned: false,
      webhookSigningSecretEnv: 'CALENDLY_WEBHOOK_SIGNING_KEY',
      providerUserUriEnv: 'SCHEDULING_PW_INFOTECH_CALENDLY_USER_URI',
      providerOrganizationUriEnv: 'SCHEDULING_PW_INFOTECH_CALENDLY_ORG_URI',
    });
  }

  return null;
}

/** Map a single provider ownership URI to the owning connection (server-side only). */
export function findEnvConnectionByProviderUri(
  providerUri: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
): ResolvedSchedulingConfig | null {
  if (!providerUri) return null;
  return findEnvConnectionByProviderUris([providerUri], env);
}

/**
 * Map any of the payload ownership URIs (user and/or organization) to a connection.
 * Payload tenantId / metadata never participates — only configured connection URIs.
 */
export function findEnvConnectionByProviderUris(
  providerUris: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): ResolvedSchedulingConfig | null {
  const normalized = [
    ...new Set(
      providerUris
        .map((uri) => (typeof uri === 'string' ? uri.trim() : ''))
        .filter(Boolean),
    ),
  ];
  if (normalized.length === 0) return null;

  for (const tenantId of ['pw-uk', 'pw-infotech'] as const) {
    const config = resolveEnvSchedulingConfig(tenantId, env);
    if (!config) continue;
    const { providerOrganizationUri, providerUserUri } = config.connection;
    for (const providerUri of normalized) {
      if (
        (providerOrganizationUri && providerUri === providerOrganizationUri) ||
        (providerUserUri && providerUri === providerUserUri)
      ) {
        return config;
      }
    }
  }
  return null;
}

export function listEnvSchedulingConfigs(env: NodeJS.ProcessEnv = process.env): ResolvedSchedulingConfig[] {
  return (['pw-uk', 'pw-infotech'] as const)
    .map((tenantId) => resolveEnvSchedulingConfig(tenantId, env))
    .filter((item): item is ResolvedSchedulingConfig => Boolean(item));
}
