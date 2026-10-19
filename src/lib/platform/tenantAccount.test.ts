import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { deriveConnectionHealth } from '../chatConnect/connectionHealth.ts';
import { createMemoryChatConnectStore } from '../chatConnect/memoryStore.ts';
import { createMemoryTenantChatEntitlementStore } from './tenantChatEntitlementMemory.ts';
import { resolveEffectiveTenantChat } from './tenantChatEntitlement.ts';
import { createChatPlatformAdminHandlers } from './tenantAccountAdmin.ts';
import { createMemoryTenantAccountStore } from './tenantAccountMemory.ts';
import {
  deletionBlockReason,
  foldTenantAccountGate,
  hashVerificationToken,
  nextLifecycle,
  parseExactOrigin,
} from './tenantAccountModel.ts';
import {
  addSiteOrigin,
  addTenantSite,
  changeTenantLifecycle,
  explainTenantDeletion,
  linkInstallationToSite,
  openCommercialRecord,
  registerDatabaseTenant,
  TenantAccountError,
  verifySiteOrigin,
  type TenantAccountPrincipal,
} from './tenantAccountService.ts';
import type { OriginProbe } from './tenantOriginVerification.ts';
import express from 'express';
import type { Server } from 'node:http';

const OWNER: TenantAccountPrincipal = { id: 1, role: 'admin', isPlatformOwner: true, tenantIds: [] };
const OPERATOR: TenantAccountPrincipal = { id: 2, role: 'editor', isPlatformOwner: false, tenantIds: ['pw-infotech'] };
const at = new Date('2026-10-19T12:00:00.000Z');

test('lifecycle transitions are reversible only through explicit actions', () => {
  assert.equal(nextLifecycle('draft', 'activate'), 'active');
  assert.equal(nextLifecycle('active', 'suspend'), 'suspended');
  assert.equal(nextLifecycle('suspended', 'reactivate'), 'active');
  assert.equal(nextLifecycle('active', 'archive'), 'archived');
  assert.equal(nextLifecycle('archived', 'activate'), null);
  assert.equal(nextLifecycle('archived', 'restore'), 'draft');
  assert.equal(nextLifecycle('suspended', 'activate'), null);
});

test('referenced tenants cannot be deleted', () => {
  assert.equal(deletionBlockReason({ conversations: 0, installations: 0, grants: 0, audits: 0 }), null);
  assert.match(deletionBlockReason({ conversations: 2, installations: 1, grants: 1, audits: 3 }) ?? '', /conversations, installations, permissions, audit logs/);
  assert.equal(explainTenantDeletion({ conversations: 1, installations: 0, grants: 0, audits: 0 }).allowed, false);
});

test('a suspended commercial record closes a compile-time active tenant and a failed read does not reopen it', async () => {
  const lookup = async () => null;
  const open = await resolveEffectiveTenantChat({ tenantId: 'pw-uk', lookup });
  assert.equal(open.allowed, true);
  const suspended = await resolveEffectiveTenantChat({
    tenantId: 'pw-uk',
    lookup,
    account: async () => ({
      availability: 'ready',
      lifecycle: 'suspended',
      chatCapability: true,
      inCompileTimeRegistry: true,
      explicitEntitlement: false,
    }),
  });
  assert.equal(suspended.allowed, false);
  assert.equal(suspended.basis, 'inactive_tenant');
  const archived = foldTenantAccountGate({
    tenantId: 'pw-uk',
    env: {},
    gate: { availability: 'ready', lifecycle: 'archived', chatCapability: true, inCompileTimeRegistry: true, explicitEntitlement: false },
  });
  assert.equal(archived.active, false);
  const failed = await resolveEffectiveTenantChat({
    tenantId: 'pw-uk',
    lookup,
    account: async () => { throw new Error('database down'); },
  });
  assert.equal(failed.basis, 'store_unavailable');
  assert.equal(failed.allowed, false);
});

test('database tenants require an explicit entitlement and unknown ids stay denied', async () => {
  const decision = await resolveEffectiveTenantChat({
    tenantId: 'acme-uk',
    lookup: async () => null,
    account: async () => ({
      availability: 'ready',
      lifecycle: 'active',
      chatCapability: true,
      inCompileTimeRegistry: false,
      explicitEntitlement: true,
    }),
  });
  assert.equal(decision.basis, 'entitlement_required');
  const entitled = await resolveEffectiveTenantChat({
    tenantId: 'acme-uk',
    lookup: async () => ({ status: 'entitled' }),
    account: async () => ({
      availability: 'ready',
      lifecycle: 'active',
      chatCapability: true,
      inCompileTimeRegistry: false,
      explicitEntitlement: true,
    }),
  });
  assert.equal(entitled.allowed, true);
  const unknown = await resolveEffectiveTenantChat({ tenantId: 'not-a-tenant', lookup: async () => null });
  assert.equal(unknown.basis, 'unknown_tenant');
});

