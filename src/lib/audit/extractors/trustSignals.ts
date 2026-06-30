import type { AuditContext, AuditSignal } from '../types.ts';

function includesAny(value: string, terms: string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function trustSignal(
  key: string,
  found: boolean,
  maxPoints: number,
  label: string,
  recommendation: string,
  url?: string,
): AuditSignal {
  return {
    key,
    category: 'trust-signals',
    status: found ? 'found' : 'missing',
    confidence: 0.9,
    points: found ? maxPoints : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

export function extractTrustSignals(context: AuditContext): AuditSignal[] {
  const html = context.combinedHtml.toLowerCase();
  const text = context.combinedText.toLowerCase();
  const url = context.homepage?.finalUrl;
  const businessName = context.input.businessName.toLowerCase();
  const contactDetails = /mailto:|tel:|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s().-]{8,}/i.test(context.combinedHtml);
  const addressSignals = includesAny(text, ['address', 'registered office', 'service area', 'serving ', 'based in ']);

  return [
    trustSignal('trust-contact-page', includesAny(html, ['href="/contact', "href='/contact", 'contact-us', '/contact-us']), 2, 'A contact page or link was found.', 'Add a clearly labelled contact page.', url),
    trustSignal('trust-about-page', includesAny(html, ['href="/about', "href='/about", 'about-us', '/about-us']), 2, 'An about page or link was found.', 'Add an about page explaining who the business is.', url),
    trustSignal('trust-privacy-page', includesAny(html, ['privacy-policy', '>privacy<']), 2, 'A privacy page or link was found.', 'Publish and link a privacy policy.', url),
    trustSignal('trust-terms-page', includesAny(html, ['terms-and-conditions', 'terms-of-service', '>terms<']), 2, 'A terms page or link was found.', 'Publish and link business terms.', url),
    trustSignal('trust-business-name', text.includes(businessName), 2, `Business name found: ${context.input.businessName}.`, 'Display the business name clearly on the website.', url),
    trustSignal('trust-contact-details', contactDetails, 3, 'Phone or email contact details were found.', 'Display a phone number or email address clearly.', url),
    trustSignal('trust-address-area', addressSignals, 2, 'Address or service-area wording was found.', 'Add an address or clearly described service area.', url),
  ];
}
