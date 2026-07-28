import type { PrismaClient } from '@prisma/client';

export type DuplicateDetectionInput = {
  workEmail: string;
  company?: string | null;
  website?: string | null;
  journeyReference?: string | null;
  sessionReference?: string | null;
  serviceArea?: string | null;
  selectedPlanSlug?: string | null;
  sourceForm?: string | null;
  submittedAt?: Date;
};

export type DuplicateDetectionResult = {
  duplicateOfLeadId: number | null;
  duplicateConfidence: 'none' | 'low' | 'possible' | 'high';
  reasons: string[];
};

const EMAIL_WINDOW_HOURS = 72;
const EMAIL_SERVICE_WINDOW_HOURS = 24;

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normaliseCompanyDomain(company: string | null | undefined, website: string | null | undefined): string | null {
  const source = website?.trim() || company?.trim();
  if (!source) return null;
  try {
    const url = source.startsWith('http') ? source : `https://${source}`;
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    const lower = source.toLowerCase();
    if (lower.includes('.')) return lower.replace(/^www\./, '');
    return null;
  }
}

function hoursBetween(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60);
}

export async function detectDuplicateReviewLead(
  prisma: Pick<PrismaClient, 'digitalSystemsReviewLead'>,
  input: DuplicateDetectionInput,
  excludeSubmissionId?: string,
): Promise<DuplicateDetectionResult> {
  const reasons: string[] = [];
  const email = normaliseEmail(input.workEmail);
  const submittedAt = input.submittedAt ?? new Date();

  if (input.journeyReference) {
    const journeyMatch = await prisma.digitalSystemsReviewLead.findFirst({
      where: {
        journeyReference: input.journeyReference,
        ...(excludeSubmissionId ? { submissionId: { not: excludeSubmissionId } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (journeyMatch) {
      return {
        duplicateOfLeadId: journeyMatch.id,
        duplicateConfidence: 'high',
        reasons: ['Exact journey reference match'],
      };
    }
  }

  const recentByEmail = await prisma.digitalSystemsReviewLead.findMany({
    where: {
      workEmail: email,
      ...(excludeSubmissionId ? { submissionId: { not: excludeSubmissionId } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      serviceArea: true,
      selectedPlanSlug: true,
    },
  });

  for (const candidate of recentByEmail) {
    const ageHours = hoursBetween(submittedAt, candidate.createdAt);

    if (
      input.serviceArea
      && candidate.serviceArea === input.serviceArea
      && ageHours <= EMAIL_SERVICE_WINDOW_HOURS
    ) {
      reasons.push('Same email and service within 24 hours');
      return {
        duplicateOfLeadId: candidate.id,
        duplicateConfidence: 'high',
        reasons,
      };
    }

    if (
      input.selectedPlanSlug
      && candidate.selectedPlanSlug === input.selectedPlanSlug
      && input.serviceArea
      && candidate.serviceArea === input.serviceArea
      && ageHours <= EMAIL_SERVICE_WINDOW_HOURS
    ) {
      reasons.push('Same email, plan and service within 24 hours');
      return {
        duplicateOfLeadId: candidate.id,
        duplicateConfidence: 'high',
        reasons,
      };
    }

    if (ageHours <= EMAIL_WINDOW_HOURS) {
      reasons.push('Same email within 72 hours');
      return {
        duplicateOfLeadId: candidate.id,
        duplicateConfidence: 'possible',
        reasons,
      };
    }
  }

  const domain = normaliseCompanyDomain(input.company, input.website);
  if (domain) {
    const domainMatches = await prisma.digitalSystemsReviewLead.findMany({
      where: {
        normalisedCompanyDomain: domain,
        workEmail: { not: email },
        ...(excludeSubmissionId ? { submissionId: { not: excludeSubmissionId } } : {}),
      },
      take: 1,
      select: { id: true },
    });
    if (domainMatches.length > 0) {
      reasons.push('Same company domain with different contact details');
      return {
        duplicateOfLeadId: domainMatches[0].id,
        duplicateConfidence: 'low',
        reasons,
      };
    }
  }

  return { duplicateOfLeadId: null, duplicateConfidence: 'none', reasons: [] };
}

export function normaliseLeadEmail(email: string): string {
  return normaliseEmail(email);
}

export function normaliseLeadCompanyDomain(
  company: string | null | undefined,
  website: string | null | undefined,
): string | null {
  return normaliseCompanyDomain(company, website);
}
