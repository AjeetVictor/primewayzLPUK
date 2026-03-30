import { motion } from 'motion/react';
import { Shield, Zap, Users, MessageSquare, Code2, GitBranch, Terminal, RefreshCw } from 'lucide-react';

const deliveryRules = [
  {
    title: '1 Active Task at a Time',
    description: 'Each lane focuses on one feature until completion, ensuring maximum velocity and zero context switching.',
    icon: Zap,
  },
  {
    title: 'Pause/Resume Anytime',
    description: 'Business slow? Pause your subscription. Scaling up? Resume instantly. No contracts, no penalties.',
    icon: RefreshCw,
  },
  {
    title: 'Complete Ownership',
    description: 'You own 100% of the source code and intellectual property. We own the delivery process.',
    icon: Shield,
  },
  {
    title: 'Fixed Monthly Rate',
    description: 'No hourly billing or unexpected invoices. One predictable price for elite engineering.',
    icon: Code2,
  },
];

const experienceFeatures = [
  {
    title: 'No Project Managers',
    description: 'Direct access to the engineers building your product. No middle-men, no lost translations.',
    icon: Users,
  },
  {
    title: 'Direct Queue Access',
    description: 'Manage your roadmap directly via Trello or Linear. Reprioritize features in real-time.',
    icon: Terminal,
  },
  {
    title: 'Async-First Communication',
    description: 'We work where you work - Slack, Trello, or Linear. Fast updates without the meeting fatigue.',
    icon: MessageSquare,
  },
  {
    title: 'Daily Progress Updates',
    description: 'Wake up to progress. Every day you get a clear update on what was shipped and what is next.',
    icon: Zap,
  },
];

const workflowSteps = [
  {
    title: 'Standardized Stack',
    description: 'We use a battle-tested tech stack (React, Node, Cloud) to ensure maintainability and speed.',
    icon: Code2,
  },
  {
    title: 'Peer Reviews by Default',
    description: 'Every line of code is reviewed by another senior engineer before it reaches production.',
    icon: GitBranch,
  },
  {
    title: 'Automated CI/CD',
    description: 'Continuous integration and deployment mean your features are shipped as soon as they are ready.',
    icon: Zap,
  },
  {
    title: 'Automated Testing',
    description: 'We write tests for every critical path to ensure your product stays stable as it grows.',
    icon: Shield,
  },
];

export const Experience = () => {
  return (
    <section id="features" className="py-24 bg-zinc-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-6"
          >
            The <span className="text-emerald-400 italic">Experience</span> of <br />
            Modern Engineering
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400 max-w-2xl"
          >
            We've redesigned the customer experience to be as seamless as the code we write. 
            No friction, just pure product evolution.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Delivery Rules */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              Delivery Rules
            </h3>
            <div className="space-y-8">
              {deliveryRules.map((rule, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                      <rule.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold">{rule.title}</h4>
                  </div>
                  <p className="text-zinc-400 leading-relaxed pl-14">{rule.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Customer Experience */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-8"
          >
            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              Customer Experience
            </h3>
            <div className="space-y-8">
              {experienceFeatures.map((feature, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                      <feature.icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h4 className="text-lg font-bold">{feature.title}</h4>
                  </div>
                  <p className="text-zinc-400 leading-relaxed pl-14">{feature.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Internal Workflow */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              Internal Workflow
            </h3>
            <div className="space-y-8">
              {workflowSteps.map((step, i) => (
                <div key={i} className="group">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                      <step.icon className="w-5 h-5 text-amber-400" />
                    </div>
                    <h4 className="text-lg font-bold">{step.title}</h4>
                  </div>
                  <p className="text-zinc-400 leading-relaxed pl-14">{step.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Strategic Advantages Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-32 p-12 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 border border-white/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "No 'Wrong Investment' Fear", desc: "Pivot your roadmap instantly as market conditions change." },
              { title: "No Vendor Lock-in", desc: "You own the code. Take it anywhere, anytime. No strings attached." },
              { title: "No 'Rebuild' Cycles", desc: "Continuous evolution means your tech never becomes legacy." },
              { title: "Digital OS", desc: "A continuous operating system for your digital business growth." }
            ].map((adv, i) => (
              <div key={i} className="space-y-3">
                <h5 className="text-emerald-400 font-bold">{adv.title}</h5>
                <p className="text-sm text-zinc-400 leading-relaxed">{adv.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
