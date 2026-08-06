import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DELIVERY_PROCESS_INTRO, deliveryProcessSteps } from '../../content/deliveryProcessSteps.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('delivery process data exposes exactly four ordered steps', () => {
  assert.equal(deliveryProcessSteps.length, 4);
  assert.deepEqual(
    deliveryProcessSteps.map((step) => step.title),
    ['Review', 'Prioritise', 'Improve', 'Track'],
  );
  assert.deepEqual(
    deliveryProcessSteps.map((step) => step.number),
    [1, 2, 3, 4],
  );
  assert.equal(deliveryProcessSteps[0].description, 'Understand current systems, constraints and priorities.');
  assert.equal(
    deliveryProcessSteps[2].description,
    'Deliver agreed changes through the appropriate engagement model.',
  );
});

test('AuditLedProcessSection renders homepage delivery process content', () => {
  const section = read('src/components/sections/AuditLedProcessSection.tsx');
  const app = read('src/App.tsx');

  assert.match(app, /<AuditLedProcessSection \/>/);
  assert.equal((app.match(/<AuditLedProcessSection \/>/g) || []).length, 1);

  assert.match(section, /Our Delivery Process/);
  assert.match(section, /Review/);
  assert.match(section, /Prioritise/);
  assert.match(section, /Improve/);
  assert.match(section, /Track/);
  assert.match(section, /DELIVERY_PROCESS_INTRO/);
  assert.match(section, /deliveryProcessSteps\.map/);
  assert.match(section, /aria-labelledby=["']delivery-process-title["']/);
  assert.match(section, /id=["']delivery-process-title["']/);
  assert.doesNotMatch(section, /lucide-react/);
});

test('delivery process uses inline SVG icons without raster assets', () => {
  const icons = read('src/components/icons/AuditLedProcessIcons.tsx');
  const section = read('src/components/sections/AuditLedProcessSection.tsx');
  const data = read('src/content/deliveryProcessSteps.ts');

  assert.match(icons, /viewBox="0 0 96 96"/);
  assert.match(icons, /ReviewAuditIcon/);
  assert.match(icons, /PrioritiseAuditIcon/);
  assert.match(icons, /ImproveAuditIcon/);
  assert.match(icons, /TrackAuditIcon/);
  assert.match(icons, /ProcessFlowConnectorIcon/);
  assert.match(icons, /aria-hidden="true"/);
  assert.match(icons, /focusable="false"/);
  assert.match(icons, /stroke: 'currentColor'/);
  assert.doesNotMatch(icons, /\.png|\.jpg|\.webp|\.svg["']/);
  assert.doesNotMatch(section, /\.png|\.jpg|\.webp|<img /);
  assert.match(data, /ReviewAuditIcon/);
  assert.match(data, /TrackAuditIcon/);
});

test('delivery process matches the approved grid, stepped route and responsive fallbacks', () => {
  const section = read('src/components/sections/AuditLedProcessSection.tsx');
  const css = read('src/components/sections/AuditLedProcessSection.css');

  assert.match(section, /Our Delivery Process/);
  assert.match(section, /className="delivery-dashboard"/);
  assert.match(section, /Progress overview/);
  assert.match(section, /delivery-dashboard__donut/);
  assert.match(section, /deliveryProcessSteps\.map/);
  assert.match(section, /className="delivery-route"/);
  assert.match(section, /viewBox="0 0 1000 176"/);
  assert.match(section, /M0 154H250V118H500V82H750V46H1000/);
  assert.match(section, /Practical priorities/);
  assert.match(section, /Clear progress/);
  assert.match(section, /Aligned teams/);
  assert.match(section, /Better outcomes/);
  assert.doesNotMatch(section, /window\.|document\./);

  assert.match(css, /width:\s*min\(100%, 1500px\)/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*410px/);
  assert.match(css, /font-size:\s*42px/);
  assert.match(css, /font-weight:\s*700/);
  assert.match(css, /letter-spacing:\s*0/);
  assert.match(css, /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /height:\s*176px/);
  assert.match(css, /@media \(max-width:\s*880px\)/);
  assert.match(css, /@media \(max-width:\s*560px\)/);
});

test('homepage places service routes directly after the hero and keeps pricing preview untouched', () => {
  const app = read('src/App.tsx');
  const pricing = read('src/components/sections/CommercialClaritySection.tsx');
  const pricingPage = read('src/components/Pricing.tsx');

  assert.match(
    app,
    /<Hero \/>[\s\S]*<ServiceRoutesSection \/>[\s\S]*<WebsiteProblemSection \/>[\s\S]*<AuditLedProcessSection \/>[\s\S]*<SuccessStories \/>[\s\S]*<CommercialClaritySection \/>[\s\S]*<HomepageContactSection \/>/,
  );
  assert.equal((app.match(/<AuditLedProcessSection \/>/g) || []).length, 1);
  assert.match(pricing, /id=["']pricing["']/);
  assert.match(pricing, /COMMERCIAL_CLARITY_FEATURES/);
  assert.doesNotMatch(pricingPage, /deliveryProcessSteps/);
  assert.match(pricingPage, /PricingPageContent/);
  assert.match(read('src/components/pricing/PricingPageContent.tsx'), /Scale/);
});

test('delivery process intro copy matches approved homepage wording', () => {
  assert.equal(DELIVERY_PROCESS_INTRO, sectionIntroFromBrief());
});

function sectionIntroFromBrief(): string {
  return 'One clear process for website, CRM, software and support work—so priorities stay practical and progress stays visible.';
}
