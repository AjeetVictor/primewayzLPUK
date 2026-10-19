import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import test from 'node:test';
import express, { type NextFunction, type Request, type Response } from 'express';
import {
  assertAdminCanAccessChatSession,
  createAdminChatRouteHandlers,
  type AdminChatStore,
  type OperationalChatAccessResolver,
} from './adminChatRoutes.ts';
import {
  describeAdminReplyEntitlementFailure,
  readAdminReplyEntitlementFailure,
} from './adminReplyEntitlementNotice.ts';
import {
  advanceConversationStatus,
  resolveConversation,
  type ChatConversationStore,
  type ChatConversationTx,
} from '../chat/chatConversationService.ts';
import { createAdminRequestOriginMiddleware, getAdminAllowedOrigins } from './adminRequestOrigin.ts';
import { resolveSourceContext, SourceResolutionError } from '../platform/sourceResolver.ts';
import { validateExistingOrNewChatSessionId } from '../chat/publicChatGuards.ts';

// --- In-memory model of the single shared Primewayz UK database ---

type SessionRow = {
  id: string;
  tenantId: string | null;
  market: string | null;
  sourceSite: string | null;
  sourceOrigin: string | null;
  sourceChannel: string | null;
  status: string;
};
type MessageRow = {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  isInternalNote: boolean;
  answered: boolean;
  replyToId: number | null;
  timestamp: Date;
};

const UK_SESSION = 'uk-session-1';
const INFOTECH_SESSION = 'infotech-session-1';
const LEGACY_SESSION = 'legacy1';

function createDb() {
  const sessions = new Map<string, SessionRow>([
    [UK_SESSION, { id: UK_SESSION, tenantId: 'pw-uk', market: 'UK', sourceSite: 'uk.primewayz.com', sourceOrigin: 'https://uk.primewayz.com', sourceChannel: 'chat', status: 'bot_replied' }],
    [INFOTECH_SESSION, { id: INFOTECH_SESSION, tenantId: 'pw-infotech', market: 'IN', sourceSite: 'primewayz.com', sourceOrigin: 'https://primewayz.com', sourceChannel: 'chat', status: 'bot_replied' }],
    [LEGACY_SESSION, { id: LEGACY_SESSION, tenantId: null, market: null, sourceSite: null, sourceOrigin: null, sourceChannel: null, status: 'new' }],
  ]);
  const messages: MessageRow[] = [
    { id: 1, sessionId: UK_SESSION, sender: 'user', text: 'UK question', isInternalNote: false, answered: false, replyToId: null, timestamp: new Date(1) },
    { id: 2, sessionId: INFOTECH_SESSION, sender: 'user', text: 'Infotech question', isInternalNote: false, answered: false, replyToId: null, timestamp: new Date(2) },
    { id: 3, sessionId: INFOTECH_SESSION, sender: 'admin', text: 'Internal context', isInternalNote: true, answered: true, replyToId: null, timestamp: new Date(3) },
  ];
  let nextId = 100;

  const withSession = (message: MessageRow) => {
    const session = sessions.get(message.sessionId)!;
    return { ...message, session: { tenantId: session.tenantId, market: session.market, sourceSite: session.sourceSite } };
  };

  const store: AdminChatStore = {
    async findSessionOwnership(sessionId) {
      const session = sessions.get(sessionId);
      return session ? { id: session.id, tenantId: session.tenantId } : null;
    },
    async listMessages({ tenantId }) {
      return messages
        .filter((message) => !tenantId || sessions.get(message.sessionId)?.tenantId === tenantId)
        .map(withSession);
    },
    async listSessionMessages(sessionId) {
      return messages.filter((message) => message.sessionId === sessionId).map(withSession);
    },
    async listSessions({ tenantId }) {
      return [...sessions.values()].filter((session) => !tenantId || session.tenantId === tenantId);
    },
    async countMessagesInSession(messageId, sessionId) {
      return messages.filter((message) => message.id === messageId && message.sessionId === sessionId).length;
    },
    async countAttachmentsInSession() {
      return 0;
    },
    async countUnansweredVisitorMessages({ tenantId }) {
      const counts = new Map<string, number>();
      for (const message of messages) {
        const session = sessions.get(message.sessionId);
        if (tenantId && session?.tenantId !== tenantId) continue;
        if (message.sender === 'user' && !message.answered && !message.isInternalNote) {
          counts.set(message.sessionId, (counts.get(message.sessionId) ?? 0) + 1);
        }
      }
      return [...counts.entries()].map(([sessionId, count]) => ({ sessionId, count }));
    },
  };

  const tx: ChatConversationTx = {
    async findSession(sessionId) {
      const session = sessions.get(sessionId);
      return session ? { id: session.id, tenantId: session.tenantId, status: session.status } : null;
    },
    async updateSessionStatus({ sessionId, tenantId, statusIn, statusNotIn, data }) {
      const session = sessions.get(sessionId);
      if (!session) return 0;
      if (tenantId !== undefined && session.tenantId !== tenantId) return 0;
      if (statusIn && !statusIn.includes(session.status)) return 0;
      if (statusNotIn && statusNotIn.includes(session.status)) return 0;
      session.status = data.status;
      return 1;
    },
    async createTeamMessage(input) {
      const row: MessageRow = {
        id: nextId++,
        sessionId: input.sessionId,
        sender: 'admin',
        text: input.text,
        isInternalNote: input.isInternalNote,
        answered: true,
        replyToId: input.replyToId,
        timestamp: new Date(),
      };
      messages.push(row);
      return { ...row, editedAt: null, deletedAt: null };
    },
    async markVisitorMessagesAnswered(sessionId) {
      let count = 0;
      for (const message of messages) {
        if (message.sessionId === sessionId && message.sender === 'user' && !message.answered) {
          message.answered = true;
          count += 1;
        }
      }
      return count;
    },
    async findMessage() {
      return null;
    },
    async findOperatorAction() {
      return null;
    },
    async createOperatorAction() {
      throw new Error('UK Admin replies never create delegated operator actions');
    },
    async updateOperatorAction() {
      throw new Error('UK Admin replies never create delegated operator actions');
    },
  };
  const conversations: ChatConversationStore = { ...tx, transaction: (fn) => fn(tx) };

  return { sessions, messages, store, conversations };
}

