import { Link } from 'react-router-dom';
import { ArrowRight, Gauge } from 'lucide-react';
import { motion } from 'motion/react';
import { trackEvent } from '../lib/analytics';

export const DigitalVisibilityCheckerPromo = () => {
  const handleClick = () => {
    trackEvent('cta_click', {
      cta_text: 'Check My Website',
      cta_location: 'homepage_visibility_tool',
      tool_name: 'digital_visibility_checker',
    });
  };

  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
                Free Tool for UK SMEs
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Is your website enquiry-ready?
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Check whether your website is clear, discoverable, trustworthy, and ready to generate business enquiries.
              </p>
              <div className="mt-6">
                <Link
                  to="/uk-sme-digital-visibility-checker"
                  onClick={handleClick}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  Check My Website
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center bg-[#000A2D] p-6 sm:p-8"
            >
              <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-white backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Gauge className="h-6 w-6" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                  Digital Visibility Score
                </p>
                <p className="mt-2 text-4xl font-black">72</p>
                <p className="mt-1 text-xs text-slate-300">out of 100</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[72%] rounded-full bg-emerald-400" />
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-300">
                  SEO, trust signals, lead capture, and local visibility — checked in under 60 seconds.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
