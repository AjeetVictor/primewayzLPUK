/**
 * Calendly webhook adapter behind the generic Scheduling layer.
 * Verifies authenticity when a signing key is configured; maps connection → tenant server-side.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import {
  defaultSchedulingCredentialStore,
  type SchedulingCredentialStore,
} from '../credentials.ts';
import {
  findEnvConnectionByProviderUris,
  type ResolvedSchedulingConfig,
} from '../connectionRegistry.ts';
import { resolveSchedulingConversionAttribution } from '../conversionAttribution.ts';
import type { SchedulingWebhookProcessResult } from '../types.ts';

export type CalendlyWebhookHeaders = {
  signature?: string | null;
  signingKey?: string | null;
};

/** Calendly guidance-aligned default replay window. */
export const DEFAULT_CALENDLY_WEBHOOK_TOLERANCE_SECONDS = 180;

export function getCalendlyWebhookToleranceSeconds(
  env: NodeJS.ProcessEnv = process.env,
): number {
  const raw = env.CALENDLY_WEBHOOK_TOLERANCE_SECONDS?.trim();
  if (!raw) return DEFAULT_CALENDLY_WEBHOOK_TOLERANCE_SECONDS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_CALENDLY_WEBHOOK_TOLERANCE_SECONDS;
}

function parseCalendlySignature(
  header: string | null | undefined,
): { t: string; v1: string } | null {
  if (!header || typeof header !== 'string') return null;
  const parts: Record<string, string> = {};
  for (const segment of header.split(',')) {
    const trimmed = segment.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (key && value) parts[key] = value;
  }
  if (!parts.t || !parts.v1) return null;
  return { t: parts.t, v1: parts.v1 };
}

