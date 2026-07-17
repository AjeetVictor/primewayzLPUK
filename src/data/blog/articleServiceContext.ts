import type { BlogPost } from './types';

type ArticleServiceContext = {
  eyebrow: string;
  heading: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
};

export const getArticleServiceContext = (post: BlogPost): ArticleServiceContext => {
  const searchableText = `${post.title} ${post.description} ${post.excerpt} ${post.category} ${post.tags.join(
    ' ',
  )}`.toLowerCase();

  if (
    searchableText.includes('crm') ||
    searchableText.includes('lead') ||
    searchableText.includes('automation') ||
    searchableText.includes('enquiry')
  ) {
    return {
      eyebrow: 'CRM & automation support',
      heading: 'Turn this insight into cleaner enquiry flow',
      description:
        'If CRM routing, follow-up, or automation is the bottleneck behind this article, Primewayz UK can help you stabilise the workflow first.',
      primaryHref: '/crm-automation-support',
      primaryLabel: 'Explore CRM integration support',
      secondaryHref: '/contact-us#book-call',
      secondaryLabel: 'Book a UK discovery call',
    };
  }

  if (
    searchableText.includes('seo') ||
    searchableText.includes('website') ||
    searchableText.includes('maintenance') ||
    searchableText.includes('visibility')
  ) {
    return {
      eyebrow: 'Website & technical SEO support',
      heading: 'Need help turning this into monthly website progress?',
      description:
        'Primewayz UK supports UK SMEs with website maintenance, technical SEO foundations, landing pages, and conversion improvements.',
      primaryHref: '/maintenance',
      primaryLabel: 'Explore website maintenance support',
      secondaryHref: '/contact-us#book-call',
      secondaryLabel: 'Book a UK discovery call',
    };
  }

  return {
    eyebrow: 'Software delivery support',
    heading: 'Connect this insight to steady monthly delivery',
    description:
      'Primewayz UK helps UK SMEs move from one-off digital projects into practical monthly delivery across websites, systems, and automation.',
    primaryHref: '/software-development-subscription-uk',
    primaryLabel: 'Explore software delivery subscription',
    secondaryHref: '/contact-us#book-call',
    secondaryLabel: 'Book a UK discovery call',
  };
};
