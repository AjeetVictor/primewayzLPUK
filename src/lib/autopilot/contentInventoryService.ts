/**
 * Server-side existing-content inventory for Phase 2B overlap analysis.
 * Combines reliable local registries only — no URL fetching or invented fields.
 */

import type { PrismaClient } from '@prisma/client';
import { posts as staticBlogPosts } from '../../data/blog/posts.ts';
import { contentClusters } from '../../data/contentClusters/index.ts';
import { SDAAS_SUPPORTING_ARTICLES } from '../../data/sdaas/supportingArticlesRegistry.ts';
import type { AutopilotInventorySourceType } from '../../data/autopilot/types.ts';
import { asStringArray } from './topicHelpers.ts';

export type ContentInventoryItem = {
  sourceType: AutopilotInventorySourceType;
  id: string;
  slug?: string | null;
  route?: string | null;
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  primaryCategory?: string | null;
  secondaryCategories?: string[];
  tags?: string[];
  publicationStatus?: string | null;
  workflowStatus?: string | null;
  decisionStatus?: string | null;
  primaryKeyword?: string | null;
  proposedSlug?: string | null;
  contentRole?: string | null;
  clusterId?: string | null;
  clusterName?: string | null;
};

export type ContentInventory = {
  items: ContentInventoryItem[];
  counts: Record<string, number>;
  /** Stable fingerprint of inventory identities for workflow input hashing. */
  identitySignal: string;
};

function countBySource(items: ContentInventoryItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.sourceType] = (counts[item.sourceType] || 0) + 1;
  }
  counts.total = items.length;
  return counts;
}

function buildStaticBlogItems(): ContentInventoryItem[] {
  return staticBlogPosts.map((post) => ({
    sourceType: 'static_blog' as const,
    id: String(post.id),
    slug: post.slug,
    route: `/blog/${post.slug}`,
    title: post.title,
    description: post.description ?? null,
    excerpt: post.excerpt ?? null,
    primaryCategory: post.primaryCategory ?? post.category ?? null,
    secondaryCategories: post.secondaryCategories ? [...post.secondaryCategories] : [],
    tags: Array.isArray(post.tags) ? [...post.tags] : [],
    publicationStatus: 'static_published',
  }));
}

