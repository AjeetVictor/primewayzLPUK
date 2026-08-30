/**
 * Canonical URL normalisation for SEO Intelligence page identity.
 * Relative paths resolve to the configured Primewayz UK host only.
 * Foreign hosts are never silently remapped.
 */

import { createHash } from 'node:crypto';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes.ts';

export const SEO_DEFAULT_CANONICAL_HOST = 'uk.primewayz.com';
export const SEO_DEFAULT_CANONICAL_ORIGIN = `https://${SEO_DEFAULT_CANONICAL_HOST}`;

const TRACKING_PARAM_PREFIXES = ['utm_'] as const;
const TRACKING_PARAMS = new Set([
  'gclid',
  'dclid',
  'fbclid',
  'msclkid',
  'mc_cid',
  'mc_eid',
  '_ga',
  '_gl',
]);

const UNSAFE_SCHEMES = new Set([
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'mailto:',
  'tel:',
]);

const STATIC_FILE_EXTENSIONS = new Set([
  '.js',
  '.css',
  '.map',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.pdf',
  '.xml',
  '.txt',
  '.json',
]);

const SERVICE_PATHS = new Set<string>([
  CANONICAL_ROUTES.services,
  CANONICAL_ROUTES.websiteVisibilitySupport,
  CANONICAL_ROUTES.crmAutomationSupport,
  CANONICAL_ROUTES.customAiAgentDevelopment,
  CANONICAL_ROUTES.softwareDevelopmentSubscription,
  CANONICAL_ROUTES.remoteItResources,
  CANONICAL_ROUTES.maintenance,
  CANONICAL_ROUTES.pricing,
  '/professional-services-crm-support-uk',
]);

const TOOL_PATHS = new Set<string>([
  CANONICAL_ROUTES.freeAudit,
  CANONICAL_ROUTES.digitalSystemsReview,
  CANONICAL_ROUTES.digitalSystemsReviewThankYou,
  CANONICAL_ROUTES.sdaasCapacityRequest,
]);

const LEGAL_PATHS = new Set<string>([
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
]);

export type SeoPageType =
  | 'home'
  | 'service'
  | 'blog_index'
  | 'blog_article'
  | 'contact'
  | 'about'
  | 'tool'
  | 'legal'
  | 'admin'
  | 'unknown';

export type SeoUrlNormalisationFailureReason =
  | 'empty'
  | 'unsafe_scheme'
  | 'invalid_url'
  | 'foreign_host'
  | 'credentials_in_url'
  | 'excluded_path';

export type SeoUrlNormalisationOptions = {
  canonicalHost?: string;
  canonicalOrigin?: string;
  trustedHostAliases?: string[];
  /** When true, preserve query string after stripping tracking params. Default true. */
  preserveFunctionalQuery?: boolean;
  /** When true, reject admin/API/asset paths. Default false for normalisation. */
  rejectExcludedPaths?: boolean;
};

export type SeoUrlNormalisationSuccess = {
  ok: true;
  valid: true;
  observedUrl: string;
  canonicalUrl: string;
  canonicalUrlHash: string;
  normalisedUrl: string;
  normalisedUrlHash: string;
  host: string;
  path: string;
  query: string | null;
  removedTrackingParameters: string[];
  wasRelative: boolean;
  wasForeignHost: false;
  isPrimewayzHost: true;
};

export type SeoUrlNormalisationFailure = {
  ok: false;
  valid: false;
  reason: SeoUrlNormalisationFailureReason;
  observedInput: string;
  wasForeignHost?: boolean;
};

export type SeoUrlNormalisationResult =
  | SeoUrlNormalisationSuccess
  | SeoUrlNormalisationFailure;

function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function hashSeoUrl(value: string): string {
  return sha256Hex(value);
}

function readCanonicalHost(options?: SeoUrlNormalisationOptions): string {
  const envHost =
    typeof process !== 'undefined' && process.env?.SEO_CANONICAL_HOST
      ? process.env.SEO_CANONICAL_HOST.trim().toLowerCase()
      : '';
  return (options?.canonicalHost ?? (envHost || SEO_DEFAULT_CANONICAL_HOST)).toLowerCase();
}

