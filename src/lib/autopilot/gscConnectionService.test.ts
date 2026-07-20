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
import type { GscGoogleApi, GscVerifiedIdentity } from './gscClient.ts';

const ENC_KEY = randomBytes(32);
const STATE_SECRET = 't'.repeat(32);

const ONBOARDING = {
  requestedSiteUrl: 'https://uk.primewayz.com/',
  expectedEmail: 'owner@example.com',
};

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
  let connection = seed?.connection
    ? ({ ...(seed.connection as object) } as Record<string, unknown>)
    : null;
  const oauthStates: Array<Record<string, unknown>> = [];
  const activity: Array<Record<string, unknown>> = [];
  let nextConnectionId = 1;
  let nextStateId = 1;
  let activatedBeforeValidation = false;

  const prisma = {
    gscConnection: {
      findFirst: async () => connection,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (data.status === 'ACTIVE' && !data.identityValidatedAt) {
          activatedBeforeValidation = true;
        }
        connection = {
          id: nextConnectionId++,
          siteUrl: null,
          requestedSiteUrl: null,
          expectedEmail: null,
          googleSubject: null,
          authorisedEmail: null,
          authorisedEmailVerified: null,
          identityValidatedAt: null,
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

  return {
    prisma,
    getConnection: () => connection,
    activity,
    wasActivatedBeforeValidation: () => activatedBeforeValidation,
  };
}

function mockGoogleApi(overrides: Partial<GscGoogleApi> = {}): GscGoogleApi {
  const identity: GscVerifiedIdentity = {
    sub: 'google-sub-1',
    email: ONBOARDING.expectedEmail,
    emailVerified: true,
  };
  return {
    generateAuthUrl(state, options) {
      const params = new URLSearchParams({
        access_type: 'offline',
        include_granted_scopes: 'true',
        prompt: 'consent',
        scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
        state,
      });
      if (options?.loginHint) params.set('login_hint', options.loginHint);
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    exchangeCode: async () => ({
      refreshToken: 'refresh-live-token',
      accessToken: 'access-should-not-persist',
      idToken: 'id-token-should-not-persist',
      scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
      expiryDate: null,
    }),
    verifyIdToken: async () => identity,
    listSites: async () => [
      { siteUrl: 'https://uk.primewayz.com/', permissionLevel: 'siteOwner' },
    ],
    querySearchAnalytics: async () => [],
    ...overrides,
  };
}

async function startAuth(
  prisma: unknown,
  actor: { id: number; email: string; role: string },
  googleApi: GscGoogleApi,
  body = ONBOARDING,
) {
  const auth = await createGscAuthorizationUrl(prisma as never, actor, body, { googleApi });
  const state = new URL(auth.authorizationUrl).searchParams.get('state');
  assert.ok(state);
  return { auth, state: state! };
}

test('permissions: only super_admin manages GSC; readers can view', () => {
  assert.equal(canManageGscConnection('super_admin'), true);
  assert.equal(canManageGscConnection('admin'), false);
  assert.equal(canManageGscConnection('blog_editor'), false);
  assert.equal(canReadAutopilot('blog_editor'), true);
  assert.equal(canReadAutopilot('editor'), true);
});

test('auth URL includes openid, email, webmasters.readonly and login_hint only', async () => {
  setGscEnv();
  const { prisma } = makeMockPrisma();
  const googleApi = mockGoogleApi();
  const actor = { id: 1, email: 'admin@example.com', role: 'super_admin' };
  const { auth } = await startAuth(prisma, actor, googleApi);
  const url = new URL(auth.authorizationUrl);
  const scope = url.searchParams.get('scope') ?? '';
  assert.ok(scope.includes('openid'));
  assert.ok(scope.includes('email'));
  assert.ok(scope.includes('webmasters.readonly'));
  assert.equal(url.searchParams.get('login_hint'), ONBOARDING.expectedEmail);
  assert.equal(url.searchParams.get('access_type'), 'offline');
  assert.equal(url.searchParams.get('prompt'), 'consent');
  assert.equal(url.searchParams.get('include_granted_scopes'), 'true');
  assert.equal(url.searchParams.get('expectedEmail'), null);
  assert.equal(url.searchParams.get('requestedSiteUrl'), null);
});

test('successful onboarding creates ACTIVE connection with identity fields', async () => {
  setGscEnv();
  const { prisma, getConnection, activity } = makeMockPrisma();
  const googleApi = mockGoogleApi();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const { state } = await startAuth(prisma, actor, googleApi);

  const result = await completeGscOAuthCallback(
    prisma as never,
    actor,
    { code: 'auth-code', state },
    { googleApi },
  );

  assert.equal(result.connection.status, 'ACTIVE');
  assert.equal(result.connection.siteUrl, 'https://uk.primewayz.com/');
  assert.equal(result.connection.requestedSiteUrl, 'https://uk.primewayz.com/');
  assert.equal(result.connection.expectedEmail, 'owner@example.com');
  assert.equal(result.connection.authorisedEmail, 'owner@example.com');
  assert.equal(result.connection.authorisedEmailVerified, true);
  assert.ok(result.connection.identityValidatedAt);
  assert.equal(result.connection.permissionLevel, 'siteOwner');
  assert.equal(result.connection.hasRefreshToken, true);

  const dtoJson = JSON.stringify(result.connection);
  assert.equal(dtoJson.includes('refresh-live-token'), false);
  assert.equal(dtoJson.includes('access-should-not-persist'), false);
  assert.equal(dtoJson.includes('id-token-should-not-persist'), false);
  assert.equal(dtoJson.includes('auth-code'), false);
  assert.ok(!('refreshTokenCiphertext' in result.connection));
  assert.ok(!('googleSubject' in result.connection));

  const stored = getConnection()!;
  assert.equal(stored.googleSubject, 'google-sub-1');
  assert.notEqual(stored.refreshTokenCiphertext, 'refresh-live-token');
  assert.ok(String(stored.refreshTokenCiphertext).length > 0);
  assert.equal(JSON.stringify(stored).includes('id-token-should-not-persist'), false);

  const metaBlob = JSON.stringify(activity);
  assert.equal(metaBlob.includes('refresh-live-token'), false);
  assert.equal(metaBlob.includes('id-token-should-not-persist'), false);
  assert.ok(activity.some((row) => row.eventType === 'gsc_identity_verified'));
  assert.ok(activity.some((row) => row.eventType === 'gsc_connected'));
});

test('missing ID token rejected and connection not activated', async () => {
  setGscEnv();
  const { prisma, getConnection } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi = mockGoogleApi({
    exchangeCode: async () => ({
      refreshToken: 'refresh',
      accessToken: 'access',
      idToken: null,
      scope: null,
      expiryDate: null,
    }),
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) =>
      err instanceof AutopilotError && err.code === 'GSC_IDENTITY_REQUIRED',
  );
  assert.equal(getConnection(), null);
});

test('invalid ID token rejected', async () => {
  setGscEnv();
  const { prisma, getConnection } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi = mockGoogleApi({
    verifyIdToken: async () => {
      throw new AutopilotError('GSC_IDENTITY_INVALID', 'Google ID token validation failed.', 400);
    },
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_IDENTITY_INVALID',
  );
  assert.equal(getConnection(), null);
});

test('missing email rejected', async () => {
  setGscEnv();
  const { prisma } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi = mockGoogleApi({
    verifyIdToken: async () => {
      throw new AutopilotError(
        'GSC_IDENTITY_INVALID',
        'Google ID token is missing an email address.',
        400,
      );
    },
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_IDENTITY_INVALID',
  );
});

test('email_verified false rejected', async () => {
  setGscEnv();
  const { prisma } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi = mockGoogleApi({
    verifyIdToken: async () => {
      throw new AutopilotError(
        'GSC_EMAIL_NOT_VERIFIED',
        'The authorised Google email is not verified.',
        400,
      );
    },
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_EMAIL_NOT_VERIFIED',
  );
});

test('expected and authorised email case-insensitive match', async () => {
  setGscEnv();
  const { prisma, getConnection } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi = mockGoogleApi({
    verifyIdToken: async () => ({
      sub: 'google-sub-1',
      email: 'Owner@Example.com',
      emailVerified: true,
    }),
  });
  const { state } = await startAuth(prisma, actor, googleApi, {
    requestedSiteUrl: 'https://uk.primewayz.com/',
    expectedEmail: 'OWNER@example.com',
  });
  const result = await completeGscOAuthCallback(
    prisma as never,
    actor,
    { code: 'code', state },
    { googleApi },
  );
  assert.equal(result.connection.status, 'ACTIVE');
  assert.equal(getConnection()?.authorisedEmail, 'owner@example.com');
});

test('wrong authorised email rejected', async () => {
  setGscEnv();
  const { prisma, getConnection, activity } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi = mockGoogleApi({
    verifyIdToken: async () => ({
      sub: 'google-sub-other',
      email: 'other@example.com',
      emailVerified: true,
    }),
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_EMAIL_MISMATCH',
  );
  assert.equal(getConnection(), null);
  assert.ok(activity.some((row) => row.eventType === 'gsc_identity_mismatch'));
});

test('inaccessible property rejected without activating connection', async () => {
  setGscEnv();
  const { prisma, getConnection, activity } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  const googleApi = mockGoogleApi({
    listSites: async () => [
      { siteUrl: 'https://primewayz.com/', permissionLevel: 'siteOwner' },
      { siteUrl: 'sc-domain:primewayz.com', permissionLevel: 'siteFullUser' },
    ],
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) =>
      err instanceof AutopilotError && err.code === 'GSC_PROPERTY_NOT_ACCESSIBLE',
  );
  assert.equal(getConnection(), null);
  assert.ok(activity.some((row) => row.eventType === 'gsc_property_validation_failed'));
});

test('existing refresh token preserved on reconnect for same Google subject', async () => {
  setGscEnv();
  const encrypted = encryptGscRefreshToken('existing-refresh', ENC_KEY);
  const { prisma, getConnection } = makeMockPrisma({
    connection: {
      id: 9,
      status: 'ACTIVE',
      siteUrl: 'https://uk.primewayz.com/',
      requestedSiteUrl: 'https://uk.primewayz.com/',
      expectedEmail: 'owner@example.com',
      googleSubject: 'google-sub-1',
      authorisedEmail: 'owner@example.com',
      authorisedEmailVerified: true,
      identityValidatedAt: new Date(),
      permissionLevel: 'siteOwner',
      refreshTokenCiphertext: encrypted.ciphertext,
      refreshTokenIv: encrypted.iv,
      refreshTokenAuthTag: encrypted.authTag,
      tokenKeyVersion: 1,
      scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
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
  const googleApi = mockGoogleApi({
    exchangeCode: async () => ({
      refreshToken: null,
      accessToken: 'access',
      idToken: 'id-token',
      scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
      expiryDate: null,
    }),
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi });
  const stored = getConnection()!;
  assert.equal(stored.status, 'ACTIVE');
  assert.equal(stored.siteUrl, 'https://uk.primewayz.com/');
  assert.ok(String(stored.refreshTokenCiphertext).length > 0);
  assert.notEqual(stored.refreshTokenCiphertext, '');
});

test('reconnect cannot reuse a token from another Google subject', async () => {
  setGscEnv();
  const encrypted = encryptGscRefreshToken('existing-refresh', ENC_KEY);
  const { prisma } = makeMockPrisma({
    connection: {
      id: 9,
      status: 'ACTIVE',
      siteUrl: 'https://uk.primewayz.com/',
      requestedSiteUrl: 'https://uk.primewayz.com/',
      expectedEmail: 'owner@example.com',
      googleSubject: 'google-sub-old',
      authorisedEmail: 'owner@example.com',
      authorisedEmailVerified: true,
      identityValidatedAt: new Date(),
      permissionLevel: 'siteOwner',
      refreshTokenCiphertext: encrypted.ciphertext,
      refreshTokenIv: encrypted.iv,
      refreshTokenAuthTag: encrypted.authTag,
      tokenKeyVersion: 1,
      scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
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
  const googleApi = mockGoogleApi({
    exchangeCode: async () => ({
      refreshToken: null,
      accessToken: 'access',
      idToken: 'id-token',
      scope: null,
      expiryDate: null,
    }),
    verifyIdToken: async () => ({
      sub: 'google-sub-new',
      email: 'owner@example.com',
      emailVerified: true,
    }),
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) =>
      err instanceof AutopilotError && err.code === 'GSC_REAUTHORISATION_REQUIRED',
  );
});

test('failed reconnect preserves prior valid ACTIVE connection', async () => {
  setGscEnv();
  const encrypted = encryptGscRefreshToken('existing-refresh', ENC_KEY);
  const { prisma, getConnection } = makeMockPrisma({
    connection: {
      id: 11,
      status: 'ACTIVE',
      siteUrl: 'https://uk.primewayz.com/',
      requestedSiteUrl: 'https://uk.primewayz.com/',
      expectedEmail: 'owner@example.com',
      googleSubject: 'google-sub-1',
      authorisedEmail: 'owner@example.com',
      authorisedEmailVerified: true,
      identityValidatedAt: new Date(),
      permissionLevel: 'siteOwner',
      refreshTokenCiphertext: encrypted.ciphertext,
      refreshTokenIv: encrypted.iv,
      refreshTokenAuthTag: encrypted.authTag,
      tokenKeyVersion: 1,
      scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
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
  const googleApi = mockGoogleApi({
    verifyIdToken: async () => ({
      sub: 'google-sub-1',
      email: 'wrong@example.com',
      emailVerified: true,
    }),
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await assert.rejects(
    () =>
      completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi }),
    (err: unknown) => err instanceof AutopilotError && err.code === 'GSC_EMAIL_MISMATCH',
  );
  const stored = getConnection()!;
  assert.equal(stored.status, 'ACTIVE');
  assert.equal(stored.siteUrl, 'https://uk.primewayz.com/');
  assert.equal(stored.refreshTokenCiphertext, encrypted.ciphertext);
  assert.equal(stored.isActive, true);
});

test('property must exist in Google site list for selectGscProperty', async () => {
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
      scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
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
  const googleApi = mockGoogleApi({
    listSites: async () => [
      { siteUrl: 'https://uk.primewayz.com/', permissionLevel: 'siteFullUser' },
    ],
  });

  await assert.rejects(
    () => selectGscProperty(prisma as never, actor, 'https://evil.example/', { googleApi }),
    (err: unknown) =>
      err instanceof AutopilotError &&
      (err.code === 'GSC_PROPERTY_NOT_ACCESSIBLE' || err.code === 'AUTOPILOT_VALIDATION_ERROR'),
  );

  const ok = await selectGscProperty(prisma as never, actor, 'https://uk.primewayz.com/', {
    googleApi,
  });
  assert.equal(ok.connection.status, 'ACTIVE');
  assert.equal(ok.connection.siteUrl, 'https://uk.primewayz.com/');
});

test('disconnect invalidates active connection safely', async () => {
  setGscEnv();
  const encrypted = encryptGscRefreshToken('refresh', ENC_KEY);
  const { prisma, getConnection } = makeMockPrisma({
    connection: {
      id: 4,
      status: 'ACTIVE',
      siteUrl: 'https://uk.primewayz.com/',
      permissionLevel: 'siteOwner',
      refreshTokenCiphertext: encrypted.ciphertext,
      refreshTokenIv: encrypted.iv,
      refreshTokenAuthTag: encrypted.authTag,
      tokenKeyVersion: 1,
      scope: 'openid email https://www.googleapis.com/auth/webmasters.readonly',
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

test('serializeGscConnection never exposes ciphertext or google subject', () => {
  const dto = serializeGscConnection({
    id: 1,
    status: 'ACTIVE',
    siteUrl: 'https://uk.primewayz.com/',
    requestedSiteUrl: 'https://uk.primewayz.com/',
    expectedEmail: 'owner@example.com',
    googleSubject: 'secret-sub',
    authorisedEmail: 'owner@example.com',
    authorisedEmailVerified: true,
    identityValidatedAt: new Date(),
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
  assert.equal('googleSubject' in dto, false);
  assert.equal(dto.hasRefreshToken, true);
  assert.equal(dto.authorisedEmail, 'owner@example.com');
  assert.equal(JSON.stringify(dto).includes('secret-sub'), false);
});

test('non-super-admin cannot initiate onboarding', async () => {
  setGscEnv();
  const { prisma } = makeMockPrisma();
  await assert.rejects(
    () =>
      createGscAuthorizationUrl(
        prisma as never,
        {
          id: 5,
          email: 'editor@example.com',
          role: 'blog_editor',
        },
        ONBOARDING,
      ),
    (err: unknown) => err instanceof AutopilotError && err.status === 403,
  );
});

test('connection is not activated before identity and property validation', async () => {
  setGscEnv();
  const { prisma, getConnection, wasActivatedBeforeValidation } = makeMockPrisma();
  const actor = { id: 2, email: 'sa@example.com', role: 'super_admin' };
  let listCalled = false;
  const googleApi = mockGoogleApi({
    listSites: async () => {
      listCalled = true;
      assert.equal(getConnection(), null);
      return [{ siteUrl: 'https://uk.primewayz.com/', permissionLevel: 'siteOwner' }];
    },
  });
  const { state } = await startAuth(prisma, actor, googleApi);
  await completeGscOAuthCallback(prisma as never, actor, { code: 'code', state }, { googleApi });
  assert.equal(listCalled, true);
  assert.equal(wasActivatedBeforeValidation(), false);
  assert.equal(getConnection()?.status, 'ACTIVE');
});
