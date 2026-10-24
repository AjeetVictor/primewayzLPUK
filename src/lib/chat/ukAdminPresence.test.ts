/**
 * PW-CHAT-PRESENCE-WS2 — UK Admin presence hardening tests.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import test from 'node:test';
import express from 'express';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  resolveChatPresence,
} from './chatPresence.ts';
import {
  clearAdminPresenceForUser,
  countActiveTenantOperators,
  recordTenantAdminHeartbeat,
  recordTenantChatPresenceSetting,
  type TenantChatPresencePrisma,
} from './tenantChatPresenceStore.ts';
import {
  assertUkAdminPresenceBodyClean,
  buildUkAdminPresenceDashboardView,
  clearUkAdminOperatorPresenceForTenant,
  isVerifiedHumanOnline,
  presenceExpiresAtFromLatest,
  UK_ADMIN_PRESENCE_OFFLINE_PATH,
} from './ukAdminPresence.ts';
import {
  createOperatorPresenceIngestionHandlers,
  OPERATOR_PRESENCE_OFFLINE_PATH,
  OPERATOR_PRESENCE_WRITE_SCOPE,
  OPERATOR_PRESENCE_INGESTION_CONTRACT,
} from './operatorPresenceIngestion.ts';
import { createMemoryTenantPresencePolicyStore } from '../platform/tenantPresencePolicyMemory.ts';
import { createMemoryTenantPresenceEventStore } from './tenantPresenceEventsMemory.ts';
import { createMemoryPresenceIdempotencyStore } from './tenantPresenceIdempotency.ts';

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

const ukAgent = {
  id: 11,
  email: 'uk-agent@primewayz.com',
  role: 'admin',
  isPlatformOwner: false,
  tenantIds: ['pw-uk'],
  tenantChatGrants: [{ tenantId: 'pw-uk', chatRole: 'agent' as const, chatRoleExplicit: true }],
};

test('auth is not availability: session without heartbeat is not verified human Online', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'auto',
    message: null,
    updatedById: 11,
  });
  const view = await buildUkAdminPresenceDashboardView({
    presencePrisma: db.prisma,
    tenantId: 'pw-uk',
    principal: ukAgent,
    state: { setting: { mode: 'auto', message: null }, latestAdminSeenAt: null },
    presencePolicy: 'legacy_forced_online',
    now: new Date(NOW),
  });
  assert.equal(view.operatorSession.authenticatedChatAgent, true);
  assert.equal(view.operatorSession.contributing, false);
  assert.equal(view.operatorSession.authIsNotAvailability, true);
  assert.equal(view.verifiedHumanOnline, false);
  assert.equal(view.visitorStatus, 'assistant');
  assert.equal(view.activeOperatorCount, 0);
  assert.equal(view.option1Activated, false);
});

test('authenticated UK agent heartbeat yields verified human Online and operator count', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'auto',
    message: null,
    updatedById: 11,
  });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 11, now: ago(5_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 12, now: ago(10_000) });
  const state = {
    setting: { mode: 'auto', message: null },
    latestAdminSeenAt: ago(5_000),
  };
  const view = await buildUkAdminPresenceDashboardView({
    presencePrisma: db.prisma,
    tenantId: 'pw-uk',
    principal: ukAgent,
    state,
    presencePolicy: 'legacy_forced_online',
    now: new Date(NOW),
  });
  assert.equal(view.verifiedHumanOnline, true);
  assert.equal(view.visitorStatus, 'online');
  assert.equal(view.activeOperatorCount, 2);
  assert.equal(view.operatorSession.contributing, true);
  assert.ok(view.presenceExpiresAt);
  assert.equal(
    presenceExpiresAtFromLatest(ago(5_000), ADMIN_PRESENCE_ACTIVE_WINDOW_MS)?.toISOString(),
    view.presenceExpiresAt,
  );
});

test('logout / offline clears only this operator; remaining operators keep tenant Online', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'auto',
    message: null,
    updatedById: 1,
  });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 11, now: ago(1_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 12, now: ago(2_000) });
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-uk', new Date(NOW)), 2);

  const cleared = await clearUkAdminOperatorPresenceForTenant(
    (input) => clearAdminPresenceForUser(db.prisma, input),
    { userId: 11, tenantId: 'pw-uk' },
  );
  assert.equal(cleared.cleared, 1);
  assert.equal(await countActiveTenantOperators(db.prisma.adminPresence, 'pw-uk', new Date(NOW)), 1);
  const resolved = resolveChatPresence({
    mode: 'auto',
    latestAdminSeenAt: ago(2_000),
    now: NOW,
  });
  assert.equal(resolved.status, 'online');
  assert.equal(isVerifiedHumanOnline(resolved), true);
});

test('tenant isolation: UK offline does not clear Infotech heartbeats', async () => {
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 11, now: ago(1_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 11, now: ago(1_000) });
  await clearUkAdminOperatorPresenceForTenant(
    (input) => clearAdminPresenceForUser(db.prisma, input),
    { userId: 11, tenantId: 'pw-uk' },
  );
  assert.equal(db.heartbeats.length, 1);
  assert.equal(db.heartbeats[0].tenantId, 'pw-infotech');
});

test('forced Online without heartbeat is not verified human Online (Option 1 still off)', () => {
  const forced = resolveChatPresence({
    mode: 'available',
    latestAdminSeenAt: null,
    now: NOW,
    presencePolicy: 'legacy_forced_online',
  });
  assert.equal(forced.status, 'online');
  assert.equal(forced.hasActiveAdmin, false);
  assert.equal(isVerifiedHumanOnline(forced), false);
});

test('heartbeat body rejects client-supplied tenant / operator identity', () => {
  assert.doesNotThrow(() => assertUkAdminPresenceBodyClean(undefined));
  assert.doesNotThrow(() => assertUkAdminPresenceBodyClean({}));
  assert.throws(() => assertUkAdminPresenceBodyClean({ tenantId: 'pw-uk' }));
  assert.throws(() => assertUkAdminPresenceBodyClean({ operatorUserId: 99 }));
  assert.throws(() => assertUkAdminPresenceBodyClean({ userId: 1 }));
});

test('v1 offline: Admin principal clears presence; integration stays reserved (WP/Silver untouched)', async () => {
  assert.equal(OPERATOR_PRESENCE_INGESTION_CONTRACT.paths.offline.status, 'admin_only');

  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 42, now: ago(1_000) });
  const handlers = createOperatorPresenceIngestionHandlers({
    policyStore: createMemoryTenantPresencePolicyStore(),
    eventStore: createMemoryTenantPresenceEventStore(),
    idempotency: createMemoryPresenceIdempotencyStore(),
    recordHeartbeat: async (input) => recordTenantAdminHeartbeat(db.prisma, input),
    clearOperatorPresence: async (input) => clearAdminPresenceForUser(db.prisma, input),
    resolvePrincipal: async (req) => {
      if (req.get('x-kind') === 'integration') {
        return {
          kind: 'integration',
          tenantId: 'pw-infotech',
          integrationId: 'wp',
          scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
        };
      }
      return {
        kind: 'admin',
        tenantId: 'pw-uk',
        adminUserId: 42,
        scopes: [OPERATOR_PRESENCE_WRITE_SCOPE],
      };
    },
    now: () => new Date(NOW),
  });

  const app = express();
  app.use(express.json());
  app.post(OPERATOR_PRESENCE_OFFLINE_PATH, handlers.offline);
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    const integration = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_OFFLINE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-kind': 'integration' },
      body: JSON.stringify({ clientActionId: 'off-1', operatorRef: 'wp-1' }),
    });
    assert.equal(integration.status, 501);

    const admin = await fetch(`http://127.0.0.1:${port}${OPERATOR_PRESENCE_OFFLINE_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientActionId: 'off-uk-1', operatorRef: 'user:42' }),
    }).then((r) => r.json());
    assert.equal(admin.success, true);
    assert.equal(admin.cleared, 1);
    assert.equal(db.heartbeats.length, 0);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  }
});

test('automated bot reply path never writes AdminPresence or ChatPresenceSetting', () => {
  const server = read('server.ts');
  const respondStart = server.indexOf("app.post('/api/chat/respond'");
  assert.ok(respondStart > 0);
  const respondBlock = server.slice(respondStart, respondStart + 2500);
  assert.match(respondBlock, /resolveTenantBotReply/);
  assert.doesNotMatch(respondBlock, /recordTenantAdminHeartbeat/);
  assert.doesNotMatch(respondBlock, /recordTenantChatPresenceSetting/);
  assert.doesNotMatch(respondBlock, /adminPresence\.upsert/);
});

test('WS-2 wiring: UK offline path, dashboard enrichment, Option 1 stays inactive', () => {
  const server = read('server.ts');
  assert.match(server, /UK_ADMIN_PRESENCE_OFFLINE_PATH/);
  assert.match(server, /buildUkAdminPresenceDashboardView/);
  assert.match(server, /assertUkAdminPresenceBodyClean/);
  assert.match(server, /attachAdminSessionIfPresent/);
  assert.match(server, /clearOperatorPresence:/);
  assert.doesNotMatch(server, /heartbeat_required_online['"]\s*,\s*reason:/);
  assert.equal(UK_ADMIN_PRESENCE_OFFLINE_PATH, '/api/admin/presence/offline');

  const panel = read('src/components/AdminPanel.tsx');
  assert.match(panel, /\/api\/admin\/presence\/offline/);
  assert.match(panel, /pagehide/);
  assert.match(panel, /admin-presence-operator-summary/);
  assert.match(panel, /verifiedHumanOnline/);

  assert.doesNotMatch(
    read('src/lib/integrations/integrationRegistry.ts'),
    /scopes:\s*\[[^\]]*chat:presence:write/,
  );
});
