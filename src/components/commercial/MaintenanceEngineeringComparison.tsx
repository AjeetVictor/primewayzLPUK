import { CheckCircle2 } from 'lucide-react';
import { getPricingPlanBySlug, PRICING_PLANS } from '../../data/pricing/registry';

const maintenancePlan = (() => {
  const plan = getPricingPlanBySlug('maintenance-mode');
  if (!plan) {
    throw new Error('Maintenance Mode must exist in the pricing registry.');
  }
  return plan;
})();
const activePlans = PRICING_PLANS.filter(
  (plan) => plan.active && plan.engagementType === 'recurring_delivery',
);

if (activePlans.length === 0) {
  throw new Error('Recurring delivery plans must exist in the pricing registry.');
}

function PlanPrice({ price, billingLabel, capacityLabel }: {
  price: string;
  billingLabel: string;
  capacityLabel: string;
}) {
  return (
    <p className="mt-3 text-sm font-semibold text-slate-700">
      <span className="text-lg font-black text-slate-950">{price}</span>
      {billingLabel} · {capacityLabel}
    </p>
  );
}

export function MaintenanceEngineeringComparison({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="maintenance-engineering-comparison-heading"
      className={compact ? 'py-4' : 'bg-slate-50 px-4 py-20 sm:px-6 lg:px-8'}
    >
      <div className={compact ? '' : 'mx-auto max-w-[1200px]'}>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Choose the right delivery model
          </p>
          <h2
            id="maintenance-engineering-comparison-heading"
            className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
          >
            Maintenance Mode or active product engineering?
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Discovery determines whether a requirement fits stable-product maintenance, active
            monthly capacity or separately scoped work. Neither model provides unlimited delivery.
          </p>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
              Stable-product continuity
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">{maintenancePlan.name}</h3>
            <PlanPrice
              price={maintenancePlan.displayedPrice}
              billingLabel={maintenancePlan.billingLabel ?? ''}
              capacityLabel={maintenancePlan.capacityLabel ?? ''}
            />
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {maintenancePlan.shortDescription}
            </p>
            <ul className="mt-5 space-y-3">
              {maintenancePlan.inclusions.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  {item}
                </li>
              ))}
              <li className="flex gap-2 text-sm leading-6 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                Agreed minor improvements that fit the available maintenance capacity
              </li>
            </ul>
            <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-800">
              {maintenancePlan.exclusions.join('. ')}.
            </p>
            {maintenancePlan.importantBoundary ? (
              <p className="mt-4 text-xs leading-5 text-slate-500">
                {maintenancePlan.importantBoundary}
              </p>
            ) : null}
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Prioritised roadmap delivery
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-950">Active Product Engineering</h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Recurring delivery capacity supports prioritised enhancements, feature delivery,
              integrations and engineering backlogs through a shared delivery rhythm.
            </p>
            <div className="mt-5 space-y-3">
              {activePlans.map((plan) => (
                <div key={plan.slug} className="rounded-2xl border border-slate-200 px-4 py-3">
                  <p className="font-bold text-slate-950">{plan.name}</p>
                  <PlanPrice
                    price={plan.displayedPrice}
                    billingLabel={plan.billingLabel ?? ''}
                    capacityLabel={plan.capacityLabel ?? ''}
                  />
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Priorities are clarified and estimated against finite capacity. Requirements that do
              not fit the agreed plan may need additional approved capacity, an initial scoped phase
              or a custom proposal.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
