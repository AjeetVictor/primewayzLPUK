import { ArrowRight, Code2, LifeBuoy, Network, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildInternalUtmUrl, REMOTE_RESOURCE_CAMPAIGN } from '../lib/utm';
import { getDataLayerUtmPayload, pushDataLayer } from '../lib/dataLayer';

const remoteItCardHref = buildInternalUtmUrl(
  '/remote-it-resource-augmentation',
  'homepage_service_card',
  REMOTE_RESOURCE_CAMPAIGN,
  'service_card',
);

const servicePaths = [
  {
    title: 'Software Development Subscription',
    description:
      'Monthly software delivery support for websites, automation, integrations, SEO foundations, and ongoing digital improvements.',
    href: '/software-development-subscription-uk',
    icon: Code2,
    anchor: 'Software development subscription for UK SMEs',
  },
  {
    title: 'Website Maintenance Subscription',
    description:
      'Reliable website updates, bug fixes, technical SEO checks, landing page improvements, analytics support, and monthly care.',
    href: '/website-maintenance-subscription-uk',
    icon: LifeBuoy,
    anchor: 'Website maintenance subscription for UK SMEs',
  },
  {
    title: 'CRM Integration & Support',
    description:
      'Connect CRM with website forms, email, reporting, support workflows, and automation for cleaner business operations.',
    href: '/crm-integration-support-uk',
    icon: Network,
    anchor: 'CRM integration support for UK SMEs',
  },
  {
    title: 'Remote IT Resources',
    description:
      'Extend your UK team with remote developers, QA testers, website support, digital support and project coordination.',
    href: remoteItCardHref,
    icon: Users,
    anchor: 'View service',
    isNew: true,
    tracked: true,
  },
];

const supportingLinks = [
  {
    label: 'View all UK SME services',
    href: '/services',
  },
  {
    label: 'See UK SME delivery examples',
    href: '/#success-stories',
  },
];

function trackServiceCardClick(destinationUrl: string): void {
  pushDataLayer({
    event: 'service_card_click',
    service: REMOTE_RESOURCE_CAMPAIGN,
    card_location: 'homepage_service_grid',
    destination_url: destinationUrl,
    ...getDataLayerUtmPayload(),
  });
}

export const ServicePathCards = () => {
  return (
    <section id="services" className="relative overflow-hidden bg-white py-24 sm:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-emerald-600">
            Explore Primewayz UK service paths
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#000A2D] sm:text-4xl">
            Choose the support route that fits your next operational priority
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Start with the area causing the most friction today — software delivery, website maintenance,
            CRM integration, or remote IT capacity — then build a practical monthly improvement rhythm around it.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {supportingLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-[#000A2D] transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {servicePaths.map((item) => {
            const Icon = item.icon;
            const isInternalRoute = item.href.startsWith('/') && !item.href.includes('?');

            const cardContent = (
              <>
                <div className="mb-6 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#000A2D] text-white transition group-hover:bg-emerald-600">
                    <Icon className="h-6 w-6" />
                  </div>
                  {item.isNew ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                      New
                    </span>
                  ) : null}
                </div>

                <h3 className="text-xl font-black text-[#000A2D]">{item.title}</h3>

                <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-emerald-700">
                  {item.anchor}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </>
            );

            if (item.tracked) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => trackServiceCardClick(item.href)}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl"
                  aria-label={item.anchor}
                >
                  {cardContent}
                </Link>
              );
            }

            if (isInternalRoute) {
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl"
                  aria-label={item.anchor}
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <a
                key={item.href}
                href={item.href}
                className="group rounded-3xl border border-slate-200 bg-slate-50 p-7 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:bg-white hover:shadow-xl"
                aria-label={item.anchor}
              >
                {cardContent}
              </a>
            );
          })}
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-emerald-100 bg-emerald-50/60 p-6 text-center">
          <p className="text-sm font-semibold leading-7 text-slate-700">
            Not sure where to begin? Review all{' '}
            <Link to="/services" className="font-black text-emerald-700 hover:text-emerald-800">
              UK SME digital support services
            </Link>{' '}
            or look at our{' '}
            <Link to="/#success-stories" className="font-black text-emerald-700 hover:text-emerald-800">
              UK SME delivery examples
            </Link>{' '}
            before choosing a monthly support path.
          </p>
        </div>
      </div>
    </section>
  );
};
