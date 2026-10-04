import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import test from 'node:test';
import express from 'express';
import {
  createWordPressChatIntegrationHandler,
  resetWordPressChatRateLimitsForTests,
  resolveRequestId,
  TENANT_AUTHORITY_FIELDS,
  WORDPRESS_CHAT_INTEGRATION_PATH,
  WORDPRESS_CHAT_RATE_LIMITS,
  wordpressChatBodyErrorHandler,
  wordpressChatMethodNotAllowed,
  type WordPressChatAuditLogEntry,
} from './wordpressChatIntegration.ts';
import {
  INTEGRATION_REGISTRY,
  parseBearerToken,
  resolveIntegrationPrincipal,
  type IntegrationDefinition,
} from './integrationRegistry.ts';
import type {
  OperationalChatStore,
  OperationalMessageRow,
  OperationalSessionRow,
} from '../admin/operationalChatService.ts';
import {
  conversationNeedsAttention,
  toChatActor,
  toOperationalConversationStatus,
  toOriginatingPagePath,
  toPlainTextPreview,
  toVisitorLabel,
  UNANSWERED_VISITOR_MESSAGE_WHERE,
} from '../chat/chatOperationalSemantics.ts';
import { resolveChatPresence } from '../chat/chatPresence.ts';
import { isPublicChatCorsPath } from '../chat/publicChatApiCors.ts';
import { isPublicPlatformCorsPath } from '../platform/publicPlatformApiCors.ts';
import { isAdminStateChangingRequest } from '../admin/adminRequestOrigin.ts';
import { buildPublicPlatformCapabilities } from '../platform/publicCapabilities.ts';
import { resolveSourceContext } from '../platform/sourceResolver.ts';

const TOKEN = 'wpint_TEST_7f3c9a1e5b2d8f604c1a9e7b3d5f2a8c';
const PREVIOUS_TOKEN = 'wpint_PREV_0a1b2c3d4e5f60718293a4b5c6d7e8f9';
const ENV = { WORDPRESS_CHAT_INTEGRATION_TOKEN: TOKEN } as NodeJS.ProcessEnv;
const NOW = Date.parse('2026-10-04T09:00:00.000Z');

// --- In-memory model of the shared chat tables ---

type SessionRow = OperationalSessionRow & {
  email: string | null;
  market: string | null;
  sourceSite: string | null;
  sourceOrigin: string | null;
  sourceChannel: string | null;
  browser: string | null;
  visitorLastSeenAt: Date | null;
  updatedAt: Date;
};
type MessageRow = {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  answered: boolean;
  isInternalNote: boolean;
  deletedAt: Date | null;
  editedAt: Date | null;
  replyToId: number | null;
  timestamp: Date;
};
type Db = {
  sessions: SessionRow[];
  messages: MessageRow[];
  presence: { mode: string | null; latestAdminSeenAt: Date | null };
  down: boolean;
};

const at = (minutes: number) => new Date(NOW - (1000 - minutes) * 60 * 1000);

function session(id: string, tenantId: string | null, extra: Partial<SessionRow> = {}): SessionRow {
  return {
    id,
    tenantId,
    name: null,
    email: null,
    status: 'bot_replied',
    serviceInterest: null,
    firstLandingPage: null,
    currentPageUrl: null,
    createdAt: at(0),
    market: tenantId === 'pw-uk' ? 'UK' : tenantId ? 'IN' : null,
    sourceSite: tenantId === 'pw-infotech' ? 'primewayz.com' : null,
    sourceOrigin: tenantId === 'pw-infotech' ? 'https://primewayz.com' : null,
    sourceChannel: tenantId ? 'chat' : null,
    browser: 'Mozilla/5.0 SECRET-UA',
    visitorLastSeenAt: at(1),
    updatedAt: at(1),
    ...extra,
  };
}

let nextMessageId = 1;
function message(sessionId: string, sender: string, minute: number, extra: Partial<MessageRow> = {}): MessageRow {
  return {
    id: nextMessageId++,
    sessionId,
    sender,
    text: `${sender} message ${minute}`,
    answered: sender !== 'user',
    isInternalNote: false,
    deletedAt: null,
    editedAt: null,
    replyToId: null,
    timestamp: at(minute),
    ...extra,
  };
}

function createDb(): Db {
  nextMessageId = 1;
  const sessions = [
    session('inf-1', 'pw-infotech', {
      name: 'Gaurav',
      email: 'gaurav@example.com',
      serviceInterest: 'website-development',
      firstLandingPage: '/services/web?utm_source=secret-campaign#top',
    }),
    session('inf-2', 'pw-infotech', { email: 'anon@example.com', status: 'admin_replied' }),
    session('inf-3', 'pw-infotech', { name: 'Closed Person', status: 'closed' }),
    session('inf-4', 'pw-infotech', { name: 'someone@example.com', status: 'admin_replied' }),
    session('inf-5', 'pw-infotech', { name: 'Priya', status: 'follow_up_due', currentPageUrl: 'https://primewayz.com/contact?phone=999' }),
    session('inf-empty', 'pw-infotech', { name: 'Heartbeat Only', status: 'new' }),
    session('uk-1', 'pw-uk', { name: 'UK Visitor', email: 'uk@example.com' }),
    session('rrb-1', 'rrb', { name: 'RRB Visitor' }),
    session('legacy-1', null, { name: 'Legacy Visitor' }),
  ];
  const messages: MessageRow[] = [];
  const m1 = message('inf-1', 'user', 10, { text: 'Need a new website' });
  messages.push(m1, message('inf-1', 'bot', 11, { replyToId: m1.id }));
  const m2 = message('inf-2', 'user', 20, { answered: true });
  messages.push(m2, message('inf-2', 'admin', 21, { text: 'Team reply', replyToId: m2.id }));
  const note = message('inf-2', 'admin', 22, { text: 'SECRET INTERNAL NOTE', isInternalNote: true });
  messages.push(note, message('inf-2', 'admin', 19, { text: 'Quoting note', replyToId: note.id }));
  messages.push(message('inf-3', 'user', 30));
  messages.push(
    message('inf-4', 'user', 40, { answered: true }),
    message('inf-4', 'admin', 41, { text: 'Edited reply', editedAt: at(45) }),
    message('inf-4', 'admin', 42, { text: 'DELETED ORIGINAL TEXT', deletedAt: at(46), editedAt: at(44) }),
  );
  messages.push(message('inf-5', 'user', 50, { text: `<b>Hello</b>\n\nthere ${'x'.repeat(400)}` }));
  messages.push(message('uk-1', 'user', 100, { text: 'UK ONLY TEXT' }));
  messages.push(message('rrb-1', 'user', 101, { text: 'RRB ONLY TEXT' }));
  messages.push(message('legacy-1', 'user', 102, { text: 'LEGACY ONLY TEXT' }));
  return { sessions, messages, presence: { mode: 'auto', latestAdminSeenAt: new Date(NOW - 60 * 1000) }, down: false };
}

