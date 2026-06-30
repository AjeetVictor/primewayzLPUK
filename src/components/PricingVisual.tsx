import { motion } from 'motion/react';
import { Check, X, Zap, Clock, Shield, Users } from 'lucide-react';

const comparisonData = [
  { feature: 'Development Speed', traditional: 'Slow / Variable', primewayz: '3x Faster / Predictable', icon: Zap },
  { feature: 'Cost Structure', traditional: 'Hourly / Project-based', primewayz: 'Fixed Monthly Subscription', icon: Shield },
  { feature: 'Resource Access', traditional: 'Recruitment Headaches', primewayz: 'Elite Engineers on Tap', icon: Users },
  { feature: 'Flexibility', traditional: 'Rigid Contracts', primewayz: 'Pause / Resume Anytime', icon: Clock },
];

export const PricingVisual = () => {
  return (
    <div className="mt-24 max-w-[1200px] mx-auto">
      <div className="text-center mb-16">
        <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-4">
          Why <span className="text-emerald-600 italic">Subscription</span> Wins
        </h3>
        <p className="text-zinc-600 max-w-2xl mx-auto">
          A side-by-side comparison of our productized model versus traditional development approaches.
        </p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-zinc-200 overflow-hidden shadow-xl shadow-zinc-200/50">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
          {/* Header Row (Desktop) */}
          <div className="hidden md:block p-8 bg-zinc-50/50 font-bold text-zinc-400 uppercase tracking-widest text-xs">
            Feature
          </div>
          <div className="hidden md:block p-8 bg-zinc-50/50 font-bold text-zinc-400 uppercase tracking-widest text-xs">
            Traditional Agency
          </div>
          <div className="hidden md:block p-8 bg-emerald-50/50 font-bold text-emerald-600 uppercase tracking-widest text-xs">
            Primewayz Model
          </div>

          {/* Data Rows */}
          {comparisonData.map((row, i) => (
            <div key={i} className="contents group">
              <div className="p-8 flex items-center gap-4 bg-white">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0">
                  <row.icon className="w-5 h-5 text-zinc-400" />
                </div>
                <span className="font-bold text-zinc-900">{row.feature}</span>
              </div>
              
              <div className="p-8 flex items-center gap-3 bg-zinc-50/30">
                <X className="w-5 h-5 text-rose-400 shrink-0" />
                <span className="text-zinc-500 text-sm">{row.traditional}</span>
              </div>
              
              <div className="p-8 flex items-center gap-3 bg-emerald-50/20">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-emerald-700 font-medium text-sm">{row.primewayz}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Infographic: The "Pause" Mechanism */}
      <div className="mt-20 p-12 rounded-[3rem] bg-zinc-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-6">
              Unique Feature
            </div>
            <h4 className="text-2xl md:text-3xl font-bold mb-6">
              The <span className="text-emerald-400 italic">Pause</span> Mechanism
            </h4>
            <p className="text-zinc-400 leading-relaxed mb-8">
              Don't have enough work to fill a full month? Pause your subscription and 
              use the remaining days later. Your balance never expires.
            </p>
            
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center mb-2">
                  <span className="text-emerald-500 font-bold">31</span>
                </div>
                <span className="text-[10px] uppercase text-zinc-500 font-bold">Days Paid</span>
              </div>
              <div className="h-px w-12 bg-zinc-800" />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-amber-500 flex items-center justify-center mb-2">
                  <span className="text-amber-500 font-bold">10</span>
                </div>
                <span className="text-[10px] uppercase text-zinc-500 font-bold">Days Used</span>
              </div>
              <div className="h-px w-12 bg-zinc-800" />
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center mb-2 shadow-lg shadow-emerald-500/20">
                  <span className="text-white font-bold text-xl">21</span>
                </div>
                <span className="text-[10px] uppercase text-emerald-500 font-bold">Days Saved</span>
              </div>
            </div>
          </div>

          <div className="relative aspect-video bg-zinc-800 rounded-2xl border border-white/5 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center"
              >
                <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50">
                  <Clock className="w-10 h-10 text-white" />
                </div>
              </motion.div>
            </div>
            {/* Mock Timeline */}
            <div className="absolute bottom-6 left-6 right-6 h-2 bg-zinc-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                whileInView={{ width: '32%' }}
                viewport={{ once: true }}
                transition={{ duration: 2, delay: 0.5 }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
