import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from '../lib/analytics';
import { captureUtmParams, getFullUtmAnalyticsPayload } from '../lib/utm';

export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    captureUtmParams(location.search);
    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path, getFullUtmAnalyticsPayload());
  }, [location.pathname, location.search, location.hash]);

  return null;
}
