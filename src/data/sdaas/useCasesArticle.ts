import {
  CANONICAL_ROUTES,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
} from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';

/** MOF use-cases article — practical suitability examples with clear model boundaries. */
export const SDAAS_USE_CASES_PATH =
  '/insights/software-development-subscription-use-cases' as const;

export const SDAAS_USE_CASES_SEO = {
  title: '10 Software Development Subscription Use Cases | UK Guide',
  description:
    'Explore 10 practical software development subscription use cases, including SaaS improvement, application rescue, integrations, automation and backlog delivery.',
  ogTitle: '10 Software Development Subscription Use Cases for Growing Businesses',
  ogDescription:
    'Practical situations where monthly development capacity may fit—and when fixed-price, discovery or hiring may be better.',
  h1: '10 Software Development Subscription Use Cases for Growing Businesses',
  standfirst:
    'A software development subscription works best when requirements continue after the first release. These ten use cases show where monthly delivery capacity can help—and where another delivery model may be more appropriate.',
  category: 'Use Cases',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '17 min read',
  keywords: [
    'software development subscription use cases',
    'subscription-based software development examples',
    'software development subscription examples',
    'monthly development service use cases',
    'ongoing software development support',
    'post-MVP software development',
    'software backlog delivery',
    'ongoing SaaS development',
    'application improvement subscription',
    'flexible development capacity UK',
  ],
} as const;

export const SDAAS_USE_CASES_OG_IMAGE =
  '/articles/sdaas/og-software-development-subscription-use-cases.webp';

export const SDAAS_USE_CASES_DIRECT_ANSWER =
  'A software development subscription is generally suitable for recurring, evolving work that can be prioritised through a shared backlog. Typical examples include post-MVP product development, feature backlogs, integrations, application stabilisation, automation and ongoing maintenance combined with improvement.';

export const SDAAS_USE_CASES_DIRECT_ANSWER_FOLLOW =
  'It is generally less suitable for a single large project with fixed scope, an unassessed codebase or work requiring a fully dedicated team.';

export const USE_CASES_GEO_STATEMENTS = [
  'A recurring backlog is a stronger signal for subscription suitability than a large one-off requirement.',
  'An unknown codebase should usually be assessed before normal monthly capacity is committed.',
  'Maintenance keeps a system dependable, while enhancement improves what the system can do.',
  'Urgent work can change priority order, but it does not create additional delivery capacity.',
  'Recurring need supports a subscription model; unclear priorities do not.',
  'The delivery model should follow the nature of the work, not the attractiveness of the subscription label.',
] as const;

export type UseCaseRelatedLink = {
  href: string;
  label: string;
};

export type SubscriptionUseCase = {
  id: string;
  number: number;
  title: string;
  situation: string;
  recurringWork: readonly string[];
  whySubscription: readonly string[];
  monthlyPriorities?: readonly string[];
  /** Optional boundary callout shown before or within the use case. */
  boundaryNote?: string;
  whenOtherModel: readonly string[];
  relatedLink?: UseCaseRelatedLink;
};

