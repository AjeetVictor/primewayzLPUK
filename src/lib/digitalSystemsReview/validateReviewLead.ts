import {
  DEFAULT_REVIEW_SOURCE_LOCATION,
  DIGITAL_SYSTEMS_REVIEW_SOURCE_LOCATIONS,
  REVIEW_FIELD_LIMITS,
  REVIEW_PREFERRED_NEXT_STEPS,
  REVIEW_SERVICE_AREAS,
  type DigitalSystemsReviewSourceLocation,
} from '../../constants/digitalSystemsReview.ts';
import {
  collapseSingleLine,
  normalizeTouchAttribution,
  type SafeTouchAttribution,
} from './attribution.ts';
import { normalizeOptionalChatSessionId } from './chatSessionId.ts';

export class DigitalSystemsReviewValidationError extends Error {
  readonly category = 'validation' as const;

  constructor(message: string) {
    super(message);
    this.name = 'DigitalSystemsReviewValidationError';
  }
}

export class DigitalSystemsReviewHoneypotError extends Error {
  readonly category = 'honeypot' as const;

  constructor() {
    super('Submission ignored.');
    this.name = 'DigitalSystemsReviewHoneypotError';
  }
}

/** Explicit top-level allowlist for the review API payload. */
export const REVIEW_APPROVED_PAYLOAD_KEYS = [
  'submissionId',
  'name',
  'workEmail',
  'company',
  'website',
  'serviceArea',
  'context',
  'preferredNextStep',
  'acknowledgement',
  'companyWebsite',
  'firstTouchAttribution',
  'latestTouchAttribution',
  'landingPage',
  'referrer',
  'sourceLocation',
  'chatSessionId',
] as const;

const APPROVED_KEY_SET = new Set<string>(REVIEW_APPROVED_PAYLOAD_KEYS);

/** Conservative work-email pattern: no whitespace, commas, or control characters. */
const EMAIL_REGEX = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const PRIMEWAYZ_HOSTS = new Set(['uk.primewayz.com', 'www.uk.primewayz.com', 'localhost']);

export type NormalizedDigitalSystemsReviewLead = {
  submissionId: string;
  name: string;
  workEmail: string;
  company: string;
  website: string | null;
  serviceArea: string;
  context: string;
  preferredNextStep: string;
  consentAt: Date;
  firstTouchAttribution: SafeTouchAttribution | null;
  latestTouchAttribution: SafeTouchAttribution | null;
  landingPage: string | null;
  referrer: string | null;
  sourceLocation: DigitalSystemsReviewSourceLocation;
  chatSessionId: string | null;
};

function rejectIfArray(value: unknown, fieldLabel: string): void {
  if (Array.isArray(value)) {
    throw new DigitalSystemsReviewValidationError(`${fieldLabel} must be a string.`);
  }
}

function requireSingleLineString(
  value: unknown,
  fieldLabel: string,
  min: number,
  max: number,
): string {
  rejectIfArray(value, fieldLabel);
  if (typeof value !== 'string') {
    throw new DigitalSystemsReviewValidationError(`Please provide a valid ${fieldLabel}.`);
  }
  const normalized = collapseSingleLine(value);
  if (normalized.length < min) {
    throw new DigitalSystemsReviewValidationError(`Please enter your ${fieldLabel}.`);
  }
  if (normalized.length > max) {
    throw new DigitalSystemsReviewValidationError(`${fieldLabel} is too long.`);
  }
  return normalized;
}

function requireOption(
  value: unknown,
  allowed: readonly string[],
  fieldLabel: string,
): string {
  rejectIfArray(value, fieldLabel);
  if (typeof value !== 'string' || !allowed.includes(collapseSingleLine(value))) {
    throw new DigitalSystemsReviewValidationError(`Please select a valid ${fieldLabel}.`);
  }
  return collapseSingleLine(value);
}

function normalizeWorkEmail(value: unknown): string {
  rejectIfArray(value, 'work email');
  if (typeof value !== 'string') {
    throw new DigitalSystemsReviewValidationError('Please enter a valid work email address.');
  }
  if (value.length > REVIEW_FIELD_LIMITS.emailMax) {
    throw new DigitalSystemsReviewValidationError('Work email is too long.');
  }
  if (/[\s,\u0000-\u001F\u007F]/.test(value)) {
    throw new DigitalSystemsReviewValidationError('Please enter a valid work email address.');
  }
  const workEmail = value.trim().toLowerCase();
  if (!EMAIL_REGEX.test(workEmail)) {
    throw new DigitalSystemsReviewValidationError('Please enter a valid work email address.');
  }
  return workEmail;
}

