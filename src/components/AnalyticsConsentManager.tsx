import { useEffect, useId, useRef, useState } from 'react';
import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  getAnalyticsConsent,
  OPEN_ANALYTICS_SETTINGS_EVENT,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from '../lib/analyticsConsent';

export function AnalyticsConsentManager() {
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const panelRef = useRef<HTMLElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const syncConsent = () => {
      const current = getAnalyticsConsent();
      setConsent(current);
      setAnalyticsEnabled(current === 'accepted');
    };
    const openSettings = () => {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const current = getAnalyticsConsent();
      setConsent(current);
      setAnalyticsEnabled(current === 'accepted');
      setManageOpen(true);
    };
    syncConsent();
    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncConsent);
    window.addEventListener(OPEN_ANALYTICS_SETTINGS_EVENT, openSettings);
    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncConsent);
      window.removeEventListener(OPEN_ANALYTICS_SETTINGS_EVENT, openSettings);
    };
  }, []);

  const panelVisible = consent === null || manageOpen;

  useEffect(() => {
    if (!panelVisible || !panelRef.current) return;

    const panel = panelRef.current;
    const focusTarget =
      panel.querySelector<HTMLElement>('button, [href], input, select, textarea') ?? panel;
    focusTarget.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && manageOpen) {
        event.preventDefault();
        setManageOpen(false);
        previouslyFocusedRef.current?.focus();
        previouslyFocusedRef.current = null;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [panelVisible, manageOpen]);

  const save = () => {
    setAnalyticsConsent(analyticsEnabled ? 'accepted' : 'rejected');
    setManageOpen(false);
    previouslyFocusedRef.current?.focus();
    previouslyFocusedRef.current = null;
  };

  const rejectAndClose = () => {
    setAnalyticsEnabled(false);
    setAnalyticsConsent('rejected');
    setManageOpen(false);
    previouslyFocusedRef.current?.focus();
    previouslyFocusedRef.current = null;
  };

  // After a valid consent decision, do not keep a floating aside — reopen via footer Cookie settings.
  if (!panelVisible) return null;

  return (
    <aside
      ref={panelRef}
      className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-h-[85vh] max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl sm:inset-x-6 sm:p-5"
      aria-label="Cookie and analytics preferences"
      aria-labelledby={titleId}
      role={manageOpen ? 'dialog' : 'region'}
      aria-modal={manageOpen ? true : undefined}
      tabIndex={-1}
    >
      <div>
        <h2 id={titleId} className="text-base font-bold">
          Your privacy choices
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Optional analytics help us understand how the site and enquiry journey perform. They
          remain off unless you choose to allow them. Enquiries and bookings work either way.
        </p>
        {manageOpen ? (
          <fieldset className="mt-3 rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-sm font-semibold">Manage preferences</legend>
            <label className="flex items-start gap-3 text-sm leading-6">
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={event => setAnalyticsEnabled(event.target.checked)}
                className="mt-1 h-4 w-4 accent-blue-700"
              />
              <span>
                Optional analytics
                <span className="block text-slate-600">
                  Loads Google Analytics 4 and enables measurement events.
                </span>
              </span>
            </label>
          </fieldset>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {manageOpen ? (
            <>
              <button type="button" onClick={save} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                Save preferences
              </button>
              <button type="button" onClick={rejectAndClose} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">
                Reject optional analytics
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setAnalyticsEnabled(true); setAnalyticsConsent('accepted'); }} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                Accept optional analytics
              </button>
              <button type="button" onClick={() => setAnalyticsConsent('rejected')} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">
                Reject optional analytics
              </button>
              <button type="button" onClick={() => setManageOpen(true)} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold">
                Manage preferences
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
