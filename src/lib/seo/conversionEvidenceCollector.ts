/**
 * Collects aggregate conversion evidence from chat, forms and leads.
 * Never loads chat message bodies or PII fields into SEO outputs.
 */

import type { PrismaClient } from '@prisma/client';
import {
  isAnalyticallyQualifiedChat,
  mapChatStatusToConversationOutcome,
  mapLeadQualityToConversionSignal,
  mapLeadStatusToProposalConversion,
  mapReviewLeadStatusToLeadQuality,
  type SeoConversionType,
  type SeoLeadQuality,
} from './conversionTaxonomies.ts';
import {
  buildJourneyDedupKey,
  extractUtmFromJson,
  toMetricDateString,
} from './conversionAttribution.ts';

export type RawConversionEvidence = {
  recordId: string;
  metricDate: string;
  journeyKey: string;
  conversionTypes: SeoConversionType[];
  firstTouch: {
    page: string | null;
    source: string | null;
    medium: string | null;
  };
  lastTouch: {
    page: string | null;
    source: string | null;
    medium: string | null;
  };
  leadQuality: SeoLeadQuality;
  attributedValueMinor: number;
  currency: string;
};

export type CollectConversionEvidenceOptions = {
  dateFrom: string;
  dateTo: string;
  seoPageId?: number | null;
  pagePathFilter?: string | null;
};

function dateRangeFilter(dateFrom: string, dateTo: string) {
  return {
    gte: new Date(`${dateFrom}T00:00:00.000Z`),
    lte: new Date(`${dateTo}T23:59:59.999Z`),
  };
}

function pushConversionTypes(
  target: SeoConversionType[],
  ...types: Array<SeoConversionType | null | undefined>
) {
  for (const type of types) {
    if (type && !target.includes(type)) target.push(type);
  }
}

function matchesPageFilter(
  pages: Array<string | null | undefined>,
  pagePathFilter: string | null | undefined,
): boolean {
  if (!pagePathFilter) return true;
  const needle = pagePathFilter.trim();
  if (!needle) return true;
  return pages.some((page) => page?.includes(needle));
}

