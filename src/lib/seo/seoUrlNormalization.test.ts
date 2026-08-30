/**
 * Tests for SEO URL normalisation rules.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSeoCanonicalUrl,
  classifySeoPagePath,
  hashSeoUrl,
  isSeoPagePathExcluded,
  normaliseSeoPageUrl,
  SEO_DEFAULT_CANONICAL_ORIGIN,
} from './seoUrlNormalization.ts';

const ORIGIN = SEO_DEFAULT_CANONICAL_ORIGIN;

function ok(input: string, options?: Parameters<typeof normaliseSeoPageUrl>[1]) {
  const result = normaliseSeoPageUrl(input, options);
  assert.equal(result.ok, true, `expected ok for ${input}`);
  if (!result.ok) throw new Error('unreachable');
  return result;
}

test('1. absolute production URL', () => {
  const result = ok('https://uk.primewayz.com/blog/example');
  assert.equal(result.canonicalUrl, `${ORIGIN}/blog/example`);
});

test('2. root-relative path', () => {
  const result = ok('/services/crm');
  assert.equal(result.canonicalUrl, `${ORIGIN}/services/crm`);
  assert.equal(result.wasRelative, true);
});

test('3. path without leading slash', () => {
  const result = ok('blog/example');
  assert.equal(result.path, '/blog/example');
  assert.equal(result.wasRelative, true);
});

test('4. root page', () => {
  const result = ok('https://uk.primewayz.com');
  assert.equal(result.path, '/');
  assert.equal(result.canonicalUrl, `${ORIGIN}/`);
});

test('5. trailing slash removal on non-root paths', () => {
  const result = ok('https://uk.primewayz.com/services/');
  assert.equal(result.path, '/services');
});

test('6. duplicate slashes', () => {
  const result = ok('https://uk.primewayz.com//blog//example//');
  assert.equal(result.path, '/blog/example');
});

test('7. fragment removal', () => {
  const result = ok('https://uk.primewayz.com/services#pricing');
  assert.equal(result.canonicalUrl, `${ORIGIN}/services`);
});

test('8. UTM removal', () => {
  const result = ok('https://uk.primewayz.com/blog/example?utm_source=linkedin');
  assert.equal(result.canonicalUrl, `${ORIGIN}/blog/example`);
  assert.ok(result.removedTrackingParameters.includes('utm_source'));
});

test('9. gclid removal', () => {
  const result = ok('https://uk.primewayz.com/?gclid=abc');
  assert.equal(result.canonicalUrl, `${ORIGIN}/`);
});

test('10. fbclid removal', () => {
  const result = ok('https://uk.primewayz.com/?fbclid=xyz');
  assert.equal(result.canonicalUrl, `${ORIGIN}/`);
});

test('11. multiple tracking parameters removed', () => {
  const result = ok(
    'https://uk.primewayz.com/services?utm_source=a&utm_medium=b&gclid=c&fbclid=d',
  );
  assert.equal(result.canonicalUrl, `${ORIGIN}/services`);
  assert.equal(result.removedTrackingParameters.length, 4);
});

test('12. tracking plus functional parameter', () => {
  const result = ok('https://uk.primewayz.com/services?utm_source=x&plan=starter');
  assert.equal(result.canonicalUrl, `${ORIGIN}/services?plan=starter`);
});

test('13. functional query preservation', () => {
  const result = ok('https://uk.primewayz.com/search?q=crm');
  assert.equal(result.canonicalUrl, `${ORIGIN}/search?q=crm`);
});

test('14. deterministic query sorting', () => {
  const a = ok('https://uk.primewayz.com/services?z=1&a=2');
  const b = ok('https://uk.primewayz.com/services?a=2&z=1');
  assert.equal(a.canonicalUrl, b.canonicalUrl);
});

test('15. query encoding preserved', () => {
  const result = ok('https://uk.primewayz.com/search?q=hello%20world');
  assert.match(result.canonicalUrl, /q=hello(\+|%20)world/);
});

test('16. HTTP to HTTPS canonical origin', () => {
  const result = ok('http://uk.primewayz.com/about-us');
  assert.equal(result.canonicalUrl, `${ORIGIN}/about-us`);
});

test('17. host lowercasing', () => {
  const result = ok('https://UK.PRIMEWAYZ.COM/services');
  assert.equal(result.host, 'uk.primewayz.com');
});

test('18. path case preservation', () => {
  const result = ok('https://uk.primewayz.com/Blog/Post');
  assert.equal(result.path, '/Blog/Post');
});

test('19. default port removal', () => {
  const result = ok('https://uk.primewayz.com:443/services');
  assert.equal(result.canonicalUrl, `${ORIGIN}/services`);
});

test('20. foreign host rejection', () => {
  const result = normaliseSeoPageUrl('https://example.com/page');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'foreign_host');
  assert.equal(result.wasForeignHost, true);
});

test('21. foreign host is not rewritten to Primewayz UK', () => {
  const result = normaliseSeoPageUrl('https://example.com/blog/example');
  assert.equal(result.ok, false);
});

test('22. javascript rejection', () => {
  assert.equal(normaliseSeoPageUrl('javascript:alert(1)').ok, false);
});

test('23. data URL rejection', () => {
  assert.equal(normaliseSeoPageUrl('data:text/html,hello').ok, false);
});

test('24. mailto rejection', () => {
  assert.equal(normaliseSeoPageUrl('mailto:test@example.com').ok, false);
});

test('25. credentials-in-URL rejection', () => {
  const result = normaliseSeoPageUrl('https://user:pass@uk.primewayz.com/services');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'credentials_in_url');
});

test('26. malformed URL', () => {
  const result = normaliseSeoPageUrl('not a url');
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.reason, 'invalid_url');
});

test('27. admin path exclusion', () => {
  assert.equal(isSeoPagePathExcluded('/admin'), true);
  assert.equal(
    normaliseSeoPageUrl('/admin', { rejectExcludedPaths: true }).ok,
    false,
  );
});

test('28. API path exclusion', () => {
  assert.equal(isSeoPagePathExcluded('/api/contact'), true);
});

test('29. asset path exclusion', () => {
  assert.equal(isSeoPagePathExcluded('/assets/logo.png'), true);
});

test('30. image-file exclusion', () => {
  assert.equal(isSeoPagePathExcluded('/images/hero.webp'), true);
});

test('31. blog article classification', () => {
  assert.equal(classifySeoPagePath('/blog/example-post'), 'blog_article');
});

test('32. service-page classification', () => {
  assert.equal(classifySeoPagePath('/services'), 'service');
  assert.equal(classifySeoPagePath('/crm-automation-support'), 'service');
});

test('33. contact-page classification', () => {
  assert.equal(classifySeoPagePath('/contact-us'), 'contact');
});

test('34. unknown-page classification', () => {
  assert.equal(classifySeoPagePath('/some-new-marketing-page'), 'unknown');
});

test('tracking variants resolve to the same canonical hash', () => {
  const a = ok('/blog/test?utm_medium=cpc');
  const b = ok('https://uk.primewayz.com/blog/test?utm_medium=cpc');
  assert.equal(a.canonicalUrlHash, b.canonicalUrlHash);
});

test('buildSeoCanonicalUrl uses configured origin', () => {
  assert.equal(buildSeoCanonicalUrl('/blog/example'), `${ORIGIN}/blog/example`);
});

test('hashSeoUrl is deterministic', () => {
  assert.equal(hashSeoUrl('abc'), hashSeoUrl('abc'));
});

test('_ga and _gl tracking parameters are removed', () => {
  const result = ok('https://uk.primewayz.com/?_ga=1&_gl=2');
  assert.equal(result.canonicalUrl, `${ORIGIN}/`);
});

test('dot segments are resolved safely', () => {
  const result = ok('https://uk.primewayz.com/a/b/../c');
  assert.equal(result.path, '/a/c');
});
