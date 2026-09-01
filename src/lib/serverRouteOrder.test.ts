import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const serverSource = fs.readFileSync(
  path.join(process.cwd(), 'server.ts'),
  'utf8',
);

test('public health route is registered before the generic API fallback', () => {
  const healthRouteIndex = serverSource.indexOf("app.get('/api/health'");
  const apiFallbackIndex = serverSource.indexOf("app.use('/api'");

  assert.notEqual(
    healthRouteIndex,
    -1,
    'Expected the /api/health route to exist',
  );

  assert.notEqual(
    apiFallbackIndex,
    -1,
    'Expected the generic /api fallback to exist',
  );

  assert.ok(
    healthRouteIndex < apiFallbackIndex,
    '/api/health must be registered before the generic /api fallback',
  );
});

test('legacy SEO routes are resolved before the SSR fallback', () => {
  const appSource = fs.readFileSync(path.join(process.cwd(), 'src/App.tsx'), 'utf8');
  const routesSource = fs.readFileSync(
    path.join(process.cwd(), 'src/constants/canonicalRoutes.ts'),
    'utf8',
  );

  const retiredIndex = serverSource.indexOf('for (const retiredPath of RETIRED_ROUTE_PATHS)');
  const catchAllIndex = serverSource.lastIndexOf("app.get('*'");

  assert.ok(retiredIndex >= 0 && retiredIndex < catchAllIndex);
  assert.match(serverSource, /\.status\(410\)[\s\S]*?X-Robots-Tag[\s\S]*?noindex, nofollow/);
  assert.match(serverSource, /const pageSeo = STATIC_PAGE_SEO\[pagePathname\];[\s\S]*?if \(!pageSeo\)[\s\S]*?statusCode: 404[\s\S]*?buildNoIndexSeoTags/);
  assert.doesNotMatch(serverSource, /staticPageSeo\[pagePathname\]\s*\|\|\s*staticPageSeo\[['"]\/['"]\]/);
  assert.match(appSource, /<Route path="\*" element=\{<NotFoundPage \/>\} \/>/);
  assert.match(routesSource, /'\/testimonial': CANONICAL_ROUTES\.successStories/);
  assert.match(routesSource, /'\/team': CANONICAL_ROUTES\.about/);
  assert.match(routesSource, /'\/job'/);
  assert.match(routesSource, /kreatorbox-vs-creatorbox-a-basic-comparison/);
});
