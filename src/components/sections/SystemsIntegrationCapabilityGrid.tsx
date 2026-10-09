import { Bot, RefreshCw, Shuffle, Workflow } from 'lucide-react';

const CAPABILITIES = [
  {
    title: 'Systems integration and data synchronisation',
    description: 'Connect approved applications and data sources with defined field mapping, validation, ownership and exception handling.',
    icon: Shuffle,
  },
  {
    title: 'Rules-based workflow automation',
    description: 'Use deterministic triggers, conditions, routing and notifications where the required business rules are clear and repeatable.',
    icon: Workflow,
  },
  {
    title: 'AI-assisted workflows where appropriate',
    description: 'Introduce governed AI only where context, language or reasoning adds value beyond fixed rules, with human controls where required.',
    icon: Bot,
  },
  {
    title: 'Ongoing engineering and maintenance',
    description: 'Monitor, support and improve integrations as APIs, data structures, business rules and operational priorities change.',
    icon: RefreshCw,
  },
] as const;

export function SystemsIntegrationCapabilityGrid() {
  return (
    <section
      className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8"
      aria-labelledby="systems-integration-capabilities-title"
    >
      <div className="mx-auto max-w-[1200px]">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            One connected delivery model
          </p>
          <h2
            id="systems-integration-capabilities-title"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Choose the right level of automation for each workflow
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Start with reliable system connections and clear business rules. Add AI-assisted
            steps only when they solve a genuine need, then support the resulting workflow through
            controlled ongoing engineering.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((capability) => {
            const Icon = capability.icon;
            return (
              <article key={capability.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{capability.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{capability.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
