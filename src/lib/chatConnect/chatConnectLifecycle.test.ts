import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { isAdminStateChangingRequest } from '../admin/adminRequestOrigin.ts';
import { isPublicChatCorsPath } from '../chat/publicChatApiCors.ts';
import { deriveConnectionHealth } from './connectionHealth.ts';
import {
  CHAT_CONNECT_CONNECTED_MAX_AGE_MS,
  CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_RETENTION_MS,
  CHAT_CONNECT_STALE_MAX_AGE_MS,
  CHAT_CONNECT_CONNECTOR_TECHNOLOGIES,
  CHAT_CONNECT_REGISTRATION_TECHNOLOGIES,
  FIRST_PARTY_PW_UK_INSTALLATION_ID,
  FIRST_PARTY_PW_UK_INTEGRATION_TECHNOLOGY,
  FIRST_PARTY_PW_UK_TENANT_ID,
  LEGACY_PW_INFOTECH_INSTALLATION_ID,
  LEGACY_PW_INFOTECH_INTEGRATION_ID,
} from './constants.ts';
import { sanitizeAuditDetails } from './auditSanitize.ts';
import { hashInstallationSecret, parseInstallationBearer, verifyInstallationSecret } from './credentials.ts';
import {
  chatConnectBodyErrorHandler,
  chatConnectMethodNotAllowed,
  createChatConnectAdminHandlers,
  createChatConnectConnectorHandlers,
  resetChatConnectRateLimitsForTests,
} from './http.ts';
import { resetHeartbeatIdempotencyPruneForTests } from './idempotencyRetention.ts';
import { recordLegacyChatConnectActivity } from './legacyActivity.ts';
import {
  activateInstallation,
  installationClassification,
  listInstallations,
  recordVerifiedHeartbeat,
  registerInstallation,
  revokeInstallation,
  rotateInstallationCredential,
  suspendInstallation,
  reactivateInstallation,
} from './lifecycle.ts';
import { createMemoryChatConnectStore } from './memoryStore.ts';
import { ChatConnectError, type ChatConnectAdminPrincipal, type ChatConnectInstallation } from './types.ts';
import { INTEGRATION_REGISTRY } from '../integrations/integrationRegistry.ts';
import { getTenantById, isTenantActive, PLATFORM_TENANTS } from '../platform/tenantRegistry.ts';
import { isPublicPlatformCorsPath } from '../platform/publicPlatformApiCors.ts';
import {
  createWordPressChatIntegrationHandler,
  WORDPRESS_CHAT_INTEGRATION_PATH,
} from '../integrations/wordpressChatIntegration.ts';
import type { OperationalChatStore } from '../admin/operationalChatService.ts';
import { CHAT_CONNECT_ACTIVATE_PATH, CHAT_CONNECT_ADMIN_COLLECTION_PATH, CHAT_CONNECT_HEARTBEAT_PATH } from './constants.ts';

const OWNER: ChatConnectAdminPrincipal = { id: 1, role: 'super_admin', isPlatformOwner: true, tenantIds: [] };
const INFOTECH_OPERATOR: ChatConnectAdminPrincipal = { id: 2, role: 'editor', isPlatformOwner: false, tenantIds: ['pw-infotech'] };
const MINUTE = 60 * 1000;
const T0 = new Date('2026-10-19T10:00:00.000Z');

function actionId(seed: string): string {
  return `${seed}${'a'.repeat(36)}`.slice(0, 36);
}

function legacyInstallation(at: Date): ChatConnectInstallation {
  return {
    id: LEGACY_PW_INFOTECH_INSTALLATION_ID,
    tenantId: 'pw-infotech',
    integrationTechnology: 'wordpress',
    integrationId: LEGACY_PW_INFOTECH_INTEGRATION_ID,
    authorizationStatus: 'active',
    frontendVisibility: 'unset',
    addonVersion: null,
    widgetVersion: null,
    legacyEnvBinding: true,
    heartbeatProtocolAdopted: false,
    credentialKeyId: null,
    credentialHash: null,
    credentialIssuedAt: null,
    credentialRotatedAt: null,
    registeredAt: null,
    provisionedAt: at,
    authorizedAt: null,
    activatedAt: null,
    lastVerifiedHeartbeatAt: null,
    lastAuthenticatedActivityAt: null,
    suspendedAt: null,
    revokedAt: null,
    createdAt: at,
    updatedAt: at,
  };
}

