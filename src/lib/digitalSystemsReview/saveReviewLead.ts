import type { Prisma, PrismaClient } from '@prisma/client';
import type { NormalizedDigitalSystemsReviewLead } from './validateReviewLead.ts';

export type ReviewLeadPersistenceDeps = {
  prisma: Pick<PrismaClient, 'digitalSystemsReviewLead'>;
};

export type SavedReviewLead = {
  id: number;
  submissionId: string;
  notificationStatus: string;
  createdAt: Date;
};

function toCreateData(lead: NormalizedDigitalSystemsReviewLead): Prisma.DigitalSystemsReviewLeadCreateInput {
  return {
    submissionId: lead.submissionId,
    name: lead.name,
    workEmail: lead.workEmail,
    company: lead.company,
    website: lead.website,
    serviceArea: lead.serviceArea,
    context: lead.context,
    preferredNextStep: lead.preferredNextStep,
    consentAt: lead.consentAt,
    firstTouchAttribution: lead.firstTouchAttribution ?? undefined,
    latestTouchAttribution: lead.latestTouchAttribution ?? undefined,
    landingPage: lead.landingPage,
    referrer: lead.referrer,
    sourceLocation: lead.sourceLocation,
    chatSessionId: lead.chatSessionId,
    status: 'new',
    notificationStatus: 'pending',
  };
}

/**
 * Persist a review lead only. Never creates or updates ChatSession.
 * Never looks up chat PII from chatSessionId.
 */
export async function saveDigitalSystemsReviewLead(
  deps: ReviewLeadPersistenceDeps,
  lead: NormalizedDigitalSystemsReviewLead,
): Promise<SavedReviewLead> {
  const saved = await deps.prisma.digitalSystemsReviewLead.create({
    data: toCreateData(lead),
    select: {
      id: true,
      submissionId: true,
      notificationStatus: true,
      createdAt: true,
    },
  });

  return saved;
}

export async function findReviewLeadBySubmissionId(
  deps: ReviewLeadPersistenceDeps,
  submissionId: string,
): Promise<SavedReviewLead | null> {
  return deps.prisma.digitalSystemsReviewLead.findUnique({
    where: { submissionId },
    select: {
      id: true,
      submissionId: true,
      notificationStatus: true,
      createdAt: true,
    },
  });
}

export async function updateReviewNotificationStatus(
  deps: ReviewLeadPersistenceDeps,
  id: number,
  update: {
    notificationStatus: 'sent' | 'failed' | 'pending';
    notificationErrorCode?: string | null;
  },
): Promise<void> {
  await deps.prisma.digitalSystemsReviewLead.update({
    where: { id },
    data: {
      notificationStatus: update.notificationStatus,
      notificationErrorCode: update.notificationErrorCode ?? null,
    },
  });
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error
    && typeof error === 'object'
    && 'code' in error
    && (error as { code?: string }).code === 'P2002',
  );
}
