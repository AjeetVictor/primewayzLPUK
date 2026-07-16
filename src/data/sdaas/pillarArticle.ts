import { SDAAS_CHOOSE_PARTNER_HREF, SDAAS_CONTINUOUS_DEVELOPMENT_HREF, SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF, SDAAS_MONTHLY_CAPACITY_HREF, SDAAS_PRIORITISATION_HREF } from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';

/** Educational pillar — Intent B (informational) with clear handoff to commercial Intent A. */
export const SDAAS_PILLAR_PATH = '/insights/subscription-based-software-development';

export const SDAAS_PILLAR_SEO = {
  title: 'Subscription-Based Software Development: Models & Examples',
  description:
    'Learn the two meanings of subscription-based software development, common business models, practical examples, benefits, limitations and how development subscriptions work.',
  ogTitle: 'Subscription-Based Software Development: Models, Examples and How It Works',
  ogDescription:
    'Subscription software monetises product access. A development subscription purchases recurring delivery capacity. This guide explains both models clearly.',
  h1: 'Subscription-Based Software Development: Models, Examples and How It Works',
  standfirst:
    'Subscription-based software development can describe two different models: building software that customers access through recurring payments, or buying ongoing development capacity through a monthly subscription. This guide explains both.',
  category: 'Software Delivery',
  author: 'Primewayz UK',
  /** Static publish date — do not auto-update on deploy. Change only for meaningful editorial revisions. */
  datePublished: '2026-07-16',
  /** Keep equal to datePublished until a substantive content update ships. */
  dateModified: '2026-07-16',
  readTime: '18 min read',
  keywords: [
    'subscription-based software development',
    'subscription software',
    'Software Development as a Subscription',
    'SDaaS',
    'monthly development capacity',
    'SaaS subscription model',
    'development subscription vs fixed-price',
  ],
} as const;

/** Dedicated 1200×630 social crop — not the full-page infographic. */
export const SDAAS_PILLAR_OG_IMAGE = '/articles/sdaas/og-subscription-based-software-development.webp';

export const SDAAS_PILLAR_DIRECT_ANSWER =
  'Subscription-based software development can mean either building software that generates recurring revenue through subscriptions, or obtaining recurring software development capacity through a monthly service agreement.';

export const twoMeaningsRows = [
  {
    model: 'Subscription software',
    subscribedTo: 'Access to a software product',
    whoPays: 'End users or business customers',
    purpose: 'Recurring access to features and services',
    example: 'CRM, accounting platform, membership software',
  },
  {
    model: 'Development subscription',
    subscribedTo: 'Recurring development capacity',
    whoPays: 'A business commissioning software work',
    purpose: 'Ongoing product improvement, integrations and support',
    example: 'Monthly engineering and QA capacity',
  },
] as const;

export const pricingModels = [
  {
    title: 'Flat-rate subscription',
    meaning: 'One recurring price for a defined product package.',
    used: 'Simple tools and focused products with predictable value.',
    consideration: 'May under- or over-serve customers with very different usage patterns.',
  },
  {
    title: 'Tiered subscription',
    meaning: 'Multiple plans with different feature sets or limits.',
    used: 'SaaS products serving freelancers, teams and enterprises.',
    consideration: 'Requires clear plan boundaries so upgrades feel justified.',
  },
  {
    title: 'Per-user pricing',
    meaning: 'Price scales with the number of seats or named users.',
    used: 'Collaboration, CRM and productivity platforms.',
    consideration: 'Can discourage wider adoption if seat costs feel high.',
  },
  {
    title: 'Usage-based pricing',
    meaning: 'Customers pay according to consumption, such as API calls or storage.',
    used: 'Infrastructure, messaging and analytics products.',
    consideration: 'Needs transparent metering and predictable billing controls.',
  },
  {
    title: 'Freemium',
    meaning: 'A free tier exists alongside paid plans.',
    used: 'Products that benefit from broad trial and network effects.',
    consideration: 'Free usage must convert without undermining paid value.',
  },
  {
    title: 'Hybrid pricing',
    meaning: 'Combines base subscription with usage, seats or add-ons.',
    used: 'Mature platforms with mixed customer segments.',
    consideration: 'Complexity increases sales and billing support effort.',
  },
] as const;

