import { randomBytes } from 'node:crypto';
import { sanitizeAuditDetails } from './auditSanitize.ts';
import { deriveConnectionHealth } from './connectionHealth.ts';
import {
  CHAT_CONNECT_HEARTBEAT_INTERVAL_MS,
  CHAT_CONNECT_REGISTRATION_TECHNOLOGIES,
  FIRST_PARTY_PW_UK_INSTALLATION_ID,
  FIRST_PARTY_PW_UK_INTEGRATION_TECHNOLOGY,
  FIRST_PARTY_PW_UK_TENANT_ID,
} from './constants.ts';
import { pruneExpiredHeartbeatIdempotency } from './idempotencyRetention.ts';
import { issueInstallationCredential, verifyInstallationSecret } from './credentials.ts';
import { getTenantById, isTenantActive, PLATFORM_TENANTS } from '../platform/tenantRegistry.ts';
import {
  ChatConnectError,
  type ChatConnectAdminPrincipal,
  type ChatConnectAuthorizationStatus,
  type ChatConnectFrontendVisibility,
  type ChatConnectInstallation,
  type ChatConnectStore,
} from './types.ts';

const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,31}$/;
const CLIENT_ACTION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{35,63}$/;
const INSTALLATION_ID_PATTERN = /^cci_[a-z0-9_]{8,48}$/;

export type ChatConnectInstallationView = {
  id: string;
  tenantId: string;
  tenantKey: string;
  tenantBrand: string | null;
  tenantDisplayName: string | null;
  integrationTechnology: string;
  authorizationStatus: ChatConnectAuthorizationStatus;
  connectionHealth: ReturnType<typeof deriveConnectionHealth>;
  frontendVisibility: ChatConnectFrontendVisibility;
  addonVersion: string | null;
  widgetVersion: string | null;
  registeredAt: string | null;
  provisionedAt: string | null;
  activatedAt: string | null;
  lastVerifiedHeartbeatAt: string | null;
  lastAuthenticatedActivityAt: string | null;
  legacyEnvBinding: boolean;
  classification: 'first-party' | 'legacy-environment' | 'connector';
  credentialKeyId: string | null;
  credentialIssuedAt: string | null;
  credentialRotatedAt: string | null;
  heartbeatIntervalSeconds: number;
};

export type IssuedCredentialView = {
  keyId: string;
  secret: string;
};

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

export function installationClassification(
  record: Pick<ChatConnectInstallation, 'id' | 'tenantId' | 'integrationTechnology' | 'legacyEnvBinding'>,
): ChatConnectInstallationView['classification'] {
  if (record.legacyEnvBinding) return 'legacy-environment';
  if (
    record.id === FIRST_PARTY_PW_UK_INSTALLATION_ID
    && record.tenantId === FIRST_PARTY_PW_UK_TENANT_ID
    && record.integrationTechnology === FIRST_PARTY_PW_UK_INTEGRATION_TECHNOLOGY
  ) {
    return 'first-party';
  }
  return 'connector';
}

export function toInstallationView(record: ChatConnectInstallation, now: Date): ChatConnectInstallationView {
  const tenant = getTenantById(record.tenantId);
  return {
    id: record.id,
    tenantId: record.tenantId,
    tenantKey: record.tenantId,
    tenantBrand: tenant?.brand ?? null,
    tenantDisplayName: tenant?.displayName ?? null,
    integrationTechnology: record.integrationTechnology,
    authorizationStatus: record.authorizationStatus,
    connectionHealth: deriveConnectionHealth(record, now),
    frontendVisibility: record.frontendVisibility,
    addonVersion: record.addonVersion,
    widgetVersion: record.widgetVersion,
    registeredAt: iso(record.registeredAt),
    provisionedAt: iso(record.provisionedAt),
    activatedAt: iso(record.activatedAt),
    lastVerifiedHeartbeatAt: iso(record.lastVerifiedHeartbeatAt),
    lastAuthenticatedActivityAt: iso(record.lastAuthenticatedActivityAt),
    legacyEnvBinding: record.legacyEnvBinding,
    classification: installationClassification(record),
    credentialKeyId: record.credentialKeyId,
    credentialIssuedAt: iso(record.credentialIssuedAt),
    credentialRotatedAt: iso(record.credentialRotatedAt),
    heartbeatIntervalSeconds: CHAT_CONNECT_HEARTBEAT_INTERVAL_MS / 1000,
  };
}