function normalizeWebsite(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  rejectIfArray(value, 'website');
  if (typeof value !== 'string') {
    throw new DigitalSystemsReviewValidationError('Website must be a string.');
  }
  const raw = value.trim();
  if (!raw) return null;
  if (raw.length > REVIEW_FIELD_LIMITS.websiteMax) {
    throw new DigitalSystemsReviewValidationError('Website is too long.');
  }

  let candidate = raw;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new DigitalSystemsReviewValidationError('Please enter a valid website URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new DigitalSystemsReviewValidationError('Please enter a valid website URL.');
  }
  if (parsed.username || parsed.password) {
    throw new DigitalSystemsReviewValidationError('Please enter a valid website URL.');
  }
  if (!parsed.hostname.includes('.')) {
    throw new DigitalSystemsReviewValidationError('Please enter a valid website URL.');
  }

  parsed.search = '';
  parsed.hash = '';
  const normalized = parsed.toString();
  if (normalized.length > REVIEW_FIELD_LIMITS.websiteMax) {
    throw new DigitalSystemsReviewValidationError('Website is too long.');
  }
  return normalized;
}

function normalizeSubmissionId(value: unknown): string {
  rejectIfArray(value, 'submission id');
  if (typeof value !== 'string') {
    throw new DigitalSystemsReviewValidationError('A valid submission id is required.');
  }
  const trimmed = value.trim();
  if (
    trimmed.length < REVIEW_FIELD_LIMITS.submissionIdMin
    || trimmed.length > REVIEW_FIELD_LIMITS.submissionIdMax
    || !SUBMISSION_ID_PATTERN.test(trimmed)
  ) {
    throw new DigitalSystemsReviewValidationError('A valid submission id is required.');
  }
  return trimmed;
}

function normalizeSourceLocation(value: unknown): DigitalSystemsReviewSourceLocation {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_REVIEW_SOURCE_LOCATION;
  }
  rejectIfArray(value, 'source location');
  if (typeof value !== 'string') {
    throw new DigitalSystemsReviewValidationError('Please provide a valid source location.');
  }
  const normalized = collapseSingleLine(value).slice(0, REVIEW_FIELD_LIMITS.sourceLocationMax);
  if (!(DIGITAL_SYSTEMS_REVIEW_SOURCE_LOCATIONS as readonly string[]).includes(normalized)) {
    throw new DigitalSystemsReviewValidationError('Please provide a valid source location.');
  }
  return normalized as DigitalSystemsReviewSourceLocation;
}

/**
 * Privacy-safe landing page: store path only; omit query/hash/PII.
 * Malformed optional values are omitted rather than rejecting the lead.
 * Protocol-relative URLs (//…) are rejected so they are never stored as
 * a misleading Primewayz-relative path.
 */
export function normalizeLandingPage(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  const raw = collapseSingleLine(value);
  if (!raw || raw.length > REVIEW_FIELD_LIMITS.landingPageMax) return null;

  // Protocol-relative input must not be treated as a relative path.
  if (raw.startsWith('//')) return null;

  try {
    if (raw.startsWith('/')) {
      const parsed = new URL(raw, 'https://uk.primewayz.com');
      return parsed.pathname || '/';
    }

    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    const host = parsed.hostname.toLowerCase();
    if (!PRIMEWAYZ_HOSTS.has(host)) return null;
    return parsed.pathname || '/';
  } catch {
    return null;
  }
}

/**
 * Multiline context: preserve ordinary Unicode and line breaks.
 * Remove NUL, DEL, and non-printing C0 controls except newline;
 * convert tabs to spaces. Does not strip angle brackets (HTML is escaped later).
 */
export function normalizeMultilineContext(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\t/g, ' ')
    .trim();
}

/**
 * Privacy-safe referrer: origin + pathname only; omit query/hash/credentials.
 * Malformed optional values are omitted rather than rejecting the lead.
 */
export function normalizeReferrer(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  const raw = collapseSingleLine(value);
  if (!raw || raw.length > REVIEW_FIELD_LIMITS.referrerMax) return null;

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    const path = parsed.pathname || '/';
    return `${parsed.origin}${path === '/' ? '' : path}` || parsed.origin;
  } catch {
    return null;
  }
}

function assertApprovedPayloadKeys(body: Record<string, unknown>): void {
  for (const key of Object.keys(body)) {
    if (!APPROVED_KEY_SET.has(key)) {
      throw new DigitalSystemsReviewValidationError('Request contains unsupported fields.');
    }
  }
}

function assertPlainObjectPayload(body: unknown): asserts body is Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new DigitalSystemsReviewValidationError('A complete review request is required.');
  }
}

/**
 * Validates and normalizes the approved review payload.
 * Optional chatSessionId is normalized or omitted; never causes rejection alone.
 * Does not look up ChatSession or copy chat PII.
 */
