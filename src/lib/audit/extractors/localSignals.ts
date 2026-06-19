import type { AuditContext, AuditSignal } from '../types.ts';

function localSignal(
  key: string,
  found: boolean,
  maxPoints: number,
  label: string,
  recommendation: string,
  url?: string,
): AuditSignal {
  return {
    key,
    category: 'local-visibility',
    status: found ? 'found' : 'missing',
    confidence: 0.88,
    points: found ? maxPoints : 0,
    maxPoints,
    evidence: found ? [{ source: 'website', url, label }] : [],
    recommendations: found ? [] : [recommendation],
  };
}

export function extractLocalSignals(context: AuditContext): AuditSignal[] {
  const text = context.combinedText.toLowerCase();
  const html = context.combinedHtml.toLowerCase();
  const target = context.input.targetCountry.toLowerCase();
  const isUk = /united kingdom|great britain|\buk\b/.test(target);
  const countryTerms = isUk ? ['united kingdom', 'great britain', ' uk ', 'england', 'scotland', 'wales', 'northern ireland'] : [target];
  const location = context.input.location?.trim().toLowerCase();
  const phoneSignal = /href=["']tel:|\+44|\b0\d{9,10}\b/i.test(context.combinedHtml);
  const addressSignal = /postaladdress|streetaddress|addresslocality|service area|areas? we (?:serve|cover)|based in/i.test(html);
  const schemaSignal = /"@type"\s*:\s*"(?:localbusiness|organization)"/i.test(context.combinedHtml);

  return [
    localSignal('local-country', countryTerms.some((term) => text.includes(term.trim())), 4, `Target-country wording found for ${context.input.targetCountry}.`, `Mention ${context.input.targetCountry} clearly in service content.`, context.homepage?.finalUrl),
    localSignal('local-location', !location || text.includes(location), 3, location ? `Location found: ${context.input.location}.` : 'No specific city was supplied for verification.', location ? `Mention ${context.input.location} on relevant pages.` : 'Add the primary town, city, or service area.', context.homepage?.finalUrl),
    localSignal('local-wording', /\blocal\b|service area|nearby|areas? we (?:serve|cover)/i.test(text), 2, 'Local service wording was found.', 'Add clear local service-area wording.', context.homepage?.finalUrl),
    localSignal('local-phone', phoneSignal, 2, 'A local phone or contact signal was found.', 'Add a visible local phone/contact signal.', context.homepage?.finalUrl),
    localSignal('local-address', addressSignal, 2, 'Address or service-area details were found.', 'Add an address or named service area.', context.homepage?.finalUrl),
    localSignal('local-schema', schemaSignal, 2, 'LocalBusiness or Organization schema was found.', 'Add LocalBusiness or Organization structured data.', context.homepage?.finalUrl),
  ];
}
