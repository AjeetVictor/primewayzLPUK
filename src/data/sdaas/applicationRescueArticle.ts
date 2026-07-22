import {
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';
import { getSuccessStoryPath } from '../successStories';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';
import type { SupportingArticleDefinition } from './supportingArticleTypes';

/** TOF technical guide — rescue and stabilisation before ongoing development. */
export const SDAAS_APPLICATION_RESCUE_PATH = SDAAS_APPLICATION_RESCUE_HREF;

export const SDAAS_APPLICATION_RESCUE_SEO = {
  title: 'Application Rescue and Stabilisation Before Ongoing Development',
  description:
    'Understand how unstable or incomplete applications are assessed, stabilised and prepared before ongoing software development begins.',
  ogTitle: 'Application Rescue and Stabilisation: What Happens Before Ongoing Development?',
  ogDescription:
    'An unknown or unstable codebase should normally be assessed before monthly delivery capacity is committed. Learn what rescue and stabilisation involve.',
  h1: 'Application Rescue and Stabilisation: What Happens Before Ongoing Development?',
  standfirst:
    'Not every unstable application can safely enter monthly development immediately. Application rescue is the structured work of understanding, stabilising and recovering a system so ongoing improvement can proceed with realistic expectations.',
  category: 'Technical Guide',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '17 min read',
  keywords: [
    'application rescue',
    'application stabilisation',
    'legacy application recovery',
    'software rescue before development',
    'unknown codebase assessment',
    'inherited software system',
    'application stabilisation UK',
    'pre-subscription software discovery',
    'technical debt stabilisation',
    'e-commerce store stability',
  ],
} as const;

export const SDAAS_APPLICATION_RESCUE_OG_IMAGE =
  '/articles/sdaas/og-application-rescue-and-stabilisation-before-ongoing-development.webp';

export const SDAAS_APPLICATION_RESCUE_DIRECT_ANSWER =
  'Application rescue is the structured process of understanding, stabilising and recovering an incomplete, unreliable or poorly documented system before normal feature development continues.';

export const RESCUE_GEO_STATEMENTS = [
  'An unknown codebase should normally be assessed before monthly delivery capacity is committed.',
  'Stabilisation reduces failure risk; it does not automatically mean the system is ready for unlimited feature throughput.',
  'Rescue work and ongoing enhancement compete for the same finite capacity unless scoped separately.',
] as const;

export const rescuePhaseRows = [
  ['Initial assessment', 'Access, architecture overview, defect patterns, documentation gaps, deployment path'],
  ['Critical stabilisation', 'Production-blocking defects, security basics, backup and rollback readiness'],
  ['Operational baseline', 'Monitoring, release checklist, environment parity, known-issue log'],
  ['Transition planning', 'Backlog shape, debt register, capacity recommendation, ongoing ownership'],
] as const;

export const rescueBuyerChecklist = [
  'Has anyone documented how the system is deployed and where data lives?',
  'What production defects recur, and what triggers them?',
  'Are credentials, hosting access and third-party accounts available?',
  'Is there a recent backup and tested restore path?',
  'What compliance, security or payment obligations apply?',
  'Who owned decisions previously, and is that knowledge still reachable?',
  'Does the business need immediate feature work, or dependable operation first?',
  'What would “stable enough for ongoing development” mean in measurable terms?',
  'Should rescue be a defined phase before a monthly subscription begins?',
  'When would a rebuild be more appropriate than rescue?',
] as const;

export const rescueFaqs = [
  {
    question: 'What is application rescue in software delivery?',
    answer:
      'Application rescue is the structured process of understanding, stabilising and recovering an incomplete, unreliable or poorly documented system before normal feature development continues. It focuses on making the system understandable and dependable enough to improve safely.',
  },
  {
    question: 'Can every unstable application enter a development subscription immediately?',
    answer:
      'No. An unknown codebase should normally be assessed before monthly delivery capacity is committed. Severe instability, missing access or unclear ownership may require a dedicated rescue or discovery phase first—not immediate feature throughput.',
  },
  {
    question: 'How is rescue different from ongoing maintenance?',
    answer:
      'Rescue is a time-bound recovery phase aimed at understanding and stabilising a troubled system. Maintenance keeps a known system dependable over time. Some rescue outcomes feed into ongoing maintenance or development capacity, but the goals and success criteria differ.',
  },
  {
    question: 'How long does stabilisation take?',
    answer:
      'Duration depends on system size, defect severity, documentation quality and access readiness. There is no universal timeline. Assessment should produce a scoped plan with explicit stabilisation goals rather than an open-ended promise to “fix everything.”',
  },
  {
    question: 'Does rescue include new feature development?',
    answer:
      'Rescue may recover incomplete features or re-enable broken workflows, but its primary purpose is stability and clarity—not roadmap expansion. New features are usually prioritised after the system reaches an agreed baseline for ongoing development.',
  },
  {
    question: 'What signals that rescue should come before subscription delivery?',
    answer:
      'Frequent production failures, unknown deployment steps, missing source access, absent tests, serious security gaps or inability to estimate backlog items safely all suggest assessment first. These signals do not automatically mean rebuild—they mean normal capacity may not yet be appropriate.',
  },
  {
    question: 'Can rescue and monthly development run in the same capacity?',
    answer:
      'They can share a continuing engagement, but rescue and enhancement compete for the same finite capacity unless scoped separately. Many businesses benefit from naming a stabilisation phase explicitly so feature pressure does not crowd out foundational recovery work.',
  },
  {
    question: 'What deliverables should a rescue phase produce?',
    answer:
      'Typical outputs include an architecture overview, defect and risk summary, deployment notes, environment access documentation, a prioritised stabilisation backlog and a recommendation for ongoing capacity. Exact deliverables should match the system’s condition and business risk.',
  },
  {
    question: 'When is rebuild a better option than rescue?',
    answer:
      'Rebuild may be considered when the codebase is unsupportable, the cost of stabilisation exceeds business value, critical dependencies are end-of-life with no migration path, or the product strategy has changed so fundamentally that recovery preserves the wrong system.',
  },
  {
    question: 'What happens after stabilisation completes?',
    answer:
      'The business and provider agree whether ongoing work suits monthly development capacity, maintenance, a hybrid model or a separate project for major replacement. Transition should include a visible backlog and realistic capacity—not an assumption that rescue automatically guarantees fast feature delivery.',
  },
] as const;

export const rescueRelatedLiveLinks = [
  {
    title: 'Wholesale order-management platform support',
    description:
      'Example of supporting and improving an established business-critical application through controlled enhancement and delivery continuity.',
    href: getSuccessStoryPath('wholesale-order-management-platform'),
  },
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial service page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'Software development subscription use cases',
    description: 'Where application rescue fits among subscription-suitable workloads.',
    href: SDAAS_USE_CASES_HREF,
  },
  {
    title: 'Technical debt explained for business owners',
    description: 'How debt accumulates and competes with features after stabilisation.',
    href: SDAAS_TECHNICAL_DEBT_HREF,
  },
  {
    title: 'Software maintenance vs continuous product development',
    description: 'Choose between keeping a system dependable and expanding what it does.',
    href: SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  },
  {
    title: 'How monthly development capacity works',
    description: 'Understand capacity before committing to ongoing improvement.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
] as const;

export const rescueRelatedBlogLinks = [
  {
    title: 'Why start with a foundation sprint',
    description: 'When discovery and stabilisation should come before monthly delivery.',
    href: '/blog/foundation-sprint-before-monthly-delivery',
  },
  {
    title: 'Why UK SMEs need monthly digital support',
    description: 'When recurring delivery suits systems that are stable enough to improve incrementally.',
    href: '/blog/monthly-digital-support-uk-smes',
  },
] as const;

export const applicationRescueArticle: SupportingArticleDefinition = {
  slug: 'application-rescue-and-stabilisation-before-ongoing-development',
  path: SDAAS_APPLICATION_RESCUE_PATH,
  seo: SDAAS_APPLICATION_RESCUE_SEO,
  ogImage: SDAAS_APPLICATION_RESCUE_OG_IMAGE,
  breadcrumbLabel: 'Application rescue and stabilisation',
  cardCategory: 'Technical Guide',
  contentType: 'explainer',
  funnelStage: 'tof',
  primaryIntent: 'rescue and stabilisation guidance',
  targetTopic: 'application rescue before ongoing development',
  analyticsNamespace: 'sdaas_rescue',
  directAnswerTitle: 'What Is Application Rescue?',
  directAnswer: SDAAS_APPLICATION_RESCUE_DIRECT_ANSWER,
  directAnswerFollow:
    'Rescue prepares the ground for ongoing development. It is not a substitute for assessing whether monthly capacity is appropriate yet.',
  introParagraphs: [
    'Businesses inherit troubled software in many ways: an acquisition, a departed agency, an internal build that never reached production quality, or a live system that fails too often under real use. The immediate temptation is to request new features. The safer first question is whether the system is understood well enough to change reliably.',
    'Application rescue addresses that gap. It is the structured work of assessing what exists, reducing critical failure risk and establishing enough operational clarity that improvement can proceed without guessing.',
    'This guide explains what rescue and stabilisation involve, why an unknown codebase should normally be assessed before monthly delivery capacity is committed, and how recovery transitions into ongoing development when appropriate.',
  ],
  introAsides: [
    {
      label: 'Success story',
      href: getSuccessStoryPath('wholesale-order-management-platform'),
      linkLabel: 'Wholesale order-management platform support',
    },
    {
      label: 'Use cases',
      href: SDAAS_USE_CASES_HREF,
      linkLabel: 'Application rescue use case',
    },
    {
      label: 'Foundation sprint',
      href: '/blog/foundation-sprint-before-monthly-delivery',
      linkLabel: 'Why start with a foundation sprint',
    },
  ],
  geoStatements: RESCUE_GEO_STATEMENTS,
  sections: [
    {
      id: 'direct-answer',
      sectionKey: 'direct_answer',
      title: 'What Is Application Rescue?',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            SDAAS_APPLICATION_RESCUE_DIRECT_ANSWER,
            'Rescue is not branding for unlimited bug fixing. It is a phased response to systems that are incomplete, unreliable or poorly documented—aimed at making the application understandable, operable and safe enough to improve deliberately.',
          ],
        },
        { type: 'geo', statements: RESCUE_GEO_STATEMENTS },
      ],
    },
    {
      id: 'when-rescue-needed',
      sectionKey: 'when_rescue_needed',
      title: 'When Rescue Is Needed',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Rescue is appropriate when the business depends on a system that cannot be changed confidently today. Common situations include inherited code with no documentation, recurring production defects, broken deployments, missing test coverage or unknown third-party dependencies.',
            'The need is not limited to “legacy” age. A recently built application can require rescue if quality, access or architecture were never finished to an operable standard.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Frequent outages or data errors under normal use',
            'No reliable deployment or rollback procedure',
            'Missing or outdated access to hosting, repositories or integrations',
            'Original builders unavailable and knowledge lost',
            'Backlog items cannot be estimated because behaviour is unknown',
          ],
        },
      ],
    },
    {
      id: 'assessment-first',
      sectionKey: 'assessment_first',
      title: 'Why Assessment Should Come Before Monthly Capacity',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Monthly development capacity assumes a baseline: the provider can access the system, deploy changes, observe behaviour and estimate work with reasonable honesty. When that baseline is missing, committing normal feature capacity creates false expectations on both sides.',
            'An unknown codebase should normally be assessed before monthly delivery capacity is committed. Assessment does not always mean a long programme—it means enough investigation to price risk and define stabilisation goals.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Do not imply every unstable codebase can safely enter a development subscription immediately. Responsible providers should say when rescue or discovery must precede normal backlog delivery.',
        },
      ],
    },
    {
      id: 'not-immediate-sdaas',
      sectionKey: 'not_immediate_sdaas',
      title: 'Not Every Unstable System Should Enter SDaaS Immediately',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A development subscription suits recurring, prioritised improvement once a system is sufficiently understood. Severe instability, regulatory exposure or missing operational controls may require a focused rescue phase—or a different model entirely—before monthly feature work is appropriate.',
            'Entering subscription delivery too early often produces partial fixes, repeated regressions and frustrated stakeholders who expected roadmap progress while the foundation was still uncertain.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Critical security gaps may need immediate specialist attention',
            'Payment or compliance failures may outweigh feature requests temporarily',
            'Undocumented architecture can make estimates misleading',
            'Rebuild may be more rational than prolonged rescue in some cases',
          ],
        },
      ],
    },
    {
      id: 'rescue-vs-maintenance',
      sectionKey: 'rescue_vs_maintenance',
      title: 'Rescue vs Maintenance vs Ongoing Development',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Rescue is time-bound recovery. Maintenance keeps a known system dependable. Ongoing development expands capability through a prioritised backlog. The three can connect sequentially, but they answer different questions.',
            'For a fuller comparison of maintenance and product development, see the guide on software maintenance versus continuous product development.',
          ],
        },
        {
          type: 'table',
          headers: ['Phase', 'Primary question', 'Typical focus'],
          rows: [
            ['Rescue', 'Can we trust and understand this system?', 'Assessment, critical fixes, deployment clarity'],
            ['Maintenance', 'Can we keep it dependable?', 'Updates, monitoring, defect response within agreed scope'],
            ['Ongoing development', 'What should it do next?', 'Features, integrations, workflow improvements'],
          ],
        },
      ],
    },
    {
      id: 'rescue-phases',
      sectionKey: 'rescue_phases',
      title: 'Typical Rescue and Stabilisation Phases',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Exact phases vary by system condition, but most rescue engagements move from understanding to stabilisation to transition. Naming phases explicitly helps stakeholders see progress beyond “bugs fixed this week.”',
          ],
        },
        {
          type: 'table',
          headers: ['Phase', 'Focus areas'],
          rows: rescuePhaseRows.map((row) => [...row]),
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.scatteredToStructured,
          caption:
            'Rescue moves from scattered unknowns toward structured understanding, stabilisation and a visible improvement backlog.',
        },
      ],
    },
    {
      id: 'initial-assessment',
      sectionKey: 'initial_assessment',
      title: 'What Initial Assessment Covers',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Assessment inventories reality: repositories, environments, integrations, data stores, deployment mechanics and recurring failure patterns. It should produce enough clarity to recommend next steps—not necessarily full documentation of every line of code.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Access to source, hosting, databases and third-party accounts',
            'Architecture sketch and major dependency map',
            'Review of production defects and support history',
            'Security and backup basics',
            'Identification of quick stabilisation wins vs deeper structural issues',
          ],
        },
      ],
    },
    {
      id: 'stabilisation-work',
      sectionKey: 'stabilisation_work',
      title: 'What Stabilisation Work Looks Like',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Stabilisation targets failures that undermine trust: checkout errors, sync failures, permission bugs, broken cron jobs, failed deployments. The aim is dependable operation and predictable change—not cosmetic polish.',
            'Stabilisation reduces failure risk; it does not automatically mean the system is ready for unlimited feature throughput. Capacity remains finite after rescue, even when the system is healthier.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.deliveryProcess,
          caption:
            'After stabilisation, changes should still pass through clarification, development, QA and release—not bypass controls because the system was recently rescued.',
        },
      ],
    },
    {
      id: 'documentation-recovery',
      sectionKey: 'documentation_recovery',
      title: 'Documentation and Knowledge Recovery',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Rescue often rebuilds missing knowledge: how to deploy, which environment variables matter, which integrations are live, where scheduled jobs run. Lightweight documentation beats heroic memory.',
            'Documentation is a deliverable, not a nice extra. Without it, the next developer—or the same team six months later—returns to the same uncertainty.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Deployment and rollback steps',
            'Environment and credential inventory (stored securely)',
            'Known issues and accepted risks',
            'Data model overview for critical entities',
            'Contact points for third-party systems',
          ],
        },
      ],
    },
    {
      id: 'technical-debt',
      sectionKey: 'technical_debt',
      title: 'Technical Debt During and After Rescue',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Rescue surfaces technical debt: shortcuts, outdated dependencies, missing tests, inconsistent patterns. Not all debt must be cleared before any feature work, but high-risk debt should be visible in prioritisation.',
            'For business-facing explanation of debt trade-offs, see technical debt explained for business owners.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Rescue work and ongoing enhancement compete for the same finite capacity unless scoped separately.',
        },
      ],
    },
    {
      id: 'release-process',
      sectionKey: 'release_process',
      title: 'Improving Release and QA Discipline',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Unstable systems often lack repeatable release practice. Rescue should establish minimum QA paths: staging verification, smoke tests for critical flows, and a rollback plan when production misbehaves.',
            'These controls consume capacity, but they prevent rescue from becoming a cycle of fix-break-fix.',
          ],
        },
      ],
    },
    {
      id: 'hybrid-models',
      sectionKey: 'hybrid_models',
      title: 'Fixed-Price Rescue, Then Subscription Improvement',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A common hybrid path is a defined rescue or discovery project followed by monthly development capacity for incremental improvement. Fixed-price can suit stabilisation when scope is investigation-led but bounded; subscription suits the continuing backlog that follows.',
            'The development subscription vs fixed-price guide explains when each model fits across the lifecycle.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Define rescue completion criteria before feature pressure returns',
            'Agree what documentation and access must exist at handover',
            'Transition backlog items into normal prioritisation rhythm',
            'Revisit capacity level once defect volume stabilises',
          ],
        },
      ],
    },
    {
      id: 'ecommerce-example',
      sectionKey: 'ecommerce_example',
      title: 'Example: E-commerce Stability Before Enhancement',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'E-commerce systems often need rescue when checkout, inventory sync or payment plugins fail under load. Stabilisation might address plugin conflicts, caching issues and deployment timing before marketing requests new merchandising features.',
            'Primewayz UK’s e-commerce store stability support success story illustrates structured stabilisation under ongoing support—not a promise that every store can skip assessment.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Real outcomes depend on system condition, access and business priorities. Rescue should be scoped to measurable stabilisation goals rather than implied guarantees.',
        },
      ],
    },
    {
      id: 'transition',
      sectionKey: 'transition',
      title: 'Transitioning to Ongoing Development',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Transition happens when agreed stabilisation criteria are met: critical defects addressed, deployment path understood, ownership clear and backlog items estimable. At that point monthly capacity can focus on improvement rather than firefighting—within finite limits.',
            'Transition is a decision, not an automatic calendar event. Some systems need extended stabilisation; others reach baseline quickly but carry a heavy debt register into prioritisation.',
          ],
        },
      ],
    },
    {
      id: 'when-rebuild',
      sectionKey: 'when_rebuild',
      title: 'When Rebuild May Be More Appropriate Than Rescue',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Rescue is not always the rational choice. When support costs exceed business value, dependencies are irreversibly obsolete or the product strategy has changed, rebuilding or replacing may be cleaner than prolonging recovery.',
            'That judgment should come from assessment with explicit trade-offs—not from default optimism that every system can be saved incrementally.',
          ],
        },
      ],
    },
    {
      id: 'buyer-checklist',
      sectionKey: 'buyer_checklist',
      title: 'Questions Buyers Should Ask Before Rescue or Subscription',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Use the checklist below with providers and internal stakeholders. Honest answers prevent locking an unstable system into a delivery rhythm it cannot support yet.',
          ],
        },
        { type: 'checklist', items: rescueBuyerChecklist },
      ],
    },
  ],
  faqs: rescueFaqs,
  relatedLiveLinks: rescueRelatedLiveLinks,
  relatedBlogLinks: rescueRelatedBlogLinks,
  reusableVisuals: [
    SDAAS_COMMERCIAL_IMAGES.scatteredToStructured.basePath,
    SDAAS_COMMERCIAL_IMAGES.deliveryProcess.basePath,
  ],
  aboutEntities: [
    'Application rescue',
    'Software stabilisation',
    'Legacy system recovery',
    'Software Development as a Subscription',
  ],
  mentionEntities: [
    'Technical debt',
    'Software maintenance',
    'Discovery phase',
    'E-commerce stability',
    'Release management',
    'Codebase assessment',
  ],
  conclusion: {
    paragraphs: [
      'Application rescue is how businesses recover enough understanding and stability to improve software safely. It is the phase that often precedes—not replaces—thoughtful ongoing development.',
      'An unknown codebase should normally be assessed before monthly delivery capacity is committed. Not every unstable system should enter a development subscription immediately; rescue or discovery may be the responsible starting point.',
      'When stabilisation goals are explicit and transition criteria are agreed, rescue can hand off cleanly into prioritised monthly improvement rather than an open-ended emergency.',
    ],
    primaryCta: {
      label: 'Discuss rescue and capacity options',
      href: SDAAS_CAPACITY_REQUEST_PATH,
    },
    secondaryCta: {
      label: 'View subscription use cases',
      href: SDAAS_USE_CASES_HREF,
    },
  },
};

export {
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_PAGE_PATH,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
};
