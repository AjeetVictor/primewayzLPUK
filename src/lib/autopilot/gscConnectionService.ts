/**
 * Google Search Console connection lifecycle for Article Autopilot.
 * Phase 2A.1: single Primewayz UK property with verified Google identity.
 */

import type { GscConnection, PrismaClient } from '@prisma/client';
import { appendActivityLog } from './activityLogService.ts';
import {
  AutopilotError,
  AUTOPILOT_ERROR_CODES,
  conflict,
  forbidden,
  notFound,
  validationError,
} from './apiErrors.ts';
import {
  assertGscConfigured,
  getGscPublicConfigStatus,
  GSC_OAUTH_SCOPE_STRING,
} from './gscConfig.ts';
import {
  classifyGscGoogleError,
  createDefaultGscGoogleApi,
  decryptStoredRefreshToken,
  encryptRefreshTokenForStorage,
  resolveRefreshTokenForPersistence,
  sanitizeGscErrorMessage,
  type GscGoogleApi,
  type GscSiteEntry,
  type GscVerifiedIdentity,
} from './gscClient.ts';
import { issueGscOAuthState, consumeGscOAuthState } from './gscOAuthState.ts';
import {
  emailsMatchCaseInsensitive,
  findExactAccessibleGscProperty,
  gscPropertyNotAccessibleError,
  normaliseRequestedGscProperty,
  parseGscOnboardingInput,
} from './gscPropertyValidation.ts';
import type { AdminActor } from './topicHelpers.ts';
import { actorDisplayName } from './topicHelpers.ts';
import { canManageGscConnection } from './autopilotPermissions.ts';

const CLEARED_CIPHER = '';
const CLEARED_IV = '';
const CLEARED_TAG = '';

export const GSC_RECONNECT_SAFE_MESSAGE =
  'Search Console could not be reconnected. No existing sync data was changed.';

export type GscConnectionDto = {
  id: number;
  status: string;
  requestedSiteUrl: string | null;
  siteUrl: string | null;
  expectedEmail: string | null;
  authorisedEmail: string | null;
  authorisedEmailVerified: boolean | null;
  permissionLevel: string | null;
  identityValidatedAt: string | null;
  scope: string;
  connectedAt: string;
  lastValidatedAt: string | null;
  lastSuccessfulSyncAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  isActive: boolean;
  hasRefreshToken: boolean;
  syncLocked: boolean;
};

export type GscConnectionStatusDto = {
  configuration: ReturnType<typeof getGscPublicConfigStatus>;
  connection: GscConnectionDto | null;
  recentSyncRuns: Array<Record<string, unknown>>;
};

function toIso(value: Date | null | undefined): string | null {
  return value instanceof Date ? value.toISOString() : null;
}

function hasUsableRefreshToken(row: Pick<
  GscConnection,
  'refreshTokenCiphertext' | 'refreshTokenIv' | 'refreshTokenAuthTag'
>): boolean {
  return Boolean(
    row.refreshTokenCiphertext &&
      row.refreshTokenIv &&
      row.refreshTokenAuthTag,
  );
}

export function serializeGscConnection(row: GscConnection): GscConnectionDto {
  return {
    id: row.id,
    status: row.status,
    requestedSiteUrl: row.requestedSiteUrl ?? null,
    siteUrl: row.siteUrl,
    expectedEmail: row.expectedEmail ?? null,
    authorisedEmail: row.authorisedEmail ?? null,
    authorisedEmailVerified: row.authorisedEmailVerified ?? null,
    permissionLevel: row.permissionLevel,
    identityValidatedAt: toIso(row.identityValidatedAt),
    scope: row.scope,
    connectedAt: row.connectedAt.toISOString(),
    lastValidatedAt: toIso(row.lastValidatedAt),
    lastSuccessfulSyncAt: toIso(row.lastSuccessfulSyncAt),
    lastErrorCode: row.lastErrorCode,
    lastErrorMessage: row.lastErrorMessage,
    isActive: row.isActive,
    hasRefreshToken: hasUsableRefreshToken(row),
    syncLocked: Boolean(row.syncLockToken),
  };
}

