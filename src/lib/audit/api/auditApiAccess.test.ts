import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAuditApiRateLimit, getAuditApiAllowedOrigins, isAuditApiKeyAllowed, isAuditApiOriginAllowed, resetAuditApiRateLimitForTests } from './auditApiAccess.ts';

test('allows Primewayz Infotech origins by default and rejects unrelated browsers', () => {
  const env = {} as NodeJS.ProcessEnv;
  assert.equal(isAuditApiOriginAllowed('https://uk.primewayz.com', env), true);
  assert.equal(isAuditApiOriginAllowed('https://primewayz.com', env), true);
  assert.equal(isAuditApiOriginAllowed('https://www.primewayz.com', env), true);
  assert.equal(isAuditApiOriginAllowed('https://rentreadbuy.com', env), false);
  assert.equal(isAuditApiOriginAllowed('https://example.com', env), false);
  assert.equal(isAuditApiOriginAllowed(undefined, env), true);
});

test('supports a configured allowlist and optional server API token', () => {
  const env = { AUDIT_API_ALLOWED_ORIGINS: 'https://preview.primewayz.com, https://primewayz.com/', AUDIT_API_TOKEN: 'integration-secret' } as NodeJS.ProcessEnv;
  assert.deepEqual([...getAuditApiAllowedOrigins(env)], ['https://preview.primewayz.com', 'https://primewayz.com']);
  assert.equal(isAuditApiKeyAllowed('integration-secret', env), true);
  assert.equal(isAuditApiKeyAllowed('wrong', env), false);
});

test('limits each integration client to ten audits per fifteen minutes', () => {
  resetAuditApiRateLimitForTests();
  for (let index = 0; index < 10; index += 1) assert.equal(checkAuditApiRateLimit('client', 1_000).allowed, true);
  const blocked = checkAuditApiRateLimit('client', 1_000);
  assert.equal(blocked.allowed, false);
  if (!blocked.allowed) assert.equal(blocked.retryAfterSeconds, 900);
  assert.equal(checkAuditApiRateLimit('client', 901_000).allowed, true);
});
