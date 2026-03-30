import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Code2, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer" aria-label="Primewayz Home">
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
                {/* Vertical bar of P - Blue */}
                <rect x="8" y="8" width="6" height="24" rx="1" fill="#1B59A7" />
                {/* Curve of P - Pink */}
                <path d="M14 10C22 10 28 14 28 20C28 26 22 30 14 30" fill="none" stroke="#E61E50" strokeWidth="6" strokeLinecap="round" />
                {/* Internal dot/detail */}
                <circle cx="21" cy="20" r="3" fill="#E61E50" />
              </svg>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-bold tracking-tight text-zinc-900 leading-none">Primewayz</span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">Infotech Pvt. Ltd.</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-zinc-600 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-md px-1"
              >
                {link.name}
              </a>
            ))}
            <Link 
              to="/admin"
              className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin
            </Link>
            <motion.a 
              href="#contact"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-zinc-900 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-md shadow-zinc-900/10"
            >
              Get Started
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-zinc-600 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-md"
              aria-expanded={isOpen}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-controls="mobile-menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-zinc-200 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-emerald-600 rounded-md focus:bg-zinc-50"
                >
                  {link.name}
                </a>
              ))}
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-base font-medium text-zinc-600 hover:text-emerald-600 rounded-md focus:bg-zinc-50"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
              <motion.a 
                href="#contact"
                onClick={() => setIsOpen(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 bg-zinc-900 text-white px-5 py-3 rounded-xl text-base font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-lg shadow-zinc-900/10 flex items-center justify-center"
              >
                Get Started
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
