import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

test('generate_lead is emitted only for newly created review leads', () => {
  const form = fs.readFileSync(
    path.join(root, 'src/components/forms/DigitalSystemsReviewForm.tsx'),
    'utf8',
  );
  const thankYou = fs.readFileSync(
    path.join(root, 'src/components/DigitalSystemsReviewThankYouPage.tsx'),
    'utf8',
  );

  assert.match(
    form,
    /data\?\.resultCategory === 'created' \|\| data\?\.resultCategory === 'duplicate'/,
  );
  assert.doesNotMatch(
    form,
    /typeof data\?\.resultCategory === 'string'\s*\?\s*data\.resultCategory\s*:\s*'created'/,
  );
  assert.match(
    form,
    /if \(resultCategory === 'created'\) \{[\s\S]*?trackLeadFormSuccess\([\s\S]*?trackConversionEvent\('generate_lead'/,
  );
  assert.match(form, /trackConversionEvent\('free_review_form_submit'/);
  assert.doesNotMatch(thankYou, /generate_lead/);
});

test('generate_lead payload remains non-PII', () => {
  const form = fs.readFileSync(
    path.join(root, 'src/components/forms/DigitalSystemsReviewForm.tsx'),
    'utf8',
  );

  assert.match(
    form,
    /const generatedLeadPayload = \{[\s\S]*?\.\.\.analyticsPayload,[\s\S]*?form_name:[\s\S]*?lead_type:[\s\S]*?\};/,
  );
  assert.match(
    form,
    /assertNoProhibitedAnalyticsProps\(generatedLeadPayload\);[\s\S]*?trackConversionEvent\('generate_lead', generatedLeadPayload\);/,
  );
});