test('connection health uses verified heartbeats only', () => {
  const base = { heartbeatProtocolAdopted: false, lastVerifiedHeartbeatAt: null as Date | null };
  assert.equal(deriveConnectionHealth(base, T0), 'unknown');
  assert.equal(deriveConnectionHealth({
    heartbeatProtocolAdopted: false,
    lastVerifiedHeartbeatAt: T0,
  }, T0), 'unknown');
  assert.equal(deriveConnectionHealth({
    heartbeatProtocolAdopted: true,
    lastVerifiedHeartbeatAt: null,
  }, T0), 'unknown');
  assert.equal(deriveConnectionHealth({
    heartbeatProtocolAdopted: true,
    lastVerifiedHeartbeatAt: new Date(T0.getTime() + MINUTE),
  }, T0), 'unknown');
  assert.equal(deriveConnectionHealth({
    heartbeatProtocolAdopted: true,
    lastVerifiedHeartbeatAt: new Date(T0.getTime() - CHAT_CONNECT_CONNECTED_MAX_AGE_MS),
  }, T0), 'connected');
  assert.equal(deriveConnectionHealth({
    heartbeatProtocolAdopted: true,
    lastVerifiedHeartbeatAt: new Date(T0.getTime() - CHAT_CONNECT_CONNECTED_MAX_AGE_MS - 1),
  }, T0), 'stale');
  assert.equal(deriveConnectionHealth({
    heartbeatProtocolAdopted: true,
    lastVerifiedHeartbeatAt: new Date(T0.getTime() - CHAT_CONNECT_STALE_MAX_AGE_MS),
  }, T0), 'stale');
  assert.equal(deriveConnectionHealth({
    heartbeatProtocolAdopted: true,
    lastVerifiedHeartbeatAt: new Date(T0.getTime() - CHAT_CONNECT_STALE_MAX_AGE_MS - 1),
  }, T0), 'disconnected');
});

test('installation bearer tokens keep hyphenated secrets intact', () => {
  const keyId = `cck_${'ab'.repeat(16)}`;
  const secret = `ccs_${'a-b_'.repeat(10)}xyz`;
  const parsed = parseInstallationBearer(`Bearer ${keyId}.${secret}`);
  assert.deepEqual(parsed, { keyId, secret });
});

test('audit details drop secrets and credential material', () => {
  const clean = sanitizeAuditDetails({
    keyId: 'cck_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    secret: 'ccs_supersecretvalue',
    nested: { credentialHash: 'abc', note: 'ok' },
    token: 'bearer-value',
  });
  const serialized = JSON.stringify(clean);
  assert.equal(clean.keyId, '[redacted]');
  assert.equal(serialized.includes('secret'), false);
  assert.equal(serialized.includes('credentialHash'), false);
  assert.equal(serialized.includes('ccs_supersecretvalue'), false);
  assert.deepEqual(clean.nested, { note: 'ok' });
});

test('a tenant can hold multiple installations without a second pw-infotech tenant', async () => {
  const store = createMemoryChatConnectStore();
  const first = await registerInstallation(store, OWNER, {
    tenantId: 'pw-infotech',
    integrationTechnology: 'wordpress',
    frontendVisibility: 'hidden',
  }, T0);
  const second = await registerInstallation(store, OWNER, {
    tenantId: 'pw-infotech',
    integrationTechnology: 'wordpress',
    frontendVisibility: 'visible',
  }, new Date(T0.getTime() + 1000));
  assert.notEqual(first.installation.id, second.installation.id);
  const listed = await listInstallations(store, OWNER, 'pw-infotech', T0);
  assert.equal(listed.length, 2);
  assert.equal(PLATFORM_TENANTS.filter((tenant) => tenant.tenantId === 'pw-infotech').length, 1);
  assert.equal(first.installation.provisionedAt, null);
  assert.equal(first.installation.registeredAt, T0.toISOString());
  assert.equal(first.installation.activatedAt, null);
  assert.equal(first.installation.connectionHealth, 'unknown');
  assert.equal(first.credential.secret.startsWith('ccs_'), true);
  const again = await listInstallations(store, OWNER, null, T0);
  assert.equal(JSON.stringify(again).includes(first.credential.secret), false);
  assert.equal(JSON.stringify(again).includes('credentialHash'), false);
});

test('credentials are bound to the installation and rotation retires the previous secret', async () => {
  const store = createMemoryChatConnectStore();
  const created = await registerInstallation(store, OWNER, {
    tenantId: 'pw-uk',
    integrationTechnology: 'wordpress',
  }, T0);
  const stored = await store.findById(created.installation.id);
  assert.ok(stored?.credentialHash);
  assert.equal(verifyInstallationSecret(created.installation.id, created.credential.secret, stored!.credentialHash), true);
  assert.equal(verifyInstallationSecret('cci_other_installation', created.credential.secret, stored!.credentialHash), false);
  assert.notEqual(hashInstallationSecret(created.installation.id, created.credential.secret), hashInstallationSecret('cci_other_installation', created.credential.secret));

  const activated = await activateInstallation(store, stored!, {
    clientActionId: actionId('act1'),
    addonVersion: '1.0.0',
    widgetVersion: null,
  }, T0);
  assert.equal(activated.installation.authorizationStatus, 'active');
  assert.equal(activated.installation.connectionHealth, 'unknown');
  assert.equal(activated.installation.frontendVisibility, 'hidden');
  assert.equal(activated.installation.activatedAt, T0.toISOString());

  const rotated = await rotateInstallationCredential(store, OWNER, created.installation.id, new Date(T0.getTime() + 5000));
  const after = await store.findById(created.installation.id);
  assert.equal(verifyInstallationSecret(created.installation.id, created.credential.secret, after!.credentialHash), false);
  assert.equal(verifyInstallationSecret(created.installation.id, rotated.credential.secret, after!.credentialHash), true);
  const audit = await store.listAudit(created.installation.id);
  const serialized = JSON.stringify(audit);
  assert.equal(serialized.includes(created.credential.secret), false);
  assert.equal(serialized.includes(rotated.credential.secret), false);
  assert.equal(audit.some((entry) => entry.action === 'credential_rotated'), true);
});