function readTrustedHostAliases(
  canonicalHost: string,
  options?: SeoUrlNormalisationOptions,
): Set<string> {
  const aliases = new Set<string>([canonicalHost]);
  const envAliases =
    typeof process !== 'undefined' && process.env?.SEO_CANONICAL_HOST_ALIASES
      ? process.env.SEO_CANONICAL_HOST_ALIASES.split(',')
      : [];
  for (const value of [...(options?.trustedHostAliases ?? []), ...envAliases]) {
    const trimmed = value.trim().toLowerCase();
    if (trimmed) aliases.add(trimmed);
  }
  return aliases;
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

function resolveDotSegments(pathname: string): string {
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  const resolved: string[] = [];
  for (const segment of segments) {
    if (segment === '.') continue;
    if (segment === '..') {
      resolved.pop();
      continue;
    }
    resolved.push(segment);
  }
  return resolved.length > 0 ? `/${resolved.join('/')}` : '/';
}

function normaliseTrailingSlash(pathname: string): string {
  if (pathname === '/' || pathname === '') return '/';
  return pathname.replace(/\/+$/, '') || '/';
}

export function buildSeoCanonicalUrl(path: string, options?: SeoUrlNormalisationOptions): string {
  const host = readCanonicalHost(options);
  const origin = readCanonicalOrigin(host, options);
  const normalisedPath = normaliseTrailingSlash(
    collapseDuplicateSlashes(resolveDotSegments(path.startsWith('/') ? path : `/${path}`)),
  );
  if (normalisedPath === '/') return `${origin}/`;
  return `${origin}${normalisedPath}`;
}

function stripDefaultPort(parsed: URL): void {
  if (
    (parsed.protocol === 'https:' && parsed.port === '443') ||
    (parsed.protocol === 'http:' && parsed.port === '80')
  ) {
    parsed.port = '';
  }
}

function stripTrackingParams(
  url: URL,
  preserveFunctionalQuery: boolean,
): string[] {
  const removed: string[] = [];
  if (!preserveFunctionalQuery) {
    url.searchParams.forEach((_value, key) => removed.push(key));
    url.search = '';
    return removed;
  }

  const kept = new URLSearchParams();
  const sortedKeys = [...url.searchParams.keys()].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );
  for (const key of sortedKeys) {
    if (isTrackingParam(key)) {
      removed.push(key);
      continue;
    }
    for (const value of url.searchParams.getAll(key)) {
      kept.append(key, value);
    }
  }
  url.search = kept.toString() ? `?${kept.toString()}` : '';
  return removed;
}

function prepareInput(
  raw: string,
): { input: string; wasRelative: boolean } | { invalid: true } {
  const trimmed = raw.trim();
  if (!trimmed) return { input: '', wasRelative: false };
  if (!trimmed.startsWith('/') && !/^https?:\/\//i.test(trimmed)) {
    if (/\s/.test(trimmed)) return { invalid: true };
    return { input: `/${trimmed}`, wasRelative: true };
  }
  return { input: trimmed, wasRelative: trimmed.startsWith('/') };
}

export function isSeoPagePathExcluded(path: string): boolean {
  const normalised = normaliseTrailingSlash(collapseDuplicateSlashes(path || '/'));
  const lower = normalised.toLowerCase();

  if (
    lower.startsWith('/admin') ||
    lower.startsWith('/api') ||
    lower.startsWith('/assets') ||
    lower.startsWith('/images') ||
    lower.includes('/oauth/callback')
  ) {
    return true;
  }

  const extensionMatch = lower.match(/(\.[a-z0-9]{1,8})(?:$|\?)/i);
  if (extensionMatch && STATIC_FILE_EXTENSIONS.has(extensionMatch[1])) {
    return true;
  }

  return false;
}

