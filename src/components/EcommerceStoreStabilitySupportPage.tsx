import { Link } from 'react-router-dom';

const scopeItems = [
  'Product page updates',,
  'Campaign landing pages',,
  'Checkout flow checks',,
  'GA4 conversion tracking',,
  'Technical SEO checks',,
  'Speed and mobile checks',,
  'Backups and monthly support',
];

const resultItems = [
  'More reliable product and catalogue pages',,
  'Smoother checkout checks during campaigns',,
  'Cleaner conversion and campaign tracking',,
  'Faster promotional and offer updates',,
  'Monthly stability checks for store confidence',
];

const bestForItems = [
  'Small online stores',,
  'Independent boutiques',,
  'Specialist product sellers',,
  'Subscription stores',,
  'Catalogue-led e-commerce businesses',
];

export const EcommerceStoreStabilitySupportPage = () => (
  <main className="min-h-screen bg-white text-slate-950">
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-white via-sky-50/70 to-white">
      <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <Link
          to="/#success-stories"
          className="inline-flex items-center text-sm font-semibold text-slate-600 transition hover:text-sky-700"
        >
          ← Back to success stories
        </Link>

        <div className="grid items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-sky-700 shadow-sm">
              UK E-commerce SMEs
            </div>

            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              E-commerce Store Stability & Support for UK SMEs
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Primewayz UK supports small online stores, boutiques, specialist sellers, subscription stores, and catalogue-led businesses with stable product pages, reliable checkout journeys, clean campaign tracking, fast offer updates, and monthly website support.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/#contact"
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-900/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Discuss your UK requirements
              </a>
              <a
                href="/#pricing"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700"
              >
                View support plans
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/10">
              <img
                src="/images/ecommerce-store-stability-support.webp"
                alt="E-commerce store stability and support dashboard showing product page reliability, checkout flow checks, campaign tracking, maintenance updates, and support for UK online stores."
                className="aspect-[16/10] w-full rounded-[1.5rem] object-cover"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">What we clean up</h2>
          <ul className="mt-6 space-y-4">
            {scopeItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-black text-sky-700">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-7 text-white shadow-sm">
          <h2 className="text-xl font-black">Expected outcome</h2>
          <ul className="mt-6 space-y-4">
            {resultItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-200">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 text-xs font-black text-white">
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-sky-50 p-7 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">Best fit for</h2>
          <ul className="mt-6 space-y-4">
            {bestForItems.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-sky-700">
                  •
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 rounded-[2rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-950 p-8 text-white shadow-xl shadow-slate-900/10 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-200">Primewayz UK support sprint</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
              Stable stores help teams focus on selling, not fixing.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Start with a focused cleanup sprint, then continue with monthly support for improvements, reporting, tracking checks, and practical website updates.
            </p>
          </div>

          <a
            href="/#contact"
            className="inline-flex justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-sky-50"
          >
            Book a UK discovery call
          </a>
        </div>
      </div>
    </section>
  </main>
);
