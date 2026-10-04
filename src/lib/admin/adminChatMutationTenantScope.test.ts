import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import test from 'node:test';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createAdminChatMutationHandlers, type AdminChatMutationStore } from './adminChatMutationRoutes.ts';

// --- In-memory model: sessions, messages, alerts and appointment requests across tenants ---

type SessionRow = { id: string; tenantId: string | null; status: string; closedAt: Date | null; closedById: number | null };
type MessageRow = { id: number; sessionId: string; sender: string; text: string; deletedAt: Date | null; deletedBy: number | null; editedAt: Date | null };
type AlertRow = { id: number; sessionId: string; status: string };
type AppointmentRow = { id: number; sessionId: string; status: string; adminNote: string | null };

const UK = 'uk-session';
const INFOTECH = 'infotech-session';
const RRB = 'rrb-session';
const LEGACY = 'legacy-session';
const INACTIVE = 'pwus-session';

function createDb() {
  const sessions = new Map<string, SessionRow>(
    [
      [UK, 'pw-uk'],
      [INFOTECH, 'pw-infotech'],
      [RRB, 'rrb'],
      [LEGACY, null],
      [INACTIVE, 'pw-us'],
    ].map(([id, tenantId]) => [id as string, { id: id as string, tenantId, status: 'bot_replied', closedAt: null, closedById: null }]),
  );
  const ids: Record<string, number> = { [UK]: 1, [INFOTECH]: 2, [RRB]: 3, [LEGACY]: 4, [INACTIVE]: 5 };
  const messages = new Map<number, MessageRow>();
  const alerts = new Map<number, AlertRow>();
  const appointments = new Map<number, AppointmentRow>();
  for (const [sessionId, n] of Object.entries(ids)) {
    messages.set(n, { id: n, sessionId, sender: 'admin', text: `admin ${sessionId}`, deletedAt: null, deletedBy: null, editedAt: null });
    messages.set(100 + n, { id: 100 + n, sessionId, sender: 'user', text: `visitor ${sessionId}`, deletedAt: null, deletedBy: null, editedAt: null });
    alerts.set(n, { id: n, sessionId, status: 'logged' });
    appointments.set(n, { id: n, sessionId, status: 'pending', adminNote: null });
  }
  alerts.set(99, { id: 99, sessionId: 'orphaned-session', status: 'logged' });

  const store: AdminChatMutationStore = {
    async findSessionOwnership(sessionId) {
      const session = sessions.get(sessionId);
      return session ? { id: session.id, tenantId: session.tenantId } : null;
    },
    async setSessionStatus(sessionId, data) {
      const session = sessions.get(sessionId)!;
      Object.assign(session, data);
      return { ...session };
    },
    async findMessage(id) {
      const message = messages.get(id);
      return message ? { id: message.id, sessionId: message.sessionId, sender: message.sender, deletedAt: message.deletedAt } : null;
    },
    async editMessage(id, text) {
      const message = messages.get(id)!;
      Object.assign(message, { text, editedAt: new Date() });
      return { ...message };
    },
    async softDeleteMessage(id, deletedBy) {
      const message = messages.get(id)!;
      Object.assign(message, { deletedAt: new Date(), deletedBy });
      return { ...message };
    },
    async findAlert(id) {
      const alert = alerts.get(id);
      return alert ? { id: alert.id, sessionId: alert.sessionId } : null;
    },
    async updateAlertStatus(id, status) {
      const alert = alerts.get(id)!;
      alert.status = status;
      return { ...alert };
    },
    async findAppointment(id) {
      const appointment = appointments.get(id);
      return appointment ? { id: appointment.id, sessionId: appointment.sessionId } : null;
    },
    async updateAppointment(id, data) {
      const appointment = appointments.get(id)!;
      if (data.status !== undefined) appointment.status = data.status;
      if (data.adminNote !== undefined) appointment.adminNote = data.adminNote;
      return { ...appointment };
    },
  };

  return { sessions, messages, alerts, appointments, ids, store };
}

// --- Test app mirroring the server.ts wiring (auth middleware faked) ---

