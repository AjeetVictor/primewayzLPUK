import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreAudit } from './scoreAudit.ts';
import type { AuditSignal } from '../types.ts';

test('keeps unavailable external intelligence advisory and outside the score', () => {
  const external: AuditSignal = {
    key: 'external-search',
    category: 'external-presence',
    status: 'not_verified',
    confidence: 0,
    points: 0,
    maxPoints: 0,
    evidence: [{ source: 'not_verified', label: 'Search presence requires external verification.' }],
    recommendations: ['Connect an authorised data source.'],
  };
  const result = scoreAudit([external]);
  const check = result.checks.find((item) => item.id === 'external-presence');
  assert.equal(check?.maxPoints, 0);
  assert.equal(check?.status, 'not_verified');
  assert.equal(check?.points, 0);
});

test('normalises raw signal points to transparent category weights', () => {
  const analytics: AuditSignal = {
    key: 'analytics-ga4',
    category: 'analytics-readiness',
    status: 'found',
    confidence: 1,
    points: 3,
    maxPoints: 3,
    evidence: [{ source: 'website', label: 'GA4 detected.' }],
    recommendations: [],
  };
  const check = scoreAudit([analytics]).checks.find((item) => item.id === 'analytics-readiness');
  assert.equal(check?.points, 10);
  assert.equal(check?.maxPoints, 10);
});
