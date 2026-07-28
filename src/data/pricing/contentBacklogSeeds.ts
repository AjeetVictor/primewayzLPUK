import { getPricingPolicyVersion } from '../../data/pricing/policy';

export type PricingContentBacklogSeed = {
  slug: string;
  title: string;
  targetService: string;
  searchIntent: string;
  suggestedCta: string;
  internalLinks: string[];
  overlapNotes?: string;
};

/** Internal pricing-content backlog — not auto-published. Requires commercial review. */
export const PRICING_CONTENT_BACKLOG_SEEDS: PricingContentBacklogSeed[] = [
  {
    slug: 'ongoing-website-support-cost-uk',
    title: 'How much does ongoing website support cost in the UK?',
    targetService: 'Maintenance Mode',
    searchIntent: 'commercial',
    suggestedCta: 'Discuss Maintenance Support',
    internalLinks: ['/pricing', '/maintenance'],
  },
  {
    slug: 'software-development-subscription-pricing-uk-smes',
    title: 'Software development subscription pricing for UK SMEs',
    targetService: 'Growth',
    searchIntent: 'commercial',
    suggestedCta: 'Choose Growth',
    internalLinks: ['/pricing', '/software-development-subscription-uk'],
  },
  {
    slug: 'fixed-price-vs-monthly-delivery',
    title: 'Fixed-price project versus monthly delivery',
    targetService: 'Foundation Sprint',
    searchIntent: 'comparison',
    suggestedCta: 'Start with Foundation Sprint',
    internalLinks: ['/pricing', '/insights/software-development-subscription-vs-fixed-price'],
  },
  {
    slug: 'what-is-included-monthly-support-plan',
    title: 'What is included in a monthly support plan?',
    targetService: 'Essential',
    searchIntent: 'informational',
    suggestedCta: 'Choose Essential',
    internalLinks: ['/pricing'],
  },
  {
    slug: 'when-move-to-maintenance-mode',
    title: 'When should a business move into Maintenance Mode?',
    targetService: 'Maintenance Mode',
    searchIntent: 'informational',
    suggestedCta: 'Discuss Maintenance Support',
    internalLinks: ['/pricing', '/maintenance'],
  },
  {
    slug: 'how-many-development-hours-sme-needs-monthly',
    title: 'How many development hours does an SME need monthly?',
    targetService: 'Essential',
    searchIntent: 'informational',
    suggestedCta: 'Request a plan recommendation',
    internalLinks: ['/pricing', '/insights/how-monthly-software-development-capacity-works'],
    overlapNotes: 'Check overlap with capacity article before drafting.',
  },
  {
    slug: 'why-foundation-sprint-reduces-delivery-risk',
    title: 'Why a Foundation Sprint reduces delivery risk',
    targetService: 'Foundation Sprint',
    searchIntent: 'informational',
    suggestedCta: 'Start with Foundation Sprint',
    internalLinks: ['/pricing', '/blog/foundation-sprint-before-monthly-delivery'],
  },
];

export function buildPricingContentBacklogCreateInputs() {
  const version = getPricingPolicyVersion();
  return PRICING_CONTENT_BACKLOG_SEEDS.map((seed) => ({
    slug: seed.slug,
    title: seed.title,
    targetService: seed.targetService,
    searchIntent: seed.searchIntent,
    suggestedCta: seed.suggestedCta,
    internalLinksJson: seed.internalLinks,
    pricingPolicyVersion: version,
    requiresCommercialReview: true,
    status: 'draft',
    overlapNotes: seed.overlapNotes ?? null,
  }));
}
