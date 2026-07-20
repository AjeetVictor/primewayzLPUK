/**
 * Exact Google Search Console property normalisation and matching.
 * Never silently converts URL-prefix ↔ domain properties.
 */

import { AutopilotError, validationError } from './apiErrors.ts';
import type { GscSiteEntry } from './gscClient.ts';

export const GSC_REQUESTED_SITE_URL_MAX_LENGTH = 512;
export const GSC_EXPECTED_EMAIL_MAX_LENGTH = 320;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_REGEX =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const IPV4_REGEX = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const IPV6_HINT = /:|^\[|\]$/;

export type NormalisedGscOnboardingInput = {
  requestedSiteUrl: string;
  expectedEmail: string;
};

function isIpHostname(hostname: string): boolean {
  if (IPV4_REGEX.test(hostname)) return true;
  if (IPV6_HINT.test(hostname)) return true;
  return false;
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'localhost' ||
    host === 'localhost.' ||
    host.endsWith('.localhost') ||
    host === '0.0.0.0' ||
    host === '::1'
  );
}

function assertValidDomainLabel(domain: string): void {
  if (!domain || !DOMAIN_REGEX.test(domain) || isIpHostname(domain) || isLocalHostname(domain)) {
    throw validationError('Invalid Search Console domain property.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }
}

/**
 * Normalise an administrator-entered GSC property identifier.
 * URL-prefix: HTTPS only, lowercase hostname, trailing slash for root.
 * Domain: sc-domain:<lowercase-domain>.
 */
export function normaliseRequestedGscProperty(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw validationError('requestedSiteUrl is required.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    throw validationError('requestedSiteUrl is required.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }
  if (trimmed.length > GSC_REQUESTED_SITE_URL_MAX_LENGTH) {
    throw validationError('requestedSiteUrl is too long.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }

  const lowerPrefix = trimmed.toLowerCase();
  if (lowerPrefix.startsWith('sc-domain:')) {
    const domain = trimmed.slice('sc-domain:'.length).trim().toLowerCase();
    assertValidDomainLabel(domain);
    return `sc-domain:${domain}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw validationError(
      'requestedSiteUrl must be an HTTPS URL-prefix or sc-domain property.',
      { field: 'requestedSiteUrl', code: 'GSC_PROPERTY_INVALID' },
    );
  }

  if (parsed.protocol === 'http:') {
    throw validationError('HTTP URL-prefix properties are not allowed. Use HTTPS.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }
  if (parsed.protocol !== 'https:') {
    throw validationError('Only HTTPS URL-prefix or sc-domain properties are allowed.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname || isLocalHostname(hostname) || isIpHostname(hostname)) {
    throw validationError('requestedSiteUrl hostname is not allowed.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }
  if (!DOMAIN_REGEX.test(hostname)) {
    throw validationError('requestedSiteUrl hostname is invalid.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }

  if (parsed.username || parsed.password) {
    throw validationError('requestedSiteUrl must not include credentials.', {
      field: 'requestedSiteUrl',
      code: 'GSC_PROPERTY_INVALID',
    });
  }

  // Preserve meaningful path/case; lowercase hostname only.
  let pathname = parsed.pathname || '/';
  if (pathname === '') pathname = '/';
  // Root URL-prefix properties require a trailing slash.
  if (pathname === '/') {
    return `https://${hostname}/`;
  }

  // Preserve path case; do not invent a trailing slash for non-root paths.
  return `https://${hostname}${pathname}`;
}

export function normaliseExpectedGscEmail(raw: unknown): string {
  if (typeof raw !== 'string') {
    throw validationError('expectedEmail is required.', {
      field: 'expectedEmail',
      code: 'GSC_EMAIL_INVALID',
    });
  }
  const email = raw.trim().toLowerCase();
  if (!email) {
    throw validationError('expectedEmail is required.', {
      field: 'expectedEmail',
      code: 'GSC_EMAIL_INVALID',
    });
  }
  if (email.length > GSC_EXPECTED_EMAIL_MAX_LENGTH) {
    throw validationError('expectedEmail is too long.', {
      field: 'expectedEmail',
      code: 'GSC_EMAIL_INVALID',
    });
  }
  if (!EMAIL_REGEX.test(email)) {
    throw validationError('expectedEmail must be a valid email address.', {
      field: 'expectedEmail',
      code: 'GSC_EMAIL_INVALID',
    });
  }
  return email;
}

export function parseGscOnboardingInput(body: {
  requestedSiteUrl?: unknown;
  expectedEmail?: unknown;
}): NormalisedGscOnboardingInput {
  return {
    requestedSiteUrl: normaliseRequestedGscProperty(body.requestedSiteUrl),
    expectedEmail: normaliseExpectedGscEmail(body.expectedEmail),
  };
}

export function emailsMatchCaseInsensitive(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  if (left == null || right == null) return false;
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

/**
 * Exact match only against Google's returned siteUrl identifiers.
 * No parent/child path matching and no URL-prefix ↔ domain conversion.
 */
export function findExactAccessibleGscProperty(
  requestedSiteUrl: string,
  accessibleSites: GscSiteEntry[],
): GscSiteEntry | null {
  const normalised = normaliseRequestedGscProperty(requestedSiteUrl);
  for (const entry of accessibleSites) {
    if (entry.siteUrl === normalised) {
      return entry;
    }
  }
  return null;
}

export function gscPropertyNotAccessibleError(
  requestedSiteUrl: string,
  accessibleSites: GscSiteEntry[],
): AutopilotError {
  return new AutopilotError(
    'GSC_PROPERTY_NOT_ACCESSIBLE',
    'The authorised Google account does not have access to the requested Search Console property.',
    400,
    {
      requestedSiteUrl: normaliseRequestedGscProperty(requestedSiteUrl),
      accessibleProperties: accessibleSites.map((entry) => ({
        siteUrl: entry.siteUrl,
        permissionLevel: entry.permissionLevel,
      })),
    },
  );
}
