import type { BlogPost } from './types';
import {
  getArticlePrimaryCategory,
  getBlogCategoryBySlug,
} from './categories';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';

type ArticleServiceContext = {
  eyebrow: string;
  heading: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

const byPrimaryCategory: Record<string, ArticleServiceContext> = {
  'software-development': {
    eyebrow: 'Software delivery support',
    heading: 'Connect this insight to steady monthly delivery',
    description:
      'Primewayz UK helps UK SMEs and SaaS teams run practical software delivery through subscription capacity and clear priorities.',
    primaryHref: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    primaryLabel: 'Explore software delivery subscription',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'software-support': {
    eyebrow: 'Software & website support',
    heading: 'Need reliable monthly support after launch?',
    description:
      'Primewayz UK provides maintenance, stability checks, and ongoing digital support so UK SMEs keep progress without stop-start vendors.',
    primaryHref: CANONICAL_ROUTES.maintenance,
    primaryLabel: 'Explore website maintenance support',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'ai-automation': {
    eyebrow: 'AI & automation support',
    heading: 'Turn this insight into cleaner operational workflows',
    description:
      'Primewayz UK helps UK SMEs prepare CRM, enquiry, and reporting foundations before adding AI or automation that creates more noise.',
    primaryHref: CANONICAL_ROUTES.crmAutomationSupport,
    primaryLabel: 'Explore CRM & automation support',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'technical-seo': {
    eyebrow: 'Website & technical SEO support',
    heading: 'Need help turning this into monthly website progress?',
    description:
      'Primewayz UK supports UK SMEs with website maintenance, technical SEO foundations, landing pages, and conversion improvements.',
    primaryHref: CANONICAL_ROUTES.maintenance,
    primaryLabel: 'Explore website maintenance support',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'web-development': {
    eyebrow: 'Website development support',
    heading: 'Improve the website foundations behind this insight',
    description:
      'Primewayz UK helps UK businesses improve website structure, conversion paths, and ongoing web delivery.',
    primaryHref: CANONICAL_ROUTES.websiteVisibilitySupport,
    primaryLabel: 'Explore website visibility support',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'digital-transformation': {
    eyebrow: 'Digital adoption support',
    heading: 'Turn this roadmap into practical monthly progress',
    description:
      'Primewayz UK helps UK SMEs sequence website, CRM, automation, and reporting improvements without a big-bang programme.',
    primaryHref: CANONICAL_ROUTES.services,
    primaryLabel: 'Explore Primewayz UK services',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'product-development': {
    eyebrow: 'Product delivery support',
    heading: 'Start with clarity before monthly product capacity',
    description:
      'Primewayz UK helps teams clarify foundation priorities, then deliver product work through practical monthly capacity.',
    primaryHref: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    primaryLabel: 'Explore software delivery subscription',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'business-strategy': {
    eyebrow: 'Delivery model decisions',
    heading: 'Choose a delivery model that fits your next stage',
    description:
      'Primewayz UK helps UK SME and SaaS leaders compare delivery options and move into practical monthly support when ready.',
    primaryHref: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    primaryLabel: 'Explore software delivery subscription',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'legacy-modernisation': {
    eyebrow: 'Application rescue support',
    heading: 'Stabilise before you modernise',
    description:
      'Primewayz UK helps teams rescue and stabilise valuable systems, then modernise incrementally with monthly capacity.',
    primaryHref: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    primaryLabel: 'Explore software delivery subscription',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
  'mobile-app-development': {
    eyebrow: 'Product & app delivery',
    heading: 'Discuss app delivery or rescue with the UK team',
    description:
      'Primewayz UK supports product delivery that can include mobile work as part of broader software capacity.',
    primaryHref: CANONICAL_ROUTES.softwareDevelopmentSubscription,
    primaryLabel: 'Explore software delivery subscription',
    secondaryHref: CANONICAL_ROUTES.bookCall,
    secondaryLabel: 'Book a UK discovery call',
  },
};

export const getArticleServiceContext = (post: BlogPost): ArticleServiceContext => {
  const primary = getArticlePrimaryCategory(post);
  if (primary && byPrimaryCategory[primary]) {
    return byPrimaryCategory[primary];
  }

  const category = primary ? getBlogCategoryBySlug(primary) : undefined;
  if (category?.serviceLinks?.[0]) {
    const primaryLink = category.serviceLinks[0];
    return {
      eyebrow: category.name,
      heading: `Connect this insight to ${primaryLink.title.toLowerCase()}`,
      description: primaryLink.description,
      primaryHref: primaryLink.href,
      primaryLabel: primaryLink.ctaLabel || primaryLink.title,
      secondaryHref: CANONICAL_ROUTES.bookCall,
      secondaryLabel: 'Book a UK discovery call',
    };
  }

  const searchableText = `${post.title} ${post.description} ${post.excerpt} ${post.category} ${post.tags.join(
    ' ',
  )}`.toLowerCase();

  if (
    searchableText.includes('crm') ||
    searchableText.includes('lead') ||
    searchableText.includes('automation') ||
    searchableText.includes('enquiry')
  ) {
    return byPrimaryCategory['ai-automation'];
  }

  if (
    searchableText.includes('seo') ||
    searchableText.includes('website') ||
    searchableText.includes('maintenance') ||
    searchableText.includes('visibility')
  ) {
    return byPrimaryCategory['technical-seo'];
  }

  return byPrimaryCategory['software-development'];
};
