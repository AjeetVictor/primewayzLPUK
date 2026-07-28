import type { LeadStatus, LostReason, NurtureReason } from './statuses';

export type LeadTransitionContext = {
  actorId?: number | null;
  actorEmail?: string | null;
  note?: string | null;
  ownerId?: number | null;
  firstContactedAt?: Date | null;
  followUpAt?: Date | null;
  lostReason?: LostReason | null;
  nurtureReason?: NurtureReason | null;
  proposalValueMinor?: number | null;
  proposalCurrency?: string | null;
  proposalSentAt?: Date | null;
};

export type LeadTransitionRule = {
  from: LeadStatus;
  to: LeadStatus[];
  requires?: Array<keyof LeadTransitionContext>;
};

export const LEAD_TRANSITION_RULES: LeadTransitionRule[] = [
  { from: 'NEW', to: ['VALIDATED', 'LOST'] },
  { from: 'VALIDATED', to: ['ASSIGNED', 'LOST', 'NURTURE'] },
  { from: 'ASSIGNED', to: ['CONTACTED', 'LOST', 'NURTURE'], requires: ['ownerId'] },
  { from: 'CONTACTED', to: ['QUALIFIED', 'LOST', 'NURTURE'], requires: ['firstContactedAt'] },
  { from: 'QUALIFIED', to: ['PROPOSAL', 'LOST', 'NURTURE'] },
  {
    from: 'PROPOSAL',
    to: ['WON', 'LOST', 'NURTURE'],
    requires: ['proposalSentAt'],
  },
  { from: 'NURTURE', to: ['CONTACTED', 'QUALIFIED', 'LOST'], requires: ['followUpAt', 'nurtureReason'] },
  { from: 'WON', to: [] },
  { from: 'LOST', to: [] },
];

export class LeadTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeadTransitionError';
  }
}

export function getAllowedTransitions(from: LeadStatus): LeadStatus[] {
  return LEAD_TRANSITION_RULES.find((rule) => rule.from === from)?.to ?? [];
}

export function validateLeadTransition(
  from: LeadStatus,
  to: LeadStatus,
  context: LeadTransitionContext = {},
): void {
  const rule = LEAD_TRANSITION_RULES.find((r) => r.from === from);
  if (!rule) {
    throw new LeadTransitionError(`No transition rules defined for status ${from}`);
  }

  if (!rule.to.includes(to)) {
    throw new LeadTransitionError(`Transition from ${from} to ${to} is not permitted`);
  }

  if (to === 'ASSIGNED' && !context.ownerId) {
    throw new LeadTransitionError('Owner is required before entering ASSIGNED');
  }

  if (to === 'CONTACTED' && !context.firstContactedAt) {
    throw new LeadTransitionError('First contact timestamp is required before entering CONTACTED');
  }

  if (to === 'LOST' && !context.lostReason) {
    throw new LeadTransitionError('Lost reason is required before entering LOST');
  }

  if (to === 'NURTURE' && (!context.followUpAt || !context.nurtureReason)) {
    throw new LeadTransitionError('Follow-up date and nurture reason are required before entering NURTURE');
  }

  if (to === 'PROPOSAL' && !context.proposalSentAt) {
    throw new LeadTransitionError('Proposal sent date is required before entering PROPOSAL');
  }

  if (to === 'WON' && from !== 'PROPOSAL') {
    throw new LeadTransitionError('WON is only permitted from PROPOSAL');
  }

  for (const required of rule.requires ?? []) {
    if (required === 'ownerId' && to === 'ASSIGNED' && !context.ownerId) {
      throw new LeadTransitionError('Owner is required');
    }
    if (required === 'firstContactedAt' && to === 'CONTACTED' && !context.firstContactedAt) {
      throw new LeadTransitionError('First contact timestamp is required');
    }
    if (required === 'proposalSentAt' && to === 'PROPOSAL' && !context.proposalSentAt) {
      throw new LeadTransitionError('Proposal sent date is required');
    }
    if (required === 'followUpAt' && to === 'NURTURE' && !context.followUpAt) {
      throw new LeadTransitionError('Follow-up date is required');
    }
    if (required === 'nurtureReason' && to === 'NURTURE' && !context.nurtureReason) {
      throw new LeadTransitionError('Nurture reason is required');
    }
  }
}

export type LeadStatusHistoryEntry = {
  fromStatus: LeadStatus;
  toStatus: LeadStatus;
  actorId?: number | null;
  actorEmail?: string | null;
  note?: string | null;
  transitionedAt: Date;
  metadata?: Record<string, unknown>;
};

export function buildStatusHistoryEntry(
  from: LeadStatus,
  to: LeadStatus,
  context: LeadTransitionContext,
): LeadStatusHistoryEntry {
  return {
    fromStatus: from,
    toStatus: to,
    actorId: context.actorId ?? null,
    actorEmail: context.actorEmail ?? null,
    note: context.note ?? null,
    transitionedAt: new Date(),
    metadata: {
      lostReason: context.lostReason ?? undefined,
      nurtureReason: context.nurtureReason ?? undefined,
      ownerId: context.ownerId ?? undefined,
      proposalValueMinor: context.proposalValueMinor ?? undefined,
    },
  };
}
