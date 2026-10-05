/**
 * Service-provider-owned approximate visitor geolocation.
 *
 * The browser never supplies location authority.
 * Only city / region / country are returned.
 * Raw IP, coordinates, postcode, ASN and ISP are never persisted here.
 *
 * Geo lookup is enrichment only. Failure must never block Chat.
 */

import { createRequire } from 'node:module';
import { isIP } from 'node:net';

const require = createRequire(import.meta.url);

type GeoIpLookup = {
  country?: string;
  region?: string;
  city?: string;
} | null;

type GeoIpModule = {
  lookup(ip: string): GeoIpLookup;
};

const geoip = require('geoip-lite') as GeoIpModule;

export type ApproximateVisitorLocation = {
  city: string | null;
  region: string | null;
  country: string | null;
};

const LOCATION_PART_MAX_LENGTH = 120;

function cleanPart(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/\s+/g, ' ').trim();
  return cleaned ? cleaned.slice(0, LOCATION_PART_MAX_LENGTH) : null;
}

function normaliseIp(value: string | null | undefined): string | null {
  let ip = (value ?? '').trim();

  if (!ip || ip === 'unknown') return null;

  // Express may expose IPv4 through the IPv6 mapped representation.
  if (ip.toLowerCase().startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  return isIP(ip) ? ip : null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (
    ip === '127.0.0.1'
    || ip === '::1'
    || ip === '0.0.0.0'
  ) {
    return true;
  }

  if (/^10\./.test(ip)) return true;
  if (/^192\.168\./.test(ip)) return true;

  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const second = Number(match172[1]);
    if (second >= 16 && second <= 31) return true;
  }

  if (/^169\.254\./.test(ip)) return true;

  // IPv6 local/link-local ranges.
  const lower = ip.toLowerCase();
  if (lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')) {
    return true;
  }

  return false;
}

function countryDisplayName(code: string | null): string | null {
  if (!code) return null;

  try {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    return cleanPart(names.of(code.toUpperCase()));
  } catch {
    return code.toUpperCase();
  }
}

/**
 * Resolve coarse server-side location.
 *
 * Fail-open by design: invalid/private/unmatched IP or provider failure returns null.
 */
export function resolveApproximateVisitorLocation(
  clientIp: string | null | undefined,
): ApproximateVisitorLocation | null {
  const ip = normaliseIp(clientIp);

  if (!ip || isPrivateOrLocalIp(ip)) return null;

  try {
    const match = geoip.lookup(ip);
    if (!match) return null;

    const city = cleanPart(match.city);
    const region = cleanPart(match.region);
    const country = countryDisplayName(cleanPart(match.country));

    if (!city && !region && !country) return null;

    return {
      city,
      region,
      country,
    };
  } catch {
    return null;
  }
}
