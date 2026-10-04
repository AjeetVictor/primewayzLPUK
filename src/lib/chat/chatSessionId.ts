/**
 * Visitor chat session identifiers (browser + server safe).
 *
 * The session id is the visitor's bearer credential for reading a conversation,
 * so new sessions must use a high-entropy UUID v4. Legacy short ids that already
 * exist server-side remain valid (see validateExistingOrNewChatSessionId).
 */

export const CHAT_SESSION_ID_INVALID_CODE = 'session_id_invalid';

const STRONG_CHAT_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isStrongChatSessionId(value: unknown): value is string {
  return typeof value === 'string' && STRONG_CHAT_SESSION_ID_PATTERN.test(value);
}

type SecureRandomSource = {
  randomUUID?: () => string;
  getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T;
};

function formatUuidV4(bytes: Uint8Array): string {
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * crypto.randomUUID() requires a secure context (HTTPS / localhost); fall back to
 * crypto.getRandomValues(), which is available in every browser React 19 supports.
 */
export function generateChatSessionId(
  source: SecureRandomSource | undefined = globalThis.crypto as SecureRandomSource | undefined,
): string {
  if (typeof source?.randomUUID === 'function') {
    const id = source.randomUUID();
    if (isStrongChatSessionId(id)) return id.toLowerCase();
  }
  if (typeof source?.getRandomValues === 'function') {
    return formatUuidV4(source.getRandomValues(new Uint8Array(16)));
  }
  throw new Error('Secure random generation is unavailable for chat session ids.');
}

/**
 * Replace a stored id only when the server says it is unknown and too weak to
 * create a new session. Strong ids are never rotated, so recovery cannot loop.
 */
export function shouldReplaceRejectedChatSessionId(
  rejectedSessionId: string,
  status: number,
  body: unknown,
): boolean {
  if (status !== 400) return false;
  if (!body || typeof body !== 'object') return false;
  if ((body as { code?: unknown }).code !== CHAT_SESSION_ID_INVALID_CODE) return false;
  return !isStrongChatSessionId(rejectedSessionId);
}
