export function normaliseWebsiteUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withoutSpaces = trimmed.replace(/\s+/g, '');
  if (/^https?:\/\//i.test(withoutSpaces)) {
    return withoutSpaces;
  }

  return `https://${withoutSpaces}`;
}

// Backward-compatible alias used across existing code.
export function normalizeWebsiteUrl(value: string): string {
  return normaliseWebsiteUrl(value);
}
