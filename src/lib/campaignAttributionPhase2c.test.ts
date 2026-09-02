import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  buildOwnedCampaignUrl,
  OwnedCampaignUrlError,
} from './ownedCampaignUrls.ts';
import {
  buildWebPresenceAuditLaunchUrl,
  captureUtmParams,
  getFirstUtmParams,
  getLatestUtmParams,
  getUtmAnalyticsPayload,
  isWebPresenceAuditCampaign,
  readUtmParamsFromSearch,
  REMOTE_RESOURCE_CAMPAIGN,
  WEB_PRESENCE_AUDIT_CAMPAIGN,
  WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN,
} from './utm.ts';

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('canonical visibility campaign is recognised by isWebPresenceAuditCampaign', () => {
  assert.equal(
    isWebPresenceAuditCampaign({ utm_campaign: WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN, utm_source: null, utm_medium: null, utm_content: null, utm_term: null }),
    true,
  );
});

test('legacy audit campaign is still recognised by isWebPresenceAuditCampaign', () => {
  assert.equal(
    isWebPresenceAuditCampaign({ utm_campaign: WEB_PRESENCE_AUDIT_CAMPAIGN, utm_source: null, utm_medium: null, utm_content: null, utm_term: null }),
    true,
  );
});

test('unrelated campaign is not recognised as web presence audit', () => {
  assert.equal(
    isWebPresenceAuditCampaign({ utm_campaign: 'PWUK-CRM-2026-01', utm_source: null, utm_medium: null, utm_content: null, utm_term: null }),
    false,
  );
});

test('LinkedIn launch URL uses canonical owned UTM values', () => {
  const url = buildWebPresenceAuditLaunchUrl();
  const parsed = new URL(url);

  assert.equal(parsed.origin + parsed.pathname, 'https://uk.primewayz.com/uk-sme-digital-visibility-checker');
  assert.equal(parsed.searchParams.get('utm_source'), 'linkedin');
  assert.equal(parsed.searchParams.get('utm_medium'), 'organic-social');
  assert.equal(parsed.searchParams.get('utm_campaign'), WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN);
  assert.equal(parsed.searchParams.get('utm_content'), 'company-page-launch-v1');
});

test('LinkedIn launch URL rejects invalid custom content', () => {
  assert.throws(
    () => buildWebPresenceAuditLaunchUrl('company_page_launch'),
    OwnedCampaignUrlError,
  );
});

