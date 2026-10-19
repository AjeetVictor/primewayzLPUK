import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { createPublicChatApiCorsMiddleware } from '../chat/publicChatApiCors.ts';
import { activateInstallation, registerInstallation, suspendInstallation } from '../chatConnect/lifecycle.ts';
import { createMemoryChatConnectStore } from '../chatConnect/memoryStore.ts';
import type { ChatConnectAdminPrincipal } from '../chatConnect/types.ts';
import { applyEffectiveChatToCapabilities, buildPublicPlatformCapabilities } from './publicCapabilities.ts';
import { resolveSourceContext } from './sourceResolver.ts';
import {
  createTenantChatEntitlementAdminHandlers,
  listTenantChatEntitlementViews,
  setTenantChatEntitlement,
  TenantChatEntitlementAdminError,
  type TenantChatAdminPrincipal,
} from './tenantChatEntitlementAdmin.ts';
import { createMemoryTenantChatEntitlementStore } from './tenantChatEntitlementMemory.ts';
import {
  assertVisitorChatEntitlement,
  decideEffectiveTenantChat,
  resolveEffectiveTenantChat,
  TenantChatEntitlementUnavailableError,
} from './tenantChatEntitlement.ts';
import { getTenantById, isTenantActive } from './tenantRegistry.ts';

const OWNER: TenantChatAdminPrincipal = { id: 11, role: 'super_admin', isPlatformOwner: true, tenantIds: [] };
const INFOTECH: TenantChatAdminPrincipal = { id: 22, role: 'editor', isPlatformOwner: false, tenantIds: ['pw-infotech'] };
const ACTIVATION = 'RRB_SILVER_CAMPAIGN_ENABLED';
const ORIGINS = 'RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS';
const PREVIEW = 'https://silver-preview.example.test';
const T0 = new Date('2026-10-19T12:00:00.000Z');

function mockReq(partial: { method?: string; path?: string; origin?: string }) {
  return {
    method: partial.method ?? 'OPTIONS',
    path: partial.path ?? '/api/chat/availability',
    get(name: string) {
      if (name.toLowerCase() === 'origin') return partial.origin;
      return undefined;
    },
  };
}

function mockRes() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let jsonBody: unknown;
  return {
    headers,
    get statusCode() { return statusCode; },
    get jsonBody() { return jsonBody; },
    setHeader(name: string, value: string) { headers.set(name, value); },
    removeHeader(name: string) { headers.delete(name); },
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { jsonBody = body; return this; },
    end() { return this; },
  };
}

test('no entitlement row preserves existing chat for an active chat tenant', async () => {
  let lookups = 0;
  const decision = await resolveEffectiveTenantChat({
    tenantId: 'pw-uk',
    lookup: async () => {
      lookups += 1;
      return null;
    },
  });
  assert.deepEqual(decision, { allowed: true, basis: 'allowed_existing' });
  assert.equal(lookups, 1);
  const infotech = await resolveEffectiveTenantChat({
    tenantId: 'pw-infotech',
    lookup: async () => null,
  });
  assert.equal(infotech.basis, 'allowed_existing');
});

test('unknown and inactive tenants are denied before the entitlement store is read', async () => {
  const previous = process.env[ACTIVATION];
  delete process.env[ACTIVATION];
  let lookups = 0;
  const lookup = async () => {
    lookups += 1;
    return { status: 'entitled' as const };
  };
  try {
    const unknown = await resolveEffectiveTenantChat({ tenantId: 'not-a-tenant', lookup });
    const inactiveMarket = await resolveEffectiveTenantChat({ tenantId: 'pw-us', lookup });
    const silver = await resolveEffectiveTenantChat({ tenantId: 'rrb-silver-campaign', lookup });
    assert.deepEqual(unknown, { allowed: false, basis: 'unknown_tenant' });
    assert.deepEqual(inactiveMarket, { allowed: false, basis: 'inactive_tenant' });
    assert.deepEqual(silver, { allowed: false, basis: 'inactive_tenant' });
    assert.equal(isTenantActive(getTenantById('rrb-silver-campaign')!), false);
    assert.equal(lookups, 0);
  } finally {
    if (previous === undefined) delete process.env[ACTIVATION];
    else process.env[ACTIVATION] = previous;
  }
});

