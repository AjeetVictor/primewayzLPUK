export const CONTACT_SUPPORT_AREAS = [
  'Website updates & maintenance',
  'Technical SEO & visibility',
  'CRM & automation',
  'Integrations & systems',
  'Monthly digital support',
  'Software / product delivery',
  'Other',
] as const;

export type ContactSupportArea = (typeof CONTACT_SUPPORT_AREAS)[number];

export interface ContactEnquiryCommercialContext {
  serviceInterest?: ContactSupportArea;
  sourcePagePath?: string;
  firstAttribution?: ContactAttribution;
  latestAttribution?: ContactAttribution;
}

interface ContactAttribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

interface ContactEnquiryContextInput {
  supportArea?: unknown;
  sourcePagePath?: unknown;
  firstUtmSource?: unknown;
  firstUtmMedium?: unknown;
  firstUtmCampaign?: unknown;
  firstUtmContent?: unknown;
  firstUtmTerm?: unknown;
  latestUtmSource?: unknown;
  latestUtmMedium?: unknown;
  latestUtmCampaign?: unknown;
  latestUtmContent?: unknown;
  latestUtmTerm?: unknown;
}

const ATTRIBUTION_VALUE_MAX = 160;
const SOURCE_PAGE_PATH_MAX = 240;

function normaliseOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;

  const normalised = value.trim();
  if (!normalised) return null;

  return normalised.slice(0, maxLength);
}

function normaliseSupportArea(value: unknown): ContactSupportArea | null {
  const normalised = normaliseOptionalText(value, 80);
  if (!normalised) return null;

  return CONTACT_SUPPORT_AREAS.includes(normalised as ContactSupportArea)
    ? (normalised as ContactSupportArea)
    : null;
}

function normaliseSourcePagePath(value: unknown): string | null {
  const normalised = normaliseOptionalText(value, SOURCE_PAGE_PATH_MAX);
  if (!normalised || !normalised.startsWith('/')) return null;

  return normalised.split(/[?#]/, 1)[0] || null;
}

function hasAttribution(attribution: ContactAttribution): boolean {
  return Object.values(attribution).some(value => value !== null);
}

export function buildContactEnquiryCommercialContext(
  input: ContactEnquiryContextInput,
): ContactEnquiryCommercialContext {
  const context: ContactEnquiryCommercialContext = {};

  const serviceInterest = normaliseSupportArea(input.supportArea);
  const sourcePagePath = normaliseSourcePagePath(input.sourcePagePath);

  const firstAttribution: ContactAttribution = {
    utm_source: normaliseOptionalText(input.firstUtmSource, ATTRIBUTION_VALUE_MAX),
    utm_medium: normaliseOptionalText(input.firstUtmMedium, ATTRIBUTION_VALUE_MAX),
    utm_campaign: normaliseOptionalText(input.firstUtmCampaign, ATTRIBUTION_VALUE_MAX),
    utm_content: normaliseOptionalText(input.firstUtmContent, ATTRIBUTION_VALUE_MAX),
    utm_term: normaliseOptionalText(input.firstUtmTerm, ATTRIBUTION_VALUE_MAX),
  };

  const latestAttribution: ContactAttribution = {
    utm_source: normaliseOptionalText(input.latestUtmSource, ATTRIBUTION_VALUE_MAX),
    utm_medium: normaliseOptionalText(input.latestUtmMedium, ATTRIBUTION_VALUE_MAX),
    utm_campaign: normaliseOptionalText(input.latestUtmCampaign, ATTRIBUTION_VALUE_MAX),
    utm_content: normaliseOptionalText(input.latestUtmContent, ATTRIBUTION_VALUE_MAX),
    utm_term: normaliseOptionalText(input.latestUtmTerm, ATTRIBUTION_VALUE_MAX),
  };

  if (serviceInterest) context.serviceInterest = serviceInterest;
  if (sourcePagePath) context.sourcePagePath = sourcePagePath;
  if (hasAttribution(firstAttribution)) context.firstAttribution = firstAttribution;
  if (hasAttribution(latestAttribution)) context.latestAttribution = latestAttribution;

  return context;
}
