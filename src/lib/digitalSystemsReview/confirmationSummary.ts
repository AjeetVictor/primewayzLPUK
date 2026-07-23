/**
 * Same-session confirmation receipt for the Digital Systems Review thank-you page.
 * Stores a validated summary in sessionStorage after a successful API submission.
 * Never reads untrusted URL data. Never throws when storage is unavailable.
 */

import {
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_SERVICE_AREAS,
  type FreeReviewPreferredNextStep,
  type FreeReviewServiceArea,
} from '../../constants/conversionCta.ts';
import { REVIEW_FIELD_LIMITS } from '../../constants/digitalSystemsReview.ts';
import { isPlausibleWebsite } from './isPlausibleWebsite.ts';

export const DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY =
  'primewayz:digital-systems-review:confirmation:v1' as const;

export const CONFIRMATION_SUMMARY_VERSION = 1 as const;

/** Confirmation receipt TTL: 30 minutes from successful submission. */
export const CONFIRMATION_SUMMARY_TTL_MS = 30 * 60 * 1000;

/** Small clock skew tolerance for createdAt (not for extending expiresAt). */
export const CONFIRMATION_CREATED_AT_CLOCK_TOLERANCE_MS = 60_000;

/** Exact allowlist of stored confirmation-summary keys. Unknown keys reject the whole value. */
export const CONFIRMATION_SUMMARY_ALLOWED_KEYS = [
  'version',
  'name',
  'workEmail',
  'company',
  'website',
  'serviceArea',
  'preferredNextStep',
  'context',
  'submissionId',
  'createdAt',
  'expiresAt',
] as const;

/** Max characters shown before the context disclosure expands. */
export const CONFIRMATION_CONTEXT_PREVIEW_CHARS = 480;

/** Max length for the personalised first-name display fragment. */
export const CONFIRMATION_FIRST_NAME_MAX = 40;

export const GENERIC_CONFIRMATION_HEADING =
  'Thank you — your review request has been received' as const;

export type DigitalSystemsReviewConfirmationSummary = {
  version: 1;
  name: string;
  workEmail: string;
  company: string;
  website: string | null;
  serviceArea: FreeReviewServiceArea;
  preferredNextStep: FreeReviewPreferredNextStep;
  context: string;
  submissionId?: string;
  createdAt: string;
  expiresAt: number;
};

export type BuildConfirmationSummaryInput = {
  name: string;
  workEmail: string;
  company: string;
  website?: string | null;
  serviceArea: string;
  preferredNextStep: string;
  context: string;
  /** Opaque reference only when the successful API response already includes one. */
  submissionId?: string | null;
  now?: number;
};

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const SERVICE_AREA_SET = new Set<string>(FREE_REVIEW_SERVICE_AREAS);
const PREFERRED_NEXT_STEP_SET = new Set<string>(FREE_REVIEW_PREFERRED_NEXT_STEPS);
const ALLOWED_KEY_SET = new Set<string>(CONFIRMATION_SUMMARY_ALLOWED_KEYS);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function resolveSessionStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyAllowedKeys(value: Record<string, unknown>): boolean {
  for (const key of Object.keys(value)) {
    if (!ALLOWED_KEY_SET.has(key)) return false;
  }
  return true;
}

function isAllowlistedServiceArea(value: unknown): value is FreeReviewServiceArea {
  return typeof value === 'string' && SERVICE_AREA_SET.has(value);
}

function isAllowlistedPreferredNextStep(
  value: unknown,
): value is FreeReviewPreferredNextStep {
  return typeof value === 'string' && PREFERRED_NEXT_STEP_SET.has(value);
}

function isValidOpaqueSubmissionId(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  return (
    trimmed.length >= REVIEW_FIELD_LIMITS.submissionIdMin
    && trimmed.length <= REVIEW_FIELD_LIMITS.submissionIdMax
    && SUBMISSION_ID_PATTERN.test(trimmed)
  );
}

/**
 * Validate a candidate confirmation object. Rejects arrays, wrong versions,
 * unknown keys, expired / inconsistent timestamps, unknown allowlist values,
 * and overlong / malformed fields.
 */
