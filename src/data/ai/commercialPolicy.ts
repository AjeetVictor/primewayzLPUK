export const AI_COMMERCIAL_POLICY = {
  version: '2026.09.1',
  effectiveFrom: '2026-09-07',

  commercialModel: {
    discoveryLed: true,
    publicFixedSkuApproved: false,
    foundationBoundary:
      'Foundation Sprint may support simpler AI feasibility, workflow review and solution direction. Production AI implementation is not implied by the Foundation Sprint alone.',
    productionBoundary:
      'Production AI agents and workflow automation are scoped as custom engineering work based on workflow, systems, integrations, data, controls and operational risk.',
    ongoingRefinement:
      'Ongoing AI refinement may use Growth, Scale or a separately agreed AI delivery arrangement where the required scope and capacity are appropriate.',
  },

  thirdPartyCosts: {
    includedByDefault: false,
    statement:
      'Model, API, cloud, database, vector storage, observability and other third-party consumption costs are separate unless explicitly included in the approved proposal or statement of work.',
  },

  controlLevels: [
    {
      id: 'assist',
      title: 'Assist',
      description:
        'AI prepares information, drafts or recommendations while a person remains responsible for the resulting action.',
    },
    {
      id: 'act-with-approval',
      title: 'Act with approval',
      description:
        'AI may prepare or initiate an action only after the required human approval or controlled workflow checkpoint.',
    },
    {
      id: 'controlled-autonomous-action',
      title: 'Controlled autonomous action',
      description:
        'AI may perform explicitly approved actions within defined permissions, limits, logging, fallback and escalation controls.',
    },
  ],

  productionBoundaries: {
    highImpactActionsRequireScopedControls: true,
    statement:
      'Production access, permissions, approvals, logging, retention, escalation and fallback behaviour are defined according to the workflow, systems, data sensitivity and level of autonomy required.',
    complianceStatement:
      'Legal, regulatory, privacy and compliance requirements are assessed against the agreed use case and implementation scope. No blanket compliance assurance is implied.',
  },

  approvedClaims: [
    'Discovery-led AI workflow and agent design',
    'Human approval and escalation controls where required',
    'Controlled access to approved systems, APIs, data and knowledge sources',
    'Monitoring of outputs, exceptions, latency, cost and workflow behaviour',
    'Third-party AI and infrastructure costs defined separately unless explicitly included',
    'Production autonomy limited to explicitly approved permissions and controls',
  ],

  prohibitedClaims: [
    '100% AI accuracy',
    'Zero hallucinations',
    'Error-free AI output',
    'Guaranteed ROI, productivity gain or cost saving',
    'Guaranteed workforce replacement',
    'Fully autonomous business operations without appropriate oversight',
    'No human review required for sensitive or high-impact actions',
    'Complete security or guaranteed prevention of data leakage',
    'Universal compatibility with every system or integration',
    'Blanket GDPR, AI regulation or compliance assurance without scoped evidence',
    'Unlimited AI, model, API or infrastructure usage',
  ],
} as const;
