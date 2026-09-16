/**
 * Tests for deterministic conversion bucket key hashing.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConversionBucketKeyInput,
  computeConversionBucketKeyHash,
  CONVERSION_LEGACY_TENANT_SENTINEL,
  normalizeConversionChannelGroup,
  resolveConversionBucketTenantSegment,
} from './conversionBucketKey.ts';

test('bucket key hash is deterministic', () => {
  const input = {
    seoPageId: 42,
    attributionModel: 'first_touch' as const,
    channelGroup: 'organic',
  };
  const a = computeConversionBucketKeyHash(input);
  const b = computeConversionBucketKeyHash(input);
  assert.equal(a, b);
  assert.equal(a.length, 64);
});

test('null seoPageId produces stable unknown sentinel key', () => {
  const a = computeConversionBucketKeyHash({
    seoPageId: null,
    attributionModel: 'last_touch',
    channelGroup: 'direct',
  });
  const b = computeConversionBucketKeyHash({
    seoPageId: null,
    attributionModel: 'last_touch',
    channelGroup: 'direct',
  });
  assert.equal(a, b);
  assert.equal(
    buildConversionBucketKeyInput({
      seoPageId: null,
      attributionModel: 'last_touch',
      channelGroup: 'direct',
    }).startsWith(`${CONVERSION_LEGACY_TENANT_SENTINEL}\0unknown\0`),
    true,
  );
});

test('same URL/date/channel under pw-uk and pw-infotech produce different bucket keys', () => {
  const shared = {
    seoPageId: 12,
    attributionModel: 'first_touch' as const,
    channelGroup: 'organic',
  };
  const uk = computeConversionBucketKeyHash({ ...shared, tenantId: 'pw-uk' });
  const infotech = computeConversionBucketKeyHash({ ...shared, tenantId: 'pw-infotech' });
  assert.notEqual(uk, infotech);
});

test('legacy/null tenant produces deterministic legacy bucket that does not collide with pw-uk', () => {
  const shared = {
    seoPageId: 12,
    attributionModel: 'first_touch' as const,
    channelGroup: 'organic',
  };
  const legacyA = computeConversionBucketKeyHash(shared);
  const legacyB = computeConversionBucketKeyHash({ ...shared, tenantId: null });
  const legacyC = computeConversionBucketKeyHash({ ...shared, tenantId: undefined });
  const uk = computeConversionBucketKeyHash({ ...shared, tenantId: 'pw-uk' });
  assert.equal(legacyA, legacyB);
  assert.equal(legacyB, legacyC);
  assert.equal(resolveConversionBucketTenantSegment(null), CONVERSION_LEGACY_TENANT_SENTINEL);
  assert.notEqual(CONVERSION_LEGACY_TENANT_SENTINEL, 'pw-uk');
  assert.notEqual(legacyA, uk);
});

test('UTM/campaign attribution remains independent of tenant bucket identity', () => {
  // campaignId / UTM campaign are never part of the bucket hash input.
  const base = buildConversionBucketKeyInput({
    tenantId: 'pw-uk',
    seoPageId: 3,
    attributionModel: 'last_touch',
    channelGroup: 'paid',
  });
  assert.equal(base.includes('campaign'), false);
  assert.equal(base.includes('utm'), false);
  assert.equal(
    computeConversionBucketKeyHash({
      tenantId: 'pw-uk',
      seoPageId: 3,
      attributionModel: 'last_touch',
      channelGroup: 'paid',
    }),
    computeConversionBucketKeyHash({
      tenantId: 'pw-uk',
      seoPageId: 3,
      attributionModel: 'last_touch',
      channelGroup: 'Paid',
    }),
  );
});

test('different page, model or channel produces different bucket key', () => {
  const base = computeConversionBucketKeyHash({
    seoPageId: 1,
    attributionModel: 'first_touch',
    channelGroup: 'organic',
  });
  const otherPage = computeConversionBucketKeyHash({
    seoPageId: 2,
    attributionModel: 'first_touch',
    channelGroup: 'organic',
  });
  const otherModel = computeConversionBucketKeyHash({
    seoPageId: 1,
    attributionModel: 'last_touch',
    channelGroup: 'organic',
  });
  const otherChannel = computeConversionBucketKeyHash({
    seoPageId: 1,
    attributionModel: 'first_touch',
    channelGroup: 'paid',
  });
  assert.notEqual(base, otherPage);
  assert.notEqual(base, otherModel);
  assert.notEqual(base, otherChannel);
});

test('channel group normalisation is consistent', () => {
  assert.equal(normalizeConversionChannelGroup(' Organic '), 'organic');
  const a = computeConversionBucketKeyHash({
    seoPageId: 5,
    attributionModel: 'first_touch',
    channelGroup: 'Organic',
  });
  const b = computeConversionBucketKeyHash({
    seoPageId: 5,
    attributionModel: 'first_touch',
    channelGroup: ' organic ',
  });
  assert.equal(a, b);
});

test('bucket key input contains no PII fields', () => {
  const input = buildConversionBucketKeyInput({
    seoPageId: 9,
    attributionModel: 'first_touch',
    channelGroup: 'email',
  });
  assert.equal(input.includes('@'), false);
  assert.equal(input.includes('phone'), false);
  assert.equal(input.includes('message'), false);
});
