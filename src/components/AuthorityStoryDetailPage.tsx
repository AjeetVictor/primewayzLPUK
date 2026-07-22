import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Layers,
  Lightbulb,
  Smartphone,
  Target,
  Wrench,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import {
  getPublishedSuccessStoryBySlug,
  SUCCESS_STORIES_BASE_PATH,
  type SuccessStoryIconKey,
} from '../data/successStories';
import { TrackedLink } from './common/TrackedLink';

const iconByKey: Record<SuccessStoryIconKey, typeof Layers> = {
  layers: Layers,
  'book-open': BookOpen,
  smartphone: Smartphone,
};

export const AuthorityStoryDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const story = slug ? getPublishedSuccessStoryBySlug(slug) : undefined;

  if (!story) {
    return (
      <main className="min-h-screen bg-white pt-32 pb-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
            Success story not found
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
            This case study is not available
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-zinc-600">
            The story may have moved, or the link may no longer be current.
          </p>
          <Link
            to={SUCCESS_STORIES_BASE_PATH}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to success stories
          </Link>
        </div>
      </main>
    );
  }

  const StoryIcon = iconByKey[story.iconKey];

  return (
    <main className="bg-white text-[#000A2D]">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white pt-12 pb-20">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-[#2FA8DF]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#E4005A]/10 blur-3xl" />

        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <Link
            to={SUCCESS_STORIES_BASE_PATH}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#0057C8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to success stories
          </Link>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-black uppercase tracking-[0.24em] text-[#E4005A]"
              >
                {story.industry}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mt-5 text-4xl font-black tracking-tight text-[#000A2D] sm:text-5xl lg:text-6xl"
              >
                {story.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="mt-6 max-w-2xl text-lg leading-8 text-slate-600"
              >
                {story.summary}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-700"
              >
                <StoryIcon className="h-4 w-4 text-emerald-600" />
                {story.relationshipType}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 }}
                className="mt-8 flex flex-wrap gap-4"
              >
                <TrackedLink
                  href={story.ctaHref}
                  ctaText={story.ctaLabel}
                  ctaLocation={`success_story_${story.slug}`}
                  eventType="book_call_click"
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  {story.ctaLabel}
                </TrackedLink>
                <Link
                  to={SUCCESS_STORIES_BASE_PATH}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300"
                >
                  View all stories
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.12 }}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-xl"
            >
              <img
                src={story.image}
                alt={story.imageAlt}
                loading="eager"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="border-t border-slate-200 bg-white px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Category</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{story.category}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-100 px-6 py-20 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Target className="h-6 w-6 text-[#E4005A]" />
              <h2 className="text-2xl font-black tracking-tight text-[#000A2D]">Business problem</h2>
            </div>
            <ul className="space-y-4">
              {story.problem.map((item) => (
                <li key={item} className="flex gap-3 text-base leading-7 text-slate-600">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#E4005A]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-6 flex items-center gap-3">
              <Wrench className="h-6 w-6 text-[#0057C8]" />
              <h2 className="text-2xl font-black tracking-tight text-[#000A2D]">Primewayz responsibility</h2>
            </div>
            <ul className="space-y-4">
              {story.responsibility.map((item) => (
                <li key={item} className="flex gap-3 text-base leading-7 text-slate-600">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-emerald-600" />
            <h2 className="text-2xl font-black tracking-tight text-[#000A2D]">Delivered solution</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {story.solution.map((item) => (
              <article
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-base leading-7 text-slate-700">{item}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-2xl font-black tracking-tight text-[#000A2D]">Important delivery decisions</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Practical choices that shaped how the work was delivered without destabilising the business context.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {story.deliveryDecisions.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-4 text-sm leading-7 text-emerald-950"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-[#000A2D] px-6 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-2xl font-black tracking-tight">Delivery outcomes</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300">
            Qualitative outcomes we can state publicly without relying on unsupported performance metrics.
          </p>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {story.outcomes.map((item) => (
              <li
                key={item}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-slate-100"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-2xl font-black tracking-tight text-[#000A2D]">Technologies and technical scope</h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Technical areas involved in the delivery. Specific tooling is included only where it supports clarity
            of scope, not as a technology claim for its own sake.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3">
            {story.technologies.map((item) => (
              <li
                key={item}
                className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-2xl font-black tracking-tight text-[#000A2D]">Related Primewayz services</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {story.relatedServicePaths.map((href, index) => (
              <Link
                key={href}
                to={href}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-800 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                {story.relatedServiceLabels[index] ?? href}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-[1200px] rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center sm:p-12">
          <h2 className="text-3xl font-black tracking-tight text-[#000A2D]">Planning similar work?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Talk through your platform, product or customer-experience priorities with the Primewayz UK team.
          </p>
          <TrackedLink
            href={story.ctaHref}
            ctaText={story.ctaLabel}
            ctaLocation={`success_story_${story.slug}_footer`}
            eventType="book_call_click"
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#000A2D] px-8 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            {story.ctaLabel}
            <ArrowRight className="ml-2 h-4 w-4" />
          </TrackedLink>
        </div>
      </section>
    </main>
  );
};
