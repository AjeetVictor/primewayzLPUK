import type { PricingCommercialPolicy } from './types';

/** Canonical commercial policy — single source of truth for website copy and lead context. */
export const PRICING_COMMERCIAL_POLICY: PricingCommercialPolicy = {
  version: '2026.07.1',
  effectiveFrom: '2026-07-01',
  vatTreatment:
    'Displayed prices exclude VAT where applicable. VAT is added to invoices in line with UK tax treatment.',
  invoicingTiming:
    'Recurring delivery plans are invoiced in advance each billing month. Foundation Sprint and fixed engagements follow the approved proposal schedule.',
  paymentTerms: 'Default payment terms are 14 calendar days from invoice date unless a signed agreement states otherwise.',
  capacityDefinition:
    'Monthly capacity includes multidisciplinary delivery time: product management, requirement clarification, UX and UI work, software development, technical configuration, QA and testing, standard deployment activities, delivery documentation, scheduled client meetings, internal delivery coordination directly related to the engagement, and delivery and progress reporting. These activities are included within the plan but consume the plan’s allocated capacity.',
  unusedCapacityPolicy:
    'Capacity is allocated for the active billing month. Up to 25% of one month’s standard capacity may roll into the immediately following billing month. Rolled capacity expires at the end of that following month. Rollover applies only while the account is active and invoices are not overdue. Rollover has no cash or refund value. Unused capacity above the rollover allowance expires. Custom contracts may override this only through an explicit written agreement.',
  rolloverPolicy:
    'Up to 25% of monthly capacity may roll into the next billing month while the account is active and invoices are current. Rolled capacity expires at the end of that following month and has no cash value.',
  meetingTreatment:
    'Reasonable scheduled meetings are included and consume monthly capacity. Client user-acceptance testing is the client’s responsibility unless separately agreed.',
  productManagementTreatment:
    'Product management and delivery coordination are included within monthly capacity and are prioritised with the client.',
  qaTreatment:
    'QA and standard testing are included within monthly capacity. Rework caused by a Primewayz implementation defect should not be double-charged. Rework caused by changed requirements, new scope or delayed client decisions consumes capacity.',
  deploymentTreatment:
    'Standard deployment activities are included within monthly capacity unless a proposal states otherwise.',
  additionalCapacityPolicy:
    'Additional capacity must be requested and approved before work is performed. It is subject to delivery-team availability and may be supplied as an additional approved block or through a temporary plan upgrade at the applicable commercial rate from the canonical pricing configuration or an approved proposal.',
  minimumCommitment:
    'Foundation Sprint is a one-off engagement. Recurring delivery plans use an initial three-month commitment unless a signed proposal states otherwise. After the initial commitment, the plan continues on a rolling monthly basis. Custom engagements follow their signed proposal or statement of work.',
  cancellationPolicy:
    'Recurring plans require 30 days’ written notice after any initial minimum commitment. Cancellation becomes effective at the end of the applicable paid billing period. Already invoiced capacity is not retrospectively refunded. Outstanding approved work and invoices remain payable.',
  upgradePolicy:
    'Upgrades may take effect during the current billing period when operationally possible, subject to explicit acceptance of any price or capacity adjustment. Otherwise, the upgrade starts with the next billing cycle.',
  downgradePolicy:
    'Downgrades take effect from the next billing cycle, cannot retrospectively reduce committed or already allocated capacity, and are subject to completion of the initial minimum commitment.',
  pausePolicy:
    'Plans are not automatically pausable. A client may downgrade or cancel under the applicable policy. Any exceptional pause must be agreed in writing.',
  clientDelayPolicy:
    'The client is responsible for timely access, content, credentials, approvals and decisions. Capacity reserved for a billing month remains subject to the normal rollover policy when work is delayed by missing client input. Primewayz provides reasonable warning where a client dependency threatens delivery.',
  thirdPartyCostPolicy:
    'Hosting, software licences, paid APIs, stock assets, specialist services and other third-party costs are excluded unless explicitly included in a signed proposal.',
  emergencyWorkPolicy:
    'Emergency or out-of-hours work is not automatically included. It is subject to availability, explicit approval, and may require additional commercial treatment.',
  intellectualPropertyPolicy:
    'Ownership of bespoke approved deliverables transfers according to the signed agreement and after applicable invoices are paid. Primewayz retains ownership of its reusable tools, frameworks, libraries, templates, methods and pre-existing intellectual property.',
  launchPricePolicy:
    'A website-displayed price is indicative until confirmed in writing. A formal proposal remains valid for the period stated in that proposal, or 30 calendar days where no proposal-specific period exists. Pricing already agreed for a signed commitment remains governed by that commitment.',
  foundationSprintIncludes: [
    'Stakeholder and business-goal clarification',
    'Existing product or system review',
    'Requirement and risk clarification',
    'User-journey or workflow analysis',
    'Initial technical assessment',
    'Delivery prioritisation',
    'Recommended roadmap',
    'Initial UX or solution direction',
    'Delivery estimate or engagement recommendation',
  ],
  foundationSprintExcludes: [
    'Full production implementation',
    'A complete website or application rebuild',
    'Complex integrations',
    'Data migration',
    'Large-scale content production',
    'Third-party licences',
    'Formal penetration testing',
    'Legal or regulatory certification',
    'Guaranteed delivery of every identified feature',
    'Unlimited revisions',
  ],
};

export function getPricingPolicyVersion(): string {
  return PRICING_COMMERCIAL_POLICY.version;
}
