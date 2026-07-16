import assert from 'node:assert/strict';
import test from 'node:test';
import { SDAAS_COMPARISON_VS_FIXED_PRICE_HREF } from '../../constants/canonicalRoutes.ts';
import { contentClusters } from '../contentClusters/index.ts';
import {
  COMPARISON_GEO_STATEMENTS,
  comparisonFaqs,
  comparisonRelatedLiveLinks,
  decisionChecklist,
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_COMPARISON_DIRECT_ANSWER,
  SDAAS_COMPARISON_OG_IMAGE,
  SDAAS_COMPARISON_PATH,
  SDAAS_COMPARISON_SEO,
  SDAAS_PAGE_PATH,
  SDAAS_PILLAR_GUIDE_HREF,
  sideBySideRows,
  workedScenarios,
} from './comparisonArticle.ts';

test('comparison article route and SEO target decision intent without cannibalising commercial page', () => {
  assert.equal(SDAAS_COMPARISON_PATH, '/insights/software-development-subscription-vs-fixed-price');
  assert.equal(SDAAS_COMPARISON_VS_FIXED_PRICE_HREF, SDAAS_COMPARISON_PATH);
  assert.match(SDAAS_COMPARISON_SEO.title, /Subscription vs Fixed-Price/i);
  assert.match(SDAAS_COMPARISON_SEO.description, /scope, flexibility, cost, procurement/i);
  assert.equal(SDAAS_COMPARISON_SEO.h1, 'Software Development Subscription vs Fixed-Price Development');
  assert.doesNotMatch(SDAAS_COMPARISON_SEO.title.toLowerCase(), /software development subscription uk/);
});

test('comparison dates and OG image stay static editorial assets', () => {
  assert.equal(SDAAS_COMPARISON_SEO.datePublished, '2026-07-16');
  assert.equal(SDAAS_COMPARISON_SEO.dateModified, '2026-07-16');
  assert.equal(
    SDAAS_COMPARISON_OG_IMAGE,
    '/articles/sdaas/og-software-development-subscription-vs-fixed-price.webp',
  );
});

test('comparison leads with a balanced direct answer', () => {
  assert.match(SDAAS_COMPARISON_DIRECT_ANSWER, /fixed-price project/i);
  assert.match(SDAAS_COMPARISON_DIRECT_ANSWER, /recurring delivery capacity/i);
  assert.ok(COMPARISON_GEO_STATEMENTS.some((statement) => /reprioritisation/i.test(statement)));
  assert.ok(
    COMPARISON_GEO_STATEMENTS.every(
      (statement) =>
        !statement.toLowerCase().includes('always cheaper') &&
        !statement.toLowerCase().includes('always faster'),
    ),
  );
});

test('comparison table covers procurement-critical rows', () => {
  assert.ok(sideBySideRows.length >= 12);
  const aspects = sideBySideRows.map((row) => row.aspect);
  assert.ok(aspects.includes('Best suited to'));
  assert.ok(aspects.includes('Budget structure'));
  assert.ok(aspects.includes('Requirements changes'));
  assert.ok(aspects.includes('Procurement'));
  assert.ok(aspects.includes('Delivery continuity'));
});

test('comparison FAQs stay balanced and avoid unsupported promises', () => {
  assert.equal(comparisonFaqs.length, 10);
  assert.ok(comparisonFaqs.some((faq) => /cheaper/i.test(faq.question)));
  assert.ok(comparisonFaqs.some((faq) => /unlimited/i.test(faq.question)));
  assert.ok(comparisonFaqs.some((faq) => /combined/i.test(faq.question)));
  assert.ok(
    comparisonFaqs.every(
      (faq) =>
        faq.answer.length > 40 &&
        !faq.answer.toLowerCase().includes('guaranteed delivery') &&
        !faq.answer.toLowerCase().includes('unlimited development') &&
        !faq.answer.toLowerCase().includes('always cheaper'),
    ),
  );
});

test('decision checklist and scenarios support buyer evaluation', () => {
  assert.equal(decisionChecklist.length, 10);
  assert.ok(workedScenarios.length >= 4);
  assert.ok(workedScenarios.some((scenario) => /fixed-price/i.test(scenario.model)));
  assert.ok(workedScenarios.some((scenario) => /subscription/i.test(scenario.model)));
  assert.ok(workedScenarios.some((scenario) => /discovery/i.test(scenario.model)));
});

test('comparison links live commercial, pillar, use-cases and capacity routes only', () => {
  assert.ok(comparisonRelatedLiveLinks.some((link) => link.href === SDAAS_PAGE_PATH));
  assert.ok(comparisonRelatedLiveLinks.some((link) => link.href === SDAAS_PILLAR_GUIDE_HREF));
  assert.ok(
    comparisonRelatedLiveLinks.some(
      (link) => link.href === '/insights/software-development-subscription-use-cases',
    ),
  );
  assert.ok(
    comparisonRelatedLiveLinks.some(
      (link) => link.href === '/insights/how-monthly-software-development-capacity-works',
    ),
  );
  assert.ok(
    comparisonRelatedLiveLinks.every(
      (link) => !link.href.includes('is-software-development-subscription-right-for-your-business'),
    ),
  );
  assert.equal(SDAAS_CAPACITY_REQUEST_PATH, '/software-development-subscription-uk/request-capacity');
});

test('content cluster marks comparison article live with registry metadata', () => {
  const registry = contentClusters.sdaas.assets.articleRegistry;
  assert.ok(registry);
  const comparison = registry.find((entry) => entry.route === SDAAS_COMPARISON_PATH);
  assert.ok(comparison);
  assert.equal(comparison.status, 'live');
  assert.equal(comparison.contentType, 'comparison');
  assert.equal(comparison.funnelStage, 'mof');
  assert.equal(comparison.relatedCommercialPage, SDAAS_PAGE_PATH);
  assert.equal(comparison.relatedPillarGuide, SDAAS_PILLAR_GUIDE_HREF);
  assert.equal(comparison.analyticsNamespace, 'sdaas_comparison');
  assert.ok(contentClusters.sdaas.assets.comparisonPages?.includes(SDAAS_COMPARISON_PATH));
  assert.ok(contentClusters.sdaas.assets.supportingArticles?.includes(SDAAS_COMPARISON_PATH));
});
