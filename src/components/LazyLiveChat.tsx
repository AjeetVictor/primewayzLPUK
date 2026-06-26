import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isContactPagePath } from '../constants/contactBooking';
import { LiveChat } from './LiveChat';

const CHAT_LOAD_DELAY_MS = 1500;

export function LazyLiveChat() {
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const hideOnContact = isContactPagePath(location.pathname);

  useEffect(() => {
    if (hideOnContact) {
      setReady(false);
      return;
    }

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
  }, [hideOnContact]);

  if (hideOnContact || !ready) return null;

  return <LiveChat />;
}
