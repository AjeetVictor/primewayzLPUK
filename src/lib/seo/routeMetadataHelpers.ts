import { getAllBlogPosts, getBlogPostById } from '../../data/blog/utils.ts';
import {
  getBlogCategoryBySlug,
  getCategoryPageArticles,
  isPublishableCategoryPage,
} from '../../data/blog/categories.ts';
import { getBlogBannerImage } from '../../data/blog/imageFallbacks.ts';
import {
  getPublishedSuccessStoryBySlug,
  SUCCESS_STORIES_BASE_PATH,
} from '../../data/successStories.ts';
import { STATIC_PAGE_SEO } from './staticPageSeo.ts';
import {
  BLOG_ARTICLE_NOT_FOUND_SEO,
  BLOG_CATEGORY_NOT_FOUND_SEO,
  BLOG_INDEX_SEO,
  ROUTE_METADATA_SITE_URL,
  SHARED_WEB_PRESENCE_AUDIT_REPORT_SEO,
  SUCCESS_STORY_NOT_FOUND_SEO,
} from './routeMetadataContent.ts';
import {
  buildRouteSocialMetadata,
  resolveRouteOgImage,
} from './socialMetadata.ts';

export { ROUTE_METADATA_SITE_URL };

export const INDEXED_STATIC_ROBOTS = 'index, follow, max-image-preview:large';
export const STATIC_NOINDEX_FOLLOW_ROBOTS = 'noindex, follow';
export const NOINDEX_NOFOLLOW_ROBOTS = 'noindex, nofollow';

export const STATIC_NOINDEX_FOLLOW_ROUTES = new Set([
  '/software-development-subscription-uk/request-capacity',
  '/thank-you/digital-systems-review',
]);

const ADMIN_METADATA_PATHS = new Set([
  '/admin',
  '/admin/chat',
  '/admin/mobile-chat',
  '/admin/forgot-password',
  '/admin/reset-password',
]);

const REDIRECT_ONLY_PATHS = new Set([
  '/about',
  '/contact',
  '/crm-integration-support-uk',
  '/remote-it-resource-augmentation',
  '/software-product-delivery',
  '/website-maintenance-subscription-uk',
]);

const ADMIN_METADATA = {
  title: 'Primewayz UK Administration',
  description: 'Secure administration area for Primewayz UK.',
} as const;

const NOT_FOUND_METADATA = {
  title: 'Page Not Found | Primewayz UK',
  description: 'The requested page could not be found on Primewayz UK.',
} as const;

export function normaliseRouteMetadataPathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';

  return pathname.replace(/\/+$/, '') || '/';
}

export function buildStaticRouteCanonicalUrl(
  pathname: string,
  siteUrl: string = ROUTE_METADATA_SITE_URL,
): string {
  const normalised = normaliseRouteMetadataPathname(pathname);

  return normalised === '/' ? `${siteUrl}/` : `${siteUrl}${normalised}`;
}

export function resolveStaticRouteRobots(pathname: string): string {
  const normalised = normaliseRouteMetadataPathname(pathname);

  if (STATIC_NOINDEX_FOLLOW_ROUTES.has(normalised)) {
    return STATIC_NOINDEX_FOLLOW_ROBOTS;
  }

  return INDEXED_STATIC_ROBOTS;
}

