/**
 * Signed, one-time OAuth state for Google Search Console CSRF protection.
 * Onboarding values (requestedSiteUrl, expectedEmail) live in the DB row;
 * the browser only carries an opaque signed reference (userId + nonce + times).
 */

import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { AutopilotError } from './apiErrors.ts';
import type { PrismaLike } from './activityLogService.ts';

export const GSC_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
export const GSC_OAUTH_STATE_SECRET_MIN_LENGTH = 32;

export type GscOAuthStatePayload = {
  userId: number;
  nonce: string;
  issuedAt: number;
  expiresAt: number;
};

export type GscOAuthOnboardingContext = {
  requestedSiteUrl: string;
  expectedEmail: string;
};

export type IssuedGscOAuthState = {
  state: string;
  nonceHash: string;
  expiresAt: Date;
  payload: Omit<GscOAuthStatePayload, 'nonce'>;
  onboarding: GscOAuthOnboardingContext;
};

export type ConsumedGscOAuthState = GscOAuthStatePayload & GscOAuthOnboardingContext;

function resolveStateSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.AUTOPILOT_GSC_OAUTH_STATE_SECRET?.trim() ?? '';
  if (secret.length < GSC_OAUTH_STATE_SECRET_MIN_LENGTH) {
    throw new AutopilotError(
      'GSC_CONFIGURATION_REQUIRED',
      'AUTOPILOT_GSC_OAUTH_STATE_SECRET must be at least 32 characters.',
      503,
      { missing: ['AUTOPILOT_GSC_OAUTH_STATE_SECRET'] },
    );
  }
  return secret;
}