function dbDownError(): Error {
  const err = new Error("Can't reach database server at db.internal.example:3306");
  err.name = 'PrismaClientInitializationError';
  return err;
}

function createMemoryStore(db: Db, calls: string[] = []): OperationalChatStore {
  const guard = (name: string) => {
    calls.push(name);
    if (db.down) throw dbDownError();
  };
  const tenantOf = (sessionId: string) => db.sessions.find((s) => s.id === sessionId)?.tenantId;
  const visibleFor = (tenantId: string) =>
    db.messages.filter((m) => !m.isInternalNote && tenantOf(m.sessionId) === tenantId);
  const toRow = (m: MessageRow): OperationalMessageRow => ({
    id: m.id,
    sessionId: m.sessionId,
    sender: m.sender,
    text: m.text,
    timestamp: m.timestamp,
    editedAt: m.editedAt,
    deletedAt: m.deletedAt,
    replyToId: m.replyToId,
    replyToIsInternalNote: Boolean(db.messages.find((r) => r.id === m.replyToId)?.isInternalNote),
  });
  const toSession = (s: SessionRow): OperationalSessionRow => ({
    id: s.id,
    tenantId: s.tenantId,
    name: s.name,
    status: s.status,
    serviceInterest: s.serviceInterest,
    firstLandingPage: s.firstLandingPage,
    currentPageUrl: s.currentPageUrl,
    createdAt: s.createdAt,
  });
  const isUnanswered = (m: MessageRow) =>
    m.sender === UNANSWERED_VISITOR_MESSAGE_WHERE.sender
    && m.answered === UNANSWERED_VISITOR_MESSAGE_WHERE.answered
    && m.isInternalNote === UNANSWERED_VISITOR_MESSAGE_WHERE.isInternalNote
    && m.deletedAt === UNANSWERED_VISITOR_MESSAGE_WHERE.deletedAt;
  const countBy = (rows: MessageRow[]) => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.sessionId, (counts.get(row.sessionId) ?? 0) + 1);
    return counts;
  };

  return {
    async checkDatabase() { guard('checkDatabase'); },
    async readTeamPresence() { guard('readTeamPresence'); return { ...db.presence }; },
    async listRecentActivity({ tenantId, limit }) {
      guard('listRecentActivity');
      const latest = new Map<string, Date>();
      for (const m of visibleFor(tenantId)) {
        const current = latest.get(m.sessionId);
        if (!current || m.timestamp > current) latest.set(m.sessionId, m.timestamp);
      }
      return [...latest.entries()]
        .sort((a, b) => b[1].getTime() - a[1].getTime())
        .slice(0, limit)
        .map(([sessionId, lastActivityAt]) => ({ sessionId, lastActivityAt }));
    },
    async findSessions({ tenantId, sessionIds }) {
      guard('findSessions');
      return db.sessions.filter((s) => sessionIds.includes(s.id) && s.tenantId === tenantId).map(toSession);
    },
    async findSessionOwnership(sessionId) {
      guard('findSessionOwnership');
      const s = db.sessions.find((row) => row.id === sessionId);
      return s ? { id: s.id, tenantId: s.tenantId } : null;
    },
    async findSession({ tenantId, sessionId }) {
      guard('findSession');
      const s = db.sessions.find((row) => row.id === sessionId && row.tenantId === tenantId);
      return s ? toSession(s) : null;
    },
    async listLatestVisibleMessages({ tenantId, activity }) {
      guard('listLatestVisibleMessages');
      return visibleFor(tenantId)
        .filter((m) => activity.some((a) => a.sessionId === m.sessionId && a.lastActivityAt.getTime() === m.timestamp.getTime()))
        .map(toRow);
    },
    async countUnansweredVisitorMessages({ tenantId, sessionIds }) {
      guard('countUnansweredVisitorMessages');
      return countBy(db.messages.filter((m) => sessionIds.includes(m.sessionId) && tenantOf(m.sessionId) === tenantId && isUnanswered(m)));
    },
    async countVisibleMessages({ tenantId, sessionIds }) {
      guard('countVisibleMessages');
      return countBy(visibleFor(tenantId).filter((m) => sessionIds.includes(m.sessionId)));
    },
    async countSessionsNeedingAttention(tenantId) {
      guard('countSessionsNeedingAttention');
      return db.sessions.filter((s) =>
        s.tenantId === tenantId
        && !['closed', 'spam'].includes(s.status)
        && db.messages.some((m) => m.sessionId === s.id && isUnanswered(m))).length;
    },
    async listLatestTranscript({ tenantId, sessionId, take }) {
      guard('listLatestTranscript');
      return visibleFor(tenantId)
        .filter((m) => m.sessionId === sessionId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime() || b.id - a.id)
        .slice(0, take)
        .map(toRow);
    },
  };
}

// --- HTTP harness mirroring the server.ts wiring ---

type CallOptions = {
  token?: string | null;
  authorization?: string;
  body?: unknown;
  rawBody?: string;
  method?: string;
  path?: string;
  headers?: Record<string, string>;
};

