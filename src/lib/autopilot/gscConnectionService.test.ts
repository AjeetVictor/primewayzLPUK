import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { AutopilotError } from './apiErrors.ts';
import { canManageGscConnection, canReadAutopilot } from './autopilotPermissions.ts';
import {
  completeGscOAuthCallback,
  createGscAuthorizationUrl,
  disconnectGsc,
  selectGscProperty,
  serializeGscConnection,
} from './gscConnectionService.ts';
import { encryptGscRefreshToken } from './gscCrypto.ts';
import type { GscGoogleApi } from './gscClient.ts';

const ENC_KEY = randomBytes(32);
const STATE_SECRET = 't'.repeat(32);

function setGscEnv() {
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID = 'cid';
  process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET = 'csecret';
  process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI =
    'http://localhost:3000/api/admin/autopilot/gsc/oauth/callback';
  process.env.AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY = ENC_KEY.toString('base64');
  process.env.AUTOPILOT_GSC_OAUTH_STATE_SECRET = STATE_SECRET;
}

function makeMockPrisma(seed?: {
  connection?: Record<string, unknown> | null;
}) {
  let connection = seed?.connection ? { ...(seed.connection as object) } as Record<string, unknown> : null;
  const oauthStates: Array<Record<string, unknown>> = [];
  const activity: Array<Record<string, unknown>> = [];
  let nextConnectionId = 1;
  let nextStateId = 1;

  const prisma = {
    gscConnection: {
      findFirst: async () => connection,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        connection = {
          id: nextConnectionId++,
          siteUrl: null,
          permissionLevel: null,
          lastValidatedAt: null,
          lastSuccessfulSyncAt: null,
          lastErrorCode: null,
          lastErrorMessage: null,
          syncLockToken: null,
          syncLockedAt: null,
          isActive: true,
          connectedAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        return connection;
      },
      update: async ({ data }: { data: Record<string, unknown> }) => {
        connection = { ...(connection as object), ...data, updatedAt: new Date() } as Record<
          string,
          unknown
        >;
        return connection;
      },
      updateMany: async ({ data }: { data: Record<string, unknown> }) => {
        if (connection) {
          connection = { ...connection, ...data };
        }
        return { count: connection ? 1 : 0 };
      },
    },
    gscOAuthState: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: nextStateId++, consumedAt: null, ...data };
        oauthStates.push(row);
        return row;
      },
      findUnique: async ({ where }: { where: { nonceHash: string } }) =>
        oauthStates.find((r) => r.nonceHash === where.nonceHash) ?? null,
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: number; consumedAt: null };
        data: { consumedAt: Date };
      }) => {
        const row = oauthStates.find((r) => r.id === where.id && r.consumedAt == null);
        if (!row) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
    },
    gscSyncRun: {
      findMany: async () => [],
    },
    autopilotActivityLog: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        activity.push(data);
        return data;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma),
  };

  return { prisma, getConnection: () => connection, activity };
}

test('permissions: only super_admin manages GSC; readers can view', () => {
  assert.equal(canManageGscConnection('super_admin'), true);
  assert.equal(canManageGscConnection('admin'), false);
  assert.equal(canManageGscConnection('blog_editor'), false);
  assert.equal(canReadAutopilot('blog_editor'), true);
  assert.equal(canReadAutopilot('editor'), true);
});

test('auth URL has correct scope and offline access', async () => {
  setGscEnv();
  const { prisma } = makeMockPrisma();
  let capturedState = '';
  const googleApi: GscGoogleApi = {
    generateAuthUrl(state) {
      capturedState = state;
      return `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&include_granted_scopes=true&prompt=consent&scope=${encodeURIComponent('https://www.googleapis.com/auth/webmasters.readonly')}&state=${encodeURIComponent(state)}`;
    },
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [],
    querySearchAnalytics: async () => [],
  };

  const actor = { id: 1, email: 'admin@example.com', role: 'super_admin' };
  const result = await createGscAuthorizationUrl(prisma as never, actor, { googleApi });
  assert.ok(result.authorizationUrl.includes('access_type=offline'));
  assert.ok(result.authorizationUrl.includes('prompt=consent'));
  assert.ok(result.authorizationUrl.includes(encodeURIComponent('webmasters.readonly')));
  assert.ok(capturedState.length > 10);
});