// --- Test app mirroring the server.ts admin chat wiring ---

const OPS_COOKIE = 'primewayz_admin_token=ops';
const BLOG_COOKIE = 'primewayz_admin_token=blog';

type TestAdminRequest = Request & {
  adminUser?: {
    id: number;
    email: string;
    role: string;
    isPlatformOwner: boolean;
    tenantIds: string[];
  };
};

function fakeRequireAdmin(req: TestAdminRequest, res: Response, next: NextFunction) {
  const cookie = req.get('cookie') ?? '';
  if (cookie.includes('primewayz_admin_token=ops')) {
    req.adminUser = { id: 1, email: 'platform@example.com', role: 'editor', isPlatformOwner: true, tenantIds: [] };
  } else if (cookie.includes('primewayz_admin_token=tenant')) {
    req.adminUser = { id: 2, email: 'tenant@example.com', role: 'editor', isPlatformOwner: false, tenantIds: ['pw-infotech'] };
  } else if (cookie.includes('primewayz_admin_token=unassigned')) {
    req.adminUser = { id: 3, email: 'unassigned@example.com', role: 'editor', isPlatformOwner: false, tenantIds: [] };
  } else if (cookie.includes('primewayz_admin_token=silver')) {
    req.adminUser = { id: 5, email: 'silver@example.com', role: 'editor', isPlatformOwner: false, tenantIds: ['rrb-silver-campaign'] };
  } else if (cookie.includes('primewayz_admin_token=blog')) req.adminUser = { id: 4, email: 'blog@example.com', role: 'blog_author', isPlatformOwner: false, tenantIds: [] };
  else return res.status(401).json({ success: false, error: 'Not authenticated' });
  return next();
}

function fakeRequireOperationsRole(req: TestAdminRequest, res: Response, next: NextFunction) {
  const role = req.adminUser?.role;
  if (role === 'editor' || role === 'viewer' || role === 'admin' || role === 'super_admin') return next();
  return res.status(403).json({ success: false, error: 'Forbidden' });
}

const allowExistingChat: OperationalChatAccessResolver = async () => ({ allowed: true, basis: 'allowed_existing' });

async function startAdminApp(options: { resolveChatAccess?: OperationalChatAccessResolver } = {}) {
  const db = createDb();
  const handlers = createAdminChatRouteHandlers({
    store: db.store,
    conversations: db.conversations,
    isDatabaseUnavailableError: () => false,
    logUnavailable: () => undefined,
    resolveChatAccess: options.resolveChatAccess ?? allowExistingChat,
  });
  const app = express();
  app.use(express.json());
  app.use(createAdminRequestOriginMiddleware({
    allowedOrigins: getAdminAllowedOrigins({ siteUrl: 'https://uk.primewayz.com' }),
    allowLocalDevelopment: false,
  }));
  app.get('/api/admin/chats', fakeRequireAdmin, fakeRequireOperationsRole, handlers.listMessages);
  app.get('/api/admin/sessions', fakeRequireAdmin, fakeRequireOperationsRole, handlers.listSessions);
  app.get('/api/admin/sessions/:sessionId/messages', fakeRequireAdmin, fakeRequireOperationsRole, handlers.sessionHistory);
  app.post('/api/chat', fakeRequireAdmin, fakeRequireOperationsRole, handlers.reply);

  const server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;

  const call = (method: string, urlPath: string, options: { cookie?: string; origin?: string; body?: unknown } = {}) =>
    new Promise<{ status: number; json: any }>((resolve, reject) => {
      const headers: Record<string, string> = {};
      if (options.cookie) headers.Cookie = options.cookie;
      if (options.origin) headers.Origin = options.origin;
      const payload = options.body === undefined ? undefined : JSON.stringify(options.body);
      if (payload) headers['Content-Type'] = 'application/json';
      const req = http.request({ host: '127.0.0.1', port, method, path: urlPath, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, json: data ? JSON.parse(data) : null }));
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });

  return { db, call, close: () => new Promise<void>((done) => server.close(() => done())) };
}

const UK_ADMIN_ORIGIN = 'https://uk.primewayz.com';
const ops = { cookie: OPS_COOKIE, origin: UK_ADMIN_ORIGIN };
const tenantOps = { cookie: 'primewayz_admin_token=tenant', origin: UK_ADMIN_ORIGIN };
const unassignedOps = { cookie: 'primewayz_admin_token=unassigned', origin: UK_ADMIN_ORIGIN };

// --- Public visitor isolation (unchanged by this task) ---

function visitorAccess(origin: string, existingTenantId: string | null) {
  const source = resolveSourceContext({ origin, sourceChannel: 'chat' });
  return validateExistingOrNewChatSessionId({ sessionId: 'existing', existingSession: { tenantId: existingTenantId }, source });
}

test('public visitor from uk.primewayz.com can only access pw-uk sessions', () => {
  assert.equal(visitorAccess('https://uk.primewayz.com', 'pw-uk').isExisting, true);
  assert.throws(() => visitorAccess('https://uk.primewayz.com', 'pw-infotech'), SourceResolutionError);
});

