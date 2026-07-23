import {
  CHAT_SESSION_STORAGE_KEY,
  REVIEW_FIELD_LIMITS,
} from '../../constants/digitalSystemsReview.ts';

/**
 * Existing LiveChat ids are short base36 strings from Math.random().toString(36).
 * Prisma ChatSession also allows UUID-shaped ids. Accept only opaque identifier shapes.
 */
const CHAT_SESSION_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Normalize optional chatSessionId for attribution linkage.
 * Malformed values return undefined (omit) — never reject the whole enquiry.
 */
export function normalizeOptionalChatSessionId(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length < REVIEW_FIELD_LIMITS.chatSessionIdMin) return undefined;
  if (trimmed.length > REVIEW_FIELD_LIMITS.chatSessionIdMax) return undefined;
  if (!CHAT_SESSION_ID_PATTERN.test(trimmed)) return undefined;
  // Reject values that look like emails or paths (PII / navigation leakage).
  if (trimmed.includes('@') || trimmed.includes('/') || trimmed.includes('.')) return undefined;

  return trimmed;
}

/**
 * Safely read the opaque chat session id from localStorage.
 * Does not create a session. Does not read chat name/email keys.
 */
export function readOptionalChatSessionIdFromStorage(
  storage: Pick<Storage, 'getItem'> | null | undefined = typeof window !== 'undefined'
    ? window.localStorage
    : null,
): string | undefined {
  if (!storage) return undefined;

  try {
    const raw = storage.getItem(CHAT_SESSION_STORAGE_KEY);
    return normalizeOptionalChatSessionId(raw);
  } catch {
    return undefined;
  }
}