function fail(status: number, code: string, message: string): never {
  throw new ChatConnectError(status, code, message);
}

async function audit(
  store: ChatConnectStore,
  record: ChatConnectInstallation,
  action: string,
  actorUserId: number | null,
  details: Record<string, unknown>,
  at: Date,
): Promise<void> {
  await store.appendAudit({
    installationId: record.id,
    tenantId: record.tenantId,
    actorUserId,
    action,
    details: sanitizeAuditDetails(details),
    createdAt: at,
  });
}

function assertOwner(principal: ChatConnectAdminPrincipal): void {
  if (!principal.isPlatformOwner) {
    fail(403, 'platform_owner_required', 'This installation action is restricted to the platform Host/Owner.');
  }
}

export function visibleTenantIds(
  principal: ChatConnectAdminPrincipal,
  requestedTenantId?: string | null,
): string[] | undefined {
  if (requestedTenantId) {
    if (!getTenantById(requestedTenantId)) fail(400, 'invalid_tenant', 'Unknown tenant.');
    if (!principal.isPlatformOwner && !principal.tenantIds.includes(requestedTenantId)) {
      fail(403, 'tenant_access_denied', 'This account is not assigned to the selected tenant.');
    }
    return [requestedTenantId];
  }
  if (principal.isPlatformOwner) return undefined;
  return [...principal.tenantIds];
}

export async function listInstallations(
  store: ChatConnectStore,
  principal: ChatConnectAdminPrincipal,
  requestedTenantId: string | null,
  now: Date,
): Promise<ChatConnectInstallationView[]> {
  const tenantIds = visibleTenantIds(principal, requestedTenantId);
  const records = await store.list(tenantIds ? { tenantIds } : undefined);
  return records.map((record) => toInstallationView(record, now));
}

function parseVersion(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !VERSION_PATTERN.test(value)) {
    fail(400, 'invalid_request', `${field} must be a short version string.`);
  }
  return value;
}

function parseVisibility(value: unknown): ChatConnectFrontendVisibility {
  if (value === undefined || value === null || value === '') return 'hidden';
  if (value === 'visible' || value === 'hidden') return value;
  fail(400, 'invalid_request', 'frontendVisibility must be visible or hidden.');
}