type TestAdminRequest = Request & { adminUser?: { id: number; role: string } };

function fakeRequireAdmin(req: TestAdminRequest, res: Response, next: NextFunction) {
  if (!(req.get('cookie') ?? '').includes('primewayz_admin_token=ops')) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  req.adminUser = { id: 7, role: 'editor' };
  return next();
}

async function startApp() {
  const db = createDb();
  const handlers = createAdminChatMutationHandlers({
    store: db.store,
    isDatabaseUnavailableError: () => false,
    logUnavailable: () => undefined,
  });
  const app = express();
  app.use(express.json());
  app.patch('/api/admin/sessions/:sessionId/status', fakeRequireAdmin, handlers.updateSessionStatus);
  app.patch('/api/admin/chat/messages/:id', fakeRequireAdmin, handlers.editMessage);
  app.delete('/api/admin/chat/messages/:id', fakeRequireAdmin, handlers.deleteMessage);
  app.patch('/api/admin/chat-alerts/:id/status', fakeRequireAdmin, handlers.updateAlertStatus);
  app.patch('/api/admin/chat/appointments/:id', fakeRequireAdmin, handlers.updateAppointment);

  const server = await new Promise<http.Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });
  const port = (server.address() as AddressInfo).port;

  const call = (method: string, urlPath: string, body?: unknown, cookie = 'primewayz_admin_token=ops') =>
    new Promise<{ status: number; json: any }>((resolve, reject) => {
      const headers: Record<string, string> = { Cookie: cookie };
      const payload = body === undefined ? undefined : JSON.stringify(body);
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

const snapshot = (db: ReturnType<typeof createDb>) =>
  JSON.stringify({
    sessions: [...db.sessions.values()],
    messages: [...db.messages.values()],
    alerts: [...db.alerts.values()],
    appointments: [...db.appointments.values()],
  });

// --- Status mutation ---

test('status: in-scope change succeeds with unchanged response shape and closedAt / closedById rules', async () => {
  const app = await startApp();
  try {
    const closed = await app.call('PATCH', `/api/admin/sessions/${INFOTECH}/status?tenantId=pw-infotech`, { status: 'closed' });
    assert.equal(closed.status, 200);
    assert.equal(closed.json.id, INFOTECH);
    assert.equal(closed.json.status, 'closed');
    assert.equal(closed.json.closedById, 7);
    assert.ok(closed.json.closedAt);
    const reopened = await app.call('PATCH', `/api/admin/sessions/${INFOTECH}/status?tenantId=all`, { status: 'follow_up_due' });
    assert.equal(reopened.status, 200);
    assert.equal(reopened.json.closedAt, null);
    assert.equal(reopened.json.closedById, null);
    const uk = await app.call('PATCH', `/api/admin/sessions/${UK}/status`, { status: 'lead_qualified' });
    assert.equal(uk.status, 200, 'no tenantId query keeps the existing pw-uk default scope');
  } finally {
    await app.close();
  }
});

test('status: cross-tenant, legacy-outside-All, inactive-tenant and unknown sessions are blocked before any write', async () => {
  const app = await startApp();
  try {
    const before = snapshot(app.db);
    const cases: Array<[string, string, number]> = [
      [INFOTECH, 'pw-uk', 403],
      [UK, 'pw-infotech', 403],
      [RRB, 'pw-infotech', 403],
      [INFOTECH, '', 403],
      [LEGACY, 'pw-uk', 403],
      [INACTIVE, 'all', 403],
      ['does-not-exist', 'all', 404],
    ];
    for (const [sessionId, tenant, expected] of cases) {
      const query = tenant ? `?tenantId=${tenant}` : '';
      const res = await app.call('PATCH', `/api/admin/sessions/${sessionId}/status${query}`, { status: 'closed' });
      assert.equal(res.status, expected, `${sessionId} under ${tenant || 'default'}`);
    }
    assert.equal((await app.call('PATCH', `/api/admin/sessions/${UK}/status?tenantId=pw-us`, { status: 'closed' })).status, 400);
    assert.equal((await app.call('PATCH', `/api/admin/sessions/${UK}/status?tenantId=pw-uk`, { status: 'archived' })).status, 400);
    assert.equal(snapshot(app.db), before);
    assert.equal((await app.call('PATCH', `/api/admin/sessions/${LEGACY}/status?tenantId=all`, { status: 'closed' })).status, 200, 'legacy rows only under All entities');
  } finally {
    await app.close();
  }
});

// --- Message edit / delete ---

test('message edit / delete: in-scope admin messages succeed; existing message rules still apply', async () => {
  const app = await startApp();
  try {
    const id = app.db.ids[INFOTECH];
    const edited = await app.call('PATCH', `/api/admin/chat/messages/${id}?tenantId=pw-infotech`, { text: '  fixed  ' });
    assert.equal(edited.status, 200);
    assert.equal(edited.json.text, 'fixed');
    assert.ok(edited.json.editedAt);
    assert.equal((await app.call('PATCH', `/api/admin/chat/messages/${100 + id}?tenantId=pw-infotech`, { text: 'x' })).status, 400, 'visitor messages are not editable');
    assert.equal((await app.call('PATCH', `/api/admin/chat/messages/${id}?tenantId=pw-infotech`, { text: '   ' })).status, 400);
    const deleted = await app.call('DELETE', `/api/admin/chat/messages/${id}?tenantId=all`);
    assert.equal(deleted.status, 200);
    assert.equal(deleted.json.deletedBy, 7);
    assert.equal((await app.call('PATCH', `/api/admin/chat/messages/${id}?tenantId=pw-infotech`, { text: 'again' })).status, 400, 'deleted messages cannot be edited');
    assert.equal((await app.call('PATCH', '/api/admin/chat/messages/abc?tenantId=all', { text: 'x' })).status, 400);
    assert.equal((await app.call('DELETE', '/api/admin/chat/messages/9999?tenantId=all')).status, 404);
  } finally {
    await app.close();
  }
});

test('message edit / delete: cross-tenant messages are blocked and left untouched', async () => {
  const app = await startApp();
  try {
    const before = snapshot(app.db);
    for (const [sessionId, tenant] of [[INFOTECH, 'pw-uk'], [UK, 'pw-infotech'], [RRB, 'pw-uk'], [LEGACY, 'pw-uk'], [INACTIVE, 'all']]) {
      const id = app.db.ids[sessionId];
      const edit = await app.call('PATCH', `/api/admin/chat/messages/${id}?tenantId=${tenant}`, { text: 'hijack' });
      assert.equal(edit.status, 403, `edit ${sessionId} under ${tenant}`);
      const remove = await app.call('DELETE', `/api/admin/chat/messages/${id}?tenantId=${tenant}`);
      assert.equal(remove.status, 403, `delete ${sessionId} under ${tenant}`);
    }
    const defaultScope = await app.call('DELETE', `/api/admin/chat/messages/${app.db.ids[INFOTECH]}`);
    assert.equal(defaultScope.status, 403, 'missing tenantId uses the pw-uk default, never All entities');
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

// --- Chat alert status ---

test('alert status: in-scope update succeeds; cross-tenant, orphaned and unknown alerts are blocked', async () => {
  const app = await startApp();
  try {
    const ok = await app.call('PATCH', `/api/admin/chat-alerts/${app.db.ids[INFOTECH]}/status?tenantId=pw-infotech`, { status: 'resolved' });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.status, 'resolved');
    const defaulted = await app.call('PATCH', `/api/admin/chat-alerts/${app.db.ids[UK]}/status?tenantId=pw-uk`, {});
    assert.equal(defaulted.json.status, 'reviewed', 'default status is unchanged');

    const before = snapshot(app.db);
    for (const [sessionId, tenant] of [[INFOTECH, 'pw-uk'], [UK, 'pw-infotech'], [RRB, 'pw-infotech'], [LEGACY, 'pw-uk']]) {
      const res = await app.call('PATCH', `/api/admin/chat-alerts/${app.db.ids[sessionId]}/status?tenantId=${tenant}`, { status: 'resolved' });
      assert.equal(res.status, 403, `${sessionId} under ${tenant}`);
    }
    assert.equal((await app.call('PATCH', '/api/admin/chat-alerts/99/status?tenantId=all', { status: 'resolved' })).status, 404);
    assert.equal((await app.call('PATCH', '/api/admin/chat-alerts/12345/status?tenantId=all', { status: 'resolved' })).status, 404);
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

// --- Appointment request updates ---

test('appointment update: in-scope update succeeds; cross-tenant and unknown appointments are blocked', async () => {
  const app = await startApp();
  try {
    const ok = await app.call('PATCH', `/api/admin/chat/appointments/${app.db.ids[INFOTECH]}?tenantId=pw-infotech`, { status: 'confirmed', adminNote: 'Call Tue' });
    assert.equal(ok.status, 200);
    assert.deepEqual([ok.json.status, ok.json.adminNote], ['confirmed', 'Call Tue']);

    const before = snapshot(app.db);
    for (const [sessionId, tenant] of [[INFOTECH, 'pw-uk'], [UK, 'pw-infotech'], [RRB, 'pw-uk'], [LEGACY, 'pw-infotech'], [INACTIVE, 'all']]) {
      const res = await app.call('PATCH', `/api/admin/chat/appointments/${app.db.ids[sessionId]}?tenantId=${tenant}`, { status: 'cancelled' });
      assert.equal(res.status, 403, `${sessionId} under ${tenant}`);
    }
    assert.equal((await app.call('PATCH', '/api/admin/chat/appointments/777?tenantId=all', { status: 'cancelled' })).status, 404);
    assert.equal((await app.call('PATCH', '/api/admin/chat/appointments/x?tenantId=all', { status: 'cancelled' })).status, 400);
    assert.equal(snapshot(app.db), before);
  } finally {
    await app.close();
  }
});

test('mutations still require an authenticated admin', async () => {
  const app = await startApp();
  try {
    assert.equal((await app.call('PATCH', `/api/admin/sessions/${UK}/status?tenantId=pw-uk`, { status: 'closed' }, '')).status, 401);
    assert.equal((await app.call('DELETE', `/api/admin/chat/messages/${app.db.ids[UK]}?tenantId=pw-uk`, undefined, '')).status, 401);
  } finally {
    await app.close();
  }
});

// --- server.ts / Admin UI wiring ---

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');

test('server mounts every chat mutation through the tenant-checked handlers behind admin auth', () => {
  const server = read('server.ts');
  for (const [method, route, handler] of [
    ['patch', '/api/admin/sessions/:sessionId/status', 'updateSessionStatus'],
    ['patch', '/api/admin/chat/messages/:id', 'editMessage'],
    ['delete', '/api/admin/chat/messages/:id', 'deleteMessage'],
    ['patch', '/api/admin/chat-alerts/:id/status', 'updateAlertStatus'],
    ['patch', '/api/admin/chat/appointments/:id', 'updateAppointment'],
  ]) {
    const line = `app.${method}('${route}', requireAdmin, requireRole(isOperationsRole), adminChatMutationHandlers.${handler});`;
    assert.ok(server.includes(line), line);
  }
  assert.doesNotMatch(server, /prisma\.chatAlert\.update\(\{ where: \{ id \}, data: \{ status \} \}\);\s*res\.json/);
});

test('Admin UIs send the selected tenant filter with every chat mutation', () => {
  const panel = read('src/components/AdminPanel.tsx');
  for (const marker of [
    'adminRequest(adminTenantPath(`/api/admin/sessions/${sessionId}/status`)',
    'adminRequest(adminTenantPath(`/api/admin/chat/messages/${messageId}`)',
    'adminRequest(adminTenantPath(`/api/admin/chat/messages/${pendingDeleteMessageId}`)',
    'adminRequest(adminTenantPath(`/api/admin/chat-alerts/${alertId}/status`)',
    'fetch(adminTenantQuery(`/api/admin/chat/appointments/${id}`)',
  ]) {
    assert.ok(panel.includes(marker), marker);
  }
  assert.ok(read('src/components/AdminMobileChat.tsx').includes('adminRequest(tenantQuery(`/api/admin/sessions/${selectedSessionId}/status`)'));
});