function toBase64Url(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

export function hashGscOAuthNonce(nonce: string): string {
  return createHash('sha256').update(nonce, 'utf8').digest('hex');
}

export function signGscOAuthState(
  payload: GscOAuthStatePayload,
  secret: string = resolveStateSecret(),
): string {
  const body = toBase64Url(JSON.stringify(payload));
  const sig = createHmac('sha256', secret).update(body).digest();
  return `${body}.${toBase64Url(sig)}`;
}

export function verifyGscOAuthState(
  state: string,
  options?: {
    secret?: string;
    now?: Date;
    expectedUserId?: number;
  },
): GscOAuthStatePayload {
  const secret = options?.secret ?? resolveStateSecret();
  const nowMs = (options?.now ?? new Date()).getTime();

  if (typeof state !== 'string' || !state.includes('.')) {
    throw new AutopilotError('GSC_OAUTH_STATE_INVALID', 'OAuth state is invalid.', 400);
  }

  const [body, sigB64] = state.split('.');
  if (!body || !sigB64) {
    throw new AutopilotError('GSC_OAUTH_STATE_INVALID', 'OAuth state is invalid.', 400);
  }

  const expectedSig = createHmac('sha256', secret).update(body).digest();
  let providedSig: Buffer;
  try {
    providedSig = fromBase64Url(sigB64);
  } catch {
    throw new AutopilotError('GSC_OAUTH_STATE_INVALID', 'OAuth state is invalid.', 400);
  }

  if (
    expectedSig.length !== providedSig.length ||
    !timingSafeEqual(expectedSig, providedSig)
  ) {
    throw new AutopilotError('GSC_OAUTH_STATE_INVALID', 'OAuth state signature mismatch.', 400);
  }

  let payload: GscOAuthStatePayload;
  try {
    payload = JSON.parse(fromBase64Url(body).toString('utf8')) as GscOAuthStatePayload;
  } catch {
    throw new AutopilotError('GSC_OAUTH_STATE_INVALID', 'OAuth state payload is invalid.', 400);
  }

  if (
    !Number.isInteger(payload.userId) ||
    payload.userId < 1 ||
    typeof payload.nonce !== 'string' ||
    !payload.nonce ||
    typeof payload.issuedAt !== 'number' ||
    typeof payload.expiresAt !== 'number'
  ) {
    throw new AutopilotError('GSC_OAUTH_STATE_INVALID', 'OAuth state payload is incomplete.', 400);
  }

  if (payload.expiresAt <= nowMs) {
    throw new AutopilotError('GSC_OAUTH_STATE_EXPIRED', 'OAuth state has expired.', 400);
  }

  if (options?.expectedUserId != null && options.expectedUserId !== payload.userId) {
    throw new AutopilotError(
      'GSC_OAUTH_STATE_USER_MISMATCH',
      'OAuth state does not match the authenticated user.',
      403,
    );
  }

  return payload;
}

export async function issueGscOAuthState(
  db: PrismaLike,
  userId: number,
  onboarding: GscOAuthOnboardingContext,
  options?: { now?: Date; secret?: string },
): Promise<IssuedGscOAuthState> {
  const now = options?.now ?? new Date();
  const issuedAt = now.getTime();
  const expiresAtMs = issuedAt + GSC_OAUTH_STATE_TTL_MS;
  const nonce = randomBytes(32).toString('hex');
  const nonceHash = hashGscOAuthNonce(nonce);
  const payload: GscOAuthStatePayload = {
    userId,
    nonce,
    issuedAt,
    expiresAt: expiresAtMs,
  };
  const state = signGscOAuthState(payload, options?.secret ?? resolveStateSecret());
  const expiresAt = new Date(expiresAtMs);

  await db.gscOAuthState.create({
    data: {
      nonceHash,
      userId,
      requestedSiteUrl: onboarding.requestedSiteUrl,
      expectedEmail: onboarding.expectedEmail,
      expiresAt,
    },
  });

  return {
    state,
    nonceHash,
    expiresAt,
    payload: {
      userId,
      issuedAt,
      expiresAt: expiresAtMs,
    },
    onboarding,
  };
}

/**
 * Verify signature + consume one-time nonce transactionally.
 * Returns onboarding values from the server-side row (never from browser query params).
 */
export async function consumeGscOAuthState(
  prisma: PrismaClient,
  state: string,
  expectedUserId: number,
  options?: { now?: Date; secret?: string },
): Promise<ConsumedGscOAuthState> {
  const payload = verifyGscOAuthState(state, {
    expectedUserId,
    now: options?.now,
    secret: options?.secret,
  });
  const nonceHash = hashGscOAuthNonce(payload.nonce);
  const now = options?.now ?? new Date();

  const consumed = await prisma.$transaction(async (tx) => {
    const row = await tx.gscOAuthState.findUnique({ where: { nonceHash } });
    if (!row) {
      throw new AutopilotError('GSC_OAUTH_STATE_INVALID', 'OAuth state was not found.', 400);
    }
    if (row.userId !== expectedUserId) {
      throw new AutopilotError(
        'GSC_OAUTH_STATE_USER_MISMATCH',
        'OAuth state does not match the authenticated user.',
        403,
      );
    }
    if (row.consumedAt) {
      throw new AutopilotError('GSC_OAUTH_STATE_REPLAY', 'OAuth state has already been used.', 400);
    }
    if (row.expiresAt.getTime() <= now.getTime()) {
      throw new AutopilotError('GSC_OAUTH_STATE_EXPIRED', 'OAuth state has expired.', 400);
    }

    const requestedSiteUrl =
      typeof row.requestedSiteUrl === 'string' ? row.requestedSiteUrl.trim() : '';
    const expectedEmail =
      typeof row.expectedEmail === 'string' ? row.expectedEmail.trim().toLowerCase() : '';
    if (!requestedSiteUrl || !expectedEmail) {
      throw new AutopilotError(
        'GSC_OAUTH_STATE_INVALID',
        'OAuth state is missing onboarding context.',
        400,
      );
    }

    const updated = await tx.gscOAuthState.updateMany({
      where: { id: row.id, consumedAt: null },
      data: { consumedAt: now },
    });
    if (updated.count !== 1) {
      throw new AutopilotError('GSC_OAUTH_STATE_REPLAY', 'OAuth state has already been used.', 400);
    }

    return { requestedSiteUrl, expectedEmail };
  });

  return {
    ...payload,
    requestedSiteUrl: consumed.requestedSiteUrl,
    expectedEmail: consumed.expectedEmail,
  };
}