export function classifySeoPagePath(path: string): SeoPageType {
  const normalised = normaliseTrailingSlash(collapseDuplicateSlashes(path || '/'));

  if (isSeoPagePathExcluded(normalised)) {
    if (normalised.toLowerCase().startsWith('/admin')) return 'admin';
    return 'unknown';
  }

  if (normalised === '/') return 'home';
  if (normalised === CANONICAL_ROUTES.contact || normalised === '/contact') return 'contact';
  if (normalised === CANONICAL_ROUTES.about || normalised === '/about') return 'about';
  if (normalised === CANONICAL_ROUTES.blog) return 'blog_index';
  if (/^\/blog\/[^/]+$/i.test(normalised) && !normalised.startsWith('/blog/category/')) {
    return 'blog_article';
  }
  if (SERVICE_PATHS.has(normalised) || normalised.startsWith('/insights/')) return 'service';
  if (TOOL_PATHS.has(normalised) || normalised.startsWith('/web-presence-audit/')) return 'tool';
  if (LEGAL_PATHS.has(normalised)) return 'legal';
  if (normalised.startsWith('/success-stories')) return 'service';
  if (normalised.startsWith('/how-it-works') || normalised.startsWith('/faq')) return 'service';

  return 'unknown';
}

export function normaliseSeoPageUrl(
  input: string,
  options?: SeoUrlNormalisationOptions,
): SeoUrlNormalisationResult {
  const trimmed = typeof input === 'string' ? input.trim() : '';
  const lower = trimmed.toLowerCase();
  for (const scheme of UNSAFE_SCHEMES) {
    if (lower.startsWith(scheme)) {
      return { ok: false, valid: false, reason: 'unsafe_scheme', observedInput: trimmed };
    }
  }

  const prepared = prepareInput(trimmed);
  if ('invalid' in prepared) {
    return { ok: false, valid: false, reason: 'invalid_url', observedInput: trimmed };
  }
  const raw = prepared.input;
  if (!raw) {
    return { ok: false, valid: false, reason: 'empty', observedInput: raw };
  }

  const canonicalHost = readCanonicalHost(options);
  const trustedHosts = readTrustedHostAliases(canonicalHost, options);
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
    return { ok: false, valid: false, reason: 'invalid_url', observedInput: raw };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, valid: false, reason: 'unsafe_scheme', observedInput: raw };
  }

  if (parsed.username || parsed.password) {
    return {
      ok: false,
      valid: false,
      reason: 'credentials_in_url',
      observedInput: raw,
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (!trustedHosts.has(host)) {
    return {
      ok: false,
      valid: false,
      reason: 'foreign_host',
      observedInput: raw,
      wasForeignHost: true,
    };
  }

  parsed.hash = '';
  parsed.username = '';
  parsed.password = '';
  stripDefaultPort(parsed);

  const removedTrackingParameters = stripTrackingParams(parsed, preserveFunctionalQuery);

  const path = normaliseTrailingSlash(
    collapseDuplicateSlashes(resolveDotSegments(parsed.pathname || '/')),
  );

  if (options?.rejectExcludedPaths && isSeoPagePathExcluded(path)) {
    return {
      ok: false,
      valid: false,
      reason: 'excluded_path',
      observedInput: raw,
    };
  }

  const query = parsed.search ? parsed.search.slice(1) : null;
  const canonicalUrl = query
    ? `${buildSeoCanonicalUrl(path, options)}?${query}`
    : buildSeoCanonicalUrl(path, options);

  return {
    ok: true,
    valid: true,
    observedUrl: raw,
    canonicalUrl,
    canonicalUrlHash: sha256Hex(canonicalUrl),
    normalisedUrl: canonicalUrl,
    normalisedUrlHash: sha256Hex(canonicalUrl),
    host: canonicalHost,
    path,
    query,
    removedTrackingParameters,
    wasRelative: prepared.wasRelative,
    wasForeignHost: false,
    isPrimewayzHost: true,
  };
}
