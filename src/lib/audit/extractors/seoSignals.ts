import { extractAttribute, extractMetaContent, extractTitle } from '../crawl/extractText.ts';
import type { AuditContext, AuditSignal } from '../types.ts';

function signal(
  key: string,
  found: boolean,
  maxPoints: number,
  label: string,
  recommendation: string,
  url?: string,
  partial = false,
): AuditSignal {
  return {
    key,
    category: 'technical-seo',
    status: found ? (partial ? 'partial' : 'found') : 'missing',
    confidence: 0.95,
    points: found ? (partial ? maxPoints / 2 : maxPoints) : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

export function extractSeoSignals(context: AuditContext): AuditSignal[] {
  const homepage = context.homepage;
  const html = homepage?.html || '';
  const url = homepage?.finalUrl;
  const title = extractTitle(html);
  const description = extractMetaContent(html, 'description');
  const canonicalTag = (html.match(/<link\b[^>]*rel=["'][^"']*canonical[^"']*["'][^>]*>/i) || [])[0];
  const canonical = canonicalTag ? extractAttribute(canonicalTag, 'href') : undefined;
  const h1 = /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html);
  const images = html.match(/<img\b[^>]*>/gi) || [];
  const imagesWithAlt = images.filter((tag) => Boolean(extractAttribute(tag, 'alt')));
  const altRatio = images.length ? imagesWithAlt.length / images.length : 1;
  const titleReasonable = Boolean(title && title.length >= 20 && title.length <= 70);

  return [
    signal(
      'seo-title-length',
      Boolean(title),
      2,
      titleReasonable ? `Title length is ${title!.length} characters.` : `Page title found: ${title}`,
      'Add a clear homepage title of roughly 20 to 70 characters.',
      url,
      Boolean(title) && !titleReasonable,
    ),
    signal(
      'seo-meta-description',
      Boolean(description),
      3,
      `Meta description found (${description?.length || 0} characters).`,
      'Add a useful meta description that explains the business offer.',
      url,
      Boolean(description && (description.length < 50 || description.length > 170)),
    ),
    signal('seo-canonical', Boolean(canonical), 2, `Canonical URL: ${canonical}`, 'Add a canonical link tag.', url),
    signal(
      'seo-robots',
      context.crawl.robotsAccessible || /robots\.txt/i.test(html),
      2,
      'robots.txt is accessible or referenced.',
      'Publish a public robots.txt file.',
      url,
    ),
    signal(
      'seo-sitemap',
      context.crawl.sitemapAccessible || /sitemap\.xml/i.test(html),
      2,
      'sitemap.xml is accessible or referenced.',
      'Publish a sitemap.xml file.',
      url,
    ),
    signal('seo-h1', h1, 2, 'A homepage H1 was found.', 'Add one clear H1 describing the business.', url),
    signal(
      'seo-image-alt',
      altRatio >= 0.8,
      2,
      `${imagesWithAlt.length} of ${images.length} images include alt text.`,
      'Add descriptive alt text to meaningful images.',
      url,
      altRatio > 0 && altRatio < 0.8,
    ),
  ];
}
