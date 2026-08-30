/**
 * Tests for deterministic conversion bucket key hashing.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildConversionBucketKeyInput,
  computeConversionBucketKeyHash,
  normalizeConversionChannelGroup,
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
  assert.equal(buildConversionBucketKeyInput({
    seoPageId: null,
    attributionModel: 'last_touch',
    channelGroup: 'direct',
  }).startsWith('unknown\0'), true);
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
