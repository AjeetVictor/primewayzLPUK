import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useRef } from 'react';
import { HeroVisual } from './HeroVisual';

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, 800]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 2000]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.8,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1] as const
      }
    },
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden bg-zinc-50"
    >
      {/* Parallax Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          style={{ y: ySlow, opacity }}
          className="absolute top-20 left-10 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl opacity-50"
        />
        <motion.div
          style={{ y: yFast, opacity }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl opacity-50"
        />
        <motion.div
          style={{ y: ySlow, opacity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-50/20 rounded-full blur-3xl opacity-30"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          style={{ scale, opacity }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Ideas That Grow Brands!
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-6"
          >
            Outsource Your <br />
            <span className="text-emerald-600 italic">Software Product Development</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            className="max-w-3xl mx-auto text-lg md:text-xl text-zinc-600 mb-10 leading-relaxed"
          >
            Your on-demand product engineering team - delivered in structured queues. 
            We've turned software development into a productized system that grows 
            with your business, not against it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a 
              href="#contact"
              whileHover="hover"
              whileTap="tap"
              initial="initial"
              className="w-full sm:w-auto bg-zinc-900 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center gap-2 group shadow-lg shadow-zinc-900/20 relative overflow-hidden"
            >
              <motion.div
                variants={{
                  initial: { x: '-100%', y: '-100%' },
                  hover: { x: '100%', y: '100%' }
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="relative z-10 flex items-center gap-2">
                Get Started Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div 
                variants={{
                  initial: { scale: 1 },
                  tap: { scale: 0.95 }
                }}
                className="absolute inset-0 bg-zinc-900 -z-10"
              />
            </motion.a>
            <motion.a 
              href="#how-it-works"
              whileHover="hover"
              whileTap="tap"
              initial="initial"
              className="w-full sm:w-auto bg-white border border-zinc-200 text-zinc-900 px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center relative overflow-hidden group shadow-sm hover:border-zinc-300 transition-colors"
            >
              <motion.div
                variants={{
                  initial: { x: '100%', y: '100%' },
                  hover: { x: '-100%', y: '-100%' }
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-tl from-emerald-500/10 via-transparent to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="relative z-10">How it Works</span>
              <motion.div 
                variants={{
                  initial: { scale: 1 },
                  tap: { scale: 0.97 }
                }}
                className="absolute inset-0 bg-white -z-10"
              />
            </motion.a>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {[
              'Unlimited Requests',
              'Fixed Monthly Price',
              'Senior Developers',
              'No Contracts',
            ].map((feature) => (
              <motion.div 
                key={feature} 
                variants={itemVariants}
                className="flex items-center justify-center gap-2 text-sm font-medium text-zinc-500"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {feature}
              </motion.div>
            ))}
          </motion.div>

          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
};
