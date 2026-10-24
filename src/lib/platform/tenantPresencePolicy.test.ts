/**
 * WS-1 — central presence policy, events, reporting, and ingestion contract.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  resolveChatPresence,
} from '../chat/chatPresence.ts';
import {
  createOperatorPresenceIngestionHandlers,
  OPERATOR_PRESENCE_HEARTBEAT_PATH,
  OPERATOR_PRESENCE_OFFLINE_PATH,
  OPERATOR_PRESENCE_INGESTION_CONTRACT,
  OPERATOR_PRESENCE_WRITE_SCOPE,
  parseOperatorPresenceHeartbeatBody,
  assertPresenceWriteAuthorized,
  resolveOperatorPresenceIdentity,
  syntheticPresenceUserId,
  OperatorPresenceIngestionError,
} from '../chat/operatorPresenceIngestion.ts';
import { createMemoryTenantPresenceEventStore } from '../chat/tenantPresenceEventsMemory.ts';
import { createMemoryPresenceIdempotencyStore } from '../chat/tenantPresenceIdempotency.ts';
import {
  TENANT_PRESENCE_RETENTION,
  pruneTenantPresenceArtifacts,
  resetTenantPresencePruneForTests,
} from '../chat/tenantPresenceRetention.ts';
import {
  clearAdminPresenceForUser,
  countActiveTenantOperators,
  recordTenantAdminHeartbeat,
  recordTenantChatPresenceSetting,
  type TenantChatPresencePrisma,
} from '../chat/tenantChatPresenceStore.ts';
import { INTEGRATION_REGISTRY } from '../integrations/integrationRegistry.ts';
import {
  createTenantPresencePolicyAdminHandlers,
  setTenantPresencePolicy,
  TenantPresencePolicyAdminError,
  type TenantPresenceAdminPrincipal,
} from './tenantPresencePolicyAdmin.ts';
import { createMemoryTenantPresencePolicyStore } from './tenantPresencePolicyMemory.ts';
import {
  DEFAULT_TENANT_PRESENCE_POLICY,
  FAIL_CLOSED_PRESENCE_POLICY,
  effectivePresencePolicy,
  lookupEffectivePresencePolicy,
  lookupPresencePolicy,
} from './tenantPresencePolicy.ts';

const NOW = Date.parse('2026-10-24T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms);
const T0 = new Date(NOW);
const OWNER: TenantPresenceAdminPrincipal = { id: 11, role: 'super_admin', isPlatformOwner: true, tenantIds: [] };
const INFOTECH: TenantPresenceAdminPrincipal = {
  id: 22,
  role: 'editor',
  isPlatformOwner: false,
  tenantIds: ['pw-infotech'],
};
const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

type HeartbeatRow = { id: number; tenantId: string; userId: number; lastSeenAt: Date };
type SettingRow = {
  id: number;
  tenantId: string;
  mode: string;
  message: string | null;
  updatedById: number | null;
  updatedAt: Date;
};

function createPresenceDb() {
  const settings: SettingRow[] = [];
  const heartbeats: HeartbeatRow[] = [];
  let clock = NOW;
  const prisma: TenantChatPresencePrisma = {
    chatPresenceSetting: {
      async findFirst({ where }) {
        const row = settings
          .filter((s) => s.tenantId === where.tenantId)
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
        return row ? { mode: row.mode, message: row.message } : null;
      },
      async create({ data }) {
        const row = { id: settings.length + 1, ...data, updatedAt: new Date(++clock) };
        settings.push(row);
        return row;
      },
    },
    adminPresence: {
      async findFirst({ where }) {
        const row = heartbeats
          .filter((h) => {
            if (h.tenantId !== where.tenantId) return false;
            if ('userId' in where && typeof where.userId === 'number') return h.userId === where.userId;
            return true;
          })
          .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())[0];
        return row ? { lastSeenAt: row.lastSeenAt, userId: row.userId } : null;
      },
      async findMany({ where, select }: {
        where: { tenantId?: string; userId?: number; lastSeenAt?: { gte: Date } };
        select: Record<string, true>;
      }) {
        const matched = heartbeats.filter((h) => {
          if (typeof where.userId === 'number' && h.userId !== where.userId) return false;
          if (typeof where.tenantId === 'string' && h.tenantId !== where.tenantId) return false;
          if (where.lastSeenAt && 'gte' in where.lastSeenAt) {
            return h.lastSeenAt.getTime() >= where.lastSeenAt.gte.getTime();
          }
          return true;
        });
        if (select.tenantId) return matched.map((h) => ({ tenantId: h.tenantId }));
        return matched.map((h) => ({ userId: h.userId, lastSeenAt: h.lastSeenAt }));
      },
      async upsert({ where, update, create }) {
        const key = where.tenantId_userId;
        const existing = heartbeats.find((h) => h.tenantId === key.tenantId && h.userId === key.userId);
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const row = { id: heartbeats.length + 1, ...create };
        heartbeats.push(row);
        return row;
      },
      async deleteMany({ where }) {
        const before = heartbeats.length;
        const keep = heartbeats.filter((h) => {
          if ('tenantId' in where && typeof where.tenantId === 'string') {
            return !(h.tenantId === where.tenantId && h.userId === where.userId);
          }
          return h.userId !== where.userId;
        });
        heartbeats.length = 0;
        heartbeats.push(...keep);
        return { count: before - keep.length };
      },
    },
  };
  return { prisma, settings, heartbeats };
}

test('default-disabled policy: missing row keeps legacy_forced_online', async () => {
  const store = createMemoryTenantPresencePolicyStore();
  assert.equal(DEFAULT_TENANT_PRESENCE_POLICY, 'legacy_forced_online');
  assert.equal(effectivePresencePolicy(null), 'legacy_forced_online');
  assert.equal(await lookupEffectivePresencePolicy(store, 'pw-uk'), 'legacy_forced_online');
  assert.equal(await lookupEffectivePresencePolicy(store, null), 'legacy_forced_online');
  const missing = await lookupPresencePolicy(store, 'pw-uk');
  assert.equal(missing.source, 'default_missing');
  assert.equal(missing.storeReadable, true);
});

test('policy-store outage fail-closes: never manufactures Online after activation', async () => {
  const failingStore = {
    async find() {
      throw new Error('simulated database outage');
    },
  };
  const lookup = await lookupPresencePolicy(failingStore, 'pw-uk');
  assert.equal(lookup.storeReadable, false);
  assert.equal(lookup.source, 'fail_closed_unavailable');
  assert.equal(lookup.policy, FAIL_CLOSED_PRESENCE_POLICY);
  assert.equal(await lookupEffectivePresencePolicy(failingStore, 'pw-uk'), 'heartbeat_required_online');

  // Activated tenant must not silently become forced Online when the store throws.
  const resolved = resolveChatPresence({
    mode: 'available',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: await lookupEffectivePresencePolicy(failingStore, 'pw-uk'),
  });
  assert.equal(resolved.status, 'assistant');
  assert.equal(resolved.teamStatus, 'not_online');
  assert.equal(resolved.hasActiveAdmin, false);

  // Missing vs activated cannot be distinguished during outage — both fail-closed.
  // When the store recovers, a missing row resumes legacy; an activated row resumes Option 1.
  const recovered = createMemoryTenantPresencePolicyStore();
  assert.equal((await lookupPresencePolicy(recovered, 'pw-uk')).source, 'default_missing');
  await recovered.set({
    tenantId: 'pw-uk',
    policy: 'heartbeat_required_online',
    reason: 'UK soak',
    actorUserId: 11,
    at: T0,
  });
  const activated = await lookupPresencePolicy(recovered, 'pw-uk');
  assert.equal(activated.source, 'row');
  assert.equal(activated.policy, 'heartbeat_required_online');
  assert.equal(activated.storeReadable, true);
});

test('existing behaviour unchanged under legacy policy (forced Online without heartbeat)', () => {
  const legacy = resolveChatPresence({
    mode: 'online',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: 'legacy_forced_online',
  });
  assert.equal(legacy.status, 'online');
  assert.equal(legacy.hasActiveAdmin, false);
  assert.equal(legacy.teamStatus, 'available');

  const omitted = resolveChatPresence({ mode: 'available', latestAdminSeenAt: null, now: NOW });
  assert.equal(omitted.status, 'online');
});

test('Option 1: Forced Online blocked without active heartbeat', () => {
  const blocked = resolveChatPresence({
    mode: 'available',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: 'heartbeat_required_online',
  });
  assert.equal(blocked.status, 'assistant');
  assert.equal(blocked.teamStatus, 'not_online');
  assert.equal(blocked.hasActiveAdmin, false);
  assert.equal(blocked.canAcceptMessages, true);
});

test('Option 1: active heartbeat permits Online under forced mode', () => {
  const allowed = resolveChatPresence({
    mode: 'online',
    latestAdminSeenAt: ago(30_000),
    now: NOW,
    presencePolicy: 'heartbeat_required_online',
  });
  assert.equal(allowed.status, 'online');
  assert.equal(allowed.hasActiveAdmin, true);
});

test('Option 1: expired heartbeat prevents Online under forced mode', () => {
  const expired = resolveChatPresence({
    mode: 'available',
    latestAdminSeenAt: ago(ADMIN_PRESENCE_ACTIVE_WINDOW_MS + 1_000),
    now: NOW,
    presencePolicy: 'heartbeat_required_online',
  });
  assert.equal(expired.status, 'assistant');
  assert.equal(expired.hasActiveAdmin, false);
});

test('Option 1: Offline and Away remain operational without heartbeat', () => {
  const away = resolveChatPresence({
    mode: 'away',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: 'heartbeat_required_online',
  });
  const offline = resolveChatPresence({
    mode: 'offline',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: 'heartbeat_required_online',
  });
  assert.equal(away.status, 'away');
  assert.equal(offline.status, 'offline');
  assert.equal(offline.canAcceptMessages, false);
});

test('multiple operators: active count is tenant-scoped', async () => {
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 1, now: ago(1_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 2, now: ago(2_000) });
  await recordTenantAdminHeartbeat(db.prisma, {
    tenantId: 'pw-uk',
    userId: 3,
    now: ago(ADMIN_PRESENCE_ACTIVE_WINDOW_MS + 5_000),
  });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 1, now: ago(500) });
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-uk', new Date(NOW)), 2);
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-infotech', new Date(NOW)), 1);
});

test('tenant isolation: policy and presence never cross tenants', async () => {
  const policyStore = createMemoryTenantPresencePolicyStore();
  await policyStore.set({
    tenantId: 'pw-uk',
    policy: 'heartbeat_required_online',
    reason: 'UK soak',
    actorUserId: 11,
    at: T0,
  });
  assert.equal(await lookupEffectivePresencePolicy(policyStore, 'pw-uk'), 'heartbeat_required_online');
  assert.equal(await lookupEffectivePresencePolicy(policyStore, 'pw-infotech'), 'legacy_forced_online');

  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'available',
    message: null,
    updatedById: 1,
  });
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-infotech',
    mode: 'available',
    message: null,
    updatedById: 1,
  });
  const uk = resolveChatPresence({
    mode: 'available',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: await lookupEffectivePresencePolicy(policyStore, 'pw-uk'),
  });
  const infotech = resolveChatPresence({
    mode: 'available',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: await lookupEffectivePresencePolicy(policyStore, 'pw-infotech'),
  });
  assert.equal(uk.status, 'assistant');
  assert.equal(infotech.status, 'online');
});

test('unauthorised policy changes are rejected; Host/Owner can set with audit', async () => {
  const store = createMemoryTenantPresencePolicyStore();
  const events = createMemoryTenantPresenceEventStore();
  await assert.rejects(
    () => setTenantPresencePolicy(store, events, INFOTECH, 'pw-infotech', 'heartbeat_required_online', 'Nope', T0),
    (err: unknown) => err instanceof TenantPresencePolicyAdminError && err.status === 403,
  );
  const saved = await setTenantPresencePolicy(
    store,
    events,
    OWNER,
    'pw-uk',
    'heartbeat_required_online',
    'Validated UK adapter',
    T0,
  );
  assert.equal(saved.policy, 'heartbeat_required_online');
  const audits = await store.recentAudits('pw-uk', 5);
  assert.equal(audits.length, 1);
  assert.equal(audits[0].actorUserId, 11);
  const listed = await events.list({ tenantId: 'pw-uk', limit: 10 });
  assert.equal(listed[0]?.eventType, 'policy_changed');
});

test('event deduplication and bounded retention', async () => {
  const events = createMemoryTenantPresenceEventStore();
  const first = await events.append({
    tenantId: 'pw-uk',
    eventType: 'presence_available',
    actorUserId: 1,
    correlationId: 'corr-1',
    details: { token: 'secret-should-redact', note: 'ok' },
    at: T0,
  });
  const dup = await events.append({
    tenantId: 'pw-uk',
    eventType: 'presence_available',
    actorUserId: 1,
    correlationId: 'corr-1',
    details: { note: 'again' },
    at: T0,
  });
  assert.equal(first.duplicated, false);
  assert.equal(dup.duplicated, true);
  assert.equal(dup.id, first.id);
  // Sensitive keys are stripped before persist (never stored, even redacted).
  assert.equal('token' in first.details, false);
  assert.equal(first.details.note, 'ok');

  await events.append({
    tenantId: 'pw-uk',
    eventType: 'presence_expired',
    correlationId: 'old',
    at: new Date(NOW - 120 * 24 * 60 * 60 * 1000),
  });
  const pruned = await events.prune(new Date(NOW));
  assert.ok(pruned.deletedByAge >= 1);
  const remaining = await events.list({ tenantId: 'pw-uk', limit: 20 });
  assert.equal(remaining.some((row) => row.correlationId === 'old'), false);
});

test('Host/Owner read-only reporting; tenant-scoped reporting access', async () => {
  const policyStore = createMemoryTenantPresencePolicyStore();
  const eventStore = createMemoryTenantPresenceEventStore();
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 9, now: ago(1_000) });
  await eventStore.append({
    tenantId: 'pw-infotech',
    eventType: 'presence_available',
    actorUserId: 9,
    correlationId: 'infotech-1',
    at: T0,
  });
  await eventStore.append({
    tenantId: 'pw-uk',
    eventType: 'presence_available',
    actorUserId: 1,
    correlationId: 'uk-1',
    at: T0,
  });

  const handlers = createTenantPresencePolicyAdminHandlers({
    policyStore,
    eventStore,
    presencePrisma: db.prisma,
    now: () => T0,
  });

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    const role = req.headers['x-principal'] === 'owner' ? OWNER : INFOTECH;
    (req as express.Request & { adminUser?: TenantPresenceAdminPrincipal }).adminUser = role;
    next();
  });
  app.get('/api/admin/presence-reporting', handlers.listReporting);
  app.get('/api/admin/presence-reporting/:tenantId/events', handlers.listEvents);
  app.post('/api/admin/presence-policy/:tenantId', handlers.setPolicy);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  try {
    const ownerReport = await fetch(`http://127.0.0.1:${port}/api/admin/presence-reporting`, {
      headers: { 'x-principal': 'owner' },
    }).then((r) => r.json());
    assert.equal(ownerReport.success, true);
    assert.equal(ownerReport.reportingOnly, true);
    assert.equal(ownerReport.canManageAvailability, false);
    assert.ok(ownerReport.tenants.some((t: { tenantId: string }) => t.tenantId === 'pw-uk'));
    assert.ok(ownerReport.tenants.some((t: { tenantId: string }) => t.tenantId === 'pw-infotech'));

    const tenantReport = await fetch(`http://127.0.0.1:${port}/api/admin/presence-reporting`, {
      headers: { 'x-principal': 'infotech' },
    }).then((r) => r.json());
    assert.equal(tenantReport.success, true);
    assert.deepEqual(
      tenantReport.tenants.map((t: { tenantId: string }) => t.tenantId),
      ['pw-infotech'],
    );

    const deniedEvents = await fetch(`http://127.0.0.1:${port}/api/admin/presence-reporting/pw-uk/events`, {
      headers: { 'x-principal': 'infotech' },
    });
    assert.equal(deniedEvents.status, 403);

    const allowedEvents = await fetch(`http://127.0.0.1:${port}/api/admin/presence-reporting/pw-infotech/events`, {
      headers: { 'x-principal': 'infotech' },
    }).then((r) => r.json());
    assert.equal(allowedEvents.success, true);
    assert.equal(allowedEvents.events.length, 1);
    assert.equal(allowedEvents.events[0].correlationId, 'infotech-1');

    const unauthPolicy = await fetch(`http://127.0.0.1:${port}/api/admin/presence-policy/pw-infotech`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-principal': 'infotech' },
      body: JSON.stringify({ policy: 'heartbeat_required_online', reason: 'No' }),
    });
    assert.equal(unauthPolicy.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('ingestion contract: replay protection, scope gate, no tenant override, no frontend secrets', async () => {
  assert.equal(OPERATOR_PRESENCE_INGESTION_CONTRACT.version, 'v1');
  assert.equal(OPERATOR_PRESENCE_INGESTION_CONTRACT.requiredScope, OPERATOR_PRESENCE_WRITE_SCOPE);
  assert.equal(OPERATOR_PRESENCE_INGESTION_CONTRACT.paths.offline.status, 'admin_and_integration_write');
  assert.equal(OPERATOR_PRESENCE_INGESTION_CONTRACT.paths.heartbeat.status, 'available');
  assert.ok(OPERATOR_PRESENCE_INGESTION_CONTRACT.notes.some((n) => /frontend JavaScript/i.test(n)));
  assert.ok(OPERATOR_PRESENCE_INGESTION_CONTRACT.heartbeat.rejectedFields.includes('operatorUserId'));

  const wordpress = INTEGRATION_REGISTRY.find((entry) => entry.integrationId === 'primewayz-wordpress')!;
  const silver = INTEGRATION_REGISTRY.find((entry) => entry.integrationId === 'rrb-silver-campaign-next')!;
  assert.equal(wordpress.scopes.includes(OPERATOR_PRESENCE_WRITE_SCOPE), true, 'WS-3 grants WP presence write');
  assert.equal(wordpress.tenantId, 'pw-infotech');
  assert.equal(silver.scopes.includes(OPERATOR_PRESENCE_WRITE_SCOPE), true, 'WS-4 grants Silver presence write');
  assert.equal(silver.tenantId, 'rrb-silver-campaign');
  assert.equal(silver.scopes.includes('chat:archive'), false);
  assert.equal(silver.scopes.includes('chat:delete'), false);

  assert.throws(
    () => parseOperatorPresenceHeartbeatBody({ clientActionId: 'a', operatorRef: 'op-1', tenantId: 'pw-uk' }),
    (err: unknown) => err instanceof OperatorPresenceIngestionError && err.code === 'tenant_mismatch',
  );
  assert.throws(
    () => parseOperatorPresenceHeartbeatBody({ clientActionId: 'a', operatorRef: 'op-1', operatorUserId: 99 }),
    (err: unknown) => err instanceof OperatorPresenceIngestionError && err.code === 'invalid_request',
  );
  assert.throws(
    () => assertPresenceWriteAuthorized({
      kind: 'integration',
      tenantId: 'pw-infotech',
      scopes: ['chat:dashboard'],
    }),
    (err: unknown) => err instanceof OperatorPresenceIngestionError && err.code === 'forbidden_scope',
  );

  const policyStore = createMemoryTenantPresencePolicyStore();
  const eventStore = createMemoryTenantPresenceEventStore();
  const idempotency = createMemoryPresenceIdempotencyStore();
  const db = createPresenceDb();
  let heartbeats = 0;

  const handlers = createOperatorPresenceIngestionHandlers({
    policyStore,
    eventStore,
    idempotency,
    recordHeartbeat: async (input) => {
      heartbeats += 1;
      return recordTenantAdminHeartbeat(db.prisma, input);
    },
    clearOperatorPresence: async (input) => clearAdminPresenceForUser(db.prisma, input),
    resolvePrincipal: async () => ({
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'primewayz-wordpress',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    }),
    now: () => T0,
  });

  const app = express();
  app.use(express.json());
  app.post(OPERATOR_PRESENCE_HEARTBEAT_PATH, handlers.heartbeat);
  app.post(OPERATOR_PRESENCE_OFFLINE_PATH, handlers.offline);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  try {
    const body = { clientActionId: 'action-1', operatorRef: 'wp-admin-9', correlationId: 'c-1' };
    const first = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    assert.equal(first.success, true);
    assert.equal(first.duplicated, false);
    assert.equal(first.expiresInMs, ADMIN_PRESENCE_ACTIVE_WINDOW_MS);
    assert.equal(heartbeats, 1);
    assert.equal(
      db.heartbeats[0]?.userId,
      syntheticPresenceUserId('pw-infotech', 'primewayz-wordpress', 'wp-admin-9'),
    );

    const replay = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    assert.equal(replay.duplicated, true);
    assert.equal(heartbeats, 1);

    const events = await eventStore.list({ tenantId: 'pw-infotech', limit: 10 });
    assert.equal(events.filter((e) => e.eventType === 'presence_available').length, 1);
    assert.equal(events[0]?.actorUserId, null, 'synthetic adapter ids are not stored as central User ids');

    const offline = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_OFFLINE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...body, clientActionId: 'offline-1', notAfterMs: T0.getTime() }),
    }).then((r) => r.json());
    assert.equal(offline.success, true);
    assert.equal(offline.cleared, 1);
    assert.equal(db.heartbeats.length, 0);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('operator identity: no impersonation, credential-bound synthetic ids, cross-tenant isolation', () => {
  const admin = resolveOperatorPresenceIdentity(
    { kind: 'admin', tenantId: 'pw-uk', adminUserId: 42, scopes: [OPERATOR_PRESENCE_WRITE_SCOPE] },
    { operatorRef: 'ignored-for-id' },
  );
  assert.equal(admin.userId, 42);
  assert.equal(admin.binding, 'admin_session');
  assert.equal(admin.synthetic, false);

  const wpA = resolveOperatorPresenceIdentity(
    {
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'wp-site-a',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    },
    { operatorRef: 'op-1' },
  );
  const wpB = resolveOperatorPresenceIdentity(
    {
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'wp-site-b',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    },
    { operatorRef: 'op-1' },
  );
  const otherTenant = resolveOperatorPresenceIdentity(
    {
      kind: 'integration',
      tenantId: 'pw-uk',
      integrationId: 'wp-site-a',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    },
    { operatorRef: 'op-1' },
  );
  const otherOp = resolveOperatorPresenceIdentity(
    {
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'wp-site-a',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    },
    { operatorRef: 'op-2' },
  );

  assert.equal(wpA.synthetic, true);
  assert.ok(wpA.userId < 0);
  assert.notEqual(wpA.userId, wpB.userId, 'different installations must not share operator identity');
  assert.notEqual(wpA.userId, otherTenant.userId, 'same operatorRef must not collide across tenants');
  assert.notEqual(wpA.userId, otherOp.userId, 'operators within a tenant remain distinct');
  assert.notEqual(wpA.userId, 42, 'synthetic ids stay outside the positive User id space');
});

test('idempotency: claim released after write failure so retries succeed', async () => {
  const policyStore = createMemoryTenantPresencePolicyStore();
  const eventStore = createMemoryTenantPresenceEventStore();
  const idempotency = createMemoryPresenceIdempotencyStore();
  const db = createPresenceDb();
  let failNext = true;
  let heartbeats = 0;

  const handlers = createOperatorPresenceIngestionHandlers({
    policyStore,
    eventStore,
    idempotency,
    recordHeartbeat: async (input) => {
      if (failNext) {
        failNext = false;
        throw new Error('simulated write interruption');
      }
      heartbeats += 1;
      return recordTenantAdminHeartbeat(db.prisma, input);
    },
    resolvePrincipal: async () => ({
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'future-wp-adapter',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    }),
    now: () => T0,
  });

  const app = express();
  app.use(express.json());
  app.post(OPERATOR_PRESENCE_HEARTBEAT_PATH, handlers.heartbeat);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const body = { clientActionId: 'retry-1', operatorRef: 'wp-admin-9' };

  try {
    const failed = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(failed.status, 503);
    assert.equal(heartbeats, 0);

    const retry = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    assert.equal(retry.success, true);
    assert.equal(retry.duplicated, false);
    assert.equal(heartbeats, 1);

    const duplicate = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    assert.equal(duplicate.duplicated, true);
    assert.equal(heartbeats, 1);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('idempotency: partial event-write failure does not suppress a recorded heartbeat', async () => {
  const policyStore = createMemoryTenantPresencePolicyStore();
  const baseEvents = createMemoryTenantPresenceEventStore();
  const eventStore = {
    ...baseEvents,
    async append(input: Parameters<typeof baseEvents.append>[0]) {
      throw new Error('event store interrupted');
    },
    list: baseEvents.list.bind(baseEvents),
    prune: baseEvents.prune.bind(baseEvents),
  };
  const idempotency = createMemoryPresenceIdempotencyStore();
  const db = createPresenceDb();
  let heartbeats = 0;

  const handlers = createOperatorPresenceIngestionHandlers({
    policyStore,
    eventStore,
    idempotency,
    recordHeartbeat: async (input) => {
      heartbeats += 1;
      return recordTenantAdminHeartbeat(db.prisma, input);
    },
    resolvePrincipal: async () => ({
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'future-wp-adapter',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    }),
    now: () => T0,
  });

  const app = express();
  app.use(express.json());
  app.post(OPERATOR_PRESENCE_HEARTBEAT_PATH, handlers.heartbeat);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const body = { clientActionId: 'event-fail-1', operatorRef: 'wp-admin-9' };

  try {
    const first = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    assert.equal(first.success, true);
    assert.equal(heartbeats, 1);
    assert.equal(db.heartbeats.length, 1);

    const replay = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json());
    assert.equal(replay.duplicated, true);
    assert.equal(heartbeats, 1);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('Host governance: policy activation cannot impersonate operators or mutate availability via reporting', async () => {
  const policyStore = createMemoryTenantPresencePolicyStore();
  const eventStore = createMemoryTenantPresenceEventStore();
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 7, now: ago(1_000) });
  const before = db.heartbeats.map((row) => ({ ...row }));

  const handlers = createTenantPresencePolicyAdminHandlers({
    policyStore,
    eventStore,
    presencePrisma: db.prisma,
    now: () => T0,
  });

  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { adminUser?: TenantPresenceAdminPrincipal }).adminUser = OWNER;
    next();
  });
  app.get('/api/admin/presence-reporting', handlers.listReporting);
  app.post('/api/admin/presence-reporting', (_req, res) => {
    res.status(405).json({ success: false, error: 'Reporting is read-only.' });
  });
  app.post('/api/admin/presence-policy/:tenantId', handlers.setPolicy);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;

  try {
    await setTenantPresencePolicy(
      policyStore,
      eventStore,
      OWNER,
      'pw-uk',
      'heartbeat_required_online',
      'Validated UK adapter',
      T0,
    );
    assert.deepEqual(
      db.heartbeats.map((row) => ({ tenantId: row.tenantId, userId: row.userId, lastSeenAt: row.lastSeenAt.toISOString() })),
      before.map((row) => ({ tenantId: row.tenantId, userId: row.userId, lastSeenAt: row.lastSeenAt.toISOString() })),
      'policy activation must not manufacture heartbeats',
    );

    const report = await fetch(`http://127.0.0.1:${port}/api/admin/presence-reporting`).then((r) => r.json());
    assert.equal(report.reportingOnly, true);
    assert.equal(report.canManageAvailability, false);

    const mutate = await fetch(`http://127.0.0.1:${port}/api/admin/presence-reporting`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tenantId: 'pw-uk', userId: 7, mode: 'available' }),
    });
    assert.equal(mutate.status, 405);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('retention constants and opportunistic prune ownership', async () => {
  assert.equal(TENANT_PRESENCE_RETENTION.eventsRetentionMs, 90 * 24 * 60 * 60 * 1000);
  assert.equal(TENANT_PRESENCE_RETENTION.eventsMaxPerTenant, 5_000);
  assert.equal(TENANT_PRESENCE_RETENTION.idempotencyTtlMs, 24 * 60 * 60 * 1000);
  assert.equal(TENANT_PRESENCE_RETENTION.ownership, 'opportunistic_on_presence_write');

  resetTenantPresencePruneForTests();
  const events = createMemoryTenantPresenceEventStore();
  const idempotency = createMemoryPresenceIdempotencyStore();
  await events.append({
    tenantId: 'pw-uk',
    eventType: 'presence_expired',
    correlationId: 'ancient',
    at: new Date(NOW - 120 * 24 * 60 * 60 * 1000),
  });
  await idempotency.claim({
    tenantId: 'pw-uk',
    action: 'heartbeat',
    clientActionId: 'old-key',
    at: new Date(NOW - 48 * 60 * 60 * 1000),
  });
  await pruneTenantPresenceArtifacts({ events, idempotency }, new Date(NOW));
  const remaining = await events.list({ tenantId: 'pw-uk', limit: 20 });
  assert.equal(remaining.some((row) => row.correlationId === 'ancient'), false);
  assert.equal(await idempotency.claim({
    tenantId: 'pw-uk',
    action: 'heartbeat',
    clientActionId: 'old-key',
    at: new Date(NOW),
  }), 'claimed', 'expired idempotency key was pruned and can be reclaimed');
});

test('server wiring: policy/reporting/ingestion routes present; WP+Silver presence write; no Option 1 activation', () => {
  const server = read('server.ts');
  assert.match(server, /TENANT_PRESENCE_POLICY_ADMIN_PATH/);
  assert.match(server, /TENANT_PRESENCE_REPORTING_ADMIN_PATH/);
  assert.match(server, /OPERATOR_PRESENCE_HEARTBEAT_PATH/);
  assert.match(server, /OPERATOR_PRESENCE_OFFLINE_PATH/);
  assert.match(server, /attachAdminSessionIfPresent/);
  assert.match(server, /pruneTenantPresenceArtifacts/);
  assert.match(server, /lookupEffectivePresencePolicy/);
  assert.doesNotMatch(server, /heartbeat_required_online['"]\s*,\s*reason:/);
  const registry = read('src/lib/integrations/integrationRegistry.ts');
  assert.match(registry, /integrationId: 'primewayz-wordpress'[\s\S]*?chat:presence:write/);
  assert.match(registry, /integrationId: 'rrb-silver-campaign-next'[\s\S]*?chat:presence:write/);
  assert.doesNotMatch(registry, /integrationId: 'rrb-silver-campaign-next'[\s\S]*?chat:archive/);
  assert.doesNotMatch(registry, /integrationId: 'rrb-silver-campaign-next'[\s\S]*?chat:delete/);
});

test('migration is additive and does not seed policies', () => {
  const sql = read('prisma/migrations/20261024120000_tenant_presence_policy_events/migration.sql');
  assert.match(sql, /CREATE TABLE `TenantPresencePolicy`/);
  assert.match(sql, /CREATE TABLE `TenantPresenceEvent`/);
  assert.doesNotMatch(sql, /INSERT INTO `TenantPresencePolicy`/);
  assert.doesNotMatch(sql, /UPDATE `ChatPresenceSetting`/);
  assert.doesNotMatch(sql, /UPDATE `AdminPresence`/);
});