async function startApp(options: {
  db?: Db;
  env?: NodeJS.ProcessEnv;
  registry?: readonly IntegrationDefinition[];
  clock?: { now: number };
} = {}) {
  resetWordPressChatRateLimitsForTests();
  const db = options.db ?? createDb();
  const calls: string[] = [];
  const logs: WordPressChatAuditLogEntry[] = [];
  const errors: string[] = [];
  const clock = options.clock ?? { now: NOW };
  const app = express();
  app.use(express.json());
  app.post(WORDPRESS_CHAT_INTEGRATION_PATH, createWordPressChatIntegrationHandler({
    store: createMemoryStore(db, calls),
    siteUrl: 'https://uk.primewayz.com/',
    isDatabaseUnavailableError: (err) => err instanceof Error && err.name === 'PrismaClientInitializationError',
    getClientIp: () => '203.0.113.10',
    env: options.env ?? ENV,
    registry: options.registry,
    now: () => clock.now,
    log: (entry) => logs.push(entry),
    logError: (line) => errors.push(line),
  }));
  app.all(WORDPRESS_CHAT_INTEGRATION_PATH, wordpressChatMethodNotAllowed);
  app.use(WORDPRESS_CHAT_INTEGRATION_PATH, wordpressChatBodyErrorHandler);

  const server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;

  const call = (opts: CallOptions = {}) =>
    new Promise<{ status: number; json: any; text: string; headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const headers: Record<string, string> = { ...(opts.headers ?? {}) };
      const token = opts.token === undefined ? TOKEN : opts.token;
      if (opts.authorization !== undefined) headers.Authorization = opts.authorization;
      else if (token) headers.Authorization = `Bearer ${token}`;
      const payload = opts.rawBody ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body));
      if (payload !== undefined) headers['Content-Type'] = 'application/json';
      const req = http.request(
        { host: '127.0.0.1', port, method: opts.method ?? 'POST', path: opts.path ?? WORDPRESS_CHAT_INTEGRATION_PATH, headers },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            let json: unknown = null;
            try { json = data ? JSON.parse(data) : null; } catch { json = null; }
            resolve({ status: res.statusCode ?? 0, json, text: data, headers: res.headers });
          });
        },
      );
      req.on('error', reject);
      if (payload !== undefined) req.write(payload);
      req.end();
    });

  return { db, calls, logs, errors, clock, call, close: () => new Promise<void>((done) => server.close(() => done())) };
}

const snapshot = (db: Db) => JSON.stringify({ sessions: db.sessions, messages: db.messages, presence: db.presence });

// --- Authentication ---

test('authentication: missing, wrong and malformed credentials return 401 integration_unauthorized', async () => {
  const app = await startApp();
  try {
    for (const opts of [
      { token: null },
      { token: 'wpint_WRONG_7f3c9a1e5b2d8f604c1a9e7b3d5f2a8c' },
      { authorization: `Basic ${TOKEN}` },
      { authorization: `Bearer ${TOKEN.slice(0, 20)}` },
      { authorization: TOKEN },
    ] satisfies CallOptions[]) {
      const res = await app.call({ ...opts, body: { action: 'dashboard' } });
      assert.equal(res.status, 401, JSON.stringify(opts));
      assert.equal(res.json.ok, false);
      assert.equal(res.json.apiVersion, '1');
      assert.equal(res.json.error.code, 'integration_unauthorized');
      assert.equal(res.headers['www-authenticate'], 'Bearer');
      assert.equal(res.json.data, undefined);
      assert.equal(res.json.tenant, undefined);
    }
  } finally {
    await app.close();
  }
});

test('authentication: valid credential succeeds and binds to pw-infotech with registry display name', async () => {
  const app = await startApp();
  try {
    const res = await app.call({ body: { action: 'dashboard' } });
    assert.equal(res.status, 200);
    assert.equal(res.json.ok, true);
    assert.equal(res.json.apiVersion, '1');
    assert.deepEqual(res.json.tenant, { key: 'pw-infotech', market: 'IN', displayName: 'Primewayz Infotech' });
    assert.equal(res.json.generatedAt, '2026-10-04T09:00:00.000Z');
    assert.match(res.json.requestId, /^[0-9a-f-]{36}$/);
    assert.equal(res.headers['x-request-id'], res.json.requestId);
  } finally {
    await app.close();
  }
});

test('authentication: credential is never accepted from the query string', async () => {
  const app = await startApp();
  try {
    const res = await app.call({ token: null, path: `${WORDPRESS_CHAT_INTEGRATION_PATH}?token=${TOKEN}`, body: { action: 'dashboard' } });
    assert.equal(res.status, 400);
    assert.equal(res.json.error.code, 'invalid_request');
    const withHeader = await app.call({ path: `${WORDPRESS_CHAT_INTEGRATION_PATH}?tenantId=pw-uk`, body: { action: 'dashboard' } });
    assert.equal(withHeader.status, 400);
  } finally {
    await app.close();
  }
});

test('authentication fails closed when the secret is unset or too short', async () => {
  for (const env of [{}, { WORDPRESS_CHAT_INTEGRATION_TOKEN: '' }, { WORDPRESS_CHAT_INTEGRATION_TOKEN: 'short-token' }]) {
    const app = await startApp({ env: env as NodeJS.ProcessEnv });
    try {
      const res = await app.call({ token: 'short-token', body: { action: 'diagnostics' } });
      assert.equal(res.status, 401);
      const res2 = await app.call({ body: { action: 'diagnostics' } });
      assert.equal(res2.status, 401);
    } finally {
      await app.close();
    }
  }
});

test('rotation: the _PREVIOUS secret is accepted alongside the current secret, and only those', async () => {
  const env = { WORDPRESS_CHAT_INTEGRATION_TOKEN: TOKEN, WORDPRESS_CHAT_INTEGRATION_TOKEN_PREVIOUS: PREVIOUS_TOKEN } as NodeJS.ProcessEnv;
  assert.equal(resolveIntegrationPrincipal(TOKEN, env)?.tenantId, 'pw-infotech');
  assert.equal(resolveIntegrationPrincipal(PREVIOUS_TOKEN, env)?.integrationId, 'primewayz-wordpress');
  assert.equal(resolveIntegrationPrincipal(PREVIOUS_TOKEN, ENV), null, 'previous token stops working once removed');
  assert.equal(resolveIntegrationPrincipal(null, env), null);
  assert.equal(parseBearerToken(`bearer ${TOKEN}`), TOKEN);
  assert.equal(parseBearerToken(`Bearer ${TOKEN} extra`), null);
});

