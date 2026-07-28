import type { PricingPlanSlug } from '../../data/pricing/helpers';
import { getPricingPlanBySlug, getPricingPolicyVersion, isPricingPlanSlug } from '../../data/pricing/helpers';

export interface EnquiryCommercialContext {
  selectedPlanSlug?: PricingPlanSlug;
  selectedPlanName?: string;
  displayedPrice?: string;
  billingPeriod?: string;
  pricingPolicyVersion?: string;
  serviceInterest?: string;
  journeyType?: string;
  sourcePagePath?: string;
  sourcePageLocation?: string;
  sourceSection?: string;
  recommendedNextStep?: string;
  journeyReference?: string;
  sessionReference?: string;
  displayedPriceAtSelection?: string;
}

export function buildEnquiryCommercialContext(input: {
  selectedPlanSlug?: string | null;
  displayedPriceAtSelection?: string | null;
  serviceInterest?: string | null;
  journeyType?: string | null;
  sourcePagePath?: string | null;
  sourcePageLocation?: string | null;
  sourceSection?: string | null;
  recommendedNextStep?: string | null;
  journeyReference?: string | null;
  sessionReference?: string | null;
}): EnquiryCommercialContext {
  const context: EnquiryCommercialContext = {
    pricingPolicyVersion: getPricingPolicyVersion(),
    serviceInterest: input.serviceInterest ?? undefined,
    journeyType: input.journeyType ?? undefined,
    sourcePagePath: input.sourcePagePath ?? undefined,
    sourcePageLocation: input.sourcePageLocation ?? undefined,
    sourceSection: input.sourceSection ?? undefined,
    recommendedNextStep: input.recommendedNextStep ?? undefined,
    journeyReference: input.journeyReference ?? undefined,
    sessionReference: input.sessionReference ?? undefined,
    displayedPriceAtSelection: input.displayedPriceAtSelection ?? undefined,
  };

  if (input.selectedPlanSlug && isPricingPlanSlug(input.selectedPlanSlug)) {
    const plan = getPricingPlanBySlug(input.selectedPlanSlug);
    if (plan?.active) {
      context.selectedPlanSlug = plan.slug;
      context.selectedPlanName = plan.name;
      context.displayedPrice = plan.displayedPrice;
      context.billingPeriod = plan.billingPeriod;
    }
  }

  return context;
}

export function validateServerPlanSlug(slug: string | null | undefined): {
  valid: boolean;
  planSlug?: PricingPlanSlug;
  planName?: string;
  displayedPrice?: string;
  billingPeriod?: string;
} {
  if (!slug || !isPricingPlanSlug(slug)) {
    return { valid: false };
  }
  const plan = getPricingPlanBySlug(slug);
  if (!plan?.active) return { valid: false };
  return {
    valid: true,
    planSlug: plan.slug,
    planName: plan.name,
    displayedPrice: plan.displayedPrice,
    billingPeriod: plan.billingPeriod,
  };
}

export function extractAttributionFields(attribution: Record<string, unknown> | null | undefined) {
  if (!attribution) {
    return {
      source: null,
      medium: null,
      campaign: null,
      content: null,
      term: null,
    };
  }
  return {
    source: typeof attribution.utm_source === 'string' ? attribution.utm_source : null,
    medium: typeof attribution.utm_medium === 'string' ? attribution.utm_medium : null,
    campaign: typeof attribution.utm_campaign === 'string' ? attribution.utm_campaign : null,
    content: typeof attribution.utm_content === 'string' ? attribution.utm_content : null,
    term: typeof attribution.utm_term === 'string' ? attribution.utm_term : null,
  };
}
