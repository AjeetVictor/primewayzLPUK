import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'Do I need to start with Foundation Sprint?',
    answer:
      'In most cases, yes. Foundation Sprint is the recommended starting point because it aligns priorities, confirms scope, and creates the execution plan before active monthly delivery begins.',
  },
  {
    question: 'Can I take Foundation Sprint and a monthly plan together?',
    answer:
      'Yes. Some teams run Foundation Sprint first, then move into Essential, Growth, or Scale. Others overlap onboarding so monthly delivery starts immediately once priorities are approved.',
  },
  {
    question: 'How do I choose between Essential, Growth, and Scale?',
    answer:
      'Choose based on delivery capacity and complexity.\n\nEssential fits core website/CMS improvements and lighter integrations.\nGrowth fits broader conversion-focused delivery and CRM/API work.\nScale fits heavier operational systems, portals, dashboards, and automation.\n\nIf unsure, Primewayz recommends the best-fit plan on a discovery call.',
  },
  {
    question: 'Why are add-ons billed separately?',
    answer:
      'Add-ons are optional specialist capability beyond core delivery capacity. Keeping them separate means you only pay for extra support when it is genuinely needed.',
  },
  {
    question: 'Why are third-party vendor costs separate?',
    answer:
      'Third-party costs are external charges, not Primewayz delivery fees. This includes hosting, domains, email/messaging providers, payment gateways, and SaaS tooling. Separation keeps pricing transparent and keeps vendor ownership with your team.',
  },
  {
    question: 'When should I move to Maintenance Mode?',
    answer:
      'Move to Maintenance Mode when roadmap intensity drops and you need continuity, upkeep, and minor fixes without full active delivery capacity. You can move back into an active plan when priorities increase again.',
  },
  {
    question: 'When is Enterprise the right fit?',
    answer:
      'Enterprise is best for advanced integration-heavy systems, architect-led programmes, governance-heavy delivery, and large roadmap execution that needs custom team shape and commercial structure.',
  },
  {
    question: 'Can I switch plans as priorities change?',
    answer:
      'Yes. Capacity is flexible month to month. You can move between Essential, Growth, Scale, and Maintenance Mode as business priorities shift.',
  },
];

export const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.45fr_0.55fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-zinc-200 bg-zinc-50/80 p-6 sm:p-7"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700/80">
              DELIVERY MODEL GUIDE
            </p>
            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              Watch how to choose the right delivery model
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              A quick walkthrough of when to start with Foundation Sprint, when to move into
              monthly delivery, and how add-ons and third-party costs work.
            </p>

            <video
              controls
              preload="metadata"
              playsInline
              muted
              poster="/images/delivery-process-poster.jpg"
              className="mt-5 aspect-[9/16] w-full object-cover object-center rounded-2xl border border-zinc-200/80 bg-zinc-900 shadow-lg"
            >
              <source src="/videos/delivery-process-pwuk.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            <ul className="mt-5 space-y-2">
              {[
                'Start with Foundation Sprint',
                'Choose the monthly capacity that fits your roadmap',
                'Add optional specialist support only when needed',
                'Move to Maintenance Mode when priorities slow down',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-zinc-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <div>
            <div className="mb-7">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold tracking-tight text-zinc-900 md:text-4xl"
              >
                Common questions
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 }}
                className="mt-2 text-base text-zinc-600"
              >
                Everything you need to know before choosing a plan.
              </motion.p>
            </div>

            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.07,
                  },
                },
              }}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-3"
            >
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                  }}
                  className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
                >
                  <button
                    onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-zinc-50 sm:p-6"
                  >
                    <span className="pr-4 text-base font-semibold leading-6 text-zinc-900 sm:text-lg">
                      {faq.question}
                    </span>
                    {activeIndex === index ? (
                      <Minus className="h-5 w-5 shrink-0 text-zinc-500" />
                    ) : (
                      <Plus className="h-5 w-5 shrink-0 text-zinc-500" />
                    )}
                  </button>
                  <AnimatePresence>
                    {activeIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: 'easeInOut' }}
                      >
                        <div className="whitespace-pre-line border-t border-zinc-100 px-5 pb-5 pt-4 text-sm leading-7 text-zinc-600 sm:px-6 sm:pb-6">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
