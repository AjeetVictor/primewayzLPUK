import dns from 'dns/promises';
import net from 'net';
import { AuditInputError } from '../types.ts';

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '127.0.0.1',
  '::1',
  '[::1]',
  'metadata',
  'metadata.google.internal',
]);

function isPrivateIpv4(address: string): boolean {
  const parts = address.split('.').map(Number);
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith('::ffff:')) return true;
  return false;
}

export function isPrivateAddress(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return false;
}

function cleanHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

export async function resolvePublicAddresses(hostname: string): Promise<string[]> {
  const cleanHost = cleanHostname(hostname);
  if (net.isIP(cleanHost)) {
    if (isPrivateAddress(cleanHost)) {
      throw new AuditInputError('Private or internal IP addresses cannot be audited.');
    }
    return [cleanHost];
  }

  let addresses: Array<{ address: string; family: number }>;
  try {
    addresses = await dns.lookup(cleanHost, { all: true, verbatim: true });
  } catch {
    throw new AuditInputError('The website hostname could not be resolved.');
  }

  if (!addresses.length) {
    throw new AuditInputError('The website hostname could not be resolved.');
  }

  if (addresses.some((entry) => isPrivateAddress(entry.address))) {
    throw new AuditInputError('The website resolves to a private or internal network address.');
  }

  return [...new Set(addresses.map((entry) => entry.address))];
}

export async function normalizeAndValidateUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new AuditInputError('Please provide a valid public website URL.');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new AuditInputError('Only http and https website URLs are allowed.');
  }

  parsed.username = '';
  parsed.password = '';
  parsed.hash = '';

  const hostname = cleanHostname(parsed.hostname);
  if (
    !hostname ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.localhost')
  ) {
    throw new AuditInputError('Localhost and internal website addresses cannot be audited.');
  }

  await resolvePublicAddresses(hostname);

  return parsed;
}
