import { Prisma, PrismaClient } from '@prisma/client';
import { sanitizeAuditDetails } from './auditSanitize.ts';
import {
  CHAT_CONNECT_AUTHORIZATION_STATUSES,
  CHAT_CONNECT_FRONTEND_VISIBILITY,
} from './constants.ts';
import type {
  ChatConnectAuditEntry,
  ChatConnectAuthorizationStatus,
  ChatConnectFrontendVisibility,
  ChatConnectInstallation,
  ChatConnectInstallationPatch,
  ChatConnectStore,
} from './types.ts';

function asStatus(value: string): ChatConnectAuthorizationStatus {
  if ((CHAT_CONNECT_AUTHORIZATION_STATUSES as readonly string[]).includes(value)) {
    return value as ChatConnectAuthorizationStatus;
  }
  throw new Error('invalid_authorization_status');
}

function asVisibility(value: string): ChatConnectFrontendVisibility {
  if ((CHAT_CONNECT_FRONTEND_VISIBILITY as readonly string[]).includes(value)) {
    return value as ChatConnectFrontendVisibility;
  }
  throw new Error('invalid_frontend_visibility');
}

function toInstallation(row: {
  id: string;
  tenantId: string;
  integrationTechnology: string;
  integrationId: string | null;
  authorizationStatus: string;
  frontendVisibility: string;
  addonVersion: string | null;
  widgetVersion: string | null;
  legacyEnvBinding: boolean;
  heartbeatProtocolAdopted: boolean;
  credentialKeyId: string | null;
  credentialHash: string | null;
  credentialIssuedAt: Date | null;
  credentialRotatedAt: Date | null;
  registeredAt: Date | null;
  provisionedAt: Date | null;
  authorizedAt: Date | null;
  activatedAt: Date | null;
  lastVerifiedHeartbeatAt: Date | null;
  lastAuthenticatedActivityAt: Date | null;
  suspendedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ChatConnectInstallation {
  return {
    ...row,
    authorizationStatus: asStatus(row.authorizationStatus),
    frontendVisibility: asVisibility(row.frontendVisibility),
  };
}

function isUniqueConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export function createPrismaChatConnectStore(prisma: PrismaClient): ChatConnectStore {
  return {
    async list(filter) {
      if (filter?.tenantIds && filter.tenantIds.length === 0) return [];
      const rows = await prisma.chatConnectInstallation.findMany({
        where: filter?.tenantIds ? { tenantId: { in: [...filter.tenantIds] } } : undefined,
        orderBy: [{ tenantId: 'asc' }, { createdAt: 'asc' }],
      });
      return rows.map(toInstallation);
    },
    async findById(id) {
      const row = await prisma.chatConnectInstallation.findUnique({ where: { id } });
      return row ? toInstallation(row) : null;
    },
    async findByCredentialKeyId(keyId) {
      const row = await prisma.chatConnectInstallation.findUnique({ where: { credentialKeyId: keyId } });
      return row ? toInstallation(row) : null;
    },
    async findLegacyBinding(integrationId, tenantId) {
      const row = await prisma.chatConnectInstallation.findFirst({
        where: { legacyEnvBinding: true, integrationId, tenantId },
        orderBy: { createdAt: 'asc' },
      });
      return row ? toInstallation(row) : null;
    },
    async insert(record) {
      const row = await prisma.chatConnectInstallation.create({ data: record });
      return toInstallation(row);
    },
    async update(id, patch: ChatConnectInstallationPatch) {
      const data: Prisma.ChatConnectInstallationUpdateInput = {};
      for (const [key, value] of Object.entries(patch)) {
        if (value !== undefined) (data as Record<string, unknown>)[key] = value;
      }
      const row = await prisma.chatConnectInstallation.update({ where: { id }, data });
      return toInstallation(row);
    },
    async appendAudit(entry) {
      await prisma.chatConnectAuditLog.create({
        data: {
          installationId: entry.installationId,
          tenantId: entry.tenantId,
          actorUserId: entry.actorUserId,
          action: entry.action,
          details: sanitizeAuditDetails(entry.details) as Prisma.InputJsonValue,
          createdAt: entry.createdAt,
        },
      });
    },
    async hasIdempotency(input) {
      const row = await prisma.chatConnectIdempotencyKey.findUnique({
        where: {
          installationId_action_clientActionId: {
            installationId: input.installationId,
            action: input.action,
            clientActionId: input.clientActionId,
          },
        },
        select: { id: true },
      });
      return Boolean(row);
    },
    async claimIdempotency(input) {
      try {
        await prisma.chatConnectIdempotencyKey.create({
          data: {
            installationId: input.installationId,
            action: input.action,
            clientActionId: input.clientActionId,
            createdAt: input.at,
          },
        });
        return true;
      } catch (err) {
        if (isUniqueConflict(err)) return false;
        throw err;
      }
    },
    async pruneIdempotency(input) {
      const limit = Math.max(0, Math.floor(input.limit));
      if (limit === 0) return 0;
      const rows = await prisma.chatConnectIdempotencyKey.findMany({
        where: { action: input.action, createdAt: { lt: input.olderThan } },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });
      if (rows.length === 0) return 0;
      const result = await prisma.chatConnectIdempotencyKey.deleteMany({
        where: { id: { in: rows.map((row) => row.id) } },
      });
      return result.count;
    },
    async listAudit(installationId) {
      const rows = await prisma.chatConnectAuditLog.findMany({
        where: { installationId },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((row): ChatConnectAuditEntry => ({
        installationId: row.installationId,
        tenantId: row.tenantId,
        actorUserId: row.actorUserId,
        action: row.action,
        details: sanitizeAuditDetails(row.details),
        createdAt: row.createdAt,
      }));
    },
  };
}
