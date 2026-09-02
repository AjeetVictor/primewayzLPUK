/**
 * Primewayz UK campaign identity dictionary — governance foundation (Phase 2A).
 *
 * Defines canonical campaign IDs and owned UTM vocabularies for future
 * Primewayz-generated campaigns. Does not alter inbound UTM capture or
 * existing attribution runtime behaviour.
 */

export const PRIMEWAYZ_UK_WORKSPACE_ID = 'PWUK' as const;

export const CAMPAIGN_SERVICE_CODES = {
  GEN: 'Primewayz UK / multi-service',
  DSR: 'Digital Systems Review',
  VIS: 'Website Visibility & SEO',
  MNT: 'Website Maintenance',
  CRM: 'CRM & Automation',
  SWE: 'Software & Product Engineering',
  CAP: 'Software Development Capacity',
  RIT: 'Remote IT Resources',
  AI: 'Custom AI Agent Development',
} as const;

export type CampaignServiceCode = keyof typeof CAMPAIGN_SERVICE_CODES;

export const OWNED_UTM_SOURCES = [
  'linkedin',
  'primewayz',
  'zoho',
  'google',
  'bing',
  'partner',
] as const;

export type OwnedUtmSource = typeof OWNED_UTM_SOURCES[number];

export const OWNED_UTM_MEDIUMS = [
  'organic-social',
  'paid-social',
  'email',
  'paid-search',
  'referral',
] as const;

export type OwnedUtmMedium = typeof OWNED_UTM_MEDIUMS[number];

/** Minimum supported campaign year (inclusive). */
export const CAMPAIGN_ID_YEAR_MIN = 2020;

/** Maximum supported campaign year (inclusive). */
export const CAMPAIGN_ID_YEAR_MAX = 2099;

/** Maximum length for utm_content slug identifiers. */
export const OWNED_UTM_CONTENT_MAX_LENGTH = 64;

/** Maximum length for optional utm_term values. */
export const OWNED_UTM_TERM_MAX_LENGTH = 128;

const SERVICE_CODE_PATTERN = Object.keys(CAMPAIGN_SERVICE_CODES).join('|');

const CANONICAL_CAMPAIGN_ID_PATTERN = new RegExp(
  `^${PRIMEWAYZ_UK_WORKSPACE_ID}-(${SERVICE_CODE_PATTERN})-(\\d{4})-(0[1-9]|[1-9][0-9])$`,
);

const OWNED_UTM_CONTENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const OWNED_UTM_TERM_PATTERN = /^[a-z0-9]+(?:[-_a-z0-9]+)*$/;

export type ParsedCanonicalCampaignId = {
  workspace: typeof PRIMEWAYZ_UK_WORKSPACE_ID;
  serviceCode: CampaignServiceCode;
  year: number;
  sequence: number;
};

export type OwnedCampaignUtmInput = {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term?: string;
};

export type OwnedCampaignUtmValidationError = {
  field: 'utm_source' | 'utm_medium' | 'utm_campaign' | 'utm_content' | 'utm_term';
  message: string;
};

export type OwnedCampaignUtmValidationResult = {
  valid: boolean;
  errors: OwnedCampaignUtmValidationError[];
};

export function isCampaignServiceCode(value: string): value is CampaignServiceCode {
  return Object.prototype.hasOwnProperty.call(CAMPAIGN_SERVICE_CODES, value);
}

export function isOwnedUtmSource(value: string): value is OwnedUtmSource {
  return (OWNED_UTM_SOURCES as readonly string[]).includes(value);
}

export function isOwnedUtmMedium(value: string): value is OwnedUtmMedium {
  return (OWNED_UTM_MEDIUMS as readonly string[]).includes(value);
}

export function isSupportedCampaignYear(year: number): boolean {
  return Number.isInteger(year) && year >= CAMPAIGN_ID_YEAR_MIN && year <= CAMPAIGN_ID_YEAR_MAX;
}

export function isCanonicalCampaignId(value: string): boolean {
  const match = CANONICAL_CAMPAIGN_ID_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[2]);
  return isSupportedCampaignYear(year);
}

export function buildCanonicalCampaignId(
  serviceCode: string,
  year: number,
  sequence: number,
): string {
  if (!isCampaignServiceCode(serviceCode)) {
    throw new Error(`Invalid campaign service code: ${serviceCode}`);
  }

  if (!isSupportedCampaignYear(year)) {
    throw new Error(`Campaign year must be between ${CAMPAIGN_ID_YEAR_MIN} and ${CAMPAIGN_ID_YEAR_MAX}`);
  }

  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 99) {
    throw new Error('Campaign sequence must be an integer between 1 and 99');
  }

  const sequencePart = String(sequence).padStart(2, '0');
  return `${PRIMEWAYZ_UK_WORKSPACE_ID}-${serviceCode}-${year}-${sequencePart}`;
}

export function parseCanonicalCampaignId(value: string): ParsedCanonicalCampaignId | null {
  const match = CANONICAL_CAMPAIGN_ID_PATTERN.exec(value);
  if (!match) return null;

  const serviceCode = match[1];
  if (!isCampaignServiceCode(serviceCode)) return null;

  const year = Number(match[2]);
  if (!isSupportedCampaignYear(year)) return null;

  const sequence = Number(match[3]);
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 99) return null;

  return {
    workspace: PRIMEWAYZ_UK_WORKSPACE_ID,
    serviceCode,
    year,
    sequence,
  };
}

export function isOwnedUtmContent(value: string): boolean {
  if (!value || value.length > OWNED_UTM_CONTENT_MAX_LENGTH) return false;
  return OWNED_UTM_CONTENT_PATTERN.test(value);
}

export function isOwnedUtmTerm(value: string): boolean {
  if (!value || value.length > OWNED_UTM_TERM_MAX_LENGTH) return false;
  return OWNED_UTM_TERM_PATTERN.test(value);
}

export function validateOwnedCampaignUtm(input: OwnedCampaignUtmInput): OwnedCampaignUtmValidationResult {
  const errors: OwnedCampaignUtmValidationError[] = [];

  if (!isOwnedUtmSource(input.utm_source)) {
    errors.push({
      field: 'utm_source',
      message: `utm_source must be one of: ${OWNED_UTM_SOURCES.join(', ')}`,
    });
  }

  if (!isOwnedUtmMedium(input.utm_medium)) {
    errors.push({
      field: 'utm_medium',
      message: `utm_medium must be one of: ${OWNED_UTM_MEDIUMS.join(', ')}`,
    });
  }

  if (!isCanonicalCampaignId(input.utm_campaign)) {
    errors.push({
      field: 'utm_campaign',
      message: 'utm_campaign must be a valid canonical Primewayz campaign ID (PWUK-{SERVICE}-{YYYY}-{NN})',
    });
  }

  if (!input.utm_content) {
    errors.push({
      field: 'utm_content',
      message: 'utm_content is required',
    });
  } else if (!isOwnedUtmContent(input.utm_content)) {
    errors.push({
      field: 'utm_content',
      message: 'utm_content must be a lowercase slug using letters, numbers, and hyphens',
    });
  }

  if (input.utm_term !== undefined && input.utm_term !== '') {
    if (!isOwnedUtmTerm(input.utm_term)) {
      errors.push({
        field: 'utm_term',
        message: 'utm_term must be a lowercase slug-like value within the maximum length',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