export const subscriptionSoftwareExamples = [
  {
    category: 'CRM systems',
    recurringNeed: 'Ongoing customer data, pipeline and follow-up management.',
    access: 'Contacts, pipelines, tasks and reporting under a recurring plan.',
    capabilities: 'Authentication, plan management, integrations and reporting.',
  },
  {
    category: 'Project-management platforms',
    recurringNeed: 'Continuous coordination of tasks, owners and deadlines.',
    access: 'Boards, workflows, notifications and collaboration features.',
    capabilities: 'Access control, notifications, usage tracking and integrations.',
  },
  {
    category: 'Accounting software',
    recurringNeed: 'Bookkeeping, invoicing and compliance across financial periods.',
    access: 'Ledgers, invoices, bank feeds and financial reports.',
    capabilities: 'Recurring billing for the product itself, renewals and secure data storage.',
  },
  {
    category: 'HR and payroll systems',
    recurringNeed: 'Employee records, leave, payroll cycles and compliance.',
    access: 'People records, payroll runs and policy workflows.',
    capabilities: 'Role-based access, audit trails and third-party payroll integrations.',
  },
  {
    category: 'Learning platforms',
    recurringNeed: 'Continuous access to courses, assessments and progress.',
    access: 'Content libraries, learner progress and certificates.',
    capabilities: 'Authentication, content delivery, progress tracking and renewals.',
  },
  {
    category: 'Healthcare platforms',
    recurringNeed: 'Ongoing clinical, scheduling or patient-communication workflows.',
    access: 'Appointments, records and care coordination tools.',
    capabilities: 'Strict access control, auditability and integrations with related systems.',
  },
  {
    category: 'Membership systems',
    recurringNeed: 'Recurring member benefits, renewals and community access.',
    access: 'Member portals, benefits and renewal management.',
    capabilities: 'Recurring billing, cancellation handling and member communications.',
  },
  {
    category: 'E-commerce tools',
    recurringNeed: 'Store operations, catalogues, checkout and order handling.',
    access: 'Storefront, inventory, payments and order tools.',
    capabilities: 'Integrations, reporting, plan management and operational notifications.',
  },
  {
    category: 'Analytics products',
    recurringNeed: 'Continuous measurement of performance and behaviour.',
    access: 'Dashboards, event data and analysis tools.',
    capabilities: 'Usage tracking, reporting and data integrations.',
  },
  {
    category: 'Media and content platforms',
    recurringNeed: 'Ongoing access to published or streamed content.',
    access: 'Libraries, playlists or publication workflows.',
    capabilities: 'Authentication, renewals, access control and content delivery.',
  },
] as const;

export const developmentProcessSteps = [
  {
    title: 'Request submitted',
    text: 'Share the improvement, fix, integration or feature through the agreed channel.',
  },
  {
    title: 'Clarify and estimate',
    text: 'Clarify acceptance criteria and estimate effort against available capacity.',
  },
  {
    title: 'Agree priority',
    text: 'Decide what moves first; lower-priority items remain visible in the backlog.',
  },
  {
    title: 'Develop',
    text: 'Work progresses within the agreed monthly capacity.',
  },
  {
    title: 'Test and review',
    text: 'Quality checks happen before release so defects are caught early.',
  },
  {
    title: 'Release and report',
    text: 'Approved work is released and summarised for the next cycle.',
  },
] as const;

export const vsFixedPriceRows = [
  {
    aspect: 'Best suited to',
    subscription: 'Ongoing and evolving work',
    alternative: 'Clearly defined one-off projects',
  },
  {
    aspect: 'Scope flexibility',
    subscription: 'Priorities can change within capacity',
    alternative: 'Scope is usually fixed up front',
  },
  {
    aspect: 'Procurement',
    subscription: 'One continuing engagement',
    alternative: 'Often re-quoted per project',
  },
  {
    aspect: 'Start of new work',
    subscription: 'Usually faster once onboarded',
    alternative: 'May wait for a new proposal cycle',
  },
  {
    aspect: 'Cost structure',
    subscription: 'Predictable monthly engagement',
    alternative: 'Fixed fee for an agreed deliverable',
  },
  {
    aspect: 'Product knowledge',
    subscription: 'Builds across months',
    alternative: 'May reset between projects',
  },
  {
    aspect: 'Change handling',
    subscription: 'Reprioritisation within capacity',
    alternative: 'Often handled as change requests',
  },
  {
    aspect: 'Engagement duration',
    subscription: 'Continuing monthly cycles',
    alternative: 'Ends when the project completes',
  },
] as const;

