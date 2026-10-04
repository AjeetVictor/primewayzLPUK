/**
 * Server-side guards for the public visitor Chat API (/api/chat/*).
 *
 * Tenant identity always comes from the resolved SourceContext (never the body).
 * Rate-limit buckets are in-memory per process, matching the audit / review limiters.
 */

import type { SourceContext } from '../platform/sourceContext.ts';
import { assertChatSessionTenantAccess } from '../platform/sourceResolver.ts';
import { isLocalTestIp } from '../digitalSystemsReview/rateLimit.ts';
import { CHAT_SESSION_ID_INVALID_CODE, isStrongChatSessionId } from './chatSessionId.ts';
import { PUBLIC_CHAT_INPUT_LIMITS } from './publicChatInputLimits.ts';
import { deriveVisitorClientContext, normalizeVisitorId, normalizeVisitorPhone } from './visitorIntelligence.ts';

export { PUBLIC_CHAT_INPUT_LIMITS };

export class PublicChatRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: string,
    message: string,
    options: { field?: string; retryAfterSeconds?: number } = {},
  ) {
    super(message);
    this.name = 'PublicChatRequestError';
    this.status = status;
    this.code = code;
    this.field = options.field;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  toResponseBody(): { error: string; code: string; field?: string } {
    return {
      error: this.message,
      code: this.code,
      ...(this.field ? { field: this.field } : {}),
    };
  }
}

// --- Session ids ---

/** Matches the ChatSession.id column (VARCHAR(191)); applies to legacy and new ids alike. */
export const CHAT_SESSION_ID_MAX_LENGTH = 191;

function invalidSessionIdError(): PublicChatRequestError {
  return new PublicChatRequestError(400, CHAT_SESSION_ID_INVALID_CODE, 'Invalid chat session identifier.');
}

export function assertChatSessionIdShape(sessionId: unknown): string {
  if (typeof sessionId !== 'string' || !sessionId || sessionId.length > CHAT_SESSION_ID_MAX_LENGTH) {
    throw invalidSessionIdError();
  }
  return sessionId;
}

/**
 * Existing sessions (including legacy short ids) are allowed when they belong to the
 * resolved tenant. Unknown ids may only create a session when they are strong UUID v4 ids.
 */
export function validateExistingOrNewChatSessionId(input: {
  sessionId: unknown;
  existingSession: { tenantId: string | null } | null;
  source: SourceContext;
}): { sessionId: string; isExisting: boolean } {
  const sessionId = assertChatSessionIdShape(input.sessionId);
  if (input.existingSession) {
    assertChatSessionTenantAccess(input.existingSession.tenantId, input.source);
    return { sessionId, isExisting: true };
  }
  if (!isStrongChatSessionId(sessionId)) throw invalidSessionIdError();
  return { sessionId, isExisting: false };
}

// --- Rate limiting ---

type RateLimitRule = { limit: number; windowMs: number };

const MINUTE_MS = 60 * 1000;

/**
 * Sized for the UK widget cadence: history poll every 5s while open (45s closed),
 * heartbeat every 30s while open, availability every 60s. Admin conversation refresh
 * uses the authenticated /api/admin/sessions/:sessionId/messages route instead.
 */
export const PUBLIC_CHAT_RATE_LIMITS = {
  read: {
    client: { limit: 240, windowMs: MINUTE_MS },
    session: { limit: 90, windowMs: MINUTE_MS },
  },
  heartbeat: {
    client: { limit: 60, windowMs: MINUTE_MS },
    session: { limit: 12, windowMs: MINUTE_MS },
  },
  message: {
    client: { limit: 60, windowMs: MINUTE_MS },
    session: { limit: 15, windowMs: MINUTE_MS },
  },
  session: {
    client: { limit: 20, windowMs: MINUTE_MS },
    session: { limit: 10, windowMs: MINUTE_MS },
  },
  appointment: {
    client: { limit: 10, windowMs: 15 * MINUTE_MS },
    session: { limit: 5, windowMs: 15 * MINUTE_MS },
  },
} as const satisfies Record<string, { client: RateLimitRule; session: RateLimitRule }>;

