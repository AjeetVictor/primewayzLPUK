import { useEffect, useState } from 'react';
import { LiveChat } from './LiveChat';

const CHAT_LOAD_DELAY_MS = 1500;

export function LazyLiveChat() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;
    let idleId: number | undefined;

    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    timeoutId = window.setTimeout(markReady, CHAT_LOAD_DELAY_MS);

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(markReady, { timeout: CHAT_LOAD_DELAY_MS + 1000 });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      if (idleId !== undefined && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, []);

  if (!ready) return null;

  if (import.meta.env.VITE_DISABLE_CHAT === 'true') {
    return null;
  }

  return <LiveChat />;
}
