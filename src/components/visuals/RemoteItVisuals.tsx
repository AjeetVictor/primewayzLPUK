import { motion } from 'motion/react';
import { CheckCircle2, ClipboardList, Monitor, Users } from 'lucide-react';

export const RemoteItHeroSlideVisual = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#000A2D] via-slate-900 to-emerald-950 p-6">
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/95 p-4 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">UK delivery dashboard</p>
          <p className="text-sm font-bold text-slate-900">Remote resource model</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Live</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'UK requirement', icon: Monitor, tone: 'bg-slate-900 text-white' },
          { label: 'Remote developer', icon: Users, tone: 'bg-emerald-600 text-white' },
          { label: 'QA / support', icon: CheckCircle2, tone: 'bg-blue-600 text-white' },
          { label: 'Coordinator', icon: ClipboardList, tone: 'bg-indigo-600 text-white' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3"
            >
              <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${card.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xs font-semibold text-slate-800">{card.label}</p>
              <div className="mt-2 h-1.5 rounded-full bg-emerald-200">
                <div className="h-full w-3/4 rounded-full bg-emerald-500" />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span>Delivery pipeline</span>
          <span className="text-emerald-700">On track</span>
        </div>
        <div className="mt-2 flex gap-1">
          {['Plan', 'Build', 'QA', 'Report'].map((step, index) => (
            <div
              key={step}
              className={`flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-bold ${
                index < 3 ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const RemoteItCapacityVisual = () => (
  <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6 shadow-xl shadow-slate-900/5">
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Remote resource model</p>
    <div className="mt-5 grid gap-3 sm:grid-cols-2">
      {[
        'UK business requirement',
        'Remote developer',
        'QA / support',
        'Project coordinator',
        'Weekly reporting',
        'Delivery checkpoints',
      ].map((label, index) => (
        <div
          key={label}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#000A2D] text-xs font-bold text-white">
            {index + 1}
          </div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
        </div>
      ))}
    </div>
  </div>
);
