import { motion, useInView } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { TrackedLink } from '../common/TrackedLink';
import { RemoteItCapacityVisual } from '../visuals/RemoteItVisuals';
import { buildInternalUtmUrl, REMOTE_RESOURCE_CAMPAIGN } from '../../lib/utm';
import { BOOK_CALL_URL } from '../../constants/contactBooking';
import { getDataLayerUtmPayload, pushDataLayer } from '../../lib/dataLayer';

const benefits = [
  'Start with part-time or monthly support',
  'Add developers, QA, digital or support resources',
  'Reduce recruitment delays and delivery bottlenecks',
  'Keep work structured with updates and checkpoints',
];

const primaryHref = buildInternalUtmUrl(
  '/remote-it-resource-augmentation',
  'homepage_section',
  REMOTE_RESOURCE_CAMPAIGN,
  'remote_capacity_section_primary_cta',
);

const secondaryHref = buildInternalUtmUrl(
  BOOK_CALL_URL,
  'homepage_section',
  REMOTE_RESOURCE_CAMPAIGN,
  'remote_capacity_section_secondary_cta',
);

function trackSectionView(): void {
  pushDataLayer({
    event: 'homepage_section_view',
    section_name: 'Remote IT Capacity',
    service: REMOTE_RESOURCE_CAMPAIGN,
    page_path: '/',
    ...getDataLayerUtmPayload(),
  });
}

function trackSectionCta(ctaText: string, destinationUrl: string): void {
  pushDataLayer({
    event: 'homepage_section_cta_click',
    section_name: 'Remote IT Capacity',
    service: REMOTE_RESOURCE_CAMPAIGN,
    cta_text: ctaText,
    destination_url: destinationUrl,
    page_path: '/',
    ...getDataLayerUtmPayload(),
  });
}

export const RemoteItCapacitySection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  useEffect(() => {
    if (isInView) trackSectionView();
  }, [isInView]);

  return (
  <section ref={sectionRef} className="relative overflow-hidden bg-white py-24 sm:py-28">
    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-12 lg:grid-cols-2 lg:items-center"
      >
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-600">
            Remote IT capacity
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl">
            Need extra IT capacity without hiring full-time?
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Primewayz UK helps SMEs and growing teams extend their delivery capacity
            with remote developers, QA testers, website support, automation specialists
            and digital support resources.
          </p>

          <ul className="mt-8 space-y-3">
            {benefits.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-7 text-slate-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <TrackedLink
              href={primaryHref}
              ctaText="Explore Remote IT Resources"
              ctaLocation="remote_capacity_section_primary"
              onClick={() => trackSectionCta('Explore Remote IT Resources', primaryHref)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Explore Remote IT Resources
            </TrackedLink>
            <TrackedLink
              href={secondaryHref}
              ctaText="Book a call"
              ctaLocation="remote_capacity_section_secondary"
              eventType="book_call_click"
              onClick={() => trackSectionCta('Book a call', secondaryHref)}
              className="inline-flex min-h-[48px] items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:border-slate-400"
            >
              Book a call
            </TrackedLink>
          </div>
        </div>

        <RemoteItCapacityVisual />
      </motion.div>
    </div>
  </section>
  );
};
