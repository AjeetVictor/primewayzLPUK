import {
  validateOwnedCampaignUtm,
  type OwnedCampaignUtmInput,
  type OwnedCampaignUtmValidationError,
} from './campaignDictionary.ts';

export class OwnedCampaignUrlError extends Error {
  readonly errors: OwnedCampaignUtmValidationError[];

  constructor(errors: OwnedCampaignUtmValidationError[]) {
    super(errors.map((error) => `${error.field}: ${error.message}`).join('; '));
    this.name = 'OwnedCampaignUrlError';
    this.errors = errors;
  }
}

export function buildOwnedCampaignUrl(
  destination: string,
  utm: OwnedCampaignUtmInput,
): string {
  const validation = validateOwnedCampaignUtm(utm);
  if (!validation.valid) {
    throw new OwnedCampaignUrlError(validation.errors);
  }

  const hashIndex = destination.indexOf('#');
  const hash = hashIndex >= 0 ? destination.slice(hashIndex) : '';
  const pathWithoutHash = hashIndex >= 0 ? destination.slice(0, hashIndex) : destination;
  const questionMarkIndex = pathWithoutHash.indexOf('?');
  const basePath = questionMarkIndex >= 0 ? pathWithoutHash.slice(0, questionMarkIndex) : pathWithoutHash;
  const existingQuery = questionMarkIndex >= 0 ? pathWithoutHash.slice(questionMarkIndex + 1) : '';
  const params = new URLSearchParams(existingQuery || '');

  params.set('utm_source', utm.utm_source);
  params.set('utm_medium', utm.utm_medium);
  params.set('utm_campaign', utm.utm_campaign);
  params.set('utm_content', utm.utm_content);

  if (utm.utm_term) {
    params.set('utm_term', utm.utm_term);
  } else {
    params.delete('utm_term');
  }

  return `${basePath}?${params.toString()}${hash}`;
}
