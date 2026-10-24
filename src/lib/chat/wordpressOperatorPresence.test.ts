/**
 * PW-CHAT-PRESENCE-WS3 — Infotech WordPress operator-presence adapter (central).
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import test from 'node:test';
import express from 'express';
import { ADMIN_PRESENCE_ACTIVE_WINDOW_MS, resolveChatPresence } from './chatPresence.ts';
import {
  assertOperatorPresenceNotAfterMsAllowed,
  assertPresenceWriteAuthorized,
  createOperatorPresenceIngestionHandlers,
  OPERATOR_PRESENCE_HEARTBEAT_PATH,
  OPERATOR_PRESENCE_INGESTION_CONTRACT,
  OPERATOR_PRESENCE_NOT_AFTER_FUTURE_SKEW_MS,
  OPERATOR_PRESENCE_OFFLINE_PATH,
  OPERATOR_PRESENCE_WRITE_SCOPE,
  OperatorPresenceIngestionError,
  parseOperatorPresenceOfflineBody,
  resolveOperatorPresenceIdentity,
  syntheticPresenceUserId,
} from './operatorPresenceIngestion.ts';
import {
  clearAdminPresenceForUser,
  countActiveTenantOperators,
  recordTenantAdminHeartbeat,
  type TenantChatPresencePrisma,
} from './tenantChatPresenceStore.ts';
import { createMemoryTenantPresenceEventStore } from './tenantPresenceEventsMemory.ts';
import { createMemoryPresenceIdempotencyStore } from './tenantPresenceIdempotency.ts';
import { INTEGRATION_REGISTRY } from '../integrations/integrationRegistry.ts';
import { createMemoryTenantPresencePolicyStore } from '../platform/tenantPresencePolicyMemory.ts';

const NOW = Date.parse('2026-10-24T12:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms);
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
      async findMany({ where }) {
        return heartbeats.filter((h) => {
          if (typeof where.userId === 'number' && h.userId !== where.userId) return false;
          if (typeof where.tenantId === 'string' && h.tenantId !== where.tenantId) return false;
          if (where.lastSeenAt && 'gte' in where.lastSeenAt) {
            return h.lastSeenAt.getTime() >= where.lastSeenAt.gte.getTime();
          }
          return true;
        }).map((h) => ({ userId: h.userId, lastSeenAt: h.lastSeenAt, tenantId: h.tenantId }));
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
          const tenantMatch =
            'tenantId' in where && typeof where.tenantId === 'string'
              ? h.tenantId === where.tenantId
              : true;
          const userMatch = h.userId === where.userId;
          if (!tenantMatch || !userMatch) return true;
          if (where.lastSeenAt && 'lte' in where.lastSeenAt) {
            return h.lastSeenAt.getTime() > where.lastSeenAt.lte.getTime();
          }
          return false;
        });
        heartbeats.length = 0;
        heartbeats.push(...keep);
        return { count: before - keep.length };
      },
    },
  };
  return { prisma, settings, heartbeats };
}

test('WS-3 registry: primewayz-wordpress retains chat:presence:write for pw-infotech', () => {
  const wordpress = INTEGRATION_REGISTRY.find((e) => e.integrationId === 'primewayz-wordpress')!;
  const silver = INTEGRATION_REGISTRY.find((e) => e.integrationId === 'rrb-silver-campaign-next')!;
  assert.equal(wordpress.tenantId, 'pw-infotech');
  assert.ok(wordpress.scopes.includes(OPERATOR_PRESENCE_WRITE_SCOPE));
  assert.ok(silver.scopes.includes(OPERATOR_PRESENCE_WRITE_SCOPE), 'WS-4 also grants Silver');
  assert.doesNotThrow(() =>
    assertPresenceWriteAuthorized({
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'primewayz-wordpress',
      scopes: wordpress.scopes,
    }),
  );
  assert.throws(
    () =>
      assertPresenceWriteAuthorized({
        kind: 'integration',
        tenantId: 'rrb-silver-campaign',
        integrationId: 'rrb-silver-campaign-next',
        scopes: silver.scopes.filter((s) => s !== OPERATOR_PRESENCE_WRITE_SCOPE),
      }),
    (err: unknown) => err instanceof OperatorPresenceIngestionError && err.code === 'forbidden_scope',
  );
});

test('WS-3 multi-tab: distinct operatorRefs keep independent presence rows', async () => {
  const db = createPresenceDb();
  const tabA = 'wps:7:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const tabB = 'wps:7:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
  const idA = syntheticPresenceUserId('pw-infotech', 'primewayz-wordpress', tabA);
  const idB = syntheticPresenceUserId('pw-infotech', 'primewayz-wordpress', tabB);
  assert.notEqual(idA, idB);

  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: idA, now: ago(1_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: idB, now: ago(1_000) });
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-infotech', new Date(NOW)), 2);

  const cleared = await clearAdminPresenceForUser(db.prisma, {
    userId: idA,
    tenantId: 'pw-infotech',
    notAfter: new Date(NOW),
  });
  assert.equal(cleared, 1);
  assert.equal(db.heartbeats.length, 1);
  assert.equal(db.heartbeats[0]?.userId, idB);
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-infotech', new Date(NOW)), 1);
});

test('WS-3 multi-operator: UK and Infotech heartbeats stay tenant-isolated', async () => {
  const db = createPresenceDb();
  const wpRef = 'wps:3:cccccccccccccccccccccccccccccccc';
  const wpId = syntheticPresenceUserId('pw-infotech', 'primewayz-wordpress', wpRef);
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 11, now: ago(500) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: wpId, now: ago(500) });

  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-uk', new Date(NOW)), 1);
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-infotech', new Date(NOW)), 1);

  await clearAdminPresenceForUser(db.prisma, { userId: wpId, tenantId: 'pw-infotech' });
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-uk', new Date(NOW)), 1);
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-infotech', new Date(NOW)), 0);
});

test('WS-3 delayed Offline with notAfterMs does not wipe a newer heartbeat', async () => {
  const body = parseOperatorPresenceOfflineBody({
    clientActionId: 'off-race',
    operatorRef: 'wps:1:dddddddddddddddddddddddddddddddd',
    notAfterMs: NOW - 10_000,
  });
  assert.equal(body.notAfterMs, NOW - 10_000);

  assert.doesNotThrow(() =>
    assertOperatorPresenceNotAfterMsAllowed(NOW + OPERATOR_PRESENCE_NOT_AFTER_FUTURE_SKEW_MS, new Date(NOW)),
  );
  assert.throws(
    () => assertOperatorPresenceNotAfterMsAllowed(NOW + OPERATOR_PRESENCE_NOT_AFTER_FUTURE_SKEW_MS + 1, new Date(NOW)),
    (err: unknown) => err instanceof OperatorPresenceIngestionError && err.code === 'invalid_request',
  );

  assert.throws(
    () => parseOperatorPresenceOfflineBody({ clientActionId: 'x', operatorRef: 'y', tenantId: 'pw-infotech' }),
    (err: unknown) => err instanceof OperatorPresenceIngestionError && err.code === 'tenant_mismatch',
  );

  const db = createPresenceDb();
  const ref = 'wps:1:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
  const userId = syntheticPresenceUserId('pw-infotech', 'primewayz-wordpress', ref);
  const handlers = createOperatorPresenceIngestionHandlers({
    policyStore: createMemoryTenantPresencePolicyStore(),
    eventStore: createMemoryTenantPresenceEventStore(),
    idempotency: createMemoryPresenceIdempotencyStore(),
    recordHeartbeat: async (input) => recordTenantAdminHeartbeat(db.prisma, input),
    clearOperatorPresence: async (input) => clearAdminPresenceForUser(db.prisma, input),
    resolvePrincipal: async () => ({
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'primewayz-wordpress',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    }),
    now: () => new Date(NOW),
  });

  const app = express();
  app.use(express.json());
  app.post(OPERATOR_PRESENCE_HEARTBEAT_PATH, handlers.heartbeat);
  app.post(OPERATOR_PRESENCE_OFFLINE_PATH, handlers.offline);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_HEARTBEAT_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientActionId: 'hb-1', operatorRef: ref }),
    });
    await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId, now: new Date(NOW) });

    const stale = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_OFFLINE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientActionId: 'off-stale', operatorRef: ref, notAfterMs: NOW - 5_000 }),
    }).then((r) => r.json());
    assert.equal(stale.success, true);
    assert.equal(stale.cleared, 0);
    assert.equal(db.heartbeats.length, 1);

    const fresh = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_OFFLINE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientActionId: 'off-fresh', operatorRef: ref, notAfterMs: NOW }),
    }).then((r) => r.json());
    assert.equal(fresh.cleared, 1);
    assert.equal(db.heartbeats.length, 0);

    await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId, now: new Date(NOW) });
    const future = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_OFFLINE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        clientActionId: 'off-future',
        operatorRef: ref,
        notAfterMs: NOW + OPERATOR_PRESENCE_NOT_AFTER_FUTURE_SKEW_MS + 60_000,
      }),
    }).then(async (r) => ({ status: r.status, body: await r.json() }));
    assert.equal(future.status, 400);
    assert.equal(future.body.code, 'invalid_request');
    assert.equal(db.heartbeats.length, 1, 'far-future Offline must not clear');
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('WS-3: Option 1 Online needs a fresh heartbeat; TTL expiry remains the Offline fallback', () => {
  const online = resolveChatPresence({
    mode: 'auto',
    latestAdminSeenAt: ago(30_000),
    now: NOW,
    presencePolicy: 'heartbeat_required_online',
  });
  assert.equal(online.status, 'online');
  assert.equal(online.hasActiveAdmin, true);

  const expired = resolveChatPresence({
    mode: 'auto',
    latestAdminSeenAt: ago(ADMIN_PRESENCE_ACTIVE_WINDOW_MS + 1),
    now: NOW,
    presencePolicy: 'heartbeat_required_online',
  });
  // Under Option 1 with no fresh heartbeat, visitors get automated assistance (not human Online).
  assert.equal(expired.status, 'assistant');
  assert.equal(expired.hasActiveAdmin, false);
  assert.notEqual(expired.teamStatus, 'available');
});

test('WS-3 identity: adapter synthetic binding; browser cannot choose central User id', () => {
  const identity = resolveOperatorPresenceIdentity(
    {
      kind: 'integration',
      tenantId: 'pw-infotech',
      integrationId: 'primewayz-wordpress',
      scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
    },
    { operatorRef: 'wps:9:ffffffffffffffffffffffffffffffff' },
  );
  assert.equal(identity.synthetic, true);
  assert.equal(identity.binding, 'adapter_synthetic');
  assert.ok(identity.userId < 0);
  assert.equal(OPERATOR_PRESENCE_INGESTION_CONTRACT.paths.offline.reservedPrincipals.includes('installation'), true);
});

test('WS-3 wiring: no Option 1 activation; installation scopes stay empty for presence', () => {
  const server = read('server.ts');
  assert.doesNotMatch(server, /heartbeat_required_online['"]\s*,\s*reason:/);
  assert.match(server, /Installation credentials never receive presence write/);
  assert.match(server, /WS-2 Admin \+ WS-3 integration/);
  assert.equal(OPERATOR_PRESENCE_HEARTBEAT_PATH, '/api/v1/operator-presence/heartbeat');
  assert.equal(OPERATOR_PRESENCE_OFFLINE_PATH, '/api/v1/operator-presence/offline');
});
