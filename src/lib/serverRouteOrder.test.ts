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