import { motion } from 'motion/react';
import { Code2, Layout, Database, Shield, Zap, Terminal } from 'lucide-react';

export const HeroVisual = () => {
  return (
    <div className="relative w-full max-w-[1200px] mx-auto mt-20 perspective-1000">
      <motion.div
        initial={{ opacity: 0, y: 100, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white rounded-[2.5rem] shadow-2xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden aspect-[16/9] md:aspect-[21/9]"
      >
        {/* Mock Interface Header */}
        <div className="h-12 bg-zinc-50 border-b border-zinc-100 flex items-center px-6 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-400/20" />
            <div className="w-3 h-3 rounded-full bg-amber-400/20" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/20" />
          </div>
          <div className="ml-4 h-6 w-48 bg-zinc-200/50 rounded-full" />
        </div>

        {/* Mock Interface Body */}
        <div className="p-8 grid grid-cols-12 gap-6 h-full">
          {/* Sidebar */}
          <div className="col-span-3 space-y-4">
            <div className="h-4 w-full bg-emerald-100 rounded-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-3 w-3/4 bg-zinc-100 rounded-full" />
              ))}
            </div>
            <div className="pt-8 space-y-2">
              <div className="h-4 w-1/2 bg-zinc-200 rounded-full" />
              <div className="h-3 w-full bg-zinc-100 rounded-full" />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-9 space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-8 w-48 bg-zinc-900 rounded-xl" />
              <div className="h-8 w-24 bg-emerald-500 rounded-xl" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                { icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { icon: Terminal, color: 'text-indigo-500', bg: 'bg-indigo-50' }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="h-2 w-12 bg-zinc-200 rounded-full" />
                </div>
              ))}
            </div>

            {/* Code Block Mockup */}
            <div className="p-6 bg-zinc-900 rounded-2xl space-y-3 overflow-hidden relative">
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-2 mb-2"
              >
                <div className="h-2 w-12 bg-emerald-500/30 rounded-full" />
                <div className="h-2 w-8 bg-indigo-500/30 rounded-full" />
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-2 w-3/4 bg-zinc-800 rounded-full"
              />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.7, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-2 w-1/2 bg-zinc-800 rounded-full"
              />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.9, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-2 w-2/3 bg-zinc-800 rounded-full"
              />
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-4 right-4 p-3 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20"
              >
                <Code2 className="w-6 h-6 text-white" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Decorative Elements around the Mockup */}
      <div className="absolute -top-10 -left-10 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
    </div>
  );
};