export async function collectConversionEvidence(
  prisma: PrismaClient,
  options: CollectConversionEvidenceOptions,
): Promise<RawConversionEvidence[]> {
  const { dateFrom, dateTo } = options;
  const createdAt = dateRangeFilter(dateFrom, dateTo);
  const records: RawConversionEvidence[] = [];

  const chatSessions = await prisma.chatSession.findMany({
    where: { createdAt },
    select: {
      id: true,
      createdAt: true,
      status: true,
      firstLandingPage: true,
      currentPageUrl: true,
      utmSource: true,
      utmMedium: true,
      email: true,
      name: true,
      serviceInterest: true,
      appointments: {
        select: { id: true, status: true, createdAt: true },
      },
    },
  });

  for (const session of chatSessions) {
    if (
      !matchesPageFilter(
        [session.firstLandingPage, session.currentPageUrl],
        options.pagePathFilter,
      )
    ) {
      continue;
    }

    const outcome = mapChatStatusToConversationOutcome({
      status: session.status,
      hasContactDetails: Boolean(session.email?.trim() || session.name?.trim()),
      hasServiceInterest: Boolean(session.serviceInterest?.trim()),
      hasPendingAppointment: session.appointments.some((a) => a.status === 'pending'),
    });

    const conversionTypes: SeoConversionType[] = ['chat_initiated'];
    if (isAnalyticallyQualifiedChat(outcome)) conversionTypes.push('qualified_lead');
    if (session.appointments.length > 0) conversionTypes.push('booking_requested');
    if (session.status.toLowerCase() === 'booked_call') conversionTypes.push('booking_completed');

    records.push({
      recordId: `chat:${session.id}`,
      metricDate: toMetricDateString(session.createdAt),
      journeyKey: buildJourneyDedupKey({ chatSessionId: session.id, fallbackId: session.id }),
      conversionTypes,
      firstTouch: {
        page: session.firstLandingPage,
        source: session.utmSource,
        medium: session.utmMedium,
      },
      lastTouch: {
        page: session.currentPageUrl ?? session.firstLandingPage,
        source: session.utmSource,
        medium: session.utmMedium,
      },
      leadQuality: isAnalyticallyQualifiedChat(outcome) ? 'potentially_qualified' : 'unknown',
      attributedValueMinor: 0,
      currency: 'GBP',
    });
  }

  const formResponses = await prisma.formResponse.findMany({
    where: { createdAt },
    select: {
      id: true,
      createdAt: true,
      commercialContext: true,
    },
  });

  for (const form of formResponses) {
    const context =
      form.commercialContext && typeof form.commercialContext === 'object'
        ? (form.commercialContext as Record<string, unknown>)
        : {};
    const sourcePagePath =
      typeof context.sourcePagePath === 'string' ? context.sourcePagePath : null;
    const firstAttr = extractUtmFromJson(context.firstAttribution);
    const latestAttr = extractUtmFromJson(context.latestAttribution);

    if (!matchesPageFilter([sourcePagePath], options.pagePathFilter)) continue;

    records.push({
      recordId: `form:${form.id}`,
      metricDate: toMetricDateString(form.createdAt),
      journeyKey: buildJourneyDedupKey({ fallbackId: `form:${form.id}` }),
      conversionTypes: ['contact_submitted'],
      firstTouch: {
        page: sourcePagePath,
        source: firstAttr.source,
        medium: firstAttr.medium,
      },
      lastTouch: {
        page: sourcePagePath,
        source: latestAttr.source ?? firstAttr.source,
        medium: latestAttr.medium ?? firstAttr.medium,
      },
      leadQuality: 'unknown',
      attributedValueMinor: 0,
      currency: 'GBP',
    });
  }

  const reviewLeads = await prisma.digitalSystemsReviewLead.findMany({
    where: { createdAt },
    select: {
      id: true,
      submissionId: true,
      createdAt: true,
      status: true,
      landingPage: true,
      sourcePagePath: true,
      pageLocation: true,
      chatSessionId: true,
      journeyReference: true,
      sessionReference: true,
      firstTouchSource: true,
      firstTouchMedium: true,
      latestTouchSource: true,
      latestTouchMedium: true,
      proposalValueMinor: true,
      proposalCurrency: true,
      wonAt: true,
      proposalSentAt: true,
      qualifiedAt: true,
    },
  });

  for (const lead of reviewLeads) {
    if (
      !matchesPageFilter(
        [lead.landingPage, lead.sourcePagePath, lead.pageLocation],
        options.pagePathFilter,
      )
    ) {
      continue;
    }

    const leadQuality = mapReviewLeadStatusToLeadQuality(lead.status);
    const conversionTypes: SeoConversionType[] = ['systems_review_requested'];
    pushConversionTypes(
      conversionTypes,
      mapLeadQualityToConversionSignal(leadQuality),
      lead.proposalSentAt ? 'proposal_created' : null,
      lead.wonAt ? 'opportunity_won' : null,
    );
    if (lead.qualifiedAt) conversionTypes.push('qualified_lead');

    records.push({
      recordId: `review:${lead.id}`,
      metricDate: toMetricDateString(lead.createdAt),
      journeyKey: buildJourneyDedupKey({
        journeyReference: lead.journeyReference,
        sessionReference: lead.sessionReference,
        chatSessionId: lead.chatSessionId,
        fallbackId: lead.submissionId,
      }),
      conversionTypes,
      firstTouch: {
        page: lead.landingPage ?? lead.sourcePagePath,
        source: lead.firstTouchSource,
        medium: lead.firstTouchMedium,
      },
      lastTouch: {
        page: lead.pageLocation ?? lead.sourcePagePath ?? lead.landingPage,
        source: lead.latestTouchSource ?? lead.firstTouchSource,
        medium: lead.latestTouchMedium ?? lead.firstTouchMedium,
      },
      leadQuality,
      attributedValueMinor: lead.wonAt ? (lead.proposalValueMinor ?? 0) : 0,
      currency: lead.proposalCurrency ?? 'GBP',
    });
  }

  if (options.seoPageId != null) {
    const page = await prisma.seoPage.findUnique({
      where: { id: options.seoPageId },
      select: { path: true, canonicalUrl: true },
    });
    if (page) {
      return records.filter((record) =>
        matchesPageFilter(
          [record.firstTouch.page, record.lastTouch.page, page.path],
          page.path,
        ),
      );
    }
  }

  return records;
}

/** Safe DTO for external APIs — no PII, no raw messages. */
export function toSafeConversionEvidenceSummary(records: RawConversionEvidence[]) {
  return records.map((record) => ({
    metricDate: record.metricDate,
    conversionTypes: record.conversionTypes,
    channelFirst: record.firstTouch.medium ?? record.firstTouch.source ?? 'unknown',
    channelLast: record.lastTouch.medium ?? record.lastTouch.source ?? 'unknown',
    leadQuality: record.leadQuality,
    hasLandingPage: Boolean(record.firstTouch.page || record.lastTouch.page),
  }));
}
