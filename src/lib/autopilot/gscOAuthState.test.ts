import assert from 'node:assert/strict';
import test from 'node:test';
import { AutopilotError } from './apiErrors.ts';
import {
  consumeGscOAuthState,
  hashGscOAuthNonce,
  issueGscOAuthState,
  signGscOAuthState,
  verifyGscOAuthState,
} from './gscOAuthState.ts';

const SECRET = 'x'.repeat(32);

test('valid state verifies', () => {
  const now = Date.now();
  const payload = {
    userId: 7,
    nonce: 'abc123',
    issuedAt: now,
    expiresAt: now + 60_000,
  };
  const state = signGscOAuthState(payload, SECRET);
  const verified = verifyGscOAuthState(state, { secret: SECRET, now: new Date(now) });
  assert.equal(verified.userId, 7);
  assert.equal(verified.nonce, 'abc123');
});

test('altered state is rejected', () => {
  const now = Date.now();
  const state = signGscOAuthState(
    { userId: 1, nonce: 'n', issuedAt: now, expiresAt: now + 60_000 },
    SECRET,
  );
  const tampered = `${state.slice(0, -2)}aa`;
  assert.throws(
    () => verifyGscOAuthState(tampered, { secret: SECRET }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_OAUTH_STATE_INVALID',
  );
});

test('expired state is rejected', () => {
  const now = Date.now();
  const state = signGscOAuthState(
    { userId: 1, nonce: 'n', issuedAt: now - 120_000, expiresAt: now - 60_000 },
    SECRET,
  );
  assert.throws(
    () => verifyGscOAuthState(state, { secret: SECRET, now: new Date(now) }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_OAUTH_STATE_EXPIRED',
  );
});

test('wrong user is rejected', () => {
  const now = Date.now();
  const state = signGscOAuthState(
    { userId: 9, nonce: 'n', issuedAt: now, expiresAt: now + 60_000 },
    SECRET,
  );
  assert.throws(
    () =>
      verifyGscOAuthState(state, {
        secret: SECRET,
        now: new Date(now),
        expectedUserId: 3,
      }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_OAUTH_STATE_USER_MISMATCH',
  );
});

test('replay is rejected after consume', async () => {
  const rows: Array<{
    id: number;
    nonceHash: string;
    userId: number;
    requestedSiteUrl: string | null;
    expectedEmail: string | null;
    expiresAt: Date;
    consumedAt: Date | null;
  }> = [];

  const prisma = {
    gscOAuthState: {
      create: async ({
        data,
      }: {
        data: {
          nonceHash: string;
          userId: number;
          expiresAt: Date;
          requestedSiteUrl?: string;
          expectedEmail?: string;
        };
      }) => {
        const row = {
          id: rows.length + 1,
          nonceHash: data.nonceHash,
          userId: data.userId,
          requestedSiteUrl: data.requestedSiteUrl ?? null,
          expectedEmail: data.expectedEmail ?? null,
          expiresAt: data.expiresAt,
          consumedAt: null as Date | null,
        };
        rows.push(row);
        return row;
      },
      findUnique: async ({ where }: { where: { nonceHash: string } }) =>
        rows.find((r) => r.nonceHash === where.nonceHash) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: number; consumedAt: null };
        data: { consumedAt: Date };
      }) => {
        const row = rows.find((r) => r.id === where.id && r.consumedAt === null);
        if (!row) return { count: 0 };
        row.consumedAt = data.consumedAt;
        return { count: 1 };
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  process.env.AUTOPILOT_GSC_OAUTH_STATE_SECRET = SECRET;
  const issued = await issueGscOAuthState(
    prisma as never,
    4,
    {
      requestedSiteUrl: 'https://uk.primewayz.com/',
      expectedEmail: 'owner@example.com',
    },
    { secret: SECRET },
  );
  assert.ok(issued.state.includes('.'));
  assert.equal(typeof issued.nonceHash, 'string');
  assert.equal(issued.nonceHash.length, 64);
  assert.equal(issued.onboarding.expectedEmail, 'owner@example.com');

  const consumed = await consumeGscOAuthState(prisma as never, issued.state, 4, {
    secret: SECRET,
  });
  assert.equal(consumed.requestedSiteUrl, 'https://uk.primewayz.com/');
  assert.equal(consumed.expectedEmail, 'owner@example.com');

  await assert.rejects(
    () => consumeGscOAuthState(prisma as never, issued.state, 4, { secret: SECRET }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_OAUTH_STATE_REPLAY',
  );
});

test('consume rejects state missing onboarding context', async () => {
  const rows: Array<{
    id: number;
    nonceHash: string;
    userId: number;
    requestedSiteUrl: string | null;
    expectedEmail: string | null;
    expiresAt: Date;
    consumedAt: Date | null;
  }> = [];

  const prisma = {
    gscOAuthState: {
      create: async ({
        data,
      }: {
        data: {
          nonceHash: string;
          userId: number;
          expiresAt: Date;
          requestedSiteUrl?: string;
          expectedEmail?: string;
        };
      }) => {
        const row = {
          id: rows.length + 1,
          nonceHash: data.nonceHash,
          userId: data.userId,
          requestedSiteUrl: null,
          expectedEmail: null,
          expiresAt: data.expiresAt,
          consumedAt: null as Date | null,
        };
        rows.push(row);
        return row;
      },
      findUnique: async ({ where }: { where: { nonceHash: string } }) =>
        rows.find((r) => r.nonceHash === where.nonceHash) ?? null,
      updateMany: async () => ({ count: 1 }),
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  process.env.AUTOPILOT_GSC_OAUTH_STATE_SECRET = SECRET;
  const issued = await issueGscOAuthState(
    prisma as never,
    1,
    {
      requestedSiteUrl: 'https://uk.primewayz.com/',
      expectedEmail: 'owner@example.com',
    },
    { secret: SECRET },
  );
  // Simulate legacy row without onboarding fields.
  rows[0].requestedSiteUrl = null;
  rows[0].expectedEmail = null;

  await assert.rejects(
    () => consumeGscOAuthState(prisma as never, issued.state, 1, { secret: SECRET }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_OAUTH_STATE_INVALID',
  );
});
