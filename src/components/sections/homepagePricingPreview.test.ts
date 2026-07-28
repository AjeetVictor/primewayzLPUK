import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOMEPAGE_PRICING_SECTION_NAME,
  HOMEPAGE_PRICING_SMALL_PRINT,
  HOMEPAGE_SELECTED_PLAN_KEY,
  homepagePricingPlans,
} from '../../content/homepagePricingPlans.ts';
import { rememberHomepageSelectedPlan } from '../../lib/homepagePricingSelection.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('homepage pricing preview data exposes exactly four plans', () => {
  assert.equal(homepagePricingPlans.length, 4);
  assert.deepEqual(
    homepagePricingPlans.map((plan) => plan.id),
    ['foundation-sprint', 'essential', 'growth', 'maintenance-mode'],
  );
  assert.ok(!homepagePricingPlans.some((plan) => /scale|enterprise/i.test(plan.name)));
  assert.ok(!homepagePricingPlans.some((plan) => /scale|enterprise/i.test(plan.id)));
});

test('homepage pricing preview prices match commercial launch figures', () => {
  const byId = Object.fromEntries(homepagePricingPlans.map((plan) => [plan.id, plan]));
  assert.equal(byId['foundation-sprint'].price, '£722.50');
  assert.equal(byId['foundation-sprint'].displayedPrice, 722.5);
  assert.equal(byId['foundation-sprint'].billingPeriod, 'one_time');
  assert.equal(byId.essential.price, '£741');
  assert.equal(byId.essential.displayedPrice, 741);
  assert.equal(byId.essential.billingPeriod, 'monthly');
  assert.equal(byId.growth.price, '£1,189');
  assert.equal(byId.growth.displayedPrice, 1189);
  assert.equal(byId.growth.billingPeriod, 'monthly');
  assert.equal(byId.growth.recommended, true);
  assert.equal(byId['maintenance-mode'].price, '£405');
  assert.equal(byId['maintenance-mode'].displayedPrice, 405);
  assert.equal(byId['maintenance-mode'].billingPeriod, 'monthly');
});

test('homepage pricing plan hrefs include plan query parameters', () => {
  for (const plan of homepagePricingPlans) {
    assert.equal(plan.href, `/pricing?plan=${plan.id}`);
  }
});

