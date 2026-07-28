export const LEAD_STATUSES = [
  'NEW',
  'VALIDATED',
  'ASSIGNED',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL',
  'WON',
  'LOST',
  'NURTURE',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const VALIDATION_OUTCOMES = ['valid', 'needs_review', 'invalid_test'] as const;
export type ValidationOutcome = (typeof VALIDATION_OUTCOMES)[number];

export const LOST_REASONS = [
  'not_a_fit',
  'budget',
  'timing',
  'chose_alternative',
  'no_response',
  'duplicate',
  'test_submission',
  'other',
] as const;

export type LostReason = (typeof LOST_REASONS)[number];

export const NURTURE_REASONS = [
  'timing_not_right',
  'needs_internal_approval',
  'follow_up_later',
  'audit_completed',
  'pricing_research',
  'other',
] as const;

export type NurtureReason = (typeof NURTURE_REASONS)[number];

export function normalizeLeadStatus(value: unknown): LeadStatus | null {
  if (typeof value !== 'string') return null;
  const upper = value.toUpperCase();
  return LEAD_STATUSES.includes(upper as LeadStatus) ? (upper as LeadStatus) : null;
}

export function mapLegacyReviewStatus(status: string): LeadStatus {
  const lower = status.toLowerCase();
  if (lower === 'new') return 'NEW';
  if (lower === 'contacted') return 'CONTACTED';
  if (lower === 'qualified') return 'QUALIFIED';
  if (lower === 'lost') return 'LOST';
  if (lower === 'nurture') return 'NURTURE';
  return 'NEW';
}

export function leadStatusToDbValue(status: LeadStatus): string {
  return status.toLowerCase();
}

export function leadStatusFromDbValue(value: string | null | undefined): LeadStatus {
  if (!value) return 'NEW';
  return normalizeLeadStatus(value) ?? mapLegacyReviewStatus(value);
}
