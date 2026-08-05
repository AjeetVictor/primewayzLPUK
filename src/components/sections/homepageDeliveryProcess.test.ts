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

  assert.match(section, /One delivery process/);
  assert.match(section, /Review/);
  assert.match(section, /Prioritise/);
  assert.match(section, /Improve/);
  assert.match(section, /Track/);
  assert.match(section, /DELIVERY_PROCESS_INTRO/);
  assert.match(section, /deliveryProcessSteps\.flatMap/);
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

test('delivery process renders three desktop connectors and remains SSR-safe', () => {
  const section = read('src/components/sections/AuditLedProcessSection.tsx');

  assert.match(section, /ProcessConnector/);
  assert.match(section, /ProcessFlowConnectorIcon/);
  assert.match(section, /connector-\$\{step\.id\}/);
  assert.match(section, /index < deliveryProcessSteps\.length - 1/);
  assert.match(section, /useRevealMotion/);
  assert.match(section, /<h3 /);
  assert.doesNotMatch(section, /window\.|document\.|sessionStorage|IntersectionObserver/);
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
