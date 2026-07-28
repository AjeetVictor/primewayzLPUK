import type {
  PricingEngagementCategoryDefinition,
  PricingPlanDefinition,
  PricingPlanSlug,
} from './types';

const GBP_MINOR = (pounds: number): number => Math.round(pounds * 100);

/** Canonical pricing registry — the only approved source for plan names, prices and capacities. */
export const PRICING_PLANS: readonly PricingPlanDefinition[] = [
  {
    slug: 'foundation-sprint',
    name: 'Foundation Sprint',
    engagementType: 'foundation',
    displayedPrice: '£722.50',
    numericPriceMinor: GBP_MINOR(722.5),
    currency: 'GBP',
    billingPeriod: 'one_off',
    billingLabel: 'one-time',
    shortDescription:
      'A structured starting phase for discovery, planning, setup and launch readiness.',
    capacityLabel: '2–4 week structured launch phase',
    bestFor: [
      'Businesses that need clarity before committing to ongoing delivery',
      'New website or platform starts',
      'Launch preparation and technical baseline',
    ],
    inclusions: [
      'Requirements and priority review',
      'Technical and delivery baseline',
      'Recommended launch or improvement plan',
    ],
    exclusions: [
      'Full production implementation unless agreed in writing',
      'Complex integrations or data migration',
    ],
    importantBoundary:
      'Exact deliverables are confirmed in the engagement summary or proposal — not every identified feature is guaranteed.',
    active: true,
    displayOrder: 1,
    ctaLabel: 'Start with Foundation Sprint',
    launchDiscountLabel: '15% Launch Discount',
    referencePriceLabel: '£850 one-time',
  },
  {
    slug: 'essential',
    name: 'Essential',
    engagementType: 'recurring_delivery',
    displayedPrice: '£741',
    numericPriceMinor: GBP_MINOR(741),
    currency: 'GBP',
    billingPeriod: 'monthly',
    billingLabel: '/month',
    capacityLabel: 'Up to 40 hours/month',
    capacityHours: 40,
    shortDescription:
      'Focused monthly capacity for website, CMS, technical SEO and controlled improvements.',
    bestFor: [
      'Businesses with one clearly prioritised stream of ongoing work',
      'Core website and CMS improvements',
    ],
    inclusions: [
      'Website and CMS improvements',
      'Light integrations and updates',
      'Technical SEO and performance work',
      'Product management and delivery coordination',
      'QA and standard testing',
      'Scheduled meetings and progress reporting',
    ],
    exclusions: ['Third-party licence and hosting costs'],
    importantBoundary: 'Capacity is multidisciplinary — not unlimited development hours.',
    active: true,
    displayOrder: 2,
    ctaLabel: 'Choose Essential',
    launchDiscountLabel: '22% Launch Discount',
    referencePriceLabel: '£950',
  },
  {
    slug: 'growth',
    name: 'Growth',
    engagementType: 'recurring_delivery',
    displayedPrice: '£1,189',
    numericPriceMinor: GBP_MINOR(1189),
    currency: 'GBP',
    billingPeriod: 'monthly',
    billingLabel: '/month',
    capacityLabel: 'Up to 80 hours/month',
    capacityHours: 80,
    shortDescription:
      'Broader monthly capacity for growing platforms, conversion work, CRM and coordinated improvements.',
    bestFor: [
      'Businesses managing several connected digital priorities',
      'Growing platforms and conversion work',
    ],
    inclusions: [
      'Platform enhancements and optimisation',
      'Landing-page and conversion improvements',
      'CRM and light API integrations',
      'Product management, UX, development and QA',
      'Deployment and delivery reporting',
    ],
    exclusions: ['Third-party licence and hosting costs'],
    featured: true,
    active: true,
    displayOrder: 3,
    ctaLabel: 'Choose Growth',
    launchDiscountLabel: '18% Launch Discount',
    referencePriceLabel: '£1,450',
  },
  {
    slug: 'scale',
    name: 'Scale',
    engagementType: 'recurring_delivery',
    displayedPrice: '£2,100',
    numericPriceMinor: GBP_MINOR(2100),
    currency: 'GBP',
    billingPeriod: 'monthly',
    billingLabel: '/month',
    capacityLabel: 'Up to 120 hours/month',
    capacityHours: 120,
    shortDescription:
      'Broader delivery capacity for structured digital operations and product work.',
    bestFor: [
      'Broader digital operations and portals',
      'Workflow automation and backend/frontend coordination',
    ],
    inclusions: [
      'Structured delivery capacity across multiple workstreams',
      'Portals, dashboards and workflow automation',
      'Product management, UX, development and QA',
    ],
    exclusions: ['Third-party licence and hosting costs'],
    active: true,
    displayOrder: 4,
    ctaLabel: 'Choose Scale',
    launchDiscountLabel: '16% Launch Discount',
    referencePriceLabel: '£2,500',
  },
  {
    slug: 'maintenance-mode',
    name: 'Maintenance Mode',
    engagementType: 'maintenance',
    displayedPrice: '£405',
    numericPriceMinor: GBP_MINOR(405),
    currency: 'GBP',
    billingPeriod: 'monthly',
    billingLabel: '/month',
    capacityLabel: '8–10 hours/month',
    capacityHours: 10,
    shortDescription:
      'Lower-capacity support for stable websites and applications that require continuity rather than active development.',
    bestFor: [
      'Established systems requiring dependable light-touch support',
      'Stable websites needing fixes, updates and operational care',
    ],
    inclusions: [
      'Routine updates and fixes',
      'Security and performance checks',
      'Stability and continuity support',
    ],
    exclusions: ['Active roadmap development unless upgraded'],
    active: true,
    displayOrder: 5,
    ctaLabel: 'Discuss Maintenance Support',
    launchDiscountLabel: '10% Launch Discount',
    referencePriceLabel: '£450',
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    engagementType: 'custom',
    displayedPrice: '£3,400',
    numericPriceMinor: GBP_MINOR(3400),
    currency: 'GBP',
    billingPeriod: 'monthly',
    billingLabel: '/month',
    capacityLabel: 'Custom capacity and engagement model',
    shortDescription:
      'Advanced delivery for larger programmes, multi-team environments and governance-heavy needs.',
    bestFor: [
      'Complex integrations and multi-team programmes',
      'Governance, compliance and large-scale roadmaps',
    ],
    inclusions: [
      'Custom capacity aligned to programme scope',
      'Governance-aware delivery coordination',
    ],
    exclusions: ['Scope defined in signed proposal — not a fixed catalogue bundle'],
    active: true,
    displayOrder: 6,
    ctaLabel: 'Discuss a Custom Programme',
    launchDiscountLabel: '15% Launch Discount',
    referencePriceLabel: '£4,000',
  },
] as const;