test('registry: the WordPress integration is bound to pw-infotech with read-only scopes', () => {
  assert.equal(INTEGRATION_REGISTRY.length, 1);
  const [definition] = INTEGRATION_REGISTRY;
  assert.equal(definition.tenantId, 'pw-infotech');
  assert.deepEqual([...definition.scopes].sort(), ['chat:dashboard', 'chat:diagnostics', 'chat:read']);
  assert.ok(definition.scopes.every((scope) => !/write|reply|assign|delete|manage/.test(scope)));
});

test('scopes: a valid credential without the required scope returns 403 integration_forbidden', async () => {
  const registry: IntegrationDefinition[] = [{ ...INTEGRATION_REGISTRY[0], scopes: ['chat:diagnostics'] }];
  const app = await startApp({ registry });
  try {
    assert.equal((await app.call({ body: { action: 'diagnostics' } })).status, 200);
    const dashboard = await app.call({ body: { action: 'dashboard' } });
    assert.equal(dashboard.status, 403);
    assert.equal(dashboard.json.error.code, 'integration_forbidden');
    const conversation = await app.call({ body: { action: 'conversation', sessionId: 'inf-1' } });
    assert.equal(conversation.status, 403);
  } finally {
    await app.close();
  }
});

// --- Request contract ---

test('request: tenant / source authority fields are rejected for every action', async () => {
  const app = await startApp();
  try {
    for (const field of TENANT_AUTHORITY_FIELDS) {
      for (const action of ['dashboard', 'diagnostics', 'conversation']) {
        const body: Record<string, unknown> = { action, [field]: 'pw-uk' };
        if (action === 'conversation') body.sessionId = 'uk-1';
        const res = await app.call({ body });
        assert.equal(res.status, 400, `${action} ${field}`);
        assert.equal(res.json.error.code, 'tenant_override_rejected');
      }
    }
  } finally {
    await app.close();
  }
});

test('request: unknown actions, write actions, extra fields and bad session ids are rejected', async () => {
  const app = await startApp();
  try {
    for (const body of [
      {},
      { action: 'reply', sessionId: 'inf-1', text: 'x' },
      { action: 'assign' },
      { action: 'delete' },
      { action: 'status-change' },
      { action: 'DASHBOARD' },
      { action: 'dashboard', limit: 50 },
      { action: 'diagnostics', verbose: true },
      { action: 'conversation' },
      { action: 'conversation', sessionId: 42 },
      { action: 'conversation', sessionId: '   ' },
      { action: 'conversation', sessionId: 'x'.repeat(192) },
      { action: 'conversation', sessionId: 'inf-1', filter: 'all' },
      ['dashboard'],
    ]) {
      const res = await app.call({ body });
      assert.equal(res.status, 400, JSON.stringify(body));
      assert.equal(res.json.error.code, 'invalid_request');
    }
    const malformed = await app.call({ rawBody: '{"action":' });
    assert.equal(malformed.status, 400);
    assert.equal(malformed.json.ok, false);
    assert.equal(malformed.json.error.code, 'invalid_request');
    assert.equal(malformed.headers['cache-control'], 'no-store');
    const get = await app.call({ method: 'GET' });
    assert.equal(get.status, 405);
    assert.equal(get.headers.allow, 'POST');
  } finally {
    await app.close();
  }
});

test('request id: a safe caller X-Request-ID is echoed, unsafe or oversized values are replaced', async () => {
  assert.equal(resolveRequestId('wp-1696400000-abc123'), 'wp-1696400000-abc123');
  assert.match(resolveRequestId('x'.repeat(200)), /^[0-9a-f-]{36}$/);
  assert.match(resolveRequestId('bad id\r\nInjected: 1'), /^[0-9a-f-]{36}$/);
  assert.match(resolveRequestId(undefined), /^[0-9a-f-]{36}$/);
  const app = await startApp();
  try {
    const res = await app.call({ body: { action: 'diagnostics' }, headers: { 'X-Request-ID': 'wp-req-0001' } });
    assert.equal(res.json.requestId, 'wp-req-0001');
    assert.equal(res.headers['x-request-id'], 'wp-req-0001');
    assert.equal(app.logs.at(-1)?.requestId, 'wp-req-0001');
  } finally {
    await app.close();
  }
});

// --- Dashboard ---

