import assert from 'node:assert/strict';
import http from 'node:http';
import test from 'node:test';
import express from 'express';
import type { Server } from 'node:http';
import { createPublicChatApiCorsMiddleware } from '../chat/publicChatApiCors.ts';
import { validateExistingOrNewChatSessionId } from '../chat/publicChatGuards.ts';
import { createMemoryTenantChatEntitlementStore } from './tenantChatEntitlementMemory.ts';
import {
  resolveEffectiveTenantChat,
  TenantChatEntitlementUnavailableError,
} from './tenantChatEntitlement.ts';
import { applyEffectiveChatToCapabilities, buildPublicPlatformCapabilities } from './publicCapabilities.ts';
import { createPublicPlatformApiCorsMiddleware } from './publicPlatformApiCors.ts';
import { SourceResolutionError } from './sourceResolver.ts';
import { getTenantById } from './tenantRegistry.ts';
import { createMemoryTenantAccountStore } from './tenantAccountMemory.ts';
import { rememberRuntimeTenantCapabilities } from './tenantCapabilities.ts';
import {
  addSiteOrigin,
  addTenantSite,
  changeTenantLifecycle,
  openCommercialRecord,
  registerDatabaseTenant,
  TenantAccountError,
  verifySiteOrigin,
  type TenantAccountPrincipal,
} from './tenantAccountService.ts';
import type { TenantAccountStore } from './tenantAccountStore.ts';
import {
  lookupVerifiedTenantOrigin,
  resolvePublicTenantSource,
} from './verifiedOriginResolution.ts';

const OWNER: TenantAccountPrincipal = { id: 1, role: 'admin', isPlatformOwner: true, tenantIds: [] };
const at = new Date('2026-10-19T12:00:00.000Z');
const ACME_SESSION = '11111111-1111-4111-8111-111111111111';
const PROVED: Parameters<typeof verifySiteOrigin>[3] = async () => 'dns_txt';

type SessionRow = { tenantId: string; messages: Array<{ text: string; tenantId: string }> };

async function onboard(store: TenantAccountStore, tenantId: string, origin: string) {
  await registerDatabaseTenant(store, OWNER, {
    tenantId,
    displayName: tenantId,
    brand: 'Customer',
    market: 'UK',
    organizationName: `${tenantId} Ltd`,
    primaryContactName: 'Ada',
    primaryContactEmail: `${tenantId}@example.test`,
  }, at);
  const site = await addTenantSite(store, OWNER, tenantId, { displayName: `${tenantId} site`, technology: 'wordpress' }, at);
  const challenged = await addSiteOrigin(store, OWNER, site.id, { origin }, at, { NODE_ENV: 'test' });
  return { site, challenged };
}

function verifiedDirectory(store: TenantAccountStore) {
  return async (origin: string) => {
    const found = await lookupVerifiedTenantOrigin(store, origin, { allowLocalHttp: false });
    if (!found || found.availability === 'unavailable') return found;
    rememberRuntimeTenantCapabilities(found.account.tenantId, found.account.capabilities);
    return { availability: 'ready' as const, tenantId: found.tenantId };
  };
}

