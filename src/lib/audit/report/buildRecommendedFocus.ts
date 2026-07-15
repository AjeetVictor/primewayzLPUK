import type { AuditCheck, AuditCheckStatus } from '../types.ts';

/**
 * Category-level priority items for the report "Recommended focus" section.
 *
 * Related recommendations stay grouped under one category/finding so a single
 * weak category cannot occupy several top-priority slots.
 */
export type RecommendedFocusItem = {
  categoryId: string;
  categoryTitle: string;
  problem: string;
  whyItMatters: string;
  recommendedActions: string[];
  score: number;
  maxScore: number;
  status: AuditCheckStatus | string;
  severity?: string;
  evidence?: string[];
  label: string;
};

export type RecommendedFocusWhyItMatters = Record<string, { whyItMatters: string }>;

type LegacyFlatPriority = {
  label?: string;
  title?: string;
  explanation?: string;
  whyItMatters?: string;
  recommendedAction?: string;
  recommendedActions?: string[];
  categoryId?: string;
  categoryTitle?: string;
  problem?: string;
  score?: number;
  maxScore?: number;
  status?: string;
  severity?: string;
  evidence?: string[];
};

function safeStatus(status?: string): AuditCheckStatus {
  if (status === 'good' || status === 'partial' || status === 'gap' || status === 'not_verified') {
    return status;
  }
  return 'not_verified';
}

function priorityScore(check: Partial<AuditCheck>): number {
  const maxPoints = Number(check.maxPoints) || 0;
  const points = Number(check.points) || 0;
  const ratio = maxPoints > 0 ? points / maxPoints : 1;
  // Lower completion = higher priority. Gaps rank above partial/not_verified.
  const status = safeStatus(check.status);
  const statusBoost = status === 'gap' ? 30 : status === 'partial' ? 15 : status === 'not_verified' ? 5 : 0;
  return Math.round((1 - ratio) * 100) + statusBoost;
}

function severityForStatus(status: AuditCheckStatus): string {
  if (status === 'gap') return 'high';
  if (status === 'partial') return 'medium';
  if (status === 'not_verified') return 'review';
  return 'low';
}