test('public visitor from primewayz.com can only access pw-infotech sessions', () => {
  assert.equal(visitorAccess('https://primewayz.com', 'pw-infotech').isExisting, true);
  assert.throws(() => visitorAccess('https://primewayz.com', 'pw-uk'), SourceResolutionError);
  assert.throws(() => visitorAccess('https://primewayz.com', null), SourceResolutionError, 'legacy sessions stay UK');
});

// --- Admin authority (pure) ---

test('admin session access is decided by stored tenant + selected filter, not request source', () => {
  const infotech = { id: INFOTECH_SESSION, tenantId: 'pw-infotech' };
  const platform = { id: 9, role: 'admin', isPlatformOwner: true, tenantIds: [] };
  assert.equal(assertAdminCanAccessChatSession(infotech, 'pw-infotech', platform), infotech);
  assert.equal(assertAdminCanAccessChatSession(infotech, undefined, platform), infotech, 'All entities');
  assert.equal(assertAdminCanAccessChatSession(infotech, 'pw-infotech', {
    id: 10, role: 'editor', isPlatformOwner: false, tenantIds: ['pw-infotech'],
  }), infotech, 'assigned tenant operator');
  assert.throws(() => assertAdminCanAccessChatSession(infotech, 'pw-uk'), { status: 403, code: 'tenant_scope_mismatch' });
  assert.throws(() => assertAdminCanAccessChatSession(null, undefined), { status: 404 });
  assert.throws(() => assertAdminCanAccessChatSession({ id: 'x', tenantId: 'pw-us' }, undefined), { status: 403, code: 'tenant_not_permitted' });
  assert.throws(() => assertAdminCanAccessChatSession({ id: LEGACY_SESSION, tenantId: null }, 'pw-uk'), { status: 403 });
  assert.throws(
    () => assertAdminCanAccessChatSession({ id: LEGACY_SESSION, tenantId: null }, undefined),
    { status: 403, code: 'platform_owner_required' },
  );
});

// --- Authenticated admin over HTTP ---

test('authorised admin lists pw-uk and pw-infotech conversations through the tenant filter', async () => {
  const app = await startAdminApp();
  try {
    const uk = await app.call('GET', '/api/admin/sessions?tenantId=pw-uk', ops);
    assert.deepEqual(uk.json.map((s: SessionRow) => s.id), [UK_SESSION]);
    const infotech = await app.call('GET', '/api/admin/sessions?tenantId=pw-infotech', ops);
    assert.deepEqual(infotech.json.map((s: SessionRow) => s.id), [INFOTECH_SESSION]);
    const all = await app.call('GET', '/api/admin/sessions?tenantId=all', ops);
    assert.equal(all.json.length, 3);
    const infotechMessages = await app.call('GET', '/api/admin/chats?tenantId=pw-infotech', ops);
    assert.ok(infotechMessages.json.every((m: { session: { tenantId: string } }) => m.session.tenantId === 'pw-infotech'));
    assert.equal((await app.call('GET', '/api/admin/sessions?tenantId=pw-us', ops)).status, 400, 'inactive tenant filter');
  } finally {
    await app.close();
  }
});

test('tenant operators are limited to assigned tenants and cannot use all or select another tenant', async () => {
      const app = await startAdminApp();
      try {
        const defaultScope = await app.call('GET', '/api/admin/sessions', tenantOps);
        assert.deepEqual(defaultScope.json.map((session: SessionRow) => session.id), [INFOTECH_SESSION]);

        for (const path of [
          '/api/admin/sessions?tenantId=pw-uk',
          '/api/admin/chats?tenantId=all',
          `/api/admin/sessions/${UK_SESSION}/messages?tenantId=all`,
          `/api/admin/sessions/${UK_SESSION}/messages?tenantId=pw-uk`,
          `/api/chat?tenantId=all`,
        ]) {
          const method = path.startsWith('/api/chat?') ? 'POST' : 'GET';
          const body = method === 'POST'
            ? { sessionId: UK_SESSION, sender: 'admin', text: 'unauthorized' }
            : undefined;
          assert.equal((await app.call(method, path, { ...tenantOps, body })).status, 403, path);
        }
        assert.equal((await app.call('GET', '/api/admin/sessions', unassignedOps)).status, 403);
      } finally {
        await app.close();
      }
});


test('authorised admin opens and refreshes pw-uk and pw-infotech history from the UK admin origin', async () => {
  const app = await startAdminApp();
  try {
    const uk = await app.call('GET', `/api/admin/sessions/${UK_SESSION}/messages?tenantId=pw-uk`, ops);
    assert.equal(uk.status, 200);
    assert.deepEqual(uk.json.map((m: MessageRow) => m.id), [1]);

    for (let refresh = 0; refresh < 3; refresh += 1) {
      const infotech = await app.call('GET', `/api/admin/sessions/${INFOTECH_SESSION}/messages?tenantId=pw-infotech`, ops);
      assert.equal(infotech.status, 200, 'the old Origin-derived pw-uk resolution returned 403 here');
      assert.deepEqual(infotech.json.map((m: MessageRow) => m.id), [2, 3], 'admin view includes internal notes');
    }

    const viaAll = await app.call('GET', `/api/admin/sessions/${INFOTECH_SESSION}/messages?tenantId=all`, ops);
    assert.equal(viaAll.status, 200);
    const outOfScope = await app.call('GET', `/api/admin/sessions/${INFOTECH_SESSION}/messages?tenantId=pw-uk`, ops);
    assert.equal(outOfScope.status, 403);
    assert.equal((await app.call('GET', '/api/admin/sessions/missing/messages?tenantId=all', ops)).status, 404);
  } finally {
    await app.close();
  }
});

