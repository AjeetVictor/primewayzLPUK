import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { CommercialSectionVisual } from '../commercial/CommercialSectionVisual';
import { EntityTermLink } from '../commercial/EntityTermLink';
import { SdaasFaqAccordion } from '../sdaas/SdaasFaqAccordion';
import {
  buyerEvaluationChecklist,
  hybridApproachSteps,
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_COMMERCIAL_IMAGES,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_PAGE_PATH,
  SDAAS_PILLAR_GUIDE_HREF,
  SDAAS_USE_CASES_DIRECT_ANSWER,
  SDAAS_USE_CASES_DIRECT_ANSWER_FOLLOW,
  SDAAS_USE_CASES_PATH,
  SDAAS_USE_CASES_SEO,
  subscriptionUseCases,
  unsuitableSituations,
  USE_CASES_GEO_STATEMENTS,
  useCaseMatrixRows,
  useCasesFaqs,
  useCasesRelatedBlogLinks,
  useCasesRelatedLiveLinks,
  type SubscriptionUseCase,
} from '../../data/sdaas/useCasesArticle';
import { useCommercialSectionView } from '../../hooks/useCommercialSectionView';
import { trackSdaasEvent } from '../../lib/sdaasAnalytics';
import { cn } from '../../utils/cn';

function formatDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function UseCasesSection({
  id,
  sectionKey,
  sectionName,
  title,
  children,
  className,
  useCaseId,
  useCaseName,
}: {
  id?: string;
  sectionKey: string;
  sectionName: string;
  title: string;
  children: ReactNode;
  className?: string;
  useCaseId?: string;
  useCaseName?: string;
}) {
  const ref = useCommercialSectionView(sectionKey, {
    eventName: 'sdaas_use_cases_section_view',
    sectionName,
    contentCluster: 'sdaas',
  });

  return (
    <section
      id={id}
      ref={ref}
      data-use-case-id={useCaseId}
      data-use-case-name={useCaseName}
      className={cn('scroll-mt-24 border-t border-slate-100 py-12 sm:py-14', className)}
    >
      <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <div className="mt-6 space-y-5 text-base leading-8 text-slate-700">{children}</div>
    </section>
  );
}

function TrackedLink({
  to,
  children,
  className,
  location,
  label,
  eventName = 'sdaas_use_cases_service_click',
  useCaseId,
  useCaseName,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  location: string;
  label: string;
  eventName?:
    | 'sdaas_use_cases_cta_click'
    | 'sdaas_use_cases_service_click'
    | 'sdaas_use_cases_pillar_click'
    | 'sdaas_use_cases_comparison_click'
    | 'sdaas_use_cases_related_article_click';
  useCaseId?: string;
  useCaseName?: string;
}) {
  return (
    <Link
      to={to}
      className={className}
      onClick={() =>
        trackSdaasEvent(eventName, {
          cta_location: location,
          cta_label: label,
          destination: to,
          source_page: SDAAS_USE_CASES_PATH,
          link_context: location,
          content_cluster: 'sdaas',
          content_type: 'use_cases_article',
          use_case_id: useCaseId,
          use_case_name: useCaseName,
        })
      }
    >
      {children}
    </Link>
  );
}