export const subscriptionUseCases: readonly SubscriptionUseCase[] = [
  {
    id: 'post_mvp_saas',
    number: 1,
    title: 'Evolving a SaaS Product After the MVP',
    situation:
      'A startup or SaaS business has released an MVP and now needs to respond to users, improve adoption and strengthen the product.',
    recurringWork: [
      'Feature refinement',
      'Onboarding improvements',
      'Subscription-plan changes',
      'User-role updates',
      'Payment and billing refinements',
      'Reporting and notifications',
      'Integrations',
      'Bug fixing and performance improvements',
    ],
    whySubscription: [
      'The roadmap changes through user feedback',
      'Work continues after launch rather than ending at go-live',
      'Priorities evolve across releases',
      'Product context must be retained between cycles',
      'Requirements are connected across onboarding, billing, roles and reporting',
    ],
    monthlyPriorities: [
      'Improve customer onboarding',
      'Fix plan-upgrade issues',
      'Add usage reporting',
      'Improve account administration',
    ],
    whenOtherModel: [
      'The MVP itself is not yet defined',
      'The product needs a fully dedicated team',
      'Major architecture replacement is required',
      'The business is ready to build an internal engineering organisation',
    ],
    relatedLink: {
      href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
      label: 'Software Development as a Subscription for UK Businesses',
    },
  },
  {
    id: 'feature_backlog',
    number: 2,
    title: 'Working Through a Growing Feature Backlog',
    situation:
      'An existing application has accumulated user requests, operational improvements, bugs and enhancements.',
    recurringWork: [
      'Feature delivery',
      'Usability fixes',
      'Workflow improvements',
      'Admin tools and permission changes',
      'Reporting updates',
      'Integration updates',
      'Technical clean-up',
    ],
    whySubscription: [
      'The backlog is continuous rather than one-off',
      'Items vary in size and urgency',
      'Priorities need frequent review',
      'Repeated procurement creates delay',
      'Retained product knowledge improves estimation and delivery',
    ],
    monthlyPriorities: [
      'Priority 1: onboarding improvement',
      'Priority 2: export enhancement',
      'Priority 3: permission fix',
      'Priority 4: smaller interface improvements',
    ],
    boundaryNote:
      'A backlog is not a plan until business priorities, dependencies and available capacity are agreed.',
    whenOtherModel: [
      'The entire backlog forms one clearly scoped release',
      'A deadline requires a dedicated team',
      'The backlog has not been assessed or prioritised',
    ],
  },
  {
    id: 'application_rescue',
    number: 3,
    title: 'Stabilising and Improving an Existing Application',
    situation:
      'A business has inherited, acquired or received an incomplete, unreliable or poorly documented system.',
    recurringWork: [
      'Bug reduction after initial stabilisation',
      'Performance improvements',
      'Technical-debt work',
      'Release-process improvement',
      'Feature recovery',
      'Documentation',
      'Planned enhancements',
    ],
    whySubscription: [
      'Improvement continues after immediate defects are fixed',
      'Product context must be retained across cycles',
      'Technical debt and feature work need balancing',
      'Priorities may change as the system becomes better understood',
    ],
    boundaryNote:
      'A discovery or stabilisation phase may be required before monthly delivery capacity can be recommended safely. An unknown codebase should usually be assessed before normal monthly capacity is committed.',
    whenOtherModel: [
      'Initial rescue scope is unknown',
      'Critical failure requires a dedicated incident team',
      'A full rebuild is more appropriate',
      'Specialist security or compliance work is required',
    ],
    relatedLink: {
      href: '/success-stories/ecommerce-store-stability-support',
      label: 'E-commerce store stability support',
    },
  },
  {
    id: 'integrations',
    number: 4,
    title: 'Managing CRM, API and Third-Party Integrations',
    situation:
      'A company relies on connected systems whose APIs, fields, workflows and commercial requirements change over time.',
    recurringWork: [
      'CRM synchronisation',
      'API updates and webhooks',
      'Authentication changes',
      'Field mapping and data validation',
      'Error handling and monitoring',
      'New integration endpoints',
      'Workflow changes',
    ],
    whySubscription: [
      'Integrations rarely remain permanently static',
      'Connected systems change independently',
      'Business rules evolve after go-live',
      'Monitoring reveals edge cases over time',
      'Multiple integrations form a continuing backlog',
    ],
    monthlyPriorities: [
      'Repair lead synchronisation',
      'Add missing field mapping',
      'Improve failed-request logging',
      'Connect a new reporting endpoint',
    ],
    whenOtherModel: [
      'One API integration has stable documentation',
      'Scope and data mapping are fully known',
      'There is a clear completion and acceptance point',
    ],
    relatedLink: {
      href: CANONICAL_ROUTES.crmAutomationSupport,
      label: 'CRM & automation support',
    },
  },
  {
    id: 'process_automation',
    number: 5,
    title: 'Replacing Manual and Spreadsheet-Based Processes',
    situation:
      'Teams rely on spreadsheets, email, messaging apps or repeated manual data entry to run important workflows.',
    recurringWork: [
      'Process mapping',
      'Approval workflows and form development',
      'Validation and role-based access',
      'Notifications and reporting',
      'Integrations and workflow refinement',
      'Exception handling',
    ],
    whySubscription: [
      'The first automation often reveals additional needs',
      'Users refine processes after real use',
      'Exceptions become visible over time',
      'Multiple workflows may be prioritised gradually',
      'Automation and integration needs are connected',
    ],
    boundaryNote:
      'Automation should not simply reproduce a broken process in software. Requirements clarification remains essential before building.',
    whenOtherModel: [
      'One workflow is fully defined and isolated',
      'The work has a stable specification',
      'The organisation needs a broad transformation programme with a dedicated team',
    ],
    relatedLink: {
      href: CANONICAL_ROUTES.crmAutomationSupport,
      label: 'Business automation and CRM support',
    },
  },
  {
    id: 'internal_systems',
    number: 6,
    title: 'Improving an Internal Business System',
    situation:
      'A company has an internal platform used for operations, sales, service, fulfilment, finance or administration.',
    recurringWork: [
      'Workflow improvements',
      'Role and permission updates',
      'Data-quality controls',
      'Reporting, search and exports',
      'Audit trails and notifications',
      'Integrations and usability improvements',
    ],
    whySubscription: [
      'Operational systems evolve with the business',
      'Teams identify improvements through daily use',
      'New roles and rules are introduced over time',
      'Continuous context helps avoid disconnected changes',
    ],
    monthlyPriorities: [
      'Fewer manual handoffs',
      'Clearer operational visibility',
      'Improved data consistency',
      'Reduced repeated entry',
    ],
    whenOtherModel: [
      'The organisation requires a complete enterprise system replacement',
      'Formal procurement requires a fixed tender',
      'The platform needs a large dedicated programme',
    ],
  },
  {
    id: 'technical_debt',
    number: 7,
    title: 'Reducing Technical Debt and Improving Performance',
    situation:
      'A working system has become harder to change, slower, less reliable or increasingly risky.',
    recurringWork: [
      'Dependency updates and code refactoring',
      'Query optimisation and caching',
      'Test coverage and error logging',
      'Monitoring and build-process improvement',
      'Security patching',
      'Removal of obsolete components',
    ],
    whySubscription: [
      'Technical debt competes with feature work for the same capacity',
      'Improvements can be prioritised gradually',
      'Change must be tested against live business needs',
      'Benefits often accumulate over several cycles',
    ],
    boundaryNote:
      'Technical-debt work should still have measurable purpose—reducing failure risk, improving delivery speed, supporting future features or simplifying maintenance.',
    whenOtherModel: [
      'A full platform migration is required',
      'Infrastructure redesign has a defined scope',
      'Urgent critical remediation needs a specialist project',
      'Performance issues have not yet been diagnosed',
    ],
  },
  {
    id: 'reporting_dashboards',
    number: 8,
    title: 'Expanding Reporting and Operational Dashboards',
    situation:
      'Teams need better visibility, but reporting requirements change as leadership, customers and operations ask new questions.',
    recurringWork: [
      'Dashboard views, filters and exports',
      'Scheduled reports and data aggregation',
      'Role-based views and KPI definitions',
      'Data-quality checks',
      'Performance optimisation',
      'Integration with analytics systems',
    ],
    whySubscription: [
      'Reporting needs evolve after early versions are used',
      'Data sources expand over time',
      'KPI definitions change with the business',
      'Dashboard work often connects to broader system improvements',
    ],
    boundaryNote:
      'Visual dashboards do not solve poor underlying data quality. Validation or integration work may be required first.',
    whenOtherModel: [
      'One report pack is fully specified',
      'Source data is clean and stable',
      'Acceptance criteria are clear',
    ],
  },
  {
    id: 'maintenance_enhancement',
    number: 9,
    title: 'Combining Software Maintenance with Ongoing Enhancement',
    situation: 'A live system needs both operational care and continued development.',
    recurringWork: [
      'Defect fixing and dependency updates',
      'Minor security updates',
      'Browser or platform compatibility',
      'Performance monitoring',
      'Small features and workflow improvements',
      'Integration maintenance, release support and documentation',
    ],
    whySubscription: [
      'Maintenance and improvement compete for the same technical context',
      'Urgent defects occasionally affect planned work',
      'Regular prioritisation is necessary',
      'Continuity supports safer releases',
    ],
    boundaryNote:
      'Maintenance keeps a system dependable. Enhancement improves what the system can do. A development subscription may combine both when boundaries and priorities are clear. This does not imply 24/7 support or guaranteed response times unless separately contracted.',
    whenOtherModel: [
      'Only low-volume maintenance is required',
      'The system needs managed hosting rather than development',
      'Critical operations require a formal support SLA',
      'A major enhancement has a stable standalone scope',
    ],
    relatedLink: {
      href: CANONICAL_ROUTES.maintenance,
      label: 'Website maintenance and monthly support',
    },
  },
  {
    id: 'agency_white_label',
    number: 10,
    title: 'Providing White-Label Development Capacity for an Agency',
    situation:
      'A design, marketing, consulting or product agency needs dependable technical delivery without hiring every required discipline internally.',
    recurringWork: [
      'Client website functionality and application features',
      'Integrations and API work',
      'Technical discovery',
      'QA and release support',
      'Maintenance and enhancement',
      'Overflow delivery across accounts',
    ],
    whySubscription: [
      'Client demand varies month to month',
      'Multiple technical disciplines may be required',
      'The agency needs repeatable delivery capacity',
      'Commercial relationships and context continue',
      'Small and medium requests arrive across accounts',
    ],
    boundaryNote:
      'White-label delivery needs clear governance: client ownership, communication boundaries, confidentiality, prioritisation between accounts, requirements responsibility, and approval/QA process. Capacity remains finite—this is not unlimited multi-client throughput.',
    whenOtherModel: [
      'One client needs a dedicated project team',
      'Demand is consistently large enough to hire internally',
      'The agency needs only ad hoc emergency support',
      'Commercial responsibilities are unclear',
    ],
  },
] as const;

