import { captureUtmParams, getFirstUtmParams, getLatestUtmParams } from './utm.ts';

const FIRST_LANDING_KEY = 'primewayz_first_landing_page';

const SERVICE_PATH_MAP: Record<string, string> = {
  '/website-visibility-support': 'Website visibility support',
  '/software-development-subscription-uk': 'Software development subscription',
  '/maintenance': 'Website maintenance subscription',
  '/crm-automation-support': 'CRM integration support',
  '/remote-it-resources': 'Remote IT resource augmentation',
  '/website-maintenance-subscription-uk': 'Website maintenance subscription',
  '/crm-integration-support-uk': 'CRM integration support',
  '/remote-it-resource-augmentation': 'Remote IT resource augmentation',
  '/professional-services-crm-support-uk': 'Professional services CRM support',
  '/services': 'Services overview',
  '/success-stories/local-trades-lead-capture': 'Local trades lead capture',
  '/success-stories/professional-services-crm-cleanup': 'Professional services CRM cleanup',
  '/success-stories/ecommerce-store-stability-support': 'Ecommerce store stability',
  '/blog': 'Blog',
  '/': 'Homepage',
};

function detectBrowser(userAgent: string): string {
  if (/Edg\//i.test(userAgent)) return 'Edge';
  if (/Chrome\//i.test(userAgent)) return 'Chrome';
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return 'Safari';
  if (/Firefox\//i.test(userAgent)) return 'Firefox';
  return 'Other';
}

function detectDeviceType(userAgent: string): string {
  if (/iPad|Tablet/i.test(userAgent)) return 'tablet';
  if (/Mobile|Android|iPhone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

export function inferServiceInterest(pathname: string): string | null {
  if (SERVICE_PATH_MAP[pathname]) return SERVICE_PATH_MAP[pathname];
  if (pathname.startsWith('/blog/')) return 'Blog article';
  if (pathname.startsWith('/insights/')) return 'Insights article';
  if (pathname.startsWith('/success-stories/')) return 'Success story';
  return null;
}

export function getFirstLandingPage(): string {
  if (typeof window === 'undefined') return '/';
  const existing = window.sessionStorage.getItem(FIRST_LANDING_KEY);
  if (existing) return existing;
  const landing = window.location.pathname || '/';
  window.sessionStorage.setItem(FIRST_LANDING_KEY, landing);
  return landing;
}

export interface ChatSourcePayload {
  firstLandingPage: string;
  currentPageUrl: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  firstUtmSource: string | null;
  firstUtmMedium: string | null;
  firstUtmCampaign: string | null;
  firstUtmContent: string | null;
  firstUtmTerm: string | null;
  latestUtmSource: string | null;
  latestUtmMedium: string | null;
  latestUtmCampaign: string | null;
  latestUtmContent: string | null;
  latestUtmTerm: string | null;
  deviceType: string;
  browser: string;
  serviceInterest: string | null;
}

export function getChatSourcePayload(): ChatSourcePayload {
  if (typeof window === 'undefined') {
    return {
      firstLandingPage: '/',
      currentPageUrl: '/',
      referrer: null,
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      firstUtmSource: null,
      firstUtmMedium: null,
      firstUtmCampaign: null,
      firstUtmContent: null,
      firstUtmTerm: null,
      latestUtmSource: null,
      latestUtmMedium: null,
      latestUtmCampaign: null,
      latestUtmContent: null,
      latestUtmTerm: null,
      deviceType: 'unknown',
      browser: 'unknown',
      serviceInterest: null,
    };
  }

  const pathname = window.location.pathname || '/';
  const userAgent = navigator.userAgent || '';
  const utm = captureUtmParams(window.location.search);
  const firstUtm = getFirstUtmParams();
  const latestUtm = getLatestUtmParams();

  return {
    firstLandingPage: getFirstLandingPage(),
    currentPageUrl: window.location.href,
    referrer: document.referrer || null,
    utmSource: utm.utm_source,
    utmMedium: utm.utm_medium,
    utmCampaign: utm.utm_campaign,
    utmContent: utm.utm_content,
    utmTerm: utm.utm_term,
    firstUtmSource: firstUtm.utm_source,
    firstUtmMedium: firstUtm.utm_medium,
    firstUtmCampaign: firstUtm.utm_campaign,
    firstUtmContent: firstUtm.utm_content,
    firstUtmTerm: firstUtm.utm_term,
    latestUtmSource: latestUtm.utm_source,
    latestUtmMedium: latestUtm.utm_medium,
    latestUtmCampaign: latestUtm.utm_campaign,
    latestUtmContent: latestUtm.utm_content,
    latestUtmTerm: latestUtm.utm_term,
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    serviceInterest: inferServiceInterest(pathname),
  };
}
