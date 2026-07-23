/**
 * Resolve a safe free-review service-area preselection from blog category slugs.
 * Uses only the central category registry + an explicit allowlisted map.
 */

import {
  FREE_REVIEW_SERVICE_AREAS,
  type FreeReviewServiceArea,
} from '../../constants/conversionCta';
import {
  getBlogCategoryBySlug,
  normaliseBlogPostCategories,
} from '../../data/blog/categories';
import type { BlogPost } from '../../data/blog/types';

/**
 * Explicit category-slug → service-area mapping.
 * Only service-specific registry slugs are included; strategy/mixed categories stay unmapped.
 * There is no remote-team category in the registry — do not invent one.
 */
export const BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP = {
  'technical-seo': 'Website Visibility & Conversion',
  'web-development': 'Website Visibility & Conversion',
  'ai-automation': 'CRM & Workflow Automation',
  'software-development': 'Software & Product Engineering',
  'product-development': 'Software & Product Engineering',
  'mobile-app-development': 'Software & Product Engineering',
  'legacy-modernisation': 'Software & Product Engineering',
  'software-support': 'Managed Application & Website Support',
} as const satisfies Record<string, FreeReviewServiceArea>;

export type BlogCategoryReviewServiceSlug = keyof typeof BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP;

const SERVICE_AREA_SET = new Set<string>(FREE_REVIEW_SERVICE_AREAS);

function isApprovedServiceArea(value: string): value is FreeReviewServiceArea {
  return SERVICE_AREA_SET.has(value);
}

function mappedServiceForSlug(slug: string): FreeReviewServiceArea | undefined {
  // Registry gate: inventing or stale slugs must not preselect a service.
  if (!getBlogCategoryBySlug(slug)) return undefined;
  if (!(slug in BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP)) return undefined;
  const mapped = BLOG_CATEGORY_REVIEW_SERVICE_AREA_MAP[slug as BlogCategoryReviewServiceSlug];
  return isApprovedServiceArea(mapped) ? mapped : undefined;
}

/**
 * Resolve an allowlisted review service area from a blog article's normalised categories.
 * Returns undefined when no category is mapped or when mapped categories conflict.
 */
export function resolveBlogArticleReviewServiceArea(
  post: Pick<BlogPost, 'primaryCategory' | 'secondaryCategories' | 'categorySlug' | 'category'>,
): FreeReviewServiceArea | undefined {
  const { primaryCategory, secondaryCategories } = normaliseBlogPostCategories(post);
  const slugs = [
    primaryCategory,
    ...secondaryCategories,
  ].filter((slug): slug is string => Boolean(slug));

  const uniqueServices = new Set<FreeReviewServiceArea>();
  for (const slug of slugs) {
    const mapped = mappedServiceForSlug(slug);
    if (mapped) uniqueServices.add(mapped);
  }

  if (uniqueServices.size === 1) {
    return [...uniqueServices][0];
  }

  return undefined;
}
