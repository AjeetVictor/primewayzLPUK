import { motion } from 'motion/react';
import { useRevealMotion } from '../../hooks/useRevealMotion';

export function HeroPromoJourney() {
  const reveal = useRevealMotion();

  return (
    <motion.a
      initial={reveal.initial({ opacity: 0, y: 16 })}
      animate={reveal.animate({ opacity: 1, y: 0 })}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      href="/custom-ai-agent-development-uk"
      aria-label="Explore AI agent development for UK SMEs"
      className="group relative block w-full self-stretch min-h-[620px] overflow-hidden rounded-2xl border border-brand-border/90 bg-white shadow-[0_24px_60px_-34px_rgba(0,10,45,0.34)] ring-1 ring-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan lg:justify-self-stretch lg:min-h-[680px] xl:min-h-[720px]"
    >
      <img
        src="/images/ai-agent-workflow-automation-uk-smes.webp"
        alt="AI agent workflow automation connecting website, CRM, software and business systems for UK SMEs"
        width={941}
        height={1672}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.01]"
      />
    </motion.a>
  );
}
