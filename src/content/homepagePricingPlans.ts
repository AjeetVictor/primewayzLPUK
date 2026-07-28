import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import {
  getActivePricingPlans,
  getPricingPolicyVersion,
  PRICING_COMMERCIAL_POLICY,
  type PricingPlanSlug,
} from '../data/pricing/helpers';

export const HOMEPAGE_SELECTED_PLAN_KEY = 'primewayz_selected_plan';

/** @deprecated Use PricingPlanSlug from data/pricing — kept for backward compatibility. */
export type HomepagePricingPlanId = PricingPlanSlug;

export type HomepagePricingBillingPeriod = 'one_time' | 'monthly';

export type HomepagePricingPlan = {
  id: PricingPlanSlug;
  name: string;
  priceLabel: string;
  price: string;
  displayedPrice: number;
  billing: string;
  billingPeriod: HomepagePricingBillingPeriod;
  description: string;
  capacity: string;
  capacityDetail: string;
  inclusions: string[];
  bestFor: string;
  ctaLabel: string;
  href: string;
  recommended?: boolean;
};

function mapBillingPeriod(period: string): HomepagePricingBillingPeriod {
  return period === 'one_off' ? 'one_time' : 'monthly';
}

/** Homepage preview plans — derived from canonical pricing registry. */
export const homepagePricingPlans: HomepagePricingPlan[] = getActivePricingPlans()
  .filter((plan) => plan.slug !== 'scale' && plan.slug !== 'enterprise')
  .map((plan) => ({
    id: plan.slug,
    name: plan.name,
    priceLabel: plan.slug === 'foundation-sprint' ? '2026 launch price' : 'Starting from',
    price: plan.displayedPrice,
    displayedPrice: (plan.numericPriceMinor ?? 0) / 100,
    billing: plan.billingPeriod === 'one_off' ? 'one-time' : '/month',
    billingPeriod: mapBillingPeriod(plan.billingPeriod),
    description: plan.shortDescription,
    capacity: plan.capacityLabel ?? '',
    capacityDetail:
      plan.slug === 'essential'
        ? '1 active workstream'
        : plan.slug === 'growth'
          ? 'Multiple workstreams'
          : plan.slug === 'maintenance-mode'
            ? 'Focused continuity support'
            : '',
    inclusions: plan.inclusions.slice(0, 3),
    bestFor: plan.bestFor[0] ?? '',
    ctaLabel: plan.ctaLabel,
    href: `${CANONICAL_ROUTES.pricing}?plan=${plan.slug}`,
    recommended: plan.featured,
  }));

export const HOMEPAGE_PRICING_SMALL_PRINT = PRICING_COMMERCIAL_POLICY.vatTreatment
  + ' '
  + PRICING_COMMERCIAL_POLICY.thirdPartyCostPolicy
  + ' Final scope and the recommended engagement route are confirmed after reviewing requirements.';

export const HOMEPAGE_PRICING_SECTION_NAME = 'homepage_pricing';

export const HOMEPAGE_PRICING_POLICY_VERSION = getPricingPolicyVersion();
