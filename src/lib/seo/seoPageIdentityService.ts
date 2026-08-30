/**
 * Persist canonical SEO pages and source aliases (idempotent upsert).
 *
 * Metadata precedence (highest wins; null never overwrites existing):
 * 1. MANUAL / human-reviewed
 * 2. CMS
 * 3. SYSTEM (route registry)
 * 4. GSC / GA4 / INDEXING / GITHUB
 * 5. CHAT / LEAD observed metadata
 */

import type { Prisma, PrismaClient, SeoPageAliasSource } from '@prisma/client';
import { Prisma as PrismaNamespace } from '@prisma/client';
import {
  classifySeoPagePath,
  hashSeoUrl,
  normaliseSeoPageUrl,
  type SeoUrlNormalisationResult,
} from './seoUrlNormalization.ts';

const METADATA_SOURCE_RANK: Record<SeoPageAliasSource, number> = {
  MANUAL: 100,
  CMS: 90,
  SYSTEM: 80,
  GITHUB: 70,
  INDEXING: 65,
  GSC: 60,
  GA4: 55,
  LEAD: 40,
  CHAT: 30,
};

export type SeoPageMetadataInput = {
  pageType?: string | null;
  serviceArea?: string | null;
  cmsEntityType?: string | null;
  cmsEntityId?: string | null;
  title?: string | null;
};

export type RegisterSeoPageAliasInput = {
  observedUrl: string;
  source: SeoPageAliasSource;
  seenAt?: Date;
} & SeoPageMetadataInput;

export type RegisterSeoPageAliasResult =
  | {
      ok: true;
      seoPageId: number;
      createdPage: boolean;
      createdAlias: boolean;
      canonicalUrl: string;
    }
  | {
      ok: false;
      reason: string;
      observedUrl: string;
    };

export type ResolveSeoPageByObservedUrlResult =
  | { ok: true; seoPageId: number; canonicalUrl: string }
  | { ok: false; reason: string; observedUrl: string };

function inferPageMetadataSource(page: {
  cmsEntityId?: string | null;
  cmsEntityType?: string | null;
}): SeoPageAliasSource | null {
  if (page.cmsEntityId || page.cmsEntityType) return 'CMS';
  return null;
}

function metadataRank(source: SeoPageAliasSource): number {
  return METADATA_SOURCE_RANK[source] ?? 0;
}

function shouldReplaceMetadata(
  incomingSource: SeoPageAliasSource,
  existingSource: SeoPageAliasSource | null,
  incomingValue: string | null | undefined,
  existingValue: string | null | undefined,
): boolean {
  if (incomingValue == null || incomingValue === '') return false;
  if (existingValue == null || existingValue === '') return true;
  if (existingSource == null) return true;
  return metadataRank(incomingSource) >= metadataRank(existingSource);
}

