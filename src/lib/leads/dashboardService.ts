import type { PrismaClient } from '@prisma/client';
import { isSlaBreached } from './businessCalendar';
import { leadStatusFromDbValue } from './statuses';

export type ConversionDashboardDateRange = {
  from: Date;
  to: Date;
};

export function resolveDashboardDateRange(preset: string, custom?: Partial<ConversionDashboardDateRange>): ConversionDashboardDateRange {
  const to = custom?.to ?? new Date();
  const from = custom?.from ?? new Date(to);

  if (preset === '7d') from.setDate(to.getDate() - 7);
  else if (preset === '30d') from.setDate(to.getDate() - 30);
  else if (preset === '90d') from.setDate(to.getDate() - 90);
  else if (custom?.from) {
    // use provided
  } else {
    from.setDate(to.getDate() - 30);
  }

  return { from, to };
}

export async function getConversionDashboardSummary(
  prisma: PrismaClient,
  range: ConversionDashboardDateRange,
) {
  const leads = await prisma.digitalSystemsReviewLead.findMany({
    where: { createdAt: { gte: range.from, lte: range.to } },
    select: {
      id: true,
      status: true,
      validationOutcome: true,
      selectedPlanSlug: true,
      serviceInterest: true,
      journeyType: true,
      firstTouchSource: true,
      latestTouchSource: true,
      firstTouchCampaign: true,
      leadOwnerId: true,
      lostReason: true,
      duplicateConfidence: true,
      proposalValueMinor: true,
      proposalCurrency: true,
      slaDueAt: true,
      firstContactedAt: true,
      followUpAt: true,
      createdAt: true,
    },
  });

  const statusCounts: Record<string, number> = {};
  const planCounts: Record<string, number> = {};
  const serviceCounts: Record<string, number> = {};
  const journeyCounts: Record<string, number> = {};
  const validationCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const ownerCounts: Record<string, number> = {};
  const lostReasonCounts: Record<string, number> = {};

  let validLeads = 0;
  let qualifiedLeads = 0;
  let proposals = 0;
  let won = 0;
  let proposalValueMinor = 0;
  let wonValueMinor = 0;

  for (const lead of leads) {
    const status = leadStatusFromDbValue(lead.status);
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;

    if (lead.selectedPlanSlug) {
      planCounts[lead.selectedPlanSlug] = (planCounts[lead.selectedPlanSlug] ?? 0) + 1;
    }
    if (lead.serviceInterest) {
      serviceCounts[lead.serviceInterest] = (serviceCounts[lead.serviceInterest] ?? 0) + 1;
    }
    if (lead.journeyType) {
      journeyCounts[lead.journeyType] = (journeyCounts[lead.journeyType] ?? 0) + 1;
    }
    if (lead.validationOutcome) {
      validationCounts[lead.validationOutcome] = (validationCounts[lead.validationOutcome] ?? 0) + 1;
    }
    if (lead.firstTouchSource) {
      sourceCounts[lead.firstTouchSource] = (sourceCounts[lead.firstTouchSource] ?? 0) + 1;
    }
    if (lead.leadOwnerId) {
      ownerCounts[String(lead.leadOwnerId)] = (ownerCounts[String(lead.leadOwnerId)] ?? 0) + 1;
    }
    if (lead.lostReason) {
      lostReasonCounts[lead.lostReason] = (lostReasonCounts[lead.lostReason] ?? 0) + 1;
    }

    if (lead.validationOutcome === 'valid') validLeads += 1;
    if (['QUALIFIED', 'PROPOSAL', 'WON'].includes(status)) qualifiedLeads += 1;
    if (['PROPOSAL', 'WON'].includes(status)) proposals += 1;
    if (status === 'WON') {
      won += 1;
      wonValueMinor += lead.proposalValueMinor ?? 0;
    }
    if (status === 'PROPOSAL') proposalValueMinor += lead.proposalValueMinor ?? 0;
  }

  const now = new Date();
  const operational = {
    unassignedLeads: leads.filter((l) => !l.leadOwnerId && l.validationOutcome !== 'invalid_test').length,
    approachingSla: leads.filter(
      (l) => l.slaDueAt && l.slaDueAt > now && l.slaDueAt.getTime() - now.getTime() < 4 * 60 * 60 * 1000 && !l.firstContactedAt,
    ).length,
    slaBreaches: leads.filter((l) => isSlaBreached(l.slaDueAt, l.firstContactedAt, now)).length,
    followUpsDueToday: leads.filter(
      (l) => l.followUpAt && l.followUpAt.toDateString() === now.toDateString(),
    ).length,
    overdueFollowUps: leads.filter((l) => l.followUpAt && l.followUpAt < now).length,
    awaitingValidation: leads.filter((l) => l.validationOutcome === 'needs_review').length,
    possibleDuplicates: leads.filter((l) => l.duplicateConfidence === 'possible' || l.duplicateConfidence === 'high').length,
    proposalsAwaitingFollowUp: leads.filter((l) => leadStatusFromDbValue(l.status) === 'PROPOSAL').length,
    nurtureDue: leads.filter((l) => leadStatusFromDbValue(l.status) === 'NURTURE').length,
  };

  return {
    range,
    leadCounts: {
      total: leads.length,
      validLeads,
      qualifiedLeads,
      proposals,
      won,
    },
    commercial: {
      proposalCount: proposals,
      proposalValueMinor,
      wonCount: won,
      wonValueMinor,
      winRate: proposals > 0 ? won / proposals : 0,
    },
    breakdowns: {
      status: statusCounts,
      selectedPlan: planCounts,
      serviceInterest: serviceCounts,
      journeyType: journeyCounts,
      validationOutcome: validationCounts,
      firstTouchSource: sourceCounts,
      owner: ownerCounts,
      lostReason: lostReasonCounts,
    },
    operational,
    dataSources: {
      crm: 'DigitalSystemsReviewLead database',
      webAnalytics: 'GA4 aggregate events — not person-level matched in this dashboard',
    },
    pricingFunnelNote:
      'Homepage/pricing funnel step counts require GA4 reporting API or manual DebugView validation.',
    auditFunnelNote:
      'Audit funnel web steps (audit_start, audit_complete) are tracked separately from pricing funnel in GA4.',
  };
}

export function calculateFunnelConversion(steps: number[]): Array<{ count: number; conversionFromPrevious: number | null; overallConversion: number | null }> {
  const base = steps[0] || 0;
  return steps.map((count, index) => ({
    count,
    conversionFromPrevious:
      index === 0 || !steps[index - 1] ? null : count / steps[index - 1],
    overallConversion: base > 0 ? count / base : null,
  }));
}
