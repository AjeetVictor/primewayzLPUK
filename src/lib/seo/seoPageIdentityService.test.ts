/**
 * Tests for SEO page identity registration (in-memory prisma mock).
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import {
  findOrCreateSeoPageFromUrl,
  METADATA_SOURCE_RANK,
  recordSeoPageAlias,
  registerSeoPageAlias,
  resolveSeoPageByObservedUrl,
  updateSeoPageMetadata,
} from './seoPageIdentityService.ts';
import { normaliseSeoPageUrl } from './seoUrlNormalization.ts';

function createIdentityPrisma() {
  let nextPageId = 1;
  let nextAliasId = 1;
  const pages = new Map<string, Record<string, unknown>>();
  const pagesById = new Map<number, Record<string, unknown>>();
  const aliases = new Map<string, Record<string, unknown>>();

  const prisma = {
    seoPage: {
      findUnique: async ({
        where,
      }: {
        where: { canonicalUrlHash?: string; id?: number };
      }) => {
        if (where.id != null) return pagesById.get(where.id) ?? null;
        return pages.get(where.canonicalUrlHash!) ?? null;
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextPageId++, ...data };
        pages.set(String(data.canonicalUrlHash), row);
        pagesById.set(Number(row.id), row);
        return row;
      },
      update: async ({
        where,
        data,
      }: {
        where: { id: number };
        data: Record<string, unknown>;
      }) => {
        const row = pagesById.get(where.id)!;
        Object.assign(row, data);
        return row;
      },
    },
    seoPageAlias: {
      findUnique: async ({
        where,
        include,
      }: {
        where: {
          source_observedUrlHash: { source: string; observedUrlHash: string };
        };
        include?: { seoPage?: boolean };
      }) => {
        const row =
          aliases.get(
            `${where.source_observedUrlHash.source}|${where.source_observedUrlHash.observedUrlHash}`,
          ) ?? null;
        if (!row || !include?.seoPage) return row;
        const page = pagesById.get(Number(row.seoPageId));
        return { ...row, seoPage: page };
      },
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextAliasId++, ...data };
        aliases.set(`${String(data.source)}|${String(data.observedUrlHash)}`, row);
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
      updateMany: async ({
        where,
        data,
      }: {
        where: { source: string; observedUrlHash: string };
        data: Record<string, unknown>;
      }) => {
        const key = `${where.source}|${where.observedUrlHash}`;
        const row = aliases.get(key);
        if (row) Object.assign(row, data);
        return { count: row ? 1 : 0 };
      },
    },
  };

  return { prisma: prisma as unknown as PrismaClient, pages, aliases, pagesById };
}

test('registerSeoPageAlias creates page and alias for valid Primewayz URL', async () => {
  const { prisma, pages, aliases } = createIdentityPrisma();
  const result = await registerSeoPageAlias(prisma, {
    observedUrl: 'https://uk.primewayz.com/services?utm_source=x',
    source: 'GSC',
    pageType: 'service',
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.createdPage, true);
  assert.equal(result.createdAlias, true);
  assert.equal(pages.size, 1);
  assert.equal(aliases.size, 1);
});

test('re-registering tracking variant updates alias without duplicating page rows', async () => {
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
  assert.equal(pages.size, 1);
  assert.equal(aliases.size, 2);
});

test('foreign host registration is rejected', async () => {
  const { prisma } = createIdentityPrisma();
  const result = await registerSeoPageAlias(prisma, {
    observedUrl: 'https://example.com/page',
    source: 'GSC',
  });
  assert.equal(result.ok, false);
});

test('excluded admin path registration is rejected', async () => {
  const { prisma } = createIdentityPrisma();
  const result = await registerSeoPageAlias(prisma, {
    observedUrl: '/admin',
    source: 'GSC',
  });
  assert.equal(result.ok, false);
});

test('CMS title is preserved over later chat observation', async () => {
  const { prisma, pagesById } = createIdentityPrisma();
  await registerSeoPageAlias(prisma, {
    observedUrl: '/blog/example',
    source: 'CMS',
    pageType: 'blog_article',
    cmsEntityType: 'cms_blog_post',
    cmsEntityId: 'example',
    title: 'CMS Title',
  });
  await registerSeoPageAlias(prisma, {
    observedUrl: '/blog/example',
    source: 'CHAT',
    title: 'Chat Title',
  });
  const page = [...pagesById.values()][0];
  assert.equal(page.title, 'CMS Title');
});

test('lastSeenAt updates on repeated alias observation', async () => {
  const { prisma, aliases } = createIdentityPrisma();
  const seenAt = new Date('2026-01-01T00:00:00.000Z');
  await registerSeoPageAlias(prisma, {
    observedUrl: 'https://uk.primewayz.com/services',
    source: 'GSC',
    seenAt,
  });
  const later = new Date('2026-02-01T00:00:00.000Z');
  await registerSeoPageAlias(prisma, {
    observedUrl: 'https://uk.primewayz.com/services',
    source: 'GSC',
    seenAt: later,
  });
  const alias = [...aliases.values()][0];
  assert.equal(String(alias.lastSeenAt), String(later));
});

test('findOrCreateSeoPageFromUrl and recordSeoPageAlias are aliases', async () => {
  const { prisma } = createIdentityPrisma();
  assert.equal(typeof findOrCreateSeoPageFromUrl, 'function');
  assert.equal(typeof recordSeoPageAlias, 'function');
});

test('resolveSeoPageByObservedUrl finds canonical page', async () => {
  const { prisma } = createIdentityPrisma();
  const created = await registerSeoPageAlias(prisma, {
    observedUrl: '/services',
    source: 'CMS',
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const resolved = await resolveSeoPageByObservedUrl(prisma, '/services', 'CMS');
  assert.equal(resolved.ok, true);
  if (!resolved.ok) return;
  assert.equal(resolved.seoPageId, created.seoPageId);
});

test('updateSeoPageMetadata updates manual metadata', async () => {
  const { prisma, pagesById } = createIdentityPrisma();
  const created = await registerSeoPageAlias(prisma, {
    observedUrl: '/services',
    source: 'GSC',
  });
  assert.equal(created.ok, true);
  if (!created.ok) return;
  const updated = await updateSeoPageMetadata(prisma, {
    seoPageId: created.seoPageId,
    source: 'MANUAL',
    metadata: { title: 'Manual title' },
  });
  assert.equal(updated.ok, true);
  const page = pagesById.get(created.seoPageId);
  assert.equal(page?.title, 'Manual title');
});

test('metadata precedence ranks manual above chat', () => {
  assert.ok(METADATA_SOURCE_RANK.MANUAL > METADATA_SOURCE_RANK.CHAT);
  assert.ok(METADATA_SOURCE_RANK.CMS > METADATA_SOURCE_RANK.GSC);
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

test('duplicate canonical registration does not create a second page row', async () => {
  const { prisma, pages } = createIdentityPrisma();
  await registerSeoPageAlias(prisma, {
    observedUrl: '/about-us',
    source: 'SYSTEM',
  });
  await registerSeoPageAlias(prisma, {
    observedUrl: 'https://uk.primewayz.com/about-us',
    source: 'GSC',
  });
  assert.equal(pages.size, 1);
});