export const useCaseMatrixRows = [
  {
    useCase: 'Post-MVP SaaS',
    workPattern: 'Continuous product evolution after launch',
    whySubscription: 'Feedback-driven priorities and retained product context',
    alternative: 'Dedicated team or fixed-price first release',
  },
  {
    useCase: 'Feature backlog',
    workPattern: 'Many medium and small items over time',
    whySubscription: 'Frequent reprioritisation without re-procurement',
    alternative: 'Fixed-price scoped release or dedicated team',
  },
  {
    useCase: 'Application rescue',
    workPattern: 'Stabilisation then iterative improvement',
    whySubscription: 'Ongoing balance of defects, debt and features',
    alternative: 'Discovery first, then hybrid or rebuild',
  },
  {
    useCase: 'Integrations',
    workPattern: 'Connected systems that keep changing',
    whySubscription: 'Edge cases and API changes continue after go-live',
    alternative: 'Fixed-price for one stable integration',
  },
  {
    useCase: 'Process automation',
    workPattern: 'Workflow refinement through real use',
    whySubscription: 'First automation reveals further needs',
    alternative: 'Fixed-price for one isolated workflow',
  },
  {
    useCase: 'Internal systems',
    workPattern: 'Operational rules and roles evolve',
    whySubscription: 'Daily use creates a continuing backlog',
    alternative: 'Enterprise programme or fixed tender',
  },
  {
    useCase: 'Technical debt',
    workPattern: 'Gradual risk and performance reduction',
    whySubscription: 'Debt competes with features across cycles',
    alternative: 'Specialist remediation project or migration',
  },
  {
    useCase: 'Reporting',
    workPattern: 'KPI and visibility needs expand',
    whySubscription: 'Dashboards refine after early use',
    alternative: 'Fixed-price report pack with clean data',
  },
  {
    useCase: 'Maintenance plus enhancement',
    workPattern: 'Care and improvement share context',
    whySubscription: 'Defects and small features compete for capacity',
    alternative: 'Support contract or fixed enhancement',
  },
  {
    useCase: 'Agency support',
    workPattern: 'Variable multi-client technical demand',
    whySubscription: 'Repeatable overflow capacity with continuity',
    alternative: 'Dedicated project team or internal hire',
  },
] as const;