test('heartbeat cannot activate, unsuspend, or refresh a replayed timestamp', async () => {
  const store = createMemoryChatConnectStore();
  const created = await registerInstallation(store, OWNER, { tenantId: 'pw-uk', integrationTechnology: 'wordpress' }, T0);
  const registered = await store.findById(created.installation.id);
  await assert.rejects(
    () => recordVerifiedHeartbeat(store, registered!, { clientActionId: actionId('beat'), addonVersion: null, widgetVersion: null }, T0),
    (err: unknown) => err instanceof ChatConnectError && err.code === 'installation_not_active',
  );
  const stillRegistered = await store.findById(created.installation.id);
  assert.equal(stillRegistered?.authorizationStatus, 'registered');
  assert.equal(stillRegistered?.activatedAt, null);

  await activateInstallation(store, stillRegistered!, { clientActionId: actionId('act2'), addonVersion: null, widgetVersion: null }, T0);
  const active = await store.findById(created.installation.id);
  const firstBeatAt = new Date(T0.getTime() + MINUTE);
  const beat = await recordVerifiedHeartbeat(store, active!, { clientActionId: actionId('beat'), addonVersion: null, widgetVersion: null }, firstBeatAt);
  assert.equal(beat.installation.connectionHealth, 'connected');
  assert.equal(beat.replayed, false);

  const replayAt = new Date(firstBeatAt.getTime() + 11 * MINUTE);
  const replay = await recordVerifiedHeartbeat(store, active!, { clientActionId: actionId('beat'), addonVersion: null, widgetVersion: null }, replayAt);
  assert.equal(replay.replayed, true);
  assert.equal(replay.installation.lastVerifiedHeartbeatAt, firstBeatAt.toISOString());
  assert.equal(replay.installation.connectionHealth, 'stale');

  await suspendInstallation(store, OWNER, created.installation.id, replayAt);
  const suspended = await store.findById(created.installation.id);
  await assert.rejects(
    () => recordVerifiedHeartbeat(store, suspended!, { clientActionId: actionId('newb'), addonVersion: null, widgetVersion: null }, replayAt),
    (err: unknown) => err instanceof ChatConnectError && err.code === 'installation_suspended',
  );
  const afterReject = await store.findById(created.installation.id);
  assert.equal(afterReject?.authorizationStatus, 'suspended');
  assert.equal(afterReject?.lastVerifiedHeartbeatAt?.toISOString(), firstBeatAt.toISOString());
  assert.equal(afterReject?.activatedAt?.toISOString(), T0.toISOString());

  const restored = await reactivateInstallation(store, OWNER, created.installation.id, replayAt);
  assert.equal(restored.authorizationStatus, 'active');
  assert.equal(restored.activatedAt, T0.toISOString());

  await revokeInstallation(store, OWNER, created.installation.id, replayAt);
  const revoked = await store.findById(created.installation.id);
  assert.equal(revoked?.credentialHash, null);
  assert.equal(revoked?.authorizationStatus, 'revoked');
});

test('operators see only granted tenants and cannot manage installations', async () => {
  const store = createMemoryChatConnectStore();
  await registerInstallation(store, OWNER, { tenantId: 'pw-uk', integrationTechnology: 'wordpress' }, T0);
  const infotech = await registerInstallation(store, OWNER, { tenantId: 'pw-infotech', integrationTechnology: 'wordpress' }, T0);
  const visible = await listInstallations(store, INFOTECH_OPERATOR, null, T0);
  assert.deepEqual(visible.map((item) => item.tenantId), ['pw-infotech']);
  await assert.rejects(
    () => listInstallations(store, INFOTECH_OPERATOR, 'pw-uk', T0),
    (err: unknown) => err instanceof ChatConnectError && err.code === 'tenant_access_denied',
  );
  await assert.rejects(
    () => suspendInstallation(store, INFOTECH_OPERATOR, infotech.installation.id, T0),
    (err: unknown) => err instanceof ChatConnectError && err.code === 'platform_owner_required',
  );
});

test('Silver tenant registration does not enable the tenant', async () => {
  const previous = process.env.RRB_SILVER_CAMPAIGN_ENABLED;
  delete process.env.RRB_SILVER_CAMPAIGN_ENABLED;
  try {
    const silver = getTenantById('rrb-silver-campaign');
    assert.ok(silver);
    assert.equal(isTenantActive(silver, process.env), false);
    const store = createMemoryChatConnectStore();
    const created = await registerInstallation(store, OWNER, {
      tenantId: 'rrb-silver-campaign',
      integrationTechnology: 'wordpress',
      frontendVisibility: 'hidden',
    }, T0);
    const record = await store.findById(created.installation.id);
    const activated = await activateInstallation(store, record!, {
      clientActionId: actionId('silv'),
      addonVersion: null,
      widgetVersion: null,
    }, T0);
    assert.equal(activated.tenantOperational, false);
    assert.equal(activated.installation.frontendVisibility, 'hidden');
    const heartbeat = await recordVerifiedHeartbeat(store, await store.findById(created.installation.id) as ChatConnectInstallation, {
      clientActionId: actionId('shbt'),
      addonVersion: null,
      widgetVersion: null,
    }, T0);
    assert.equal(heartbeat.tenantOperational, false);
    assert.equal(isTenantActive(silver, process.env), false);
    assert.equal(process.env.RRB_SILVER_CAMPAIGN_ENABLED, undefined);
  } finally {
    if (previous === undefined) delete process.env.RRB_SILVER_CAMPAIGN_ENABLED;
    else process.env.RRB_SILVER_CAMPAIGN_ENABLED = previous;
  }
});

