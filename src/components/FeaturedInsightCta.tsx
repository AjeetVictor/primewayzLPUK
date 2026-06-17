import { ArrowRight, ExternalLink } from 'lucide-react';
import type { FeaturedInsight } from '../data/insights';

type FeaturedInsightCtaProps = {
  insight: FeaturedInsight;
};

export const FeaturedInsightCta = ({ insight }: FeaturedInsightCtaProps) => {
  return (
    <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
        <a
          href={insight.url}
          target="_blank"
          rel="noreferrer"
          className="group block bg-[#000A2D] p-4 sm:p-5"
          aria-label={insight.title}
        >
          <img
            src={insight.image.src}
            alt={insight.image.alt}
            className="aspect-[16/9] w-full rounded-2xl object-cover shadow-lg transition duration-300 group-hover:scale-[1.01]"
            loading="lazy"
          />
        </a>

        <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <span className="mb-4 inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-700">
            {insight.label}
          </span>

          <h3 className="text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">
            {insight.title}
          </h3>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600 sm:text-base">
            {insight.description}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={insight.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#000A2D] px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              {insight.primaryCta}
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>

            <a
              href={insight.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 px-2 py-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
            >
              {insight.secondaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
