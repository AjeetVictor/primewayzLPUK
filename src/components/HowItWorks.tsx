import { TrackedLink } from './common/TrackedLink';
import { motion } from 'motion/react';
import { Target, Layers, BarChart } from 'lucide-react';

const flowSteps = [
  {
    label: 'STEP 01',
    title: 'Discovery and priority alignment',
    description:
      'Tell us about your goals, roadmap, constraints, and current priorities.',
    icon: Target,
  },
  {
    label: 'STEP 02',
    title: 'Scope the right delivery model',
    description:
      'We define the best-fit plan, workstream structure, and execution approach for your business.',
    icon: Layers,
  },
  {
    label: 'STEP 03',
    title: 'Start delivery and review progress',
    description:
      'Work moves through planning, build, QA, and release with clear visibility and regular updates.',
    icon: BarChart,
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700/80"
          >
            PROCESS & DELIVERY
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4"
          >
            How delivery works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-3xl mx-auto"
          >
            A structured process designed for clarity, prioritisation, and steady progress - from
            discovery through release.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden rounded-[2.25rem] border border-zinc-200 bg-zinc-50/80"
        >
          <div className="grid grid-cols-1 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="border-b border-zinc-200 bg-zinc-100/70 p-5 sm:p-6 lg:min-h-[520px] lg:border-b-0 lg:border-r lg:p-8">
              <video
                controls
                preload="metadata"
                playsInline
                muted
                poster="/images/delivery-process-poster.jpg"
                className="mx-auto aspect-[10/16] w-full max-w-[22rem] rounded-2xl border border-zinc-200/80 bg-zinc-900 object-cover object-center shadow-[0_20px_44px_-30px_rgba(15,23,42,0.7)]"
              >
                <source src="/videos/delivery-process-pwuk.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="relative p-7 md:p-10 lg:p-12">
              <h3 className="text-2xl md:text-3xl font-bold leading-tight text-zinc-900">
                Delivery milestones
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
                A clear three-step path that turns priorities into structured delivery, visible
                progress, and release-ready outcomes.
              </p>

              <div className="relative mt-6">
                <div className="relative space-y-5">
                  <div className="pointer-events-none absolute bottom-5 left-[1.22rem] top-5 w-px bg-zinc-300/80" />
                  {flowSteps.map((step, index) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, x: 18 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1, duration: 0.45 }}
                      className="relative grid grid-cols-[2.5rem,1fr] items-center gap-4"
                    >
                      <div className="z-10 flex h-[2.5rem] w-[2.5rem] shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-700 shadow-[0_8px_16px_-12px_rgba(30,64,175,0.55)]">
                        <step.icon className="h-4 w-4" />
                      </div>
                      <div className="rounded-2xl border border-zinc-200/95 bg-white px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.55)] sm:px-5 sm:py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
                          {step.label}
                        </p>
                        <h4 className="mt-1 text-xl font-semibold leading-tight text-zinc-900 sm:text-2xl">
                          {step.title}
                        </h4>
                        <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-600">{step.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pl-[3.15rem]">
                  <TrackedLink
                    href="#contact"
                    ctaText="Book a UK discovery call"
                    ctaLocation="how_it_works"
                    eventType="book_call_click"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    Book a UK discovery call
                  </TrackedLink>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