function UseCaseBlock({ useCase }: { useCase: SubscriptionUseCase }) {
  return (
    <UseCasesSection
      id={useCase.id.replace(/_/g, '-')}
      sectionKey={`use_case_${useCase.number}`}
      sectionName={useCase.title}
      title={`${useCase.number}. ${useCase.title}`}
      useCaseId={useCase.id}
      useCaseName={useCase.title}
    >
      <p>
        <span className="font-semibold text-slate-900">Business situation.</span> {useCase.situation}
      </p>

      <div>
        <h3 className="text-base font-bold text-slate-950">Typical recurring work</h3>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {useCase.recurringWork.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-base font-bold text-slate-950">Why monthly capacity may fit</h3>
        <ul className="mt-3 space-y-2">
          {useCase.whySubscription.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700 sm:text-base">
              <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {useCase.monthlyPriorities ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
          <h3 className="text-base font-bold text-slate-950">Illustrative monthly priorities</h3>
          <ol className="mt-3 space-y-2">
            {useCase.monthlyPriorities.map((item, index) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
                <span className="font-semibold text-slate-900">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {useCase.boundaryNote ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
          {useCase.boundaryNote}
        </p>
      ) : null}

      <div>
        <h3 className="text-base font-bold text-slate-950">When another model may be better</h3>
        <ul className="mt-3 space-y-2">
          {useCase.whenOtherModel.map((item) => (
            <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {useCase.relatedLink ? (
        <p className="text-sm leading-7 text-slate-600">
          Related:{' '}
          <TrackedLink
            to={useCase.relatedLink.href}
            location={`use_case_${useCase.id}`}
            label={useCase.relatedLink.label}
            useCaseId={useCase.id}
            useCaseName={useCase.title}
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {useCase.relatedLink.label}
          </TrackedLink>
        </p>
      ) : null}
    </UseCasesSection>
  );
}

export function SoftwareDevelopmentSubscriptionUseCasesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <article className="mx-auto max-w-[760px] px-4 pb-20 pt-24 sm:px-6 lg:max-w-[820px]">
        <nav className="mb-8 text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="transition hover:text-slate-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li>
              <Link to={CANONICAL_ROUTES.blog} className="transition hover:text-slate-900">
                Insights
              </Link>
            </li>
            <li aria-hidden="true" className="text-slate-300">
              /
            </li>
            <li className="text-slate-900">Subscription use cases</li>
          </ol>
        </nav>

        <header className="border-b border-slate-100 pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {SDAAS_USE_CASES_SEO.category}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            {SDAAS_USE_CASES_SEO.h1}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{SDAAS_USE_CASES_SEO.standfirst}</p>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" aria-hidden />
              {SDAAS_USE_CASES_SEO.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={SDAAS_USE_CASES_SEO.datePublished}>
                {formatDisplayDate(SDAAS_USE_CASES_SEO.datePublished)}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {SDAAS_USE_CASES_SEO.readTime}
            </span>
          </div>
        </header>

        <div className="prose-sdaas mt-10 space-y-5 text-base leading-8 text-slate-700">
          <p>
            Many businesses do not need one final software project. They need a sequence of connected
            improvements: features, fixes, integrations, reporting changes and operational refinements
            that continue over time.
          </p>
          <p>
            A recurring need does not mean unlimited work. Monthly capacity remains finite,
            prioritisation is essential, and the right model still depends on work pattern, scope
            certainty and internal capability.
          </p>

          <aside className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 text-sm leading-7 text-slate-800">
            <p>
              <span className="font-semibold text-slate-950">New to the model?</span>{' '}
              <TrackedLink
                to={SDAAS_PILLAR_GUIDE_HREF}
                location="use_cases_intro_pillar"
                label="Read the complete guide to subscription-based software development"
                eventName="sdaas_use_cases_pillar_click"
                className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
              >
                Read the complete guide to subscription-based software development
              </TrackedLink>
              .
            </p>
            <p>
              <span className="font-semibold text-slate-950">
                Comparing monthly capacity with a defined project?
              </span>{' '}
              <TrackedLink
                to={SDAAS_COMPARISON_VS_FIXED_PRICE_HREF}
                location="use_cases_intro_comparison"
                label="Software development subscription vs fixed-price"
                eventName="sdaas_use_cases_comparison_click"
                className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
              >
                Compare software development subscription vs fixed-price
              </TrackedLink>
              .
            </p>
          </aside>
        </div>

        <UseCasesSection
          id="suitable-work"
          sectionKey="direct_answer"
          sectionName="What work is suitable"
          title="What Work Is Suitable for a Software Development Subscription?"
        >
          <p className="text-lg font-medium leading-8 text-slate-900">
            {SDAAS_USE_CASES_DIRECT_ANSWER}
          </p>
          <p>{SDAAS_USE_CASES_DIRECT_ANSWER_FOLLOW}</p>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            {USE_CASES_GEO_STATEMENTS[0]}
          </p>
        </UseCasesSection>

        <UseCasesSection
          sectionKey="recognising_pattern"
          sectionName="How to recognise subscription-suitable work"
          title="How to Recognise Subscription-Suitable Development Work"
        >
          <p>
            The model is more likely to fit when work continues month after month, priorities can
            change, the product or system is already in use, requirements emerge through feedback,
            several small and medium items form one backlog, recurring integrations or operational
            changes are expected, continuity matters, and the business does not yet require a complete
            internal team.
          </p>
          <p>
            Recurring work should still have clear business priorities, defined acceptance criteria,
            visible <EntityTermLink term="monthlyDeliveryCapacity" />, regular stakeholder decisions,{' '}
            <EntityTermLink term="qa" /> and release discipline, and measurable outcomes.
          </p>
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.scatteredToStructured}
            caption="Illustrative view of moving from scattered software requests into a structured shared backlog."
            alignment="wide"
            className="max-w-none"
          />
          <p className="text-lg font-medium leading-8 text-slate-900">{USE_CASES_GEO_STATEMENTS[4]}</p>
        </UseCasesSection>

        {subscriptionUseCases.map((useCase, index) => (
          <div key={useCase.id}>
            <UseCaseBlock useCase={useCase} />
            {index === 1 ? (
              <div className="border-t border-slate-100 py-8">
                <CommercialSectionVisual
                  image={SDAAS_COMMERCIAL_IMAGES.monthlyCapacity}
                  caption="Illustrative example of how finite monthly development capacity may be allocated across prioritised backlog items."
                  alignment="wide"
                  className="max-w-none"
                />
              </div>
            ) : null}
          </div>
        ))}

        <UseCasesSection
          id="comparison-matrix"
          sectionKey="comparison_matrix"
          sectionName="Comparing the use cases"
          title="Comparing the Use Cases"
        >
          <p>
            The matrix summarises typical work patterns. Critical conclusions also appear in the
            surrounding sections: recurring work favours subscription; stable one-off scope favours
            fixed-price; unknown systems usually need discovery first.
          </p>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 sm:hidden">
              Swipe sideways to compare all columns
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-left text-sm">
                <caption className="sr-only">
                  Comparison of software development subscription use cases and alternative models
                </caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                      Use case
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                      Typical work pattern
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                      Why subscription may fit
                    </th>
                    <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                      Alternative to consider
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {useCaseMatrixRows.map((row) => (
                    <tr key={row.useCase} className="border-b border-slate-100 align-top last:border-0">
                      <th scope="row" className="px-4 py-4 font-semibold text-slate-900 sm:px-5">
                        {row.useCase}
                      </th>
                      <td className="px-4 py-4 text-slate-600 sm:px-5">{row.workPattern}</td>
                      <td className="px-4 py-4 text-slate-600 sm:px-5">{row.whySubscription}</td>
                      <td className="px-4 py-4 text-slate-600 sm:px-5">{row.alternative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </UseCasesSection>

        <UseCasesSection
          sectionKey="not_suitable"
          sectionName="When subscription may not be right"
          title="When a Software Development Subscription May Not Be the Right Choice"
        >
          <ul className="space-y-3">
            {unsuitableSituations.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
              >
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-lg font-medium leading-8 text-slate-900">{USE_CASES_GEO_STATEMENTS[5]}</p>
        </UseCasesSection>

        <UseCasesSection
          sectionKey="hybrid_alternatives"
          sectionName="Discovery fixed-price or hybrid"
          title="When to Use Discovery, Fixed-Price or a Hybrid Approach"
        >
          <p>
            <strong className="font-semibold text-slate-950">Discovery first</strong> when requirements,
            code quality, dependencies, integration risk or architecture decisions are unclear.
          </p>
          <p>
            <strong className="font-semibold text-slate-950">Fixed-price first</strong> for a stable
            defined build, isolated migration, clear API integration or tightly specified first
            release.
          </p>
          <p>
            <strong className="font-semibold text-slate-950">Subscription afterwards</strong> for ongoing
            enhancements, post-launch fixes, integrations, operational refinement and recurring product
            development.
          </p>
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.deliveryProcess}
            caption="Illustrative monthly delivery process from requirement through development, QA and release."
            alignment="wide"
            className="max-w-none"
          />
          <p>
            Different stages of the same product may require different commercial models. A practical
            hybrid sequence:
          </p>
          <ol className="mt-2 space-y-3">
            {hybridApproachSteps.map((step, index) => (
              <li key={step.title} className="flex gap-3 text-sm leading-7 text-slate-700 sm:text-base">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span>
                  <strong className="font-semibold text-slate-950">{step.title}.</strong> {step.text}
                </span>
              </li>
            ))}
          </ol>
          <p>
            For the fuller decision framework, read{' '}
            <TrackedLink
              to={SDAAS_COMPARISON_VS_FIXED_PRICE_HREF}
              location="use_cases_hybrid_comparison"
              label="development subscription vs fixed-price software development"
              eventName="sdaas_use_cases_comparison_click"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              development subscription vs fixed-price software development
            </TrackedLink>
            .
          </p>
        </UseCasesSection>

        <UseCasesSection
          id="buyer-checklist"
          sectionKey="buyer_checklist"
          sectionName="Buyer evaluation checklist"
          title="Questions to Ask Before Choosing a Development Subscription"
        >
          <ol className="space-y-3" role="list">
            {buyerEvaluationChecklist.map((item, index) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
              >
                <span className="font-bold text-slate-900">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            A credible provider should be willing to explain when a subscription is not the right fit.
          </p>
        </UseCasesSection>

        <UseCasesSection
          id="faq"
          sectionKey="faq"
          sectionName="Frequently asked questions"
          title="Frequently Asked Questions"
        >
          <SdaasFaqAccordion
            faqs={useCasesFaqs}
            eventName="sdaas_use_cases_faq_open"
            contentCluster="sdaas"
          />
        </UseCasesSection>

        <UseCasesSection
          sectionKey="conclusion"
          sectionName="Choose monthly capacity for the right work"
          title="Choose Monthly Capacity for the Right Kind of Work"
        >
          <p>
            A subscription suits ongoing and evolving work. Fixed-price suits stable and defined work.
            Discovery suits unclear or technically risky work. Internal hiring suits consistently large
            strategic demand. Hybrid delivery often fits different stages of the same product.
          </p>
          <ol className="space-y-4">
            <li className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-950">1. Understand the category</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                <TrackedLink
                  to={SDAAS_PILLAR_GUIDE_HREF}
                  location="use_cases_conclusion_pillar"
                  label="Subscription-Based Software Development Guide"
                  eventName="sdaas_use_cases_pillar_click"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Subscription-Based Software Development Guide
                </TrackedLink>
              </p>
            </li>
            <li className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-950">
                2. Compare subscription with fixed-price
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                <TrackedLink
                  to={SDAAS_COMPARISON_VS_FIXED_PRICE_HREF}
                  location="use_cases_conclusion_comparison"
                  label="Software development subscription vs fixed-price"
                  eventName="sdaas_use_cases_comparison_click"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Software development subscription vs fixed-price
                </TrackedLink>
              </p>
            </li>
            <li className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-950">3. Explore monthly delivery capacity</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Continue to{' '}
                <TrackedLink
                  to={SDAAS_PAGE_PATH}
                  location="use_cases_conclusion_service"
                  label="Software Development as a Subscription"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Software Development as a Subscription
                </TrackedLink>
                .
              </p>
            </li>
            <li className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="text-base font-bold text-slate-950">Request a capacity recommendation</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Tell us what is already in your backlog. Primewayz UK will recommend whether monthly
                capacity, a defined project or a discovery phase is the more appropriate route.
              </p>
              <TrackedLink
                to={SDAAS_CAPACITY_REQUEST_PATH}
                location="use_cases_conclusion"
                label="Request a Capacity Recommendation"
                eventName="sdaas_use_cases_cta_click"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Request a Capacity Recommendation
              </TrackedLink>
            </li>
          </ol>
        </UseCasesSection>

        <section className="border-t border-slate-100 py-12" aria-labelledby="related-content-heading">
          <h2 id="related-content-heading" className="text-2xl font-bold tracking-tight text-slate-950">
            Related content
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {useCasesRelatedLiveLinks.map((link) => {
              const eventName =
                link.href === SDAAS_PILLAR_GUIDE_HREF
                  ? 'sdaas_use_cases_pillar_click'
                  : link.href === SDAAS_COMPARISON_VS_FIXED_PRICE_HREF
                    ? 'sdaas_use_cases_comparison_click'
                    : 'sdaas_use_cases_service_click';
              return (
                <TrackedLink
                  key={link.href}
                  to={link.href}
                  location="use_cases_related"
                  label={link.title}
                  eventName={eventName}
                  className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
                >
                  <h3 className="font-bold text-slate-950">{link.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
                </TrackedLink>
              );
            })}
            {useCasesRelatedBlogLinks.map((link) => (
              <TrackedLink
                key={link.href}
                to={link.href}
                location="use_cases_related_blog"
                label={link.title}
                eventName="sdaas_use_cases_related_article_click"
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              >
                <h3 className="font-bold text-slate-950">{link.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
              </TrackedLink>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
