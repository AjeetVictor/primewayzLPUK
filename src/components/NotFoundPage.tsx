import { Link } from 'react-router-dom';
import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';

export const NotFoundPage = () => (
  <main className="relative isolate overflow-hidden bg-slate-950 px-6 py-24 sm:py-32 lg:px-8">
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_65%)]"
    />

    <section
      aria-labelledby="not-found-title"
      className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-14 text-center shadow-2xl shadow-black/20 backdrop-blur sm:px-12 sm:py-20"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-400">
        Error 404
      </p>

      <h1
        id="not-found-title"
        className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl"
      >
        We couldn&apos;t find that page
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
        The address may be outdated, moved, or entered incorrectly. You can return to the
        homepage or continue exploring Primewayz UK services.
      </p>

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Return to homepage
        </Link>

        <Link
          to={CANONICAL_ROUTES.services}
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          Explore our services
        </Link>
      </div>
    </section>
  </main>
);

export default NotFoundPage;