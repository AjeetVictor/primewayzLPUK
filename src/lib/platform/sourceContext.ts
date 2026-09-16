export type PrimewayzTenantId = 'pw-uk' | 'pw-infotech' | 'pw-us' | 'pw-uae' | 'pw-mx';
export type PrimewayzMarket = 'UK' | 'IN' | 'US' | 'UAE' | 'MX';
export type PrimewayzSourceChannel = 'website-audit' | 'chat' | 'contact-form' | 'booking' | 'digital-systems-review' | 'conversion' | 'admin' | 'other';

export type SourceContext = {
  tenantId: PrimewayzTenantId;
  brand: 'Primewayz';
  market: PrimewayzMarket;
  sourceSite: string;
  sourceOrigin?: string;
  sourceChannel: PrimewayzSourceChannel;
  campaignId?: string;
};

export type PersistedSourceContext = Pick<SourceContext, 'tenantId' | 'market' | 'sourceSite' | 'sourceChannel'> & {
  sourceOrigin: string | null;
  campaignId: string | null;
};

export function toPersistedSourceContext(context: SourceContext): PersistedSourceContext {
  return {
    tenantId: context.tenantId,
    market: context.market,
    sourceSite: context.sourceSite,
    sourceOrigin: context.sourceOrigin ?? null,
    sourceChannel: context.sourceChannel,
    campaignId: context.campaignId ?? null,
  };
}

export function defaultUkSourceContext(sourceChannel: PrimewayzSourceChannel): SourceContext {
  return { tenantId: 'pw-uk', brand: 'Primewayz', market: 'UK', sourceSite: 'uk.primewayz.com', sourceChannel };
}
