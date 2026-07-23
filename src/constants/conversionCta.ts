/**
 * Central conversion CTA configuration for Priority 3 digital systems review.
 * Phase 2A: homepage Hero + closing. Phase 2B: services hub + core service pages.
 */

import { BOOK_CALL_URL } from './contactBooking.ts';
import { CANONICAL_ROUTES } from './canonicalRoutes.ts';

/** Primary review CTA label. */
export const FREE_REVIEW_CTA_LABEL = 'Request a free digital systems review' as const;

/** Secondary discovery-call CTA label. */
export const DISCOVERY_CALL_CTA_LABEL = 'Book a discovery call' as const;

/** Website checker CTA label. */
export const WEBSITE_CHECKER_CTA_LABEL = 'Run the free website visibility check' as const;

/** Allowlisted query key for CTA → review source handoff (no PII). */
export const FREE_REVIEW_SOURCE_QUERY_PARAM = 'review_source' as const;

/** Allowlisted query key for CTA → review service-area preselection (no PII). */
export const FREE_REVIEW_SERVICE_QUERY_PARAM = 'review_service' as const;

/** Landing route for the free digital systems review form. */
export const FREE_REVIEW_ROUTE = CANONICAL_ROUTES.digitalSystemsReview;

/** Post-submit thank-you route. */
export const FREE_REVIEW_THANK_YOU_ROUTE = CANONICAL_ROUTES.digitalSystemsReviewThankYou;

/** Discovery-call destination (existing booking helper). */
export const DISCOVERY_CALL_DESTINATION = BOOK_CALL_URL;

/** Website visibility checker destination. */
export const WEBSITE_CHECKER_DESTINATION = CANONICAL_ROUTES.freeAudit;

/** General contact destination (unchanged /contact-us). */
export const GENERAL_CONTACT_DESTINATION = CANONICAL_ROUTES.contact;

/** Approved service-area values for the review form. */
export const FREE_REVIEW_SERVICE_AREAS = [
  'Website Visibility & Conversion',
  'CRM & Workflow Automation',
  'Software & Product Engineering',
  'Managed Application & Website Support',
  'Remote IT Team Extension',
  'Not sure yet',
] as const;

export type FreeReviewServiceArea = (typeof FREE_REVIEW_SERVICE_AREAS)[number];

/** Approved preferred-next-step values. */
export const FREE_REVIEW_PREFERRED_NEXT_STEPS = [
  'Email me the recommended next step',
  'Arrange a short discovery call',
] as const;

export type FreeReviewPreferredNextStep = (typeof FREE_REVIEW_PREFERRED_NEXT_STEPS)[number];

/**
 * Allowed source-location values for attribution.
 * Phase 2 may wire CTAs to these; the review page uses digital_systems_review_page.
 */
export const FREE_REVIEW_SOURCE_LOCATIONS = [
  'digital_systems_review_page',
  'chat_widget',
  'homepage',
  'navigation',
  'footer',
  'services_page',
  'service_page',
  'success_story',
  'article',
  'website_checker',
] as const;

export type FreeReviewSourceLocation = (typeof FREE_REVIEW_SOURCE_LOCATIONS)[number];

export const DEFAULT_FREE_REVIEW_SOURCE_LOCATION: FreeReviewSourceLocation =
  'digital_systems_review_page';

/** Approved CTA placement values for analytics (no PII). */
export const FREE_REVIEW_CTA_PLACEMENTS = [
  'homepage_hero_primary',
  'homepage_hero_secondary',
  'homepage_closing_primary',
  'homepage_closing_secondary',
  'homepage_hero_website_checker',
  'services_hero_primary',
  'services_hero_secondary',
  'services_final_primary',
  'services_final_secondary',
  'website_visibility_hero_primary',
  'website_visibility_hero_secondary',
  'website_visibility_final_primary',
  'website_visibility_final_secondary',
  'managed_support_hero_primary',
  'managed_support_hero_secondary',
  'managed_support_final_primary',
  'managed_support_final_secondary',
  'crm_hero_primary',
  'crm_hero_secondary',
  'crm_final_primary',
  'crm_final_secondary',
  'software_review_primary',
  'software_review_secondary',
  'remote_it_hero_primary',
  'remote_it_hero_secondary',
  'remote_it_final_primary',
  'remote_it_final_secondary',
  'success_stories_listing_primary',
  'success_stories_listing_secondary',
  'success_story_hero_primary',
  'success_story_hero_secondary',
  'success_story_final_primary',
  'success_story_final_secondary',
  'blog_article_primary',
  'blog_article_secondary',
  'sdaas_supporting_article_primary',
  'sdaas_supporting_article_secondary',
] as const;