function decodeRouteSlug(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function buildMetadataSnapshot(options: {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogType?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
}): RouteMetadataSnapshot {
  return {
    title: options.title,
    description: options.description,
    canonical: options.canonical,
    robots: options.robots,
    ...buildRouteSocialMetadata({
      title: options.title,
      ogType: options.ogType,
      image: options.image,
      imageAlt: options.imageAlt,
    }),
  };
}

function buildNoIndexSnapshot(options: {
  title: string;
  description: string;
  canonical: string;
}): RouteMetadataSnapshot {
  return buildMetadataSnapshot({
    ...options,
    robots: NOINDEX_NOFOLLOW_ROBOTS,
  });
}

function resolveBlogIndexSnapshot(): RouteMetadataSnapshot {
  const canonical = buildStaticRouteCanonicalUrl('/blog');

  return buildMetadataSnapshot({
    title: BLOG_INDEX_SEO.title,
    description: BLOG_INDEX_SEO.description,
    canonical,
    robots: INDEXED_STATIC_ROBOTS,
    ogType: 'website',
  });
}

function resolveBlogCategorySnapshot(pathname: string): RouteMetadataSnapshot {
  const match = pathname.match(/^\/blog\/category\/([^/]+)$/);
  if (!match) {
    return buildNoIndexSnapshot({
      title: BLOG_CATEGORY_NOT_FOUND_SEO.title,
      description: BLOG_CATEGORY_NOT_FOUND_SEO.description,
      canonical: buildStaticRouteCanonicalUrl(pathname),
    });
  }

  const slug = decodeRouteSlug(match[1]);
  if (!slug) {
    return buildNoIndexSnapshot({
      title: BLOG_CATEGORY_NOT_FOUND_SEO.title,
      description: BLOG_CATEGORY_NOT_FOUND_SEO.description,
      canonical: buildStaticRouteCanonicalUrl(pathname),
    });
  }

  const blogPosts = getAllBlogPosts();
  const blogCategory = getBlogCategoryBySlug(slug);

  if (!blogCategory || !isPublishableCategoryPage(slug, blogPosts)) {
    return buildNoIndexSnapshot({
      title: BLOG_CATEGORY_NOT_FOUND_SEO.title,
      description: BLOG_CATEGORY_NOT_FOUND_SEO.description,
      canonical: buildStaticRouteCanonicalUrl(pathname),
    });
  }

  const canonical = buildStaticRouteCanonicalUrl(blogCategory.canonicalPath);
  const { featured } = getCategoryPageArticles(blogCategory.slug, blogPosts);
  const image =
    blogCategory.heroImage || featured?.image || featured?.thumbnailImage;

  return buildMetadataSnapshot({
    title: blogCategory.seoTitle,
    description: blogCategory.seoDescription,
    canonical,
    robots: INDEXED_STATIC_ROBOTS,
    ogType: 'website',
    image,
    imageAlt: blogCategory.seoTitle,
  });
}

function resolveSuccessStorySnapshot(pathname: string): RouteMetadataSnapshot {
  const match = pathname.match(/^\/success-stories\/([^/]+)$/);
  if (!match) {
    return buildNoIndexSnapshot({
      title: SUCCESS_STORY_NOT_FOUND_SEO.title,
      description: SUCCESS_STORY_NOT_FOUND_SEO.description,
      canonical: buildStaticRouteCanonicalUrl(pathname),
    });
  }

  const slug = decodeRouteSlug(match[1]);
  if (!slug) {
    return buildNoIndexSnapshot({
      title: SUCCESS_STORY_NOT_FOUND_SEO.title,
      description: SUCCESS_STORY_NOT_FOUND_SEO.description,
      canonical: buildStaticRouteCanonicalUrl(pathname),
    });
  }

  const story = getPublishedSuccessStoryBySlug(slug);
  if (!story) {
    return buildNoIndexSnapshot({
      title: SUCCESS_STORY_NOT_FOUND_SEO.title,
      description: SUCCESS_STORY_NOT_FOUND_SEO.description,
      canonical: buildStaticRouteCanonicalUrl(`${SUCCESS_STORIES_BASE_PATH}/${slug}`),
    });
  }

  const canonical = buildStaticRouteCanonicalUrl(`${SUCCESS_STORIES_BASE_PATH}/${story.slug}`);

  return buildMetadataSnapshot({
    title: story.seoTitle,
    description: story.seoDescription,
    canonical,
    robots: INDEXED_STATIC_ROBOTS,
    ogType: 'article',
    image: story.ogImage,
    imageAlt: story.imageAlt || story.seoTitle,
  });
}

function resolveBlogArticleSnapshot(pathname: string): RouteMetadataSnapshot | null {
  const match = pathname.match(/^\/blog\/([^/]+)$/);
  if (!match) return null;

  const slug = decodeRouteSlug(match[1]);
  if (!slug) {
    return resolveBlogArticleNotFoundSnapshot(pathname);
  }

  const post = getBlogPostById(slug);
  if (!post) {
    return null;
  }

  const canonical = buildStaticRouteCanonicalUrl(`/blog/${post.slug || post.id}`);
  const image = getBlogBannerImage(post.image);

  return buildMetadataSnapshot({
    title: `${post.seoTitle || post.title} | Primewayz UK`,
    description: post.seoDescription || post.description || post.excerpt,
    canonical,
    robots: INDEXED_STATIC_ROBOTS,
    ogType: 'article',
    image,
    imageAlt: post.imageAlt || post.title,
  });
}

export function resolveBlogArticleNotFoundSnapshot(
  pathname: string,
): RouteMetadataSnapshot {
  return buildNoIndexSnapshot({
    title: BLOG_ARTICLE_NOT_FOUND_SEO.title,
    description: BLOG_ARTICLE_NOT_FOUND_SEO.description,
    canonical: buildStaticRouteCanonicalUrl(pathname),
  });
}

function resolveSharedAuditReportSnapshot(pathname: string): RouteMetadataSnapshot | null {
  if (!/^\/web-presence-audit\/report\/[^/]+$/.test(pathname)) {
    return null;
  }

  return {
    title: SHARED_WEB_PRESENCE_AUDIT_REPORT_SEO.title,
    description: SHARED_WEB_PRESENCE_AUDIT_REPORT_SEO.description,
    robots: NOINDEX_NOFOLLOW_ROBOTS,
    ...buildRouteSocialMetadata({
      title: SHARED_WEB_PRESENCE_AUDIT_REPORT_SEO.title,
      ogType: 'website',
    }),
  };
}

/**
 * Routes whose metadata is updated by a mounted page component when the route
 * snapshot cannot be resolved synchronously (for example CMS-only blog posts
 * or shared audit reports). RouteMetadata must not overwrite these during SPA
 * navigation.
 */
export function isDelegatedClientMetadataRoute(pathname: string): boolean {
  const normalised = normaliseRouteMetadataPathname(pathname);

  const blogMatch = normalised.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = decodeRouteSlug(blogMatch[1]);
    return !slug || !getBlogPostById(slug);
  }

  return false;
}