test('typing an origin does not authorize it, and another tenant cannot claim it', async () => {
  const store = createMemoryTenantAccountStore();
  const env = { NODE_ENV: 'test' };
  await registerDatabaseTenant(store, OWNER, {
    tenantId: 'acme-uk',
    displayName: 'Acme UK',
    brand: 'Customer',
    market: 'UK',
    organizationName: 'Acme Ltd',
    primaryContactName: 'Ada',
    primaryContactEmail: 'ada@acme.test',
  }, at);
  await registerDatabaseTenant(store, OWNER, {
    tenantId: 'beta-uk',
    displayName: 'Beta UK',
    brand: 'Customer',
    market: 'UK',
    organizationName: 'Beta Ltd',
    primaryContactName: 'Bea',
    primaryContactEmail: 'bea@beta.test',
  }, at);
  const site = await addTenantSite(store, OWNER, 'acme-uk', { displayName: 'Acme site', technology: 'wordpress' }, at);
  const challenged = await addSiteOrigin(store, OWNER, site.id, { origin: 'https://acme.example' }, at, env);
  assert.equal(challenged.verificationStatus, 'pending');
  assert.equal(parseExactOrigin('https://acme.example/path', false), null);
  const origins = await store.listOrigins({ tenantId: 'acme-uk' });
  assert.equal(origins[0]?.verificationStatus, 'pending');
  const probe: OriginProbe = async () => null;
  await assert.rejects(
    () => verifySiteOrigin(store, OWNER, challenged.id, probe, at),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'origin_unverified',
  );
  const proved: OriginProbe = async ({ tokenHash }) => tokenHash === hashVerificationToken(challenged.verificationToken) ? 'dns_txt' : null;
  const verified = await verifySiteOrigin(store, OWNER, challenged.id, proved, at);
  assert.equal(verified.verificationStatus, 'verified');
  const beta = await addTenantSite(store, OWNER, 'beta-uk', { displayName: 'Beta site', technology: 'shopify' }, at);
  await assert.rejects(
    () => addSiteOrigin(store, OWNER, beta.id, { origin: 'https://acme.example' }, at, env),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'origin_collision',
  );
  await assert.rejects(
    () => addSiteOrigin(store, OWNER, beta.id, { origin: 'https://uk.primewayz.com' }, at, env),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'origin_collision',
  );
});

test('operators cannot suspend another tenant and archived catalog tenants do not fall open', async () => {
  const store = createMemoryTenantAccountStore();
  await openCommercialRecord(store, OWNER, 'pw-uk', {
    organizationName: 'Primewayz UK',
    primaryContactName: 'Host',
    primaryContactEmail: 'host@primewayz.test',
    lifecycleStatus: 'suspended',
  }, at, {});
  await assert.rejects(
    () => changeTenantLifecycle(store, OPERATOR, 'pw-uk', 'reactivate', at, {}),
    (error: unknown) => error instanceof TenantAccountError && error.status === 403,
  );
  await assert.rejects(
    () => openCommercialRecord(store, OWNER, 'pw-us', {
      organizationName: 'Primewayz US',
      primaryContactName: 'Host',
      primaryContactEmail: 'us@primewayz.test',
      lifecycleStatus: 'active',
    }, at, {}),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'activation_blocked',
  );
});

test('installation links stay inside the tenant and duplicate identities are rejected', async () => {
  const store = createMemoryTenantAccountStore();
  await registerDatabaseTenant(store, OWNER, {
    tenantId: 'acme-uk',
    displayName: 'Acme UK',
    brand: 'Customer',
    market: 'UK',
    organizationName: 'Acme Ltd',
    primaryContactName: 'Ada',
    primaryContactEmail: 'ada@acme.test',
  }, at);
  await assert.rejects(
    () => registerDatabaseTenant(store, OWNER, {
      tenantId: 'pw-uk',
      displayName: 'Second UK',
      brand: 'Primewayz',
      market: 'UK',
      organizationName: 'Primewayz',
      primaryContactName: 'Host',
      primaryContactEmail: 'host@primewayz.test',
    }, at),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'tenant_exists',
  );
  const site = await addTenantSite(store, OWNER, 'acme-uk', { displayName: 'Acme', technology: 'custom' }, at);
  await assert.rejects(
    () => linkInstallationToSite(store, OWNER, site.id, 'cci_other', at, async () => 'pw-uk'),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'tenant_mismatch',
  );
  const linked = await linkInstallationToSite(store, OWNER, site.id, 'cci_acme', at, async () => 'acme-uk');
  assert.equal(linked.tenantId, 'acme-uk');
});

