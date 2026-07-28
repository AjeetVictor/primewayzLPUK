import {
  getPlanDisplayPrice,
  getPricingPlanBySlug,
  getPricingPolicyVersion,
  isPricingPlanSlug,
  type PricingPlanSlug,
} from '../../data/pricing/helpers';
import { HOMEPAGE_SELECTED_PLAN_KEY } from '../../content/homepagePricingPlans';

export const PRICING_SELECTION_STORAGE_KEY = HOMEPAGE_SELECTED_PLAN_KEY;
export const PRICING_SELECTION_VERSION = 1 as const;

export interface StoredPricingSelectionV1 {
  version: typeof PRICING_SELECTION_VERSION;
  planSlug: PricingPlanSlug;
  planName: string;
  displayedPrice: string;
  billingPeriod: string;
  sourcePage: string;
  sourceSection?: string;
  selectedAt: string;
  /** Price shown at selection time — historical context only. */
  displayedPriceAtSelection?: string;
  pricingPolicyVersion?: string;
}

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

type LegacyJsonSelection = {
  plan_name?: string;
  plan_launch_price?: string;
  plan_price_value?: number;
  currency?: string;
  billing_period?: string;
};

const LEGACY_NAME_TO_SLUG: Record<string, PricingPlanSlug> = {
  'Foundation Sprint': 'foundation-sprint',
  Essential: 'essential',
  Growth: 'growth',
  Scale: 'scale',
  'Maintenance Mode': 'maintenance-mode',
  Enterprise: 'enterprise',
};

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    if (typeof window === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function buildCanonicalSelection(input: {
  planSlug: PricingPlanSlug;
  sourcePage: string;
  sourceSection?: string;
  displayedPriceAtSelection?: string;
}): StoredPricingSelectionV1 {
  const plan = getPricingPlanBySlug(input.planSlug);
  if (!plan) {
    throw new Error(`Unknown plan slug: ${input.planSlug}`);
  }
  return {
    version: PRICING_SELECTION_VERSION,
    planSlug: input.planSlug,
    planName: plan.name,
    displayedPrice: plan.displayedPrice,
    billingPeriod: plan.billingPeriod,
    sourcePage: input.sourcePage,
    sourceSection: input.sourceSection,
    selectedAt: new Date().toISOString(),
    displayedPriceAtSelection: input.displayedPriceAtSelection ?? getPlanDisplayPrice(input.planSlug),
    pricingPolicyVersion: getPricingPolicyVersion(),
  };
}

function parseLegacyJson(raw: string): StoredPricingSelectionV1 | null {
  try {
    const parsed = JSON.parse(raw) as LegacyJsonSelection;
    if (!parsed || typeof parsed !== 'object') return null;

    const slugFromName = parsed.plan_name ? LEGACY_NAME_TO_SLUG[parsed.plan_name] : undefined;
    if (!slugFromName || !isPricingPlanSlug(slugFromName)) return null;

    const plan = getPricingPlanBySlug(slugFromName);
    if (!plan?.active) return null;

    return buildCanonicalSelection({
      planSlug: slugFromName,
      sourcePage: '/pricing',
      sourceSection: 'legacy_json_migration',
      displayedPriceAtSelection: parsed.plan_launch_price,
    });
  } catch {
    return null;
  }
}

function parseCanonicalV1(raw: string): StoredPricingSelectionV1 | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPricingSelectionV1>;
    if (parsed?.version !== 1 || !parsed.planSlug || !isPricingPlanSlug(parsed.planSlug)) {
      return null;
    }
    const plan = getPricingPlanBySlug(parsed.planSlug);
    if (!plan?.active) return null;
    return {
      version: 1,
      planSlug: parsed.planSlug,
      planName: plan.name,
      displayedPrice: plan.displayedPrice,
      billingPeriod: plan.billingPeriod,
      sourcePage: parsed.sourcePage ?? '/pricing',
      sourceSection: parsed.sourceSection,
      selectedAt: parsed.selectedAt ?? new Date().toISOString(),
      displayedPriceAtSelection: parsed.displayedPriceAtSelection,
      pricingPolicyVersion: parsed.pricingPolicyVersion ?? getPricingPolicyVersion(),
    };
  } catch {
    return null;
  }
}

