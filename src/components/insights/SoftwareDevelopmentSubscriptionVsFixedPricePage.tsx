import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, User } from 'lucide-react';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { CommercialSectionVisual } from '../commercial/CommercialSectionVisual';
import { EntityTermLink } from '../commercial/EntityTermLink';
import { SdaasFaqAccordion } from '../sdaas/SdaasFaqAccordion';
import {
  COMPARISON_GEO_STATEMENTS,
  COMPARISON_PRIMARY_VISUAL,
  comparisonFaqs,
  comparisonRelatedBlogLinks,
  comparisonRelatedLiveLinks,
  decisionChecklist,
  decisionSummary,
  fixedPriceLimitations,
  fixedPriceStrengths,
  hybridExamples,
  hybridSteps,
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_COMPARISON_DIRECT_ANSWER,
  SDAAS_COMPARISON_DIRECT_ANSWER_FOLLOW,
  SDAAS_COMPARISON_PATH,
  SDAAS_COMPARISON_SEO,
  SDAAS_PAGE_PATH,
  SDAAS_PILLAR_GUIDE_HREF,
  sideBySideRows,
  subscriptionLimitations,
  subscriptionStrengths,
  whenFixedPriceFits,
  whenSubscriptionFits,
  workedScenarios,
} from '../../data/sdaas/comparisonArticle';
import { SDAAS_COMMERCIAL_IMAGES } from '../../data/sdaas/images';
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

