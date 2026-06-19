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
  const location = context.input.location?.trim();
  const locationFound = location ? text.includes(location.toLowerCase()) : true;
  const phoneSignal = /href=["']tel:|\+44|\b0\d{9,10}\b/i.test(context.combinedHtml);
  const addressSignal = /postaladdress|streetaddress|addresslocality|service area|areas? we (?:serve|cover)|based in/i.test(html);
  const schemaSignal = /"@type"\s*:\s*"(?:localbusiness|organization)"/i.test(context.combinedHtml);

  return [
    localSignal('local-country', countryTerms.some((term) => text.includes(term.trim())), 4, `Target-country wording detected in the audited pages for ${context.input.targetCountry}.`, `Mention ${context.input.targetCountry} clearly in service content if relevant.`, context.homepage?.finalUrl),
    localSignal(
      'local-location',
      locationFound,
      3,
      location && locationFound
        ? `Location wording detected in the audited pages for ${location}.`
        : location
          ? 'No clear UK city or service-area signal was detected in the audited pages for the supplied location.'
          : 'No specific city was supplied for page-level location checks.',
      location
        ? `Add visible city, region, or service-area wording for ${location} if the business serves that area.`
        : 'Add the primary town, city, or service area to relevant pages if applicable.',
      context.homepage?.finalUrl,
    ),
    localSignal('local-wording', /\blocal\b|service area|nearby|areas? we (?:serve|cover)/i.test(text), 2, 'Local service wording was detected in the audited pages.', 'Add clear local service-area wording to relevant pages if applicable.', context.homepage?.finalUrl),
    localSignal('local-phone', phoneSignal, 2, 'A local phone or contact signal was detected in the audited pages.', 'Add a visible local phone or contact signal if one exists.', context.homepage?.finalUrl),
    localSignal('local-address', addressSignal, 2, 'Address or service-area details were detected in the audited pages.', 'Add a visible address or named service area if applicable.', context.homepage?.finalUrl),
    localSignal('local-schema', schemaSignal, 2, 'LocalBusiness or Organization schema was detected in the audited pages.', 'Add LocalBusiness or Organization structured data if applicable.', context.homepage?.finalUrl),
  ];
}
