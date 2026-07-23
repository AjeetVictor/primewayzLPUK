import { REVIEW_FIELD_LIMITS } from '../../constants/digitalSystemsReview.ts';

const ALLOWED_ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

export type SafeTouchAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

/** Shape returned by getFirstUtmParams / getLatestUtmParams. */
export type ClientUtmParams = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
};

function collapseSingleLine(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimAttributionValue(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const collapsed = collapseSingleLine(value).slice(0, REVIEW_FIELD_LIMITS.utmMax);
  return collapsed || undefined;
}

/**
 * Map client UTM utility output into the approved attribution object.
 * Drops null/empty values; never copies personal form fields.
 */
export function mapClientUtmParamsToAttribution(
  utm: Partial<ClientUtmParams> | null | undefined,
): SafeTouchAttribution | null {
  if (!utm || typeof utm !== 'object') return null;
  const normalized: SafeTouchAttribution = {};
  for (const key of ALLOWED_ATTRIBUTION_KEYS) {
    const trimmed = trimAttributionValue(utm[key] ?? undefined);
    if (trimmed) normalized[key] = trimmed;
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

/**
 * Normalize optional first/latest touch attribution objects.
 * Rejects arrays and unexpected nested objects; returns null for empty/absent.
 */
export function normalizeTouchAttribution(
  value: unknown,
  fieldLabel: string,
): SafeTouchAttribution | null {
  if (value === undefined || value === null || value === '') return null;

  if (Array.isArray(value)) {
    throw new Error(`${fieldLabel} must be an object, not an array.`);
  }

  if (typeof value !== 'object') {
    throw new Error(`${fieldLabel} must be an object.`);
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);

  if (keys.length > REVIEW_FIELD_LIMITS.attributionObjectMaxKeys) {
    throw new Error(`${fieldLabel} contains too many fields.`);
  }

  for (const key of keys) {
    if (!(ALLOWED_ATTRIBUTION_KEYS as readonly string[]).includes(key)) {
      throw new Error(`${fieldLabel} contains unsupported fields.`);
    }
    const entry = record[key];
    if (entry === null || entry === undefined) continue;
    if (typeof entry !== 'string') {
      throw new Error(`${fieldLabel}.${key} must be a string.`);
    }
  }

  const normalized: SafeTouchAttribution = {};
  for (const key of ALLOWED_ATTRIBUTION_KEYS) {
    const trimmed = trimAttributionValue(record[key]);
    if (trimmed) normalized[key] = trimmed;
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function formatAttributionSummary(
  first: SafeTouchAttribution | null | undefined,
  latest: SafeTouchAttribution | null | undefined,
): string {
  const formatOne = (label: string, touch: SafeTouchAttribution | null | undefined) => {
    if (!touch) return `${label}: not provided`;
    const parts = ALLOWED_ATTRIBUTION_KEYS
      .map((key) => (touch[key] ? `${key}=${touch[key]}` : null))
      .filter((part): part is string => Boolean(part));
    return parts.length > 0 ? `${label}: ${parts.join(', ')}` : `${label}: not provided`;
  };

  return [formatOne('First touch', first), formatOne('Latest touch', latest)].join('\n');
}

export { ALLOWED_ATTRIBUTION_KEYS, collapseSingleLine };
