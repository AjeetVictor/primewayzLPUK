import type { AuditContext } from '../types.ts';

const SNIPPET_MAX_LENGTH = 220;

const UK_POSTCODE_PATTERN = /\b([A-Z]{1,2}\d[A-Z\d]?\s+\d[A-Z]{2})\b/i;

const STREET_ADDRESS_PATTERN =
  /\b\d{1,4}[A-Z]?\s+[\w'’.-]{2,40}\s+(?:street|st|road|rd|lane|ln|avenue|ave|drive|dr|way|close|court|ct|place|pl|terrace|gardens|grove|hill|crescent|boulevard)\b/i;

const SERVICE_VERB_PATTERN = /\b(?:serving|supporting|helping|we work with|available across)\b/i;

const GEOGRAPHIC_AREA_PATTERN =
  /\b(?:the\s+)?(?:uk|united kingdom|great britain|england|scotland|wales|northern ireland|north west|south east|london|manchester|birmingham|leeds|glasgow|edinburgh|bristol|liverpool|sheffield|[A-Z][a-z]{3,}(?:\s+and\s+[A-Z][a-z]{3,})?)\b/;

const NON_GEOGRAPHIC_ACROSS_PATTERN =
  /\b(?:across|in|throughout)\s+(?:websites?|dashboards?|admin|panels?|crm|workflows?|automati|software|platforms?|tools?|systems?|projects?|teams?)\b/i;

const STRONG_SERVICE_PATTERNS: RegExp[] = [
  /\bserving\s+(?:businesses\s+)?(?:across|in|throughout)\s+[\w\s,'’.-]{3,90}/i,
  /\bserving\s+[A-Z][\w\s,'’.-]{2,70}/i,
  /\bsupporting\s+[\w\s,'’.-]{3,70}/i,
  /\bhelping\s+[\w\s,'’.-]{3,70}/i,
  /\bwe work with\s+[\w\s,'’.-]{3,70}/i,
  /\bavailable across\s+[\w\s,'’.-]{3,70}/i,
  /\bareas?\s+we\s+(?:serve|cover)\b[^.!?]{0,90}/i,
  /\bservice\s+area\b[^.!?]{0,90}/i,
  /\b(?:serving|supporting|helping)\s+[^.!?]{0,40}\buk smes\b[^.!?]{0,60}/i,
  /\buk smes\b[^.!?]{0,40}\b(?:across|in|throughout)\s+(?:the\s+)?(?:uk|united kingdom|great britain|england|scotland|wales|[A-Z][a-z]{3,})/i,
  /\b(?:serving|supporting|helping|available)\s+[^.!?]{0,20}\bbusinesses across\b[^.!?]{0,60}/i,
];

const LEGAL_POLICY_PHRASES = [
  'privacy policy',
  'who interact with',
  'website or contact',
  'this website',
  'users based in',
  'visitors based in',
  'people based in',
  'individuals based in',
  'personal data',
  'data controller',
  'cookies',
  'lawful basis',
  'consent',
  'processing',
];

const FORM_LABEL_TERMS = [
  'name',
  'email',
  'e-mail',
  'phone',
  'mobile',
  'message',
  'whatsapp',
  'optional',
  'submit',
  'contact form',
  'your message',
  'send message',
];

type SchemaAddress = {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
};

function trimSnippet(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, SNIPPET_MAX_LENGTH);
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasAddressParts(address: SchemaAddress): boolean {
  return Boolean(
    address.streetAddress?.trim()
      || address.postalCode?.trim()
      || (address.addressLocality?.trim() && (address.addressRegion?.trim() || address.postalCode?.trim())),
  );
}

function formatSchemaAddress(address: SchemaAddress): string {
  return trimSnippet(
    [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
      address.postalCode,
      address.addressCountry,
    ]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean)
      .join(', '),
  );
}

function collectSchemaNodes(node: unknown, out: Record<string, unknown>[]): void {
  if (!node) return;

  if (Array.isArray(node)) {
    node.forEach((item) => collectSchemaNodes(item, out));
    return;
  }

  if (typeof node !== 'object') return;

  const record = node as Record<string, unknown>;
  out.push(record);

  if (record['@graph']) collectSchemaNodes(record['@graph'], out);
}

function readSchemaAddress(node: Record<string, unknown>): SchemaAddress | undefined {
  const nested = node.address;
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const address = nested as SchemaAddress;
    if (hasAddressParts(address)) return address;
  }

  const direct: SchemaAddress = {
    streetAddress: typeof node.streetAddress === 'string' ? node.streetAddress : undefined,
    addressLocality: typeof node.addressLocality === 'string' ? node.addressLocality : undefined,
    addressRegion: typeof node.addressRegion === 'string' ? node.addressRegion : undefined,
    postalCode: typeof node.postalCode === 'string' ? node.postalCode : undefined,
    addressCountry: typeof node.addressCountry === 'string' ? node.addressCountry : undefined,
  };

  if (hasAddressParts(direct)) return direct;
  return undefined;
}

function extractSchemaAddress(html: string): string | undefined {
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];

  for (const script of scripts) {
    const content = script.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1]?.trim();
    if (!content) continue;

    try {
      const parsed = JSON.parse(content) as unknown;
      const nodes: Record<string, unknown>[] = [];
      collectSchemaNodes(parsed, nodes);

      for (const node of nodes) {
        const address = readSchemaAddress(node);
        if (address) {
          const formatted = formatSchemaAddress(address);
          if (formatted) return formatted;
        }
      }
    } catch {
      // Ignore invalid JSON-LD blocks.
    }
  }

  return undefined;
}

function extractMicrodataAddress(html: string): string | undefined {
  const readItemprop = (prop: string): string | undefined => {
    const contentMatch = html.match(
      new RegExp(`itemprop=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i'),
    )?.[1];
    if (contentMatch?.trim()) return contentMatch.trim();

    const textMatch = html.match(
      new RegExp(`itemprop=["']${prop}["'][^>]*>([^<]+)<`, 'i'),
    )?.[1];
    return textMatch?.trim() || undefined;
  };

  const address = {
    streetAddress: readItemprop('streetAddress'),
    addressLocality: readItemprop('addressLocality'),
    addressRegion: readItemprop('addressRegion'),
    postalCode: readItemprop('postalCode'),
    addressCountry: readItemprop('addressCountry'),
  };

  if (!hasAddressParts(address)) return undefined;
  return formatSchemaAddress(address);
}

function isUkTarget(targetCountry: string): boolean {
  return /united kingdom|great britain|\buk\b/i.test(targetCountry);
}

function countFormLabelTerms(text: string): number {
  const lower = text.toLowerCase();
  return FORM_LABEL_TERMS.reduce((count, term) => (lower.includes(term) ? count + 1 : count), 0);
}

function isFormLabelCluster(text: string): boolean {
  const lower = text.toLowerCase();

  if (countFormLabelTerms(text) >= 2) return true;
  if (/\bname\b/.test(lower) && /\b(?:email|e-mail)\b/.test(lower)) return true;
  if (/\b(?:email|e-mail)\s+address\b/.test(lower) && /\b(?:phone|name|message|whatsapp)\b/.test(lower)) {
    return true;
  }
  if (/\bcontact\s+form\b/.test(lower)) return true;

  return false;
}

function isLegalPolicyOrAudienceText(text: string): boolean {
  const lower = text.toLowerCase();

  if (LEGAL_POLICY_PHRASES.some((phrase) => lower.includes(phrase))) return true;
  if (/\bterms\b/.test(lower)) return true;
  if (/\bpolicy\b/.test(lower)) return true;

  return false;
}

function hasAudienceBasedInContext(text: string): boolean {
  const lower = text.toLowerCase();

  if (/\bwho interact with\b/.test(lower)) return true;
  if (/\b(?:users?|visitors?|people|individuals|customers?|clients?|anyone)\s+(?:who\s+)?based in\b/.test(lower)) {
    return true;
  }
  if (/\bbased in\b[^.!?]{0,80}\bwho interact\b/.test(lower)) return true;

  return false;
}

function hasBusinessBasedInContext(text: string, businessName?: string): boolean {
  if (/\b(?:we(?:\s+are)?|our\s+(?:team|company|business|office))\s+based in\b/i.test(text)) return true;
  if (/\b(?:company|business|firm|agency|team)\s+is\s+based in\b/i.test(text)) return true;
  if (/\b[A-Z][\w&'.-]+(?:\s+[A-Z][\w&'.-]+){0,4}\s+is\s+based in\b/.test(text)) return true;

  if (businessName) {
    const namePattern = escapeRegex(businessName.trim()).replace(/\s+/g, '\\s+');
    if (new RegExp(`\\b${namePattern}\\b[^.!?]{0,40}\\bbased in\\b`, 'i').test(text)) return true;
  }

  return false;
}

function isGenericCountryBasedIn(snippet: string): boolean {
  if (!/\bbased in\s+(?:the\s+)?(?:united kingdom|great britain|uk)\b/i.test(snippet)) return false;
  if (/\bbased in\s+[A-Z][a-z]{3,}/.test(snippet)) return false;
  return true;
}

function hasMeaningfulAddressKeyword(sentence: string): boolean {
  if (/\bemail\s+address\b/i.test(sentence)) return false;
  if (/\bregistered\s+office\b/i.test(sentence)) return true;
  if (/\b(?:postal|street|our|visit\s+us|find\s+us|office)\s+address\b/i.test(sentence)) return true;
  return /\baddress\s*:\s*\S/i.test(sentence);
}

function hasStrongServiceContext(text: string): boolean {
  if (/\b(?:areas?\s+we\s+(?:serve|cover)|service\s+area)\b/i.test(text)) return true;
  if (SERVICE_VERB_PATTERN.test(text) && !NON_GEOGRAPHIC_ACROSS_PATTERN.test(text)) return true;
  if (/\buk smes\b/i.test(text) && GEOGRAPHIC_AREA_PATTERN.test(text) && !NON_GEOGRAPHIC_ACROSS_PATTERN.test(text)) {
    return true;
  }
  if (/\bbusinesses across\b/i.test(text) && GEOGRAPHIC_AREA_PATTERN.test(text)) return true;
  return false;
}

function isWeakServiceSnippet(snippet: string): boolean {
  const lower = snippet.toLowerCase();
  const wordCount = snippet.split(/\s+/).filter(Boolean).length;

  if (/\|/.test(snippet)) return true;
  if (/\bfor\s+uk smes\b/i.test(lower)) return true;
  if (NON_GEOGRAPHIC_ACROSS_PATTERN.test(snippet)) return true;
  if (wordCount < 4 && !/\bbased in\s+[A-Z][a-z]{3,}/i.test(snippet)) return true;

  if (
    /\buk smes\b/i.test(lower)
    && !SERVICE_VERB_PATTERN.test(lower)
    && !GEOGRAPHIC_AREA_PATTERN.test(snippet)
  ) {
    return true;
  }

  if (/\bbusinesses across\b/i.test(lower) && !GEOGRAPHIC_AREA_PATTERN.test(snippet)) return true;

  return false;
}

function acceptSnippet(snippet: string): string | undefined {
  const trimmed = trimSnippet(snippet);
  if (!trimmed) return undefined;
  if (isFormLabelCluster(trimmed)) return undefined;
  if (isLegalPolicyOrAudienceText(trimmed)) return undefined;
  return trimmed;
}

function extractBasedInSnippet(candidate: string, businessName?: string): string | undefined {
  if (!/\bbased in\b/i.test(candidate)) return undefined;
  if (hasAudienceBasedInContext(candidate)) return undefined;
  if (!hasBusinessBasedInContext(candidate, businessName)) return undefined;

  const match = candidate.match(/\bbased in\s+[\w\s,'’.-]{2,80}/i);
  if (!match?.[0]) return undefined;

  const snippet = trimSnippet(match[0]);
  if (isGenericCountryBasedIn(snippet)) return undefined;

  return acceptSnippet(snippet);
}

function extractPostcodeSnippet(text: string, isUk: boolean): string | undefined {
  if (!isUk) return undefined;

  const match = text.match(UK_POSTCODE_PATTERN);
  if (!match || match.index === undefined) return undefined;

  const start = Math.max(0, match.index - 90);
  const end = Math.min(text.length, match.index + match[0].length + 40);
  const snippet = trimSnippet(text.slice(start, end));

  if (!snippet) return undefined;
  if (!STREET_ADDRESS_PATTERN.test(snippet) && !hasMeaningfulAddressKeyword(snippet)) return undefined;

  return acceptSnippet(snippet);
}

function splitTextCandidates(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\s*\|\s*|\s{2,}/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 8);
}

function matchServiceAreaCandidate(candidate: string, businessName?: string): string | undefined {
  if (isLegalPolicyOrAudienceText(candidate) || hasAudienceBasedInContext(candidate)) return undefined;

  if (/\bregistered\s+office\b/i.test(candidate)) {
    const match = candidate.match(/\bregistered\s+office\b[^.!?]{0,120}/i);
    if (match?.[0]) return acceptSnippet(match[0]);
  }

  if (STREET_ADDRESS_PATTERN.test(candidate)) {
    return acceptSnippet(candidate);
  }

  if (hasMeaningfulAddressKeyword(candidate)) {
    return acceptSnippet(candidate);
  }

  for (const pattern of STRONG_SERVICE_PATTERNS) {
    const match = candidate.match(pattern);
    if (match?.[0] && hasStrongServiceContext(match[0])) {
      const accepted = acceptSnippet(match[0]);
      if (accepted && !isWeakServiceSnippet(accepted)) return accepted;
    }
  }

  return extractBasedInSnippet(candidate, businessName);
}

function detectFromText(text: string, isUk: boolean, businessName?: string): string | undefined {
  const postcodeSnippet = extractPostcodeSnippet(text, isUk);
  if (postcodeSnippet) return postcodeSnippet;

  for (const candidate of splitTextCandidates(text)) {
    const match = matchServiceAreaCandidate(candidate, businessName);
    if (match) return match;
  }

  return undefined;
}

export function detectAddressSnippet(context: AuditContext): string | undefined {
  const schemaSnippet = extractSchemaAddress(context.combinedHtml);
  if (schemaSnippet) return acceptSnippet(schemaSnippet);

  const microdataSnippet = extractMicrodataAddress(context.combinedHtml);
  if (microdataSnippet) return acceptSnippet(microdataSnippet);

  const isUk = isUkTarget(context.input.targetCountry);
  return detectFromText(context.combinedText, isUk, context.input.businessName);
}
