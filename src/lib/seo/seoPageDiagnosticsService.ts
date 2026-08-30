/**
 * Read-only SEO page identity diagnostics for admin operators.
 * Returns aggregate counts only — no PII.
 */

import type { PrismaClient, SeoPageAliasSource } from '@prisma/client';

export type SeoPageDiagnosticsQuery = {
  source?: SeoPageAliasSource;
  pageType?: string;
  unmatchedOnly?: boolean;
  limit?: number;
  offset?: number;
};

export type SeoPageDiagnosticsItem = {
  seoPageId: number;
  canonicalUrl: string;
  path: string;
  pageType: string | null;
  serviceArea: string | null;
  aliasCount: number;
  sources: SeoPageAliasSource[];
  firstSeenAt: string;
  lastSeenAt: string;
};

export type SeoPageDiagnosticsResult = {
  summary: {
    canonicalPageCount: number;
    aliasCount: number;
    unmatchedObservedUrlCount: number;
    foreignHostCount: number;
    excludedInternalPathCount: number;
    activePageCount: number;
    inactivePageCount: number;
  };
  items: SeoPageDiagnosticsItem[];
  limit: number;
  offset: number;
  totalItems: number;
};

export async function getSeoPageDiagnostics(
  prisma: PrismaClient,
  query: SeoPageDiagnosticsQuery = {},
): Promise<SeoPageDiagnosticsResult> {
  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);

  const [canonicalPageCount, aliasCount, activePageCount, inactivePageCount] =
    await Promise.all([
      prisma.seoPage.count(),
      prisma.seoPageAlias.count(),
      prisma.seoPage.count({ where: { active: true } }),
      prisma.seoPage.count({ where: { active: false } }),
    ]);

  const where = {
    ...(query.pageType ? { pageType: query.pageType } : {}),
    ...(query.source
      ? {
          aliases: {
            some: { source: query.source },
          },
        }
      : {}),
    ...(query.unmatchedOnly
      ? {
          aliases: {
            none: {},
          },
        }
      : {}),
  };

  const totalItems = await prisma.seoPage.count({ where });
  const pages = await prisma.seoPage.findMany({
    where,
    include: {
      aliases: {
        select: { source: true },
      },
    },
    orderBy: { lastSeenAt: 'desc' },
    skip: offset,
    take: limit,
  });

  const items: SeoPageDiagnosticsItem[] = pages.map((page) => ({
    seoPageId: page.id,
    canonicalUrl: page.canonicalUrl,
    path: page.path,
    pageType: page.pageType,
    serviceArea: page.serviceArea,
    aliasCount: page.aliases.length,
    sources: [...new Set(page.aliases.map((alias) => alias.source))],
    firstSeenAt: page.firstSeenAt.toISOString(),
    lastSeenAt: page.lastSeenAt.toISOString(),
  }));

  return {
    summary: {
      canonicalPageCount,
      aliasCount,
      unmatchedObservedUrlCount: 0,
      foreignHostCount: 0,
      excludedInternalPathCount: 0,
      activePageCount,
      inactivePageCount,
    },
    items,
    limit,
    offset,
    totalItems,
  };
}
