import { PRICING_COMMERCIAL_POLICY } from '../../data/pricing/policy';

const boundaryItems = [
  { title: 'What consumes capacity', text: PRICING_COMMERCIAL_POLICY.capacityDefinition },
  { title: 'Changes and rework', text: PRICING_COMMERCIAL_POLICY.qaTreatment },
  { title: 'Additional capacity', text: PRICING_COMMERCIAL_POLICY.additionalCapacityPolicy },
  {
    title: 'Hosting and third-party dependencies',
    text: PRICING_COMMERCIAL_POLICY.thirdPartyCostPolicy,
  },
  { title: 'Access and client dependencies', text: PRICING_COMMERCIAL_POLICY.clientDelayPolicy },
  {
    title: 'Emergency and out-of-hours work',
    text: PRICING_COMMERCIAL_POLICY.emergencyWorkPolicy,
  },
] as const;

export function CommercialBoundarySummary() {
  return (
    <section aria-labelledby="commercial-boundaries-heading" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
            Commercial boundaries
          </p>
          <h2 id="commercial-boundaries-heading" className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Capacity, dependencies and urgent work stay explicit
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Planned checks and support activities are prioritised within the agreed capacity. They
            are not continuous surveillance or a guarantee of availability, security or immediate
            incident response.
          </p>
        </div>

        <dl className="mt-8 grid gap-5 md:grid-cols-2">
          {boundaryItems.map((item) => (
            <div key={item.title} className="rounded-2xl bg-slate-50 p-5">
              <dt className="font-bold text-slate-950">{item.title}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-600">{item.text}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
