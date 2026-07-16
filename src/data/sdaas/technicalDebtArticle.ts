import {
  CANONICAL_ROUTES,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
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

/** Technical Guide — explain technical debt to non-technical decision-makers. */
export const SDAAS_TECHNICAL_DEBT_PATH = SDAAS_TECHNICAL_DEBT_HREF;

export const SDAAS_TECHNICAL_DEBT_SEO = {
  title: 'Technical Debt Explained for Business Owners',
  description:
    'Understand what technical debt is, how it affects cost, speed and reliability, and how businesses can prioritise it alongside new features.',
  ogTitle: 'Technical Debt Explained for Business Owners',
  ogDescription:
    'Technical debt is the future cost of reduced changeability in software—not simply bad code. Learn causes, business impact and how to prioritise remediation.',
  h1: 'Technical Debt Explained for Business Owners',
  standfirst:
    'Technical debt sounds like a developer concern, but it shapes delivery speed, reliability and the cost of every future change. This guide explains what it means in business terms and how to prioritise it without defaulting to a full rewrite.',
  category: 'Technical Guide',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '18 min read',
  keywords: [
    'technical debt explained',
    'technical debt examples',
    'technical debt business impact',
    'legacy software maintenance',
    'software refactoring',
    'technical debt reduction',
    'code quality business',
    'outdated software risk',
    'technical debt prioritisation',
    'software maintenance UK',
  ],
} as const;

export const SDAAS_TECHNICAL_DEBT_OG_IMAGE =
  '/articles/sdaas/og-technical-debt-explained-for-business-owners.webp';

export const SDAAS_TECHNICAL_DEBT_DIRECT_ANSWER =
  'Technical debt is the future cost created when software is built or changed in a way that makes later work slower, riskier or more expensive. It may result from deliberate shortcuts, outdated technology, weak architecture, missing tests or accumulated workarounds.';

export const TECHNICAL_DEBT_GEO_STATEMENTS = [
  'Technical debt is not simply bad code; it is the cost of reduced future changeability.',
  'Not all technical debt must be removed immediately.',
  'Technical debt should be prioritised according to business risk and delivery impact.',
] as const;

export const technicalDebtRegisterExampleRows = [
  [
    'Manual deployment process',
    'Releases require ad-hoc steps and one person’s knowledge',
    'Delayed releases; key-person dependency',
    'Every change takes longer to ship safely',
    'High',
    'Product owner',
    'In progress',
  ],
  [
    'Duplicated pricing logic',
    'Same business rule implemented in two modules',
    'Inconsistent quotes; support confusion',
    'Feature changes need double updates and testing',
    'Medium',
    'Engineering lead',
    'Logged',
  ],
  [
    'Outdated authentication library',
    'Supported version behind current release',
    'Security exposure if exploit published',
    'Blocks SSO project until upgraded',
    'High',
    'Security / IT',
    'Planned',
  ],
  [
    'Missing automated tests on checkout',
    'Critical path relies on manual regression',
    'Revenue-impacting defects may reach production',
    'Developers hesitate to change checkout code',
    'High',
    'Product owner',
    'Accepted (short term)',
  ],
  [
    'Monolithic reporting module',
    'Reports coupled to legacy data structure',
    'Slow report changes; analyst workarounds',
    'New metrics require risky edits',
    'Medium',
    'Operations',
    'Deferred',
  ],
] as const;

export const technicalDebtProviderQuestions = [
  'How do you identify technical debt before quoting new work?',
  'When would you recommend paying debt down versus shipping a feature?',
  'How do you estimate remediation without open-ended scope?',
  'What evidence do you provide that debt reduction improved delivery?',
  'How is debt work reported alongside feature delivery each month?',
  'When would you advise discovery or rescue before normal capacity?',
  'How do you distinguish debt from necessary legacy compatibility?',
  'What happens if remediation reveals deeper architectural issues?',
  'How are trade-offs documented for non-technical stakeholders?',
  'When would you recommend a fixed-price refactor phase instead of subscription capacity?',
] as const;

export const technicalDebtFaqs = [
  {
    question: 'Is technical debt the same as bad code?',
    answer:
      'Not exactly. Bad code may be poorly written but isolated. Technical debt describes structural choices—shortcuts, outdated dependencies, missing tests or tangled architecture—that make future change slower, riskier or more expensive. Some debt was accepted deliberately to meet a deadline.',
  },
  {
    question: 'Does all legacy software have unacceptable technical debt?',
    answer:
      'No. Older software can be stable, well understood and appropriate for its purpose. Legacy becomes problematic when change is frequent, knowledge is lost, dependencies are unsupported or defects cluster in the same areas. Age alone is not the deciding factor.',
  },
  {
    question: 'Should we stop all feature work to pay down technical debt?',
    answer:
      'Usually not. Most businesses balance features and debt reduction within available capacity. The question is which debt creates enough delivery or operational risk to prioritise now versus later. Not all technical debt must be removed immediately.',
  },
  {
    question: 'How is technical debt different from bugs?',
    answer:
      'Bugs are incorrect behaviour in the current system. Technical debt is a maintainability or changeability problem—the software may work today but resist safe modification tomorrow. Fixing bugs may touch debt-heavy areas, but the concepts are different.',
  },
  {
    question: 'Can technical debt be measured in pounds?',
    answer:
      'Precise financial formulas are often misleading. More practical measures include lead time for changes, defect rate in affected modules, frequency of rollback and engineer confidence when estimating work. Use these signals to prioritise, not invented cost multipliers.',
  },
  {
    question: 'Who is responsible for technical debt in a subscription engagement?',
    answer:
      'Both client and provider share responsibility. The client prioritises backlog items—including debt—and owns business outcomes. The provider advises on risk, estimates remediation and delivers agreed work transparently. Blaming prior developers rarely produces a useful plan.',
  },
  {
    question: 'When is a full rewrite justified?',
    answer:
      'When the cost and risk of incremental improvement exceed a controlled rebuild, and the business can sustain migration complexity. Rewrites should not be the default response to debt. Many systems improve through staged refactoring, better tests and targeted module replacement.',
  },
  {
    question: 'How does technical debt affect security?',
    answer:
      'Unsupported frameworks, missing patches, weak access patterns and unverified dependencies increase exposure. Debt in authentication, data handling or integration layers deserves higher priority because the business impact of failure is disproportionate.',
  },
  {
    question: 'Can monthly development capacity include debt reduction?',
    answer:
      'Yes, when debt items are prioritised in the backlog with clear purpose—reducing failure risk, enabling a feature, improving release speed or simplifying maintenance. Debt work competes with features for the same finite capacity and should be visible in reporting.',
  },
  {
    question: 'What is a technical debt register?',
    answer:
      'A living list of known debt items with business impact, delivery impact, priority and status. It helps stakeholders discuss trade-offs without technical jargon and prevents debt from being rediscovered every quarter. It is a planning tool, not a blame log.',
  },
] as const;

export const technicalDebtRelatedLiveLinks = [
  {
    title: 'How monthly development capacity works',
    description: 'How finite monthly capacity balances features, fixes and debt reduction.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
  {
    title: 'How to prioritise software development requests',
    description: 'Framework for ordering features, debt and urgent work in one backlog.',
    href: SDAAS_PRIORITISATION_HREF,
  },
  {
    title: 'Application rescue and stabilisation',
    description: 'When unknown or unstable codebases need assessment before normal delivery.',
    href: SDAAS_APPLICATION_RESCUE_HREF,
  },
  {
    title: 'Software maintenance vs continuous product development',
    description: 'How maintenance, enhancement and debt work differ in service boundaries.',
    href: SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  },
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'Website and application maintenance',
    description: 'Dependability-focused support for live applications.',
    href: CANONICAL_ROUTES.maintenance,
  },
] as const;

export const technicalDebtRelatedBlogLinks = [
  {
    title: 'Why start with a foundation sprint',
    description: 'When stabilisation and discovery should precede monthly delivery.',
    href: '/blog/foundation-sprint-before-monthly-delivery',
  },
  {
    title: 'Fixed-price vs time & material vs subscription support',
    description: 'How delivery models affect planning for debt and improvement work.',
    href: '/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  },
] as const;

export const technicalDebtArticle: SupportingArticleDefinition = {
  slug: 'technical-debt-explained-for-business-owners',
  path: SDAAS_TECHNICAL_DEBT_PATH,
  seo: SDAAS_TECHNICAL_DEBT_SEO,
  ogImage: SDAAS_TECHNICAL_DEBT_OG_IMAGE,
  breadcrumbLabel: 'Technical debt explained',
  cardCategory: 'Technical Guide',
  contentType: 'explainer',
  funnelStage: 'tof',
  primaryIntent: 'explain technical debt to non-technical decision-makers',
  targetTopic: 'technical debt explained',
  analyticsNamespace: 'sdaas_technical_debt',
  directAnswerTitle: 'What Is Technical Debt?',
  directAnswer: SDAAS_TECHNICAL_DEBT_DIRECT_ANSWER,
  directAnswerFollow:
    'The term borrows from finance: you gain speed or savings now and accept a cost later when the software must be changed, extended or secured.',
  introParagraphs: [
    'Technical debt appears in board conversations, supplier proposals and developer stand-ups—often without a shared definition. For business owners, the useful question is not whether the codebase is perfect, but whether current structure makes the next change slower, riskier or more expensive than it needs to be.',
    'This guide explains technical debt in plain language: why it accumulates, how it affects delivery and reliability, when it is acceptable, and how to prioritise remediation alongside features without assuming every older system must be replaced.',
    'If you manage software through fixed projects or monthly development capacity, understanding debt helps you ask better questions about estimates, risk and backlog order.',
  ],
  introAsides: [
    {
      label: 'Capacity and backlog',
      href: SDAAS_MONTHLY_CAPACITY_HREF,
      linkLabel: 'How monthly development capacity works',
    },
    {
      label: 'Prioritisation',
      href: SDAAS_PRIORITISATION_HREF,
      linkLabel: 'How to prioritise development requests',
    },
    {
      label: 'Unstable systems',
      href: SDAAS_APPLICATION_RESCUE_HREF,
      linkLabel: 'Application rescue before ongoing development',
    },
  ],
  geoStatements: TECHNICAL_DEBT_GEO_STATEMENTS,
  sections: [
    {
      id: 'why-called-debt',
      sectionKey: 'why_called_debt',
      title: 'Why It Is Called Debt',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'The metaphor is deliberate. When a team ships quickly by skipping tests, duplicating logic or deferring a cleaner design, they borrow time from the future. Later, every change in that area may require extra care, rework or specialist knowledge—interest on the loan.',
            'Debt is not always a mistake. Sometimes a business consciously accepts it to validate a market, meet a regulatory date or respond to a competitor. The problem begins when the debt is invisible, unowned or never scheduled for repayment.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Technical debt is not simply bad code; it is the cost of reduced future changeability.',
        },
      ],
    },
    {
      id: 'common-causes',
      sectionKey: 'common_causes',
      title: 'Common Causes of Technical Debt',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Debt accumulates from many sources—not only careless development. Understanding causes helps you prioritise responses instead of treating every symptom as a reason to restart.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Time pressure that skips documentation, tests or refactoring',
            'Changing requirements mid-build without revisiting earlier decisions',
            'Outdated libraries, runtimes or hosting patterns',
            'Merged systems after acquisition with overlapping functionality',
            'Workarounds that persist after the original incident closed',
            'Knowledge loss when key people leave without handover',
            'Experimental features promoted to production without hardening',
          ],
        },
      ],
    },
    {
      id: 'deliberate-vs-accidental',
      sectionKey: 'deliberate_vs_accidental',
      title: 'Deliberate vs Accidental Debt',
      blocks: [
        {
          type: 'subsection',
          title: 'Deliberate debt',
          paragraphs: [
            'The team knows a shortcut was taken and records why— for example, launching a pilot before building full automation. Deliberate debt can be healthy when repayment is planned and the business benefit is clear.',
          ],
        },
        {
          type: 'subsection',
          title: 'Accidental debt',
          paragraphs: [
            'Emerges from unclear requirements, unknown dependencies, inherited code nobody fully understands or repeated patches without structural review. It is often discovered during estimation, not announced at the time it forms.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Both types consume future capacity. The difference is whether leadership can make an informed trade-off when prioritising the backlog.',
        },
      ],
    },
    {
      id: 'recognisable-examples',
      sectionKey: 'recognisable_examples',
      title: 'Examples Business Owners Recognise',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'You may not read source code, but you see debt through operational patterns:',
          ],
        },
        {
          type: 'bullets',
          items: [
            '“Small” changes routinely take weeks because every edit touches fragile areas',
            'Reports require manual exports because the live system cannot expose data safely',
            'Only one person can deploy, and holidays become a risk',
            'Integrations break when a vendor updates an API because mappings are scattered',
            'New features duplicate old ones because nobody agreed which module is authoritative',
            'Support tickets repeat the same root cause after superficial fixes',
          ],
        },
      ],
    },
    {
      id: 'business-impact',
      sectionKey: 'business_impact',
      title: 'Business Impact of Technical Debt',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Debt affects more than engineering morale. It influences cost predictability, time to market, customer experience and compliance readiness.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Higher cost per change as workarounds multiply',
            'Slower response to market or regulatory shifts',
            'Increased reliance on specific individuals or suppliers',
            'Harder onboarding for new staff or partners',
            'Reduced confidence when committing to customer deadlines',
          ],
        },
      ],
    },
    {
      id: 'delivery-speed',
      sectionKey: 'delivery_speed',
      title: 'Delivery-Speed Impact',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Velocity slows when developers spend time reconstructing context, avoiding risky modules or manually verifying changes that automated tests should cover. Estimates inflate—not because people work less hard, but because the system resists change.',
            'In a monthly development subscription, debt-heavy items consume disproportionate capacity. That is why debt should appear explicitly in prioritisation conversations rather than hiding inside every feature estimate.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.monthlyCapacity,
          caption:
            'Debt reduction, features and fixes compete for the same finite monthly capacity unless separately scoped.',
        },
      ],
    },
    {
      id: 'reliability-security',
      sectionKey: 'reliability_security',
      title: 'Reliability and Security Implications',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Debt often clusters around authentication, payments, permissions and data synchronisation—areas where failure is visible and costly. Unsupported dependencies and missing patch processes turn maintainability problems into security exposure.',
            'Reliability debt also appears as flaky deployments, untraced errors and recovery procedures that exist only in one person’s notes. These issues increase downtime risk even when features appear to work in demo conditions.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Prioritise debt that could cause data loss, unauthorised access or sustained outage—not every cosmetic inconsistency in the codebase.',
        },
      ],
    },
    {
      id: 'when-acceptable',
      sectionKey: 'when_acceptable',
      title: 'When Technical Debt Is Acceptable',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Zero debt is not a realistic goal for most businesses. Debt is acceptable when it is understood, bounded and cheaper to carry than immediate remediation—especially in low-change modules or time-bound experiments.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'The affected area changes rarely and has clear owners',
            'Remediation cost exceeds business benefit for the foreseeable horizon',
            'A planned refactor is already scheduled after a defined milestone',
            'The debt enables learning that will reshape the product anyway',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Not all technical debt must be removed immediately.',
        },
      ],
    },
    {
      id: 'when-dangerous',
      sectionKey: 'when_dangerous',
      title: 'When Technical Debt Becomes Dangerous',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Debt turns critical when it blocks revenue work, hides systemic risk or compounds faster than the team can repay it.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Estimates for routine changes become unreliable or routinely overrun',
            'Production incidents repeat in the same subsystem',
            'Critical dependencies reach end of support without a migration plan',
            'Compliance or audit requirements cannot be met without major rework',
            'Key staff departure would halt releases or support',
            'Customer-facing SLAs are missed because releases are too risky to ship',
          ],
        },
      ],
    },
    {
      id: 'how-to-identify',
      sectionKey: 'how_to_identify',
      title: 'How to Identify Technical Debt',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Identification combines technical review with operational signals. You do not need to read code to ask for evidence.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Module-level change lead time and defect trends',
            'Test coverage on business-critical paths—not vanity percentages alone',
            'Dependency audit for unsupported or end-of-life components',
            'Deployment frequency and rollback history',
            'Documentation gaps for integrations and admin procedures',
            'Repeated “hotfix only” patches in the same feature area',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'An unknown codebase should normally be assessed before monthly delivery capacity is committed. Discovery reduces the risk of underestimating hidden debt.',
        },
      ],
    },
    {
      id: 'how-to-prioritise',
      sectionKey: 'how_to_prioritise',
      title: 'How to Prioritise Technical Debt',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Prioritise debt like any other backlog item: by business risk, delivery impact, dependencies and effort—not by developer preference alone. Technical effort should inform priority, not decide it alone.',
            'Pair debt items with outcomes: “Reduce checkout deployment risk” beats “Refactor module X” for stakeholder conversations. See the prioritisation guide for a broader scoring framework.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Technical debt should be prioritised according to business risk and delivery impact.',
        },
      ],
    },
    {
      id: 'debt-vs-bugs',
      sectionKey: 'debt_vs_bugs',
      title: 'Technical Debt vs Bugs',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Bugs are observable incorrect behaviour: wrong totals, failed uploads, broken permissions. Technical debt is a maintainability burden—the system may behave correctly today while resisting safe change tomorrow.',
            'Fixing a bug in a debt-heavy area may be quick; preventing the next bug in that area may require structural improvement. Both can appear in the same backlog with different acceptance criteria.',
          ],
        },
      ],
    },
    {
      id: 'debt-vs-legacy',
      sectionKey: 'debt_vs_legacy',
      title: 'Technical Debt vs Legacy Software',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Legacy software is simply software that has been in use for a long time. It may be stable, well documented and appropriate. Technical debt describes structural friction within new or old systems alike.',
            'Replacing legacy solely because of age can waste investment. Replacing or refactoring becomes sensible when change frequency, risk and cost of modification outweigh the cost of controlled improvement or migration.',
          ],
        },
        {
          type: 'callout',
          tone: 'info',
          text: 'Implying all old software is bad leads to expensive migrations that do not match business need. Judge debt by changeability and risk, not calendar age alone.',
        },
      ],
    },
    {
      id: 'refactoring-vs-rebuilding',
      sectionKey: 'refactoring_vs_rebuilding',
      title: 'Refactoring vs Rebuilding',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Refactoring improves structure incrementally while the system continues to operate. Rebuilding replaces a system—or major module—with a new implementation, often with parallel running and data migration complexity.',
            'Incremental refactoring suits many debt problems: adding tests around critical paths, extracting duplicated rules, upgrading dependencies in stages. Full rebuilds may be justified when architecture prevents scaling or compliance, but they should follow evidence—not frustration with a prior supplier.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Refactoring: lower disruption, continuous delivery, requires disciplined prioritisation',
            'Rebuild: higher upfront cost and migration risk, potential long-term simplification',
            'Hybrid: replace the highest-friction module while stabilising the remainder',
          ],
        },
      ],
    },
    {
      id: 'monthly-capacity',
      sectionKey: 'monthly_capacity',
      title: 'How Monthly Capacity Can Address Technical Debt',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A development subscription can include debt reduction when items are prioritised in the shared backlog alongside features. Debt work uses the same finite capacity—it is not a hidden unlimited remediation lane.',
            'Effective engagements label debt items with purpose, define measurable improvement and report progress in plain language. Competing features and debt openly is healthier than pretending remediation is “free” inside every estimate.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.capabilitiesOverview,
          caption:
            'Capabilities within monthly capacity may include stabilisation, refactoring, testing and feature delivery—prioritised together.',
        },
      ],
    },
    {
      id: 'debt-register',
      sectionKey: 'debt_register',
      title: 'A Practical Technical-Debt Register',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A register makes debt discussable outside engineering channels. Keep it concise, business-oriented and reviewed monthly. Below is an illustrative example—not a template every organisation must copy verbatim.',
          ],
        },
        {
          type: 'table',
          headers: [
            'Item',
            'Description',
            'Business impact',
            'Delivery impact',
            'Priority',
            'Owner',
            'Status',
          ],
          rows: technicalDebtRegisterExampleRows.map((row) => [...row]),
        },
      ],
    },
    {
      id: 'provider-questions',
      sectionKey: 'provider_questions',
      title: 'Questions to Ask a Provider',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Use these questions in discovery or monthly reviews. Clear answers indicate mature governance; vague assurances suggest debt will remain invisible until estimates slip.',
          ],
        },
        { type: 'checklist', items: technicalDebtProviderQuestions },
      ],
    },
  ],
  faqs: technicalDebtFaqs,
  relatedLiveLinks: technicalDebtRelatedLiveLinks,
  relatedBlogLinks: technicalDebtRelatedBlogLinks,
  reusableVisuals: [
    SDAAS_COMMERCIAL_IMAGES.capabilitiesOverview.basePath,
    SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.basePath,
  ],
  aboutEntities: [
    'Technical debt',
    'Software maintenance',
    'Software refactoring',
    'Legacy software',
  ],
  mentionEntities: [
    'Software Development as a Subscription',
    'Application rescue',
    'Software backlog prioritisation',
    'Monthly software development capacity',
    'Quality assurance',
    'Technical discovery',
  ],
  conclusion: {
    paragraphs: [
      'Technical debt is the future cost of building or changing software in ways that reduce safe changeability—not a label for every imperfection in a live system.',
      'Business leaders do not need to master code review to manage debt well. They need visible registers, honest prioritisation against features and providers who explain trade-offs without defaulting to blame or full rewrites.',
      'If debt is slowing delivery or increasing operational risk, address it deliberately within your delivery model—whether through a scoped refactor phase, rescue assessment or prioritised monthly capacity.',
    ],
    primaryCta: {
      label: 'Explore monthly development capacity',
      href: SDAAS_PAGE_PATH,
    },
    secondaryCta: {
      label: 'How to prioritise development requests',
      href: SDAAS_PRIORITISATION_HREF,
    },
  },
};

export {
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_PAGE_PATH,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_USE_CASES_HREF,
};
