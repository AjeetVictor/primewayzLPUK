import dns from 'dns/promises';
import net from 'net';

const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const USER_AGENT = 'PrimewayzUK-VisibilityChecker/1.0 (+https://uk.primewayz.com)';

export type CheckStatus = 'pass' | 'partial' | 'fail';

export type CategoryCheck = {
  id: string;
  name: string;
  status: CheckStatus;
  points: number;
  maxPoints: number;
  explanation: string;
  recommendations: string[];
};

export type VisibilityCheckResult = {
  score: number;
  label: string;
  summary: string;
  checks: CategoryCheck[];
  recommendations: string[];
};

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  '[::1]',
  'metadata.google.internal',
  'metadata',
]);

function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1' || normalized === '::') return true;
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
    if (normalized.startsWith('fe80')) return true;
    if (normalized.startsWith('::ffff:')) {
      const mapped = normalized.slice(7);
      if (net.isIP(mapped) === 4) return isPrivateIp(mapped);
    }
  }
  return false;
}

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

export async function validatePublicWebsiteUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Please enter a valid website URL (e.g. https://example.co.uk).');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http and https URLs are allowed.');
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (!hostname) {
    throw new Error('Please enter a valid website URL.');
  }

  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error('This URL cannot be checked. Please use a public website address.');
  }

  if (hostname.endsWith('.local') || hostname.endsWith('.internal') || hostname.endsWith('.localhost')) {
    throw new Error('This URL cannot be checked. Please use a public website address.');
  }

  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error('Private or internal IP addresses cannot be checked.');
    }
    return parsed;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error('Could not resolve this website address. Please check the URL and try again.');
  }

  if (!addresses.length) {
    throw new Error('Could not resolve this website address. Please check the URL and try again.');
  }

  for (const entry of addresses) {
    if (isPrivateIp(entry.address)) {
      throw new Error('This URL points to a private network address and cannot be checked.');
    }
  }

  return parsed;
}

async function fetchWithGuards(
  url: URL,
  redirectCount = 0,
): Promise<{ status: number; finalUrl: URL; html: string; headers: Headers }> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error('Too many redirects while fetching the website.');
  }

  await validatePublicWebsiteUrl(url.toString());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'User-Agent': USER_AGENT,
      },
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        throw new Error('The website returned a redirect without a destination.');
      }
      const nextUrl = new URL(location, url);
      return fetchWithGuards(nextUrl, redirectCount + 1);
    }

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > MAX_RESPONSE_BYTES) {
      throw new Error('The website response is too large to analyse.');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      const text = await response.text();
      return { status: response.status, finalUrl: url, html: text.slice(0, MAX_RESPONSE_BYTES), headers: response.headers };
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.length;
        if (total > MAX_RESPONSE_BYTES) {
          throw new Error('The website response is too large to analyse.');
        }
        chunks.push(value);
      }
    }

    const html = new TextDecoder('utf-8', { fatal: false }).decode(
      chunks.length === 1 ? chunks[0] : Buffer.concat(chunks),
    );

    return { status: response.status, finalUrl: url, html, headers: response.headers };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('The website took too long to respond. Please try again later.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPath(baseUrl: URL, pathname: string): Promise<{ ok: boolean; status: number }> {
  const target = new URL(pathname, baseUrl);
  await validatePublicWebsiteUrl(target.toString());

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(target.toString(), {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT },
    });
    return { ok: response.ok, status: response.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timeout);
  }
}

function extractTagContent(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match?.[1]?.trim() || null;
}

