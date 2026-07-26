import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import { shellClasses } from '../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';
import { HOW_IT_WORKS_STEPS, HOW_IT_WORKS_SERVICE_LINKS } from '../content/howItWorksPageContent';

export const HowItWorksPage = () => (
  <main className="min-h-screen bg-white text-brand-navy">
    <section className="border-b border-brand-border bg-brand-surface px-4 pb-14 pt-24 sm:px-6 lg:px-8">
      <div className={SITE_CONTAINER_CLASS}>
        <Link
          to="/"
          className="mb-8 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-brand-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
        <p className={shellClasses.sectionEyebrow}>Process & delivery</p>
        <h1 className={`mt-4 ${shellClasses.sectionHeading}`}>How Primewayz UK Works</h1>
        <p className={`mt-5 max-w-3xl ${shellClasses.sectionLead}`}>
          A practical path from understanding the current position through prioritisation, delivery
          and ongoing support where appropriate.
        </p>
      </div>
    </section>

    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className={SITE_CONTAINER_CLASS}>
        <ol className="grid gap-5 md:grid-cols-2">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <li key={step.number} className={shellClasses.sectionCard}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">
                Step {step.number}
              </p>
              <h2 className="mt-3 text-xl font-bold text-brand-navy">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-brand-navy">Useful next routes</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOW_IT_WORKS_SERVICE_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={`${shellClasses.sectionCard} transition hover:border-brand-blue/30`}
                >
                  <span className="font-bold text-brand-navy">{item.label}</span>
                  <span className="mt-2 block text-sm leading-6 text-slate-600">{item.description}</span>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-blue">
                    Continue
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 rounded-2xl border border-brand-border bg-brand-surface px-6 py-8">
          <h2 className="text-xl font-bold text-brand-navy">Ready to discuss priorities?</h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to={CANONICAL_ROUTES.digitalSystemsReview} className={shellClasses.btnHeroPrimary}>
              Request a free digital systems review
            </Link>
            <Link to={CANONICAL_ROUTES.contact} className={shellClasses.btnHeroSecondary}>
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </section>
  </main>
);
