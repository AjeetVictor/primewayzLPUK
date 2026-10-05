import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  ADMIN_PRESENCE_ACTIVE_WINDOW_MS,
  CHAT_PRESENCE_SCOPE,
  resolveChatPresence,
} from './chatPresence.ts';
import {
  readOptionalTenantChatPresence,
  readTenantChatPresence,
  recordTenantAdminHeartbeat,
  recordTenantChatPresenceSetting,
  type TenantChatPresencePrisma,
} from './tenantChatPresenceStore.ts';
import { resolveSourceContext } from '../platform/sourceResolver.ts';
import { resolveAdminTenantFilter } from '../platform/adminTenantFilter.ts';
import { getSchedulingAvailability } from '../scheduling/availability.ts';

const NOW = Date.parse('2026-10-05T09:00:00.000Z');
const ago = (ms: number) => new Date(NOW - ms);
const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

// --- In-memory model of ChatPresenceSetting / AdminPresence honouring tenant predicates ---

type SettingRow = { id: number; tenantId: string; mode: string; message: string | null; updatedById: number | null; updatedAt: Date };
type HeartbeatRow = { id: number; tenantId: string; userId: number; lastSeenAt: Date };

function createPresenceDb() {
  const settings: SettingRow[] = [];
  const heartbeats: HeartbeatRow[] = [];
  const queries: Array<{ table: string; where: unknown }> = [];
  let clock = NOW;
  const prisma: TenantChatPresencePrisma = {
    chatPresenceSetting: {
      async findFirst({ where }) {
        queries.push({ table: 'chatPresenceSetting', where });
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
        queries.push({ table: 'adminPresence', where });
        const row = heartbeats
          .filter((h) => h.tenantId === where.tenantId)
          .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())[0];
        return row ? { lastSeenAt: row.lastSeenAt } : null;
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
    },
  };
  return { prisma, settings, heartbeats, queries };
}

async function resolvedFor(prisma: TenantChatPresencePrisma, tenantId: string | null | undefined) {
  const state = await readOptionalTenantChatPresence(prisma, tenantId);
  return resolveChatPresence({ mode: state.setting?.mode, latestAdminSeenAt: state.latestAdminSeenAt, now: NOW });
}

const publicSource = (origin: string) => resolveSourceContext({ origin, sourceChannel: 'chat' });

// --- A. Scope ---

test('presence scope is tenant', () => {
  assert.equal(CHAT_PRESENCE_SCOPE, 'tenant');
  assert.doesNotMatch(read('src/lib/chat/chatPresence.ts'), /PLATFORM-WIDE|'platform'/);
});

// --- B. Public availability isolation (tenant from server-resolved Origin) ---

test('public availability: pw-uk presence does not leak to pw-infotech', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-uk', mode: 'online', message: 'UK online', updatedById: 1 });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 1, now: ago(30_000) });

  const uk = publicSource('https://uk.primewayz.com');
  const infotech = publicSource('https://primewayz.com');
  assert.equal(uk.tenantId, 'pw-uk');
  assert.equal(infotech.tenantId, 'pw-infotech');

  assert.equal((await resolvedFor(db.prisma, uk.tenantId)).status, 'online');
  const inf = await resolvedFor(db.prisma, infotech.tenantId);
  assert.equal(inf.status, 'assistant');
  assert.equal(inf.mode, 'auto');
  assert.equal(inf.hasActiveAdmin, false);
  assert.equal((await readTenantChatPresence(db.prisma, 'pw-infotech')).setting, null);
});

test('public availability: pw-infotech presence does not leak to pw-uk', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-infotech', mode: 'offline', message: null, updatedById: 2 });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 2, now: ago(10_000) });

  const inf = await resolvedFor(db.prisma, publicSource('https://www.primewayz.com').tenantId);
  assert.equal(inf.status, 'offline');
  assert.equal(inf.canAcceptMessages, false);

  const uk = await resolvedFor(db.prisma, publicSource('https://uk.primewayz.com').tenantId);
  assert.equal(uk.status, 'assistant');
  assert.equal(uk.canAcceptMessages, true);
  assert.equal(uk.hasActiveAdmin, false);
});

