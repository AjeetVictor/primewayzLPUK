/**
 * Tests for SEO page backfill service.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { collectSeoPageUrlCandidates, runSeoPageBackfill } from './seoPageBackfillService.ts';

function createBackfillPrisma() {
  const pages = new Map<string, unknown>();
  const aliases = new Map<string, unknown>();

  const prisma = {
    gscQueryPageMetric: {
      findMany: async () => [
        { page: 'https://uk.primewayz.com/services?utm_source=x', importedAt: new Date() },
        { page: 'https://example.com/external', importedAt: new Date() },
      ],
    },
    cmsBlogPost: {
      findMany: async () => [{ slug: 'example', title: 'Example', updatedAt: new Date() }],
    },
    chatSession: {
      findMany: async () => [
        {
          firstLandingPage: '/contact-us',
          currentPageUrl: '/admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
    digitalSystemsReviewLead: {
      findMany: async () => [
        {
          landingPage: '/digital-systems-review',
          sourcePagePath: '/services',
          pageLocation: 'https://uk.primewayz.com/services',
          createdAt: new Date(),
        },
      ],
    },
    formResponse: {
      findMany: async () => [
        { commercialContext: { page_path: '/pricing' }, createdAt: new Date() },
      ],
    },
    toolLead: {
      findMany: async () => [{ websiteUrl: 'https://client-example.com', createdAt: new Date() }],
    },
    seoPage: {
      findUnique: async ({ where }: { where: { canonicalUrlHash: string } }) =>
        pages.get(where.canonicalUrlHash) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        pages.set(String(data.canonicalUrlHash), data);
        return { id: 1, ...data };
      },
      update: async ({ data }: { data: Record<string, unknown> }) => ({ id: 1, ...data }),
    },
    seoPageAlias: {
      findUnique: async () => null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        aliases.set(`${String(data.source)}|${String(data.observedUrlHash)}`, data);
        return data;
      },
      update: async ({ data }: { data: Record<string, unknown> }) => data,
      updateMany: async () => ({ count: 0 }),
    },
  };

  return { prisma: prisma as unknown as PrismaClient, pages, aliases };
}

test('collectSeoPageUrlCandidates gathers URLs from configured sources', async () => {
  const { prisma } = createBackfillPrisma();
  const candidates = await collectSeoPageUrlCandidates(prisma);
  assert.ok(candidates.some((c) => c.source === 'GSC'));
  assert.ok(candidates.some((c) => c.source === 'CMS'));
  assert.ok(candidates.some((c) => c.source === 'CHAT'));
  assert.ok(candidates.some((c) => c.source === 'LEAD'));
});

test('dry-run writes nothing', async () => {
  const { prisma, pages, aliases } = createBackfillPrisma();
  const report = await runSeoPageBackfill(prisma, { dryRun: true });
  assert.equal(report.dryRun, true);
  assert.equal(pages.size, 0);
  assert.equal(aliases.size, 0);
  assert.ok(report.canonicalPagesWouldCreate > 0);
});

test('write mode creates expected records', async () => {
  const { prisma, pages, aliases } = createBackfillPrisma();
  const report = await runSeoPageBackfill(prisma, { dryRun: false, source: 'CMS' });
  assert.equal(report.dryRun, false);
  assert.ok(report.pagesCreated >= 1);
  assert.ok(pages.size >= 1);
  assert.ok(aliases.size >= 1);
});

test('rerun is idempotent', async () => {
  const { prisma } = createBackfillPrisma();
  await runSeoPageBackfill(prisma, { dryRun: false, source: 'CMS' });
  const second = await runSeoPageBackfill(prisma, { dryRun: false, source: 'CMS' });
  assert.equal(second.pagesCreated, 0);
});

test('batching limit and offset work', async () => {
  const { prisma } = createBackfillPrisma();
  const all = await runSeoPageBackfill(prisma, { dryRun: true });
  const limited = await runSeoPageBackfill(prisma, { dryRun: true, limit: 2, offset: 1 });
  assert.ok(limited.urlsInspected <= 2);
  assert.ok(limited.urlsInspected <= all.urlsInspected);
});

test('source filters work', async () => {
  const { prisma } = createBackfillPrisma();
  const report = await runSeoPageBackfill(prisma, { dryRun: true, source: 'CMS' });
  assert.equal(report.bySource.GSC ?? 0, 0);
  assert.ok((report.bySource.CMS ?? 0) > 0);
});

test('malformed and foreign values do not abort the run', async () => {
  const { prisma } = createBackfillPrisma();
  const report = await runSeoPageBackfill(prisma, { dryRun: true });
  assert.ok(report.foreignHostsSkipped >= 1);
  assert.equal(report.errors, 0);
});

test('backfill script does not log PII field names', async () => {
  const script = await import('node:fs/promises').then((fs) =>
    fs.readFile(new URL('../../../scripts/backfill-seo-pages.ts', import.meta.url), 'utf8'),
  );
  assert.doesNotMatch(script, /\bemail\b/i);
  assert.doesNotMatch(script, /\bphone\b/i);
  assert.doesNotMatch(script, /ChatMessage/);
});
