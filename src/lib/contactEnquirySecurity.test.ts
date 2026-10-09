import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertContactJsonContentType,
  assertContactPayloadSize,
  ContactEnquiryHoneypotError,
  ContactEnquiryValidationError,
  validateContactEnquiry,
} from './contactEnquiryValidation';
import {
  checkContactEnquiryRateLimit,
  resetContactEnquiryRateLimitForTests,
} from './contactEnquiryRateLimit';

test('valid legacy contact payload remains accepted without a honeypot field', () => {
  assert.deepEqual(validateContactEnquiry({
    name: 'Ava Smith',
    email: 'AVA@example.co.uk',
    message: 'Please help us improve our CRM workflow.',
    phone: null,
  }), {
    name: 'Ava Smith',
    email: 'ava@example.co.uk',
    message: 'Please help us improve our CRM workflow.',
    phone: null,
  });
});

test('contact validation rejects invalid types, lengths and email addresses', () => {
  for (const payload of [
    { name: 42, email: 'a@example.com', message: 'Long enough message' },
    { name: 'Ava', email: 'not-an-email', message: 'Long enough message' },
    { name: 'Ava', email: 'a@example.com', message: 'short' },
  ]) {
    assert.throws(() => validateContactEnquiry(payload), ContactEnquiryValidationError);
  }
  assert.throws(() => assertContactJsonContentType('text/plain'), ContactEnquiryValidationError);
  assert.throws(() => assertContactPayloadSize('20000'), ContactEnquiryValidationError);
});

test('filled honeypot is rejected while an absent or empty field is accepted', () => {
  const base = { name: 'Ava', email: 'a@example.com', message: 'Long enough contact message' };
  assert.doesNotThrow(() => validateContactEnquiry(base));
  assert.doesNotThrow(() => validateContactEnquiry({ ...base, companyWebsite: '' }));
  assert.throws(() => validateContactEnquiry({ ...base, companyWebsite: 'spam' }), ContactEnquiryHoneypotError);
});

test('contact rate limiting isolates and resets endpoint buckets', () => {
  resetContactEnquiryRateLimitForTests();
  for (let index = 0; index < 5; index += 1) assert.equal(checkContactEnquiryRateLimit('203.0.113.9', 1000).allowed, true);
  assert.equal(checkContactEnquiryRateLimit('203.0.113.9', 1000).allowed, false);
  assert.equal(checkContactEnquiryRateLimit('203.0.113.10', 1000).allowed, true);
  resetContactEnquiryRateLimitForTests();
});

test('contact route validates before persistence and keeps the 201 success contract', () => {
  const server = fs.readFileSync(path.join(process.cwd(), 'server.ts'), 'utf8');
  const start = server.indexOf("app.post('/api/contact'");
  const end = server.indexOf("app.post('/api/digital-systems-review'", start);
  const route = server.slice(start, end);
  assert.match(route, /assertContactJsonContentType/);
  assert.match(route, /checkContactEnquiryRateLimit/);
  assert.match(route, /validateContactEnquiry\(req\.body\)/);
  assert.ok(route.indexOf('validateContactEnquiry(req.body)') < route.indexOf('prisma.formResponse.create'));
  assert.match(route, /res\.status\(201\)\.json\(\{ success: true \}\)/);
});
