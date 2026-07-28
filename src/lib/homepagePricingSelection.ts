import {
  HOMEPAGE_SELECTED_PLAN_KEY,
  type HomepagePricingPlanId,
} from '../content/homepagePricingPlans';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function resolveSessionStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    if (typeof window === 'undefined') return null;
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Persist the homepage-selected plan slug for later pricing-page context.
 * Never throws; storage failures must not block navigation.
 */
export function rememberHomepageSelectedPlan(
  planId: HomepagePricingPlanId,
  storage?: StorageLike | null,
): void {
  try {
    const store = resolveSessionStorage(storage);
    if (!store) return;
    store.setItem(HOMEPAGE_SELECTED_PLAN_KEY, planId);
  } catch {
    // sessionStorage may be blocked or unavailable.
  }
}
