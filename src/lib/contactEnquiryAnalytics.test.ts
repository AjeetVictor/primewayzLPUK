import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const contactForm = fs.readFileSync(
  path.join(root, 'src/components/ContactForm.tsx'),
  'utf8',
);

const server = fs.readFileSync(
  path.join(root, 'server.ts'),
  'utf8',
);

const routeStart = server.indexOf("app.post('/api/contact'");
const routeEnd = server.indexOf(
  "app.post('/api/digital-systems-review'",
  routeStart,
);

assert.ok(routeStart >= 0, 'Contact API route was not found');
assert.ok(routeEnd > routeStart, 'Contact API route boundary was not found');

const contactRoute = server.slice(routeStart, routeEnd);

test('contact conversion requires persisted 201 success', () => {
  assert.match(
    contactRoute,
    /const form = await prisma\.formResponse\.create\([\s\S]*?res\.status\(201\)\.json\(\{ success: true, form \}\);/,
  );

  assert.match(
    contactForm,
    /const data = await response\.json\(\)\.catch\(\(\) => null\);\s*if \(response\.status === 201 && data\?\.success === true\) \{[\s\S]*?trackConversionEvent\('contact_enquiry_complete', conversionPayload\);/,
  );

  assert.equal(
    (contactForm.match(/contact_enquiry_complete/g) || []).length,
    1,
  );
});

test('contact conversion payload remains non-PII', () => {
  const payloadMatch = contactForm.match(
    /const conversionPayload = \{([\s\S]*?)\n        \};/,
  );

  assert.ok(payloadMatch, 'Conversion payload was not found');

  for (const key of ['name', 'email', 'phone', 'message', 'company']) {
    assert.doesNotMatch(
      payloadMatch[1],
      new RegExp(`\\b${key}\\s*:`, 'i'),
    );
  }

  assert.match(
    contactForm,
    /assertNoProhibitedAnalyticsProps\(conversionPayload\);/,
  );
});

test('contact lifecycle event remains separate', () => {
  assert.match(
    contactForm,
    /trackEvent\('contact_form_submit', conversionPayload\);/,
  );
});
