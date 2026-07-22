import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  ChevronRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';
import { COMPANY_TRUST_LINKS } from '../constants/companyTrustLinks';
import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import { AUDIT_CHECKER_PATH } from '../constants/navigation';
import { apiUrl } from '../utils/apiUrl';
import { SelfAuditCta } from './SelfAuditCta';
import { getFirstUtmParams, getLatestUtmParams } from '../lib/utm';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const BODY = '#334155';
const NEWSLETTER_MESSAGE_PREFIX = 'Footer newsletter signup request.';

function compactUtmLabel(label: string, utm: ReturnType<typeof getFirstUtmParams>): string | null {
  const values = [utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content]
    .filter(Boolean)
    .map((value) => String(value).replace(/\s+/g, '-').slice(0, 28));

  return values.length ? `${label}:${values.join('/')}` : null;
}

function buildNewsletterMessage(): string {
  if (typeof window === 'undefined') {
    return `${NEWSLETTER_MESSAGE_PREFIX} Source: footer_newsletter. Type: newsletter.`;
  }

  const pagePath = `${window.location.pathname}${window.location.hash}`.slice(0, 70);
  const firstUtm = compactUtmLabel('First', getFirstUtmParams());
  const latestUtm = compactUtmLabel('Latest', getLatestUtmParams());

  return [
    NEWSLETTER_MESSAGE_PREFIX,
    'Source: footer_newsletter.',
    'Type: newsletter.',
    `Page: ${pagePath || '/'}.`,
    firstUtm,
    latestUtm,
  ].filter(Boolean).join(' ').slice(0, 185);
}

const serviceLinks = [
  { label: 'Website Visibility & Conversion', href: CANONICAL_ROUTES.websiteVisibilitySupport },
  { label: 'CRM & Workflow Automation', href: CANONICAL_ROUTES.crmAutomationSupport },
  { label: 'Software & Product Engineering', href: CANONICAL_ROUTES.softwareDevelopmentSubscription },
  { label: 'Remote IT Team Extension', href: CANONICAL_ROUTES.remoteItResources },
  { label: 'Managed Application & Website Support', href: CANONICAL_ROUTES.maintenance },
] as const;

const companyLinks = [
  { label: 'How it works', href: CANONICAL_ROUTES.howItWorks },
  { label: 'Pricing', href: CANONICAL_ROUTES.pricing },
  { label: 'Success Stories', href: COMPANY_TRUST_LINKS.successStories },
  { label: 'Insights', href: COMPANY_TRUST_LINKS.blog },
  { label: 'Contact', href: COMPANY_TRUST_LINKS.contact },
] as const;

const resourceLinks = [
  { label: 'Free Website Audit', href: AUDIT_CHECKER_PATH, isAudit: true as const },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Privacy Policy', href: COMPANY_TRUST_LINKS.privacyPolicy },
  { label: 'Terms of Service', href: COMPANY_TRUST_LINKS.termsOfService },
  { label: 'Cookies Policy', href: COMPANY_TRUST_LINKS.cookiePolicy },
] as const;

