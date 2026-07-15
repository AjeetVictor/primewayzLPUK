import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRecommendedFocus,
  dedupeRecommendedFocus,
  normalizeRecommendedFocus,
  type RecommendedFocusItem,
} from './buildRecommendedFocus.ts';
import {
  classifyActionImportance,
  getFindingLabel,
  normalizeRecommendationActions,
} from './recommendationActions.ts';
import { extractAnalyticsSignals } from '../extractors/analyticsSignals.ts';
import { scoreAudit } from '../scoring/scoreAudit.ts';
import type { AuditCheck, AuditContext } from '../types.ts';

const WHY_IT_MATTERS = {
  'analytics-readiness': {
    whyItMatters:
      'Without reliable tracking, the business cannot confidently identify which channels, pages or campaigns generate meaningful enquiries.',
  },
  'technical-seo': {
    whyItMatters: 'Clear technical signals help search engines interpret public pages consistently.',
  },
  'trust-signals': {
    whyItMatters: 'Visitors need enough context to understand who operates the site.',
  },
  'lead-capture': {
    whyItMatters: 'A visible next step helps interested visitors become measurable enquiries.',
  },
};

function makeCheck(partial: Partial<AuditCheck> & Pick<AuditCheck, 'id' | 'name' | 'status'>): AuditCheck {
  return {
    points: 0,
    maxPoints: 10,
    explanation: `${partial.name} needs attention.`,
    evidence: [],
    recommendations: [],
    ...partial,
  };
}

function makeContext(html: string): AuditContext {
  return {
    input: {
      websiteUrl: 'https://example.com',
      businessName: 'Example',
      businessType: 'services',
      targetCountry: 'UK',
    },
    crawl: {
      auditedUrl: 'https://example.com',
      normalizedHost: 'example.com',
      pages: [],
      pagesAttempted: 1,
      robotsAccessible: false,
      sitemapAccessible: false,
    },
    combinedHtml: html,
    combinedText: '',
    homepage: {
      requestedUrl: 'https://example.com',
      finalUrl: 'https://example.com',
      status: 200,
      ok: true,
      html,
      contentType: 'text/html',
      bytesRead: html.length,
    },
  };
}

describe('finding labels and category wording', () => {
  it('Scenario A: good Trust Signals uses WHAT WE FOUND and natural wording', () => {
    const signals = [
      {
        key: 'trust-about',
        category: 'trust-signals' as const,
        status: 'found' as const,
        confidence: 1,
        points: 15,
        maxPoints: 15,
        evidence: [],
        recommendations: [],
      },
    ];
    // Score only trust category indirectly via full scoreAudit with only trust signals —
    // missing other categories will score low; assert the trust check specifically.
    const { checks } = scoreAudit(signals);
    const trust = checks.find((check) => check.id === 'trust-signals');

    assert.ok(trust);
    assert.equal(trust.status, 'good');
    assert.equal(getFindingLabel(trust.status), 'What we found');
    assert.notEqual(getFindingLabel(trust.status), 'Problem observed');
    assert.doesNotMatch(trust.explanation, /Trust Signals signals/i);
    assert.match(trust.explanation, /Trust signals are well represented/i);
  });

  it('Scenario B: partial Tracking Readiness uses AREA TO REVIEW', () => {
    assert.equal(getFindingLabel('partial'), 'Area to review');
  });

  it('Scenario C: weak/gap categories use PROBLEM OBSERVED', () => {
    assert.equal(getFindingLabel('gap'), 'Problem observed');
  });
});

describe('recommendation action classification', () => {
  it('Scenario F: normalises legacy string[] recommendations without error', () => {
    const actions = normalizeRecommendationActions(
      [
        'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.',
        'Add Meta Pixel only when Meta advertising is actively used.',
        'Add Meta Pixel only when Meta advertising is actively used.',
        { text: 'Review cookie consent and consent-mode behaviour where applicable.', importance: 'important' },
      ],
      'analytics-readiness',
    );

    assert.equal(actions.length, 3);
    assert.equal(actions[0].importance, 'important');
    assert.equal(actions[1].importance, 'optional');
    assert.equal(actions[2].importance, 'important');
  });
});

