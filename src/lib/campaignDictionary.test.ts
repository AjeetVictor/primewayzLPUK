import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildCanonicalCampaignId,
  isCanonicalCampaignId,
  parseCanonicalCampaignId,
  validateOwnedCampaignUtm,
} from './campaignDictionary.ts';

const root = process.cwd();

test('PWUK-CRM-2026-01 is accepted as canonical campaign ID', () => {
  assert.equal(isCanonicalCampaignId('PWUK-CRM-2026-01'), true);
});

test('PWUK-VIS-2026-99 is accepted as canonical campaign ID', () => {
  assert.equal(isCanonicalCampaignId('PWUK-VIS-2026-99'), true);
});

test('lowercase campaign ID is rejected', () => {
  assert.equal(isCanonicalCampaignId('pwuk-crm-2026-01'), false);
});

test('unknown service code is rejected', () => {
  assert.equal(isCanonicalCampaignId('PWUK-XYZ-2026-01'), false);
});

test('sequence 00 is rejected', () => {
  assert.equal(isCanonicalCampaignId('PWUK-CRM-2026-00'), false);
});

test('sequence 100 is rejected', () => {
  assert.equal(isCanonicalCampaignId('PWUK-CRM-2026-100'), false);
});

test('malformed year is rejected', () => {
  assert.equal(isCanonicalCampaignId('PWUK-CRM-26-01'), false);
  assert.equal(isCanonicalCampaignId('PWUK-CRM-20266-01'), false);
});

test('wrong workspace is rejected', () => {
  assert.equal(isCanonicalCampaignId('PWUS-CRM-2026-01'), false);
});

test('missing campaign ID pieces are rejected', () => {
  assert.equal(isCanonicalCampaignId('PWUK-CRM-2026'), false);
  assert.equal(isCanonicalCampaignId('PWUK-CRM'), false);
  assert.equal(isCanonicalCampaignId('PWUK'), false);
  assert.equal(isCanonicalCampaignId(''), false);
});

test('buildCanonicalCampaignId builds exact canonical representation', () => {
  assert.equal(buildCanonicalCampaignId('CRM', 2026, 1), 'PWUK-CRM-2026-01');
  assert.equal(buildCanonicalCampaignId('VIS', 2026, 2), 'PWUK-VIS-2026-02');
});

test('buildCanonicalCampaignId zero-pads sequence', () => {
  assert.equal(buildCanonicalCampaignId('GEN', 2026, 9), 'PWUK-GEN-2026-09');
});

test('buildCanonicalCampaignId rejects sequence 0', () => {
  assert.throws(() => buildCanonicalCampaignId('CRM', 2026, 0), /sequence must be an integer between 1 and 99/i);
});

test('buildCanonicalCampaignId rejects sequence 100', () => {
  assert.throws(() => buildCanonicalCampaignId('CRM', 2026, 100), /sequence must be an integer between 1 and 99/i);
});

test('buildCanonicalCampaignId rejects non-integer sequence', () => {
  assert.throws(() => buildCanonicalCampaignId('CRM', 2026, 1.5), /sequence must be an integer between 1 and 99/i);
});

test('buildCanonicalCampaignId rejects invalid service code', () => {
  assert.throws(() => buildCanonicalCampaignId('XYZ', 2026, 1), /invalid campaign service code/i);
});

test('buildCanonicalCampaignId rejects unsupported year', () => {
  assert.throws(() => buildCanonicalCampaignId('CRM', 2019, 1), /campaign year must be between/i);
  assert.throws(() => buildCanonicalCampaignId('CRM', 2100, 1), /campaign year must be between/i);
});

test('parseCanonicalCampaignId returns workspace, service, year, and sequence', () => {
  const parsed = parseCanonicalCampaignId('PWUK-CRM-2026-01');
  assert.deepEqual(parsed, {
    workspace: 'PWUK',
    serviceCode: 'CRM',
    year: 2026,
    sequence: 1,
  });
});

test('parseCanonicalCampaignId rejects malformed IDs', () => {
  assert.equal(parseCanonicalCampaignId('pwuk-crm-2026-01'), null);
  assert.equal(parseCanonicalCampaignId('PWUK-CRM-2026-00'), null);
  assert.equal(parseCanonicalCampaignId('PWUK-CRM-26-01'), null);
  assert.equal(parseCanonicalCampaignId('invalid'), null);
});

test('owned UTM linkedin + organic-social is accepted', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'linkedin',
    utm_medium: 'organic-social',
    utm_campaign: 'PWUK-CRM-2026-01',
    utm_content: 'crm-operations-gap-v1',
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('owned UTM zoho + email is accepted', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'zoho',
    utm_medium: 'email',
    utm_campaign: 'PWUK-CRM-2026-01',
    utm_content: 'crm-operations-gap-v1',
  });
  assert.equal(result.valid, true);
});

test('owned UTM google + paid-search is accepted', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'google',
    utm_medium: 'paid-search',
    utm_campaign: 'PWUK-VIS-2026-01',
    utm_content: 'visibility-audit-v1',
    utm_term: 'website-seo-audit',
  });
  assert.equal(result.valid, true);
});

test('owned UTM bing + paid-search is accepted', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'bing',
    utm_medium: 'paid-search',
    utm_campaign: 'PWUK-VIS-2026-01',
    utm_content: 'visibility-audit-v1',
  });
  assert.equal(result.valid, true);
});

