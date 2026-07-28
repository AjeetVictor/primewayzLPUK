import type { PrismaClient } from '@prisma/client';
import {
  buildStatusHistoryEntry,
  validateLeadTransition,
  type LeadTransitionContext,
} from './transitions';
import { leadStatusFromDbValue, leadStatusToDbValue, type LeadStatus } from './statuses';

export async function listReviewLeadsAdmin(
  prisma: PrismaClient,
  query: {
    status?: string;
    ownerId?: number;
    limit?: number;
    offset?: number;
  } = {},
) {
  const where: Record<string, unknown> = {};
  if (query.status) where.status = query.status.toLowerCase();
  if (query.ownerId) where.leadOwnerId = query.ownerId;

  const [total, items] = await Promise.all([
    prisma.digitalSystemsReviewLead.count({ where }),
    prisma.digitalSystemsReviewLead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(query.limit ?? 50, 100),
      skip: query.offset ?? 0,
      select: {
        id: true,
        submissionId: true,
        name: true,
        workEmail: true,
        company: true,
        serviceArea: true,
        selectedPlanSlug: true,
        selectedPlanName: true,
        status: true,
        validationOutcome: true,
        duplicateConfidence: true,
        leadOwnerId: true,
        slaDueAt: true,
        followUpAt: true,
        createdAt: true,
      },
    }),
  ]);

  return { total, items };
}

export async function transitionReviewLeadStatus(
  prisma: PrismaClient,
  id: number,
  toStatus: LeadStatus,
  context: LeadTransitionContext,
) {
  const lead = await prisma.digitalSystemsReviewLead.findUnique({ where: { id } });
  if (!lead) return null;

  const fromStatus = leadStatusFromDbValue(lead.status);
  validateLeadTransition(fromStatus, toStatus, context);

  const now = new Date();
  const history = Array.isArray(lead.statusHistory) ? [...(lead.statusHistory as object[])] : [];
  history.push(buildStatusHistoryEntry(fromStatus, toStatus, context));

  const data: Record<string, unknown> = {
    status: leadStatusToDbValue(toStatus),
    statusUpdatedAt: now,
    statusHistory: history,
  };

  if (context.ownerId) {
    data.leadOwnerId = context.ownerId;
    if (toStatus === 'ASSIGNED') data.assignedAt = now;
  }
  if (context.firstContactedAt || toStatus === 'CONTACTED') {
    data.firstContactedAt = context.firstContactedAt ?? now;
    data.lastContactedAt = context.firstContactedAt ?? now;
  }
  if (toStatus === 'VALIDATED') data.validatedAt = now;
  if (toStatus === 'QUALIFIED') data.qualifiedAt = now;
  if (toStatus === 'PROPOSAL') {
    data.proposalSentAt = context.proposalSentAt ?? now;
    if (context.proposalValueMinor != null) data.proposalValueMinor = context.proposalValueMinor;
    if (context.proposalCurrency) data.proposalCurrency = context.proposalCurrency;
  }
  if (toStatus === 'WON') {
    data.wonAt = now;
    data.outcome = 'won';
  }
  if (toStatus === 'LOST') {
    data.lostAt = now;
    data.outcome = 'lost';
    data.lostReason = context.lostReason ?? null;
  }
  if (toStatus === 'NURTURE') {
    data.nurtureAt = now;
    data.followUpAt = context.followUpAt ?? null;
    data.nurtureReason = context.nurtureReason ?? null;
    if (context.note) data.followUpNote = context.note;
  }

  return prisma.digitalSystemsReviewLead.update({
    where: { id },
    data,
  });
}

export async function assignReviewLeadOwner(
  prisma: PrismaClient,
  id: number,
  ownerId: number,
  actorId?: number,
) {
  return transitionReviewLeadStatus(prisma, id, 'ASSIGNED', {
    ownerId,
    actorId: actorId ?? null,
    note: 'Owner assigned',
  });
}
