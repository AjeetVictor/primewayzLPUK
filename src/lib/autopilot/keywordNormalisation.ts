/**
 * Deterministic keyword normalisation for Autopilot Phase 2A.
 * Preserves original keyword separately; comparison form is lowercase NFKC.
 * No stemming, singularisation, UK-spelling changes, or semantic rewriting.
 */

export type NormalisedKeyword = {
  original: string;
  normalised: string;
};

/**
 * Trim, collapse internal whitespace, Unicode NFKC, lowercase for comparison.
 */
export function normaliseAutopilotKeyword(raw: unknown): NormalisedKeyword {
  const original = typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
  const trimmed = original.trim().replace(/\s+/g, ' ');
  let unicode = trimmed;
  try {
    unicode = trimmed.normalize('NFKC');
  } catch {
    unicode = trimmed;
  }
  const normalised = unicode.toLocaleLowerCase('en-GB');
  return { original: trimmed, normalised };
}

export function keywordsAreExactDuplicates(a: unknown, b: unknown): boolean {
  const left = normaliseAutopilotKeyword(a).normalised;
  const right = normaliseAutopilotKeyword(b).normalised;
  if (!left || !right) return false;
  return left === right;
}
