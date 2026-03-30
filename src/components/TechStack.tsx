import { motion } from 'motion/react';
import { Layout, Server, Database, Shield, Cpu, Globe, Code2, Layers } from 'lucide-react';

const technologies = [
  { name: 'React / Next.js', category: 'Frontend', icon: Layout, color: 'text-blue-400' },
  { name: 'Node.js / Express', category: 'Backend', icon: Server, color: 'text-emerald-400' },
  { name: 'PostgreSQL / MongoDB', category: 'Database', icon: Database, color: 'text-indigo-400' },
  { name: 'AWS / Google Cloud', category: 'Infrastructure', icon: Globe, color: 'text-amber-400' },
  { name: 'TypeScript', category: 'Language', icon: Code2, color: 'text-blue-500' },
  { name: 'Docker / Kubernetes', category: 'DevOps', icon: Layers, color: 'text-cyan-400' },
  { name: 'Firebase / Auth0', category: 'Security', icon: Shield, color: 'text-rose-400' },
  { name: 'AI / ML Integration', category: 'Advanced', icon: Cpu, color: 'text-purple-400' },
];

export const TechStack = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4"
          >
            Our <span className="text-emerald-600 italic">Battle-Tested</span> Stack
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            We use the most reliable and scalable technologies to ensure your 
            product is built for the future.
          </motion.p>
        </div>

        <div className="relative">
          {/* Decorative Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] opacity-[0.03] pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                whileHover={{ y: -5 }}
                className="bg-zinc-50 p-8 rounded-[2rem] border border-zinc-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <tech.icon className={`w-8 h-8 ${tech.color}`} />
                </div>
                <h4 className="font-bold text-zinc-900 mb-1">{tech.name}</h4>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{tech.category}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Infographic: Why our stack matters */}
        <div className="mt-24 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {[
            { title: 'Scalability', desc: 'Built to handle millions of users without breaking a sweat.', icon: Layers },
            { title: 'Maintainability', desc: 'Clean, typed code that your future team will love.', icon: Code2 },
            { title: 'Security', desc: 'Industry-standard protection for your data and users.', icon: Shield },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex gap-6 p-8 rounded-3xl bg-emerald-50/50 border border-emerald-100/50"
            >
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-zinc-900 mb-2">{item.title}</h5>
                <p className="text-sm text-zinc-600 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
