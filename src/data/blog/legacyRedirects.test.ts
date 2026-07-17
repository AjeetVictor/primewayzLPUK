import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildRedirectLocation,
  getLegacyInsightsRedirectSources,
  getValidatedLegacyBlogRedirects,
  isLiveInsightsSlug,
  isSafeBlogRedirectDestination,
  legacyBlogRedirects,
  normalizeInsightsPathname,
  resolveInsightsToBlogRedirect,
} from './legacyRedirects.ts';
import { getAllBlogPosts } from './utils.ts';

const posts = getAllBlogPosts();
const sampleBlogSlug = posts[0]?.slug;

test('explicit legacy redirects are unique and only map to published /blog articles', () => {
  const fromPaths = legacyBlogRedirects.map((entry) => entry.from);
  assert.equal(fromPaths.length, new Set(fromPaths).size, 'duplicate from paths');

  const validated = getValidatedLegacyBlogRedirects();
  for (const entry of validated) {
    assert.ok(entry.from.startsWith('/insights/'));
    assert.ok(entry.to.startsWith('/blog/'));
    assert.equal(isSafeBlogRedirectDestination(entry.to), true);
    assert.ok(!entry.from.endsWith('/'));
    assert.ok(!entry.to.endsWith('/'));
  }
});

test('same-slug fallback redirects only for real published blog articles', () => {
  assert.ok(sampleBlogSlug);
  assert.equal(
    resolveInsightsToBlogRedirect(sampleBlogSlug!),
    `/blog/${sampleBlogSlug}`,
  );
});

test('unknown legacy slug does not redirect', () => {
  assert.equal(resolveInsightsToBlogRedirect('not-a-real-article'), null);
  assert.equal(resolveInsightsToBlogRedirect('../etc/passwd'), null);
  assert.equal(resolveInsightsToBlogRedirect(''), null);
});

test('live SDaaS insight slugs are not redirected to blog', () => {
  assert.equal(isLiveInsightsSlug('subscription-based-software-development'), true);
  assert.equal(
    resolveInsightsToBlogRedirect('subscription-based-software-development'),
    null,
  );
  assert.equal(
    resolveInsightsToBlogRedirect('software-development-subscription-vs-fixed-price'),
    null,
  );
  assert.equal(
    resolveInsightsToBlogRedirect('software-development-subscription-use-cases'),
    null,
  );
});

test('redirect destinations always begin with /blog/', () => {
  assert.equal(isSafeBlogRedirectDestination('/blog/monthly-digital-support-uk-smes'), true);
  assert.equal(isSafeBlogRedirectDestination('https://evil.example/blog/x'), false);
  assert.equal(isSafeBlogRedirectDestination('/services'), false);
  assert.equal(isSafeBlogRedirectDestination('/blog'), false);
  assert.equal(isSafeBlogRedirectDestination('/blog/not-a-real-article'), false);
});

test('trailing slash normalisation for insights pathnames', () => {
  assert.equal(
    normalizeInsightsPathname('/insights/monthly-digital-support-uk-smes/'),
    'monthly-digital-support-uk-smes',
  );
  assert.equal(
    normalizeInsightsPathname('/insights/monthly-digital-support-uk-smes'),
    'monthly-digital-support-uk-smes',
  );
  assert.equal(normalizeInsightsPathname('/insights'), null);
});

test('query string preservation helper', () => {
  assert.equal(
    buildRedirectLocation(
      '/blog/monthly-digital-support-uk-smes',
      '/insights/monthly-digital-support-uk-smes?utm_source=test&utm_campaign=old',
    ),
    '/blog/monthly-digital-support-uk-smes?utm_source=test&utm_campaign=old',
  );
  assert.equal(
    buildRedirectLocation('/blog/monthly-digital-support-uk-smes', '/insights/monthly-digital-support-uk-smes'),
    '/blog/monthly-digital-support-uk-smes',
  );
});

test('legacy redirect sources are not listed in sitemap.xml', () => {
  const sitemap = readFileSync(
    path.join(process.cwd(), 'public', 'sitemap.xml'),
    'utf8',
  );
  for (const from of getLegacyInsightsRedirectSources()) {
    assert.equal(
      sitemap.includes(`https://uk.primewayz.com${from}`),
      false,
      `legacy source ${from} must not appear in sitemap`,
    );
  }
});
