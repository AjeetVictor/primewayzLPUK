import { SDAAS_CHOOSE_PARTNER_HREF, SDAAS_CONTINUOUS_DEVELOPMENT_HREF, SDAAS_MONTHLY_CAPACITY_HREF, SDAAS_PILLAR_GUIDE_HREF } from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';

/** Decision-stage comparison article — Intent B (commercial investigation) with handoff to Intent A. */
export const SDAAS_COMPARISON_PATH =
  '/insights/software-development-subscription-vs-fixed-price' as const;

export const SDAAS_COMPARISON_SEO = {
  title: 'Software Development Subscription vs Fixed-Price | UK Guide',
  description:
    'Compare software development subscriptions and fixed-price projects. Understand differences in scope, flexibility, cost, procurement and delivery to choose the right model.',
  ogTitle: 'Software Development Subscription vs Fixed-Price Development',
  ogDescription:
    'Fixed-price projects and development subscriptions solve different procurement problems. Compare scope, priorities, budget, continuity and risk.',
  h1: 'Software Development Subscription vs Fixed-Price Development',
  standfirst:
    'Fixed-price software projects and development subscriptions solve different procurement problems. This guide compares how each model handles scope, changing priorities, budget, delivery continuity and risk.',
  category: 'Decision Guide',
  author: 'Primewayz UK',
  /** Static publish date — do not auto-update on deploy. Change only for meaningful editorial revisions. */
  datePublished: '2026-07-16',
  /** Keep equal to datePublished until a substantive content update ships. */
  dateModified: '2026-07-16',
  readTime: '16 min read',
  keywords: [
    'software development subscription vs fixed-price',
    'subscription development vs fixed-price',
    'monthly software development vs project-based development',
    'fixed-price software project',
    'software development subscription',
    'ongoing development capacity',
    'fixed scope vs flexible development',
    'software retainer vs fixed project',
    'software procurement model',
    'subscription software development UK',
  ],
} as const;

/** Dedicated 1200×630 social crop — not the commercial hero or full comparison matrix. */
export const SDAAS_COMPARISON_OG_IMAGE =
  '/articles/sdaas/og-software-development-subscription-vs-fixed-price.webp';

export const SDAAS_COMPARISON_DIRECT_ANSWER =
  'A fixed-price project agrees a defined scope, delivery plan and price before development begins. A software development subscription provides recurring delivery capacity that can be reprioritised as requirements evolve.';

export const SDAAS_COMPARISON_DIRECT_ANSWER_FOLLOW =
  'Fixed-price is generally better for stable, one-off requirements. A subscription is generally better for ongoing work where priorities and requirements are expected to change.';

export const COMPARISON_GEO_STATEMENTS = [
  'A fixed-price project purchases a defined outcome, while a development subscription purchases recurring delivery capacity.',
  'Reprioritisation changes the order of work, not the amount of available capacity.',
  'Fixed-price is strongest when the work can be described accurately before development begins.',
  'A subscription is strongest when continuity and adaptability matter more than defining a final endpoint upfront.',
] as const;

export const sideBySideRows = [
  {
    aspect: 'Best suited to',
    fixedPrice: 'A defined project with stable deliverables',
    subscription: 'Ongoing development needs and evolving backlogs',
  },
  {
    aspect: 'Scope',
    fixedPrice: 'Agreed upfront against documented requirements',
    subscription: 'Shared backlog that evolves over time',
  },
  {
    aspect: 'Budget structure',
    fixedPrice: 'Total project price for the agreed scope',
    subscription: 'Recurring monthly fee for agreed capacity',
  },
  {
    aspect: 'Requirements changes',
    fixedPrice: 'Usually handled through change control',
    subscription: 'Priorities can shift within available capacity',
  },
  {
    aspect: 'Procurement',
    fixedPrice: 'Proposal, quote and approval for each project',
    subscription: 'Continuing commercial relationship after onboarding',
  },
  {
    aspect: 'Start of new work',
    fixedPrice: 'Often waits for a new agreement cycle',
    subscription: 'New items enter the existing backlog queue',
  },
  {
    aspect: 'Delivery continuity',
    fixedPrice: 'Ends when the project completes',
    subscription: 'Continues through monthly delivery cycles',
  },
  {
    aspect: 'Product knowledge',
    fixedPrice: 'Built for the project; may reset later',
    subscription: 'Builds across months of retained context',
  },
  {
    aspect: 'Prioritisation',
    fixedPrice: 'Locked to the approved project plan',
    subscription: 'Reviewed regularly against capacity',
  },
  {
    aspect: 'Completion point',
    fixedPrice: 'Clear end date and acceptance criteria',
    subscription: 'No single endpoint; work continues while needed',
  },
  {
    aspect: 'Client involvement',
    fixedPrice: 'Strong upfront decisions, then acceptance reviews',
    subscription: 'Recurring priority decisions and feedback',
  },
  {
    aspect: 'Provider risk',
    fixedPrice: 'Estimation risk within the agreed scope',
    subscription: 'Delivery risk managed through capacity and prioritisation',
  },
  {
    aspect: 'Typical engagement length',
    fixedPrice: 'Finite project duration',
    subscription: 'Continuing monthly engagement',
  },
  {
    aspect: 'Handover',
    fixedPrice: 'Usually at project completion',
    subscription: 'Ongoing documentation plus structured exit handover',
  },
] as const;

