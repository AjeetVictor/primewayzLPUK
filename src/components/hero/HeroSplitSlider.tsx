import { TrackedLink } from '../common/TrackedLink';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { HeroHeadlineSlide } from './heroHeadlineSlides';
import { SelfAuditCta } from '../SelfAuditCta';
import { RemoteItHeroSlideVisual } from '../visuals/RemoteItVisuals';
import { getDataLayerUtmPayload, pushDataLayer } from '../../lib/dataLayer';

type HeroSplitSliderProps = {
  slides: HeroHeadlineSlide[];
  interval?: number;
  className?: string;
};

const DEFAULT_INTERVAL = 5200;

const heroVisuals = {
  'remote-it-hero': RemoteItHeroSlideVisual,
} as const;

function trackHeroSlideView(slide: HeroHeadlineSlide): void {
  if (!slide.tracking) return;

  pushDataLayer({
    event: 'home_hero_slide_view',
    slide_name: slide.tracking.slideName,
    service: slide.tracking.service,
    page_path: '/',
    ...getDataLayerUtmPayload(),
  });
}

function trackHeroCtaClick(slide: HeroHeadlineSlide, ctaText: string, destinationUrl: string): void {
  if (!slide.tracking) return;

  pushDataLayer({
    event: 'home_hero_cta_click',
    slide_name: slide.tracking.slideName,
    service: slide.tracking.service,
    cta_text: ctaText,
    cta_location: slide.tracking.ctaLocation,
    destination_url: destinationUrl,
    page_path: '/',
    ...getDataLayerUtmPayload(),
  });
}

export const HeroSplitSlider = ({
  slides,
  interval = DEFAULT_INTERVAL,
  className,
}: HeroSplitSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const viewedSlidesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, interval);
    return () => window.clearInterval(timer);
  }, [slides.length, interval, paused]);

  useEffect(() => {
    const slide = slides[activeIndex];
    if (!slide || viewedSlidesRef.current.has(slide.id)) return;
    viewedSlidesRef.current.add(slide.id);
    trackHeroSlideView(slide);
  }, [activeIndex, slides]);

  if (slides.length === 0) return null;

  const activeSlide = slides[activeIndex];
  const VisualComponent = activeSlide.visualKey ? heroVisuals[activeSlide.visualKey] : null;

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const contentMotion = reducedMotion
    ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
      };

  return (
    <div
      className={`relative w-full ${className ?? ''}`.trim()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[min(70vh,640px)] gap-0 items-stretch">
        <div className="relative order-1 min-h-[280px] sm:min-h-[360px] lg:min-h-0 overflow-hidden rounded-2xl lg:rounded-none lg:rounded-l-3xl">
          <AnimatePresence mode="wait" initial={false}>
            {VisualComponent ? (
              <motion.div
                key={activeSlide.id}
                initial={{ opacity: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: reducedMotion ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0.05 : 0.65, ease: 'easeInOut' }}
                className="absolute inset-0"
              >
                <VisualComponent />
              </motion.div>
            ) : (
              <motion.img
                key={activeSlide.id}
                src={activeSlide.image}
                alt={activeSlide.imageAlt}
                initial={{ opacity: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: reducedMotion ? 1 : 0 }}
                transition={{ duration: reducedMotion ? 0.05 : 0.65, ease: 'easeInOut' }}
                width={1200}
                height={799}
                className="absolute inset-0 h-full w-full object-cover"
                loading={activeIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={activeIndex === 0 ? 'high' : 'auto'}
              />
            )}
          </AnimatePresence>
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-24 bg-gradient-to-l from-white via-white/60 to-transparent lg:w-40"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-zinc-900/20 to-transparent lg:hidden" aria-hidden />
        </div>

        <div className="relative z-10 order-2 flex flex-col justify-center lg:-ml-12 xl:-ml-20 lg:pl-0">
          <div className="relative flex min-h-0">
            <div className="hidden lg:flex flex-col shrink-0 w-2 overflow-hidden rounded-l-2xl border-y border-l border-zinc-200/80 bg-white/40">
              <div className="flex-1 min-h-[40%] bg-emerald-500" />
              <div className="flex-1 min-h-[30%] bg-emerald-600/90" />
              <div className="flex-1 min-h-[30%] bg-orange-500" />
            </div>

            <div className="flex-1 rounded-2xl border border-zinc-200/80 bg-white/90 p-6 shadow-xl shadow-zinc-900/5 backdrop-blur-md sm:p-8 lg:max-w-[50rem] lg:rounded-l-none lg:border-l-0 lg:py-10 lg:pl-10 lg:pr-8 xl:pl-12">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeSlide.id}
                  initial={contentMotion.initial}
                  animate={contentMotion.animate}
                  exit={contentMotion.exit}
                  transition={{ duration: reducedMotion ? 0.05 : 0.52, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-5 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-700">
                    {activeSlide.badge}
                  </div>

                  <h1 className="text-3xl font-bold leading-[1.12] tracking-tight text-zinc-900 sm:text-4xl md:text-[2.85rem]">
                    {activeSlide.headline}
                  </h1>

                  <p className="mt-3 text-xl font-semibold leading-tight text-blue-700 sm:text-2xl">
                    {activeSlide.highlight}
                  </p>

                  <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-600 md:text-lg">
                    {activeSlide.description}
                  </p>

                  {activeSlide.bullets?.length ? (
                    <ul className="mt-4 space-y-2">
                      {activeSlide.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2 text-sm leading-6 text-zinc-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </motion.div>
              </AnimatePresence>

              <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
                  <TrackedLink
                    href={activeSlide.primaryCtaHref}
                    ctaText={activeSlide.primaryCtaLabel}
                    ctaLocation="hero_primary"
                    trackingParams={{
                      hero_slide: activeSlide.headline,
                    }}
                    onClick={() => trackHeroCtaClick(activeSlide, activeSlide.primaryCtaLabel, activeSlide.primaryCtaHref)}
                    whileHover={reducedMotion ? undefined : { scale: 1.01 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-7 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-zinc-900/15 transition-colors hover:bg-zinc-800 sm:w-auto"
                  >
                    {activeSlide.primaryCtaLabel}
                    <ArrowRight className="h-4 w-4" />
                  </TrackedLink>

                  <TrackedLink
                    href={activeSlide.secondaryCtaHref}
                    ctaText={activeSlide.secondaryCtaLabel}
                    ctaLocation="hero_secondary"
                    trackingParams={{
                      hero_slide: activeSlide.headline,
                    }}
                    onClick={() => trackHeroCtaClick(activeSlide, activeSlide.secondaryCtaLabel, activeSlide.secondaryCtaHref)}
                    whileHover={reducedMotion ? undefined : { scale: 1.01 }}
                    whileTap={reducedMotion ? undefined : { scale: 0.99 }}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-7 py-3.5 text-[15px] font-semibold text-zinc-900 shadow-sm transition-colors hover:border-zinc-400 sm:w-auto"
                  >
                    {activeSlide.secondaryCtaLabel}
                  </TrackedLink>

                  <SelfAuditCta
                    variant="hero"
                    utmContent="homepage_hero"
                    ctaLocation="homepage_hero"
                  />
                </div>

                <div className="flex items-center gap-2" role="tablist" aria-label="Hero slide controls">
                  {slides.map((slide, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        aria-label={`Show hero slide ${index + 1}`}
                        onClick={() => goToSlide(index)}
                        className={`h-2.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/70 ${
                          isActive ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="sr-only" aria-live="polite">
                Slide {activeIndex + 1} of {slides.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
