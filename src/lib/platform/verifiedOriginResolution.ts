/**
 * Database-managed origin identity for public chat and capabilities.
 * A verified origin names its own tenant. An unverified origin names nobody.
 * Catalog origins stay first, so a commercial row cannot take over a compile-time property.
 * Lifecycle and entitlement are a later gate. This lookup only answers who proved the origin.
 */

import { TenantChatEntitlementUnavailableError } from './tenantChatEntitlement.ts';
import { rememberRuntimeTenantCapabilities } from './tenantCapabilities.ts';
import { isMissingTenantRegistryError, parseExactOrigin, type TenantAccountRecord } from './tenantAccountModel.ts';
import type { TenantAccountStore } from './tenantAccountStore.ts';
import { resolveSourceContext, SourceResolutionError } from './sourceResolver.ts';
import type { PlatformBrand, PrimewayzMarket, PrimewayzSourceChannel, SourceContext } from './sourceContext.ts';

export type VerifiedOriginLookup = Pick<TenantAccountStore, 'findOriginByValue' | 'gate' | 'findAccount'>;

export type VerifiedTenantOrigin =
  | { availability: 'ready'; tenantId: string; account: TenantAccountRecord }
  | { availability: 'unavailable' }
  | null;

const MARKETS: readonly PrimewayzMarket[] = ['UK', 'IN', 'US', 'UAE', 'MX', 'OTHER'];

export function sourceContextFromVerifiedAccount(input: {
  account: TenantAccountRecord;
  origin: string;
  sourceChannel: PrimewayzSourceChannel;
  campaignId?: string;
}): SourceContext {
  const market = MARKETS.find((entry) => entry === input.account.market) ?? 'OTHER';
  const brand: PlatformBrand = input.account.brand === 'Primewayz' || input.account.brand === 'RentReadBuy' || input.account.brand === 'Customer'
    ? input.account.brand
    : 'Customer';
  return {
    tenantId: input.account.tenantId,
    brand,
    market,
    sourceSite: new URL(input.origin).host,
    sourceOrigin: input.origin,
    sourceChannel: input.sourceChannel,
    campaignId: input.campaignId,
  };
}

/**
 * Verified rows resolve even when the account is draft, suspended, or archived.
 * The shared chat gate closes those states. Pending and failed rows resolve to nobody.
 * A missing registry table is the pre-migration path and stays "no origin".
 * Any other read failure is unavailable, never a successful unknown origin.
 */
export async function lookupVerifiedTenantOrigin(
  store: VerifiedOriginLookup,
  origin: string,
  options: { allowLocalHttp: boolean },
): Promise<VerifiedTenantOrigin> {
  const exact = parseExactOrigin(origin, options.allowLocalHttp);
  if (!exact) return null;
  let row;
  try {
    row = await store.findOriginByValue(exact);
  } catch (err) {
    if (isMissingTenantRegistryError(err)) return null;
    return { availability: 'unavailable' };
  }
  if (!row || row.verificationStatus !== 'verified') return null;
  try {
    const gate = await store.gate(row.tenantId);
    if (gate.availability === 'unavailable') return { availability: 'unavailable' };
    if (gate.availability !== 'ready') return null;
    const account = await store.findAccount(row.tenantId);
    if (!account || account.tenantId !== row.tenantId) return null;
    return { availability: 'ready', tenantId: account.tenantId, account };
  } catch (err) {
    if (isMissingTenantRegistryError(err)) return null;
    return { availability: 'unavailable' };
  }
}

/**
 * Compile-time Origin and Host win. A verified database origin is used only when
 * the catalog does not already own the request. Body identity fields still fail closed.
 */
export async function resolvePublicTenantSource(input: {
  origin?: string;
  host?: string;
  forwardedHost?: string;
  sourceChannel: PrimewayzSourceChannel;
  body?: unknown;
  allowLocalDevelopment?: boolean;
  campaignId?: string;
  store: VerifiedOriginLookup;
}): Promise<SourceContext> {
  try {
    return resolveSourceContext({
      origin: input.origin,
      host: input.host,
      forwardedHost: input.forwardedHost,
      sourceChannel: input.sourceChannel,
      body: input.body,
      allowLocalDevelopment: input.allowLocalDevelopment,
      campaignId: input.campaignId,
    });
  } catch (error) {
    if (!(error instanceof SourceResolutionError) || error.message.includes('controlled by the server')) throw error;
    const origin = input.origin?.trim().replace(/\/$/, '');
    if (!origin) throw error;
    const verified = await lookupVerifiedTenantOrigin(input.store, origin, {
      allowLocalHttp: Boolean(input.allowLocalDevelopment),
    });
    if (!verified) throw error;
    if (verified.availability === 'unavailable') throw new TenantChatEntitlementUnavailableError();
    rememberRuntimeTenantCapabilities(verified.account.tenantId, verified.account.capabilities);
    return sourceContextFromVerifiedAccount({
      account: verified.account,
      origin,
      sourceChannel: input.sourceChannel,
      campaignId: input.campaignId,
    });
  }
}
