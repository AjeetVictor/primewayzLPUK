import type { ValidationOutcome } from './statuses';

export type LeadValidationFlag =
  | 'known_test_email_domain'
  | 'placeholder_domain'
  | 'test_keyword_in_name'
  | 'test_keyword_in_company'
  | 'test_keyword_in_context'
  | 'malformed_email'
  | 'empty_company'
  | 'website_domain_mismatch'
  | 'impossible_url'
  | 'internal_primewayz_test'
  | 'duplicate_journey_reference'
  | 'synthetic_submission_id'
  | 'http_validation_pattern';

export type LeadValidationInput = {
  name: string;
  workEmail: string;
  company: string;
  website?: string | null;
  context?: string | null;
  journeyReference?: string | null;
  submissionId?: string | null;
};

export type LeadValidationResult = {
  outcome: ValidationOutcome;
  score: number;
  flags: LeadValidationFlag[];
  reasons: string[];
};

const TEST_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'mailinator.com',
  'yopmail.com',
]);

const TEST_KEYWORDS = /\b(test|validation user|synthetic|fake lead|qa submission)\b/i;

const HTTP_VALIDATION_PATTERN =
  /\b(http validation|curl test|postman test|api test payload)\b/i;

function extractDomain(email: string): string | null {
  const at = email.lastIndexOf('@');
  if (at <= 0) return null;
  return email.slice(at + 1).toLowerCase();
}

function extractWebsiteHost(website: string | null | undefined): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function companyDomain(company: string): string | null {
  const trimmed = company.trim().toLowerCase();
  if (!trimmed.includes('.')) return null;
  try {
    return new URL(`https://${trimmed}`).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function validateLeadSubmission(input: LeadValidationInput): LeadValidationResult {
  const flags: LeadValidationFlag[] = [];
  const reasons: string[] = [];
  let score = 100;

  const email = input.workEmail.trim().toLowerCase();
  const emailDomain = extractDomain(email);

  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(email)) {
    flags.push('malformed_email');
    reasons.push('Email format appears invalid');
    score -= 40;
  }

  if (emailDomain && TEST_EMAIL_DOMAINS.has(emailDomain)) {
    flags.push('known_test_email_domain');
    reasons.push(`Known test email domain: ${emailDomain}`);
    score -= 50;
  }

  if (emailDomain === 'primewayz.com' && TEST_KEYWORDS.test(input.name + input.context)) {
    flags.push('internal_primewayz_test');
    reasons.push('Internal test pattern detected');
    score -= 30;
  }

  if (TEST_KEYWORDS.test(input.name)) {
    flags.push('test_keyword_in_name');
    reasons.push('Name contains test keywords');
    score -= 35;
  }

  if (TEST_KEYWORDS.test(input.company)) {
    flags.push('test_keyword_in_company');
    reasons.push('Company contains test keywords');
    score -= 25;
  }

  if (input.context && TEST_KEYWORDS.test(input.context)) {
    flags.push('test_keyword_in_context');
    reasons.push('Context contains test keywords');
    score -= 20;
  }

  if (input.context && HTTP_VALIDATION_PATTERN.test(input.context)) {
    flags.push('http_validation_pattern');
    reasons.push('HTTP validation-style test pattern in context');
    score -= 45;
  }

  if (!input.company.trim()) {
    flags.push('empty_company');
    reasons.push('Company is empty');
    score -= 15;
  }

  const websiteHost = extractWebsiteHost(input.website);
  if (input.website && !websiteHost) {
    flags.push('impossible_url');
    reasons.push('Website URL could not be parsed');
    score -= 10;
  }

  const companyHost = companyDomain(input.company);
  if (websiteHost && emailDomain && !emailDomain.endsWith(websiteHost) && companyHost && companyHost !== websiteHost) {
    flags.push('website_domain_mismatch');
    reasons.push('Website domain does not align with company or email domain');
    score -= 5;
  }

  if (input.submissionId && /^test[-_]/i.test(input.submissionId)) {
    flags.push('synthetic_submission_id');
    reasons.push('Submission id looks synthetic');
    score -= 20;
  }

  score = Math.max(0, Math.min(100, score));

  let outcome: ValidationOutcome = 'valid';
  if (score < 40 || flags.includes('known_test_email_domain') || flags.includes('http_validation_pattern')) {
    outcome = 'invalid_test';
  } else if (score < 75 || flags.length > 0) {
    outcome = 'needs_review';
  }

  return { outcome, score, flags, reasons };
}

export function mergeValidationFlags(existing: string[] | null | undefined, next: LeadValidationFlag[]): string[] {
  return Array.from(new Set([...(existing ?? []), ...next]));
}
