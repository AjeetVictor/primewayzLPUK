import {
  CANONICAL_ROUTES,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';
import type { SupportingArticleDefinition } from './supportingArticleTypes';

/** Strategy Guide — why businesses shift from fixed projects to continuous development. */
export const SDAAS_CONTINUOUS_DEVELOPMENT_PATH = SDAAS_CONTINUOUS_DEVELOPMENT_HREF;

export const SDAAS_CONTINUOUS_DEVELOPMENT_SEO = {
  title: 'Why Businesses Move to Continuous Software Development',
  description:
    'Learn why businesses shift from isolated software projects to continuous development as products, integrations and operational needs evolve.',
  ogTitle: 'Why Businesses Move From Fixed Projects to Continuous Software Development',
  ogDescription:
    'Software rarely stops changing after launch. Understand the strategic shift to continuous development—and when fixed-price projects still fit.',
  h1: 'Why Businesses Move From Fixed Projects to Continuous Software Development',
  standfirst:
    'Many organisations begin with a defined software project and later discover that launch is not an endpoint. This guide explains the strategic shift toward continuous development—and why fixed-price delivery still has a place.',
  category: 'Strategy Guide',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '17 min read',
  keywords: [
    'continuous software development',
    'ongoing product development',
    'fixed project vs continuous development',
    'continuous product improvement',
    'post-launch software development',
    'recurring software needs',
    'software delivery model',
    'ongoing development UK',
    'product iteration strategy',
    'software procurement evolution',
  ],
} as const;

export const SDAAS_CONTINUOUS_DEVELOPMENT_OG_IMAGE =
  '/articles/sdaas/og-why-businesses-move-to-continuous-software-development.webp';

export const SDAAS_CONTINUOUS_DEVELOPMENT_DIRECT_ANSWER =
  'Businesses move to continuous software development when software becomes an ongoing operational capability rather than a one-time deliverable. The shift allows priorities, features, integrations and improvements to evolve without restarting procurement for every change.';

export const CONTINUOUS_DEVELOPMENT_GEO_STATEMENTS = [
  'Fixed-price projects remain useful for defined outcomes with stable scope.',
  'Continuous development fits when operational need continues beyond a single endpoint.',
  'Continuous delivery requires governance—not only a recurring budget line.',
] as const;

export const hybridModelSteps = [
  {
    title: 'Define a bounded first release',
    text: 'Use fixed-price or a scoped discovery phase when the initial outcome can be described and accepted clearly.',
  },
  {
    title: 'Launch and stabilise',
    text: 'Complete acceptance, monitor early usage and address critical defects before expanding scope.',
  },
  {
    title: 'Shift recurring work into continuous capacity',
    text: 'Move integrations, enhancements and operational improvements into a shared backlog with monthly prioritisation.',
  },
  {
    title: 'Scope major future modules separately',
    text: 'Large replacements or compliance programmes can still be procured as defined projects when appropriate.',
  },
] as const;

export const readinessSignals = [
  'A backlog exists beyond the original project scope',
  'Integrations and workflows change after go-live',
  'Stakeholders request improvements every month rather than annually',
  'Repeated procurement cycles delay small but valuable changes',
  'Product knowledge must be retained between releases',
  'Technical debt and features compete for the same roadmap',
] as const;

export const commonMistakes = [
  'Treating continuous development as unlimited output because the fee is recurring',
  'Skipping prioritisation because “small requests” feel harmless in isolation',
  'Assuming the same governance as a one-off project without monthly decision rhythm',
  'Procuring continuous capacity before understanding an unstable codebase',
  'Ending documentation and ownership clarity after the first project completes',
  'Replacing fixed-price entirely rather than matching model to workload type',
] as const;

export const continuousDevelopmentFaqs = [
  {
    question: 'Does continuous development mean fixed-price projects are obsolete?',
    answer:
      'No. Fixed-price projects remain useful for defined outcomes with stable scope, clear acceptance criteria and a completion point. Continuous development becomes more appropriate when the product or operational need continues beyond that endpoint.',
  },
  {
    question: 'Is continuous development the same as a software development subscription?',
    answer:
      'A development subscription is one commercial way to fund continuous development through recurring capacity. Continuous development describes the ongoing nature of the work; the subscription describes how capacity is procured and prioritised.',
  },
  {
    question: 'When should a business not move to continuous development yet?',
    answer:
      'When the codebase is unknown or unstable, when priorities are undefined, or when the next twelve months consist of one large bounded deliverable. Discovery, rescue or a fixed project may be more appropriate first.',
  },
  {
    question: 'How is continuous development different from maintenance?',
    answer:
      'Maintenance preserves dependability and compatibility. Continuous product development expands or changes capability. Many live systems need both, but service boundaries and response expectations must be defined clearly.',
  },
  {
    question: 'Does continuous development require an internal product owner?',
    answer:
      'Someone on the client side must prioritise, accept work and resolve business questions. That role need not be technical, but without it continuous delivery stalls on clarification and approval.',
  },
  {
    question: 'How does budgeting change?',
    answer:
      'Continuous development is often treated as operating expenditure with a recurring allocation rather than a single capital project. Budget consistency is achievable; identical monthly output is not, because complexity and priorities vary.',
  },
  {
    question: 'What governance is required?',
    answer:
      'Visible backlog, regular priority reviews, clear acceptance paths, reporting on released and deferred work, and agreed criteria for urgent items. Without governance, continuous development becomes an informal request queue.',
  },
  {
    question: 'Can continuous development work alongside compliance projects?',
    answer:
      'Yes. Compliance or migration programmes may run as fixed-scope projects while smaller improvements continue through monthly capacity, provided priorities and dependencies are coordinated openly.',
  },
  {
    question: 'Why do repeated procurement cycles become slow?',
    answer:
      'Each new project may require scoping, legal review, vendor comparison and approval—even for modest changes. Continuous models reduce that friction for recurring work by keeping context and commercial terms in place.',
  },
  {
    question: 'What is a sensible first step toward continuous development?',
    answer:
      'Identify work that recurred after your last project ended. If that list is growing, compare continuous capacity with repeated fixed quotes. Read the comparison guide and monthly capacity explainer before changing procurement.',
  },
] as const;

export const continuousDevelopmentRelatedLiveLinks = [
  {
    title: 'Development subscription vs fixed-price',
    description: 'Compare procurement models for defined projects and recurring capacity.',
    href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  },
  {
    title: 'Software development subscription use cases',
    description: 'Practical situations where ongoing development capacity may fit.',
    href: SDAAS_USE_CASES_HREF,
  },
  {
    title: 'How monthly development capacity works',
    description: 'Operating mechanics behind continuous delivery within finite capacity.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
  {
    title: 'Software maintenance vs continuous product development',
    description: 'Clarify boundaries between dependability work and capability expansion.',
    href: SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  },
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial service page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'Subscription-Based Software Development Guide',
    description: 'Educational pillar on subscription software and development subscriptions.',
    href: SDAAS_PILLAR_GUIDE_HREF,
  },
] as const;

export const continuousDevelopmentRelatedBlogLinks = [
  {
    title: 'Fixed-price vs time & material vs subscription support',
    description: 'How delivery models compare for UK SMEs with evolving software needs.',
    href: '/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  },
  {
    title: 'Why UK SMEs need monthly digital support',
    description: 'When recurring delivery rhythm suits operational systems that keep changing.',
    href: '/blog/monthly-digital-support-uk-smes',
  },
] as const;

export const continuousDevelopmentArticle: SupportingArticleDefinition = {
  slug: 'why-businesses-move-to-continuous-software-development',
  path: SDAAS_CONTINUOUS_DEVELOPMENT_PATH,
  seo: SDAAS_CONTINUOUS_DEVELOPMENT_SEO,
  ogImage: SDAAS_CONTINUOUS_DEVELOPMENT_OG_IMAGE,
  breadcrumbLabel: 'Continuous software development',
  cardCategory: 'Strategy Guide',
  contentType: 'explainer',
  funnelStage: 'mof',
  primaryIntent: 'strategic explanation of continuous development',
  targetTopic: 'continuous software development',
  analyticsNamespace: 'sdaas_continuous',
  directAnswerTitle: 'Why Move to Continuous Development?',
  directAnswer: SDAAS_CONTINUOUS_DEVELOPMENT_DIRECT_ANSWER,
  directAnswerFollow:
    'Fixed-price projects remain useful for defined outcomes. Continuous development becomes more appropriate when the product or operational need continues beyond a single endpoint.',
  introParagraphs: [
    'Software projects have a familiar shape: agree scope, build, launch, sign off. Yet many businesses discover that sign-off coincides with the moment users, regulators and internal teams generate the next wave of requirements.',
    'That experience drives a strategic shift. Instead of treating every improvement as a new procurement event, organisations adopt continuous software development—ongoing prioritisation, delivery and release against a shared backlog.',
    'This article explains the forces behind that shift, what continuous development does and does not mean, and how it coexists with fixed-price work for bounded deliverables.',
  ],
  introAsides: [
    {
      label: 'Model comparison',
      href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
      linkLabel: 'Subscription vs fixed-price guide',
    },
    {
      label: 'Operating model',
      href: SDAAS_MONTHLY_CAPACITY_HREF,
      linkLabel: 'How monthly capacity works',
    },
  ],
  geoStatements: CONTINUOUS_DEVELOPMENT_GEO_STATEMENTS,
  sections: [
    {
      id: 'software-keeps-changing',
      sectionKey: 'software_keeps_changing',
      title: 'Software Rarely Stops Changing After Launch',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Launch confirms that a system can operate in production—not that requirements have finished. Users adapt workflows, edge cases surface, data quality issues appear and adjacent teams request connections you deferred to “phase two”.',
            'Organisations that plan only for build and launch often underestimate the cost of stopping there. Continuous development acknowledges software as part of operations, not a one-time purchase.',
          ],
        },
      ],
    },
    {
      id: 'user-feedback',
      sectionKey: 'user_feedback',
      title: 'User Feedback Creates Ongoing Work',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Real usage contradicts assumptions. Onboarding steps confuse people, reports miss a field teams rely on, mobile layouts break on certain devices. Feedback loops are valuable precisely because they generate change requests after go-live.',
            'Continuous development provides a structure for those requests—capture, prioritise, deliver—rather than treating each batch of feedback as an emergency project.',
          ],
        },
      ],
    },
    {
      id: 'operational-change',
      sectionKey: 'operational_change',
      title: 'Operational Change Drives Development',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Pricing models evolve, teams reorganise, suppliers change and internal approvals shift. Software must reflect operational reality. Internal tools and customer-facing products alike accumulate change driven by the business around them.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'New roles and permission models',
            'Revised billing or subscription tiers',
            'Workflow automation as manual steps become bottlenecks',
            'Reporting changes when leadership asks new questions',
          ],
        },
      ],
    },
    {
      id: 'integration-change',
      sectionKey: 'integration_change',
      title: 'Integration Change Is Continuous',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'CRM fields, payment gateways, identity providers and warehouse APIs change on their own schedules. Integrations that worked at launch may need updates when vendors deprecate endpoints or commercial terms shift.',
            'Integration maintenance is a recurring pattern, not a project milestone. Continuous development keeps those updates inside a prioritised backlog instead of repeatedly opening new procurement files.',
          ],
        },
      ],
    },
    {
      id: 'compliance-security',
      sectionKey: 'compliance_security',
      title: 'Compliance and Security Requirements Evolve',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Regulatory guidance updates, accessibility expectations tighten and security standards move forward. Some responses require bounded compliance projects; others fit ongoing capacity—patching, logging improvements, consent flows and audit trails.',
            'Continuous development does not replace formal compliance programmes, but it provides a rhythm for incremental adjustments between major audits.',
          ],
        },
      ],
    },
    {
      id: 'competitive-pressure',
      sectionKey: 'competitive_pressure',
      title: 'Competitive Pressure Shortens Planning Cycles',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Markets that once planned annual releases now expect quarterly—or faster—improvement. Competitors ship smaller changes continuously. Waiting for the next fixed project window can mean missing a window that mattered commercially.',
            'Continuous development aligns delivery rhythm with market tempo when priorities genuinely change that often—not when stakeholders simply prefer urgency without trade-offs.',
          ],
        },
      ],
    },
    {
      id: 'technical-debt',
      sectionKey: 'technical_debt',
      title: 'Technical Debt Accumulates Between Projects',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'When development pauses between projects, shortcuts harden, dependencies age and knowledge dissipates. The next project then begins with discovery that repeats earlier learning.',
            'Continuous development keeps context warm and allows debt to be prioritised alongside features. See the technical debt guide for how business owners can discuss remediation without defaulting to a rewrite.',
          ],
        },
      ],
    },
    {
      id: 'procurement-friction',
      sectionKey: 'procurement_friction',
      title: 'Why Repeated Procurement Becomes Slow',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Each fixed project may require fresh statements of work, legal review, budget approval and vendor evaluation—even for modest enhancements. That overhead is rational for large unknown scope and disproportionate for recurring small improvements.',
            'Continuous models trade repeated project setup for ongoing governance. The saving is administrative and contextual—less re-explaining the system each time—not unlimited capacity.',
          ],
        },
      ],
    },
    {
      id: 'what-changes',
      sectionKey: 'what_changes',
      title: 'What Continuous Development Changes',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Instead of a single endpoint, the organisation maintains a backlog, a priority rhythm and a commercial relationship sized to recurring need. Work is sized, sequenced and released in increments aligned with capacity.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.deliveryModelsComparison,
          caption:
            'Continuous development shifts from isolated project endpoints to ongoing prioritised delivery.',
        },
        {
          type: 'bullets',
          items: [
            'Shared backlog visible to business and delivery teams',
            'Regular priority reviews rather than annual project batches',
            'Retained product and architecture context',
            'Reporting on released, deferred and blocked work each cycle',
          ],
        },
      ],
    },
    {
      id: 'what-it-does-not-mean',
      sectionKey: 'what_it_does_not_mean',
      title: 'What Continuous Development Does Not Mean',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'It does not mean unlimited development, absence of scope control or ignoring commercial boundaries. Capacity remains finite. Priorities still require decisions. Large unknown work may still need discovery or a fixed-price phase.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Replacing governance with a recurring invoice produces an expensive request queue—not continuous product development.',
        },
      ],
    },
    {
      id: 'governance-required',
      sectionKey: 'governance_required',
      title: 'Governance Required for Continuous Development',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Successful continuous delivery depends on client-side prioritisation, timely feedback and clear acceptance. The provider supplies estimation, delivery, QA and transparency—but cannot substitute for business decisions.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Named decision-maker for backlog order',
            'Agreed definition of urgent versus important work',
            'Acceptance testing within defined timeframes',
            'Documented ownership of code and third-party accounts',
            'Monthly or fortnightly review cadence matched to capacity cycle',
          ],
        },
      ],
    },
    {
      id: 'budget-implications',
      sectionKey: 'budget_implications',
      title: 'Budget Implications',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Continuous development is often funded as operating expenditure with a predictable monthly allocation. That improves budget visibility compared with unpredictable project spikes, but it does not guarantee identical output each month.',
            'Finance teams benefit when reporting connects spend to released outcomes and deferred backlog—not activity hours alone.',
          ],
        },
      ],
    },
    {
      id: 'team-capability',
      sectionKey: 'team_capability',
      title: 'Team and Capability Implications',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Internal teams may focus on product direction, acceptance and domain expertise while external capacity handles implementation rhythm. Alternatively, hybrid teams combine internal engineering with supplementary capacity for peaks.',
            'Continuous development fails when nobody owns the backlog on the client side or when stakeholders expect the provider to infer priorities from informal messages.',
          ],
        },
      ],
    },
    {
      id: 'when-fixed-still-fits',
      sectionKey: 'when_fixed_still_fits',
      title: 'When Fixed Projects Still Make Sense',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Fixed-price delivery remains appropriate when scope, dependencies and acceptance criteria can be defined upfront and there is a genuine completion point. Examples include a bounded migration, a compliance deliverable with fixed audit scope or a prototype with narrow objectives.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Fixed-price projects remain useful for defined outcomes. Continuous development fits when operational need continues beyond a single endpoint.',
        },
      ],
    },
    {
      id: 'hybrid-model',
      sectionKey: 'hybrid_model',
      title: 'A Hybrid Model',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Many businesses combine models: fixed-price or discovery for the first release or major module, then continuous capacity for iteration, integrations and stabilisation. Major future replacements can return to fixed scope when boundaries are clear.',
          ],
        },
        {
          type: 'bullets',
          items: hybridModelSteps.map((step) => `${step.title}: ${step.text}`),
          ordered: true,
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.deliveryProcess,
          caption:
            'Continuous delivery still follows clarify, build, test and release—on a repeating cycle rather than a single project arc.',
        },
      ],
    },
    {
      id: 'readiness-signs',
      sectionKey: 'readiness_signs',
      title: 'Signs a Business Is Ready',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Readiness is behavioural as much as technical. If the patterns below sound familiar, continuous development may warrant serious evaluation.',
          ],
        },
        { type: 'checklist', items: readinessSignals },
      ],
    },
    {
      id: 'common-mistakes',
      sectionKey: 'common_mistakes',
      title: 'Common Mistakes in the Transition',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Moving to continuous development without adjusting governance usually recreates project problems in monthly form.',
          ],
        },
        { type: 'bullets', items: commonMistakes },
      ],
    },
  ],
  faqs: continuousDevelopmentFaqs,
  relatedLiveLinks: continuousDevelopmentRelatedLiveLinks,
  relatedBlogLinks: continuousDevelopmentRelatedBlogLinks,
  reusableVisuals: [
    SDAAS_COMMERCIAL_IMAGES.deliveryModelsComparison.basePath,
    SDAAS_COMMERCIAL_IMAGES.deliveryProcess.basePath,
  ],
  aboutEntities: [
    'Continuous software development',
    'Software delivery model',
    'Fixed-price software project',
    'Product development',
  ],
  mentionEntities: [
    'Software Development as a Subscription',
    'Software backlog prioritisation',
    'Technical debt',
    'Monthly software development capacity',
    'Software maintenance',
  ],
  conclusion: {
    paragraphs: [
      'Businesses move to continuous software development when software supports ongoing operations—not a single launch—and when repeated project procurement slows necessary change.',
      'The shift is strategic: shared backlog, retained context and regular prioritisation within finite capacity. It complements fixed-price work for bounded deliverables rather than replacing it entirely.',
      'If your post-launch backlog keeps growing, compare how continuous capacity would be governed and funded before initiating another isolated project cycle.',
    ],
    primaryCta: {
      label: 'Compare delivery models',
      href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
    },
    secondaryCta: {
      label: 'View use cases for ongoing development',
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