test('legacy activity is not a heartbeat and does not invent historical dates', async () => {
  const store = createMemoryChatConnectStore([legacyInstallation(T0)]);
  const other = await registerInstallation(store, OWNER, { tenantId: 'pw-infotech', integrationTechnology: 'wordpress' }, T0);
  const activityAt = new Date(T0.getTime() + 5 * MINUTE);
  await recordLegacyChatConnectActivity(store, {
    integrationId: LEGACY_PW_INFOTECH_INTEGRATION_ID,
    tenantId: 'pw-infotech',
    at: activityAt,
  });
  const legacy = await store.findById(LEGACY_PW_INFOTECH_INSTALLATION_ID);
  assert.equal(legacy?.registeredAt, null);
  assert.equal(legacy?.authorizedAt, null);
  assert.equal(legacy?.activatedAt, null);
  assert.equal(legacy?.lastVerifiedHeartbeatAt, null);
  assert.equal(legacy?.heartbeatProtocolAdopted, false);
  assert.equal(legacy?.lastAuthenticatedActivityAt?.toISOString(), activityAt.toISOString());
  assert.equal(deriveConnectionHealth(legacy!, activityAt), 'unknown');
  const second = await store.findById(other.installation.id);
  assert.equal(second?.lastAuthenticatedActivityAt, null);
  await assert.rejects(
    () => recordLegacyChatConnectActivity({
      ...store,
      update: async () => { throw new Error('registry unavailable'); },
    }, { integrationId: LEGACY_PW_INFOTECH_INTEGRATION_ID, tenantId: 'pw-infotech', at: activityAt }),
  );
});

function firstPartyUkInstallation(at: Date): ChatConnectInstallation {
  return {
    id: FIRST_PARTY_PW_UK_INSTALLATION_ID,
    tenantId: FIRST_PARTY_PW_UK_TENANT_ID,
    integrationTechnology: FIRST_PARTY_PW_UK_INTEGRATION_TECHNOLOGY,
    integrationId: null,
    authorizationStatus: 'active',
    frontendVisibility: 'unset',
    addonVersion: null,
    widgetVersion: null,
    legacyEnvBinding: false,
    heartbeatProtocolAdopted: false,
    credentialKeyId: null,
    credentialHash: null,
    credentialIssuedAt: null,
    credentialRotatedAt: null,
    registeredAt: null,
    provisionedAt: at,
    authorizedAt: null,
    activatedAt: null,
    lastVerifiedHeartbeatAt: null,
    lastAuthenticatedActivityAt: null,
    suspendedAt: null,
    revokedAt: null,
    createdAt: at,
    updatedAt: at,
  };
}

test('Primewayz UK first-party chat is not Connected without a verified heartbeat', () => {
  const installation = firstPartyUkInstallation(T0);
  assert.equal(installationClassification(installation), 'first-party');
  assert.equal(installationClassification(legacyInstallation(T0)), 'legacy-environment');
  assert.equal(deriveConnectionHealth(installation, T0), 'unknown');
  assert.equal(INTEGRATION_REGISTRY.some((entry) => entry.tenantId === 'pw-uk'), false);
  assert.equal(getTenantById('pw-uk')?.displayName, 'Primewayz UK');
  const silver = getTenantById('rrb-silver-campaign');
  assert.ok(silver);
  assert.equal(isTenantActive(silver, {}), false);
});

