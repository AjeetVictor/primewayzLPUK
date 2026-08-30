/**
 * Discover URLs from existing sources and backfill SeoPage / SeoPageAlias rows.
 * Dry-run by default. Never logs PII.
 */

import type { PrismaClient, SeoPageAliasSource } from '@prisma/client';
import { normaliseSeoPageUrl } from './seoUrlNormalization.ts';
import { registerSeoPageAlias } from './seoPageIdentityService.ts';

export type SeoPageBackfillReport = {
  dryRun: boolean;
  urlsInspected: number;
  pagesCreated: number;
  aliasesCreated: number;
  foreignHostsSkipped: number;
  invalidUrlsSkipped: number;
  unmatchedRecords: number;
  bySource: Record<string, number>;
};

type UrlCandidate = {
  observedUrl: string;
  source: SeoPageAliasSource;
  pageType?: string | null;
  cmsEntityType?: string | null;
  cmsEntityId?: string | null;
  title?: string | null;
};

export async function collectSeoPageUrlCandidates(
  prisma: PrismaClient,
): Promise<UrlCandidate[]> {
  const candidates: UrlCandidate[] = [];
  const seen = new Set<string>();

  const push = (candidate: UrlCandidate) => {
    const key = `${candidate.source}|${candidate.observedUrl}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  const gscPages = await prisma.gscQueryPageMetric.findMany({
    distinct: ['pageHash'],
    select: { page: true },
    take: 50000,
  });
  for (const row of gscPages) {
    if (row.page) push({ observedUrl: row.page, source: 'GSC', pageType: 'content' });
  }

  const cmsPosts = await prisma.cmsBlogPost.findMany({
    where: { status: { in: ['published', 'draft'] } },
    select: { slug: true, title: true },
  });
  for (const post of cmsPosts) {
    push({
      observedUrl: `/blog/${post.slug}`,
      source: 'CMS',
      pageType: 'blog',
      cmsEntityType: 'cms_blog_post',
      cmsEntityId: post.slug,
      title: post.title,
    });
  }

  const chatSessions = await prisma.chatSession.findMany({
    select: { firstLandingPage: true, currentPageUrl: true },
    take: 50000,
  });
  for (const session of chatSessions) {
    if (session.firstLandingPage) {
      push({ observedUrl: session.firstLandingPage, source: 'CHAT', pageType: 'landing' });
    }
    if (session.currentPageUrl) {
      push({ observedUrl: session.currentPageUrl, source: 'CHAT', pageType: 'content' });
    }
  }

  const reviewLeads = await prisma.digitalSystemsReviewLead.findMany({
    select: { landingPage: true, sourcePagePath: true, pageLocation: true },
    take: 50000,
  });
  for (const lead of reviewLeads) {
    for (const value of [lead.landingPage, lead.sourcePagePath, lead.pageLocation]) {
      if (value) push({ observedUrl: value, source: 'LEAD', pageType: 'landing' });
    }
  }

  return candidates;
}

export async function runSeoPageBackfill(
  prisma: PrismaClient,
  options: { dryRun?: boolean } = {},
): Promise<SeoPageBackfillReport> {
  const dryRun = options.dryRun !== false;
  const report: SeoPageBackfillReport = {
    dryRun,
    urlsInspected: 0,
    pagesCreated: 0,
    aliasesCreated: 0,
    foreignHostsSkipped: 0,
    invalidUrlsSkipped: 0,
    unmatchedRecords: 0,
    bySource: {},
  };

  const candidates = await collectSeoPageUrlCandidates(prisma);

  for (const candidate of candidates) {
    report.urlsInspected += 1;
    report.bySource[candidate.source] = (report.bySource[candidate.source] ?? 0) + 1;

    const normalised = normaliseSeoPageUrl(candidate.observedUrl);
    if (!normalised.ok) {
      if (normalised.reason === 'foreign_host') report.foreignHostsSkipped += 1;
      else report.invalidUrlsSkipped += 1;
      continue;
    }

    if (dryRun) {
      const existingPage = await prisma.seoPage.findUnique({
        where: { canonicalUrlHash: normalised.canonicalUrlHash },
      });
      if (!existingPage) report.pagesCreated += 1;
      const existingAlias = await prisma.seoPageAlias.findUnique({
        where: {
          source_normalisedUrlHash: {
            source: candidate.source,
            normalisedUrlHash: normalised.normalisedUrlHash,
          },
        },
      });
      if (!existingAlias) report.aliasesCreated += 1;
      continue;
    }

    const result = await registerSeoPageAlias(prisma, candidate);
    if (!result.ok) {
      if (result.reason === 'foreign_host') report.foreignHostsSkipped += 1;
      else report.invalidUrlsSkipped += 1;
      continue;
    }
    if (result.createdPage) report.pagesCreated += 1;
    if (result.createdAlias) report.aliasesCreated += 1;
  }

  report.unmatchedRecords = report.foreignHostsSkipped + report.invalidUrlsSkipped;

  return report;
}