function hasMetaRobotsNoindex(html: string): boolean {
  const robotsTags = html.match(/<meta[^>]+name=["']robots["'][^>]*>/gi) || [];
  return robotsTags.some((tag) => /noindex/i.test(tag));
}

function countMatches(html: string, words: string[]): number {
  const lower = html.toLowerCase();
  return words.filter((word) => lower.includes(word.toLowerCase())).length;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Strong digital foundation';
  if (score >= 60) return 'Good base, needs improvement';
  if (score >= 40) return 'Visibility gaps need attention';
  return 'High-risk digital presence';
}

function statusFromRatio(ratio: number): CheckStatus {
  if (ratio >= 0.75) return 'pass';
  if (ratio >= 0.4) return 'partial';
  return 'fail';
}

export async function runDigitalVisibilityCheck(input: {
  websiteUrl: string;
  businessType?: string;
  location?: string;
}): Promise<VisibilityCheckResult> {
  const startUrl = await validatePublicWebsiteUrl(input.websiteUrl);
  const { status, finalUrl, html } = await fetchWithGuards(startUrl);

  const checks: CategoryCheck[] = [];
  const allRecommendations: string[] = [];

  const addCheck = (check: CategoryCheck) => {
    checks.push(check);
    allRecommendations.push(...check.recommendations);
  };

  // Website Basics (15)
  {
    const maxPoints = 15;
    let points = 0;
    const recs: string[] = [];
    const https = finalUrl.protocol === 'https:';
    const statusOk = status >= 200 && status < 400;

    if (https) points += 5;
    else recs.push('Move the site to HTTPS to improve trust and search visibility.');

    if (statusOk) points += 5;
    else recs.push(`Fix homepage availability — the server returned HTTP ${status || 'error'}.`);

    const title = extractTagContent(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title && title.length >= 10 && title.length <= 70) points += 3;
    else if (title) {
      points += 1;
      recs.push('Set a clear homepage title between 30–60 characters.');
    } else {
      recs.push('Add a descriptive <title> tag on the homepage.');
    }

    const h1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html);
    if (h1) points += 2;
    else recs.push('Add one clear H1 heading that explains what the business does.');

    addCheck({
      id: 'website-basics',
      name: 'Website Basics',
      status: statusFromRatio(points / maxPoints),
      points,
      maxPoints,
      explanation: https && statusOk
        ? 'Your homepage loads over a secure connection with core page structure in place.'
        : 'Basic homepage availability or structure needs attention before visitors can trust the site.',
      recommendations: recs,
    });
  }

  // SEO Readiness (25)
  {
    const maxPoints = 25;
    let points = 0;
    const recs: string[] = [];

    const description = extractTagContent(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
      || extractTagContent(html, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);

    if (description && description.length >= 50 && description.length <= 160) points += 6;
    else if (description) {
      points += 3;
      recs.push('Refine the meta description to roughly 120–155 characters.');
    } else {
      recs.push('Add a meta description that summarises your offer for search results.');
    }

    const canonical = /<link[^>]+rel=["']canonical["'][^>]*>/i.test(html);
    if (canonical) points += 4;
    else recs.push('Add a canonical URL tag to reduce duplicate-content issues.');

    const robotsNoindex = hasMetaRobotsNoindex(html);
    if (!robotsNoindex) points += 4;
    else recs.push('Remove noindex from the homepage robots meta tag so search engines can index it.');

    const ogTags = (html.match(/property=["']og:/gi) || []).length;
    if (ogTags >= 3) points += 4;
    else if (ogTags >= 1) {
      points += 2;
      recs.push('Complete Open Graph tags (title, description, image) for better link previews.');
    } else {
      recs.push('Add Open Graph tags so shared links look professional on social platforms.');
    }

    const [sitemap, robots] = await Promise.all([
      fetchPath(finalUrl, '/sitemap.xml'),
      fetchPath(finalUrl, '/robots.txt'),
    ]);

    if (sitemap.ok) points += 4;
    else recs.push('Publish a sitemap.xml file and reference it in robots.txt.');

    if (robots.ok) points += 3;
    else recs.push('Add a robots.txt file to guide search engine crawling.');

    addCheck({
      id: 'seo-readiness',
      name: 'SEO Readiness',
      status: statusFromRatio(points / maxPoints),
      points,
      maxPoints,
      explanation: points >= 18
        ? 'Key technical SEO signals are present, giving search engines a clearer picture of your site.'
        : 'Several SEO foundations are missing, which can limit discoverability in search.',
      recommendations: recs,
    });
  }

  // Trust Signals (20)
  {
    const maxPoints = 20;
    const trustWords = ['contact', 'privacy', 'terms', 'about'];
    const found = countMatches(html, trustWords);
    const points = Math.min(maxPoints, found * 5);
    const recs: string[] = [];

    for (const word of trustWords) {
      if (!html.toLowerCase().includes(word)) {
        recs.push(`Make a clear "${word}" page or link easy to find in the navigation or footer.`);
      }
    }

    addCheck({
      id: 'trust-signals',
      name: 'Trust Signals',
      status: statusFromRatio(points / maxPoints),
      points,
      maxPoints,
      explanation: found >= 3
        ? 'Visitors can find trust-related pages that help validate the business.'
        : 'Trust pages such as contact, privacy, terms, and about are hard to find or missing.',
      recommendations: recs.slice(0, 4),
    });
  }

  // Lead Capture (15)
  {
    const maxPoints = 15;
    const ctaWords = ['call', 'book', 'contact', 'enquire', 'inquire', 'quote', 'get started'];
    const found = countMatches(html, ctaWords);
    const hasForm = /<form[\s>]/i.test(html);
    let points = Math.min(10, found * 2);
    if (hasForm) points += 5;
    points = Math.min(maxPoints, points);

    const recs: string[] = [];
    if (found < 2) {
      recs.push('Add visible calls to action such as "Book a call", "Get a quote", or "Contact us".');
    }
    if (!hasForm) {
      recs.push('Include a simple enquiry form so visitors can reach you without hunting for contact details.');
    }

    addCheck({
      id: 'lead-capture',
      name: 'Lead Capture',
      status: statusFromRatio(points / maxPoints),
      points,
      maxPoints,
      explanation: points >= 10
        ? 'The homepage encourages enquiries with clear action language or forms.'
        : 'Lead capture cues are weak — visitors may leave without making contact.',
      recommendations: recs,
    });
  }

  // Local Visibility (10)
  {
    const maxPoints = 10;
    let points = 0;
    const recs: string[] = [];
    const localHints = ['uk', 'united kingdom', 'london', 'england', 'scotland', 'wales'];
    const serviceHints = ['service', 'services', 'local', 'near me', 'area'];

    if (input.location) localHints.push(input.location.toLowerCase());
    if (input.businessType) serviceHints.push(input.businessType.toLowerCase());

    const localFound = countMatches(html, localHints);
    const serviceFound = countMatches(html, serviceHints);

    points += Math.min(5, localFound * 2);
    points += Math.min(5, serviceFound * 2);
    points = Math.min(maxPoints, points);

    if (localFound === 0) {
      recs.push('Mention your UK location or service area on the homepage for local relevance.');
    }
    if (serviceFound === 0) {
      recs.push('State clearly what services you offer so visitors know they are in the right place.');
    }

    addCheck({
      id: 'local-visibility',
      name: 'Local Visibility',
      status: statusFromRatio(points / maxPoints),
      points,
      maxPoints,
      explanation: points >= 6
        ? 'The homepage signals where you operate and what you offer.'
        : 'Local and service context is thin, which can hurt relevance for UK search and visitors.',
      recommendations: recs,
    });
  }

  // Maintenance Risk (15 = tracking 5 + content clarity 10)
  {
    const maxPoints = 15;
    let points = 0;
    const recs: string[] = [];

    const hasAnalytics = /googletagmanager\.com|google-analytics\.com|gtag\(|GTM-|UA-|G-[A-Z0-9]+/i.test(html);
    if (hasAnalytics) points += 5;
    else recs.push('Install GA4 or Tag Manager so you can measure traffic and enquiry performance.');

    const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ');
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    const hasClearIntro = wordCount >= 150;
    const currentYear = new Date().getFullYear();
    const hasRecentYear = new RegExp(`\\b${currentYear}\\b|\\b${currentYear - 1}\\b`).test(html);

    if (hasClearIntro) points += 6;
    else recs.push('Expand homepage copy so visitors quickly understand your offer and next step.');

    if (hasRecentYear) points += 4;
    else recs.push('Show recent dates or refreshed content so the site does not look abandoned.');

    addCheck({
      id: 'maintenance-risk',
      name: 'Maintenance Risk',
      status: statusFromRatio(points / maxPoints),
      points,
      maxPoints,
      explanation: points >= 10
        ? 'Analytics and content freshness suggest the site is actively maintained.'
        : 'Missing analytics or thin/outdated content can signal neglect to visitors and search engines.',
      recommendations: recs,
    });
  }

  const score = checks.reduce((sum, c) => sum + c.points, 0);
  const label = scoreLabel(score);
  const uniqueRecs = [...new Set(allRecommendations)].slice(0, 8);

  const summary =
    score >= 80
      ? 'Your website has a solid digital foundation. Focus on the remaining gaps to turn more visitors into enquiries.'
      : score >= 60
        ? 'You have a workable base, but several visibility and conversion gaps are holding back enquiries.'
        : score >= 40
          ? 'Important visibility and trust signals are missing. Addressing these should be a priority.'
          : 'Your website may be losing trust and enquiries. Start with HTTPS, core SEO, and clear contact paths.';

  return {
    score,
    label,
    summary,
    checks,
    recommendations: uniqueRecs,
  };
}
