export type UtmParams = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

const UTM_STORAGE_KEY = 'primewayz_utm_attribution';
const FIRST_UTM_STORAGE_KEY = 'primewayz_first_utm_attribution';
const LATEST_UTM_STORAGE_KEY = 'primewayz_latest_utm_attribution';

export const WEB_PRESENCE_AUDIT_CAMPAIGN = 'web_presence_audit_launch';
export const WEB_PRESENCE_AUDIT_SECTION_ID = 'free-web-presence-audit';
export const WEB_PRESENCE_AUDIT_SECTION_ALIAS = 'web-presence-audit';

export const REMOTE_RESOURCE_CAMPAIGN = 'remote_resource_augmentation';

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

function readStoredUtm(key: string): UtmParams {
  if (typeof window === 'undefined') return { ...EMPTY_UTM };

  try {
    const raw = window.sessionStorage.getItem(key);
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

function writeStoredUtm(key: string, utm: UtmParams): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, JSON.stringify(utm));
}

/** @deprecated Use getFirstUtmParams for first-touch attribution. */
export function getStoredUtmParams(): UtmParams {
  return getFirstUtmParams();
}

export function getFirstUtmParams(): UtmParams {
  const first = readStoredUtm(FIRST_UTM_STORAGE_KEY);
  if (hasUtmValues(first)) return first;

  const legacy = readStoredUtm(UTM_STORAGE_KEY);
  if (hasUtmValues(legacy)) {
    writeStoredUtm(FIRST_UTM_STORAGE_KEY, legacy);
    return legacy;
  }

  return { ...EMPTY_UTM };
}

export function getLatestUtmParams(): UtmParams {
  const latest = readStoredUtm(LATEST_UTM_STORAGE_KEY);
  if (hasUtmValues(latest)) return latest;
  return getFirstUtmParams();
}

export function hasUtmInSearch(search: string): boolean {
  return hasUtmValues(readUtmFromSearch(search));
}

export function captureUtmParams(search?: string): UtmParams {
  if (typeof window === 'undefined') return { ...EMPTY_UTM };

  const fromUrl = readUtmFromSearch(search ?? window.location.search);
  if (!hasUtmValues(fromUrl)) {
    return getFirstUtmParams();
  }

  const first = getFirstUtmParams();
  if (!hasUtmValues(first)) {
    writeStoredUtm(FIRST_UTM_STORAGE_KEY, fromUrl);
    writeStoredUtm(UTM_STORAGE_KEY, fromUrl);
  }

  writeStoredUtm(LATEST_UTM_STORAGE_KEY, fromUrl);

  return getFirstUtmParams();
}

export function getUtmAnalyticsPayload(utm: UtmParams = getFirstUtmParams()): Record<string, string> {
  const payload: Record<string, string> = {};
  if (utm.utm_source) payload.utm_source = utm.utm_source;
  if (utm.utm_medium) payload.utm_medium = utm.utm_medium;
  if (utm.utm_campaign) payload.utm_campaign = utm.utm_campaign;
  if (utm.utm_content) payload.utm_content = utm.utm_content;
  if (utm.utm_term) payload.utm_term = utm.utm_term;
  return payload;
}

export function getFullUtmAnalyticsPayload(): Record<string, string> {
  const first = getFirstUtmParams();
  const latest = getLatestUtmParams();
  const payload: Record<string, string> = {
    ...getUtmAnalyticsPayload(first),
  };

  if (latest.utm_source) payload.latest_utm_source = latest.utm_source;
  if (latest.utm_medium) payload.latest_utm_medium = latest.utm_medium;
  if (latest.utm_campaign) payload.latest_utm_campaign = latest.utm_campaign;
  if (latest.utm_content) payload.latest_utm_content = latest.utm_content;
  if (latest.utm_term) payload.latest_utm_term = latest.utm_term;

  if (first.utm_source) payload.first_utm_source = first.utm_source;
  if (first.utm_medium) payload.first_utm_medium = first.utm_medium;
  if (first.utm_campaign) payload.first_utm_campaign = first.utm_campaign;
  if (first.utm_content) payload.first_utm_content = first.utm_content;
  if (first.utm_term) payload.first_utm_term = first.utm_term;

  return payload;
}

export function buildInternalUtmUrl(
  path: string,
  medium: string,
  campaign: string,
  content: string,
): string {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const [basePath, existingQuery] = pathWithoutHash.split('?');
  const params = new URLSearchParams(existingQuery || '');
  params.set('utm_source', 'website');
  params.set('utm_medium', medium);
  params.set('utm_campaign', campaign);
  params.set('utm_content', content);
  return `${basePath}?${params.toString()}${hash}`;
}

export function isWebPresenceAuditCampaign(utm: UtmParams = getFirstUtmParams()): boolean {
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