test('admin routes isolate tenants and overview uses heartbeat health', async () => {
  const accounts = createMemoryTenantAccountStore();
  const entitlements = createMemoryTenantChatEntitlementStore();
  const installations = createMemoryChatConnectStore();
  await installations.insert({
    id: 'cci_acme',
    tenantId: 'acme-uk',
    integrationTechnology: 'wordpress',
    integrationId: null,
    authorizationStatus: 'active',
    frontendVisibility: 'hidden',
    addonVersion: '1.0.0',
    widgetVersion: '1.2.0',
    legacyEnvBinding: false,
    heartbeatProtocolAdopted: false,
    credentialKeyId: null,
    credentialHash: null,
    credentialIssuedAt: null,
    credentialRotatedAt: null,
    registeredAt: at,
    provisionedAt: null,
    authorizedAt: null,
    activatedAt: at,
    lastVerifiedHeartbeatAt: null,
    lastAuthenticatedActivityAt: null,
    suspendedAt: null,
    revokedAt: null,
    createdAt: at,
    updatedAt: at,
  });
  const handlers = createChatPlatformAdminHandlers({
    accounts,
    entitlements,
    installations,
    now: () => at,
    probe: async () => null,
  });
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const owner = req.header('x-owner') === 'yes';
    (req as express.Request & { adminUser?: TenantAccountPrincipal }).adminUser = owner ? OWNER : OPERATOR;
    next();
  });
  app.get('/overview', handlers.overview);
  app.post('/tenants', handlers.createTenant);
  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as { port: number }).port;
  try {
    const denied = await fetch(`http://127.0.0.1:${port}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: 'acme-uk',
        displayName: 'Acme',
        brand: 'Customer',
        market: 'UK',
        organizationName: 'Acme',
        primaryContactName: 'Ada',
        primaryContactEmail: 'ada@acme.test',
      }),
    });
    assert.equal(denied.status, 403);
    const created = await fetch(`http://127.0.0.1:${port}/tenants`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-owner': 'yes' },
      body: JSON.stringify({
        tenantId: 'acme-uk',
        displayName: 'Acme',
        brand: 'Customer',
        market: 'UK',
        organizationName: 'Acme',
        primaryContactName: 'Ada',
        primaryContactEmail: 'ada@acme.test',
      }),
    });
    assert.equal(created.status, 201);
    const overview = await fetch(`http://127.0.0.1:${port}/overview`, { headers: { 'x-owner': 'yes' } });
    const body = await overview.json() as { installations: { unreported: number } };
    assert.equal(overview.status, 200);
    assert.equal(body.installations.unreported, 1);
    assert.equal(deriveConnectionHealth({ heartbeatProtocolAdopted: false, lastVerifiedHeartbeatAt: null }, at), 'unknown');
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
});

test('migration is additive and rollback drops only the commercial registry', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'prisma/migrations/20261019200000_platform_tenant_account/migration.sql'), 'utf8');
  const doc = fs.readFileSync(path.join(process.cwd(), 'Docs/chat-platform-tenant-registry-migration.md'), 'utf8');
  const executable = sql.replace(/--[^\n]*/g, '');
  assert.match(sql, /CREATE TABLE `PlatformTenantAccount`/);
  assert.match(sql, /UNIQUE INDEX `PlatformTenantOrigin_origin_key`/);
  assert.doesNotMatch(executable, /INSERT INTO/i);
  assert.doesNotMatch(executable, /ChatSession|TenantChatEntitlement|ChatConnectInstallation/);
  assert.match(doc, /DROP TABLE `PlatformTenantSiteInstallation`/);
  assert.match(doc, /prisma db push/i);
  assert.match(doc, /migrate reset/i);
  assert.equal(hashVerificationToken('pwcv_example').length, 64);
});
