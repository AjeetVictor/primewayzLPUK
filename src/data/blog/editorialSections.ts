import type { BlogPost } from './types';
import {
  getArticlePrimaryCategory,
  getArticleSecondaryCategories,
  getBlogCategoryBySlug,
} from './categories';

export type EditorialSection = {
  id: string;
  title: string;
  /** Stable category slugs that belong in this editorial cluster. */
  categorySlugs: string[];
  /** @deprecated Prefer categorySlugs — kept for transitional matching. */
  categories?: string[];
  tagHints?: string[];
  /** Primary public category route for “View all”. */
  viewAllCategorySlug?: string;
};

export const EDITORIAL_SECTIONS: EditorialSection[] = [
  {
    id: 'software-delivery',
    title: 'Software Delivery',
    categorySlugs: ['software-development', 'software-support', 'product-development'],
    categories: ['Delivery Model', 'UK SMEs'],
    tagHints: ['Monthly delivery', 'Foundation Sprint', 'Digital delivery', 'Subscription support'],
    viewAllCategorySlug: 'software-development',
  },
  {
    id: 'website-technical-seo',
    title: 'Website & Technical SEO',
    categorySlugs: ['technical-seo', 'web-development', 'software-support'],
    categories: ['SEO', 'Maintenance', 'Digital Visibility'],
    tagHints: ['Technical SEO', 'Website support', 'SEO', 'Upkeep', 'Content Marketing'],
    viewAllCategorySlug: 'technical-seo',
  },
  {
    id: 'crm-automation',
    title: 'CRM & Automation',
    categorySlugs: ['digital-transformation', 'ai-automation'],
    categories: ['CRM'],
    tagHints: ['Automation', 'Lead management', 'CRM', 'Forms'],
    viewAllCategorySlug: 'digital-transformation',
  },
  {
    id: 'ai-digital-operations',
    title: 'AI & Digital Operations',
    categorySlugs: ['ai-automation', 'digital-transformation'],
    categories: ['AI Operations', 'Digital Adoption', 'Digital Operations'],
    tagHints: ['AI readiness', 'Digital adoption', 'Automation', 'Digital operations'],
    viewAllCategorySlug: 'ai-automation',
  },
];

const matchesSection = (post: BlogPost, section: EditorialSection) => {
  const primary = getArticlePrimaryCategory(post);
  const secondary = getArticleSecondaryCategories(post);

  if (primary && section.categorySlugs.includes(primary)) {
    return true;
  }

  if (secondary.some((slug) => section.categorySlugs.includes(slug))) {
    return true;
  }

  if (section.categories?.includes(post.category)) {
    return true;
  }

  if (!section.tagHints?.length) {
    return false;
  }

  const tagSet = new Set(post.tags.map((tag) => tag.toLowerCase()));
  return section.tagHints.some((hint) => tagSet.has(hint.toLowerCase()));
};

export const getPostsForEditorialSection = (
  posts: BlogPost[],
  section: EditorialSection,
  excludeIds: Set<string> = new Set(),
  limit = 4,
) =>
  posts
    .filter((post) => !excludeIds.has(post.id) && matchesSection(post, section))
    .slice(0, limit);

export const getEditorialSectionViewAllHref = (section: EditorialSection): string => {
  if (section.viewAllCategorySlug) {
    const category = getBlogCategoryBySlug(section.viewAllCategorySlug);
    if (category) return category.canonicalPath;
  }
  return `/blog#section-${section.id}`;
};

export const getAllEditorialTags = (posts: BlogPost[]) =>
  Array.from(new Set(posts.flatMap((post) => post.tags))).sort((a, b) =>
    a.localeCompare(b),
  );