export async function registerInstallation(
  store: ChatConnectStore,
  principal: ChatConnectAdminPrincipal,
  input: {
    tenantId: unknown;
    integrationTechnology: unknown;
    addonVersion?: unknown;
    widgetVersion?: unknown;
    frontendVisibility?: unknown;
  },
  now: Date,
): Promise<{ installation: ChatConnectInstallationView; credential: IssuedCredentialView }> {
  assertOwner(principal);
  if (typeof input.tenantId !== 'string' || !getTenantById(input.tenantId)) {
    fail(400, 'invalid_tenant', 'tenantId must be an existing platform tenant.');
  }
  const tenantId = input.tenantId;
  if (typeof input.integrationTechnology !== 'string'
    || !(CHAT_CONNECT_REGISTRATION_TECHNOLOGIES as readonly string[]).includes(input.integrationTechnology)) {
    fail(400, 'invalid_request', 'integrationTechnology is not available for registration.');
  }
  const frontendVisibility = parseVisibility(input.frontendVisibility);
  const addonVersion = parseVersion(input.addonVersion, 'addonVersion');
  const widgetVersion = parseVersion(input.widgetVersion, 'widgetVersion');
  const id = `cci_${randomBytes(8).toString('hex')}`;
  const issued = issueInstallationCredential(id);
  const record: ChatConnectInstallation = {
    id,
    tenantId,
    integrationTechnology: input.integrationTechnology,
    integrationId: null,
    authorizationStatus: 'registered',
    frontendVisibility,
    addonVersion,
    widgetVersion,
    legacyEnvBinding: false,
    heartbeatProtocolAdopted: false,
    credentialKeyId: issued.keyId,
    credentialHash: issued.hash,
    credentialIssuedAt: now,
    credentialRotatedAt: null,
    registeredAt: now,
    provisionedAt: null,
    authorizedAt: null,
    activatedAt: null,
    lastVerifiedHeartbeatAt: null,
    lastAuthenticatedActivityAt: null,
    suspendedAt: null,
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await store.insert(record);
  await audit(store, record, 'registered', principal.id, {
    integrationTechnology: record.integrationTechnology,
    frontendVisibility,
    keyId: issued.keyId,
  }, now);
  return {
    installation: toInstallationView(record, now),
    credential: { keyId: issued.keyId, secret: issued.secret },
  };
}

async function requireInstallation(store: ChatConnectStore, id: string): Promise<ChatConnectInstallation> {
  if (!INSTALLATION_ID_PATTERN.test(id)) fail(400, 'invalid_request', 'Unknown installation identifier.');
  const record = await store.findById(id);
  if (!record) fail(404, 'installation_not_found', 'Installation not found.');
  return record;
}

export async function suspendInstallation(
  store: ChatConnectStore,
  principal: ChatConnectAdminPrincipal,
  id: string,
  now: Date,
): Promise<ChatConnectInstallationView> {
  assertOwner(principal);
  const record = await requireInstallation(store, id);
  if (record.authorizationStatus === 'suspended') return toInstallationView(record, now);
  if (record.authorizationStatus !== 'active') {
    fail(409, 'invalid_transition', 'Only an active installation can be suspended.');
  }
  const updated = await store.update(id, {
    authorizationStatus: 'suspended',
    suspendedAt: now,
    updatedAt: now,
  });
  await audit(store, updated, 'suspended', principal.id, {}, now);
  return toInstallationView(updated, now);
}

export async function reactivateInstallation(
  store: ChatConnectStore,
  principal: ChatConnectAdminPrincipal,
  id: string,
  now: Date,
): Promise<ChatConnectInstallationView> {
  assertOwner(principal);
  const record = await requireInstallation(store, id);
  if (record.authorizationStatus !== 'suspended') {
    fail(409, 'invalid_transition', 'Only a suspended installation can be reactivated.');
  }
  const updated = await store.update(id, {
    authorizationStatus: 'active',
    suspendedAt: null,
    updatedAt: now,
  });
  await audit(store, updated, 'reactivated', principal.id, {
    verifiedActivationPreserved: record.activatedAt === null ? 'unknown' : 'preserved',
  }, now);
  return toInstallationView(updated, now);
}

export async function revokeInstallation(
  store: ChatConnectStore,
  principal: ChatConnectAdminPrincipal,
  id: string,
  now: Date,
): Promise<ChatConnectInstallationView> {
  assertOwner(principal);
  const record = await requireInstallation(store, id);
  if (record.authorizationStatus === 'revoked') return toInstallationView(record, now);
  const updated = await store.update(id, {
    authorizationStatus: 'revoked',
    revokedAt: record.revokedAt ?? now,
    credentialKeyId: null,
    credentialHash: null,
    updatedAt: now,
  });
  await audit(store, updated, 'revoked', principal.id, { credentialRetired: true }, now);
  return toInstallationView(updated, now);
}

export async function rotateInstallationCredential(
  store: ChatConnectStore,
  principal: ChatConnectAdminPrincipal,
  id: string,
  now: Date,
): Promise<{ installation: ChatConnectInstallationView; credential: IssuedCredentialView }> {
  assertOwner(principal);
  const record = await requireInstallation(store, id);
  if (record.authorizationStatus === 'revoked') {
    fail(409, 'invalid_transition', 'A revoked installation cannot receive a new credential.');
  }
  const issued = issueInstallationCredential(record.id);
  const updated = await store.update(id, {
    credentialKeyId: issued.keyId,
    credentialHash: issued.hash,
    credentialRotatedAt: now,
    updatedAt: now,
  });
  await audit(store, updated, 'credential_rotated', principal.id, { keyId: issued.keyId, previousKeyRetired: true }, now);
  return {
    installation: toInstallationView(updated, now),
    credential: { keyId: issued.keyId, secret: issued.secret },
  };
}

export type AuthenticatedInstallation = {
  installation: ChatConnectInstallation;
};

export async function authenticateInstallationCredential(
  store: ChatConnectStore,
  presented: { keyId: string; secret: string } | null,
): Promise<ChatConnectInstallation | null> {
  if (!presented) return null;
  const record = await store.findByCredentialKeyId(presented.keyId);
  const installationId = record?.id ?? 'unbound';
  const hash = record?.credentialHash ?? null;
  const valid = verifyInstallationSecret(installationId, presented.secret, hash);
  if (!record || !valid || record.authorizationStatus === 'revoked') return null;
  return record;
}

function assertClientActionId(value: unknown): string {
  if (typeof value !== 'string' || !CLIENT_ACTION_PATTERN.test(value)) {
    fail(400, 'invalid_request', 'clientActionId must be a 36-64 character identifier.');
  }
  return value;
}

function versionUpdates(input: { addonVersion?: string | null; widgetVersion?: string | null }) {
  return {
    ...(input.addonVersion ? { addonVersion: input.addonVersion } : {}),
    ...(input.widgetVersion ? { widgetVersion: input.widgetVersion } : {}),
  };
}

export async function activateInstallation(
  store: ChatConnectStore,
  installation: ChatConnectInstallation,
  input: { clientActionId: unknown; addonVersion: unknown; widgetVersion: unknown },
  now: Date,
): Promise<{ installation: ChatConnectInstallationView; replayed: boolean; tenantOperational: boolean }> {
  const clientActionId = assertClientActionId(input.clientActionId);
  const versions = {
    addonVersion: parseVersion(input.addonVersion, 'addonVersion'),
    widgetVersion: parseVersion(input.widgetVersion, 'widgetVersion'),
  };
  if (await store.hasIdempotency({ installationId: installation.id, action: 'activate', clientActionId })) {
    const current = await store.findById(installation.id);
    if (!current) fail(404, 'installation_not_found', 'Installation not found.');
    return { installation: toInstallationView(current, now), replayed: true, tenantOperational: tenantOperational(current.tenantId) };
  }
  if (installation.authorizationStatus === 'suspended') {
    fail(403, 'installation_suspended', 'A suspended installation cannot be activated by the connector.');
  }
  if (installation.authorizationStatus === 'revoked') {
    fail(403, 'installation_revoked', 'This installation has been revoked.');
  }
  if (installation.authorizationStatus === 'active') {
    fail(409, 'invalid_transition', 'This installation is already active.');
  }
  if (installation.authorizationStatus !== 'registered') {
    fail(409, 'invalid_transition', 'This installation cannot be activated.');
  }
  const won = await store.claimIdempotency({ installationId: installation.id, action: 'activate', clientActionId, at: now });
  if (!won) {
    const current = await store.findById(installation.id);
    if (!current) fail(404, 'installation_not_found', 'Installation not found.');
    return { installation: toInstallationView(current, now), replayed: true, tenantOperational: tenantOperational(current.tenantId) };
  }
  const latest = await store.findById(installation.id);
  if (!latest || latest.authorizationStatus !== 'registered') {
    const current = latest ?? installation;
    return { installation: toInstallationView(current, now), replayed: true, tenantOperational: tenantOperational(current.tenantId) };
  }
  const updated = await store.update(installation.id, {
    authorizationStatus: 'active',
    authorizedAt: now,
    activatedAt: now,
    ...versionUpdates(versions),
    updatedAt: now,
  });
  await audit(store, updated, 'activated', null, { clientActionId }, now);
  return { installation: toInstallationView(updated, now), replayed: false, tenantOperational: tenantOperational(updated.tenantId) };
}

function assertHeartbeatPermitted(installation: ChatConnectInstallation): void {
  if (installation.authorizationStatus === 'registered') {
    fail(403, 'installation_not_active', 'A heartbeat cannot activate an installation.');
  }
  if (installation.authorizationStatus === 'suspended') {
    fail(403, 'installation_suspended', 'A heartbeat cannot override installation suspension.');
  }
  if (installation.authorizationStatus === 'revoked') {
    fail(403, 'installation_revoked', 'This installation has been revoked.');
  }
  if (installation.authorizationStatus !== 'active') {
    fail(403, 'installation_not_active', 'This installation is not active.');
  }
}

export async function recordVerifiedHeartbeat(
  store: ChatConnectStore,
  installation: ChatConnectInstallation,
  input: { clientActionId: unknown; addonVersion: unknown; widgetVersion: unknown },
  now: Date,
): Promise<{ installation: ChatConnectInstallationView; replayed: boolean; tenantOperational: boolean }> {
  const clientActionId = assertClientActionId(input.clientActionId);
  const versions = {
    addonVersion: parseVersion(input.addonVersion, 'addonVersion'),
    widgetVersion: parseVersion(input.widgetVersion, 'widgetVersion'),
  };
  if (await store.hasIdempotency({ installationId: installation.id, action: 'heartbeat', clientActionId })) {
    const current = await store.findById(installation.id);
    if (!current) fail(404, 'installation_not_found', 'Installation not found.');
    assertHeartbeatPermitted(current);
    return { installation: toInstallationView(current, now), replayed: true, tenantOperational: tenantOperational(current.tenantId) };
  }
  assertHeartbeatPermitted(installation);
  await pruneExpiredHeartbeatIdempotency(store, now);
  const won = await store.claimIdempotency({ installationId: installation.id, action: 'heartbeat', clientActionId, at: now });
  if (!won) {
    const current = await store.findById(installation.id);
    if (!current) fail(404, 'installation_not_found', 'Installation not found.');
    assertHeartbeatPermitted(current);
    return { installation: toInstallationView(current, now), replayed: true, tenantOperational: tenantOperational(current.tenantId) };
  }
  const updated = await store.update(installation.id, {
    heartbeatProtocolAdopted: true,
    lastVerifiedHeartbeatAt: now,
    ...versionUpdates(versions),
    updatedAt: now,
  });
  return {
    installation: toInstallationView(updated, now),
    replayed: false,
    tenantOperational: tenantOperational(updated.tenantId),
  };
}

export function tenantOperational(tenantId: string, env: NodeJS.ProcessEnv = process.env): boolean {
  const tenant = getTenantById(tenantId);
  return Boolean(tenant && isTenantActive(tenant, env));
}

export function registrationTenantOptions(principal: ChatConnectAdminPrincipal) {
  return PLATFORM_TENANTS
    .filter((tenant) => principal.isPlatformOwner || principal.tenantIds.includes(tenant.tenantId))
    .map((tenant) => ({
      tenantId: tenant.tenantId,
      brand: tenant.brand,
      displayName: tenant.displayName,
      registryActive: tenant.active,
      activationControlled: Boolean(tenant.activationEnv),
    }));
}

export function isInstallationId(value: string): boolean {
  return INSTALLATION_ID_PATTERN.test(value);
}
