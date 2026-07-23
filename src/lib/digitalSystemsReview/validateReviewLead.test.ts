import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DigitalSystemsReviewHoneypotError,
  DigitalSystemsReviewValidationError,
  assertJsonContentType,
  normalizeLandingPage,
  normalizeMultilineContext,
  normalizeReferrer,
  validateAndNormalizeDigitalSystemsReviewLead,
} from './validateReviewLead.ts';
import { REVIEW_FIELD_LIMITS } from '../../constants/digitalSystemsReview.ts';
import { normalizeOptionalChatSessionId } from './chatSessionId.ts';
import {
  DIGITAL_SYSTEMS_REVIEW_EMAIL_SUBJECT,
  buildDigitalSystemsReviewNotificationEmail,
} from './reviewEmail.ts';

const completePayload = {
  submissionId: 'submittest001abcdef',
  name: 'Alex Reviewer',
  workEmail: 'Alex@Example.co.uk',
  company: 'Example Ltd',
  website: 'example.co.uk',
  serviceArea: 'Website Visibility & Conversion',
  context: 'Enquiry form is unclear and CRM follow-up is inconsistent across the team.',
  preferredNextStep: 'Email me the recommended next step',
  acknowledgement: true,
  sourceLocation: 'digital_systems_review_page',
  landingPage: '/digital-systems-review',
  referrer: 'https://example.com/ref',
  firstTouchAttribution: {
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'brand',
  },
  latestTouchAttribution: {
    utm_source: 'newsletter',
    utm_medium: 'email',
  },
};

test('valid payload is normalized', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead(completePayload);
  assert.equal(lead.submissionId, 'submittest001abcdef');
  assert.equal(lead.workEmail, 'alex@example.co.uk');
  assert.equal(lead.website, 'https://example.co.uk/');
  assert.equal(lead.serviceArea, 'Website Visibility & Conversion');
  assert.equal(lead.preferredNextStep, 'Email me the recommended next step');
  assert.ok(lead.consentAt instanceof Date);
  assert.equal(lead.firstTouchAttribution?.utm_source, 'google');
  assert.equal(lead.latestTouchAttribution?.utm_medium, 'email');
  assert.equal(lead.chatSessionId, null);
});

test('invalid email, overlong email, and address lists are rejected', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        workEmail: 'not-an-email',
      }),
    DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        workEmail: `${'a'.repeat(250)}@example.com`,
      }),
    /too long/i,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        workEmail: `${'a'.repeat(REVIEW_FIELD_LIMITS.emailMax - 11)}@example.com`,
      }),
    /too long/i,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        workEmail: 'one@example.com,two@example.com',
      }),
    DigitalSystemsReviewValidationError,
  );
});

test('191-character valid-format work email is accepted at the emailMax limit', () => {
  const domain = '@example.com';
  const localLen = REVIEW_FIELD_LIMITS.emailMax - domain.length;
  const workEmail = `${'a'.repeat(localLen)}${domain}`;
  assert.equal(workEmail.length, REVIEW_FIELD_LIMITS.emailMax);
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    workEmail,
  });
  assert.equal(lead.workEmail, workEmail);
});

test('work email above 191 characters is rejected before persistence', () => {
  const domain = '@example.com';
  const workEmail = `${'a'.repeat(REVIEW_FIELD_LIMITS.emailMax - domain.length + 1)}${domain}`;
  assert.ok(workEmail.length > REVIEW_FIELD_LIMITS.emailMax);
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        workEmail,
      }),
    /too long/i,
  );
});

test('invalid website, credentials, and overlong website are rejected', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        website: 'not a url',
      }),
    DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        website: 'https://user:pass@example.com',
      }),
    DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        website: `https://example.com/${'a'.repeat(250)}`,
      }),
    /too long/i,
  );
});

test('website query and hash are stripped before storage', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    website: 'https://example.co.uk/path?token=secret#section',
  });
  assert.equal(lead.website, 'https://example.co.uk/path');
  assert.doesNotMatch(lead.website || '', /token|secret|#/);
});

test('unsupported service and next step are rejected', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        serviceArea: 'Magic SEO Package',
      }),
    DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        preferredNextStep: 'Send me a fixed quote',
      }),
    DigitalSystemsReviewValidationError,
  );
});

test('acknowledgement aliases and missing acknowledgement are rejected', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        acknowledgement: false,
      }),
    DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        acknowledgement: undefined,
        consent: true,
      }),
    /unsupported fields|understand how the submitted/i,
  );
});

test('filled honeypot and unexpected top-level keys are rejected', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        companyWebsite: 'https://spam.example',
      }),
    DigitalSystemsReviewHoneypotError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        phone: '07000000000',
      }),
    /unsupported fields/i,
  );
});

test('oversized context and arrays/objects are rejected', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        context: 'x'.repeat(2001),
      }),
    /too long/i,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        name: ['Alex'],
      }),
    DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        firstTouchAttribution: { utm_source: { nested: true } },
      }),
    DigitalSystemsReviewValidationError,
  );
});

