/**
 * One-time non-PII thank-you conversion marker.
 * Stores only result category (created | duplicate) in sessionStorage.
 * Never stores name, email, company, website, context, submissionId,
 * chatSessionId, or attribution values.
 */

import { FREE_REVIEW_SUCCESS_PENDING_KEY } from '../../constants/digitalSystemsReview.ts';

export type FreeReviewSuccessMarker = 'created' | 'duplicate';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function resolveSessionStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) return storage;
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function isSuccessMarker(value: string | null): value is FreeReviewSuccessMarker {
  return value === 'created' || value === 'duplicate';
}

/**
 * After a successful created/duplicate form response, write only the result
 * category. Failures (blocked storage, quota, etc.) are swallowed so
 * navigation is never blocked.
 */
export function writeFreeReviewSuccessMarker(
  resultCategory: string,
  storage?: StorageLike | null,
): void {
  if (!isSuccessMarker(resultCategory)) return;
  try {
    const store = resolveSessionStorage(storage);
    if (!store) return;
    store.setItem(FREE_REVIEW_SUCCESS_PENDING_KEY, resultCategory);
  } catch {
    // sessionStorage may be blocked; form-submit remains the primary conversion.
  }
}

/**
 * Read and immediately remove the one-time marker.
 * Returns created/duplicate only; otherwise null (direct visit / refresh / bad value).
 */
export function consumeFreeReviewSuccessMarker(
  storage?: StorageLike | null,
): FreeReviewSuccessMarker | null {
  try {
    const store = resolveSessionStorage(storage);
    if (!store) return null;
    const value = store.getItem(FREE_REVIEW_SUCCESS_PENDING_KEY);
    store.removeItem(FREE_REVIEW_SUCCESS_PENDING_KEY);
    return isSuccessMarker(value) ? value : null;
  } catch {
    return null;
  }
}
