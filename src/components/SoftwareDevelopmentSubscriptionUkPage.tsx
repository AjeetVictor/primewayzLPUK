import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardList,
  Layers3,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import {
  CANONICAL_ROUTES,
  SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
  SDAAS_PILLAR_GUIDE_HREF,
} from '../constants/canonicalRoutes';
import { trackSdaasEvent } from '../lib/sdaasAnalytics';
import { SdaasFaqAccordion } from './sdaas/SdaasFaqAccordion';
import {
  CommercialHeroVisual,
  CommercialSectionVisual,
  CommercialVisualBreather,
} from './commercial/CommercialSectionVisual';
import { CommercialJourneyDivider } from './commercial/CommercialJourneyDivider';
import { CommercialSectionShell } from './commercial/CommercialSectionShell';
import { EntityTermLink } from './commercial/EntityTermLink';
import { MonthlyDeliverySnapshot } from './commercial/MonthlyDeliverySnapshot';
import { SDAAS_COMMERCIAL_IMAGES } from '../data/sdaas/images';
import { SDAAS_JOURNEY_STEPS, SDAAS_SECTION_TRANSITIONS } from '../data/sdaas/pageJourney';
import {
  audienceCards,
  capacityLevels,
  comparisonVsFixedPrice,
  comparisonVsHiring,
  comparisonVsOutsourcing,
  deliverableGroups,
  deliverySteps,
  examplePriorityPlan,
  goodFitItems,
  onboardingSteps,
  SDAAS_CAPACITY_ANCHOR,
  SDAAS_CAPACITY_REQUEST_PATH,
  SDAAS_CLARIFICATION,
  SDAAS_FAQ_ANCHOR,
  SDAAS_PAGE_PATH,
  SDAAS_PROCESS_ANCHOR,
  SDAAS_SEO,
  separateProjectItems,
  subscriptionModelPoints,
  traditionalProjectPoints,
  type ComparisonRow,
} from '../data/sdaas/commercialPage';

function CapacityCtaLink({
  location,
  className,
  children,
  label,
}: {
  location: string;
  className: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <Link
      to={SDAAS_CAPACITY_REQUEST_PATH}
      className={className}
      onClick={() =>
        trackSdaasEvent('sdaas_cta_click', {
          cta_location: location,
          cta_label: label,
          destination: SDAAS_CAPACITY_REQUEST_PATH,
          source_page: SDAAS_PAGE_PATH,
        })
      }
    >
      {children}
    </Link>
  );
}