export const unsuitableSituations = [
  'A fully defined one-off project with stable acceptance criteria',
  'A large platform requiring a dedicated team',
  'No meaningful recurring backlog after delivery',
  'An unassessed legacy system',
  '24/7 critical operational support',
  'Specialist certification or regulated work outside the service',
  'Unclear ownership or decision-making',
  'Expectations of unlimited parallel delivery',
  'Consistently full-time demand better suited to internal hiring',
] as const;

export const hybridApproachSteps = [
  {
    title: 'Conduct discovery',
    text: 'Assess requirements, code quality, dependencies and delivery risk before locking a model.',
  },
  {
    title: 'Deliver a defined stabilisation or launch project',
    text: 'Use fixed-price where the first release or rescue scope can be described accurately.',
  },
  {
    title: 'Move ongoing improvements into monthly capacity',
    text: 'Shift recurring enhancements, integrations and refinements into a shared backlog.',
  },
  {
    title: 'Scope future major modules separately when appropriate',
    text: 'Large future packages can still be estimated as defined projects without ending continuity.',
  },
] as const;

export const buyerEvaluationChecklist = [
  'Is there a recurring backlog?',
  'How often do priorities change?',
  'Is the current system understood?',
  'Who will make priority decisions?',
  'How is monthly capacity defined?',
  'How many workstreams can be active?',
  'What happens when urgent work appears?',
  'Which capabilities are included?',
  'How are QA and releases handled?',
  'Who owns the source code?',
  'How are third-party licences treated?',
  'What reporting is provided?',
  'Can the plan be paused or changed?',
  'How does handover work?',
  'When would the provider recommend another model?',
] as const;