test('entitled does not bypass compile-time chat or the Silver activation gate', async () => {
  assert.deepEqual(decideEffectiveTenantChat({
    known: true,
    active: true,
    compileTimeChat: false,
    entitlement: { availability: 'ready', record: { status: 'entitled' } },
  }), { allowed: false, basis: 'capability_disabled' });

  const previousActivation = process.env[ACTIVATION];
  const previousOrigins = process.env[ORIGINS];
  process.env[ACTIVATION] = 'true';
  process.env[ORIGINS] = PREVIEW;
  try {
    const source = resolveSourceContext({ origin: PREVIEW, sourceChannel: 'other' });
    const open = buildPublicPlatformCapabilities(source, process.env);
    assert.equal(open.capabilities.chat, true);
    assert.equal(open.capabilities.scheduling, false);
    const entitled = applyEffectiveChatToCapabilities(open, { allowed: true, basis: 'allowed_entitled' });
    assert.equal(entitled.capabilities.chat, true);
    assert.equal(entitled.capabilities.scheduling, false);
    assert.equal(entitled.capabilities.forms, false);
  } finally {
    if (previousActivation === undefined) delete process.env[ACTIVATION];
    else process.env[ACTIVATION] = previousActivation;
    if (previousOrigins === undefined) delete process.env[ORIGINS];
    else process.env[ORIGINS] = previousOrigins;
  }
});

test('suspended and revoked entitlement deny chat and stay distinct from installation status', async () => {
  const store = createMemoryTenantChatEntitlementStore();
  await setTenantChatEntitlement(store, OWNER, 'pw-infotech', 'suspended', 'Billing hold', T0);
  const suspended = await resolveEffectiveTenantChat({
    tenantId: 'pw-infotech',
    lookup: () => store.find('pw-infotech'),
  });
  const untouched = await resolveEffectiveTenantChat({
    tenantId: 'pw-uk',
    lookup: () => store.find('pw-uk'),
  });
  assert.deepEqual(suspended, { allowed: false, basis: 'suspended' });
  assert.deepEqual(untouched, { allowed: true, basis: 'allowed_existing' });

  await setTenantChatEntitlement(store, OWNER, 'pw-uk', 'revoked', 'Contract ended', new Date('2026-10-19T13:00:00.000Z'));
  const revoked = await resolveEffectiveTenantChat({
    tenantId: 'pw-uk',
    lookup: () => store.find('pw-uk'),
  });
  assert.deepEqual(revoked, { allowed: false, basis: 'revoked' });

  const installations = createMemoryChatConnectStore();
  const ownerInstall: ChatConnectAdminPrincipal = { id: 1, role: 'super_admin', isPlatformOwner: true, tenantIds: [] };
  const created = await registerInstallation(
    installations,
    ownerInstall,
    { tenantId: 'pw-uk', integrationTechnology: 'wordpress' },
    T0,
  );
  const registered = await installations.findById(created.installation.id);
  await activateInstallation(installations, registered!, {
    clientActionId: `distinct${'a'.repeat(29)}`,
    addonVersion: null,
    widgetVersion: null,
  }, T0);
  await suspendInstallation(installations, ownerInstall, registered!.id, T0);
  assert.equal((await installations.findById(registered!.id))?.authorizationStatus, 'suspended');
  assert.equal((await store.find('pw-uk'))?.status, 'revoked');
  const stillRevoked = await resolveEffectiveTenantChat({
    tenantId: 'pw-uk',
    lookup: () => store.find('pw-uk'),
  });
  assert.equal(stillRevoked.basis, 'revoked');
});