function ComparisonTable({
  title,
  alternativeLabel,
  rows,
}: {
  title: string;
  alternativeLabel: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600">
              <th scope="col" className="px-5 py-3 font-semibold sm:px-6">
                Aspect
              </th>
              <th scope="col" className="px-5 py-3 font-semibold sm:px-6">
                Subscription
              </th>
              <th scope="col" className="px-5 py-3 font-semibold sm:px-6">
                {alternativeLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.aspect} className="border-b border-slate-100 align-top last:border-0">
                <th scope="row" className="px-5 py-4 font-semibold text-slate-900 sm:px-6">
                  {row.aspect}
                </th>
                <td className="px-5 py-4 text-slate-600 sm:px-6">{row.subscription}</td>
                <td className="px-5 py-4 text-slate-600 sm:px-6">{row.alternative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const SoftwareDevelopmentSubscriptionUkPage = () => {
  return (
    <main className="min-h-screen bg-white pb-20 text-slate-950 xl:pb-0">
      <MonthlyDeliverySnapshot />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" />

        <div className="relative mx-auto max-w-[1200px]">
          <nav className="mb-10 text-sm font-semibold text-white/70" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/" className="transition hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true" className="text-white/40">
                &gt;
              </li>
              <li>
                <Link to={CANONICAL_ROUTES.services} className="transition hover:text-white">
                  Services
                </Link>
              </li>
              <li aria-hidden="true" className="text-white/40">
                &gt;
              </li>
              <li className="text-white">
                <EntityTermLink term="softwareDevelopmentSubscription" className="text-white hover:text-emerald-200" />
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Flexible Monthly Development Capacity
              </p>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.35rem] lg:leading-[1.1]">
                Software Development as a Subscription for UK Businesses
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                Access structured{' '}
                <EntityTermLink
                  term="monthlyDeliveryCapacity"
                  className="text-emerald-200 hover:text-emerald-100"
                />{' '}
                each month for ongoing improvements, integrations, fixes and new features—without
                hiring a complete internal team or commissioning a separate project every time.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CapacityCtaLink
                  location="hero_primary"
                  label="Request a Capacity Recommendation"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-300"
                >
                  Request a Capacity Recommendation
                </CapacityCtaLink>

                <a
                  href={`#${SDAAS_PROCESS_ANCHOR}`}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10 motion-reduce:scroll-auto"
                  onClick={() =>
                    trackSdaasEvent('sdaas_cta_click', {
                      cta_location: 'hero_secondary',
                      cta_label: 'See How the Model Works',
                      destination: `#${SDAAS_PROCESS_ANCHOR}`,
                      source_page: SDAAS_PAGE_PATH,
                    })
                  }
                >
                  See How the Model Works
                </a>
              </div>
            </div>

            <CommercialHeroVisual
              image={SDAAS_COMMERCIAL_IMAGES.heroWorkflow}
              caption="Backlog → Priority → Development → QA → Release"
              supportText="Your work moves through a managed monthly system."
            />
          </div>
        </div>
      </section>

      {/* Business chaos → need for structure */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[0].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[0].label}
        title="Software Needs Rarely End When the First Project Is Delivered"
        lead="After launch, users request improvements, integrations change, bugs emerge, systems need maintenance, business workflows evolve, technical debt accumulates and new commercial priorities appear. Fixed-price projects remain useful for defined builds—but continuous work often needs a different engagement model."
        sectionKey="chaos"
        breathing
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-950">Traditional Project-by-Project Delivery</h3>
            <ul className="mt-5 space-y-3">
              {traditionalProjectPoints.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-950">Subscription-Based Development</h3>
            <ul className="mt-5 space-y-3">
              {subscriptionModelPoints.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <CommercialVisualBreather>
          <CommercialJourneyDivider
            step={SDAAS_JOURNEY_STEPS[1].step}
            label={SDAAS_JOURNEY_STEPS[1].label}
            className="mb-12"
          />

          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.scatteredToStructured}
            title="From scattered requests to structured delivery"
            description="Many businesses start with ad-hoc requests spread across email, chat and spreadsheets. A subscription model replaces that fragmentation with one visible backlog and a managed monthly rhythm."
            caption="Illustrative before-and-after view of moving from scattered requests to a shared backlog with prioritised monthly delivery."
            alignment="wide"
          />

          <CommercialVisualBreather className="mt-12">
            <CommercialSectionVisual
              image={SDAAS_COMMERCIAL_IMAGES.deliveryModelsComparison}
              title="Two ways to buy software development"
              description="Project-by-project delivery and subscription-based development can both be valid. The difference is whether your need is fixed-scope or continuously evolving."
              caption="Project-by-project and subscription models can both be valid, depending on whether work is fixed-scope or continuously evolving."
              alignment="wide"
            />
          </CommercialVisualBreather>
        </CommercialVisualBreather>
      </CommercialSectionShell>

      {/* Definition */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[2].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[2].label}
        transition={SDAAS_SECTION_TRANSITIONS.definition}
        title="What Is Software Development as a Subscription?"
        background="muted"
        sectionKey="definition"
        narrow
      >
        <p className="max-w-4xl text-lg leading-8 text-slate-700">
          <EntityTermLink term="softwareDevelopmentSubscription" /> gives your business an agreed
          level of <EntityTermLink term="monthlyDeliveryCapacity" />. Requirements are clarified,
          estimated and prioritised through a <EntityTermLink term="sharedBacklog" />, then delivered
          through a structured development and <EntityTermLink term="qa" /> process.
        </p>
        <aside className="mt-6 max-w-4xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-base font-semibold leading-7 text-slate-900">
          {SDAAS_CLARIFICATION}
        </aside>
        <p className="mt-6 max-w-4xl text-base leading-7 text-slate-600">
          Primewayz UK provides structured monthly software development capacity for businesses that
          need to improve, integrate, maintain and evolve their digital systems continuously—without
          hiring a full internal development team or commissioning a new project for every
          requirement. Flexible capacity. Clear priorities. Predictable monthly engagement. Proper
          product, engineering and quality processes.
        </p>
      </CommercialSectionShell>

      {/* Audience */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[3].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[3].label}
        transition={SDAAS_SECTION_TRANSITIONS.audience}
        title="Who Is This Model Designed For?"
        lead="The model suits UK SMEs and growing digital businesses with an ongoing backlog—not buyers looking only for the cheapest freelancer or unlimited simultaneous delivery."
        sectionKey="audience"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audienceCards.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-bold text-slate-950">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            </article>
          ))}
        </div>
      </CommercialSectionShell>

      {/* Deliverables */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[4].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[4].label}
        transition={SDAAS_SECTION_TRANSITIONS.deliverables}
        title="What Can Be Delivered Through the Subscription?"
        lead="Work is grouped around product improvement, engineering, integration, stabilisation and quality—not an unlimited task list."
        background="muted"
        sectionKey="deliverables"
      >
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {deliverableGroups.map((group) => (
            <article key={group.title} className="rounded-3xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold text-slate-950">{group.title}</h3>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-6 text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-4xl text-sm leading-7 text-slate-600">
          Specialist support such as UI/UX, architecture, DevOps or mobile development can be included
          where relevant to the agreed plan and requirement. That does not mean every specialist is
          permanently assigned to every plan. Where systems are unstable, we may recommend a short paid{' '}
          <EntityTermLink term="productDiscovery" /> or{' '}
          <EntityTermLink term="existingAppRescue" /> phase before normal monthly delivery begins.
        </p>
      </CommercialSectionShell>

      {/* Process */}
      <CommercialSectionShell
        id={SDAAS_PROCESS_ANCHOR}
        journeyStep={SDAAS_JOURNEY_STEPS[5].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[5].label}
        transition={SDAAS_SECTION_TRANSITIONS.process}
        eyebrow="Delivery process"
        title="How Monthly Software Delivery Works"
        sectionKey="process"
        breathing
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliverySteps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="font-bold text-slate-950">{step.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{step.text}</p>
            </li>
          ))}
        </ol>

        <p className="mt-10 max-w-3xl text-base leading-7 text-slate-600">
          Urgent requirements can be reprioritised, but doing so may move other planned work. This
          keeps delivery realistic and transparent.
        </p>

        <CommercialVisualBreather>
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.deliveryProcess}
            title="Delivery workflow overview"
            description="Each requirement follows the same visible path from intake to release, so priorities, progress and blockers stay clear throughout the month."
            caption="Illustrative example of how monthly software delivery moves from requirement to release."
            alignment="wide"
          />
        </CommercialVisualBreather>
      </CommercialSectionShell>

      {/* Capacity */}
      <CommercialSectionShell
        id={SDAAS_CAPACITY_ANCHOR}
        journeyStep={SDAAS_JOURNEY_STEPS[6].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[6].label}
        transition={SDAAS_SECTION_TRANSITIONS.capacity}
        title="How Monthly Delivery Capacity Is Managed"
        background="muted"
        sectionKey="capacity"
        breathing
      >
        <CommercialSectionVisual
          image={SDAAS_COMMERCIAL_IMAGES.monthlyCapacity}
          title="Monthly capacity allocation example"
          description="Capacity is not unlimited. The illustration below shows how agreed monthly delivery capacity may be distributed across the highest-priority work first."
          caption="Illustrative example of how delivery capacity may be allocated across a monthly cycle."
          alignment="wide"
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <ul className="space-y-3 text-base leading-7 text-slate-700">
              <li>Each plan contains an agreed capacity allocation.</li>
              <li>Requests are estimated against available capacity.</li>
              <li>The highest-value work is prioritised first.</li>
              <li>One primary workstream normally progresses at a time.</li>
              <li>Smaller fixes may run alongside where practical.</li>
              <li>Larger plans may support multiple agreed workstreams.</li>
              <li>Capacity is not an unlimited promise.</li>
            </ul>
            <p className="mt-6 text-base leading-7 text-slate-600">
              Requirements are prioritised against agreed capacity in the{' '}
              <EntityTermLink term="sharedBacklog" />, so urgent work can move forward while
              lower-priority items remain visible.
            </p>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-emerald-600" aria-hidden />
              <h3 className="text-lg font-bold text-slate-950">Example Monthly Priority Plan</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Illustration only—not a guaranteed delivery plan.
            </p>
            <ol className="mt-5 space-y-3">
              {examplePriorityPlan.map((item) => (
                <li
                  key={item.priority}
                  className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-bold text-emerald-700">P{item.priority}</span>
                  <span className="text-sm font-semibold text-slate-800">{item.label}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </CommercialSectionShell>

      {/* Fit */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[7].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[7].label}
        transition={SDAAS_SECTION_TRANSITIONS.fit}
        title="When a Development Subscription Is—and Is Not—the Right Choice"
        lead="A subscription model is generally better suited to ongoing, evolving work than to a single large project with a fixed and stable scope. Where a subscription is not suitable, we will recommend the more appropriate route."
        sectionKey="fit"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-950">A Good Fit</h3>
            <ul className="mt-5 space-y-3">
              {goodFitItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <h3 className="text-xl font-bold text-slate-950">A Separate Project May Be Better</h3>
            <ul className="mt-5 space-y-3">
              {separateProjectItems.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CommercialSectionShell>

      {/* Comparisons */}
      <CommercialSectionShell
        transition={SDAAS_SECTION_TRANSITIONS.comparison}
        title="How the Subscription Model Compares"
        lead="May be more efficient where the development need is ongoing but does not justify building a complete internal team. It is not always cheaper or always better than every alternative."
        background="muted"
        sectionKey="comparison"
        breathing
      >
        <CommercialSectionVisual
          image={SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice}
          title="Choosing the right engagement model"
          description="Subscription, fixed-price and hiring each suit different business situations. The matrix below summarises how they differ before the detailed comparison tables."
          caption="Subscription, fixed-price and hiring models each suit different business requirements."
          alignment="wide"
        />

        <div className="mt-14 space-y-6">
          <ComparisonTable
            title="Subscription vs Fixed-Price Development"
            alternativeLabel="Fixed-price"
            rows={comparisonVsFixedPrice}
          />
          <ComparisonTable
            title="Subscription vs Direct Hiring"
            alternativeLabel="Direct hiring"
            rows={comparisonVsHiring}
          />
          <ComparisonTable
            title="Subscription vs Traditional Outsourcing"
            alternativeLabel="Traditional outsourcing"
            rows={comparisonVsOutsourcing}
          />
        </div>

        <p className="mt-8 text-sm leading-7 text-slate-600 sm:text-base">
          Need a fuller decision guide covering scope certainty, procurement, budget and hybrid
          approaches? Read{' '}
          <Link
            to={SDAAS_COMPARISON_VS_FIXED_PRICE_HREF}
            className="font-semibold text-emerald-700 hover:text-emerald-800"
            onClick={() =>
              trackSdaasEvent('sdaas_article_click', {
                cta_location: 'comparison_section',
                destination: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
                source_page: SDAAS_PAGE_PATH,
                content_cluster: 'sdaas',
                content_type: 'comparison_article',
              })
            }
          >
            development subscription vs fixed-price software development
          </Link>
          .
        </p>
      </CommercialSectionShell>

      {/* Trust */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[8].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[8].label}
        transition={SDAAS_SECTION_TRANSITIONS.trust}
        title="Built Around Visibility, Ownership and Responsible Delivery"
        sectionKey="trust"
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 p-6">
            <ShieldCheck className="h-8 w-8 text-emerald-600" aria-hidden />
            <h3 className="mt-5 text-xl font-bold text-slate-950">Clear Ownership and Handover</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Once applicable invoices have been paid, you own the custom source code, documentation
              and project-specific assets created specifically for your engagement. Pre-existing
              components, open-source software and third-party services remain subject to their
              respective ownership and licence terms.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 p-6">
            <Layers3 className="h-8 w-8 text-emerald-600" aria-hidden />
            <h3 className="mt-5 text-xl font-bold text-slate-950">Confidentiality and Controlled Access</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Engagements can be covered by an NDA. Access is limited to authorised people, reviewed
              during onboarding and removed when no longer required. Specialist or sector-specific
              security requirements can be assessed separately.
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 p-6">
            <Workflow className="h-8 w-8 text-emerald-600" aria-hidden />
            <h3 className="mt-5 text-xl font-bold text-slate-950">Know What Is Being Worked On and Why</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Clients receive visibility of the <EntityTermLink term="sharedBacklog" />, current work,
              upcoming priorities, blockers, weekly updates and a monthly delivery summary through an
              agreed communication process.
            </p>
          </article>
        </div>
      </CommercialSectionShell>

      {/* Onboarding */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[9].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[9].label}
        transition={SDAAS_SECTION_TRANSITIONS.onboarding}
        title="Starting Your Subscription"
        background="muted"
        sectionKey="onboarding"
        breathing
      >
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {onboardingSteps.map((step, index) => (
            <li
              key={step}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-800"
            >
              <span className="mr-2 text-emerald-700">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <aside className="mt-8 max-w-4xl rounded-2xl border border-slate-300 bg-white px-5 py-4 text-sm leading-7 text-slate-700">
          Where an existing application is unstable, undocumented or difficult to assess, we may
          recommend a short paid <EntityTermLink term="productDiscovery" /> or stabilisation phase
          before beginning normal monthly delivery.
        </aside>

        <CommercialVisualBreather>
          <CommercialSectionVisual
            image={SDAAS_COMMERCIAL_IMAGES.onboardingJourney}
            title="Onboarding journey overview"
            description="Onboarding aligns access, backlog priorities and delivery cadence before regular monthly cycles begin."
            caption="Illustrative onboarding path from consultation and system review to the first delivery cycle."
            alignment="wide"
          />
        </CommercialVisualBreather>
      </CommercialSectionShell>

      {/* Pricing */}
      <CommercialSectionShell
        journeyStep={SDAAS_JOURNEY_STEPS[10].step}
        journeyLabel={SDAAS_JOURNEY_STEPS[10].label}
        transition={SDAAS_SECTION_TRANSITIONS.pricing}
        title="Pricing Based on the Capacity You Actually Need"
        lead="The recommended monthly plan depends on the complexity of your system, the type of work involved, the disciplines required and the amount of delivery capacity needed."
        sectionKey="pricing"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {capacityLevels.map((level) => (
            <article key={level.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Indicative category
              </p>
              <h3 className="mt-3 text-xl font-bold text-slate-950">{level.name}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{level.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-8">
          <CapacityCtaLink
            location="pricing_section"
            label="Request a Capacity Recommendation"
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            Request a Capacity Recommendation
          </CapacityCtaLink>
        </div>
      </CommercialSectionShell>

      {/* FAQ */}
      <CommercialSectionShell
        id={SDAAS_FAQ_ANCHOR}
        transition={SDAAS_SECTION_TRANSITIONS.faq}
        title="Frequently Asked Questions"
        background="muted"
        sectionKey="faq"
        narrow
      >
        <SdaasFaqAccordion />
      </CommercialSectionShell>

      {/* Related services */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">Related UK support paths</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Link
              to={CANONICAL_ROUTES.services}
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              onClick={() =>
                trackSdaasEvent('sdaas_article_click', {
                  cta_location: 'related_service_link',
                  destination: CANONICAL_ROUTES.services,
                })
              }
            >
              <h3 className="font-bold text-slate-950">All services</h3>
              <p className="mt-2 text-sm text-slate-600">Compare software, website, CRM and support options.</p>
            </Link>
            <Link
              to={CANONICAL_ROUTES.maintenance}
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
            >
              <h3 className="font-bold text-slate-950">Website maintenance</h3>
              <p className="mt-2 text-sm text-slate-600">
                Ongoing website updates, fixes and technical care for UK SMEs.
              </p>
            </Link>
            <Link
              to={CANONICAL_ROUTES.crmAutomationSupport}
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
            >
              <h3 className="font-bold text-slate-950">CRM &amp; automation support</h3>
              <p className="mt-2 text-sm text-slate-600">
                Lead capture, workflows and integrations that often continue after first delivery.
              </p>
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Link
              to={SDAAS_COMPARISON_VS_FIXED_PRICE_HREF}
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              onClick={() =>
                trackSdaasEvent('sdaas_article_click', {
                  cta_location: 'related_service_link',
                  destination: SDAAS_COMPARISON_VS_FIXED_PRICE_HREF,
                  content_type: 'comparison_article',
                })
              }
            >
              <h3 className="font-bold text-slate-950">Subscription vs fixed-price</h3>
              <p className="mt-2 text-sm text-slate-600">
                Decision guide for choosing between monthly capacity and a defined project.
              </p>
            </Link>
            <Link
              to="/insights/software-development-subscription-use-cases"
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              onClick={() =>
                trackSdaasEvent('sdaas_article_click', {
                  cta_location: 'related_service_link',
                  destination: '/insights/software-development-subscription-use-cases',
                  content_type: 'use_cases_article',
                })
              }
            >
              <h3 className="font-bold text-slate-950">Subscription use cases</h3>
              <p className="mt-2 text-sm text-slate-600">
                Ten practical situations where monthly development capacity may fit.
              </p>
            </Link>
            <Link
              to="/insights/how-monthly-software-development-capacity-works"
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              onClick={() =>
                trackSdaasEvent('sdaas_article_click', {
                  cta_location: 'related_service_link',
                  destination: '/insights/how-monthly-software-development-capacity-works',
                  content_type: 'supporting_article',
                })
              }
            >
              <h3 className="font-bold text-slate-950">How monthly capacity works</h3>
              <p className="mt-2 text-sm text-slate-600">
                How backlog, estimation, QA and urgent work fit within finite monthly capacity.
              </p>
            </Link>
            <Link
              to="/insights/how-to-choose-a-software-development-partner"
              className="rounded-2xl border border-slate-200 p-5 transition hover:border-emerald-300"
              onClick={() =>
                trackSdaasEvent('sdaas_article_click', {
                  cta_location: 'related_service_link',
                  destination: '/insights/how-to-choose-a-software-development-partner',
                  content_type: 'supporting_article',
                })
              }
            >
              <h3 className="font-bold text-slate-950">Choosing a development partner</h3>
              <p className="mt-2 text-sm text-slate-600">
                Buyer checklist for discovery, delivery, QA, ownership and handover.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <p className="mb-8 max-w-3xl text-base leading-7 text-slate-300">
            {SDAAS_SECTION_TRANSITIONS.finalCta}
          </p>

          <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Find Out Whether Monthly Development Capacity Fits Your Business
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-200">
                Tell us what you are maintaining, improving or trying to build. We will review the likely
                workload and recommend whether a subscription, a defined project or a discovery phase is
                the better route.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <CapacityCtaLink
                  location="final_cta"
                  label="Request a Capacity Recommendation"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-lg bg-emerald-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-300"
                >
                  Request a Capacity Recommendation
                </CapacityCtaLink>
              {SDAAS_PILLAR_GUIDE_HREF ? (
                <Link
                  to={SDAAS_PILLAR_GUIDE_HREF}
                  className="inline-flex min-h-[52px] items-center justify-center rounded-lg border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/40 hover:bg-white/10"
                  onClick={() =>
                    trackSdaasEvent('sdaas_guide_click', {
                      cta_location: 'final_cta',
                      destination: SDAAS_PILLAR_GUIDE_HREF,
                      content_cluster: 'sdaas',
                    })
                  }
                >
                  Read the Complete Guide
                </Link>
              ) : null}
              </div>
            </div>
            <CommercialSectionVisual
              image={SDAAS_COMMERCIAL_IMAGES.consultationCta}
              title="Start with a practical capacity recommendation"
              description="We review your backlog, systems and workload before recommending subscription, project or discovery as the better route."
              caption="Request a capacity recommendation based on your real development priorities."
              variant="dark"
              background="transparent"
            />
          </div>
        </div>
      </section>

      <span className="sr-only">{SDAAS_SEO.title}</span>
    </main>
  );
};
