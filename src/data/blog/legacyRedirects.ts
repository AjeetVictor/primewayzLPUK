import { getBlogPostById, getAllBlogPosts } from './utils';
import {
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_USE_CASES_HREF,
} from '../../constants/canonicalRoutes';

/**
 * Legacy `/insights/*` → `/blog/*` redirects.
 *
 * Important: current SDaaS educational articles live under `/insights/*` and remain
 * canonical there. Only redirect when the destination is a real published blog article.
 * Never invent destinations or redirect live insights pages to nonexistent `/blog` slugs.
 */

export interface LegacyBlogRedirect {
  /** Source path under /insights (no trailing slash). */
  from: string;
  /** Destination path under /blog (no trailing slash). Must be a published article. */
  to: string;
}

/**
 * Explicit legacy mappings only.
 * Destinations are validated at resolve-time against published blog posts.
 * Keep empty unless a real historical insights URL maps to a different blog slug.
 */
export const legacyBlogRedirects: LegacyBlogRedirect[] = [
  // Example shape (kept empty on purpose — example destinations in the task brief
  // do not exist as blog posts; live SDaaS pages remain at /insights/*):
  // { from: '/insights/old-slug', to: '/blog/current-published-slug' },
];

/** Live educational SDaaS insight routes — must NOT be redirected away. */
export const LIVE_INSIGHTS_PATHS = [
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_USE_CASES_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
] as const;

const liveInsightsSlugSet = new Set(
  LIVE_INSIGHTS_PATHS.map((path) => path.replace(/^\/insights\//, '')),
);

const normalizeInternalPath = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) {
    return '';
  }
  const withoutQuery = trimmed.split('?')[0]?.split('#')[0] || '';
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.replace(/\/+$/, '');
  }
  return withoutQuery;
};

export const isLiveInsightsSlug = (slug: string): boolean => liveInsightsSlugSet.has(slug);

export const isSafeBlogRedirectDestination = (destination: string): boolean => {
  const path = normalizeInternalPath(destination);
  if (!path.startsWith('/blog/')) return false;
  if (path === '/blog' || path.includes('//') || path.includes('\\')) return false;
  if (path.includes('://')) return false;
  const slug = path.slice('/blog/'.length);
  if (!slug || slug.includes('/')) return false;
  return Boolean(getBlogPostById(slug));
};

export const getValidatedLegacyBlogRedirects = (): LegacyBlogRedirect[] => {
  const seenFrom = new Set<string>();
  const validated: LegacyBlogRedirect[] = [];

  for (const entry of legacyBlogRedirects) {
    const from = normalizeInternalPath(entry.from);
    const to = normalizeInternalPath(entry.to);

    if (!from.startsWith('/insights/')) continue;
    if (!isSafeBlogRedirectDestination(to)) {
      if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn(
          `[legacy-redirects] Skipping invalid mapping ${from} → ${to} (destination is not a published /blog article)`,
        );
      }
      continue;
    }
    if (seenFrom.has(from)) continue;
    seenFrom.add(from);
    validated.push({ from, to });
  }

  return validated;
};

const explicitRedirectBySlug = (): Map<string, string> => {
  const map = new Map<string, string>();
  for (const entry of getValidatedLegacyBlogRedirects()) {
    const slug = entry.from.replace(/^\/insights\//, '');
    map.set(slug, entry.to);
  }
  return map;
};

export const isPublishedBlogSlug = (slug: string, publishedSlugs?: Set<string>): boolean => {
  if (publishedSlugs) {
    return publishedSlugs.has(slug);
  }
  return Boolean(getBlogPostById(slug));
};

/**
 * Resolve `/insights/:slug` to an internal `/blog/...` path, or null when no redirect.
 * Never returns an open/external redirect.
 */
export const resolveInsightsToBlogRedirect = (
  rawSlug: string,
  options?: { publishedSlugs?: Set<string> },
): string | null => {
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    return null;
  }

  slug = slug.replace(/\/+$/, '').trim();
  if (!slug || slug.includes('/') || slug.includes('..') || slug.includes('\\')) {
    return null;
  }

  // Live SDaaS insight articles remain canonical under /insights — do not redirect.
  if (isLiveInsightsSlug(slug)) {
    return null;
  }

  const explicit = explicitRedirectBySlug().get(slug);
  if (explicit && isSafeBlogRedirectDestination(explicit)) {
    return explicit;
  }

  if (isPublishedBlogSlug(slug, options?.publishedSlugs)) {
    return `/blog/${slug}`;
  }

  return null;
};

export const buildRedirectLocation = (
  destinationPath: string,
  requestUrl: string,
): string => {
  const path = normalizeInternalPath(destinationPath);
  if (!path.startsWith('/blog/')) {
    throw new Error('Redirect destination must be an internal /blog path');
  }

  const queryIndex = requestUrl.indexOf('?');
  if (queryIndex === -1) {
    return path;
  }

  const query = requestUrl.slice(queryIndex);
  // Preserve query as-is; destination path never includes a query.
  return `${path}${query}`;
};

export const normalizeInsightsPathname = (pathname: string): string | null => {
  const normalized = normalizeInternalPath(pathname);
  const match = normalized.match(/^\/insights\/([^/]+)$/);
  if (!match) return null;
  return match[1];
};

export const getPublishedBlogSlugSet = (): Set<string> =>
  new Set(getAllBlogPosts().flatMap((post) => [post.id, post.slug]));

/** Paths that should never appear as legacy redirect sources in the sitemap. */
export const getLegacyInsightsRedirectSources = (): string[] =>
  getValidatedLegacyBlogRedirects().map((entry) => entry.from);
