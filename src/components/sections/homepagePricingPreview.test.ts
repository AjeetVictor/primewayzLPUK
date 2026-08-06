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

test('CommercialClaritySection is the approved responsive commercial clarity teaser', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');
  const css = read('src/components/sections/CommercialClaritySection.css');
  const app = read('src/App.tsx');

  assert.match(app, /<CommercialClaritySection \/>/);
  assert.equal((app.match(/<CommercialClaritySection \/>/g) || []).length, 1);
  assert.doesNotMatch(app, /id=["']pricing["']/);

  assert.match(section, /id=["']pricing["']/);
  assert.match(section, /aria-labelledby=["']pricing-heading["']/);
  assert.match(section, /<section[\s\S]*id=["']pricing["']/);
  assert.equal((section.match(/id=["']pricing["']/g) || []).length, 1);
  assert.doesNotMatch(section, /id=["']engagement-options["']/);

  assert.match(section, /Simple support options, with costs discussed clearly/);
  assert.match(section, /Commercial Clarity/);
  assert.match(section, /COMMERCIAL_CLARITY_FEATURES/);
  assert.match(section, /commercial-clarity__cards/);
  assert.match(section, /commercial-pricing__models/);
  assert.match(section, /View full pricing/);
  assert.match(section, /Need the full breakdown\?/);
  assert.match(section, /Sprint/);
  assert.match(section, /Monthly/);
  assert.match(section, /Maintenance/);
  assert.match(section, /Transparent costs/);
  assert.match(section, /No hidden extras/);
  assert.match(section, /Discuss before we begin/);
  assert.match(section, /Commercial clarity from day one/);
  assert.match(section, /CommercialClaritySection\.css/);
  assert.doesNotMatch(section, /homepagePricingPlans\.map/);
  assert.doesNotMatch(section, /Compare all plans/);
  assert.doesNotMatch(section, /lucide-react/);

  assert.match(css, /width:\s*min\(100%,\s*1480px\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(360px,\s*1\.35fr\)/);
  assert.match(css, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media \(max-width:\s*1180px\)/);
  assert.match(css, /@media \(max-width:\s*900px\)/);
  assert.match(css, /@media \(max-width:\s*600px\)/);
});

test('homepage commercial clarity section links to /pricing', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');

  assert.match(section, /CANONICAL_ROUTES\.pricing/);
  assert.match(section, /View full pricing/);
  assert.doesNotMatch(section, /line-through|Launch Discount|originalPrice/);
});

test('homepage pricing small print remains available in shared pricing content', () => {
  assert.match(HOMEPAGE_PRICING_SMALL_PRINT, /exclude VAT|excluding VAT/i);
  assert.match(HOMEPAGE_PRICING_SMALL_PRINT, /third-party|Third-party/i);
});

test('homepage pricing selection is SSR-safe and stores plan slug', () => {
  const selection = read('src/lib/pricing/pricingSelection.ts');
  assert.match(selection, /resolveStorage/);
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
  const stored = memory.get(HOMEPAGE_SELECTED_PLAN_KEY) ?? '';
  assert.ok(stored.includes('growth'));
  assert.ok(stored.includes('"version":1') || stored.startsWith('{'));

  rememberHomepageSelectedPlan('essential', storage);
  const storedEssential = memory.get(HOMEPAGE_SELECTED_PLAN_KEY) ?? '';
  assert.ok(storedEssential.includes('essential'));

  const throwingStorage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota exceeded');
    },
  };
  assert.doesNotThrow(() => rememberHomepageSelectedPlan('essential', throwingStorage));
});

test('homepage pricing analytics fire once for view and full-pricing click params', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');

  assert.match(section, /homepage_pricing_view/);
  assert.match(section, /view_full_pricing_click/);
  assert.match(section, /section_name:\s*HOMEPAGE_PRICING_SECTION_NAME/);
  assert.equal(HOMEPAGE_PRICING_SECTION_NAME, 'homepage_pricing');
  assert.match(section, /threshold:\s*0\.35/);
  assert.match(section, /viewTrackedRef/);
  assert.match(section, /observer\.disconnect\(\)/);
  assert.match(section, /trackConversionEvent/);
  assert.doesNotMatch(section, /window\.sessionStorage/);
});

test('pricing content is present for SSR and uses semantic headings', () => {
  const section = read('src/components/sections/CommercialClaritySection.tsx');
  const registry = read('src/data/pricing/registry.ts');

  assert.match(section, /useRevealMotion/);
  assert.match(section, /<h2 id=["']pricing-heading["']/);
  assert.match(section, /<h3 /);
  assert.doesNotMatch(section, /<h1\b/);
  assert.match(registry, /£722\.50/);
  assert.match(registry, /£741/);
  assert.match(registry, /£1,189/);
  assert.match(registry, /£405/);
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

test('pricing page uses canonical registry and single-page grid structure', () => {
  const pricing = read('src/components/Pricing.tsx');
  const pageContent = read('src/components/pricing/PricingPageContent.tsx');

  assert.match(pricing, /PricingPageContent/);
  assert.match(pricing, /canonical.*https:\/\/uk\.primewayz\.com\/pricing/);
  assert.match(pageContent, /data\/pricing\/gridConfig/);
  assert.match(pageContent, /usePricingSelection/);
  assert.match(pageContent, /PricingGridCard/);
  assert.match(pageContent, /PricingPlanDetailModal/);
  assert.match(pageContent, /Simple, transparent pricing for every stage of growth/);
  assert.match(pageContent, /Foundation Sprint|getPrimaryPricingGridPlans/);
  assert.match(pageContent, /Scale/);
  assert.match(pageContent, /Enterprise/);
  assert.doesNotMatch(pageContent, /activeCategory|getNonEmptyEngagementCategories/);
  assert.doesNotMatch(pageContent, /BOOK_CALL_URL/);
  assert.doesNotMatch(pageContent, /homepage_pricing_view/);
});

test('pricing review CTA includes review_source=pricing and plan slug', () => {
  const helper = read('src/lib/pricing/buildPricingReviewUrl.ts');
  const modal = read('src/components/pricing/PricingPlanDetailModal.tsx');

  assert.match(helper, /FREE_REVIEW_SOURCE_QUERY_PARAM/);
  assert.match(helper, /'pricing'/);
  assert.match(helper, /plan: planSlug/);
  assert.match(modal, /buildPricingReviewUrl/);
  assert.match(modal, /Continue with this plan/);
});
