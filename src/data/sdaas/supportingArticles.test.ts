import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
} from '../../constants/canonicalRoutes.ts';
import { contentClusters } from '../contentClusters/index.ts';
import { SDAAS_PAGE_PATH } from './commercialPage.ts';
import { SDAAS_SUPPORTING_ARTICLES } from './supportingArticlesRegistry.ts';

const EXPECTED_ROUTES = [
  SDAAS_MONTHLY_CAPACITY_HREF,
  SDAAS_PRIORITISATION_HREF,
  SDAAS_APPLICATION_RESCUE_HREF,
  SDAAS_TECHNICAL_DEBT_HREF,
  SDAAS_CONTINUOUS_DEVELOPMENT_HREF,
  SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF,
  SDAAS_CHOOSE_PARTNER_HREF,
] as const;

const FORBIDDEN_PHRASES = [
  'guaranteed delivery',
  'unlimited development',
  '24/7 support included',
  'always suitable',
] as const;

test('exactly seven supporting articles are registered live', () => {
  assert.equal(SDAAS_SUPPORTING_ARTICLES.length, 7);
  const paths = new Set(SDAAS_SUPPORTING_ARTICLES.map((article) => article.path));
  assert.equal(paths.size, 7);
  for (const route of EXPECTED_ROUTES) {
    assert.ok(paths.has(route), `missing route ${route}`);
  }
});

test('each supporting article has unique SEO, one H1, direct answer, FAQs and OG asset', () => {
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const h1s = new Set<string>();

  for (const article of SDAAS_SUPPORTING_ARTICLES) {
    assert.equal(article.path, `/insights/${article.slug}`);
    assert.ok(article.seo.title.length > 20);
    assert.ok(article.seo.description.length > 80);
    assert.ok(article.seo.h1.length > 20);
    assert.equal(article.seo.author, 'Primewayz UK');
    assert.equal(article.seo.datePublished, '2026-07-16');
    assert.equal(article.seo.dateModified, '2026-07-16');
    assert.doesNotMatch(article.seo.title.toLowerCase(), /software development subscription uk/);
    assert.ok(article.directAnswer.length > 80);
    assert.ok(article.directAnswerTitle.length > 10);
    assert.equal(article.faqs.length, 10);
    assert.ok(article.sections.length >= 10);
    assert.ok(article.relatedLiveLinks.length >= 3);
    assert.ok(article.geoStatements.length >= 2);
    assert.ok(article.aboutEntities.length >= 2);
    assert.ok(article.mentionEntities.length >= 2);
    assert.match(article.ogImage, /^\/articles\/sdaas\/og-.+\.webp$/);
    assert.ok(article.reusableVisuals.length >= 1);
    assert.ok(article.reusableVisuals.length <= 3);

    titles.add(article.seo.title);
    descriptions.add(article.seo.description);
    h1s.add(article.seo.h1);

    const ogPath = path.resolve(`public${article.ogImage}`);
    assert.ok(existsSync(ogPath), `missing OG file ${article.ogImage}`);

    for (const faq of article.faqs) {
      assert.ok(faq.question.length > 10);
      assert.ok(faq.answer.length > 40);
      for (const phrase of FORBIDDEN_PHRASES) {
        assert.ok(!faq.answer.toLowerCase().includes(phrase), `${article.slug} FAQ: ${phrase}`);
      }
    }

    for (const statement of article.geoStatements) {
      for (const phrase of FORBIDDEN_PHRASES) {
        assert.ok(!statement.toLowerCase().includes(phrase), `${article.slug} GEO: ${phrase}`);
      }
    }

    assert.ok(article.relatedLiveLinks.some((link) => link.href === SDAAS_PAGE_PATH));
    assert.ok(
      article.relatedLiveLinks.every(
        (link) => !link.href.includes('is-software-development-subscription-right-for-your-business'),
      ),
    );
  }

  assert.equal(titles.size, 7);
  assert.equal(descriptions.size, 7);
  assert.equal(h1s.size, 7);
});

test('supporting article direct answers match required GEO-friendly wording', () => {
  const byPath = new Map(SDAAS_SUPPORTING_ARTICLES.map((article) => [article.path, article]));

  assert.match(
    byPath.get(SDAAS_MONTHLY_CAPACITY_HREF)!.directAnswer,
    /agreed amount of recurring delivery effort/i,
  );
  assert.match(
    byPath.get(SDAAS_PRIORITISATION_HREF)!.directAnswer,
    /business value, user impact, urgency/i,
  );
  assert.match(
    byPath.get(SDAAS_APPLICATION_RESCUE_HREF)!.directAnswer,
    /structured process of understanding, stabilising/i,
  );
  assert.match(
    byPath.get(SDAAS_TECHNICAL_DEBT_HREF)!.directAnswer,
    /future cost created when software is built or changed/i,
  );
  assert.match(
    byPath.get(SDAAS_CONTINUOUS_DEVELOPMENT_HREF)!.directAnswer,
    /ongoing operational capability rather than a one-time deliverable/i,
  );
  assert.match(
    byPath.get(SDAAS_MAINTENANCE_VS_DEVELOPMENT_HREF)!.directAnswer,
    /keeps an application dependable and compatible/i,
  );
  assert.match(
    byPath.get(SDAAS_CHOOSE_PARTNER_HREF)!.directAnswer,
    /not only by comparing hourly rates/i,
  );
});

test('content cluster marks all seven supporting articles live', () => {
  const registry = contentClusters.sdaas.assets.articleRegistry;
  assert.ok(registry);

  for (const route of EXPECTED_ROUTES) {
    const entry = registry.find((item) => item.route === route);
    assert.ok(entry, `registry missing ${route}`);
    assert.equal(entry.status, 'live');
    assert.equal(entry.relatedCommercialPage, SDAAS_PAGE_PATH);
    assert.ok(entry.analyticsNamespace);
    assert.equal(entry.datePublished, '2026-07-16');
    assert.ok(contentClusters.sdaas.assets.supportingArticles?.includes(route));
  }

  assert.ok(
    registry.every(
      (item) =>
        item.route !== '/insights/is-software-development-subscription-right-for-your-business',
    ),
  );
});

test('analytics namespaces stay distinct across supporting articles', () => {
  const namespaces = new Set(SDAAS_SUPPORTING_ARTICLES.map((article) => article.analyticsNamespace));
  assert.equal(namespaces.size, 7);
});