export const fixedPriceStrengths = [
  'Clear approved budget against a defined scope',
  'Documented deliverables and acceptance criteria',
  'Easier procurement approval for one-off work',
  'Suitable when requirements are stable',
  'Clear completion point for stakeholders',
] as const;

export const fixedPriceLimitations = [
  'Change requests can add delay and cost',
  'Extensive discovery is required upfront',
  'Early assumptions may become constraints later',
  'New priorities are harder to introduce mid-delivery',
  'Suppliers may protect margin by interpreting scope narrowly',
] as const;

export const subscriptionStrengths = [
  'Recurring capacity for ongoing improvements',
  'Shared backlog and visible prioritisation',
  'Fewer repeated procurement cycles for new work',
  'Retained product and architecture context',
  'Suitable when priorities change over time',
] as const;

export const subscriptionLimitations = [
  'Capacity remains finite and must be prioritised',
  'Predictable fees do not guarantee equal monthly output',
  'Unclear requirements still consume capacity',
  'Requires recurring client decision-making',
  'Large one-off builds may still need a project phase',
] as const;

export const whenFixedPriceFits = [
  'Clearly defined one-off project',
  'Stable requirements and known dependencies',
  'Agreed completion point and acceptance criteria',
  'Fixed procurement budget for a defined deliverable',
  'Limited expectation of change during delivery',
  'Formal tender or fixed-scope compliance requirement',
  'Isolated migration or integration with predictable endpoints',
  'Tightly specified prototype',
] as const;

export const whenSubscriptionFits = [
  'Ongoing feature backlog after launch',
  'Live product improvement and stabilisation',
  'Recurring integrations and operational changes',
  'Post-MVP development with evolving priorities',
  'Regular fixes plus enhancements in one rhythm',
  'Uncertain monthly demand that still needs continuity',
  'Need for multiple technical disciplines over time',
  'Repeated small and medium packages of work',
] as const;

export const hybridSteps = [
  {
    title: 'Discovery or initial build',
    text: 'Deliver a defined project where the first release can be scoped clearly.',
  },
  {
    title: 'Stabilisation and launch',
    text: 'Complete acceptance, launch support and early defect handling.',
  },
  {
    title: 'Move improvements into a subscription',
    text: 'Shift recurring backlog work into monthly delivery capacity.',
  },
  {
    title: 'Scope major modules separately when needed',
    text: 'Large future modules can still be estimated as defined projects.',
  },
  {
    title: 'Continue routine development monthly',
    text: 'Keep integrations, fixes and iterative features in the subscription rhythm.',
  },
] as const;

export const hybridExamples = [
  'Fixed-price MVP followed by subscription improvement',
  'Fixed-price rescue audit followed by monthly stabilisation',
  'Fixed-price migration followed by ongoing integrations',
  'Fixed-price redesign followed by continuous feature work',
] as const;

export const decisionChecklist = [
  'Is the scope stable and documented?',
  'Is there a clear completion point?',
  'Will priorities change during delivery?',
  'Is there an ongoing backlog after launch?',
  'Can stakeholders approve detailed requirements upfront?',
  'Is repeated procurement causing delay?',
  'Is internal product ownership available?',
  'Does the work require several technical disciplines?',
  'Is the budget approved as a project or operating expense?',
  'Is continuity important after initial delivery?',
] as const;

export const decisionSummary = {
  fixedPrice:
    'Choose fixed-price when most answers indicate stable scope and a defined endpoint.',
  subscription:
    'Choose subscription when most answers indicate ongoing work, changing priorities and a need for continuity.',
  discovery:
    'Choose discovery first when the answers are unclear because the current system or requirement is not sufficiently understood.',
} as const;

export const workedScenarios = [
  {
    title: 'A defined website migration',
    model: 'Fixed-price',
    reason: 'Known source, destination, deliverables and completion criteria.',
  },
  {
    title: 'A SaaS product with a growing backlog',
    model: 'Subscription',
    reason: 'Features, feedback, fixes and integrations continue to evolve.',
  },
  {
    title: 'An unstable legacy application',
    model: 'Discovery first, then possibly fixed-price stabilisation or subscription',
    reason:
      'The amount and nature of the work cannot be assessed safely without investigation.',
  },
  {
    title: 'A new internal business platform',
    model: 'Depends on scope maturity',
    reason:
      'A defined first release may be fixed-price, followed by a development subscription for iteration.',
  },
  {
    title: 'Recurring CRM and automation improvements',
    model: 'Subscription',
    reason: 'Workflows, integrations and reporting usually expand after the first release.',
  },
  {
    title: 'Single API integration with stable documentation',
    model: 'Fixed-price',
    reason: 'Endpoints, acceptance criteria and completion point can be agreed upfront.',
  },
] as const;

