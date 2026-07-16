import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { SDAAS_SEO } from '../../data/sdaas/commercialPage';
import { CapacityReassuranceStrip } from '../commercial/CapacityReassuranceStrip';
import { SdaasCapacityRequestForm } from './SdaasCapacityRequestForm';

export function SdaasCapacityRequestPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <title>{`Request Capacity Recommendation | ${SDAAS_SEO.title}`}</title>
      <meta
        name="description"
        content="Request a recommended monthly software development capacity plan from Primewayz UK."
      />
      <meta name="robots" content="noindex, follow" />

      <section className="bg-[#000A2D] px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <Link
            to={CANONICAL_ROUTES.softwareDevelopmentSubscription}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Software Development as a Subscription
          </Link>

          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-300">
            Capacity recommendation
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Request a Capacity Recommendation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
            Share a short overview of your system and workload. We will recommend whether monthly
            development capacity, a defined project or a discovery phase is the better starting point.
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[800px]">
          <CapacityReassuranceStrip />
          <SdaasCapacityRequestForm />
        </div>
      </section>
    </main>
  );
}
