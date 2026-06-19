const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&([a-z]+);/gi, (match, entity) => ENTITY_MAP[entity.toLowerCase()] || match);
}

export function extractText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractAttribute(tag: string, attribute: string): string | undefined {
  const match = tag.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, 'i'));
  return match?.[1]?.trim();
}

export function extractMetaContent(html: string, name: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const key = extractAttribute(tag, 'name') || extractAttribute(tag, 'property');
    if (key?.toLowerCase() === name.toLowerCase()) {
      return extractAttribute(tag, 'content');
    }
  }
  return undefined;
}

export function extractTitle(html: string): string | undefined {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? extractText(match[1]) : undefined;
}
