import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { HeroContentSliderProps } from './types';

const DEFAULT_INTERVAL = 4500;
const SWIPE_THRESHOLD = 40;

const wrapIndex = (index: number, total: number) => (index + total) % total;

const renderHeadline = (headline: string, accentText?: string) => {
  if (!accentText || !headline.includes(accentText)) {
    return headline;
  }

  const [beforeAccent, afterAccent] = headline.split(accentText);
  return (
    <>
      {beforeAccent}
      <span className="text-emerald-600 italic">{accentText}</span>
      {afterAccent}
    </>
  );
};

export const HeroContentSlider = ({
  slides,
  autoPlay = true,
  autoPlayInterval = DEFAULT_INTERVAL,
  className,
}: HeroContentSliderProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);

  const totalSlides = slides.length;
  const currentSlide = slides[activeIndex];

  const goToSlide = useCallback(
    (nextIndex: number) => {
      const normalized = wrapIndex(nextIndex, totalSlides);
      setDirection(normalized > activeIndex ? 1 : -1);
      setActiveIndex(normalized);
    },
    [activeIndex, totalSlides],
  );

  const goToNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => wrapIndex(prev + 1, totalSlides));
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => wrapIndex(prev - 1, totalSlides));
  }, [totalSlides]);

  useEffect(() => {
    if (!autoPlay || isPaused || reducedMotion || totalSlides <= 1) {
      return;
    }

    const timer = window.setTimeout(() => {
      goToNext();
    }, autoPlayInterval);

    return () => window.clearTimeout(timer);
  }, [activeIndex, autoPlay, autoPlayInterval, goToNext, isPaused, reducedMotion, totalSlides]);

  if (!currentSlide) {
    return null;
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goToPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goToNext();
    }
  };

  const headingVariants = reducedMotion
    ? {
        enter: { opacity: 1, y: 0 },
        center: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      }
    : {
        enter: (customDirection: number) => ({ opacity: 0, y: 14, x: customDirection * 6 }),
        center: { opacity: 1, y: 0, x: 0 },
        exit: (customDirection: number) => ({ opacity: 0, y: -10, x: customDirection * -6 }),
      };

  const containerClassName = `mx-auto max-w-6xl mb-10 ${className ?? ''}`.trim();

  return (
    <div
      className={containerClassName}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onKeyDown={onKeyDown}
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) {
          return;
        }
        const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = touchStartX.current - endX;
        if (Math.abs(delta) > SWIPE_THRESHOLD) {
          if (delta > 0) {
            goToNext();
          } else {
            goToPrev();
          }
        }
        touchStartX.current = null;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label="Hero subscription messaging slider"
      tabIndex={0}
    >
      <div className="relative min-h-[410px] md:min-h-[360px] rounded-[2rem] border border-zinc-200 bg-white/80 backdrop-blur-sm shadow-xl shadow-zinc-200/40 p-6 md:p-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSlide.id}
            custom={direction}
            variants={headingVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: reducedMotion ? 0.01 : 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 h-full"
            aria-live="polite"
          >
            <div className="text-left">
              <h1 className="text-3xl md:text-[2.7rem] leading-tight font-bold tracking-tight text-zinc-900 mb-4">
                {renderHeadline(currentSlide.headline, currentSlide.accentText)}
              </h1>
              <p className="text-base md:text-lg text-zinc-600 leading-relaxed max-w-2xl">
                {currentSlide.subheadline}
              </p>
            </div>

            <div className="hidden md:flex justify-center">
              <div className="relative w-full max-w-sm aspect-[4/3] rounded-[1.75rem] border border-zinc-100 bg-gradient-to-br from-zinc-900 to-zinc-800 overflow-hidden shadow-lg">
                <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-orange-500/90" />
                <div className="absolute left-5 right-5 bottom-6 space-y-3">
                  <div className="h-3 rounded-full bg-white/80 w-2/3" />
                  <div className="h-2.5 rounded-full bg-zinc-200/80 w-full" />
                  <div className="h-2.5 rounded-full bg-zinc-200/80 w-5/6" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-12 rounded-xl bg-white/15 border border-white/15" />
                    <div className="h-12 rounded-xl bg-emerald-400/20 border border-emerald-200/20" />
                    <div className="h-12 rounded-xl bg-white/15 border border-white/15" />
                  </div>
                </div>
                <div className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-zinc-100">
                  Subscription Delivery
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goToPrev}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Previous hero message"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Hero slide indicators">
          {slides.map((slide, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to message ${index + 1}`}
                onClick={() => goToSlide(index)}
                className={`relative h-2.5 overflow-hidden rounded-full transition-all ${
                  isActive ? 'w-12 bg-emerald-200' : 'w-2.5 bg-zinc-300 hover:bg-zinc-400'
                }`}
              >
                {isActive && !isPaused && !reducedMotion && autoPlay && (
                  <motion.span
                    key={`progress-${slide.id}-${activeIndex}`}
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    transition={{ duration: autoPlayInterval / 1000, ease: 'linear' }}
                    className="absolute inset-0 bg-emerald-600"
                  />
                )}
                {isActive && (!autoPlay || isPaused || reducedMotion) && (
                  <span className="absolute inset-0 bg-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={goToNext}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="Next hero message"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
