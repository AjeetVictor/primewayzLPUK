import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuditFindings } from './buildAuditFindings.ts';
import type { AuditSignal } from '../types.ts';

test('turns deterministic signals into evidence-led report findings', () => {
  const signals: AuditSignal[] = [{
    key: 'trust-company-number',
    category: 'trust-signals',
    status: 'missing',
    confidence: 0.9,
    points: 0,
    maxPoints: 2,
    evidence: [],
    recommendations: ['Publish the registered company number where appropriate.'],
  }, {
    key: 'external-google-business-profile',
    category: 'external-presence',
    status: 'not_verified',
    confidence: 0,
    points: 0,
    maxPoints: 0,
    evidence: [{ source: 'not_verified', label: 'Google Business Profile was not verified.' }],
    recommendations: [],
  }];

  const findings = buildAuditFindings(signals);
  assert.deepEqual(findings[0], {
    checkId: 'trust-company-number',
    category: 'trust-signals',
    finding: 'Company Number was not detected in the audited pages.',
    result: 'missing',
    severity: 'high',
    scoreImpact: 2,
    whyItMatters: 'Visible identity and credential signals help visitors judge whether the business is credible.',
    evidence: [],
    recommendation: 'Publish the registered company number where appropriate.',
  });
  assert.equal(findings[1].severity, 'advisory');
  assert.equal(findings[1].scoreImpact, 0);
});
