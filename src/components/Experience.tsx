import { motion } from 'motion/react';
import { Shield, Zap, GitBranch, Code2, Terminal, RefreshCw } from 'lucide-react';

const deliveryPrinciples = [
  {
    title: 'Flexible monthly capacity',
    description: 'Scale delivery based on your roadmap and pace.',
    icon: RefreshCw,
    color: 'emerald',
  },
  {
    title: 'One approved workstream at a time',
    description: 'Keeps execution focused and predictable on entry plans.',
    icon: Terminal,
    color: 'indigo',
  },
  {
    title: 'Transparent commercial model',
    description: 'Clear subscription scope with add-ons shown separately.',
    icon: Shield,
    color: 'amber',
  },
  {
    title: 'Built for evolving roadmaps',
    description: 'Add, reprioritise, or pause work as business needs change.',
    icon: GitBranch,
    color: 'emerald',
  },
  {
    title: 'Quality built into delivery',
    description: 'Planning, build, QA, and release happen through a structured flow.',
    icon: Code2,
    color: 'indigo',
  },
  {
    title: 'Continuity without rigid lock-in',
    description: 'Move to maintenance mode when priorities slow down.',
    icon: Zap,
    color: 'amber',
  },
];

const colorClasses = {
  emerald: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
  },
  indigo: {
    icon: 'text-indigo-400',
    bg: 'bg-indigo-500/20',
  },
  amber: {
    icon: 'text-amber-400',
    bg: 'bg-amber-500/20',
  },
};

export const Experience = () => {
  return (
    <section id="features" className="py-24 bg-zinc-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            Delivery principles that keep work moving
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400 max-w-3xl mx-auto"
          >
            A structured software delivery model built for flexibility, focus, and continuity.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {deliveryPrinciples.map((principle, i) => {
            const color = colorClasses[principle.color as keyof typeof colorClasses];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group p-8 rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-12 h-12 rounded-xl ${color.bg} flex items-center justify-center group-hover:opacity-90 transition-opacity`}>
                    <principle.icon className={`w-6 h-6 ${color.icon}`} />
                  </div>
                  <h4 className="text-xl font-bold">{principle.title}</h4>
                </div>
                <p className="text-zinc-400 leading-relaxed">{principle.description}</p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="text-zinc-500 text-sm max-w-2xl mx-auto">
            Our delivery model is designed to reduce overhead, increase predictability, and adapt to your changing business needs—without the rigidity of traditional contracts.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
