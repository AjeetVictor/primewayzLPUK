import {
  CANONICAL_ROUTES,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';
import type { SupportingArticleDefinition } from './supportingArticleTypes';

/** TOF explainer — how monthly development capacity is allocated, estimated and delivered. */
export const SDAAS_CAPACITY_PATH = SDAAS_MONTHLY_CAPACITY_HREF;

export const SDAAS_CAPACITY_SEO = {
  title: 'How Monthly Software Development Capacity Works',
  description:
    'Learn how monthly software development capacity is allocated, prioritised, estimated and delivered across backlog items, QA, releases and urgent work.',
  ogTitle: 'How Monthly Software Development Capacity Actually Works',
  ogDescription:
    'Monthly development capacity is finite, prioritised delivery effort—not unlimited output. Learn how backlog intake, estimation, QA and releases fit within it.',
  h1: 'How Monthly Software Development Capacity Actually Works',
  standfirst:
    'Monthly software development capacity is the agreed amount of recurring delivery effort your business receives each cycle. Understanding how that capacity is allocated, estimated and consumed helps set realistic expectations before you commit.',
  category: 'Process Guide',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '17 min read',
  keywords: [
    'monthly software development capacity',
    'development capacity allocation',
    'software development subscription capacity',
    'monthly development effort',
    'backlog prioritisation capacity',
    'QA and release capacity',
    'software delivery capacity UK',
    'ongoing development capacity',
    'capacity vs hours software development',
    'monthly software delivery planning',
  ],
} as const;

export const SDAAS_CAPACITY_OG_IMAGE =
  '/articles/sdaas/og-how-monthly-software-development-capacity-works.webp';

export const SDAAS_CAPACITY_DIRECT_ANSWER =
  'Monthly software development capacity is an agreed amount of recurring delivery effort used to clarify, build, test and release prioritised software work. It does not guarantee a fixed number of features because complexity, dependencies and review cycles vary.';

export const CAPACITY_GEO_STATEMENTS = [
  'Reprioritisation changes the order of work, not the amount of available capacity.',
  'QA, clarification and release work are part of delivery capacity, not separate from it.',
  'A predictable monthly fee creates budget consistency, not identical monthly output.',
] as const;

export const exampleAllocationRows = [
  ['Feature development', '35–45%', 'User-facing improvements, workflow changes, admin tools'],
  ['Integrations and APIs', '15–25%', 'CRM sync, webhooks, third-party connections'],
  ['Bug fixes and stabilisation', '10–20%', 'Defect resolution, performance tuning, dependency updates'],
  ['QA, testing and release', '15–20%', 'Regression checks, deployment, release notes, smoke testing'],
  ['Planning and clarification', '10–15%', 'Estimation, acceptance criteria, backlog grooming, technical review'],
] as const;

export const capacityBuyerChecklist = [
  'How is monthly capacity defined—in hours, days, credits or planned outputs?',
  'What proportion of capacity is normally reserved for QA, clarification and release work?',
  'How many active workstreams can run in parallel without splitting focus?',
  'How visible is the shared backlog, and who can add items to it?',
  'How are estimates produced, and what happens when an item exceeds the estimate?',
  'How are urgent requests handled when capacity is already allocated?',
  'Does unused capacity roll over, and if so under what conditions?',
  'What reporting is provided at the end of each cycle?',
  'How are client delays in feedback or access handled?',
  'When would the provider recommend discovery, rescue or a different delivery model?',
] as const;

export const capacityFaqs = [
  {
    question: 'Does monthly development capacity mean a fixed number of features each month?',
    answer:
      'No. Capacity is an agreed amount of delivery effort, not a feature quota. Output depends on complexity, dependencies, clarity of requirements and how much time is spent on QA, clarification and release work. Some months may complete several small items; others may focus on one larger change.',
  },
  {
    question: 'Can priorities change during the month?',
    answer:
      'Yes. Items can usually be reordered in the backlog so urgent work moves forward. Other planned work may move back. Reprioritisation changes the order of work, not the amount of available capacity.',
  },
  {
    question: 'Is QA included in monthly capacity or billed separately?',
    answer:
      'In a well-structured development subscription, QA, testing and release preparation are part of delivery capacity—not an optional add-on. Treating them as separate often underestimates how much effort is required to ship dependable software.',
  },
  {
    question: 'What happens when the backlog exceeds available capacity?',
    answer:
      'Lower-priority items remain visible in the backlog for future cycles. The provider should explain trade-offs clearly rather than silently overcommitting. Increasing throughput usually means adjusting the agreed capacity level, not assuming unlimited parallel delivery.',
  },
  {
    question: 'Does unused capacity roll over to the next month?',
    answer:
      'That depends on the commercial agreement. Some providers allow limited rollover when client delays prevented planned work; others treat each month as a fresh allocation. The important point is that capacity is finite—rollover is a contractual choice, not an automatic entitlement.',
  },
  {
    question: 'How is capacity different from hiring a named developer?',
    answer:
      'Named-developer arrangements usually assign one person full-time. Monthly capacity typically draws on a team with complementary skills—development, QA, release support—allocated to prioritised work. The model focuses on delivery outcomes within an agreed allocation, not on a single individual’s calendar.',
  },
  {
    question: 'Can multiple workstreams run at the same time?',
    answer:
      'Sometimes, but splitting capacity across too many parallel streams reduces throughput. Many engagements work best with one primary workstream and occasional smaller parallel tasks. The provider should explain how many active streams the agreed capacity can support realistically.',
  },
  {
    question: 'What slows delivery even when capacity is available?',
    answer:
      'Unclear requirements, delayed feedback, missing access, unresolved dependencies and mid-cycle scope expansion all consume capacity without producing releasable output. Client input delays are a common reason planned work slips to a later cycle.',
  },
  {
    question: 'Is a predictable monthly fee the same as predictable output?',
    answer:
      'No. A predictable monthly fee creates budget consistency, not identical monthly output. Delivery volume varies with item size, technical risk and review cycles even when the fee stays the same.',
  },
  {
    question: 'When should capacity not be committed yet?',
    answer:
      'When the codebase is unknown, unstable or poorly documented, a discovery or stabilisation phase should usually come first. An unknown codebase should normally be assessed before monthly delivery capacity is committed.',
  },
] as const;

export const capacityRelatedLiveLinks = [
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial service page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'Subscription-Based Software Development Guide',
    description: 'Educational pillar covering subscription software and development subscriptions.',
    href: SDAAS_PILLAR_GUIDE_HREF,
  },
  {
    title: 'Development subscription vs fixed-price',
    description: 'Decision guide comparing recurring capacity with fixed-price software projects.',
    href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  },
  {
    title: 'Software development subscription use cases',
    description: 'Practical situations where monthly delivery capacity may fit.',
    href: SDAAS_USE_CASES_HREF,
  },
  {
    title: 'How to prioritise software development requests',
    description: 'Turn a backlog of possibilities into a monthly delivery plan.',
    href: SDAAS_PRIORITISATION_HREF,
  },
  {
    title: 'Website and application maintenance',
    description: 'How maintenance differs from continuous product development capacity.',
    href: CANONICAL_ROUTES.maintenance,
  },
] as const;