export type PublicChatRateLimitCategory = keyof typeof PUBLIC_CHAT_RATE_LIMITS;

export const PUBLIC_CHAT_RATE_LIMITED_CODE = 'rate_limited';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let lastPruneAt = 0;

function pruneExpiredBuckets(now: number): void {
  if (now - lastPruneAt < MINUTE_MS) return;
  lastPruneAt = now;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

function consume(key: string, rule: RateLimitRule, now: number): number | null {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return null;
  }
  if (current.count >= rule.limit) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }
  current.count += 1;
  return null;
}

function isTrustProxyEnabled(env: NodeJS.ProcessEnv): boolean {
  return env.TRUST_PROXY === '1' || env.TRUST_PROXY === 'true';
}

/**
 * Behind Apache without TRUST_PROXY, every request appears to come from loopback.
 * Keying on that address would make one bucket for the whole site, so the
 * client-IP dimension is skipped and only session buckets apply.
 */
export function isPublicChatClientIpAttributable(
  clientIp: string,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!clientIp || clientIp === 'unknown') return false;
  if (env.NODE_ENV === 'production' && !isTrustProxyEnabled(env) && isLocalTestIp(clientIp)) {
    return false;
  }
  return true;
}

/**
 * Throws PublicChatRequestError(429, rate_limited) when the tenant + client IP or
 * tenant + session bucket for this category is exhausted.
 */
export function enforcePublicChatRateLimit(input: {
  category: PublicChatRateLimitCategory;
  tenantId: string;
  clientIp: string;
  sessionId?: unknown;
  now?: number;
  env?: NodeJS.ProcessEnv;
}): void {
  const now = input.now ?? Date.now();
  pruneExpiredBuckets(now);
  const rules = PUBLIC_CHAT_RATE_LIMITS[input.category];
  const checks: Array<{ key: string; rule: RateLimitRule }> = [];

  if (isPublicChatClientIpAttributable(input.clientIp, input.env)) {
    checks.push({ key: `${input.category}|${input.tenantId}|ip|${input.clientIp}`, rule: rules.client });
  }
  if (
    typeof input.sessionId === 'string'
    && input.sessionId
    && input.sessionId.length <= CHAT_SESSION_ID_MAX_LENGTH
  ) {
    checks.push({ key: `${input.category}|${input.tenantId}|session|${input.sessionId}`, rule: rules.session });
  }

  for (const check of checks) {
    const retryAfterSeconds = consume(check.key, check.rule, now);
    if (retryAfterSeconds !== null) {
      throw new PublicChatRequestError(429, PUBLIC_CHAT_RATE_LIMITED_CODE, 'Too many requests.', {
        retryAfterSeconds,
      });
    }
  }
}

/** Test helper: clears in-memory chat rate-limit buckets. */
export function resetPublicChatRateLimitsForTests(): void {
  buckets.clear();
  lastPruneAt = 0;
}

// --- Input validation ---

/** Client-supplied attribution is truncated (not rejected) to the column size it is stored in. */
export const PUBLIC_CHAT_ATTRIBUTION_LIMITS = {
  firstLandingPage: 191,
  currentPageUrl: 2048,
  referrer: 2048,
  utmSource: 191,
  utmMedium: 191,
  utmCampaign: 191,
  utmContent: 191,
  deviceType: 191,
  browser: 191,
  serviceInterest: 191,
} as const;

export const PUBLIC_CHAT_INVALID_INPUT_CODE = 'invalid_input';

function invalidInput(field: string, message: string): PublicChatRequestError {
  return new PublicChatRequestError(400, PUBLIC_CHAT_INVALID_INPUT_CODE, message, { field });
}

type Body = Record<string, unknown>;

function asBody(body: unknown): Body {
  return body && typeof body === 'object' && !Array.isArray(body) ? (body as Body) : {};
}

function optionalBoundedString(body: Body, key: string, maxLength: number): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw invalidInput(key, `${key} must be a string.`);
  if (value.length > maxLength) throw invalidInput(key, `${key} is too long.`);
  return value;
}