describe('buildRecommendedFocus', () => {
  it('groups tracking actions into one focus card', () => {
    const checks = [
      makeCheck({
        id: 'analytics-readiness',
        name: 'Analytics / Tracking Readiness',
        status: 'partial',
        points: 3,
        maxPoints: 5,
        explanation: 'Analytics technology was detected in the audited HTML. However, event accuracy, consent configuration and enquiry-conversion tracking could not be fully verified through this automated audit.',
        recommendations: [
          'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.',
          'Review cookie consent and consent-mode behaviour where applicable.',
          'Use a tag manager where multiple marketing tags require central governance.',
          'Add Meta Pixel only when Meta advertising is actively used.',
          'Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.',
        ],
      }),
      makeCheck({ id: 'technical-seo', name: 'Technical SEO', status: 'good', points: 15, maxPoints: 15 }),
    ];

    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);

    assert.equal(focus.length, 1);
    assert.equal(focus[0].categoryId, 'analytics-readiness');
    assert.equal(focus[0].recommendedActions.length, 5);
    assert.equal(focus[0].label, 'Priority 1');
  });

  it('Scenario G: Recommended Focus remains category-level with no flattened duplicates', () => {
    const checks = [
      makeCheck({
        id: 'analytics-readiness',
        name: 'Analytics / Tracking Readiness',
        status: 'partial',
        points: 3,
        maxPoints: 5,
        recommendations: [
          'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.',
          'Review cookie consent and consent-mode behaviour where applicable.',
          'Use a tag manager where multiple marketing tags require central governance.',
          'Add Meta Pixel only when Meta advertising is actively used.',
          'Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.',
        ],
      }),
      makeCheck({
        id: 'external-presence',
        name: 'External Presence Readiness',
        status: 'partial',
        points: 5,
        maxPoints: 10,
        recommendations: ['Add visible links to official social profiles where relevant.'],
      }),
    ];

    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);
    const trackingCards = focus.filter((item) => item.categoryId === 'analytics-readiness');

    assert.equal(trackingCards.length, 1);
    assert.ok(trackingCards[0].recommendedActions.length >= 3);
    assert.deepEqual(new Set(focus.map((item) => item.categoryId)).size, focus.length);
  });

  it('selects three cards from three distinct categories', () => {
    const checks = [
      makeCheck({
        id: 'analytics-readiness',
        name: 'Analytics / Tracking Readiness',
        status: 'gap',
        points: 0,
        maxPoints: 5,
        recommendations: ['Confirm GA4 setup.'],
      }),
      makeCheck({
        id: 'technical-seo',
        name: 'Technical SEO',
        status: 'gap',
        points: 2,
        maxPoints: 15,
        recommendations: ['Improve titles and meta descriptions.'],
      }),
      makeCheck({
        id: 'trust-signals',
        name: 'Trust Signals',
        status: 'partial',
        points: 6,
        maxPoints: 15,
        recommendations: ['Add clearer contact and policy pages.'],
      }),
      makeCheck({
        id: 'lead-capture',
        name: 'Lead Capture',
        status: 'good',
        points: 15,
        maxPoints: 15,
      }),
    ];

    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);

    assert.equal(focus.length, 3);
    const ids = focus.map((item) => item.categoryId);
    assert.deepEqual(new Set(ids).size, 3);
  });

  it('shows one priority card when only one weak category exists', () => {
    const checks = [
      makeCheck({
        id: 'analytics-readiness',
        name: 'Analytics / Tracking Readiness',
        status: 'gap',
        points: 0,
        maxPoints: 5,
        recommendations: [
          'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.',
          'Use a tag manager where multiple marketing tags require central governance.',
          'Add Meta Pixel only when Meta advertising is actively used.',
        ],
      }),
      makeCheck({ id: 'technical-seo', name: 'Technical SEO', status: 'good', points: 15, maxPoints: 15 }),
      makeCheck({ id: 'trust-signals', name: 'Trust Signals', status: 'good', points: 15, maxPoints: 15 }),
    ];

    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);

    assert.equal(focus.length, 1);
    assert.equal(focus[0].categoryId, 'analytics-readiness');
  });

  it('final dedupe keeps one card per category when duplicates arrive', () => {
    const duplicates: RecommendedFocusItem[] = [
      {
        categoryId: 'analytics-readiness',
        categoryTitle: 'Analytics / Tracking Readiness',
        problem: 'Problem A',
        whyItMatters: 'Why A',
        recommendedActions: ['Use a tag manager where multiple marketing tags require central governance.'],
        score: 3,
        maxScore: 5,
        status: 'partial',
        label: 'Priority 1',
      },
      {
        categoryId: 'analytics-readiness',
        categoryTitle: 'Analytics / Tracking Readiness',
        problem: 'Problem A',
        whyItMatters: 'Why A',
        recommendedActions: ['Add Meta Pixel only when Meta advertising is actively used.'],
        score: 3,
        maxScore: 5,
        status: 'partial',
        label: 'Priority 2',
      },
    ];

    const focus = dedupeRecommendedFocus(duplicates);

    assert.equal(focus.length, 1);
    assert.equal(focus[0].recommendedActions.length, 2);
  });

  it('normalises legacy flattened priority records into grouped actions', () => {
    const legacy = [
      {
        label: 'Priority 1',
        title: 'Analytics / Tracking Readiness',
        explanation: 'Tracking needs review.',
        whyItMatters: 'Measurement matters.',
        recommendedAction: 'Use a tag manager where multiple marketing tags require central governance.',
      },
      {
        label: 'Priority 2',
        title: 'Analytics / Tracking Readiness',
        explanation: 'Tracking needs review.',
        whyItMatters: 'Measurement matters.',
        recommendedAction: 'Add Meta Pixel only when Meta advertising is actively used.',
      },
    ];

    const normalised = normalizeRecommendedFocus(legacy);

    assert.equal(normalised.length, 1);
    assert.equal(normalised[0].recommendedActions.length, 2);
  });
});