test('callback stores encrypted refresh token and DTO omits secrets', async () => {
  setGscEnv();
  const { prisma, getConnection } = makeMockPrisma();
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => 'https://example.test',
    exchangeCode: async () => ({
      refreshToken: 'refresh-live-token',
      accessToken: 'access-should-not-persist',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      expiryDate: null,
    }),
    listSites: async () => [],
    querySearchAnalytics: async () => [],
  };

  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const issued = await createGscAuthorizationUrl(prisma as never, actor, { googleApi });
  const state = new URL(issued.authorizationUrl).searchParams.get('state');
  // createGscAuthorizationUrl builds URL via mock — recover state from oauth table via issue path.
  // Re-issue through complete using state from generateAuthUrl capture:
  const auth = await createGscAuthorizationUrl(prisma as never, actor, {
    googleApi: {
      ...googleApi,
      generateAuthUrl(s) {
        return `https://accounts.google.com/o/oauth2/v2/auth?state=${encodeURIComponent(s)}`;
      },
    },
  });
  const oauthState = new URL(auth.authorizationUrl).searchParams.get('state')!;

  const result = await completeGscOAuthCallback(
    prisma as never,
    actor,
    { code: 'auth-code', state: oauthState },
    { googleApi },
  );

  const dtoJson = JSON.stringify(result.connection);
  assert.equal(dtoJson.includes('refresh-live-token'), false);
  assert.equal(dtoJson.includes('access-should-not-persist'), false);
  assert.equal(dtoJson.includes('auth-code'), false);
  assert.equal(result.connection.status, 'CONNECTED_UNCONFIGURED');
  assert.equal(result.connection.hasRefreshToken, true);

  const stored = getConnection()!;
  assert.notEqual(stored.refreshTokenCiphertext, 'refresh-live-token');
  assert.ok(String(stored.refreshTokenCiphertext).length > 0);
  assert.ok(!('refreshTokenCiphertext' in result.connection));
  void state;
});

test('missing first refresh token rejected', async () => {
  setGscEnv();
  const { prisma } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi: GscGoogleApi = {
    generateAuthUrl: (s) => `https://accounts.google.com/?state=${encodeURIComponent(s)}`,
    exchangeCode: async () => ({
      refreshToken: null,
      accessToken: 'access',
      scope: null,
      expiryDate: null,
    }),
    listSites: async () => [],
    querySearchAnalytics: async () => [],
  };
  const auth = await createGscAuthorizationUrl(prisma as never, actor, { googleApi });
  const state = new URL(auth.authorizationUrl).searchParams.get('state')!;
  await assert.rejects(
    () =>
      completeGscOAuthCallback(
        prisma as never,
        actor,
        { code: 'code', state },
        { googleApi },
      ),
    (err: unknown) =>
      err instanceof AutopilotError && err.code === 'GSC_REAUTHORISATION_REQUIRED',
  );
});

test('existing refresh token preserved on reconnect without new token', async () => {
  setGscEnv();
  const encrypted = encryptGscRefreshToken('existing-refresh', ENC_KEY);
  const { prisma, getConnection } = makeMockPrisma({
    connection: {
      id: 9,
      status: 'ACTIVE',
      siteUrl: 'sc-domain:uk.primewayz.com',
      permissionLevel: 'siteOwner',
      refreshTokenCiphertext: encrypted.ciphertext,
      refreshTokenIv: encrypted.iv,
      refreshTokenAuthTag: encrypted.authTag,
      tokenKeyVersion: 1,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      connectedById: 2,
      connectedAt: new Date(),
      isActive: true,
      syncLockToken: null,
      syncLockedAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      lastValidatedAt: null,
      lastSuccessfulSyncAt: null,
      updatedAt: new Date(),
    },
  });
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi: GscGoogleApi = {
    generateAuthUrl: (s) => `https://accounts.google.com/?state=${encodeURIComponent(s)}`,
    exchangeCode: async () => ({
      refreshToken: null,
      accessToken: 'access',
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      expiryDate: null,
    }),
    listSites: async () => [],
    querySearchAnalytics: async () => [],
  };
  const auth = await createGscAuthorizationUrl(prisma as never, actor, { googleApi });
  const state = new URL(auth.authorizationUrl).searchParams.get('state')!;
  await completeGscOAuthCallback(
    prisma as never,
    actor,
    { code: 'code', state },
    { googleApi },
  );
  const stored = getConnection()!;
  assert.ok(String(stored.refreshTokenCiphertext).length > 0);
  assert.notEqual(stored.refreshTokenCiphertext, '');
});

