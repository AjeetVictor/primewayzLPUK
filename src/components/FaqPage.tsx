import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { CANONICAL_ROUTES } from '../constants/canonicalRoutes';
import { shellClasses } from '../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';
import { FAQ_GROUPS } from '../content/faqPageContent';

export const FaqPage = () => (
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
        <p className={shellClasses.sectionEyebrow}>Primewayz UK services</p>
        <h1 className={`mt-4 ${shellClasses.sectionHeading}`}>Frequently Asked Questions</h1>
        <p className={`mt-5 max-w-3xl ${shellClasses.sectionLead}`}>
          Clear answers about starting an engagement, the Digital Systems Review, website audit,
          monthly delivery, ownership, maintenance and confidentiality.
        </p>
      </div>
    </section>

    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className={`${SITE_CONTAINER_CLASS} space-y-12`}>
        {FAQ_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`faq-group-${group.id}`}>
            <h2 id={`faq-group-${group.id}`} className="text-2xl font-bold tracking-tight text-brand-navy">
              {group.title}
            </h2>
            <div className="mt-6 space-y-4">
              {group.items.map((item) => (
                <article key={item.question} className={shellClasses.sectionCard}>
                  <h3 className="text-lg font-bold text-brand-navy">{item.question}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">{item.answer}</p>
                </article>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl border border-brand-border bg-brand-surface px-6 py-8">
          <h2 className="text-xl font-bold text-brand-navy">Still unsure where to start?</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Request a free Digital Systems Review, explore engagement options, or contact the team
            with your current priority.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to={CANONICAL_ROUTES.digitalSystemsReview} className={shellClasses.btnHeroPrimary}>
              Request a free digital systems review
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link to={CANONICAL_ROUTES.pricing} className={shellClasses.btnHeroSecondary}>
              View pricing
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
