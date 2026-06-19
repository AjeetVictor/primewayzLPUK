import { ArrowRight, Gauge } from 'lucide-react';
import { motion } from 'motion/react';
import { trackEvent } from '../lib/analytics';
import { getUtmAnalyticsPayload, WEB_PRESENCE_AUDIT_SECTION_ALIAS } from '../lib/utm';

export const DigitalVisibilityCheckerPromo = () => {
  const handleClick = () => {
    trackEvent('cta_click', {
      cta_text: 'Check My Website',
      cta_location: 'homepage_visibility_tool',
      tool_name: 'web_presence_audit',
      ...getUtmAnalyticsPayload(),
    });
  };

  return (
    <section className="border-y border-slate-200 bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="grid lg:grid-cols-[1fr_0.85fr]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-9">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">
                Free UK SME Tool
              </p>
              <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Is your website enquiry-ready?
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Most SME websites are online, but not always clear, discoverable, trusted, or built to convert visitors into enquiries. Run a quick visibility check and get a practical score in under 60 seconds.
              </p>

              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <a
                  href={`#${WEB_PRESENCE_AUDIT_SECTION_ALIAS}`}
                  onClick={handleClick}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#000A2D] px-6 py-3 text-sm font-bold text-white shadow-md shadow-slate-950/10 transition hover:bg-blue-900"
                >
                  Check My Website
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <p className="max-w-sm text-xs leading-5 text-slate-500">
                  Checks SEO basics, trust signals, lead capture, local visibility, and maintenance risk.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center bg-[#000A2D] p-6 sm:p-8"
            >
              <div className="w-full max-w-xs rounded-xl border border-blue-300/20 bg-blue-400/10 p-6 text-center text-white shadow-inner backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                  <Gauge className="h-6 w-6" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
                  Digital Visibility Score
                </p>
                <p className="mt-2 text-4xl font-black">0-100</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-blue-400 to-emerald-400" />
                </div>
                <p className="mt-4 text-xs font-semibold tracking-wide text-slate-200">
                  SEO &bull; Trust &bull; Leads &bull; Local
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