test('LinkedIn launch URL does not generate legacy organic medium', () => {
  const url = buildWebPresenceAuditLaunchUrl();
  assert.doesNotMatch(url, /utm_medium=organic(?:&|$|#)/);
});

test('readUtmParamsFromSearch accepts arbitrary legacy inbound UTM values', () => {
  const search = '?utm_source=newsletter&utm_medium=organic&utm_campaign=web_presence_audit_email&utm_content=in_depth_cta';
  const utm = readUtmParamsFromSearch(search);

  assert.deepEqual(utm, {
    utm_source: 'newsletter',
    utm_medium: 'organic',
    utm_campaign: 'web_presence_audit_email',
    utm_content: 'in_depth_cta',
    utm_term: null,
  });
});

test('buildOwnedCampaignUrl preserves URL hash', () => {
  const url = buildOwnedCampaignUrl('https://uk.primewayz.com/contact-us#book-call', {
    utm_source: 'primewayz',
    utm_medium: 'email',
    utm_campaign: WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN,
    utm_content: 'in-depth-audit-cta-v1',
  });

  assert.equal(url, 'https://uk.primewayz.com/contact-us?utm_source=primewayz&utm_medium=email&utm_campaign=PWUK-VIS-2026-01&utm_content=in-depth-audit-cta-v1#book-call');
});

test('buildOwnedCampaignUrl rejects invalid owned campaign definitions', () => {
  assert.throws(
    () => buildOwnedCampaignUrl('https://uk.primewayz.com/contact-us', {
      utm_source: 'linkedin',
      utm_medium: 'organic',
      utm_campaign: WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN,
      utm_content: 'launch-v1',
    }),
    OwnedCampaignUrlError,
  );
});

const ownedUtmBase = {
  utm_source: 'primewayz',
  utm_medium: 'email',
  utm_campaign: WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN,
  utm_content: 'in-depth-audit-cta-v1',
};

test('buildOwnedCampaignUrl preserves functional query values containing a second question mark', () => {
  const url = buildOwnedCampaignUrl('/contact-us?next=/pricing?plan=starter#book-call', ownedUtmBase);
  const hashIndex = url.indexOf('#');
  const query = url.slice(url.indexOf('?') + 1, hashIndex >= 0 ? hashIndex : undefined);
  const params = new URLSearchParams(query);

  assert.equal(params.get('next'), '/pricing?plan=starter');
  assert.equal(params.get('utm_source'), ownedUtmBase.utm_source);
  assert.equal(params.get('utm_medium'), ownedUtmBase.utm_medium);
  assert.equal(params.get('utm_campaign'), ownedUtmBase.utm_campaign);
  assert.equal(params.get('utm_content'), ownedUtmBase.utm_content);
});

test('buildOwnedCampaignUrl preserves existing non-UTM query parameters', () => {
  const url = buildOwnedCampaignUrl('https://uk.primewayz.com/contact-us?ref=partner&locale=en-gb', ownedUtmBase);
  const params = new URLSearchParams(url.split('?')[1]);

  assert.equal(params.get('ref'), 'partner');
  assert.equal(params.get('locale'), 'en-gb');
  assert.equal(params.get('utm_source'), ownedUtmBase.utm_source);
});

test('buildOwnedCampaignUrl removes stale utm_term when input omits utm_term', () => {
  const url = buildOwnedCampaignUrl(
    'https://uk.primewayz.com/contact-us?utm_term=stale-term&locale=en-gb',
    ownedUtmBase,
  );
  const params = new URLSearchParams(url.split('?')[1]);

  assert.equal(params.get('utm_term'), null);
  assert.equal(params.get('locale'), 'en-gb');
  assert.equal(params.get('utm_source'), ownedUtmBase.utm_source);
});

test('buildOwnedCampaignUrl replaces existing utm_term when input supplies utm_term', () => {
  const url = buildOwnedCampaignUrl(
    'https://uk.primewayz.com/contact-us?utm_term=stale-term',
    { ...ownedUtmBase, utm_term: 'fresh-term' },
  );
  const params = new URLSearchParams(url.split('?')[1]);

  assert.equal(params.get('utm_term'), 'fresh-term');
  assert.equal(params.get('utm_source'), ownedUtmBase.utm_source);
});

test('buildOwnedCampaignUrl keeps hash last in the owned URL', () => {
  const url = buildOwnedCampaignUrl(
    'https://uk.primewayz.com/contact-us?ref=partner#book-call',
    ownedUtmBase,
  );

  assert.match(url, /#book-call$/);
  assert.doesNotMatch(url, /#book-call\?/);
  assert.ok(url.indexOf('#') > url.indexOf('?'));
});

test('CampaignLandingHandler uses current URL UTM for campaign_landing and routing', () => {
  const source = read('src/components/CampaignLandingHandler.tsx');

  assert.match(source, /captureUtmParams\(location\.search\);/);
  assert.match(source, /readUtmParamsFromSearch\(location\.search\)/);
  assert.match(source, /getUtmAnalyticsPayload\(currentUtm\)/);
  assert.match(source, /isWebPresenceAuditCampaign\(currentUtm\)/);
  assert.doesNotMatch(source, /getUtmAnalyticsPayload\(utm\)/);
  assert.doesNotMatch(source, /isWebPresenceAuditCampaign\(utm\)/);
});

test('unrelated first-touch with current audit campaign still routes via current URL logic', () => {
  const staleFirstTouch = {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'brand',
    utm_content: null,
    utm_term: null,
  };
  const currentSearch = `?utm_campaign=${WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN}&utm_source=linkedin&utm_medium=organic-social&utm_content=company-page-launch-v1`;
  const currentUtm = readUtmParamsFromSearch(currentSearch);

  assert.equal(isWebPresenceAuditCampaign(staleFirstTouch), false);
  assert.equal(isWebPresenceAuditCampaign(currentUtm), true);
});

test('legacy audit first-touch with unrelated current campaign does not route via current URL logic', () => {
  const staleFirstTouch = {
    utm_source: 'linkedin',
    utm_medium: 'organic',
    utm_campaign: WEB_PRESENCE_AUDIT_CAMPAIGN,
    utm_content: 'company_page_launch',
    utm_term: null,
  };
  const currentSearch = '?utm_campaign=PWUK-CRM-2026-01&utm_source=zoho&utm_medium=email&utm_content=crm-operations-gap-v1';
  const currentUtm = readUtmParamsFromSearch(currentSearch);

  assert.equal(isWebPresenceAuditCampaign(staleFirstTouch), true);
  assert.equal(isWebPresenceAuditCampaign(currentUtm), false);
});

test('campaign_landing payload uses current URL UTM, not stale first-touch', () => {
  const currentSearch = '?utm_campaign=PWUK-CRM-2026-01&utm_source=zoho&utm_medium=email&utm_content=crm-operations-gap-v1';
  const currentUtm = readUtmParamsFromSearch(currentSearch);
  const staleFirstTouch = {
    utm_source: 'linkedin',
    utm_medium: 'organic',
    utm_campaign: WEB_PRESENCE_AUDIT_CAMPAIGN,
    utm_content: 'company_page_launch',
    utm_term: null,
  };

  assert.notEqual(getUtmAnalyticsPayload(currentUtm).utm_campaign, getUtmAnalyticsPayload(staleFirstTouch).utm_campaign);
  assert.equal(getUtmAnalyticsPayload(currentUtm).utm_campaign, 'PWUK-CRM-2026-01');
});

test('benchmark Contact CTA URL contains no utm_ parameters', () => {
  const source = read('src/lib/audit/benchmark/constants.ts');
  assert.match(source, /VERIFIED_VISIBILITY_AUDIT_CTA_URL/);
  assert.doesNotMatch(source, /utm_source=|utm_medium=|utm_campaign=|utm_content=|utm_term=/);
  assert.match(source, /contact-us#book-call/);
});

test('action-card Contact URLs contain no utm_ parameters', () => {
  const source = read('src/constants/auditCategoryActionLinks.ts');
  assert.match(source, /auditActionContactHref/);
  assert.doesNotMatch(source, /utm_source=|utm_medium=|utm_campaign=|utm_content=|utm_term=/);
  assert.match(source, /\/contact-us#book-call/);
});

test('shared-report Contact CTA URL contains no utm_ parameters', () => {
  const source = read('src/lib/audit/share/disclaimers.ts');
  assert.match(source, /SHARED_REPORT_CONTACT_CTA_URL/);
  assert.doesNotMatch(source, /utm_source=|utm_medium=|utm_campaign=|utm_content=|utm_term=/);
  assert.match(source, /contact-us#book-call/);
});

test('automated audit email CTA uses primewayz, email, and canonical campaign ID', () => {
  const source = read('src/lib/audit/email/emailReportService.ts');
  assert.match(source, /utm_source: 'primewayz'/);
  assert.match(source, /utm_medium: 'email'/);
  assert.match(source, /utm_campaign: WEB_PRESENCE_AUDIT_CANONICAL_CAMPAIGN/);
  assert.match(source, /utm_content: 'in-depth-audit-cta-v1'/);
  assert.match(source, /#book-call/);
});

test('buildInternalUtmUrl has zero production callers and was removed', () => {
  const utmSource = read('src/lib/utm.ts');
  assert.doesNotMatch(utmSource, /export function buildInternalUtmUrl/);

  const srcFiles = [
    'src/App.tsx',
    'src/components',
    'src/constants',
    'src/lib',
  ];

  for (const entry of srcFiles) {
    const fullPath = path.join(root, entry);
    if (!fs.existsSync(fullPath)) continue;

    const queue = [fullPath];
    while (queue.length > 0) {
      const current = queue.pop()!;
      const stat = fs.statSync(current);
      if (stat.isDirectory()) {
        for (const child of fs.readdirSync(current)) {
          queue.push(path.join(current, child));
        }
        continue;
      }

      if (!/\.(ts|tsx)$/.test(current) || current.endsWith('.test.ts')) continue;
      const contents = fs.readFileSync(current, 'utf8');
      assert.doesNotMatch(contents, /buildInternalUtmUrl\(/, `${path.relative(root, current)} must not call buildInternalUtmUrl`);
    }
  }
});

test('REMOTE_RESOURCE_CAMPAIGN remains unchanged', () => {
  assert.equal(REMOTE_RESOURCE_CAMPAIGN, 'remote_resource_augmentation');
  assert.match(read('src/lib/utm.ts'), /export const REMOTE_RESOURCE_CAMPAIGN = 'remote_resource_augmentation'/);
});

test('captureUtmParams preserves first-touch and updates latest-touch storage semantics', () => {
  const storage = new Map<string, string>();

  const originalWindow = globalThis.window;
  const originalSessionStorage = globalThis.sessionStorage;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
      location: { search: '' },
    },
  });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: globalThis.window.sessionStorage,
  });

  try {
    const firstVisit = '?utm_source=google&utm_medium=cpc&utm_campaign=brand';
    captureUtmParams(firstVisit);

    assert.deepEqual(getFirstUtmParams(), readUtmParamsFromSearch(firstVisit));
    assert.deepEqual(getLatestUtmParams(), readUtmParamsFromSearch(firstVisit));

    const secondVisit = '?utm_source=linkedin&utm_medium=organic-social&utm_campaign=PWUK-VIS-2026-01&utm_content=company-page-launch-v1';
    captureUtmParams(secondVisit);

    assert.deepEqual(getFirstUtmParams(), readUtmParamsFromSearch(firstVisit));
    assert.deepEqual(getLatestUtmParams(), readUtmParamsFromSearch(secondVisit));
    assert.deepEqual(captureUtmParams(''), getFirstUtmParams());
  } finally {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
  }
});
