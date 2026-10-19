import { sanitizeAuditDetails } from './auditSanitize.ts';
import type {
  ChatConnectAuditEntry,
  ChatConnectInstallation,
  ChatConnectInstallationPatch,
  ChatConnectStore,
} from './types.ts';

function clone(record: ChatConnectInstallation): ChatConnectInstallation {
  return {
    ...record,
    credentialIssuedAt: record.credentialIssuedAt ? new Date(record.credentialIssuedAt) : null,
    credentialRotatedAt: record.credentialRotatedAt ? new Date(record.credentialRotatedAt) : null,
    registeredAt: record.registeredAt ? new Date(record.registeredAt) : null,
    provisionedAt: record.provisionedAt ? new Date(record.provisionedAt) : null,
    authorizedAt: record.authorizedAt ? new Date(record.authorizedAt) : null,
    activatedAt: record.activatedAt ? new Date(record.activatedAt) : null,
    lastVerifiedHeartbeatAt: record.lastVerifiedHeartbeatAt ? new Date(record.lastVerifiedHeartbeatAt) : null,
    lastAuthenticatedActivityAt: record.lastAuthenticatedActivityAt ? new Date(record.lastAuthenticatedActivityAt) : null,
    suspendedAt: record.suspendedAt ? new Date(record.suspendedAt) : null,
    revokedAt: record.revokedAt ? new Date(record.revokedAt) : null,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

export function createMemoryChatConnectStore(seed: ChatConnectInstallation[] = []): ChatConnectStore {
  const installations = new Map<string, ChatConnectInstallation>(seed.map((record) => [record.id, clone(record)]));
  const audit: ChatConnectAuditEntry[] = [];
  const idempotency = new Map<string, { action: string; at: Date }>();

  return {
    async list(filter) {
      const tenantIds = filter?.tenantIds;
      return [...installations.values()]
        .filter((record) => !tenantIds || tenantIds.includes(record.tenantId))
        .map(clone)
        .sort((left, right) => left.tenantId.localeCompare(right.tenantId) || left.createdAt.getTime() - right.createdAt.getTime());
    },
    async findById(id) {
      const record = installations.get(id);
      return record ? clone(record) : null;
    },
    async findByCredentialKeyId(keyId) {
      const record = [...installations.values()].find((item) => item.credentialKeyId === keyId);
      return record ? clone(record) : null;
    },
    async findLegacyBinding(integrationId, tenantId) {
      const record = [...installations.values()].find((item) => (
        item.legacyEnvBinding && item.integrationId === integrationId && item.tenantId === tenantId
      ));
      return record ? clone(record) : null;
    },
    async insert(record) {
      if (installations.has(record.id)) throw new Error('installation_exists');
      installations.set(record.id, clone(record));
      return clone(record);
    },
    async update(id, patch: ChatConnectInstallationPatch) {
      const current = installations.get(id);
      if (!current) throw new Error('installation_missing');
      const next = clone({ ...current, ...patch, id: current.id, createdAt: current.createdAt });
      installations.set(id, next);
      return clone(next);
    },
    async appendAudit(entry) {
      audit.push({
        ...entry,
        details: sanitizeAuditDetails(entry.details),
        createdAt: new Date(entry.createdAt),
      });
    },
    async hasIdempotency(input) {
      return idempotency.has(`${input.installationId}\0${input.action}\0${input.clientActionId}`);
    },
    async claimIdempotency(input) {
      const key = `${input.installationId}\0${input.action}\0${input.clientActionId}`;
      if (idempotency.has(key)) return false;
      idempotency.set(key, { action: input.action, at: new Date(input.at) });
      return true;
    },
    async pruneIdempotency(input) {
      const limit = Math.max(0, Math.floor(input.limit));
      const expired = [...idempotency.entries()]
        .filter(([, entry]) => entry.action === input.action && entry.at.getTime() < input.olderThan.getTime())
        .sort((left, right) => left[1].at.getTime() - right[1].at.getTime())
        .slice(0, limit);
      for (const [key] of expired) idempotency.delete(key);
      return expired.length;
    },
    async listAudit(installationId) {
      return audit
        .filter((entry) => entry.installationId === installationId)
        .map((entry) => ({ ...entry, details: { ...entry.details }, createdAt: new Date(entry.createdAt) }));
    },
  };
}