test('public availability: rrb with no presence rows defaults safely', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-uk', mode: 'online', message: null, updatedById: 1 });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 1, now: ago(1_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 1, now: ago(1_000) });

  const rrbSource = publicSource('https://rentreadbuy.com');
  assert.equal(rrbSource.tenantId, 'rrb');
  assert.deepEqual(await readTenantChatPresence(db.prisma, 'rrb'), { setting: null, latestAdminSeenAt: null });
  assert.deepEqual(await resolvedFor(db.prisma, rrbSource.tenantId), {
    mode: 'auto', hasActiveAdmin: false, computedStatus: 'assistant', status: 'assistant', canAcceptMessages: true,
  });
});

test('public availability: tenant authority comes only from Origin/Host, never a body tenantId', () => {
  assert.throws(() => resolveSourceContext({ origin: 'https://uk.primewayz.com', sourceChannel: 'chat', body: { tenantId: 'pw-infotech' } }));
});

test('availability without a source performs no presence lookup at all', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-uk', mode: 'online', message: null, updatedById: 1 });
  for (const tenantId of [null, undefined, '']) {
    assert.deepEqual(await readOptionalTenantChatPresence(db.prisma, tenantId), { setting: null, latestAdminSeenAt: null });
  }
  assert.equal(db.queries.length, 0, 'no global read');
});

// --- G. No global fallback ---

test('a tenant with no rows never inherits another tenant\'s latest state', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-uk', mode: 'away', message: 'Back soon', updatedById: 1 });
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-infotech', mode: 'online', message: 'Hi', updatedById: 1 });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 9, now: ago(0) });

  const rrb = await readTenantChatPresence(db.prisma, 'rrb');
  assert.deepEqual(rrb, { setting: null, latestAdminSeenAt: null });
  assert.ok(db.queries.every((q) => JSON.stringify(q.where) !== '{}'), 'every query carries a tenant predicate');
  assert.ok(db.queries.filter((q) => q.where && (q.where as { tenantId: string }).tenantId === 'rrb').length === 2);
});

// --- C. Admin read isolation (existing Admin tenant selector) ---

test('admin read: pw-uk selection reads pw-uk only, pw-infotech selection reads pw-infotech only', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-uk', mode: 'away', message: 'UK away', updatedById: 1 });
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-infotech', mode: 'online', message: 'IN online', updatedById: 1 });

  const ukTenant = resolveAdminTenantFilter('pw-uk')!;
  const infTenant = resolveAdminTenantFilter('pw-infotech')!;
  assert.equal(resolveAdminTenantFilter(undefined), 'pw-uk', 'Admin default selection stays pw-uk');

  db.queries.length = 0;
  assert.deepEqual((await readTenantChatPresence(db.prisma, ukTenant)).setting, { mode: 'away', message: 'UK away' });
  assert.ok(db.queries.every((q) => (q.where as { tenantId: string }).tenantId === 'pw-uk'));

  db.queries.length = 0;
  assert.deepEqual((await readTenantChatPresence(db.prisma, infTenant)).setting, { mode: 'online', message: 'IN online' });
  assert.ok(db.queries.every((q) => (q.where as { tenantId: string }).tenantId === 'pw-infotech'));
});

