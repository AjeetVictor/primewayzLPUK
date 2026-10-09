import { isPricingPlanSlug } from '../data/pricing/helpers';

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
  landingPagePath?: string;
  sourcePagePath?: string;
  submissionPagePath?: string;
  ctaPlacement?: string;
  selectedPlanSlug?: string;
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
  landingPagePath?: unknown;
  sourcePagePath?: unknown;
  submissionPagePath?: unknown;
  ctaPlacement?: unknown;
  selectedPlanSlug?: unknown;
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

function normaliseAttributionValue(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalised = value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, ATTRIBUTION_VALUE_MAX);
  if (
    !normalised
    || /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/.test(normalised)
    || /(?:\+?\d[\d\s().-]{7,}\d)/.test(normalised)
  ) return null;
  return normalised;
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
  if (
    !normalised
    || !normalised.startsWith('/')
    || normalised.startsWith('//')
    || normalised.includes('\\')
  ) return null;

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
  const landingPagePath = normaliseSourcePagePath(input.landingPagePath);
  const sourcePagePath = normaliseSourcePagePath(input.sourcePagePath);
  const submissionPagePath = normaliseSourcePagePath(input.submissionPagePath);
  const ctaPlacement = normaliseOptionalText(input.ctaPlacement, 80);
  const selectedPlanSlug = normaliseOptionalText(input.selectedPlanSlug, 64);

  const firstAttribution: ContactAttribution = {
    utm_source: normaliseAttributionValue(input.firstUtmSource),
    utm_medium: normaliseAttributionValue(input.firstUtmMedium),
    utm_campaign: normaliseAttributionValue(input.firstUtmCampaign),
    utm_content: normaliseAttributionValue(input.firstUtmContent),
    utm_term: normaliseAttributionValue(input.firstUtmTerm),
  };

  const latestAttribution: ContactAttribution = {
    utm_source: normaliseAttributionValue(input.latestUtmSource),
    utm_medium: normaliseAttributionValue(input.latestUtmMedium),
    utm_campaign: normaliseAttributionValue(input.latestUtmCampaign),
    utm_content: normaliseAttributionValue(input.latestUtmContent),
    utm_term: normaliseAttributionValue(input.latestUtmTerm),
  };

  if (serviceInterest) context.serviceInterest = serviceInterest;
  if (landingPagePath) context.landingPagePath = landingPagePath;
  if (sourcePagePath) context.sourcePagePath = sourcePagePath;
  if (submissionPagePath) context.submissionPagePath = submissionPagePath;
  if (ctaPlacement && /^[a-zA-Z0-9_-]+$/.test(ctaPlacement)) context.ctaPlacement = ctaPlacement;
  if (selectedPlanSlug && isPricingPlanSlug(selectedPlanSlug)) context.selectedPlanSlug = selectedPlanSlug;
  if (hasAttribution(firstAttribution)) context.firstAttribution = firstAttribution;
  if (hasAttribution(latestAttribution)) context.latestAttribution = latestAttribution;

  return context;
}
