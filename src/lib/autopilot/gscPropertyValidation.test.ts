import assert from 'node:assert/strict';
import test from 'node:test';
import { AutopilotError } from './apiErrors.ts';
import {
  emailsMatchCaseInsensitive,
  findExactAccessibleGscProperty,
  gscPropertyNotAccessibleError,
  normaliseExpectedGscEmail,
  normaliseRequestedGscProperty,
} from './gscPropertyValidation.ts';

test('URL-prefix trailing slash normalisation', () => {
  assert.equal(
    normaliseRequestedGscProperty('https://uk.primewayz.com'),
    'https://uk.primewayz.com/',
  );
  assert.equal(
    normaliseRequestedGscProperty('https://uk.primewayz.com/'),
    'https://uk.primewayz.com/',
  );
});

test('URL-prefix lowercases hostname only and preserves path case', () => {
  assert.equal(
    normaliseRequestedGscProperty('https://UK.Primewayz.com/Blog/Guide'),
    'https://uk.primewayz.com/Blog/Guide',
  );
});

test('domain property exact normalisation', () => {
  assert.equal(
    normaliseRequestedGscProperty('sc-domain:Primewayz.com'),
    'sc-domain:primewayz.com',
  );
});

test('rejects HTTP, localhost, IP, and malformed properties', () => {
  assert.throws(
    () => normaliseRequestedGscProperty('http://uk.primewayz.com/'),
    (err: unknown) => err instanceof AutopilotError && err.code === 'AUTOPILOT_VALIDATION_ERROR',
  );
  assert.throws(() => normaliseRequestedGscProperty('https://localhost/'));
  assert.throws(() => normaliseRequestedGscProperty('https://127.0.0.1/'));
  assert.throws(() => normaliseRequestedGscProperty('not-a-property'));
  assert.throws(() => normaliseRequestedGscProperty('sc-domain:localhost'));
  assert.throws(() => normaliseRequestedGscProperty('ftp://uk.primewayz.com/'));
});

test('exact URL-prefix property match', () => {
  const sites = [
    { siteUrl: 'https://uk.primewayz.com/', permissionLevel: 'siteOwner' },
    { siteUrl: 'https://primewayz.com/', permissionLevel: 'siteFullUser' },
    { siteUrl: 'https://uk.primewayz.com/blog/', permissionLevel: 'siteRestrictedUser' },
    { siteUrl: 'sc-domain:primewayz.com', permissionLevel: 'siteOwner' },
  ];

  const matched = findExactAccessibleGscProperty('https://uk.primewayz.com', sites);
  assert.equal(matched?.siteUrl, 'https://uk.primewayz.com/');
});

test('parent property does not match', () => {
  const sites = [{ siteUrl: 'https://primewayz.com/', permissionLevel: 'siteOwner' }];
  assert.equal(findExactAccessibleGscProperty('https://uk.primewayz.com/', sites), null);
});

test('child-path property does not match', () => {
  const sites = [{ siteUrl: 'https://uk.primewayz.com/blog/', permissionLevel: 'siteOwner' }];
  assert.equal(findExactAccessibleGscProperty('https://uk.primewayz.com/', sites), null);
});

test('domain property exact match', () => {
  const sites = [{ siteUrl: 'sc-domain:primewayz.com', permissionLevel: 'siteOwner' }];
  assert.equal(
    findExactAccessibleGscProperty('sc-domain:Primewayz.com', sites)?.siteUrl,
    'sc-domain:primewayz.com',
  );
});

test('URL-prefix does not match domain property', () => {
  const sites = [{ siteUrl: 'sc-domain:primewayz.com', permissionLevel: 'siteOwner' }];
  assert.equal(findExactAccessibleGscProperty('https://uk.primewayz.com/', sites), null);
  assert.equal(findExactAccessibleGscProperty('https://primewayz.com/', sites), null);
});

test('inaccessible property returns safe error with accessible choices', () => {
  const sites = [
    { siteUrl: 'https://primewayz.com/', permissionLevel: 'siteOwner' },
    { siteUrl: 'sc-domain:primewayz.com', permissionLevel: 'siteFullUser' },
  ];
  const err = gscPropertyNotAccessibleError('https://uk.primewayz.com/', sites);
  assert.equal(err.code, 'GSC_PROPERTY_NOT_ACCESSIBLE');
  const details = err.details as {
    accessibleProperties: Array<{ siteUrl: string; permissionLevel: string | null }>;
  };
  assert.equal(details.accessibleProperties.length, 2);
  assert.equal(JSON.stringify(err).includes('refresh'), false);
});

test('expected email normalisation and case-insensitive compare', () => {
  assert.equal(normaliseExpectedGscEmail('  Admin@Example.COM '), 'admin@example.com');
  assert.equal(emailsMatchCaseInsensitive('Admin@Example.COM', 'admin@example.com'), true);
  assert.equal(emailsMatchCaseInsensitive('a@b.com', 'c@d.com'), false);
  assert.throws(() => normaliseExpectedGscEmail('not-an-email'));
});