export const capacityRelatedBlogLinks = [
  {
    title: 'Fixed-price vs time & material vs subscription support',
    description: 'A practical comparison of delivery models for UK SMEs and SaaS founders.',
    href: '/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  },
  {
    title: 'Why UK SMEs need monthly digital support',
    description: 'When recurring delivery rhythm suits evolving business systems.',
    href: '/blog/monthly-digital-support-uk-smes',
  },
] as const;

export const capacityArticle: SupportingArticleDefinition = {
  slug: 'how-monthly-software-development-capacity-works',
  path: SDAAS_CAPACITY_PATH,
  seo: SDAAS_CAPACITY_SEO,
  ogImage: SDAAS_CAPACITY_OG_IMAGE,
  breadcrumbLabel: 'Monthly development capacity',
  cardCategory: 'Process Guide',
  contentType: 'explainer',
  funnelStage: 'tof',
  primaryIntent: 'capacity explanation',
  targetTopic: 'monthly software development capacity',
  analyticsNamespace: 'sdaas_capacity',
  directAnswerTitle: 'What Does Monthly Development Capacity Mean?',
  directAnswer: SDAAS_CAPACITY_DIRECT_ANSWER,
  directAnswerFollow:
    'Capacity is best understood as planned, prioritised delivery effort—not unlimited development throughput or a fixed feature count.',
  introParagraphs: [
    'Businesses evaluating a software development subscription often ask how much work they will receive each month. The honest answer is that monthly capacity describes an agreed allocation of delivery effort, not a guaranteed list of features or tickets closed.',
    'That distinction matters because real software delivery includes clarification, estimation, development, quality assurance, release preparation and coordination—not just coding time. When those activities are visible, expectations become more realistic and prioritisation conversations become easier.',
    'This guide explains how monthly capacity is defined, how work enters the backlog, how estimates and priorities are agreed, and what happens when demand exceeds the allocation or client input is delayed.',
  ],
  introAsides: [
    {
      label: 'Commercial overview',
      href: SDAAS_PAGE_PATH,
      linkLabel: 'Software Development as a Subscription',
    },
    {
      label: 'Prioritisation guide',
      href: SDAAS_PRIORITISATION_HREF,
      linkLabel: 'How to prioritise development requests',
    },
    {
      label: 'Rescue and stabilisation',
      href: SDAAS_APPLICATION_RESCUE_HREF,
      linkLabel: 'Application rescue before ongoing development',
    },
  ],
  geoStatements: CAPACITY_GEO_STATEMENTS,
  sections: [
    {
      id: 'direct-answer',
      sectionKey: 'direct_answer',
      title: 'What Does Monthly Development Capacity Mean?',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            SDAAS_CAPACITY_DIRECT_ANSWER,
            'Capacity is the recurring delivery effort your provider allocates each cycle to clarify requirements, implement changes, test them and release approved work. It is agreed commercially—often as a monthly plan—and then consumed through prioritised backlog items.',
            'Thinking of capacity as effort rather than output helps explain why two months with the same fee can produce different visible results. A month dominated by a complex integration consumes more capacity than a month of small interface refinements, even when both are valuable.',
          ],
        },
        { type: 'geo', statements: CAPACITY_GEO_STATEMENTS },
      ],
    },
    {
      id: 'finite-not-unlimited',
      sectionKey: 'finite_capacity',
      title: 'Capacity Is Finite, Not Unlimited',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Monthly development capacity has a boundary. Requests can continue to arrive, but only a prioritised subset can be worked on within the agreed allocation. Treating the model as unlimited development usually leads to disappointment on both sides.',
            'Finite capacity is not a weakness—it is the mechanism that makes prioritisation honest. When capacity is visible, stakeholders can see trade-offs instead of assuming every request can start immediately.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'New backlog items do not automatically create additional delivery effort.',
            'Parallel workstreams multiply coordination cost and can reduce overall throughput.',
            'Urgent work can move forward, but it typically displaces other planned items.',
            'Increasing output sustainably usually means adjusting the agreed capacity level.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'A development subscription purchases recurring delivery capacity. It does not purchase unlimited task completion or guaranteed same-size releases every month.',
        },
      ],
    },
    {
      id: 'backlog-intake',
      sectionKey: 'backlog_intake',
      title: 'How Work Enters the Backlog',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Work usually enters through an agreed intake channel—shared document, project board, form or structured email—so requests are captured in one place rather than scattered across messages. The goal is to create a visible queue that both client and provider can review.',
            'Not every request should start immediately. Intake is the first filter: capture the idea, identify the requester, note urgency and attach any known context. Items then wait for clarification and estimation before they join the prioritised delivery plan.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Capture the business outcome, not only the proposed technical solution.',
            'Note dependencies on third-party systems, approvals or other backlog items.',
            'Flag whether the item is defect, enhancement, integration or operational change.',
            'Keep rejected or deferred items visible with a short reason where helpful.',
          ],
        },
      ],
    },
    {
      id: 'clarification',
      sectionKey: 'clarification',
      title: 'How Requirements Are Clarified',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Clarification turns a request into something estimable and testable. That often means defining acceptance criteria, identifying affected users or workflows, confirming environments and agreeing what success looks like for the cycle.',
            'Clarification consumes capacity. It is not overhead outside delivery—it is part of dependable software work. Skipping it may appear to save time early in a cycle, but it usually increases rework later.',
          ],
        },
        {
          type: 'subsection',
          title: 'What good clarification includes',
          paragraphs: [
            'Clear acceptance criteria, known constraints, access to relevant systems and a named decision-maker for questions. Where requirements remain ambiguous, the provider should say so before committing the item to the current cycle.',
          ],
          bullets: [
            'User or operational scenario the change supports',
            'Expected behaviour after release',
            'Non-functional constraints such as performance or permissions',
            'Dependencies on data migration, API changes or approvals',
          ],
        },
      ],
    },
    {
      id: 'estimation',
      sectionKey: 'estimation',
      title: 'How Estimates Are Made',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Estimates compare the expected effort of a backlog item against available capacity. They are informed by system familiarity, technical complexity, dependency risk and the quality of clarification—not by wishful throughput targets.',
            'Estimates should be revisable. If investigation during development reveals unexpected complexity, the item should be re-discussed rather than silently absorbing unlimited extra effort within the same allocation.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Relative sizing against recent similar work in the same codebase',
            'Explicit allowance for QA, code review and release preparation',
            'Risk flags for unknown integrations, legacy areas or missing documentation',
            'Clear statement when an item is too large for one cycle and should be split',
          ],
        },
      ],
    },
    {
      id: 'priorities',
      sectionKey: 'priorities',
      title: 'How Priorities Are Agreed',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Priorities decide which clarified items enter the current cycle. That decision should combine business value, urgency, risk, dependencies and effort—not simply the most recent request or the loudest stakeholder.',
            'Reprioritisation is normal in ongoing development. Changing the order of work is expected; assuming that change creates extra capacity is not. For a practical scoring approach, see the guide on prioritising software development requests.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Reprioritisation changes the order of work, not the amount of available capacity.',
        },
      ],
    },
    {
      id: 'workstreams',
      sectionKey: 'workstreams',
      title: 'One Primary Workstream vs Multiple Workstreams',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Many subscriptions work best with one primary workstream—such as product improvements on a single application—and occasional smaller parallel tasks that do not compete for the same attention.',
            'Multiple active workstreams can be appropriate when capacity is large enough and coordination overhead is managed deliberately. Splitting a small allocation across several streams often produces context switching, partial progress and slower releases.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'One primary stream suits most SME and post-MVP product engagements.',
            'Parallel streams need explicit ownership and separate acceptance paths.',
            'Emergency defects may interrupt a stream but should still be prioritised visibly.',
            'The provider should say when requested parallelism exceeds realistic capacity.',
          ],
        },
      ],
    },
    {
      id: 'qa-release',
      sectionKey: 'qa_release',
      title: 'How QA and Release Work Consume Capacity',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Development is not complete when code is written. Testing, regression checks, staging verification, deployment and post-release smoke testing all require time within the monthly allocation.',
            'QA, clarification and release work are part of delivery capacity, not separate from it. Plans that assume every hour is pure feature development usually underestimate what dependable delivery actually requires.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.deliveryProcess,
          caption:
            'Monthly delivery includes intake, clarification, development, quality assurance and release—not coding alone.',
        },
        {
          type: 'bullets',
          items: [
            'Peer review and automated checks where appropriate',
            'Manual test paths for business-critical workflows',
            'Release notes or handover summary for stakeholders',
            'Rollback or hotfix planning for production-impacting changes',
          ],
        },
      ],
    },
    {
      id: 'urgent-work',
      sectionKey: 'urgent_work',
      title: 'How Urgent Work Affects Planned Work',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Urgent defects or blocking issues can legitimately move ahead of planned enhancements. The backlog should reflect that shift transparently so stakeholders understand what is delayed and why.',
            'Urgent work can change priority order, but it does not create additional delivery capacity. If every item is labelled urgent, prioritisation loses meaning and planned work never stabilises.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'A healthy subscription distinguishes genuine production impact from preference-driven urgency. Both client and provider benefit when urgency criteria are agreed upfront.',
        },
      ],
    },
    {
      id: 'exceeds-capacity',
      sectionKey: 'exceeds_capacity',
      title: 'What Happens When Work Exceeds Capacity',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'When the prioritised backlog for a cycle exceeds available capacity, lower-priority items remain queued for future months. That is normal—not a failure of the model—provided the backlog stays visible and trade-offs are discussed openly.',
            'Options include deferring items, splitting large work into smaller releasable slices, increasing the agreed capacity level or scoping a separate fixed-price phase for a major module. Silent overcommitment helps no one.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Defer lower-priority items with a clear revisit date or trigger',
            'Split epics into independently releasable increments',
            'Re-estimate after discovery if scope was initially uncertain',
            'Adjust capacity commercially when sustained demand exceeds the plan',
          ],
        },
      ],
    },
    {
      id: 'client-delays',
      sectionKey: 'client_delays',
      title: 'What Happens When Client Input Is Delayed',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Software delivery depends on timely decisions, feedback and access. When approvals stall, credentials are missing or acceptance testing is delayed, planned work may slip even though provider capacity was available.',
            'Responsible providers distinguish between provider-side delay and client-side delay in reporting. Some agreements address unused capacity when client delay prevented scheduled work; others treat the month as consumed once allocated. That should be understood before engagement begins.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Name decision-makers for requirements and acceptance',
            'Agree expected feedback turnaround for in-cycle items',
            'Provide staging access and test accounts promptly',
            'Escalate blockers early rather than at cycle end',
          ],
        },
      ],
    },
    {
      id: 'rollover',
      sectionKey: 'rollover',
      title: 'Whether Unused Capacity Rolls Over',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Rollover policies vary. Some providers allow limited carry-forward when client delay prevented delivery; others treat each month as a distinct allocation. Neither approach makes capacity unlimited—it only defines what happens to unused effort.',
            'The more useful question is why capacity was unused. Repeated under-use may indicate unclear priorities, internal bottlenecks or a capacity level set higher than current demand. Repeated over-demand suggests the opposite.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'A predictable monthly fee creates budget consistency, not identical monthly output. Rollover, if offered, is a commercial term—not an automatic way to bank unlimited development time.',
        },
      ],
    },
    {
      id: 'capacity-units',
      sectionKey: 'capacity_units',
      title: 'Capacity vs Hours, Days, Credits and Named Developers',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Providers describe capacity in different units: hours, days, story points, credits or planned outputs. The unit matters less than whether both parties understand what is included—development, QA, release, meetings and clarification.',
            'Named-developer models assign an individual’s calendar. Capacity-based models assign delivery effort that may be fulfilled by different specialists across the month. Each approach has trade-offs in continuity, coverage and management overhead.',
          ],
        },
        {
          type: 'table',
          headers: ['Unit', 'What it usually implies', 'Watch for'],
          rows: [
            ['Hours or days', 'Time-based allocation across the team', 'Whether meetings, QA and release time are included'],
            ['Credits or points', 'Relative effort currency for backlog items', 'How credits map to real clarificaton and testing work'],
            ['Planned outputs', 'Agreed deliverables per cycle', 'What happens when scope expands after work starts'],
            ['Named developer', 'One primary individual assigned', 'Holiday cover, QA depth and skill breadth'],
          ],
        },
      ],
    },
    {
      id: 'example-allocation',
      sectionKey: 'example_allocation',
      title: 'Example Monthly Allocation',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'The table below is illustrative—not a universal formula. Actual allocation shifts with product maturity, defect volume, integration load and how much clarification a backlog requires.',
            'Use it as a conversation starter with your provider: where does time go in a typical cycle, and what would change if urgent defects or a large feature dominated the month?',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.monthlyCapacity,
          caption:
            'Illustrative allocation of monthly capacity across feature work, integrations, stabilisation, QA and planning.',
        },
        {
          type: 'table',
          headers: ['Category', 'Approximate share', 'Typical work'],
          rows: exampleAllocationRows.map((row) => [...row]),
        },
      ],
    },
    {
      id: 'reporting',
      sectionKey: 'reporting',
      title: 'How Reporting Should Work',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Reporting should show what was prioritised, what progressed, what was released, what was blocked and what carries forward—not a vague activity summary. Good reporting connects delivery back to business priorities.',
            'Cadence varies: weekly check-ins for active cycles, monthly summaries for stakeholders who approve budgets. Reports should mention capacity consumed by QA, clarification and release work so those efforts stay visible.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Priorities at the start of the cycle versus outcomes at the end',
            'Items released, deferred or split',
            'Blockers requiring client action',
            'Risks affecting next cycle estimates',
            'Upcoming decisions needed for continued progress',
          ],
        },
      ],
    },
    {
      id: 'buyer-questions',
      sectionKey: 'buyer_questions',
      title: 'Questions Buyers Should Ask',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Before committing to a monthly plan, ask how capacity is defined in practice—not only on the pricing page. The answers should be specific enough to test against real backlog behaviour.',
          ],
        },
        { type: 'checklist', items: capacityBuyerChecklist },
      ],
    },
  ],
  faqs: capacityFaqs,
  relatedLiveLinks: capacityRelatedLiveLinks,
  relatedBlogLinks: capacityRelatedBlogLinks,
  reusableVisuals: [
    SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.basePath,
    SDAAS_COMMERCIAL_IMAGES.deliveryProcess.basePath,
  ],
  aboutEntities: [
    'Monthly software development capacity',
    'Software Development as a Subscription',
    'Software backlog prioritisation',
    'Quality assurance in agile delivery',
  ],
  mentionEntities: [
    'Development subscription',
    'Fixed-price software project',
    'Technical debt',
    'Application rescue',
    'Release management',
    'Acceptance criteria',
  ],
  conclusion: {
    paragraphs: [
      'Monthly software development capacity is best understood as finite, prioritised delivery effort that includes clarification, build, test and release work—not a fixed feature quota or unlimited task list.',
      'When capacity, priorities and reporting are visible, businesses can plan more honestly, respond to urgent work without pretending capacity expanded, and decide when to increase the plan or choose a different delivery model.',
      'If you are evaluating how much capacity fits your backlog and risk profile, start with a structured conversation rather than assuming every provider defines capacity the same way.',
    ],
    primaryCta: {
      label: 'Request a capacity recommendation',
      href: SDAAS_CAPACITY_REQUEST_PATH,
    },
    secondaryCta: {
      label: 'View the commercial service page',
      href: SDAAS_PAGE_PATH,
    },
  },
};

export {
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_PAGE_PATH,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
};
