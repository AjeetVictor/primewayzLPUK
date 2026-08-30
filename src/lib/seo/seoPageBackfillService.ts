/**
 * Discover URLs from existing sources and backfill SeoPage / SeoPageAlias rows.
 * Dry-run by default. Never logs PII.
 */

import type { PrismaClient, SeoPageAliasSource } from '@prisma/client';
import {
  classifyNormalisationFailure,
  registerSeoPageAlias,
} from './seoPageIdentityService.ts';
import { hashSeoUrl, isSeoPagePathExcluded, normaliseSeoPageUrl } from './seoUrlNormalization.ts';

export type SeoPageBackfillSource =
  | 'GSC'
  | 'CHAT'
  | 'LEAD'
  | 'CMS'
  | 'FORM'
  | 'ALL';

export type SeoPageBackfillOptions = {
  dryRun?: boolean;
  source?: SeoPageBackfillSource;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  verbose?: boolean;
};

export type SeoPageBackfillReport = {
  dryRun: boolean;
  elapsedMs: number;
  recordsInspectedBySource: Record<string, number>;
  uniqueObservedUrls: number;
  canonicalPagesWouldCreate: number;
  aliasesWouldCreate: number;
  existingPagesMatched: number;
  trackingVariantsCollapsed: number;
  foreignHostsSkipped: number;
  excludedInternalPaths: number;
  malformedValuesSkipped: number;
  unresolvedRelativeValues: number;
  errors: number;
  /** @deprecated use recordsInspectedBySource */
  urlsInspected: number;
  /** @deprecated use canonicalPagesWouldCreate */
  pagesCreated: number;
  /** @deprecated use aliasesWouldCreate */
  aliasesCreated: number;
  /** @deprecated */
  invalidUrlsSkipped: number;
  /** @deprecated */
  unmatchedRecords: number;
  /** @deprecated */
  bySource: Record<string, number>;
};

type UrlCandidate = {
  observedUrl: string;
  source: SeoPageAliasSource;
  pageType?: string | null;
  cmsEntityType?: string | null;
  cmsEntityId?: string | null;
  title?: string | null;
  seenAt?: Date;
};

const BACKFILL_SOURCES: SeoPageAliasSource[] = [
  'GSC',
  'CHAT',
  'LEAD',
  'CMS',
  'GA4',
];

function includesSource(
  filter: SeoPageBackfillSource | undefined,
  source: SeoPageAliasSource,
): boolean {
  if (!filter || filter === 'ALL') return true;
  if (filter === 'FORM') return false;
  return filter === source;
}

function extractPageFromCommercialContext(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of ['page_path', 'pagePath', 'landingPage', 'sourcePagePath']) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return null;
}

