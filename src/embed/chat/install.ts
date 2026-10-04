/**
 * One-time installer for the embedded chat. Safe to call repeatedly (for
 * example when the script is enqueued twice): only the first call boots.
 */

import type { VisitorChatAnalyticsSink } from '../../lib/chat/visitorChatAnalyticsCore.ts';
import type { PwChatFetch } from './apiClient.ts';
import { readPwChatConfig } from './config.ts';
import { PW_CHAT_EMBED_VERSION } from './version.ts';
import { startPwChatWidget, type PwChatWidgetDeps, type PwChatWidgetHandle } from './widget.ts';

const INSTALL_FLAG = '__primewayzChatEmbedInstalled';

export type PrimewayzChatPublicApi = Readonly<{
  version: string;
  open: () => void;
  close: () => void;
}>;

export type InstallOverrides = {
  fetchImpl?: PwChatFetch;
  analyticsSink?: VisitorChatAnalyticsSink;
  timers?: PwChatWidgetDeps['timers'];
  randomSource?: PwChatWidgetDeps['randomSource'];
};

type InstallableWindow = Window & typeof globalThis & {
  [INSTALL_FLAG]?: boolean;
  PrimewayzChat?: PrimewayzChatPublicApi;
};

/** Returns the boot promise, or null when the widget was already installed on this page. */
export function installPrimewayzChat(
  win: Window & typeof globalThis,
  overrides: InstallOverrides = {},
): Promise<PwChatWidgetHandle | null> | null {
  const target = win as InstallableWindow;
  if (target[INSTALL_FLAG]) return null;
  target[INSTALL_FLAG] = true;

  let handle: PwChatWidgetHandle | null = null;
  let pendingOpen = false;

  const publicApi: PrimewayzChatPublicApi = Object.freeze({
    version: PW_CHAT_EMBED_VERSION,
    open: () => {
      if (handle) handle.open();
      else pendingOpen = true;
    },
    close: () => {
      pendingOpen = false;
      handle?.close();
    },
  });
  try {
    Object.defineProperty(target, 'PrimewayzChat', { value: publicApi, configurable: true });
  } catch {
    // A host script already owns the name; the widget still boots.
  }

  const boot = async (): Promise<PwChatWidgetHandle | null> => {
    try {
      const doc = win.document;
      const config = readPwChatConfig(doc);
      if (!config || !doc.body) return null;
      if (typeof win.HTMLElement?.prototype.attachShadow !== 'function') return null;
      const fetchImpl = overrides.fetchImpl
        ?? (typeof win.fetch === 'function' ? win.fetch.bind(win) : null);
      if (!fetchImpl) return null;
      handle = await startPwChatWidget({
        win,
        config,
        fetchImpl,
        analyticsSink: overrides.analyticsSink,
        timers: overrides.timers,
        randomSource: overrides.randomSource,
      });
      if (handle && pendingOpen) handle.open();
      return handle;
    } catch {
      return null;
    }
  };

  if (win.document.readyState === 'loading') {
    return new Promise((resolve) => {
      win.document.addEventListener('DOMContentLoaded', () => { void boot().then(resolve); }, { once: true });
    });
  }
  return boot();
}
