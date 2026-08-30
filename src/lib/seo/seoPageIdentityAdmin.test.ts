/**
 * Static tests for SEO page identity admin route registration.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const routes = fs.readFileSync(
  path.join(root, 'src/lib/autopilot/registerAutopilotAdminRoutes.ts'),
  'utf8',
);

test('seo-pages diagnostics route requires admin auth', () => {
  assert.match(
    routes,
    /app\.get\(\s*'\/api\/admin\/autopilot\/seo-pages\/diagnostics',\s*requireAdmin,\s*requireRole\(canReadAutopilot\)/,
  );
});

test('seo-pages diagnostics route uses read-only GET handler', () => {
  assert.match(
    routes,
    /app\.get\([\s\S]*?'\/api\/admin\/autopilot\/seo-pages\/diagnostics'[\s\S]*?getSeoPageDiagnostics\(prisma/,
  );
});

test('seo-pages diagnostics response includes correlation id header', () => {
  assert.match(
    routes,
    /\/api\/admin\/autopilot\/seo-pages\/diagnostics[\s\S]*res\.setHeader\('x-correlation-id', correlationId\)/,
  );
});

test('seo-pages diagnostics supports pagination and filtering query params', () => {
  assert.match(routes, /pageType: typeof q\.pageType === 'string'/);
  assert.match(routes, /unmatchedOnly: q\.unmatchedOnly/);
  assert.match(routes, /limit: typeof q\.limit === 'string'/);
  assert.match(routes, /offset: typeof q\.offset === 'string'/);
});
