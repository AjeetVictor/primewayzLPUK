import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { disableGA, initGA, trackPageView } from '../lib/analytics';
import { ANALYTICS_CONSENT_CHANGE_EVENT, hasAnalyticsConsent } from '../lib/analyticsConsent';
import { captureUtmParams, getFullUtmAnalyticsPayload } from '../lib/utm';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    captureUtmParams(location.search);
    const path = location.pathname;
    const syncAnalytics = () => {
      if (hasAnalyticsConsent()) {
        initGA();
        trackPageView(path, getFullUtmAnalyticsPayload());
      } else {
        disableGA();
      }
    };
    syncAnalytics();
    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncAnalytics);
    return () => window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncAnalytics);
  }, [location.pathname, location.search]);

  return null;
}