test('authorised admin replies to pw-uk and pw-infotech conversations', async () => {
  const app = await startAdminApp();
  try {
    const ukReply = await app.call('POST', '/api/chat?tenantId=pw-uk', { ...ops, body: { sessionId: UK_SESSION, sender: 'admin', text: 'Hello UK', replyToId: 1 } });
    assert.equal(ukReply.status, 201);
    const infotechReply = await app.call('POST', '/api/chat?tenantId=pw-infotech', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'Hello India', replyToId: 2 } });
    assert.equal(infotechReply.status, 201);
    assert.equal(infotechReply.json.sessionId, INFOTECH_SESSION);
    assert.equal(app.db.sessions.get(INFOTECH_SESSION)!.status, 'admin_replied');
    assert.equal(app.db.messages.find((m) => m.id === 2)!.answered, true);

    const allScope = await app.call('POST', '/api/chat?tenantId=all', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'Again' } });
    assert.equal(allScope.status, 201);
  } finally {
    await app.close();
  }
});

test('admin reply guards: scope, unknown session, cross-session quote, spoofed sender', async () => {
  const app = await startAdminApp();
  try {
    const before = app.db.messages.length;
    const wrongScope = await app.call('POST', '/api/chat?tenantId=pw-uk', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'x' } });
    assert.equal(wrongScope.status, 403);
    const unknown = await app.call('POST', '/api/chat?tenantId=all', { ...ops, body: { sessionId: 'not-a-session', sender: 'admin', text: 'x' } });
    assert.equal(unknown.status, 404);
    assert.equal(app.db.sessions.has('not-a-session'), false, 'admin replies never create sessions');
    const crossQuote = await app.call('POST', '/api/chat?tenantId=pw-infotech', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'x', replyToId: 1 } });
    assert.equal(crossQuote.status, 400);
    const spoof = await app.call('POST', '/api/chat?tenantId=pw-uk', { ...ops, body: { sessionId: UK_SESSION, sender: 'user', text: 'x' } });
    assert.equal(spoof.status, 403);
    assert.equal(spoof.json.code, 'sender_not_allowed');
    assert.equal(app.db.messages.length, before);
  } finally {
    await app.close();
  }
});

test('suspended and revoked entitlements block admin replies and leave history readable', async () => {
  let lookups: string[] = [];
  const app = await startAdminApp({
    resolveChatAccess: async (tenantId) => {
      lookups.push(tenantId);
      return { allowed: false, basis: tenantId === 'pw-uk' ? 'revoked' : 'suspended' };
    },
  });
  try {
    const before = JSON.stringify(app.db.messages);
    const history = await app.call('GET', `/api/admin/sessions/${INFOTECH_SESSION}/messages?tenantId=pw-infotech`, ops);
    assert.equal(history.status, 200);
    assert.deepEqual(history.json.map((message: MessageRow) => message.id), [2, 3]);
    const sessions = await app.call('GET', '/api/admin/sessions?tenantId=pw-infotech', ops);
    assert.equal(sessions.status, 200);
    assert.equal(lookups.length, 0, 'historical reads do not consult entitlement');

    const reply = await app.call('POST', '/api/chat?tenantId=pw-infotech', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'Should not send' } });
    assert.equal(reply.status, 403);
    assert.equal(reply.json.code, 'chat_not_entitled');
    const note = await app.call('POST', '/api/chat?tenantId=pw-infotech', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'hidden', isInternalNote: true } });
    assert.equal(note.status, 403);
    assert.equal(note.json.code, 'chat_not_entitled');
    const revoked = await app.call('POST', '/api/chat?tenantId=pw-uk', { ...ops, body: { sessionId: UK_SESSION, sender: 'admin', text: 'Should not send' } });
    assert.equal(revoked.status, 403);
    assert.equal(revoked.json.code, 'chat_not_entitled');
    assert.deepEqual(lookups, ['pw-infotech', 'pw-infotech', 'pw-uk']);
    assert.equal(JSON.stringify(app.db.messages), before);
    assert.equal(app.db.sessions.get(INFOTECH_SESSION)!.status, 'bot_replied');
    assert.equal(app.db.messages.find((message) => message.id === 2)!.answered, false);
  } finally {
    await app.close();
  }
});

test('an entitlement store outage blocks admin replies and a missing row does not', async () => {
  const down = await startAdminApp({
    resolveChatAccess: async () => {
      throw new Error('entitlement store down');
    },
  });
  try {
    const before = down.db.messages.length;
    const reply = await down.call('POST', '/api/chat?tenantId=pw-uk', { ...ops, body: { sessionId: UK_SESSION, sender: 'admin', text: 'no' } });
    assert.equal(reply.status, 503);
    assert.equal(reply.json.code, 'chat_service_unavailable');
    assert.equal(down.db.messages.length, before);
    const history = await down.call('GET', `/api/admin/sessions/${UK_SESSION}/messages?tenantId=pw-uk`, ops);
    assert.equal(history.status, 200);
  } finally {
    await down.close();
  }

  const lookups: string[] = [];
  const open = await startAdminApp({
    resolveChatAccess: async (tenantId) => {
      lookups.push(tenantId);
      return { allowed: true, basis: 'allowed_existing' };
    },
  });
  try {
    const reply = await open.call('POST', '/api/chat?tenantId=pw-infotech', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'Hello' } });
    assert.equal(reply.status, 201);
    const legacy = await open.call('POST', '/api/chat?tenantId=all', {
      ...ops,
      body: { sessionId: LEGACY_SESSION, sender: 'admin', text: 'Legacy still sends' },
    });
    assert.equal(legacy.status, 201, 'a missing Primewayz UK row still allows the legacy session');
    assert.equal(open.db.sessions.get(LEGACY_SESSION)!.tenantId, null);
    assert.deepEqual(lookups, ['pw-infotech', 'pw-uk']);
  } finally {
    await open.close();
  }
});