test('admin presence rejects "All entities" and unknown tenants instead of aggregating', () => {
  assert.equal(resolveAdminTenantFilter('all'), undefined);
  assert.throws(() => resolveAdminTenantFilter('evil-tenant'));
  const server = read('server.ts');
  const helper = server.slice(server.indexOf('function resolveAdminPresenceTenantId'), server.indexOf("app.get('/api/admin/chat/availability'"));
  assert.match(helper, /tenantId = adminTenantId\(req\)/);
  assert.match(helper, /if \(!tenantId\) \{\s*res\.status\(400\)/);
  assert.match(helper, /sourceResolutionFailure\(res, error\)/);
});

// --- D. Admin write isolation ---

test('admin write: availability writes store the selected tenantId and keep history', async () => {
  const db = createPresenceDb();
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-uk', mode: 'online', message: 'UK', updatedById: 1 });
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-infotech', mode: 'offline', message: null, updatedById: 2 });
  await recordTenantChatPresenceSetting(db.prisma, { tenantId: 'pw-uk', mode: 'away', message: 'UK later', updatedById: 1 });

  assert.deepEqual(db.settings.map((s) => [s.tenantId, s.mode, s.updatedById]), [
    ['pw-uk', 'online', 1],
    ['pw-infotech', 'offline', 2],
    ['pw-uk', 'away', 1],
  ]);
  assert.equal((await readTenantChatPresence(db.prisma, 'pw-uk')).setting?.mode, 'away');
  assert.equal((await readTenantChatPresence(db.prisma, 'pw-infotech')).setting?.mode, 'offline');
});

// --- E. Admin heartbeat isolation ---

test('admin heartbeat: the same user keeps independent pw-uk and pw-infotech rows', async () => {
  const db = createPresenceDb();
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 7, now: ago(10 * 60_000) });
  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-infotech', userId: 7, now: ago(20 * 60_000) });
  assert.equal(db.heartbeats.length, 2);

  await recordTenantAdminHeartbeat(db.prisma, { tenantId: 'pw-uk', userId: 7, now: ago(5_000) });
  assert.equal(db.heartbeats.length, 2, 'upsert by compound tenantId/userId, no duplicate row');
  const uk = db.heartbeats.find((h) => h.tenantId === 'pw-uk')!;
  const inf = db.heartbeats.find((h) => h.tenantId === 'pw-infotech')!;
  assert.equal(uk.lastSeenAt.getTime(), NOW - 5_000);
  assert.equal(inf.lastSeenAt.getTime(), NOW - 20 * 60_000, 'pw-infotech row untouched');

  assert.equal((await resolvedFor(db.prisma, 'pw-uk')).status, 'online');
  assert.equal((await resolvedFor(db.prisma, 'pw-infotech')).status, 'assistant');
});

// --- H. Presence semantics unchanged ---

test('presence semantics are unchanged', () => {
  assert.equal(ADMIN_PRESENCE_ACTIVE_WINDOW_MS, 5 * 60 * 1000);
  const recent = ago(60_000);
  const stale = ago(ADMIN_PRESENCE_ACTIVE_WINDOW_MS);
  assert.equal(resolveChatPresence({ mode: 'auto', latestAdminSeenAt: recent, now: NOW }).status, 'online');
  assert.equal(resolveChatPresence({ mode: 'auto', latestAdminSeenAt: stale, now: NOW }).status, 'assistant');
  assert.equal(resolveChatPresence({ mode: null, latestAdminSeenAt: null, now: NOW }).status, 'assistant');
  assert.equal(resolveChatPresence({ mode: 'online', latestAdminSeenAt: null, now: NOW }).status, 'online');
  assert.equal(resolveChatPresence({ mode: 'away', latestAdminSeenAt: recent, now: NOW }).status, 'away');
  const offline = resolveChatPresence({ mode: 'offline', latestAdminSeenAt: recent, now: NOW });
  assert.equal(offline.status, 'offline');
  assert.equal(offline.canAcceptMessages, false);
});

// --- J. Scheduling stays tenant-isolated and fail-closed without a source ---

