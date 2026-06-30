const supportValues = [
  {
    title: 'Monthly clarity',
    label: 'Planning clarity',
    description:
      'Know what to improve next across your website, CRM, forms, SEO foundations, and operational workflows without turning every need into a separate project.',
  },
  {
    title: 'Predictable progress',
    label: 'Steady delivery',
    description:
      'Move forward through practical monthly releases instead of waiting for large projects, urgent fixes, or multiple disconnected vendors.',
  },
  {
    title: 'Lower operational friction',
    label: 'Operational stability',
    description:
      'Reduce missed follow-ups, outdated pages, tracking blind spots, and maintenance gaps that quietly affect enquiries, campaigns, and daily delivery.',
  },
];

export const Testimonials = () => (
  <section className="bg-zinc-50 py-24">
    <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
          Why UK SME teams choose{' '}
          <span className="italic text-blue-800">practical ongoing support</span>
        </h2>
        <p className="mt-5 text-lg leading-8 text-zinc-600">
          Focused monthly delivery for businesses that need dependable progress across websites,
          CRM workflows, SEO foundations, and digital operations.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-[1200px] gap-6 md:grid-cols-3">
        {supportValues.map((item, index) => (
          <article
            key={item.title}
            className="group relative overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/10"
          >
            <div className="absolute right-6 top-6 text-7xl font-black leading-none text-blue-50 transition group-hover:text-blue-100">
              0{index + 1}
            </div>

            <div className="relative">
              <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-xl font-black text-blue-700 ring-1 ring-blue-100">
                ✓
              </div>

              <h3 className="text-2xl font-black tracking-tight text-zinc-950">
                {item.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-zinc-600">
                {item.description}
              </p>

              <div className="mt-7 inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                {item.label}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
