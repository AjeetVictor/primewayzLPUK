import type { PlatformBrand, PlatformTenantId, PrimewayzMarket } from './sourceContext.ts';
import type { TenantCapabilityMap } from './tenantCapabilities.ts';
import type {
  TenantChatApprovedAnswers,
  TenantChatWidgetConfig,
  TenantQuickReplyProfile,
} from '../chat/tenantChatWidget.ts';
import {
  RRB_SILVER_APPROVED_ANSWERS,
  RRB_SILVER_CHAT_WIDGET,
  RRB_SILVER_OFFLINE_ACKNOWLEDGEMENT,
} from '../chat/tenantContent/rrbSilverCampaign.ts';

/** Public Chat visitor-facing copy that must stay tenant-owned (not UK-defaulted). */
export type TenantChatPresentation = {
  /** Explicit service-hours label; not inferred from market/timezone at runtime. */
  businessHours: string;
  /** Offline bot / follow-up team identity (e.g. "Primewayz UK team"). */
  teamLabel: string;
  /** Replaces the generic offline bot reply; `{businessHours}` is substituted. */
  offlineAcknowledgement?: string;
};

/** Neutral fallback when a tenant (or future client) has no explicit presentation config. */
export const NEUTRAL_CHAT_BUSINESS_HOURS = 'Mon-Fri, business hours';

/** Neutral team identity when tenant display metadata is unavailable. */
export const NEUTRAL_CHAT_TEAM_LABEL = 'our team';

/**
 * Neutral IANA fallback when a tenant has no explicit defaultTimeZone.
 * Used only when browser/request timezone is missing or invalid — not as visitor TZ.
 */
export const NEUTRAL_TENANT_TIMEZONE = 'UTC';

export type PlatformTenantConfig = {
  tenantId: PlatformTenantId;
  brand: PlatformBrand;
  market: PrimewayzMarket;
  sourceSite: string;
  displayName: string;
  active: boolean;
  /** Optional explicit activation flag; only the case-insensitive value true enables the tenant. */
  activationEnv?: string;
  allowedOrigins: readonly string[];
  /**
   * Env var holding extra comma-separated origins (preview / test hosts). Read per request so
   * an origin is registered or withdrawn by configuration, never by an assumed hostname.
   */
  allowedOriginsEnv?: string;
  /** Resolve only from a registered browser Origin; never from a no-Origin Host header. */
  browserOriginOnly?: boolean;
  notificationRecipientEnv?: string;
  capabilities: TenantCapabilityMap;
  /** Servicing-business IANA timezone; fallback when visitor timezone is unavailable. */
  defaultTimeZone?: string;
  chatPresentation?: TenantChatPresentation;
  chatWidget?: TenantChatWidgetConfig;
  chatApprovedAnswers?: TenantChatApprovedAnswers;
  quickReplyProfile?: TenantQuickReplyProfile;
};

/** Compatibility alias for existing imports. */
export type PrimewayzTenantConfig = PlatformTenantConfig;

const FULL_PLATFORM_CAPABILITIES: TenantCapabilityMap = {
  audit: true,
  forms: true,
  chat: true,
  conversion: true,
  scheduling: true,
};

const INACTIVE_MARKET_CAPABILITIES: TenantCapabilityMap = {
  audit: false,
  forms: false,
  chat: false,
  conversion: false,
  scheduling: false,
};

/**
 * Canonical active + inactive tenant registry.
 * CORS, Chat, Audit defaults, Admin filters, and notifications derive from this list.
 * Future clients (Digiblend, SRH, …) onboard here — do not invent production domains until known.
 */
