import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const form = fs.readFileSync(
  path.join(root, 'src/components/sdaas/SdaasCapacityRequestForm.tsx'),
  'utf8',
);

test('sdaas capacity request emits generate_lead only after API success', () => {
  assert.match(
    form,
    /if \(!response\.ok\) \{[\s\S]*?throw new Error\('Submission failed'\);[\s\S]*?\}[\s\S]*?trackSdaasEvent\('sdaas_form_submit'[\s\S]*?trackConversionEvent\('generate_lead'/,
  );

  assert.equal(
    (form.match(/trackConversionEvent\('generate_lead'/g) || []).length,
    1,
  );
});

test('sdaas generate_lead payload contains no personal form fields', () => {
  const payload = form.match(
    /trackConversionEvent\('generate_lead', \{([\s\S]*?)\n      \}\);/,
  );

  assert.ok(payload, 'SDaaS generate_lead payload was not found');

  for (const key of [
    'firstName',
    'workEmail',
    'companyName',
    'websiteUrl',
    'email',
    'phone',
    'name',
    'message',
  ]) {
    assert.doesNotMatch(
      payload[1],
      new RegExp(`\\b${key}\\s*:`, 'i'),
    );
  }

  assert.match(payload[1], /form_name:\s*'sdaas_capacity_request'/);
  assert.match(payload[1], /lead_type:\s*'software_capacity_request'/);
});
