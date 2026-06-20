import { isValidPublicToken } from './publicToken.ts';

export function extractPublicTokenFromShareUrl(shareUrl: string): string | null {
  if (!shareUrl || typeof shareUrl !== 'string') return null;

  try {
    const url = new URL(shareUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    const token = segments[segments.length - 1];
    return token && isValidPublicToken(token) ? token : null;
  } catch {
    const match = shareUrl.match(/\/web-presence-audit\/report\/(rpt_[A-Za-z0-9_-]{20,128})/);
    const token = match?.[1];
    return token && isValidPublicToken(token) ? token : null;
  }
}

export function resolvePublicToken(input: {
  publicToken?: unknown;
  shareUrl?: unknown;
}): string | null {
  if (typeof input.publicToken === 'string' && isValidPublicToken(input.publicToken)) {
    return input.publicToken;
  }

  if (typeof input.shareUrl === 'string') {
    return extractPublicTokenFromShareUrl(input.shareUrl);
  }

  return null;
}
