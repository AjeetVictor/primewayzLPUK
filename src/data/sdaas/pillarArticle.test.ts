import assert from 'node:assert/strict';
import test from 'node:test';
import { SDAAS_PILLAR_GUIDE_HREF } from '../../constants/canonicalRoutes.ts';
import { contentClusters } from '../contentClusters/index.ts';
import {
  pillarFaqs,
  relatedLiveLinks,
  SDAAS_PAGE_PATH,
  SDAAS_PILLAR_DIRECT_ANSWER,
  SDAAS_PILLAR_OG_IMAGE,
  SDAAS_PILLAR_PATH,
  SDAAS_PILLAR_SEO,
  twoMeaningsRows,
} from './pillarArticle.ts';

test('SDaaS pillar route and SEO are configured for informational intent', () => {
  assert.equal(SDAAS_PILLAR_PATH, '/insights/subscription-based-software-development');
  assert.equal(SDAAS_PILLAR_GUIDE_HREF, SDAAS_PILLAR_PATH);
  assert.match(SDAAS_PILLAR_SEO.title, /Subscription-Based Software Development/);
  assert.match(SDAAS_PILLAR_SEO.description, /two meanings/i);
  assert.doesNotMatch(SDAAS_PILLAR_SEO.title.toLowerCase(), /software development subscription uk/);
});

test('pillar dates and OG image stay static editorial assets', () => {
  assert.equal(SDAAS_PILLAR_SEO.datePublished, '2026-07-16');
  assert.equal(SDAAS_PILLAR_SEO.dateModified, '2026-07-16');
  assert.equal(
    SDAAS_PILLAR_OG_IMAGE,
    '/articles/sdaas/og-subscription-based-software-development.webp',
  );
});

test('pillar separates subscription software from development subscription', () => {
  assert.match(SDAAS_PILLAR_DIRECT_ANSWER, /recurring revenue through subscriptions/i);
  assert.match(SDAAS_PILLAR_DIRECT_ANSWER, /recurring software development capacity/i);
  assert.equal(twoMeaningsRows.length, 2);
  assert.equal(twoMeaningsRows[0].model, 'Subscription software');
  assert.equal(twoMeaningsRows[1].model, 'Development subscription');
});

test('pillar FAQs stay balanced and avoid unlimited promises', () => {
  assert.equal(pillarFaqs.length, 10);
  assert.ok(pillarFaqs.some((faq) => /same as SaaS/i.test(faq.question)));
  assert.ok(pillarFaqs.some((faq) => /unlimited/i.test(faq.question)));
  assert.ok(
    pillarFaqs.every(
      (faq) =>
        faq.answer.length > 40 &&
        !faq.answer.toLowerCase().includes('guaranteed delivery') &&
        !faq.answer.toLowerCase().includes('unlimited development'),
    ),
  );
});

test('pillar links to live commercial page and live supporting articles only', () => {
  assert.ok(relatedLiveLinks.some((link) => link.href === SDAAS_PAGE_PATH));
  assert.ok(
    relatedLiveLinks.some(
      (link) => link.href === '/insights/software-development-subscription-vs-fixed-price',
    ),
  );
  assert.ok(
    relatedLiveLinks.some(
      (link) => link.href === '/insights/software-development-subscription-use-cases',
    ),
  );
  assert.ok(
    relatedLiveLinks.some(
      (link) => link.href === '/insights/how-monthly-software-development-capacity-works',
    ),
  );
  assert.ok(
    relatedLiveLinks.every(
      (link) => !link.href.includes('is-software-development-subscription-right-for-your-business'),
    ),
  );
  assert.equal(contentClusters.sdaas.assets.pillar, SDAAS_PILLAR_PATH);
  assert.equal(contentClusters.sdaas.assets.guide, SDAAS_PILLAR_PATH);
});