test('property must exist in Google site list', async () => {
  setGscEnv();
  const encrypted = encryptGscRefreshToken('refresh', ENC_KEY);
  const { prisma } = makeMockPrisma({
    connection: {
      id: 3,
      status: 'CONNECTED_UNCONFIGURED',
      siteUrl: null,
      permissionLevel: null,
      refreshTokenCiphertext: encrypted.ciphertext,
      refreshTokenIv: encrypted.iv,
      refreshTokenAuthTag: encrypted.authTag,
      tokenKeyVersion: 1,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      connectedById: 1,
      connectedAt: new Date(),
      isActive: true,
      syncLockToken: null,
      syncLockedAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      lastValidatedAt: null,
      lastSuccessfulSyncAt: null,
      updatedAt: new Date(),
    },
  });
  const actor = { id: 1, email: 'sa@example.com', role: 'super_admin' };
  const googleApi: GscGoogleApi = {
    generateAuthUrl: () => '',
    exchangeCode: async () => ({ refreshToken: null, accessToken: null, scope: null, expiryDate: null }),
    listSites: async () => [{ siteUrl: 'sc-domain:uk.primewayz.com', permissionLevel: 'siteFullUser' }],
    querySearchAnalytics: async () => [],
  };

  await assert.rejects(
    () =>
      selectGscProperty(prisma as never, actor, 'https://evil.example/', { googleApi }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'AUTOPILOT_VALIDATION_ERROR',
  );

  const ok = await selectGscProperty(prisma as never, actor, 'sc-domain:uk.primewayz.com', {
    googleApi,
  });
  assert.equal(ok.connection.status, 'ACTIVE');
  assert.equal(ok.connection.siteUrl, 'sc-domain:uk.primewayz.com');
});

test('disconnect invalidates active connection safely', async () => {
  setGscEnv();
  const encrypted = encryptGscRefreshToken('refresh', ENC_KEY);
  const { prisma, getConnection } = makeMockPrisma({
    connection: {
      id: 4,
      status: 'ACTIVE',
      siteUrl: 'sc-domain:uk.primewayz.com',
      permissionLevel: 'siteOwner',
      refreshTokenCiphertext: encrypted.ciphertext,
      refreshTokenIv: encrypted.iv,
      refreshTokenAuthTag: encrypted.authTag,
      tokenKeyVersion: 1,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      connectedById: 1,
      connectedAt: new Date(),
      isActive: true,
      syncLockToken: null,
      syncLockedAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      lastValidatedAt: null,
      lastSuccessfulSyncAt: null,
      updatedAt: new Date(),
    },
  });
  const actor = { id: 1, email: 'sa@example.com', role: 'super_admin' };
  const result = await disconnectGsc(prisma as never, actor);
  assert.equal(result.connection.status, 'DISCONNECTED');
  assert.equal(result.connection.isActive, false);
  assert.equal(result.connection.hasRefreshToken, false);
  const stored = getConnection()!;
  assert.equal(stored.refreshTokenCiphertext, '');
  assert.equal(JSON.stringify(result.connection).includes('refresh'), false);
});

test('serializeGscConnection never exposes ciphertext fields', () => {
  const dto = serializeGscConnection({
    id: 1,
    status: 'ACTIVE',
    siteUrl: 'sc-domain:uk.primewayz.com',
    permissionLevel: 'siteOwner',
    refreshTokenCiphertext: 'cipher',
    refreshTokenIv: 'iv',
    refreshTokenAuthTag: 'tag',
    tokenKeyVersion: 1,
    scope: 'scope',
    connectedById: 1,
    connectedAt: new Date(),
    lastValidatedAt: null,
    lastSuccessfulSyncAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    syncLockToken: null,
    syncLockedAt: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as never);
  assert.equal('refreshTokenCiphertext' in dto, false);
  assert.equal(dto.hasRefreshToken, true);
});

test('non-super-admin cannot connect', async () => {
  setGscEnv();
  const { prisma } = makeMockPrisma();
  await assert.rejects(
    () =>
      createGscAuthorizationUrl(prisma as never, {
        id: 5,
        email: 'editor@example.com',
        role: 'blog_editor',
      }),
    (err: unknown) => err instanceof AutopilotError && err.status === 403,
  );
});
