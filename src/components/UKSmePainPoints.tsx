import { motion } from 'motion/react';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';

const painPoints = [
  {
    title: 'Website changes take too long',
    description:
      'Small content changes, landing page updates, tracking fixes, and technical improvements often wait too long because there is no regular delivery owner.',
  },
  {
    title: 'CRM leads are messy or duplicated',
    description:
      'Website enquiries, email follow-ups, spreadsheets, and CRM records can become disconnected, making it harder to track opportunities and respond consistently.',
  },
  {
    title: 'Automations break without ownership',
    description:
      'Forms, notifications, integrations, booking flows, reports, and third-party tools need regular review so small issues do not quietly affect daily operations.',
  },
  {
    title: 'Hiring full-time developers is costly',
    description:
      'Many UK SMEs need steady monthly progress, not the overhead of permanent hiring or a large agency contract for every small improvement.',
  },
];

const supportAreas = [
  'Website updates and maintenance',
  'CRM workflow cleanup',
  'Lead capture and enquiry routing',
  'Business automation',
  'Technical SEO foundations',
  'Integrations and reporting',
];

export const UKSmePainPoints = () => (
  <section className="bg-white py-20 sm:py-24" aria-labelledby="uk-sme-pain-points-heading">
    <div className={SITE_CONTAINER_CLASS}>
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Built for UK SME realities
          </p>

          <h2
            id="uk-sme-pain-points-heading"
            className="mt-4 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl"
          >
            UK SME digital support, without the usual delivery gap
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-700">
            Many small businesses do not need a large agency contract or a full-time developer.
            They need reliable monthly support for the systems that already run their business —
            website updates, CRM workflows, lead capture, integrations, automation, technical SEO
            foundations, and regular improvements.
          </p>

          <p className="mt-5 text-lg leading-8 text-zinc-700">
            Primewayz UK gives your business a practical monthly delivery team that plans,
            executes, tests, and releases work in a clear rhythm, so your digital systems keep
            improving without constant re-briefing.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {supportAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800"
              >
                {area}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {painPoints.map((point, index) => (
            <motion.article
              key={point.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-3xl border border-zinc-100 bg-zinc-50 p-6 shadow-sm transition hover:-translate-y-1 hover:bg-white hover:shadow-lg"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white">
                {index + 1}
              </div>

              <h3 className="mt-5 text-xl font-bold text-zinc-950">{point.title}</h3>

              <p className="mt-3 text-sm leading-6 text-zinc-600">{point.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  </section>
);