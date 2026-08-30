/**
 * Persist canonical SEO pages and source aliases (idempotent upsert).
 */

import type { PrismaClient, SeoPageAliasSource } from '@prisma/client';
import { normaliseSeoPageUrl, type SeoUrlNormalisationResult } from './seoUrlNormalization.ts';

export type RegisterSeoPageAliasInput = {
  observedUrl: string;
  source: SeoPageAliasSource;
  pageType?: string | null;
  serviceArea?: string | null;
  cmsEntityType?: string | null;
  cmsEntityId?: string | null;
  title?: string | null;
  seenAt?: Date;
};

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

export async function registerSeoPageAlias(
  prisma: PrismaClient,
  input: RegisterSeoPageAliasInput,
): Promise<RegisterSeoPageAliasResult> {
  const normalised = normaliseSeoPageUrl(input.observedUrl);
  if (!normalised.ok) {
    return { ok: false, reason: normalised.reason, observedUrl: input.observedUrl };
  }

  const seenAt = input.seenAt ?? new Date();
  const pageData = {
    canonicalUrl: normalised.canonicalUrl,
    canonicalUrlHash: normalised.canonicalUrlHash,
    host: normalised.host,
    path: normalised.path,
    pageType: input.pageType ?? null,
    serviceArea: input.serviceArea ?? null,
    cmsEntityType: input.cmsEntityType ?? null,
    cmsEntityId: input.cmsEntityId ?? null,
    title: input.title ?? null,
    active: true,
  };

  const existingPage = await prisma.seoPage.findUnique({
    where: { canonicalUrlHash: normalised.canonicalUrlHash },
  });

  let seoPageId: number;
  let createdPage = false;

  if (existingPage) {
    await prisma.seoPage.update({
      where: { id: existingPage.id },
      data: {
        pageType: pageData.pageType ?? existingPage.pageType,
        serviceArea: pageData.serviceArea ?? existingPage.serviceArea,
        cmsEntityType: pageData.cmsEntityType ?? existingPage.cmsEntityType,
        cmsEntityId: pageData.cmsEntityId ?? existingPage.cmsEntityId,
        title: pageData.title ?? existingPage.title,
        active: true,
      },
    });
    seoPageId = existingPage.id;
  } else {
    const created = await prisma.seoPage.create({ data: pageData });
    seoPageId = created.id;
    createdPage = true;
  }

  const existingAlias = await prisma.seoPageAlias.findUnique({
    where: {
      source_normalisedUrlHash: {
        source: input.source,
        normalisedUrlHash: normalised.normalisedUrlHash,
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
        normalisedUrl: normalised.canonicalUrl,
        lastSeenAt: seenAt,
      },
    });
  } else {
    await prisma.seoPageAlias.create({
      data: {
        seoPageId,
        source: input.source,
        observedUrl: input.observedUrl,
        normalisedUrl: normalised.canonicalUrl,
        normalisedUrlHash: normalised.normalisedUrlHash,
        firstSeenAt: seenAt,
        lastSeenAt: seenAt,
      },
    });
    createdAlias = true;
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
): 'foreign_host' | 'invalid' {
  if (result.reason === 'foreign_host') return 'foreign_host';
  return 'invalid';
}