function ComparisonSection({
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
    eventName: 'sdaas_comparison_section_view',
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
  headers: [string, string, string];
  rows: ReadonlyArray<{ aspect: string; fixedPrice: string; subscription: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 sm:hidden">
        Swipe sideways to compare all columns
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-[560px] w-full text-left text-sm">
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
              <tr key={row.aspect} className="border-b border-slate-100 align-top last:border-0">
                <th scope="row" className="px-4 py-4 font-semibold text-slate-900 sm:px-5">
                  {row.aspect}
                </th>
                <td className="px-4 py-4 text-slate-600 sm:px-5">{row.fixedPrice}</td>
                <td className="px-4 py-4 text-slate-600 sm:px-5">{row.subscription}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrackedLink({
  to,
  children,
  className,
  location,
  label,
  eventName = 'sdaas_comparison_service_click',
}: {
  to: string;
  children: ReactNode;
  className?: string;
  location: string;
  label: string;
  eventName?:
    | 'sdaas_comparison_cta_click'
    | 'sdaas_comparison_service_click'
    | 'sdaas_comparison_pillar_click'
    | 'sdaas_comparison_related_article_click';
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
          source_page: SDAAS_COMPARISON_PATH,
          link_context: location,
          content_cluster: 'sdaas',
          content_type: 'comparison_article',
        })
      }
    >
      {children}
    </Link>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700 sm:text-base">
          <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function SoftwareDevelopmentSubscriptionVsFixedPricePage() {
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
            <li className="text-slate-900">Subscription vs fixed-price</li>
          </ol>
        </nav>

        <header className="border-b border-slate-100 pb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            {SDAAS_COMPARISON_SEO.category}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.15]">
            {SDAAS_COMPARISON_SEO.h1}
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">{SDAAS_COMPARISON_SEO.standfirst}</p>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-4 w-4" aria-hidden />
              {SDAAS_COMPARISON_SEO.author}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" aria-hidden />
              <time dateTime={SDAAS_COMPARISON_SEO.datePublished}>
                {formatDisplayDate(SDAAS_COMPARISON_SEO.datePublished)}
              </time>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {SDAAS_COMPARISON_SEO.readTime}
            </span>
          </div>
        </header>

        <div className="prose-sdaas mt-10 space-y-5 text-base leading-8 text-slate-700">
          <p>
            Businesses often compare software providers before deciding how the work itself should be
            purchased. A fixed-price project provides a defined scope and agreed total price, while a
            development subscription provides recurring capacity for ongoing and evolving requirements.
          </p>
          <p>
            This decision guide helps UK buyers evaluate scope certainty, change frequency, cost
            predictability, procurement effort, continuity, internal management, delivery risk and
            suitability over time—without assuming one model is universally better.
          </p>

          <aside className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-5 py-4 text-sm leading-7 text-slate-800">
            <p className="font-semibold text-slate-950">
              Need a broader explanation of subscription-based software development?
            </p>
            <p className="mt-1">
              Read the{' '}
              <TrackedLink
                to={SDAAS_PILLAR_GUIDE_HREF}
                location="comparison_intro"
                label="Subscription-Based Software Development Guide"
                eventName="sdaas_comparison_pillar_click"
                className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
              >
                Subscription-Based Software Development Guide
              </TrackedLink>
              .
            </p>
          </aside>
        </div>

        <ComparisonSection
          id="difference"
          sectionKey="direct_answer"
          sectionName="What is the difference"
          title="What Is the Difference Between a Software Development Subscription and a Fixed-Price Project?"
        >
          <p className="text-lg font-medium leading-8 text-slate-900">
            {SDAAS_COMPARISON_DIRECT_ANSWER}
          </p>
          <p>{SDAAS_COMPARISON_DIRECT_ANSWER_FOLLOW}</p>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            {COMPARISON_GEO_STATEMENTS[0]}
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="fixed_price_definition"
          sectionName="What is fixed-price software development"
          title="What Is Fixed-Price Software Development?"
        >
          <p>
            In fixed-price software development, requirements are defined before agreement. Deliverables
            are documented, the price is agreed against that scope, and milestones with acceptance
            criteria are normally set. Changes may require a formal variation. The provider carries
            estimation risk within the agreed scope; the client carries risk if requirements were
            incomplete or misunderstood.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="text-base font-bold text-slate-950">Strengths</h3>
              <div className="mt-4">
                <BulletList items={fixedPriceStrengths} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-bold text-slate-950">Limitations</h3>
              <ul className="mt-4 space-y-2">
                {fixedPriceLimitations.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="subscription_definition"
          sectionName="What is a software development subscription"
          title="What Is a Software Development Subscription?"
        >
          <p className="text-lg font-medium leading-8 text-slate-900">
            A software development subscription provides an agreed amount of recurring{' '}
            <EntityTermLink term="monthlyDeliveryCapacity" />. Work is clarified, estimated and
            prioritised through a <EntityTermLink term="sharedBacklog" />, allowing priorities to
            change without creating a new project agreement for every requirement.
          </p>
          <p>
            Delivery typically covers prioritisation, development, <EntityTermLink term="qa" />,
            release and reporting, with continued product context across monthly cycles. See{' '}
            <TrackedLink
              to={SDAAS_PAGE_PATH}
              location="comparison_subscription_definition"
              label="Software Development as a Subscription for UK Businesses"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Software Development as a Subscription for UK Businesses
            </TrackedLink>{' '}
            for the commercial service model.
          </p>
          <p className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            A development subscription is not unlimited delivery. Capacity remains finite and work must
            be prioritised.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="text-base font-bold text-slate-950">Strengths</h3>
              <div className="mt-4">
                <BulletList items={subscriptionStrengths} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-bold text-slate-950">Limitations</h3>
              <ul className="mt-4 space-y-2">
                {subscriptionLimitations.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-7 text-slate-700">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </ComparisonSection>

        <ComparisonSection
          id="side-by-side"
          sectionKey="side_by_side"
          sectionName="Side-by-side comparison"
          title="Software Development Subscription vs Fixed-Price: Side-by-Side Comparison"
        >
          <ComparisonTable
            caption="Software development subscription compared with fixed-price software development"
            headers={['Aspect', 'Fixed-price', 'Subscription']}
            rows={sideBySideRows}
          />
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            Fixed-price purchases a defined outcome. A subscription purchases recurring delivery
            capacity. Critical conclusions also appear in the sections that follow—do not rely on the
            table alone.
          </p>
          <CommercialSectionVisual
            image={COMPARISON_PRIMARY_VISUAL}
            caption="Comparison of software development subscriptions, fixed-price projects and direct hiring across flexibility, commitment and delivery continuity."
            alignment="wide"
            className="max-w-none"
          />
          <p>
            The table above carries the comparison facts. The visual summarises engagement trade-offs
            across models; use both together when briefing stakeholders.
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="scope_certainty"
          sectionName="How certain is the scope"
          title="How Certain Is the Scope?"
        >
          <p>
            Fixed-price works best when requirements are understood, dependencies are known, acceptance
            criteria are stable, external integrations are predictable, stakeholders agree on outcomes,
            and material changes are unlikely.
          </p>
          <p>
            A subscription works better when requirements will emerge through use, priorities may shift,
            the product is already live, integrations evolve, user feedback influences the roadmap, or
            work consists of many medium and small items.
          </p>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            The less certain the scope, the harder it is to price a project accurately without either
            increasing contingency or narrowing interpretation. Uncertainty is normal in evolving
            digital products—it is a signal about procurement model, not a failure of planning.
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="changing_priorities"
          sectionName="How often priorities change"
          title="How Often Are Priorities Likely to Change?"
        >
          <p>
            Under fixed-price delivery, changes require review. They may affect cost and timeline and
            often need formal approval through change control.
          </p>
          <p>
            Under a subscription, items can be reordered in the backlog so urgent work moves forward.
            Other planned work may move back. Capacity does not increase automatically when priorities
            shift.
          </p>
          <p className="text-lg font-medium leading-8 text-slate-900">{COMPARISON_GEO_STATEMENTS[1]}</p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="procurement"
          sectionName="Procurement and re-scoping"
          title="How Much Procurement and Re-Scoping Is Required?"
        >
          <p>
            Fixed-price procurement usually involves initial discovery, proposal, scope, quote,
            approval and contract—then change requests and often a new agreement for later work.
          </p>
          <p>
            A subscription typically involves initial onboarding and a continuing commercial
            relationship. New work enters the backlog with fewer repeated procurement cycles, supported
            by recurring governance and priority reviews.
          </p>
          <p>
            A subscription does not remove scoping. Clarification and estimation remain necessary for
            every meaningful item of work.
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="budget"
          sectionName="How the budget works"
          title="How Does the Budget Work?"
        >
          <p>
            Fixed-price budget is an agreed total project price, often paid against milestones and
            linked to defined scope. Changes may increase price.
          </p>
          <p>
            Subscription budget is a recurring monthly fee linked to agreed capacity. Work completed
            varies by complexity. The engagement cost is predictable; the quantity of features delivered
            each month is not guaranteed.
          </p>
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium leading-7 text-slate-800">
            A predictable monthly fee does not mean every month produces the same number of features.
            Complexity, dependencies and review cycles affect delivery.
          </p>
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.monthlyCapacity}
            caption="Illustrative example of how monthly software development capacity may be allocated across priorities."
            alignment="wide"
            className="max-w-none"
          />
        </ComparisonSection>

        <ComparisonSection
          sectionKey="product_context"
          sectionName="Retained product knowledge"
          title="How Important Is Retained Product Knowledge?"
        >
          <p>
            Recurring engagement can preserve business context, architecture knowledge, past decisions,
            integration history, deployment knowledge, user-feedback context and backlog priorities.
          </p>
          <p>
            A well-run fixed-price project can still produce strong documentation and handover. Fixed-
            price teams do not automatically lose knowledge—continuity simply depends on whether the
            engagement continues after the project ends.
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="internal_management"
          sectionName="Internal management needs"
          title="How Much Internal Management Is Needed?"
        >
          <p>
            Fixed-price work requires strong upfront decision-making, scope approval, acceptance and
            change management. Once underway, it may need less weekly prioritisation than a
            subscription.
          </p>
          <p>
            A subscription requires recurring priority decisions, a maintained backlog, regular
            stakeholder access, and timely feedback and approvals. It is not a substitute for client
            decision-making.
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="risk"
          sectionName="Risk and accountability"
          title="How Do Risk and Accountability Differ?"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-bold text-slate-950">Fixed-price risks</h3>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                <li>Incomplete requirements</li>
                <li>Restrictive scope interpretation</li>
                <li>Contingency pricing</li>
                <li>Change-request disputes</li>
                <li>Delivery pressure near milestones</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-bold text-slate-950">Subscription risks</h3>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-700">
                <li>Unclear prioritisation</li>
                <li>Capacity consumed by investigation</li>
                <li>Backlog growth without outcomes</li>
                <li>Lack of clear cycle goals</li>
                <li>Ongoing spend without governance</li>
              </ul>
            </div>
          </div>
          <p>
            Good controls for both models include written acceptance criteria, transparent estimates, a
            visible backlog, regular reporting, documented decisions, QA, change visibility and
            structured handover.
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="when_fixed_price"
          sectionName="When fixed-price is better"
          title="When Is Fixed-Price Development the Better Choice?"
        >
          <BulletList items={whenFixedPriceFits} />
          <p className="text-lg font-medium leading-8 text-slate-900">{COMPARISON_GEO_STATEMENTS[2]}</p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="when_subscription"
          sectionName="When subscription is better"
          title="When Is a Development Subscription the Better Choice?"
        >
          <BulletList items={whenSubscriptionFits} />
          <p className="text-lg font-medium leading-8 text-slate-900">{COMPARISON_GEO_STATEMENTS[3]}</p>
          <p>
            For practical situations that match this pattern, see{' '}
            <TrackedLink
              to="/insights/software-development-subscription-use-cases"
              location="comparison_when_subscription_use_cases"
              label="practical software development subscription use cases"
              eventName="sdaas_comparison_related_article_click"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              practical software development subscription use cases
            </TrackedLink>
            . Explore{' '}
            <TrackedLink
              to={SDAAS_PAGE_PATH}
              location="comparison_when_subscription"
              label="Software Development as a Subscription for UK Businesses"
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Software Development as a Subscription for UK Businesses
            </TrackedLink>{' '}
            when continuity and adaptability matter more than a fixed endpoint.
          </p>
        </ComparisonSection>

        <ComparisonSection
          sectionKey="hybrid"
          sectionName="Hybrid fixed-price and subscription"
          title="Can Fixed-Price and Subscription Development Be Used Together?"
        >
          <p>
            Different stages of the same product may require different commercial models. Buyers are
            not limited to a binary choice—a hybrid sequence often matches how real systems evolve.
          </p>
          <ol className="mt-2 space-y-3">
            {hybridSteps.map((step, index) => (
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
          <ul className="space-y-2">
            {hybridExamples.map((example) => (
              <li key={example} className="flex gap-2 text-sm leading-7 text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                {example}
              </li>
            ))}
          </ul>
        </ComparisonSection>

        <ComparisonSection
          id="decision-checklist"
          sectionKey="decision_checklist"
          sectionName="Which model should you choose"
          title="Which Software Development Model Should You Choose?"
        >
          <p>Use these questions to structure a procurement conversation with your team.</p>
          <ol className="space-y-3" role="list">
            {decisionChecklist.map((item, index) => (
              <li
                key={item}
                className="flex gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
              >
                <span className="font-bold text-slate-900">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            <p>
              <strong className="font-semibold text-slate-950">Fixed-price:</strong>{' '}
              {decisionSummary.fixedPrice}
            </p>
            <p>
              <strong className="font-semibold text-slate-950">Subscription:</strong>{' '}
              {decisionSummary.subscription}
            </p>
            <p>
              <strong className="font-semibold text-slate-950">Discovery first:</strong>{' '}
              {decisionSummary.discovery}
            </p>
          </div>
        </ComparisonSection>

        <ComparisonSection
          id="scenarios"
          sectionKey="scenarios"
          sectionName="Practical examples"
          title="Practical Examples"
        >
          <div className="space-y-4">
            {workedScenarios.map((scenario) => (
              <article key={scenario.title} className="rounded-2xl border border-slate-200 p-5">
                <h3 className="text-base font-bold text-slate-950">{scenario.title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                  <li>
                    <span className="font-semibold text-slate-800">Likely model:</span> {scenario.model}
                  </li>
                  <li>
                    <span className="font-semibold text-slate-800">Reason:</span> {scenario.reason}
                  </li>
                </ul>
              </article>
            ))}
          </div>
          <p>
            Related paths include{' '}
            <EntityTermLink term="existingAppRescue" />,{' '}
            <EntityTermLink term="saasDevelopment" />, and{' '}
            <EntityTermLink term="businessAutomation" /> when the workload continues after the first
            release.
          </p>
        </ComparisonSection>

        <ComparisonSection
          id="faq"
          sectionKey="faq"
          sectionName="Frequently asked questions"
          title="Frequently Asked Questions"
        >
          <SdaasFaqAccordion
            faqs={comparisonFaqs}
            eventName="sdaas_comparison_faq_open"
            contentCluster="sdaas"
          />
        </ComparisonSection>

        <ComparisonSection
          sectionKey="conclusion"
          sectionName="Choose the model that matches the work"
          title="Choose the Model That Matches the Nature of the Work"
        >
          <p>
            Fixed-price suits defined work with stable scope. A subscription suits recurring and
            evolving work. Discovery suits unclear or technically risky situations. Hybrid models are
            often practical. The procurement model should follow the nature of the work, not habit.
          </p>
          <ol className="space-y-4">
            <li className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-950">1. Read the broader guide</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                <TrackedLink
                  to={SDAAS_PILLAR_GUIDE_HREF}
                  location="comparison_conclusion_pillar"
                  label="Subscription-Based Software Development Guide"
                  eventName="sdaas_comparison_pillar_click"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Subscription-Based Software Development Guide
                </TrackedLink>
              </p>
            </li>
            <li className="rounded-2xl border border-slate-200 p-5">
              <h3 className="text-base font-bold text-slate-950">2. Explore monthly development capacity</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Continue to{' '}
                <TrackedLink
                  to={SDAAS_PAGE_PATH}
                  location="comparison_conclusion_service"
                  label="Software Development as a Subscription"
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Software Development as a Subscription
                </TrackedLink>
                .
              </p>
            </li>
            <li className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5">
              <h3 className="text-base font-bold text-slate-950">
                3. Ask Primewayz UK to review the workload
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                We will recommend a subscription, a defined project or a discovery phase based on the
                nature of the requirement.
              </p>
              <TrackedLink
                to={SDAAS_CAPACITY_REQUEST_PATH}
                location="comparison_conclusion"
                label="Request a Capacity Recommendation"
                eventName="sdaas_comparison_cta_click"
                className="mt-4 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
              >
                Request a Capacity Recommendation
              </TrackedLink>
            </li>
          </ol>
        </ComparisonSection>

        <section className="border-t border-slate-100 py-12" aria-labelledby="related-content-heading">
          <h2 id="related-content-heading" className="text-2xl font-bold tracking-tight text-slate-950">
            Related content
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {comparisonRelatedLiveLinks.map((link) => (
              <TrackedLink
                key={link.href}
                to={link.href}
                location="comparison_related"
                label={link.title}
                eventName={
                  link.href === SDAAS_PILLAR_GUIDE_HREF
                    ? 'sdaas_comparison_pillar_click'
                    : 'sdaas_comparison_service_click'
                }
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              >
                <h3 className="font-bold text-slate-950">{link.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{link.description}</p>
              </TrackedLink>
            ))}
            {comparisonRelatedBlogLinks.map((link) => (
              <TrackedLink
                key={link.href}
                to={link.href}
                location="comparison_related_blog"
                label={link.title}
                eventName="sdaas_comparison_related_article_click"
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
