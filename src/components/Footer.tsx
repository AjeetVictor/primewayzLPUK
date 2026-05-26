import { Linkedin, Phone, Mail } from 'lucide-react';
import { TrackedLink } from './common/TrackedLink';

const productLinks = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Success Stories', href: '#success-stories' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
] as const;

const legalLinks = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
  { label: 'Contact Us', href: '#contact' },
] as const;

export const Footer = () => {
  return (
    <footer className="py-16 bg-zinc-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-1 sm:col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="relative w-8 h-8">
                <svg viewBox="0 0 40 40" className="w-full h-full">
                  <rect x="8" y="8" width="6" height="24" rx="1" fill="#1B59A7" />
                  <path
                    d="M14 10C22 10 28 14 28 20C28 26 22 30 14 30"
                    fill="none"
                    stroke="#E61E50"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <circle cx="21" cy="20" r="3" fill="#E61E50" />
                </svg>
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Primewayz UK</span>
            </div>

            <p className="text-zinc-400 max-w-sm mb-6">
              Subscription-based software delivery for UK businesses — covering websites,
              SEO foundations, CRM integrations, automation, maintenance, and ongoing
              digital improvements.
            </p>

            <div className="space-y-3 mb-8">
              <TrackedLink
                href="tel:+919717132668"
                ctaText="+91 97171 32668"
                ctaLocation="footer_contact"
                eventType="external_link_click"
                className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm"
              >
                <Phone className="w-4 h-4 text-emerald-500" />
                +91 97171 32668
              </TrackedLink>

              <TrackedLink
                href="mailto:info@primewayz.com"
                ctaText="info@primewayz.com"
                ctaLocation="footer_contact"
                eventType="external_link_click"
                className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors text-sm"
              >
                <Mail className="w-4 h-4 text-emerald-500" />
                info@primewayz.com
              </TrackedLink>
            </div>

            <div className="flex items-center gap-4">
              <TrackedLink
                href="https://www.linkedin.com/company/primewayz/mycompany/"
                target="_blank"
                rel="noopener noreferrer"
                ariaLabel="Primewayz on LinkedIn"
                ctaText="LinkedIn"
                ctaLocation="footer_social"
                eventType="external_link_click"
                className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </TrackedLink>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Product</h4>
            <ul className="space-y-4 text-zinc-400">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <TrackedLink
                    href={link.href}
                    ctaText={link.label}
                    ctaLocation="footer_product_navigation"
                    eventType="footer_link_click"
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">Legal</h4>
            <ul className="space-y-4 text-zinc-400">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <TrackedLink
                    href={link.href}
                    ctaText={link.label}
                    ctaLocation="footer_legal_navigation"
                    eventType="footer_link_click"
                    className="hover:text-white transition-colors"
                  >
                    {link.label}
                  </TrackedLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6">UK Focus</h4>
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Region</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Built for UK SMEs that need reliable monthly digital delivery without hiring a full in-house team.
                </p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Delivery</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Websites, CMS improvements, SEO foundations, CRM integrations, automation, and maintenance.
                </p>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Commercial Model</div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Flexible monthly plans, transparent add-ons, and maintenance mode when priorities slow down.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} Primewayz Infotech Pvt. Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
