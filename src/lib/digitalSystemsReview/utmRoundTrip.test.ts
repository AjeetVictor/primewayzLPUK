import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mapClientUtmParamsToAttribution,
  normalizeTouchAttribution,
} from './attribution.ts';
import { validateAndNormalizeDigitalSystemsReviewLead } from './validateReviewLead.ts';

const completePayload = {
  submissionId: 'utmroundtrip0001',
  name: 'Alex Reviewer',
  workEmail: 'alex@example.co.uk',
  company: 'Example Ltd',
  serviceArea: 'Website Visibility & Conversion',
  context: 'Enquiry form is unclear and CRM follow-up is inconsistent across the team.',
  preferredNextStep: 'Email me the recommended next step',
  acknowledgement: true,
  sourceLocation: 'digital_systems_review_page',
};

test('real UTM utility shape maps to approved keys and round-trips through validation', () => {
  // Mirrors getFirstUtmParams / getLatestUtmParams return shape from src/lib/utm.ts
  const firstFromUtility = {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'brand',
    utm_content: null,
    utm_term: null,
  };
  const latestFromUtility = {
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: null,
    utm_content: null,
    utm_term: null,
  };

  const firstTouchAttribution = mapClientUtmParamsToAttribution(firstFromUtility);
  const latestTouchAttribution = mapClientUtmParamsToAttribution(latestFromUtility);

  assert.deepEqual(firstTouchAttribution, {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'brand',
  });
  assert.deepEqual(latestTouchAttribution, {
    utm_source: 'newsletter',
    utm_medium: 'email',
  });

  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    firstTouchAttribution,
    latestTouchAttribution,
  });

  assert.equal(lead.firstTouchAttribution?.utm_source, 'google');
  assert.equal(lead.latestTouchAttribution?.utm_source, 'newsletter');
  assert.notEqual(lead.firstTouchAttribution?.utm_source, lead.latestTouchAttribution?.utm_source);
  assert.equal('name' in (lead.firstTouchAttribution || {}), false);
  assert.equal('email' in (lead.firstTouchAttribution || {}), false);
  assert.equal('company' in (lead.firstTouchAttribution || {}), false);

  assert.throws(
    () =>
      normalizeTouchAttribution(
        { utm_source: 'x', name: 'Alex' },
        'First-touch attribution',
      ),
    /unsupported fields/,
  );
});
