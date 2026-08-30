/**
 * Tests for GA4 admin route registration and permissions.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

test('GA4 admin routes are registered with safe permissions', () => {
  const routes = read('src/lib/autopilot/registerAutopilotAdminRoutes.ts');
  assert.match(routes, /'\/api\/admin\/autopilot\/ga4\/status'/);
  assert.match(routes, /'\/api\/admin\/autopilot\/ga4\/sync'/);
  assert.match(routes, /'\/api\/admin\/autopilot\/ga4\/sync-runs'/);
  assert.match(routes, /'\/api\/admin\/autopilot\/ga4\/performance'/);
  assert.match(routes, /'\/api\/admin\/autopilot\/ga4\/test-connection'/);
  assert.match(
    routes,
    /app\.get\(\s*'\/api\/admin\/autopilot\/ga4\/status',\s*requireAdmin,\s*requireRole\(canReadAutopilot\)/,
  );
  assert.match(
    routes,
    /app\.post\(\s*'\/api\/admin\/autopilot\/ga4\/sync',\s*requireAdmin,\s*requireRole\(canManageGa4Reporting\)/,
  );
});

test('GA4 performance service never imports GA4 provider', () => {
  const service = read('src/lib/seo/ga4PerformanceService.ts');
  assert.doesNotMatch(service, /ga4ReportingProvider/);
  assert.doesNotMatch(service, /googleapis/);
});
