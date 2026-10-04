import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';
import {
  ADMIN_ORIGIN_REJECTED_CODE,
  createAdminRequestOriginMiddleware,
  evaluateAdminRequestOrigin,
  getAdminAllowedOrigins,
  isAdminStateChangingRequest,
  type AdminOriginPolicy,
} from './adminRequestOrigin.ts';

const productionPolicy: AdminOriginPolicy = {
  allowedOrigins: getAdminAllowedOrigins({ siteUrl: 'https://uk.primewayz.com' }),
  allowLocalDevelopment: false,
};
const developmentPolicy: AdminOriginPolicy = {
  allowedOrigins: getAdminAllowedOrigins({ siteUrl: 'http://localhost:3000' }),
  allowLocalDevelopment: true,
};

test('allowed admin origins come from the pw-uk registry entry plus SITE_URL only', () => {
  assert.deepEqual(productionPolicy.allowedOrigins, ['https://uk.primewayz.com']);
  assert.deepEqual(developmentPolicy.allowedOrigins, ['https://uk.primewayz.com', 'http://localhost:3000']);
  assert.deepEqual(getAdminAllowedOrigins({ siteUrl: 'not a url' }), ['https://uk.primewayz.com']);
});

test('state-changing admin scope: POST /api/chat and non-safe /api/admin/* only', () => {
  assert.equal(isAdminStateChangingRequest('POST', '/api/chat'), true);
  assert.equal(isAdminStateChangingRequest('POST', '/api/chat/'), true);
  assert.equal(isAdminStateChangingRequest('POST', '/API/Chat'), true, 'Express routing is case-insensitive');
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    assert.equal(isAdminStateChangingRequest(method, '/api/admin/sessions/abc/status'), true, method);
  }
  assert.equal(isAdminStateChangingRequest('GET', '/api/admin/chats'), false);
  assert.equal(isAdminStateChangingRequest('GET', '/api/chat/abc'), false);
  assert.equal(isAdminStateChangingRequest('OPTIONS', '/api/admin/chats'), false);
  for (const visitorPath of ['/api/chat/respond', '/api/chat/session', '/api/chat/heartbeat', '/api/chat/appointments']) {
    assert.equal(isAdminStateChangingRequest('POST', visitorPath), false, visitorPath);
  }
  assert.equal(isAdminStateChangingRequest('POST', '/api/administrator'), false);
});

test('legitimate UK admin Origin is accepted; other Primewayz properties are rejected', () => {
  assert.deepEqual(evaluateAdminRequestOrigin({ origin: 'https://uk.primewayz.com' }, productionPolicy), { allowed: true, via: 'origin' });
  for (const origin of [
    'https://primewayz.com',
    'https://www.primewayz.com',
    'https://evil.example',
    'http://uk.primewayz.com',
    'https://uk.primewayz.com.evil.example',
    'null',
  ]) {
    assert.equal(evaluateAdminRequestOrigin({ origin }, productionPolicy).allowed, false, origin);
  }
});

test('Origin wins over other headers: a trusted Referer cannot rescue an untrusted Origin', () => {
  const decision = evaluateAdminRequestOrigin(
    { origin: 'https://primewayz.com', secFetchSite: 'same-origin', referer: 'https://uk.primewayz.com/admin' },
    productionPolicy,
  );
  assert.equal(decision.allowed, false);
});

test('local development origins are allowed only when local development is enabled', () => {
  for (const origin of ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000']) {
    assert.equal(evaluateAdminRequestOrigin({ origin }, developmentPolicy).allowed, true, origin);
    assert.equal(evaluateAdminRequestOrigin({ origin }, productionPolicy).allowed, false, origin);
  }
});

test('missing Origin: Sec-Fetch-Site decides when present', () => {
  assert.equal(evaluateAdminRequestOrigin({ secFetchSite: 'same-origin' }, productionPolicy).allowed, true);
  assert.equal(evaluateAdminRequestOrigin({ secFetchSite: 'none' }, productionPolicy).allowed, true);
  assert.equal(evaluateAdminRequestOrigin({ secFetchSite: 'same-site' }, productionPolicy).allowed, false);
  assert.equal(evaluateAdminRequestOrigin({ secFetchSite: 'cross-site' }, productionPolicy).allowed, false);
});

test('missing Origin and Sec-Fetch-Site: Referer must be trusted when present', () => {
  assert.equal(evaluateAdminRequestOrigin({ referer: 'https://uk.primewayz.com/admin' }, productionPolicy).allowed, true);
  assert.equal(evaluateAdminRequestOrigin({ referer: 'https://primewayz.com/contact' }, productionPolicy).allowed, false);
});

test('no browser provenance headers at all is treated as a non-browser client (still needs requireAdmin)', () => {
  assert.deepEqual(evaluateAdminRequestOrigin({}, productionPolicy), { allowed: true, via: 'non-browser' });
});

// --- HTTP round-trip through the real middleware ---

function startApp(policy: AdminOriginPolicy): Promise<{ port: number; close: () => Promise<void> }> {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(createAdminRequestOriginMiddleware(policy));
  app.post('/api/chat', (_req, res) => res.status(201).json({ ok: true }));
  app.post('/api/chat/respond', (_req, res) => res.json({ ok: true }));
  app.patch('/api/admin/sessions/:id/status', (_req, res) => res.json({ ok: true }));
  app.delete('/api/admin/forms/:id', (_req, res) => res.json({ ok: true }));
  app.get('/api/admin/chats', (_req, res) => res.json([]));
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        port: (server.address() as AddressInfo).port,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

function send(
  port: number,
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

test('HTTP: UK admin origin succeeds; primewayz.com form/fetch writes are rejected with 403', async () => {
  const { port, close } = await startApp(productionPolicy);
  try {
    const json = { 'Content-Type': 'application/json' };
    assert.equal((await send(port, 'POST', '/api/chat', { ...json, Origin: 'https://uk.primewayz.com' }, '{}')).status, 201);
    assert.equal((await send(port, 'PATCH', '/api/admin/sessions/s1/status', { ...json, Origin: 'https://uk.primewayz.com' }, '{}')).status, 200);

    const formPost = await send(
      port,
      'POST',
      '/api/chat',
      { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://primewayz.com' },
      'sender=admin&sessionId=s1&text=hi',
    );
    assert.equal(formPost.status, 403);
    assert.equal(JSON.parse(formPost.body).code, ADMIN_ORIGIN_REJECTED_CODE);
    assert.equal((await send(port, 'DELETE', '/api/admin/forms/1', { Origin: 'https://www.primewayz.com' })).status, 403);
    assert.equal((await send(port, 'PATCH', '/api/admin/sessions/s1/status', { ...json, 'Sec-Fetch-Site': 'same-site' }, '{}')).status, 403);
  } finally {
    await close();
  }
});

test('HTTP: missing Origin follows the documented fallback; reads and visitor routes are untouched', async () => {
  const { port, close } = await startApp(productionPolicy);
  try {
    assert.equal((await send(port, 'POST', '/api/chat', { 'Sec-Fetch-Site': 'same-origin' })).status, 201);
    assert.equal((await send(port, 'POST', '/api/chat')).status, 201, 'non-browser client without provenance headers');
    assert.equal((await send(port, 'GET', '/api/admin/chats', { Origin: 'https://primewayz.com' })).status, 200);
    assert.equal(
      (await send(port, 'POST', '/api/chat/respond', { Origin: 'https://primewayz.com' })).status,
      200,
      'visitor chat is governed by public chat CORS, not the admin guard',
    );
  } finally {
    await close();
  }
});
