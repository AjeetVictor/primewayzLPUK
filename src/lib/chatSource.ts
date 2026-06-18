const FIRST_LANDING_KEY = 'primewayz_first_landing_page';

const SERVICE_PATH_MAP: Record<string, string> = {
  '/software-development-subscription-uk': 'Software development subscription',
  '/website-maintenance-subscription-uk': 'Website maintenance subscription',
  '/crm-integration-support-uk': 'CRM integration support',
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
      deviceType: 'unknown',
      browser: 'unknown',
      serviceInterest: null,
    };
  }

  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname || '/';
  const userAgent = navigator.userAgent || '';

  return {
    firstLandingPage: getFirstLandingPage(),
    currentPageUrl: window.location.href,
    referrer: document.referrer || null,
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmContent: params.get('utm_content'),
    deviceType: detectDeviceType(userAgent),
    browser: detectBrowser(userAgent),
    serviceInterest: inferServiceInterest(pathname),
  };
}
