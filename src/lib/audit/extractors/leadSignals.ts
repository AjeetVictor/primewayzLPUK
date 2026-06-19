import type { AuditContext, AuditSignal } from '../types.ts';

function leadSignal(
  key: string,
  found: boolean,
  maxPoints: number,
  label: string,
  recommendation: string,
  url?: string,
): AuditSignal {
  return {
    key,
    category: 'lead-capture',
    status: found ? 'found' : 'missing',
    confidence: 0.92,
    points: found ? maxPoints : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

export function extractLeadSignals(context: AuditContext): AuditSignal[] {
  const html = context.combinedHtml;
  const lower = html.toLowerCase();
  const text = context.combinedText.toLowerCase();
  const url = context.homepage?.finalUrl;
  const formFields = (html.match(/<(?:input|textarea|select)\b/gi) || []).length;
  const bookingCta = /book (?:a )?(?:call|consultation)|schedule|consultation/i.test(text);
  const strongCta = /contact us|get (?:a )?quote|request (?:a )?quote|enquire|inquire|get started|speak to/i.test(text);

  return [
    leadSignal('lead-form', /<form\b/i.test(html) && formFields >= 2, 4, `An enquiry form with ${formFields} fields was found.`, 'Add a simple enquiry form with clear contact fields.', url),
    leadSignal('lead-booking-cta', bookingCta, 3, 'A booking or consultation CTA was found.', 'Add a visible booking or consultation call to action.', url),
    leadSignal('lead-phone-link', /href=["']tel:/i.test(html), 2, 'A clickable phone link was found.', 'Add a clickable telephone link.', url),
    leadSignal('lead-email-link', /href=["']mailto:/i.test(html), 2, 'A clickable email link was found.', 'Add a clickable email link.', url),
    leadSignal('lead-chat-link', /wa\.me|whatsapp|t\.me|telegram|livechat|intercom|chat/i.test(lower), 2, 'A chat or messaging contact option was found.', 'Consider adding a chat or messaging contact option.', url),
    leadSignal('lead-strong-cta', strongCta, 2, 'Strong enquiry-focused CTA wording was found.', 'Add a clear contact, quote, or enquiry CTA.', url),
  ];
}
