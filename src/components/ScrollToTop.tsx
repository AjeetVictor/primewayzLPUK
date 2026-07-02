import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { scrollToAuditSection } from '../lib/audit/auditPageScroll';

export const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      const timeouts = [80, 250, 650].map((delay) => window.setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }, delay));

      return () => {
        timeouts.forEach((timeout) => window.clearTimeout(timeout));
      };
    }

    const scrollToHashTarget = () => {
      const hashId = decodeURIComponent(location.hash.slice(1));
      if (!hashId) return;
      scrollToAuditSection(hashId, 'smooth');
    };

    const timeouts = [80, 250, 650, 1200].map((delay) => window.setTimeout(scrollToHashTarget, delay));

    return () => {
      timeouts.forEach((timeout) => window.clearTimeout(timeout));
    };
  }, [location.pathname, location.hash]);

  return null;
};

export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 z-50 p-4 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-900/40 hover:bg-emerald-500 transition-colors group"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
