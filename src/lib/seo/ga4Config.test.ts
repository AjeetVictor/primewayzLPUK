/**
 * Tests for GA4 configuration helpers.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertGa4Configured,
  getGa4ConfigMissing,
  getGa4PublicConfigStatus,
  maskGa4PropertyId,
} from './ga4Config.ts';

test('missing config lists variable names only', () => {
  const missing = getGa4ConfigMissing({});
  assert.deepEqual(missing, [
    'GA4_PROPERTY_ID',
    'GA4_SERVICE_ACCOUNT_CLIENT_EMAIL',
    'GA4_SERVICE_ACCOUNT_PRIVATE_KEY',
  ]);
});

test('private key line breaks are normalised in assertGa4Configured', () => {
  process.env.GA4_PROPERTY_ID = '123456789';
  process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL = 'ga4@project.iam.gserviceaccount.com';
  process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----';
  const cfg = assertGa4Configured(process.env);
  assert.match(cfg.privateKey, /\nabc\n/);
});

test('public status masks property id and omits secrets', () => {
  process.env.GA4_PROPERTY_ID = '123456789';
  process.env.GA4_SERVICE_ACCOUNT_CLIENT_EMAIL = 'ga4@project.iam.gserviceaccount.com';
  process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\ntest\\n-----END PRIVATE KEY-----';
  const status = getGa4PublicConfigStatus(process.env, {
    latestSafeDate: '2026-07-19',
    syncLocked: false,
  });
  assert.equal(status.configured, true);
  assert.equal(status.propertyIdConfigured, true);
  assert.equal(status.authenticationConfigured, true);
  assert.equal(status.propertyId, maskGa4PropertyId('123456789'));
  assert.equal(status.defaultDateFrom != null, true);
  assert.equal(status.maxRangeDays, 400);
  const serialised = JSON.stringify(status);
  assert.equal(serialised.includes('PRIVATE KEY'), false);
});