test('legacy null-tenant replies follow Primewayz UK entitlement and ignore body tenant fields', async () => {
  const cases = [
    { basis: 'allowed_entitled', allowed: true, status: 201 },
    { basis: 'suspended', allowed: false, status: 403 },
    { basis: 'revoked', allowed: false, status: 403 },
  ] as const;

  for (const item of cases) {
    const lookups: string[] = [];
    const app = await startAdminApp({
      resolveChatAccess: async (tenantId) => {
        lookups.push(tenantId);
        if (tenantId === 'pw-uk') return { allowed: item.allowed, basis: item.basis };
        return { allowed: true, basis: 'allowed_entitled' };
      },
    });
    try {
      const before = app.db.messages.length;
      const history = await app.call('GET', `/api/admin/sessions/${LEGACY_SESSION}/messages?tenantId=all`, ops);
      assert.equal(history.status, 200, item.basis);
      assert.equal(lookups.length, 0, 'historical reads do not consult entitlement');
      const hidden = await app.call('GET', `/api/admin/sessions/${LEGACY_SESSION}/messages?tenantId=pw-uk`, ops);
      assert.equal(hidden.status, 403, 'legacy rows stay outside the Primewayz UK filter');
      const reply = await app.call('POST', '/api/chat?tenantId=all', {
        ...ops,
        body: {
          sessionId: LEGACY_SESSION,
          sender: 'admin',
          text: 'Legacy reply',
          tenantId: 'pw-infotech',
          market: 'IN',
          sourceSite: 'primewayz.com',
        },
      });
      assert.equal(reply.status, item.status, item.basis);
      assert.deepEqual(lookups, ['pw-uk'], item.basis);
      assert.equal(app.db.sessions.get(LEGACY_SESSION)!.tenantId, null, 'the stored tenant stays null');
      if (item.allowed) {
        assert.equal(app.db.messages.length, before + 1);
      } else {
        assert.equal(reply.json.code, 'chat_not_entitled');
        assert.equal(app.db.messages.length, before);
        const infotech = await app.call('POST', '/api/chat?tenantId=pw-infotech', {
          ...ops,
          body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'still open' },
        });
        assert.equal(infotech.status, 201, 'another entitled tenant is unchanged');
        assert.deepEqual(lookups, ['pw-uk', 'pw-infotech']);
      }
    } finally {
      await app.close();
    }
  }

  const downLookups: string[] = [];
  const down = await startAdminApp({
    resolveChatAccess: async (tenantId) => {
      downLookups.push(tenantId);
      if (tenantId === 'pw-uk') throw new Error('entitlement store down');
      return { allowed: true, basis: 'allowed_entitled' };
    },
  });
  try {
    const before = down.db.messages.length;
    const history = await down.call('GET', `/api/admin/sessions/${LEGACY_SESSION}/messages?tenantId=all`, ops);
    assert.equal(history.status, 200);
    assert.equal(downLookups.length, 0);
    const reply = await down.call('POST', '/api/chat?tenantId=all', {
      ...ops,
      body: { sessionId: LEGACY_SESSION, sender: 'admin', text: 'no', tenantId: 'pw-uk' },
    });
    assert.equal(reply.status, 503);
    assert.equal(reply.json.code, 'chat_service_unavailable');
    assert.equal(down.db.messages.length, before);
    assert.deepEqual(downLookups, ['pw-uk']);
    const infotech = await down.call('POST', '/api/chat?tenantId=pw-infotech', {
      ...ops,
      body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'still open' },
    });
    assert.equal(infotech.status, 201);
  } finally {
    await down.close();
  }
});

test('internal notes do not mark visitor messages answered', async () => {
  const app = await startAdminApp();
  try {
    const note = await app.call('POST', '/api/chat?tenantId=pw-infotech', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'note', isInternalNote: true } });
    assert.equal(note.status, 201);
    assert.equal(app.db.messages.find((m) => m.id === 2)!.answered, false);
    assert.equal(app.db.sessions.get(INFOTECH_SESSION)!.status, 'bot_replied');
  } finally {
    await app.close();
  }
});

test('UK Admin replies to closed / spam conversations are still stored and keep the terminal status', async () => {
  const app = await startAdminApp();
  try {
    for (const status of ['closed', 'spam']) {
      app.db.sessions.get(UK_SESSION)!.status = status;
      const reply = await app.call('POST', '/api/chat?tenantId=pw-uk', { ...ops, body: { sessionId: UK_SESSION, sender: 'admin', text: `after ${status}` } });
      assert.equal(reply.status, 201, status);
      assert.equal(reply.json.sender, 'admin');
      assert.equal(app.db.sessions.get(UK_SESSION)!.status, status, 'terminal status is never overwritten by admin_replied');
      assert.equal(app.db.messages.find((m) => m.id === 1)!.answered, true);
    }
  } finally {
    await app.close();
  }
});

