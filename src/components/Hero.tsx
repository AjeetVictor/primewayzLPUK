import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { HeroSplitSlider } from './hero/HeroSplitSlider';
import { heroHeadlineSlides } from './hero/heroHeadlineSlides';
import { SubscriptionCapabilitiesSection } from './sections/SubscriptionCapabilitiesSection';
import { SITE_CONTAINER_CLASS } from '../constants/siteLayout';

export const Hero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const ySlow = useTransform(scrollYProgress, [0, 1], [0, 800]);
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 2000]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white pt-20"
    >
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <motion.div
          style={{ y: ySlow, opacity }}
          className="absolute left-10 top-20 h-64 w-64 rounded-full bg-emerald-100/30 opacity-50 blur-3xl"
        />
        <motion.div
          style={{ y: yFast, opacity }}
          className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-indigo-100/30 opacity-50 blur-3xl"
        />
      </div>

      <div className={`relative z-10 ${SITE_CONTAINER_CLASS}`}>
        <motion.div style={{ scale, opacity }} className="w-full">
          <HeroSplitSlider slides={heroHeadlineSlides} />
          <SubscriptionCapabilitiesSection />
        </motion.div>
      </div>
    </section>
  );
};
