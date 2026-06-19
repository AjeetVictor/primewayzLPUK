import { extractAttribute } from './extractText.ts';
import { normalizeAndValidateUrl, resolvePublicAddresses } from './normalizeUrl.ts';
import { safeFetchPage } from './safeFetchPage.ts';
import type { AuditCrawlResult, FetchedPage } from '../types.ts';

const MAX_PAGES = 6;
const PRIORITY_TERMS = [
  'contact',
  'contact-us',
  'about',
  'about-us',
  'services',
  'pricing',
  'privacy',
  'privacy-policy',
  'terms',
  'terms-and-conditions',
  'faq',
];
const ASSET_EXTENSION = /\.(?:avif|css|gif|ico|jpe?g|js|json|mp3|mp4|pdf|png|svg|webm|webp|woff2?)(?:$|\?)/i;

function discoverInternalUrls(html: string, baseUrl: URL): URL[] {
  const anchors = html.match(/<a\b[^>]*>/gi) || [];
  const candidates = new Map<string, URL>();

  for (const anchor of anchors) {
    const href = extractAttribute(anchor, 'href');
    if (!href || href.startsWith('#') || /^(?:mailto:|tel:|javascript:)/i.test(href)) continue;

    try {
      const url = new URL(href, baseUrl);
      if (url.origin !== baseUrl.origin || ASSET_EXTENSION.test(url.pathname)) continue;
      url.hash = '';
      url.search = '';
      const key = `${url.origin}${url.pathname.replace(/\/+$/, '') || '/'}`;
      candidates.set(key, url);
    } catch {
      // Invalid links are ignored rather than failing the audit.
    }
  }

  return [...candidates.values()]
    .filter((url) => url.pathname !== baseUrl.pathname)
    .sort((a, b) => {
      const aPath = a.pathname.toLowerCase();
      const bPath = b.pathname.toLowerCase();
      const aRank = PRIORITY_TERMS.findIndex((term) => aPath.includes(term));
      const bRank = PRIORITY_TERMS.findIndex((term) => bPath.includes(term));
      const normalizedA = aRank === -1 ? PRIORITY_TERMS.length : aRank;
      const normalizedB = bRank === -1 ? PRIORITY_TERMS.length : bRank;
      return normalizedA - normalizedB || aPath.length - bPath.length;
    });
}

async function probeResource(baseUrl: URL, pathname: string): Promise<boolean> {
  const page = await safeFetchPage(new URL(pathname, baseUrl), { allowNonHtml: true });
  return page.ok;
}

export async function discoverPages(rawUrl: string): Promise<AuditCrawlResult> {
  const startUrl = await normalizeAndValidateUrl(rawUrl);
  const resolvedAddresses = await resolvePublicAddresses(startUrl.hostname);
  const homepage = await safeFetchPage(startUrl);
  const pages: FetchedPage[] = [homepage];

  if (homepage.ok && homepage.html) {
    const baseUrl = new URL(homepage.finalUrl);
    const candidates = discoverInternalUrls(homepage.html, baseUrl).slice(0, MAX_PAGES - 1);
    for (const candidate of candidates) {
      pages.push(await safeFetchPage(candidate));
    }
  }

  const probeBase = homepage.finalUrl ? new URL(homepage.finalUrl) : startUrl;
  const [robotsAccessible, sitemapAccessible] = await Promise.all([
    probeResource(probeBase, '/robots.txt'),
    probeResource(probeBase, '/sitemap.xml'),
  ]);

  return {
    auditedUrl: homepage.finalUrl || startUrl.toString(),
    normalizedHost: startUrl.hostname.toLowerCase(),
    resolvedIp: resolvedAddresses[0],
    pages,
    pagesAttempted: pages.length,
    robotsAccessible,
    sitemapAccessible,
  };
}
