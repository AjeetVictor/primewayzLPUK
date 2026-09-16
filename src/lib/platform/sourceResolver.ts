/**
 * Trusted source resolution for the shared multi-tenant service platform.
 *
 * Browser calls: derive tenant from exact registered Origin.
 * No-Origin S2S calls: fall back to registered Host only (not X-Forwarded-Host).
 *
 * Current S2S limitation (documented, non-blocking for browser integrations):
 * authenticated S2S token→tenant mapping is future hardening. Until then, no-Origin
 * callers must present a canonical registered Host; body fields never override identity.
 * campaignId remains attribution data only — never tenant identity.
 */

import type { PrimewayzSourceChannel, SourceContext } from './sourceContext.ts';
import { getTenantByHost, getTenantByOrigin, getTenantById } from './tenantRegistry.ts';
import { tenantSupportsCapability, type TenantCapability } from './tenantCapabilities.ts';

export class SourceResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceResolutionError';
  }
}

const FORBIDDEN_BODY_KEYS = ['tenantId', 'market', 'sourceSite', 'sourceOrigin', 'sourceChannel'] as const;

export function resolveSourceContext(input: {
  origin?: string;
  host?: string;
  /** Intentionally unused — X-Forwarded-Host must never drive tenant identity. */
  forwardedHost?: string;
  sourceChannel: PrimewayzSourceChannel;
  body?: unknown;
  allowLocalDevelopment?: boolean;
  campaignId?: string;
}): SourceContext {
  if (input.body && typeof input.body === 'object' && !Array.isArray(input.body)) {
    const body = input.body as Record<string, unknown>;
    if (FORBIDDEN_BODY_KEYS.some((key) => Object.prototype.hasOwnProperty.call(body, key))) {
      throw new SourceResolutionError('Source identity fields are controlled by the server.');
    }
  }
  const origin = input.origin?.trim().replace(/\/$/, '');
  let tenant = origin ? getTenantByOrigin(origin) : undefined;
  if (origin && !tenant && input.allowLocalDevelopment && /^https?:\/\/localhost(?::\d+)?$/.test(origin)) {
    tenant = getTenantById('pw-uk');
  }
  if (!origin) {
    // Use only the direct Host header value passed by the server. Never trust forwardedHost.
    const host = input.host?.trim().toLowerCase().replace(/:\d+$/, '');
    tenant = host ? getTenantByHost(host) : undefined;
    if (!tenant && input.allowLocalDevelopment && (host === 'localhost' || host === '127.0.0.1')) {
      tenant = getTenantById('pw-uk');
    }
  }
  if (!tenant || !tenant.active) {
    throw new SourceResolutionError('Request source is not a registered platform property.');
  }
  return {
    tenantId: tenant.tenantId,
    brand: tenant.brand,
    market: tenant.market,
    sourceSite: tenant.sourceSite,
    sourceOrigin: origin,
    sourceChannel: input.sourceChannel,
    campaignId: input.campaignId,
  };
}

export function assertSourceOwnership(
  existingTenantId: string | null | undefined,
  source: SourceContext,
): void {
  if (existingTenantId && existingTenantId !== source.tenantId) {
    throw new SourceResolutionError('This record belongs to a different platform entity.');
  }
}

/**
 * Chat sessions stamp SourceContext once. Follow-up messages/appointments/attachments
 * inherit that ownership. Legacy (null tenant) sessions stay UK-conservative and cannot
 * be claimed by another active entity.
 */
export function assertChatSessionTenantAccess(
  existingTenantId: string | null | undefined,
  source: SourceContext,
): void {
  if (!existingTenantId && source.tenantId !== 'pw-uk') {
    throw new SourceResolutionError(
      'Legacy chat ownership cannot be reassigned to another platform entity.',
    );
  }
  assertSourceOwnership(existingTenantId, source);
}

/** Reject when the resolved tenant does not expose the required public capability. */
export function assertTenantCapability(
  source: SourceContext,
  capability: TenantCapability,
): void {
  if (!tenantSupportsCapability(source.tenantId, capability)) {
    throw new SourceResolutionError(
      `Capability "${capability}" is not enabled for this tenant.`,
    );
  }
}