export const PLATFORM_TENANTS: readonly PlatformTenantConfig[] = [
  {
    tenantId: 'pw-uk',
    brand: 'Primewayz',
    market: 'UK',
    sourceSite: 'uk.primewayz.com',
    displayName: 'Primewayz UK',
    active: true,
    allowedOrigins: ['https://uk.primewayz.com'],
    notificationRecipientEnv: 'INTERNAL_NOTIFICATION_EMAIL',
    capabilities: FULL_PLATFORM_CAPABILITIES,
    defaultTimeZone: 'Europe/London',
    chatPresentation: {
      businessHours: 'Mon-Fri, UK business hours',
      teamLabel: 'Primewayz UK team',
    },
  },
  {
    tenantId: 'pw-infotech',
    brand: 'Primewayz',
    market: 'IN',
    sourceSite: 'primewayz.com',
    displayName: 'Primewayz Infotech',
    active: true,
    allowedOrigins: ['https://primewayz.com', 'https://www.primewayz.com'],
    notificationRecipientEnv: 'PW_INFOTECH_NOTIFICATION_EMAIL',
    capabilities: FULL_PLATFORM_CAPABILITIES,
    defaultTimeZone: 'Asia/Kolkata',
    chatPresentation: {
      businessHours: 'Mon-Fri, India business hours',
      teamLabel: 'Primewayz Infotech team',
    },
  },
  {
    tenantId: 'rrb',
    brand: 'RentReadBuy',
    market: 'IN',
    sourceSite: 'rentreadbuy.com',
    displayName: 'RentReadBuy',
    active: true,
    allowedOrigins: ['https://rentreadbuy.com', 'https://www.rentreadbuy.com'],
    notificationRecipientEnv: 'RRB_NOTIFICATION_EMAIL',
    capabilities: {
      audit: false,
      forms: false,
      chat: true,
      conversion: false,
      scheduling: false,
    },
    defaultTimeZone: 'Asia/Kolkata',
    chatPresentation: {
      businessHours: 'Mon-Fri, India business hours',
      teamLabel: 'RentReadBuy team',
    },
  },
  {
    // Silver Membership campaign page. Separate from `rrb` so sessions, leads, operators and
    // notifications never mix. No origin is hardcoded until RentReadBuy approves the hostname.
    tenantId: 'rrb-silver-campaign',
    brand: 'RentReadBuy',
    market: 'IN',
    sourceSite: 'rentreadbuy-silver',
    displayName: 'RentReadBuy Silver Membership',
    active: true,
    activationEnv: 'RRB_SILVER_CAMPAIGN_ENABLED',
    allowedOrigins: [],
    allowedOriginsEnv: 'RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS',
    browserOriginOnly: true,
    notificationRecipientEnv: 'RRB_SILVER_CAMPAIGN_NOTIFICATION_EMAIL',
    capabilities: {
      audit: false,
      forms: false,
      chat: true,
      conversion: false,
      scheduling: false,
    },
    defaultTimeZone: 'Asia/Kolkata',
    chatPresentation: {
      businessHours: 'Mon-Fri, India business hours',
      teamLabel: 'RentReadBuy team',
      offlineAcknowledgement: RRB_SILVER_OFFLINE_ACKNOWLEDGEMENT,
    },
    chatWidget: RRB_SILVER_CHAT_WIDGET,
    chatApprovedAnswers: RRB_SILVER_APPROVED_ANSWERS,
    quickReplyProfile: 'reading_membership',
  },
  {
    tenantId: 'pw-us',
    brand: 'Primewayz',
    market: 'US',
    sourceSite: 'us.primewayz.com',
    displayName: 'Primewayz US',
    active: false,
    allowedOrigins: [],
    capabilities: INACTIVE_MARKET_CAPABILITIES,
  },
  {
    tenantId: 'pw-uae',
    brand: 'Primewayz',
    market: 'UAE',
    sourceSite: 'uae.primewayz.com',
    displayName: 'Primewayz UAE',
    active: false,
    allowedOrigins: [],
    capabilities: INACTIVE_MARKET_CAPABILITIES,
  },
  {
    tenantId: 'pw-mx',
    brand: 'Primewayz',
    market: 'MX',
    sourceSite: 'mx.primewayz.com',
    displayName: 'Primewayz Mexico',
    active: false,
    allowedOrigins: [],
    capabilities: INACTIVE_MARKET_CAPABILITIES,
  },
] as const;

/** @deprecated Prefer PLATFORM_TENANTS — kept for existing imports. */
export const PRIMEWAYZ_TENANTS = PLATFORM_TENANTS;

export function getTenantById(id: string): PlatformTenantConfig | undefined {
  return PLATFORM_TENANTS.find((tenant) => tenant.tenantId === id);
}

/** Missing, empty, or invalid activation values fail closed. */
export function isTenantActive(
  tenant: PlatformTenantConfig,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!tenant.active) return false;
  if (!tenant.activationEnv) return true;
  return env[tenant.activationEnv]?.trim().toLowerCase() === 'true';
}

/**
 * Exact origins only: https, or http://localhost / http://127.0.0.1 outside production.
 * No wildcards, paths, credentials, or origins already hardcoded for another tenant.
 */
export function parseTenantOriginList(
  raw: string | undefined,
  options: { allowLocalHttp: boolean; reservedOrigins?: readonly string[] },
): string[] {
  if (!raw) return [];
  const origins: string[] = [];
  for (const entry of raw.split(',')) {
    const candidate = entry.trim().replace(/\/$/, '');
    if (!candidate || candidate.includes('*')) continue;
    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      continue;
    }
    if (url.origin !== candidate) continue;
    const localHttp = url.protocol === 'http:'
      && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    if (url.protocol !== 'https:' && !(localHttp && options.allowLocalHttp)) continue;
    if (options.reservedOrigins?.includes(candidate)) continue;
    if (!origins.includes(candidate)) origins.push(candidate);
  }
  return origins;
}

