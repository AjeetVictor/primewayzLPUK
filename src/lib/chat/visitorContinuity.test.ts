import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  resolveVisitStartedAt,
  VISITOR_VISIT_INACTIVITY_MS,
} from './visitorIntelligence.ts';

import {
  resolveApproximateVisitorLocation,
} from './visitorGeo.ts';

test('visit lifecycle: missing start initializes to now', () => {
  const now = new Date('2026-10-05T10:00:00.000Z');

  const result = resolveVisitStartedAt({
    previousVisitStartedAt: null,
    previousLastSeenAt: null,
    now,
  });

  assert.equal(result.toISOString(), now.toISOString());
});

test('visit lifecycle: exactly 30 minutes preserves the existing visit', () => {
  const start = new Date('2026-10-05T09:00:00.000Z');
  const now = new Date('2026-10-05T10:00:00.000Z');
  const previousSeen = new Date(
    now.getTime() - VISITOR_VISIT_INACTIVITY_MS,
  );

  const result = resolveVisitStartedAt({
    previousVisitStartedAt: start,
    previousLastSeenAt: previousSeen,
    now,
  });

  assert.equal(result.toISOString(), start.toISOString());
});

test('visit lifecycle: more than 30 minutes starts a new visit', () => {
  const start = new Date('2026-10-05T09:00:00.000Z');
  const now = new Date('2026-10-05T10:00:00.000Z');
  const previousSeen = new Date(
    now.getTime() - VISITOR_VISIT_INACTIVITY_MS - 1,
  );

  const result = resolveVisitStartedAt({
    previousVisitStartedAt: start,
    previousLastSeenAt: previousSeen,
    now,
  });

  assert.equal(result.toISOString(), now.toISOString());
});

test('visit lifecycle: missing last-seen preserves an existing visit start', () => {
  const start = new Date('2026-10-05T09:00:00.000Z');
  const now = new Date('2026-10-05T10:00:00.000Z');

  const result = resolveVisitStartedAt({
    previousVisitStartedAt: start,
    previousLastSeenAt: null,
    now,
  });

  assert.equal(result.toISOString(), start.toISOString());
});

test('GeoIP: invalid, loopback and private addresses fail open', () => {
  assert.equal(resolveApproximateVisitorLocation(null), null);
  assert.equal(resolveApproximateVisitorLocation(''), null);
  assert.equal(resolveApproximateVisitorLocation('not-an-ip'), null);
  assert.equal(resolveApproximateVisitorLocation('127.0.0.1'), null);
  assert.equal(resolveApproximateVisitorLocation('::1'), null);
  assert.equal(resolveApproximateVisitorLocation('::ffff:127.0.0.1'), null);
  assert.equal(resolveApproximateVisitorLocation('10.10.10.10'), null);
  assert.equal(resolveApproximateVisitorLocation('172.16.0.1'), null);
  assert.equal(resolveApproximateVisitorLocation('172.31.255.255'), null);
  assert.equal(resolveApproximateVisitorLocation('192.168.1.1'), null);
  assert.equal(resolveApproximateVisitorLocation('169.254.1.1'), null);
  assert.equal(resolveApproximateVisitorLocation('fd00::1'), null);
  assert.equal(resolveApproximateVisitorLocation('fe80::1'), null);
});

test('UK LiveChat keeps visitor identity separate from conversation identity', () => {
  const source = readFileSync('src/components/LiveChat.tsx', 'utf8');

  assert.match(
    source,
    /primewayz_chat_visitor_id/,
    'persistent visitor identity has its own storage key',
  );

  assert.match(
    source,
    /const \[visitorId\] = useState/,
    'visitorId is initialized independently',
  );

  assert.match(
    source,
    /localStorage\.setItem\(storageKey, nextVisitorId\)/,
    'new visitorId is persisted first-party',
  );

  assert.match(
    source,
    /postVisitorChat\('\/api\/chat\/heartbeat'[\s\S]*?visitorId,/,
    'heartbeat sends visitorId',
  );

  assert.match(
    source,
    /postVisitorChat\('\/api\/chat\/session'[\s\S]*?visitorId,/,
    'session registration sends visitorId',
  );

  assert.doesNotMatch(
    source,
    /visitorId\s*:\s*(tenantId|market|sourceSite|sourceOrigin|sourceChannel)/,
    'visitor identity never becomes source authority',
  );
});

test('server derives approximate location only from trusted client IP', () => {
  const server = readFileSync('server.ts', 'utf8');

  assert.match(
    server,
    /resolveApproximateVisitorLocation\(getClientIp\(req\)\)/,
  );

  assert.doesNotMatch(server, /req\.body\.(city|region|country)/);
});
