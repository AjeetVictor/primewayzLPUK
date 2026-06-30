import { ArrowRight, Gauge } from 'lucide-react';
import { motion } from 'motion/react';
import { trackEvent } from '../lib/analytics';
import { buildSelfAuditCtaUrl } from './SelfAuditCta';
import { getUtmAnalyticsPayload } from '../lib/utm';

export const DigitalVisibilityCheckerPromo = () => {
  const auditHref = buildSelfAuditCtaUrl('homepage_hero_promo');

  const handleClick = () => {
    trackEvent('cta_click', {
      cta_text: 'Check My Website',
      cta_location: 'homepage_visibility_tool',
      tool_name: 'web_presence_audit',
      destination: auditHref,
      ...getUtmAnalyticsPayload(),
    });
  };

  return (
    <section className="border-y border-brand-border bg-brand-surface/70 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="overflow-hidden rounded-2xl border border-brand-border bg-white shadow-[0_16px_40px_-28px_rgba(0,10,45,0.28)]">
          <div className="grid lg:grid-cols-[1fr_0.85fr]">
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-9">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue">
                Free UK SME Tool
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">
                Is your website enquiry-ready?
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                Most SME websites are online, but not always clear, discoverable, trusted, or built to
                convert visitors into enquiries. Run a quick visibility check on our dedicated audit page.
              </p>

              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <a
                  href={auditHref}
                  onClick={handleClick}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-brand-navy px-6 py-3 text-sm font-bold text-white shadow-md shadow-brand-navy/15 transition hover:bg-brand-navy/90"
                >
                  Check My Website
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <p className="max-w-sm text-xs leading-5 text-slate-500">
                  Promotional preview only. Full audit report runs on the dedicated checker page.
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center justify-center bg-brand-navy p-6 sm:p-8"
            >
              <div className="w-full max-w-xs rounded-xl border border-brand-cyan/20 bg-brand-blue/10 p-6 text-center text-white shadow-inner backdrop-blur-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-200">
                  <Gauge className="h-6 w-6" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
                  Digital Visibility Score
                </p>
                <p className="mt-2 text-4xl font-black">0-100</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-brand-cyan to-emerald-400" />
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
