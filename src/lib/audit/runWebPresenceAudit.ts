import { discoverPages } from './crawl/discoverPages.ts';
import { extractText, extractTitle } from './crawl/extractText.ts';
import { extractAnalyticsSignals } from './extractors/analyticsSignals.ts';
import { extractLeadSignals } from './extractors/leadSignals.ts';
import { extractLocalSignals } from './extractors/localSignals.ts';
import { extractSchemaSignals } from './extractors/schemaSignals.ts';
import { extractSeoSignals } from './extractors/seoSignals.ts';
import { extractSocialSignals } from './extractors/socialSignals.ts';
import { extractTrustSignals } from './extractors/trustSignals.ts';
import { NoopSearchPresenceProvider } from './external/noopSearchProvider.ts';
import { buildAuditReport } from './report/buildAuditReport.ts';
import {
  AuditInputError,
  type AuditContext,
  type AuditSignal,
  type WebPresenceAuditInput,
  type WebPresenceAuditReport,
} from './types.ts';

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AuditInputError(`${field} is required.`);
  }
  return value.trim();
}

export function validateAuditInput(input: unknown): WebPresenceAuditInput {
  if (!input || typeof input !== 'object') {
    throw new AuditInputError('A JSON request body is required.');
  }

  const data = input as Record<string, unknown>;
  return {
    websiteUrl: requiredText(data.websiteUrl, 'websiteUrl'),
    businessName: requiredText(data.businessName, 'businessName'),
    businessType: requiredText(data.businessType, 'businessType'),
    targetCountry: requiredText(data.targetCountry, 'targetCountry'),
    location: typeof data.location === 'string' ? data.location.trim() || undefined : undefined,
    phone: typeof data.phone === 'string' ? data.phone.trim() || undefined : undefined,
    email: typeof data.email === 'string' ? data.email.trim() || undefined : undefined,
  };
}

function basicSignal(
  key: string,
  found: boolean,
  maxPoints: number,
  label: string,
  recommendation: string,
  context: AuditContext,
): AuditSignal {
  return {
    key,
    category: 'website-basics',
    status: found ? 'found' : 'missing',
    confidence: 0.98,
    points: found ? maxPoints : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

function extractWebsiteBasicSignals(context: AuditContext): AuditSignal[] {
  const homepage = context.homepage;
  const title = extractTitle(homepage?.html || '');
  const hasContent = context.combinedText.split(/\s+/).filter(Boolean).length >= 20;

  return [
    basicSignal('basics-homepage-reachable', Boolean(homepage?.ok), 3, `Homepage returned HTTP ${homepage?.status}.`, 'Fix homepage availability so it returns a successful response.', context),
    basicSignal('basics-https', context.crawl.auditedUrl.startsWith('https://'), 2, 'The audited website uses HTTPS.', 'Move the website to HTTPS.', context),
    basicSignal('basics-title', Boolean(title), 2, `Homepage title found: ${title}`, 'Add a descriptive homepage title.', context),
    basicSignal('basics-html-content', hasContent, 2, 'Readable HTML content was found.', 'Ensure the homepage returns meaningful HTML content.', context),
    basicSignal('basics-fetch-health', Boolean(homepage && !homepage.error), 1, 'No obvious homepage fetch error was detected.', 'Resolve homepage fetch errors or timeouts.', context),
  ];
}

function reputationSignal(
  key: string,
  found: boolean,
  maxPoints: number,
  label: string,
  recommendation: string,
  context: AuditContext,
): AuditSignal {
  return {
    key,
    category: 'reviews-reputation',
    status: found ? 'found' : 'missing',
    confidence: 0.86,
    points: found ? maxPoints : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

function extractReputationSignals(context: AuditContext): AuditSignal[] {
  const value = `${context.combinedHtml} ${context.combinedText}`.toLowerCase();
  return [
    reputationSignal('reputation-testimonials', /testimonial|customer review|client review|what our clients say/.test(value), 2, 'Testimonials or review wording was found.', 'Add genuine customer testimonials or reviews.', context),
    reputationSignal('reputation-case-studies', /case stud(?:y|ies)/.test(value), 2, 'Case study content was found.', 'Publish evidence-based case studies.', context),
    reputationSignal('reputation-success-stories', /success stor(?:y|ies)/.test(value), 2, 'Success story content was found.', 'Add customer success stories with clear outcomes.', context),
    reputationSignal('reputation-portfolio', /portfolio|our work|clients include|client logos?/.test(value), 2, 'Portfolio or client evidence was found.', 'Show relevant work examples, portfolio links, or client evidence.', context),
  ];
}

function performanceSignal(
  key: string,
  found: boolean,
  maxPoints: number,
  label: string,
  recommendation: string,
  context: AuditContext,
  partial = false,
): AuditSignal {
  return {
    key,
    category: 'performance-ux',
    status: found ? (partial ? 'partial' : 'found') : 'missing',
    confidence: 0.9,
    points: found ? (partial ? maxPoints / 2 : maxPoints) : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label }] : [],
    recommendations: found ? (partial ? [recommendation] : []) : [recommendation],
  };
}

function extractPerformanceSignals(context: AuditContext): AuditSignal[] {
  const homepage = context.homepage;
  const bytes = homepage?.bytesRead || 0;
  const compact = bytes > 0 && bytes <= 750_000;
  const acceptable = bytes > 750_000 && bytes <= 1_500_000;
  const viewport = /<meta\b[^>]*name=["']viewport["'][^>]*>/i.test(homepage?.html || '');

  return [
    performanceSignal(
      'performance-html-size',
      compact || acceptable,
      3,
      `Homepage HTML size is ${Math.round(bytes / 1024)} KB.`,
      'Reduce oversized homepage HTML and remove unnecessary inline markup.',
      context,
      acceptable,
    ),
    performanceSignal('performance-viewport', viewport, 2, 'A viewport meta tag was found.', 'Add a responsive viewport meta tag.', context),
  ];
}

export async function runWebPresenceAudit(rawInput: unknown): Promise<WebPresenceAuditReport> {
  const input = validateAuditInput(rawInput);
  const crawl = await discoverPages(input.websiteUrl);
  const successfulPages = crawl.pages.filter((page) => page.ok && page.html);
  const combinedHtml = successfulPages.map((page) => page.html).join('\n');
  const combinedText = successfulPages.map((page) => extractText(page.html)).join(' ');
  const context: AuditContext = {
    input,
    crawl,
    combinedHtml,
    combinedText,
    homepage: crawl.pages[0],
  };

  const searchProvider = new NoopSearchPresenceProvider();
  const signals: AuditSignal[] = [
    ...extractWebsiteBasicSignals(context),
    ...extractSeoSignals(context),
    ...extractTrustSignals(context),
    ...extractLeadSignals(context),
    ...extractLocalSignals(context),
    ...extractSocialSignals(context),
    ...extractReputationSignals(context),
    ...extractSchemaSignals(context),
    ...extractPerformanceSignals(context),
    ...extractAnalyticsSignals(context),
    ...await searchProvider.check(input),
  ];

  return buildAuditReport(signals, crawl);
}
