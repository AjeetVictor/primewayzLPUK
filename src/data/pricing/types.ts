export type PricingPlanSlug =
  | 'foundation-sprint'
  | 'essential'
  | 'growth'
  | 'scale'
  | 'maintenance-mode'
  | 'enterprise';

export type PricingEngagementType =
  | 'foundation'
  | 'recurring_delivery'
  | 'maintenance'
  | 'custom';

export type PricingBillingPeriod = 'one_off' | 'monthly' | 'custom';

export interface PricingPlanDefinition {
  slug: PricingPlanSlug;
  name: string;
  engagementType: PricingEngagementType;
  displayedPrice: string;
  numericPriceMinor?: number;
  currency: 'GBP';
  billingPeriod: PricingBillingPeriod;
  billingLabel: string;
  capacityLabel?: string;
  capacityHours?: number;
  shortDescription: string;
  bestFor: string[];
  inclusions: string[];
  exclusions: string[];
  importantBoundary?: string;
  featured?: boolean;
  active: boolean;
  displayOrder: number;
  ctaLabel: string;
  /** Optional launch discount label for display only. */
  launchDiscountLabel?: string;
  /** Optional reference price before launch discount. */
  referencePriceLabel?: string;
}

export interface PricingCommercialPolicy {
  version: string;
  effectiveFrom: string;
  vatTreatment: string;
  invoicingTiming: string;
  paymentTerms: string;
  unusedCapacityPolicy: string;
  rolloverPolicy: string;
  meetingTreatment: string;
  productManagementTreatment: string;
  qaTreatment: string;
  deploymentTreatment: string;
  additionalCapacityPolicy: string;
  minimumCommitment: string;
  cancellationPolicy: string;
  upgradePolicy: string;
  downgradePolicy: string;
  pausePolicy: string;
  clientDelayPolicy: string;
  thirdPartyCostPolicy: string;
  emergencyWorkPolicy: string;
  intellectualPropertyPolicy: string;
  launchPricePolicy: string;
  capacityDefinition: string;
  foundationSprintIncludes: string[];
  foundationSprintExcludes: string[];
}

export type PricingEngagementCategory =
  | 'foundation'
  | 'maintenance'
  | 'recurring'
  | 'custom';

export interface PricingEngagementCategoryDefinition {
  id: PricingEngagementCategory;
  label: string;
  description: string;
  engagementTypes: PricingEngagementType[];
}
