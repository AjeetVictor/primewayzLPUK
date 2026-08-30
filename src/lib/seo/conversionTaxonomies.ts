/**
 * Analytical taxonomies for SEO conversion evidence.
 * Maps operational statuses without overwriting source records.
 */

import { leadStatusFromDbValue, type LeadStatus } from '../leads/statuses.ts';

export const SEO_LEAD_QUALITIES = [
  'unknown',
  'unqualified',
  'potentially_qualified',
  'qualified',
  'sales_accepted',
] as const;

export type SeoLeadQuality = (typeof SEO_LEAD_QUALITIES)[number];

export const SEO_CONVERSATION_OUTCOMES = [
  'informational',
  'service_interest_identified',
  'contact_details_captured',
  'follow_up_required',
  'meeting_requested',
  'meeting_booked',
  'proposal_opportunity',
  'closed_without_opportunity',
] as const;

export type SeoConversationOutcome = (typeof SEO_CONVERSATION_OUTCOMES)[number];

export const SEO_CONVERSION_TYPES = [
  'chat_initiated',
  'contact_submitted',
  'systems_review_requested',
  'booking_requested',
  'booking_completed',
  'qualified_lead',
  'proposal_created',
  'opportunity_won',
] as const;

export type SeoConversionType = (typeof SEO_CONVERSION_TYPES)[number];

export const SEO_ATTRIBUTION_MODELS = ['first_touch', 'last_touch'] as const;
export type SeoAttributionModel = (typeof SEO_ATTRIBUTION_MODELS)[number];

/** Operational review-lead status → analytical lead quality. */
export function mapReviewLeadStatusToLeadQuality(status: string | null | undefined): SeoLeadQuality {
  const normalised = leadStatusFromDbValue(status);
  return mapLeadStatusToLeadQuality(normalised);
}

export function mapLeadStatusToLeadQuality(status: LeadStatus): SeoLeadQuality {
  switch (status) {
    case 'WON':
      return 'sales_accepted';
    case 'QUALIFIED':
    case 'PROPOSAL':
      return 'qualified';
    case 'CONTACTED':
    case 'ASSIGNED':
    case 'VALIDATED':
    case 'NURTURE':
      return 'potentially_qualified';
    case 'LOST':
      return 'unqualified';
    case 'NEW':
    default:
      return 'unknown';
  }
}

/** Chat session operational status → analytical conversation outcome. */
export function mapChatStatusToConversationOutcome(input: {
  status: string | null | undefined;
  hasContactDetails: boolean;
  hasServiceInterest: boolean;
  hasPendingAppointment: boolean;
}): SeoConversationOutcome {
  const status = (input.status ?? 'new').toLowerCase();
  if (status === 'spam' || status === 'closed') return 'closed_without_opportunity';
  if (status === 'booked_call') return 'meeting_booked';
  if (input.hasPendingAppointment || status === 'follow_up_due') {
    return input.hasPendingAppointment ? 'meeting_requested' : 'follow_up_required';
  }
  if (status === 'lead_qualified') return 'proposal_opportunity';
  if (input.hasContactDetails) return 'contact_details_captured';
  if (input.hasServiceInterest || status === 'admin_needed') return 'service_interest_identified';
  return 'informational';
}

export function isAnalyticallyQualifiedChat(outcome: SeoConversationOutcome): boolean {
  return (
    outcome === 'contact_details_captured' ||
    outcome === 'meeting_requested' ||
    outcome === 'meeting_booked' ||
    outcome === 'proposal_opportunity'
  );
}

export function mapLeadQualityToConversionSignal(quality: SeoLeadQuality): SeoConversionType | null {
  switch (quality) {
    case 'sales_accepted':
      return 'opportunity_won';
    case 'qualified':
      return 'qualified_lead';
    default:
      return null;
  }
}

export function mapLeadStatusToProposalConversion(status: LeadStatus): boolean {
  return status === 'PROPOSAL' || status === 'WON';
}