const socialLinks = [
  {
    label: 'LinkedIn',
    href: COMPANY_TRUST_LINKS.linkedin,
    icon: Linkedin,
  },
  {
    label: 'X',
    href: 'https://x.com/primewayz',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/primewayz',
    icon: Facebook,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/primewayz',
    icon: Instagram,
  },
] as const;

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string; isAudit?: true }[];
}) {
  return (
    <div>
      <h4 className="text-base font-bold text-brand-navy">{title}</h4>
      <span className="mt-2 block h-0.5 w-8 rounded-full" style={{ backgroundColor: TEAL }} aria-hidden />
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            {link.isAudit ? (
              <SelfAuditCta
                variant="footer"
                utmContent="footer"
                ctaLocation="footer"
                className="group inline-flex items-center gap-1 text-sm transition hover:gap-2"
              />
            ) : (
              <TrackedLink
                href={link.href}
                ctaText={link.label}
                ctaLocation="footer_navigation"
                eventType="footer_link_click"
                className="group inline-flex items-center gap-1 text-sm text-[#334155] transition hover:gap-2"
              >
                {link.label}
                <ChevronRight
                  className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100"
                  style={{ color: TEAL }}
                  aria-hidden
                />
              </TrackedLink>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleNewsletterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const email = newsletterEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNewsletterStatus('error');
      return;
    }

    setNewsletterStatus('loading');

    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter subscriber',
          email,
          message: buildNewsletterMessage(),
        }),
      });

      if (!response.ok) throw new Error('subscribe failed');

      setNewsletterEmail('');
      setNewsletterStatus('success');
    } catch {
      setNewsletterStatus('error');
    }
  };

  return (
    <footer className="border-t bg-white py-16 md:py-20" style={{ borderColor: BORDER }}>
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <img
              src="/primewayz-infotech-logo.svg"
              alt="Primewayz Infotech Pvt. Ltd."
              className="h-12 w-auto max-w-[200px] object-contain object-left"
              loading="lazy"
              decoding="async"
            />

            <p className="mt-6 max-w-xs text-sm leading-7" style={{ color: BODY }}>
              Primewayz helps UK SMEs improve, connect and support the websites, CRM workflows and
              software systems their businesses depend on.
            </p>

            <div className="mt-6 space-y-3">
              <TrackedLink
                href="tel:+447588741740"
                ctaText="+44 7588 741740"
                ctaLocation="footer_contact"
                eventType="phone_click"
                className="flex items-center gap-3 text-sm text-[#334155] transition hover:opacity-80"
              >
                <Phone className="h-4 w-4 shrink-0" style={{ color: TEAL }} aria-hidden />
                +44 7588 741740
              </TrackedLink>

              <TrackedLink
                href="mailto:info@primewayz.com"
                ctaText="info@primewayz.com"
                ctaLocation="footer_contact"
                eventType="email_click"
                className="flex items-center gap-3 text-sm text-[#334155] transition hover:opacity-80"
              >
                <Mail className="h-4 w-4 shrink-0" style={{ color: TEAL }} aria-hidden />
                info@primewayz.com
              </TrackedLink>

              <p className="flex items-start gap-3 text-sm leading-6" style={{ color: BODY }}>
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} aria-hidden />
                <span>
                  Shelton Street, Covent Garden,
                  <br />
                  London, United Kingdom
                </span>
              </p>
            </div>
          </div>

          <FooterLinkList title="Services" links={serviceLinks} />
          <FooterLinkList title="Company" links={companyLinks} />
          <FooterLinkList title="Resources" links={resourceLinks} />

          <div>
            <h4 className="text-base font-bold text-brand-navy">Stay updated</h4>
            <span className="mt-2 block h-0.5 w-8 rounded-full" style={{ backgroundColor: TEAL }} aria-hidden />
            <p className="mt-5 text-sm leading-6" style={{ color: BODY }}>
              Get practical visibility and delivery insights for UK businesses.
            </p>

            <form className="mt-5 flex gap-2" onSubmit={handleNewsletterSubmit}>
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                value={newsletterEmail}
                onChange={(event) => {
                  setNewsletterEmail(event.target.value);
                  if (newsletterStatus !== 'idle') setNewsletterStatus('idle');
                }}
                placeholder="Enter your email"
                className="min-w-0 flex-1 rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-blue/15"
                style={{ borderColor: BORDER }}
              />
              <button
                type="submit"
                disabled={newsletterStatus === 'loading'}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-white transition hover:bg-brand-navy/90 disabled:opacity-70"
                aria-label="Subscribe to newsletter"
              >
                <ArrowRight className="h-5 w-5" aria-hidden />
              </button>
            </form>

            {newsletterStatus === 'success' ? (
              <p className="mt-2 text-xs text-emerald-700">Thanks — you&apos;re on the list.</p>
            ) : null}
            {newsletterStatus === 'error' ? (
              <p className="mt-2 text-xs text-red-600">Please enter a valid email address.</p>
            ) : null}

            <p className="mt-3 text-xs" style={{ color: BODY }}>
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>

        <div
          className="mt-14 flex flex-col items-center gap-6 border-t pt-8 text-center text-sm sm:flex-row sm:justify-between sm:text-left"
          style={{ borderColor: BORDER, color: BODY }}
        >
          <p>© 2026 Primewayz Infotech Pvt. Ltd. All rights reserved.</p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <TrackedLink
              href={COMPANY_TRUST_LINKS.privacyPolicy}
              ctaText="Privacy Policy"
              ctaLocation="footer_legal"
              eventType="footer_link_click"
              className="hover:text-brand-navy"
            >
              Privacy Policy
            </TrackedLink>
            <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
            <TrackedLink
              href={COMPANY_TRUST_LINKS.termsOfService}
              ctaText="Terms of Service"
              ctaLocation="footer_legal"
              eventType="footer_link_click"
              className="hover:text-brand-navy"
            >
              Terms of Service
            </TrackedLink>
            <span className="hidden h-4 w-px bg-slate-300 sm:block" aria-hidden />
            <TrackedLink
              href={COMPANY_TRUST_LINKS.cookiePolicy}
              ctaText="Cookies Policy"
              ctaLocation="footer_legal"
              eventType="footer_link_click"
              className="hover:text-brand-navy"
            >
              Cookies Policy
            </TrackedLink>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Follow us</span>
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <TrackedLink
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                ariaLabel={`Primewayz on ${label}`}
                ctaText={label}
                ctaLocation="footer_social"
                eventType="external_link_click"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D7E7EC] text-[#087E8B] transition hover:border-brand-navy hover:text-brand-navy"
              >
                <Icon className="h-4 w-4" aria-hidden />
              </TrackedLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