export function validateAndNormalizeDigitalSystemsReviewLead(
  body: unknown,
): NormalizedDigitalSystemsReviewLead {
  assertPlainObjectPayload(body);

  if (typeof body.companyWebsite === 'string' && body.companyWebsite.trim()) {
    throw new DigitalSystemsReviewHoneypotError();
  }

  // Reject legacy chat identity payloads before the allowlist (email is not an approved key).
  if (
    'email' in body
    || (
      typeof body.name === 'string'
      && typeof body.workEmail === 'string'
      && body.company === undefined
      && body.serviceArea === undefined
      && body.context === undefined
      && body.preferredNextStep === undefined
      && body.acknowledgement !== true
    )
  ) {
    throw new DigitalSystemsReviewValidationError(
      'A complete digital systems review request is required.',
    );
  }

  assertApprovedPayloadKeys(body);

  const submissionId = normalizeSubmissionId(body.submissionId);
  const name = requireSingleLineString(
    body.name,
    'name',
    REVIEW_FIELD_LIMITS.nameMin,
    REVIEW_FIELD_LIMITS.nameMax,
  );
  const workEmail = normalizeWorkEmail(body.workEmail);
  const company = requireSingleLineString(
    body.company,
    'company',
    REVIEW_FIELD_LIMITS.companyMin,
    REVIEW_FIELD_LIMITS.companyMax,
  );
  const website = normalizeWebsite(body.website);
  const serviceArea = requireOption(body.serviceArea, REVIEW_SERVICE_AREAS, 'service area');
  const preferredNextStep = requireOption(
    body.preferredNextStep,
    REVIEW_PREFERRED_NEXT_STEPS,
    'preferred next step',
  );

  rejectIfArray(body.context, 'context');
  if (typeof body.context !== 'string') {
    throw new DigitalSystemsReviewValidationError(
      'Please share a short description of the friction you are seeing.',
    );
  }
  const context = normalizeMultilineContext(body.context);
  if (context.length > REVIEW_FIELD_LIMITS.contextMax) {
    throw new DigitalSystemsReviewValidationError('Context is too long.');
  }
  if (context.length < REVIEW_FIELD_LIMITS.contextMin) {
    throw new DigitalSystemsReviewValidationError(
      'Please share a short description of the friction you are seeing.',
    );
  }

  if (body.acknowledgement !== true) {
    throw new DigitalSystemsReviewValidationError(
      'Please confirm you understand how the submitted information will be used.',
    );
  }

  const sourceLocation = normalizeSourceLocation(body.sourceLocation);

  let firstTouchAttribution: SafeTouchAttribution | null = null;
  let latestTouchAttribution: SafeTouchAttribution | null = null;
  try {
    firstTouchAttribution = normalizeTouchAttribution(
      body.firstTouchAttribution,
      'First-touch attribution',
    );
    latestTouchAttribution = normalizeTouchAttribution(
      body.latestTouchAttribution,
      'Latest-touch attribution',
    );
  } catch (error) {
    throw new DigitalSystemsReviewValidationError(
      error instanceof Error ? error.message : 'Attribution data is invalid.',
    );
  }

  const chatSessionId = normalizeOptionalChatSessionId(body.chatSessionId) ?? null;

  return {
    submissionId,
    name,
    workEmail,
    company,
    website,
    serviceArea,
    context,
    preferredNextStep,
    consentAt: new Date(),
    firstTouchAttribution,
    latestTouchAttribution,
    landingPage: normalizeLandingPage(body.landingPage),
    referrer: normalizeReferrer(body.referrer),
    sourceLocation,
    chatSessionId,
  };
}

export function getReviewMaxPayloadBytes(): number {
  return REVIEW_FIELD_LIMITS.maxPayloadBytes;
}

/** Reject oversized raw request bodies before JSON parse when Content-Length is known. */
export function assertReviewPayloadSize(contentLengthHeader: string | undefined): void {
  if (!contentLengthHeader) return;
  const length = Number(contentLengthHeader);
  if (!Number.isFinite(length) || length < 0) return;
  if (length > getReviewMaxPayloadBytes()) {
    throw new DigitalSystemsReviewValidationError('Request payload is too large.');
  }
}

/** Reject oversized already-parsed bodies using the same shared limit. */
export function assertSerializedReviewPayloadSize(body: unknown): void {
  const serializedSize = Buffer.byteLength(JSON.stringify(body ?? {}), 'utf8');
  if (serializedSize > getReviewMaxPayloadBytes()) {
    throw new DigitalSystemsReviewValidationError('Request payload is too large.');
  }
}

/**
 * Accept application/json and deliberate application/*+json types.
 * Reject substring spoofing such as text/plain; application/json-spoof.
 */
export function assertJsonContentType(contentTypeHeader: string | undefined): void {
  const raw = (contentTypeHeader || '').split(';')[0]!.trim().toLowerCase();
  const isJson =
    raw === 'application/json'
    || /^application\/[a-z0-9.+-]+\+json$/i.test(raw);
  if (!isJson) {
    throw new DigitalSystemsReviewValidationError('Content-Type must be application/json.');
  }
}
