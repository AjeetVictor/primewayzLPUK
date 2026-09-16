import type { AuditContext, AuditSignal } from '../types.ts';

function signal(
  key: string,
  category: AuditSignal['category'],
  found: boolean,
  label: string,
  recommendation: string,
  context: AuditContext,
  points = 1,
): AuditSignal {
  return {
    key,
    category,
    status: found ? 'found' : 'missing',
    confidence: 0.88,
    points: found ? points : 0,
    maxPoints: points,
    evidence: found ? [{ source: 'website', url: context.homepage?.finalUrl, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function detectedPhones(value: string): string[] {
  const matches = value.match(/(?:\+?44\s?(?:\(0\)\s?)?|0)(?:\d[\s().-]?){9,10}/g) || [];
  return [...new Set(matches.map((item) => item.replace(/\D/g, '').replace(/^44/, '0')))];
}

export function extractBusinessSignals(context: AuditContext): AuditSignal[] {
  const text = context.combinedText;
  const html = context.combinedHtml;
  const normalizedText = normalized(text);
  const businessName = normalized(context.input.businessName);
  const phones = detectedPhones(text);
  const suppliedPhone = context.input.phone ? context.input.phone.replace(/\D/g, '').replace(/^44/, '0') : '';
  const suppliedEmail = context.input.email?.toLowerCase();
  const serviceLinks = (html.match(/<a\b[^>]*href=["'][^"']*(?:service|solution|what-we-do)[^"']*["'][^>]*>/gi) || []).length;

  const signals = [
    signal('identity-business-name', 'trust-signals', businessName.length >= 3 && normalizedText.includes(businessName), 'The supplied business name appears in the audited pages.', 'Use the same full business name visibly across the homepage, contact page, and legal details.', context, 2),
    signal('identity-phone-consistency', 'trust-signals', phones.length === 1, phones.length > 1 ? 'Multiple distinct phone numbers were detected.' : 'A consistent phone number was detected.', 'Review visible phone numbers and make the primary business number consistent.', context),
    signal('identity-business-hours', 'trust-signals', /opening hours|business hours|mon(?:day)?\s*[-–:]|24\s*\/\s*7/i.test(text), 'Business hours or availability wording was detected.', 'Publish business or response hours when they are relevant to customer decisions.', context),
    signal('identity-company-reference', 'trust-signals', /company (?:number|no\.?|registration)|registered in (?:england|wales|scotland)|companies house/i.test(text), 'A company registration reference was detected.', 'Add the registered company identity to the footer or legal/contact information where applicable.', context),
    signal('identity-vat-reference', 'trust-signals', /\bvat\s*(?:number|no\.?|registration)?\s*[:#]?\s*[a-z0-9]/i.test(text), 'A VAT reference was detected.', 'Publish VAT details where legally or commercially appropriate.', context),
    signal('identity-accreditation', 'trust-signals', /accredited|certified|certification|iso\s?\d{4,5}|licensed|authorised|approved member/i.test(text), 'Accreditation, certification, licence, or membership wording was detected.', 'Show relevant credentials with issuer and scope; external validity still requires verification.', context),
    signal('content-dedicated-services', 'technical-seo', serviceLinks >= 2, `${serviceLinks} dedicated service or solution links were detected.`, 'Create focused landing pages for major services instead of relying on one generic services page.', context, 2),
    signal('content-commercial-assets', 'reviews-reputation', /pricing|finance|payment plan|frequently asked questions|\bfaq\b|before and after|project gallery/i.test(text), 'Commercial decision-support content was detected.', 'Add useful pricing guidance, FAQs, project evidence, or payment information where relevant.', context),
    signal('conversion-response-promise', 'lead-capture', /respond within|reply within|same day|within \d+ (?:hour|business day)/i.test(text), 'A response-time promise was detected near the enquiry journey.', 'Set a realistic response-time expectation near the primary enquiry form or CTA.', context),
  ];
  if (suppliedPhone) {
    signals.push(signal('identity-supplied-phone', 'trust-signals', phones.includes(suppliedPhone), 'The supplied phone number matches a number detected on the website.', 'Display the supplied business phone number consistently on the website.', context));
  }
  if (suppliedEmail) {
    signals.push(signal('identity-supplied-email', 'trust-signals', text.toLowerCase().includes(suppliedEmail), 'The supplied email address appears in the audited pages.', 'Display the supplied business email address on the contact page where appropriate.', context));
  }
  return signals;
}
