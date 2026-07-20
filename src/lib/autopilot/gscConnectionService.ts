/**
 * Google Search Console connection lifecycle for Article Autopilot.
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
  GSC_WEBMASTERS_READONLY_SCOPE,
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
} from './gscClient.ts';
import { issueGscOAuthState, consumeGscOAuthState } from './gscOAuthState.ts';
import type { AdminActor } from './topicHelpers.ts';
import { actorDisplayName } from './topicHelpers.ts';
import { canManageGscConnection } from './autopilotPermissions.ts';

const CLEARED_CIPHER = '';
const CLEARED_IV = '';
const CLEARED_TAG = '';

export type GscConnectionDto = {
  id: number;
  status: string;
  siteUrl: string | null;
  permissionLevel: string | null;
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
    siteUrl: row.siteUrl,
    permissionLevel: row.permissionLevel,
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

export async function getGscConnectionStatus(
  prisma: PrismaClient,
  options?: { recentSyncLimit?: number },
): Promise<GscConnectionStatusDto> {
  const configuration = getGscPublicConfigStatus();
  const connection = await findPrimaryConnection(prisma);
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
  options?: { googleApi?: GscGoogleApi; correlationId?: string | null },
): Promise<{ authorizationUrl: string; expiresAt: string }> {
  assertCanManage(actor);
  assertGscConfigured();
  const googleApi = options?.googleApi ?? createDefaultGscGoogleApi();

  const issued = await issueGscOAuthState(prisma, actor.id);
  const authorizationUrl = googleApi.generateAuthUrl(issued.state);

  await appendActivityLog(prisma, {
    entityType: 'gsc_connection',
    entityId: 'pending',
    eventType: 'gsc_oauth_started',
    actorType: 'user',
    actorId: actor.id,
    actorDisplayName: actorDisplayName(actor),
    source: 'admin',
    metadata: {
      expiresAt: issued.expiresAt.toISOString(),
    },
    correlationId: options?.correlationId ?? null,
  });

  return {
    authorizationUrl,
    expiresAt: issued.expiresAt.toISOString(),
  };
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

  try {
    await consumeGscOAuthState(prisma, state, actor.id);
    const exchanged = await googleApi.exchangeCode(code);

    const existing = await findPrimaryConnection(prisma);
    const refreshToken = resolveRefreshTokenForPersistence({
      exchangedRefreshToken: exchanged.refreshToken,
      existingEncrypted: existing
        ? {
            refreshTokenCiphertext: existing.refreshTokenCiphertext,
            refreshTokenIv: existing.refreshTokenIv,
            refreshTokenAuthTag: existing.refreshTokenAuthTag,
            tokenKeyVersion: existing.tokenKeyVersion,
          }
        : null,
    });

    const encrypted = encryptRefreshTokenForStorage(refreshToken);
    const scope = exchanged.scope?.trim() || GSC_WEBMASTERS_READONLY_SCOPE;
    const now = new Date();

    const connection = await prisma.$transaction(async (tx) => {
      // Soft-disable any other active rows to keep a single credential connection.
      if (existing) {
        await tx.gscConnection.updateMany({
          where: {
            isActive: true,
            id: { not: existing.id },
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
          where: { id: existing.id },
          data: {
            status: 'CONNECTED_UNCONFIGURED',
            isActive: true,
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
            // Keep siteUrl until re-selected; status requires reconfiguration.
            permissionLevel: null,
            siteUrl: null,
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
          status: 'CONNECTED_UNCONFIGURED',
          isActive: true,
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

    await appendActivityLog(prisma, {
      entityType: 'gsc_connection',
      entityId: String(connection.id),
      eventType: 'gsc_connected',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      newValue: { status: connection.status },
      metadata: { connectionId: connection.id },
      correlationId: options?.correlationId ?? null,
    });

    return { connection: serializeGscConnection(connection) };
  } catch (error) {
    const message =
      error instanceof AutopilotError
        ? error.message
        : sanitizeGscErrorMessage(error);
    const code =
      error instanceof AutopilotError
        ? error.code
        : classifyGscGoogleError(error).code;

    await appendActivityLog(prisma, {
      entityType: 'gsc_connection',
      entityId: 'pending',
      eventType: 'gsc_connection_failed',
      actorType: 'user',
      actorId: actor.id,
      actorDisplayName: actorDisplayName(actor),
      source: 'admin',
      metadata: { errorCode: code },
      reason: message,
      correlationId: options?.correlationId ?? null,
    }).catch(() => undefined);

    if (error instanceof AutopilotError) throw error;
    throw new AutopilotError(code, message, 400);
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

  const matched = properties.find((entry) => entry.siteUrl === siteUrl);
  if (!matched) {
    throw validationError(
      'Selected property is not in the accessible Google Search Console site list.',
      { field: 'siteUrl' },
    );
  }

  // Ensure uniqueness: clear siteUrl on other rows if needed.
  const updated = await prisma.$transaction(async (tx) => {
    await tx.gscConnection.updateMany({
      where: {
        siteUrl,
        id: { not: connection.id },
      },
      data: { siteUrl: null },
    });

    return tx.gscConnection.update({
      where: { id: connection.id },
      data: {
        siteUrl: matched.siteUrl,
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
    metadata: { connectionId: updated.id, siteUrl: updated.siteUrl },
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
    metadata: { connectionId: updated.id, siteUrl: connection.siteUrl },
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
