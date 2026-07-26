import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { shellClasses } from '../constants/designSystem';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';
import {
  getPublishedSuccessStories,
  getSuccessStoryPath,
} from '../data/successStories';
import { successStoryIconByKey } from '../data/successStoryIcons';
import { useRevealMotion } from '../hooks/useRevealMotion';
import { ShareButton } from './ShareButton';

const publishedStories = getPublishedSuccessStories();

export const SuccessStories = () => {
  const reveal = useRevealMotion();

  return (
    <section id="success-stories" className="overflow-hidden bg-white py-20 md:py-24">
      <div className={SITE_CONTAINER_CLASS}>
        <div className="mb-12 max-w-3xl md:mb-14">
          <motion.p
            initial={reveal.initial({ opacity: 0, y: 16 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true }}
            className={shellClasses.sectionEyebrow}
          >
            Proof and delivery experience
          </motion.p>
          <motion.h2
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true }}
            className={`mt-4 ${shellClasses.sectionHeading}`}
          >
            Practical experience across the digital systems businesses depend on
          </motion.h2>
          <motion.p
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className={`mt-5 ${shellClasses.sectionLead}`}
          >
            Selected work across long-running business applications, customer-facing platforms and
            structured product delivery.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {publishedStories.map((story, index) => {
            const Icon = successStoryIconByKey[story.iconKey];
            const href = getSuccessStoryPath(story.slug);
            const serviceHref = story.relatedServicePaths[0];
            const serviceLabel = story.relatedServiceLabels[0];

            return (
              <motion.article
                key={story.slug}
                initial={reveal.initial({ opacity: 0, y: 24 })}
                whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className={shellClasses.sectionCard}
              >
                <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
                  <img
                    src={story.image}
                    alt={story.imageAlt}
                    loading="lazy"
                    width={640}
                    height={480}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute left-3 top-3">
                    <span className="rounded-full border border-brand-border bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-navy">
                      {story.relationshipType}
                    </span>
                  </div>
                  <div className="absolute right-3 top-3">
                    <ShareButton
                      title={story.title}
                      url={`https://uk.primewayz.com${href}`}
                    />
                  </div>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-surface text-brand-blue">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>

                <h3 className="mt-4 text-xl font-bold text-brand-navy">{story.shortTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-brand-navy">Problem: </span>
                  {story.problem[0]}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-brand-navy">Primewayz contribution: </span>
                  {story.responsibility[0]}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  <span className="font-semibold text-brand-navy">Result: </span>
                  {story.homepageSummary}
                </p>

                <div className="mt-5 flex flex-col gap-2">
                  {serviceHref && serviceLabel ? (
                    <Link
                      to={serviceHref}
                      className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-blue transition hover:text-brand-navy"
                    >
                      {serviceLabel}
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  ) : null}
                  <Link
                    to={href}
                    className="inline-flex min-h-[44px] items-center gap-2 text-sm font-bold text-brand-navy transition hover:text-brand-blue"
                  >
                    Read success story
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
