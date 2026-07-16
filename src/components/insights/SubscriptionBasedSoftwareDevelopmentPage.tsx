import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { CommercialSectionVisual } from '../commercial/CommercialSectionVisual';
import { EntityTermLink } from '../commercial/EntityTermLink';
import { SdaasFaqAccordion } from '../sdaas/SdaasFaqAccordion';
import { SDAAS_COMMERCIAL_IMAGES } from '../../data/sdaas/images';
import {
  benefits,
  decisionFit,
  developmentProcessSteps,
  limitations,
  pillarFaqs,
  pricingModels,
  providerChecklist,
  relatedBlogLinks,
  relatedLiveLinks,
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_PAGE_PATH,
  SDAAS_PILLAR_DIRECT_ANSWER,
  SDAAS_PILLAR_PATH,
  SDAAS_PILLAR_SEO,
  subscriptionSoftwareExamples,
  twoMeaningsRows,
  useCases,
  vsFixedPriceRows,
  vsHiringPoints,
} from '../../data/sdaas/pillarArticle';
import { useCommercialSectionView } from '../../hooks/useCommercialSectionView';
import { trackSdaasEvent } from '../../lib/sdaasAnalytics';
import { cn } from '../../utils/cn';

function formatPillarDisplayDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function PillarSection({
  id,
  sectionKey,
  sectionName,
  title,
  children,
  className,
}: {
  id?: string;
  sectionKey: string;
  sectionName: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useCommercialSectionView(sectionKey, {
    eventName: 'sdaas_pillar_section_view',
    sectionName,
    contentCluster: 'sdaas',
  });

  return (
    <section
      id={id}
      ref={ref}
      className={cn('scroll-mt-24 border-t border-slate-100 py-12 sm:py-14', className)}
    >
      <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
      <div className="mt-6 space-y-5 text-base leading-8 text-slate-700">{children}</div>
    </section>
  );
}

function ComparisonTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: [string, string, string, string, string] | [string, string, string];
  rows: ReadonlyArray<Record<string, string>>;
}) {
  const keys = Object.keys(rows[0] || {});
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              {headers.map((header) => (
                <th key={header} scope="col" className="px-4 py-3 font-semibold sm:px-5">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={Object.values(row).join('|')} className="border-b border-slate-100 align-top last:border-0">
                {keys.map((key, index) =>
                  index === 0 ? (
                    <th
                      key={key}
                      scope="row"
                      className="px-4 py-4 font-semibold text-slate-900 sm:px-5"
                    >
                      {row[key]}
                    </th>
                  ) : (
                    <td key={key} className="px-4 py-4 text-slate-600 sm:px-5">
                      {row[key]}
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrackedServiceLink({
  to,
  children,
  className,
  location,
  label,
  eventName = 'sdaas_pillar_service_click',
}: {
  to: string;
  children: ReactNode;
  className?: string;
  location: string;
  label: string;
  eventName?: 'sdaas_pillar_service_click' | 'sdaas_pillar_cta_click' | 'sdaas_pillar_related_article_click';
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
          source_page: SDAAS_PILLAR_PATH,
          link_context: location,
          content_cluster: 'sdaas',
        })
      }
    >
      {children}
    </Link>
  );
}

export function SubscriptionBasedSoftwareDevelopmentPage() {
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
            <li className="text-slate-900">Subscription-based software development</li>
          </ol>
        </nav>

        <header className="border-b border-slate-100 pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {SDAAS_PILLAR_SEO.category}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            {SDAAS_PILLAR_SEO.h1}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{SDAAS_PILLAR_SEO.standfirst}</p>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" aria-hidden />
              {SDAAS_PILLAR_SEO.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={SDAAS_PILLAR_SEO.datePublished}>
                {formatPillarDisplayDate(SDAAS_PILLAR_SEO.datePublished)}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {SDAAS_PILLAR_SEO.readTime}
            </span>
          </div>
        </header>

        <div className="prose-sdaas mt-10 space-y-5 text-base leading-8 text-slate-700">
          <p>
            Subscription-based software development is often used to describe two different ideas. The
            first is building software that customers access through recurring payments, commonly
            associated with SaaS products. The second is purchasing ongoing development capacity through
            a recurring monthly engagement.
          </p>
          <p>
            This guide covers how subscription software models work, common examples, how development
            subscriptions work, when each approach is suitable, and what buyers should evaluate before
            choosing a provider.
          </p>

          <aside className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 text-sm leading-7 text-slate-800">
            <p className="font-semibold text-slate-950">Looking for ongoing monthly development support?</p>
            <p className="mt-1">
              See{' '}
              <TrackedServiceLink
                to={SDAAS_PAGE_PATH}
                location="pillar_intro"
                label="Software Development as a Subscription for UK Businesses"
                className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
              >
                Software Development as a Subscription for UK Businesses
              </TrackedServiceLink>
              .
            </p>
          </aside>
        </div>

        <PillarSection
          id="what-is-subscription-based-software-development"
          sectionKey="definition"
          sectionName="What is subscription-based software development"
          title="What Is Subscription-Based Software Development?"
        >
          <p className="text-lg font-medium leading-8 text-slate-900">{SDAAS_PILLAR_DIRECT_ANSWER}</p>
          <p>
            In the first meaning, a business builds and sells subscription software—products customers
            renew to keep using. In the second meaning, a business buys recurring software delivery
            capacity so features, integrations, fixes and quality work can continue without starting a
            new project for every request.
          </p>
        </PillarSection>

        <PillarSection
          sectionKey="two_meanings"
          sectionName="The two meanings"
          title="The Two Meanings of Subscription-Based Software Development"
        >
          <ComparisonTable
            caption="Comparison of subscription software and development subscription models"
            headers={['Model', 'What is subscribed to?', 'Who pays?', 'Typical purpose', 'Example']}
            rows={twoMeaningsRows.map((row) => ({
              model: row.model,
              subscribedTo: row.subscribedTo,
              whoPays: row.whoPays,
              purpose: row.purpose,
              example: row.example,
            }))}
          />
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            One model monetises software through subscriptions. The other purchases software delivery
            through a subscription.
          </p>
        </PillarSection>

        <PillarSection
          sectionKey="business_models"
          sectionName="Subscription software business models"
          title="How Subscription Software Business Models Work"
        >
          <p>
            Subscription software—often delivered as SaaS—charges customers for ongoing access rather
            than a one-time licence alone. Pricing design affects product packaging, plan management and
            the engineering required behind renewals, upgrades and cancellations.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {pricingModels.map((model) => (
              <article key={model.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <h3 className="text-base font-bold text-slate-950">{model.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{model.meaning}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-800">Commonly used:</span> {model.used}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-slate-800">Consideration:</span>{' '}
                  {model.consideration}
                </p>
              </article>
            ))}
          </div>
          <p>
            If you are building a subscription product rather than buying delivery capacity,{' '}
            <TrackedServiceLink
              to={CANONICAL_ROUTES.services}
              location="pillar_saas_models"
              label="Explore Primewayz UK software development services"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              explore Primewayz UK software development services
            </TrackedServiceLink>
            . Ongoing product evolution after launch may still use a development subscription once the
            first release is live.
          </p>
        </PillarSection>

        <PillarSection
          sectionKey="examples"
          sectionName="Examples of subscription-based software"
          title="Examples of Subscription-Based Software"
        >
          <p>
            Subscription-based software appears across almost every business function. The categories
            below matter more than brand lists because they show the recurring user need and the
            capabilities usually required behind the product.
          </p>
          <div className="space-y-4">
            {subscriptionSoftwareExamples.map((example) => (
              <article key={example.category} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-base font-bold text-slate-950">{example.category}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>
                    <span className="font-semibold text-slate-800">Recurring need:</span>{' '}
                    {example.recurringNeed}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Subscription typically gives:</span>{' '}
                    {example.access}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Capabilities behind the scenes:</span>{' '}
                    {example.capabilities}
                  </li>
                </ul>
              </article>
            ))}
          </div>
          <p>
            Across these categories, recurring products often need authentication, recurring billing,
            access control, plan management, usage tracking, notifications, reporting, integrations, and
            reliable cancellation or renewal handling.
          </p>
        </PillarSection>

        <PillarSection
          id="software-development-as-a-subscription"
          sectionKey="sdaas"
          sectionName="What is Software Development as a Subscription"
          title="What Is Software Development as a Subscription?"
        >
          <p className="text-lg font-medium leading-8 text-slate-900">
            <EntityTermLink term="softwareDevelopmentSubscription" /> gives a business an agreed level
            of recurring development capacity. Requirements are clarified, prioritised through a{' '}
            <EntityTermLink term="sharedBacklog" />, developed, tested and released under a continuing
            monthly engagement.
          </p>
          <p>
            This is the second meaning of subscription-based software development: buying delivery
            capacity rather than selling product access. It is useful when work continues after launch—
            improvements, integrations, bug fixing, application stabilisation, backlog delivery, and{' '}
            <EntityTermLink term="qa" /> support.
          </p>
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.scatteredToStructured}
            title="From scattered requests to structured monthly delivery"
            description="A development subscription replaces fragmented requests with a visible backlog and a managed monthly rhythm."
            caption="Illustrative view of moving from scattered software requests to structured monthly delivery capacity."
            alignment="wide"
            className="max-w-none"
          />
        </PillarSection>

        <PillarSection
          sectionKey="how_it_works"
          sectionName="How a software development subscription works"
          title="How a Software Development Subscription Works"
        >
          <p>
            A development subscription works as a managed monthly system. Finite{' '}
            <EntityTermLink term="monthlyDeliveryCapacity" /> means work must be estimated and
            prioritised rather than accepted as an unlimited queue.
          </p>
          <ol className="mt-2 space-y-3">
            {developmentProcessSteps.map((step, index) => (
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
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.deliveryProcess}
            caption="Illustrative example of how monthly software delivery moves from requirement to release."
            alignment="wide"
            className="max-w-none"
          />
          <p>
            Capacity teaches the constraint of the model: an agreed monthly allocation is distributed
            across the highest-priority work first. Urgent requirements may be reprioritised, but doing
            so can move other planned work.
          </p>
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.monthlyCapacity}
            caption="Illustrative example of how delivery capacity may be allocated across a monthly cycle."
            alignment="wide"
            className="max-w-none"
          />
        </PillarSection>

        <PillarSection
          sectionKey="vs_fixed_price"
          sectionName="Development subscription vs fixed-price"
          title="Development Subscription vs Fixed-Price Software Development"
        >
          <ComparisonTable
            caption="Development subscription compared with fixed-price software development"
            headers={['Aspect', 'Subscription', 'Fixed-price']}
            rows={vsFixedPriceRows.map((row) => ({
              aspect: row.aspect,
              subscription: row.subscription,
              alternative: row.alternative,
            }))}
          />
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice}
            caption="Comparison matrix for subscription, fixed-price and hiring engagement models."
            alignment="wide"
            className="max-w-none"
          />
          <p>
            A subscription is generally more suitable for ongoing and evolving work. Fixed-price
            delivery is generally more suitable for a clearly defined project with stable scope and
            deliverables.
          </p>
          <p>
            For a deeper decision guide covering scope certainty, procurement, budget structure, risk
            and hybrid approaches, read{' '}
            <TrackedServiceLink
              to="/insights/software-development-subscription-vs-fixed-price"
              location="pillar_vs_fixed_price"
              label="development subscription vs fixed-price software development"
              eventName="sdaas_pillar_related_article_click"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              development subscription vs fixed-price software development
            </TrackedServiceLink>
            .
          </p>
        </PillarSection>

        <PillarSection
          sectionKey="vs_hiring"
          sectionName="Development subscription vs hiring"
          title="Development Subscription vs Hiring an Internal Developer"
        >
          <p>
            Hiring and subscription models both create delivery capacity, but they differ in
            recruitment time, employment overhead, breadth of skills, management responsibility,
            continuity, internal knowledge, control and scalability. Neither is universally cheaper.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="text-base font-bold text-slate-950">Where a subscription may suit</h3>
              <ul className="mt-4 space-y-3">
                {vsHiringPoints.subscription.map((item) => (
                  <li key={item.title}>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-bold text-slate-950">Where hiring may be more appropriate</h3>
              <ul className="mt-4 space-y-3">
                {vsHiringPoints.hiring.map((item) => (
                  <li key={item.title}>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </PillarSection>

        <PillarSection
          sectionKey="use_cases"
          sectionName="Common use cases"
          title="Common Software Development Subscription Use Cases"
        >
          <div className="space-y-4">
            {useCases.map((useCase) => (
              <article key={useCase.title} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-base font-bold text-slate-950">{useCase.title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>
                    <span className="font-semibold text-slate-800">Situation:</span> {useCase.situation}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Typical recurring work:</span>{' '}
                    {useCase.recurringWork}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Why monthly capacity may fit:</span>{' '}
                    {useCase.whySubscription}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">When a separate project might be better:</span>{' '}
                    {useCase.whenProject}
                  </li>
                </ul>
              </article>
            ))}
          </div>
          <p>
            Related paths include{' '}
            <EntityTermLink term="existingAppRescue" />,{' '}
            <EntityTermLink term="businessAutomation" />,{' '}
            <EntityTermLink term="crmAutomation" />, and{' '}
            <EntityTermLink term="saasDevelopment" /> when the need is continuous product evolution.
          </p>
          <p>
            For fuller operational detail on each situation, read the{' '}
            <TrackedServiceLink
              to="/insights/software-development-subscription-use-cases"
              location="pillar_use_cases"
              label="software development subscription use cases"
              eventName="sdaas_pillar_related_article_click"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              software development subscription use cases
            </TrackedServiceLink>{' '}
            guide.
          </p>
        </PillarSection>

        <PillarSection
          sectionKey="benefits"
          sectionName="Benefits"
          title="Benefits of a Development Subscription"
        >
          <div className="space-y-4">
            {benefits.map((item) => (
              <div key={item.title} className="flex gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <div>
                  <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </PillarSection>

        <PillarSection
          sectionKey="limitations"
          sectionName="Limitations and risks"
          title="Limitations and Risks to Understand"
        >
          <p>
            A credible buying decision depends as much on limitations as on benefits. Subscription
            software sells recurring access to a product, while a development subscription sells
            recurring access to delivery capacity—and that capacity is not unlimited.
          </p>
          <ul className="space-y-4">
            {limitations.map((item) => (
              <li key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <h3 className="text-base font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
              </li>
            ))}
          </ul>
        </PillarSection>

        <PillarSection
          sectionKey="evaluate_provider"
          sectionName="How to evaluate a provider"
          title="How to Evaluate a Software Development Subscription Provider"
        >
          <p>
            Use these questions before committing. They are designed to reveal how capacity, quality,
            ownership and handover actually work in practice.
          </p>
          <ul className="space-y-3" role="list">
            {providerChecklist.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </PillarSection>

        <PillarSection
          id="is-it-right"
          sectionKey="decision"
          sectionName="Is a software development subscription right"
          title="Is a Software Development Subscription Right for Your Business?"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="text-base font-bold text-slate-950">Likely a good fit when</h3>
              <ul className="mt-4 space-y-2">
                {decisionFit.goodFit.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-bold text-slate-950">A different model may be better when</h3>
              <ul className="mt-4 space-y-2">
                {decisionFit.otherModel.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-2">
            <TrackedServiceLink
              to={SDAAS_CAPACITY_REQUEST_PATH}
              location="pillar_decision"
              label="Request a Capacity Recommendation"
              eventName="sdaas_pillar_cta_click"
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
            >
              Request a Capacity Recommendation
            </TrackedServiceLink>
          </div>
        </PillarSection>

        <PillarSection
          id="faq"
          sectionKey="faq"
          sectionName="Frequently asked questions"
          title="Frequently Asked Questions"
        >
          <SdaasFaqAccordion
            faqs={pillarFaqs}
            eventName="sdaas_pillar_faq_open"
            contentCluster="sdaas"
          />
        </PillarSection>

        <PillarSection
          sectionKey="conclusion"
          sectionName="Choosing the right subscription model"
          title="Choosing the Right Subscription Model"
        >
          <p>
            Subscription software monetises product access. A development subscription purchases
            recurring delivery capacity. The right path depends on scope, continuity and internal
            capability.
          </p>
          <ol className="space-y-4">
            <li className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-950">1. Building subscription software</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                <TrackedServiceLink
                  to={CANONICAL_ROUTES.services}
                  location="pillar_conclusion_saas"
                  label="Explore Primewayz UK software development services"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Explore Primewayz UK software development services
                </TrackedServiceLink>
                .
              </p>
            </li>
            <li className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-950">
                2. Looking for recurring development capacity
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Continue to{' '}
                <TrackedServiceLink
                  to={SDAAS_PAGE_PATH}
                  location="pillar_conclusion_sdaas"
                  label="Software Development as a Subscription"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Software Development as a Subscription
                </TrackedServiceLink>
                .
              </p>
            </li>
            <li className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="text-base font-bold text-slate-950">3. Unsure which model fits</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Ask for a capacity recommendation based on your backlog—without assuming a subscription
                is the answer.
              </p>
              <TrackedServiceLink
                to={SDAAS_CAPACITY_REQUEST_PATH}
                location="pillar_conclusion"
                label="Request a Capacity Recommendation"
                eventName="sdaas_pillar_cta_click"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Request a Capacity Recommendation
              </TrackedServiceLink>
            </li>
          </ol>
        </PillarSection>

        <section className="border-t border-slate-100 py-12" aria-labelledby="related-content-heading">
          <h2 id="related-content-heading" className="text-2xl font-bold tracking-tight text-slate-950">
            Related content
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {relatedLiveLinks.map((link) => (
              <TrackedServiceLink
                key={link.href}
                to={link.href}
                location="pillar_related"
                label={link.title}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              >
                <h3 className="font-bold text-slate-950">{link.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
              </TrackedServiceLink>
            ))}
            {relatedBlogLinks.map((link) => (
              <TrackedServiceLink
                key={link.href}
                to={link.href}
                location="pillar_related_blog"
                label={link.title}
                eventName="sdaas_pillar_related_article_click"
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              >
                <h3 className="font-bold text-slate-950">{link.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
              </TrackedServiceLink>
            ))}
          </div>
        </section>
      </article>
    </main>
  );
}