export const useCasesFaqs = [
  {
    question: 'What projects are suitable for a software development subscription?',
    answer:
      'Recurring, evolving work that can be prioritised through a shared backlog is generally suitable—such as post-MVP product development, feature backlogs, integrations, stabilisation followed by improvement, automation and maintenance combined with enhancement. A clearly defined one-off project is usually a weaker fit.',
  },
  {
    question: 'Can a subscription be used to build an MVP?',
    answer:
      'It can, if the first release is expected to evolve quickly and stakeholders can prioritise a backlog. If the MVP scope is tightly specified with a clear completion point, fixed-price delivery may be simpler to procure.',
  },
  {
    question: 'Is application maintenance included?',
    answer:
      'A development subscription can include defect fixing, dependency updates and release support alongside enhancements when those items are prioritised within capacity. That is not the same as a 24/7 support SLA or guaranteed response times unless separately contracted.',
  },
  {
    question: 'Can a subscription support an existing application?',
    answer:
      'Yes, many subscriptions support existing applications through fixes, integrations and incremental improvement. If the codebase is unknown or unstable, a discovery or stabilisation phase should usually come first.',
  },
  {
    question: 'Is a subscription suitable for API integrations?',
    answer:
      'It often is when integrations continue to change, multiple systems are connected, or edge cases appear after go-live. A single integration with stable documentation and clear acceptance criteria may still suit fixed-price delivery.',
  },
  {
    question: 'How many features can be delivered each month?',
    answer:
      'There is no fixed feature count. Output depends on agreed capacity, complexity, dependencies, clarity of requirements and review cycles. Estimation against available capacity is the practical control.',
  },
  {
    question: 'Can urgent bugs interrupt planned feature work?',
    answer:
      'Yes. Urgent work can move forward in the backlog, which may delay other planned items. Urgent work can change priority order, but it does not create additional delivery capacity.',
  },
  {
    question: 'Is subscription development suitable for technical-debt reduction?',
    answer:
      'It can be when debt reduction is prioritised alongside features with a measurable purpose. Full migrations, undefined performance problems or urgent specialist remediation may still need a separate project or discovery phase.',
  },
  {
    question: 'Can agencies use the model for white-label delivery?',
    answer:
      'Yes, when demand varies and the agency needs repeatable technical capacity with clear governance for ownership, confidentiality and prioritisation. It is not unlimited multi-client throughput.',
  },
  {
    question: 'When should a business choose fixed-price instead?',
    answer:
      'Choose fixed-price when scope, deliverables and acceptance criteria are stable and there is a clear completion point. For a fuller decision framework, see the development subscription vs fixed-price comparison guide.',
  },
] as const;

export const useCasesRelatedLiveLinks = [
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
    title: 'Development subscription vs fixed-price',
    description: 'Decision guide comparing recurring capacity with fixed-price software projects.',
    href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  },
  {
    title: 'How monthly development capacity works',
    description: 'How finite capacity is allocated across backlog items, QA and releases.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
  {
    title: 'How to prioritise software requests',
    description: 'Turning a backlog into a justified monthly delivery plan.',
    href: SDAAS_PRIORITISATION_HREF,
  },
  {
    title: 'Application rescue and stabilisation',
    description: 'What should happen before unstable systems enter ongoing development.',
    href: SDAAS_APPLICATION_RESCUE_HREF,
  },
  {
    title: 'Technical debt for business owners',
    description: 'How accumulated software risk affects cost, speed and reliability.',
    href: SDAAS_TECHNICAL_DEBT_HREF,
  },
  {
    title: 'Maintenance vs continuous product development',
    description: 'Where support ends and product improvement begins.',
    href: SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  },
] as const;

export const useCasesRelatedBlogLinks = [
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

export {
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_PAGE_PATH,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_COMMERCIAL_IMAGES,
};