function safeHexTimingEqual(expectedHex: string, provided: string): boolean {
  try {
    const a = Buffer.from(expectedHex, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type CalendlySignatureVerifyFailure =
  | 'malformed_signature'
  | 'invalid_timestamp'
  | 'stale_timestamp'
  | 'future_timestamp'
  | 'signature_mismatch';

export type CalendlySignatureVerifyResult =
  | { ok: true; timestampSeconds: number }
  | { ok: false; reason: CalendlySignatureVerifyFailure };

/**
 * Calendly webhook signature: HMAC-SHA256 of `${t}.${rawBody}` compared to v1.
 * Must use the exact raw HTTP body bytes/string — never a re-serialized JSON object.
 * @see https://developer.calendly.com/api-docs/ZG9jOjM2MzE2MDM4-webhook-signatures
 */
export function verifyCalendlyWebhookSignatureDetailed(input: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  signingKey: string;
  nowMs?: number;
  toleranceSeconds?: number;
}): CalendlySignatureVerifyResult {
  const parsed = parseCalendlySignature(input.signatureHeader);
  if (!parsed) return { ok: false, reason: 'malformed_signature' };

  const timestampSeconds = Number.parseInt(parsed.t, 10);
  if (!Number.isFinite(timestampSeconds) || timestampSeconds <= 0) {
    return { ok: false, reason: 'invalid_timestamp' };
  }

  const nowMs = input.nowMs ?? Date.now();
  const toleranceSeconds =
    input.toleranceSeconds ?? DEFAULT_CALENDLY_WEBHOOK_TOLERANCE_SECONDS;
  const nowSeconds = Math.floor(nowMs / 1000);
  const delta = nowSeconds - timestampSeconds;

  if (delta > toleranceSeconds) {
    return { ok: false, reason: 'stale_timestamp' };
  }
  if (timestampSeconds - nowSeconds > toleranceSeconds) {
    return { ok: false, reason: 'future_timestamp' };
  }

  const signedPayload = `${parsed.t}.${input.rawBody}`;
  const expected = createHmac('sha256', input.signingKey)
    .update(signedPayload, 'utf8')
    .digest('hex');

  if (!safeHexTimingEqual(expected, parsed.v1)) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  return { ok: true, timestampSeconds };
}

/** Boolean convenience wrapper around detailed verification. */
export function verifyCalendlyWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  signingKey: string;
  nowMs?: number;
  toleranceSeconds?: number;
}): boolean {
  return verifyCalendlyWebhookSignatureDetailed(input).ok;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export type CalendlyWebhookPayload = {
  event?: string;
  created_at?: string;
  created_by?: string;
  payload?: {
    event?: string;
    uri?: string;
    email?: string;
    name?: string;
    status?: string;
    cancel_url?: string;
    reschedule_url?: string;
    event_type?: string;
    scheduled_event?: {
      uri?: string;
      name?: string;
      status?: string;
      start_time?: string;
      end_time?: string;
      event_type?: string;
      event_memberships?: Array<{ user?: string }>;
    };
    tracking?: Record<string, unknown>;
  };
};

/** Collect provider ownership URIs from the trusted payload (never from tenantId fields). */
export function extractCalendlyOwnershipCandidates(
  body: CalendlyWebhookPayload,
): string[] {
  const candidates: string[] = [];
  const memberships = body.payload?.scheduled_event?.event_memberships ?? [];
  for (const membership of memberships) {
    if (typeof membership?.user === 'string' && membership.user.trim()) {
      candidates.push(membership.user.trim());
    }
  }
  if (typeof body.created_by === 'string' && body.created_by.trim()) {
    candidates.push(body.created_by.trim());
  }
  return [...new Set(candidates)];
}

/** @deprecated Prefer extractCalendlyOwnershipCandidates — kept for call-site compatibility. */
export function extractCalendlyOwnershipUri(body: CalendlyWebhookPayload): string | null {
  return extractCalendlyOwnershipCandidates(body)[0] ?? null;
}

/**
 * Normalize Calendly event names to stable idempotency prefixes.
 * invitee.canceled (US spelling from Calendly) is canonical.
 */
export function normalizeCalendlyEventType(eventName: string | undefined): string | null {
  if (!eventName || typeof eventName !== 'string') return null;
  const lowered = eventName.trim().toLowerCase();
  if (lowered.includes('invitee.created')) return 'invitee.created';
  if (lowered.includes('invitee.canceled') || lowered.includes('invitee.cancelled')) {
    return 'invitee.canceled';
  }
  return lowered || null;
}

/**
 * Webhook delivery idempotency identity:
 *   `${normalizedEventType}:${inviteeResourceUri}`
 *
 * Same redelivery → same key.
 * created + canceled for same invitee → distinct webhook events.
 * Different invitees on the same scheduled event → distinct keys.
 */
export function buildCalendlyWebhookIdempotencyKey(
  body: CalendlyWebhookPayload,
): string | null {
  const eventType = normalizeCalendlyEventType(body.event);
  const inviteeUri =
    typeof body.payload?.uri === 'string' && body.payload.uri.trim()
      ? body.payload.uri.trim()
      : null;
  if (!eventType || !inviteeUri) return null;
  return `${eventType}:${inviteeUri}`;
}

/**
 * Stable appointment identity across create/cancel for the same invitee.
 * Must not use scheduled-event URI alone (group events have multiple invitees).
 */
export function buildCalendlyAppointmentProviderEventId(
  body: CalendlyWebhookPayload,
): string | null {
  const inviteeUri =
    typeof body.payload?.uri === 'string' && body.payload.uri.trim()
      ? body.payload.uri.trim()
      : null;
  return inviteeUri;
}

/** @deprecated Prefer buildCalendlyWebhookIdempotencyKey. */
export function extractCalendlyProviderEventId(body: CalendlyWebhookPayload): string | null {
  return buildCalendlyWebhookIdempotencyKey(body);
}

function mapCalendlyEventType(eventName: string | undefined): 'scheduled' | 'cancelled' | 'other' {
  const normalized = normalizeCalendlyEventType(eventName);
  if (normalized === 'invitee.created') return 'scheduled';
  if (normalized === 'invitee.canceled') return 'cancelled';
  return 'other';
}

export async function processCalendlyWebhookEvent(input: {
  prisma: PrismaClient;
  rawBody: string;
  signatureHeader?: string | null;
  body: CalendlyWebhookPayload;
  env?: NodeJS.ProcessEnv;
  credentials?: SchedulingCredentialStore;
  nowMs?: number;
}): Promise<SchedulingWebhookProcessResult> {
  const env = input.env ?? process.env;
  const credentials = input.credentials ?? defaultSchedulingCredentialStore;
  const nowMs = input.nowMs ?? Date.now();
  const toleranceSeconds = getCalendlyWebhookToleranceSeconds(env);

  if (typeof input.rawBody !== 'string') {
    return { status: 'rejected', reason: 'Missing raw webhook body.' };
  }

  // Tenant ownership comes only from trusted connection mapping — never payload tenantId.
  const ownershipUris = extractCalendlyOwnershipCandidates(input.body);
  const config: ResolvedSchedulingConfig | null = findEnvConnectionByProviderUris(
    ownershipUris,
    env,
  );

  if (!config) {
    console.warn('[scheduling/calendly] Unmapped webhook connection', {
      ownershipPresent: ownershipUris.length > 0,
      event: input.body.event,
    });
    return { status: 'rejected', reason: 'Unknown or unmapped Calendly connection.' };
  }

  const signingKey =
    credentials.resolveSecret(
      {
        connectionKey: config.connection.connectionKey,
        kind: 'webhook_signing_secret',
        envKey: config.connection.webhookSigningSecretEnv,
      },
      env,
    ) || null;

  if (signingKey) {
    const verified = verifyCalendlyWebhookSignatureDetailed({
      rawBody: input.rawBody,
      signatureHeader: input.signatureHeader,
      signingKey,
      nowMs,
      toleranceSeconds,
    });
    if (!verified.ok) {
      return { status: 'rejected', reason: 'Invalid Calendly webhook signature.' };
    }
  } else if (env.NODE_ENV === 'production' || env.REQUIRE_CALENDLY_WEBHOOK_SIGNATURE === 'true') {
    return { status: 'rejected', reason: 'Calendly webhook signing key is not configured.' };
  }

  const webhookProviderEventId = buildCalendlyWebhookIdempotencyKey(input.body);
  if (!webhookProviderEventId) {
    return { status: 'ignored', reason: 'Webhook payload missing invitee identity.' };
  }

  const appointmentProviderEventId = buildCalendlyAppointmentProviderEventId(input.body);
  if (!appointmentProviderEventId) {
    return { status: 'ignored', reason: 'Webhook payload missing invitee resource URI.' };
  }

  const eventKind = mapCalendlyEventType(input.body.event);
  const existing = await input.prisma.schedulingWebhookEvent.findUnique({
    where: {
      provider_providerEventId: {
        provider: 'CALENDLY',
        providerEventId: webhookProviderEventId,
      },
    },
  });

  if (existing?.status === 'processed') {
    return {
      status: 'duplicate',
      tenantId: existing.tenantId,
      appointmentId: existing.appointmentId,
      duplicate: true,
    };
  }

  const webhookRow = existing
    ? await input.prisma.schedulingWebhookEvent.update({
        where: { id: existing.id },
        data: {
          eventType: input.body.event || eventKind,
          status: 'received',
          errorSummary: null,
        },
      })
    : await input.prisma.schedulingWebhookEvent.create({
        data: {
          provider: 'CALENDLY',
          providerEventId: webhookProviderEventId,
          tenantId: config.connection.tenantId,
          connectionKey: config.connection.connectionKey,
          eventType: input.body.event || eventKind,
          status: 'received',
        },
      });

  if (eventKind === 'other') {
    await input.prisma.schedulingWebhookEvent.update({
      where: { id: webhookRow.id },
      data: {
        status: 'ignored',
        processedAt: new Date(),
        errorSummary: `Unhandled Calendly event ${input.body.event || 'unknown'}`,
      },
    });
    return { status: 'ignored', reason: `Unhandled event ${input.body.event || 'unknown'}` };
  }

  const invitee = asRecord(input.body.payload);
  const scheduled = asRecord(invitee?.scheduled_event ?? null);
  const inviteeEmail = pickString(invitee, 'email');
  const inviteeName = pickString(invitee, 'name');
  const start = pickString(scheduled, 'start_time');
  const end = pickString(scheduled, 'end_time');
  const providerInviteeId = appointmentProviderEventId;
  const eventTypeKey = config.eventTypes[0]?.key ?? 'discovery_call';

  const appointment = await input.prisma.schedulingAppointment.upsert({
    where: {
      provider_providerEventId: {
        provider: 'CALENDLY',
        providerEventId: appointmentProviderEventId,
      },
    },
    create: {
      tenantId: config.connection.tenantId,
      connectionKey: config.connection.connectionKey,
      provider: 'CALENDLY',
      providerEventId: appointmentProviderEventId,
      providerInviteeId,
      eventTypeKey,
      status: eventKind === 'cancelled' ? 'cancelled' : 'scheduled',
      scheduledStart: start ? new Date(start) : null,
      scheduledEnd: end ? new Date(end) : null,
      inviteeName,
      inviteeEmail,
      sourceSite: null,
      sourceChannel: 'scheduling',
      conversionEmitted: false,
    },
    update: {
      status: eventKind === 'cancelled' ? 'cancelled' : 'scheduled',
      scheduledStart: start ? new Date(start) : undefined,
      scheduledEnd: end ? new Date(end) : undefined,
      inviteeName: inviteeName ?? undefined,
      inviteeEmail: inviteeEmail ?? undefined,
      providerInviteeId: providerInviteeId ?? undefined,
    },
  });

  // Conversion: skip when UK client-side analytics already own calendly_event_scheduled / generate_lead.
  // Infotech (and future tenants without widget postMessage) may emit booking_completed once.
  const attribution = resolveSchedulingConversionAttribution({
    tenantId: config.connection.tenantId,
    clientSideAnalyticsOwned: config.connection.clientSideAnalyticsOwned,
    alreadyEmitted: appointment.conversionEmitted,
  });
  let conversionEmitted = appointment.conversionEmitted;
  if (eventKind === 'scheduled' && attribution.shouldEmit) {
    conversionEmitted = true;
    await input.prisma.schedulingAppointment.update({
      where: { id: appointment.id },
      data: { conversionEmitted: true },
    });
  }

  await input.prisma.schedulingWebhookEvent.update({
    where: { id: webhookRow.id },
    data: {
      status: 'processed',
      processedAt: new Date(),
      appointmentId: appointment.id,
      errorSummary: null,
    },
  });

  return {
    status: 'processed',
    tenantId: config.connection.tenantId,
    appointmentId: appointment.id,
    duplicate: false,
  };
}
