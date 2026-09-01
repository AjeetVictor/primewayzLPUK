import { SDAAS_COMPARISON_PATH, SDAAS_COMPARISON_OG_IMAGE } from '../../data/sdaas/comparisonArticle.ts';
import { SDAAS_PILLAR_PATH, SDAAS_PILLAR_OG_IMAGE } from '../../data/sdaas/pillarArticle.ts';
import { SDAAS_USE_CASES_PATH, SDAAS_USE_CASES_OG_IMAGE } from '../../data/sdaas/useCasesArticle.ts';
import { getSdaasSupportingArticleByPath } from '../../data/sdaas/supportingArticlesRegistry.ts';
import { ROUTE_METADATA_SITE_URL } from './routeMetadataContent.ts';

export const DEFAULT_OG_IMAGE_PATH = '/og-primewayz-uk.jpg';
export const DEFAULT_OG_IMAGE = `${ROUTE_METADATA_SITE_URL}${DEFAULT_OG_IMAGE_PATH}`;
export const OG_LOCALE = 'en_GB';
export const OG_SITE_NAME = 'Primewayz UK';
export const TWITTER_CARD = 'summary_large_image';

export function toAbsoluteSiteUrl(
  value?: string,
  siteUrl: string = ROUTE_METADATA_SITE_URL,
): string | undefined {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

export function resolveOgImageType(imageUrl: string): string {
  const cleanImageUrl = imageUrl.split('?')[0].toLowerCase();

  if (cleanImageUrl.endsWith('.png')) return 'image/png';
  if (cleanImageUrl.endsWith('.webp')) return 'image/webp';
  if (cleanImageUrl.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

export function resolveRouteOgImage(
  pathname: string,
  explicitImage?: string,
): { ogType: 'website' | 'article'; image: string } {
  if (explicitImage) {
    return {
      ogType: 'article',
      image: toAbsoluteSiteUrl(explicitImage) || DEFAULT_OG_IMAGE,
    };
  }

  if (pathname === SDAAS_PILLAR_PATH) {
    return {
      ogType: 'article',
      image: toAbsoluteSiteUrl(SDAAS_PILLAR_OG_IMAGE) || DEFAULT_OG_IMAGE,
    };
  }

  if (pathname === SDAAS_COMPARISON_PATH) {
    return {
      ogType: 'article',
      image: toAbsoluteSiteUrl(SDAAS_COMPARISON_OG_IMAGE) || DEFAULT_OG_IMAGE,
    };
  }

  if (pathname === SDAAS_USE_CASES_PATH) {
    return {
      ogType: 'article',
      image: toAbsoluteSiteUrl(SDAAS_USE_CASES_OG_IMAGE) || DEFAULT_OG_IMAGE,
    };
  }

  const supportingArticle = getSdaasSupportingArticleByPath(pathname);
  if (supportingArticle) {
    return {
      ogType: 'article',
      image: toAbsoluteSiteUrl(supportingArticle.ogImage) || DEFAULT_OG_IMAGE,
    };
  }

  return {
    ogType: 'website',
    image: DEFAULT_OG_IMAGE,
  };
}

export type RouteSocialMetadata = {
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

export function buildRouteSocialMetadata(options: {
  title: string;
  ogType?: 'website' | 'article';
  image?: string;
  imageAlt?: string;
}): RouteSocialMetadata {
  const image = toAbsoluteSiteUrl(options.image) || DEFAULT_OG_IMAGE;
  const imageAlt = options.imageAlt || options.title;

  return {
    ogType: options.ogType || 'website',
    ogLocale: OG_LOCALE,
    ogSiteName: OG_SITE_NAME,
    ogImage: image,
    ogImageSecureUrl: image,
    ogImageType: resolveOgImageType(image),
    ogImageAlt: imageAlt,
    twitterCard: TWITTER_CARD,
    twitterImage: image,
    twitterImageAlt: imageAlt,
  };
}