async function startPublicApp(accounts: TenantAccountStore, entitlements = createMemoryTenantChatEntitlementStore()) {
  const sessions = new Map<string, SessionRow>();
  const gate = (tenantId: string) => resolveEffectiveTenantChat({
    tenantId,
    lookup: () => entitlements.find(tenantId),
    account: () => accounts.gate(tenantId),
  });
  const app = express();
  app.use(express.json());
  app.use(createPublicChatApiCorsMiddleware(gate, verifiedDirectory(accounts)));
  app.use(createPublicPlatformApiCorsMiddleware(verifiedDirectory(accounts)));

  async function sourceOf(req: express.Request, sourceChannel: 'chat' | 'other') {
    return resolvePublicTenantSource({
      origin: req.get('origin'),
      host: req.get('host'),
      sourceChannel,
      body: req.body,
      store: accounts,
    });
  }

  async function assertChat(source: Awaited<ReturnType<typeof sourceOf>>) {
    const decision = await gate(source.tenantId);
    if (decision.basis === 'store_unavailable') throw new TenantChatEntitlementUnavailableError();
    if (!decision.allowed) throw new SourceResolutionError('Capability "chat" is not enabled for this tenant.');
    return decision;
  }

  function fail(res: express.Response, error: unknown) {
    if (error instanceof TenantChatEntitlementUnavailableError) return res.status(503).json({ error: error.message });
    if (error instanceof SourceResolutionError) {
      return res.status(error.message.includes('controlled by the server') ? 400 : 403).json({ error: error.message });
    }
    return res.status(500).json({ error: 'failed' });
  }

  app.get('/api/platform/capabilities', async (req, res) => {
    try {
      const source = await sourceOf(req, 'other');
      const decision = await gate(source.tenantId);
      const compiled = getTenantById(source.tenantId);
      const account = compiled ? null : await accounts.findAccount(source.tenantId);
      const body = buildPublicPlatformCapabilities(source, {}, account ? {
        displayName: account.displayName,
        capabilities: account.capabilities,
      } : undefined);
      res.json(applyEffectiveChatToCapabilities(body, decision));
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/chat/session', async (req, res) => {
    try {
      const source = await sourceOf(req, 'chat');
      await assertChat(source);
      const existing = sessions.get(String(req.body.sessionId));
      const validated = validateExistingOrNewChatSessionId({
        sessionId: req.body.sessionId,
        existingSession: existing ? { tenantId: existing.tenantId } : null,
        source,
      });
      if (!existing) sessions.set(validated.sessionId, { tenantId: source.tenantId, messages: [] });
      res.json({ sessionId: validated.sessionId, tenantId: sessions.get(validated.sessionId)?.tenantId });
    } catch (error) {
      fail(res, error);
    }
  });

  app.post('/api/chat/respond', async (req, res) => {
    try {
      const source = await sourceOf(req, 'chat');
      await assertChat(source);
      const existing = sessions.get(String(req.body.sessionId));
      validateExistingOrNewChatSessionId({
        sessionId: req.body.sessionId,
        existingSession: existing ? { tenantId: existing.tenantId } : null,
        source,
      });
      if (!existing) return res.status(404).json({ error: 'missing' });
      existing.messages.push({ text: String(req.body.text), tenantId: source.tenantId });
      res.json({ ok: true, tenantId: source.tenantId });
    } catch (error) {
      fail(res, error);
    }
  });

  app.get('/api/chat/:sessionId', async (req, res) => {
    try {
      const source = await sourceOf(req, 'chat');
      await assertChat(source);
      const existing = sessions.get(req.params.sessionId);
      if (!existing) return res.status(404).json({ error: 'missing' });
      validateExistingOrNewChatSessionId({
        sessionId: req.params.sessionId,
        existingSession: { tenantId: existing.tenantId },
        source,
      });
      res.json({ tenantId: existing.tenantId, messages: existing.messages });
    } catch (error) {
      fail(res, error);
    }
  });

  const server: Server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  const port = (server.address() as { port: number }).port;
  return {
    port,
    entitlements,
    close: () => new Promise<void>((done) => server.close(() => done())),
  };
}

function call(port: number, method: string, path: string, options: { origin?: string; host?: string; body?: unknown } = {}) {
  const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
  return new Promise<{ status: number; json: any; allowOrigin?: string }>((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port,
      method,
      path,
      headers: {
        ...(options.origin ? { Origin: options.origin } : {}),
        ...(options.host ? { Host: options.host } : {}),
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: res.statusCode ?? 0,
          json: raw ? JSON.parse(raw) : null,
          allowOrigin: res.headers['access-control-allow-origin'] as string | undefined,
        });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('an unverified origin and another tenant domain do not resolve', async () => {
  const store = createMemoryTenantAccountStore();
  const acme = await onboard(store, 'acme-uk', 'https://acme.example');
  const beta = await onboard(store, 'beta-uk', 'https://beta.example');
  assert.equal(acme.challenged.verificationStatus, 'pending');
  assert.equal(await lookupVerifiedTenantOrigin(store, 'https://acme.example', { allowLocalHttp: false }), null);
  await assert.rejects(
    () => verifySiteOrigin(store, OWNER, acme.challenged.id, async () => null, at),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'origin_unverified',
  );
  assert.equal((await store.findOriginByValue('https://acme.example'))?.verificationStatus, 'failed');
  await assert.rejects(
    () => addSiteOrigin(store, OWNER, beta.site.id, { origin: 'https://acme.example' }, at, { NODE_ENV: 'test' }),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'origin_collision',
  );
  await assert.rejects(
    () => addSiteOrigin(store, OWNER, beta.site.id, { origin: 'https://uk.primewayz.com' }, at, { NODE_ENV: 'test' }),
    (error: unknown) => error instanceof TenantAccountError && error.code === 'origin_collision',
  );
  const missing = {
    ...store,
    async findOriginByValue() {
      throw new Error("Table 'pw.PlatformTenantOrigin' doesn't exist");
    },
  };
  assert.equal(await lookupVerifiedTenantOrigin(missing, 'https://evil.example', { allowLocalHttp: false }), null);
  const down = {
    ...store,
    async findOriginByValue() {
      throw new Error('connection reset');
    },
  };
  assert.equal((await lookupVerifiedTenantOrigin(down, 'https://evil.example', { allowLocalHttp: false }))?.availability, 'unavailable');
});

test('verified customers stay isolated, and suspension closes chat including the host fallback', async () => {
  const accounts = createMemoryTenantAccountStore();
  const acme = await onboard(accounts, 'acme-uk', 'https://acme.example');
  const beta = await onboard(accounts, 'beta-uk', 'https://beta.example');
  await verifySiteOrigin(accounts, OWNER, acme.challenged.id, PROVED, at);
  await verifySiteOrigin(accounts, OWNER, beta.challenged.id, PROVED, at);
  await changeTenantLifecycle(accounts, OWNER, 'acme-uk', 'activate', at, {});
  await changeTenantLifecycle(accounts, OWNER, 'beta-uk', 'activate', at, {});
  await openCommercialRecord(accounts, OWNER, 'pw-uk', {
    organizationName: 'Primewayz UK',
    primaryContactName: 'Host',
    primaryContactEmail: 'host@primewayz.test',
    lifecycleStatus: 'suspended',
  }, at, {});
  await accounts.insertOrigin({
    id: 'origin_rogue',
    tenantId: 'acme-uk',
    siteId: acme.site.id,
    origin: 'https://uk.primewayz.com',
    verificationStatus: 'verified',
    verificationTokenHash: 'a'.repeat(64),
    verifiedMethod: 'dns_txt',
    challengeIssuedAt: at,
    verifiedAt: at,
    createdAt: at,
    updatedAt: at,
  });
  const app = await startPublicApp(accounts);
  await app.entitlements.set({ tenantId: 'acme-uk', status: 'entitled', reason: 'Contract', actorUserId: 1, at });
  await app.entitlements.set({ tenantId: 'beta-uk', status: 'entitled', reason: 'Contract', actorUserId: 1, at });
  try {
    const pending = await call(app.port, 'GET', '/api/platform/capabilities', { origin: 'https://not-verified.example' });
    assert.equal(pending.status, 403);
    assert.equal(JSON.stringify(pending.json).includes('acme-uk'), false);

    const draftDenied = await call(app.port, 'POST', '/api/chat/session', {
      origin: 'https://beta.example',
      body: { sessionId: '22222222-2222-4222-8222-222222222222', tenantId: 'acme-uk' },
    });
    assert.equal(draftDenied.status, 400);

    const stolen = await call(app.port, 'POST', '/api/chat/session', {
      origin: 'https://uk.primewayz.com',
      body: { sessionId: ACME_SESSION },
    });
    assert.equal(stolen.status, 403);
    assert.equal(JSON.stringify(stolen.json).includes('acme-uk'), false);

    const hostFallback = await call(app.port, 'POST', '/api/chat/session', {
      host: 'uk.primewayz.com',
      body: { sessionId: ACME_SESSION },
    });
    assert.equal(hostFallback.status, 403);

    const ukCapabilities = await call(app.port, 'GET', '/api/platform/capabilities', { origin: 'https://uk.primewayz.com' });
    assert.equal(ukCapabilities.status, 200);
    assert.equal(ukCapabilities.json.tenant.key, 'pw-uk');
    assert.equal(ukCapabilities.json.capabilities.chat, false);

    const opened = await call(app.port, 'POST', '/api/chat/session', {
      origin: 'https://acme.example',
      body: { sessionId: ACME_SESSION },
    });
    assert.equal(opened.status, 200);
    assert.equal(opened.json.tenantId, 'acme-uk');
    assert.equal(opened.allowOrigin, 'https://acme.example');
    const wrote = await call(app.port, 'POST', '/api/chat/respond', {
      origin: 'https://acme.example',
      body: { sessionId: ACME_SESSION, text: 'Acme private note' },
    });
    assert.equal(wrote.status, 200);
    assert.equal(wrote.json.tenantId, 'acme-uk');

    const acmeCapabilities = await call(app.port, 'GET', '/api/platform/capabilities', { origin: 'https://acme.example' });
    assert.equal(acmeCapabilities.status, 200);
    assert.equal(acmeCapabilities.json.tenant.key, 'acme-uk');
    assert.equal(acmeCapabilities.json.capabilities.chat, true);
    assert.equal(JSON.stringify(acmeCapabilities.json).includes('Acme private note'), false);

    const crossed = await call(app.port, 'GET', `/api/chat/${ACME_SESSION}`, { origin: 'https://beta.example' });
    assert.equal(crossed.status, 403);
    assert.equal(JSON.stringify(crossed.json).includes('Acme private note'), false);
    const betaCapabilities = await call(app.port, 'GET', '/api/platform/capabilities', { origin: 'https://beta.example' });
    assert.equal(betaCapabilities.json.tenant.key, 'beta-uk');
    assert.equal(JSON.stringify(betaCapabilities.json).includes('acme-uk'), false);

    await changeTenantLifecycle(accounts, OWNER, 'acme-uk', 'suspend', at, {});
    const suspendedChat = await call(app.port, 'POST', '/api/chat/respond', {
      origin: 'https://acme.example',
      body: { sessionId: ACME_SESSION, text: 'should not store' },
    });
    assert.equal(suspendedChat.status, 403);
    const suspendedCapabilities = await call(app.port, 'GET', '/api/platform/capabilities', { origin: 'https://acme.example' });
    assert.equal(suspendedCapabilities.status, 200);
    assert.equal(suspendedCapabilities.json.tenant.key, 'acme-uk');
    assert.equal(suspendedCapabilities.json.capabilities.chat, false);
    const stillPrivate = await call(app.port, 'GET', `/api/chat/${ACME_SESSION}`, { origin: 'https://beta.example' });
    assert.equal(JSON.stringify(stillPrivate.json).includes('should not store'), false);
    assert.equal(JSON.stringify(stillPrivate.json).includes('Acme private note'), false);

    await changeTenantLifecycle(accounts, OWNER, 'acme-uk', 'archive', at, {});
    const archived = await call(app.port, 'POST', '/api/chat/session', {
      origin: 'https://acme.example',
      body: { sessionId: '33333333-3333-4333-8333-333333333333' },
    });
    assert.equal(archived.status, 403);

    await changeTenantLifecycle(accounts, OWNER, 'pw-uk', 'archive', at, {});
    const archivedHost = await call(app.port, 'POST', '/api/chat/session', {
      host: 'uk.primewayz.com',
      body: { sessionId: '44444444-4444-4444-8444-444444444444' },
    });
    assert.equal(archivedHost.status, 403);
  } finally {
    await app.close();
  }
});