export function validateConfirmationSummary(
  value: unknown,
  now = Date.now(),
): DigitalSystemsReviewConfirmationSummary | null {
  if (!isPlainObject(value)) return null;
  if (!hasOnlyAllowedKeys(value)) return null;
  if (value.version !== CONFIRMATION_SUMMARY_VERSION) return null;

  if (typeof value.createdAt !== 'string' || !value.createdAt.trim()) return null;
  const createdAtMs = Date.parse(value.createdAt);
  if (!Number.isFinite(createdAtMs)) return null;
  if (createdAtMs > now + CONFIRMATION_CREATED_AT_CLOCK_TOLERANCE_MS) return null;

  if (typeof value.expiresAt !== 'number' || !Number.isFinite(value.expiresAt)) return null;
  if (value.expiresAt <= createdAtMs) return null;
  if (value.expiresAt <= now) return null;
  if (value.expiresAt - createdAtMs > CONFIRMATION_SUMMARY_TTL_MS) return null;

  if (typeof value.name !== 'string') return null;
  const name = value.name.trim();
  if (
    name.length < REVIEW_FIELD_LIMITS.nameMin
    || name.length > REVIEW_FIELD_LIMITS.nameMax
  ) {
    return null;
  }

  if (typeof value.workEmail !== 'string') return null;
  const workEmail = value.workEmail.trim().toLowerCase();
  if (
    workEmail.length === 0
    || workEmail.length > REVIEW_FIELD_LIMITS.emailMax
    || !EMAIL_REGEX.test(workEmail)
    || /[\s,]/.test(workEmail)
  ) {
    return null;
  }

  if (typeof value.company !== 'string') return null;
  const company = value.company.trim();
  if (
    company.length < REVIEW_FIELD_LIMITS.companyMin
    || company.length > REVIEW_FIELD_LIMITS.companyMax
  ) {
    return null;
  }

  let website: string | null = null;
  if (value.website !== null && value.website !== undefined) {
    if (typeof value.website !== 'string') return null;
    const trimmedWebsite = value.website.trim();
    if (!trimmedWebsite) {
      website = null;
    } else if (
      trimmedWebsite.length > REVIEW_FIELD_LIMITS.websiteMax
      || !isPlausibleWebsite(trimmedWebsite)
    ) {
      return null;
    } else {
      website = trimmedWebsite;
    }
  }

  if (!isAllowlistedServiceArea(value.serviceArea)) return null;
  if (!isAllowlistedPreferredNextStep(value.preferredNextStep)) return null;

  if (typeof value.context !== 'string') return null;
  if (
    value.context.length < REVIEW_FIELD_LIMITS.contextMin
    || value.context.length > REVIEW_FIELD_LIMITS.contextMax
  ) {
    return null;
  }

  let submissionId: string | undefined;
  if (value.submissionId !== undefined && value.submissionId !== null) {
    if (!isValidOpaqueSubmissionId(value.submissionId)) return null;
    submissionId = value.submissionId.trim();
  }

  return {
    version: CONFIRMATION_SUMMARY_VERSION,
    name,
    workEmail,
    company,
    website,
    serviceArea: value.serviceArea,
    preferredNextStep: value.preferredNextStep,
    context: value.context,
    ...(submissionId ? { submissionId } : {}),
    createdAt: value.createdAt,
    expiresAt: value.expiresAt,
  };
}

/**
 * Build a confirmation summary from final validated form values after API success.
 * Returns null when required fields cannot be validated (caller must not store).
 */
export function buildConfirmationSummary(
  input: BuildConfirmationSummaryInput,
): DigitalSystemsReviewConfirmationSummary | null {
  const now = input.now ?? Date.now();
  const websiteRaw = input.website?.trim() || '';
  const candidate: DigitalSystemsReviewConfirmationSummary = {
    version: CONFIRMATION_SUMMARY_VERSION,
    name: input.name.trim(),
    workEmail: input.workEmail.trim().toLowerCase(),
    company: input.company.trim(),
    website: websiteRaw || null,
    serviceArea: input.serviceArea as FreeReviewServiceArea,
    preferredNextStep: input.preferredNextStep as FreeReviewPreferredNextStep,
    context: input.context.trim(),
    createdAt: new Date(now).toISOString(),
    expiresAt: now + CONFIRMATION_SUMMARY_TTL_MS,
  };

  if (
    input.submissionId != null
    && String(input.submissionId).trim()
    && isValidOpaqueSubmissionId(String(input.submissionId))
  ) {
    candidate.submissionId = String(input.submissionId).trim();
  }

  return validateConfirmationSummary(candidate, now);
}

