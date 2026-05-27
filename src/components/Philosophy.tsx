import { motion } from 'motion/react';
import { X, Check, Zap, Layers, RefreshCw, ShieldCheck } from 'lucide-react';

const comparisons = [
  {
    traditional: 'Fixed-scope delivery',
    new: 'Flexible monthly capacity',
  },
  {
    traditional: 'Large upfront commitment',
    new: 'Predictable monthly pricing',
  },
  {
    traditional: 'Change requests slow momentum',
    new: 'Prioritised ongoing delivery',
  },
  {
    traditional: 'Budget tied to project cycles',
    new: 'Built for evolving roadmaps',
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
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-slate-50 rounded-3xl p-6 md:p-9 border border-slate-200"
          >
            <h3 className="text-xl font-bold text-slate-600 mb-8 uppercase tracking-widest">Traditional project model</h3>
            <ul className="space-y-4">
              {comparisons.map((item, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-700 line-through decoration-slate-200">
                  <X className="w-6 h-6 text-slate-500 shrink-0" />
                  <span className="text-lg">{item.traditional}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-blue-800 rounded-3xl p-6 md:p-9 shadow-lg shadow-blue-200/30"
          >
            <h3 className="text-xl font-bold text-blue-100 mb-8 uppercase tracking-widest">Primewayz subscription model</h3>
            <ul className="space-y-4">
              {comparisons.map((item, i) => (
                <motion.li 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 text-white"
                >
                  <Check className="w-6 h-6 text-blue-200 shrink-0" />
                  <span className="text-lg font-medium">{item.new}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 border border-blue-100 shadow-sm">
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