export async function collectSeoPageUrlCandidates(
  prisma: PrismaClient,
  options: Pick<SeoPageBackfillOptions, 'source' | 'dateFrom' | 'dateTo'> = {},
): Promise<UrlCandidate[]> {
  const candidates: UrlCandidate[] = [];
  const seen = new Set<string>();

  const push = (candidate: UrlCandidate) => {
    if (!includesSource(options.source, candidate.source)) return;
    const key = `${candidate.source}|${candidate.observedUrl}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(candidate);
  };

  if (includesSource(options.source, 'GSC')) {
    const gscPages = await prisma.gscQueryPageMetric.findMany({
      where: {
        ...(options.dateFrom || options.dateTo
          ? {
              metricDate: {
                ...(options.dateFrom ? { gte: options.dateFrom } : {}),
                ...(options.dateTo ? { lte: options.dateTo } : {}),
              },
            }
          : {}),
      },
      distinct: ['pageHash'],
      select: { page: true, importedAt: true },
      take: 50000,
    });
    for (const row of gscPages) {
      if (row.page) {
        push({
          observedUrl: row.page,
          source: 'GSC',
          seenAt: row.importedAt,
        });
      }
    }
  }

  if (includesSource(options.source, 'CMS')) {
    const cmsPosts = await prisma.cmsBlogPost.findMany({
      where: { status: { in: ['published', 'draft'] } },
      select: { slug: true, title: true, updatedAt: true },
    });
    for (const post of cmsPosts) {
      push({
        observedUrl: `/blog/${post.slug}`,
        source: 'CMS',
        pageType: 'blog_article',
        cmsEntityType: 'cms_blog_post',
        cmsEntityId: post.slug,
        title: post.title,
        seenAt: post.updatedAt,
      });
    }
  }

  if (includesSource(options.source, 'CHAT')) {
    const chatSessions = await prisma.chatSession.findMany({
      select: {
        firstLandingPage: true,
        currentPageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      take: 50000,
    });
    for (const session of chatSessions) {
      if (session.firstLandingPage) {
        push({
          observedUrl: session.firstLandingPage,
          source: 'CHAT',
          seenAt: session.createdAt,
        });
      }
      if (session.currentPageUrl) {
        push({
          observedUrl: session.currentPageUrl,
          source: 'CHAT',
          seenAt: session.updatedAt,
        });
      }
    }
  }

  if (includesSource(options.source, 'LEAD')) {
    const reviewLeads = await prisma.digitalSystemsReviewLead.findMany({
      where: {
        ...(options.dateFrom || options.dateTo
          ? {
              createdAt: {
                ...(options.dateFrom ? { gte: options.dateFrom } : {}),
                ...(options.dateTo ? { lte: options.dateTo } : {}),
              },
            }
          : {}),
      },
      select: {
        landingPage: true,
        sourcePagePath: true,
        pageLocation: true,
        createdAt: true,
      },
      take: 50000,
    });
    for (const lead of reviewLeads) {
      for (const value of [lead.landingPage, lead.sourcePagePath, lead.pageLocation]) {
        if (value) {
          push({ observedUrl: value, source: 'LEAD', seenAt: lead.createdAt });
        }
      }
    }
  }

  if (!options.source || options.source === 'ALL' || options.source === 'FORM') {
    const forms = await prisma.formResponse.findMany({
      where: {
        ...(options.dateFrom || options.dateTo
          ? {
              createdAt: {
                ...(options.dateFrom ? { gte: options.dateFrom } : {}),
                ...(options.dateTo ? { lte: options.dateTo } : {}),
              },
            }
          : {}),
      },
      select: { commercialContext: true, createdAt: true },
      take: 50000,
    });
    for (const form of forms) {
      const page = extractPageFromCommercialContext(form.commercialContext);
      if (page) {
        push({ observedUrl: page, source: 'LEAD', seenAt: form.createdAt });
      }
    }
  }

  if (!options.source || options.source === 'ALL') {
    const toolLeads = await prisma.toolLead.findMany({
      select: { websiteUrl: true, createdAt: true },
      take: 50000,
    });
    for (const lead of toolLeads) {
      if (lead.websiteUrl) {
        push({ observedUrl: lead.websiteUrl, source: 'LEAD', seenAt: lead.createdAt });
      }
    }
  }

  return candidates;
}

export async function runSeoPageBackfill(
  prisma: PrismaClient,
  options: SeoPageBackfillOptions = {},
): Promise<SeoPageBackfillReport> {
  const started = Date.now();
  const dryRun = options.dryRun !== false;
  const report: SeoPageBackfillReport = {
    dryRun,
    elapsedMs: 0,
    recordsInspectedBySource: Object.fromEntries(BACKFILL_SOURCES.map((s) => [s, 0])),
    uniqueObservedUrls: 0,
    canonicalPagesWouldCreate: 0,
    aliasesWouldCreate: 0,
    existingPagesMatched: 0,
    trackingVariantsCollapsed: 0,
    foreignHostsSkipped: 0,
    excludedInternalPaths: 0,
    malformedValuesSkipped: 0,
    unresolvedRelativeValues: 0,
    errors: 0,
    urlsInspected: 0,
    pagesCreated: 0,
    aliasesCreated: 0,
    invalidUrlsSkipped: 0,
    unmatchedRecords: 0,
    bySource: {},
  };

  const allCandidates = await collectSeoPageUrlCandidates(prisma, options);
  const offset = Math.max(0, options.offset ?? 0);
  const limit = options.limit && options.limit > 0 ? options.limit : undefined;
  const candidates = limit
    ? allCandidates.slice(offset, offset + limit)
    : allCandidates.slice(offset);

  const canonicalSeen = new Set<string>();

  for (const candidate of candidates) {
    report.urlsInspected += 1;
    report.recordsInspectedBySource[candidate.source] =
      (report.recordsInspectedBySource[candidate.source] ?? 0) + 1;
    report.bySource[candidate.source] = (report.bySource[candidate.source] ?? 0) + 1;

    const trimmed = candidate.observedUrl.trim();
    if (!trimmed.startsWith('/') && !/^https?:\/\//i.test(trimmed)) {
      report.unresolvedRelativeValues += 1;
    }

    if (isSeoPagePathExcluded(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)) {
      report.excludedInternalPaths += 1;
      continue;
    }

    const normalised = normaliseSeoPageUrl(candidate.observedUrl);
    if (!normalised.ok) {
      const bucket = classifyNormalisationFailure(normalised);
      if (bucket === 'foreign_host') report.foreignHostsSkipped += 1;
      else if (bucket === 'excluded_path') report.excludedInternalPaths += 1;
      else report.malformedValuesSkipped += 1;
      report.invalidUrlsSkipped += 1;
      continue;
    }

    if (normalised.removedTrackingParameters.length > 0) {
      report.trackingVariantsCollapsed += 1;
    }

    report.uniqueObservedUrls += 1;
    const observedUrlHash = hashSeoUrl(trimmed);

    if (dryRun) {
      const existingPage = await prisma.seoPage.findUnique({
        where: { canonicalUrlHash: normalised.canonicalUrlHash },
      });
      if (existingPage) {
        report.existingPagesMatched += 1;
      } else if (!canonicalSeen.has(normalised.canonicalUrlHash)) {
        canonicalSeen.add(normalised.canonicalUrlHash);
        report.canonicalPagesWouldCreate += 1;
        report.pagesCreated += 1;
      }

      const existingAlias = await prisma.seoPageAlias.findUnique({
        where: {
          source_observedUrlHash: {
            source: candidate.source,
            observedUrlHash,
          },
        },
      });
      if (!existingAlias) {
        report.aliasesWouldCreate += 1;
        report.aliasesCreated += 1;
      }
      continue;
    }

    try {
      const result = await registerSeoPageAlias(prisma, candidate);
      if (!result.ok) {
        const bucket =
          result.reason === 'foreign_host'
            ? 'foreign_host'
            : result.reason === 'excluded_path'
              ? 'excluded_path'
              : 'invalid';
        if (bucket === 'foreign_host') report.foreignHostsSkipped += 1;
        else if (bucket === 'excluded_path') report.excludedInternalPaths += 1;
        else report.malformedValuesSkipped += 1;
        report.invalidUrlsSkipped += 1;
        continue;
      }
      if (result.createdPage) {
        report.canonicalPagesWouldCreate += 1;
        report.pagesCreated += 1;
      } else {
        report.existingPagesMatched += 1;
      }
      if (result.createdAlias) {
        report.aliasesWouldCreate += 1;
        report.aliasesCreated += 1;
      }
    } catch {
      report.errors += 1;
    }
  }

  report.unmatchedRecords =
    report.foreignHostsSkipped +
    report.malformedValuesSkipped +
    report.excludedInternalPaths +
    report.unresolvedRelativeValues;
  report.elapsedMs = Date.now() - started;

  if (options.verbose) {
    console.info('[seo:pages:backfill]', JSON.stringify({ phase: dryRun ? 'dry-run' : 'write', ...report }));
  }

  return report;
}
