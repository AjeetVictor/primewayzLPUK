import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildRecommendedFocus,
  dedupeRecommendedFocus,
  normalizeRecommendedFocus,
  type RecommendedFocusItem,
} from './buildRecommendedFocus.ts';
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

describe('buildRecommendedFocus', () => {
  it('Scenario A: groups three tracking actions into one focus card', () => {
    const checks = [
      makeCheck({
        id: 'analytics-readiness',
        name: 'Analytics / Tracking Readiness',
        status: 'partial',
        points: 3,
        maxPoints: 5,
        explanation: 'Analytics technology was detected in the audited HTML. However, event accuracy, consent configuration and enquiry-conversion tracking could not be fully verified through this automated audit.',
        recommendations: [
          'Use a tag manager where multiple tags require central governance.',
          'Add Meta Pixel only when Meta advertising is actively used.',
          'Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.',
        ],
      }),
      makeCheck({ id: 'technical-seo', name: 'Technical SEO', status: 'good', points: 15, maxPoints: 15 }),
    ];

    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);

    assert.equal(focus.length, 1);
    assert.equal(focus[0].categoryId, 'analytics-readiness');
    assert.equal(focus[0].recommendedActions.length, 3);
    assert.equal(focus[0].label, 'Priority 1');
  });

  it('Scenario B: selects three cards from three distinct categories', () => {
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
    assert.ok(ids.includes('analytics-readiness'));
    assert.ok(ids.includes('technical-seo'));
    assert.ok(ids.includes('trust-signals'));
  });

  it('Scenario C: shows one priority card when only one weak category exists', () => {
    const checks = [
      makeCheck({
        id: 'analytics-readiness',
        name: 'Analytics / Tracking Readiness',
        status: 'gap',
        points: 0,
        maxPoints: 5,
        recommendations: [
          'Confirm GA4 setup.',
          'Use a tag manager where multiple tags require central governance.',
          'Add Meta Pixel only when Meta advertising is actively used.',
        ],
      }),
      makeCheck({ id: 'technical-seo', name: 'Technical SEO', status: 'good', points: 15, maxPoints: 15 }),
      makeCheck({ id: 'trust-signals', name: 'Trust Signals', status: 'good', points: 15, maxPoints: 15 }),
    ];

    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);

    assert.equal(focus.length, 1);
    assert.equal(focus[0].categoryId, 'analytics-readiness');
    assert.equal(focus[0].recommendedActions.length, 3);
  });

  it('Scenario F: final dedupe keeps one card per category when duplicates arrive', () => {
    const duplicates: RecommendedFocusItem[] = [
      {
        categoryId: 'analytics-readiness',
        categoryTitle: 'Analytics / Tracking Readiness',
        problem: 'Problem A',
        whyItMatters: 'Why A',
        recommendedActions: ['Use a tag manager where multiple tags require central governance.'],
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
      {
        categoryId: 'analytics-readiness',
        categoryTitle: 'Analytics / Tracking Readiness',
        problem: 'Problem A',
        whyItMatters: 'Why A',
        recommendedActions: ['Add the LinkedIn Insight Tag only when LinkedIn campaigns or conversion audiences are in use.'],
        score: 3,
        maxScore: 5,
        status: 'partial',
        label: 'Priority 3',
      },
    ];

    const focus = dedupeRecommendedFocus(duplicates);

    assert.equal(focus.length, 1);
    assert.equal(focus[0].recommendedActions.length, 3);
  });

  it('normalises legacy flattened priority records into grouped actions', () => {
    const legacy = [
      {
        label: 'Priority 1',
        title: 'Analytics / Tracking Readiness',
        explanation: 'Tracking needs review.',
        whyItMatters: 'Measurement matters.',
        recommendedAction: 'Use a tag manager where multiple tags require central governance.',
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
    assert.match(normalised[0].categoryTitle, /Analytics/);
  });
});

describe('analytics scoring and wording', () => {
  it('Scenario D: explains verification limits when tracking technology is detected', () => {
    const signals = extractAnalyticsSignals(makeContext(`
      <script src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
      <script>gtag('config', 'G-TEST');</script>
    `));
    const { checks } = scoreAudit(signals);
    const analytics = checks.find((check) => check.id === 'analytics-readiness');

    assert.ok(analytics);
    assert.match(analytics.explanation, /could not be fully verified/i);
    assert.match(analytics.explanation, /Analytics technology was detected/i);
  });

  it('Scenario E: missing Meta Pixel and LinkedIn do not create separate critical priorities or score penalties', () => {
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

    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);
    assert.equal(focus.some((item) => item.categoryId === 'analytics-readiness'), false);
    assert.equal(
      focus.filter((item) => /Meta Pixel|LinkedIn Insight/i.test(item.recommendedActions.join(' '))).length,
      0,
    );
  });

  it('keeps optional platform tips grouped when core analytics signals are incomplete', () => {
    const signals = extractAnalyticsSignals(makeContext(`
      <script src="https://www.googletagmanager.com/gtag/js?id=G-TEST"></script>
      <script>gtag('config', 'G-TEST');</script>
    `));
    const { checks } = scoreAudit(signals);
    const analytics = checks.find((check) => check.id === 'analytics-readiness');
    const focus = buildRecommendedFocus(checks, WHY_IT_MATTERS);
    const trackingFocus = focus.find((item) => item.categoryId === 'analytics-readiness');

    assert.ok(analytics);
    assert.ok(analytics.points < analytics.maxPoints);
    assert.ok(trackingFocus);
    assert.equal(focus.filter((item) => item.categoryId === 'analytics-readiness').length, 1);
    assert.ok(trackingFocus.recommendedActions.some((action) => /tag manager/i.test(action)));
    assert.ok(trackingFocus.recommendedActions.some((action) => /Meta Pixel only when/i.test(action)));
    assert.ok(trackingFocus.recommendedActions.some((action) => /LinkedIn Insight Tag only when/i.test(action)));
  });
});
