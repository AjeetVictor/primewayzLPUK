/**
 * Central conversion CTA configuration for Priority 3 digital systems review.
 * Site-wide CTA wiring is reserved for Phase 2 — do not import into Navbar/Hero/Footer yet.
 */

import { BOOK_CALL_URL } from './contactBooking.ts';
import { CANONICAL_ROUTES } from './canonicalRoutes.ts';

/** Primary review CTA label. */
export const FREE_REVIEW_CTA_LABEL = 'Request a free digital systems review' as const;

/** Secondary discovery-call CTA label. */
export const DISCOVERY_CALL_CTA_LABEL = 'Book a discovery call' as const;

/** Website checker CTA label. */
export const WEBSITE_CHECKER_CTA_LABEL = 'Run the free website visibility check' as const;

/** Landing route for the free digital systems review form. */
export const FREE_REVIEW_ROUTE = CANONICAL_ROUTES.digitalSystemsReview;

/** Post-submit thank-you route. */
export const FREE_REVIEW_THANK_YOU_ROUTE = CANONICAL_ROUTES.digitalSystemsReviewThankYou;

/** Discovery-call destination (existing booking helper). */
export const DISCOVERY_CALL_DESTINATION = BOOK_CALL_URL;

/** Website visibility checker destination. */
export const WEBSITE_CHECKER_DESTINATION = CANONICAL_ROUTES.freeAudit;

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

/** Phase 2 CTA rollout files — do not update in Priority 3 foundation. */
export const PHASE2_CTA_ROLLOUT_FILES = [
  'src/components/Navbar.tsx',
  'src/components/Hero.tsx',
  'src/components/hero/HeroPromoJourney.tsx',
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
