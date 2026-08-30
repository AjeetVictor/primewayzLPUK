/**
 * Aggregate conversion evidence into daily SeoPageConversionDaily rows.
 */

import type { Prisma, PrismaClient, SeoAttributionModel } from '@prisma/client';
import {
  collectConversionEvidence,
  type CollectConversionEvidenceOptions,
  type RawConversionEvidence,
} from './conversionEvidenceCollector.ts';
import {
  pickLandingPageForModel,
  resolveLandingAttribution,
  type ResolvedAttribution,
} from './conversionAttribution.ts';
import { computeConversionBucketKeyHash } from './conversionBucketKey.ts';
import {
  ConversionRebuildLockError,
  withConversionRebuildLock,
} from './conversionRebuildLock.ts';
import type { SeoConversionType } from './conversionTaxonomies.ts';
import { registerSeoPageAlias } from './seoPageIdentityService.ts';

export type ConversionAggregationBucket = {
  metricDate: string;
  seoPageId: number | null;
  attributionModel: SeoAttributionModel;
  channelGroup: string;
  bucketKeyHash: string;
  chatsInitiated: number;
  qualifiedChats: number;
  contactForms: number;
  reviewRequests: number;
  bookingRequests: number;
  bookingsCompleted: number;
  qualifiedLeads: number;
  proposals: number;
  wonOpportunities: number;
  attributedValueMinor: number;
  currency: string;
  unknownAttributionCount: number;
};

export type ConversionRebuildPageScope =
  | { kind: 'all' }
  | { kind: 'page'; seoPageId: number }
  | { kind: 'unknown' };

export type RebuildConversionOptions = CollectConversionEvidenceOptions & {
  dryRun?: boolean;
  pageScope?: ConversionRebuildPageScope;
};

export type RebuildConversionReport = {
  dryRun: boolean;
  dateFrom: string;
  dateTo: string;
  recordsProcessed: number;
  bucketsWritten: number;
  rowsDeleted: number;
  dedupedEvents: number;
  unknownAttributionCount: number;
};

type BucketKey = string;

function bucketKey(parts: {
  metricDate: string;
  seoPageId: number | null;
  attributionModel: SeoAttributionModel;
  channelGroup: string;
}): BucketKey {
  return [
    parts.metricDate,
    parts.seoPageId ?? 'null',
    parts.attributionModel,
    parts.channelGroup,
  ].join('|');
}

function emptyBucket(
  metricDate: string,
  seoPageId: number | null,
  attributionModel: SeoAttributionModel,
  channelGroup: string,
): ConversionAggregationBucket {
  return {
    metricDate,
    seoPageId,
    attributionModel,
    channelGroup,
    bucketKeyHash: computeConversionBucketKeyHash({
      seoPageId,
      attributionModel,
      channelGroup,
    }),
    chatsInitiated: 0,
    qualifiedChats: 0,
    contactForms: 0,
    reviewRequests: 0,
    bookingRequests: 0,
    bookingsCompleted: 0,
    qualifiedLeads: 0,
    proposals: 0,
    wonOpportunities: 0,
    attributedValueMinor: 0,
    currency: 'GBP',
    unknownAttributionCount: 0,
  };
}

function incrementConversionType(
  bucket: ConversionAggregationBucket,
  type: SeoConversionType,
  record: RawConversionEvidence,
) {
  switch (type) {
    case 'chat_initiated':
      bucket.chatsInitiated += 1;
      break;
    case 'contact_submitted':
      bucket.contactForms += 1;
      break;
    case 'systems_review_requested':
      bucket.reviewRequests += 1;
      break;
    case 'booking_requested':
      bucket.bookingRequests += 1;
      break;
    case 'booking_completed':
      bucket.bookingsCompleted += 1;
      break;
    case 'qualified_lead':
      bucket.qualifiedLeads += 1;
      if (record.conversionTypes.includes('chat_initiated')) bucket.qualifiedChats += 1;
      break;
    case 'proposal_created':
      bucket.proposals += 1;
      break;
    case 'opportunity_won':
      bucket.wonOpportunities += 1;
      bucket.attributedValueMinor += record.attributedValueMinor;
      bucket.currency = record.currency || bucket.currency;
      break;
    default:
      break;
  }
}

export function aggregateConversionEvidenceRecords(
  resolved: Array<{
    record: RawConversionEvidence;
    model: SeoAttributionModel;
    attribution: ResolvedAttribution;
  }>,
): { buckets: ConversionAggregationBucket[]; dedupedEvents: number } {
  const dedupe = new Set<string>();
  let dedupedEvents = 0;
  const buckets = new Map<BucketKey, ConversionAggregationBucket>();

  for (const entry of resolved) {
    const { record, model, attribution } = entry;
    for (const conversionType of record.conversionTypes) {
      const dedupeKey = `${record.journeyKey}:${conversionType}:${model}`;
      if (dedupe.has(dedupeKey)) {
        dedupedEvents += 1;
        continue;
      }
      dedupe.add(dedupeKey);

      const key = bucketKey({
        metricDate: record.metricDate,
        seoPageId: attribution.seoPageId,
        attributionModel: model,
        channelGroup: attribution.channelGroup,
      });

      const bucket =
        buckets.get(key) ??
        emptyBucket(
          record.metricDate,
          attribution.seoPageId,
          model,
          attribution.channelGroup,
        );

      if (attribution.isUnknownLanding) bucket.unknownAttributionCount += 1;
      incrementConversionType(bucket, conversionType, record);
      buckets.set(key, bucket);
    }
  }

  return { buckets: [...buckets.values()], dedupedEvents };
}