export function parseStoredPricingSelection(raw: string | null | undefined): StoredPricingSelectionV1 | null {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    const canonical = parseCanonicalV1(trimmed);
    if (canonical) return canonical;
    return parseLegacyJson(trimmed);
  }

  if (isPricingPlanSlug(trimmed)) {
    const plan = getPricingPlanBySlug(trimmed);
    if (!plan?.active) return null;
    return buildCanonicalSelection({
      planSlug: trimmed,
      sourcePage: typeof window !== 'undefined' ? window.location.pathname : '/',
      sourceSection: 'legacy_slug_migration',
    });
  }

  return null;
}

export function readStoredPricingSelection(storage?: StorageLike | null): StoredPricingSelectionV1 | null {
  try {
    const store = resolveStorage(storage);
    if (!store) return null;
    return parseStoredPricingSelection(store.getItem(PRICING_SELECTION_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeStoredPricingSelection(
  input: {
    planSlug: PricingPlanSlug;
    sourcePage: string;
    sourceSection?: string;
    displayedPriceAtSelection?: string;
  },
  storage?: StorageLike | null,
): StoredPricingSelectionV1 | null {
  try {
    if (!isPricingPlanSlug(input.planSlug)) return null;
    const plan = getPricingPlanBySlug(input.planSlug);
    if (!plan?.active) return null;

    const store = resolveStorage(storage);
    if (!store) return null;

    const selection = buildCanonicalSelection(input);
    store.setItem(PRICING_SELECTION_STORAGE_KEY, JSON.stringify(selection));
    return selection;
  } catch {
    return null;
  }
}

export function clearStoredPricingSelection(storage?: StorageLike | null): void {
  try {
    const store = resolveStorage(storage);
    store?.removeItem?.(PRICING_SELECTION_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function resolvePricingSelectionFromQuery(
  planParam: string | null | undefined,
  storage?: StorageLike | null,
): {
  selection: StoredPricingSelectionV1 | null;
  source: 'query' | 'session' | 'legacy' | 'none';
  invalidQuery: boolean;
} {
  if (planParam) {
    if (isPricingPlanSlug(planParam)) {
      const plan = getPricingPlanBySlug(planParam);
      if (plan?.active) {
        return {
          selection: buildCanonicalSelection({
            planSlug: planParam,
            sourcePage: '/pricing',
            sourceSection: 'query_param',
          }),
          source: 'query',
          invalidQuery: false,
        };
      }
    }
    return { selection: null, source: 'none', invalidQuery: true };
  }

  const stored = readStoredPricingSelection(storage);
  if (stored) {
    const source = stored.sourceSection?.includes('legacy') ? 'legacy' : 'session';
    return { selection: stored, source, invalidQuery: false };
  }

  return { selection: null, source: 'none', invalidQuery: false };
}

/** Analytics-safe output — no arbitrary strings. */
export function toAnalyticsPlanPayload(selection: StoredPricingSelectionV1 | null) {
  if (!selection) return {};
  const plan = getPricingPlanBySlug(selection.planSlug);
  return {
    selected_plan: selection.planSlug,
    displayed_price: plan?.displayedPrice ?? selection.displayedPrice,
    billing_period: plan?.billingPeriod ?? selection.billingPeriod,
    pricing_policy_version: getPricingPolicyVersion(),
  };
}

/** Backward-compatible wrapper for homepage CTA clicks. */
export function rememberHomepageSelectedPlan(
  planSlug: PricingPlanSlug,
  storage?: StorageLike | null,
): void {
  writeStoredPricingSelection(
    {
      planSlug,
      sourcePage: '/',
      sourceSection: 'homepage_pricing',
    },
    storage,
  );
}

export function serializeStoredPricingSelection(selection: StoredPricingSelectionV1): string {
  return JSON.stringify(selection);
}

export function migrateLegacyStorageIfNeeded(storage?: StorageLike | null): StoredPricingSelectionV1 | null {
  try {
    const store = resolveStorage(storage);
    if (!store) return null;
    const raw = store.getItem(PRICING_SELECTION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = parseStoredPricingSelection(raw);
    if (!parsed) {
      store.removeItem?.(PRICING_SELECTION_STORAGE_KEY);
      return null;
    }

    if (!raw.trim().startsWith('{') || !raw.includes('"version"')) {
      store.setItem(PRICING_SELECTION_STORAGE_KEY, serializeStoredPricingSelection(parsed));
    }

    return parsed;
  } catch {
    return null;
  }
}