function assertBoundedCampaignId(body: Body): void {
  optionalBoundedString(body, 'campaignId', PUBLIC_CHAT_INPUT_LIMITS.campaignId);
}

function optionalAttachmentIds(body: Body): number[] | undefined {
  const value = body.attachmentIds;
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw invalidInput('attachmentIds', 'attachmentIds must be an array.');
  if (value.length > PUBLIC_CHAT_INPUT_LIMITS.attachmentIds) {
    throw invalidInput('attachmentIds', 'Too many attachments.');
  }
  if (!value.every((id) => Number.isSafeInteger(id) && (id as number) > 0)) {
    throw invalidInput('attachmentIds', 'attachmentIds must contain positive integer ids.');
  }
  return [...new Set(value as number[])];
}

function optionalReplyToId(body: Body): number | null {
  const value = body.replyToId;
  if (value === undefined || value === null || value === '') return null;
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw invalidInput('replyToId', 'replyToId must be a positive integer.');
  }
  return value as number;
}

export function validateChatRespondInput(rawBody: unknown): {
  message: string;
  userName?: string;
  attachmentIds?: number[];
  replyToId: number | null;
} {
  const body = asBody(rawBody);
  assertBoundedCampaignId(body);
  const message = body.message;
  if (typeof message !== 'string') throw invalidInput('message', 'message must be a string.');
  if (!message.trim()) throw invalidInput('message', 'Message cannot be empty.');
  if (message.length > PUBLIC_CHAT_INPUT_LIMITS.message) throw invalidInput('message', 'Message is too long.');
  return {
    message,
    userName: optionalBoundedString(body, 'userName', PUBLIC_CHAT_INPUT_LIMITS.name),
    attachmentIds: optionalAttachmentIds(body),
    replyToId: optionalReplyToId(body),
  };
}

export function validateChatSessionInput(rawBody: unknown): { name?: string; email?: string } {
  const body = asBody(rawBody);
  assertBoundedCampaignId(body);
  return {
    name: optionalBoundedString(body, 'name', PUBLIC_CHAT_INPUT_LIMITS.name),
    email: optionalBoundedString(body, 'email', PUBLIC_CHAT_INPUT_LIMITS.email),
  };
}

export function validateChatHeartbeatInput(rawBody: unknown): { userName?: string; userEmail?: string } {
  const body = asBody(rawBody);
  assertBoundedCampaignId(body);
  return {
    userName: optionalBoundedString(body, 'userName', PUBLIC_CHAT_INPUT_LIMITS.name),
    userEmail: optionalBoundedString(body, 'userEmail', PUBLIC_CHAT_INPUT_LIMITS.email),
  };
}

export function validateChatAppointmentInput(rawBody: unknown): {
  name?: string;
  email?: string;
  phone?: string;
  preferredDate?: string;
  preferredTime?: string;
  timezone?: string;
  message?: string;
} {
  const body = asBody(rawBody);
  assertBoundedCampaignId(body);
  return {
    name: optionalBoundedString(body, 'name', PUBLIC_CHAT_INPUT_LIMITS.name),
    email: optionalBoundedString(body, 'email', PUBLIC_CHAT_INPUT_LIMITS.email),
    phone: optionalBoundedString(body, 'phone', PUBLIC_CHAT_INPUT_LIMITS.phone),
    preferredDate: optionalBoundedString(body, 'preferredDate', PUBLIC_CHAT_INPUT_LIMITS.preferredDate),
    preferredTime: optionalBoundedString(body, 'preferredTime', PUBLIC_CHAT_INPUT_LIMITS.preferredTime),
    timezone: optionalBoundedString(body, 'timezone', PUBLIC_CHAT_INPUT_LIMITS.timezone),
    message: optionalBoundedString(body, 'message', PUBLIC_CHAT_INPUT_LIMITS.appointmentMessage),
  };
}

