import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnalyticsConsentManager } from '../components/AnalyticsConsentManager';

const root = process.cwd();

test('GA4 is not present in the static document and initialization is opt-in gated', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const analytics = fs.readFileSync(path.join(root, 'src/lib/analytics.ts'), 'utf8');
  assert.doesNotMatch(html, /googletagmanager\.com\/gtag\/js|gtag\(['"]config/);
  assert.match(analytics, /if \(!hasAnalyticsConsent\(\) \|\| typeof window === 'undefined' \|\| window\.gtag\) return;/);
  assert.match(analytics, /script\.src = `https:\/\/www\.googletagmanager\.com/);
});

test('FormResponse idempotency is nullable, unique and has an additive migration', () => {
  const schema = fs.readFileSync(path.join(root, 'prisma/schema.prisma'), 'utf8');
  const migration = fs.readFileSync(
    path.join(root, 'prisma/migrations/20261009120000_form_response_idempotency/migration.sql'),
    'utf8',
  );
  const formModel = schema.match(/model FormResponse \{[\s\S]*?\n\}/)?.[0] || '';
  assert.match(formModel, /submissionId\s+String\?\s+@unique\s+@db\.VarChar\(64\)/);
  assert.match(migration, /ADD COLUMN `submissionId` VARCHAR\(64\) NULL/);
  assert.match(migration, /ADD UNIQUE INDEX `FormResponse_submissionId_key` \(`submissionId`\)/);
  assert.doesNotMatch(migration, /DROP|DELETE|UPDATE/i);
});

test('consent controls are labelled and offer explicit accept, reject and preferences', () => {
  const html = renderToStaticMarkup(createElement(AnalyticsConsentManager));
  assert.match(html, /aria-label="Cookie and analytics preferences"/);
  assert.match(html, /Accept optional analytics/);
  assert.match(html, /Reject optional analytics/);
  assert.match(html, /Manage preferences/);
  assert.match(html, /Enquiries and bookings work either way/);
});

test('withdrawal disables GA and removes analytics cookies', () => {
  const analytics = fs.readFileSync(path.join(root, 'src/lib/analytics.ts'), 'utf8');
  const consent = fs.readFileSync(path.join(root, 'src/lib/analyticsConsent.ts'), 'utf8');
  const manager = fs.readFileSync(path.join(root, 'src/components/AnalyticsConsentManager.tsx'), 'utf8');
  assert.match(manager, /setAnalyticsConsent\(analyticsEnabled \? 'accepted' : 'rejected'\)/);
  assert.match(consent, /__PRIMEWAYZ_ANALYTICS_CONSENT__ = consent === 'accepted'/);
  assert.match(analytics, /export function disableGA/);
  assert.match(analytics, /document\.querySelectorAll\('script\[data-primewayz-ga4\]'\)/);
  assert.match(analytics, /Max-Age=0/);
});

test('conversion events use one GA transport and do not duplicate data-layer events', () => {
  const analytics = fs.readFileSync(path.join(root, 'src/lib/analytics.ts'), 'utf8');
  const start = analytics.indexOf('export function trackConversionEvent');
  const end = analytics.indexOf('export function trackBookCallClick', start);
  const conversionBlock = analytics.slice(start, end);
  assert.match(conversionBlock, /trackEvent\(eventName, payload\)/);
  assert.doesNotMatch(conversionBlock, /pushDataLayer/);
  const reporting = fs.readFileSync(path.join(root, 'src/lib/seo/ga4ReportingProvider.ts'), 'utf8');
  assert.match(reporting, /name: 'calendly_event_scheduled'/);
});

test('after consent decision the floating aside is removed; footer Cookie settings reopens via event', () => {
  const manager = fs.readFileSync(path.join(root, 'src/components/AnalyticsConsentManager.tsx'), 'utf8');
  const footer = fs.readFileSync(path.join(root, 'src/components/Footer.tsx'), 'utf8');
  const consent = fs.readFileSync(path.join(root, 'src/lib/analyticsConsent.ts'), 'utf8');

  assert.match(manager, /if \(!panelVisible\) return null/);
  assert.match(manager, /OPEN_ANALYTICS_SETTINGS_EVENT/);
  assert.match(manager, /role=\{manageOpen \? 'dialog' : 'region'\}/);
  assert.match(manager, /Escape/);
  assert.doesNotMatch(manager, />\s*Cookie settings\s*</);

  assert.match(footer, /openAnalyticsSettings/);
  assert.match(footer, /data-testid="footer-cookie-settings"/);
  assert.match(footer, /Cookie settings/);

  assert.match(consent, /export function openAnalyticsSettings/);
  assert.match(consent, /OPEN_ANALYTICS_SETTINGS_EVENT/);
});

test('cookie policy points visitors to the footer Cookie settings link', () => {
  const legal = fs.readFileSync(path.join(root, 'src/components/LegalPage.tsx'), 'utf8');
  assert.match(legal, /Cookie settings link in the site footer/);
  assert.doesNotMatch(legal, /persistent Cookie settings control/);
});

test('optional analytics remain gated until hasAnalyticsConsent is true', () => {
  const analytics = fs.readFileSync(path.join(root, 'src/lib/analytics.ts'), 'utf8');
  assert.match(analytics, /hasAnalyticsConsent\(\)/);
  assert.match(analytics, /if \(!hasAnalyticsConsent\(\)/);
  const consent = fs.readFileSync(path.join(root, 'src/lib/analyticsConsent.ts'), 'utf8');
  assert.match(consent, /export function hasAnalyticsConsent/);
  assert.match(consent, /getAnalyticsConsent\(\) === 'accepted'/);
});
