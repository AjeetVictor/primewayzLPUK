/**
 * Tests for SEO page identity registration (in-memory prisma mock).
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { registerSeoPageAlias } from './seoPageIdentityService.ts';
import { normaliseSeoPageUrl } from './seoUrlNormalization.ts';

function createIdentityPrisma() {
  let nextPageId = 1;
  let nextAliasId = 1;
  const pages = new Map<string, Record<string, unknown>>();
  const aliases = new Map<string, Record<string, unknown>>();

  const prisma = {
    seoPage: {
      findUnique: async ({ where }: { where: { canonicalUrlHash: string } }) =>
        pages.get(where.canonicalUrlHash) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextPageId++, ...data };
        pages.set(String(data.canonicalUrlHash), row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) => {
        const row = [...pages.values()].find((p) => p.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
    },
    seoPageAlias: {
      findUnique: async ({
        where,
      }: {
        where: { source_normalisedUrlHash: { source: string; normalisedUrlHash: string } };
      }) =>
        aliases.get(
          `${where.source_normalisedUrlHash.source}|${where.source_normalisedUrlHash.normalisedUrlHash}`,
        ) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextAliasId++, ...data };
        aliases.set(`${String(data.source)}|${String(data.normalisedUrlHash)}`, row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) => {
        const row = [...aliases.values()].find((a) => a.id === where.id)!;
        Object.assign(row, data);
        return row;
      },
    },
  };

  return { prisma: prisma as unknown as PrismaClient, pages, aliases };
}

test('registerSeoPageAlias creates page and alias for valid Primewayz URL', async () => {
  const { prisma, pages, aliases } = createIdentityPrisma();
  const result = await registerSeoPageAlias(prisma, {
    observedUrl: 'https://uk.primewayz.com/services?utm_source=x',
    source: 'GSC',
    pageType: 'content',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.createdPage, true);
  assert.equal(result.createdAlias, true);
  assert.equal(pages.size, 1);
  assert.equal(aliases.size, 1);
});

test('re-registering same URL updates alias without duplicating page rows', async () => {
  const { prisma, pages, aliases } = createIdentityPrisma();
  const input = {
    observedUrl: 'https://uk.primewayz.com/blog/test',
    source: 'GSC' as const,
  };
  const first = await registerSeoPageAlias(prisma, input);
  const second = await registerSeoPageAlias(prisma, {
    ...input,
    observedUrl: 'https://uk.primewayz.com/blog/test?utm_campaign=y',
  });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  if (!first.ok || !second.ok) return;
  assert.equal(second.createdPage, false);
  assert.equal(second.createdAlias, false);
  assert.equal(pages.size, 1);
  assert.equal(aliases.size, 1);
});

test('foreign host registration is rejected', async () => {
  const { prisma } = createIdentityPrisma();
  const result = await registerSeoPageAlias(prisma, {
    observedUrl: 'https://example.com/page',
    source: 'GSC',
  });
  assert.equal(result.ok, false);
});

test('normalisation and registration agree on canonical hash', async () => {
  const normalised = normaliseSeoPageUrl('/services/crm');
  assert.equal(normalised.ok, true);
  if (!normalised.ok) return;
  const { prisma } = createIdentityPrisma();
  const result = await registerSeoPageAlias(prisma, {
    observedUrl: '/services/crm',
    source: 'CMS',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.canonicalUrl, normalised.canonicalUrl);
});
