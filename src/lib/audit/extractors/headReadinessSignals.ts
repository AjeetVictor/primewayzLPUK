import { extractAttribute, extractMetaContent, extractTitle } from '../crawl/extractText.ts';
import type { AuditContext, WebPresenceAuditHeadReadiness } from '../types.ts';

function robotsMetaStatus(html: string): WebPresenceAuditHeadReadiness['robotsMeta'] {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const name = extractAttribute(tag, 'name')?.toLowerCase();
    if (name !== 'robots' && name !== 'googlebot') continue;
    const content = extractAttribute(tag, 'content')?.toLowerCase() || '';
    if (content.includes('noindex')) return 'noindex_detected';
    return 'indexable';
  }
  return 'not_detected';
}

function openGraphStatus(html: string): WebPresenceAuditHeadReadiness['openGraph'] {
  const hasTitle = Boolean(extractMetaContent(html, 'og:title'));
  const hasDescription = Boolean(extractMetaContent(html, 'og:description'));
  const hasImage = Boolean(extractMetaContent(html, 'og:image'));
  const count = [hasTitle, hasDescription, hasImage].filter(Boolean).length;
  if (count === 3) return 'found';
  if (count > 0) return 'partial';
  return 'missing';
}

function structuredDataStatus(html: string): WebPresenceAuditHeadReadiness['structuredData'] {
  return /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>/i.test(html) ? 'found' : 'missing';
}

export function extractHeadReadiness(context: AuditContext): WebPresenceAuditHeadReadiness {
  const homepageHtml = context.homepage?.html || '';
  const notes: string[] = [];
  const recommendations: string[] = [];

  const title = extractTitle(homepageHtml);
  const description = extractMetaContent(homepageHtml, 'description');
  const canonicalTag = (homepageHtml.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i) || [])[0];
  const canonical = canonicalTag ? extractAttribute(canonicalTag, 'href') : undefined;
  const robotsMeta = robotsMetaStatus(homepageHtml);
  const openGraph = openGraphStatus(homepageHtml);
  const twitterCard = /<meta\b[^>]*name=["']twitter:card["'][^>]*>/i.test(homepageHtml) ? 'found' : 'missing';
  const structuredData = structuredDataStatus(homepageHtml);
  const robotsTxt = context.crawl.robotsAccessible ? 'accessible' : 'not_detected';
  const sitemapXml = context.crawl.sitemapAccessible ? 'accessible' : 'not_detected';

  const googleVerificationTags = homepageHtml.match(/<meta\b[^>]*>/gi)?.filter((tag) => {
    const name = extractAttribute(tag, 'name')?.toLowerCase();
    return name === 'google-site-verification';
  }) || [];
  const googleSiteVerificationMeta = googleVerificationTags.length > 0 ? 'detected' : 'not_detected';

  const bingVerificationTags = homepageHtml.match(/<meta\b[^>]*>/gi)?.filter((tag) => {
    const name = extractAttribute(tag, 'name')?.toLowerCase();
    return name === 'msvalidate.01' || name === 'bing-site-verification';
  }) || [];
  const bingSiteVerificationMeta = bingVerificationTags.length > 0 ? 'detected' : 'not_detected';

  if (title) {
    notes.push(`Homepage title detected (${title.length} characters).`);
  } else {
    recommendations.push('Add a descriptive homepage title tag.');
  }

  if (!description) {
    recommendations.push('Add a useful meta description on key public pages.');
  }

  if (!canonical) {
    recommendations.push('Add a canonical link tag where duplicate URLs may exist.');
  }

  if (robotsMeta === 'noindex_detected') {
    notes.push('A noindex robots meta directive was detected in the audited homepage HTML.');
    recommendations.push('Review whether noindex is intentional on public marketing pages.');
  }

  if (openGraph === 'missing' || openGraph === 'partial') {
    recommendations.push('Complete Open Graph tags for clearer link previews on social platforms.');
  }

  if (twitterCard === 'missing') {
    recommendations.push('Add Twitter/X card meta tags if social sharing previews matter.');
  }

  if (structuredData === 'missing') {
    recommendations.push('Add structured data where appropriate for the business type.');
  }

  if (robotsTxt === 'not_detected') {
    recommendations.push('Publish an accessible robots.txt file if not already available.');
  } else {
    notes.push('robots.txt was accessible during the audit.');
  }

  if (sitemapXml === 'not_detected') {
    recommendations.push('Publish an accessible sitemap.xml file if not already available.');
  } else {
    notes.push('sitemap.xml was accessible during the audit.');
  }

  if (googleSiteVerificationMeta === 'detected') {
    notes.push('Google site verification meta tag detected in the audited HTML.');
  } else {
    notes.push('Google Search Console verification tag was not detected in the audited HTML. GSC access is not verified in this free audit.');
  }

  if (bingSiteVerificationMeta === 'detected') {
    notes.push('Bing site verification meta tag detected in the audited HTML.');
  } else {
    notes.push('Bing site verification tag was not detected in the audited HTML. Bing Webmaster access is not verified in this free audit.');
  }

  return {
    title: title ? 'found' : 'missing',
    metaDescription: description ? 'found' : 'missing',
    canonical: canonical ? 'found' : 'missing',
    robotsMeta,
    openGraph,
    twitterCard,
    structuredData,
    robotsTxt,
    sitemapXml,
    googleSiteVerificationMeta,
    bingSiteVerificationMeta,
    notes,
    recommendations: [...new Set(recommendations)],
  };
}
