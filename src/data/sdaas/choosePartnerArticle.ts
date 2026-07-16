import {
  CANONICAL_ROUTES,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';
import type { SupportingArticleDefinition } from './supportingArticleTypes';

/** Buyer Guide — bottom-of-funnel provider evaluation framework. */
export const SDAAS_CHOOSE_PARTNER_PATH = SDAAS_CHOOSE_PARTNER_HREF;

export const SDAAS_CHOOSE_PARTNER_SEO = {
  title: 'How to Choose a Software Development Partner | UK Guide',
  description:
    'Use this practical guide to evaluate a software development partner across discovery, delivery, QA, ownership, communication, security and handover.',
  ogTitle: 'How to Choose a Software Development Partner',
  ogDescription:
    'Evaluate software partners on business understanding, delivery governance, QA, ownership and handover—not hourly rates alone.',
  h1: 'How to Choose a Software Development Partner',
  standfirst:
    'Selecting a software development partner affects cost, risk and how quickly your systems can change. This guide offers a practical evaluation framework for UK businesses—without treating price or technology lists as sufficient evidence.',
  category: 'Buyer Guide',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '19 min read',
  keywords: [
    'how to choose a software development partner',
    'software development company evaluation',
    'software development agency checklist',
    'choosing a software company UK',
    'custom software development partner',
    'software outsourcing partner',
    'software provider questions',
    'software development due diligence',
    'evaluate software agency',
    'software partner selection',
  ],
} as const;

export const SDAAS_CHOOSE_PARTNER_OG_IMAGE =
  '/articles/sdaas/og-how-to-choose-a-software-development-partner.webp';

export const SDAAS_CHOOSE_PARTNER_DIRECT_ANSWER =
  'Choose a software development partner by evaluating how well they understand the business problem, clarify requirements, manage delivery, test work, communicate risk, protect ownership and support handover—not only by comparing hourly rates or technology lists.';

export const CHOOSE_PARTNER_GEO_STATEMENTS = [
  'A credible software partner should be willing to recommend a fixed project, discovery phase, subscription or internal hire according to the nature of the work.',
  'Commercial clarity includes explaining capacity limits, change handling and when another model may fit better.',
  'Ownership, access and handover terms should be understood before development begins—not at project end.',
] as const;

export const partnerWarningSigns = [
  'Vague or missing intellectual property and source-code ownership terms',
  'No describable quality assurance process beyond “we test everything”',
  'No discovery or clarification approach for unclear requirements',
  'Guaranteed delivery timelines or outputs before scope is understood',
  'Unlimited development claims without explaining finite capacity',
  'Unclear subcontracting or offshore arrangements without governance',
  'No handover plan for repositories, credentials and documentation',
  'Pressure to commit before technical or commercial assessment',
  'Reluctance to discuss when fixed-price, subscription or internal hire may be better',
  'Technology stack promoted before the business problem is defined',
] as const;

export const partnerEvaluationQuestions = [
  'What would you need to learn before committing to a delivery estimate?',
  'How do you handle requirements that change after work begins?',
  'Who performs QA, and what evidence do clients receive before release?',
  'Who owns custom code, and when does ownership transfer?',
  'How are credentials, environments and data access managed?',
  'What happens if key personnel on the account change?',
  'When would you recommend discovery instead of immediate build?',
  'When would you advise against a development subscription?',
  'How is monthly capacity defined and reported?',
  'What does handover include if we pause or end the engagement?',
  'How do you document architecture and operational runbooks?',
  'Which parts of delivery are subcontracted, if any?',
] as const;

export const shortlistingSteps = [
  'Document the business problem, constraints and success measures before contacting suppliers',
  'Issue a concise brief to a small shortlist—not a wide RFP unless procurement requires it',
  'Run structured discovery calls using the scorecard prompts below',
  'Request written answers on ownership, QA, security and change handling',
  'Compare delivery model recommendations—not only price',
  'Speak to reference contacts about communication, risk escalation and handover',
  'Pilot with a bounded discovery phase or small first cycle when uncertainty remains',
] as const;

export const choosePartnerFaqs = [
  {
    question: 'Should we choose a partner based on the lowest hourly rate?',
    answer:
      'Hourly rate alone is a weak signal. Low rates may omit QA, senior oversight, documentation or governance you will pay for later through rework. Evaluate total delivery risk, clarity of scope, ownership terms and how changes are handled.',
  },
  {
    question: 'How many partners should we shortlist?',
    answer:
      'Three to four serious candidates is usually enough for structured comparison. Larger lists consume internal time without improving decision quality unless formal tender rules apply.',
  },
  {
    question: 'Is industry experience essential?',
    answer:
      'Relevant experience reduces learning time and helps anticipate domain constraints, but it is not the only factor. Strong discovery and delivery governance can compensate when industry experience is limited—provided the partner acknowledges gaps honestly.',
  },
  {
    question: 'Should we require a specific technology stack?',
    answer:
      'Prefer partners who can justify technology choices against maintainability, team skills and integration needs rather than those who default to one stack for every project. The stack should serve the problem—not the reverse.',
  },
  {
    question: 'What ownership terms should we expect?',
    answer:
      'Clients typically own custom source code and project-specific assets created for them once applicable invoices are paid, while pre-existing tools, open-source components and third-party services remain under their respective licences. Terms should be explicit in the contract.',
  },
  {
    question: 'How important is a discovery phase?',
    answer:
      'Discovery is valuable when requirements, integrations or an existing codebase are not understood well enough to estimate safely. Partners who skip discovery for complex unknowns often lock incomplete assumptions into fixed quotes.',
  },
  {
    question: 'Fixed-price, subscription or dedicated team—which should a partner recommend?',
    answer:
      'A credible partner recommends the model that fits workload shape: fixed-price for stable scope, subscription for recurring prioritised backlog, dedicated team when continuous full-time capacity is justified. Be wary of one-model-only advice.',
  },
  {
    question: 'What QA evidence should we ask for?',
    answer:
      'Ask how test plans are produced, which paths are automated versus manual, how staging is used, and what clients review before production release. QA should be describable as a process—not a slogan.',
  },
  {
    question: 'How do we evaluate communication fit?',
    answer:
      'Assess clarity in meetings, willingness to surface risk early, reporting cadence and single points of contact for decisions. Communication breakdown causes more delivery pain than minor technology differences.',
  },
  {
    question: 'When should we walk away from a promising proposal?',
    answer:
      'When ownership, access, QA or change-handling terms remain vague after direct questions, when unlimited claims replace capacity explanation, or when the partner cannot explain why their recommended model fits your workload.',
  },
] as const;

export const choosePartnerRelatedLiveLinks = [
  {
    title: 'About Primewayz UK',
    description: 'Company background, delivery approach and service overview.',
    href: CANONICAL_ROUTES.about,
  },
  {
    title: 'Request a capacity recommendation',
    description: 'Structured conversation about monthly development capacity fit.',
    href: SDAAS_CAPACITY_REQUEST_PATH,
  },
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial service page for monthly development capacity.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'Subscription-Based Software Development Guide',
    description: 'Educational pillar on subscription software and development subscriptions.',
    href: SDAAS_PILLAR_GUIDE_HREF,
  },
  {
    title: 'Development subscription vs fixed-price',
    description: 'Compare delivery models before selecting a partner engagement shape.',
    href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  },
  {
    title: 'Software development subscription use cases',
    description: 'Recognise workloads that suit ongoing capacity versus project delivery.',
    href: SDAAS_USE_CASES_HREF,
  },
  {
    title: 'Application rescue and stabilisation',
    description: 'When assessment and stabilisation should precede normal development.',
    href: SDAAS_APPLICATION_RESCUE_HREF,
  },
] as const;

