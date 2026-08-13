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
    /await prisma\.formResponse\.create\([\s\S]*?res\.status\(201\)\.json\(\{ success: true \}\);/,
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

test('contact API success response does not expose the stored form record', () => {
  assert.match(
    contactRoute,
    /res\.status\(201\)\.json\(\{ success: true \}\);/,
  );

  assert.doesNotMatch(
    contactRoute,
    /res\.status\(201\)\.json\(\{\s*success:\s*true,\s*form\s*\}\);/,
  );

  assert.doesNotMatch(
    contactRoute,
    /const\s+form\s*=\s*await\s+prisma\.formResponse\.create/,
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

test('contact conversion includes the selected non-PII service interest', () => {
  const payloadMatch = contactForm.match(
    /const conversionPayload = \{([\s\S]*?)\n        \};/,
  );

  assert.ok(payloadMatch, 'Conversion payload was not found');
  assert.match(
    payloadMatch[1],
    /service_interest:\s*formData\.supportArea/,
  );
});

test('contact API payload includes controlled attribution fields', () => {
  assert.match(
    contactForm,
    /supportArea:\s*formData\.supportArea/,
  );

  assert.match(
    contactForm,
    /sourcePagePath:\s*window\.location\.pathname/,
  );

  assert.match(
    contactForm,
    /firstUtmSource:\s*firstUtm\.utm_source/,
  );

  assert.match(
    contactForm,
    /latestUtmSource:\s*latestUtm\.utm_source/,
  );
});

test('contact API persists the sanitised commercial context', () => {
  assert.match(
    server,
    /import \{ buildContactEnquiryCommercialContext \} from '\.\/src\/lib\/contactEnquiryContext\.ts';/,
  );

  assert.match(
    contactRoute,
    /const commercialContext = buildContactEnquiryCommercialContext\(req\.body\);/,
  );

  assert.match(
    contactRoute,
    /commercialContext:\s*Object\.keys\(commercialContext\)\.length > 0\s*\?\s*\(commercialContext as Prisma\.InputJsonObject\)\s*:\s*undefined/,
  );
});

test('contact lifecycle event remains separate', () => {
  assert.match(
    contactForm,
    /trackEvent\('contact_form_submit', conversionPayload\);/,
  );
});

test('contact successful enquiry emits generate_lead once', () => {
  assert.match(
    contactForm,
    /if \(response\.status === 201 && data\?\.success === true\) \{[\s\S]*?trackConversionEvent\('contact_enquiry_complete', conversionPayload\);[\s\S]*?trackConversionEvent\('generate_lead', conversionPayload\);/,
  );

  assert.equal(
    (contactForm.match(/trackConversionEvent\('generate_lead', conversionPayload\);/g) || []).length,
    1,
  );
});