export const vsHiringPoints = {
  subscription: [
    {
      title: 'Faster access to capability',
      text: 'Useful when recruitment would delay important work.',
    },
    {
      title: 'Multi-disciplinary coverage',
      text: 'Product, engineering and QA needs can be covered without hiring each role separately.',
    },
    {
      title: 'Variable demand',
      text: 'Capacity can suit businesses whose backlog fluctuates month to month.',
    },
    {
      title: 'Lower management overhead initially',
      text: 'Delivery coordination is shared rather than built entirely in-house.',
    },
  ],
  hiring: [
    {
      title: 'Consistently full-time workload',
      text: 'Hiring may fit when the role is continuously required.',
    },
    {
      title: 'Strategically core ownership',
      text: 'Deep internal product ownership may justify a permanent hire.',
    },
    {
      title: 'Internal knowledge retention',
      text: 'Key domain knowledge stays inside the organisation.',
    },
    {
      title: 'Direct managerial control',
      text: 'Day-to-day direction sits fully with the internal team.',
    },
  ],
} as const;

export const useCases = [
  {
    title: 'Post-MVP product improvement',
    situation: 'An MVP is live and users are requesting improvements.',
    recurringWork: 'Feature refinements, usability fixes and backlog delivery.',
    whySubscription: 'Priorities evolve quickly after launch.',
    whenProject: 'A large, well-defined rewrite may still need a project phase.',
  },
  {
    title: 'Feature backlog delivery',
    situation: 'Improvements have accumulated across teams and channels.',
    recurringWork: 'Clarifying, estimating and releasing prioritised features.',
    whySubscription: 'A shared backlog keeps work visible and sequenced.',
    whenProject: 'A single major feature with fixed acceptance criteria may suit fixed-price delivery.',
  },
  {
    title: 'API and CRM integrations',
    situation: 'Systems need connecting so data and workflows stay aligned.',
    recurringWork: 'Integration work, sync improvements and exception handling.',
    whySubscription: 'Integrations often need iteration after go-live.',
    whenProject: 'A one-off migration with fixed endpoints may suit a project.',
  },
  {
    title: 'Existing application stabilisation',
    situation: 'An older app is unreliable, undocumented or hard to change.',
    recurringWork: 'Bug fixing, performance work and technical-debt reduction.',
    whySubscription: 'Stabilisation is usually iterative.',
    whenProject: 'Severe instability may first need a short discovery or rescue phase.',
  },
  {
    title: 'Technical-debt reduction',
    situation: 'Delivery slows because the codebase is fragile.',
    recurringWork: 'Refactors, tests and structural improvements alongside features.',
    whySubscription: 'Debt reduction competes with feature work and needs prioritisation.',
    whenProject: 'A dedicated remediation programme may be scoped separately.',
  },
  {
    title: 'Business-process automation',
    situation: 'Manual workflows create delay and error.',
    recurringWork: 'Automation, notifications and reporting improvements.',
    whySubscription: 'Process automation usually expands after the first workflow.',
    whenProject: 'A single isolated automation with fixed rules may suit a project.',
  },
  {
    title: 'Continuous SaaS evolution',
    situation: 'A subscription product needs regular releases.',
    recurringWork: 'Plan features, billing edge cases, access control and reporting.',
    whySubscription: 'SaaS products rarely stop evolving after launch.',
    whenProject: 'An initial platform build with fixed MVP scope may start as a project.',
  },
  {
    title: 'Reporting and dashboard development',
    situation: 'Leaders need clearer operational visibility.',
    recurringWork: 'Metrics definitions, dashboard builds and data cleanup.',
    whySubscription: 'Reporting needs usually expand once the first view is useful.',
    whenProject: 'A single static report with fixed data sources may be project-based.',
  },
  {
    title: 'Usability improvements',
    situation: 'Users struggle with friction in key journeys.',
    recurringWork: 'Interface refinements, workflow simplification and QA.',
    whySubscription: 'Usability work benefits from continuous feedback loops.',
    whenProject: 'A full redesign with locked scope may be better as a project.',
  },
  {
    title: 'White-label agency support',
    situation: 'An agency needs dependable delivery capacity for clients.',
    recurringWork: 'Feature work, fixes and release support under agreed capacity.',
    whySubscription: 'Agency demand fluctuates and benefits from retained context.',
    whenProject: 'A discrete client launch with fixed deliverables may remain project-based.',
  },
] as const;

