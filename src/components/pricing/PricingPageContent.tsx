import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Info } from 'lucide-react';
import { CANONICAL_ROUTES } from '../../constants/canonicalRoutes';
import { shellClasses } from '../../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../../constants/siteLayout';
import {
  getActivePricingPlans,
  getNonEmptyEngagementCategories,
  PRICING_COMMERCIAL_POLICY,
  type PricingPlanDefinition,
  type PricingPlanSlug,
} from '../../data/pricing/helpers';
import { usePricingSelection } from '../../hooks/usePricingSelection';
import { trackPricingComparisonView, trackPricingCtaClick, trackPricingFaqOpen } from '../../lib/pricing/analytics';
import { cn } from '../../utils/cn';
import { useEffect, useId, useState } from 'react';
import { getPublishedSuccessStories } from '../../data/successStories';

const COMPARISON_ROWS = [
  { key: 'engagement', label: 'Engagement type', getValue: (p: PricingPlanDefinition) => p.engagementType.replace('_', ' ') },
  { key: 'price', label: 'Price', getValue: (p: PricingPlanDefinition) => `${p.displayedPrice}${p.billingPeriod === 'monthly' ? '/month' : ''}` },
  { key: 'billing', label: 'Billing period', getValue: (p: PricingPlanDefinition) => p.billingPeriod.replace('_', ' ') },
  { key: 'capacity', label: 'Capacity', getValue: (p: PricingPlanDefinition) => p.capacityLabel ?? 'Custom' },
  { key: 'pm', label: 'Product management', getValue: () => 'Included (consumes capacity)' },
  { key: 'ux', label: 'UX/UI', getValue: () => 'Included (consumes capacity)' },
  { key: 'dev', label: 'Development', getValue: () => 'Included (consumes capacity)' },
  { key: 'qa', label: 'QA/testing', getValue: () => 'Included (consumes capacity)' },
  { key: 'meetings', label: 'Meetings', getValue: () => 'Reasonable scheduled meetings included' },
  { key: 'reporting', label: 'Reporting', getValue: () => 'Delivery and progress reporting included' },
  { key: 'deployment', label: 'Deployment', getValue: () => 'Standard deployment included' },
  { key: 'rollover', label: 'Rollover', getValue: () => 'Up to 25% to next month (see policy)' },
  { key: 'additional', label: 'Additional capacity', getValue: () => 'By approval before work starts' },
  { key: 'commitment', label: 'Commitment', getValue: (p: PricingPlanDefinition) =>
    p.engagementType === 'foundation' ? 'One-off' : p.engagementType === 'custom' ? 'Per proposal' : '3-month initial, then rolling monthly' },
  { key: 'cancellation', label: 'Cancellation', getValue: (p: PricingPlanDefinition) =>
    p.engagementType === 'foundation' ? 'Per proposal' : '30 days notice after minimum commitment' },
  { key: 'bestFor', label: 'Best suited for', getValue: (p: PricingPlanDefinition) => p.bestFor[0] ?? '' },
] as const;

