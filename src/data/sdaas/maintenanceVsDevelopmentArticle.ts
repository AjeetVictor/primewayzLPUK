import {
  CANONICAL_ROUTES,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';
import type { SupportingArticleDefinition } from './supportingArticleTypes';

/** Comparison Guide — maintenance vs continuous product development boundaries. */
export const SDAAS_MAINTENANCE_VS_DEVELOPMENT_PATH = SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF;

export const SDAAS_MAINTENANCE_VS_DEVELOPMENT_SEO = {
  title: 'Software Maintenance vs Continuous Product Development',
  description:
    'Compare software maintenance and continuous product development, including fixes, updates, enhancements, backlog delivery and release planning.',
  ogTitle: 'Software Maintenance vs Continuous Product Development',
  ogDescription:
    'Maintenance preserves reliability; product development expands capability. Learn how to define service boundaries, priorities and response expectations.',
  h1: 'Software Maintenance vs Continuous Product Development',
  standfirst:
    'Live applications need dependability and improvement—but those are not the same service. This guide compares software maintenance with continuous product development and shows how to define boundaries when both are required.',
  category: 'Comparison Guide',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '18 min read',
  keywords: [
    'software maintenance vs development',
    'application maintenance',
    'continuous product development',
    'software enhancement',
    'ongoing software support',
    'maintenance and enhancement',
    'software support subscription',
    'product improvement vs maintenance',
    'corrective maintenance software',
    'development subscription vs support',
  ],
} as const;

export const SDAAS_MAINTENANCE_VS_DEVELOPMENT_OG_IMAGE =
  '/articles/sdaas/og-software-maintenance-vs-continuous-product-development.webp';

export const SDAAS_MAINTENANCE_VS_DEVELOPMENT_DIRECT_ANSWER =
  'Software maintenance keeps an application dependable and compatible. Continuous product development changes or expands what the application can do. Many live systems need both, but the service boundaries, priorities and response expectations must be defined clearly.';

export const MAINTENANCE_VS_DEVELOPMENT_GEO_STATEMENTS = [
  'Maintenance preserves reliability; enhancement increases capability.',
  'A development subscription is not automatically a 24/7 support service.',
  'Urgent defects and planned improvements compete for finite delivery capacity unless separate support arrangements exist.',
] as const;

export const exampleMonthlyWorkloadRows = [
  ['Corrective', 'Fix production defect in order export', 'Maintenance / defect', 'High urgency'],
  ['Adaptive', 'Update CRM field mapping after vendor change', 'Maintenance / integration', 'Scheduled'],
  ['Preventive', 'Apply dependency security patch', 'Maintenance / preventive', 'Scheduled'],
  ['Perfective', 'Improve admin search performance', 'Maintenance / perfective', 'Medium priority'],
  ['Enhancement', 'Add customer self-service portal feature', 'Product development', 'Planned backlog'],
  ['Enhancement', 'New reporting dashboard for operations', 'Product development', 'Planned backlog'],
] as const;

export const serviceBoundaryChecklist = [
  'Which service covers production outages versus planned enhancements?',
  'What response times apply to defects, and are they contracted separately?',
  'Who prioritises when a feature request and a security patch compete?',
  'Is release management included in both services or only development?',
  'How are third-party vendor failures handled versus internal defects?',
  'What hours and channels define “support” versus “development”?',
  'Are dependency updates maintenance by default or backlog items?',
  'How is scope documented when maintenance work reveals need for redesign?',
  'What reporting distinguishes maintenance effort from feature delivery?',
  'When would the provider recommend a separate rescue or discovery phase?',
] as const;

export const maintenanceVsDevelopmentFaqs = [
  {
    question: 'Is maintenance included in a software development subscription?',
    answer:
      'A development subscription can include defect fixes, dependency updates and release support when those items are prioritised within agreed capacity. That is not the same as a 24/7 support SLA with guaranteed response times unless separately contracted.',
  },
  {
    question: 'What is the difference between maintenance and enhancement?',
    answer:
      'Maintenance preserves dependability and compatibility—fixes, patches, adapter updates. Enhancement adds or changes capability—new workflows, features or integrations that expand what the system does. Both may appear in one backlog but should be labelled clearly.',
  },
  {
    question: 'What are corrective, adaptive, preventive and perfective maintenance?',
    answer:
      'Corrective fixes defects. Adaptive adjusts software to external changes such as API or OS updates. Preventive reduces future failure risk through patches and hardening. Perfective improves performance or maintainability without changing primary function. Together they describe maintenance scope beyond “break/fix”.',
  },
  {
    question: 'When is a support contract enough without development capacity?',
    answer:
      'When the system is stable, change is rare, and the primary need is incident response, hosting oversight and occasional patches. If a recurring enhancement backlog exists, maintenance alone may defer necessary product improvement.',
  },
  {
    question: 'When is development capacity needed instead of maintenance only?',
    answer:
      'When the business expects regular feature delivery, integration expansion, workflow redesign or measurable product iteration. Development capacity implies prioritised build and release work, not only keeping the lights on.',
  },
  {
    question: 'Does continuous product development include 24/7 monitoring?',
    answer:
      'Not automatically. Monitoring, on-call rotation and guaranteed response windows are support operations. A development subscription focuses on prioritised delivery cycles. Define monitoring and incident response separately if required.',
  },
  {
    question: 'How do urgent defects compete with planned features?',
    answer:
      'They share finite capacity unless a separate support arrangement handles certain defect classes. Urgent work can reorder the backlog; it does not create additional capacity. Transparent prioritisation prevents silent feature deferral.',
  },
  {
    question: 'Can one provider deliver both maintenance and product development?',
    answer:
      'Yes, with clear service definitions. Many engagements combine maintenance-type work and enhancements in one monthly plan when priorities are agreed openly. Alternatively, split support SLAs from development capacity if procurement requires separation.',
  },
  {
    question: 'How does technical debt fit maintenance versus development?',
    answer:
      'Debt reduction may be perfective maintenance when it improves reliability and changeability without new features, or development work when it enables a planned capability. Label debt items with business purpose so they compete fairly in prioritisation.',
  },
  {
    question: 'What should buyers document before signing?',
    answer:
      'Response expectations, in-scope maintenance categories, how enhancements enter the backlog, release governance, ownership, and what happens when maintenance investigation reveals need for larger redesign. Ambiguity here causes most post-launch disputes.',
  },
] as const;

export const maintenanceVsDevelopmentRelatedLiveLinks = [
  {
    title: 'Website and application maintenance',
    description: 'Dependability-focused maintenance service for live applications.',
    href: CANONICAL_ROUTES.maintenance,
  },
  {
    title: 'Technical debt explained for business owners',
    description: 'How accumulated debt affects maintenance and enhancement planning.',
    href: SDAAS_TECHNICAL_DEBT_HREF,
  },
  {
    title: 'Application rescue and stabilisation',
    description: 'When unstable systems need assessment before normal maintenance or development.',
    href: SDAAS_APPLICATION_RESCUE_HREF,
  },
  {
    title: 'How monthly development capacity works',
    description: 'How finite capacity balances fixes, maintenance and enhancements.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
  {
    title: 'Software development subscription use cases',
    description: 'Situations where ongoing development and maintenance overlap.',
    href: SDAAS_USE_CASES_HREF,
  },
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
] as const;

export const maintenanceVsDevelopmentRelatedBlogLinks = [
  {
    title: 'Why UK SMEs need monthly digital support',
    description: 'When recurring support and improvement suit evolving business systems.',
    href: '/blog/monthly-digital-support-uk-smes',
  },
  {
    title: 'Fixed-price vs time & material vs subscription support',
    description: 'How delivery models relate to maintenance and enhancement work.',
    href: '/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  },
] as const;

export const maintenanceVsDevelopmentArticle: SupportingArticleDefinition = {
  slug: 'software-maintenance-vs-continuous-product-development',
  path: SDAAS_MAINTENANCE_VS_DEVELOPMENT_PATH,
  seo: SDAAS_MAINTENANCE_VS_DEVELOPMENT_SEO,
  ogImage: SDAAS_MAINTENANCE_VS_DEVELOPMENT_OG_IMAGE,
  breadcrumbLabel: 'Maintenance vs product development',
  cardCategory: 'Comparison Guide',
  contentType: 'comparison',
  funnelStage: 'mof',
  primaryIntent: 'clarify maintenance vs enhancement vs ongoing development',
  targetTopic: 'software maintenance vs development',
  analyticsNamespace: 'sdaas_maintenance_vs_dev',
  directAnswerTitle: 'Maintenance vs Product Development',
  directAnswer: SDAAS_MAINTENANCE_VS_DEVELOPMENT_DIRECT_ANSWER,
  directAnswerFollow:
    'Confusion often arises when one contract is expected to cover incident response, hosting, feature delivery and roadmap ownership without defining priorities or response times.',
  introParagraphs: [
    'After launch, software needs care: defects fixed, dependencies updated, integrations adapted—and often new features that change what the system can do. Suppliers use overlapping terms for these activities, which makes procurement and prioritisation harder than it needs to be.',
    'Maintenance and continuous product development are related but distinct. Maintenance preserves dependability and compatibility. Product development expands capability. Many organisations need both simultaneously, yet fund only one service or assume a development subscription automatically includes round-the-clock support.',
    'This guide defines maintenance types, compares them with product development, and offers practical boundaries for capacity, urgency and reporting.',
  ],
  introAsides: [
    {
      label: 'Maintenance service',
      href: CANONICAL_ROUTES.maintenance,
      linkLabel: 'Website and application maintenance',
    },
    {
      label: 'Technical debt',
      href: SDAAS_TECHNICAL_DEBT_HREF,
      linkLabel: 'Technical debt explained',
    },
  ],
  geoStatements: MAINTENANCE_VS_DEVELOPMENT_GEO_STATEMENTS,
  sections: [
    {
      id: 'what-maintenance-means',
      sectionKey: 'what_maintenance_means',
      title: 'What Software Maintenance Means',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Software maintenance keeps a live application working correctly in a changing environment. It focuses on reliability, compatibility and risk reduction rather than expanding the product vision—though some maintenance categories improve efficiency without adding features.',
          ],
        },
        { type: 'geo', statements: [MAINTENANCE_VS_DEVELOPMENT_GEO_STATEMENTS[0]] },
      ],
    },
    {
      id: 'corrective-maintenance',
      sectionKey: 'corrective_maintenance',
      title: 'Corrective Maintenance',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Corrective maintenance fixes defects discovered in production or testing—incorrect calculations, broken uploads, permission errors. It restores expected behaviour. Urgent corrective work often competes with planned development unless incident response is separately defined.',
          ],
        },
      ],
    },
    {
      id: 'adaptive-maintenance',
      sectionKey: 'adaptive_maintenance',
      title: 'Adaptive Maintenance',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Adaptive maintenance adjusts software when the external environment changes: CRM API updates, browser behaviour shifts, payment provider requirements, operating system deprecations. The system function stays the same; interfaces and compatibility layers change.',
          ],
        },
      ],
    },
    {
      id: 'preventive-maintenance',
      sectionKey: 'preventive_maintenance',
      title: 'Preventive Maintenance',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Preventive maintenance reduces the likelihood of future failures—security patches, certificate renewal automation, backup verification, dependency upgrades in supported versions. It is proactive rather than reactive, and often scheduled rather than incident-driven.',
          ],
        },
      ],
    },
    {
      id: 'perfective-maintenance',
      sectionKey: 'perfective_maintenance',
      title: 'Perfective Maintenance',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Perfective maintenance improves performance, readability or operability without changing primary business function—optimising slow queries, refactoring duplicated logic, improving logging. It overlaps with technical debt reduction and can enable faster future enhancement.',
          ],
        },
      ],
    },
    {
      id: 'continuous-product-development',
      sectionKey: 'continuous_product_development',
      title: 'What Continuous Product Development Means',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Continuous product development delivers planned changes that expand or alter capability: new customer journeys, additional integrations, admin tools, pricing models or reporting. Work is prioritised through a backlog, estimated against capacity and released in agreed cycles.',
            'It assumes ongoing product decisions—not only preserving what already exists. Enhancement competes with maintenance-type work unless boundaries and capacity are explicit.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.capabilitiesOverview,
          caption:
            'Product development prioritises capability expansion within monthly capacity alongside fixes and maintenance-type work.',
        },
      ],
    },
    {
      id: 'maintenance-vs-enhancement',
      sectionKey: 'maintenance_vs_enhancement',
      title: 'Maintenance vs Enhancement',
      blocks: [
        {
          type: 'table',
          headers: ['Dimension', 'Maintenance', 'Enhancement (product development)'],
          rows: [
            ['Primary goal', 'Preserve dependability and compatibility', 'Expand or change capability'],
            ['Typical triggers', 'Defects, vendor changes, security patches', 'Roadmap priorities, user needs, commercial strategy'],
            ['Success measure', 'Stable operation, reduced incident rate', 'New or improved outcomes for users or operations'],
            ['Planning horizon', 'Often reactive or scheduled hygiene', 'Backlog-driven with prioritisation reviews'],
          ],
        },
      ],
    },
    {
      id: 'maintenance-vs-support',
      sectionKey: 'maintenance_vs_support',
      title: 'Maintenance vs Support',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Support is the operational layer—help desk, incident triage, monitoring alerts, comms during outages. Maintenance includes the engineering work to fix underlying causes. A support contract may promise response times; maintenance delivers the change itself.',
            'Conflating the two leads to frustration when tickets are answered quickly but fixes wait in a development queue without agreed priority.',
          ],
        },
      ],
    },
    {
      id: 'maintenance-vs-incident',
      sectionKey: 'maintenance_vs_incident',
      title: 'Maintenance vs Incident Response',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Incident response addresses immediate production impact—restore service, communicate status, identify cause. Maintenance may follow to prevent recurrence through corrective or preventive work. Development capacity is not the same as an on-call roster unless explicitly designed that way.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'A development subscription is not automatically a 24/7 support service.',
        },
      ],
    },
    {
      id: 'competing-for-capacity',
      sectionKey: 'competing_for_capacity',
      title: 'How Maintenance and Development Compete for Capacity',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'In a single monthly plan, defects, patches and features draw from the same allocation unless split commercially. Without labelling and priority rules, maintenance consumes cycles silently or features defer while incidents dominate.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.monthlyCapacity,
          caption:
            'Illustrative monthly allocation must account for corrective work, preventive updates and planned enhancements together.',
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Urgent defects and planned improvements compete for finite delivery capacity unless separate support arrangements exist.',
        },
      ],
    },
    {
      id: 'example-workload',
      sectionKey: 'example_workload',
      title: 'Example Monthly Workload',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'The table below illustrates how mixed work might appear in one month. Proportions vary by product maturity, integration count and defect volume.',
          ],
        },
        {
          type: 'table',
          headers: ['Category', 'Example item', 'Service type', 'Priority note'],
          rows: exampleMonthlyWorkloadRows.map((row) => [...row]),
        },
      ],
    },
    {
      id: 'support-contract-enough',
      sectionKey: 'support_contract_enough',
      title: 'When a Support Contract Is Enough',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A maintenance or support contract may suffice when change is infrequent, the system is well understood, and stakeholders primarily need dependability—not roadmap iteration. Signs include low backlog volume, rare integration changes and acceptance of slower enhancement cadence.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Stable requirements with few enhancement requests',
            'Mature product with predictable operational patterns',
            'Internal team handles roadmap; supplier covers hosting and fixes',
            'Budget structured for support retainer rather than build capacity',
          ],
        },
      ],
    },
    {
      id: 'development-capacity-needed',
      sectionKey: 'development_capacity_needed',
      title: 'When Development Capacity Is Needed',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Development capacity fits when the organisation expects regular enhancements, integration growth or measurable product iteration beyond keeping existing functions alive.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Recurring feature backlog after launch',
            'Multiple integrations that change over time',
            'SaaS or internal platform with evolving user roles and workflows',
            'Need to balance debt reduction with visible product progress',
          ],
        },
      ],
    },
    {
      id: 'when-24-7-required',
      sectionKey: 'when_24_7_required',
      title: 'When 24/7 Support Is Required',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Round-the-clock support applies when downtime has severe commercial or safety impact and contracts define response and escalation windows. That is distinct from business-hours development capacity that ships prioritized changes on a cycle.',
            'Requiring 24/7 response without funding on-call coverage creates unsustainable expectations. Define hours, severity levels and channels explicitly.',
          ],
        },
      ],
    },
    {
      id: 'service-boundaries',
      sectionKey: 'service_boundaries',
      title: 'How to Define Service Boundaries',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Document what each service includes, how items enter the queue, and who decides order when maintenance and enhancements conflict.',
          ],
        },
        { type: 'checklist', items: serviceBoundaryChecklist },
      ],
    },
    {
      id: 'qa-release-governance',
      sectionKey: 'qa_release_governance',
      title: 'QA and Release Governance',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Both maintenance and development changes need testing and controlled release—especially when production serves paying users. Governance covers staging verification, rollback plans, release windows and communication to stakeholders.',
            'Skipping QA for “small maintenance” accumulates risk. Capacity plans should include testing effort for both defect fixes and features.',
          ],
        },
      ],
    },
    {
      id: 'buyer-checklist',
      sectionKey: 'buyer_checklist',
      title: 'Buyer Checklist',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Use this checklist when comparing proposals that blend maintenance, support and development language.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Are response times defined separately from development cycle time?',
            'Which maintenance types are in scope—corrective, adaptive, preventive, perfective?',
            'How do enhancements enter the backlog and get prioritised?',
            'Is release management shared or owned by one party?',
            'What reporting shows maintenance effort versus feature delivery?',
            'When would the provider recommend the dedicated maintenance service instead?',
          ],
        },
      ],
    },
  ],
  faqs: maintenanceVsDevelopmentFaqs,
  relatedLiveLinks: maintenanceVsDevelopmentRelatedLiveLinks,
  relatedBlogLinks: maintenanceVsDevelopmentRelatedBlogLinks,
  reusableVisuals: [
    SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.basePath,
    SDAAS_COMMERCIAL_IMAGES.capabilitiesOverview.basePath,
  ],
  aboutEntities: [
    'Software maintenance',
    'Continuous product development',
    'Software enhancement',
    'Application support',
  ],
  mentionEntities: [
    'Software Development as a Subscription',
    'Technical debt',
    'Application rescue',
    'Monthly software development capacity',
    'Quality assurance',
  ],
  conclusion: {
    paragraphs: [
      'Software maintenance and continuous product development serve different primary goals—dependability versus capability—yet both are often required on live systems.',
      'Define service boundaries, response expectations and how finite capacity is shared. A development subscription can include maintenance-type work when prioritised openly; it does not replace dedicated support SLAs by default.',
      'If your post-launch workload mixes incidents, patches and roadmap items, map them explicitly before the next commercial agreement—not after delivery slows.',
    ],
    primaryCta: {
      label: 'View maintenance service',
      href: CANONICAL_ROUTES.maintenance,
    },
    secondaryCta: {
      label: 'Explore development subscription',
      href: SDAAS_PAGE_PATH,
    },
  },
};

export {
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_PAGE_PATH,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
};
