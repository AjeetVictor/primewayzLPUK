export type UtmParams = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

const UTM_STORAGE_KEY = 'primewayz_utm_attribution';

export const WEB_PRESENCE_AUDIT_CAMPAIGN = 'web_presence_audit_launch';
export const WEB_PRESENCE_AUDIT_SECTION_ID = 'free-web-presence-audit';
export const WEB_PRESENCE_AUDIT_SECTION_ALIAS = 'web-presence-audit';

const EMPTY_UTM: UtmParams = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
};

function readUtmFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_content: params.get('utm_content'),
    utm_term: params.get('utm_term'),
  };
}

function hasUtmValues(utm: UtmParams): boolean {
  return Object.values(utm).some(Boolean);
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === 'undefined') return { ...EMPTY_UTM };

  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return { ...EMPTY_UTM };
    const parsed = JSON.parse(raw) as Partial<UtmParams>;
    return {
      utm_source: parsed.utm_source ?? null,
      utm_medium: parsed.utm_medium ?? null,
      utm_campaign: parsed.utm_campaign ?? null,
      utm_content: parsed.utm_content ?? null,
      utm_term: parsed.utm_term ?? null,
    };
  } catch {
    return { ...EMPTY_UTM };
  }
}

export function hasUtmInSearch(search: string): boolean {
  return hasUtmValues(readUtmFromSearch(search));
}

export function captureUtmParams(search?: string): UtmParams {
  if (typeof window === 'undefined') return { ...EMPTY_UTM };

  const fromUrl = readUtmFromSearch(search ?? window.location.search);
  if (hasUtmValues(fromUrl)) {
    const existing = getStoredUtmParams();
    if (!hasUtmValues(existing)) {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    return existing;
  }

  return getStoredUtmParams();
}

export function getUtmAnalyticsPayload(utm: UtmParams = getStoredUtmParams()): Record<string, string> {
  const payload: Record<string, string> = {};
  if (utm.utm_source) payload.utm_source = utm.utm_source;
  if (utm.utm_medium) payload.utm_medium = utm.utm_medium;
  if (utm.utm_campaign) payload.utm_campaign = utm.utm_campaign;
  if (utm.utm_content) payload.utm_content = utm.utm_content;
  if (utm.utm_term) payload.utm_term = utm.utm_term;
  return payload;
}

export function isWebPresenceAuditCampaign(utm: UtmParams = getStoredUtmParams()): boolean {
  return utm.utm_campaign === WEB_PRESENCE_AUDIT_CAMPAIGN;
}

export function scrollToWebPresenceAuditSection(): void {
  if (typeof document === 'undefined') return;

  const section = document.getElementById(WEB_PRESENCE_AUDIT_SECTION_ID)
    || document.getElementById(WEB_PRESENCE_AUDIT_SECTION_ALIAS);
  section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function buildWebPresenceAuditLaunchUrl(content = 'company_page_launch'): string {
  const params = new URLSearchParams({
    utm_source: 'linkedin',
    utm_medium: 'organic',
    utm_campaign: WEB_PRESENCE_AUDIT_CAMPAIGN,
    utm_content: content,
  });

  return `https://uk.primewayz.com/?${params.toString()}#${WEB_PRESENCE_AUDIT_SECTION_ALIAS}`;
}
