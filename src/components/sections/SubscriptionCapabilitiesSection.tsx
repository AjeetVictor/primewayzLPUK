import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { subscriptionCapabilitiesData, subscriptionValueChips } from './subscriptionCapabilitiesData';

export const SubscriptionCapabilitiesSection = () => {
  const featuredIds = ['product-engineering-subscription', 'flexible-output-growth'];

  return (
    <section
      id="features"
      className="relative mx-auto w-full py-16 sm:py-20 lg:py-24"
    >
      {/* Subtle background tint */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-50/30 via-white to-white" />

      {/* Trust chips */}
      <div
        aria-label="Subscription trust highlights"
        className="mb-12 grid grid-cols-1 rounded-2xl border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.25)] backdrop-blur-sm sm:grid-cols-2 sm:gap-x-4 sm:px-7 sm:py-6 lg:mb-16 lg:grid-cols-4 lg:gap-x-6"
      >
        {subscriptionValueChips.map((item, index) => (
          <div
            key={item.id}
            className={`flex min-h-[60px] items-center gap-3 py-2.5 text-slate-700 ${index > 0 ? 'lg:border-l lg:border-slate-200/70 lg:pl-6' : ''}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 text-slate-600">
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold leading-5 text-slate-800">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Header section */}
      <div className="mb-14 lg:mb-20">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-700/90">
              Built for predictable, flexible delivery
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Subscription Delivery, Backed by Full‑Stack Capability
            </h2>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
              Our subscription model is designed to give you more control over priorities, pace, and
              outcomes. From product engineering and UX to QA, backend, and automation, we support
              long‑term delivery through structured execution that adapts to your business needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="lg:justify-self-end"
          >
            <a
              href="/#how-it-works"
              className="group inline-flex items-center gap-2 border-b border-slate-300 pb-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900 hover:text-slate-900"
            >
              Explore delivery model
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </motion.div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {subscriptionCapabilitiesData.map((card, index) => {
          const isFeatured = featuredIds.includes(card.id);
          return (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${
                isFeatured
                  ? 'border-emerald-200/80 bg-emerald-50/40 shadow-[0_12px_40px_-30px_rgba(16,185,129,0.25)] hover:border-emerald-300 hover:shadow-[0_24px_50px_-36px_rgba(16,185,129,0.35)]'
                  : 'border-slate-200/70 bg-white shadow-[0_10px_30px_-24px_rgba(15,23,42,0.15)] hover:border-slate-300 hover:shadow-[0_20px_40px_-30px_rgba(15,23,42,0.2)]'
              }`}
            >
              {/* Icon badge */}
              <div
                className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl transition-colors duration-300 ${
                  isFeatured
                    ? 'bg-emerald-100/80 text-emerald-700 group-hover:bg-emerald-100'
                    : 'bg-slate-100/80 text-slate-600 group-hover:bg-slate-200/80'
                }`}
              >
                <card.icon className="h-6 w-6" aria-hidden="true" />
              </div>

              <h3 className="text-xl font-semibold leading-tight text-slate-900">{card.title}</h3>
              <p className="mt-3.5 text-sm leading-6 text-slate-600 sm:text-[15px]">{card.description}</p>

              {/* Subtle indicator for featured cards */}
              {isFeatured && (
                <div className="absolute -top-2 right-6 rounded-full bg-emerald-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                  Featured
                </div>
              )}
            </motion.article>
          );
        })}
      </div>

      {/* Closing note */}
      <p className="mt-12 text-center text-sm text-slate-500">
        A system designed to support both momentum now and sustainability over the long term.
      </p>
    </section>
  );
};
