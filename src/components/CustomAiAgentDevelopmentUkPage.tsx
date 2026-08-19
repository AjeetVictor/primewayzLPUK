import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  DatabaseZap,
  Network,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import { SelfAuditCta } from './SelfAuditCta';
import { DigitalSystemsReviewCtaGroup } from './conversion/DigitalSystemsReviewCtaGroup';

const services = [
  {
    title: 'Custom AI agent development',
    description:
      'Design task-specific AI agents around real business processes, with clear goals, tool access, permissions and escalation paths.',
  },
  {
    title: 'AI workflow automation',
    description:
      'Automate multi-step work that needs more than fixed rules, including research, classification, drafting, routing, follow-up and operational hand-offs.',
  },
  {
    title: 'Business-system integration',
    description:
      'Connect AI agents with CRM, ERP, internal applications, databases, APIs and approved SaaS tools so they can work inside existing operations.',
  },
  {
    title: 'Knowledge and RAG agents',
    description:
      'Ground agent responses in approved company documents, policies, product data and internal knowledge instead of relying on generic model memory.',
  },
  {
    title: 'Human-in-the-loop controls',
    description:
      'Keep approvals, exception handling and sensitive actions under human control while AI handles repetitive preparation and coordination work.',
  },
  {
    title: 'Monitoring and continuous improvement',
    description:
      'Review outputs, failure cases, latency, cost and workflow performance so the agent can improve as business rules and systems evolve.',
  },
];

const platforms = [
  'CRM & ERP',
  'Internal APIs',
  'Knowledge bases',
  'Databases',
  'SaaS tools',
  'Approval workflows',
];

const benefits = [
  {
    title: 'Reduce repetitive coordination',
    description:
      'Let AI handle repeatable research, preparation, classification and routing work while your team stays focused on decisions and exceptions.',
  },
  {
    title: 'Use business knowledge more effectively',
    description:
      'Ground agents in approved documents, policies, product information and operational knowledge so useful context is available inside the workflow.',
  },
  {
    title: 'Connect AI with existing systems',
    description:
      'Move beyond isolated chat by allowing approved agents to retrieve data and use CRM, ERP, APIs, databases and other business tools.',
  },
  {
    title: 'Keep humans in control',
    description:
      'Add approvals, permissions, escalation rules and review points so sensitive or high-impact actions do not happen without appropriate oversight.',
  },
  {
    title: 'Improve workflow consistency',
    description:
      'Give recurring tasks a clearer process for context gathering, action selection, output formatting and escalation instead of relying on ad-hoc manual steps.',
  },
  {
    title: 'Start focused and improve safely',
    description:
      'Begin with one valuable workflow, measure the outcome, review failure cases and expand only when the agent is proving useful and controllable.',
  },
];

const processSteps = [
  {
    title: 'Review',
    description:
      'We identify the workflow, systems, data, repetitive tasks, decision points and operational risks before proposing where an AI agent should be used.',
  },
  {
    title: 'Design',
    description:
      'We define the agent role, approved knowledge, tools, APIs, permissions, human approvals, fallback behaviour and measurable success criteria.',
  },
  {
    title: 'Build & integrate',
    description:
      'We implement the agent, connect approved systems and data sources, add guardrails, and test the end-to-end workflow against realistic scenarios.',
  },
  {
    title: 'Validate & improve',
    description:
      'We review outputs, exceptions, latency, cost and workflow performance, then refine prompts, tools, retrieval and controls as the process evolves.',
  },
];

const heroLinks = [
  {
    label: 'All UK SME services',
    href: '/services',
  },
  {
    label: 'Software subscription',
    href: '/software-development-subscription-uk',
  },
  {
    label: 'CRM automation',
    href: '/crm-automation-support',
  },
  {
    label: 'Digital Systems Review',
    href: '/digital-systems-review',
  },
  {
    label: 'Delivery examples',
    href: '/success-stories',
  },
];

const relatedLinks = [
  {
    title: 'All UK SME Support Services',
    href: '/services',
    anchor: 'Compare Primewayz UK service areas',
    text: 'See how AI agent development fits alongside software engineering, CRM automation, managed support, website improvement and remote technical capacity.',
  },
  {
    title: 'Software Development Subscription',
    href: '/software-development-subscription-uk',
    anchor: 'Explore ongoing software development capacity',
    text: 'Useful when AI agent work sits inside a wider backlog of application changes, APIs, integrations, product improvements and technical delivery.',
  },
  {
    title: 'CRM Setup & Automation',
    href: '/crm-automation-support',
    anchor: 'Explore CRM and workflow automation',
    text: 'Use conventional CRM rules and workflow automation where deterministic processes are enough, and introduce AI only where context or reasoning adds value.',
  },
  {
    title: 'Digital Systems Review',
    href: '/digital-systems-review',
    anchor: 'Start with a Digital Systems Review',
    text: 'If the right AI use case is not yet clear, start by reviewing the workflow, systems, data and operational friction before deciding what should be automated.',
  },
];

export function CustomAiAgentDevelopmentUkPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" />

        <div className="relative mx-auto max-w-[1200px]">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Primewayz UK
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-emerald-300">
                Custom AI Agents & Workflow Automation
              </p>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Custom AI Agent Development for UK Businesses
              </h1>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
                Build practical AI agents around your existing business systems, data and workflows.
                Primewayz helps UK businesses design and integrate custom AI agents that can retrieve
                approved knowledge, use APIs and tools, coordinate multi-step work, and keep sensitive
                decisions under human control.
              </p>

              <div className="mt-8 flex flex-col gap-4">
                <DigitalSystemsReviewCtaGroup
                  sourceLocation="service_page"
                  serviceArea="AI Agents & Workflow Automation"
                  primaryPlacement="ai_agent_hero_primary"
                  secondaryPlacement="ai_agent_hero_secondary"
                  variant="onDark"
                />
                <a
                  href="#ai-agent-services"
                  className="inline-flex min-h-[44px] w-fit items-center text-sm font-medium text-white/75 underline-offset-2 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50"
                >
                  View AI agent capabilities
                </a>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {heroLinks.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white/85 transition hover:border-emerald-300/50 hover:bg-white/15 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/20 backdrop-blur">
              <h2 className="text-xl font-bold">Best suited for</h2>

              <div className="mt-5 space-y-4">
                {[
                  'Repetitive knowledge or coordination work still depends heavily on manual effort.',
                  'Your team works across several systems and needs AI to use them safely and consistently.',
                  'A basic chatbot is not enough because the workflow needs data, tools, actions and context.',
                  'You need approvals, guardrails and human escalation around AI-driven actions.',
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                    <p className="text-sm leading-6 text-slate-100">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SelfAuditCta variant="inline" utmContent="ai_agent_page" ctaLocation="ai_agent_page" />

      <section id="ai-agent-services" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              What is included
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Custom AI agent development built around real business workflows
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              We help UK businesses identify where AI agents can add practical value, connect them
              with approved systems and knowledge, and build controlled workflows that combine
              AI reasoning, tool use, automation and human oversight.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div key={service.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <DatabaseZap className="h-5 w-5 text-emerald-600" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">
              AI agents work best when they are connected to the wider system
            </h3>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-700">
              AI agent development works best when the workflow, application architecture, APIs, data access and operational ownership are considered together.
              Many businesses combine AI implementation with{' '}
              <Link
                to="/maintenance"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                website maintenance
              </Link>
              {' '}and{' '}
              <Link
                to="/software-development-subscription-uk"
                className="font-black text-emerald-700 hover:text-emerald-800"
              >
                ongoing software development support
              </Link>
              {' '}so agent capabilities, integrations, business rules and application improvements can evolve together. Ongoing development capacity can support controlled refinement after the first AI workflow is released.
            </p>
          </div>
        </div>
      </section>

      <section id="ai-agent-integrations" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Integration layer
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                Connect AI agents with the systems your business already uses
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                The right agent architecture depends on your current applications, available APIs,
                data permissions, security boundaries and workflow. We design integrations around
                the systems you already rely on rather than forcing unnecessary replacement.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {platforms.map((platform) => (
                <div key={platform} className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <p className="font-bold text-slate-950">{platform}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ai-agent-benefits" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Business outcomes
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Useful AI agents reduce friction without removing operational control
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              The goal is not to add AI everywhere. It is to use agents where they can reduce
              repetitive work, improve access to knowledge, coordinate systems and make workflows
              more consistent while people retain control of important decisions.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-950">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="ai-agent-delivery-rhythm" className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
                Delivery rhythm
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                A controlled AI agent delivery process
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600">
                We start with a defined workflow, design the agent around real constraints,
                connect approved tools and knowledge, test realistic scenarios, and improve the
                system only after its behaviour can be reviewed and measured.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {processSteps.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {index + 1}
                    </div>
                    <h3 className="font-bold text-slate-950">{step.title}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="ai-agent-control-areas" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-6">
            <Network className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-5 text-xl font-bold">System & tool integration</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Connect agents with approved APIs, databases, CRM, ERP, internal applications
              and SaaS tools so actions happen inside existing business systems.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <Workflow className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-5 text-xl font-bold">Agentic workflow orchestration</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Coordinate multi-step work across retrieval, reasoning, tool use, approvals,
              escalation and human hand-off instead of relying on one isolated prompt.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 p-6">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
            <h3 className="mt-5 text-xl font-bold">Monitoring & evaluation</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Track outputs, exceptions, latency, cost and workflow performance so agent
              behaviour can be reviewed and improved rather than treated as a black box.
            </p>
          </div>
        </div>
      </section>



      <section id="ai-agent-related-services" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">
              Related UK SME support paths
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Connect AI agent development with the systems around it
            </h2>

            <p className="mt-4 text-lg leading-8 text-slate-600">
              AI agent development becomes more useful when software architecture, business workflows,
              data access, integrations and operational ownership are treated as one connected
              delivery problem rather than separate AI experiments.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {relatedLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                aria-label={link.anchor}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
              >
                <h3 className="text-xl font-bold text-slate-950">{link.title}</h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">{link.text}</p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                  {link.anchor}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#000A2D] px-4 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-8 rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur lg:grid-cols-[1fr_0.7fr] lg:items-center">
          <div>
            <ShieldCheck className="h-10 w-10 text-emerald-300" />

            <h2 className="mt-5 text-3xl font-bold tracking-tight">
              Start with an AI workflow review
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-200">
              Share the workflow, systems, repetitive work or knowledge bottleneck you want to improve.
              We will review the submitted context and identify whether an AI agent, conventional
              automation or a wider software change is the most practical next step.
            </p>
          </div>

          <DigitalSystemsReviewCtaGroup
            sourceLocation="service_page"
            serviceArea="AI Agents & Workflow Automation"
            primaryPlacement="ai_agent_final_primary"
            secondaryPlacement="ai_agent_final_secondary"
            variant="onDark"
          />
        </div>
      </section>
    </main>
  );
}
