import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS,
} from '../../data/autopilot/researchConfig.ts';
import {
  buildConfirmationPayload,
  buildResearchUpdatePayload,
  formatCompletenessDisplay,
  getOverlapFindingLabel,
  getResearchSnapshotStatusLabel,
  isResearchSnapshotReadOnly,
  RESEARCH_CONFIRMATION_COPY,
  serializeResearchQueueFilters,
  SERP_EVIDENCE_MANUAL_NOTICE,
  DEFAULT_RESEARCH_QUEUE_FILTERS,
} from './adminResearchHelpers.ts';
import { evaluateResearchReadiness } from './researchSnapshotService.ts';

test('snapshot status labels', () => {
  assert.equal(getResearchSnapshotStatusLabel('draft'), 'Draft');
  assert.equal(getResearchSnapshotStatusLabel('ready_for_confirmation'), 'Ready for confirmation');
  assert.equal(getResearchSnapshotStatusLabel('confirmed'), 'Confirmed');
  assert.equal(getResearchSnapshotStatusLabel('superseded'), 'Superseded');
});

test('research filter serialisation', () => {
  const query = serializeResearchQueueFilters({
    ...DEFAULT_RESEARCH_QUEUE_FILTERS,
    q: 'sdaas',
    hasExactConflict: true,
    topicStatus: 'RESEARCHING',
  });
  assert.equal(query.q, 'sdaas');
  assert.equal(query.hasExactConflict, true);
  assert.equal(query.topicStatus, 'RESEARCHING');
  assert.ok(!('needsMoreResearch' in query));
});

test('completeness and overlap labels', () => {
  assert.equal(formatCompletenessDisplay(72.5), '72.5%');
  assert.equal(getOverlapFindingLabel('exact_slug_match'), 'Exact slug conflict');
  assert.equal(getOverlapFindingLabel('high_lexical_overlap'), 'High lexical-overlap advisory');
});

test('confirmation wording and SERP notice', () => {
  assert.match(RESEARCH_CONFIRMATION_COPY, /does not score, approve, generate, or publish/i);
  assert.match(SERP_EVIDENCE_MANUAL_NOTICE, /not verified automatically/i);
  assert.match(SERP_EVIDENCE_MANUAL_NOTICE, /manually/i);
});

test('confirmed snapshots are read-only helpers', () => {
  assert.equal(isResearchSnapshotReadOnly('confirmed'), true);
  assert.equal(isResearchSnapshotReadOnly('superseded'), true);
  assert.equal(isResearchSnapshotReadOnly('draft'), false);
});

test('update payload excludes computed and actor fields', () => {
  const payload = buildResearchUpdatePayload({
    query: 'test',
    searchIntent: { primaryIntent: 'informational' },
    version: 9,
    topicId: 1,
    status: 'confirmed',
    evidenceCompleteness: 100,
    overlapAnalysis: { findings: [] },
    createdById: 1,
    confirmedById: 2,
    id: 99,
  });
  assert.equal(payload.query, 'test');
  assert.ok(payload.searchIntent);
  assert.ok(!('version' in payload));
  assert.ok(!('status' in payload));
  assert.ok(!('evidenceCompleteness' in payload));
  assert.ok(!('overlapAnalysis' in payload));
  assert.ok(!('createdById' in payload));
  assert.ok(!('confirmedById' in payload));
  assert.ok(!('id' in payload));
});

test('confirmation payload allowlist', () => {
  assert.deepEqual(buildConfirmationPayload('  Looks good  '), {
    confirmationNote: 'Looks good',
  });
});

test('readiness requires overlap and completeness threshold', () => {
  const readiness = evaluateResearchReadiness({
    snapshot: {
      query: 'keyword',
      sourceType: 'manual',
      searchIntent: {
        primaryIntent: 'informational',
        userNeed: 'need',
        journeyStage: 'solution_awareness',
      },
      serpEvidence: {
        rows: [
          { title: 'a', observedAt: '2026-01-01' },
          { title: 'b', observedAt: '2026-01-01' },
          { title: 'c', observedAt: '2026-01-01' },
        ],
      },
      businessAlignment: {
        serviceRelevanceNotes: 's',
        businessValueNotes: 'b',
        targetServicePaths: ['/software-development-subscription'],
      },
      contentArchitecture: {
        proposedPageType: 'blog_article',
        differentiationAngle: 'angle',
        requiredSections: ['a', 'b', 'c'],
      },
      riskAssessment: {
        cannibalisationNotes: 'possible overlap',
        unsupportedClaimRisks: 'claims',
        evidenceLimitations: 'manual only',
      },
      overlapAnalysis: null,
    },
  });
  assert.equal(readiness.ready, false);
  assert.ok(
    readiness.blockers.some((b) => b.code === 'AUTOPILOT_OVERLAP_ANALYSIS_REQUIRED'),
  );
  assert.ok(readiness.completeness.completeness >= AUTOPILOT_RESEARCH_READY_MIN_COMPLETENESS);
});
