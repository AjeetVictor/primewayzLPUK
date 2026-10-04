/**
 * Visitor storage for the embedded chat. Every access is guarded because
 * storage can throw (privacy modes, quota, sandboxed frames).
 *
 * Long-lived identity (session id, captured name/email) uses localStorage;
 * per-tab UI state (panel open, open tracked, first landing page) uses sessionStorage.
 */

import type { PwChatStorageKeys } from './config.ts';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function resolveStorage(win: Window, kind: 'localStorage' | 'sessionStorage'): StorageLike | null {
  try {
    return win[kind] ?? null;
  } catch {
    return null;
  }
}

function safeGet(storage: StorageLike | null, key: string): string | null {
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: StorageLike | null, key: string, value: string): void {
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // Storage unavailable: the widget keeps working with in-memory state.
  }
}

export type PwChatStorage = ReturnType<typeof createPwChatStorage>;

export function createPwChatStorage(win: Window, keys: PwChatStorageKeys) {
  const local = resolveStorage(win, 'localStorage');
  const session = resolveStorage(win, 'sessionStorage');

  return {
    readSessionId: () => safeGet(local, keys.sessionId),
    writeSessionId: (value: string) => safeSet(local, keys.sessionId, value),
    readVisitorContact: () => ({
      name: safeGet(local, keys.visitorName) ?? '',
      email: safeGet(local, keys.visitorEmail) ?? '',
    }),
    writeVisitorContact: (name: string, email: string) => {
      safeSet(local, keys.visitorName, name);
      safeSet(local, keys.visitorEmail, email);
    },
    readPanelOpen: () => safeGet(session, keys.panelOpen) === 'true',
    writePanelOpen: (open: boolean) => safeSet(session, keys.panelOpen, open ? 'true' : 'false'),
    readOpenTracked: () => safeGet(session, keys.openTracked) === 'true',
    writeOpenTracked: () => safeSet(session, keys.openTracked, 'true'),
    /** Returns the stored first landing page, recording `currentPath` on first call. */
    ensureFirstLanding: (currentPath: string): string => {
      const existing = safeGet(session, keys.firstLanding);
      if (existing) return existing;
      safeSet(session, keys.firstLanding, currentPath);
      return currentPath;
    },
  };
}
