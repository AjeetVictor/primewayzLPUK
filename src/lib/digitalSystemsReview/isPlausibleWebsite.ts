import { REVIEW_FIELD_LIMITS } from '../../constants/digitalSystemsReview.ts';

/**
 * Client-side website plausibility check shared by the review form and
 * confirmation-summary storage. Accepts empty optional values; rejects
 * non-http(s) schemes, credentials, and malformed hosts.
 */
export function isPlausibleWebsite(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.length > REVIEW_FIELD_LIMITS.websiteMax) return false;
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  try {
    const parsed = new URL(candidate);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:')
      && !parsed.username
      && !parsed.password
      && parsed.hostname.includes('.')
    );
  } catch {
    return false;
  }
}