/** Remove any stored confirmation summary. Never throws. */
export function clearConfirmationSummary(storage?: StorageLike | null): void {
  try {
    const store = resolveSessionStorage(storage);
    if (!store) return;
    store.removeItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY);
  } catch {
    // sessionStorage may be blocked
  }
}

/**
 * Persist a validated confirmation summary after successful API submission.
 * Never throws; storage failures are swallowed so navigation is not blocked.
 */
export function writeConfirmationSummary(
  summary: DigitalSystemsReviewConfirmationSummary,
  storage?: StorageLike | null,
  now = Date.now(),
): boolean {
  const validated = validateConfirmationSummary(summary, now);
  if (!validated) return false;
  try {
    const store = resolveSessionStorage(storage);
    if (!store) return false;
    store.setItem(
      DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY,
      JSON.stringify(validated),
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and validate the confirmation summary. Expired / invalid payloads are
 * removed. Never throws when storage is disabled or unavailable.
 */
export function readConfirmationSummary(
  storage?: StorageLike | null,
  now = Date.now(),
): DigitalSystemsReviewConfirmationSummary | null {
  try {
    const store = resolveSessionStorage(storage);
    if (!store) return null;
    const raw = store.getItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY);
    if (!raw) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      store.removeItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY);
      return null;
    }

    const validated = validateConfirmationSummary(parsed, now);
    if (!validated) {
      store.removeItem(DIGITAL_SYSTEMS_REVIEW_CONFIRMATION_STORAGE_KEY);
      return null;
    }
    return validated;
  } catch {
    return null;
  }
}

export type ScheduleConfirmationExpiryOptions = {
  now?: number;
  onExpire: () => void;
  setTimeoutFn?: (handler: () => void, timeout: number) => unknown;
  clearTimeoutFn?: (id: unknown) => void;
};

/**
 * Schedule a single timeout that expires an open personalised thank-you receipt.
 * Caps delay to the confirmed TTL window; never schedules a negative delay.
 * Returns a cleanup function that clears the timeout.
 */
export function scheduleConfirmationSummaryExpiry(
  summary: DigitalSystemsReviewConfirmationSummary,
  options: ScheduleConfirmationExpiryOptions,
): () => void {
  const now = options.now ?? Date.now();
  const remaining = summary.expiresAt - now;
  const setTimeoutFn = options.setTimeoutFn ?? setTimeout;
  const clearTimeoutFn = options.clearTimeoutFn ?? clearTimeout;

  if (!Number.isFinite(remaining) || remaining <= 0) {
    options.onExpire();
    return () => {};
  }

  const delay = Math.min(remaining, CONFIRMATION_SUMMARY_TTL_MS);
  if (!Number.isFinite(delay) || delay <= 0) {
    options.onExpire();
    return () => {};
  }

  const timeoutId = setTimeoutFn(() => {
    options.onExpire();
  }, delay);

  return () => {
    clearTimeoutFn(timeoutId);
  };
}

/**
 * Resolve a safe first-name fragment for the personalised heading.
 * Returns null when the name cannot be used safely.
 */
export function resolveConfirmationFirstName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const firstWord = trimmed.split(/\s+/).find((part) => part.length > 0);
  if (!firstWord) return null;
  if (firstWord.length > CONFIRMATION_FIRST_NAME_MAX) {
    return firstWord.slice(0, CONFIRMATION_FIRST_NAME_MAX);
  }
  return firstWord;
}

export function buildConfirmationHeading(
  summary: DigitalSystemsReviewConfirmationSummary | null,
): string {
  if (!summary) return GENERIC_CONFIRMATION_HEADING;
  const firstName = resolveConfirmationFirstName(summary.name);
  if (!firstName) return GENERIC_CONFIRMATION_HEADING;
  return `Thank you, ${firstName} — your review request has been received`;
}

export function buildPreferredNextStepFollowUp(
  summary: DigitalSystemsReviewConfirmationSummary,
): string {
  if (summary.preferredNextStep === 'Arrange a short discovery call') {
    return `We will use ${summary.workEmail} to coordinate the next step for a short discovery call.`;
  }
  return `We will respond using ${summary.workEmail}.`;
}

export function shouldCollapseConfirmationContext(context: string): boolean {
  return context.length > CONFIRMATION_CONTEXT_PREVIEW_CHARS || context.split('\n').length > 8;
}
