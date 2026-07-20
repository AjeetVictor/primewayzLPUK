/**
 * Transparent lexical tokenisation and Jaccard overlap helpers (Phase 2B).
 * No stemming, embeddings, or hidden similarity scoring.
 */

import {
  AUTOPILOT_LEXICAL_OVERLAP_THRESHOLDS,
  AUTOPILOT_OVERLAP_STOP_WORDS,
} from '../../data/autopilot/researchConfig.ts';
import { normaliseAutopilotKeyword } from './keywordNormalisation.ts';

const STOP_WORD_SET = new Set(
  AUTOPILOT_OVERLAP_STOP_WORDS.map((word) => word.toLocaleLowerCase('en-GB')),
);

/**
 * Lowercase NFKC, collapse whitespace, strip punctuation to spaces,
 * drop stop words. Preserves original separately via callers.
 */
export function tokeniseForOverlap(raw: unknown): string[] {
  const { normalised } = normaliseAutopilotKeyword(raw);
  if (!normalised) return [];

  const withoutPunctuation = normalised.replace(/[^\p{L}\p{N}\s]+/gu, ' ');
  const collapsed = withoutPunctuation.replace(/\s+/g, ' ').trim();
  if (!collapsed) return [];

  const tokens = collapsed
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !STOP_WORD_SET.has(token));

  return tokens;
}

export function uniqueTokens(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

export type JaccardOverlapResult = {
  sharedTokens: string[];
  intersection: number;
  union: number;
  jaccard: number;
  formula: string;
  candidateTokenCount: number;
  existingTokenCount: number;
};

export function calculateJaccardOverlap(
  candidateRaw: unknown,
  existingRaw: unknown,
): JaccardOverlapResult {
  const candidateTokens = uniqueTokens(tokeniseForOverlap(candidateRaw));
  const existingTokens = uniqueTokens(tokeniseForOverlap(existingRaw));
  const candidateSet = new Set(candidateTokens);
  const existingSet = new Set(existingTokens);

  const sharedTokens = candidateTokens.filter((token) => existingSet.has(token));
  const intersection = sharedTokens.length;
  const union = new Set([...candidateSet, ...existingSet]).size;
  const jaccard = union === 0 ? 0 : intersection / union;

  return {
    sharedTokens,
    intersection,
    union,
    jaccard,
    formula: 'intersection / union',
    candidateTokenCount: candidateTokens.length,
    existingTokenCount: existingTokens.length,
  };
}

export type LexicalAdvisoryLevel = 'high' | 'moderate' | null;

export function classifyLexicalOverlap(
  result: JaccardOverlapResult,
): LexicalAdvisoryLevel {
  const { high, moderate } = AUTOPILOT_LEXICAL_OVERLAP_THRESHOLDS;
  if (
    result.jaccard >= high.minJaccard &&
    result.sharedTokens.length >= high.minSharedTokens
  ) {
    return 'high';
  }
  if (
    result.jaccard >= moderate.minJaccard &&
    result.sharedTokens.length >= moderate.minSharedTokens
  ) {
    return 'moderate';
  }
  return null;
}

/** Phrase containment after normalisation — not an exact match. */
export function isPhraseContainment(a: unknown, b: unknown): boolean {
  const left = normaliseAutopilotKeyword(a).normalised;
  const right = normaliseAutopilotKeyword(b).normalised;
  if (!left || !right || left === right) return false;
  return left.includes(right) || right.includes(left);
}

export function phrasesAreExactMatch(a: unknown, b: unknown): boolean {
  const left = normaliseAutopilotKeyword(a).normalised;
  const right = normaliseAutopilotKeyword(b).normalised;
  if (!left || !right) return false;
  return left === right;
}

/** Derive a comparable phrase from a slug (hyphens → spaces). */
export function slugToComparablePhrase(slug: unknown): string {
  const raw = typeof slug === 'string' ? slug : slug == null ? '' : String(slug);
  return normaliseAutopilotKeyword(raw.replace(/[-_/]+/g, ' ')).normalised;
}
