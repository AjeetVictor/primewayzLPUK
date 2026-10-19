/**
 * Domain ownership proof for a multi-tenant chat origin.
 * Typing an origin into the admin form only issues a challenge.
 * The origin stays unauthorized until DNS TXT or the HTTPS well-known file matches the stored hash.
 */

import { resolveTxt } from 'node:dns/promises';
import { hashVerificationToken, hashesEqual, type OriginVerificationMethod } from './tenantAccountModel.ts';

const WELL_KNOWN_PATH = '/.well-known/primewayz-chat-verification.txt';

export type OriginProbe = (input: {
  origin: string;
  tokenHash: string;
}) => Promise<OriginVerificationMethod | null>;

export function dnsVerificationHost(hostname: string): string {
  return `_primewayz-chat.${hostname}`;
}

function hashMatches(observed: string, tokenHash: string): boolean {
  const candidate = observed.trim();
  if (!candidate || candidate.length > 200) return false;
  return hashesEqual(hashVerificationToken(candidate), tokenHash);
}

/** Production probe. Redirects are not followed. A network failure is not a verification. */
export async function probeOriginOwnership(input: { origin: string; tokenHash: string }): Promise<OriginVerificationMethod | null> {
  let url: URL;
  try {
    url = new URL(input.origin);
  } catch {
    return null;
  }
  try {
    const records = await resolveTxt(dnsVerificationHost(url.hostname));
    if (records.some((parts) => hashMatches(parts.join(''), input.tokenHash))) return 'dns_txt';
  } catch {
    // NXDOMAIN and resolver failures leave the challenge pending.
  }
  const localHttp = url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
  if (url.protocol !== 'https:' && !localHttp) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`${input.origin}${WELL_KNOWN_PATH}`, {
      signal: controller.signal,
      redirect: 'manual',
    });
    if (response.status !== 200) return null;
    const text = await response.text();
    if (hashMatches(text, input.tokenHash)) return 'https_well_known';
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
