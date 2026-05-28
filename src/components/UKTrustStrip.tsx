import { CheckCircle2, Clock, PoundSterling, ShieldCheck, Users, Wrench } from 'lucide-react';

const indicators = [
  {
    icon: Users,
    title: 'Built for UK SMEs',
    description: 'Designed around small and growing UK businesses that need dependable digital delivery.',
  },
  {
    icon: PoundSterling,
    title: 'GBP-ready plans',
    description: 'Subscription pricing and planning conversations structured for UK business budgets.',
  },
  {
    icon: Clock,
    title: 'UK working-hours overlap',
    description: 'Discovery, reviews, and delivery check-ins planned around convenient UK time windows.',
  },
  {
    icon: ShieldCheck,
    title: 'Transparent add-ons',
    description: 'Hosting, domains, paid tools, gateways, and third-party costs are discussed clearly upfront.',
  },
  {
    icon: Wrench,
    title: 'Remote delivery support',
    description: 'Websites, CRM, SEO foundations, automation, integrations, and ongoing improvements.',
  },
  {
    icon: CheckCircle2,
    title: 'UK discovery calls',
    description: 'Start with a focused call to confirm fit, priorities, risks, and the right delivery path.',
  },
];

export function UKTrustStrip() {
  return (
    <section className="bg-white border-y border-slate-100" aria-labelledby="uk-trust-strip-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col gap-3 text-center mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            UK-focused delivery indicators
          </p>
          <h2 id="uk-trust-strip-heading" className="text-2xl md:text-3xl font-bold tracking-tight text-slate-950">
            Built for UK SMEs that need reliable digital execution
          </h2>
          <p className="max-w-3xl mx-auto text-sm md:text-base leading-7 text-slate-600">
            Primewayz UK supports UK-facing businesses with practical subscription-based software delivery,
            website improvements, CRM support, automation, SEO foundations, and ongoing digital maintenance.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {indicators.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-7 text-center text-xs leading-6 text-slate-500">
          UK-focused positioning only. We do not claim a UK office address unless formally added later.
        </p>
      </div>
    </section>
  );
}