/** Hardcoded origins plus any configured through the tenant's `allowedOriginsEnv`. */
export function getTenantAllowedOrigins(
  tenant: PlatformTenantConfig,
  env: NodeJS.ProcessEnv = process.env,
): readonly string[] {
  if (!tenant.allowedOriginsEnv) return tenant.allowedOrigins;
  const reservedOrigins = PLATFORM_TENANTS
    .filter((other) => other.tenantId !== tenant.tenantId)
    .flatMap((other) => [...other.allowedOrigins]);
  const configured = parseTenantOriginList(env[tenant.allowedOriginsEnv], {
    allowLocalHttp: env.NODE_ENV !== 'production',
    reservedOrigins,
  });
  return [...new Set([...tenant.allowedOrigins, ...configured])];
}

/**
 * A tenant can be offered in admin filters and grants only when it is active and has at
 * least one allowed origin. Activation without a usable origin is not operational.
 */
export function isTenantOperational(
  tenant: PlatformTenantConfig,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return isTenantActive(tenant, env) && getTenantAllowedOrigins(tenant, env).length > 0;
}

export type AdminTenantOption = {
  value: string;
  label: string;
};

export function getTenantByOrigin(
  origin: string,
  env: NodeJS.ProcessEnv = process.env,
): PlatformTenantConfig | undefined {
  return PLATFORM_TENANTS.find(
    (tenant) => isTenantActive(tenant, env) && getTenantAllowedOrigins(tenant, env).includes(origin),
  );
}

export function getTenantByHost(host: string): PlatformTenantConfig | undefined {
  return PLATFORM_TENANTS.find(
    (tenant) =>
      isTenantActive(tenant) &&
      !tenant.browserOriginOnly &&
      (tenant.sourceSite === host ||
        tenant.allowedOrigins.some((origin) => new URL(origin).hostname === host)),
  );
}

export function getTenantDisplayName(tenantId: string | null | undefined): string {
  if (!tenantId) return 'Legacy / unknown';
  return getTenantById(tenantId)?.displayName ?? 'Legacy / unknown';
}

/**
 * Resolve public Chat presentation for a tenant.
 * Unknown / future tenants without config get neutral business-hours + team labels.
 * Registered tenants without explicit teamLabel derive "<displayName> team".
 */
export function resolveTenantChatPresentation(
  tenantId: string | null | undefined,
): Omit<Required<TenantChatPresentation>, 'offlineAcknowledgement'> & { offlineAcknowledgement: string | null } {
  const tenant = tenantId ? getTenantById(tenantId) : undefined;
  const configured = tenant?.chatPresentation;
  return {
    businessHours: configured?.businessHours ?? NEUTRAL_CHAT_BUSINESS_HOURS,
    teamLabel:
      configured?.teamLabel ??
      (tenant?.displayName ? `${tenant.displayName} team` : NEUTRAL_CHAT_TEAM_LABEL),
    offlineAcknowledgement: configured?.offlineAcknowledgement ?? null,
  };
}

/** Approved answer for an intent, from the tenant's own config only. */
export function resolveTenantApprovedAnswer(
  tenantId: string | null | undefined,
  intentKey: string | null | undefined,
): string | null {
  if (!tenantId || !intentKey) return null;
  const answers = getTenantById(tenantId)?.chatApprovedAnswers;
  if (!answers || !Object.prototype.hasOwnProperty.call(answers, intentKey)) return null;
  return answers[intentKey] ?? null;
}

/**
 * Resolve servicing-business IANA timezone for a tenant.
 * Explicit registry config preferred; unconfigured / unknown tenants fall back to UTC.
 */
export function resolveTenantTimeZone(tenantId: string | null | undefined): string {
  const configured = tenantId ? getTenantById(tenantId)?.defaultTimeZone : undefined;
  return configured ?? NEUTRAL_TENANT_TIMEZONE;
}

/** Live admin filters: operational tenants only, plus All entities. Inactive markets stay registered but unselectable. */
export function getAdminTenantFilterOptions(env: NodeJS.ProcessEnv = process.env): AdminTenantOption[] {
  return [
    ...PLATFORM_TENANTS.filter((tenant) => isTenantOperational(tenant, env)).map((tenant) => ({
      value: tenant.tenantId,
      label: tenant.displayName,
    })),
    { value: 'all', label: 'All entities' },
  ];
}

/**
 * Empty-env snapshot for the client bundle. It cannot see server activation flags, so the
 * live admin UI must replace it with the authenticated server list.
 */
export const ADMIN_TENANT_FILTER_OPTIONS = getAdminTenantFilterOptions({});
