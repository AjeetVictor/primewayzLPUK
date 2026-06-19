import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import {
  captureUtmParams,
  getUtmAnalyticsPayload,
  hasUtmInSearch,
  isWebPresenceAuditCampaign,
  scrollToWebPresenceAuditSection,
  WEB_PRESENCE_AUDIT_SECTION_ALIAS,
  WEB_PRESENCE_AUDIT_SECTION_ID,
} from '../lib/utm';

function shouldScrollToAudit(hash: string): boolean {
  if (!hash) return false;
  const normalized = hash.replace(/^#/, '');
  return normalized === WEB_PRESENCE_AUDIT_SECTION_ID || normalized === WEB_PRESENCE_AUDIT_SECTION_ALIAS;
}

export function CampaignLandingHandler() {
  const location = useLocation();

  useEffect(() => {
    const utm = captureUtmParams(location.search);

    if (hasUtmInSearch(location.search)) {
      trackEvent('campaign_landing', {
        landing_path: location.pathname,
        ...getUtmAnalyticsPayload(utm),
      });
    }

    if (location.pathname !== '/') return;

    const scrollToAudit = shouldScrollToAudit(location.hash) || isWebPresenceAuditCampaign(utm);
    if (!scrollToAudit) return;

    const timer = window.setTimeout(() => {
      scrollToWebPresenceAuditSection();
    }, 200);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search, location.hash]);

  return null;
}
