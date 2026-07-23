/**
 * Central conversion CTA configuration for Priority 3 digital systems review.
 * Phase 2A wires homepage Hero + closing section only — not Navbar/Footer/chat/site-wide yet.
 */

import { BOOK_CALL_URL } from './contactBooking.ts';
import { CANONICAL_ROUTES } from './canonicalRoutes.ts';

/** Primary review CTA label. */
export const FREE_REVIEW_CTA_LABEL = 'Request a free digital systems review' as const;

/** Secondary discovery-call CTA label. */
export const DISCOVERY_CALL_CTA_LABEL = 'Book a discovery call' as const;

/** Website checker CTA label. */
export const WEBSITE_CHECKER_CTA_LABEL = 'Run the free website visibility check' as const;

/** Allowlisted query key for homepage → review source handoff (no PII). */
export const FREE_REVIEW_SOURCE_QUERY_PARAM = 'review_source' as const;

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

/** Approved homepage CTA placement values for analytics (no PII). */
export const FREE_REVIEW_CTA_PLACEMENTS = [
  'homepage_hero_primary',
  'homepage_hero_secondary',
  'homepage_closing_primary',
  'homepage_closing_secondary',
  'homepage_hero_website_checker',
] as const;

export type FreeReviewCtaPlacement = (typeof FREE_REVIEW_CTA_PLACEMENTS)[number];

const SOURCE_LOCATION_SET = new Set<string>(FREE_REVIEW_SOURCE_LOCATIONS);

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
 * Build a relative free-review CTA URL with a safe review_source handoff param.
 * Canonical route remains FREE_REVIEW_ROUTE (query-free) for SEO; CTAs may add the param.
 */
export function buildFreeReviewCtaUrl(
  sourceLocation: FreeReviewSourceLocation,
): string {
  const resolved = resolveFreeReviewSourceLocation(sourceLocation);
  if (resolved === DEFAULT_FREE_REVIEW_SOURCE_LOCATION) {
    return FREE_REVIEW_ROUTE;
  }
  const params = new URLSearchParams();
  params.set(FREE_REVIEW_SOURCE_QUERY_PARAM, resolved);
  return `${FREE_REVIEW_ROUTE}?${params.toString()}`;
}

/** Remaining Phase 2 CTA surfaces — not wired in Phase 2A. */
export const PHASE2_CTA_ROLLOUT_FILES = [
  'src/components/Navbar.tsx',
  'src/components/hero/HeroSplitSlider.tsx',
  'src/components/hero/HeroContentSlider.tsx',
  'src/components/Footer.tsx',
  'src/components/LiveChat.tsx',
  'src/components/LazyLiveChat.tsx',
  'service-page primary CTAs',
  'success-story CTAs',
  'blog / article CTAs',
  'About CTAs',
] as const;
