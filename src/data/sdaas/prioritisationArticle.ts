import {
  CANONICAL_ROUTES,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';
import { SDAAS_CAPACITY_REQUEST_PATH, SDAAS_PAGE_PATH } from './commercialPage';
import { SDAAS_COMMERCIAL_IMAGES } from './images';
import type { SupportingArticleDefinition } from './supportingArticleTypes';

/** TOF process guide — practical monthly prioritisation for software backlogs. */
export const SDAAS_PRIORITISATION_PATH = SDAAS_PRIORITISATION_HREF;

export const SDAAS_PRIORITISATION_SEO = {
  title: 'How to Prioritise Software Development Requests',
  description:
    'Learn how to prioritise software requests using business value, urgency, risk, effort, dependencies and delivery capacity.',
  ogTitle: 'How to Prioritise Software Development Requests Every Month',
  ogDescription:
    'A backlog is a list of possibilities; prioritisation turns it into a delivery plan. Learn a practical framework for monthly software request decisions.',
  h1: 'How to Prioritise Software Development Requests Every Month',
  standfirst:
    'A shared backlog only becomes a delivery plan when items are ranked against business value, risk, effort and available capacity. This guide explains how to prioritise software requests without treating the loudest demand as the highest priority.',
  category: 'Process Guide',
  author: 'Primewayz UK',
  datePublished: '2026-07-16',
  dateModified: '2026-07-16',
  readTime: '16 min read',
  keywords: [
    'prioritise software development requests',
    'software backlog prioritisation',
    'monthly development priorities',
    'software request prioritisation framework',
    'backlog ranking business value',
    'urgent vs important software work',
    'development capacity prioritisation',
    'software delivery planning UK',
    'product backlog prioritisation SME',
    'monthly software planning',
  ],
} as const;

export const SDAAS_PRIORITISATION_OG_IMAGE =
  '/articles/sdaas/og-how-to-prioritise-software-development-requests.webp';

export const SDAAS_PRIORITISATION_DIRECT_ANSWER =
  'Software requests should be prioritised by combining business value, user impact, urgency, risk, dependencies and delivery effort. The highest-priority item is not always the loudest request; it is the work that creates the strongest justified outcome within available capacity.';

export const PRIORITISATION_GEO_STATEMENTS = [
  'A backlog is a list of possibilities; prioritisation turns it into a delivery plan.',
  'Urgent work can move other items, but it does not create additional capacity.',
  'Technical effort should inform priority, not decide it alone.',
] as const;

export const prioritisationFactorRows = [
  ['Business value', 'Revenue, cost reduction, compliance or strategic advantage if delivered'],
  ['Urgency', 'Time sensitivity, contractual deadline or operational blocking issue'],
  ['User impact', 'Number and importance of users affected, and severity of current friction'],
  ['Operational risk', 'Security, data integrity, reliability or failure exposure if deferred'],
  ['Effort', 'Estimated development, QA and release cost relative to available capacity'],
  ['Dependency', 'Prerequisite work, third-party readiness or data availability'],
  ['Strategic fit', 'Alignment with current product direction and agreed roadmap themes'],
] as const;

export const examplePrioritisedBacklogRows = [
  ['1', 'Fix checkout failure for card payments', 'High', 'Critical', 'Medium', 'Production revenue impact'],
  ['2', 'Improve onboarding for new trial users', 'High', 'Medium', 'Medium', 'Adoption and conversion focus'],
  ['3', 'Add CRM sync for qualified leads', 'Medium', 'Medium', 'High', 'Depends on field mapping sign-off'],
  ['4', 'Refactor legacy reporting module', 'Medium', 'Low', 'High', 'Technical debt; defer if no user pain'],
  ['5', 'Minor admin UI tidy-up', 'Low', 'Low', 'Low', 'Nice to have; suitable for spare capacity'],
] as const;

export const prioritisationBuyerChecklist = [
  'Who has authority to set and change priorities each month?',
  'What criteria distinguish genuine urgency from preference?',
  'How are business value and user impact documented for each item?',
  'How does estimated effort influence—but not automatically decide—ranking?',
  'What dependencies must be resolved before work can start?',
  'How are deferred items kept visible so they are not forgotten?',
  'How does urgent work affect already planned enhancements?',
  'How often is the backlog reviewed with the delivery provider?',
  'What reporting confirms priorities at cycle start and outcomes at cycle end?',
  'When should an item be split, descoped or moved to a separate project?',
] as const;

export const prioritisationFaqs = [
  {
    question: 'Should the most recent request automatically become top priority?',
    answer:
      'No. Recency is a weak prioritisation signal on its own. Requests should be ranked against business value, user impact, urgency, risk, dependencies and effort. The highest-priority item is not always the loudest request.',
  },
  {
    question: 'How should urgent bugs be handled in the backlog?',
    answer:
      'Production-impacting defects usually move ahead of planned enhancements, but the backlog should show what is displaced. Urgent work can move other items, but it does not create additional capacity.',
  },
  {
    question: 'Should technical debt always be deprioritised?',
    answer:
      'Not always. Technical debt that creates operational risk, slows every future change or blocks reliable releases may warrant high priority. Technical effort should inform priority, not decide it alone—the business impact of deferring debt matters.',
  },
  {
    question: 'What is the difference between a backlog and a delivery plan?',
    answer:
      'A backlog is a list of possibilities captured for future consideration. A delivery plan is the prioritised subset that fits available capacity for the current cycle. A backlog is a list of possibilities; prioritisation turns it into a delivery plan.',
  },
  {
    question: 'How many items should be prioritised per month?',
    answer:
      'That depends on item size, capacity and clarity. A common pattern is one primary initiative plus several smaller items, rather than a long list of partially started work. The provider should help right-size the plan against realistic throughput.',
  },
  {
    question: 'Who should own prioritisation on the client side?',
    answer:
      'A named product owner, operations lead or founder with authority to make trade-offs. Without clear ownership, priorities shift reactively and delivery stalls waiting for consensus.',
  },
  {
    question: 'Can priorities change after a cycle has started?',
    answer:
      'Yes, but changes should be deliberate. Mid-cycle reprioritisation may waste partially completed work or delay releases. A short weekly check-in reduces surprise changes while still allowing genuine urgency to be addressed.',
  },
  {
    question: 'How do dependencies affect ranking?',
    answer:
      'An item that depends on unfinished work, missing data or third-party approval cannot start meaningfully. Dependencies may raise an item’s priority if unblocking it enables other valuable work, or lower it until prerequisites are ready.',
  },
  {
    question: 'Should every stakeholder get parallel work in the same month?',
    answer:
      'Usually not within a small capacity allocation. Trying to satisfy every department simultaneously splits focus and slows releases. A visible backlog with agreed criteria helps manage expectations without hidden queues.',
  },
  {
    question: 'What if everything feels urgent?',
    answer:
      'If everything is urgent, prioritisation criteria have not been defined clearly enough. Revisit business value, user impact and operational risk with stakeholders, and agree what genuine production urgency means for your organisation.',
  },
] as const;

export const prioritisationRelatedLiveLinks = [
  {
    title: 'Software Development as a Subscription',
    description: 'Commercial service page for monthly development capacity in the UK.',
    href: SDAAS_PAGE_PATH,
  },
  {
    title: 'How monthly development capacity works',
    description: 'Understand finite capacity before ranking the backlog.',
    href: SDAAS_MONTHLY_CAPACITY_HREF,
  },
  {
    title: 'Subscription-Based Software Development Guide',
    description: 'Educational pillar covering subscription software and development subscriptions.',
    href: SDAAS_PILLAR_GUIDE_HREF,
  },
  {
    title: 'Development subscription vs fixed-price',
    description: 'When evolving priorities suit subscription delivery over fixed scope.',
    href: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  },
  {
    title: 'Software development subscription use cases',
    description: 'Situations where recurring backlog prioritisation is typical.',
    href: SDAAS_USE_CASES_HREF,
  },
  {
    title: 'Technical debt explained for business owners',
    description: 'How debt competes with features in monthly planning.',
    href: SDAAS_TECHNICAL_DEBT_HREF,
  },
] as const;

export const prioritisationRelatedBlogLinks = [
  {
    title: 'Why start with a foundation sprint',
    description: 'When discovery and stabilisation should come before monthly delivery.',
    href: '/blog/foundation-sprint-before-monthly-delivery',
  },
  {
    title: 'Fixed-price vs time & material vs subscription support',
    description: 'How delivery model affects how priorities can change over time.',
    href: '/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
  },
] as const;

export const prioritisationArticle: SupportingArticleDefinition = {
  slug: 'how-to-prioritise-software-development-requests',
  path: SDAAS_PRIORITISATION_PATH,
  seo: SDAAS_PRIORITISATION_SEO,
  ogImage: SDAAS_PRIORITISATION_OG_IMAGE,
  breadcrumbLabel: 'Prioritise development requests',
  cardCategory: 'Process Guide',
  contentType: 'explainer',
  funnelStage: 'tof',
  primaryIntent: 'prioritisation guidance',
  targetTopic: 'prioritise software development requests',
  analyticsNamespace: 'sdaas_prioritisation',
  directAnswerTitle: 'How Should Software Requests Be Prioritised?',
  directAnswer: SDAAS_PRIORITISATION_DIRECT_ANSWER,
  directAnswerFollow:
    'Effective prioritisation makes trade-offs visible: what will be delivered this cycle, what waits, and why.',
  introParagraphs: [
    'Most growing businesses accumulate more software requests than they can deliver at once. Feature ideas, defect reports, integration needs and internal improvements all compete for attention—often arriving through different channels and stakeholders.',
    'Without a prioritisation habit, delivery becomes reactive. Teams chase the latest message, partially start too many items and release less than stakeholders expect. A visible backlog helps, but ranking is what turns possibilities into a plan.',
    'This guide explains practical factors for prioritising software requests each month, how effort and urgency should influence decisions, and how finite delivery capacity constrains what “top priority” can mean in practice.',
  ],
  introAsides: [
    {
      label: 'Capacity explainer',
      href: SDAAS_MONTHLY_CAPACITY_HREF,
      linkLabel: 'How monthly development capacity works',
    },
    {
      label: 'Use cases',
      href: SDAAS_USE_CASES_HREF,
      linkLabel: 'Software development subscription use cases',
    },
    {
      label: 'Continuous development',
      href: SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
      linkLabel: 'Why businesses move to continuous development',
    },
  ],
  geoStatements: PRIORITISATION_GEO_STATEMENTS,
  sections: [
    {
      id: 'direct-answer',
      sectionKey: 'direct_answer',
      title: 'How Should Software Requests Be Prioritised?',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            SDAAS_PRIORITISATION_DIRECT_ANSWER,
            'Prioritisation is a business decision supported by technical input—not a scheduling exercise owned entirely by the development team. The goal is to maximise justified outcome within available capacity, not to satisfy every request equally.',
          ],
        },
        { type: 'geo', statements: PRIORITISATION_GEO_STATEMENTS },
      ],
    },
    {
      id: 'backlog-vs-plan',
      sectionKey: 'backlog_vs_plan',
      title: 'A Backlog Is Not Yet a Delivery Plan',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Capture everything worth considering, but do not treat every captured item as committed work. A healthy backlog holds options; the delivery plan holds this cycle’s ranked commitments.',
            'A backlog is a list of possibilities; prioritisation turns it into a delivery plan. Keeping that distinction explicit reduces the feeling that items were “promised” simply because they were logged.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.scatteredToStructured,
          caption:
            'Moving from scattered requests to a structured backlog with visible monthly priorities.',
        },
      ],
    },
    {
      id: 'loudest-not-highest',
      sectionKey: 'loudest_not_highest',
      title: 'Why the Loudest Request Is Not Always Top Priority',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Volume and seniority can distort prioritisation. A department head’s preference may matter strategically, but it should still be weighed against user impact, revenue risk and delivery effort—not assumed to jump the queue.',
            'Clear criteria give stakeholders a fair hearing without turning prioritisation into negotiation by persistence. When everyone understands the factors, “not this month” becomes a reasoned decision rather than a vague deferral.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Separate preference from production impact',
            'Document the business outcome each request supports',
            'Review rank order with named decision-makers, not informal side channels',
            'Publish what is in the current plan so silence does not imply agreement',
          ],
        },
      ],
    },
    {
      id: 'prioritisation-factors',
      sectionKey: 'prioritisation_factors',
      title: 'Factors That Should Influence Priority',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'No single score fits every organisation, but the same factors recur in sound prioritisation conversations. Use them to structure discussion rather than as a rigid formula that removes judgment.',
          ],
        },
        {
          type: 'table',
          headers: ['Factor', 'Questions to ask'],
          rows: prioritisationFactorRows.map((row) => [...row]),
        },
      ],
    },
    {
      id: 'scoring-framework',
      sectionKey: 'scoring_framework',
      title: 'A Practical Scoring Framework (Not a Universal Formula)',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Some teams benefit from lightweight scoring— for example, rating business value and urgency higher than effort savings from deferring debt. The framework below is illustrative. Adapt weightings to your context rather than treating any score as mechanically definitive.',
          ],
        },
        {
          type: 'scorecard',
          intro:
            'Use prompts to compare items consistently. Scores inform conversation; they do not replace accountable decision-making.',
          categories: [
            {
              name: 'Business value',
              prompts: [
                'What measurable outcome improves if this ships?',
                'Does this unlock revenue, reduce cost or reduce compliance risk?',
                'Is the benefit one-off or recurring?',
              ],
            },
            {
              name: 'Urgency and risk',
              prompts: [
                'Is production or revenue currently affected?',
                'What happens if we defer this for one or two cycles?',
                'Does deferral increase security or data-integrity exposure?',
              ],
            },
            {
              name: 'User impact',
              prompts: [
                'Which user groups are affected and how severely?',
                'Is the pain frequent or edge-case?',
                'Will users notice the improvement immediately after release?',
              ],
            },
            {
              name: 'Effort and dependency',
              prompts: [
                'What is the estimated effort including QA and release?',
                'What must exist before work can start?',
                'Does this item enable or block other valuable work?',
              ],
            },
          ],
        },
        {
          type: 'callout',
          tone: 'geo',
          text: 'Technical effort should inform priority, not decide it alone.',
        },
      ],
    },
    {
      id: 'effort-vs-value',
      sectionKey: 'effort_vs_value',
      title: 'When Effort Should and Should Not Decide Priority',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Low-effort items are tempting because they clear quickly, but a month of small tasks can crowd out one high-value change. Conversely, a large effort estimate is not a reason to ignore operational risk.',
            'Effort helps right-size the plan against capacity. It should not automatically demote work that prevents failure or unlocks significant business value.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Quick wins suit spare capacity at the end of a cycle, not by default every cycle',
            'Large items may need splitting into releasable slices',
            'High-effort debt work needs explicit business justification',
            'Unknown effort is a signal for clarification before commitment',
          ],
        },
      ],
    },
    {
      id: 'urgency-rules',
      sectionKey: 'urgency_rules',
      title: 'Agreeing What Counts as Urgent',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Urgent work can move other items, but it does not create additional capacity. Teams therefore need shared urgency criteria—such as production outage, payment failure, data breach exposure or contractual deadline—rather than subjective pressure.',
            'When urgency rules are weak, every item becomes P1 and planned improvements never ship. Document examples of what qualifies and what should wait for the next prioritisation review.',
          ],
        },
        {
          type: 'callout',
          tone: 'warning',
          text: 'Urgent work can move other items, but it does not create additional capacity.',
        },
      ],
    },
    {
      id: 'dependencies',
      sectionKey: 'dependencies',
      title: 'How Dependencies Reorder the Backlog',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Dependencies include technical prerequisites, third-party approvals, data readiness and sequential feature logic. An item that cannot start should not consume active attention merely because it ranks highly on value.',
            'Sometimes the highest-value move is unblocking another item— for example, completing API credentials setup before integration work begins.',
          ],
        },
        {
          type: 'bullets',
          items: [
            'Mark blocked items with the specific prerequisite',
            'Elevate unblockers that enable multiple downstream items',
            'Do not start integration work before field mapping is signed off',
            'Revisit blocked items when dependencies change',
          ],
        },
      ],
    },
    {
      id: 'capacity-constraint',
      sectionKey: 'capacity_constraint',
      title: 'How Capacity Constrains Prioritisation',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Prioritisation without capacity awareness produces fantasy plans. Available delivery effort—including clarification, QA and release—defines how many items can genuinely progress.',
            'Reprioritisation changes order, not capacity. If the plan exceeds the allocation, something must drop or the capacity level must change commercially.',
          ],
        },
        {
          type: 'visual',
          image: SDAAS_COMMERCIAL_IMAGES.monthlyCapacity,
          caption:
            'Priorities must fit within agreed monthly capacity—not every ranked item can start at once.',
        },
      ],
    },
    {
      id: 'example-backlog',
      sectionKey: 'example_backlog',
      title: 'Example Prioritised Backlog',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'The table below shows a simplified monthly view. Rank, value and urgency labels are illustrative—your organisation may use different scales or narrative justification instead of numbers.',
          ],
        },
        {
          type: 'table',
          headers: ['Rank', 'Item', 'Business value', 'Urgency', 'Effort', 'Notes'],
          rows: examplePrioritisedBacklogRows.map((row) => [...row]),
        },
      ],
    },
    {
      id: 'monthly-rhythm',
      sectionKey: 'monthly_rhythm',
      title: 'A Monthly Prioritisation Rhythm',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'A repeating cadence reduces drift. Many engagements benefit from a brief monthly planning session to confirm priorities, plus a weekly check-in to surface blockers and genuine urgency without reopening the entire backlog every few days.',
          ],
        },
        {
          type: 'bullets',
          ordered: true,
          items: [
            'Review new intake since the last cycle',
            'Confirm capacity available for the coming period',
            'Rank items using agreed factors and decision ownership',
            'Agree what is in scope, deferred or split',
            'Review outcomes and carry-forward at cycle end',
          ],
        },
      ],
    },
    {
      id: 'roles',
      sectionKey: 'roles',
      title: 'Who Decides, Who Advises',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'The client-side product or business owner should own priority decisions. The delivery provider advises on effort, risk, dependencies and technical consequences of deferral—not substitute for accountable business judgment.',
            'When decision authority is shared across many stakeholders without a tie-breaker, prioritisation stalls. Name who can say yes, no and “not this month.”',
          ],
        },
      ],
    },
    {
      id: 'common-mistakes',
      sectionKey: 'common_mistakes',
      title: 'Common Prioritisation Mistakes',
      blocks: [
        {
          type: 'bullets',
          items: [
            'Treating the backlog as a promise list rather than options',
            'Labelling everything urgent',
            'Ignoring QA and release effort when comparing items',
            'Starting too many parallel initiatives within small capacity',
            'Deferring debt with no review date or trigger',
            'Changing priorities daily without acknowledging displaced work',
            'Failing to document why lower-ranked items waited',
          ],
        },
      ],
    },
    {
      id: 'reporting-priorities',
      sectionKey: 'reporting_priorities',
      title: 'Reporting Priorities and Outcomes',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'At cycle start, confirm the ranked plan in writing. At cycle end, report what shipped, what slipped and why. That closes the loop for stakeholders who did not attend every check-in.',
            'Good reporting references the original priority rationale. If a defect jumped the queue, say what was delayed as a result.',
          ],
        },
      ],
    },
    {
      id: 'buyer-checklist',
      sectionKey: 'buyer_checklist',
      title: 'Questions Buyers Should Ask About Prioritisation',
      blocks: [
        {
          type: 'paragraphs',
          texts: [
            'Before engaging a development subscription, understand how prioritisation will work in practice—not only how work is developed once priorities are set.',
          ],
        },
        { type: 'checklist', items: prioritisationBuyerChecklist },
      ],
    },
  ],
  faqs: prioritisationFaqs,
  relatedLiveLinks: prioritisationRelatedLiveLinks,
  relatedBlogLinks: prioritisationRelatedBlogLinks,
  reusableVisuals: [
    SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.basePath,
    SDAAS_COMMERCIAL_IMAGES.scatteredToStructured.basePath,
  ],
  aboutEntities: [
    'Software backlog prioritisation',
    'Monthly development planning',
    'Software Development as a Subscription',
    'Product ownership',
  ],
  mentionEntities: [
    'Business value',
    'Technical debt',
    'Delivery capacity',
    'Urgent defect',
    'Acceptance criteria',
    'Continuous software development',
  ],
  conclusion: {
    paragraphs: [
      'Prioritisation turns a backlog of possibilities into a delivery plan that fits available capacity. The highest-priority work should be the strongest justified outcome—not simply the most recent or most insistent request.',
      'When business value, urgency, risk, effort and dependencies are discussed openly, trade-offs become manageable and releases become more predictable.',
      'If your backlog is growing faster than delivery, start by clarifying decision ownership and capacity before adding more items to the queue.',
    ],
    primaryCta: {
      label: 'Request a capacity recommendation',
      href: SDAAS_CAPACITY_REQUEST_PATH,
    },
    secondaryCta: {
      label: 'Read how monthly capacity works',
      href: SDAAS_MONTHLY_CAPACITY_HREF,
    },
  },
};

export {
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_PAGE_PATH,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
};
