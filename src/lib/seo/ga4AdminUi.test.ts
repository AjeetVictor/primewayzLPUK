/**
 * Static checks for GA4 admin UI wiring.
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

test('Autopilot dashboard renders separate GA4 connection and performance panels', () => {
  const dashboard = read('src/components/admin/autopilot/AutopilotDashboard.tsx');
  assert.match(dashboard, /Ga4ReportingPanel/);
  assert.match(dashboard, /Ga4PerformancePanel/);
  assert.doesNotMatch(dashboard, /GscConnectionPanel[\s\S]*Ga4ReportingPanel[\s\S]*GscPerformancePanel/);
});

test('GA4 connection panel keeps sync and report controls separate', () => {
  const panel = read('src/components/admin/autopilot/Ga4ReportingPanel.tsx');
  assert.match(panel, /Sync latest range/);
  assert.match(panel, /Custom date range/);
  assert.match(panel, /Test connection/);
  assert.match(panel, /Sync controls are separate from performance report filters/);
});

test('GA4 performance panel states report filters do not trigger sync', () => {
  const panel = read('src/components/admin/autopilot/Ga4PerformancePanel.tsx');
  assert.match(panel, /never trigger a sync/);
  assert.match(panel, /Apply report filters/);
  assert.match(panel, /Unmatched/);
});
