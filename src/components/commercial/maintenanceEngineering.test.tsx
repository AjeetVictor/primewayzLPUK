import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { SoftwareDevelopmentSubscriptionUkPage } from '../SoftwareDevelopmentSubscriptionUkPage';
import { WebsiteMaintenanceSubscriptionUkPage } from '../WebsiteMaintenanceSubscriptionUkPage';
import { CommercialBoundarySummary } from './CommercialBoundarySummary';
import { MaintenanceEngineeringComparison } from './MaintenanceEngineeringComparison';
import { PRICING_COMMERCIAL_POLICY } from '../../data/pricing/policy';
import { getPricingPlanBySlug } from '../../data/pricing/registry';
import { STATIC_PAGE_SEO } from '../../lib/seo/staticPageSeo';

function renderAt(path: string, component: ReturnType<typeof createElement>) {
  return renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: [path] }, component),
  );
}

test('comparison renders canonical Maintenance Mode and active delivery pricing', () => {
  const html = renderToStaticMarkup(createElement(MaintenanceEngineeringComparison));
  const maintenance = getPricingPlanBySlug('maintenance-mode');

  assert.ok(maintenance);
  assert.match(html, new RegExp(maintenance!.name));
  assert.match(html, new RegExp(maintenance!.displayedPrice.replace('£', '£')));
  assert.match(html, /8–10 hours\/month/);
  assert.match(html, /Essential/);
  assert.match(html, /£741/);
  assert.match(html, /Growth/);
  assert.match(html, /£1,189/);
  assert.match(html, /Scale/);
  assert.match(html, /£2,100/);
  assert.match(html, /separately scoped work/);
});

test('commercial boundaries render directly from the canonical policy', () => {
  const html = renderToStaticMarkup(createElement(CommercialBoundarySummary));

  for (const policyText of [
    PRICING_COMMERCIAL_POLICY.capacityDefinition,
    PRICING_COMMERCIAL_POLICY.qaTreatment,
    PRICING_COMMERCIAL_POLICY.additionalCapacityPolicy,
    PRICING_COMMERCIAL_POLICY.thirdPartyCostPolicy,
    PRICING_COMMERCIAL_POLICY.clientDelayPolicy,
    PRICING_COMMERCIAL_POLICY.emergencyWorkPolicy,
  ]) {
    assert.ok(html.includes(policyText));
  }
});

test('maintenance route SSR has one H1, preserved CTAs and bounded support language', () => {
  const html = renderAt('/maintenance', createElement(WebsiteMaintenanceSubscriptionUkPage));

  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(html, /Website Maintenance Subscription for UK Businesses/);
  assert.match(html, /href="\/pricing"/);
  assert.match(html, /View maintenance pricing/);
  assert.match(html, /managed support review/i);
  assert.match(html, /not continuous surveillance or guaranteed availability/i);
  assert.match(html, /not automatically included/i);
  assert.doesNotMatch(html, /24\/7/);
  assert.doesNotMatch(html, /guaranteed uptime/i);
  assert.doesNotMatch(html, /respond(?:s|ed|ing)? within/i);
});

test('software subscription SSR has one H1 and retains UK-02 integration boundaries', () => {
  const html = renderAt(
    '/software-development-subscription-uk',
    createElement(SoftwareDevelopmentSubscriptionUkPage),
  );

  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.match(html, /Maintenance Mode or active product engineering/);
  assert.match(html, /subscription does not provide unlimited integration work/);
  assert.match(html, /Third-party services and complex dependencies/);
});

test('maintenance metadata keeps search intent without implying continuous monitoring', () => {
  const metadata = STATIC_PAGE_SEO['/maintenance'];

  assert.equal(metadata.title, 'Website Maintenance Subscription UK | Primewayz');
  assert.match(metadata.description, /planned updates/);
  assert.match(metadata.description, /agreed monthly capacity/);
  assert.doesNotMatch(metadata.description, /monitoring/i);
  assert.doesNotMatch(metadata.description, /guarantee/i);
});
