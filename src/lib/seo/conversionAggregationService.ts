/**
 * Aggregate conversion evidence into daily SeoPageConversionDaily rows.
 */

import type { PrismaClient, SeoAttributionModel } from '@prisma/client';
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
import type { SeoConversionType } from './conversionTaxonomies.ts';
import { registerSeoPageAlias } from './seoPageIdentityService.ts';

export type ConversionAggregationBucket = {
  metricDate: string;
  seoPageId: number | null;
  attributionModel: SeoAttributionModel;
  channelGroup: string;
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

export type RebuildConversionReport = {
  dryRun: boolean;
  dateFrom: string;
  dateTo: string;
  recordsProcessed: number;
  bucketsWritten: number;
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

export async function rebuildSeoPageConversions(
  prisma: PrismaClient,
  options: CollectConversionEvidenceOptions & { dryRun?: boolean },
): Promise<RebuildConversionReport> {
  const dryRun = options.dryRun !== false;
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

  const { buckets, dedupedEvents } = aggregateConversionEvidenceRecords(resolved);
  const unknownAttributionCount = buckets.reduce(
    (sum, bucket) => sum + bucket.unknownAttributionCount,
    0,
  );

  if (!dryRun) {
    for (const bucket of buckets) {
      const metricDate = new Date(`${bucket.metricDate}T00:00:00.000Z`);
      const data = {
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

      const existing = await prisma.seoPageConversionDaily.findFirst({
        where: {
          metricDate,
          seoPageId: bucket.seoPageId,
          attributionModel: bucket.attributionModel,
          channelGroup: bucket.channelGroup,
        },
      });

      if (existing) {
        await prisma.seoPageConversionDaily.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.seoPageConversionDaily.create({
          data: {
            metricDate,
            seoPageId: bucket.seoPageId,
            attributionModel: bucket.attributionModel,
            channelGroup: bucket.channelGroup,
            ...data,
          },
        });
      }
    }
  }

  return {
    dryRun,
    dateFrom: options.dateFrom,
    dateTo: options.dateTo,
    recordsProcessed: records.length,
    bucketsWritten: buckets.length,
    dedupedEvents,
    unknownAttributionCount,
  };
}
