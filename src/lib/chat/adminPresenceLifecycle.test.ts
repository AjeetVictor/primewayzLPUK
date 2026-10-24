/**
 * PW-CHAT-PRESENCE-01 — focused lifecycle tests for admin auth vs availability,
 * heartbeat expiry, multi-admin calculation, tenant isolation, and visitor mapping.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  isAdminPresenceExpired,
  persistChatPresenceMode,
  resolveChatPresence,
} from './chatPresence.ts';
import {
  clearAdminPresenceForUser,
  readTenantChatPresence,
  recordTenantAdminHeartbeat,
  recordTenantChatPresenceSetting,
  type TenantChatPresencePrisma,
} from './tenantChatPresenceStore.ts';
import { resolveVisitorPresenceTone, resolveVisitorHeaderStatus } from './visitorChatUi.ts';
import {
  assertAdminTenantChatAccess,
  resolveEffectiveTenantChatRole,
} from '../admin/tenantChatRole.ts';
import { AdminTenantAccessError } from '../admin/adminTenantAccess.ts';

const NOW = Date.parse('2026-10-23T12:00:00.000Z');
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

async function teamFor(prisma: TenantChatPresencePrisma, tenantId: string, now = NOW) {
  const state = await readTenantChatPresence(prisma, tenantId);
  return resolveChatPresence({
    mode: state.setting?.mode,
    latestAdminSeenAt: state.latestAdminSeenAt,
    now,
  });
}

test('auth is not availability: login without heartbeat stays assistant in auto mode', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'auto',
    message: null,
    updatedById: 1,
  });
  const resolved = await teamFor(db.prisma, 'pw-uk');
  assert.equal(resolved.hasActiveAdmin, false);
  assert.equal(resolved.status, 'assistant');
  assert.equal(resolved.teamStatus, 'not_online');
  assert.equal(resolved.canAcceptMessages, true);
});

test('explicit availability changes map to visitor and team statuses', async () => {
  const db = createPresenceDb();
  for (const [mode, status, teamStatus, canAccept] of [
    ['available', 'online', 'available', true],
    ['away', 'away', 'away', true],
    ['offline', 'offline', 'offline', false],
    ['auto', 'assistant', 'not_online', true],
  ] as const) {
    await recordTenantChatPresenceSetting(db.prisma, {
      tenantId: 'pw-uk',
      mode: persistChatPresenceMode(mode),
      message: null,
      updatedById: 1,
    });
    const resolved = await teamFor(db.prisma, 'pw-uk');
    assert.equal(resolved.status, status, mode);
    assert.equal(resolved.teamStatus, teamStatus, mode);
    assert.equal(resolved.canAcceptMessages, canAccept, mode);
  }
});

test('heartbeat within window makes auto mode online; expiry returns assistant', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'auto',
    message: null,
    updatedById: 1,
  });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 3, now: ago(60_000) });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'online');

  const expiredAt = ago(ADMIN_PRESENCE_ACTIVE_WINDOW_MS);
  assert.equal(isAdminPresenceExpired(expiredAt, NOW), true);
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 3, now: expiredAt });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'assistant');
});

test('logout / session clear removes operator presence immediately in auto mode', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'auto',
    message: null,
    updatedById: 1,
  });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 11, now: ago(5_000) });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'online');

  await clearAdminPresenceForUser(db.prisma, { userId: 11 });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'assistant');
  assert.equal((await teamFor(db.prisma, 'pw-uk')).teamStatus, 'not_online');
});

test('multiple administrators: last available logout drops team online only when none remain', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-infotech',
    mode: 'auto',
    message: null,
    updatedById: 1,
  });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 1, now: ago(10_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 2, now: ago(20_000) });
  assert.equal((await teamFor(db.prisma, 'pw-infotech')).status, 'online');

  await clearAdminPresenceForUser(db.prisma, { userId: 1 });
  assert.equal((await teamFor(db.prisma, 'pw-infotech')).status, 'online', 'second operator still active');

  await clearAdminPresenceForUser(db.prisma, { userId: 2 });
  assert.equal((await teamFor(db.prisma, 'pw-infotech')).status, 'assistant');
});

test('logged in but explicitly unavailable: away/offline override fresh heartbeats', async () => {
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 1, now: ago(1_000) });
  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'away',
    message: 'In a meeting',
    updatedById: 1,
  });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'away');
  assert.equal((await teamFor(db.prisma, 'pw-uk')).hasActiveAdmin, true);

  await recordTenantChatPresenceSetting(db.prisma, {
    tenantId: 'pw-uk',
    mode: 'offline',
    message: null,
    updatedById: 1,
  });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'offline');
  assert.equal((await teamFor(db.prisma, 'pw-uk')).canAcceptMessages, false);
});

test('tenant isolation: UK heartbeat does not make Infotech available', async () => {
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 1, now: ago(1_000) });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'online');
  assert.equal((await teamFor(db.prisma, 'pw-infotech')).status, 'assistant');
  assert.equal((await teamFor(db.prisma, 'pw-infotech')).teamStatus, 'not_online');
});

test('multi-tenant operator: presence rows are independent per tenant', async () => {
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 7, now: ago(1_000) });
  await recordTenantAdminHeartbeat(db.prisma, {
    tenantId: 'pw-infotech',
    userId: 7,
    now: ago(ADMIN_PRESENCE_ACTIVE_WINDOW_MS + 1_000),
  });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'online');
  assert.equal((await teamFor(db.prisma, 'pw-infotech')).status, 'assistant');

  await clearAdminPresenceForUser(db.prisma, { userId: 7, tenantId: 'pw-uk' });
  assert.equal((await teamFor(db.prisma, 'pw-uk')).status, 'assistant');
  assert.equal(db.heartbeats.length, 1);
  assert.equal(db.heartbeats[0].tenantId, 'pw-infotech');
});

test('Host/Owner chat role is permission, not automatic visitor online', () => {
  const owner = {
    id: 1,
    email: 'host@primewayz.com',
    role: 'super_admin',
    isPlatformOwner: true,
    tenantIds: [] as string[],
  };
  assert.equal(resolveEffectiveTenantChatRole(owner, 'pw-uk').role, 'agent');
  assert.equal(resolveEffectiveTenantChatRole(owner, 'pw-infotech').role, 'agent');
  // Agent permission alone does not imply a heartbeat or forced available mode.
  const withoutHeartbeat = resolveChatPresence({ mode: 'auto', latestAdminSeenAt: null, now: NOW });
  assert.equal(withoutHeartbeat.status, 'assistant');
  assert.equal(withoutHeartbeat.teamStatus, 'not_online');
});

test('negative: unauthorised chat role cannot claim agent access', () => {
  const principal = {
    id: 9,
    email: 'blogger@example.com',
    role: 'author',
    isPlatformOwner: false,
    tenantIds: ['pw-uk'],
    tenantChatGrants: [{ tenantId: 'pw-uk', chatRole: 'none' as const, chatRoleExplicit: true }],
  };
  assert.throws(
    () => assertAdminTenantChatAccess('pw-uk', principal),
    (err: unknown) => err instanceof AdminTenantAccessError && err.status === 403,
  );
  assert.throws(
    () => assertAdminTenantChatAccess('pw-infotech', principal),
    (err: unknown) => err instanceof AdminTenantAccessError && err.status === 403,
  );
});

test('visitor-facing mapping: online / away / assistant / offline stay distinct', () => {
  assert.equal(
    resolveVisitorPresenceTone({ availabilityStatus: 'online', serviceAvailable: true }),
    'online',
  );
  assert.equal(
    resolveVisitorPresenceTone({ availabilityStatus: 'away', serviceAvailable: true }),
    'away',
  );
  assert.equal(
    resolveVisitorPresenceTone({ availabilityStatus: 'assistant', serviceAvailable: true }),
    'automated',
  );
  assert.equal(
    resolveVisitorPresenceTone({ availabilityStatus: 'offline', serviceAvailable: true }),
    'offline',
    'offline availability uses grey offline tone, distinct from away amber and service-error red',
  );
  assert.equal(
    resolveVisitorPresenceTone({ availabilityStatus: 'online', serviceAvailable: false }),
    'unavailable',
  );
  assert.equal(
    resolveVisitorHeaderStatus({
      availabilityStatus: 'assistant',
      serviceAvailable: true,
      hasAdminReply: false,
      waitingForTeam: true,
    }),
    'waiting_for_team',
  );
  assert.equal(
    resolveVisitorHeaderStatus({
      availabilityStatus: 'online',
      serviceAvailable: true,
      hasAdminReply: true,
      waitingForTeam: false,
    }),
    'human_response_received',
  );
});

test('AdminPanel and logout wiring enforce tenant-scoped presence lifecycle', () => {
  const adminPanel = read('src/components/AdminPanel.tsx');
  assert.match(adminPanel, /adminTenantPath\('\/api\/admin\/chat\/availability'\)/);
  assert.match(adminPanel, /adminTenantPath\('\/api\/admin\/presence\/heartbeat'\)/);
  assert.match(adminPanel, /\/api\/admin\/presence\/offline/);
  assert.match(adminPanel, /pagehide/);
  assert.match(adminPanel, /notAfterMs/);
  assert.match(adminPanel, /queueMicrotask/);
  assert.match(adminPanel, /presenceGenerationRef/);
  assert.match(adminPanel, /\[isAuthenticated, user, adminTenantFilter\]/);

  const server = read('server.ts');
  assert.match(server, /clearAdminPresenceForUser\(prisma, \{ userId: decoded\.id \}\)/);
  assert.match(server, /UK_ADMIN_PRESENCE_OFFLINE_PATH/);
  assert.match(server, /parseUkAdminPresenceNotAfterMs/);
  assert.doesNotMatch(
    server.slice(server.indexOf("app.get('/api/chat/availability'"), server.indexOf("app.get('/api/chat/availability'") + 800),
    /req\.(query|body)\.tenantId/,
  );
});