test('an unavailable entitlement store denies chat instead of reopening the no-row path', async () => {
  const decision = await resolveEffectiveTenantChat({
    tenantId: 'pw-uk',
    lookup: async () => {
      throw new Error('database unreachable');
    },
  });
  assert.deepEqual(decision, { allowed: false, basis: 'store_unavailable' });
  await assert.rejects(
    () => assertVisitorChatEntitlement('pw-uk', async () => { throw new Error('down'); }),
    (err: unknown) => err instanceof TenantChatEntitlementUnavailableError && err.status === 503,
  );
  await assert.rejects(
    () => assertVisitorChatEntitlement('pw-infotech', async () => ({ status: 'suspended' })),
    /Capability "chat" is not enabled/,
  );
  assert.deepEqual(decideEffectiveTenantChat({
    known: true,
    active: true,
    compileTimeChat: true,
    entitlement: { availability: 'unavailable' },
  }).basis, 'store_unavailable');
});

test('public capabilities keep their shape and clear only chat when entitlement denies', () => {
  const source = resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'other' });
  const base = buildPublicPlatformCapabilities(source, {});
  const denied = applyEffectiveChatToCapabilities(base, { allowed: false, basis: 'suspended' });
  assert.equal(denied.tenant.key, 'pw-uk');
  assert.equal(denied.capabilities.chat, false);
  assert.equal(denied.capabilities.forms, base.capabilities.forms);
  assert.equal(denied.capabilities.scheduling, base.capabilities.scheduling);
  assert.equal(denied.scheduling.enabled, base.scheduling.enabled);
  assert.equal('chatWidget' in denied, false);
  const unchanged = applyEffectiveChatToCapabilities(base, { allowed: true, basis: 'allowed_existing' });
  assert.equal(unchanged.capabilities.chat, true);
  assert.equal(unchanged, base);
});