function assertCanManage(actor: AdminActor) {
  if (!canManageGscConnection(actor.role)) {
    throw forbidden('Only super_admin can manage Google Search Console connections.');
  }
}

async function findPrimaryConnection(prisma: PrismaClient): Promise<GscConnection | null> {
  return prisma.gscConnection.findFirst({
    where: {
      isActive: true,
      status: {
        in: ['CONNECTED_UNCONFIGURED', 'ACTIVE', 'NEEDS_REAUTHENTICATION', 'ERROR'],
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/** Latest retained row for dashboard history when no active connection exists. */
async function findRetainedGscConnection(prisma: PrismaClient): Promise<GscConnection | null> {
  const active = await findPrimaryConnection(prisma);
  if (active) return active;
  return prisma.gscConnection.findFirst({
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Find an existing connection row for a normalised Primewayz UK property URL,
 * regardless of active/disconnected status.
 */
export async function findExistingConnectionForProperty(
  prisma: PrismaClient,
  requestedSiteUrl: string,
  validatedSiteUrl?: string | null,
): Promise<GscConnection | null> {
  const normalisedRequested = normaliseRequestedGscProperty(requestedSiteUrl);
  const lookupUrls = Array.from(
    new Set(
      [normalisedRequested, validatedSiteUrl?.trim()].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );

  for (const siteUrl of lookupUrls) {
    const bySite = await prisma.gscConnection.findFirst({
      where: { siteUrl },
      orderBy: { updatedAt: 'desc' },
    });
    if (bySite) return bySite;
  }

  for (const requested of lookupUrls) {
    const byRequested = await prisma.gscConnection.findFirst({
      where: { requestedSiteUrl: requested },
      orderBy: { updatedAt: 'desc' },
    });
    if (byRequested) return byRequested;
  }

  return null;
}

function isPrismaClientError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return typeof code === 'string' && /^P\d{4}$/.test(code);
}

function logGscPersistenceFailure(
  error: unknown,
  correlationId?: string | null,
  context?: string,
): void {
  console.error('[autopilot:gsc:persistence]', {
    context: context ?? 'unknown',
    correlationId: correlationId ?? null,
    error,
  });
}

function throwGscReconnectPersistenceError(correlationId?: string | null): never {
  throw new AutopilotError(
    AUTOPILOT_ERROR_CODES.GSC_RECONNECT_FAILED,
    GSC_RECONNECT_SAFE_MESSAGE,
    502,
  );
}

function safeAuditMetadata(input: Record<string, unknown>): Record<string, unknown> {
  const blocked = [
    'refreshToken',
    'accessToken',
    'idToken',
    'authorizationCode',
    'code',
    'state',
    'clientSecret',
    'ciphertext',
    'iv',
    'authTag',
    'refreshTokenCiphertext',
    'refreshTokenIv',
    'refreshTokenAuthTag',
  ];
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (blocked.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

export async function getGscConnectionStatus(
  prisma: PrismaClient,
  options?: { recentSyncLimit?: number },
): Promise<GscConnectionStatusDto> {
  const configuration = getGscPublicConfigStatus();
  const connection = await findRetainedGscConnection(prisma);
  const recentSyncRuns = connection
    ? await prisma.gscSyncRun.findMany({
        where: { connectionId: connection.id },
        orderBy: { createdAt: 'desc' },
        take: options?.recentSyncLimit ?? 5,
      })
    : [];

  return {
    configuration,
    connection: connection ? serializeGscConnection(connection) : null,
    recentSyncRuns: recentSyncRuns.map((run) => ({
      id: run.id,
      connectionId: run.connectionId,
      trigger: run.trigger,
      status: run.status,
      dateFrom: run.dateFrom.toISOString().slice(0, 10),
      dateTo: run.dateTo.toISOString().slice(0, 10),
      searchType: run.searchType,
      dataState: run.dataState,
      requestsMade: run.requestsMade,
      daysProcessed: run.daysProcessed,
      rowsFetched: run.rowsFetched,
      rowsUpserted: run.rowsUpserted,
      startedAt: toIso(run.startedAt),
      completedAt: toIso(run.completedAt),
      errorCode: run.errorCode,
      errorMessage: run.errorMessage,
      createdAt: run.createdAt.toISOString(),
    })),
  };
}

export async function createGscAuthorizationUrl(
  prisma: PrismaClient,
  actor: AdminActor,
  body: { requestedSiteUrl?: unknown; expectedEmail?: unknown },
  options?: { googleApi?: GscGoogleApi; correlationId?: string | null },
): Promise<{ authorizationUrl: string; expiresAt: string }> {
  assertCanManage(actor);
  assertGscConfigured();
  const onboarding = parseGscOnboardingInput(body);
  const googleApi = options?.googleApi ?? createDefaultGscGoogleApi();

  const issued = await issueGscOAuthState(prisma, actor.id, onboarding);
  const authorizationUrl = googleApi.generateAuthUrl(issued.state, {
    loginHint: onboarding.expectedEmail,
  });

  await appendActivityLog(prisma, {
    entityType: 'gsc_connection',
    entityId: 'pending',
    eventType: 'gsc_oauth_started',
    actorType: 'user',
    actorId: actor.id,
    actorDisplayName: actorDisplayName(actor),
    source: 'admin',
    metadata: safeAuditMetadata({
      expiresAt: issued.expiresAt.toISOString(),
      requestedSiteUrl: onboarding.requestedSiteUrl,
      expectedEmail: onboarding.expectedEmail,
    }),
    correlationId: options?.correlationId ?? null,
  });

  return {
    authorizationUrl,
    expiresAt: issued.expiresAt.toISOString(),
  };
}

function assertIdentityMatchesExpected(
  identity: GscVerifiedIdentity,
  expectedEmail: string,
): void {
  if (!emailsMatchCaseInsensitive(identity.email, expectedEmail)) {
    throw new AutopilotError(
      AUTOPILOT_ERROR_CODES.GSC_EMAIL_MISMATCH,
      'The Google account authorised during consent does not match the expected email.',
      400,
      {
        expectedEmail,
        authorisedEmail: identity.email,
      },
    );
  }
}

export async function completeGscOAuthCallback(
  prisma: PrismaClient,
  actor: AdminActor,
  input: { code?: string | null; state?: string | null },
  options?: { googleApi?: GscGoogleApi; correlationId?: string | null },
): Promise<{ connection: GscConnectionDto }> {
  assertCanManage(actor);
  assertGscConfigured();

  const code = typeof input.code === 'string' ? input.code.trim() : '';
  const state = typeof input.state === 'string' ? input.state.trim() : '';
  if (!code) throw validationError('Missing OAuth authorization code.', { field: 'code' });
  if (!state) throw validationError('Missing OAuth state.', { field: 'state' });

  const googleApi = options?.googleApi ?? createDefaultGscGoogleApi();
  const existingActive = await findPrimaryConnection(prisma);

  try {
    // 1–2. Consume one-time state (binds super_admin + onboarding values).
    const oauthContext = await consumeGscOAuthState(prisma, state, actor.id);
    const requestedSiteUrl = oauthContext.requestedSiteUrl;
    const expectedEmail = oauthContext.expectedEmail;

    // 3. Exchange code server-side (temporary tokens only — not persisted).
    const exchanged = await googleApi.exchangeCode(code);

    // 4–6. Verify ID token and expected email independently of browser input.
    if (!exchanged.idToken) {
      throw new AutopilotError(
        AUTOPILOT_ERROR_CODES.GSC_IDENTITY_REQUIRED,
        'Google did not return an ID token for identity verification.',
        400,
      );
    }
    const identity = await googleApi.verifyIdToken(exchanged.idToken);
    assertIdentityMatchesExpected(identity, expectedEmail);
    const authorisedEmail = identity.email.trim().toLowerCase();

    await appendActivityLog(prisma, {
      entityType: 'gsc_connection',
      entityId: existingActive ? String(existingActive.id) : 'pending',
      eventType: 'gsc_identity_verified',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      metadata: safeAuditMetadata({
        requestedSiteUrl,
        expectedEmail,
        authorisedEmail,
        googleSubjectPresent: true,
      }),
      correlationId: options?.correlationId ?? null,
    });

    const existingPropertyRecord = await findExistingConnectionForProperty(
      prisma,
      requestedSiteUrl,
    );
    const tokenSource = existingActive ?? existingPropertyRecord;

    // 7. Resolve refresh token — never reuse across mismatched Google subjects.
    const refreshToken = resolveRefreshTokenForPersistence({
      exchangedRefreshToken: exchanged.refreshToken,
      existingEncrypted:
        tokenSource && hasUsableRefreshToken(tokenSource)
          ? {
              refreshTokenCiphertext: tokenSource.refreshTokenCiphertext,
              refreshTokenIv: tokenSource.refreshTokenIv,
              refreshTokenAuthTag: tokenSource.refreshTokenAuthTag,
              tokenKeyVersion: tokenSource.tokenKeyVersion,
            }
          : null,
      existingGoogleSubject: tokenSource?.googleSubject ?? null,
      verifiedGoogleSubject: identity.sub,
    });

    // 8–10. List properties and validate exact requested property before save.
    const accessibleSites = await googleApi.listSites(refreshToken);
    const matched = findExactAccessibleGscProperty(requestedSiteUrl, accessibleSites);
    if (!matched) {
      const propertyError = gscPropertyNotAccessibleError(requestedSiteUrl, accessibleSites);
      await appendActivityLog(prisma, {
        entityType: 'gsc_connection',
        entityId: existingPropertyRecord
          ? String(existingPropertyRecord.id)
          : existingActive
            ? String(existingActive.id)
            : 'pending',
        eventType: 'gsc_property_validation_failed',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        metadata: safeAuditMetadata({
          errorCode: propertyError.code,
          requestedSiteUrl,
          expectedEmail,
          authorisedEmail,
          accessibleProperties: (
            propertyError.details as { accessibleProperties?: unknown }
          )?.accessibleProperties,
        }),
        reason: propertyError.message,
        correlationId: options?.correlationId ?? null,
      }).catch(() => undefined);
      throw propertyError;
    }

    const persistTarget =
      (await findExistingConnectionForProperty(
        prisma,
        requestedSiteUrl,
        matched.siteUrl,
      )) ??
      existingPropertyRecord ??
      existingActive;

    const encrypted = encryptRefreshTokenForStorage(refreshToken);
    const scope = exchanged.scope?.trim() || GSC_OAUTH_SCOPE_STRING;
    const now = new Date();

    // 11–12. Persist only after identity + property validation; update existing row when present.
    let connection: GscConnection;
    try {
      connection = await prisma.$transaction(async (tx) => {
        if (persistTarget) {
          await tx.gscConnection.updateMany({
            where: {
              isActive: true,
              id: { not: persistTarget.id },
            },
            data: {
              isActive: false,
              status: 'DISCONNECTED',
              refreshTokenCiphertext: CLEARED_CIPHER,
              refreshTokenIv: CLEARED_IV,
              refreshTokenAuthTag: CLEARED_TAG,
              syncLockToken: null,
              syncLockedAt: null,
            },
          });

          return tx.gscConnection.update({
            where: { id: persistTarget.id },
            data: {
              status: 'ACTIVE',
              isActive: true,
              requestedSiteUrl,
              siteUrl: matched.siteUrl,
              expectedEmail,
              googleSubject: identity.sub,
              authorisedEmail,
              authorisedEmailVerified: true,
              identityValidatedAt: now,
              permissionLevel: matched.permissionLevel,
              refreshTokenCiphertext: encrypted.ciphertext,
              refreshTokenIv: encrypted.iv,
              refreshTokenAuthTag: encrypted.authTag,
              tokenKeyVersion: encrypted.keyVersion,
              scope,
              connectedById: actor.id,
              connectedAt: now,
              lastValidatedAt: now,
              lastErrorCode: null,
              lastErrorMessage: null,
            },
          });
        }

        await tx.gscConnection.updateMany({
          where: { isActive: true },
          data: {
            isActive: false,
            status: 'DISCONNECTED',
            refreshTokenCiphertext: CLEARED_CIPHER,
            refreshTokenIv: CLEARED_IV,
            refreshTokenAuthTag: CLEARED_TAG,
            syncLockToken: null,
            syncLockedAt: null,
          },
        });

        return tx.gscConnection.create({
          data: {
            status: 'ACTIVE',
            isActive: true,
            requestedSiteUrl,
            siteUrl: matched.siteUrl,
            expectedEmail,
            googleSubject: identity.sub,
            authorisedEmail,
            authorisedEmailVerified: true,
            identityValidatedAt: now,
            permissionLevel: matched.permissionLevel,
            refreshTokenCiphertext: encrypted.ciphertext,
            refreshTokenIv: encrypted.iv,
            refreshTokenAuthTag: encrypted.authTag,
            tokenKeyVersion: encrypted.keyVersion,
            scope,
            connectedById: actor.id,
            connectedAt: now,
            lastValidatedAt: now,
          },
        });
      });
    } catch (error) {
      if (isPrismaClientError(error)) {
        logGscPersistenceFailure(error, options?.correlationId, 'oauth-callback');
        throwGscReconnectPersistenceError(options?.correlationId);
      }
      throw error;
    }

    await appendActivityLog(prisma, {
      entityType: 'gsc_connection',
      entityId: String(connection.id),
      eventType: 'gsc_connected',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      newValue: {
        status: connection.status,
        siteUrl: connection.siteUrl,
        permissionLevel: connection.permissionLevel,
      },
      metadata: safeAuditMetadata({
        connectionId: connection.id,
        requestedSiteUrl,
        validatedSiteUrl: matched.siteUrl,
        expectedEmail,
        authorisedEmail,
        permissionLevel: matched.permissionLevel,
      }),
      correlationId: options?.correlationId ?? null,
    });

    await appendActivityLog(prisma, {
      entityType: 'gsc_connection',
      entityId: String(connection.id),
      eventType: 'gsc_property_selected',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      newValue: {
        siteUrl: connection.siteUrl,
        permissionLevel: connection.permissionLevel,
        status: connection.status,
      },
      metadata: safeAuditMetadata({
        connectionId: connection.id,
        requestedSiteUrl,
        validatedSiteUrl: matched.siteUrl,
        permissionLevel: matched.permissionLevel,
      }),
      correlationId: options?.correlationId ?? null,
    });

    return { connection: serializeGscConnection(connection) };
  } catch (error) {
    const message =
      error instanceof AutopilotError
        ? error.message
        : sanitizeGscErrorMessage(error);
    const errorCode =
      error instanceof AutopilotError
        ? error.code
        : classifyGscGoogleError(error).code;

    const isIdentityMismatch =
      errorCode === AUTOPILOT_ERROR_CODES.GSC_EMAIL_MISMATCH ||
      errorCode === AUTOPILOT_ERROR_CODES.GSC_EMAIL_NOT_VERIFIED ||
      errorCode === AUTOPILOT_ERROR_CODES.GSC_IDENTITY_INVALID ||
      errorCode === AUTOPILOT_ERROR_CODES.GSC_IDENTITY_REQUIRED;

    // Property failures already emit gsc_property_validation_failed above.
    if (errorCode !== AUTOPILOT_ERROR_CODES.GSC_PROPERTY_NOT_ACCESSIBLE) {
      await appendActivityLog(prisma, {
        entityType: 'gsc_connection',
        entityId: existingActive ? String(existingActive.id) : 'pending',
        eventType: isIdentityMismatch ? 'gsc_identity_mismatch' : 'gsc_connection_failed',
        actorType: 'user',
        actorId: actor.id,
        actorDisplayName: actorDisplayName(actor),
        source: 'admin',
        metadata: safeAuditMetadata({
          errorCode,
          ...(error instanceof AutopilotError &&
          error.details &&
          typeof error.details === 'object'
            ? (error.details as Record<string, unknown>)
            : {}),
        }),
        reason: message,
        correlationId: options?.correlationId ?? null,
      }).catch(() => undefined);
    }

    // Failed reconnect must leave the previous valid active connection usable
    // unless it was already marked NEEDS_REAUTHENTICATION.
    if (error instanceof AutopilotError) throw error;
    if (isPrismaClientError(error)) {
      logGscPersistenceFailure(error, options?.correlationId, 'oauth-callback');
      throwGscReconnectPersistenceError(options?.correlationId);
    }
    throw new AutopilotError(errorCode, message, 400);
  }
}

export async function listAccessibleGscProperties(
  prisma: PrismaClient,
  actor: AdminActor,
  options?: { googleApi?: GscGoogleApi },
): Promise<{ properties: GscSiteEntry[] }> {
  assertCanManage(actor);
  assertGscConfigured();
  const connection = await findPrimaryConnection(prisma);
  if (!connection) {
    throw notFound('No Google Search Console connection found.');
  }
  if (!hasUsableRefreshToken(connection)) {
    throw new AutopilotError(
      AUTOPILOT_ERROR_CODES.GSC_REAUTHORISATION_REQUIRED,
      'Google Search Console must be reconnected.',
      400,
    );
  }

  const googleApi = options?.googleApi ?? createDefaultGscGoogleApi();
  try {
    const refreshToken = decryptStoredRefreshToken(connection);
    const properties = await googleApi.listSites(refreshToken);
    await prisma.gscConnection.update({
      where: { id: connection.id },
      data: { lastValidatedAt: new Date(), lastErrorCode: null, lastErrorMessage: null },
    });
    return { properties };
  } catch (error) {
    await markConnectionNeedsReauthIfRequired(prisma, connection.id, error);
    if (error instanceof AutopilotError) throw error;
    const classified = classifyGscGoogleError(error);
    throw new AutopilotError(classified.code, classified.message, 502);
  }
}

export async function selectGscProperty(
  prisma: PrismaClient,
  actor: AdminActor,
  siteUrlRaw: unknown,
  options?: { googleApi?: GscGoogleApi; correlationId?: string | null },
): Promise<{ connection: GscConnectionDto }> {
  assertCanManage(actor);
  assertGscConfigured();

  const siteUrl = typeof siteUrlRaw === 'string' ? siteUrlRaw.trim() : '';
  if (!siteUrl) {
    throw validationError('siteUrl is required.', { field: 'siteUrl' });
  }

  const connection = await findPrimaryConnection(prisma);
  if (!connection || !hasUsableRefreshToken(connection)) {
    throw notFound('No Google Search Console connection found.');
  }

  const googleApi = options?.googleApi ?? createDefaultGscGoogleApi();
  let properties: GscSiteEntry[];
  try {
    const refreshToken = decryptStoredRefreshToken(connection);
    properties = await googleApi.listSites(refreshToken);
  } catch (error) {
    await markConnectionNeedsReauthIfRequired(prisma, connection.id, error);
    if (error instanceof AutopilotError) throw error;
    const classified = classifyGscGoogleError(error);
    throw new AutopilotError(classified.code, classified.message, 502);
  }

  const matched = findExactAccessibleGscProperty(siteUrl, properties);
  if (!matched) {
    throw gscPropertyNotAccessibleError(siteUrl, properties);
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.gscConnection.updateMany({
      where: {
        siteUrl: matched.siteUrl,
        id: { not: connection.id },
      },
      data: { siteUrl: null },
    });

    return tx.gscConnection.update({
      where: { id: connection.id },
      data: {
        siteUrl: matched.siteUrl,
        requestedSiteUrl: matched.siteUrl,
        permissionLevel: matched.permissionLevel,
        status: 'ACTIVE',
        lastValidatedAt: new Date(),
        lastErrorCode: null,
        lastErrorMessage: null,
        isActive: true,
      },
    });
  });

  await appendActivityLog(prisma, {
    entityType: 'gsc_connection',
    entityId: String(updated.id),
    eventType: 'gsc_property_selected',
    actorType: 'user',
    actorId: actor.id,
    actorDisplayName: actorDisplayName(actor),
    source: 'admin',
    newValue: {
      siteUrl: updated.siteUrl,
      permissionLevel: updated.permissionLevel,
      status: updated.status,
    },
    metadata: safeAuditMetadata({
      connectionId: updated.id,
      siteUrl: updated.siteUrl,
      validatedSiteUrl: matched.siteUrl,
      permissionLevel: matched.permissionLevel,
    }),
    correlationId: options?.correlationId ?? null,
  });

  return { connection: serializeGscConnection(updated) };
}

export async function disconnectGsc(
  prisma: PrismaClient,
  actor: AdminActor,
  options?: { correlationId?: string | null },
): Promise<{ connection: GscConnectionDto }> {
  assertCanManage(actor);

  const connection = await findPrimaryConnection(prisma);
  if (!connection) {
    throw notFound('No Google Search Console connection found.');
  }

  if (connection.syncLockToken) {
    throw conflict(
      'Cannot disconnect while a sync is in progress.',
      { connectionId: connection.id },
      AUTOPILOT_ERROR_CODES.GSC_SYNC_IN_PROGRESS,
    );
  }

  const updated = await prisma.gscConnection.update({
    where: { id: connection.id },
    data: {
      status: 'DISCONNECTED',
      isActive: false,
      refreshTokenCiphertext: CLEARED_CIPHER,
      refreshTokenIv: CLEARED_IV,
      refreshTokenAuthTag: CLEARED_TAG,
      permissionLevel: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      syncLockToken: null,
      syncLockedAt: null,
    },
  });

  await appendActivityLog(prisma, {
    entityType: 'gsc_connection',
    entityId: String(updated.id),
    eventType: 'gsc_disconnected',
    actorType: 'user',
    actorId: actor.id,
    actorDisplayName: actorDisplayName(actor),
    source: 'admin',
    previousValue: { status: connection.status, siteUrl: connection.siteUrl },
    newValue: { status: updated.status, isActive: updated.isActive },
    metadata: safeAuditMetadata({
      connectionId: updated.id,
      siteUrl: connection.siteUrl,
    }),
    correlationId: options?.correlationId ?? null,
  });

  return { connection: serializeGscConnection(updated) };
}

async function markConnectionNeedsReauthIfRequired(
  prisma: PrismaClient,
  connectionId: number,
  error: unknown,
) {
  const classified = classifyGscGoogleError(error);
  if (!classified.needsReauth) return;
  await prisma.gscConnection.update({
    where: { id: connectionId },
    data: {
      status: 'NEEDS_REAUTHENTICATION',
      lastErrorCode: classified.code,
      lastErrorMessage: classified.message,
    },
  });
}

export async function loadActiveGscConnectionForSync(
  prisma: PrismaClient,
): Promise<GscConnection> {
  const connection = await prisma.gscConnection.findFirst({
    where: {
      isActive: true,
      status: 'ACTIVE',
      siteUrl: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
  });
  if (!connection || !connection.siteUrl || !hasUsableRefreshToken(connection)) {
    throw notFound('No ACTIVE Google Search Console connection with a selected property.');
  }
  return connection;
}
