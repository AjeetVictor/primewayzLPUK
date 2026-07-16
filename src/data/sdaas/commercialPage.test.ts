import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SDAAS_CLARIFICATION,
  SDAAS_DEFINITION,
  SDAAS_PAGE_PATH,
  SDAAS_SEO,
  sdaasFaqs,
} from './commercialPage.ts';
import { SDAAS_COMMERCIAL_IMAGES } from './images.ts';

test('SDaaS commercial page path and SEO are configured', () => {
  assert.equal(SDAAS_PAGE_PATH, '/software-development-subscription-uk');
  assert.match(SDAAS_SEO.title, /Software Development Subscription UK/);
  assert.match(SDAAS_SEO.description, /monthly software development capacity/i);
});

test('commercial page guide CTA points at the educational pillar', async () => {
  const { SDAAS_PILLAR_GUIDE_HREF } = await import('../../constants/canonicalRoutes.ts');
  assert.equal(SDAAS_PILLAR_GUIDE_HREF, '/insights/subscription-based-software-development');
});

test('SDaaS definition rejects unlimited-development positioning', () => {
  assert.match(SDAAS_DEFINITION, /monthly delivery capacity/i);
  assert.match(SDAAS_CLARIFICATION, /not an unlimited task service/i);
  assert.doesNotMatch(SDAAS_DEFINITION.toLowerCase(), /unlimited/);
});

test('SDaaS commercial images use optimised webp paths', () => {
  assert.equal(SDAAS_COMMERCIAL_IMAGES.heroWorkflow.basePath, '/articles/sdaas/monthly-delivery-workflow');
  assert.equal(SDAAS_COMMERCIAL_IMAGES.scatteredToStructured.slug, 'scattered-to-structured');
  assert.ok(SDAAS_COMMERCIAL_IMAGES.monthlyCapacity.clusterReuse);
  assert.ok(SDAAS_COMMERCIAL_IMAGES.heroWorkflow.width > 0);
  assert.ok(SDAAS_COMMERCIAL_IMAGES.heroWorkflow.height > 0);
});

test('SDaaS FAQ set covers core buyer questions', () => {
  assert.equal(sdaasFaqs.length, 10);
  const questions = sdaasFaqs.map((faq: { question: string }) => faq.question.toLowerCase());
  assert.ok(questions.some((q: string) => q.includes('unlimited')));
  assert.ok(questions.some((q: string) => q.includes('source code')));
  assert.ok(questions.some((q: string) => q.includes('paused or cancelled')));
  assert.ok(
    sdaasFaqs.every(
      (faq: { answer: string }) =>
        faq.answer.length > 40 && !faq.answer.toLowerCase().includes('guaranteed delivery'),
    ),
  );
});
