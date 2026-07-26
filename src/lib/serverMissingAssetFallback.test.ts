import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const serverSource = fs.readFileSync(
  path.join(process.cwd(), 'server.ts'),
  'utf8',
);

test('missing static assets return 404 after public static handling and before SSR', () => {
  const publicStaticIndex = serverSource.indexOf(
    "express.static(path.join(__dirname, 'public')",
  );

  const missingAssetMiddlewareIndex = serverSource.indexOf(
    'const MISSING_STATIC_ASSET_PATTERN',
  );

  const firstSsrRenderIndex = serverSource.indexOf(
    'await sendSsrPage(',
  );

  assert.notEqual(
    publicStaticIndex,
    -1,
    'Expected public static middleware to exist',
  );

  assert.notEqual(
    missingAssetMiddlewareIndex,
    -1,
    'Expected missing-static-asset middleware to exist',
  );

  assert.notEqual(
    firstSsrRenderIndex,
    -1,
    'Expected SSR rendering to exist',
  );

  assert.ok(
    publicStaticIndex < missingAssetMiddlewareIndex,
    'Missing-asset handling must run after public static handling',
  );

  assert.ok(
    missingAssetMiddlewareIndex < firstSsrRenderIndex,
    'Missing-asset handling must run before SSR rendering',
  );

  assert.match(
    serverSource,
    /\.status\(404\)/,
    'Missing assets must return HTTP 404',
  );

  assert.match(
    serverSource,
    /\.send\('Asset not found'\)/,
    'Missing assets must return a minimal response',
  );

  assert.match(
    serverSource,
    /svg\|webp\|png\|jpe\?g\|gif\|ico\|css\|js/,
    'Common static asset extensions must be included',
  );
});