describe('analytics scoring and wording', () => {
  it('Scenario D: GA detected without verifiable events uses ordered tracking actions', () => {
    const signals = extractAnalyticsSignals(makeContext(`
      <script src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
      <script>gtag('config', 'G-TEST');</script>
    `));
    const { checks } = scoreAudit(signals);
    const analytics = checks.find((check) => check.id === 'analytics-readiness');

    assert.ok(analytics);
    assert.equal(analytics.status, 'partial');
    assert.equal(getFindingLabel(analytics.status), 'Area to review');
    assert.match(analytics.explanation, /could not be fully verified/i);
    assert.deepEqual(analytics.recommendations, [
      'Verify that Google Analytics and key enquiry-conversion events are configured and recording correctly.',
      'Review cookie consent and consent-mode behaviour where applicable.',
      'Use a tag manager where multiple marketing tags require central governance.',
      'Add Meta Pixel only when Meta advertising is actively used.',
      'Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.',
    ]);

    const classified = normalizeRecommendationActions(analytics.recommendations, 'analytics-readiness');
    assert.equal(classified[0].importance, 'important');
    assert.equal(classified[1].importance, 'important');
    assert.equal(classified[2].importance, 'recommended');
    assert.equal(classified[3].importance, 'optional');
    assert.equal(classified[4].importance, 'optional');
  });

  it('Scenario E: missing Meta/LinkedIn do not penalise score and stay optional', () => {
    const signals = extractAnalyticsSignals(makeContext(`
      <script src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
      <script src="https://www.googletagmanager.com/gtm.js?id=GTM-TEST"></script>
      <script>gtag('config', 'G-TEST');</script>
    `));
    const { checks } = scoreAudit(signals);
    const analytics = checks.find((check) => check.id === 'analytics-readiness');

    assert.ok(analytics);
    assert.equal(analytics.points, 5);
    assert.equal(analytics.status, 'good');
    assert.equal(analytics.recommendations.length, 0);

    assert.equal(
      classifyActionImportance('Add Meta Pixel only when Meta advertising is actively used.', 'analytics-readiness'),
      'optional',
    );
    assert.equal(
      classifyActionImportance(
        'Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.',
        'analytics-readiness',
      ),
      'optional',
    );
    assert.notEqual(
      classifyActionImportance('Add Meta Pixel only when Meta advertising is actively used.', 'analytics-readiness'),
      'important',
    );
  });
});
