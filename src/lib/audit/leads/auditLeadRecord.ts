import { isValidPublicToken } from '../share/publicToken.ts';
import { extractPublicTokenFromShareUrl } from '../share/extractPublicToken.ts';
import { pickSafeUtmFields, type SafeUtmFields } from './safeUtmFields.ts';

export class AuditLeadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuditLeadValidationError';
  }
}

export const AUDIT_LEAD_SOURCE = 'Web Presence Audit' as const;
export const AUDIT_LEAD_DETAILS_SOURCE = 'web_presence_audit_email_report' as const;

export const AUDIT_LEAD_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 254,
  phoneMax: 40,
  messageMax: 2000,
  businessNameMax: 160,
  businessTypeMax: 120,
  websiteUrlMax: 500,
  scoreLabelMax: 120,
  shareUrlMax: 500,
  ctaLocationMax: 120,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AuditLeadUtmDetails = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
};

/** Safe metadata stored in ToolLead.details — never raw report/crawler/debug data. */
export type AuditLeadDetails = {
  source: typeof AUDIT_LEAD_DETAILS_SOURCE;
  publicToken: string;
  shareUrl: string;
  websiteUrl: string;
  businessName: string;
  businessType: string;
  score: number | null;
  scoreLabel: string;
  reminderOptIn: boolean;
  consentAccepted: boolean;
  consentAt: string;
  cta_location?: string;
  utm?: AuditLeadUtmDetails;
};

export type NormalizedAuditLeadSubmission = {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  reminderOptIn: boolean;
  consentAccepted: true;
  consentAt: string;
  utm: SafeUtmFields;
  ctaLocation?: string;
};

export type SanitizedAuditLeadContext = {
  publicToken: string;
  shareUrl: string;
  websiteUrl: string;
  businessName: string;
  businessType: string;
  score: number | null;
  scoreLabel: string;
};

function trimToMax(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

export function normalizeAuditLeadEmail(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase().slice(0, AUDIT_LEAD_LIMITS.emailMax);
  return normalized || undefined;
}

export function normalizeAuditLeadName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = trimToMax(value, AUDIT_LEAD_LIMITS.nameMax);
  return normalized || undefined;
}

export function normalizeAuditLeadPhone(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = trimToMax(value, AUDIT_LEAD_LIMITS.phoneMax);
  return normalized || undefined;
}

export function normalizeAuditLeadMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = trimToMax(value, AUDIT_LEAD_LIMITS.messageMax);
  return normalized || undefined;
}

export function normalizeCtaLocation(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = trimToMax(value, AUDIT_LEAD_LIMITS.ctaLocationMax);
  return normalized || undefined;
}

export function validateAndNormalizeAuditLeadSubmission(
  body: Record<string, unknown>,
): NormalizedAuditLeadSubmission {
  const name = normalizeAuditLeadName(body.name);
  const email = normalizeAuditLeadEmail(body.email);
  const phone = normalizeAuditLeadPhone(body.phone);
  const message = normalizeAuditLeadMessage(body.message);
  const consentAccepted = body.consent === true;
  const reminderOptIn = body.reminderOptIn === true;
  const ctaLocation = normalizeCtaLocation(body.cta_location ?? body.ctaLocation);

  if (!name || name.length < AUDIT_LEAD_LIMITS.nameMin) {
    throw new AuditLeadValidationError('Please enter your name.');
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    throw new AuditLeadValidationError('Please enter a valid email address.');
  }

  if (!consentAccepted) {
    throw new AuditLeadValidationError('Consent is required to email this report.');
  }

  return {
    name,
    email,
    phone,
    message,
    reminderOptIn,
    consentAccepted: true,
    consentAt: new Date().toISOString(),
    utm: pickSafeUtmFields(body),
    ctaLocation,
  };
}

export function assertValidAuditPublicToken(publicToken: string): void {
  if (!publicToken.startsWith('rpt_') || !isValidPublicToken(publicToken)) {
    throw new AuditLeadValidationError('A valid shared report link is required.');
  }
}

