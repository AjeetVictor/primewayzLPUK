import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Users, 
  Code2, 
  CheckCircle2, 
  ArrowRight, 
  MessageSquare, 
  Zap, 
  Clock,
  Sparkles,
  Rocket
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { TrackedLink } from './common/TrackedLink';

const steps = [
  {
    id: 'request',
    title: 'Submit a priority',
    description: 'Add approved requests, fixes, or next-phase goals to your backlog.',
    icon: MessageSquare,
    color: 'emerald',
  },
  {
    id: 'queue',
    title: 'Prioritise the right workstream',
    description: 'We align the next approved item with your plan, roadmap, and current business priorities.',
    icon: Users,
    color: 'indigo',
  },
  {
    id: 'build',
    title: 'Build in sequence',
    description: 'Work moves through planning, design, build, QA, and release with clear visibility.',
    icon: Code2,
    color: 'emerald',
  },
  {
    id: 'deliver',
    title: 'Review and release',
    description: 'Review progress, approve outcomes, and move the next item into delivery.',
    icon: Rocket,
    color: 'indigo',
  },
];

export const InteractiveDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setCurrentStep((curr) => (curr + 1) % steps.length);
            return 0;
          }
          return prev + 1;
        });
      }, 50); // 5 seconds per step
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setProgress(0);
    setIsAutoPlaying(false);
  };

  const ActiveIcon = steps[currentStep].icon;

  return (
    <section id="demo" className="py-24 bg-zinc-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Zap className="w-3 h-3" />
            Interactive Experience
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4"
          >
            How work moves from <span className="text-emerald-600 italic">request</span> to release
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-lg text-zinc-600"
          >
            A structured delivery flow built for clarity, prioritisation, and steady monthly progress.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Interactive Controls */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.button
                key={step.id}
                onClick={() => handleStepClick(index)}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`w-full text-left p-6 rounded-2xl transition-all relative overflow-hidden group ${
                  currentStep === index 
                    ? 'bg-white shadow-xl shadow-zinc-200/50 ring-1 ring-zinc-200' 
                    : 'hover:bg-zinc-100'
                }`}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div className={`p-3 rounded-xl ${
                    currentStep === index 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-zinc-200 text-zinc-500 group-hover:bg-zinc-300'
                  } transition-colors`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${
                      currentStep === index ? 'text-zinc-900' : 'text-zinc-500'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`text-sm leading-relaxed ${
                      currentStep === index ? 'text-zinc-600' : 'text-zinc-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {currentStep === index && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-emerald-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'linear' }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Right: Visual Simulation */}
          <div className="relative h-[500px] bg-zinc-900 rounded-[2.5rem] shadow-2xl shadow-emerald-900/20 p-8 flex flex-col overflow-hidden border border-zinc-800">
            {/* Mock UI Header */}
            <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <div className="px-3 py-1 rounded-md bg-zinc-800 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Primewayz_OS v2.4
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.05, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col items-center justify-center text-center"
              >
                {currentStep === 0 && (
                  <div className="w-full max-w-sm space-y-6">
                    <div className="bg-zinc-800/50 p-6 rounded-2xl border border-zinc-700/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="h-2 w-24 bg-zinc-700 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-zinc-700/50 rounded-full" />
                        <div className="h-3 w-3/4 bg-zinc-700/50 rounded-full" />
                      </div>
                    </div>
                    <motion.div 
                      animate={{ y: [0, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="flex justify-center"
                    >
                      <div className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/40">
                        <Send className="w-4 h-4" />
                        Submit Priority
                      </div>
                    </motion.div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="w-full max-w-sm space-y-6">
                    <div className="flex justify-center gap-4 mb-8">
                      {[1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center"
                        >
                          <Users className="w-6 h-6 text-indigo-400" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <div className="h-2 w-32 bg-zinc-600 rounded-full" />
                        </div>
                        <div className="px-2 py-1 rounded bg-indigo-500/10 text-[10px] text-indigo-400 font-bold">HIGH PRIORITY</div>
                      </div>
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="p-4 bg-zinc-800/50 rounded-xl border border-zinc-700/50 flex items-center justify-between opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-zinc-600" />
                          <div className="h-2 w-24 bg-zinc-600 rounded-full" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="w-full max-w-sm space-y-8">
                    <div className="relative h-48 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-40 h-40 rounded-full border-2 border-dashed border-emerald-500/20" />
                      </motion.div>
                      <div className="relative z-10 p-8 bg-emerald-600/10 rounded-3xl border border-emerald-500/30">
                        <Code2 className="w-12 h-12 text-emerald-400" />
                      </div>
                      {/* Floating code bits */}
                      {[1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            x: [0, Math.random() * 40 - 20, 0],
                            y: [0, Math.random() * 40 - 20, 0],
                            opacity: [0.2, 0.8, 0.2]
                          }}
                          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                          className="absolute text-[10px] font-mono text-emerald-500/40"
                          style={{ 
                            top: `${Math.random() * 80 + 10}%`, 
                            left: `${Math.random() * 80 + 10}%` 
                          }}
                        >
                          {'{...}'}
                        </motion.div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        <span>Development Progress</span>
                        <span>{Math.floor(progress)}%</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-emerald-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: 'linear' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="w-full max-w-sm space-y-8">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
                      <div className="relative z-10 w-24 h-24 mx-auto bg-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-900/50">
                        <CheckCircle2 className="w-12 h-12 text-white" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 border-2 border-emerald-500 rounded-3xl"
                      />
                    </motion.div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white">Review and Release</h4>
                      <p className="text-zinc-500 text-sm">Review progress, approve outcomes, and move the next item into delivery.</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <div className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 text-xs font-bold border border-zinc-700">Request Revision</div>
                      <div className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-2">
                        Approve & Close
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Background Decorative Elements */}
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 p-8 rounded-[2rem] bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600/10 flex items-center justify-center border border-emerald-500/20">
              <Sparkles className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1">Experience it for real.</h4>
              <p className="text-zinc-500">Book a UK discovery call to see how we can transform your development.</p>
            </div>
          </div>
          <TrackedLink
            href="#contact"
            ctaText="Book a UK discovery call"
            ctaLocation="interactive_demo"
            eventType="book_call_click"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/40 flex items-center gap-2"
          >
            Book a UK discovery call
            <ArrowRight className="w-5 h-5" />
          </TrackedLink>
        </motion.div>
      </div>
    </section>
  );
};