export const benefits = [
  {
    title: 'Retained product context',
    text: 'The delivery team builds familiarity with your systems, reducing repeated onboarding.',
  },
  {
    title: 'Reduced repeated procurement',
    text: 'New work can start from an existing engagement rather than a fresh proposal each time.',
  },
  {
    title: 'Reprioritisation',
    text: 'Urgent needs can move forward, with lower-priority items remaining visible in the backlog.',
  },
  {
    title: 'Predictable engagement',
    text: 'A monthly rhythm makes commercial planning clearer than ad-hoc project starts.',
  },
  {
    title: 'Access to broader skills',
    text: 'Product, engineering and QA support can be coordinated without hiring every role immediately.',
  },
  {
    title: 'Regular delivery rhythm',
    text: 'Work moves through a visible process from request to release.',
  },
  {
    title: 'Clearer backlog visibility',
    text: 'Priorities, blockers and upcoming work remain easier to discuss.',
  },
  {
    title: 'Continuity between improvement and support',
    text: 'Fixes, enhancements and release support can sit in one managed system.',
  },
] as const;

export const limitations = [
  {
    title: 'Capacity is finite',
    text: 'An agreed monthly allocation cannot absorb every request at once.',
  },
  {
    title: 'Unlimited requests do not mean unlimited delivery',
    text: 'Submitting more work than capacity allows simply increases backlog pressure.',
  },
  {
    title: 'Prioritisation is required',
    text: 'Someone must decide what matters most each cycle.',
  },
  {
    title: 'Large one-off builds may need another model',
    text: 'Fixed-scope programmes can be a better fit than monthly capacity alone.',
  },
  {
    title: 'Unclear requirements consume capacity',
    text: 'Vague briefs still use estimation and clarification time.',
  },
  {
    title: 'Weak codebases may need discovery',
    text: 'Unstable or undocumented systems may require a paid discovery or stabilisation phase first.',
  },
  {
    title: 'Client delays affect delivery',
    text: 'Slow decisions, missing access or delayed feedback reduce what can be completed.',
  },
  {
    title: 'Not every specialist is permanently assigned',
    text: 'Specialist support is typically included where relevant to the plan, not as a permanent dedicated bench.',
  },
  {
    title: 'Outcomes still depend on communication',
    text: 'Clear priorities and timely decisions remain essential.',
  },
] as const;

export const providerChecklist = [
  'How is monthly capacity defined—hours, days, credits or planned outputs?',
  'How many active workstreams are normally supported at once?',
  'How visible is the shared backlog to the client?',
  'How are estimates produced and revised?',
  'What is the weekly or monthly communication rhythm?',
  'How is QA included in delivery?',
  'Who handles deployment and release checks?',
  'What documentation is produced during the engagement?',
  'Who owns custom source code and project-specific assets after payment?',
  'How are third-party licences and open-source components handled?',
  'How are security, access and offboarding controlled?',
  'What are the cancellation, pause and notice terms?',
  'What does handover look like if the engagement ends?',
  'How is an unfamiliar or weak codebase assessed before normal delivery begins?',
  'How are urgent requests handled when capacity is already allocated?',
] as const;

