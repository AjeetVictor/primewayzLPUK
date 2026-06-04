const deliveryHighlights = [
  {
    title: 'Flexible monthly capacity',
    label: 'Capacity control',
    image: '/images/feature-flexible-monthly-capacity.png',
    alt: 'Minimal visual showing monthly delivery capacity adjusting up and down based on changing priorities.',
    description:
      'Adjust delivery capacity up or down based on your roadmap, campaign needs, fixes, and current priorities.',
    outcome: 'Stay aligned with current workload.',
  },
  {
    title: 'Technical SEO foundation included',
    label: 'Search-ready basics',
    image: '/images/feature-technical-seo-foundation.png',
    alt: 'Minimal visual showing a website dashboard, search lens, checklist, and structured technical foundation signals.',
    description:
      'Keep metadata, page structure, speed checks, tracking improvements, and technical SEO hygiene part of ongoing delivery.',
    outcome: 'Keep SEO basics moving monthly.',
  },
  {
    title: 'Transparent add-ons',
    label: 'Commercial clarity',
    image: '/images/feature-transparent-addons.png',
    alt: 'Minimal visual showing connected add-ons, settings, analytics, hosting, and transparent service components.',
    description:
      'Keep Primewayz delivery fees separate from third-party costs such as hosting, domain, SSL, tools, or specialist services.',
    outcome: 'Know what is included and what is separate.',
  },
  {
    title: 'Move to maintenance anytime',
    label: 'Continuity without pressure',
    image: '/images/feature-maintenance-anytime.png',
    alt: 'Minimal visual showing active delivery moving through maintenance and returning to stable progress.',
    description:
      'Scale down when priorities slow, keep essential support running, and restart active delivery when new priorities return.',
    outcome: 'Pause intensity without losing continuity.',
  },
];

export const UKTrustStrip = () => (
  <section className="bg-white py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
              Built for predictable, flexible delivery
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-zinc-950 sm:text-4xl">
              A clearer monthly support model for UK SME teams
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              Keep digital work moving without restarting projects every time priorities change.
              Scale capacity, keep SEO basics in view, separate vendor costs, and move into
              maintenance when active delivery slows.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/15">
            <p className="text-sm font-semibold text-blue-200">
              What this means in practice
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                'Adjust monthly delivery effort',
                'Keep technical foundations moving',
                'Separate delivery and vendor costs',
                'Pause intensity without losing continuity',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-black text-white">
                    ✓
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {deliveryHighlights.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-zinc-50/70 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-blue-950/10"
            >
              <div className="aspect-[16/9] overflow-hidden border-b border-zinc-200 bg-white p-4">
                <img
                  src={item.image}
                  alt={item.alt}
                  className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>

              <div className="p-6">
                <div className="mb-4 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
                  {item.label}
                </div>

                <h3 className="text-xl font-black tracking-tight text-zinc-950">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-zinc-600">
                  {item.description}
                </p>

                <div className="mt-5 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800">
                  {item.outcome}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  </section>
);
