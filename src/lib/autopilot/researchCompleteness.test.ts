import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AUTOPILOT_RESEARCH_COMPLETENESS_VERSION,
  AUTOPILOT_RESEARCH_SECTION_WEIGHTS,
} from '../../data/autopilot/researchConfig.ts';
import { calculateResearchCompleteness } from './researchCompleteness.ts';

test('empty research scores near zero with missing items', () => {
  const result = calculateResearchCompleteness({});
  assert.equal(result.version, AUTOPILOT_RESEARCH_COMPLETENESS_VERSION);
  assert.equal(result.completeness, 0);
  assert.ok(result.missingItems.length > 0);
  assert.equal(
    result.sectionScores.reduce((sum, s) => sum + s.weight, 0),
    Object.values(AUTOPILOT_RESEARCH_SECTION_WEIGHTS).reduce((a, b) => a + b, 0),
  );
});

test('complete search intent section scores full weight', () => {
  const result = calculateResearchCompleteness({
    searchIntent: {
      primaryIntent: 'informational',
      userNeed: 'Understand SDaaS pricing',
      journeyStage: 'solution_awareness',
    },
  });
  const section = result.sectionScores.find((s) => s.key === 'searchIntent');
  assert.ok(section);
  assert.equal(section.complete, true);
  assert.equal(section.score, AUTOPILOT_RESEARCH_SECTION_WEIGHTS.searchIntent);
});

test('SERP evidence complete with three rows', () => {
  const result = calculateResearchCompleteness({
    serpEvidence: {
      rows: [
        { title: 'A', url: 'https://example.com/a', observedAt: '2026-01-01' },
        { title: 'B', url: 'https://example.com/b', observedAt: '2026-01-01' },
        { title: 'C', url: 'https://example.com/c', observedAt: '2026-01-01' },
      ],
    },
  });
  const section = result.sectionScores.find((s) => s.key === 'serpEvidence');
  assert.equal(section?.complete, true);
  assert.equal(section?.score, AUTOPILOT_RESEARCH_SECTION_WEIGHTS.serpEvidence);
});

test('SERP evidence limitation fallback allows fewer rows', () => {
  const result = calculateResearchCompleteness({
    serpEvidence: {
      rows: [{ title: 'Only one' }],
      evidenceLimitation: 'Limited public SERP access during research window.',
    },
  });
  const section = result.sectionScores.find((s) => s.key === 'serpEvidence');
  assert.equal(section?.complete, true);
});

test('business alignment requires notes and path or no-path reason', () => {
  const incomplete = calculateResearchCompleteness({
    businessAlignment: {
      serviceRelevanceNotes: 'Relevant',
      businessValueNotes: 'Valuable',
    },
  });
  assert.equal(
    incomplete.sectionScores.find((s) => s.key === 'businessAlignment')?.complete,
    false,
  );

  const complete = calculateResearchCompleteness({
    businessAlignment: {
      serviceRelevanceNotes: 'Relevant',
      businessValueNotes: 'Valuable',
      targetServicePaths: ['/software-development-subscription'],
    },
  });
  assert.equal(
    complete.sectionScores.find((s) => s.key === 'businessAlignment')?.complete,
    true,
  );

  const viaReason = calculateResearchCompleteness({
    businessAlignment: {
      serviceRelevanceNotes: 'Relevant',
      businessValueNotes: 'Valuable',
      noSuitablePathReason: 'No clear commercial page for this niche topic.',
    },
  });
  assert.equal(
    viaReason.sectionScores.find((s) => s.key === 'businessAlignment')?.complete,
    true,
  );
});

test('architecture requires page type, angle, and three items', () => {
  const result = calculateResearchCompleteness({
    contentArchitecture: {
      proposedPageType: 'blog_article',
      differentiationAngle: 'UK SME focus with SDaaS framing',
      requiredSections: ['Intro', 'How it works', 'Next steps'],
    },
  });
  assert.equal(
    result.sectionScores.find((s) => s.key === 'contentArchitecture')?.complete,
    true,
  );
});

test('risk assessment requires cannibalisation, claims, and limitations', () => {
  const result = calculateResearchCompleteness({
    riskAssessment: {
      cannibalisationNotes: 'Possible overlap with existing guide — requires editorial review.',
      unsupportedClaimRisks: 'Avoid inventing ranking claims.',
      evidenceLimitations: 'Manual SERP rows only; not live-verified.',
    },
  });
  assert.equal(
    result.sectionScores.find((s) => s.key === 'riskAssessment')?.complete,
    true,
  );
});

test('weighted total is deterministic and rounded to one decimal', () => {
  const input = {
    searchIntent: {
      primaryIntent: 'informational' as const,
      userNeed: 'Need',
      journeyStage: 'problem_awareness' as const,
    },
    serpEvidence: {
      evidenceLimitation: 'Fewer than three visible results in research window.',
    },
    businessAlignment: {
      serviceRelevanceNotes: 'Yes',
      businessValueNotes: 'Yes',
      targetCommercialPaths: ['/software-development-subscription'],
    },
    contentArchitecture: {
      proposedPageType: 'supporting',
      differentiationAngle: 'Angle',
      supportingQuestions: ['Q1', 'Q2', 'Q3'],
    },
    riskAssessment: {
      cannibalisationNotes: 'Potential overlap',
      unsupportedClaimRisks: 'Claim risk noted',
      evidenceLimitations: 'Manual evidence only',
    },
  };
  const a = calculateResearchCompleteness(input);
  const b = calculateResearchCompleteness(input);
  assert.equal(a.completeness, b.completeness);
  assert.equal(a.completeness, 100);
  assert.equal(a.version, AUTOPILOT_RESEARCH_COMPLETENESS_VERSION);
});

test('completeness function ignores any client total property on input object', () => {
  const sneaky = {
    searchIntent: null,
    serpEvidence: null,
    completeness: 100,
    evidenceCompleteness: 100,
  } as Parameters<typeof calculateResearchCompleteness>[0] & {
    completeness: number;
    evidenceCompleteness: number;
  };
  const result = calculateResearchCompleteness(sneaky);
  assert.equal(result.completeness, 0);
});