export const decisionFit = {
  goodFit: [
    'You have recurring development needs',
    'Priorities evolve over time',
    'You have—or can create—a visible backlog',
    'You need more than one technical skill over time',
    'You do not yet need a full internal team',
    'You want continuity across improvements and support',
  ],
  otherModel: [
    'The work is one-off with stable scope',
    'A large dedicated team is required immediately',
    'Work is highly regulated and needs specialist certification',
    '24/7 operational support is critical',
    'There is no ongoing backlog',
    'Internal hiring is already a strategic priority',
  ],
} as const;

export const pillarFaqs = [
  {
    question: 'Is subscription-based software development the same as SaaS?',
    answer:
      'Not always. SaaS usually means software customers access through a subscription. Subscription-based software development can also mean buying recurring development capacity. The phrases overlap in conversation, but they describe different models.',
  },
  {
    question: 'What is Software Development as a Subscription?',
    answer:
      'Software Development as a Subscription gives a business an agreed level of recurring development capacity. Requirements are clarified, prioritised through a shared backlog, developed, tested and released under a continuing monthly engagement.',
  },
  {
    question: 'Is a development subscription unlimited?',
    answer:
      'No. Capacity is finite. Requests can be unlimited in volume, but delivery is prioritised against the agreed monthly allocation. Treating the model as unlimited delivery usually creates unrealistic expectations.',
  },
  {
    question: 'How much work can be completed each month?',
    answer:
      'That depends on the agreed capacity, the complexity of the system, the clarity of requirements and how much change happens mid-cycle. Estimation against available capacity is the practical control, not a fixed number of features.',
  },
  {
    question: 'Can priorities change during the month?',
    answer:
      'Yes. Urgent requirements can often be reprioritised, but doing so may move other planned work. Transparent trade-offs keep delivery realistic.',
  },
  {
    question: 'Who owns the source code?',
    answer:
      'In a well-structured engagement, the client typically owns the custom source code and project-specific assets created for them once applicable invoices are paid. Pre-existing components, open-source software and third-party services remain subject to their own licence terms.',
  },
  {
    question: 'Is this model suitable for startups?',
    answer:
      'It can be, especially after an MVP when priorities change frequently and a full internal team is not yet justified. Early fixed-scope builds may still start as a defined project.',
  },
  {
    question: 'When is fixed-price development a better choice?',
    answer:
      'Fixed-price delivery is generally more suitable for a clearly defined one-off project with stable scope and deliverables. A subscription is generally more suitable for ongoing and evolving work.',
  },
  {
    question: 'Can an existing application be supported?',
    answer:
      'Yes. Many development subscriptions support existing applications through fixes, integrations, stabilisation and incremental improvement. Severe instability may still need a short discovery or rescue phase first.',
  },
  {
    question: 'What happens if the codebase is in poor condition?',
    answer:
      'A responsible provider should assess risk before promising normal monthly delivery. Where the codebase is unstable, undocumented or difficult to estimate, a paid discovery or stabilisation phase is often the safer starting point.',
  },
] as const;

export const relatedLiveLinks = [
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial service page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'Development subscription vs fixed-price software development',
    description:
      'Decision guide comparing recurring monthly capacity with fixed-price software projects.',
    href: '/insights/software-development-subscription-vs-fixed-price',
  },
  {
    title: 'Software development subscription use cases',
    description:
      'Ten practical situations where monthly delivery capacity may fit—and where another model may be better.',
    href: '/insights/software-development-subscription-use-cases',
  },
  {
    title: 'How monthly development capacity works',
    description: 'How backlog items, estimation, QA, releases and urgent work consume finite capacity.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
  {
    title: 'How to prioritise software development requests',
    description: 'A practical framework for turning a backlog into a monthly delivery plan.',
    href: SDAAS_PRIORITISATION_HREF,
  },
  {
    title: 'Why businesses move to continuous development',
    description: 'The strategic shift from one-off projects to ongoing software capability.',
    href: SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  },
  {
    title: 'Maintenance vs continuous product development',
    description: 'Clear service boundaries between keeping systems dependable and expanding capability.',
    href: SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  },
  {
    title: 'How to choose a software development partner',
    description: 'Buyer checklist covering discovery, delivery, QA, ownership and handover.',
    href: SDAAS_CHOOSE_PARTNER_HREF,
  },
] as const;

export const relatedBlogLinks = [
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

export { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH };
