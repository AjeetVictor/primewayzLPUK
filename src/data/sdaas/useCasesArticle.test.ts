import assert from 'node:assert/strict';
import test from 'node:test';
import { SDAAS_USE_CASES_HREF } from '../../constants/canonicalRoutes.ts';
import { contentClusters } from '../contentClusters/index.ts';
import {
  buyerEvaluationChecklist,
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_PAGE_PATH,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_USE_CASES_DIRECT_ANSWER,
  SDAAS_USE_CASES_OG_IMAGE,
  SDAAS_USE_CASES_PATH,
  SDAAS_USE_CASES_SEO,
  subscriptionUseCases,
  USE_CASES_GEO_STATEMENTS,
  useCaseMatrixRows,
  useCasesFaqs,
  useCasesRelatedLiveLinks,
} from './useCasesArticle.ts';

test('use-cases article route and SEO target MOF intent without cannibalising commercial page', () => {
  assert.equal(SDAAS_USE_CASES_PATH, '/insights/software-development-subscription-use-cases');
  assert.equal(SDAAS_USE_CASES_HREF, SDAAS_USE_CASES_PATH);
  assert.match(SDAAS_USE_CASES_SEO.title, /10 Software Development Subscription Use Cases/i);
  assert.match(SDAAS_USE_CASES_SEO.description, /SaaS improvement|application rescue|integrations/i);
  assert.equal(
    SDAAS_USE_CASES_SEO.h1,
    '10 Software Development Subscription Use Cases for Growing Businesses',
  );
  assert.doesNotMatch(SDAAS_USE_CASES_SEO.title.toLowerCase(), /software development subscription uk/);
});

test('use-cases dates and OG image stay static editorial assets', () => {
  assert.equal(SDAAS_USE_CASES_SEO.datePublished, '2026-07-16');
  assert.equal(SDAAS_USE_CASES_SEO.dateModified, '2026-07-16');
  assert.equal(
    SDAAS_USE_CASES_OG_IMAGE,
    '/articles/sdaas/og-software-development-subscription-use-cases.webp',
  );
});

test('use-cases lead with a balanced direct answer', () => {
  assert.match(SDAAS_USE_CASES_DIRECT_ANSWER, /recurring, evolving work/i);
  assert.match(SDAAS_USE_CASES_DIRECT_ANSWER, /shared backlog/i);
  assert.ok(USE_CASES_GEO_STATEMENTS.some((statement) => /unknown codebase/i.test(statement)));
  assert.ok(
    USE_CASES_GEO_STATEMENTS.every(
      (statement) =>
        !statement.toLowerCase().includes('always suitable') &&
        !statement.toLowerCase().includes('guaranteed'),
    ),
  );
});

test('exactly ten distinct use cases with required structure', () => {
  assert.equal(subscriptionUseCases.length, 10);
  const ids = new Set(subscriptionUseCases.map((item) => item.id));
  assert.equal(ids.size, 10);
  for (const useCase of subscriptionUseCases) {
    assert.ok(useCase.situation.length > 40);
    assert.ok(useCase.recurringWork.length >= 4);
    assert.ok(useCase.whySubscription.length >= 3);
    assert.ok(useCase.whenOtherModel.length >= 3);
  }
  assert.ok(subscriptionUseCases.some((item) => item.id === 'post_mvp_saas'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'feature_backlog'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'application_rescue'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'integrations'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'process_automation'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'internal_systems'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'technical_debt'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'reporting_dashboards'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'maintenance_enhancement'));
  assert.ok(subscriptionUseCases.some((item) => item.id === 'agency_white_label'));
});

test('application rescue requires discovery boundary', () => {
  const rescue = subscriptionUseCases.find((item) => item.id === 'application_rescue');
  assert.ok(rescue?.boundaryNote);
  assert.match(rescue.boundaryNote, /discovery or stabilisation/i);
});

test('comparison matrix and buyer checklist are complete', () => {
  assert.equal(useCaseMatrixRows.length, 10);
  assert.equal(buyerEvaluationChecklist.length, 15);
  assert.ok(buyerEvaluationChecklist.some((item) => /another model/i.test(item)));
});

test('use-cases FAQs stay balanced and avoid unsupported promises', () => {
  assert.equal(useCasesFaqs.length, 10);
  assert.ok(useCasesFaqs.some((faq) => /suitable for a software development subscription/i.test(faq.question)));
  assert.ok(useCasesFaqs.some((faq) => /fixed-price/i.test(faq.question)));
  assert.ok(
    useCasesFaqs.every(
      (faq) =>
        faq.answer.length > 40 &&
        !faq.answer.toLowerCase().includes('guaranteed delivery') &&
        !faq.answer.toLowerCase().includes('unlimited development') &&
        !faq.answer.toLowerCase().includes('24/7 support included'),
    ),
  );
});

test('use-cases links live cluster pages only', () => {
  assert.ok(useCasesRelatedLiveLinks.some((link) => link.href === SDAAS_PAGE_PATH));
  assert.ok(useCasesRelatedLiveLinks.some((link) => link.href === SDAAS_PILLAR_GUIDE_HREF));
  assert.ok(useCasesRelatedLiveLinks.some((link) => link.href === SDAAS_COMPARISON_VS_FIXED_PRICE_HREF));
  assert.ok(
    useCasesRelatedLiveLinks.some(
      (link) => link.href === '/insights/how-monthly-software-development-capacity-works',
    ),
  );
  assert.ok(
    useCasesRelatedLiveLinks.every(
      (link) => !link.href.includes('is-software-development-subscription-right-for-your-business'),
    ),
  );
  assert.equal(SDAAS_CAPACITY_REQUEST_PATH, '/software-development-subscription-uk/request-capacity');
});

test('content cluster marks use-cases article live with registry metadata', () => {
  const registry = contentClusters.sdaas.assets.articleRegistry;
  assert.ok(registry);
  const entry = registry.find((item) => item.route === SDAAS_USE_CASES_PATH);
  assert.ok(entry);
  assert.equal(entry.status, 'live');
  assert.equal(entry.contentType, 'use-cases');
  assert.equal(entry.funnelStage, 'mof');
  assert.equal(entry.relatedCommercialPage, SDAAS_PAGE_PATH);
  assert.equal(entry.relatedPillarGuide, SDAAS_PILLAR_GUIDE_HREF);
  assert.equal(entry.relatedComparisonGuide, SDAAS_COMPARISON_VS_FIXED_PRICE_HREF);
  assert.equal(entry.analyticsNamespace, 'sdaas_use_cases');
  assert.equal(entry.datePublished, '2026-07-16');
  assert.ok(contentClusters.sdaas.assets.supportingArticles?.includes(SDAAS_USE_CASES_PATH));
  assert.ok(
    registry.every(
      (item) =>
        item.route !== '/insights/is-software-development-subscription-right-for-your-business',
    ),
  );
  assert.ok(
    registry.some(
      (item) =>
        item.status === 'live' &&
        item.route === '/insights/how-monthly-software-development-capacity-works',
    ),
  );
});
