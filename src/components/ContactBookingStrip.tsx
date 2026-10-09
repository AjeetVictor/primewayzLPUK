import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { trackConversionEvent } from '../lib/analytics';
import { BOOK_CALL_HASH, isBookCallHash } from '../constants/contactBooking';
import {
  initCalendlyInlineWidget,
  loadCalendlyScript,
  subscribeCalendlyPostMessages,
} from '../lib/calendly';
import {
  bookingContextAnalyticsPayload,
  resolveBookingContext,
} from '../lib/bookingContext';

export function ContactBookingStrip() {
  const location = useLocation();
  const bookingContext = useMemo(
    () => resolveBookingContext(new URLSearchParams(location.search)),
    [location.search],
  );
  const calendarOpenTracked = useRef(false);
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const [isCalendlyLoading, setIsCalendlyLoading] = useState(false);

  useEffect(
    () => subscribeCalendlyPostMessages('contact_calendly_inline', bookingContext),
    [bookingContext],
  );

  useEffect(() => {
    const openFromHash = () => {
      if (!isBookCallHash(window.location.hash)) return;
      if (!calendarOpenTracked.current) {
        calendarOpenTracked.current = true;
        trackConversionEvent('booking_calendar_open', {
          cta_text: 'Open booking calendar',
          cta_location: 'contact_booking_hash',
          ...bookingContextAnalyticsPayload(bookingContext),
        });
      }
      const bookCallSection = document.getElementById(BOOK_CALL_HASH);
      bookCallSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsCalendlyLoading(true);
      setIsCalendlyOpen(true);
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [bookingContext]);

  useEffect(() => {
    if (!isCalendlyOpen) return;

    const mountCalendly = async () => {
      try {
        await loadCalendlyScript();
        const parentElement = document.getElementById('primewayz-calendly-inline');
        if (!parentElement) return;
        initCalendlyInlineWidget(parentElement, 'contact_calendly_inline', bookingContext);
      } catch {
        // Calendly is optional; page remains usable without it.
      } finally {
        setIsCalendlyLoading(false);
      }
    };

    void mountCalendly();
  }, [isCalendlyOpen, bookingContext]);

  const openCalendly = () => {
    trackConversionEvent('booking_calendar_open', {
      cta_text: 'Open booking calendar',
      cta_location: 'contact_booking_strip',
      ...bookingContextAnalyticsPayload(bookingContext),
    });
    calendarOpenTracked.current = true;
    setIsCalendlyLoading(true);
    setIsCalendlyOpen(true);
  };

  return (
    <section id={BOOK_CALL_HASH} className={isCalendlyOpen ? 'mt-8 -mx-6 scroll-mt-28 rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-sm sm:mx-0' : 'mt-8 scroll-mt-28 rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-sm'}>
      <div className="p-4 sm:p-5">
        {!isCalendlyOpen ? (
          <div className="flex flex-col gap-4">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-cyan">Book a call</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                Book a 30-minute UK discovery call
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Prefer to talk through your requirement? Choose a convenient time for a focused,
                no-obligation conversation.
              </p>
            </div>

            <button
              type="button"
              onClick={openCalendly}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-bold text-brand-navy transition hover:bg-brand-surface"
            >
              Open booking calendar
            </button>
          </div>
        ) : (
          <div>
            <div className="mb-4 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-cyan">Book a call</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">
                Book a 30-minute UK discovery call
              </h2>
            </div>

            <div className="relative">
              {isCalendlyLoading ? (
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/95 py-8 text-sm font-medium text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-blue" aria-hidden />
                  Loading calendar…
                </div>
              ) : null}
              <div
                id="primewayz-calendly-inline"
                className="overflow-hidden rounded-xl border border-white/10 bg-white"
                style={{ width: '100%', minWidth: 0, height: '700px' }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
