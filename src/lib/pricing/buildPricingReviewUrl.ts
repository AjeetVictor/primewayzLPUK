import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { FREE_REVIEW_SOURCE_QUERY_PARAM } from '../../constants/conversionCta';
import type { PricingPlanSlug } from '../../data/pricing/types';

/** Build the digital systems review URL from a pricing plan selection. */
export function buildPricingReviewUrl(planSlug: PricingPlanSlug): string {
  const params = new URLSearchParams({
    [FREE_REVIEW_SOURCE_QUERY_PARAM]: 'pricing',
    plan: planSlug,
  });
  return `${CANONICAL_ROUTES.digitalSystemsReview}?${params.toString()}`;
}
