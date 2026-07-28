import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getActivePricingPlans,
  getPlanDisplayPrice,
  getPricingPlanBySlug,
  isPricingPlanSlug,
  PRICING_PLANS,
} from './registry';
import { getPricingPolicyVersion, PRICING_COMMERCIAL_POLICY } from './policy';

test('pricing registry has unique slugs', () => {
  const slugs = PRICING_PLANS.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
});

test('isPricingPlanSlug validates known and unknown slugs', () => {
  assert.equal(isPricingPlanSlug('growth'), true);
  assert.equal(isPricingPlanSlug('foundation-sprint'), true);
  assert.equal(isPricingPlanSlug('invalid-plan'), false);
  assert.equal(isPricingPlanSlug(null), false);
});

test('getPricingPlanBySlug returns plan or undefined', () => {
  const growth = getPricingPlanBySlug('growth');
  assert.ok(growth);
  assert.equal(growth.name, 'Growth');
  assert.equal(growth.displayedPrice, '£1,189');
  assert.equal(getPricingPlanBySlug('not-a-plan'), undefined);
});

test('getActivePricingPlans returns only active plans in display order', () => {
  const active = getActivePricingPlans();
  assert.ok(active.length >= 4);
  assert.ok(active.every((p) => p.active));
  for (let i = 1; i < active.length; i += 1) {
    assert.ok(active[i - 1].displayOrder <= active[i].displayOrder);
  }
});

test('getPlanDisplayPrice formats monthly and one-off prices', () => {
  assert.equal(getPlanDisplayPrice('growth'), '£1,189/month');
  assert.equal(getPlanDisplayPrice('foundation-sprint'), '£722.50');
});

test('getPricingPolicyVersion returns stable version string', () => {
  assert.equal(getPricingPolicyVersion(), PRICING_COMMERCIAL_POLICY.version);
  assert.match(getPricingPolicyVersion(), /^\d{4}\.\d{2}\.\d+$/);
});

test('preserved commercial prices match approved launch values', () => {
  const prices: Record<string, number> = {
    'foundation-sprint': 722.5,
    essential: 741,
    growth: 1189,
    'maintenance-mode': 405,
    scale: 2100,
    enterprise: 3400,
  };
  for (const [slug, minorPounds] of Object.entries(prices)) {
    const plan = getPricingPlanBySlug(slug);
    assert.ok(plan, slug);
    assert.equal(plan!.numericPriceMinor, Math.round(minorPounds * 100));
  }
});
