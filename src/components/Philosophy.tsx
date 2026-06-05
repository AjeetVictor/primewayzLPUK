import { motion } from 'motion/react';
import { X, Check, Zap, RefreshCw, ShieldCheck, ArrowRight } from 'lucide-react';

const traditionalSteps = [
  'Discovery',
  'Fixed scope',
  'Build',
  'QA',
  'Launch',
  'Change request',
];

const subscriptionSteps = [
  'Prioritise',
  'Deliver',
  'Review',
  'Adjust',
  'Support',
  'Continue',
];

const comparisonModels = [
  {
    title: 'Traditional project model',
    eyebrow: 'Linear delivery path',
    description:
      'Scope is locked early, delivery moves in a straight line, and new priorities usually become change requests that slow momentum.',
    image: '/images/model-comparison/traditional-project-model.webp',
    imageAlt:
      'Traditional software project model showing discovery scope build QA launch steps and change request roadblocks',
    tone: 'traditional',
    steps: traditionalSteps,
    points: [
      'Large upfront scope and commitment',
      'Changes usually need re-estimation',
      'Momentum slows after launch',
    ],
  },
  {
    title: 'Primewayz subscription model',
    eyebrow: 'Continuous monthly delivery',
    description:
      'Your roadmap stays flexible. We prioritise, deliver, review, adjust capacity, and continue support without restarting the project.',
    image: '/images/model-comparison/primewayz-subscription-model.webp',
    imageAlt:
      'Primewayz subscription model showing continuous monthly software delivery review capacity adjustment and ongoing support',
    tone: 'primewayz',
    steps: subscriptionSteps,
    points: [
      'Monthly capacity aligned to business needs',
      'Priorities can change without project reset',
      'Delivery, maintenance, and improvement stay connected',
    ],
  },
];

const benefits = [
  {
    icon: RefreshCw,
    title: 'Software adapts to you',
    description: 'Your roadmap can evolve without forcing a full project reset.',
  },
  {
    icon: ShieldCheck,
    title: 'Full functional control',
    description: 'Add, remove, or reprioritise work as business needs change.',
  },
  {
    icon: Zap,
    title: 'Continuous evolution',
    description: 'Improve your platform steadily instead of waiting for the next big rebuild.',
  },
];

export const Philosophy = () => {
  return (
    <section className="py-16 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6"
          >
            A better model for ongoing software delivery
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-3xl mx-auto"
          >
            A structured monthly delivery model built for flexibility, control, and continuity - without rigid project cycles or scope friction.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {comparisonModels.map((model, index) => {
            const isPrimewayz = model.tone === 'primewayz';

            return (
              <motion.article
                key={model.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: index * 0.12 }}
                className={[
                  'group relative overflow-hidden rounded-3xl border p-5 md:p-6 transition-all duration-500 motion-safe:hover:-translate-y-1',
                  isPrimewayz
                    ? 'bg-blue-900 border-blue-700 shadow-xl shadow-blue-200/40 hover:shadow-2xl hover:shadow-blue-300/40'
                    : 'bg-slate-50 border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/80',
                ].join(' ')}
              >
                <div
                  className={[
                    'absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100',
                    isPrimewayz
                      ? 'bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.28),transparent_38%)]'
                      : 'bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.18),transparent_38%)]',
                  ].join(' ')}
                />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div>
                      <p
                        className={[
                          'text-xs font-bold uppercase tracking-[0.28em] mb-2',
                          isPrimewayz ? 'text-blue-200' : 'text-slate-500',
                        ].join(' ')}
                      >
                        {model.eyebrow}
                      </p>
                      <h3
                        className={[
                          'text-2xl font-bold tracking-tight',
                          isPrimewayz ? 'text-white' : 'text-slate-900',
                        ].join(' ')}
                      >
                        {model.title}
                      </h3>
                    </div>

                    <div
                      className={[
                        'hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl border transition-transform duration-500 group-hover:rotate-3 group-hover:scale-105',
                        isPrimewayz
                          ? 'border-blue-500 bg-blue-800 text-blue-100'
                          : 'border-slate-200 bg-white text-slate-500',
                      ].join(' ')}
                    >
                      {isPrimewayz ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}
                    </div>
                  </div>

                  <p
                    className={[
                      'text-sm leading-relaxed mb-6',
                      isPrimewayz ? 'text-blue-100/90' : 'text-slate-600',
                    ].join(' ')}
                  >
                    {model.description}
                  </p>

                  <div
                    className={[
                      'overflow-hidden rounded-2xl border mb-6 bg-white/90',
                      isPrimewayz ? 'border-blue-600/70' : 'border-slate-200',
                    ].join(' ')}
                  >
                    <img
                      src={model.image}
                      alt={model.imageAlt}
                      loading="lazy"
                      decoding="async"
                      width={1280}
                      height={920}
                      className="w-full aspect-[16/10] object-cover transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.035]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {model.steps.map((step, stepIndex) => (
                      <div key={step} className="flex items-center gap-2">
                        <span
                          className={[
                            'rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-300 motion-safe:group-hover:-translate-y-0.5',
                            isPrimewayz
                              ? 'border-blue-500/70 bg-blue-800/70 text-blue-50'
                              : 'border-slate-200 bg-white text-slate-600',
                          ].join(' ')}
                        >
                          {step}
                        </span>
                        {stepIndex < model.steps.length - 1 && (
                          <ArrowRight
                            className={[
                              'h-3.5 w-3.5',
                              isPrimewayz ? 'text-blue-300' : 'text-slate-400',
                            ].join(' ')}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <ul className="space-y-3">
                    {model.points.map((point) => (
                      <li
                        key={point}
                        className={[
                          'flex items-start gap-3 text-sm leading-relaxed',
                          isPrimewayz ? 'text-blue-50' : 'text-slate-700',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                            isPrimewayz ? 'bg-blue-200 text-blue-900' : 'bg-slate-200 text-slate-600',
                          ].join(' ')}
                        >
                          {isPrimewayz ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                        <span className={isPrimewayz ? '' : 'line-through decoration-slate-300'}>
                          {point}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-slate-300"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 border border-blue-100 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <benefit.icon className="w-7 h-7 text-blue-700" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