test('public chat CORS applies the same decision and fails closed when the store is down', async () => {
  const allow = createPublicChatApiCorsMiddleware(async () => ({ allowed: true, basis: 'allowed_existing' }));
  const allowedRes = mockRes();
  await allow(mockReq({ origin: 'https://uk.primewayz.com' }) as never, allowedRes as never, () => {
    assert.fail('preflight should end');
  });
  assert.equal(allowedRes.statusCode, 204);
  assert.equal(allowedRes.headers.get('Access-Control-Allow-Origin'), 'https://uk.primewayz.com');

  let nextCalled = false;
  const suspended = createPublicChatApiCorsMiddleware(async () => ({ allowed: false, basis: 'suspended' }));
  const suspendedRes = mockRes();
  await suspended(mockReq({ origin: 'https://primewayz.com' }) as never, suspendedRes as never, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(suspendedRes.statusCode, 403);
  assert.deepEqual(suspendedRes.jsonBody, { error: 'Origin is not allowed.' });
  assert.equal(suspendedRes.headers.get('Access-Control-Allow-Origin'), undefined);

  const down = createPublicChatApiCorsMiddleware(async () => { throw new Error('store down'); });
  const downRes = mockRes();
  await down(mockReq({ origin: 'https://uk.primewayz.com' }) as never, downRes as never, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(downRes.statusCode, 503);
  assert.deepEqual(downRes.jsonBody, { error: 'Chat is temporarily unavailable.' });

  const previous = process.env[ACTIVATION];
  delete process.env[ACTIVATION];
  let gateCalls = 0;
  try {
    const bypass = createPublicChatApiCorsMiddleware(async () => {
      gateCalls += 1;
      return { allowed: true, basis: 'allowed_entitled' };
    });
    const silver = mockRes();
    await bypass(mockReq({ origin: PREVIEW }) as never, silver as never, () => {
      nextCalled = true;
    });
    assert.equal(silver.statusCode, 403);
    assert.equal(gateCalls, 0);
  } finally {
    if (previous === undefined) delete process.env[ACTIVATION];
    else process.env[ACTIVATION] = previous;
  }
});

test('Host/Owner changes are audited and operators can read only assigned tenants', async () => {
  const store = createMemoryTenantChatEntitlementStore();
  await assert.rejects(
    () => setTenantChatEntitlement(store, INFOTECH, 'pw-infotech', 'suspended', 'Operator attempt', T0),
    (err: unknown) => err instanceof TenantChatEntitlementAdminError && err.code === 'platform_owner_required',
  );
  await setTenantChatEntitlement(store, OWNER, 'pw-infotech', 'suspended', 'Billing hold', T0);
  await setTenantChatEntitlement(store, OWNER, 'pw-uk', 'entitled', 'Confirmed for UK', new Date('2026-10-19T12:05:00.000Z'));
  const operatorView = await listTenantChatEntitlementViews(store, INFOTECH, null);
  assert.deepEqual(operatorView.map((tenant) => tenant.tenantId), ['pw-infotech']);
  assert.equal(operatorView[0]?.effective.basis, 'suspended');
  assert.equal(operatorView[0]?.recentChanges[0]?.actorUserId, OWNER.id);
  assert.equal(operatorView[0]?.recentChanges[0]?.reason, 'Billing hold');
  assert.equal(operatorView[0]?.recentChanges[0]?.status, 'suspended');
  await assert.rejects(
    () => listTenantChatEntitlementViews(store, INFOTECH, 'pw-uk'),
    (err: unknown) => err instanceof TenantChatEntitlementAdminError && err.code === 'tenant_access_denied',
  );
  const hostView = await listTenantChatEntitlementViews(store, OWNER, 'pw-uk');
  assert.equal(hostView.length, 1);
  assert.equal(hostView[0]?.effective.basis, 'allowed_entitled');
  await assert.rejects(
    () => setTenantChatEntitlement(store, OWNER, 'missing-tenant', 'revoked', 'No such tenant', T0),
    (err: unknown) => err instanceof TenantChatEntitlementAdminError && err.code === 'invalid_tenant',
  );
});

test('admin HTTP keeps entitlement changes on the Host/Owner and preserves the admin envelope', async () => {
  const store = createMemoryTenantChatEntitlementStore();
  const handlers = createTenantChatEntitlementAdminHandlers({ store, now: () => T0 });
  const app = express();
  app.use(express.json());
  let current: TenantChatAdminPrincipal = INFOTECH;
  app.use((req, _res, next) => {
    (req as express.Request & { adminUser?: TenantChatAdminPrincipal }).adminUser = current;
    next();
  });
  app.get('/api/admin/tenant-chat-entitlements', handlers.list);
  app.post('/api/admin/tenant-chat-entitlements/:tenantId', handlers.set);
  const server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;
  const call = (method: string, requestPath: string, body?: unknown) => new Promise<{ status: number; json: any }>((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = http.request({
      host: '127.0.0.1',
      port,
      method,
      path: requestPath,
      headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, json: data ? JSON.parse(data) : null }));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
  try {
    const hidden = await call('GET', '/api/admin/tenant-chat-entitlements');
    assert.equal(hidden.status, 200);
    assert.equal(hidden.json.canManage, false);
    assert.deepEqual(hidden.json.tenants.map((tenant: { tenantId: string }) => tenant.tenantId), ['pw-infotech']);
    const denied = await call('POST', '/api/admin/tenant-chat-entitlements/pw-infotech', { status: 'suspended', reason: 'No' });
    assert.equal(denied.status, 403);
    assert.equal(denied.json.success, false);
    assert.equal(denied.json.code, 'platform_owner_required');
    current = OWNER;
    const saved = await call('POST', '/api/admin/tenant-chat-entitlements/pw-infotech', { status: 'suspended', reason: 'Billing hold' });
    assert.equal(saved.status, 200);
    assert.equal(saved.json.success, true);
    assert.equal(saved.json.entitlement.status, 'suspended');
    assert.equal(saved.json.entitlement.updatedByUserId, OWNER.id);
    const override = await call('POST', '/api/admin/tenant-chat-entitlements/pw-uk', {
      status: 'revoked',
      reason: 'Wrong field',
      tenantId: 'pw-infotech',
    });
    assert.equal(override.status, 400);
    assert.equal((await store.find('pw-uk')), null);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
  }
});

test('migration is additive and server wiring keeps visitor, capabilities, CORS, and WordPress on one resolver', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'prisma/migrations/20261019180000_tenant_chat_entitlement/migration.sql'), 'utf8');
  const executable = sql.replace(/--[^\n]*/g, '');
  assert.match(sql, /CREATE TABLE `TenantChatEntitlement`/);
  assert.match(sql, /CREATE TABLE `TenantChatEntitlementAudit`/);
  assert.doesNotMatch(executable, /INSERT INTO/i);
  assert.doesNotMatch(executable, /ChatSession|ChatMessage|ChatConnectInstallation|ALTER TABLE/);
  const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  assert.match(server, /function resolveTenantChatAccess\(tenantId: string\) \{\s*return resolveEffectiveTenantChat\(\{/);
  assert.match(server, /createPublicChatApiCorsMiddleware\(resolveTenantChatAccess/);
  assert.match(server, /createPublicPlatformApiCorsMiddleware\(resolveVerifiedChatOrigin\)/);
  assert.match(server, /lookupVerifiedTenantOrigin\(tenantAccountStore/);
  assert.match(server, /applyEffectiveChatToCapabilities\(\s*buildPublicPlatformCapabilities/);
  assert.match(server, /const decision = await resolveTenantChatAccess\(sourceContext\.tenantId\)/);
  const visitorGateFn = server.slice(
    server.indexOf('async function assertEffectivePublicTenantChat'),
    server.indexOf("app.options('/api/v1/website-audits'"),
  );
  assert.match(visitorGateFn, /resolveTenantChatAccess\(source\.tenantId\)/);
  assert.equal(visitorGateFn.includes('assertVisitorChatEntitlement'), false);
  assert.equal((server.match(/resolveChatAccess: resolveTenantChatAccess/g) ?? []).length, 3);
  assert.equal((server.match(/tenantChatEntitlementStore\.find/g) ?? []).length, 1);
  assert.equal((server.match(/await assertEffectivePublicTenantChat\(sourceContext\)/g) ?? []).length, 6);
  const respond = server.slice(server.indexOf("app.post('/api/chat/respond'"), server.indexOf("app.post('/api/chat/uploads'"));
  const visitorGate = respond.indexOf('await assertEffectivePublicTenantChat(sourceContext)');
  const visitorWrite = respond.indexOf('prisma.chatMessage.create');
  assert.ok(visitorGate >= 0 && visitorWrite > visitorGate, 'visitor messages are gated before they are stored');
  const adminReply = server.slice(server.indexOf("app.post('/api/chat',"), server.indexOf("app.post('/api/chat/respond'"));
  assert.equal(adminReply.includes('assertEffectivePublicTenantChat'), false);
  const adminRoutes = fs.readFileSync(path.join(process.cwd(), 'src/lib/admin/adminChatRoutes.ts'), 'utf8');
  const adminGate = adminRoutes.indexOf('assertOperationalChatWriteAllowed(session.tenantId, deps.resolveChatAccess)');
  const adminWrite = adminRoutes.indexOf('return createTeamReply(tx, {');
  assert.ok(adminGate >= 0 && adminWrite > adminGate, 'admin replies are gated before they are stored');
  const mutations = fs.readFileSync(path.join(process.cwd(), 'src/lib/admin/adminChatMutationRoutes.ts'), 'utf8');
  assert.equal((mutations.match(/assertOperationalChatWriteAllowed\(/g) ?? []).length, 5);
  const wordpress = fs.readFileSync(path.join(process.cwd(), 'src/lib/integrations/wordpressChatIntegration.ts'), 'utf8');
  assert.match(wordpress, /knownDenial && historicalRead/);
  const entitlementAdmin = server.slice(
    server.indexOf('app.get(TENANT_CHAT_ENTITLEMENT_ADMIN_PATH'),
    server.indexOf('app.patch(\'/api/admin/chat/availability\''),
  );
  assert.doesNotMatch(entitlementAdmin, /resolveTenantChatAccess|assertEffectivePublicTenantChat/);
  const widget = fs.readFileSync(path.join(process.cwd(), 'src/embed/chat/widget.ts'), 'utf8');
  assert.equal(widget.includes('TenantChatEntitlement'), false);
});