export function resolveValidatedPublicToken(input: {
  publicToken?: unknown;
  shareUrl?: unknown;
}): string {
  if (typeof input.publicToken === 'string') {
    assertValidAuditPublicToken(input.publicToken);
    return input.publicToken;
  }

  if (typeof input.shareUrl === 'string') {
    const token = extractPublicTokenFromShareUrl(input.shareUrl);
    if (!token) {
      throw new AuditLeadValidationError('A valid shared report link is required.');
    }
    assertValidAuditPublicToken(token);
    return token;
  }

  throw new AuditLeadValidationError('A valid shared report link is required.');
}

export function buildAuditLeadDetails(input: {
  submission: NormalizedAuditLeadSubmission;
  context: SanitizedAuditLeadContext;
}): AuditLeadDetails {
  const { submission, context } = input;

  const utm = submission.utm.utmSource
    || submission.utm.utmMedium
    || submission.utm.utmCampaign
    || submission.utm.utmContent
    ? {
        ...(submission.utm.utmSource ? { source: submission.utm.utmSource } : {}),
        ...(submission.utm.utmMedium ? { medium: submission.utm.utmMedium } : {}),
        ...(submission.utm.utmCampaign ? { campaign: submission.utm.utmCampaign } : {}),
        ...(submission.utm.utmContent ? { content: submission.utm.utmContent } : {}),
      }
    : undefined;

  return {
    source: AUDIT_LEAD_DETAILS_SOURCE,
    publicToken: context.publicToken,
    shareUrl: trimToMax(context.shareUrl, AUDIT_LEAD_LIMITS.shareUrlMax),
    websiteUrl: trimToMax(context.websiteUrl, AUDIT_LEAD_LIMITS.websiteUrlMax),
    businessName: trimToMax(context.businessName, AUDIT_LEAD_LIMITS.businessNameMax),
    businessType: trimToMax(context.businessType, AUDIT_LEAD_LIMITS.businessTypeMax),
    score: context.score,
    scoreLabel: trimToMax(context.scoreLabel, AUDIT_LEAD_LIMITS.scoreLabelMax),
    reminderOptIn: submission.reminderOptIn,
    consentAccepted: submission.consentAccepted,
    consentAt: submission.consentAt,
    ...(submission.ctaLocation ? { cta_location: submission.ctaLocation } : {}),
    ...(utm ? { utm } : {}),
  };
}

export function extractSanitizedAuditLeadContext(input: {
  publicToken: string;
  shareUrl: string;
  websiteUrl: string;
  businessName: string;
  businessType: string;
  score: number | null;
  scoreLabel: string;
}): SanitizedAuditLeadContext {
  assertValidAuditPublicToken(input.publicToken);

  return {
    publicToken: input.publicToken,
    shareUrl: trimToMax(input.shareUrl, AUDIT_LEAD_LIMITS.shareUrlMax),
    websiteUrl: trimToMax(input.websiteUrl, AUDIT_LEAD_LIMITS.websiteUrlMax),
    businessName: trimToMax(input.businessName, AUDIT_LEAD_LIMITS.businessNameMax),
    businessType: trimToMax(input.businessType, AUDIT_LEAD_LIMITS.businessTypeMax),
    score: input.score,
    scoreLabel: trimToMax(input.scoreLabel, AUDIT_LEAD_LIMITS.scoreLabelMax),
  };
}

export function logAuditLeadSaved(
  storage: 'database' | 'file',
  leadId: string,
  publicToken: string,
): void {
  const tokenPrefix = publicToken.slice(0, 12);
  console.info(`[audit-lead] saved storage=${storage} leadId=${leadId} tokenPrefix=${tokenPrefix}`);
}

export function logAuditLeadSaveFailed(publicToken: string): void {
  const tokenPrefix = publicToken.slice(0, 12);
  console.error(`[audit-lead] save failed tokenPrefix=${tokenPrefix}`);
}

export function logAuditLeadEmailDelivery(
  status: 'sent' | 'partial' | 'skipped' | 'failed',
  leadId: string,
): void {
  console.info(`[audit-lead] email delivery=${status} leadId=${leadId}`);
}