test('unauthenticated callers cannot use the admin history route or reply', async () => {
  const app = await startAdminApp();
  try {
    assert.equal((await app.call('GET', `/api/admin/sessions/${INFOTECH_SESSION}/messages?tenantId=all`, { origin: UK_ADMIN_ORIGIN })).status, 401);
    assert.equal((await app.call('GET', '/api/admin/sessions?tenantId=all', { origin: UK_ADMIN_ORIGIN })).status, 401);
    const reply = await app.call('POST', '/api/chat?tenantId=all', { origin: UK_ADMIN_ORIGIN, body: { sessionId: UK_SESSION, sender: 'admin', text: 'x' } });
    assert.equal(reply.status, 401);
    const blogOnly = await app.call('GET', `/api/admin/sessions/${UK_SESSION}/messages?tenantId=pw-uk`, { cookie: BLOG_COOKIE, origin: UK_ADMIN_ORIGIN });
    assert.equal(blogOnly.status, 403, 'non-operations roles are refused');
  } finally {
    await app.close();
  }
});

test('authenticated admin write from an untrusted browser Origin is rejected before the handler', async () => {
  const app = await startAdminApp();
  try {
    const before = app.db.messages.length;
    for (const origin of ['https://primewayz.com', 'https://www.primewayz.com', 'https://evil.example']) {
      const res = await app.call('POST', '/api/chat?tenantId=all', { cookie: OPS_COOKIE, origin, body: { sessionId: UK_SESSION, sender: 'admin', text: 'x' } });
      assert.equal(res.status, 403, origin);
      assert.equal(res.json.code, 'admin_origin_rejected');
    }
    assert.equal(app.db.messages.length, before);
    const ok = await app.call('POST', '/api/chat?tenantId=pw-uk', { ...ops, body: { sessionId: UK_SESSION, sender: 'admin', text: 'ok' } });
    assert.equal(ok.status, 201);
  } finally {
    await app.close();
  }
});

test('admin viewing and replying to pw-infotech never changes its source attribution', async () => {
  const app = await startAdminApp();
  try {
    const attribution = (row: SessionRow) => ({
      tenantId: row.tenantId,
      market: row.market,
      sourceSite: row.sourceSite,
      sourceOrigin: row.sourceOrigin,
      sourceChannel: row.sourceChannel,
    });
    const before = attribution(app.db.sessions.get(INFOTECH_SESSION)!);

    await app.call('GET', `/api/admin/sessions/${INFOTECH_SESSION}/messages?tenantId=pw-infotech`, ops);
    await app.call('POST', '/api/chat?tenantId=pw-infotech', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'reply' } });
    await app.call('POST', '/api/chat?tenantId=all', { ...ops, body: { sessionId: INFOTECH_SESSION, sender: 'admin', text: 'note', isInternalNote: true } });

    assert.deepEqual(attribution(app.db.sessions.get(INFOTECH_SESSION)!), before);
    assert.deepEqual(before, {
      tenantId: 'pw-infotech',
      market: 'IN',
      sourceSite: 'primewayz.com',
      sourceOrigin: 'https://primewayz.com',
      sourceChannel: 'chat',
    });
  } finally {
    await app.close();
  }
});

// --- server.ts / Admin UI wiring ---

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
const server = read('server.ts');

function routeSource(startMarker: string): string {
  const start = server.indexOf(startMarker);
  assert.notEqual(start, -1, `missing route ${startMarker}`);
  const next = server.indexOf('\napp.', start + startMarker.length);
  return server.slice(start, next === -1 ? undefined : next);
}

test('server mounts the admin history route behind admin auth and the operations role', () => {
  assert.match(
    server,
    /app\.get\('\/api\/admin\/sessions\/:sessionId\/messages', requireAdmin, requireRole\(isOperationsRole\), adminChatHandlers\.sessionHistory\)/,
  );
  assert.match(server, /app\.get\('\/api\/admin\/chats', requireAdmin, requireRole\(isOperationsRole\), adminChatHandlers\.listMessages\)/);
  assert.match(server, /app\.get\('\/api\/admin\/sessions', requireAdmin, requireRole\(isOperationsRole\), adminChatHandlers\.listSessions\)/);
  assert.match(server, /app\.post\('\/api\/chat', requireAdmin, requireRole\(isOperationsRole\), adminChatHandlers\.reply\)/);
});

