/**
 * Canonical URL normalisation for SEO Intelligence page identity.
 * Relative paths resolve to the configured Primewayz UK host only.
 * Foreign hosts are never silently remapped.
 */

import { createHash } from 'node:crypto';

export const SEO_DEFAULT_CANONICAL_HOST = 'uk.primewayz.com';
export const SEO_DEFAULT_CANONICAL_ORIGIN = `https://${SEO_DEFAULT_CANONICAL_HOST}`;

const TRACKING_PARAM_PREFIXES = ['utm_'] as const;
const TRACKING_PARAMS = new Set(['gclid', 'fbclid', 'msclkid', 'mc_cid', 'mc_eid']);

const UNSAFE_SCHEMES = new Set(['javascript:', 'data:', 'vbscript:', 'file:']);

export type SeoUrlNormalisationFailureReason =
  | 'empty'
  | 'unsafe_scheme'
  | 'invalid_url'
  | 'foreign_host';

export type SeoUrlNormalisationResult =
  | {
      ok: true;
      canonicalUrl: string;
      path: string;
      host: string;
      isPrimewayzHost: true;
      canonicalUrlHash: string;
      normalisedUrlHash: string;
    }
  | {
      ok: false;
      reason: SeoUrlNormalisationFailureReason;
      observedInput: string;
    };

export type SeoUrlNormalisationOptions = {
  canonicalHost?: string;
  canonicalOrigin?: string;
  /** When true, preserve query string after stripping tracking params. Default true. */
  preserveFunctionalQuery?: boolean;
};

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function readCanonicalHost(options?: SeoUrlNormalisationOptions): string {
  const envHost =
    typeof process !== 'undefined' && process.env?.SEO_CANONICAL_HOST
      ? process.env.SEO_CANONICAL_HOST.trim().toLowerCase()
      : '';
  return (options?.canonicalHost ?? (envHost || SEO_DEFAULT_CANONICAL_HOST)).toLowerCase();
}

function readCanonicalOrigin(host: string, options?: SeoUrlNormalisationOptions): string {
  if (options?.canonicalOrigin) return options.canonicalOrigin.replace(/\/$/, '');
  const envOrigin =
    typeof process !== 'undefined' && process.env?.SEO_CANONICAL_ORIGIN
      ? process.env.SEO_CANONICAL_ORIGIN.trim()
      : '';
  return (envOrigin || `https://${host}`).replace(/\/$/, '');
}

function isTrackingParam(name: string): boolean {
  const lower = name.toLowerCase();
  if (TRACKING_PARAMS.has(lower)) return true;
  return TRACKING_PARAM_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

function collapseDuplicateSlashes(pathname: string): string {
  if (!pathname) return '/';
  const collapsed = pathname.replace(/\/{2,}/g, '/');
  return collapsed.startsWith('/') ? collapsed : `/${collapsed}`;
}

function normaliseTrailingSlash(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

function buildCanonicalUrl(origin: string, path: string): string {
  if (path === '/') return `${origin}/`;
  return `${origin}${path}`;
}

function stripTrackingParams(url: URL, preserveFunctionalQuery: boolean): void {
  if (!preserveFunctionalQuery) {
    url.search = '';
    return;
  }
  const kept = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (!isTrackingParam(key)) kept.append(key, value);
  });
  url.search = kept.toString() ? `?${kept.toString()}` : '';
}

export function normaliseSeoPageUrl(
  input: string,
  options?: SeoUrlNormalisationOptions,
): SeoUrlNormalisationResult {
  const raw = typeof input === 'string' ? input.trim() : '';
  if (!raw) {
    return { ok: false, reason: 'empty', observedInput: raw };
  }

  const lower = raw.toLowerCase();
  for (const scheme of UNSAFE_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return { ok: false, reason: 'unsafe_scheme', observedInput: raw };
    }
  }

  const canonicalHost = readCanonicalHost(options);
  const canonicalOrigin = readCanonicalOrigin(canonicalHost, options);
  const preserveFunctionalQuery = options?.preserveFunctionalQuery ?? true;

  let parsed: URL;
  try {
    if (raw.startsWith('/')) {
      parsed = new URL(raw, `${canonicalOrigin}/`);
    } else {
      parsed = new URL(raw);
    }
  } catch {
    return { ok: false, reason: 'invalid_url', observedInput: raw };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'unsafe_scheme', observedInput: raw };
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== canonicalHost) {
    return { ok: false, reason: 'foreign_host', observedInput: raw };
  }

  parsed.hash = '';
  parsed.username = '';
  parsed.password = '';
  stripTrackingParams(parsed, preserveFunctionalQuery);

  const path = normaliseTrailingSlash(collapseDuplicateSlashes(parsed.pathname || '/'));
  const query = parsed.search;
  const canonicalUrl = query
    ? `${buildCanonicalUrl(canonicalOrigin, path)}${query}`
    : buildCanonicalUrl(canonicalOrigin, path);

  return {
    ok: true,
    canonicalUrl,
    path,
    host,
    isPrimewayzHost: true,
    canonicalUrlHash: sha256Hex(canonicalUrl),
    normalisedUrlHash: sha256Hex(canonicalUrl),
  };
}

export function hashSeoUrl(value: string): string {
  return sha256Hex(value);
}