export function isAdminMetadataRoute(pathname: string): boolean {
  return ADMIN_METADATA_PATHS.has(normaliseRouteMetadataPathname(pathname));
}

export function isRedirectOnlyMetadataRoute(pathname: string): boolean {
  return REDIRECT_ONLY_PATHS.has(normaliseRouteMetadataPathname(pathname));
}

export type RouteMetadataSnapshot = {
  title: string;
  description: string;
  canonical?: string;
  robots: string;
  ogType: 'website' | 'article';
  ogLocale: string;
  ogSiteName: string;
  ogImage: string;
  ogImageSecureUrl: string;
  ogImageType: string;
  ogImageAlt: string;
  twitterCard: string;
  twitterImage: string;
  twitterImageAlt: string;
};

export function resolveRouteMetadataSnapshot(
  pathname: string,
): RouteMetadataSnapshot | null {
  const normalised = normaliseRouteMetadataPathname(pathname);

  if (isRedirectOnlyMetadataRoute(normalised)) {
    return null;
  }

  if (normalised === '/blog') {
    return resolveBlogIndexSnapshot();
  }

  if (/^\/blog\/category\/[^/]+$/.test(normalised)) {
    return resolveBlogCategorySnapshot(normalised);
  }

  if (/^\/success-stories\/[^/]+$/.test(normalised)) {
    return resolveSuccessStorySnapshot(normalised);
  }

  const sharedAuditReportSnapshot = resolveSharedAuditReportSnapshot(normalised);
  if (sharedAuditReportSnapshot) {
    return sharedAuditReportSnapshot;
  }

  const blogArticleSnapshot = resolveBlogArticleSnapshot(normalised);
  if (blogArticleSnapshot) {
    return blogArticleSnapshot;
  }

  if (isDelegatedClientMetadataRoute(normalised)) {
    return null;
  }

  const staticMetadata = STATIC_PAGE_SEO[normalised];
  if (staticMetadata) {
    const { ogType, image } = resolveRouteOgImage(normalised);

    return buildMetadataSnapshot({
      title: staticMetadata.title,
      description: staticMetadata.description,
      canonical: buildStaticRouteCanonicalUrl(normalised),
      robots: resolveStaticRouteRobots(normalised),
      ogType,
      image,
    });
  }

  if (isAdminMetadataRoute(normalised)) {
    return buildMetadataSnapshot({
      title: ADMIN_METADATA.title,
      description: ADMIN_METADATA.description,
      canonical: buildStaticRouteCanonicalUrl(normalised),
      robots: NOINDEX_NOFOLLOW_ROBOTS,
    });
  }

  return buildNoIndexSnapshot({
    title: NOT_FOUND_METADATA.title,
    description: NOT_FOUND_METADATA.description,
    canonical: buildStaticRouteCanonicalUrl(normalised),
  });
}