test('owned UTM partner + referral is accepted', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'partner',
    utm_medium: 'referral',
    utm_campaign: 'PWUK-GEN-2026-02',
    utm_content: 'partner-intro-v1',
  });
  assert.equal(result.valid, true);
});

test('owned UTM rejects unknown source for owned campaign creation', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'PWUK-CRM-2026-01',
    utm_content: 'crm-operations-gap-v1',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.field === 'utm_source'));
});

test('owned UTM rejects legacy medium organic for owned campaign creation', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'linkedin',
    utm_medium: 'organic',
    utm_campaign: 'PWUK-CRM-2026-01',
    utm_content: 'crm-operations-gap-v1',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.field === 'utm_medium'));
});

test('owned UTM rejects malformed campaign ID', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'zoho',
    utm_medium: 'email',
    utm_campaign: 'web_presence_audit_launch',
    utm_content: 'crm-operations-gap-v1',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.field === 'utm_campaign'));
});

test('owned UTM rejects missing utm_content', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'zoho',
    utm_medium: 'email',
    utm_campaign: 'PWUK-CRM-2026-01',
    utm_content: '',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.field === 'utm_content'));
});

test('owned UTM rejects utm_content values that violate lowercase slug rules', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'zoho',
    utm_medium: 'email',
    utm_campaign: 'PWUK-CRM-2026-01',
    utm_content: 'PWUK-015-OM-v1',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.field === 'utm_content'));
});

test('buildCanonicalCampaignId round-trips through isCanonicalCampaignId and parseCanonicalCampaignId', () => {
  const built = buildCanonicalCampaignId('DSR', 2026, 12);
  assert.equal(isCanonicalCampaignId(built), true);
  assert.deepEqual(parseCanonicalCampaignId(built), {
    workspace: 'PWUK',
    serviceCode: 'DSR',
    year: 2026,
    sequence: 12,
  });
});

test('isCanonicalCampaignId rejects year 2019 and 2100', () => {
  assert.equal(isCanonicalCampaignId('PWUK-CRM-2019-01'), false);
  assert.equal(isCanonicalCampaignId('PWUK-CRM-2100-01'), false);
});

test('parseCanonicalCampaignId rejects year 2019 and 2100', () => {
  assert.equal(parseCanonicalCampaignId('PWUK-CRM-2019-01'), null);
  assert.equal(parseCanonicalCampaignId('PWUK-CRM-2100-01'), null);
});

test('owned UTM linkedin + paid-social is accepted', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'linkedin',
    utm_medium: 'paid-social',
    utm_campaign: 'PWUK-GEN-2026-01',
    utm_content: 'linkedin-sponsored-post-v1',
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('owned UTM rejects invalid utm_term', () => {
  const result = validateOwnedCampaignUtm({
    utm_source: 'google',
    utm_medium: 'paid-search',
    utm_campaign: 'PWUK-VIS-2026-01',
    utm_content: 'visibility-audit-v1',
    utm_term: 'Invalid Term With Spaces',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.field === 'utm_term'));
});

test('all nine service codes produce canonical campaign IDs', () => {
  const serviceCodes = ['GEN', 'DSR', 'VIS', 'MNT', 'CRM', 'SWE', 'CAP', 'RIT', 'AI'] as const;
  for (const serviceCode of serviceCodes) {
    const built = buildCanonicalCampaignId(serviceCode, 2026, 1);
    assert.equal(isCanonicalCampaignId(built), true);
    const parsed = parseCanonicalCampaignId(built);
    assert.equal(parsed?.serviceCode, serviceCode);
  }
});

test('validateOwnedCampaignUtm does not mutate input', () => {
  const input = {
    utm_source: 'zoho',
    utm_medium: 'email',
    utm_campaign: 'PWUK-CRM-2026-01',
    utm_content: 'crm-operations-gap-v1',
    utm_term: 'optional-term',
  };
  const snapshot = JSON.stringify(input);
  validateOwnedCampaignUtm(input);
  assert.equal(JSON.stringify(input), snapshot);
});

test('campaignDictionary is not imported by utm.ts', () => {
  const utmSource = fs.readFileSync(path.join(root, 'src/lib/utm.ts'), 'utf8');
  assert.doesNotMatch(utmSource, /campaignDictionary/);
});

test('existing inbound UTM capture in utm.ts remains unchanged', () => {
  const utmSource = fs.readFileSync(path.join(root, 'src/lib/utm.ts'), 'utf8');
  assert.match(utmSource, /function readUtmFromSearch\(search: string\): UtmParams/);
  assert.match(
    utmSource,
    /utm_source: params\.get\('utm_source'\),\s+utm_medium: params\.get\('utm_medium'\),/,
  );
  assert.doesNotMatch(utmSource, /isOwnedUtmSource|validateOwnedCampaignUtm|isCanonicalCampaignId/);
});

test('existing runtime campaign constants in utm.ts were not modified', () => {
  const utmSource = fs.readFileSync(path.join(root, 'src/lib/utm.ts'), 'utf8');
  assert.match(utmSource, /export const WEB_PRESENCE_AUDIT_CAMPAIGN = 'web_presence_audit_launch'/);
  assert.match(utmSource, /export const REMOTE_RESOURCE_CAMPAIGN = 'remote_resource_augmentation'/);
});