async function resolveRecordAttribution(
  prisma: PrismaClient,
  record: RawConversionEvidence,
  model: SeoAttributionModel,
): Promise<ResolvedAttribution> {
  const page = pickLandingPageForModel(model, {
    first: record.firstTouch.page,
    last: record.lastTouch.page,
  });
  const source =
    model === 'first_touch' ? record.firstTouch.source : record.lastTouch.source;
  const medium =
    model === 'first_touch' ? record.firstTouch.medium : record.lastTouch.medium;

  return resolveLandingAttribution(page, source, medium, async (url) => {
    const registered = await registerSeoPageAlias(prisma, {
      observedUrl: url,
      source: 'LEAD',
      pageType: 'landing',
    });
    return registered.ok ? registered.seoPageId : null;
  }) as Promise<ResolvedAttribution>;
}

export function resolveConversionRebuildPageScope(
  options: CollectConversionEvidenceOptions & { pageScope?: ConversionRebuildPageScope },
): ConversionRebuildPageScope {
  if (options.pageScope) return options.pageScope;
  if (options.seoPageId != null) {
    return { kind: 'page', seoPageId: options.seoPageId };
  }
  return { kind: 'all' };
}

export function filterBucketsForPageScope(
  buckets: ConversionAggregationBucket[],
  pageScope: ConversionRebuildPageScope,
): ConversionAggregationBucket[] {
  switch (pageScope.kind) {
    case 'page':
      return buckets.filter((bucket) => bucket.seoPageId === pageScope.seoPageId);
    case 'unknown':
      return buckets.filter((bucket) => bucket.seoPageId === null);
    default:
      return buckets;
  }
}

function buildDeleteWhere(
  options: CollectConversionEvidenceOptions,
  pageScope: ConversionRebuildPageScope,
): Prisma.SeoPageConversionDailyWhereInput {
  const metricDate = {
    gte: new Date(`${options.dateFrom}T00:00:00.000Z`),
    lte: new Date(`${options.dateTo}T23:59:59.999Z`),
  };

  switch (pageScope.kind) {
    case 'page':
      return { metricDate, seoPageId: pageScope.seoPageId };
    case 'unknown':
      return { metricDate, seoPageId: null };
    default:
      return { metricDate };
  }
}

function toPersistedRow(bucket: ConversionAggregationBucket) {
  return {
    metricDate: new Date(`${bucket.metricDate}T00:00:00.000Z`),
    seoPageId: bucket.seoPageId,
    bucketKeyHash: bucket.bucketKeyHash,
    attributionModel: bucket.attributionModel,
    channelGroup: bucket.channelGroup,
    chatsInitiated: bucket.chatsInitiated,
    qualifiedChats: bucket.qualifiedChats,
    contactForms: bucket.contactForms,
    reviewRequests: bucket.reviewRequests,
    bookingRequests: bucket.bookingRequests,
    bookingsCompleted: bucket.bookingsCompleted,
    qualifiedLeads: bucket.qualifiedLeads,
    proposals: bucket.proposals,
    wonOpportunities: bucket.wonOpportunities,
    attributedValueMinor: bucket.attributedValueMinor,
    currency: bucket.currency,
    unknownAttributionCount: bucket.unknownAttributionCount,
  };
}

export async function persistConversionBuckets(
  prisma: PrismaClient,
  options: CollectConversionEvidenceOptions,
  buckets: ConversionAggregationBucket[],
  pageScope: ConversionRebuildPageScope,
): Promise<{ rowsDeleted: number }> {
  const deleteWhere = buildDeleteWhere(options, pageScope);

  return withConversionRebuildLock(prisma, async () => {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.seoPageConversionDaily.deleteMany({ where: deleteWhere });
      if (buckets.length > 0) {
        await tx.seoPageConversionDaily.createMany({
          data: buckets.map(toPersistedRow),
        });
      }
      return { rowsDeleted: deleted.count };
    });
  });
}

export async function rebuildSeoPageConversions(
  prisma: PrismaClient,
  options: RebuildConversionOptions,
): Promise<RebuildConversionReport> {
  const dryRun = options.dryRun !== false;
  const pageScope = resolveConversionRebuildPageScope(options);
  const records = await collectConversionEvidence(prisma, options);

  const resolved = [];
  for (const record of records) {
    for (const model of ['first_touch', 'last_touch'] as SeoAttributionModel[]) {
      resolved.push({
        record,
        model,
        attribution: await resolveRecordAttribution(prisma, record, model),
      });
    }
  }

  const { buckets: allBuckets, dedupedEvents } = aggregateConversionEvidenceRecords(resolved);
  const buckets = filterBucketsForPageScope(allBuckets, pageScope);
  const unknownAttributionCount = buckets.reduce(
    (sum, bucket) => sum + bucket.unknownAttributionCount,
    0,
  );

  let rowsDeleted = 0;
  if (!dryRun) {
    ({ rowsDeleted } = await persistConversionBuckets(prisma, options, buckets, pageScope));
  }

  return {
    dryRun,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
    recordsProcessed: records.length,
    bucketsWritten: buckets.length,
    rowsDeleted,
    dedupedEvents,
    unknownAttributionCount,
  };
}

export { ConversionRebuildLockError };
