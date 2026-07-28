import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyUnmatchedRequest,
  resetRouteClassificationSamplesForTests,
  shouldLogRouteClassification,
} from './serverRouteClassification';

test('classifies WordPress probes as low severity', () => {
  const result = classifyUnmatchedRequest({ method: 'GET', path: '/wp-admin/setup-config.php' });
  assert.equal(result.category, 'wordpress_probe');
  assert.equal(result.logLevel, 'debug');
});

test('classifies missing hashed assets as warning', () => {
  const result = classifyUnmatchedRequest({ method: 'GET', path: '/assets/index-abc123.js' });
  assert.equal(result.category, 'missing_build_asset');
  assert.equal(result.logLevel, 'warn');
});

test('classifies API 404 as structured warning', () => {
  const result = classifyUnmatchedRequest({ method: 'POST', path: '/api/unknown-endpoint' });
  assert.equal(result.category, 'malformed_api_request');
  assert.equal(result.logLevel, 'warn');
});

test('samples repeated bot probes', () => {
  resetRouteClassificationSamplesForTests();
  const classification = classifyUnmatchedRequest({ method: 'GET', path: '/.env' });
  assert.equal(shouldLogRouteClassification(classification, '/.env'), true);
  assert.equal(shouldLogRouteClassification(classification, '/.env'), false);
});
