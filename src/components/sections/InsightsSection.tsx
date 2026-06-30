import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { ArrowRight, BarChart2, Target, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const CHIP_BG = '#E6F7F9';
const SECTION_BG = '#F8F9FC';
const BODY = '#334155';

type InsightCard = {
  category: string;
  categoryIcon: LucideIcon;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
};

const insightCards: InsightCard[] = [
  {
    category: 'Website visibility',
    categoryIcon: BarChart2,
    title: 'The visibility leaks we keep finding in UK business websites',
    description:
      'Common technical and content gaps that quietly reduce search visibility, trust and enquiries.',
    image: '/images/visibility.webp',
    imageAlt: 'Magnifying glass over website analytics charts',
    href: '/blog',
  },
  {
    category: 'Founders',
    categoryIcon: User,
    title: 'Why early-stage founders need a trust-ready website before beta launch',
    description:
      'How clarity, proof and product-stage communication build confidence before launch.',
    image: '/images/hero/client-workshop.webp',
    imageAlt: 'Founder workshop planning a product launch',
    href: '/blog',
  },
  {
    category: 'SEO / AEO / GEO',
    categoryIcon: Target,
    title: 'SEO, AEO and GEO: what UK SMEs should fix before creating more content',
    description:
      'A practical framework for improving discoverability across search and AI-assisted discovery.',
    image: '/images/ai-clarity-leadflow-linkedin.webp',
    imageAlt: 'Notebook with SEO, AEO and GEO checklist',
    href: '/blog',
  },
];

function InsightCardItem({
  category,
  categoryIcon: CategoryIcon,
  title,
  description,
  image,
  imageAlt,
  href,
}: InsightCard) {
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-[22px] border bg-white"
      style={{ borderColor: BORDER }}
    >
      <div className="aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={image}
          alt={imageAlt}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <span
          className="mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ backgroundColor: CHIP_BG, color: TEAL }}
        >
          <CategoryIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {category}
        </span>

        <h3 className="text-xl font-bold leading-snug text-brand-navy sm:text-[1.35rem]">{title}</h3>

        <p className="mt-3 flex-1 text-sm leading-7 sm:text-base" style={{ color: BODY }}>
          {description}
        </p>

        <Link
          to={href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-navy transition hover:gap-3"
        >
          Read article
          <ArrowRight className="h-4 w-4" strokeWidth={1.8} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

export const InsightsSection = () => {
  const reveal = useRevealMotion();

  return (
  <section
    id="insights"
    className="py-20 md:py-24"
    style={{ backgroundColor: SECTION_BG }}
    aria-labelledby="insights-heading"
  >
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <motion.div
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl"
        >
          <div className="flex items-center gap-3">
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
              Insights
            </p>
            <span className="h-0.5 w-10 rounded-full" style={{ backgroundColor: TEAL }} aria-hidden />
          </div>

          <h2
            id="insights-heading"
            className="mt-6 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl lg:text-[3.25rem]"
          >
            Latest visibility notes from
            <br className="hidden sm:block" />
            <span className="sm:sr-only"> </span>
            UK business website reviews
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8" style={{ color: BODY }}>
            Practical observations on website clarity, SEO readiness, trust signals, AEO/GEO and
            enquiry flow.
          </p>
        </motion.div>

        <motion.div
          initial={reveal.initial({ opacity: 0, x: 12 })}
          whileInView={reveal.whileInView({ opacity: 1, x: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-base font-bold text-brand-navy transition hover:gap-3"
          >
            View all insights
            <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
          </Link>
        </motion.div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {insightCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: index * 0.06 }}
            className="group"
          >
            <InsightCardItem {...card} />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
  );
};
