import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveSourceContext, SourceResolutionError } from '../platform/sourceResolver.ts';
import {
  applyPublicChatApiCors,
  getPublicChatAllowedOrigins,
  isPublicChatCorsPath,
  isPublicChatOriginAllowed,
  publicChatApiCorsMiddleware,
} from './publicChatApiCors.ts';

function mockReq(partial: { method?: string; path?: string; origin?: string }) {
  return {
    method: partial.method ?? 'GET',
    path: partial.path ?? '/api/chat/availability',
    get(name: string) {
      if (name.toLowerCase() === 'origin') return partial.origin;
      return undefined;
    },
  };
}

function mockRes() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let ended = false;
  let jsonBody: unknown;
  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get ended() {
      return ended;
    },
    get jsonBody() {
      return jsonBody;
    },
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      jsonBody = body;
      return this;
    },
    end() {
      ended = true;
      return this;
    },
  };
}

test('public Chat allowed origins come from active tenant registry', () => {
  const origins = getPublicChatAllowedOrigins();
  assert.ok(origins.includes('https://primewayz.com'));
  assert.ok(origins.includes('https://www.primewayz.com'));
  assert.ok(origins.includes('https://uk.primewayz.com'));
  assert.ok(origins.includes('https://rentreadbuy.com'));
  assert.ok(origins.includes('https://www.rentreadbuy.com'));
  assert.equal(origins.includes('https://us.primewayz.com'), false);
});

test('rentreadbuy.com Chat preflight is allowed', () => {
  const req = mockReq({ method: 'OPTIONS', path: '/api/chat/session', origin: 'https://rentreadbuy.com' });
  const res = mockRes();
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    assert.fail('should not continue after preflight');
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://rentreadbuy.com');
});

test('www.rentreadbuy.com Chat preflight is allowed', () => {
  const req = mockReq({ method: 'OPTIONS', path: '/api/chat/respond', origin: 'https://www.rentreadbuy.com' });
  const res = mockRes();
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    assert.fail('should not continue after preflight');
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://www.rentreadbuy.com');
});

test('primewayz.com Chat preflight is allowed', () => {
  const req = mockReq({ method: 'OPTIONS', path: '/api/chat/session', origin: 'https://primewayz.com' });
  const res = mockRes();
  let nextCalled = false;
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 204);
  assert.equal(res.ended, true);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://primewayz.com');
  assert.equal(res.headers.get('Vary'), 'Origin');
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
  assert.equal(res.headers.get('Access-Control-Allow-Headers'), 'Content-Type');
  assert.equal(res.headers.get('Access-Control-Max-Age'), '86400');
});

test('www.primewayz.com Chat preflight is allowed', () => {
  const req = mockReq({ method: 'OPTIONS', path: '/api/chat/respond', origin: 'https://www.primewayz.com' });
  const res = mockRes();
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    assert.fail('should not continue after preflight');
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://www.primewayz.com');
});

test('uk.primewayz.com Chat preflight is allowed', () => {
  const req = mockReq({ method: 'OPTIONS', path: '/api/chat/appointments', origin: 'https://uk.primewayz.com' });
  const res = mockRes();
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    assert.fail('should not continue after preflight');
  });
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://uk.primewayz.com');
});

test('unknown browser origin is rejected for Chat CORS', () => {
  assert.equal(isPublicChatOriginAllowed('https://evil.example'), false);
  const req = mockReq({ method: 'OPTIONS', path: '/api/chat/session', origin: 'https://evil.example' });
  const res = mockRes();
  let nextCalled = false;
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(res.headers.has('Access-Control-Allow-Origin'), false);
});

test('allowed GET response includes CORS headers', () => {
  const req = mockReq({ method: 'GET', path: '/api/chat/availability', origin: 'https://primewayz.com' });
  const res = mockRes();
  assert.equal(applyPublicChatApiCors(req as never, res), true);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://primewayz.com');
  assert.equal(res.headers.get('Vary'), 'Origin');
});

test('allowed POST response includes CORS headers', () => {
  const req = mockReq({ method: 'POST', path: '/api/chat/session', origin: 'https://primewayz.com' });
  const res = mockRes();
  let nextCalled = false;
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), 'https://primewayz.com');
  assert.equal(res.headers.get('Vary'), 'Origin');
});

test('source resolution still maps primewayz.com to pw-infotech', () => {
  const resolved = resolveSourceContext({ origin: 'https://primewayz.com', sourceChannel: 'chat' });
  assert.equal(resolved.tenantId, 'pw-infotech');
  assert.equal(resolved.market, 'IN');
  assert.equal(resolved.sourceSite, 'primewayz.com');
});

test('spoofed tenant body is still rejected', () => {
  assert.throws(
    () => resolveSourceContext({
      origin: 'https://primewayz.com',
      sourceChannel: 'chat',
      body: { sessionId: 's1', tenantId: 'pw-uk', market: 'UK' },
    }),
    /controlled by the server/,
  );
  assert.throws(
    () => resolveSourceContext({
      origin: 'https://primewayz.com',
      sourceChannel: 'chat',
      body: { tenantId: 'pw-uk' },
    }),
    SourceResolutionError,
  );
});

test('admin APIs are outside public Chat CORS scope', () => {
  assert.equal(isPublicChatCorsPath('/api/admin/chats'), false);
  assert.equal(isPublicChatCorsPath('/api/admin/chat/availability'), false);
  assert.equal(isPublicChatCorsPath('/api/admin/chat/appointments'), false);
  assert.equal(isPublicChatCorsPath('/api/admin/login'), false);
  assert.equal(isPublicChatCorsPath('/api/v1/website-audits'), false);

  const req = mockReq({ method: 'OPTIONS', path: '/api/admin/chats', origin: 'https://primewayz.com' });
  const res = mockRes();
  let nextCalled = false;
  publicChatApiCorsMiddleware(req as never, res as never, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(res.headers.has('Access-Control-Allow-Origin'), false);
  assert.equal(res.statusCode, 200);
});

test('requests without Origin continue without ACAO', () => {
  assert.equal(isPublicChatOriginAllowed(undefined), true);
  const req = mockReq({ method: 'GET', path: '/api/chat/availability' });
  const res = mockRes();
  assert.equal(applyPublicChatApiCors(req as never, res), true);
  assert.equal(res.headers.has('Access-Control-Allow-Origin'), false);
  assert.equal(res.headers.get('Access-Control-Allow-Methods'), 'GET, POST, OPTIONS');
});

test('visitor Chat paths are covered for CORS', () => {
  for (const path of [
    '/api/chat',
    '/api/chat/availability',
    '/api/chat/session',
    '/api/chat/heartbeat',
    '/api/chat/respond',
    '/api/chat/uploads',
    '/api/chat/appointments',
    '/api/chat/visitor-session-abc',
  ]) {
    assert.equal(isPublicChatCorsPath(path), true, path);
  }
});