function buildSdaasItems(): ContentInventoryItem[] {
  const items: ContentInventoryItem[] = [];
  const seenRoutes = new Set<string>();

  for (const cluster of Object.values(contentClusters)) {
    const assets = cluster.assets as {
      articleRegistry?: ReadonlyArray<{
        route: string;
        title: string;
        contentType: string;
        status: string;
      }>;
    };
    const registry = assets.articleRegistry ?? [];
    for (const article of registry) {
      if (!article.route || seenRoutes.has(article.route)) continue;
      seenRoutes.add(article.route);
      const slug = article.route.replace(/^\/insights\//, '').replace(/^\//, '') || null;
      items.push({
        sourceType: 'sdaas_insights',
        id: article.route,
        slug,
        route: article.route,
        title: article.title,
        contentRole: article.contentType,
        clusterId: cluster.id,
        clusterName: cluster.name,
        publicationStatus: article.status === 'live' ? 'live' : 'planned',
      });
    }
  }

  for (const article of SDAAS_SUPPORTING_ARTICLES) {
    if (!article.path || seenRoutes.has(article.path)) continue;
    seenRoutes.add(article.path);
    items.push({
      sourceType: 'sdaas_insights',
      id: article.path,
      slug: article.path.replace(/^\/insights\//, ''),
      route: article.path,
      title: article.seo?.h1 ?? null,
      contentRole: article.contentType,
      clusterId: 'sdaas',
      clusterName: 'Software Development as a Service',
      publicationStatus: 'live',
    });
  }

  return items;
}

async function buildCmsItems(prisma: PrismaClient): Promise<ContentInventoryItem[]> {
  try {
    const rows = await prisma.cmsBlogPost.findMany({
      where: { archivedAt: null },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        excerpt: true,
        category: true,
        tags: true,
        status: true,
        publishedAt: true,
        archivedAt: true,
      },
      take: 5000,
    });

    return rows.map((row) => ({
      sourceType: 'cms_blog' as const,
      id: String(row.id),
      slug: row.slug,
      route: `/blog/${row.slug}`,
      title: row.title,
      description: row.description ?? null,
      excerpt: row.excerpt ?? null,
      primaryCategory: row.category ?? null,
      tags: asStringArray(row.tags),
      publicationStatus: row.status || 'draft',
    }));
  } catch {
    return [];
  }
}

async function buildAutopilotTopicItems(
  prisma: PrismaClient,
  excludeTopicId?: number,
): Promise<ContentInventoryItem[]> {
  try {
    const rows = await prisma.autopilotTopic.findMany({
      where: {
        archivedAt: null,
        ...(excludeTopicId ? { id: { not: excludeTopicId } } : {}),
      },
      select: {
        id: true,
        workingTitle: true,
        primaryKeyword: true,
        proposedSlug: true,
        primaryCategory: true,
        topicStatus: true,
        decisionStatus: true,
        publishingStatus: true,
      },
      take: 5000,
    });

    return rows.map((row) => ({
      sourceType: 'autopilot_topic' as const,
      id: String(row.id),
      slug: row.proposedSlug,
      route: row.proposedSlug ? `/blog/${row.proposedSlug}` : null,
      title: row.workingTitle,
      primaryKeyword: row.primaryKeyword,
      proposedSlug: row.proposedSlug,
      primaryCategory: row.primaryCategory,
      publicationStatus: row.publishingStatus,
      workflowStatus: row.topicStatus,
      decisionStatus: row.decisionStatus,
    }));
  } catch {
    return [];
  }
}

async function buildKeywordCandidateItems(
  prisma: PrismaClient,
): Promise<ContentInventoryItem[]> {
  try {
    const rows = await prisma.autopilotKeywordCandidate.findMany({
      where: {
        status: { in: ['accepted', 'reviewing', 'converted'] },
      },
      select: {
        id: true,
        keyword: true,
        normalisedKeyword: true,
        status: true,
        currentUrl: true,
        convertedTopicId: true,
      },
      take: 5000,
    });

    return rows.map((row) => ({
      sourceType: 'keyword_candidate' as const,
      id: String(row.id),
      title: row.keyword,
      primaryKeyword: row.keyword,
      route: row.currentUrl,
      publicationStatus: row.status,
      workflowStatus: row.status,
    }));
  } catch {
    return [];
  }
}

function buildIdentitySignal(items: ContentInventoryItem[]): string {
  const parts = items
    .map(
      (item) =>
        `${item.sourceType}:${item.id}:${item.slug || ''}:${item.route || ''}:${item.publicationStatus || ''}`,
    )
    .sort();
  return parts.join('|');
}

/**
 * Build a combined content inventory from local registries and DB rows.
 * Failures for optional DB sources degrade gracefully to empty lists.
 */
export async function buildContentInventory(
  prisma: PrismaClient,
  options?: { excludeTopicId?: number; includeKeywordCandidates?: boolean },
): Promise<ContentInventory> {
  const includeCandidates = options?.includeKeywordCandidates !== false;

  const [cmsItems, topicItems, candidateItems] = await Promise.all([
    buildCmsItems(prisma),
    buildAutopilotTopicItems(prisma, options?.excludeTopicId),
    includeCandidates ? buildKeywordCandidateItems(prisma) : Promise.resolve([]),
  ]);

  const items: ContentInventoryItem[] = [
    ...buildStaticBlogItems(),
    ...cmsItems,
    ...buildSdaasItems(),
    ...topicItems,
    ...candidateItems,
  ];

  return {
    items,
    counts: countBySource(items),
    identitySignal: buildIdentitySignal(items),
  };
}

/** Pure static+SDaaS inventory for unit tests without a database. */
export function buildStaticContentInventoryForTests(): ContentInventory {
  const items = [...buildStaticBlogItems(), ...buildSdaasItems()];
  return {
    items,
    counts: countBySource(items),
    identitySignal: buildIdentitySignal(items),
  };
}