test('migration seeds Infotech and Primewayz UK without historical dates or RentReadBuy', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'prisma/migrations/20261019120000_chat_connect_installation_registry/migration.sql'), 'utf8');
  const schema = fs.readFileSync(path.join(process.cwd(), 'prisma/schema.prisma'), 'utf8');
  const migrationDoc = fs.readFileSync(path.join(process.cwd(), 'Docs/chat-connect-installation-registry-migration.md'), 'utf8');
  assert.equal((sql.match(/INSERT INTO `ChatConnectInstallation`/g) ?? []).length, 2);
  assert.match(sql, /'cci_pw_infotech_wordpress'/);
  assert.match(sql, /'primewayz-wordpress'/);
  assert.match(sql, /'cci_pw_uk_first_party'/);
  assert.match(sql, /'pw-uk'/);
  assert.match(sql, /'react'/);
  assert.match(sql, /'classification', 'first-party'/);
  assert.match(sql, /'source', 'live_chat_component'/);
  assert.match(sql, /'connectionHealth', 'not_inferred'/);
  assert.match(sql, /historicalRegistration', 'unknown'/);
  assert.match(sql, /historicalActivation', 'unknown'/);
  assert.match(sql, /NULL,\s+NULL,\s+NULL,\s+CURRENT_TIMESTAMP\(3\),\s+NULL,\s+NULL,\s+NULL,\s+NULL,/);
  assert.match(sql, /ChatConnectIdempotencyKey_action_createdAt_idx/);
  assert.match(sql, /ChatConnectInstallation_legacyBinding_idx/);
  assert.match(sql, /ChatConnectIdempotency_install_action_key/);
  const identifiers = [...sql.matchAll(/`([A-Za-z0-9_]+)`/g)].map((match) => match[1]);
  assert.ok(identifiers.every((name) => name.length <= 64), identifiers.filter((name) => name.length > 64).join(','));
  assert.doesNotMatch(sql, /'\d{4}-\d{2}-\d{2}/);
  assert.doesNotMatch(sql, /'rrb'/);
  assert.doesNotMatch(sql, /rrb-silver/);
  assert.doesNotMatch(sql, /CREATE TABLE `(User|ChatSession|ChatMessage|Tenant)`/);
  assert.doesNotMatch(sql, /INSERT INTO `(User|ChatSession|ChatMessage)`/);
  assert.doesNotMatch(sql, /WORDPRESS_CHAT_INTEGRATION_TOKEN/);
  assert.match(schema, /model ChatConnectInstallation/);
  assert.match(schema, /model ChatConnectAuditLog/);
  assert.match(schema, /@@index\(\[action, createdAt\]\)/);
  assert.match(schema, /map: "ChatConnectInstallation_legacyBinding_idx"/);
  assert.match(schema, /map: "ChatConnectIdempotency_install_action_key"/);
  assert.match(schema, /model ChatSession/);
  assert.doesNotMatch(schema, /model (PlatformTenant|Tenant) \{/);
  assert.match(migrationDoc, /DROP TABLE `ChatConnectInstallation`/);
  assert.match(migrationDoc, /cci_pw_uk_first_party/);
  assert.match(migrationDoc, /24 hours/);
  assert.match(fs.readFileSync(path.join(process.cwd(), 'Docs/future-primewayz-connect-marketplace.md'), 'utf8'), /Add-on product definition/);
});

test('heartbeat idempotency retention deletes expired heartbeat keys only', async () => {
  resetHeartbeatIdempotencyPruneForTests();
  const store = createMemoryChatConnectStore();
  const created = await registerInstallation(store, OWNER, { tenantId: 'pw-uk', integrationTechnology: 'wordpress' }, T0);
  const registered = await store.findById(created.installation.id);
  await activateInstallation(store, registered!, {
    clientActionId: actionId('keep'),
    addonVersion: null,
    widgetVersion: null,
  }, T0);
  const active = await store.findById(created.installation.id);
  const expiredAt = new Date(T0.getTime() - CHAT_CONNECT_HEARTBEAT_IDEMPOTENCY_RETENTION_MS - 1000);
  await store.claimIdempotency({
    installationId: created.installation.id,
    action: 'heartbeat',
    clientActionId: actionId('oldh'),
    at: expiredAt,
  });
  await store.claimIdempotency({
    installationId: created.installation.id,
    action: 'activate',
    clientActionId: actionId('olda'),
    at: expiredAt,
  });
  const beat = await recordVerifiedHeartbeat(store, active!, {
    clientActionId: actionId('newh'),
    addonVersion: null,
    widgetVersion: null,
  }, T0);
  assert.equal(beat.replayed, false);
  assert.equal(beat.installation.connectionHealth, 'connected');
  assert.equal(await store.hasIdempotency({
    installationId: created.installation.id,
    action: 'heartbeat',
    clientActionId: actionId('oldh'),
  }), false);
  assert.equal(await store.hasIdempotency({
    installationId: created.installation.id,
    action: 'activate',
    clientActionId: actionId('olda'),
  }), true);
  assert.equal(await store.hasIdempotency({
    installationId: created.installation.id,
    action: 'activate',
    clientActionId: actionId('keep'),
  }), true);

  const removed = await store.pruneIdempotency({
    action: 'heartbeat',
    olderThan: new Date(T0.getTime() + 1),
    limit: 1,
  });
  assert.equal(removed, 1);
  assert.equal(await store.hasIdempotency({
    installationId: created.installation.id,
    action: 'heartbeat',
    clientActionId: actionId('newh'),
  }), false);
});

test('heartbeat idempotency cleanup failure does not fail the heartbeat', async () => {
  resetHeartbeatIdempotencyPruneForTests();
  const store = createMemoryChatConnectStore();
  const created = await registerInstallation(store, OWNER, { tenantId: 'pw-infotech', integrationTechnology: 'wordpress' }, T0);
  const registered = await store.findById(created.installation.id);
  await activateInstallation(store, registered!, {
    clientActionId: actionId('actf'),
    addonVersion: null,
    widgetVersion: null,
  }, T0);
  const active = await store.findById(created.installation.id);
  const failing = {
    ...store,
    pruneIdempotency: async () => {
      throw new Error('registry cleanup failed ccs_should_not_leak');
    },
  };
  const beat = await recordVerifiedHeartbeat(failing, active!, {
    clientActionId: actionId('surv'),
    addonVersion: null,
    widgetVersion: null,
  }, T0);
  assert.equal(beat.replayed, false);
  assert.equal(beat.installation.lastVerifiedHeartbeatAt, T0.toISOString());
  assert.equal(JSON.stringify(beat).includes('ccs_should_not_leak'), false);
});

test('first-party React technology is not open for connector registration', async () => {
  const store = createMemoryChatConnectStore();
  await assert.rejects(
    () => registerInstallation(store, OWNER, { tenantId: 'pw-uk', integrationTechnology: 'react' }, T0),
    (err: unknown) => err instanceof ChatConnectError && err.code === 'invalid_request',
  );
  assert.equal((await store.list()).length, 0);
});

test('connector HTTP lifecycle rejects tenant override, replays, and limits invalid credentials', async () => {
  resetChatConnectRateLimitsForTests();
  const store = createMemoryChatConnectStore();
  let clock = T0.getTime();
  const admin = createChatConnectAdminHandlers({ store, now: () => new Date(clock) });
  const connector = createChatConnectConnectorHandlers({ store, now: () => new Date(clock), getClientIp: () => '203.0.113.20' });
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { adminUser?: ChatConnectAdminPrincipal }).adminUser = OWNER;
    next();
  });
  app.get(CHAT_CONNECT_ADMIN_COLLECTION_PATH, admin.list);
  app.post(CHAT_CONNECT_ADMIN_COLLECTION_PATH, admin.register);
  app.post(`${CHAT_CONNECT_ADMIN_COLLECTION_PATH}/:installationId/suspend`, admin.suspend);
  app.post(CHAT_CONNECT_ACTIVATE_PATH, connector.activate);
  app.post(CHAT_CONNECT_HEARTBEAT_PATH, connector.heartbeat);
  app.all(CHAT_CONNECT_ACTIVATE_PATH, chatConnectMethodNotAllowed);
  app.use(CHAT_CONNECT_ACTIVATE_PATH, chatConnectBodyErrorHandler);

  const server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;
  const call = (method: string, requestPath: string, body: unknown, authorization?: string) => new Promise<{ status: number; json: any; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const headers: Record<string, string> = {};
    if (payload !== undefined) headers['Content-Type'] = 'application/json';
    if (authorization) headers.Authorization = authorization;
    const req = http.request({ host: '127.0.0.1', port, method, path: requestPath, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json: unknown = null;
        try { json = data ? JSON.parse(data) : null; } catch { json = null; }
        resolve({ status: res.statusCode ?? 0, json, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });

  try {
    const created = await call('POST', CHAT_CONNECT_ADMIN_COLLECTION_PATH, {
      tenantId: 'pw-infotech',
      integrationTechnology: 'wordpress',
      frontendVisibility: 'hidden',
    });
    assert.equal(created.status, 201);
    const token = `${created.json.credential.keyId}.${created.json.credential.secret}`;
    const installationId = created.json.installation.id as string;
    assert.equal(created.json.installation.connectionHealth, 'unknown');

    const listed = await call('GET', CHAT_CONNECT_ADMIN_COLLECTION_PATH, undefined);
    assert.equal(JSON.stringify(listed.json).includes(created.json.credential.secret), false);

    const overridden = await call('POST', CHAT_CONNECT_ACTIVATE_PATH, {
      clientActionId: actionId('ovrd'),
      tenantId: 'pw-uk',
    }, `Bearer ${token}`);
    assert.equal(overridden.status, 400);
    assert.equal(overridden.json.error.code, 'tenant_override_rejected');
    assert.equal(overridden.headers['access-control-allow-origin'], undefined);

    const activated = await call('POST', CHAT_CONNECT_ACTIVATE_PATH, { clientActionId: actionId('live') }, `Bearer ${token}`);
    assert.equal(activated.status, 200);
    assert.equal(activated.json.installation.authorizationStatus, 'active');
    assert.equal(activated.json.installation.connectionHealth, 'unknown');
    assert.equal(activated.json.tenantOperational, true);
    const replayedActivation = await call('POST', CHAT_CONNECT_ACTIVATE_PATH, { clientActionId: actionId('live') }, `Bearer ${token}`);
    assert.equal(replayedActivation.json.replayed, true);
    assert.equal(replayedActivation.json.installation.activatedAt, activated.json.installation.activatedAt);

    const beat = await call('POST', CHAT_CONNECT_HEARTBEAT_PATH, { clientActionId: actionId('hb01') }, `Bearer ${token}`);
    assert.equal(beat.json.installation.connectionHealth, 'connected');
    clock += 11 * MINUTE;
    const staleReplay = await call('POST', CHAT_CONNECT_HEARTBEAT_PATH, { clientActionId: actionId('hb01') }, `Bearer ${token}`);
    assert.equal(staleReplay.json.replayed, true);
    assert.equal(staleReplay.json.installation.connectionHealth, 'stale');
    assert.equal(staleReplay.json.installation.lastVerifiedHeartbeatAt, beat.json.installation.lastVerifiedHeartbeatAt);

    const suspended = await call('POST', `${CHAT_CONNECT_ADMIN_COLLECTION_PATH}/${installationId}/suspend`, {});
    assert.equal(suspended.status, 200);
    const blocked = await call('POST', CHAT_CONNECT_HEARTBEAT_PATH, { clientActionId: actionId('hb02') }, `Bearer ${token}`);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.json.error.code, 'installation_suspended');

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const invalid = await call('POST', CHAT_CONNECT_HEARTBEAT_PATH, { clientActionId: actionId('nope') }, 'Bearer not-a-credential');
      assert.equal(invalid.status, 401);
    }
    const limited = await call('POST', CHAT_CONNECT_HEARTBEAT_PATH, { clientActionId: actionId('nope') }, 'Bearer not-a-credential');
    assert.equal(limited.status, 429);
    assert.equal(limited.json.error.code, 'rate_limited');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('operator HTTP list cannot cross tenants', async () => {
  resetChatConnectRateLimitsForTests();
  const store = createMemoryChatConnectStore();
  await registerInstallation(store, OWNER, { tenantId: 'pw-uk', integrationTechnology: 'wordpress' }, T0);
  await registerInstallation(store, OWNER, { tenantId: 'pw-infotech', integrationTechnology: 'wordpress' }, T0);
  const admin = createChatConnectAdminHandlers({ store, now: () => T0 });
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { adminUser?: ChatConnectAdminPrincipal }).adminUser = INFOTECH_OPERATOR;
    next();
  });
  app.get(CHAT_CONNECT_ADMIN_COLLECTION_PATH, admin.list);
  app.post(`${CHAT_CONNECT_ADMIN_COLLECTION_PATH}/:installationId/revoke`, admin.revoke);
  const server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;
  const call = (method: string, requestPath: string) => new Promise<{ status: number; json: any }>((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: requestPath }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, json: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end();
  });
  try {
    const listed = await call('GET', CHAT_CONNECT_ADMIN_COLLECTION_PATH);
    assert.equal(listed.status, 200);
    assert.equal(listed.json.installations.length, 1);
    assert.equal(listed.json.installations[0].tenantKey, 'pw-infotech');
    const denied = await call('GET', `${CHAT_CONNECT_ADMIN_COLLECTION_PATH}?tenantId=pw-uk`);
    assert.equal(denied.status, 403);
    const revoked = await call('POST', `${CHAT_CONNECT_ADMIN_COLLECTION_PATH}/${listed.json.installations[0].id}/revoke`);
    assert.equal(revoked.status, 403);
    assert.equal(revoked.json.code, 'platform_owner_required');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test('WordPress operational responses stay compatible when activity tracking fails', async () => {
  const token = 'wpint_test_token_0123456789abcdef';
  const env = { WORDPRESS_CHAT_INTEGRATION_TOKEN: token } as NodeJS.ProcessEnv;
  const store = {
    async checkDatabase() {},
    async readTeamPresence() {
      return { mode: 'online', latestAdminSeenAt: T0 };
    },
  } as unknown as OperationalChatStore;
  const base = {
    store,
    writes: {} as never,
    siteUrl: 'https://uk.primewayz.com',
    isDatabaseUnavailableError: () => false,
    getClientIp: () => '203.0.113.10',
    env,
    now: () => T0.getTime(),
  };
  const invoke = async (recordAuthenticatedActivity?: () => Promise<void>) => {
    const handler = createWordPressChatIntegrationHandler({ ...base, recordAuthenticatedActivity });
    let statusCode = 0;
    let payload: unknown;
    const res = {
      setHeader() {},
      status(code: number) { statusCode = code; return this; },
      json(value: unknown) { payload = value; return this; },
    };
    await handler({
      body: { action: 'diagnostics' },
      originalUrl: WORDPRESS_CHAT_INTEGRATION_PATH,
      get(name: string) {
        return name.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined;
      },
    } as never, res as never, (() => undefined) as never);
    return { statusCode, payload };
  };
  const errors: string[] = [];
  const baseline = await invoke(undefined);
  const failed = await invoke(async () => {
    throw new Error('registry down ccs_should_not_leak');
  });
  const logged = createWordPressChatIntegrationHandler({
    ...base,
    logError: (line) => errors.push(line),
    recordAuthenticatedActivity: async () => { throw new Error('ccs_should_not_leak'); },
  });
  await logged({
    body: { action: 'diagnostics' },
    originalUrl: WORDPRESS_CHAT_INTEGRATION_PATH,
    get(name: string) { return name.toLowerCase() === 'authorization' ? `Bearer ${token}` : undefined; },
  } as never, {
    setHeader() {},
    status() { return this; },
    json() { return this; },
  } as never, (() => undefined) as never);
  const comparable = (payload: unknown) => {
    const copy = { ...(payload as Record<string, unknown>) };
    delete copy.requestId;
    return copy;
  };
  assert.equal(baseline.statusCode, 200);
  assert.deepEqual(comparable(failed.payload), comparable(baseline.payload));
  assert.equal(JSON.stringify(failed.payload).includes('ccs_should_not_leak'), false);
  assert.equal(Object.keys(failed.payload as object).sort().join(), 'apiVersion,data,generatedAt,ok,requestId,tenant');
  assert.match(errors.join('\n'), /legacy activity tracking failed/);
  assert.equal(errors.join('\n').includes('ccs_should_not_leak'), false);
});

test('chat embed releases 1.1.0 and 1.2.0 stay byte-identical', () => {
  for (const version of ['1.1.0', '1.2.0']) {
    const relative = `embed-releases/chat/${version}/pw-chat.js`;
    const committed = execFileSync('git', ['show', `HEAD:${relative}`], { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024 });
    const working = fs.readFileSync(path.join(process.cwd(), relative));
    assert.equal(createHash('sha384').update(working).digest('hex'), createHash('sha384').update(committed).digest('hex'));
  }
});

test('connector routes stay outside browser code, public CORS, and the admin origin guard', () => {
  assert.equal(isPublicChatCorsPath(CHAT_CONNECT_ACTIVATE_PATH), false);
  assert.equal(isPublicChatCorsPath(CHAT_CONNECT_HEARTBEAT_PATH), false);
  assert.equal(isPublicPlatformCorsPath(CHAT_CONNECT_HEARTBEAT_PATH), false);
  assert.equal(isAdminStateChangingRequest('POST', CHAT_CONNECT_HEARTBEAT_PATH), false);
  assert.equal(isAdminStateChangingRequest('POST', `${CHAT_CONNECT_ADMIN_COLLECTION_PATH}/cci_example/suspend`), true);
  const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  assert.equal((server.match(/\/api\/integrations\//g) ?? []).length, 0);
  assert.match(server, /recordAuthenticatedActivity/);
  assert.ok(server.indexOf('CHAT_CONNECT_ACTIVATE_PATH') < server.indexOf("app.use('/api'"));
  const browserRoots = ['src/components', 'src/embed', 'public'];
  const files: string[] = [];
  const walk = (target: string) => {
    const absolute = path.join(process.cwd(), target);
    if (!fs.existsSync(absolute)) return;
    if (fs.statSync(absolute).isFile()) { files.push(absolute); return; }
    for (const entry of fs.readdirSync(absolute)) walk(path.join(target, entry));
  };
  browserRoots.forEach(walk);
  for (const file of files.filter((entry) => /\.(tsx?|jsx?|html|md)$/.test(entry))) {
    const content = fs.readFileSync(file, 'utf8');
    assert.equal(content.includes('/api/integrations/chat-connect'), false, file);
    assert.equal(content.includes('/api/integrations/wordpress'), false, file);
    assert.equal(content.includes('credentialHash'), false, file);
    assert.equal(content.includes('WORDPRESS_CHAT_INTEGRATION_TOKEN'), false, file);
  }
});

test('explicit connector technologies share one activation route and keep credential tenant binding', async () => {
  assert.equal(CHAT_CONNECT_REGISTRATION_TECHNOLOGIES, CHAT_CONNECT_CONNECTOR_TECHNOLOGIES);
  assert.deepEqual([...CHAT_CONNECT_CONNECTOR_TECHNOLOGIES], ['wordpress', 'shopify', 'custom']);
  assert.equal((CHAT_CONNECT_CONNECTOR_TECHNOLOGIES as readonly string[]).includes('react'), false);
  assert.equal(CHAT_CONNECT_ACTIVATE_PATH.includes('wordpress'), false);
  assert.equal(CHAT_CONNECT_HEARTBEAT_PATH.includes('shopify'), false);
  const store = createMemoryChatConnectStore();
  for (const integrationTechnology of ['shopify', 'custom'] as const) {
    const created = await registerInstallation(store, OWNER, { tenantId: 'pw-infotech', integrationTechnology }, T0);
    assert.equal(created.installation.integrationTechnology, integrationTechnology);
    assert.equal(created.installation.tenantKey, 'pw-infotech');
    assert.ok(created.credential.keyId);
    const registered = await store.findById(created.installation.id);
    const activated = await activateInstallation(store, registered!, {
      clientActionId: actionId(integrationTechnology.slice(0, 4)),
      addonVersion: null,
      widgetVersion: null,
    }, T0);
    assert.equal(activated.installation.authorizationStatus, 'active');
    assert.equal(activated.installation.tenantKey, 'pw-infotech');
  }
  await assert.rejects(
    () => registerInstallation(store, OWNER, { tenantId: 'pw-uk', integrationTechnology: 'react' }, T0),
    (err: unknown) => err instanceof ChatConnectError && err.code === 'invalid_request',
  );
  const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  assert.equal(server.includes('/api/integrations/shopify'), false);
  assert.equal(server.includes('/api/integrations/custom'), false);
  assert.equal((server.match(/app\.post\(CHAT_CONNECT_ACTIVATE_PATH/g) ?? []).length, 1);
  assert.equal((server.match(/app\.post\(CHAT_CONNECT_HEARTBEAT_PATH/g) ?? []).length, 1);
});