test('admin chat code never resolves tenant from the request source', () => {
  const adminRoutes = read('src/lib/admin/adminChatRoutes.ts');
  assert.doesNotMatch(adminRoutes, /resolveSourceContext|resolveRequestSource/);
  assert.doesNotMatch(adminRoutes, /body\.tenantId|req\.body\?\.tenantId/);
  assert.match(adminRoutes, /resolveStoredChatSessionTenantId\(tenantId\)/);
  assert.match(adminRoutes, /requestedTenantFilter\(/);
  const storeStart = server.indexOf('const adminChatStore: AdminChatStore = {');
  const storeEnd = server.indexOf('const adminChatHandlers = createAdminChatRouteHandlers(');
  const storeSource = server.slice(storeStart, storeEnd);
  assert.ok(storeStart > 0 && storeEnd > storeStart);
  assert.doesNotMatch(storeSource, /chatSession\.(upsert|update|create)/, 'admin chat store has no session writes');
});

test('the admin Origin guard is mounted before any admin route', () => {
  const guard = server.indexOf('app.use(createAdminRequestOriginMiddleware(');
  assert.ok(guard > 0);
  assert.ok(guard < server.indexOf("app.post('/api/admin/login'"));
  assert.match(server, /allowedOrigins: getAdminAllowedOrigins\(\{ siteUrl \}\),\s*allowLocalDevelopment: !isProd,/);
});

test('public visitor history route still derives tenant from Origin/Host', () => {
  const history = routeSource("app.get('/api/chat/:sessionId'");
  assert.match(history, /resolveRequestSource\(req, 'chat'\)/);
  assert.match(history, /await assertChatSessionSource\(req\.params\.sessionId, sourceContext\)/);
  assert.match(history, /formatVisitorMessage\(message\)/);
});

test('AdminPanel refreshes the selected conversation through the authenticated admin route', () => {
  const panel = read('src/components/AdminPanel.tsx');
  assert.match(panel, /adminTenantQuery\(`\/api\/admin\/sessions\/\$\{encodeURIComponent\(selectedConversationId\)\}\/messages`\)/);
  assert.doesNotMatch(panel, /apiUrl\(`\/api\/chat\/\$\{/);
});

test('AdminMobileChat scopes lists and replies with the shared Admin tenant filter', () => {
  const mobile = read('src/components/AdminMobileChat.tsx');
  assert.match(mobile, /<AdminTenantFilter/);
  assert.match(mobile, /adminRequest\(tenantQuery\('\/api\/admin\/sessions'\)\)/);
  assert.match(mobile, /adminRequest\(tenantQuery\('\/api\/admin\/chats'\)\)/);
});

test('unanswered visitor messages stay visible when status is bot_replied', async () => {
  const savedEnabled = process.env.RRB_SILVER_CAMPAIGN_ENABLED;
  const savedOrigins = process.env.RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS;
  process.env.RRB_SILVER_CAMPAIGN_ENABLED = 'true';
  process.env.RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS = 'https://silver-preview.example.test';
  const app = await startAdminApp();
  try {
    const silverSession = (id: string) => ({
      id,
      tenantId: 'rrb-silver-campaign',
      market: 'IN',
      sourceSite: 'rentreadbuy-silver',
      sourceOrigin: 'https://silver-preview.example.test',
      sourceChannel: 'chat',
      status: 'bot_replied',
    });
    app.db.sessions.set('silver-approved', silverSession('silver-approved'));
    app.db.sessions.set('silver-open', silverSession('silver-open'));
    app.db.messages.push(
      { id: 50, sessionId: 'silver-approved', sender: 'user', text: 'How does Silver Membership work?', isInternalNote: false, answered: true, replyToId: null, timestamp: new Date(50) },
      { id: 51, sessionId: 'silver-open', sender: 'user', text: 'Can you ship to Mars?', isInternalNote: false, answered: false, replyToId: null, timestamp: new Date(51) },
    );

    const listed = await app.call('GET', '/api/admin/sessions?tenantId=rrb-silver-campaign', ops);
    assert.equal(listed.status, 200);
    const byId = Object.fromEntries(listed.json.map((session: { id: string }) => [session.id, session]));
    assert.equal(byId['silver-approved'].status, 'bot_replied');
    assert.equal(byId['silver-approved'].needsAttention, false, 'approved Silver answer does not escalate');
    assert.equal(byId['silver-open'].status, 'bot_replied');
    assert.equal(byId['silver-open'].needsAttention, true, 'unanswered message stays visible');
    assert.equal(app.db.sessions.get('silver-open')!.status, 'bot_replied');

    const silverOps = { cookie: 'primewayz_admin_token=silver', origin: UK_ADMIN_ORIGIN };
    const scoped = await app.call('GET', '/api/admin/sessions', silverOps);
    assert.deepEqual(scoped.json.map((session: { id: string }) => session.id).sort(), ['silver-approved', 'silver-open']);
    assert.equal((await app.call('GET', '/api/admin/sessions?tenantId=pw-uk', silverOps)).status, 403);
    assert.equal((await app.call('GET', `/api/admin/sessions/${UK_SESSION}/messages?tenantId=pw-uk`, silverOps)).status, 403);
    assert.equal((await app.call('GET', '/api/admin/sessions?tenantId=rrb-silver-campaign', tenantOps)).status, 403);

    const everyone = await app.call('GET', '/api/admin/sessions?tenantId=all', ops);
    assert.equal(everyone.status, 200);
    assert.equal(everyone.json.length, 5, 'Host/Owner keeps platform-wide visibility');

    const uk = (await app.call('GET', '/api/admin/sessions?tenantId=pw-uk', ops)).json[0];
    assert.equal(uk.id, UK_SESSION);
    assert.equal(uk.status, 'bot_replied');
    assert.equal(uk.needsAttention, true, 'existing unanswered tenant messages stay visible');
  } finally {
    if (savedEnabled === undefined) delete process.env.RRB_SILVER_CAMPAIGN_ENABLED;
    else process.env.RRB_SILVER_CAMPAIGN_ENABLED = savedEnabled;
    if (savedOrigins === undefined) delete process.env.RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS;
    else process.env.RRB_SILVER_CAMPAIGN_ALLOWED_ORIGINS = savedOrigins;
    await app.close();
  }
});

test('needsAttention clears after an authorised reply or resolution and returns for a new visitor message', async () => {
  const app = await startAdminApp();
  try {
    const sessionAttention = async (tenantId: string, sessionId: string) => {
      const listed = await app.call('GET', `/api/admin/sessions?tenantId=${tenantId}`, ops);
      assert.equal(listed.status, 200);
      const session = listed.json.find((row: { id: string }) => row.id === sessionId);
      assert.ok(session, sessionId);
      return session as { id: string; status: string; needsAttention: boolean };
    };

    assert.equal((await sessionAttention('pw-uk', UK_SESSION)).needsAttention, true);

    const note = await app.call('POST', '/api/chat?tenantId=pw-uk', {
      ...ops,
      body: { sessionId: UK_SESSION, sender: 'admin', text: 'internal only', isInternalNote: true },
    });
    assert.equal(note.status, 201);
    assert.equal((await sessionAttention('pw-uk', UK_SESSION)).needsAttention, true, 'an internal note does not clear attention');

    const reply = await app.call('POST', '/api/chat?tenantId=pw-uk', {
      ...ops,
      body: { sessionId: UK_SESSION, sender: 'admin', text: 'We can help with that' },
    });
    assert.equal(reply.status, 201);
    const cleared = await sessionAttention('pw-uk', UK_SESSION);
    assert.equal(cleared.status, 'admin_replied');
    assert.equal(cleared.needsAttention, false, 'an authorised human reply clears attention');
    assert.equal(app.db.messages.find((message) => message.id === 1)!.answered, true);

    app.db.messages.push({
      id: 900,
      sessionId: UK_SESSION,
      sender: 'user',
      text: 'One more question',
      isInternalNote: false,
      answered: false,
      replyToId: null,
      timestamp: new Date(),
    });
    await advanceConversationStatus(app.db.conversations, UK_SESSION, 'admin_needed');
    await advanceConversationStatus(app.db.conversations, UK_SESSION, 'bot_replied');
    const returned = await sessionAttention('pw-uk', UK_SESSION);
    assert.equal(returned.status, 'bot_replied');
    assert.equal(returned.needsAttention, true, 'a new unanswered visitor message returns attention');

    const infotechBefore = await sessionAttention('pw-infotech', INFOTECH_SESSION);
    assert.equal(infotechBefore.needsAttention, true);
    const resolved = await resolveConversation(app.db.conversations, {
      session: (await app.db.conversations.findSession(INFOTECH_SESSION))!,
    });
    assert.equal(resolved.toStatus, 'closed');
    const resolvedRow = await sessionAttention('pw-infotech', INFOTECH_SESSION);
    assert.equal(resolvedRow.status, 'closed');
    assert.equal(resolvedRow.needsAttention, false, 'resolution clears attention');
    assert.equal(app.db.messages.find((message) => message.id === 2)!.answered, false, 'resolution does not rewrite the visitor message');

    app.db.messages.push({
      id: 901,
      sessionId: INFOTECH_SESSION,
      sender: 'user',
      text: 'Still here',
      isInternalNote: false,
      answered: false,
      replyToId: null,
      timestamp: new Date(),
    });
    await advanceConversationStatus(app.db.conversations, INFOTECH_SESSION, 'bot_replied');
    const stillClosed = await sessionAttention('pw-infotech', INFOTECH_SESSION);
    assert.equal(stillClosed.status, 'closed');
    assert.equal(stillClosed.needsAttention, false, 'a closed conversation stays out of the queue');
  } finally {
    await app.close();
  }
});

test('entitlement reply failures are named for the operator and other failures stay quiet', async () => {
  assert.equal(
    describeAdminReplyEntitlementFailure(403, { error: 'Chat is not enabled for this tenant.', code: 'chat_not_entitled' }),
    'Chat is not enabled for this tenant.',
  );
  assert.equal(
    describeAdminReplyEntitlementFailure(403, { error: 'This chat is outside the selected platform entity.', code: 'tenant_scope_mismatch' }),
    null,
  );
  assert.equal(
    describeAdminReplyEntitlementFailure(503, { error: 'Chat is temporarily unavailable.', code: 'chat_service_unavailable' }),
    'Chat is temporarily unavailable.',
  );
  assert.equal(
    describeAdminReplyEntitlementFailure(503, { error: 'Chat is temporarily unavailable', unavailable: true }),
    'Chat is temporarily unavailable',
  );
  assert.equal(describeAdminReplyEntitlementFailure(403, { code: 'chat_not_entitled' }), 'Chat is not enabled for this tenant.');
  assert.equal(describeAdminReplyEntitlementFailure(500, { error: 'Admin chat request failed' }), null);
  const unread = await readAdminReplyEntitlementFailure({
    ok: false,
    status: 403,
    json: async () => { throw new Error('not json'); },
  });
  assert.equal(unread, null, 'an unreadable 403 is not labelled as an entitlement denial');
  const unavailable = await readAdminReplyEntitlementFailure({
    ok: false,
    status: 503,
    json: async () => { throw new Error('not json'); },
  });
  assert.equal(unavailable, 'Chat is temporarily unavailable.');

  const panel = read('src/components/AdminPanel.tsx');
  const replyFn = panel.slice(panel.indexOf('const handleAdminReply'), panel.indexOf('const sendInternalNote'));
  const success = replyFn.slice(replyFn.indexOf('if (res.ok)'), replyFn.indexOf('const notice'));
  assert.match(success, /setReplyText\(''\)/);
  assert.match(replyFn, /readAdminReplyEntitlementFailure\(res\)/);
  assert.doesNotMatch(replyFn.slice(replyFn.indexOf('} catch')), /setReplyText|setAdminReplyAttachments\(\[\]\)/);
  const mobile = read('src/components/AdminMobileChat.tsx');
  const mobileReply = mobile.slice(mobile.indexOf('const sendReply'), mobile.indexOf('const updateStatus'));
  assert.match(mobileReply.slice(mobileReply.indexOf('if (res.ok)'), mobileReply.indexOf('const notice')), /setReplyText\(''\)/);
  assert.match(mobileReply, /readAdminReplyEntitlementFailure\(res\)/);
});

test('tenant options stay behind admin auth and acknowledgements do not create a second alert', () => {
  assert.match(server, /app\.get\('\/api\/admin\/tenant-options', requireAdmin, createAdminTenantOptionsHandler\(\)\)/);
  const respond = routeSource("app.post('/api/chat/respond'");
  assert.match(respond, /visitorMessageIsAnsweredByTenantBot\(botReply\)/);
  assert.match(respond, /autoUpdateConversationStatus\(sessionId, 'bot_replied'\)/);
  assert.doesNotMatch(respond, /chatAlert\.create/);
});