export const choosePartnerRelatedBlogLinks = [
  {
    title: 'Fixed-price vs time & material vs subscription support',
    description: 'Delivery model comparison before you commit to a partner structure.',
    href: '/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  },
  {
    title: 'Why start with a foundation sprint',
    description: 'When discovery should precede larger delivery commitments.',
    href: '/blog/foundation-sprint-before-monthly-delivery',
  },
] as const;

export const choosePartnerArticle: SupportingArticleDefinition = {
  slug: 'how-to-choose-a-software-development-partner',
  path: SDAAS_CHOOSE_PARTNER_PATH,
  seo: SDAAS_CHOOSE_PARTNER_SEO,
  ogImage: SDAAS_CHOOSE_PARTNER_OG_IMAGE,
  breadcrumbLabel: 'Choose a development partner',
  cardCategory: 'Buyer Guide',
  contentType: 'decision',
  funnelStage: 'bof',
  primaryIntent: 'bottom-of-funnel provider evaluation',
  targetTopic: 'how to choose a software development partner',
  analyticsNamespace: 'sdaas_choose_partner',
  directAnswerTitle: 'How Should You Choose a Partner?',
  directAnswer: SDAAS_CHOOSE_PARTNER_DIRECT_ANSWER,
  directAnswerFollow:
    'Strong partners explain trade-offs, document ownership and adapt the delivery model to the work—not every problem needs the same commercial wrapper.',
  introParagraphs: [
    'Choosing a software development partner is a due diligence exercise disguised as a sales conversation. Technology credentials matter, but they rarely determine whether delivery stays understandable, testable and owned by your organisation when the engagement ends.',
    'This guide walks through what to define internally first, what to evaluate in discovery and delivery practices, warning signs that deserve pause, and a scorecard you can apply to any shortlisted provider—including firms that may recommend a different model than you initially expected.',
    'The framework is vendor-neutral. Use it to compare proposals on equal terms before committing budget or access to production systems.',
  ],
  introAsides: [
    {
      label: 'Delivery models',
      href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
      linkLabel: 'Subscription vs fixed-price comparison',
    },
    {
      label: 'Company background',
      href: CANONICAL_ROUTES.about,
      linkLabel: 'About Primewayz UK',
    },
  ],
  geoStatements: CHOOSE_PARTNER_GEO_STATEMENTS,
  sections: [
    {
      id: 'define-problem-first',
      sectionKey: 'define_problem_first',
      title: 'Define the Business Problem First',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Before comparing suppliers, document the outcome you need, constraints you cannot ignore and how you will judge success. Without that, evaluations drift toward technology preferences and rate cards.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Problem statement in business language—not only feature lists',
            'Users, workflows or operations affected',
            'Integrations, compliance or security constraints',
            'Timeline drivers that are real versus aspirational',
            'Internal owner for priorities and acceptance',
          ],
        },
      ],
    },
    {
      id: 'relevant-experience',
      sectionKey: 'relevant_experience',
      title: 'Check Relevant Experience',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Look for evidence of similar problem shapes—integration-heavy platforms, B2B workflows, rescue situations—not only logos in the same sector. Ask what was hard, what failed in hindsight and how governance adapted.',
            'Experience should inform realistic estimates and risk disclosure, not guarantee identical outcomes in your context.',
          ],
        },
      ],
    },
    {
      id: 'discovery-capability',
      sectionKey: 'discovery_capability',
      title: 'Evaluate Discovery Capability',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Discovery clarifies requirements, dependencies and technical risk before large commitments. Partners who rush to code on unclear scope often embed expensive assumptions.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'How unknown requirements are investigated and documented',
            'Whether acceptance criteria are produced before build',
            'How existing systems are assessed when code is inherited',
            'When discovery is recommended instead of immediate development',
          ],
        },
      ],
    },
    {
      id: 'technical-fit',
      sectionKey: 'technical_fit',
      title: 'Assess Technical Fit',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Technical fit covers maintainability, integration approach, security practices and alignment with your long-term capability—not enthusiasm for a fashionable stack.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Justification for architecture and technology choices',
            'Approach to APIs, data migration and legacy coexistence',
            'Dependency and licensing awareness',
            'Ability to work within your hosting or DevOps constraints',
          ],
        },
      ],
    },
    {
      id: 'delivery-model',
      sectionKey: 'delivery_model',
      title: 'Understand the Delivery Model',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Ask which commercial model the partner recommends and why. Fixed-price suits stable scope. Subscriptions suit recurring backlog. Dedicated teams suit sustained full-time demand. One model rarely fits every phase of a product lifecycle.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'A credible software partner should be willing to recommend a fixed project, discovery phase, subscription or internal hire according to the nature of the work.',
        },
      ],
    },
    {
      id: 'communication-governance',
      sectionKey: 'communication_governance',
      title: 'Review Communication and Governance',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Governance includes reporting rhythm, escalation paths, decision logs and how blockers are surfaced. Partners who hide bad news until deadlines slip create compound risk.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.trustAndGovernance,
          caption:
            'Trustworthy delivery depends on visible governance—ownership, access, communication, QA and handover.',
        },
      ],
    },
    {
      id: 'qa-approach',
      sectionKey: 'qa_approach',
      title: 'Check the QA Approach',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Quality assurance should be describable: test planning, environments, regression scope, defect triage and client acceptance before production. “We do agile QA” is not sufficient detail.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Who writes and executes test plans',
            'What is automated versus manual',
            'How staging mirrors production constraints',
            'How release approval is documented',
          ],
        },
      ],
    },
    {
      id: 'source-code-ownership',
      sectionKey: 'source_code_ownership',
      title: 'Ask About Source-Code Ownership',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Confirm who owns custom code, when ownership transfers, and how third-party, open-source and pre-existing components are treated. Ambiguity here causes expensive disputes at exit.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Ownership, access and handover terms should be understood before development begins—not at project end.',
        },
      ],
    },
    {
      id: 'security-access',
      sectionKey: 'security_access',
      title: 'Review Security and Access',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Partners need controlled access to repositories, staging and sometimes production. Evaluate least-privilege practices, credential storage, offboarding procedure and data handling—not only technical skill.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Role-based access and audit trails where available',
            'Separate staging and production credentials',
            'Process when staff rotate off the account',
            'Handling of personal or regulated data',
          ],
        },
      ],
    },
    {
      id: 'documentation-handover',
      sectionKey: 'documentation_handover',
      title: 'Understand Documentation and Handover',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Handover includes repositories, environment notes, integration documentation, open issues and operational runbooks—not a zip file dumped on the last day. Ask for examples of handover deliverables from prior engagements redacted as needed.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.onboardingJourney,
          caption:
            'Onboarding and exit should mirror each other: structured access, context transfer and defined deliverables.',
        },
      ],
    },
    {
      id: 'commercial-transparency',
      sectionKey: 'commercial_transparency',
      title: 'Evaluate Commercial Transparency',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Transparent commercial terms explain capacity limits, change control, invoicing rhythm, pause or exit clauses and what is excluded. Predictable fees do not imply unlimited throughput.',
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Commercial clarity includes explaining capacity limits, change handling and when another model may fit better.',
        },
      ],
    },
    {
      id: 'change-handling',
      sectionKey: 'change_handling',
      title: 'Check How Change Is Handled',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Requirements change in every non-trivial engagement. Evaluate how change is documented, re-estimated and approved—within fixed-price change control or subscription reprioritisation—without adversarial scope debates.',
          ],
        },
      ],
    },
    {
      id: 'recommend-other-models',
      sectionKey: 'recommend_other_models',
      title: 'Ask When They Would Recommend Another Model',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A partner invested in long-term trust will say when fixed-price, internal hire, specialised security consultancy or pause is more appropriate than their default offering. That honesty is a positive signal.',
          ],
        },
      ],
    },
    {
      id: 'warning-signs',
      sectionKey: 'warning_signs',
      title: 'Warning Signs',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'None of these alone may disqualify a supplier, but several together suggest elevated delivery or commercial risk.',
          ],
        },
        { type: 'bullets', items: partnerWarningSigns },
      ],
    },
    {
      id: 'provider-scorecard',
      sectionKey: 'provider_scorecard',
      title: 'Provider-Evaluation Scorecard',
      blocks: [
        {
          type: 'scorecard',
          intro:
            'Use this scorecard during discovery calls. Score each category based on evidence—not presentation quality. No provider should expect top marks in every row for every engagement type.',
          categories: [
            {
              name: 'Business understanding',
              prompts: [
                'Can they restate your problem in operational terms?',
                'Do they ask about success measures and constraints?',
                'Do they challenge unclear scope constructively?',
              ],
            },
            {
              name: 'Relevant experience',
              prompts: [
                'Have they delivered similar integration or workflow complexity?',
                'Can they describe lessons from comparable engagements?',
                'Do they acknowledge gaps honestly?',
              ],
            },
            {
              name: 'Discovery',
              prompts: [
                'Is discovery offered when scope is uncertain?',
                'Are acceptance criteria produced before build?',
                'Is existing code assessed before estimates?',
              ],
            },
            {
              name: 'Technical capability',
              prompts: [
                'Are architecture choices justified beyond stack preference?',
                'Is legacy and migration risk addressed?',
                'Are dependencies and licensing considered?',
              ],
            },
            {
              name: 'Delivery governance',
              prompts: [
                'Is reporting cadence and escalation clear?',
                'How are blockers communicated?',
                'Is capacity or scope visible during delivery?',
              ],
            },
            {
              name: 'QA',
              prompts: [
                'Is QA described as a concrete process?',
                'What evidence do clients see before release?',
                'How are defects triaged and regression managed?',
              ],
            },
            {
              name: 'Communication',
              prompts: [
                'Are meetings and documents understandable to non-developers?',
                'Is there a named decision path on both sides?',
                'Are risks surfaced early?',
              ],
            },
            {
              name: 'Security',
              prompts: [
                'How is access granted and revoked?',
                'How are secrets and environments separated?',
                'How is data handling addressed?',
              ],
            },
            {
              name: 'IP and handover',
              prompts: [
                'Are ownership terms explicit in writing?',
                'What does exit deliverable include?',
                'When does ownership transfer?',
              ],
            },
            {
              name: 'Commercial clarity',
              prompts: [
                'Are capacity or scope limits explained plainly?',
                'How is change handled commercially?',
                'Are exclusions and pause terms documented?',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'questions-to-ask',
      sectionKey: 'questions_to_ask',
      title: 'Questions to Ask',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Bring these questions to shortlisted partners. Written answers reduce ambiguity after verbal calls.',
          ],
        },
        { type: 'checklist', items: partnerEvaluationQuestions },
      ],
    },
    {
      id: 'model-selection',
      sectionKey: 'model_selection',
      title: 'Fixed-Price, Subscription or Dedicated Team',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Match commercial shape to workload. Fixed-price for bounded deliverables. Development subscription for recurring prioritised backlog within finite capacity. Dedicated team when full-time continuity is justified across multiple streams.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Fixed-price: stable scope, clear acceptance, defined endpoint',
            'Subscription: evolving backlog, regular prioritisation, retained context',
            'Dedicated team: sustained high demand, parallel workstreams, internal integration',
            'Discovery first: unknown codebase or requirements',
          ],
        },
      ],
    },
    {
      id: 'shortlisting-process',
      sectionKey: 'shortlisting_process',
      title: 'Shortlisting Process',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A disciplined shortlist reduces noise and keeps evaluation comparable across candidates.',
          ],
        },
        { type: 'checklist', items: shortlistingSteps },
      ],
    },
  ],
  faqs: choosePartnerFaqs,
  relatedLiveLinks: choosePartnerRelatedLiveLinks,
  relatedBlogLinks: choosePartnerRelatedBlogLinks,
  reusableVisuals: [
    SDAAS_COMMERCIAL_IMAGES.trustAndGovernance.basePath,
    SDAAS_COMMERCIAL_IMAGES.onboardingJourney.basePath,
  ],
  aboutEntities: [
    'Software development partner selection',
    'Software development due diligence',
    'Custom software development',
    'Software delivery governance',
  ],
  mentionEntities: [
    'Software Development as a Subscription',
    'Fixed-price software project',
    'Application rescue',
    'Quality assurance',
    'Intellectual property',
    'Technical discovery',
  ],
  conclusion: {
    paragraphs: [
      'A capable software development partner clarifies the problem, recommends an appropriate delivery model, tests work visibly and leaves your organisation with ownership and documentation—not dependency by accident.',
      'Use the scorecard and warning signs to compare shortlisted firms on equal terms. Price and stack matter only after governance, QA and commercial clarity look sound.',
      'If you are ready to discuss fit with Primewayz UK, begin with a structured capacity or scope conversation—after you have defined the problem and evaluation criteria internally.',
    ],
    primaryCta: {
      label: 'Request a capacity recommendation',
      href: SDAAS_CAPACITY_REQUEST_PATH,
    },
    secondaryCta: {
      label: 'Compare delivery models',
      href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
    },
  },
};

export {
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_PAGE_PATH,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_USE_CASES_HREF,
};