export type FreeReviewCtaPlacement = (typeof FREE_REVIEW_CTA_PLACEMENTS)[number];

const SOURCE_LOCATION_SET = new Set<string>(FREE_REVIEW_SOURCE_LOCATIONS);
const SERVICE_AREA_SET = new Set<string>(FREE_REVIEW_SERVICE_AREAS);

/**
 * Resolve an untrusted review_source query value to an allowlisted sourceLocation.
 * Invalid, empty, repeated, URL-like or malformed values fall back to the page default.
 */
export function resolveFreeReviewSourceLocation(
  value: unknown,
): FreeReviewSourceLocation {
  if (value == null) return DEFAULT_FREE_REVIEW_SOURCE_LOCATION;
  if (Array.isArray(value)) {
    if (value.length !== 1) return DEFAULT_FREE_REVIEW_SOURCE_LOCATION;
    return resolveFreeReviewSourceLocation(value[0]);
  }
  if (typeof value !== 'string') return DEFAULT_FREE_REVIEW_SOURCE_LOCATION;

  const trimmed = value.trim();
  if (!trimmed) return DEFAULT_FREE_REVIEW_SOURCE_LOCATION;

  // Reject URLs, protocol-relative, paths, encoding tricks, spaces, and junk.
  if (
    trimmed.length > 80
    || /[:/?#\\@]/.test(trimmed)
    || trimmed.includes('..')
    || trimmed.includes('%')
    || /\s/.test(trimmed)
    || trimmed.includes(',')
    || trimmed.includes('&')
    || trimmed.includes('=')
  ) {
    return DEFAULT_FREE_REVIEW_SOURCE_LOCATION;
  }

  if (!SOURCE_LOCATION_SET.has(trimmed)) {
    return DEFAULT_FREE_REVIEW_SOURCE_LOCATION;
  }

  return trimmed as FreeReviewSourceLocation;
}

/**
 * Resolve an untrusted review_service query value to an allowlisted service area.
 * Invalid values return null (no preselection) without affecting source resolution.
 */
export function resolveFreeReviewServiceArea(
  value: unknown,
): FreeReviewServiceArea | null {
  if (value == null) return null;
  if (Array.isArray(value)) return null;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  // Reject URLs, protocol-relative paths, and path traversal.
  if (
    trimmed.length > 120
    || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
    || trimmed.startsWith('//')
    || trimmed.includes('://')
    || trimmed.includes('..')
    || /[\\?#]/.test(trimmed)
  ) {
    return null;
  }

  if (!SERVICE_AREA_SET.has(trimmed)) {
    return null;
  }

  return trimmed as FreeReviewServiceArea;
}

/**
 * Build a relative free-review CTA URL with safe review_source / review_service handoff.
 * Canonical route remains FREE_REVIEW_ROUTE (query-free) for SEO; CTAs may add params.
 */
export function buildFreeReviewCtaUrl(
  sourceLocation: FreeReviewSourceLocation,
  serviceArea?: FreeReviewServiceArea | null,
): string {
  const resolved = resolveFreeReviewSourceLocation(sourceLocation);
  const resolvedService =
    serviceArea === undefined || serviceArea === null
      ? null
      : resolveFreeReviewServiceArea(serviceArea);

  const params = new URLSearchParams();
  if (resolved !== DEFAULT_FREE_REVIEW_SOURCE_LOCATION) {
    params.set(FREE_REVIEW_SOURCE_QUERY_PARAM, resolved);
  }
  if (resolvedService) {
    params.set(FREE_REVIEW_SERVICE_QUERY_PARAM, resolvedService);
  }

  const query = params.toString();
  return query ? `${FREE_REVIEW_ROUTE}?${query}` : FREE_REVIEW_ROUTE;
}

/** Remaining Phase 2 CTA surfaces — not wired in Phase 2A/2B/2C. */
export const PHASE2_CTA_ROLLOUT_FILES = [
  'src/components/Navbar.tsx',
  'src/components/hero/HeroSplitSlider.tsx',
  'src/components/hero/HeroContentSlider.tsx',
  'src/components/Footer.tsx',
  'src/components/LiveChat.tsx',
  'src/components/LazyLiveChat.tsx',
  'About CTAs',
] as const;
