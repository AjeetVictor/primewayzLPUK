import type { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { calculateOneBusinessDaySlaDueAt } from '../leads/businessCalendar.ts';
import { detectDuplicateReviewLead, normaliseLeadCompanyDomain, normaliseLeadEmail } from '../leads/duplicates.ts';
import { leadStatusToDbValue } from '../leads/statuses.ts';
import { validateLeadSubmission } from '../leads/validation.ts';
import { extractAttributionFields } from '../pricing/enquiryContext.ts';
import type { NormalizedDigitalSystemsReviewLead } from './validateReviewLead.ts';

export type EnrichedReviewLeadCreateData = Prisma.DigitalSystemsReviewLeadCreateInput;

export async function enrichReviewLeadForPersistence(
  prisma: Pick<PrismaClient, 'digitalSystemsReviewLead'>,
  lead: NormalizedDigitalSystemsReviewLead,
): Promise<EnrichedReviewLeadCreateData> {
  const validation = validateLeadSubmission({
    name: lead.name,
    workEmail: lead.workEmail,
    company: lead.company,
    website: lead.website,
    context: lead.context,
    journeyReference: lead.journeyReference,
    submissionId: lead.submissionId,
  });

  const duplicate = await detectDuplicateReviewLead(
    prisma,
    {
      workEmail: lead.workEmail,
      company: lead.company,
      website: lead.website,
      journeyReference: lead.journeyReference,
      sessionReference: lead.sessionReference,
      serviceArea: lead.serviceArea,
      selectedPlanSlug: lead.selectedPlanSlug,
      sourceForm: lead.sourceLocation,
      submittedAt: lead.consentAt,
    },
    lead.submissionId,
  );

  const firstTouch = extractAttributionFields(lead.firstTouchAttribution);
  const latestTouch = extractAttributionFields(lead.latestTouchAttribution);

  const initialStatus =
    validation.outcome === 'invalid_test'
      ? leadStatusToDbValue('LOST')
      : validation.outcome === 'needs_review'
        ? leadStatusToDbValue('NEW')
        : leadStatusToDbValue('VALIDATED');

  const slaDueAt =
    validation.outcome === 'valid' || validation.outcome === 'needs_review'
      ? calculateOneBusinessDaySlaDueAt(lead.consentAt)
      : null;

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
    selectedPlanSlug: lead.selectedPlanSlug,
    selectedPlanName: lead.selectedPlanName,
    displayedPrice: lead.displayedPrice,
    billingPeriod: lead.billingPeriod,
    pricingPolicyVersion: lead.pricingPolicyVersion,
    displayedPriceAtSelection: lead.displayedPriceAtSelection,
    serviceInterest: lead.serviceInterest ?? lead.serviceArea,
    journeyType: lead.journeyType,
    sourcePagePath: lead.sourcePagePath ?? lead.landingPage,
    pageLocation: lead.pageLocation,
    sourceSection: lead.sourceSection,
    recommendedNextStepCommercial: lead.recommendedNextStepCommercial ?? lead.preferredNextStep,
    firstTouchSource: firstTouch.source,
    firstTouchMedium: firstTouch.medium,
    firstTouchCampaign: firstTouch.campaign,
    firstTouchContent: firstTouch.content,
    firstTouchTerm: firstTouch.term,
    latestTouchSource: latestTouch.source,
    latestTouchMedium: latestTouch.medium,
    latestTouchCampaign: latestTouch.campaign,
    latestTouchContent: latestTouch.content,
    latestTouchTerm: latestTouch.term,
    journeyReference: lead.journeyReference ?? lead.chatSessionId,
    sessionReference: lead.sessionReference ?? lead.chatSessionId,
    status: initialStatus,
    notificationStatus: 'pending',
    statusUpdatedAt: lead.consentAt,
    validatedAt: validation.outcome === 'valid' ? lead.consentAt : null,
    slaDueAt,
    validationScore: validation.score,
    validationFlags: validation.flags,
    validationOutcome: validation.outcome,
    duplicateOfLeadId: duplicate.duplicateOfLeadId,
    duplicateConfidence: duplicate.duplicateConfidence,
    normalisedWorkEmail: normaliseLeadEmail(lead.workEmail),
    normalisedCompanyDomain: normaliseLeadCompanyDomain(lead.company, lead.website),
    statusHistory: [
      {
        fromStatus: 'NEW',
        toStatus: initialStatus.toUpperCase(),
        transitionedAt: lead.consentAt.toISOString(),
        note: validation.outcome !== 'valid' ? validation.reasons.join('; ') : undefined,
      },
    ],
  };
}
