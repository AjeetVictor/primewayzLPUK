/**
 * Canonical free digital systems review routes, allowlists, and field limits.
 * Labels and shared CTA destinations live in conversionCta.ts.
 */

import {
  DEFAULT_FREE_REVIEW_SOURCE_LOCATION,
  FREE_REVIEW_PREFERRED_NEXT_STEPS,
  FREE_REVIEW_ROUTE,
  FREE_REVIEW_SERVICE_AREAS,
  FREE_REVIEW_SERVICE_QUERY_PARAM,
  FREE_REVIEW_SOURCE_LOCATIONS,
  FREE_REVIEW_SOURCE_QUERY_PARAM,
  FREE_REVIEW_THANK_YOU_ROUTE,
  buildFreeReviewCtaUrl,
  resolveFreeReviewServiceArea,
  resolveFreeReviewSourceLocation,
  type FreeReviewPreferredNextStep,
  type FreeReviewServiceArea,
  type FreeReviewSourceLocation,
} from './conversionCta.ts';

export const DIGITAL_SYSTEMS_REVIEW_PATH = FREE_REVIEW_ROUTE;
export const DIGITAL_SYSTEMS_REVIEW_THANK_YOU_PATH = FREE_REVIEW_THANK_YOU_ROUTE;
export const DIGITAL_SYSTEMS_REVIEW_API_PATH = '/api/digital-systems-review' as const;
export const DIGITAL_SYSTEMS_REVIEW_SOURCE_QUERY_PARAM = FREE_REVIEW_SOURCE_QUERY_PARAM;
export const DIGITAL_SYSTEMS_REVIEW_SERVICE_QUERY_PARAM = FREE_REVIEW_SERVICE_QUERY_PARAM;

/** localStorage key used by LiveChat for the opaque session id (read-only here). */
export const CHAT_SESSION_STORAGE_KEY = 'chat_session_id' as const;

export const DIGITAL_SYSTEMS_REVIEW_SOURCE_LOCATIONS = FREE_REVIEW_SOURCE_LOCATIONS;
export type DigitalSystemsReviewSourceLocation = FreeReviewSourceLocation;

export const DEFAULT_REVIEW_SOURCE_LOCATION = DEFAULT_FREE_REVIEW_SOURCE_LOCATION;

export {
  buildFreeReviewCtaUrl,
  resolveFreeReviewServiceArea,
  resolveFreeReviewSourceLocation,
};

export const REVIEW_SERVICE_AREAS = FREE_REVIEW_SERVICE_AREAS;
export type ReviewServiceArea = FreeReviewServiceArea;

export const REVIEW_PREFERRED_NEXT_STEPS = FREE_REVIEW_PREFERRED_NEXT_STEPS;
export type ReviewPreferredNextStep = FreeReviewPreferredNextStep;

export const REVIEW_FIELD_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  /** Must stay ≤ MySQL VARCHAR(191) for the indexed workEmail column. */
  emailMax: 191,
  companyMin: 2,
  companyMax: 120,
  websiteMax: 200,
  contextMin: 20,
  contextMax: 2000,
  sourceLocationMax: 80,
  landingPageMax: 500,
  referrerMax: 1000,
  utmMax: 120,
  attributionObjectMaxKeys: 8,
  submissionIdMin: 8,
  submissionIdMax: 64,
  chatSessionIdMax: 64,
  chatSessionIdMin: 4,
  /** Approx upper bound for JSON body (bytes) for this endpoint. */
  maxPayloadBytes: 16_384,
} as const;

/**
 * Intended MySQL column capacities for DigitalSystemsReviewLead.
 * Application validation limits must not exceed these widths.
 */
export const REVIEW_DB_COLUMN_CAPACITIES = {
  submissionId: 64,
  name: 80,
  workEmail: 191,
  company: 120,
  website: 255,
  serviceArea: 100,
  preferredNextStep: 100,
  landingPage: 500,
  sourceLocation: 80,
  chatSessionId: 64,
  status: 32,
  notificationStatus: 32,
  notificationErrorCode: 64,
} as const;

/** Non-PII one-time thank-you conversion marker (sessionStorage only). */
export const FREE_REVIEW_SUCCESS_PENDING_KEY =
  'primewayz_free_review_success_pending' as const;

/** Rate limit: ~5 accepted attempts per IP per 15 minutes. */
export const REVIEW_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000,
} as const;

export const REVIEW_RESULT_CATEGORIES = [
  'created',
  'duplicate',
  'validation_error',
  'rate_limited',
  'temporary_failure',
  'honeypot',
] as const;

export type ReviewResultCategory = (typeof REVIEW_RESULT_CATEGORIES)[number];

export const REVIEW_ERROR_CATEGORIES = [
  'validation',
  'rate_limited',
  'network',
  'temporary_failure',
  'unknown',
] as const;

export type ReviewErrorCategory = (typeof REVIEW_ERROR_CATEGORIES)[number];
