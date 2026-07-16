export const SDAAS_PAGE_PATH = '/software-development-subscription-uk';
export const SDAAS_CAPACITY_REQUEST_PATH = `${SDAAS_PAGE_PATH}/request-capacity`;
export const SDAAS_PROCESS_ANCHOR = 'monthly-delivery-process';
export const SDAAS_CAPACITY_ANCHOR = 'monthly-delivery-capacity';
export const SDAAS_FAQ_ANCHOR = 'faq';

export const SDAAS_SEO = {
  title: 'Software Development Subscription UK | Primewayz UK',
  description:
    'Flexible monthly software development capacity for UK businesses. Prioritised delivery, ongoing improvements, integrations, QA and technical support.',
  ogTitle: 'Software Development as a Subscription for UK Businesses',
  ogDescription:
    'Structured monthly software development capacity for UK businesses that need continuous improvements—without unlimited-development promises.',
} as const;

export const SDAAS_DEFINITION =
  'Software Development as a Subscription gives your business an agreed level of monthly delivery capacity. Requirements are clarified, estimated and prioritised through a shared backlog, then delivered through a structured development and quality-assurance process.';

export const SDAAS_CLARIFICATION =
  'It is not an unlimited task service. It is planned, prioritised and visible software delivery under a predictable monthly engagement.';

export const audienceCards = [
  {
    title: 'Growing SMEs',
    description: 'Businesses with internal systems that require continuous improvement.',
  },
  {
    title: 'Post-MVP Startups',
    description: 'Products needing regular development without hiring a complete technical team.',
  },
  {
    title: 'Businesses with Development Backlogs',
    description: 'Organisations with accumulated improvements, fixes and integrations.',
  },
  {
    title: 'Non-Technical Founders',
    description: 'Leaders requiring structured delivery support and technical guidance.',
  },
  {
    title: 'Companies Replacing Manual Processes',
    description: 'Businesses moving away from spreadsheets and disconnected tools.',
  },
  {
    title: 'Agencies Requiring Delivery Capacity',
    description: 'Teams needing dependable white-label technical support.',
  },
] as const;

export const deliverableGroups = [
  {
    title: 'Product Improvements',
    items: ['new features', 'usability improvements', 'workflow refinement', 'backlog delivery'],
  },
  {
    title: 'Technical Development',
    items: ['frontend development', 'backend development', 'API development', 'database improvements'],
  },
  {
    title: 'Integration and Automation',
    items: [
      'CRM integrations',
      'third-party integrations',
      'business-process automation',
      'data synchronisation',
    ],
  },
  {
    title: 'Stabilisation and Support',
    items: [
      'bug fixing',
      'performance improvement',
      'technical-debt reduction',
      'existing application rescue',
    ],
  },
  {
    title: 'Quality and Release',
    items: ['functional QA', 'regression checks', 'deployment support', 'release documentation'],
  },
] as const;

export const deliverySteps = [
  {
    title: 'Submit the Requirement',
    text: 'Share the improvement, fix, integration or feature you need through the agreed channel.',
  },
  {
    title: 'Clarify and Estimate',
    text: 'We review the request, clarify acceptance criteria and estimate the delivery effort against available capacity.',
  },
  {
    title: 'Agree the Priority',
    text: 'You decide what should move first. Lower-priority items remain visible in the shared backlog.',
  },
  {
    title: 'Develop',
    text: 'Work progresses within the agreed monthly capacity, with updates on progress and blockers.',
  },
  {
    title: 'Test and Review',
    text: 'Quality checks and review happen before release so changes are controlled and reviewable.',
  },
  {
    title: 'Release and Report',
    text: 'Completed work is released or handed over, and remaining capacity and priorities are reviewed.',
  },
] as const;

export const onboardingSteps = [
  'Initial consultation',
  'Business and system review',
  'Codebase or environment assessment',
  'Backlog and priority review',
  'Capacity recommendation',
  'Onboarding and access setup',
  'First delivery cycle',
] as const;

export const goodFitItems = [
  'continuous improvements',
  'evolving requirements',
  'recurring backlog',
  'integration work',
  'application stabilisation',
  'ongoing SaaS development',
  'no complete internal technical team',
] as const;

