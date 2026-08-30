/**
 * Tests for SEO page diagnostics service.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { getSeoPageDiagnostics } from './seoPageDiagnosticsService.ts';

function createDiagnosticsPrisma() {
  const pages = [
    {
      id: 1,
      canonicalUrl: 'https://uk.primewayz.com/services',
      path: '/services',
      pageType: 'service',
      serviceArea: null,
      firstSeenAt: new Date('2026-01-01T00:00:00.000Z'),
      lastSeenAt: new Date('2026-02-01T00:00:00.000Z'),
      aliases: [{ source: 'GSC' }, { source: 'CMS' }],
    },
  ];

  const prisma = {
    seoPage: {
      count: async (args?: { where?: Record<string, unknown> }) => {
        if (args?.where?.active === true) return 1;
        if (args?.where?.active === false) return 0;
        if (args?.where?.pageType) {
          return pages.filter((p) => p.pageType === args.where!.pageType).length;
        }
        return pages.length;
      },
      findMany: async ({
        where,
        skip = 0,
        take = 25,
      }: {
        where?: Record<string, unknown>;
        skip?: number;
        take?: number;
      }) => {
        let rows = pages;
        if (where?.pageType) {
          rows = rows.filter((p) => p.pageType === where.pageType);
        }
        return rows.slice(skip, skip + take);
      },
    },
    seoPageAlias: {
      count: async () => 2,
    },
  };

  return prisma as unknown as PrismaClient;
}

test('returns safe aggregate summary', async () => {
  const prisma = createDiagnosticsPrisma();
  const result = await getSeoPageDiagnostics(prisma);
  assert.equal(result.summary.canonicalPageCount, 1);
  assert.equal(result.summary.aliasCount, 2);
  assert.equal(result.summary.activePageCount, 1);
});

test('pagination works', async () => {
  const prisma = createDiagnosticsPrisma();
  const result = await getSeoPageDiagnostics(prisma, { limit: 1, offset: 0 });
  assert.equal(result.limit, 1);
  assert.equal(result.items.length, 1);
});

test('pageType filter works', async () => {
  const prisma = createDiagnosticsPrisma();
  const result = await getSeoPageDiagnostics(prisma, { pageType: 'service' });
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.pageType, 'service');
});

test('response shape contains no PII fields', async () => {
  const prisma = createDiagnosticsPrisma();
  const result = await getSeoPageDiagnostics(prisma);
  const serialised = JSON.stringify(result);
  assert.doesNotMatch(serialised, /email/i);
  assert.doesNotMatch(serialised, /phone/i);
  assert.doesNotMatch(serialised, /name/i);
  assert.ok(result.items[0]?.sources.includes('GSC'));
});