test('CommercialClaritySection is the homepage pricing preview with id=pricing', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');
  const app = read('src/App.tsx');

  assert.match(app, /<CommercialClaritySection \/>/);
  assert.equal((app.match(/<CommercialClaritySection \/>/g) || []).length, 1);
  assert.doesNotMatch(app, /id=["']pricing["']/);

  assert.match(section, /id=["']pricing["']/);
  assert.match(section, /aria-labelledby=["']pricing-heading["']/);
  assert.match(section, /<section[\s\S]*id=["']pricing["']/);
  assert.equal((section.match(/id=["']pricing["']/g) || []).length, 1);
  assert.doesNotMatch(section, /id=["']engagement-options["']/);

  assert.match(section, /Start with the level of support your priorities need/);
  assert.match(section, /Pricing &amp; engagement options|Pricing & engagement options/);
  assert.match(section, /homepagePricingPlans\.map/);
  assert.match(section, /Compare all plans/);
  assert.match(section, /View Scale and Enterprise options/);
  assert.match(section, /HOMEPAGE_PRICING_SMALL_PRINT/);
  assert.match(section, /Recommended/);
});

test('homepage pricing section links to /pricing and plan query routes', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');
  const data = read('src/content/homepagePricingPlans.ts');

  assert.match(data, /plan=foundation-sprint/);
  assert.match(data, /plan=essential/);
  assert.match(data, /plan=growth/);
  assert.match(data, /plan=maintenance-mode/);
  assert.match(section, /CANONICAL_ROUTES\.pricing/);
  assert.match(section, /Compare all plans/);
  assert.doesNotMatch(section, /line-through|Launch Discount|originalPrice/);
  assert.doesNotMatch(data, /\bScale\b|\bEnterprise\b/);
});

test('homepage pricing small print remains visible VAT and third-party copy', () => {
  assert.match(HOMEPAGE_PRICING_SMALL_PRINT, /Prices exclude VAT/);
  assert.match(HOMEPAGE_PRICING_SMALL_PRINT, /Third-party costs/);
  assert.match(HOMEPAGE_PRICING_SMALL_PRINT, /hosting, domains, software tools/);
  const section = read('src/components/sections/CommercialClaritySection.tsx');
  assert.match(section, /HOMEPAGE_PRICING_SMALL_PRINT/);
  assert.doesNotMatch(section, /title=\{HOMEPAGE_PRICING_SMALL_PRINT\}|tooltip/i);
});

test('homepage pricing selection is SSR-safe and stores plan slug', () => {
  const selection = read('src/lib/homepagePricingSelection.ts');
  assert.match(selection, /typeof window === 'undefined'/);
  assert.match(selection, /sessionStorage/);
  assert.match(selection, /catch/);

  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  };

  rememberHomepageSelectedPlan('growth', storage);
  assert.equal(memory.get(HOMEPAGE_SELECTED_PLAN_KEY), 'growth');

  rememberHomepageSelectedPlan('essential', null);
  assert.equal(memory.get(HOMEPAGE_SELECTED_PLAN_KEY), 'growth');

  const throwingStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota exceeded');
    },
  };
  assert.doesNotThrow(() => rememberHomepageSelectedPlan('essential', throwingStorage));
});

test('homepage pricing analytics fire once for view and send plan click params', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');

  assert.match(section, /homepage_pricing_view/);
  assert.match(section, /homepage_pricing_plan_click/);
  assert.match(section, /view_full_pricing_click/);
  assert.match(section, /section_name:\s*HOMEPAGE_PRICING_SECTION_NAME/);
  assert.equal(HOMEPAGE_PRICING_SECTION_NAME, 'homepage_pricing');
  assert.match(section, /threshold:\s*0\.35/);
  assert.match(section, /viewTrackedRef/);
  assert.match(section, /observer\.disconnect\(\)/);
  assert.match(section, /selected_plan:\s*plan\.id/);
  assert.match(section, /displayed_price:\s*plan\.displayedPrice/);
  assert.match(section, /billing_period:\s*plan\.billingPeriod/);
  assert.match(section, /rememberHomepageSelectedPlan\(plan\.id\)/);
  assert.match(section, /trackConversionEvent/);
  assert.doesNotMatch(section, /window\.sessionStorage/);
});

test('pricing content is present for SSR and uses semantic headings', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');
  const data = read('src/content/homepagePricingPlans.ts');

  assert.match(section, /useRevealMotion/);
  assert.match(section, /<h2 id=["']pricing-heading["']/);
  assert.match(section, /<h3 /);
  assert.doesNotMatch(section, /<h1\b/);
  assert.match(section, /<ul /);
  assert.match(data, /£722\.50/);
  assert.match(data, /£741/);
  assert.match(data, /£1,189/);
  assert.match(data, /£405/);
  assert.match(section, /scroll-mt-28/);
});

test('existing homepage sections still render once and pricing is not duplicated', () => {
  const app = read('src/App.tsx');
  const mainMatch = app.match(/const MainContent[\s\S]*?<\/main>\s*\);/);
  assert.ok(mainMatch);
  const main = mainMatch[0];

  for (const section of [
    'Hero',
    'WebsiteProblemSection',
    'ServiceRoutesSection',
    'AuditLedProcessSection',
    'SuccessStories',
    'CommercialClaritySection',
    'HomepageContactSection',
  ]) {
    assert.equal((main.match(new RegExp(`<${section}\\b`, 'g')) || []).length, 1);
  }

  assert.match(
    main,
    /<SuccessStories \/>[\s\S]*<CommercialClaritySection \/>[\s\S]*<HomepageContactSection \/>/,
  );
  assert.equal((app.match(/<CommercialClaritySection \/>/g) || []).length, 1);
  assert.equal((main.match(/pricing/gi) || []).length, 0);
});

test('pricing page component remains unchanged by homepage preview work', () => {
  const pricing = read('src/components/Pricing.tsx');
  assert.match(pricing, /originalPrice/);
  assert.match(pricing, /Launch Discount/);
  assert.match(pricing, /name: 'Scale'/);
  assert.match(pricing, /name: 'Enterprise'/);
  assert.match(pricing, /BOOK_CALL_URL/);
  assert.doesNotMatch(pricing, /homepagePricingPlans/);
  assert.doesNotMatch(pricing, /homepage_pricing_view/);
});
