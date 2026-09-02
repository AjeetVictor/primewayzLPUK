/**
 * Deterministic attribution rules for SEO conversion aggregation.
 *
 * Rules (documented):
 * 1. First-touch reporting uses the earliest reliable landing page per journey.
 * 2. Last-touch reporting uses the latest explicit page path where available.
 * 3. Source/medium from UTM fields or lead first/latest touch columns when present.
 * 4. Organic classification requires explicit organic medium or organic search channel evidence.
 *    Owned social mediums (for example organic-social) classify as social, not organic search.
 * 5. Direct traffic is never treated as organic without supporting source/medium evidence.
 * 6. Qualification is not inferred from email presence alone for review leads.
 * 7. Journeys dedupe on journeyReference, sessionReference, then chatSessionId.
 * 8. Missing landing page increments unknownAttributionCount rather than guessing.
 */

import type { SeoAttributionModel } from './conversionTaxonomies.ts';
import { normaliseSeoPageUrl } from './seoUrlNormalization.ts';

export type TouchAttribution = {
  source: string | null;
  medium: string | null;
};

export type ResolvedAttribution = {
  landingPageUrl: string | null;
  seoPageId: number | null;
  channelGroup: string;
  isUnknownLanding: boolean;
};

const ORGANIC_MEDIUMS = new Set(['organic']);
const SOCIAL_MEDIUMS = new Set(['organic-social']);
const PAID_MEDIUMS = new Set(['cpc', 'ppc', 'paid', 'paidsearch', 'paid-search', 'paid-social']);
const EMAIL_MEDIUMS = new Set(['email']);

export function classifyChannelGroup(source: string | null, medium: string | null): string {
  const s = (source ?? '').trim().toLowerCase();
  const m = (medium ?? '').trim().toLowerCase();

  if (!s && !m) return 'unknown';
  if (ORGANIC_MEDIUMS.has(m)) return 'organic';
  if (s === 'google' && m === 'organic') return 'organic';
  if (s === 'bing' && m === 'organic') return 'organic';
  if (SOCIAL_MEDIUMS.has(m)) return 'social';
  if (PAID_MEDIUMS.has(m)) return 'paid';
  if (EMAIL_MEDIUMS.has(m)) return 'email';
  if (m === 'referral') return 'referral';
  if (s === '(direct)' || m === '(none)' || s === 'direct') return 'direct';
  return 'unknown';
}

export function isReliableOrganicEvidence(source: string | null, medium: string | null): boolean {
  return classifyChannelGroup(source, medium) === 'organic';
}

export function buildJourneyDedupKey(input: {
  journeyReference?: string | null;
  sessionReference?: string | null;
  chatSessionId?: string | null;
  fallbackId: string;
}): string {
  const journey = input.journeyReference?.trim();
  if (journey) return `journey:${journey}`;
  const session = input.sessionReference?.trim();
  if (session) return `session:${session}`;
  const chat = input.chatSessionId?.trim();
  if (chat) return `chat:${chat}`;
  return `record:${input.fallbackId}`;
}

export function pickLandingPageForModel(
  model: SeoAttributionModel,
  pages: { first?: string | null; last?: string | null },
): string | null {
  const candidate = model === 'first_touch' ? pages.first : pages.last ?? pages.first;
  if (!candidate?.trim()) return null;
  return candidate.trim();
}

export function resolveLandingAttribution(
  observedUrl: string | null,
  source: string | null,
  medium: string | null,
  seoPageLookup?: (url: string) => number | null | Promise<number | null>,
): Promise<ResolvedAttribution> | ResolvedAttribution {
  if (!observedUrl) {
    return {
      landingPageUrl: null,
      seoPageId: null,
      channelGroup: classifyChannelGroup(source, medium),
      isUnknownLanding: true,
    };
  }

  const normalised = normaliseSeoPageUrl(observedUrl);
  if (!normalised.ok) {
    return {
      landingPageUrl: null,
      seoPageId: null,
      channelGroup: classifyChannelGroup(source, medium),
      isUnknownLanding: true,
    };
  }

  const base: ResolvedAttribution = {
    landingPageUrl: normalised.canonicalUrl,
    seoPageId: null,
    channelGroup: classifyChannelGroup(source, medium),
    isUnknownLanding: false,
  };

  if (!seoPageLookup) return base;

  return Promise.resolve(seoPageLookup(normalised.canonicalUrl)).then((seoPageId) => ({
    ...base,
    seoPageId,
  }));
}

export function extractUtmFromJson(value: unknown): TouchAttribution {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { source: null, medium: null };
  }
  const record = value as Record<string, unknown>;
  const source =
    typeof record.utm_source === 'string'
      ? record.utm_source
      : typeof record.source === 'string'
        ? record.source
        : null;
  const medium =
    typeof record.utm_medium === 'string'
      ? record.utm_medium
      : typeof record.medium === 'string'
        ? record.medium
        : null;
  return { source, medium };
}

export function toMetricDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function enumerateMetricDatesInclusive(dateFrom: string, dateTo: string): string[] {
  const days: string[] = [];
  let cursor = dateFrom;
  while (cursor <= dateTo) {
    days.push(cursor);
    const next = new Date(`${cursor}T00:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next.toISOString().slice(0, 10);
  }
  return days;
}