export const separateProjectItems = [
  'large new platform with a clearly fixed scope',
  'urgent enterprise-scale rebuild',
  'fully dedicated team requirement',
  '24/7 critical support requirement',
  'formal compliance work requiring specialist certification',
] as const;

export const traditionalProjectPoints = [
  'repeated scoping',
  'separate quotes',
  'repeated approvals',
  'context lost between projects',
  'slower restart',
  'fragmented delivery',
] as const;

export const subscriptionModelPoints = [
  'one continuing engagement',
  'shared backlog',
  'agreed monthly capacity',
  'priorities that can change',
  'retained product knowledge',
  'regular delivery cycles',
] as const;

export const examplePriorityPlan = [
  { priority: 1, label: 'Customer onboarding improvement' },
  { priority: 2, label: 'CRM integration fix' },
  { priority: 3, label: 'Reporting enhancement' },
  { priority: 4, label: 'Smaller usability updates' },
] as const;

export const capacityLevels = [
  {
    name: 'Essential Capacity',
    description: 'For small backlogs, fixes and ongoing improvements.',
  },
  {
    name: 'Growth Capacity',
    description: 'For regular feature development, integrations and product evolution.',
  },
  {
    name: 'Scale Capacity',
    description: 'For multiple workstreams or broader technical involvement.',
  },
] as const;

export type ComparisonRow = { aspect: string; subscription: string; alternative: string };

export const comparisonVsFixedPrice: ComparisonRow[] = [
  {
    aspect: 'Suitable work',
    subscription: 'Ongoing improvements, integrations and evolving backlog items',
    alternative: 'Defined builds with a clear, relatively stable scope',
  },
  {
    aspect: 'Scope flexibility',
    subscription: 'Priorities can shift within agreed monthly capacity',
    alternative: 'Scope is agreed up front; changes usually need re-quoting',
  },
  {
    aspect: 'Start of new work',
    subscription: 'New items enter the shared backlog without a full re-procurement cycle',
    alternative: 'Each new requirement often starts a separate project conversation',
  },
  {
    aspect: 'Procurement cycle',
    subscription: 'One continuing engagement after onboarding',
    alternative: 'Repeated scoping, quotes and approvals for each project',
  },
  {
    aspect: 'Retained product knowledge',
    subscription: 'Context builds across delivery cycles',
    alternative: 'Context may reset between separate commissions',
  },
  {
    aspect: 'Cost structure',
    subscription: 'Predictable monthly engagement based on capacity',
    alternative: 'Fixed price for a defined scope of work',
  },
];

export const comparisonVsHiring: ComparisonRow[] = [
  {
    aspect: 'Recruitment time',
    subscription: 'Faster to start once capacity and access are agreed',
    alternative: 'Hiring, onboarding and ramp-up can take months',
  },
  {
    aspect: 'Breadth of skills',
    subscription: 'Access to coordinated product, development and QA capability as needed',
    alternative: 'One hire rarely covers frontend, backend, QA and DevOps',
  },
  {
    aspect: 'Management overhead',
    subscription: 'Delivery follows a shared backlog and review rhythm',
    alternative: 'You manage day-to-day coordination and quality directly',
  },
  {
    aspect: 'Employment commitment',
    subscription: 'Commercial engagement rather than permanent employment',
    alternative: 'Employment, benefits and long-term headcount commitment',
  },
  {
    aspect: 'Ability to scale',
    subscription: 'Capacity can be reviewed as workload changes',
    alternative: 'Scaling usually means further hiring or contractors',
  },
  {
    aspect: 'Continuity',
    subscription: 'Knowledge retained across monthly delivery cycles',
    alternative: 'Continuity depends on retention and team coverage',
  },
];

