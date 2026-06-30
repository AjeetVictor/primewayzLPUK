import { TrackedLink } from './common/TrackedLink';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Phone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';
import { BOOK_CALL_URL } from '../constants/contactBooking';
import { LOGO_LIGHT_SRC, shellClasses } from '../constants/designSystem';
import { mainNavLinks } from '../constants/navigation';
import { SelfAuditCta } from './SelfAuditCta';
import { ServicesMegaMenu } from './navigation/ServicesMegaMenu';
import { cn } from '../utils/cn';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isNavActive = (href: string, matchPath?: string) => {
    if (matchPath) {
      return location.pathname === matchPath || location.pathname.startsWith(`${matchPath}/`);
    }
    return false;
  };

  return (
    <motion.nav
      initial={false}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={shellClasses.header}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[3.5rem] items-center justify-between gap-4 py-2 sm:min-h-16 sm:py-0">
          <Link
            to="/"
            className="flex min-h-[44px] min-w-0 shrink-0 items-center"
            aria-label="Primewayz UK Home"
          >
            <img
              src={LOGO_LIGHT_SRC}
              alt="Primewayz Infotech Pvt. Ltd. UK"
              className="h-9 w-auto object-contain"
            />
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex max-h-14 min-w-0 items-center justify-center gap-x-1.5 xl:gap-x-2">
              <ServicesMegaMenu variant="desktop" />
              {mainNavLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className={cn(
                    shellClasses.navLink,
                    isNavActive(link.href, link.matchPath) && shellClasses.navLinkActive,
                  )}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="hidden items-center gap-2 lg:flex xl:gap-3">
              <a
                href="tel:+447588741740"
                className="hidden min-h-[40px] items-center gap-2 whitespace-nowrap px-1 text-sm font-semibold text-brand-navy transition hover:text-brand-blue xl:inline-flex"
              >
                <Phone className="h-4 w-4 text-brand-cyan" strokeWidth={2.15} aria-hidden />
                +44 7588 741740
              </a>
              <TrackedLink
                href={BOOK_CALL_URL}
                ctaText="Book a call"
                ctaLocation="navbar_desktop"
                eventType="book_call_click_header"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={shellClasses.btnOutlineAudit}
              >
                Book a call
              </TrackedLink>
              <SelfAuditCta
                variant="nav"
                utmContent="header_nav"
                ctaLocation="header_nav"
                className={shellClasses.btnPrimary}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-brand-ink transition-colors hover:bg-brand-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40 lg:hidden"
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="h-6 w-6" strokeWidth={2} /> : <Menu className="h-6 w-6" strokeWidth={2} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-brand-border bg-white lg:hidden"
          >
            <div
              className={`${SITE_CONTAINER_CLASS} max-h-[min(78vh,calc(100dvh-3.5rem))] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] pt-1`}
            >
              <div className="flex flex-col gap-0.5 py-2">
                <ServicesMegaMenu variant="mobile" onNavigate={() => setIsOpen(false)} />
                {mainNavLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'min-h-[44px] rounded-lg px-3 py-3 text-[15px] font-medium leading-snug text-brand-ink active:bg-brand-surface',
                      isNavActive(link.href, link.matchPath) && 'bg-brand-surface font-semibold text-brand-navy',
                    )}
                  >
                    {link.name}
                  </a>
                ))}
                <SelfAuditCta
                  variant="nav"
                  utmContent="header_nav"
                  ctaLocation="header_nav_mobile"
                  onClick={() => setIsOpen(false)}
                  className={cn(shellClasses.btnOutlineAudit, 'mt-3 w-full')}
                />
                <TrackedLink
                  href={BOOK_CALL_URL}
                  ctaText="Book a call"
                  ctaLocation="navbar_mobile"
                  eventType="book_call_click_header"
                  onClick={() => setIsOpen(false)}
                  whileTap={{ scale: 0.99 }}
                  className={cn(shellClasses.btnPrimary, 'mt-2 w-full')}
                >
                  Book a call
                </TrackedLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
