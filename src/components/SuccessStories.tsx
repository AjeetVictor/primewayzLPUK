import { motion } from 'motion/react';
import { ArrowUpRight, TrendingUp, Users, Clock, Zap } from 'lucide-react';
import { ShareButton } from './ShareButton';

const stories = [
  {
    title: 'FinFlow: Scaling to 1M Users',
    category: 'Fintech',
    metric: '+400%',
    metricLabel: 'User Growth',
    description: 'How we rebuilt their core transaction engine to handle massive scale without downtime.',
    image: 'https://picsum.photos/seed/finflow/800/600',
    icon: TrendingUp,
    color: 'emerald'
  },
  {
    title: 'Nexus AI: Rapid MVP Launch',
    category: 'Artificial Intelligence',
    metric: '6 Weeks',
    metricLabel: 'Time to Market',
    description: 'From concept to a fully functional AI-powered platform in record time.',
    image: 'https://picsum.photos/seed/nexus/800/600',
    icon: Zap,
    color: 'indigo'
  },
  {
    title: 'CloudScale: Infrastructure Overhaul',
    category: 'SaaS',
    metric: '-60%',
    metricLabel: 'Server Costs',
    description: 'Optimizing cloud architecture to reduce overhead while increasing performance.',
    image: 'https://picsum.photos/seed/cloudscale/800/600',
    icon: Users,
    color: 'amber'
  }
];

export const SuccessStories = () => {
  return (
    <section id="success-stories" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-6"
            >
              Real results for <br />
              <span className="text-emerald-600 italic">real businesses</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-zinc-600"
            >
              We don't just write code; we build business value. Explore how we've
              helped our partners achieve their most ambitious goals.
            </motion.p>
          </div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 text-zinc-900 font-bold hover:text-emerald-600 transition-colors group focus:outline-none focus:ring-2 focus:ring-emerald-500/20 rounded-lg px-2"
          >
            View all case studies
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stories.map((story, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden mb-6">
                <img
                  src={story.image}
                  alt={story.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-zinc-900">
                    {story.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <ShareButton
                    title={story.title}
                    url={(typeof window !== 'undefined' ? window.location.href : 'https://uk.primewayz.com/')}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      story.color === 'emerald' ? 'bg-emerald-100' :
                      story.color === 'indigo' ? 'bg-indigo-100' : 'bg-amber-100'
                    }`}
                  >
                    <story.icon className={`w-5 h-5 ${
                      story.color === 'emerald' ? 'text-emerald-600' :
                      story.color === 'indigo' ? 'text-indigo-600' : 'text-amber-600'
                    }`} />
                  </motion.div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-zinc-900 leading-none">{story.metric}</div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">{story.metricLabel}</div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                  {story.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  {story.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
