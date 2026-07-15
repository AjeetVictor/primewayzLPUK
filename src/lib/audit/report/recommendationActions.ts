import type { AuditCheckStatus } from '../types.ts';

export type ActionImportance = 'important' | 'recommended' | 'optional';

export type RecommendationAction = {
  text: string;
  importance: ActionImportance;
};

export type RecommendationInput =
  | string
  | {
      text?: string;
      importance?: string;
    };

const OPTIONAL_ACTION_PATTERNS = [
  /add meta pixel only when/i,
  /add the linkedin insight tag only when/i,
  /add linkedin insight tag only when/i,
];

/**
 * Status-aware finding panel labels for category cards and detailed checks.
 * Uses AuditCheckStatus values only — do not invent unsupported statuses.
 */
export function getFindingLabel(status?: string): string {
  if (status === 'good') return 'What we found';
  if (status === 'partial' || status === 'not_verified') return 'Area to review';
  return 'Problem observed';
}

export function isOptionalActionText(text: string): boolean {
  return OPTIONAL_ACTION_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Classify a recommendation for display badges.
 * Legacy plain strings default to "recommended" unless a reliable optional/important rule matches.
 */
export function classifyActionImportance(text: string, categoryId?: string): ActionImportance {
  const trimmed = text.trim();
  if (!trimmed) return 'recommended';

  if (isOptionalActionText(trimmed)) return 'optional';

  if (categoryId === 'analytics-readiness') {
    if (/verify that google analytics|enquiry-conversion events are configured/i.test(trimmed)) {
      return 'important';
    }
    if (/cookie consent|consent-mode|consent mode/i.test(trimmed)) {
      return 'important';
    }
    if (/tag manager/i.test(trimmed)) {
      return 'recommended';
    }
  }

  return 'recommended';
}

function coerceImportance(value: unknown): ActionImportance | undefined {
  if (value === 'important' || value === 'recommended' || value === 'optional') {
    return value;
  }
  return undefined;
}

/**
 * Accept legacy string[] recommendations and richer { text, importance } objects.
 * Deduplicate by normalised text while preserving first-seen order.
 */
export function normalizeRecommendationActions(
  recommendations: RecommendationInput[] | undefined,
  categoryId?: string,
): RecommendationAction[] {
  if (!Array.isArray(recommendations) || recommendations.length === 0) return [];

  const seen = new Set<string>();
  const actions: RecommendationAction[] = [];

  for (const raw of recommendations) {
    let text = '';
    let importance: ActionImportance | undefined;

    if (typeof raw === 'string') {
      text = raw.trim();
    } else if (raw && typeof raw === 'object') {
      text = typeof raw.text === 'string' ? raw.text.trim() : '';
      importance = coerceImportance(raw.importance);
    }

    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    actions.push({
      text,
      importance: importance || classifyActionImportance(text, categoryId),
    });
  }

  return actions;
}

export function recommendationActionTexts(actions: RecommendationAction[]): string[] {
  return actions.map((action) => action.text);
}