test('dashboard: only pw-infotech conversations, newest first, no transcripts', async () => {
  const app = await startApp();
  try {
    const res = await app.call({ body: { action: 'dashboard' } });
    const rows = res.json.data.recentConversations;
    assert.deepEqual(rows.map((r: { sessionId: string }) => r.sessionId), ['inf-5', 'inf-4', 'inf-3', 'inf-2', 'inf-1']);
    const times = rows.map((r: { lastActivityAt: string }) => r.lastActivityAt);
    assert.deepEqual([...times].sort().reverse(), times);
    assert.ok(times.every((t: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(t)));
    assert.ok(!res.text.includes('UK ONLY TEXT') && !res.text.includes('RRB ONLY TEXT') && !res.text.includes('LEGACY ONLY TEXT'));
    assert.ok(rows.every((r: Record<string, unknown>) => !('messages' in r)));
    assert.deepEqual(Object.keys(rows[0]).sort(), [
      'intent', 'lastActivityAt', 'lastActor', 'lastMessagePreview', 'messageCount', 'needsAttention',
      'originatingPage', 'sessionId', 'status', 'visitorLabel',
    ]);
  } finally {
    await app.close();
  }
});

test('dashboard: attention count is computed by the same rule as per-row needsAttention', async () => {
  const app = await startApp();
  try {
    const { data } = (await app.call({ body: { action: 'dashboard' } })).json;
    const flagged = data.recentConversations.filter((r: { needsAttention: boolean }) => r.needsAttention);
    assert.deepEqual(flagged.map((r: { sessionId: string }) => r.sessionId).sort(), ['inf-1', 'inf-5']);
    assert.equal(data.attention.count, flagged.length);
    const byId = Object.fromEntries(data.recentConversations.map((r: { sessionId: string }) => [r.sessionId, r]));
    assert.equal(byId['inf-1'].status, 'waiting_for_team', 'canned assistant reply does not clear attention');
    assert.equal(byId['inf-1'].lastActor, 'assistant');
    assert.equal(byId['inf-2'].status, 'team_replied');
    assert.equal(byId['inf-2'].lastActor, 'team', 'internal note is not the last visible message');
    assert.equal(byId['inf-3'].status, 'closed');
    assert.equal(byId['inf-3'].needsAttention, false, 'closed conversations never need attention');
    assert.equal(byId['inf-5'].status, 'waiting_for_team');
    assert.equal(byId['inf-5'].lastActor, 'visitor');
  } finally {
    await app.close();
  }
});

test('dashboard: PII minimisation, safe labels, bounded plain-text previews', async () => {
  const app = await startApp();
  try {
    const res = await app.call({ body: { action: 'dashboard' } });
    for (const forbidden of ['@example.com', 'SECRET INTERNAL NOTE', 'SECRET-UA', 'DELETED ORIGINAL TEXT', 'secret-campaign', 'phone', 'email', 'browser', '"tenantId"', 'sourceOrigin', 'utm_']) {
      assert.ok(!res.text.includes(forbidden), `dashboard leaked ${forbidden}`);
    }
    const byId = Object.fromEntries(res.json.data.recentConversations.map((r: { sessionId: string }) => [r.sessionId, r]));
    assert.equal(byId['inf-1'].visitorLabel, 'Gaurav');
    assert.equal(byId['inf-1'].intent, 'website-development');
    assert.equal(byId['inf-1'].originatingPage, '/services/web');
    assert.equal(byId['inf-5'].originatingPage, '/contact');
    assert.match(byId['inf-2'].visitorLabel, /^Visitor • [0-9A-F]{6}$/);
    assert.match(byId['inf-4'].visitorLabel, /^Visitor • [0-9A-F]{6}$/, 'email-shaped names are not displayed');
    assert.equal(byId['inf-4'].lastMessagePreview, 'Message deleted');
    const preview = byId['inf-5'].lastMessagePreview as string;
    assert.ok(preview.length <= 200);
    assert.ok(preview.startsWith('Hello there'));
    assert.ok(!/[<>\n]/.test(preview));
    assert.equal(byId['inf-2'].messageCount, 3, 'internal notes are not counted');
  } finally {
    await app.close();
  }
});

test('dashboard: actor values are limited to visitor / assistant / team', async () => {
  const app = await startApp();
  try {
    const { data } = (await app.call({ body: { action: 'dashboard' } })).json;
    for (const row of data.recentConversations) assert.ok(['visitor', 'assistant', 'team'].includes(row.lastActor));
    assert.ok(!JSON.stringify(data).includes('"ai"'));
  } finally {
    await app.close();
  }
});

test('dashboard: is bounded to 20 conversations and uses a fixed number of batched queries', async () => {
  const db = createDb();
  for (let i = 0; i < 35; i += 1) {
    db.sessions.push(session(`bulk-${i}`, 'pw-infotech'));
    db.messages.push(message(`bulk-${i}`, 'user', 200 + i));
  }
  const app = await startApp({ db });
  try {
    const { data } = (await app.call({ body: { action: 'dashboard' } })).json;
    assert.equal(data.recentConversations.length, 20);
    assert.equal(data.recentConversations[0].sessionId, 'bulk-34');
    assert.equal(data.attention.count, 37, 'attention count covers the whole tenant, not just the visible page');
    assert.equal(data.limits.recentConversations, 20);
    assert.equal(app.calls.length, 7, `queries: ${app.calls.join(', ')}`);
    assert.equal(new Set(app.calls).size, app.calls.length, 'no store method is called per session');
    assert.ok(!app.calls.includes('listLatestTranscript'));
  } finally {
    await app.close();
  }
});

test('dashboard: empty tenant returns 200 with zero conversations, distinct from unavailable', async () => {
  const db = createDb();
  db.sessions = db.sessions.filter((s) => s.tenantId !== 'pw-infotech');
  const empty = await startApp({ db });
  try {
    const res = await empty.call({ body: { action: 'dashboard' } });
    assert.equal(res.status, 200);
    assert.deepEqual(res.json.data.recentConversations, []);
    assert.equal(res.json.data.attention.count, 0);
    assert.equal(res.json.data.service.status, 'healthy');
  } finally {
    await empty.close();
  }
  const downDb = createDb();
  downDb.down = true;
  const down = await startApp({ db: downDb });
  try {
    const res = await down.call({ body: { action: 'dashboard' } });
    assert.equal(res.status, 503);
    assert.equal(res.json.ok, false);
    assert.equal(res.json.error.code, 'database_unavailable');
    assert.equal(res.json.data, undefined);
    assert.ok(!res.text.includes('db.internal.example'), 'no connection details');
    assert.ok(down.errors.every((line) => !line.includes('db.internal.example')));
  } finally {
    await down.close();
  }
});

test('dashboard, conversation and diagnostics never mutate chat data or presence', async () => {
  const app = await startApp();
  try {
    const before = snapshot(app.db);
    await app.call({ body: { action: 'dashboard' } });
    await app.call({ body: { action: 'conversation', sessionId: 'inf-1' } });
    await app.call({ body: { action: 'conversation', sessionId: 'inf-2' } });
    await app.call({ body: { action: 'conversation', sessionId: 'uk-1' } });
    await app.call({ body: { action: 'conversation', sessionId: 'b3a1c9e2-1111-4222-8333-444455556666' } });
    await app.call({ body: { action: 'diagnostics' } });
    assert.equal(snapshot(app.db), before);
    assert.equal(app.db.sessions.length, createDb().sessions.length, 'no sessions created');
  } finally {
    await app.close();
  }
});

test('operational store contract and Prisma store expose no write operations', () => {
  const store = createMemoryStore(createDb());
  assert.ok(Object.keys(store).every((name) => !/create|update|upsert|delete|mark|set|write|save/i.test(name)));
  const prismaStore = fs.readFileSync(path.join(process.cwd(), 'src/lib/admin/operationalChatPrismaStore.ts'), 'utf8');
  assert.doesNotMatch(prismaStore, /\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(|\$executeRaw/);
  const service = fs.readFileSync(path.join(process.cwd(), 'src/lib/admin/operationalChatService.ts'), 'utf8');
  assert.doesNotMatch(service, /markVisitorMessagesAnswered|updateConversationStatus|adminPresence|prisma\./);
});

// --- Conversation ---

test('conversation: returns the pw-infotech transcript without internal notes', async () => {
  const app = await startApp();
  try {
    const res = await app.call({ body: { action: 'conversation', sessionId: 'inf-2' } });
    assert.equal(res.status, 200);
    const { conversation, messages, hasMore, messageLimit } = res.json.data;
    assert.equal(conversation.sessionId, 'inf-2');
    assert.equal(conversation.status, 'team_replied');
    assert.equal(conversation.needsAttention, false);
    assert.equal(hasMore, false);
    assert.equal(messageLimit, 100);
    assert.ok(!res.text.includes('SECRET INTERNAL NOTE'));
    assert.ok(!res.text.includes('anon@example.com'));
    assert.deepEqual(messages.map((m: { actor: string }) => m.actor), ['team', 'visitor', 'team']);
    const quoting = messages.find((m: { text: string }) => m.text === 'Quoting note');
    assert.equal(quoting.replyToId, null, 'replies to internal notes do not reveal the note id');
    const teamReply = messages.find((m: { text: string }) => m.text === 'Team reply');
    assert.equal(typeof teamReply.replyToId, 'number');
    assert.deepEqual(Object.keys(messages[0]).sort(), ['actor', 'createdAt', 'deleted', 'edited', 'id', 'replyToId', 'text']);
    assert.ok(messages.every((m: { createdAt: string }) => m.createdAt.endsWith('Z')));
  } finally {
    await app.close();
  }
});

test('conversation: deleted and edited messages are handled safely', async () => {
  const app = await startApp();
  try {
    const { messages } = (await app.call({ body: { action: 'conversation', sessionId: 'inf-4' } })).json.data;
    const deleted = messages.find((m: { deleted: boolean }) => m.deleted);
    assert.equal(deleted.text, 'Message deleted');
    assert.equal(deleted.edited, false);
    const edited = messages.find((m: { text: string }) => m.text === 'Edited reply');
    assert.equal(edited.edited, true);
    assert.equal(edited.deleted, false);
    assert.ok(!JSON.stringify(messages).includes('DELETED ORIGINAL TEXT'));
  } finally {
    await app.close();
  }
});

test('conversation: transcript is bounded to the latest 100 messages with hasMore', async () => {
  const db = createDb();
  db.sessions.push(session('inf-long', 'pw-infotech'));
  for (let i = 0; i < 130; i += 1) db.messages.push(message('inf-long', i % 2 ? 'bot' : 'user', 300 + i, { text: `long ${i}` }));
  const app = await startApp({ db });
  try {
    const { data } = (await app.call({ body: { action: 'conversation', sessionId: 'inf-long' } })).json;
    assert.equal(data.messages.length, 100);
    assert.equal(data.hasMore, true);
    assert.equal(data.messages[0].text, 'long 30');
    assert.equal(data.messages.at(-1).text, 'long 129');
  } finally {
    await app.close();
  }
});

test('tenant isolation: pw-uk, rrb, legacy and unknown sessions all return the same 404', async () => {
  const app = await startApp();
  try {
    assert.equal((await app.call({ body: { action: 'conversation', sessionId: 'inf-1' } })).status, 200);
    const bodies: string[] = [];
    for (const sessionId of ['uk-1', 'rrb-1', 'legacy-1', 'does-not-exist']) {
      const res = await app.call({ body: { action: 'conversation', sessionId } });
      assert.equal(res.status, 404, sessionId);
      assert.equal(res.json.error.code, 'conversation_not_found');
      assert.ok(!res.text.includes('ONLY TEXT'));
      const { requestId: _requestId, ...rest } = res.json;
      bodies.push(JSON.stringify(rest));
    }
    assert.equal(new Set(bodies).size, 1, 'other-tenant sessions are indistinguishable from missing ones');
  } finally {
    await app.close();
  }
});

// --- Diagnostics ---

test('diagnostics: reports tenant binding and health without secrets or configuration', async () => {
  const env = { ...ENV, DATABASE_URL: 'mysql://user:pw@db.internal.example:3306/prod', JWT_SECRET: 'jwt-secret-value' } as NodeJS.ProcessEnv;
  const app = await startApp({ env });
  try {
    const res = await app.call({ body: { action: 'diagnostics' } });
    assert.equal(res.status, 200);
    const { data } = res.json;
    assert.equal(data.status, 'healthy');
    assert.deepEqual(data.api, { status: 'ok', version: '1' });
    assert.equal(data.authentication.valid, true);
    assert.deepEqual(data.tenantBinding, { tenantId: 'pw-infotech', valid: true, active: true });
    assert.deepEqual(data.chat, { enabled: true, canAcceptMessages: true });
    assert.deepEqual(data.database, { status: 'reachable' });
    for (const secret of [TOKEN, 'DATABASE_URL', 'db.internal.example', 'jwt-secret-value', 'WORDPRESS_CHAT_INTEGRATION_TOKEN', 'G:\\', '/var/']) {
      assert.ok(!res.text.includes(secret), `diagnostics leaked ${secret}`);
    }
  } finally {
    await app.close();
  }
});

test('diagnostics: database failure is reported as unavailable, distinct from an invalid credential', async () => {
  const db = createDb();
  db.down = true;
  const app = await startApp({ db });
  try {
    const res = await app.call({ body: { action: 'diagnostics' } });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.status, 'unavailable');
    assert.deepEqual(res.json.data.database, { status: 'unreachable' });
    assert.equal(res.json.data.authentication.valid, true);
    assert.ok(!res.text.includes('db.internal.example'));
    const unauthorised = await app.call({ token: 'wpint_WRONG_7f3c9a1e5b2d8f604c1a9e7b3d5f2a8c', body: { action: 'diagnostics' } });
    assert.equal(unauthorised.status, 401);
  } finally {
    await app.close();
  }
});

// --- Presence ---

test('presence: team availability is explicitly platform-wide, never tenant-specific', async () => {
  const app = await startApp();
  try {
    const { data } = (await app.call({ body: { action: 'dashboard' } })).json;
    assert.deepEqual(data.team, {
      presenceScope: 'platform',
      status: 'available',
      mode: 'auto',
      teamMemberRecentlyActive: true,
      canAcceptMessages: true,
    });
    assert.ok(!JSON.stringify(data.team).includes('pw-infotech'));
    app.db.presence = { mode: 'auto', latestAdminSeenAt: new Date(NOW - 10 * 60 * 1000) };
    const idle = (await app.call({ body: { action: 'dashboard' } })).json.data;
    assert.equal(idle.team.status, 'not_online');
    assert.equal(idle.service.status, 'healthy', 'no team online still accepts messages');
    app.db.presence = { mode: 'offline', latestAdminSeenAt: new Date(NOW) };
    const offline = (await app.call({ body: { action: 'dashboard' } })).json.data;
    assert.equal(offline.team.status, 'offline');
    assert.equal(offline.service.canAcceptMessages, false);
    assert.equal(offline.service.status, 'degraded');
  } finally {
    await app.close();
  }
});

test('presence helper preserves the existing availability semantics', () => {
  const recent = new Date(NOW - 60 * 1000);
  const stale = new Date(NOW - 6 * 60 * 1000);
  assert.deepEqual(resolveChatPresence({ mode: null, latestAdminSeenAt: recent, now: NOW }), {
    mode: 'auto', hasActiveAdmin: true, computedStatus: 'online', status: 'online', canAcceptMessages: true,
  });
  assert.equal(resolveChatPresence({ mode: 'auto', latestAdminSeenAt: stale, now: NOW }).status, 'assistant');
  assert.equal(resolveChatPresence({ mode: 'online', latestAdminSeenAt: null, now: NOW }).status, 'online');
  assert.equal(resolveChatPresence({ mode: 'away', latestAdminSeenAt: recent, now: NOW }).status, 'away');
  assert.equal(resolveChatPresence({ mode: 'offline', latestAdminSeenAt: recent, now: NOW }).canAcceptMessages, false);
  const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  assert.match(server, /resolveChatPresence\(\{\s*mode: setting\?\.mode,\s*latestAdminSeenAt,\s*\}\)/);
});

// --- Actor terminology and semantics ---

test('actors: user -> visitor, bot -> assistant, admin -> team, nothing maps to ai', () => {
  assert.equal(toChatActor('user'), 'visitor');
  assert.equal(toChatActor('bot'), 'assistant');
  assert.equal(toChatActor('admin'), 'team');
  assert.equal(toChatActor('ai'), null);
  assert.equal(toChatActor('system'), null);
  assert.equal(toChatActor(undefined), null);
});

test('needs-attention and status helpers', () => {
  assert.equal(conversationNeedsAttention({ status: 'bot_replied', unansweredVisitorMessageCount: 1 }), true);
  assert.equal(conversationNeedsAttention({ status: 'bot_replied', unansweredVisitorMessageCount: 0 }), false);
  assert.equal(conversationNeedsAttention({ status: 'admin_replied', unansweredVisitorMessageCount: 0 }), false);
  assert.equal(conversationNeedsAttention({ status: 'closed', unansweredVisitorMessageCount: 3 }), false);
  assert.equal(conversationNeedsAttention({ status: 'spam', unansweredVisitorMessageCount: 3 }), false);
  assert.equal(conversationNeedsAttention({ status: 'follow_up_due', unansweredVisitorMessageCount: 1 }), true);
  assert.equal(toOperationalConversationStatus({ status: 'spam', needsAttention: false, lastActor: 'visitor' }), 'closed');
  assert.equal(toOperationalConversationStatus({ status: 'bot_replied', needsAttention: true, lastActor: 'assistant' }), 'waiting_for_team');
  assert.equal(toOperationalConversationStatus({ status: 'admin_replied', needsAttention: false, lastActor: 'team' }), 'team_replied');
  assert.equal(toOperationalConversationStatus({ status: 'bot_replied', needsAttention: false, lastActor: 'assistant' }), 'assistant_replied');
  assert.equal(toOperationalConversationStatus({ status: 'new', needsAttention: false, lastActor: null }), 'open');
  assert.equal(toPlainTextPreview({ text: 'a'.repeat(500) }).length, 200);
  assert.equal(toPlainTextPreview({ text: 'secret', deletedAt: new Date() }), 'Message deleted');
  assert.equal(toVisitorLabel({ name: '  Ana  ', sessionId: 's' }), 'Ana');
  assert.equal(toOriginatingPagePath('https://primewayz.com/a/b?x=1#y'), '/a/b');
  assert.equal(toOriginatingPagePath(null), null);
});

// --- Rate limiting ---

test('rate limit: normal wp-admin refresh works, abuse returns 429 with Retry-After', async () => {
  const clock = { now: NOW };
  const app = await startApp({ clock });
  try {
    for (let i = 0; i < 12; i += 1) {
      assert.equal((await app.call({ body: { action: 'dashboard' } })).status, 200, `refresh ${i}`);
      clock.now += 5 * 1000;
    }
    clock.now += 60 * 1000;
    for (let i = 0; i < WORDPRESS_CHAT_RATE_LIMITS.dashboard.limit; i += 1) {
      assert.equal((await app.call({ body: { action: 'dashboard' } })).status, 200);
    }
    const limited = await app.call({ body: { action: 'dashboard' } });
    assert.equal(limited.status, 429);
    assert.equal(limited.json.error.code, 'rate_limited');
    assert.ok(Number(limited.headers['retry-after']) >= 1);
    assert.equal((await app.call({ body: { action: 'diagnostics' } })).status, 200, 'per-action buckets');
    clock.now += 61 * 1000;
    assert.equal((await app.call({ body: { action: 'dashboard' } })).status, 200, 'window resets');
  } finally {
    await app.close();
  }
});

test('rate limit: repeated invalid credentials are throttled without locking out the valid credential', async () => {
  const app = await startApp();
  try {
    for (let i = 0; i < WORDPRESS_CHAT_RATE_LIMITS.invalidCredential.limit; i += 1) {
      assert.equal((await app.call({ token: null, body: { action: 'diagnostics' } })).status, 401);
    }
    const limited = await app.call({ token: null, body: { action: 'diagnostics' } });
    assert.equal(limited.status, 429);
    assert.ok(limited.headers['retry-after']);
    assert.equal((await app.call({ body: { action: 'diagnostics' } })).status, 200);
  } finally {
    await app.close();
  }
});

// --- Cache, CORS, logging ---

test('cache and CORS: every response is no-store and no CORS headers are emitted', async () => {
  const app = await startApp();
  try {
    for (const opts of [
      { body: { action: 'dashboard' } },
      { token: null, body: { action: 'dashboard' } },
      { body: { action: 'conversation', sessionId: 'uk-1' } },
      { body: { action: 'nope' } },
    ] satisfies CallOptions[]) {
      const res = await app.call({ ...opts, headers: { Origin: 'https://primewayz.com' } });
      assert.equal(res.headers['cache-control'], 'no-store');
      assert.equal(res.headers.pragma, 'no-cache');
      assert.equal(res.headers['access-control-allow-origin'], undefined);
      assert.equal(res.headers['access-control-allow-credentials'], undefined);
    }
  } finally {
    await app.close();
  }
});

test('audit log: minimal fields, never the token, message bodies or visitor contact details', async () => {
  const app = await startApp();
  try {
    await app.call({ body: { action: 'dashboard' } });
    await app.call({ body: { action: 'conversation', sessionId: 'inf-2' } });
    await app.call({ token: 'wpint_WRONG_7f3c9a1e5b2d8f604c1a9e7b3d5f2a8c', body: { action: 'diagnostics' } });
    assert.equal(app.logs.length, 3);
    assert.deepEqual(Object.keys(app.logs[0]).sort(), ['action', 'code', 'durationMs', 'integrationId', 'requestId', 'status', 'tenantId']);
    assert.equal(app.logs[0].integrationId, 'primewayz-wordpress');
    assert.equal(app.logs[0].tenantId, 'pw-infotech');
    assert.equal(app.logs[1].action, 'conversation');
    assert.match(app.logs[1].sessionRef ?? '', /^[0-9A-F]{6}$/);
    assert.equal(app.logs[2].status, 401);
    assert.equal(app.logs[2].integrationId, null);
    const serialized = JSON.stringify(app.logs) + app.errors.join('\n');
    for (const forbidden of [TOKEN, 'wpint_WRONG', 'inf-2', 'Team reply', '@example.com']) {
      assert.ok(!serialized.includes(forbidden), `log leaked ${forbidden}`);
    }
  } finally {
    await app.close();
  }
});

// --- Wiring and browser secret leakage ---

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('server mounts one POST endpoint, outside admin cookie auth, before the /api fallback', () => {
  const server = read('server.ts');
  const route = server.indexOf('app.post(WORDPRESS_CHAT_INTEGRATION_PATH, createWordPressChatIntegrationHandler({');
  assert.ok(route > 0);
  assert.ok(route < server.indexOf("app.use('/api', (req, res) =>"));
  const bodyParser = server.search(/app\.use\(\s*express\.json\(/);
  assert.ok(bodyParser > 0 && route > bodyParser, 'body parser runs first');
  const block = server.slice(route, server.indexOf('}));', route));
  assert.doesNotMatch(block, /requireAdmin|requireRole|adminCookieName/);
  assert.match(server, /app\.all\(WORDPRESS_CHAT_INTEGRATION_PATH, wordpressChatMethodNotAllowed\)/);
  assert.match(server, /app\.use\(WORDPRESS_CHAT_INTEGRATION_PATH, wordpressChatBodyErrorHandler\)/);
  assert.equal((server.match(/\/api\/integrations\//g) ?? []).length, 0, 'path comes from the shared constant only');
  assert.equal(WORDPRESS_CHAT_INTEGRATION_PATH, '/api/integrations/wordpress/chat');
});

test('the integration path is outside public CORS and the admin Origin guard', () => {
  assert.equal(isPublicChatCorsPath(WORDPRESS_CHAT_INTEGRATION_PATH), false);
  assert.equal(isPublicPlatformCorsPath(WORDPRESS_CHAT_INTEGRATION_PATH), false);
  assert.equal(isAdminStateChangingRequest('POST', WORDPRESS_CHAT_INTEGRATION_PATH), false);
});

test('integration credential never reaches browser-facing code, public capabilities or docs', () => {
  const capabilities = JSON.stringify(
    buildPublicPlatformCapabilities(resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'other' }), ENV),
  );
  assert.ok(!capabilities.includes(TOKEN));
  assert.ok(!capabilities.includes('WORDPRESS_CHAT_INTEGRATION'));

  const browserRoots = ['src/components', 'src/embed', 'src/App.tsx', 'src/main.tsx', 'src/entry-client.tsx', 'public'];
  const files: string[] = [];
  const walk = (target: string) => {
    const absolute = path.join(process.cwd(), target);
    if (!fs.existsSync(absolute)) return;
    const stat = fs.statSync(absolute);
    if (stat.isFile()) { files.push(absolute); return; }
    for (const entry of fs.readdirSync(absolute)) walk(path.join(target, entry));
  };
  browserRoots.forEach(walk);
  const textFiles = files.filter((file) => /\.(tsx?|jsx?|mjs|json|md|txt|html)$/.test(file));
  assert.ok(textFiles.length > 0);
  for (const file of textFiles) {
    const content = fs.readFileSync(file, 'utf8');
    assert.ok(!content.includes('WORDPRESS_CHAT_INTEGRATION_TOKEN'), `${file} references the integration secret`);
    assert.ok(!content.includes('/api/integrations/wordpress'), `${file} advertises the server-to-server endpoint`);
  }

  for (const config of ['vite.config.ts', 'vite.embed.config.ts']) {
    if (fs.existsSync(path.join(process.cwd(), config))) assert.ok(!read(config).includes('WORDPRESS_CHAT_INTEGRATION'));
  }
  assert.match(read('.env.example'), /^WORDPRESS_CHAT_INTEGRATION_TOKEN=$/m);
  assert.match(read('.env.example'), /^WORDPRESS_CHAT_INTEGRATION_TOKEN_PREVIOUS=$/m);

  const distClient = path.join(process.cwd(), 'dist', 'client');
  if (fs.existsSync(distClient)) {
    const stack = [distClient];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) stack.push(full);
        else if (/\.(js|html|json)$/.test(entry.name)) {
          assert.ok(!fs.readFileSync(full, 'utf8').includes('WORDPRESS_CHAT_INTEGRATION'), `${full} contains the integration secret name`);
        }
      }
    }
  }
});
