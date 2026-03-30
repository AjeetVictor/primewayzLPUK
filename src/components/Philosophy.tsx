import { motion } from 'motion/react';
import { X, Check, Zap, Layers, RefreshCw, ShieldCheck } from 'lucide-react';

const comparisons = [
  {
    traditional: 'Fixed project cost',
    new: 'Continuous development capacity',
  },
  {
    traditional: 'Large upfront commitment',
    new: 'Predictable monthly pricing',
  },
  {
    traditional: 'Scope fights & change requests',
    new: 'Prioritized feature delivery',
  },
  {
    traditional: 'Paying for hours, not results',
    new: 'Buying velocity & business control',
  },
];

const benefits = [
  {
    icon: RefreshCw,
    title: 'Software adapts to you',
    description: 'In traditional models, you adapt to the software. Here, the software evolves with your business reality continuously.',
  },
  {
    icon: ShieldCheck,
    title: 'Full Functional Control',
    description: 'Add, remove, or pivot features anytime. No penalties. No renegotiation. Your roadmap, your rules.',
  },
  {
    icon: Zap,
    title: 'Continuous Evolution',
    description: 'Treat your software like a living product, not a finished project. Experiment faster and reduce market risk.',
  },
];

export const Philosophy = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6"
          >
            A new philosophy for <br />
            <span className="text-emerald-600 italic">modern product engineering</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-3xl mx-auto"
          >
            We've replaced the broken agency model with a continuous delivery system. 
            Think of it as <span className="font-bold text-zinc-900">"Netflix for software development."</span>
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-zinc-50 rounded-3xl p-8 md:p-12 border border-zinc-100"
          >
            <h3 className="text-xl font-bold text-zinc-400 mb-8 uppercase tracking-widest">The Old Way</h3>
            <ul className="space-y-6">
              {comparisons.map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-zinc-500 line-through decoration-zinc-300">
                  <X className="w-6 h-6 text-rose-400 shrink-0" />
                  <span className="text-lg">{item.traditional}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-emerald-600 rounded-3xl p-8 md:p-12 shadow-2xl shadow-emerald-200"
          >
            <h3 className="text-xl font-bold text-emerald-200 mb-8 uppercase tracking-widest">The Primewayz Way</h3>
            <ul className="space-y-6">
              {comparisons.map((item, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 text-white"
                >
                  <Check className="w-6 h-6 text-emerald-300 shrink-0" />
                  <span className="text-lg font-medium">{item.new}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <benefit.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h4 className="text-xl font-bold text-zinc-900 mb-3">{benefit.title}</h4>
              <p className="text-zinc-600 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