export function buildPublicChatSessionSourceData(rawBody: unknown) {
  const body = asBody(rawBody);
  const pick = (key: keyof typeof PUBLIC_CHAT_ATTRIBUTION_LIMITS) => {
    const value = body[key];
    return typeof value === 'string' && value
      ? value.slice(0, PUBLIC_CHAT_ATTRIBUTION_LIMITS[key])
      : undefined;
  };

  return {
    firstLandingPage: pick('firstLandingPage'),
    currentPageUrl: pick('currentPageUrl'),
    referrer: pick('referrer'),
    utmSource: pick('utmSource'),
    utmMedium: pick('utmMedium'),
    utmCampaign: pick('utmCampaign'),
    utmContent: pick('utmContent'),
    deviceType: pick('deviceType'),
    browser: pick('browser'),
    serviceInterest: pick('serviceInterest'),
  };
}

export type PublicChatVisitorTelemetry = {
  visitorId?: string;
  phone?: string;
  deviceType?: string;
  browser?: string;
  operatingSystem?: string;
};

/**
 * Visitor telemetry persisted alongside session / heartbeat writes.
 * - phone: only when the visitor typed it into the named contact field; malformed is rejected.
 * - visitorId: optional browser-generated UUID v4; anything else is ignored.
 * - device / browser / OS: normalised labels from the request User-Agent header, which is
 *   itself never stored. Location, tenant and source authority are never read from the body.
 */
export function buildPublicChatVisitorTelemetry(
  rawBody: unknown,
  input: { userAgent: string | undefined; phoneField: 'phone' | 'userPhone' },
): PublicChatVisitorTelemetry {
  const body = asBody(rawBody);
  const rawPhone = optionalBoundedString(body, input.phoneField, PUBLIC_CHAT_INPUT_LIMITS.phone);
  let phone: string | undefined;
  if (rawPhone !== undefined && rawPhone.trim()) {
    phone = normalizeVisitorPhone(rawPhone) ?? undefined;
    if (!phone) throw invalidInput(input.phoneField, `${input.phoneField} is not a valid phone number.`);
  }
  const client = deriveVisitorClientContext(input.userAgent);
  return {
    visitorId: normalizeVisitorId(body.visitorId) ?? undefined,
    phone,
    deviceType: client.deviceType ?? undefined,
    browser: client.browser ?? undefined,
    operatingSystem: client.operatingSystem ?? undefined,
  };
}

// --- Reference ownership ---

export type PublicChatReferenceStore = {
  chatAttachment: {
    count(args: { where: { id: { in: number[] }; sessionId: string } }): Promise<number>;
  };
  chatMessage: {
    count(args: { where: { id: number; sessionId: string; isInternalNote: boolean } }): Promise<number>;
  };
};

/**
 * Visitor messages may only attach files and quote messages from their own session.
 * Without this, a caller could quote or attach another conversation's records by id.
 */
export async function assertPublicChatReferencesOwned(
  store: PublicChatReferenceStore,
  sessionId: string,
  input: { attachmentIds?: number[]; replyToId: number | null },
): Promise<void> {
  if (input.attachmentIds?.length) {
    const owned = await store.chatAttachment.count({
      where: { id: { in: input.attachmentIds }, sessionId },
    });
    if (owned !== input.attachmentIds.length) {
      throw invalidInput('attachmentIds', 'Attachments are not available for this chat.');
    }
  }
  if (input.replyToId !== null) {
    const owned = await store.chatMessage.count({
      where: { id: input.replyToId, sessionId, isInternalNote: false },
    });
    if (owned === 0) throw invalidInput('replyToId', 'Reply target is not available for this chat.');
  }
}

// --- Responses ---

/** Public heartbeat / session response: no visitor PII or attribution echoed back. */
export function toPublicChatSessionResponse(
  session: { id: string; status: string },
  options: { unavailable?: boolean } = {},
): { ok: true; id: string; sessionId: string; status: string; unavailable?: true } {
  return {
    ok: true,
    id: session.id,
    sessionId: session.id,
    status: session.status,
    ...(options.unavailable ? { unavailable: true as const } : {}),
  };
}

// --- Admin reply endpoint ---

/** POST /api/chat is the authenticated admin reply endpoint; it never posts as user or bot. */
export function isPermittedAdminChatReplySender(sender: unknown): boolean {
  return sender === 'admin';
}