test('scheduling isolation and fail-closed behaviour are unchanged', () => {
  const server = read('server.ts');
  const payload = server.slice(server.indexOf('async function getChatAvailabilityPayload'), server.indexOf('function isDatabaseUnavailableError'));
  assert.match(payload, /const scheduling = source\s*\?\s*getSchedulingAvailability\(source\)/);
  assert.match(payload, /enabled: false,\s*canBookFromChat: false/);
  assert.doesNotMatch(payload, /getSchedulingAvailability\(\{ tenantId: adminPresenceTenantId/);
  assert.equal(getSchedulingAvailability({ tenantId: 'rrb' }, {} as NodeJS.ProcessEnv).canBookFromChat, false);
});

// --- Wiring: every presence read/write in server.ts is tenant-keyed ---

test('wiring: server presence reads and writes are tenant-scoped with no global lookup', () => {
  const server = read('server.ts');
  assert.doesNotMatch(server, /prisma\.chatPresenceSetting\.|prisma\.adminPresence\./, 'presence goes through the tenant store');

  const payload = server.slice(server.indexOf('async function getChatAvailabilityPayload'), server.indexOf('function isDatabaseUnavailableError'));
  assert.match(payload, /const presenceTenantId = source\?\.tenantId \?\? adminPresenceTenantId \?\? null;/);
  assert.match(payload, /readOptionalTenantChatPresence\(prisma, presenceTenantId\)/);

  const publicRoute = server.slice(server.indexOf("app.get('/api/chat/availability'"), server.indexOf("app.get('/api/chat/availability'") + 600);
  assert.match(publicRoute, /resolveRequestSource\(req, 'chat'\)/);
  assert.match(publicRoute, /getChatAvailabilityPayload\(sourceContext\)/);
  assert.doesNotMatch(publicRoute, /req\.(query|body)\.tenantId/);

  const adminBlock = server.slice(server.indexOf("app.get('/api/admin/chat/availability'"), server.indexOf("app.get('/api/admin/notifications/summary'"));
  assert.match(adminBlock, /app\.get\('\/api\/admin\/chat\/availability', requireAdmin, requireRole\(isOperationsRole\)/);
  assert.match(adminBlock, /app\.patch\('\/api\/admin\/chat\/availability', requireAdmin, requireRole\(isOperationsRole\)/);
  assert.match(adminBlock, /app\.post\('\/api\/admin\/presence\/heartbeat', requireAdmin, requireRole\(isOperationsRole\)/);
  assert.equal((adminBlock.match(/resolveAdminPresenceTenantId\(req, res\)/g) ?? []).length, 3);
  assert.equal((adminBlock.match(/getChatAvailabilityPayload\(undefined, tenantId\)/g) ?? []).length, 2);
  assert.match(adminBlock, /recordTenantChatPresenceSetting\(prisma, \{\s*tenantId,/);
  assert.match(adminBlock, /recordTenantAdminHeartbeat\(prisma, \{ tenantId, userId: req\.adminUser!\.id \}\)/);
  assert.doesNotMatch(adminBlock, /req\.body\.tenantId/);

  const store = read('src/lib/chat/tenantChatPresenceStore.ts');
  assert.match(store, /tenantId_userId: \{ tenantId: input\.tenantId, userId: input\.userId \}/);

  const operationalStore = read('src/lib/admin/operationalChatPrismaStore.ts');
  assert.match(operationalStore, /async readTeamPresence\(tenantId\) \{\s*const \{ setting, latestAdminSeenAt \} = await readTenantChatPresence\(prisma, tenantId\);/);
});

test('schema and migration: tenant-scoped presence with legacy rows assigned to pw-uk only', () => {
  const schema = read('prisma/schema.prisma');
  const setting = schema.slice(schema.indexOf('model ChatPresenceSetting'), schema.indexOf('model AdminPresence'));
  const admin = schema.slice(schema.indexOf('model AdminPresence'), schema.indexOf('// --- Users ---'));
  assert.match(setting, /tenantId\s+String\s+@db\.VarChar\(32\)/);
  assert.match(setting, /@@index\(\[tenantId, updatedAt\]\)/);
  assert.doesNotMatch(setting, /@@unique|tenantId[^\n]*@unique/);
  assert.match(admin, /tenantId\s+String\s+@db\.VarChar\(32\)/);
  assert.match(admin, /userId\s+Int\r?\n/);
  assert.match(admin, /@@unique\(\[tenantId, userId\]\)/);
  assert.match(admin, /@@index\(\[tenantId, lastSeenAt\]\)/);

  const migration = read('prisma/migrations/20261005120000_tenant_scoped_chat_presence/migration.sql');
  const order = [
    'ADD COLUMN `tenantId` VARCHAR(32) NULL',
    "SET `tenantId` = 'pw-uk'",
    'MODIFY `tenantId` VARCHAR(32) NOT NULL',
    'CREATE UNIQUE INDEX `AdminPresence_tenantId_userId_key`',
    'DROP INDEX `AdminPresence_userId_key`',
    'CREATE INDEX `ChatPresenceSetting_tenantId_updatedAt_idx`',
    'CREATE INDEX `AdminPresence_tenantId_lastSeenAt_idx`',
  ].map((needle) => migration.indexOf(needle));
  assert.ok(order.every((idx) => idx >= 0), `missing step: ${order}`);
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'safe migration order');
  assert.doesNotMatch(migration, /'pw-infotech'|'rrb'|INSERT INTO|DELETE FROM|DROP TABLE/);
});
