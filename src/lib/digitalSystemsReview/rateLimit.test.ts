import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkDigitalSystemsReviewRateLimit,
  getClientIp,
  resetDigitalSystemsReviewRateLimitForTests,
  warnIfProductionProxyAttributionShared,
} from './rateLimit.ts';

test('local bypass works only when explicitly enabled', () => {
  resetDigitalSystemsReviewRateLimitForTests();
  for (let i = 0; i < 6; i += 1) {
    assert.equal(
      checkDigitalSystemsReviewRateLimit('127.0.0.1', { bypassLocal: true }).allowed,
      true,
    );
  }
});

test('production-style 127.0.0.1 is rate limited without bypass', () => {
  resetDigitalSystemsReviewRateLimitForTests();
  for (let i = 0; i < 5; i += 1) {
    assert.equal(checkDigitalSystemsReviewRateLimit('127.0.0.1').allowed, true);
  }
  assert.equal(checkDigitalSystemsReviewRateLimit('127.0.0.1').allowed, false);
});

test('unknown is rate limited', () => {
  resetDigitalSystemsReviewRateLimitForTests();
  for (let i = 0; i < 5; i += 1) {
    assert.equal(checkDigitalSystemsReviewRateLimit('unknown').allowed, true);
  }
  assert.equal(checkDigitalSystemsReviewRateLimit('unknown').allowed, false);
});

test('req.ip is preferred and spoofed X-Forwarded-For is ignored', () => {
  assert.equal(
    getClientIp({
      ip: '203.0.113.10',
      socket: { remoteAddress: '10.0.0.1' },
    }),
    '203.0.113.10',
  );
  assert.equal(
    getClientIp({
      socket: { remoteAddress: '10.0.0.8' },
    }),
    '10.0.0.8',
  );
  // Spoofed forwarded headers must not be read by getClientIp (no headers parameter).
  const spoofed = {
    socket: { remoteAddress: '10.0.0.8' },
    headers: { 'x-forwarded-for': '9.9.9.9' },
  };
  assert.equal(getClientIp(spoofed), '10.0.0.8');
});

test('five attempts are allowed and the next is blocked', () => {
  resetDigitalSystemsReviewRateLimitForTests();
  const ip = '198.51.100.20';
  for (let i = 0; i < 5; i += 1) {
    const result = checkDigitalSystemsReviewRateLimit(ip);
    assert.equal(result.allowed, true);
  }
  const blocked = checkDigitalSystemsReviewRateLimit(ip);
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) assert.ok(blocked.retryAfterSeconds >= 1);
});

test('production proxy warning emits at most once and does not print env values', () => {
  resetDigitalSystemsReviewRateLimitForTests();
  const warnings: string[] = [];
  const original = console.warn;
  console.warn = (...args: unknown[]) => {
    warnings.push(String(args[0] ?? ''));
  };
  try {
    warnIfProductionProxyAttributionShared({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
    warnIfProductionProxyAttributionShared({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0]!, /TRUST_PROXY is not set/);
    assert.doesNotMatch(warnings[0]!, /DATABASE_URL|SMTP|SECRET/i);
  } finally {
    console.warn = original;
  }
});