test('landing page and referrer are privacy-normalised', () => {
  assert.equal(
    normalizeLandingPage(
      'https://uk.primewayz.com/digital-systems-review?email=user@example.com&utm_source=x#form',
    ),
    '/digital-systems-review',
  );
  assert.equal(
    normalizeReferrer(
      'https://example.com/article?token=secret&email=user@example.com#section',
    ),
    'https://example.com/article',
  );

  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    landingPage:
      'https://uk.primewayz.com/digital-systems-review?email=user@example.com&utm_source=x#form',
    referrer: 'https://example.com/article?token=secret&email=user@example.com#section',
  });
  assert.equal(lead.landingPage, '/digital-systems-review');
  assert.equal(lead.referrer, 'https://example.com/article');
  assert.doesNotMatch(lead.landingPage || '', /email|utm_source|\?|#/);
  assert.doesNotMatch(lead.referrer || '', /token|email|\?|#/);
});

test('protocol-relative landing-page input is omitted', () => {
  assert.equal(
    normalizeLandingPage('//example.com/private?email=user@example.com'),
    null,
  );
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    landingPage: '//example.com/private?email=user@example.com',
  });
  assert.equal(lead.landingPage, null);
  assert.notEqual(lead.landingPage, '/private');
});

test('relative Primewayz paths and approved absolute URLs remain accepted', () => {
  assert.equal(normalizeLandingPage('/digital-systems-review'), '/digital-systems-review');
  assert.equal(
    normalizeLandingPage('https://uk.primewayz.com/services#section'),
    '/services',
  );
});

test('malformed optional landingPage or referrer are omitted', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    landingPage: 'https://evil.example/path?x=1',
    referrer: 'not-a-url',
  });
  assert.equal(lead.landingPage, null);
  assert.equal(lead.referrer, null);
});

test('context control characters are removed while multiline Unicode is preserved', () => {
  assert.equal(
    normalizeMultilineContext('Line one\r\nLine two\u0000with\u0007noise\tkeep'),
    'Line one\nLine twowithnoise keep',
  );
  assert.equal(
    normalizeMultilineContext('Keep <angle> brackets and café résumé\u007F'),
    'Keep <angle> brackets and café résumé',
  );

  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    context:
      'Enquiry form is unclear\nand CRM follow-up is inconsistent\u0000 across the team.',
  });
  assert.equal(
    lead.context,
    'Enquiry form is unclear\nand CRM follow-up is inconsistent across the team.',
  );
  assert.doesNotMatch(lead.context, /\u0000|[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/);
  assert.match(lead.context, /\n/);
});

test('malformed chatSessionId is omitted without rejecting the lead', () => {
  for (const chatSessionId of [
    'a',
    'not an id',
    'user@example.com',
    12345,
    { id: 'x' },
  ]) {
    const lead = validateAndNormalizeDigitalSystemsReviewLead({
      ...completePayload,
      chatSessionId,
    });
    assert.equal(lead.chatSessionId, null);
  }
  assert.equal(normalizeOptionalChatSessionId('bad id'), undefined);
});

test('two-field chat identity payload cannot create a review lead', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        name: 'Chat Visitor',
        email: 'visitor@example.com',
      }),
    (error: unknown) =>
      error instanceof DigitalSystemsReviewValidationError
      && /complete digital systems review request/i.test(error.message),
  );
});

test('single-line fields collapse whitespace and email subject stays fixed', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    name: 'Alex\nReviewer',
    company: 'Example\tLtd\nCorp',
  });
  assert.equal(lead.name, 'Alex Reviewer');
  assert.equal(lead.company, 'Example Ltd Corp');

  const email = buildDigitalSystemsReviewNotificationEmail({
    ...lead,
    company: 'Evil\nBCC: attacker@example.com',
  });
  assert.equal(email.subject, DIGITAL_SYSTEMS_REVIEW_EMAIL_SUBJECT);
  assert.doesNotMatch(email.subject, /\n|BCC/);
  assert.match(email.html, /Evil/);
  assert.doesNotMatch(email.text, /SMTP|password|secret-token/i);
});

test('HTML dynamic values are escaped and query PII is absent after normalisation', () => {
  const lead = validateAndNormalizeDigitalSystemsReviewLead({
    ...completePayload,
    name: 'Alex <script>alert(1)</script>',
    landingPage:
      'https://uk.primewayz.com/digital-systems-review?email=user@example.com',
    referrer: 'https://example.com/a?token=secret',
  });
  const email = buildDigitalSystemsReviewNotificationEmail(lead);
  assert.match(email.html, /Alex &lt;script&gt;/);
  assert.doesNotMatch(email.html, /<script>alert/);
  assert.doesNotMatch(email.text, /user@example\.com|token=secret/);
  assert.match(email.text, /Landing page: \/digital-systems-review/);
  assert.match(email.text, /Referrer: https:\/\/example\.com\/a/);
});

test('json content-type validation is strict', () => {
  assert.doesNotThrow(() => assertJsonContentType('application/json'));
  assert.doesNotThrow(() => assertJsonContentType('application/json; charset=utf-8'));
  assert.doesNotThrow(() => assertJsonContentType('application/ld+json'));
  assert.throws(
    () => assertJsonContentType('text/plain; application/json'),
    DigitalSystemsReviewValidationError,
  );
  assert.throws(
    () => assertJsonContentType('application/json-spoof'),
    DigitalSystemsReviewValidationError,
  );
});

test('email fallback key and consent aliases are not accepted', () => {
  assert.throws(
    () =>
      validateAndNormalizeDigitalSystemsReviewLead({
        ...completePayload,
        workEmail: undefined,
        email: 'alex@example.co.uk',
      }),
    /complete digital systems review request|unsupported fields/i,
  );
});
