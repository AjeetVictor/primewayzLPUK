/**
 * Tests for SEO URL normalisation rules.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normaliseSeoPageUrl,
  SEO_DEFAULT_CANONICAL_ORIGIN,
} from './seoUrlNormalization.ts';

test('relative path resolves to configured Primewayz UK host', () => {
  const result = normaliseSeoPageUrl('/services/crm');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.canonicalUrl, `${SEO_DEFAULT_CANONICAL_ORIGIN}/services/crm`);
  assert.equal(result.path, '/services/crm');
  assert.equal(result.host, 'uk.primewayz.com');
});

test('absolute Primewayz URLs keep pathname casing', () => {
  const result = normaliseSeoPageUrl('https://UK.PRIMEWAYZ.COM/Blog/Post');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.host, 'uk.primewayz.com');
  assert.equal(result.path, '/Blog/Post');
});

test('removes fragments', () => {
  const result = normaliseSeoPageUrl('https://uk.primewayz.com/services#contact');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.canonicalUrl, `${SEO_DEFAULT_CANONICAL_ORIGIN}/services`);
});

test('removes utm and click identifiers while preserving functional query params', () => {
  const result = normaliseSeoPageUrl(
    'https://uk.primewayz.com/digital-systems-review?utm_source=google&gclid=abc&plan=starter',
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(
    result.canonicalUrl,
    `${SEO_DEFAULT_CANONICAL_ORIGIN}/digital-systems-review?plan=starter`,
  );
});

test('normalises duplicate slashes and trailing slash on non-root paths', () => {
  const result = normaliseSeoPageUrl('https://uk.primewayz.com//services/crm///');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.path, '/services/crm');
  assert.equal(result.canonicalUrl, `${SEO_DEFAULT_CANONICAL_ORIGIN}/services/crm`);
});

test('preserves root with trailing slash', () => {
  const result = normaliseSeoPageUrl('https://uk.primewayz.com');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.path, '/');
  assert.equal(result.canonicalUrl, `${SEO_DEFAULT_CANONICAL_ORIGIN}/`);
});

test('rejects javascript and data schemes', () => {
  assert.equal(normaliseSeoPageUrl('javascript:alert(1)').ok, false);
  assert.equal(normaliseSeoPageUrl('data:text/html,hello').ok, false);
});

test('never silently maps foreign host to Primewayz UK', () => {
  const result = normaliseSeoPageUrl('https://example.com/page');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'foreign_host');
});

test('rejects invalid URLs without throwing', () => {
  const result = normaliseSeoPageUrl('not a url');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'invalid_url');
});

test('deterministic hashes for same canonical URL', () => {
  const a = normaliseSeoPageUrl('/blog/test?utm_medium=cpc');
  const b = normaliseSeoPageUrl('https://uk.primewayz.com/blog/test?utm_medium=cpc');
  assert.equal(a.ok, true);
  assert.equal(b.ok, true);
  if (!a.ok || !b.ok) return;
  assert.equal(a.canonicalUrlHash, b.canonicalUrlHash);
});

test('http URLs on Primewayz host are accepted and canonicalised to https origin', () => {
  const result = normaliseSeoPageUrl('http://uk.primewayz.com/about');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.canonicalUrl, `${SEO_DEFAULT_CANONICAL_ORIGIN}/about`);
});

test('removes fbclid tracking parameter', () => {
  const result = normaliseSeoPageUrl('https://uk.primewayz.com/?fbclid=xyz');
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.canonicalUrl, `${SEO_DEFAULT_CANONICAL_ORIGIN}/`);
});
