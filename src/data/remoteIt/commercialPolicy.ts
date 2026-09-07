export const REMOTE_IT_COMMERCIAL_POLICY = {
  version: '2026.09.1',
  effectiveFrom: '2026-09-07',

  pricing: {
    publicRateCardApproved: false,
    statement:
      'Remote IT pricing is based on role, seniority and agreed allocation. Exact rates, role, seniority and start date are confirmed in the approved proposal. No public role-rate card is approved.',
  },

  engagementModels: [
    {
      id: 'part-time-specialist',
      title: 'Part-time specialist',
      allocationHoursPerMonth: 80,
      allocation: '80 hours/month',
      description:
        'Reserved role-specific capacity for a defined stream of client-managed work.',
    },
    {
      id: 'dedicated-specialist',
      title: 'Dedicated specialist',
      allocationHoursPerMonth: 160,
      allocation: '160 hours/month',
      description:
        'Reserved role-specific monthly capacity for an agreed specialist working as an extension of the client team.',
    },
    {
      id: 'managed-delivery-pod',
      title: 'Managed delivery pod',
      allocation: 'Custom blended monthly allocation',
      description:
        'A Primewayz-managed mix of development, QA and delivery roles with coordinated ownership and reporting.',
    },
    {
      id: 'dedicated-team',
      title: 'Dedicated team',
      allocation: 'Custom FTE and resource mix',
      description:
        'A named or designated long-term team with agreed composition, continuity and delivery governance.',
    },
  ],

  ukOverlap: {
    minimumHoursPerScheduledWorkingDay: 4,
    exampleWindow: '09:00-13:00 UK local time',
    statement:
      'Remote IT engagements include at least four working hours of overlap with the UK business day on scheduled working days. The exact working window is agreed during onboarding. This does not imply full UK business-day coverage.',
  },

  commercialTerms: {
    initialCommitmentMonths: 3,
    billingTiming: 'Monthly in advance',
    cancellationNoticeDays: 30,
    scaleDownNoticeDays: 30,
    scaleUpSubjectToAvailability: true,
    reservedCapacityRollover: false,
    replacementRestartsInitialCommitment: false,
    earlyCancellationStatement:
      'Cancellation during the initial three-month commitment normally leaves the remaining committed period payable, subject to any serious-breach rights or mutually agreed exception in the signed agreement.',
    scalingStatement:
      'Moving from 80 to 160 hours may be agreed when operationally possible. Moving from 160 to 80 hours requires the applicable notice. Scale-up is subject to suitable resource availability and commercial agreement.',
    dedicatedTeamChangeStatement:
      'Dedicated-team composition changes follow the agreed notice and approval process in the signed proposal or statement of work.',
    statement:
      'After the initial three-month commitment, Remote IT engagements continue on a rolling monthly basis with 30 days written notice unless a signed proposal states otherwise. Reserved Remote IT capacity does not roll over or convert to cash, credit or future capacity.',
  },

  continuity: {
    concernAcknowledgementTargetBusinessDays: 1,
    correctiveReviewTargetBusinessDays: 2,
    improvementPeriodTargetBusinessDays: 5,
    standardRoleReplacementProfileTargetBusinessDays: 5,
    standardRoleOnboardingTargetBusinessDays: 10,
    providerInitiatedReplacementFee: 'No separate replacement fee',
    knowledgeTransferDoubleCharged: false,
    targetsAreGuaranteedSla: false,
    plannedAbsenceStatement:
      'Planned leave and absence are managed reasonably through advance coordination, continuity planning and agreed coverage where appropriate.',
    statement:
      'Where an assigned specialist becomes unavailable or a confirmed role-fit issue cannot be resolved, Primewayz coordinates replacement and knowledge transfer without a separate replacement fee. Acknowledgement, corrective review, improvement, replacement-profile and onboarding timings are operating targets, not guaranteed SLAs, and remain subject to role, seniority, technology and availability.',
  },

  clientDelayBoundary:
    'Reserved resource capacity remains chargeable where delivery is prevented by client-side access, approval, credential or dependency delays.',

  approvedClaims: [
    '80 hours/month part-time specialist allocation',
    '160 hours/month dedicated specialist allocation',
    'At least four working hours of UK business-day overlap on scheduled working days',
    'Scale-up subject to suitable resource availability and commercial agreement',
    'Provider-initiated replacement and knowledge transfer without a separate replacement fee',
    'Standard-role replacement profiles targeted within five business days',
    'Standard-role onboarding targeted within ten business days after approval',
    'Role, seniority, exact rate and start date confirmed through the approved proposal',
  ],

  prohibitedClaims: [
    'Immediate resource availability',
    'Guaranteed start within a stated number of days before resource confirmation',
    'Guaranteed named resource before confirmation',
    'Guaranteed productivity, output or delivery time',
    'Full UK business-day or 24/7 coverage unless specifically contracted',
    'Zero disruption',
    'Instant replacement',
    'Guaranteed replacement or onboarding time unless supported by a specific SLA',
    'Unlimited resource hours',
    'Rollover of unused Remote IT reserved capacity',
    'Employee-equivalent availability or control beyond the agreed engagement model',
  ],
} as const;