function mergePageMetadata(
  existing: {
    pageType: string | null;
    serviceArea: string | null;
    cmsEntityType: string | null;
    cmsEntityId: string | null;
    title: string | null;
  },
  incoming: SeoPageMetadataInput,
  incomingSource: SeoPageAliasSource,
  existingSource: SeoPageAliasSource | null,
): SeoPageMetadataInput {
  return {
    pageType: shouldReplaceMetadata(
      incomingSource,
      existingSource,
      incoming.pageType,
      existing.pageType,
    )
      ? incoming.pageType ?? existing.pageType
      : existing.pageType,
    serviceArea: shouldReplaceMetadata(
      incomingSource,
      existingSource,
      incoming.serviceArea,
      existing.serviceArea,
    )
      ? incoming.serviceArea ?? existing.serviceArea
      : existing.serviceArea,
    cmsEntityType: shouldReplaceMetadata(
      incomingSource,
      existingSource,
      incoming.cmsEntityType,
      existing.cmsEntityType,
    )
      ? incoming.cmsEntityType ?? existing.cmsEntityType
      : existing.cmsEntityType,
    cmsEntityId: shouldReplaceMetadata(
      incomingSource,
      existingSource,
      incoming.cmsEntityId,
      existing.cmsEntityId,
    )
      ? incoming.cmsEntityId ?? existing.cmsEntityId
      : existing.cmsEntityId,
    title: shouldReplaceMetadata(incomingSource, existingSource, incoming.title, existing.title)
      ? incoming.title ?? existing.title
      : existing.title,
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof PrismaNamespace.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

async function findPageByCanonicalHash(
  prisma: PrismaClient,
  canonicalUrlHash: string,
) {
  return prisma.seoPage.findUnique({ where: { canonicalUrlHash } });
}

export async function findOrCreateSeoPageFromUrl(
  prisma: PrismaClient,
  input: RegisterSeoPageAliasInput,
): Promise<RegisterSeoPageAliasResult> {
  return registerSeoPageAlias(prisma, input);
}

export async function recordSeoPageAlias(
  prisma: PrismaClient,
  input: RegisterSeoPageAliasInput,
): Promise<RegisterSeoPageAliasResult> {
  return registerSeoPageAlias(prisma, input);
}

export async function resolveSeoPageByObservedUrl(
  prisma: PrismaClient,
  observedUrl: string,
  source?: SeoPageAliasSource,
): Promise<ResolveSeoPageByObservedUrlResult> {
  const normalised = normaliseSeoPageUrl(observedUrl);
  if (!normalised.ok) {
    return { ok: false, reason: normalised.reason, observedUrl };
  }

  const observedUrlHash = hashSeoUrl(observedUrl.trim());
  if (source) {
    const alias = await prisma.seoPageAlias.findUnique({
      where: {
        source_observedUrlHash: { source, observedUrlHash },
      },
      include: { seoPage: true },
    });
    if (alias) {
      const page =
        'seoPage' in alias && alias.seoPage
          ? alias.seoPage
          : await prisma.seoPage.findUnique({ where: { id: alias.seoPageId } });
      if (page) {
        return {
          ok: true,
          seoPageId: alias.seoPageId,
          canonicalUrl: page.canonicalUrl,
        };
      }
    }
  }

  const page = await findPageByCanonicalHash(prisma, normalised.canonicalUrlHash);
  if (page) {
    return { ok: true, seoPageId: page.id, canonicalUrl: page.canonicalUrl };
  }

  return { ok: false, reason: 'not_found', observedUrl };
}

export async function updateSeoPageMetadata(
  prisma: PrismaClient,
  input: {
    seoPageId: number;
    source: SeoPageAliasSource;
    metadata: SeoPageMetadataInput;
  },
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const page = await prisma.seoPage.findUnique({ where: { id: input.seoPageId } });
  if (!page) return { ok: false, reason: 'not_found' };

  const merged = mergePageMetadata(page, input.metadata, input.source, 'MANUAL');
  await prisma.seoPage.update({
    where: { id: input.seoPageId },
    data: {
      pageType: merged.pageType,
      serviceArea: merged.serviceArea,
      cmsEntityType: merged.cmsEntityType,
      cmsEntityId: merged.cmsEntityId,
      title: merged.title,
      active: true,
      lastSeenAt: new Date(),
    },
  });
  return { ok: true };
}

export async function registerSeoPageAlias(
  prisma: PrismaClient,
  input: RegisterSeoPageAliasInput,
): Promise<RegisterSeoPageAliasResult> {
  const normalised = normaliseSeoPageUrl(input.observedUrl, { rejectExcludedPaths: true });
  if (!normalised.ok) {
    return { ok: false, reason: normalised.reason, observedUrl: input.observedUrl };
  }

  const seenAt = input.seenAt ?? new Date();
  const observedUrlHash = hashSeoUrl(input.observedUrl.trim());
  const inferredPageType = input.pageType ?? classifySeoPagePath(normalised.path);
  const metadata: SeoPageMetadataInput = {
    pageType: inferredPageType,
    serviceArea: input.serviceArea ?? null,
    cmsEntityType: input.cmsEntityType ?? null,
    cmsEntityId: input.cmsEntityId ?? null,
    title: input.title ?? null,
  };

  const pageData = {
    canonicalUrl: normalised.canonicalUrl,
    canonicalUrlHash: normalised.canonicalUrlHash,
    host: normalised.host,
    path: normalised.path,
    pageType: metadata.pageType,
    serviceArea: metadata.serviceArea,
    cmsEntityType: metadata.cmsEntityType,
    cmsEntityId: metadata.cmsEntityId,
    title: metadata.title,
    active: true,
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
  };

  let existingPage = await findPageByCanonicalHash(prisma, normalised.canonicalUrlHash);
  let seoPageId: number;
  let createdPage = false;

  if (existingPage) {
    const merged = mergePageMetadata(
      existingPage,
      metadata,
      input.source,
      inferPageMetadataSource(existingPage),
    );
    await prisma.seoPage.update({
      where: { id: existingPage.id },
      data: {
        pageType: merged.pageType,
        serviceArea: merged.serviceArea,
        cmsEntityType: merged.cmsEntityType,
        cmsEntityId: merged.cmsEntityId,
        title: merged.title,
        active: true,
        lastSeenAt: seenAt,
      },
    });
    seoPageId = existingPage.id;
  } else {
    try {
      const created = await prisma.seoPage.create({ data: pageData });
      seoPageId = created.id;
      createdPage = true;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      existingPage = await findPageByCanonicalHash(prisma, normalised.canonicalUrlHash);
      if (!existingPage) throw error;
      seoPageId = existingPage.id;
    }
  }

  const existingAlias = await prisma.seoPageAlias.findUnique({
    where: {
      source_observedUrlHash: {
        source: input.source,
        observedUrlHash,
      },
    },
  });

  let createdAlias = false;
  if (existingAlias) {
    await prisma.seoPageAlias.update({
      where: { id: existingAlias.id },
      data: {
        seoPageId,
        observedUrl: input.observedUrl,
        normalisedUrl: normalised.normalisedUrl,
        normalisedUrlHash: normalised.normalisedUrlHash,
        lastSeenAt: seenAt,
      },
    });
  } else {
    try {
      await prisma.seoPageAlias.create({
        data: {
          seoPageId,
          source: input.source,
          observedUrl: input.observedUrl,
          observedUrlHash,
          normalisedUrl: normalised.normalisedUrl,
          normalisedUrlHash: normalised.normalisedUrlHash,
          firstSeenAt: seenAt,
          lastSeenAt: seenAt,
        },
      });
      createdAlias = true;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      await prisma.seoPageAlias.updateMany({
        where: {
          source: input.source,
          observedUrlHash,
        },
        data: {
          seoPageId,
          observedUrl: input.observedUrl,
          normalisedUrl: normalised.normalisedUrl,
          normalisedUrlHash: normalised.normalisedUrlHash,
          lastSeenAt: seenAt,
        },
      });
    }
  }

  return {
    ok: true,
    seoPageId,
    createdPage,
    createdAlias,
    canonicalUrl: normalised.canonicalUrl,
  };
}

export function classifyNormalisationFailure(
  result: Extract<SeoUrlNormalisationResult, { ok: false }>,
): 'foreign_host' | 'excluded_path' | 'invalid' {
  if (result.reason === 'foreign_host') return 'foreign_host';
  if (result.reason === 'excluded_path') return 'excluded_path';
  return 'invalid';
}

export { METADATA_SOURCE_RANK };
