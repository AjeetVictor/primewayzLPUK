import assert from 'node:assert/strict';
import test from 'node:test';
import { buildContactEnquiryCommercialContext } from './contactEnquiryContext';

test('builds a safe contact attribution context', () => {
  const context = buildContactEnquiryCommercialContext({
    supportArea: ' CRM & automation ',
    sourcePagePath: '/contact-us?utm_source=qa#contact-form',
    firstUtmSource: ' google ',
    firstUtmMedium: ' organic ',
    latestUtmSource: ' qa_manual ',
    latestUtmMedium: ' validation ',
    latestUtmCampaign: ' ga4_contact_validation_20260813 ',
    latestUtmContent: ' crm_service_interest ',
  });

  assert.deepEqual(context, {
    serviceInterest: 'CRM & automation',
    sourcePagePath: '/contact-us',
    firstAttribution: {
      utm_source: 'google',
      utm_medium: 'organic',
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
    },
    latestAttribution: {
      utm_source: 'qa_manual',
      utm_medium: 'validation',
      utm_campaign: 'ga4_contact_validation_20260813',
      utm_content: 'crm_service_interest',
      utm_term: null,
    },
  });
});

test('rejects unsupported service interests and external source URLs', () => {
  const context = buildContactEnquiryCommercialContext({
    supportArea: 'Arbitrary customer-entered value',
    sourcePagePath: 'https://example.com/contact-us',
  });

  assert.deepEqual(context, {});
});

test('does not persist unrelated personal information', () => {
  const input = {
    supportArea: 'Technical SEO & visibility',
    firstUtmSource: 'google',
    name: 'Sensitive Name',
    email: 'sensitive@example.com',
    phone: '+441234567890',
    message: 'Sensitive enquiry text',
  };

  const context = buildContactEnquiryCommercialContext(input);
  const serialised = JSON.stringify(context);

  assert.doesNotMatch(serialised, /Sensitive Name/);
  assert.doesNotMatch(serialised, /sensitive@example\.com/);
  assert.doesNotMatch(serialised, /\+441234567890/);
  assert.doesNotMatch(serialised, /Sensitive enquiry text/);
});

test('caps attribution values before persistence', () => {
  const context = buildContactEnquiryCommercialContext({
    firstUtmCampaign: 'x'.repeat(500),
  });

  test('normalizes malformed attribution values before persistence', () => {
    const context = buildContactEnquiryCommercialContext({
      firstUtmSource: `campaign\n${'x'.repeat(200)}`,
      latestUtmCampaign: 'private.person@example.com',
      latestUtmTerm: '+44 7700 900123',
    });

    test('persists only safe funnel route, CTA and registered plan attribution', () => {
      assert.deepEqual(
        buildContactEnquiryCommercialContext({
          supportArea: 'Software / product delivery',
          landingPagePath: '/pricing?email=private@example.com',
          sourcePagePath: '/success-stories/example#request',
          submissionPagePath: '/contact-us',
          ctaPlacement: 'pricing_plan_detail_modal_secondary',
          selectedPlanSlug: 'essential',
        }),
        {
          serviceInterest: 'Software / product delivery',
          landingPagePath: '/pricing',
          sourcePagePath: '/success-stories/example',
          submissionPagePath: '/contact-us',
          ctaPlacement: 'pricing_plan_detail_modal_secondary',
          selectedPlanSlug: 'essential',
        },
      );
    });
    assert.equal(context.firstAttribution?.utm_source?.length, 160);
    assert.equal(context.latestAttribution, undefined);
  });

  assert.equal(context.firstAttribution?.utm_campaign?.length, 160);
});
