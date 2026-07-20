import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { AutopilotError } from './apiErrors.ts';
import {
  assertGscConfigured,
  getGscPublicConfigStatus,
} from './gscConfig.ts';

function baseEnv(overrides: Record<string, string> = {}): NodeJS.ProcessEnv {
  return {
    GOOGLE_SEARCH_CONSOLE_CLIENT_ID: 'client-id',
    GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_SEARCH_CONSOLE_REDIRECT_URI:
      'http://localhost:3000/api/admin/autopilot/gsc/oauth/callback',
    AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
    AUTOPILOT_GSC_OAUTH_STATE_SECRET: 's'.repeat(32),
    AUTOPILOT_GSC_DEFAULT_LOOKBACK_DAYS: '28',
    AUTOPILOT_GSC_DATA_DELAY_DAYS: '3',
    ...overrides,
  };
}

test('missing config returns CONFIGURATION_REQUIRED', () => {
  const status = getGscPublicConfigStatus({});
  assert.equal(status.configured, false);
  assert.ok(status.missing.includes('GOOGLE_SEARCH_CONSOLE_CLIENT_ID'));

  assert.throws(
    () => assertGscConfigured({}),
    (err: unknown) =>
      err instanceof AutopilotError && err.code === 'GSC_CONFIGURATION_REQUIRED',
  );
});

test('invalid encryption key rejected', () => {
  const status = getGscPublicConfigStatus(
    baseEnv({ AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY: Buffer.alloc(8).toString('base64') }),
  );
  assert.equal(status.configured, false);
  assert.ok(status.missing.includes('AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY'));
});

test('secrets are absent from safe config DTO', () => {
  const status = getGscPublicConfigStatus(baseEnv());
  assert.equal(status.configured, true);
  const serialised = JSON.stringify(status);
  assert.equal(serialised.includes('client-secret'), false);
  assert.equal(serialised.includes('AUTOPILOT_GSC_TOKEN_ENCRYPTION_KEY'), false);
  assert.ok(!('clientSecret' in status));
  assert.ok(!('tokenEncryptionKeyBase64' in status));
  assert.ok(!('oauthStateSecret' in status));
});
