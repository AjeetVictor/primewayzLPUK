import { TrackedLink } from './common/TrackedLink';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/primewayz-infotech-logo.svg';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: 'How it Works', href: '/#how-it-works' },
    { name: 'Demo', href: '/#demo' },
    { name: 'Features', href: '/#features' },
    { name: 'Success Stories', href: '/#success-stories' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'Testimonials', href: '/#testimonials' },
    { name: 'FAQ', href: '/#faq' },
  ];

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/90 bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.04)]"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className={SITE_CONTAINER_CLASS}>
        <div className="relative flex min-h-[3.25rem] items-center py-2 sm:min-h-16 sm:py-0">
          <Link
            to="/"
            className="relative z-10 flex min-h-[44px] min-w-0 shrink-0 items-center pr-2"
            aria-label="Primewayz Home"
          >
            <img
              src={logo}
              alt="Primewayz Infotech logo"
              className="h-6 w-auto max-w-[min(11rem,42vw)] object-contain object-left sm:h-7 md:h-8"
            />
          </Link>

          <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-full items-center justify-center lg:flex">
            <div className="pointer-events-auto flex max-h-14 max-w-[min(100%,36rem)] flex-wrap items-center justify-center gap-x-2 gap-y-1 xl:max-w-[min(100%,44rem)] xl:gap-x-5">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="rounded-md px-1.5 py-2 text-[13px] font-medium leading-none text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/40 xl:text-sm"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <TrackedLink
            href="#contact"
            ctaText="Book a call"
            ctaLocation="navbar_desktop"
            eventType="book_call_click"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="hidden min-h-[40px] items-center rounded-md bg-slate-900 px-3 py-2 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 md:inline-flex xl:px-5 xl:text-sm"
          >
            Book a call
          </TrackedLink>
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600/40 lg:hidden"
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
            className="border-t border-slate-100 bg-white lg:hidden"
          >
            <div
              className={`${SITE_CONTAINER_CLASS} max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] pt-1`}
            >
              <div className="flex flex-col gap-0.5 py-2">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="min-h-[44px] rounded-md px-3 py-3 text-[15px] font-medium leading-snug text-slate-700 active:bg-slate-50"
                  >
                    {link.name}
                  </a>
                ))}
                <TrackedLink
                  href="#contact"
                  ctaText="Book a call"
                  ctaLocation="navbar_mobile"
                  eventType="book_call_click"
                  onClick={() => setIsOpen(false)}
                  whileTap={{ scale: 0.99 }}
                  className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-md bg-slate-900 px-4 py-3 text-[15px] font-semibold text-white shadow-md shadow-slate-900/10"
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