export const comparisonFaqs = [
  {
    question: 'Is a software development subscription cheaper than fixed-price?',
    answer:
      'Not necessarily. A fixed-price project prices a defined outcome, while a subscription prices recurring capacity. Which appears cheaper depends on scope certainty, change volume, duration and how much re-scoping would otherwise occur. Neither model is universally lower cost.',
  },
  {
    question: 'Can a fixed-price project change after development begins?',
    answer:
      'Yes, but changes usually require review. They may affect cost, timeline and formal approval through change control. That process protects both parties when the original scope was the basis of the price.',
  },
  {
    question: 'Is a development subscription unlimited?',
    answer:
      'No. A development subscription provides finite monthly delivery capacity. Requests can still be added to the backlog, but work must be prioritised against the agreed allocation.',
  },
  {
    question: 'Which model is better for a startup?',
    answer:
      'It depends on maturity. A clearly scoped MVP may suit fixed-price delivery. After launch, when feedback creates an evolving backlog, a development subscription is often a better fit. Some startups also begin with discovery when the problem is not yet well defined.',
  },
  {
    question: 'Which model is better for an existing application?',
    answer:
      'Existing applications often suit a subscription when fixes, integrations and improvements continue month after month. A fixed-price project can still be right for a defined migration, redesign or compliance deliverable with stable acceptance criteria.',
  },
  {
    question: 'Can an MVP be built using a subscription?',
    answer:
      'Yes, if the first release is expected to evolve quickly and stakeholders can prioritise a shared backlog. If the MVP scope is tightly specified with a clear completion point, fixed-price delivery may be simpler to procure.',
  },
  {
    question: 'What happens when monthly priorities change?',
    answer:
      'In a subscription, items can usually be reordered in the backlog so urgent work moves forward. Other planned work may move back. Reprioritisation changes the order of work, not the amount of available capacity.',
  },
  {
    question: 'Who owns the source code under each model?',
    answer:
      'Ownership depends on the contract. In a well-structured engagement, clients typically own the custom source code and project-specific assets created for them once applicable invoices are paid. Pre-existing components, open-source software and third-party services remain subject to their own licence terms under either model.',
  },
  {
    question: 'Can fixed-price and subscription models be combined?',
    answer:
      'Yes. A common hybrid approach is a fixed-price discovery or initial build, followed by a development subscription for ongoing improvement. Major future modules can still be scoped separately when needed.',
  },
  {
    question: 'Should we begin with a discovery phase?',
    answer:
      'Discovery is appropriate when the current system, dependencies or requirements are not understood well enough to price a project accurately or to set realistic monthly capacity. It reduces the risk of locking incomplete assumptions into either model.',
  },
] as const;

export const comparisonRelatedLiveLinks = [
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial service page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'Subscription-Based Software Development Guide',
    description: 'Educational pillar covering both meanings of subscription-based software development.',
    href: SDAAS_PILLAR_GUIDE_HREF,
  },
  {
    title: 'Software development subscription use cases',
    description:
      'Ten practical situations where monthly delivery capacity may fit—and where another model may be better.',
    href: '/insights/software-development-subscription-use-cases',
  },
  {
    title: 'How monthly development capacity works',
    description: 'Operating mechanics behind finite monthly delivery effort.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
  {
    title: 'Why businesses move to continuous development',
    description: 'Strategic reasons organisations shift beyond isolated projects.',
    href: SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  },
  {
    title: 'How to choose a software development partner',
    description: 'Practical evaluation criteria for discovery, delivery and ownership.',
    href: SDAAS_CHOOSE_PARTNER_HREF,
  },
] as const;

export const comparisonRelatedBlogLinks = [
  {
    title: 'Fixed-price vs time & material vs subscription support',
    description: 'A practical comparison of delivery models for UK SMEs and SaaS founders.',
    href: '/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  },
  {
    title: 'Why start with a foundation sprint',
    description: 'When discovery and stabilisation should come before monthly delivery.',
    href: '/blog/foundation-sprint-before-monthly-delivery',
  },
] as const;

export const COMPARISON_PRIMARY_VISUAL = {
  ...SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice,
  alt: 'Comparison of software development subscriptions, fixed-price projects and direct hiring across flexibility, commitment and delivery continuity.',
};

export const COMPARISON_SECONDARY_VISUALS = [
  SDAAS_COMMERCIAL_IMAGES.monthlyCapacity,
  SDAAS_COMMERCIAL_IMAGES.deliveryProcess,
] as const;

export { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH, SDAAS_PILLAR_GUIDE_HREF };
