import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { trackEvent } from '../lib/analytics';
import { AUDIT_CHECKER_PATH } from '../constants/navigation';
import {
  captureUtmParams,
  getUtmAnalyticsPayload,
  hasUtmInSearch,
  isWebPresenceAuditCampaign,
  WEB_PRESENCE_AUDIT_SECTION_ALIAS,
  WEB_PRESENCE_AUDIT_SECTION_ID,
} from '../lib/utm';

function shouldRouteToAuditPage(hash: string): boolean {
  if (!hash) return false;
  const normalized = hash.replace(/^#/, '');
  return normalized === WEB_PRESENCE_AUDIT_SECTION_ID || normalized === WEB_PRESENCE_AUDIT_SECTION_ALIAS;
}

function buildAuditCheckerRoute(search: string): string {
  return search ? `${AUDIT_CHECKER_PATH}${search}` : AUDIT_CHECKER_PATH;
}

export function CampaignLandingHandler() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === AUDIT_CHECKER_PATH) return;

    const utm = captureUtmParams(location.search);

    if (hasUtmInSearch(location.search)) {
      trackEvent('campaign_landing', {
        landing_path: location.pathname,
        ...getUtmAnalyticsPayload(utm),
      });
    }

    const auditLanding =
      shouldRouteToAuditPage(location.hash) || (location.pathname === '/' && isWebPresenceAuditCampaign(utm));

    if (!auditLanding) return;

    const target = buildAuditCheckerRoute(location.search);
    navigate(target, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  return null;
}
