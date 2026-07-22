import { motion } from 'motion/react';
import { useRevealMotion } from '../hooks/useRevealMotion';
import { ArrowUpRight } from 'lucide-react';
import { ShareButton } from './ShareButton';
import { Link } from 'react-router-dom';
import { CONTACT_ENQUIRY_URL } from '../constants/contactBooking';
import { getPublishedSuccessStories, getSuccessStoryPath } from '../data/successStories';
import { successStoryIconByKey } from '../data/successStoryIcons';

const publishedStories = getPublishedSuccessStories();

const accentStyles = {
  emerald: {
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    highlightBg: 'bg-emerald-50',
    highlightBorder: 'border-emerald-100',
    highlightText: 'text-emerald-800',
  },
  indigo: {
    iconBg: 'bg-indigo-100',
    iconText: 'text-indigo-600',
    highlightBg: 'bg-indigo-50',
    highlightBorder: 'border-indigo-100',
    highlightText: 'text-indigo-800',
  },
  amber: {
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    highlightBg: 'bg-amber-50',
    highlightBorder: 'border-amber-100',
    highlightText: 'text-amber-800',
  },
} as const;

export const SuccessStories = () => {
  const reveal = useRevealMotion();

  return (
    <section id="success-stories" className="overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <motion.p
              initial={reveal.initial({ opacity: 0, y: 16 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true }}
              className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600"
            >
              Delivery experience
            </motion.p>
            <motion.h2
              initial={reveal.initial({ opacity: 0, y: 20 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true }}
              className="mb-6 text-3xl font-bold tracking-tight text-zinc-900 md:text-5xl"
            >
              Practical experience across the digital systems businesses depend on
            </motion.h2>
            <motion.p
              initial={reveal.initial({ opacity: 0, y: 20 })}
              whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-zinc-600"
            >
              Our work spans long-running business applications, customer-facing platforms, workflow
              automation, product engineering and ongoing technical support.
            </motion.p>
          </div>
          <motion.a
            href={CONTACT_ENQUIRY_URL}
            initial={reveal.initial({ opacity: 0, x: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, x: 0 })}
            viewport={{ once: true }}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-2 rounded-lg px-2 font-bold text-zinc-900 transition-colors hover:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            Discuss your UK requirements
            <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          </motion.a>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {publishedStories.map((story, index) => {
            const Icon = successStoryIconByKey[story.iconKey];
            const styles = accentStyles[story.accentColor];
            const href = getSuccessStoryPath(story.slug);

            return (
              <motion.div
                key={story.slug}
                initial={reveal.initial({ opacity: 0, y: 30 })}
                whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition-all duration-300 group-hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                  <img
                    src={story.image}
                    alt={story.imageAlt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute left-4 top-4">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-900 backdrop-blur-md">
                      {story.relationshipType}
                    </span>
                  </div>
                  <div className="absolute right-4 top-4">
                    <ShareButton
                      title={story.title}
                      url={`https://uk.primewayz.com${href}`}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${styles.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${styles.iconText}`} />
                    </motion.div>
                    <div
                      className={`rounded-2xl border px-3 py-2 text-right ${styles.highlightBorder} ${styles.highlightBg}`}
                    >
                      <div className={`text-xs font-bold uppercase tracking-[0.14em] ${styles.highlightText}`}>
                        {story.homepageSummary}
                      </div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 transition-colors group-hover:text-emerald-600">
                    {story.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500">{story.summary}</p>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">
                    {story.industry} · {story.category}
                  </p>

                  <Link
                    to={href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-900"
                  >
                    View delivery story
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
