import type { AuditContext, AuditSignal } from '../types.ts';

function socialSignal(
  key: string,
  pattern: RegExp,
  maxPoints: number,
  label: string,
  recommendation: string,
  context: AuditContext,
): AuditSignal {
  const match = context.combinedHtml.match(pattern);
  return {
    key,
    category: 'external-presence',
    status: match ? 'found' : 'missing',
    confidence: 0.95,
    points: match ? maxPoints : 0,
    maxPoints,
    evidence: match ? [{ source: 'website', url: context.homepage?.finalUrl, label, snippet: match[0].slice(0, 180) }] : [],
    recommendations: match ? [] : [recommendation],
  };
}

export function extractSocialSignals(context: AuditContext): AuditSignal[] {
  return [
    socialSignal('social-linkedin', /https?:\/\/(?:www\.)?linkedin\.com\/[^"' <]+/i, 2, 'LinkedIn profile link found.', 'Link the website to the business LinkedIn profile.', context),
    socialSignal('social-facebook', /https?:\/\/(?:www\.)?facebook\.com\/[^"' <]+/i, 1, 'Facebook profile link found.', 'Add the active Facebook business profile if relevant.', context),
    socialSignal('social-instagram', /https?:\/\/(?:www\.)?instagram\.com\/[^"' <]+/i, 1, 'Instagram profile link found.', 'Add the active Instagram profile if relevant.', context),
    socialSignal('social-youtube', /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^"' <]+/i, 1, 'YouTube link found.', 'Add the active YouTube channel if relevant.', context),
    socialSignal('social-twitter', /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/[^"' <]+/i, 1, 'X or Twitter profile link found.', 'Add the active X/Twitter profile if relevant.', context),
    socialSignal('social-google-maps', /https?:\/\/[^"' <]*(?:google\.[^/]+\/maps|maps\.app\.goo\.gl)[^"' <]*/i, 2, 'Google Maps or Business Profile link found.', 'Link to the Google Business Profile or map listing.', context),
    socialSignal('social-directory', /https?:\/\/[^"' <]*(?:trustpilot|yell\.com|checkatrade|tripadvisor|reviews\.io|clutch\.co)[^"' <]*/i, 2, 'External directory or review profile found.', 'Link a relevant directory or review profile where customers can verify the business.', context),
  ];
}
