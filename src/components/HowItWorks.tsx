import { motion } from 'motion/react';
import { ListTodo, Users, Repeat, CheckCircle2, Layout, Database, Shield, Rocket } from 'lucide-react';

const steps = [
  {
    icon: ListTodo,
    title: 'Feature Queue',
    description: 'Add as many requests to your board as you’d like. We maintain a prioritized queue from high-priority to future backlog.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon: Users,
    title: 'Sequential Flow',
    description: 'Only required specialists enter when needed. Architect > UX > Frontend > Backend > QA > Deployment.',
    color: 'bg-indigo-100 text-indigo-600',
  },
  {
    icon: Repeat,
    title: 'Active Execution',
    description: 'One primary resource active at a time per lane. This keeps costs low while maintaining professional delivery.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon: Rocket,
    title: 'Continuous Release',
    description: 'Once a request is complete, we move straight to the next one in your queue. Product evolves continuously.',
    color: 'bg-rose-100 text-rose-600',
  },
];

const flowSteps = [
  { name: 'Architect', icon: Shield, desc: 'Requirement shaping' },
  { name: 'UX / Designer', icon: Layout, desc: 'Layouts & Prototypes' },
  { name: 'Developer', icon: Database, desc: 'UI & Logic implementation' },
  { name: 'QA / DevOps', icon: CheckCircle2, desc: 'Validation & Release' },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4"
          >
            Operational Model
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            A simple, streamlined process designed for speed and predictability. 
            Customers buy velocity, not hours.
          </motion.p>
        </div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="relative group"
            >
              <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{step.title}</h3>
              <p className="text-zinc-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-zinc-50 rounded-[3rem] p-8 md:p-16 border border-zinc-100 overflow-hidden relative"
        >
          {/* Background Graphic */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="max-w-5xl mx-auto relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-16 text-center">
              The <span className="text-emerald-600">Sequential Execution</span> Pipeline
            </h3>
            
            <div className="relative">
              {/* Connecting Line (Desktop) */}
              <div className="hidden lg:block absolute top-[48px] left-[12.5%] right-[12.5%] h-1 bg-zinc-200 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '100%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  className="h-full bg-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-16">
                {flowSteps.map((step, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2, duration: 0.5 }}
                    className="relative flex flex-col items-center text-center group"
                  >
                    {/* Step Number */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-400 shadow-sm z-20">
                      0{i + 1}
                    </div>

                    <div className="w-24 h-24 rounded-3xl bg-white shadow-xl shadow-zinc-200/50 border border-zinc-100 flex items-center justify-center mb-6 z-10 group-hover:bg-emerald-600 group-hover:scale-110 transition-all duration-300">
                      <step.icon className="w-10 h-10 text-emerald-600 group-hover:text-white transition-colors" />
                    </div>
                    
                    <h4 className="text-xl font-bold text-zinc-900 mb-2">{step.name}</h4>
                    <p className="text-sm text-zinc-500 max-w-[180px] leading-relaxed">{step.desc}</p>
                    
                    {/* Status Indicator */}
                    <div className="mt-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active Phase
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                <h5 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  No Resource Waste
                </h5>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  Unlike traditional teams where developers wait for designs, our model ensures 
                  resources are only engaged when the pipeline is ready for them.
                </p>
              </div>
              <div className="p-8 bg-white rounded-3xl border border-zinc-100 shadow-sm">
                <h5 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  Predictable Velocity
                </h5>
                <p className="text-zinc-600 text-sm leading-relaxed">
                  By focusing on one request at a time, we eliminate context switching overhead, 
                  resulting in 40% faster completion rates compared to multi-tasking teams.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
