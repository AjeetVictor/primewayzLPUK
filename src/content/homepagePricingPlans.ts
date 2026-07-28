import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';

export const HOMEPAGE_SELECTED_PLAN_KEY = 'primewayz_selected_plan';

export type HomepagePricingPlanId =
  | 'foundation-sprint'
  | 'essential'
  | 'growth'
  | 'maintenance-mode';

export type HomepagePricingBillingPeriod = 'one_time' | 'monthly';

export type HomepagePricingPlan = {
  id: HomepagePricingPlanId;
  name: string;
  priceLabel: string;
  /** Display price string including currency symbol (no billing suffix). */
  price: string;
  /** Numeric price for analytics (no currency formatting). */
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

export const homepagePricingPlans: HomepagePricingPlan[] = [
  {
    id: 'foundation-sprint',
    name: 'Foundation Sprint',
    priceLabel: '2026 launch price',
    price: '£722.50',
    displayedPrice: 722.5,
    billing: 'one-time',
    billingPeriod: 'one_time',
    description:
      'A structured starting phase for discovery, planning, setup and launch readiness.',
    capacity: '2–4 week structured launch phase',
    capacityDetail: '',
    inclusions: [
      'Requirements and priority review',
      'Technical and delivery baseline',
      'Recommended launch or improvement plan',
    ],
    bestFor: 'Best for businesses that need clarity before committing to ongoing delivery.',
    ctaLabel: 'Discuss a Foundation Sprint',
    href: `${CANONICAL_ROUTES.pricing}?plan=foundation-sprint`,
  },
  {
    id: 'essential',
    name: 'Essential',
    priceLabel: 'Starting from',
    price: '£741',
    displayedPrice: 741,
    billing: '/month',
    billingPeriod: 'monthly',
    description:
      'Focused monthly capacity for website, CMS, technical SEO and controlled improvements.',
    capacity: 'Up to 40 hours/month',
    capacityDetail: '1 active workstream',
    inclusions: [
      'Website and CMS improvements',
      'Light integrations and updates',
      'Technical SEO and performance work',
    ],
    bestFor: 'Best for businesses with one clearly prioritised stream of ongoing work.',
    ctaLabel: 'Explore Essential',
    href: `${CANONICAL_ROUTES.pricing}?plan=essential`,
  },
  {
    id: 'growth',
    name: 'Growth',
    priceLabel: 'Starting from',
    price: '£1,189',
    displayedPrice: 1189,
    billing: '/month',
    billingPeriod: 'monthly',
    description:
      'Broader monthly capacity for growing platforms, conversion work, CRM and coordinated improvements.',
    capacity: 'Up to 80 hours/month',
    capacityDetail: 'Multiple workstreams',
    inclusions: [
      'Platform enhancements and optimisation',
      'Landing-page and conversion improvements',
      'CRM and light API integrations',
    ],
    bestFor: 'Best for businesses managing several connected digital priorities.',
    ctaLabel: 'Explore Growth',
    href: `${CANONICAL_ROUTES.pricing}?plan=growth`,
    recommended: true,
  },
  {
    id: 'maintenance-mode',
    name: 'Maintenance Mode',
    priceLabel: 'Starting from',
    price: '£405',
    displayedPrice: 405,
    billing: '/month',
    billingPeriod: 'monthly',
    description:
      'Lower-capacity support for stable websites and applications that require continuity rather than active development.',
    capacity: '8–10 hours/month',
    capacityDetail: 'Focused continuity support',
    inclusions: [
      'Routine updates and fixes',
      'Security and performance checks',
      'Stability and continuity support',
    ],
    bestFor: 'Best for established systems requiring dependable light-touch support.',
    ctaLabel: 'Explore Maintenance',
    href: `${CANONICAL_ROUTES.pricing}?plan=maintenance-mode`,
  },
];

export const HOMEPAGE_PRICING_SMALL_PRINT =
  'Prices exclude VAT. Third-party costs such as hosting, domains, software tools, subscriptions and advertising spend are billed separately. Final scope and the recommended engagement route are confirmed after reviewing requirements.';

export const HOMEPAGE_PRICING_SECTION_NAME = 'homepage_pricing';
