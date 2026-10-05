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
import { CHAT_PRESENCE_SCOPE, resolveChatPresence } from '../chat/chatPresence.ts';
import {
  deriveVisitorClientContext,
  normalizeVisitorBrowser,
  normalizeVisitorDeviceType,
  normalizeVisitorId,
  normalizeVisitorPhone,
  resolveVisitorPresence,
  VISITOR_IDLE_WINDOW_MS,
  VISITOR_ONLINE_WINDOW_MS,
} from '../chat/visitorIntelligence.ts';
import type { ChatOperatorActionRecord } from '../chat/chatConversationService.ts';
import { createMemoryChatConversationStore, type MemoryChatStoreHooks } from '../chat/testing/memoryChatConversationStore.ts';
import { computeDelegatedRequestHash, OPERATOR_ACTION_SOURCE } from './wordpressChatDelegatedActions.ts';
import { isPublicChatCorsPath } from '../chat/publicChatApiCors.ts';
import { isPublicPlatformCorsPath } from '../platform/publicPlatformApiCors.ts';
import { isAdminStateChangingRequest } from '../admin/adminRequestOrigin.ts';
import { buildPublicPlatformCapabilities } from '../platform/publicCapabilities.ts';
import { resolveSourceContext } from '../platform/sourceResolver.ts';

const ACTOR = { externalUserId: 'wp-user-12', displayName: 'Asha Patel' };
let actionCounter = 0;
const nextActionId = () => `0b8f6c1e-2d3a-4e5f-8a9b-${String(++actionCounter).padStart(12, '0')}`;

const TOKEN = 'wpint_TEST_7f3c9a1e5b2d8f604c1a9e7b3d5f2a8c';
const PREVIOUS_TOKEN = 'wpint_PREV_0a1b2c3d4e5f60718293a4b5c6d7e8f9';
const ENV = { WORDPRESS_CHAT_INTEGRATION_TOKEN: TOKEN } as NodeJS.ProcessEnv;
const NOW = Date.parse('2026-10-04T09:00:00.000Z');

// --- In-memory model of the shared chat tables ---