const SLUG_SET = new Set<string>(PRICING_PLANS.map((p) => p.slug));

if (SLUG_SET.size !== PRICING_PLANS.length) {
  throw new Error('Duplicate pricing plan slug detected in PRICING_PLANS registry.');
}

export const PRICING_ENGAGEMENT_CATEGORIES: readonly PricingEngagementCategoryDefinition[] = [
  {
    id: 'foundation',
    label: 'Foundation or discovery',
    description: 'Structured starting phases for clarity, planning and launch readiness.',
    engagementTypes: ['foundation'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance and operational support',
    description: 'Continuity support for stable systems that need dependable care.',
    engagementTypes: ['maintenance'],
  },
  {
    id: 'recurring',
    label: 'Recurring product and development capacity',
    description: 'Monthly multidisciplinary delivery capacity for active roadmaps.',
    engagementTypes: ['recurring_delivery'],
  },
  {
    id: 'custom',
    label: 'Custom or larger programme',
    description: 'Tailored engagements for complex or multi-team programmes.',
    engagementTypes: ['custom'],
  },
];

export function isPricingPlanSlug(value: unknown): value is PricingPlanSlug {
  return typeof value === 'string' && SLUG_SET.has(value);
}

export function getPricingPlanBySlug(slug: string): PricingPlanDefinition | undefined {
  return PRICING_PLANS.find((plan) => plan.slug === slug);
}

export function getActivePricingPlans(): PricingPlanDefinition[] {
  return PRICING_PLANS.filter((plan) => plan.active).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getPlanDisplayPrice(slug: PricingPlanSlug): string {
  const plan = getPricingPlanBySlug(slug);
  if (!plan) return '';
  if (plan.billingPeriod === 'monthly') {
    return `${plan.displayedPrice}${plan.billingLabel}`;
  }
  return plan.displayedPrice;
}

export function getPlansForEngagementCategory(
  categoryId: PricingEngagementCategoryDefinition['id'],
): PricingPlanDefinition[] {
  const category = PRICING_ENGAGEMENT_CATEGORIES.find((c) => c.id === categoryId);
  if (!category) return [];
  return getActivePricingPlans().filter((plan) =>
    category.engagementTypes.includes(plan.engagementType),
  );
}

export function getNonEmptyEngagementCategories(): Array<
  PricingEngagementCategoryDefinition & { plans: PricingPlanDefinition[] }
> {
  return PRICING_ENGAGEMENT_CATEGORIES.map((category) => ({
    ...category,
    plans: getPlansForEngagementCategory(category.id),
  })).filter((category) => category.plans.length > 0);
}