function uniqueActions(actions: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const action of actions) {
    const trimmed = action.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function checkToFocusItem(
  check: Partial<AuditCheck>,
  whyItMattersMap: RecommendedFocusWhyItMatters,
): RecommendedFocusItem | null {
  const categoryId = typeof check.id === 'string' && check.id ? check.id : '';
  if (!categoryId) return null;

  const status = safeStatus(check.status);
  const actions = uniqueActions(check.recommendations || []);
  if (actions.length === 0 && status === 'good') return null;

  return {
    categoryId,
    categoryTitle: check.name || 'Priority website improvement',
    problem: check.explanation || 'This area showed a gap or partial signal in the public audit.',
    whyItMatters:
      whyItMattersMap[categoryId]?.whyItMatters
      || 'Weak public signals can make it harder for visitors and search systems to understand the site.',
    recommendedActions: actions.length
      ? actions
      : ['Review this category and close the highest-impact public-signal gaps.'],
    score: Number(check.points) || 0,
    maxScore: Number(check.maxPoints) || 0,
    status,
    severity: severityForStatus(status),
    evidence: Array.isArray(check.evidence)
      ? check.evidence.map((item) => item.label).filter(Boolean).slice(0, 5)
      : [],
    label: '',
  };
}

/**
 * Final safeguard: keep only one recommended-focus card per stable category/finding id.
 * Prefer the item with more actions and the weaker completion ratio.
 */
export function dedupeRecommendedFocus(items: RecommendedFocusItem[]): RecommendedFocusItem[] {
  const byId = new Map<string, RecommendedFocusItem>();

  for (const item of items) {
    const key = (item.categoryId || item.categoryTitle).toLowerCase();
    if (!key) continue;

    const existing = byId.get(key);
    if (!existing) {
      byId.set(key, {
        ...item,
        recommendedActions: uniqueActions(item.recommendedActions),
      });
      continue;
    }

    const existingRatio = existing.maxScore > 0 ? existing.score / existing.maxScore : 1;
    const nextRatio = item.maxScore > 0 ? item.score / item.maxScore : 1;
    const mergedActions = uniqueActions([
      ...existing.recommendedActions,
      ...item.recommendedActions,
    ]);

    const preferNext =
      nextRatio < existingRatio
      || (nextRatio === existingRatio && item.recommendedActions.length > existing.recommendedActions.length);

    byId.set(key, {
      ...(preferNext ? item : existing),
      recommendedActions: mergedActions,
      evidence: [...new Set([...(existing.evidence || []), ...(item.evidence || [])])].slice(0, 5),
    });
  }

  return [...byId.values()];
}

/**
 * Normalise legacy flattened priority records (one card per recommendedAction string)
 * into grouped category-level focus items for older saved reports.
 */
export function normalizeRecommendedFocus(
  items: Array<RecommendedFocusItem | LegacyFlatPriority>,
): RecommendedFocusItem[] {
  const grouped = new Map<string, RecommendedFocusItem>();

  for (const raw of items) {
    const categoryId = String(
      ('categoryId' in raw && raw.categoryId)
      || ('title' in raw && raw.title)
      || ('categoryTitle' in raw && raw.categoryTitle)
      || '',
    ).trim();
    if (!categoryId) continue;

    const key = categoryId.toLowerCase();
    const actions = uniqueActions([
      ...(('recommendedActions' in raw && Array.isArray(raw.recommendedActions)) ? raw.recommendedActions : []),
      ...(('recommendedAction' in raw && typeof raw.recommendedAction === 'string') ? [raw.recommendedAction] : []),
    ]);

    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        categoryId: ('categoryId' in raw && raw.categoryId) ? String(raw.categoryId) : key,
        categoryTitle: String(
          ('categoryTitle' in raw && raw.categoryTitle)
          || ('title' in raw && raw.title)
          || categoryId,
        ),
        problem: String(
          ('problem' in raw && raw.problem)
          || ('explanation' in raw && raw.explanation)
          || 'This area showed a gap or partial signal in the public audit.',
        ),
        whyItMatters: String(
          ('whyItMatters' in raw && raw.whyItMatters)
          || 'Weak public signals can make it harder for visitors and search systems to understand the site.',
        ),
        recommendedActions: actions,
        score: typeof raw.score === 'number' ? raw.score : 0,
        maxScore: typeof raw.maxScore === 'number' ? raw.maxScore : 0,
        status: String(('status' in raw && raw.status) || 'gap'),
        severity: typeof raw.severity === 'string' ? raw.severity : undefined,
        evidence: Array.isArray(raw.evidence) ? raw.evidence.filter((item): item is string => typeof item === 'string') : [],
        label: typeof raw.label === 'string' ? raw.label : '',
      });
      continue;
    }

    existing.recommendedActions = uniqueActions([
      ...existing.recommendedActions,
      ...actions,
    ]);
    if (typeof raw.score === 'number' && typeof raw.maxScore === 'number') {
      const existingRatio = existing.maxScore > 0 ? existing.score / existing.maxScore : 1;
      const nextRatio = raw.maxScore > 0 ? raw.score / raw.maxScore : 1;
      if (nextRatio < existingRatio) {
        existing.score = raw.score;
        existing.maxScore = raw.maxScore;
      }
    }
  }

  return dedupeRecommendedFocus([...grouped.values()]);
}

/**
 * Select up to three distinct category-level priorities.
 * Prefer fewer genuine findings over manufacturing duplicate cards from one category.
 */
export function buildRecommendedFocus(
  checks: Partial<AuditCheck>[],
  whyItMattersMap: RecommendedFocusWhyItMatters = {},
): RecommendedFocusItem[] {
  const weak = checks
    .filter((check) => {
      const status = safeStatus(check.status);
      // Exclude good categories. Keep not_verified out of the primary focus
      // unless we later need spare slots — prefer actionable gap/partial findings.
      return status === 'gap' || status === 'partial';
    })
    .map((check) => checkToFocusItem(check, whyItMattersMap))
    .filter((item): item is RecommendedFocusItem => Boolean(item))
    .sort((a, b) => {
      // Weaker completion first; then prefer gap over partial/not_verified.
      const aRatio = a.maxScore > 0 ? a.score / a.maxScore : 1;
      const bRatio = b.maxScore > 0 ? b.score / b.maxScore : 1;
      if (aRatio !== bRatio) return aRatio - bRatio;
      return priorityScore({
        id: b.categoryId as AuditCheck['id'],
        points: b.score,
        maxPoints: b.maxScore,
        status: b.status as AuditCheckStatus,
      }) - priorityScore({
        id: a.categoryId as AuditCheck['id'],
        points: a.score,
        maxPoints: a.maxScore,
        status: a.status as AuditCheckStatus,
      });
    });

  // First pass: one card per categoryId only.
  const unique: RecommendedFocusItem[] = [];
  const usedCategoryIds = new Set<string>();

  for (const item of weak) {
    if (usedCategoryIds.has(item.categoryId)) continue;
    unique.push(item);
    usedCategoryIds.add(item.categoryId);
    if (unique.length === 3) break;
  }

  // Prefer fewer genuine priorities over padding with invented duplicate/fallback cards.
  const selected = dedupeRecommendedFocus(unique).slice(0, 3);

  return selected.map((item, index) => ({
    ...item,
    label: `Priority ${index + 1}`,
  }));
}