type SessionRow = OperationalSessionRow & {
  email: string | null;
  phone: string | null;
  market: string | null;
  sourceSite: string | null;
  sourceOrigin: string | null;
  sourceChannel: string | null;
  campaignId: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmCampaign: string | null;
  deviceType: string | null;
  browser: string | null;
  operatingSystem: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  visitorId: string | null;
  visitStartedAt: Date | null;
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
  operatorActions: ChatOperatorActionRecord[];
  /** Latest presence state per tenant; a missing tenant has no presence rows. */
  presence: Record<string, { mode: string | null; latestAdminSeenAt: Date | null }>;
  presenceReads: string[];
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
    campaignId: tenantId ? 'SECRET-CAMPAIGN-ID' : null,
    referrer: 'https://secret-referrer.example/landing?gclid=SECRET-GCLID',
    utmSource: 'secret-utm-source',
    utmCampaign: 'secret-utm-campaign',
    phone: null,
    deviceType: null,
    browser: 'Mozilla/5.0 SECRET-UA',
    operatingSystem: null,
    country: null,
    region: null,
    city: null,
    visitorId: null,
    visitStartedAt: null,
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
  return {
    sessions,
    messages,
    operatorActions: [],
    presence: { 'pw-infotech': { mode: 'auto', latestAdminSeenAt: new Date(NOW - 60 * 1000) } },
    presenceReads: [],
    down: false,
  };
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
    visitorLastSeenAt: s.visitorLastSeenAt,
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
    async readTeamPresence(tenantId) {
      guard('readTeamPresence');
      db.presenceReads.push(tenantId);
      return db.presence[tenantId] ? { ...db.presence[tenantId] } : { mode: null, latestAdminSeenAt: null };
    },
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
    async findVisitorProfile({ tenantId, sessionId }) {
      guard('findVisitorProfile');
      const s = db.sessions.find((row) => row.id === sessionId && row.tenantId === tenantId);
      if (!s) return null;
      return {
        id: s.id,
        tenantId: s.tenantId,
        name: s.name,
        email: s.email,
        phone: s.phone,
        visitorId: s.visitorId,
        visitorLastSeenAt: s.visitorLastSeenAt,
        visitStartedAt: s.visitStartedAt,
        firstLandingPage: s.firstLandingPage,
        currentPageUrl: s.currentPageUrl,
        deviceType: s.deviceType,
        browser: s.browser,
        operatingSystem: s.operatingSystem,
        country: s.country,
        region: s.region,
        city: s.city,
        createdAt: s.createdAt,
      };
    },
    async hasEarlierVisitorSession({ tenantId, visitorId, sessionId, createdBefore }) {
      guard('hasEarlierVisitorSession');
      return db.sessions.some((s) =>
        s.tenantId === tenantId
        && s.visitorId === visitorId
        && s.id !== sessionId
        && s.createdAt.getTime() < createdBefore.getTime());
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
  writeHooks?: MemoryChatStoreHooks['before'];
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
    writes: createMemoryChatConversationStore(db, {
      now: () => new Date(clock.now),
      before: async (method, args, external) => {
        if (db.down) throw dbDownError();
        await options.writeHooks?.(method, args, external);
      },
    }),
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

const snapshot = (db: Db) =>
  JSON.stringify({ sessions: db.sessions, messages: db.messages, operatorActions: db.operatorActions, presence: db.presence });

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

test('registry: the WordPress integration is bound to pw-infotech with read scopes plus reply / resolve / reopen only', () => {
  assert.equal(INTEGRATION_REGISTRY.length, 1);
  const [definition] = INTEGRATION_REGISTRY;
  assert.equal(definition.tenantId, 'pw-infotech');
  assert.deepEqual([...definition.scopes].sort(), [
    'chat:dashboard', 'chat:diagnostics', 'chat:read', 'chat:reopen', 'chat:reply', 'chat:resolve',
  ]);
  assert.ok(definition.scopes.every((scope) => !/assign|delete|manage|edit|note|spam|presence|availability|attach|appointment|tenant|user/.test(scope)));
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
    const before = snapshot(app.db);
    for (const field of TENANT_AUTHORITY_FIELDS) {
      for (const action of ['dashboard', 'diagnostics', 'conversation', 'reply', 'resolve', 'reopen']) {
        const body: Record<string, unknown> = { action, [field]: 'pw-uk' };
        if (action !== 'dashboard' && action !== 'diagnostics') body.sessionId = 'uk-1';
        if (['reply', 'resolve', 'reopen'].includes(action)) Object.assign(body, { clientActionId: nextActionId(), actor: ACTOR });
        if (action === 'reply') body.text = 'hello';
        const res = await app.call({ body });
        assert.equal(res.status, 400, `${action} ${field}`);
        assert.equal(res.json.error.code, 'tenant_override_rejected');
      }
    }
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

test('request: unknown actions, unsupported write actions, extra fields and bad session ids are rejected', async () => {
  const app = await startApp();
  try {
    for (const body of [
      {},
      { action: 'reply', sessionId: 'inf-1', text: 'x' },
      { action: 'assign' },
      { action: 'delete' },
      { action: 'status-change' },
      { action: 'availability', mode: 'online' },
      { action: 'note', sessionId: 'inf-1', text: 'x' },
      { action: 'spam', sessionId: 'inf-1' },
      { action: 'edit', id: 1, text: 'x' },
      { action: 'list' },
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
      'intent', 'lastActivityAt', 'lastActor', 'lastMessagePreview', 'lastSeenAt', 'messageCount', 'needsAttention',
      'originatingPage', 'sessionId', 'status', 'visitorLabel', 'visitorPresence',
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
    assert.equal(res.json.data.visitor.email, 'anon@example.com', 'explicitly supplied email is exposed only via visitor');
    assert.ok(!JSON.stringify({ conversation, messages }).includes('anon@example.com'));
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

test('presence: team availability is tenant-scoped and read for the credential-bound pw-infotech tenant', async () => {
  const app = await startApp();
  try {
    const { data } = (await app.call({ body: { action: 'dashboard' } })).json;
    assert.deepEqual(data.team, {
      presenceScope: 'tenant',
      status: 'available',
      mode: 'auto',
      teamMemberRecentlyActive: true,
      canAcceptMessages: true,
    });
    assert.deepEqual(app.db.presenceReads, ['pw-infotech']);
    app.db.presence['pw-infotech'] = { mode: 'auto', latestAdminSeenAt: new Date(NOW - 10 * 60 * 1000) };
    const idle = (await app.call({ body: { action: 'dashboard' } })).json.data;
    assert.equal(idle.team.status, 'not_online');
    assert.equal(idle.service.status, 'healthy', 'no team online still accepts messages');
    app.db.presence['pw-infotech'] = { mode: 'offline', latestAdminSeenAt: new Date(NOW) };
    const offline = (await app.call({ body: { action: 'dashboard' } })).json.data;
    assert.equal(offline.team.status, 'offline');
    assert.equal(offline.service.canAcceptMessages, false);
    assert.equal(offline.service.status, 'degraded');
  } finally {
    await app.close();
  }
});

test('presence: a recent pw-uk heartbeat never makes the WordPress (pw-infotech) team available', async () => {
  const app = await startApp();
  try {
    app.db.presence = {
      'pw-uk': { mode: 'online', latestAdminSeenAt: new Date(NOW - 30 * 1000) },
      rrb: { mode: 'online', latestAdminSeenAt: new Date(NOW - 30 * 1000) },
    };
    const before = (await app.call({ body: { action: 'dashboard' } })).json.data;
    assert.equal(before.team.presenceScope, 'tenant');
    assert.equal(before.team.status, 'not_online', 'pw-infotech has no rows: defaults apply, no fallback to pw-uk');
    assert.equal(before.team.mode, 'auto');
    assert.equal(before.team.teamMemberRecentlyActive, false);
    const diagnosticsBefore = (await app.call({ body: { action: 'diagnostics' } })).json.data;
    assert.equal(diagnosticsBefore.team.presenceScope, 'tenant');
    assert.equal(diagnosticsBefore.team.teamMemberRecentlyActive, false);

    app.db.presence['pw-infotech'] = { mode: 'auto', latestAdminSeenAt: new Date(NOW - 30 * 1000) };
    const after = (await app.call({ body: { action: 'dashboard' } })).json.data;
    assert.equal(after.team.status, 'available');
    assert.equal(after.team.teamMemberRecentlyActive, true);
    const diagnosticsAfter = (await app.call({ body: { action: 'diagnostics' } })).json.data;
    assert.equal(diagnosticsAfter.team.status, 'available');

    assert.ok(app.db.presenceReads.length > 0);
    assert.ok(app.db.presenceReads.every((tenantId) => tenantId === 'pw-infotech'), 'only pw-infotech presence is read');
  } finally {
    await app.close();
  }
});

test('presence: a tenantId in the WordPress body cannot redirect presence to another tenant', async () => {
  const app = await startApp();
  try {
    app.db.presence = { 'pw-uk': { mode: 'online', latestAdminSeenAt: new Date(NOW) } };
    const res = await app.call({ body: { action: 'dashboard', tenantId: 'pw-uk' } });
    assert.equal(res.status, 400);
    assert.ok(!app.db.presenceReads.includes('pw-uk'));
  } finally {
    await app.close();
  }
});

test('presence helper preserves the existing availability semantics', () => {
  assert.equal(CHAT_PRESENCE_SCOPE, 'tenant');
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

// =====================================================================================
// Delegated writes: reply / resolve / reopen
// =====================================================================================

type WriteBody = Record<string, unknown>;
const replyBody = (sessionId: string, text: string, extra: WriteBody = {}): WriteBody =>
  ({ action: 'reply', sessionId, clientActionId: nextActionId(), actor: ACTOR, text, ...extra });
const statusBody = (action: 'resolve' | 'reopen', sessionId: string, extra: WriteBody = {}): WriteBody =>
  ({ action, sessionId, clientActionId: nextActionId(), actor: ACTOR, ...extra });
const sessionOf = (db: Db, id: string) => db.sessions.find((s) => s.id === id)!;
const prismaWriteError = () => Object.assign(new Error('Transaction failed'), { name: 'PrismaClientUnknownRequestError' });

// --- Idempotency ---

test('idempotency: first write succeeds, exact retry replays the original result without new writes', async () => {
  const app = await startApp();
  try {
    const body = replyBody('inf-1', 'We can help with that.');
    const first = await app.call({ body });
    assert.equal(first.status, 200);
    assert.equal(first.json.data.replayed, false);
    assert.equal(first.json.data.changed, true);
    const messagesAfterFirst = app.db.messages.length;

    const retry = await app.call({ body: { ...body, actor: { ...ACTOR, displayName: 'Asha P.' } } });
    assert.equal(retry.status, 200);
    assert.equal(retry.json.data.replayed, true);
    assert.equal(retry.json.data.changed, true);
    assert.deepEqual(retry.json.data.message, first.json.data.message, 'same message, displayName is cosmetic');
    assert.equal(app.db.messages.length, messagesAfterFirst, 'no second message');
    assert.equal(app.db.operatorActions.length, 1);
    assert.equal(app.logs.at(-1)?.replayed, true);

    const resolve = statusBody('resolve', 'inf-5');
    assert.equal((await app.call({ body: resolve })).json.data.changed, true);
    const resolveRetry = await app.call({ body: resolve });
    assert.equal(resolveRetry.json.data.replayed, true);
    assert.equal(resolveRetry.json.data.changed, true, 'replay returns the original outcome, not a fresh no-op');
    assert.equal(app.db.operatorActions.length, 2);
  } finally {
    await app.close();
  }
});

test('idempotency: the same clientActionId with a different logical payload returns 409 idempotency_key_conflict', async () => {
  const app = await startApp();
  try {
    const body = replyBody('inf-1', 'Original text');
    assert.equal((await app.call({ body })).status, 200);
    const before = snapshot(app.db);
    for (const changed of [
      { ...body, text: 'Different text' },
      { ...body, sessionId: 'inf-5' },
      { ...body, actor: { externalUserId: 'wp-user-99' } },
      { action: 'resolve', sessionId: 'inf-1', clientActionId: body.clientActionId, actor: ACTOR },
    ]) {
      const res = await app.call({ body: changed });
      assert.equal(res.status, 409, JSON.stringify(changed));
      assert.equal(res.json.error.code, 'idempotency_key_conflict');
    }
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

test('idempotency: X-Request-ID is correlation only, never the idempotency key', async () => {
  const app = await startApp();
  try {
    const headers = { 'X-Request-ID': 'wp-req-same-0001' };
    assert.equal((await app.call({ body: replyBody('inf-1', 'one'), headers })).json.data.replayed, false);
    assert.equal((await app.call({ body: replyBody('inf-1', 'one'), headers })).json.data.replayed, false);
    assert.equal(app.db.operatorActions.length, 2);
    assert.ok(app.db.operatorActions.every((a) => a.requestId === 'wp-req-same-0001'));
  } finally {
    await app.close();
  }
});

test('idempotency: a failure inside the transaction leaves no action, message, answer flag or status change', async () => {
  let fail = true;
  const app = await startApp({
    writeHooks: (method) => {
      if (fail && method === 'updateOperatorAction') throw prismaWriteError();
    },
  });
  try {
    const before = snapshot(app.db);
    const body = replyBody('inf-1', 'Will roll back');
    const res = await app.call({ body });
    assert.equal(res.status, 503);
    assert.equal(res.json.error.code, 'chat_service_unavailable');
    assert.equal(snapshot(app.db), before, 'no partial state');

    fail = false;
    const retry = await app.call({ body });
    assert.equal(retry.status, 200);
    assert.equal(retry.json.data.replayed, false, 'the failed attempt never claimed the key');
    assert.equal(app.db.operatorActions.length, 1);
  } finally {
    await app.close();
  }
});

test('idempotency: a key claimed concurrently by another request is replayed or rejected, never duplicated', async () => {
  for (const sameHash of [true, false]) {
    let injected = false;
    const body = replyBody('inf-1', 'Concurrent');
    const app = await startApp({
      writeHooks: (method, _args, external) => {
        if (method !== 'createOperatorAction' || injected) return;
        injected = true;
        external((state) => {
          const messageId = Math.max(...state.messages.map((m) => m.id)) + 1;
          state.messages.push({
            id: messageId, sessionId: 'inf-1', sender: 'admin', text: 'Concurrent', answered: true, isInternalNote: false,
            deletedAt: null, editedAt: null, replyToId: null, timestamp: new Date(NOW),
          });
          state.operatorActions.push({
            id: 'other', integrationId: 'primewayz-wordpress', clientActionId: body.clientActionId as string,
            requestHash: sameHash ? computeDelegatedRequestHash(body as never) : 'f'.repeat(64),
            requestId: 'other-request', source: OPERATOR_ACTION_SOURCE, tenantId: 'pw-infotech', sessionId: 'inf-1', action: 'reply',
            actorExternalId: ACTOR.externalUserId, actorDisplayName: null, messageId, fromStatus: 'bot_replied', toStatus: 'admin_replied',
            changed: true, createdAt: new Date(NOW),
          });
        });
      },
    });
    try {
      const res = await app.call({ body });
      if (sameHash) {
        assert.equal(res.status, 200);
        assert.equal(res.json.data.replayed, true);
        assert.equal(res.json.data.message.text, 'Concurrent');
      } else {
        assert.equal(res.status, 409);
        assert.equal(res.json.error.code, 'idempotency_key_conflict');
      }
      assert.equal(app.db.operatorActions.length, 1);
      assert.equal(app.db.messages.filter((m) => m.text === 'Concurrent').length, 1);
    } finally {
      await app.close();
    }
  }
});

test('idempotency: simultaneous identical requests produce exactly one write', async () => {
  const app = await startApp();
  try {
    const body = replyBody('inf-1', 'Double click');
    const results = await Promise.all([app.call({ body }), app.call({ body }), app.call({ body })]);
    assert.ok(results.every((r) => r.status === 200));
    assert.equal(results.filter((r) => r.json.data.replayed === false).length, 1);
    assert.equal(app.db.messages.filter((m) => m.text === 'Double click').length, 1);
    assert.equal(app.db.operatorActions.length, 1);
  } finally {
    await app.close();
  }
});

// --- Reply ---

test('reply: pw-infotech reply stores a team message, answers visitors and sets admin_replied', async () => {
  const app = await startApp();
  try {
    assert.equal(sessionOf(app.db, 'inf-1').status, 'bot_replied');
    const res = await app.call({ body: replyBody('inf-1', '  We can help with that.  '), headers: { 'X-Request-ID': 'wp-reply-0001' } });
    assert.equal(res.status, 200);
    assert.equal(res.json.ok, true);
    assert.equal(res.json.apiVersion, '1');
    assert.deepEqual(res.json.tenant, { key: 'pw-infotech', market: 'IN', displayName: 'Primewayz Infotech' });
    const { data } = res.json;
    assert.deepEqual(Object.keys(data).sort(), ['action', 'changed', 'clientActionId', 'conversation', 'message', 'replayed']);
    assert.equal(data.action, 'reply');
    assert.deepEqual(Object.keys(data.message).sort(), ['actor', 'createdAt', 'deleted', 'edited', 'id', 'replyToId', 'text']);
    assert.equal(data.message.actor, 'team');
    assert.equal(data.message.text, 'We can help with that.');
    assert.equal(data.message.replyToId, null);
    assert.equal(data.conversation.sessionId, 'inf-1');
    assert.equal(data.conversation.status, 'team_replied');
    assert.equal(data.conversation.needsAttention, false);
    assert.equal(data.conversation.lastActor, 'team');
    assert.equal('messageCount' in data.conversation, false);

    const stored = app.db.messages.find((m) => m.id === data.message.id)!;
    assert.equal(stored.sender, 'admin');
    assert.equal(stored.isInternalNote, false);
    assert.equal(stored.answered, true);
    assert.ok(app.db.messages.filter((m) => m.sessionId === 'inf-1' && m.sender === 'user').every((m) => m.answered));
    assert.equal(sessionOf(app.db, 'inf-1').status, 'admin_replied');
    assert.equal(sessionOf(app.db, 'inf-1').tenantId, 'pw-infotech', 'attribution unchanged');

    const dashboard = (await app.call({ body: { action: 'dashboard' } })).json.data;
    const row = dashboard.recentConversations.find((r: { sessionId: string }) => r.sessionId === 'inf-1');
    assert.equal(row.needsAttention, false);
    assert.equal(row.status, 'team_replied');
  } finally {
    await app.close();
  }
});

test('reply: the operator action audit row attributes the WordPress actor without storing bodies or emails', async () => {
  const app = await startApp();
  try {
    const body = replyBody('inf-1', 'Audit body text');
    const res = await app.call({ body, headers: { 'X-Request-ID': 'wp-reply-audit-1' } });
    assert.equal(app.db.operatorActions.length, 1);
    const [action] = app.db.operatorActions;
    assert.equal(action.source, 'wordpress_integration');
    assert.equal(action.integrationId, 'primewayz-wordpress');
    assert.equal(action.tenantId, 'pw-infotech');
    assert.equal(action.sessionId, 'inf-1');
    assert.equal(action.action, 'reply');
    assert.equal(action.clientActionId, body.clientActionId);
    assert.equal(action.requestId, 'wp-reply-audit-1');
    assert.match(action.requestHash, /^[0-9a-f]{64}$/);
    assert.equal(action.actorExternalId, 'wp-user-12');
    assert.equal(action.actorDisplayName, 'Asha Patel');
    assert.equal(action.messageId, res.json.data.message.id);
    assert.deepEqual([action.fromStatus, action.toStatus, action.changed], ['bot_replied', 'admin_replied', true]);
    const serialized = JSON.stringify(action);
    assert.ok(!serialized.includes('Audit body text'));
    assert.ok(!serialized.includes(TOKEN));
    assert.ok(!serialized.includes('@'));

    const log = app.logs.at(-1)!;
    assert.equal(log.action, 'reply');
    assert.equal(log.replayed, false);
    assert.match(log.sessionRef ?? '', /^[0-9A-F]{6}$/);
    const logText = JSON.stringify(app.logs) + app.errors.join('\n');
    for (const forbidden of ['Audit body text', 'wp-user-12', 'Asha', String(body.clientActionId), 'inf-1', TOKEN]) {
      assert.ok(!logText.includes(forbidden), `log leaked ${forbidden}`);
    }
  } finally {
    await app.close();
  }
});

test('reply: closed and spam conversations return 409 conversation_closed without writing', async () => {
  const app = await startApp();
  try {
    sessionOf(app.db, 'inf-2').status = 'spam';
    const before = snapshot(app.db);
    for (const sessionId of ['inf-3', 'inf-2']) {
      const res = await app.call({ body: replyBody(sessionId, 'Hello?') });
      assert.equal(res.status, 409, sessionId);
      assert.equal(res.json.error.code, 'conversation_closed');
      assert.equal(res.json.data, undefined);
    }
    assert.equal(snapshot(app.db), before, 'no silent reopen, no message, no action');
  } finally {
    await app.close();
  }
});

test('reply: other-tenant, legacy and unknown sessions return the same 404 as for reads, without writing', async () => {
  const app = await startApp();
  try {
    const before = snapshot(app.db);
    const bodies: string[] = [];
    for (const [action, sessionId] of [
      ['reply', 'uk-1'], ['reply', 'rrb-1'], ['reply', 'legacy-1'], ['reply', 'does-not-exist'],
      ['resolve', 'uk-1'], ['resolve', 'legacy-1'], ['reopen', 'rrb-1'], ['reopen', 'does-not-exist'],
    ]) {
      const body = action === 'reply' ? replyBody(sessionId, 'x') : statusBody(action as 'resolve' | 'reopen', sessionId);
      const res = await app.call({ body });
      assert.equal(res.status, 404, `${action} ${sessionId}`);
      assert.equal(res.json.error.code, 'conversation_not_found');
      const { requestId: _requestId, ...rest } = res.json;
      bodies.push(JSON.stringify(rest));
    }
    const read = await app.call({ body: { action: 'conversation', sessionId: 'uk-1' } });
    const { requestId: _readRequestId, ...readRest } = read.json;
    bodies.push(JSON.stringify(readRest));
    assert.equal(new Set(bodies).size, 1, 'indistinguishable from missing conversations');
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

test('reply: text is required, trimmed and bounded', async () => {
  const app = await startApp();
  try {
    const before = snapshot(app.db);
    for (const text of ['', '    ', 'x'.repeat(4001), 42, null, ['a']]) {
      const res = await app.call({ body: replyBody('inf-1', text as string) });
      assert.equal(res.status, 400, JSON.stringify(text)?.slice(0, 20));
      assert.equal(res.json.error.code, 'invalid_request');
    }
    const missing = replyBody('inf-1', 'x');
    delete missing.text;
    assert.equal((await app.call({ body: missing })).status, 400);
    assert.equal(snapshot(app.db), before);
    assert.equal((await app.call({ body: replyBody('inf-1', 'x'.repeat(4000)) })).status, 200);
  } finally {
    await app.close();
  }
});

test('writes: actor metadata is validated and never accepts email or role', async () => {
  const app = await startApp();
  try {
    const before = snapshot(app.db);
    for (const actor of [
      undefined,
      null,
      'wp-user-12',
      ['wp-user-12'],
      {},
      { displayName: 'No id' },
      { externalUserId: '' },
      { externalUserId: 'asha@example.com' },
      { externalUserId: 'x'.repeat(65) },
      { externalUserId: 'has space' },
      { externalUserId: 12 },
      { externalUserId: 'wp-user-12', email: 'asha@example.com' },
      { externalUserId: 'wp-user-12', role: 'administrator' },
      { externalUserId: 'wp-user-12', displayName: 'asha@example.com' },
      { externalUserId: 'wp-user-12', displayName: 'x'.repeat(81) },
      { externalUserId: 'wp-user-12', displayName: '   ' },
      { externalUserId: 'wp-user-12', displayName: '<script>' },
      { externalUserId: 'wp-user-12', displayName: 7 },
    ]) {
      for (const body of [replyBody('inf-1', 'x', { actor }), statusBody('resolve', 'inf-1', { actor })]) {
        if (actor === undefined) delete body.actor;
        const res = await app.call({ body });
        assert.equal(res.status, 400, JSON.stringify(actor));
        assert.equal(res.json.error.code, 'invalid_request');
      }
    }
    assert.equal(snapshot(app.db), before);
    const minimal = await app.call({ body: replyBody('inf-1', 'ok', { actor: { externalUserId: '12' } }) });
    assert.equal(minimal.status, 200);
    assert.equal(app.db.operatorActions[0].actorDisplayName, null);
  } finally {
    await app.close();
  }
});

test('writes: clientActionId is required and must be a UUID or safe 36-64 character identifier', async () => {
  const app = await startApp();
  try {
    for (const clientActionId of [undefined, '', 'short-id', 'x'.repeat(65), `${'a'.repeat(35)} `, `-${'a'.repeat(40)}`, 123]) {
      const body = replyBody('inf-1', 'x', { clientActionId });
      if (clientActionId === undefined) delete body.clientActionId;
      const res = await app.call({ body });
      assert.equal(res.status, 400, String(clientActionId));
    }
    assert.equal((await app.call({ body: replyBody('inf-1', 'x', { clientActionId: 'wp_action.2026-10-04:abcdefghijklmnopqrstu' }) })).status, 200);
    assert.equal((await app.call({ body: statusBody('resolve', 'inf-5', { clientActionId: 'c'.repeat(64) }) })).status, 200);
  } finally {
    await app.close();
  }
});

test('reply: attachments, reply quoting, internal notes and sender are rejected (text-only phase)', async () => {
  const app = await startApp();
  try {
    const before = snapshot(app.db);
    for (const extra of [{ attachmentIds: [1] }, { replyToId: 1 }, { isInternalNote: true }, { sender: 'admin' }, { attachmentIds: [] }]) {
      const res = await app.call({ body: replyBody('inf-1', 'x', extra) });
      assert.equal(res.status, 400, JSON.stringify(extra));
      assert.match(res.json.error.message, /text-only/);
    }
    assert.equal((await app.call({ body: statusBody('resolve', 'inf-1', { text: 'closing' }) })).status, 400);
    assert.equal((await app.call({ body: statusBody('reopen', 'inf-3', { status: 'new' }) })).status, 400);
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

test('reply: simultaneous replies with different keys are both valid and append-only', async () => {
  const app = await startApp();
  try {
    const [a, b] = await Promise.all([
      app.call({ body: replyBody('inf-1', 'First operator') }),
      app.call({ body: replyBody('inf-1', 'Second operator') }),
    ]);
    assert.equal(a.status, 200);
    assert.equal(b.status, 200);
    assert.notEqual(a.json.data.message.id, b.json.data.message.id);
    const texts = app.db.messages.filter((m) => m.sessionId === 'inf-1' && m.sender === 'admin').map((m) => m.text).sort();
    assert.deepEqual(texts, ['First operator', 'Second operator']);
    assert.equal(sessionOf(app.db, 'inf-1').status, 'admin_replied');
  } finally {
    await app.close();
  }
});

// --- Resolve ---

test('resolve: a non-terminal conversation is closed; already closed returns 200 changed:false', async () => {
  const app = await startApp({ clock: { now: NOW } });
  try {
    const res = await app.call({ body: statusBody('resolve', 'inf-1') });
    assert.equal(res.status, 200);
    assert.deepEqual(Object.keys(res.json.data).sort(), ['action', 'changed', 'clientActionId', 'conversation', 'replayed']);
    assert.equal(res.json.data.changed, true);
    assert.equal(res.json.data.conversation.status, 'closed');
    assert.equal(res.json.data.conversation.needsAttention, false);
    const session = sessionOf(app.db, 'inf-1') as SessionRow & { closedAt?: Date | null; closedById?: number | null };
    assert.equal(session.status, 'closed');
    assert.equal(session.closedAt?.toISOString(), '2026-10-04T09:00:00.000Z');
    assert.equal(session.closedById, null, 'WordPress operators are not UK Admin users');
    assert.deepEqual(
      [app.db.operatorActions[0].fromStatus, app.db.operatorActions[0].toStatus, app.db.operatorActions[0].changed],
      ['bot_replied', 'closed', true],
    );

    const again = await app.call({ body: statusBody('resolve', 'inf-1') });
    assert.equal(again.status, 200);
    assert.equal(again.json.data.changed, false);
    assert.equal(again.json.data.replayed, false);
    const alreadyClosed = await app.call({ body: statusBody('resolve', 'inf-3') });
    assert.equal(alreadyClosed.json.data.changed, false);
  } finally {
    await app.close();
  }
});

test('resolve: spam is never converted to closed', async () => {
  const app = await startApp();
  try {
    sessionOf(app.db, 'inf-5').status = 'spam';
    const res = await app.call({ body: statusBody('resolve', 'inf-5') });
    assert.equal(res.status, 409);
    assert.equal(res.json.error.code, 'invalid_transition');
    assert.equal(sessionOf(app.db, 'inf-5').status, 'spam');
    assert.equal(app.db.operatorActions.length, 0);
  } finally {
    await app.close();
  }
});

// --- Reopen ---

test('reopen: closed -> admin_needed; repeat is 200 changed:false; open and spam conversations are 409 invalid_transition', async () => {
  const app = await startApp();
  try {
    const res = await app.call({ body: statusBody('reopen', 'inf-3') });
    assert.equal(res.status, 200);
    assert.equal(res.json.data.changed, true);
    assert.equal(sessionOf(app.db, 'inf-3').status, 'admin_needed');
    assert.equal(res.json.data.conversation.status, 'waiting_for_team', 'the unanswered visitor message is back in the queue');
    assert.equal(res.json.data.conversation.needsAttention, true);
    assert.deepEqual([app.db.operatorActions[0].fromStatus, app.db.operatorActions[0].toStatus], ['closed', 'admin_needed']);

    const repeat = await app.call({ body: statusBody('reopen', 'inf-3') });
    assert.equal(repeat.status, 200);
    assert.equal(repeat.json.data.changed, false);

    for (const [sessionId, status] of [['inf-2', 'admin_replied'], ['inf-1', 'bot_replied'], ['inf-5', 'spam']]) {
      sessionOf(app.db, sessionId).status = status;
      const blocked = await app.call({ body: statusBody('reopen', sessionId) });
      assert.equal(blocked.status, 409, sessionId);
      assert.equal(blocked.json.error.code, 'invalid_transition');
      assert.equal(sessionOf(app.db, sessionId).status, status);
    }
    assert.equal(app.db.operatorActions.length, 2, 'rejected transitions are not recorded');
  } finally {
    await app.close();
  }
});

test('reopen then reply: an explicitly reopened conversation accepts replies again', async () => {
  const app = await startApp();
  try {
    assert.equal((await app.call({ body: replyBody('inf-3', 'Too early') })).status, 409);
    assert.equal((await app.call({ body: statusBody('reopen', 'inf-3') })).status, 200);
    const reply = await app.call({ body: replyBody('inf-3', 'Back on it') });
    assert.equal(reply.status, 200);
    assert.equal(sessionOf(app.db, 'inf-3').status, 'admin_replied');
  } finally {
    await app.close();
  }
});

// --- Concurrency ---

test('concurrency: a close committed during a reply is never overwritten by admin_replied', async () => {
  const app = await startApp({
    writeHooks: (method, _args, external) => {
      if (method === 'updateSessionStatus') {
        external((state) => { state.sessions.find((s) => s.id === 'inf-1')!.status = 'closed'; });
      }
    },
  });
  try {
    const messages = app.db.messages.length;
    const res = await app.call({ body: replyBody('inf-1', 'Racing a close') });
    assert.equal(res.status, 409);
    assert.equal(res.json.error.code, 'conversation_closed');
    assert.equal(sessionOf(app.db, 'inf-1').status, 'closed');
    assert.equal(app.db.messages.length, messages);
    assert.equal(app.db.operatorActions.length, 0);
    assert.ok(app.db.messages.some((m) => m.sessionId === 'inf-1' && m.sender === 'user' && !m.answered), 'visitor message still unanswered');
  } finally {
    await app.close();
  }
});

// --- Permission boundary, rate limits, presence, regression ---

test('scopes: a read-only credential cannot reply, resolve or reopen', async () => {
  const registry: IntegrationDefinition[] = [{ ...INTEGRATION_REGISTRY[0], scopes: ['chat:dashboard', 'chat:read', 'chat:diagnostics'] }];
  const app = await startApp({ registry });
  try {
    const before = snapshot(app.db);
    for (const body of [replyBody('inf-1', 'x'), statusBody('resolve', 'inf-1'), statusBody('reopen', 'inf-3')]) {
      const res = await app.call({ body });
      assert.equal(res.status, 403, String(body.action));
      assert.equal(res.json.error.code, 'integration_forbidden');
    }
    assert.equal(snapshot(app.db), before);
    assert.equal((await app.call({ body: { action: 'dashboard' } })).status, 200);
  } finally {
    await app.close();
  }
});

test('rate limit: write actions have their own per-integration buckets', async () => {
  const clock = { now: NOW };
  const app = await startApp({ clock });
  try {
    for (let i = 0; i < WORDPRESS_CHAT_RATE_LIMITS.reply.limit; i += 1) {
      assert.equal((await app.call({ body: replyBody('inf-1', `r${i}`) })).status, 200);
    }
    const limited = await app.call({ body: replyBody('inf-1', 'too many') });
    assert.equal(limited.status, 429);
    assert.ok(Number(limited.headers['retry-after']) >= 1);
    assert.equal((await app.call({ body: statusBody('resolve', 'inf-5') })).status, 200, 'resolve has a separate bucket');
    assert.equal((await app.call({ body: { action: 'dashboard' } })).status, 200);
  } finally {
    await app.close();
  }
});

test('presence stays read-only: no write action touches presence, and dashboard team data is unchanged by writes', async () => {
  const app = await startApp();
  try {
    const presence = JSON.stringify(app.db.presence);
    const team = (await app.call({ body: { action: 'dashboard' } })).json.data.team;
    await app.call({ body: replyBody('inf-1', 'x') });
    await app.call({ body: statusBody('resolve', 'inf-5') });
    await app.call({ body: statusBody('reopen', 'inf-3') });
    assert.equal(JSON.stringify(app.db.presence), presence);
    assert.deepEqual((await app.call({ body: { action: 'dashboard' } })).json.data.team, team);
    assert.equal((await app.call({ body: { action: 'availability', mode: 'offline' } })).status, 400);
  } finally {
    await app.close();
  }
});

test('writes: database outage returns 503 database_unavailable without partial state', async () => {
  const app = await startApp();
  try {
    app.db.down = true;
    const before = snapshot(app.db);
    const res = await app.call({ body: replyBody('inf-1', 'x') });
    assert.equal(res.status, 503);
    assert.equal(res.json.error.code, 'database_unavailable');
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

test('regression: read action response contracts are unchanged after writes are added', async () => {
  const app = await startApp();
  try {
    const dashboard = (await app.call({ body: { action: 'dashboard' } })).json.data;
    assert.deepEqual(Object.keys(dashboard).sort(), ['attention', 'fullAdmin', 'limits', 'recentConversations', 'service', 'team']);
    const conversation = (await app.call({ body: { action: 'conversation', sessionId: 'inf-2' } })).json.data;
    assert.deepEqual(Object.keys(conversation).sort(), ['conversation', 'hasMore', 'messageLimit', 'messages', 'session', 'visitor']);
    const diagnostics = (await app.call({ body: { action: 'diagnostics' } })).json.data;
    assert.deepEqual(Object.keys(diagnostics).sort(), ['api', 'authentication', 'chat', 'database', 'fullAdmin', 'status', 'team', 'tenantBinding']);
    assert.deepEqual(diagnostics.api, { status: 'ok', version: '1' });
  } finally {
    await app.close();
  }
});

test('wiring: one endpoint, delegated writes use the shared conversation store and service', () => {
  const server = read('server.ts');
  const route = server.indexOf('app.post(WORDPRESS_CHAT_INTEGRATION_PATH, createWordPressChatIntegrationHandler({');
  const block = server.slice(route, server.indexOf('}));', route));
  assert.match(block, /writes: chatConversationStore,/);
  assert.equal((server.match(/WORDPRESS_CHAT_INTEGRATION_PATH, createWordPressChatIntegrationHandler/g) ?? []).length, 1);
  const adapter = read('src/lib/integrations/wordpressChatDelegatedActions.ts');
  assert.match(adapter, /createTeamReply\(tx, \{[\s\S]*?isInternalNote: false,[\s\S]*?replyToId: null,[\s\S]*?terminalPolicy: 'reject'/);
  assert.doesNotMatch(adapter, /prisma|chatMessage\.create|updateMany/);
  assert.doesNotMatch(adapter, /adminPresence|chatPresenceSetting|chatAlert|chatAppointment/);
});

// --- Visitor intelligence (P27 presence & session context, P28 identity & contact) ---

const VISITOR_A = '3f2b8c1a-9d4e-4f6a-8b7c-1d2e3f4a5b6c';
const VISITOR_B = '7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d';
const CHROME_WINDOWS_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const SAFARI_IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

function visitorDb(): Db {
  const db = createDb();
  db.sessions.push(session('inf-vi', 'pw-infotech', {
    name: '  Meera   Shah ',
    email: 'meera@example.com',
    phone: '+44 20 7946 0958',
    status: 'admin_needed',
    serviceInterest: 'crm-support',
    firstLandingPage: 'https://primewayz.com/services/crm?utm_source=SECRET-LANDING-UTM&gclid=SECRET-GCLID#pricing',
    currentPageUrl: 'https://primewayz.com/contact?ref=SECRET-QUERY#form',
    deviceType: 'desktop',
    browser: 'Chrome',
    operatingSystem: 'Windows',
    country: 'United Kingdom',
    region: 'England',
    city: 'London',
    visitorId: VISITOR_A,
    createdAt: new Date(NOW - 20 * 60 * 1000),
    visitStartedAt: new Date(NOW - 15 * 60 * 1000),
    visitorLastSeenAt: new Date(NOW - 30 * 1000),
  }));
  db.messages.push(message('inf-vi', 'user', 990, { text: 'Need CRM help' }));
  return db;
}

test('visitor presence: null, online, idle and offline boundaries with an injected clock', () => {
  const now = NOW;
  assert.equal(VISITOR_ONLINE_WINDOW_MS, 75_000);
  assert.equal(VISITOR_IDLE_WINDOW_MS, 300_000);
  assert.equal(resolveVisitorPresence(null, now), 'unknown');
  assert.equal(resolveVisitorPresence(undefined, now), 'unknown');
  assert.equal(resolveVisitorPresence(new Date('not a date'), now), 'unknown');
  assert.equal(resolveVisitorPresence(new Date(now), now), 'online');
  assert.equal(resolveVisitorPresence(new Date(now + 5_000), now), 'online', 'small clock skew stays online');
  assert.equal(resolveVisitorPresence(new Date(now - 75_000), now), 'online', '75 seconds is still online');
  assert.equal(resolveVisitorPresence(new Date(now - 75_001), now), 'idle');
  assert.equal(resolveVisitorPresence(new Date(now - 300_000), now), 'idle', '5 minutes is still idle');
  assert.equal(resolveVisitorPresence(new Date(now - 300_001), now), 'offline');
  assert.equal(resolveVisitorPresence(new Date(now - 86_400_000).toISOString(), now), 'offline');
});

test('visitor normalisation: phone, visitorId, device / browser labels and User-Agent derivation', () => {
  assert.equal(normalizeVisitorPhone(' +44 20  7946 0958 '), '+44 20 7946 0958');
  assert.equal(normalizeVisitorPhone('(020) 7946-0958'), '(020) 7946-0958');
  for (const bad of ['', '12345', 'call me', '+44 20 7946 0958 ext <script>', '1'.repeat(16), 'x'.repeat(40), 42, null]) {
    assert.equal(normalizeVisitorPhone(bad), null, String(bad));
  }
  assert.equal(normalizeVisitorId(VISITOR_A.toUpperCase()), VISITOR_A);
  for (const bad of ['visitor-1', 'gaurav@example.com', '3f2b8c1a-9d4e-1f6a-8b7c-1d2e3f4a5b6c', 123, null]) {
    assert.equal(normalizeVisitorId(bad), null, String(bad));
  }
  assert.equal(normalizeVisitorDeviceType('Mobile'), 'mobile');
  assert.equal(normalizeVisitorDeviceType('unknown'), null);
  assert.equal(normalizeVisitorBrowser('chrome'), 'Chrome');
  assert.equal(normalizeVisitorBrowser('Mozilla/5.0 SECRET-UA'), null, 'raw User-Agent strings never pass as a browser label');
  assert.deepEqual(deriveVisitorClientContext(CHROME_WINDOWS_UA), { deviceType: 'desktop', browser: 'Chrome', operatingSystem: 'Windows' });
  assert.deepEqual(deriveVisitorClientContext(SAFARI_IPHONE_UA), { deviceType: 'mobile', browser: 'Safari', operatingSystem: 'iOS' });
  assert.deepEqual(
    deriveVisitorClientContext('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36'),
    { deviceType: 'mobile', browser: 'Chrome', operatingSystem: 'Android' },
  );
  assert.equal(deriveVisitorClientContext('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15').operatingSystem, 'macOS');
  assert.equal(deriveVisitorClientContext('Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/129.0').operatingSystem, 'ChromeOS');
  assert.deepEqual(deriveVisitorClientContext(undefined), { deviceType: null, browser: null, operatingSystem: null });
  assert.deepEqual(deriveVisitorClientContext('curl/8.4.0'), { deviceType: null, browser: null, operatingSystem: null }, 'nothing is invented');
});

test('conversation: visitor and session objects map the stored, tenant-owned context', async () => {
  const app = await startApp({ db: visitorDb() });
  try {
    const res = await app.call({ body: { action: 'conversation', sessionId: 'inf-vi' } });
    assert.equal(res.status, 200);
    assert.equal(res.json.apiVersion, '1');
    const { conversation, visitor, session: visit } = res.json.data;
    assert.deepEqual(visitor, {
      presence: 'online',
      lastSeenAt: new Date(NOW - 30 * 1000).toISOString(),
      firstSeenAt: new Date(NOW - 20 * 60 * 1000).toISOString(),
      returning: false,
      name: 'Meera Shah',
      email: 'meera@example.com',
      phone: '+44 20 7946 0958',
    });
    assert.deepEqual(visit, {
      startedAt: new Date(NOW - 15 * 60 * 1000).toISOString(),
      currentPage: '/contact',
      originatingPage: '/services/crm',
      lastActivityAt: conversation.lastActivityAt,
      device: 'desktop',
      browser: 'Chrome',
      operatingSystem: 'Windows',
      location: { city: 'London', region: 'England', country: 'United Kingdom', approximate: true },
    });
    assert.equal(conversation.originatingPage, '/services/crm', 'existing conversation fields are unchanged');
    assert.equal(conversation.intent, 'crm-support');
  } finally {
    await app.close();
  }
});

test('conversation: missing visitor data is null, never fabricated', async () => {
  const db = createDb();
  db.sessions.push(session('inf-bare', 'pw-infotech', { visitorLastSeenAt: null, browser: null, name: 'someone@example.com' }));
  const app = await startApp({ db });
  try {
    const bare = (await app.call({ body: { action: 'conversation', sessionId: 'inf-bare' } })).json.data;
    assert.deepEqual(bare.visitor, {
      presence: 'unknown',
      lastSeenAt: null,
      firstSeenAt: at(0).toISOString(),
      returning: null,
      name: null,
      email: null,
      phone: null,
    });
    assert.deepEqual(bare.session, {
      startedAt: at(0).toISOString(),
      currentPage: null,
      originatingPage: null,
      lastActivityAt: at(0).toISOString(),
      device: null,
      browser: null,
      operatingSystem: null,
      location: { city: null, region: null, country: null, approximate: true },
    });

    const legacy = (await app.call({ body: { action: 'conversation', sessionId: 'inf-2' } })).json.data;
    assert.equal(legacy.visitor.presence, 'offline');
    assert.equal(legacy.visitor.returning, null, 'no stable visitorId means returning is unknown, not false');
    assert.equal(legacy.session.browser, null, 'a stored raw User-Agent is not echoed as a browser');
  } finally {
    await app.close();
  }
});

test('conversation: presence follows the service clock, not stored state', async () => {
  const clock = { now: NOW };
  const app = await startApp({ db: visitorDb(), clock });
  try {
    const presence = async () => (await app.call({ body: { action: 'conversation', sessionId: 'inf-vi' } })).json.data.visitor.presence;
    assert.equal(await presence(), 'online');
    clock.now = NOW + 2 * 60 * 1000;
    assert.equal(await presence(), 'idle');
    clock.now = NOW + 10 * 60 * 1000;
    assert.equal(await presence(), 'offline');
    assert.ok(app.db.sessions.every((s) => !('presence' in s)), 'presence is never persisted');
  } finally {
    await app.close();
  }
});

test('conversation: returning is tenant-scoped and based only on an earlier session with the same visitorId', async () => {
  const db = visitorDb();
  db.sessions.push(
    session('uk-earlier', 'pw-uk', { visitorId: VISITOR_A, createdAt: new Date(NOW - 5 * 86_400_000), name: 'UK SAME VISITOR' }),
    session('inf-later', 'pw-infotech', { visitorId: VISITOR_A, createdAt: new Date(NOW - 60 * 1000) }),
    session('inf-same-name', 'pw-infotech', { name: 'Meera Shah', email: 'meera@example.com', createdAt: new Date(NOW - 3 * 86_400_000) }),
  );
  const app = await startApp({ db });
  try {
    const first = (await app.call({ body: { action: 'conversation', sessionId: 'inf-vi' } }));
    assert.equal(first.json.data.visitor.returning, false, 'other-tenant, later and same-name/email sessions do not count');
    assert.ok(!first.text.includes('UK SAME VISITOR'));

    const later = (await app.call({ body: { action: 'conversation', sessionId: 'inf-later' } })).json.data;
    assert.equal(later.visitor.returning, true);

    db.sessions.push(session('inf-earlier', 'pw-infotech', { visitorId: VISITOR_A, createdAt: new Date(NOW - 86_400_000) }));
    assert.equal((await app.call({ body: { action: 'conversation', sessionId: 'inf-vi' } })).json.data.visitor.returning, true);

    db.sessions.push(session('inf-other', 'pw-infotech', { visitorId: VISITOR_B, createdAt: new Date(NOW - 60 * 1000) }));
    assert.equal((await app.call({ body: { action: 'conversation', sessionId: 'inf-other' } })).json.data.visitor.returning, false);
  } finally {
    await app.close();
  }
});

test('privacy: visitor intelligence never exposes IP, User-Agent, referrer, UTM, authority or identity keys', async () => {
  const db = visitorDb();
  const vi = db.sessions.find((s) => s.id === 'inf-vi')!;
  vi.browser = 'Chrome';
  const app = await startApp({ db });
  try {
    const res = await app.call({
      body: { action: 'conversation', sessionId: 'inf-vi' },
      headers: { 'User-Agent': CHROME_WINDOWS_UA, 'X-Forwarded-For': '198.51.100.77' },
    });
    assert.equal(res.status, 200);
    for (const forbidden of [
      '203.0.113.10', '198.51.100.77', 'SECRET-UA', 'Mozilla/5.0', 'AppleWebKit', 'secret-referrer', 'SECRET-GCLID',
      'SECRET-LANDING-UTM', 'SECRET-QUERY', 'secret-utm', 'utm_', 'SECRET-CAMPAIGN-ID', 'sourceOrigin', 'sourceSite',
      'sourceChannel', '"tenantId"', 'campaignId', VISITOR_A, 'visitorId', 'userAgent', 'ipAddress', 'referrer',
      'SECRET INTERNAL NOTE',
    ]) {
      assert.ok(!res.text.includes(forbidden), `conversation leaked ${forbidden}`);
    }
    const { visitor, session: visit } = res.json.data;
    assert.deepEqual(Object.keys(visitor).sort(), ['email', 'firstSeenAt', 'lastSeenAt', 'name', 'phone', 'presence', 'returning']);
    assert.deepEqual(Object.keys(visit).sort(), [
      'browser', 'currentPage', 'device', 'lastActivityAt', 'location', 'operatingSystem', 'originatingPage', 'startedAt',
    ]);
    assert.deepEqual(Object.keys(visit.location).sort(), ['approximate', 'city', 'country', 'region']);
    assert.ok(!/latitude|longitude|"lat"|"lng"|postcode|postal/i.test(res.text), 'no exact geolocation');
  } finally {
    await app.close();
  }
});

test('tenant isolation: other-tenant visitor sessions stay unreachable and indistinguishable', async () => {
  const db = visitorDb();
  db.sessions.push(session('uk-vi', 'pw-uk', {
    visitorId: VISITOR_A,
    email: 'uk-visitor@example.com',
    phone: '+44 7700 900123',
    city: 'Manchester',
    visitorLastSeenAt: new Date(NOW - 10 * 1000),
  }));
  const app = await startApp({ db });
  try {
    const own = await app.call({ body: { action: 'conversation', sessionId: 'inf-vi' } });
    assert.equal(own.status, 200);
    for (const leaked of ['uk-visitor@example.com', '+44 7700 900123', 'Manchester']) assert.ok(!own.text.includes(leaked));

    const bodies: string[] = [];
    for (const sessionId of ['uk-vi', 'uk-1', 'does-not-exist']) {
      const res = await app.call({ body: { action: 'conversation', sessionId } });
      assert.equal(res.status, 404, sessionId);
      assert.equal(res.json.error.code, 'conversation_not_found');
      assert.equal(res.json.data, undefined);
      assert.ok(!res.text.includes('uk-visitor@example.com') && !res.text.includes('Manchester'));
      const { requestId: _requestId, ...rest } = res.json;
      bodies.push(JSON.stringify(rest));
    }
    assert.equal(new Set(bodies).size, 1);
  } finally {
    await app.close();
  }
});

test('query behaviour: conversation fetch stays bounded with visitor intelligence', async () => {
  const db = visitorDb();
  for (let i = 0; i < 130; i += 1) db.messages.push(message('inf-vi', i % 2 ? 'bot' : 'user', 300 + i));
  for (let i = 0; i < 25; i += 1) db.sessions.push(session(`inf-history-${i}`, 'pw-infotech', { visitorId: VISITOR_A, createdAt: new Date(NOW - (i + 2) * 86_400_000) }));
  const app = await startApp({ db });
  try {
    app.calls.length = 0;
    const withIdentity = (await app.call({ body: { action: 'conversation', sessionId: 'inf-vi' } })).json.data;
    assert.equal(withIdentity.visitor.returning, true);
    assert.equal(withIdentity.messages.length, 100);
    assert.deepEqual([...app.calls].sort(), [
      'countUnansweredVisitorMessages', 'findSession', 'findSessionOwnership', 'findVisitorProfile',
      'hasEarlierVisitorSession', 'listLatestTranscript',
    ]);

    app.calls.length = 0;
    await app.call({ body: { action: 'conversation', sessionId: 'inf-2' } });
    assert.equal(app.calls.length, 5, `queries: ${app.calls.join(', ')}`);
    assert.ok(!app.calls.includes('hasEarlierVisitorSession'), 'no identity lookup without a visitorId');

    app.calls.length = 0;
    await app.call({ body: { action: 'conversation', sessionId: 'uk-1' } });
    assert.ok(!app.calls.includes('findVisitorProfile'), 'other-tenant sessions are rejected before any visitor read');
  } finally {
    await app.close();
  }
});

test('dashboard: rows gain only lightweight presence, with no extra queries', async () => {
  const app = await startApp({ db: visitorDb() });
  try {
    app.calls.length = 0;
    const res = await app.call({ body: { action: 'dashboard' } });
    const byId = Object.fromEntries(res.json.data.recentConversations.map((r: { sessionId: string }) => [r.sessionId, r]));
    assert.equal(byId['inf-vi'].visitorPresence, 'online');
    assert.equal(byId['inf-vi'].lastSeenAt, new Date(NOW - 30 * 1000).toISOString());
    assert.equal(byId['inf-1'].visitorPresence, 'offline');
    for (const forbidden of ['meera@example.com', '+44 20', 'London', 'Windows', '"device"', '"location"', '"returning"']) {
      assert.ok(!res.text.includes(forbidden), `dashboard leaked ${forbidden}`);
    }
    assert.ok(!app.calls.includes('findVisitorProfile') && !app.calls.includes('hasEarlierVisitorSession'));
    assert.equal(app.calls.length, 7);
  } finally {
    await app.close();
  }
});

test('writes: reply / resolve / reopen responses keep their contract without visitor intelligence', async () => {
  const app = await startApp({ db: visitorDb() });
  try {
    const reply = await app.call({ body: replyBody('inf-vi', 'Happy to help') });
    assert.equal(reply.status, 200);
    assert.deepEqual(Object.keys(reply.json.data).sort(), ['action', 'changed', 'clientActionId', 'conversation', 'message', 'replayed']);
    assert.ok(!('visitor' in reply.json.data.conversation) && !('visitorPresence' in reply.json.data.conversation));
    assert.ok(!reply.text.includes('meera@example.com'));
  } finally {
    await app.close();
  }
});

test('wiring: public session / heartbeat persist normalised telemetry; location and authority never come from the body', () => {
  const server = read('server.ts');
  const sessionRoute = server.slice(server.indexOf("app.post('/api/chat/session'"), server.indexOf("app.post('/api/chat/heartbeat'"));
  const heartbeatRoute = server.slice(server.indexOf("app.post('/api/chat/heartbeat'"), server.indexOf("app.get('/api/chat/:sessionId'"));
  const appointmentRoute = server.slice(server.indexOf("app.post('/api/chat/appointments'"), server.indexOf('app.post(WORDPRESS_CHAT_INTEGRATION_PATH'));
  for (const [name, route, phoneField] of [['session', sessionRoute, 'phone'], ['heartbeat', heartbeatRoute, 'userPhone']] as const) {
    assert.match(route, new RegExp(`buildPublicChatVisitorTelemetry\\(req\\.body, \\{ userAgent: req\\.get\\('user-agent'\\), phoneField: '${phoneField}' \\}\\)`), name);
    assert.match(route, /operatingSystem: telemetry\.operatingSystem/, name);
    assert.match(route, /visitorId: telemetry\.visitorId/, name);
    assert.match(route, /resolveVisitStartedAt\(/, `${name} derives visit lifecycle server-side`);
    assert.match(route, /\bvisitStartedAt,/, `${name} persists derived visit start`);
    assert.match(
      route,
      /resolveApproximateVisitorLocation\(getClientIp\(req\)\)/,
      `${name} derives approximate location server-side`,
    );
    assert.match(route, /city: approximateLocation\?\.city/, name);
    assert.match(route, /region: approximateLocation\?\.region/, name);
    assert.match(route, /country: approximateLocation\?\.country/, name);
    assert.match(route, /\.\.\.toPersistedSourceContext\(sourceContext\)/, name);
    assert.doesNotMatch(
      route,
      /req\.body\.(country|region|city|tenantId|market|sourceSite|sourceOrigin|sourceChannel)/,
      `${name} never trusts client location or authority`,
    );
    assert.equal((route.match(/user-agent|userAgent/gi) ?? []).length, 2, `${name} reads the User-Agent only to derive labels`);
  }
  assert.match(heartbeatRoute, /visitorLastSeenAt: now/);
  assert.match(appointmentRoute, /const contactPhone = normalizeVisitorPhone\(phone\);/);
  assert.match(appointmentRoute, /phone: contactPhone \?\? undefined/);
  const schema = read('prisma/schema.prisma');
  const chatSession = schema.slice(schema.indexOf('model ChatSession {'), schema.indexOf('model ChatMessage {'));
  assert.doesNotMatch(chatSession, /userAgent|ipAddress|latitude|longitude|presence\s/i, 'no raw UA, IP, exact location or stored presence');
  assert.match(chatSession, /@@index\(\[tenantId, visitorId\]\)/);
});
