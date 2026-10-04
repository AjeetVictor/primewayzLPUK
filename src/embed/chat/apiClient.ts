/**
 * Browser client for the existing Primewayz UK public chat API.
 * Cross-origin, cookie-less: the backend resolves tenant identity from Origin.
 */

import { shouldReplaceRejectedChatSessionId } from '../../lib/chat/chatSessionId.ts';

/** Server-owned source identity. Never part of a browser payload. */
export const PW_CHAT_FORBIDDEN_PAYLOAD_KEYS = [
  'tenantId',
  'market',
  'sourceSite',
  'sourceOrigin',
  'sourceChannel',
] as const;

const REQUEST_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_AFTER_SECONDS = 30;
const MAX_RETRY_AFTER_SECONDS = 3600;

export type PwChatApiResult = {
  ok: boolean;
  status: number;
  body: unknown;
  code: string | null;
  retryAfterSeconds: number | null;
  networkError: boolean;
};

export type PwChatFetch = (input: string, init: RequestInit) => Promise<Response>;

export function parseRetryAfterSeconds(header: string | null, nowMs: number = Date.now()): number {
  if (header) {
    const trimmed = header.trim();
    if (/^\d+$/.test(trimmed)) {
      return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, Number(trimmed)));
    }
    const dateMs = Date.parse(trimmed);
    if (Number.isFinite(dateMs)) {
      const seconds = Math.ceil((dateMs - nowMs) / 1000);
      return Math.min(MAX_RETRY_AFTER_SECONDS, Math.max(1, seconds));
    }
  }
  return DEFAULT_RETRY_AFTER_SECONDS;
}

export function stripServerOwnedIdentity(body: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...body };
  for (const key of PW_CHAT_FORBIDDEN_PAYLOAD_KEYS) delete copy[key];
  return copy;
}

function readCode(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const code = (body as { code?: unknown }).code;
  return typeof code === 'string' ? code : null;
}

export type PwChatApiClient = ReturnType<typeof createPwChatApiClient>;

export function createPwChatApiClient(options: { apiBaseUrl: string; fetchImpl: PwChatFetch }) {
  const request = async (
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<PwChatApiResult> => {
    const init: RequestInit = {
      method,
      credentials: 'omit',
      cache: 'no-store',
      mode: 'cors',
    };
    if (body) {
      init.headers = { 'Content-Type': 'application/json' };
      init.body = JSON.stringify(stripServerOwnedIdentity(body));
    }

    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;
    if (controller) init.signal = controller.signal;

    try {
      const res = await options.fetchImpl(`${options.apiBaseUrl}${path}`, init);
      const parsed: unknown = await res.json().catch(() => null);
      return {
        ok: res.ok,
        status: res.status,
        body: parsed,
        code: readCode(parsed),
        retryAfterSeconds:
          res.status === 429 ? parseRetryAfterSeconds(res.headers.get('Retry-After')) : null,
        networkError: false,
      };
    } catch {
      return { ok: false, status: 0, body: null, code: null, retryAfterSeconds: null, networkError: true };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  };

  return {
    get: (path: string) => request('GET', path),
    post: (path: string, body: Record<string, unknown>) => request('POST', path, body),
  };
}

export type PwChatSessionHandle = {
  current: () => string;
  /** Replaces a rejected id; returns the new id, or null when rotation is not allowed. */
  rotate: (rejectedId: string) => string | null;
};

/**
 * Sends once; if the server rejects an unknown weak session id, rotates to a new
 * UUID and retries exactly once. Strong ids, 403, 429, 5xx and network errors never rotate.
 */
export async function sendWithSessionRecovery(
  session: PwChatSessionHandle,
  send: (sessionId: string) => Promise<PwChatApiResult>,
): Promise<PwChatApiResult> {
  const firstId = session.current();
  const result = await send(firstId);
  if (!shouldReplaceRejectedChatSessionId(firstId, result.status, result.body)) return result;
  const nextId = session.rotate(firstId);
  return nextId ? send(nextId) : result;
}