function buildPricingFaqs() {
  const policy = PRICING_COMMERCIAL_POLICY;
  return [
    { id: 'capacity', q: 'What does monthly capacity include?', a: policy.capacityDefinition },
    { id: 'meetings', q: 'Are meetings included?', a: policy.meetingTreatment },
    { id: 'qa', q: 'Is QA included?', a: policy.qaTreatment },
    { id: 'unused', q: 'What happens to unused capacity?', a: policy.unusedCapacityPolicy },
    { id: 'additional', q: 'Can I buy additional capacity?', a: policy.additionalCapacityPolicy },
    { id: 'commitment', q: 'Is there a minimum commitment?', a: policy.minimumCommitment },
    { id: 'cancellation', q: 'How do cancellation and notice work?', a: policy.cancellationPolicy },
    { id: 'switching', q: 'Can I upgrade or downgrade?', a: `${policy.upgradePolicy} ${policy.downgradePolicy}` },
    { id: 'foundation', q: 'What is included in a Foundation Sprint?', a: `${policy.foundationSprintIncludes.join('; ')}. It does not automatically include: ${policy.foundationSprintExcludes.slice(0, 4).join('; ')}.` },
    { id: 'third_party', q: 'Are third-party costs included?', a: policy.thirdPartyCostPolicy },
    { id: 'vat', q: 'Does the displayed price include VAT?', a: policy.vatTreatment },
    { id: 'delays', q: 'What happens when client feedback is delayed?', a: policy.clientDelayPolicy },
    { id: 'emergency', q: 'Can Primewayz handle emergency work?', a: policy.emergencyWorkPolicy },
    { id: 'which_plan', q: 'Which plan should I choose?', a: 'Start with Foundation Sprint if priorities are unclear. Choose Maintenance for stable systems needing continuity. Choose Essential, Growth or Scale for active roadmaps. Discuss Enterprise or a custom programme for larger transformations.' },
  ];
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PricingPlanDefinition;
  selected: boolean;
  onSelect: (slug: PricingPlanSlug) => void;
}) {
  return (
    <article
      id={`pricing-plan-${plan.slug}`}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        shellClasses.sectionCard,
        selected && 'border-brand-blue ring-2 ring-brand-blue/20',
        plan.featured && !selected && 'border-brand-blue/40 ring-1 ring-brand-blue/10',
      )}
    >
      <div className="flex min-h-[28px] items-start justify-between gap-3">
        <div>
          <p className={shellClasses.sectionEyebrow}>{plan.engagementType.replace('_', ' ')}</p>
          <h3 className="mt-2 text-xl font-bold text-brand-navy">{plan.name}</h3>
        </div>
        {selected ? (
          <span className="rounded-md border border-brand-blue/30 bg-brand-surface px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-blue">
            Selected
          </span>
        ) : plan.featured ? (
          <span className="rounded-md border border-brand-blue/25 bg-brand-surface px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-blue">
            Recommended
          </span>
        ) : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{plan.shortDescription}</p>

      <div className="mt-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {plan.slug === 'foundation-sprint' ? '2026 launch price' : 'Starting from'}
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-brand-navy">
          {plan.displayedPrice}
          {plan.billingPeriod === 'monthly' ? <span className="text-base font-semibold text-slate-500">/month</span> : null}
        </p>
        {plan.referencePriceLabel ? (
          <p className="mt-1 text-sm text-slate-500 line-through">{plan.referencePriceLabel}</p>
        ) : null}
      </div>

      {plan.capacityLabel ? (
        <p className="mt-4 text-sm font-semibold text-brand-navy">{plan.capacityLabel}</p>
      ) : null}

      <p className="mt-3 text-sm text-slate-600">{plan.bestFor[0]}</p>

      <ul className="mt-4 space-y-2">
        {plan.inclusions.slice(0, 4).map((item) => (
          <li key={item} className="flex gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-blue" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      {plan.importantBoundary ? (
        <p className="mt-4 rounded-lg bg-brand-surface px-3 py-2 text-xs leading-5 text-slate-600">
          <strong className="text-brand-navy">Important:</strong> {plan.importantBoundary}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => onSelect(plan.slug)}
        aria-pressed={selected}
        className={cn(
          'mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40',
          selected
            ? 'bg-brand-blue text-white hover:bg-brand-blue/90'
            : 'border border-brand-border bg-white text-brand-navy hover:border-brand-blue/35 hover:bg-brand-surface',
        )}
      >
        {plan.ctaLabel}
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
      </button>
    </article>
  );
}

function FaqAccordion({ faqs }: { faqs: ReturnType<typeof buildPricingFaqs> }) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        const isOpen = openId === faq.id;
        const panelId = `${baseId}-${faq.id}`;
        return (
          <div key={faq.id} className="rounded-xl border border-brand-border bg-white">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => {
                setOpenId(isOpen ? null : faq.id);
                trackPricingFaqOpen({ question_id: faq.id, page_path: '/pricing' });
              }}
            >
              <span className="font-semibold text-brand-navy">{faq.q}</span>
              <ChevronDown className={cn('h-5 w-5 shrink-0 transition', isOpen && 'rotate-180')} aria-hidden />
            </button>
            {isOpen ? (
              <div id={panelId} className="border-t border-brand-border px-5 py-4 text-sm leading-7 text-slate-600">
                {faq.a}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function PricingPageContent() {
  const plans = getActivePricingPlans();
  const categories = getNonEmptyEngagementCategories();
  const faqs = buildPricingFaqs();
  const proofStories = getPublishedSuccessStories().slice(0, 2);
  const { selection, selectedPlan, selectionSource, invalidQueryPlan, hydrated, selectPlan } =
    usePricingSelection();
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 'recurring');

  useEffect(() => {
    trackPricingComparisonView({ page_path: '/pricing' });
  }, []);

  const filteredPlans =
    categories.find((c) => c.id === activeCategory)?.plans ?? plans;

  const foundationPlan = plans.find((p) => p.slug === 'foundation-sprint');

  return (
    <div className={cn(SITE_CONTAINER_CLASS, 'pb-20 pt-8 sm:pb-24 sm:pt-10')}>
      <nav className="text-sm font-semibold text-slate-500" aria-label="Breadcrumb">
        <Link to="/" className="transition hover:text-brand-cyan">Home</Link>
        <span className="mx-2 text-slate-400" aria-hidden>&gt;</span>
        <span className="text-slate-700">Pricing</span>
      </nav>

      {/* Hero */}
      <section className="mx-auto mt-8 max-w-4xl text-center" aria-labelledby="pricing-hero-title">
        <h1 id="pricing-hero-title" className={shellClasses.sectionHeading}>
          Pricing & engagement options
        </h1>
        <p className={cn(shellClasses.sectionLead, 'mx-auto mt-5 max-w-3xl')}>
          Primewayz offers several engagement models. Choose according to delivery need, not price alone.
          Monthly capacity includes multidisciplinary delivery work — product management, UX, development,
          QA, meetings and reporting all consume capacity.
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Unsure which route fits?{' '}
          <a href="#plan-guidance" className="font-semibold text-brand-blue underline-offset-2 hover:underline">
            Read plan guidance
          </a>{' '}
          or request a recommendation below.
        </p>
        {hydrated && selection && selectionSource === 'session' ? (
          <p className="mt-4 rounded-lg border border-brand-blue/20 bg-brand-surface px-4 py-2 text-sm text-brand-navy">
            Selected from the homepage: <strong>{selectedPlan?.name ?? selection.planName}</strong>
          </p>
        ) : null}
        {invalidQueryPlan ? (
          <p className="mt-4 text-sm text-amber-700">That plan link is not recognised — browse the options below.</p>
        ) : null}
      </section>

      {/* Engagement navigation */}
      <section className="mt-10" aria-label="Engagement types">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={activeCategory === category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40',
                activeCategory === category.id
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-brand-border bg-white text-brand-navy hover:bg-brand-surface',
              )}
            >
              {category.label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">
          {categories.find((c) => c.id === activeCategory)?.description}
        </p>
      </section>

      {/* Plan cards */}
      <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Pricing plans">
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.slug}
            plan={plan}
            selected={selection?.planSlug === plan.slug}
            onSelect={selectPlan}
          />
        ))}
      </section>

      {/* Plan guidance */}
      <section id="plan-guidance" className="mt-16 scroll-mt-24" aria-labelledby="plan-guidance-title">
        <h2 id="plan-guidance-title" className="text-2xl font-bold text-brand-navy">
          Which plan should I choose?
        </h2>
        <ul className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
          <li><strong className="text-brand-navy">Unclear priorities or inherited systems:</strong> start with Foundation Sprint.</li>
          <li><strong className="text-brand-navy">Stable website needing fixes and operational care:</strong> Maintenance Mode.</li>
          <li><strong className="text-brand-navy">Active roadmap with regular development:</strong> Essential, Growth or Scale.</li>
          <li><strong className="text-brand-navy">Complex transformation or multi-team programme:</strong> discuss Enterprise or a custom programme.</li>
        </ul>
      </section>

      {/* Comparison table */}
      <section className="mt-16" aria-labelledby="comparison-title">
        <h2 id="comparison-title" className="text-2xl font-bold text-brand-navy">Compare plans</h2>
        <p className="mt-2 text-sm text-slate-600">Scroll horizontally on smaller screens to view all columns.</p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-brand-border">
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-brand-surface">
                <th scope="col" className="sticky left-0 z-10 bg-brand-surface px-4 py-3 font-bold text-brand-navy">Feature</th>
                {plans.map((plan) => (
                  <th
                    key={plan.slug}
                    scope="col"
                    className={cn(
                      'min-w-[140px] px-4 py-3 font-bold text-brand-navy',
                      selection?.planSlug === plan.slug && 'bg-brand-blue/5',
                    )}
                    aria-selected={selection?.planSlug === plan.slug}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row.key} className="border-t border-brand-border">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 font-semibold text-slate-700">{row.label}</th>
                  {plans.map((plan) => (
                    <td
                      key={plan.slug}
                      className={cn(
                        'px-4 py-3 text-slate-600',
                        selection?.planSlug === plan.slug && 'bg-brand-blue/5 font-medium text-brand-navy',
                      )}
                    >
                      {row.getValue(plan)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Capacity explainer */}
      <section className="mt-16 rounded-2xl border border-brand-border bg-white p-6 sm:p-8" aria-labelledby="capacity-title">
        <h2 id="capacity-title" className="text-2xl font-bold text-brand-navy">How monthly capacity works</h2>
        <p className="mt-4 text-sm leading-7 text-slate-700">{PRICING_COMMERCIAL_POLICY.capacityDefinition}</p>
        <p className="mt-4 text-sm leading-7 text-slate-700">
          Work is prioritised with you each month. Capacity is not unlimited and additional capacity requires approval.
          {` ${PRICING_COMMERCIAL_POLICY.rolloverPolicy}`}
        </p>
        <div className="mt-5 rounded-lg bg-brand-surface p-4 text-sm leading-7 text-slate-700">
          <strong className="text-brand-navy">Illustrative example:</strong> A month may include requirement clarification,
          UX refinement, development, testing, deployment and delivery reporting. The exact mix depends on agreed priorities —
          this is not a contractual hour allocation.
        </div>
      </section>

      {/* Foundation Sprint */}
      {foundationPlan ? (
        <section className="mt-16" aria-labelledby="foundation-title">
          <h2 id="foundation-title" className="text-2xl font-bold text-brand-navy">Foundation Sprint</h2>
          <p className="mt-4 text-sm leading-7 text-slate-700">{foundationPlan.shortDescription}</p>
          <p className="mt-2 text-lg font-bold text-brand-navy">{foundationPlan.displayedPrice} · one-time</p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-bold text-brand-navy">Produces</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {PRICING_COMMERCIAL_POLICY.foundationSprintIncludes.map((item) => (
                  <li key={item} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-brand-blue" aria-hidden />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-brand-navy">Does not automatically include</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {PRICING_COMMERCIAL_POLICY.foundationSprintExcludes.slice(0, 6).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <Link
            to={`${CANONICAL_ROUTES.digitalSystemsReview}?plan=foundation-sprint`}
            onClick={() => trackPricingCtaClick({
              cta_text: foundationPlan.ctaLabel,
              cta_location: 'pricing_foundation_section',
              page_path: '/pricing',
              selection,
              journey_type: 'pricing_foundation',
            })}
            className={cn(shellClasses.btnHeroPrimary, 'mt-6')}
          >
            {foundationPlan.ctaLabel}
          </Link>
        </section>
      ) : null}

      {/* Commercial policy summary */}
      <section className="mt-16" aria-labelledby="policy-title">
        <h2 id="policy-title" className="text-2xl font-bold text-brand-navy">Commercial policy summary</h2>
        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ['What consumes capacity', PRICING_COMMERCIAL_POLICY.capacityDefinition],
            ['Rollover', PRICING_COMMERCIAL_POLICY.rolloverPolicy],
            ['Additional capacity', PRICING_COMMERCIAL_POLICY.additionalCapacityPolicy],
            ['Commitment', PRICING_COMMERCIAL_POLICY.minimumCommitment],
            ['Cancellation', PRICING_COMMERCIAL_POLICY.cancellationPolicy],
            ['Switching', `${PRICING_COMMERCIAL_POLICY.upgradePolicy} ${PRICING_COMMERCIAL_POLICY.downgradePolicy}`],
            ['Client dependencies', PRICING_COMMERCIAL_POLICY.clientDelayPolicy],
            ['Third-party costs', PRICING_COMMERCIAL_POLICY.thirdPartyCostPolicy],
            ['VAT', PRICING_COMMERCIAL_POLICY.vatTreatment],
          ].map(([term, detail]) => (
            <div key={term} className="rounded-xl border border-brand-border bg-white p-4">
              <dt className="font-bold text-brand-navy">{term}</dt>
              <dd className="mt-2 text-sm leading-6 text-slate-600">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Proof section */}
      <section className="mt-16" aria-labelledby="proof-title">
        <h2 id="proof-title" className="text-2xl font-bold text-brand-navy">Delivery capability</h2>
        {proofStories.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {proofStories.map((story) => (
              <article key={story.slug} className={shellClasses.sectionCard}>
                <p className={shellClasses.sectionEyebrow}>{story.relationshipType}</p>
                <h3 className="mt-2 font-bold text-brand-navy">{story.shortTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{story.homepageSummary}</p>
                <p className="mt-3 text-sm font-semibold text-brand-navy">{story.keyOutcome}</p>
                <Link to={`${CANONICAL_ROUTES.successStories}/${story.slug}`} className="mt-4 inline-flex text-sm font-semibold text-brand-blue">
                  Read the delivery summary
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            {/* TODO: Add approved client evidence with explicit permission before expanding this section. */}
            Primewayz delivers structured digital systems work for UK SMEs — from discovery through ongoing capacity.
          </p>
        )}
      </section>

      {/* FAQs */}
      <section className="mt-16" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-2xl font-bold text-brand-navy">Pricing FAQs</h2>
        <div className="mt-6">
          <FaqAccordion faqs={faqs} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-16 rounded-2xl border border-brand-border bg-brand-surface p-6 sm:p-8" aria-labelledby="final-cta-title">
        <div className="flex items-start gap-4">
          <Info className="h-6 w-6 shrink-0 text-brand-blue" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="final-cta-title" className="text-2xl font-bold text-brand-navy">
              {selection ? `Continue with ${selectedPlan?.name ?? selection.planName}` : 'Request a plan recommendation'}
            </h2>
            {selection ? (
              <p className="mt-2 text-sm text-slate-600">
                {selectedPlan?.displayedPrice}{selectedPlan?.billingPeriod === 'monthly' ? '/month' : ''} ·{' '}
                <button type="button" className="font-semibold text-brand-blue underline-offset-2 hover:underline" onClick={() => setActiveCategory('recurring')}>
                  Change plan
                </button>
              </p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                Share your context and we will recommend the most appropriate engagement route.
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={selection
                  ? `${CANONICAL_ROUTES.digitalSystemsReview}?plan=${selection.planSlug}`
                  : CANONICAL_ROUTES.digitalSystemsReview}
                onClick={() => trackPricingCtaClick({
                  cta_text: selection ? 'Open enquiry' : 'Request recommendation',
                  cta_location: 'pricing_final_cta',
                  page_path: '/pricing',
                  selection,
                  journey_type: selection ? 'pricing_selected_plan' : 'pricing_recommendation',
                })}
                className={shellClasses.btnHeroPrimary}
              >
                {selection ? 'Open enquiry with selected plan' : 'Request a digital systems review'}
              </Link>
              <Link to={CANONICAL_ROUTES.pricing} className={shellClasses.btnHeroSecondary}>
                Compare all plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function buildPricingFaqStructuredData() {
  const faqs = buildPricingFaqs();
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
}
