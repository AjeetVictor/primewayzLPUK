import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import type {
  BlogCategory,
  BlogPost,
  BreadcrumbItem,
  NormalisedBlogPostCategories,
} from './types';

const getPostTimestamp = (post: BlogPost) => {
  const timestamp = Date.parse(post.updatedDate || post.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

/**
 * Central blog category registry.
 * Articles reference categories by stable slug (`primaryCategory` / `secondaryCategories`).
 * Legacy free-text `category` labels are normalised via LEGACY_CATEGORY_LABEL_TO_SLUG.
 */

export const BLOG_CATEGORY_PATH_PREFIX = '/blog/category' as const;

const categoryPath = (slug: string) => `${BLOG_CATEGORY_PATH_PREFIX}/${slug}`;

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: 'software-development',
    name: 'Software Development',
    shortName: 'Software Dev',
    eyebrow: 'Delivery & engineering',
    title: 'Software Development Insights',
    description:
      'Practical guidance on delivery models, subscription capacity, and building reliable software with UK SME and SaaS teams.',
    longDescription:
      'These articles focus on how UK businesses choose and run software delivery — fixed price, time and material, subscription support, and the operating rhythm that keeps product work moving without a full in-house team.',
    seoTitle: 'Software Development Insights for UK SMEs | Primewayz UK',
    seoDescription:
      'Read Primewayz UK insights on software delivery models, subscription development support, and practical engineering for UK SMEs and SaaS founders.',
    canonicalPath: categoryPath('software-development'),
    featuredArticleSlug:
      'fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
    essentialGuideSlugs: [
      'fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders',
      'foundation-sprint-before-monthly-delivery',
    ],
    relatedCategorySlugs: [
      'software-support',
      'product-development',
      'business-strategy',
      'legacy-modernisation',
    ],
    serviceLinks: [
      {
        title: 'Software development subscription',
        description:
          'Monthly engineering capacity for product work, integrations, and continuous delivery.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
      {
        title: 'Request capacity recommendation',
        description: 'Get a practical monthly capacity recommendation for your roadmap.',
        href: CANONICAL_ROUTES.sdaasCapacityRequest,
        ctaLabel: 'Request capacity',
      },
      {
        title: 'Book a discovery call',
        description: 'Talk through delivery model fit before you commit to monthly capacity.',
        href: CANONICAL_ROUTES.bookCall,
        ctaLabel: 'Book a UK discovery call',
      },
    ],
    faq: [
      {
        question: 'What delivery models does Primewayz UK support?',
        answer:
          'We support fixed-scope work where boundaries are clear, time and material for evolving scope, and subscription-based monthly capacity for ongoing product and system work.',
      },
      {
        question: 'Is subscription software development suitable for UK SMEs?',
        answer:
          'Yes, when you need steady progress across features, fixes, and integrations without hiring a full team. It works best with a clear priority queue and shared ownership of outcomes.',
      },
      {
        question: 'How do we start software delivery with Primewayz UK?',
        answer:
          'Most engagements begin with a Foundation Sprint to clarify goals, risks, and the first delivery backlog, then move into monthly capacity once priorities are clear.',
      },
    ],
    isIndexable: true,
    order: 1,
  },
  {
    slug: 'ai-automation',
    name: 'AI & Automation',
    shortName: 'AI & Automation',
    eyebrow: 'Operations & AI',
    title: 'AI & Automation Insights',
    description:
      'Grounded advice on AI readiness, automation priorities, and avoiding content or tool fatigue in UK small business operations.',
    longDescription:
      'These articles help UK SMEs prepare data, CRM workflows, and team review before adopting AI — and focus automation on enquiry capture, follow-up, and reporting rather than novelty tools.',
    seoTitle: 'AI & Automation Insights for UK SMEs | Primewayz UK',
    seoDescription:
      'Practical AI readiness and automation guidance for UK SMEs — from operations foundations to outcome-driven content and CRM workflows.',
    canonicalPath: categoryPath('ai-automation'),
    featuredArticleSlug: 'ai-content-fatigue-uk-smes-outcome-driven-content',
    essentialGuideSlugs: [
      'ai-content-fatigue-uk-smes-outcome-driven-content',
      'ai-readiness-for-uk-small-business-operations',
    ],
    relatedCategorySlugs: [
      'digital-transformation',
      'technical-seo',
      'business-strategy',
      'software-support',
    ],
    serviceLinks: [
      {
        title: 'CRM & automation support',
        description:
          'Stabilise enquiry capture, routing, reminders, and reporting before adding heavier automation.',
        href: CANONICAL_ROUTES.crmAutomationSupport,
        ctaLabel: 'Explore CRM automation',
      },
      {
        title: 'Software development subscription',
        description: 'Monthly capacity to implement workflow improvements and integrations safely.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
      {
        title: 'Free website visibility checker',
        description: 'Review public-facing clarity and enquiry readiness before scaling content or AI tools.',
        href: CANONICAL_ROUTES.freeAudit,
        ctaLabel: 'Run free visibility check',
      },
    ],
    faq: [
      {
        question: 'Should UK SMEs start with AI tools or operations cleanup?',
        answer:
          'Operations first. Clean forms, CRM records, analytics, and ownership make AI safer and more useful. Tool adoption without that foundation often creates noise.',
      },
      {
        question: 'What automation should come before advanced AI?',
        answer:
          'Start with enquiry capture, owner assignment, reminders, email templates, and reporting. These reduce lost leads and give AI better data to work with later.',
      },
      {
        question: 'How does Primewayz UK help with AI and automation?',
        answer:
          'We help teams prioritise practical workflows, connect websites and CRM systems, and deliver improvements through monthly capacity rather than one-off experiments.',
      },
    ],
    isIndexable: true,
    order: 2,
  },
  {
    slug: 'technical-seo',
    name: 'Technical SEO',
    shortName: 'Technical SEO',
    eyebrow: 'Visibility foundations',
    title: 'Technical SEO Insights',
    description:
      'Website crawlability, performance, tracking, and SEO foundations that matter before spending more on campaigns or content volume.',
    longDescription:
      'These articles cover the technical checks UK small businesses should make first: structure, metadata, mobile usability, analytics, and conversion tracking — so content and paid traffic have a sound base.',
    seoTitle: 'Technical SEO Insights for UK Small Businesses | Primewayz UK',
    seoDescription:
      'Technical SEO guidance for UK SMEs covering crawlability, page structure, analytics, and monthly website improvements before heavier campaign spend.',
    canonicalPath: categoryPath('technical-seo'),
    featuredArticleSlug: 'technical-seo-basics-uk-small-business',
    essentialGuideSlugs: ['technical-seo-basics-uk-small-business'],
    relatedCategorySlugs: [
      'web-development',
      'software-support',
      'ai-automation',
      'digital-transformation',
    ],
    serviceLinks: [
      {
        title: 'Website maintenance subscription',
        description:
          'Monthly upkeep covering forms, speed, SEO foundations, and conversion path checks.',
        href: CANONICAL_ROUTES.maintenance,
        ctaLabel: 'Explore maintenance support',
      },
      {
        title: 'Website & visibility support',
        description: 'Improve trust signals, enquiry flow, and discoverability on your live site.',
        href: CANONICAL_ROUTES.websiteVisibilitySupport,
        ctaLabel: 'Explore visibility support',
      },
      {
        title: 'Free website visibility checker',
        description: 'Get a practical score on clarity, trust, and enquiry readiness.',
        href: CANONICAL_ROUTES.freeAudit,
        ctaLabel: 'Run free visibility check',
      },
    ],
    faq: [
      {
        question: 'What technical SEO basics should UK SMEs fix first?',
        answer:
          'Indexability, clear titles and headings, mobile usability, page speed, redirects, and conversion tracking. These usually matter more than producing more content.',
      },
      {
        question: 'Is technical SEO a one-time project?',
        answer:
          'No. Sites change, campaigns shift, and small monthly improvements compound. Treat technical SEO as part of ongoing website support.',
      },
      {
        question: 'How does Primewayz UK approach technical SEO?',
        answer:
          'As part of monthly digital delivery — fixing foundations, tracking, and conversion paths alongside content and maintenance work.',
      },
    ],
    isIndexable: true,
    order: 3,
  },
  {
    slug: 'mobile-app-development',
    name: 'Mobile App Development',
    shortName: 'Mobile Apps',
    eyebrow: 'Product & apps',
    title: 'Mobile App Development Insights',
    description:
      'Guidance on mobile product decisions, existing app rescue, and delivery approaches for UK teams building or stabilising apps.',
    longDescription:
      'This category will cover discovery, delivery, and rescue topics for mobile products. Pages publish when there is real article coverage — we do not ship empty category landings.',
    seoTitle: 'Mobile App Development Insights | Primewayz UK',
    seoDescription:
      'Primewayz UK insights on mobile app development, product discovery, and stabilising existing apps for UK businesses.',
    canonicalPath: categoryPath('mobile-app-development'),
    relatedCategorySlugs: [
      'product-development',
      'software-development',
      'legacy-modernisation',
      'software-support',
    ],
    serviceLinks: [
      {
        title: 'Software development subscription',
        description: 'Monthly capacity for product features, fixes, and mobile-related delivery work.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
      {
        title: 'Book a discovery call',
        description: 'Discuss app scope, rescue needs, or product discovery with the UK team.',
        href: CANONICAL_ROUTES.bookCall,
        ctaLabel: 'Book a UK discovery call',
      },
    ],
    faq: [
      {
        question: 'Does Primewayz UK build mobile apps?',
        answer:
          'We support product delivery that can include mobile work as part of broader software capacity. Suitability depends on roadmap, existing stack, and rescue versus new-build needs.',
      },
      {
        question: 'When should we rescue an existing app instead of rebuilding?',
        answer:
          'When the product still has commercial value but stability, release process, or technical debt is blocking progress. A short assessment usually clarifies rebuild versus incremental rescue.',
      },
    ],
    isIndexable: true,
    order: 4,
  },
  {
    slug: 'digital-transformation',
    name: 'Digital Transformation',
    shortName: 'Digital Transformation',
    eyebrow: 'Adoption & operations',
    title: 'Digital Transformation Insights',
    description:
      'Practical digital adoption roadmaps for UK SMEs — websites, CRM, automation, and reporting without big-bang programmes.',
    longDescription:
      'These articles help small teams turn digital pressure into sequenced improvements: enquiry capture, website upkeep, CRM usage, automation, and reporting delivered in manageable monthly steps.',
    seoTitle: 'Digital Transformation Insights for UK SMEs | Primewayz UK',
    seoDescription:
      'Practical digital adoption and transformation guidance for UK SMEs covering websites, CRM, automation, and monthly delivery roadmaps.',
    canonicalPath: categoryPath('digital-transformation'),
    featuredArticleSlug: 'uk-sme-digital-adoption-roadmap-2026',
    essentialGuideSlugs: [
      'uk-sme-digital-adoption-roadmap-2026',
      'website-seo-crm-automation-uk',
    ],
    relatedCategorySlugs: [
      'ai-automation',
      'business-strategy',
      'software-support',
      'software-development',
    ],
    serviceLinks: [
      {
        title: 'Services overview',
        description: 'See how website, CRM, software, and maintenance support fit together.',
        href: CANONICAL_ROUTES.services,
        ctaLabel: 'Explore services',
      },
      {
        title: 'CRM & automation support',
        description: 'Improve lead capture, follow-up, and reporting as part of digital adoption.',
        href: CANONICAL_ROUTES.crmAutomationSupport,
        ctaLabel: 'Explore CRM support',
      },
      {
        title: 'Software development subscription',
        description: 'Monthly capacity to implement the roadmap once priorities are clear.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
    ],
    faq: [
      {
        question: 'Do UK SMEs need a large transformation programme?',
        answer:
          'Usually not. Most benefit from a practical roadmap that fixes enquiry flow, website basics, CRM usage, and reporting in a monthly rhythm.',
      },
      {
        question: 'Where should digital adoption start?',
        answer:
          'With the operating problem — lost enquiries, weak tracking, unclear CRM stages — not with buying another platform.',
      },
      {
        question: 'How does Primewayz UK support digital transformation?',
        answer:
          'Through Foundation Sprint planning and monthly delivery across websites, CRM, automation, SEO foundations, and maintenance.',
      },
    ],
    isIndexable: true,
    order: 5,
  },
  {
    slug: 'web-development',
    name: 'Web Development',
    shortName: 'Web Development',
    eyebrow: 'Websites & products',
    title: 'Web Development Insights',
    description:
      'Practical website and web product guidance for UK businesses improving structure, performance, and conversion paths.',
    longDescription:
      'These articles cover website foundations that support growth: structure, maintenance, SEO readiness, and the connection between web presence and enquiry systems.',
    seoTitle: 'Web Development Insights for UK Businesses | Primewayz UK',
    seoDescription:
      'Web development and website improvement insights for UK SMEs — structure, performance, maintenance, and conversion-focused delivery.',
    canonicalPath: categoryPath('web-development'),
    relatedCategorySlugs: [
      'technical-seo',
      'software-support',
      'software-development',
      'digital-transformation',
    ],
    serviceLinks: [
      {
        title: 'Website maintenance subscription',
        description: 'Keep forms, speed, content, and conversion paths healthy month to month.',
        href: CANONICAL_ROUTES.maintenance,
        ctaLabel: 'Explore maintenance support',
      },
      {
        title: 'Website & visibility support',
        description: 'Improve discoverability, trust signals, and enquiry readiness.',
        href: CANONICAL_ROUTES.websiteVisibilitySupport,
        ctaLabel: 'Explore visibility support',
      },
      {
        title: 'Software development subscription',
        description: 'Monthly capacity for larger web product and integration work.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
    ],
    faq: [
      {
        question: 'What website work matters most for UK SMEs?',
        answer:
          'Reliable forms, clear service pages, mobile usability, tracking, and a maintenance rhythm that prevents small issues from becoming lost leads.',
      },
      {
        question: 'When is maintenance enough versus active development?',
        answer:
          'Maintenance suits stability and small fixes. Move to active delivery when campaigns, redesigns, integrations, or CRM changes need dedicated capacity.',
      },
    ],
    isIndexable: true,
    order: 6,
  },
  {
    slug: 'legacy-modernisation',
    name: 'Legacy Modernisation',
    shortName: 'Legacy Modernisation',
    eyebrow: 'Rescue & modernisation',
    title: 'Legacy Modernisation Insights',
    description:
      'Guidance on application rescue, technical debt, and incremental modernisation for systems that still carry commercial value.',
    longDescription:
      'This category will cover stabilisation-before-rebuild topics for legacy applications. Pages publish when article coverage exists — empty landings are not indexed.',
    seoTitle: 'Legacy Modernisation Insights | Primewayz UK',
    seoDescription:
      'Insights on legacy application modernisation, application rescue, and incremental migration for UK businesses.',
    canonicalPath: categoryPath('legacy-modernisation'),
    relatedCategorySlugs: [
      'software-development',
      'software-support',
      'product-development',
      'business-strategy',
    ],
    serviceLinks: [
      {
        title: 'Software development subscription',
        description: 'Incremental capacity for stabilisation, migration, and ongoing product work.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
      {
        title: 'Application rescue insight',
        description: 'Read how rescue and stabilisation fit before ongoing development.',
        href: '/insights/application-rescue-and-stabilisation-before-ongoing-development',
        ctaLabel: 'Read application rescue guide',
      },
      {
        title: 'Book a discovery call',
        description: 'Discuss legacy risk, rescue scope, and a practical modernisation path.',
        href: CANONICAL_ROUTES.bookCall,
        ctaLabel: 'Book a UK discovery call',
      },
    ],
    faq: [
      {
        question: 'Should we rebuild a legacy system immediately?',
        answer:
          'Not always. If the system still delivers commercial value, stabilise release risk and technical debt first, then modernise in increments.',
      },
      {
        question: 'How does Primewayz UK approach legacy modernisation?',
        answer:
          'With a rescue-first mindset: understand risk, protect operations, then use monthly capacity for incremental improvement rather than a risky big-bang rewrite.',
      },
    ],
    isIndexable: true,
    order: 7,
  },
  {
    slug: 'software-support',
    name: 'Software Support',
    shortName: 'Software Support',
    eyebrow: 'Support & stability',
    title: 'Software Support Insights',
    description:
      'Monthly digital support, maintenance mode, and stability practices that keep UK SME websites and systems reliable.',
    longDescription:
      'These articles explain why ongoing support matters after launch — forms, access, backups, monitoring, small fixes, and a predictable monthly rhythm instead of stop-start freelancers.',
    seoTitle: 'Software Support Insights for UK SMEs | Primewayz UK',
    seoDescription:
      'Monthly software and website support guidance for UK SMEs — maintenance, stability, cyber-resilient upkeep, and continuous digital delivery.',
    canonicalPath: categoryPath('software-support'),
    featuredArticleSlug: 'monthly-digital-support-uk-smes',
    essentialGuideSlugs: [
      'monthly-digital-support-uk-smes',
      'maintenance-mode-for-uk-business-websites',
      'cyber-resilient-website-maintenance-for-uk-smes',
    ],
    relatedCategorySlugs: [
      'software-development',
      'web-development',
      'technical-seo',
      'legacy-modernisation',
    ],
    serviceLinks: [
      {
        title: 'Website maintenance subscription',
        description: 'Monthly upkeep for forms, backups, access, speed, and conversion checks.',
        href: CANONICAL_ROUTES.maintenance,
        ctaLabel: 'Explore maintenance support',
      },
      {
        title: 'Software development subscription',
        description: 'Move from maintenance into active delivery when the roadmap needs capacity.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
      {
        title: 'Book a discovery call',
        description: 'Review whether Maintenance Mode or monthly delivery fits your current stage.',
        href: CANONICAL_ROUTES.bookCall,
        ctaLabel: 'Book a UK discovery call',
      },
    ],
    faq: [
      {
        question: 'Why do UK SMEs need monthly digital support?',
        answer:
          'Because websites, SEO, CRM, and automation do not stay finished. Monthly support keeps priorities moving without repeated vendor search.',
      },
      {
        question: 'What is Maintenance Mode?',
        answer:
          'A lighter continuity plan for stability months — small fixes, content updates, form checks, and monitoring — without heavy active development.',
      },
      {
        question: 'What does cyber-resilient website maintenance include?',
        answer:
          'Routine access reviews, backup checks, form testing, uptime monitoring, dependency hygiene, and reviewing third-party scripts.',
      },
    ],
    isIndexable: true,
    order: 8,
  },
  {
    slug: 'product-development',
    name: 'Product Development',
    shortName: 'Product Development',
    eyebrow: 'Discovery & delivery',
    title: 'Product Development Insights',
    description:
      'Foundation planning, prioritisation, and delivery practices that help UK teams ship product work with clearer ownership.',
    longDescription:
      'These articles focus on starting well — clarifying goals, risks, and backlog before monthly delivery — so product capacity is spent on the right work.',
    seoTitle: 'Product Development Insights | Primewayz UK',
    seoDescription:
      'Product development guidance for UK SMEs and SaaS teams — Foundation Sprints, prioritisation, and practical monthly delivery.',
    canonicalPath: categoryPath('product-development'),
    featuredArticleSlug: 'foundation-sprint-before-monthly-delivery',
    essentialGuideSlugs: ['foundation-sprint-before-monthly-delivery'],
    relatedCategorySlugs: [
      'software-development',
      'business-strategy',
      'mobile-app-development',
      'digital-transformation',
    ],
    serviceLinks: [
      {
        title: 'Software development subscription',
        description: 'Monthly product capacity after foundation priorities are clear.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
      {
        title: 'How monthly capacity works',
        description: 'Understand prioritisation and capacity before you commit.',
        href: '/insights/how-monthly-software-development-capacity-works',
        ctaLabel: 'Read capacity guide',
      },
      {
        title: 'Book a discovery call',
        description: 'Discuss Foundation Sprint scope and the first delivery backlog.',
        href: CANONICAL_ROUTES.bookCall,
        ctaLabel: 'Book a UK discovery call',
      },
    ],
    faq: [
      {
        question: 'What is a Foundation Sprint?',
        answer:
          'A short planning and setup phase that clarifies goals, current system condition, risks, and the first delivery plan before monthly capacity begins.',
      },
      {
        question: 'Why start with discovery before monthly delivery?',
        answer:
          'Without shared priorities, capacity gets spent on assumptions. A short foundation phase reduces confusion and wasted delivery time.',
      },
    ],
    isIndexable: true,
    order: 9,
  },
  {
    slug: 'business-strategy',
    name: 'Business Strategy',
    shortName: 'Business Strategy',
    eyebrow: 'Decisions & commercial fit',
    title: 'Business Strategy Insights',
    description:
      'Decision-stage guidance on delivery models, digital investment, and commercial fit for UK SME and SaaS leaders.',
    longDescription:
      'These articles help founders and operators choose how to buy and run digital work — comparing models, sequencing investment, and connecting insight to service paths.',
    seoTitle: 'Business Strategy Insights for UK SMEs | Primewayz UK',
    seoDescription:
      'Business strategy insights for UK SMEs on delivery model choice, digital investment sequencing, and practical commercial decisions.',
    canonicalPath: categoryPath('business-strategy'),
    relatedCategorySlugs: [
      'software-development',
      'product-development',
      'digital-transformation',
      'ai-automation',
    ],
    serviceLinks: [
      {
        title: 'Pricing overview',
        description: 'Review how Primewayz UK packages monthly digital support.',
        href: CANONICAL_ROUTES.pricing,
        ctaLabel: 'View pricing',
      },
      {
        title: 'Software development subscription',
        description: 'See the commercial path for ongoing product and system delivery.',
        href: CANONICAL_ROUTES.softwareDevelopmentSubscription,
        ctaLabel: 'Explore software delivery',
      },
      {
        title: 'Book a discovery call',
        description: 'Talk through commercial fit before committing to a delivery model.',
        href: CANONICAL_ROUTES.bookCall,
        ctaLabel: 'Book a UK discovery call',
      },
    ],
    faq: [
      {
        question: 'How should UK SMEs choose a digital delivery model?',
        answer:
          'Match the model to uncertainty. Fixed price suits clear scope; subscription suits ongoing change; time and material suits exploratory work with active oversight.',
      },
      {
        question: 'What commercial questions should we ask a delivery partner?',
        answer:
          'Ask about capacity, prioritisation, ownership of outcomes, what happens in quieter months, and how rescue or maintenance differs from active product work.',
      },
    ],
    isIndexable: true,
    order: 10,
  },
];

/** Maps legacy free-text BlogPost.category labels to stable slugs. */
export const LEGACY_CATEGORY_LABEL_TO_SLUG: Record<string, string> = {
  'Digital Visibility': 'ai-automation',
  'Delivery Model': 'software-development',
  'Digital Adoption': 'digital-transformation',
  'AI Operations': 'ai-automation',
  Maintenance: 'software-support',
  CRM: 'digital-transformation',
  'UK SMEs': 'software-support',
  'Digital Operations': 'digital-transformation',
  SEO: 'technical-seo',
};

const categoryBySlug = new Map(BLOG_CATEGORIES.map((category) => [category.slug, category]));

export const isValidBlogCategorySlug = (slug?: string | null): slug is string =>
  Boolean(slug && categoryBySlug.has(slug));

export const getBlogCategories = (): BlogCategory[] =>
  [...BLOG_CATEGORIES].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

export const getBlogCategoryBySlug = (slug?: string | null): BlogCategory | undefined => {
  if (!slug) return undefined;
  return categoryBySlug.get(slug);
};

export const getCategoryCanonicalPath = (slug: string): string =>
  getBlogCategoryBySlug(slug)?.canonicalPath ?? categoryPath(slug);

export const getCategoryCanonicalUrl = (slug: string, siteUrl: string): string => {
  const path = getCategoryCanonicalPath(slug);
  return `${siteUrl.replace(/\/$/, '')}${path}`;
};

const uniqueSlugs = (slugs: Array<string | undefined | null>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const slug of slugs) {
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    result.push(slug);
  }
  return result;
};

const resolveLegacyLabelSlug = (label?: string | null): string | undefined => {
  if (!label) return undefined;
  const direct = LEGACY_CATEGORY_LABEL_TO_SLUG[label];
  if (direct) return direct;
  const normalised = label.trim().toLowerCase();
  const match = Object.entries(LEGACY_CATEGORY_LABEL_TO_SLUG).find(
    ([key]) => key.toLowerCase() === normalised,
  );
  return match?.[1];
};

/**
 * Normalise article category fields for CMS, static, and Autopilot articles.
 * Fallback sequence: primaryCategory → categorySlug → legacy category label → undefined.
 */
export const normaliseBlogPostCategories = (
  post: Pick<BlogPost, 'primaryCategory' | 'secondaryCategories' | 'categorySlug' | 'category'>,
): NormalisedBlogPostCategories => {
  const primaryCandidate =
    (isValidBlogCategorySlug(post.primaryCategory) && post.primaryCategory) ||
    (isValidBlogCategorySlug(post.categorySlug) && post.categorySlug) ||
    resolveLegacyLabelSlug(post.category) ||
    (isValidBlogCategorySlug(post.category) ? post.category : undefined);

  const secondary = uniqueSlugs(
    (post.secondaryCategories || [])
      .map((slug) => (isValidBlogCategorySlug(slug) ? slug : resolveLegacyLabelSlug(slug)))
      .filter((slug): slug is string => Boolean(slug) && slug !== primaryCandidate),
  );

  return {
    primaryCategory: primaryCandidate,
    secondaryCategories: secondary,
  };
};

export const getArticlePrimaryCategory = (post: BlogPost): string | undefined =>
  normaliseBlogPostCategories(post).primaryCategory;

export const getArticleSecondaryCategories = (post: BlogPost): string[] =>
  normaliseBlogPostCategories(post).secondaryCategories;

export const getArticleCategoryDisplayName = (post: BlogPost): string => {
  const primary = getArticlePrimaryCategory(post);
  if (primary) {
    return getBlogCategoryBySlug(primary)?.name || post.category;
  }
  return post.category;
};

export const getArticlesByCategory = (
  categorySlug: string,
  posts: BlogPost[],
): BlogPost[] => {
  if (!isValidBlogCategorySlug(categorySlug)) return [];

  const primaryMatches: BlogPost[] = [];
  const secondaryMatches: BlogPost[] = [];
  const seen = new Set<string>();

  const sorted = [...posts].sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));

  for (const post of sorted) {
    const { primaryCategory, secondaryCategories } = normaliseBlogPostCategories(post);
    if (seen.has(post.id)) continue;

    if (primaryCategory === categorySlug) {
      primaryMatches.push(post);
      seen.add(post.id);
      continue;
    }

    if (secondaryCategories.includes(categorySlug)) {
      secondaryMatches.push(post);
      seen.add(post.id);
    }
  }

  return [...primaryMatches, ...secondaryMatches];
};

export const getCategoryArticleCount = (categorySlug: string, posts: BlogPost[]): number =>
  getArticlesByCategory(categorySlug, posts).length;

export const getFeaturedArticleForCategory = (
  categorySlug: string,
  posts: BlogPost[],
): BlogPost | undefined => {
  const category = getBlogCategoryBySlug(categorySlug);
  if (!category?.featuredArticleSlug) return undefined;

  const featured = posts.find(
    (post) =>
      post.slug === category.featuredArticleSlug || post.id === category.featuredArticleSlug,
  );
  if (!featured) return undefined;

  const inCategory = getArticlesByCategory(categorySlug, posts).some(
    (post) => post.id === featured.id,
  );
  return inCategory ? featured : undefined;
};

export const getEssentialGuidesForCategory = (
  categorySlug: string,
  posts: BlogPost[],
  options?: { excludeIds?: Set<string> },
): BlogPost[] => {
  const category = getBlogCategoryBySlug(categorySlug);
  if (!category?.essentialGuideSlugs?.length) return [];

  const excludeIds = options?.excludeIds ?? new Set<string>();
  const categoryArticles = new Map(
    getArticlesByCategory(categorySlug, posts).map((post) => [post.id, post]),
  );

  const guides: BlogPost[] = [];
  const seen = new Set<string>();

  for (const slug of category.essentialGuideSlugs) {
    const post =
      posts.find((candidate) => candidate.slug === slug || candidate.id === slug) ||
      categoryArticles.get(slug);
    if (!post || excludeIds.has(post.id) || seen.has(post.id)) continue;
    if (!categoryArticles.has(post.id)) continue;
    guides.push(post);
    seen.add(post.id);
  }

  return guides;
};

export const getRelatedCategories = (
  categorySlug: string,
  posts?: BlogPost[],
): BlogCategory[] => {
  const category = getBlogCategoryBySlug(categorySlug);
  if (!category?.relatedCategorySlugs?.length) return [];

  return category.relatedCategorySlugs
    .map((slug) => getBlogCategoryBySlug(slug))
    .filter((related): related is BlogCategory => {
      if (!related) return false;
      if (!posts) return true;
      return getCategoryArticleCount(related.slug, posts) > 0;
    });
};

export const getIndexableCategoriesWithArticles = (posts: BlogPost[]): BlogCategory[] =>
  getBlogCategories().filter((category) => {
    if (category.isIndexable === false) return false;
    return getCategoryArticleCount(category.slug, posts) > 0;
  });

export const getNavigableCategories = (posts: BlogPost[]): BlogCategory[] =>
  getIndexableCategoriesWithArticles(posts);

export const isPublishableCategoryPage = (slug: string, posts: BlogPost[]): boolean => {
  const category = getBlogCategoryBySlug(slug);
  if (!category || category.isIndexable === false) return false;
  return getCategoryArticleCount(slug, posts) > 0;
};

export const getCategoryPageArticles = (
  categorySlug: string,
  posts: BlogPost[],
): {
  featured: BlogPost | undefined;
  articles: BlogPost[];
  essentialGuides: BlogPost[];
} => {
  const featured = getFeaturedArticleForCategory(categorySlug, posts);
  const excludeFromGrid = new Set(featured ? [featured.id] : []);
  const essentialGuides = getEssentialGuidesForCategory(categorySlug, posts, {
    excludeIds: excludeFromGrid,
  });
  const guideIds = new Set(essentialGuides.map((post) => post.id));
  const articles = getArticlesByCategory(categorySlug, posts).filter(
    (post) => !excludeFromGrid.has(post.id) && !guideIds.has(post.id),
  );

  return { featured, articles, essentialGuides };
};

export const buildCategoryBreadcrumbs = (category: BlogCategory): BreadcrumbItem[] => [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
  { label: category.name },
];

export const buildArticleBreadcrumbs = (
  post: BlogPost,
  category?: BlogCategory,
): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
  ];

  if (category) {
    items.push({ label: category.name, href: category.canonicalPath });
  }

  items.push({ label: post.title });
  return items;
};

export type InvalidArticleCategoryReference = {
  postId: string;
  issues: string[];
};

export const getInvalidArticleCategoryReferences = (
  posts: BlogPost[],
): InvalidArticleCategoryReference[] => {
  const results: InvalidArticleCategoryReference[] = [];

  for (const post of posts) {
    const issues: string[] = [];

    if (post.primaryCategory && !isValidBlogCategorySlug(post.primaryCategory)) {
      issues.push(`Unknown primaryCategory: ${post.primaryCategory}`);
    }

    const seenSecondary = new Set<string>();
    for (const slug of post.secondaryCategories || []) {
      if (!isValidBlogCategorySlug(slug)) {
        issues.push(`Unknown secondaryCategory: ${slug}`);
        continue;
      }
      if (slug === post.primaryCategory) {
        issues.push(`primaryCategory repeated in secondaryCategories: ${slug}`);
      }
      if (seenSecondary.has(slug)) {
        issues.push(`Duplicate secondaryCategory: ${slug}`);
      }
      seenSecondary.add(slug);
    }

    if (issues.length) {
      results.push({ postId: post.id, issues });
    }
  }

  return results;
};

export const warnInvalidArticleCategories = (posts: BlogPost[]): void => {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return;
  }

  const invalid = getInvalidArticleCategoryReferences(posts);
  for (const entry of invalid) {
    console.warn(
      `[blog-categories] Invalid category references on ${entry.postId}: ${entry.issues.join('; ')}`,
    );
  }
};