export const comparisonVsOutsourcing: ComparisonRow[] = [
  {
    aspect: 'Engagement structure',
    subscription: 'Recurring monthly capacity with a prioritised backlog',
    alternative: 'Often project-based or ticket-based with less continuity',
  },
  {
    aspect: 'Repeated onboarding',
    subscription: 'Onboarding once, then continuing delivery',
    alternative: 'New vendors or projects may repeat discovery and access setup',
  },
  {
    aspect: 'Changing priorities',
    subscription: 'Priorities can be reviewed against remaining capacity',
    alternative: 'Change requests may require new statements of work',
  },
  {
    aspect: 'Communication',
    subscription: 'Agreed channel, weekly updates and monthly reviews',
    alternative: 'Communication quality varies by vendor and contract',
  },
  {
    aspect: 'Context retention',
    subscription: 'Product and system knowledge compounds over time',
    alternative: 'Context can fragment across vendors and projects',
  },
  {
    aspect: 'Delivery continuity',
    subscription: 'Steady rhythm for continuous product improvement',
    alternative: 'Delivery often pauses between commissions',
  },
];

export const sdaasFaqs = [
  {
    question: 'What is software development as a subscription?',
    answer:
      'Software Development as a Subscription provides an agreed amount of recurring development capacity rather than unlimited simultaneous delivery. Requirements are clarified, estimated and prioritised through a shared backlog, then delivered through a structured development and QA process.',
  },
  {
    question: 'How is monthly delivery capacity calculated?',
    answer:
      'Each plan contains an agreed allocation of monthly delivery capacity. Requests are estimated against that allocation so the highest-value work can move first. Internal planning may use person-days, but the commercial focus remains on prioritised outcomes within the agreed capacity—not artificial task-count promises.',
  },
  {
    question: 'Is this an unlimited development service?',
    answer:
      'No. Unlimited request queues usually hide limited delivery capacity. This model is planned, prioritised and visible. Work progresses within the agreed monthly capacity, and items that cannot fit remain visible in the backlog for later cycles.',
  },
  {
    question: 'How many requests can be active at once?',
    answer:
      'Normally one primary workstream progresses at a time. Smaller fixes or clarifications may run alongside it where capacity allows. Larger plans may support more than one agreed workstream. Upcoming requests stay visible and prioritised.',
  },
  {
    question: 'Can priorities change during the month?',
    answer:
      'Yes. Urgent requirements can be reprioritised, but doing so may move other planned work. This keeps delivery realistic and transparent rather than promising everything at once.',
  },
  {
    question: 'Can the subscription be paused or cancelled?',
    answer:
      'Plans normally begin with a short initial commitment—typically three months—to allow proper onboarding and meaningful delivery, then continue on a rolling monthly basis. After the initial term, plans may be paused or cancelled with agreed notice. Active work is brought to a safe stopping point and completed work is handed over. Exact terms are confirmed in the proposal and agreement.',
  },
  {
    question: 'Who owns the source code?',
    answer:
      'Once applicable invoices have been paid, you own the custom source code, documentation and project-specific assets created specifically for your engagement. Pre-existing components, open-source software and third-party services remain subject to their respective ownership and licence terms.',
  },
  {
    question: 'Is this suitable for startups?',
    answer:
      'Yes, particularly for startups that have moved beyond the initial MVP and need regular development without hiring a complete technical team. A large, fixed-scope platform build may still be better as a defined project.',
  },
  {
    question: 'What happens if the existing codebase is in poor condition?',
    answer:
      'Where an existing application is unstable, undocumented or difficult to assess, we may recommend a short paid discovery or stabilisation phase before beginning normal monthly delivery. That protects delivery quality and avoids consuming unplanned capacity.',
  },
  {
    question: 'How is this different from hiring a developer?',
    answer:
      'Hiring one developer does not automatically provide product, frontend, backend, QA and DevOps coverage. A development subscription provides structured monthly capacity with prioritisation, coordinated delivery disciplines where relevant, and a visible backlog—without the recruitment lead time or full employment commitment of building an internal team.',
  },
] as const;

export const helpNeedOptions = [
  'Existing application improvements',
  'New feature development',
  'Software rescue or stabilisation',
  'API or system integration',
  'SaaS product development',
  'Business-process automation',
  'Not sure yet',
] as const;

export const timeframeOptions = [
  'As soon as practical',
  'Within 30 days',
  'Within 1–3 months',
  'Exploring options',
] as const;

export const budgetRangeOptions = [
  'Prefer not to say',
  'Under £2,000 / month',
  '£2,000–£5,000 / month',
  '£5,000–£10,000 / month',
  'Over £10,000 / month',
] as const;
