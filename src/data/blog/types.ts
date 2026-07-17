export interface BlogCategoryFaq {
  question: string;
  answer: string;
}

export interface BlogCategoryServiceLink {
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
}

export interface BlogCategory {
  slug: string;
  name: string;
  shortName?: string;
  eyebrow?: string;
  title: string;
  description: string;
  longDescription?: string;
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  heroImage?: string;
  heroImageAlt?: string;
  featuredArticleSlug?: string;
  essentialGuideSlugs?: string[];
  relatedCategorySlugs?: string[];
  faq?: BlogCategoryFaq[];
  serviceLinks?: BlogCategoryServiceLink[];
  isIndexable?: boolean;
  order?: number;
}

/**
 * Article category fields for Autopilot / CMS compatibility:
 * - `primaryCategory`: stable category slug (preferred)
 * - `secondaryCategories`: optional additional category slugs
 * - `category`: legacy display label (kept for backwards compatibility)
 * - `categorySlug`: optional CMS alias normalised via helpers
 */
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  /** Legacy display label — prefer primaryCategory slug for routing/grouping. */
  category: string;
  /** Stable primary category slug from the central category registry. */
  primaryCategory?: string;
  /** Optional secondary category slugs (must not repeat primary). */
  secondaryCategories?: string[];
  /** Optional CMS alias — normalised alongside primaryCategory. */
  categorySlug?: string;
  tags: string[];
  date: string;
  updatedDate?: string;
  author: string;
  readTime: string;
  image?: string;
  thumbnailImage?: string;
  imageAlt?: string;
  content: string;
  featured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  faqs?: {
    question: string;
    answer: string;
  }[];
  linkedInEmbedHtml?: string;
  linkedInPostUrl?: string;
}

export type NormalisedBlogPostCategories = {
  primaryCategory: string | undefined;
  secondaryCategories: string[];
};

export type BreadcrumbItem = {
  label: string;
  href?: string;
};
