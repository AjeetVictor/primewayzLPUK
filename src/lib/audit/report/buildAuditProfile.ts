import { extractAttribute, extractText } from '../crawl/extractText.ts';
import { detectAddressSnippet } from '../extractors/detectAddressSnippet.ts';
import type { AuditContext, WebPresenceAuditReport } from '../types.ts';

type AuditProfile = WebPresenceAuditReport['profile'];

function resolvePublicAssetUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value, baseUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    url.username = '';
    url.password = '';
    url.hash = '';
    return url.toString();
  } catch {
    return undefined;
  }
}

function findIcon(html: string, baseUrl: string): string | undefined {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const preferredRels = ['icon', 'shortcut icon', 'apple-touch-icon'];

  for (const preferredRel of preferredRels) {
    const match = links.find((tag) => {
      const rel = extractAttribute(tag, 'rel')?.toLowerCase().replace(/\s+/g, ' ');
      return rel === preferredRel;
    });
    const resolved = resolvePublicAssetUrl(match ? extractAttribute(match, 'href') : undefined, baseUrl);
    if (resolved) return resolved;
  }
  return undefined;
}

function findMetaImage(html: string, baseUrl: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  const tag = tags.find((item) => {
    const property = extractAttribute(item, 'property') || extractAttribute(item, 'name');
    return property?.toLowerCase() === 'og:image';
  });
  return resolvePublicAssetUrl(tag ? extractAttribute(tag, 'content') : undefined, baseUrl);
}

function findLogo(html: string, baseUrl: string): string | undefined {
  const images = html.match(/<img\b[^>]*>/gi) || [];
  const logo = images.find((tag) => {
    const hint = [
      extractAttribute(tag, 'alt'),
      extractAttribute(tag, 'class'),
      extractAttribute(tag, 'id'),
      extractAttribute(tag, 'src'),
    ].filter(Boolean).join(' ');
    return /\b(?:brand|logo|logomark)\b/i.test(hint);
  });
  return resolvePublicAssetUrl(logo ? extractAttribute(logo, 'src') : undefined, baseUrl);
}

function detectEmail(html: string): string | undefined {
  const mailto = html.match(/mailto:([^"'?<>\s]+)/i)?.[1];
  const plain = extractText(html).match(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i)?.[0];
  return decodeURIComponent(mailto || plain || '').trim() || undefined;
}

function detectPhone(html: string): string | undefined {
  const tel = html.match(/tel:([^"'?<>\s]+)/i)?.[1];
  const plain = extractText(html).match(/(?:\+44\s?\d|0\d)[\d\s().-]{8,}\d/)?.[0];
  return decodeURIComponent(tel || plain || '').replace(/\s+/g, ' ').trim() || undefined;
}

export function buildAuditProfile(context: AuditContext): AuditProfile {
  const homepage = context.homepage;
  const html = homepage?.html || '';
  const baseUrl = homepage?.finalUrl || context.crawl.auditedUrl;

  return {
    businessName: context.input.businessName,
    websiteUrl: context.crawl.auditedUrl,
    normalizedHost: context.crawl.normalizedHost,
    businessType: context.input.businessType,
    targetCountry: context.input.targetCountry,
    location: context.input.location,
    providedPhone: context.input.phone,
    providedEmail: context.input.email,
    detectedPhone: detectPhone(html),
    detectedEmail: detectEmail(html),
    detectedAddressSnippet: detectAddressSnippet(context),
    faviconUrl: findIcon(html, baseUrl),
    logoUrl: findLogo(html, baseUrl),
    openGraphImage: findMetaImage(html, baseUrl),
    resolvedIp: context.crawl.resolvedIp,
    hostingLocationStatus: 'not_verified',
  };
}
