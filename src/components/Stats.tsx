import { motion, useMotionValue, useTransform, animate, useInView } from 'motion/react';
import { TrendingUp, Clock, Zap, Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const stats = [
  {
    label: 'Faster Delivery',
    value: 3,
    suffix: 'x',
    description: 'Compared to traditional agencies',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50'
  },
  {
    label: 'Cost Reduction',
    value: 40,
    suffix: '%',
    description: 'Average savings on dev overhead',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50'
  },
  {
    label: 'Uptime Guarantee',
    value: 99.9,
    suffix: '%',
    description: 'Reliable infrastructure & code',
    icon: Clock,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50'
  },
  {
    label: 'Success Rate',
    value: 100,
    suffix: '%',
    description: 'Project completion & satisfaction',
    icon: Target,
    color: 'text-rose-500',
    bg: 'bg-rose-50'
  }
];

const Counter = ({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals));
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: "easeOut",
      });
      return controls.stop;
    }
  }, [isInView, value, count]);

  useEffect(() => {
    return rounded.on("change", (v) => setDisplayValue(v));
  }, [rounded]);

  return (
    <span ref={ref}>
      {displayValue}
      {suffix}
    </span>
  );
};

export const Stats = () => {
  return (
    <section className="py-24 bg-zinc-900 text-white overflow-hidden relative">
      {/* Background Graphic Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="flex flex-col items-center text-center group"
            >
              <motion.div 
                whileHover={{ scale: 1.15, rotate: 5 }}
                className={`w-16 h-16 rounded-3xl ${stat.bg} flex items-center justify-center mb-6 transition-colors duration-300`}
              >
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </motion.div>
              
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 100 }}
                className="text-5xl font-bold tracking-tighter mb-2"
              >
                <Counter 
                  value={stat.value} 
                  suffix={stat.suffix} 
                  decimals={stat.value % 1 !== 0 ? 1 : 0} 
                />
              </motion.div>
              
              <h3 className="text-lg font-semibold text-zinc-300 mb-2 uppercase tracking-wider">
                {stat.label}
              </h3>
              
              <p className="text-zinc-500 text-sm max-w-[200px]">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Visual Divider / Infographic Element */}
        <div className="mt-24 pt-24 border-t border-zinc-800">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Visualizing the <span className="text-emerald-500">Efficiency Gap</span>
              </h2>
              <p className="text-zinc-400 text-lg mb-8">
                Traditional models are plagued by communication overhead, context switching, and idle time. 
                Our model eliminates these bottlenecks through sequential execution and dedicated focus.
              </p>
              
              <div className="space-y-6">
                {[
                  { label: 'Traditional Agency', value: 35, color: 'bg-zinc-700' },
                  { label: 'Primewayz Model', value: 95, color: 'bg-emerald-500' }
                ].map((bar, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium uppercase tracking-wider">
                      <span>{bar.label}</span>
                      <span>{bar.value}% Efficiency</span>
                    </div>
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${bar.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                        className={`h-full ${bar.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative aspect-square max-w-md mx-auto lg:mx-0"
            >
              {/* Abstract Infographic Diagram */}
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                
                {/* Outer Ring */}
                <circle cx="200" cy="200" r="180" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <circle cx="200" cy="200" r="140" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                
                {/* Rotating Elements */}
                <motion.g
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  style={{ originX: '200px', originY: '200px' }}
                >
                  <circle cx="200" cy="20" r="8" fill="#10b981" />
                  <circle cx="380" cy="200" r="8" fill="#3b82f6" />
                  <circle cx="200" cy="380" r="8" fill="#10b981" />
                  <circle cx="20" cy="200" r="8" fill="#3b82f6" />
                </motion.g>

                {/* Central Core */}
                <circle cx="200" cy="200" r="80" fill="url(#grad1)" opacity="0.2" />
                <circle cx="200" cy="200" r="60" fill="url(#grad1)" opacity="0.4" />
                <circle cx="200" cy="200" r="40" fill="url(#grad1)" />
                
                <text x="200" y="205" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" className="uppercase tracking-widest">
                  Core
                </text>
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
