import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import { shellClasses } from '../../constants/designSystem';
import { DELIVERY_PROCESS_INTRO, deliveryProcessSteps } from '../../content/deliveryProcessSteps';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { ProcessFlowConnectorIcon } from '../icons/AuditLedProcessIcons';
import { cn } from '../../utils/cn';

const processCardClassName =
  'relative flex min-h-[350px] min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-brand-border bg-white px-7 pb-10 pt-6 text-center shadow-[0_2px_3px_rgba(7,41,76,0.04),0_12px_30px_rgba(20,68,109,0.09)] sm:min-h-[370px] md:min-h-[390px] xl:min-h-[416px] xl:px-8 xl:pb-[42px] xl:pt-[26px]';

type ProcessStepCardProps = {
  number: number;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

function ProcessStepCard({ number, title, description, icon: Icon }: ProcessStepCardProps) {
  return (
    <>
      <p
        className="absolute left-[23px] top-[23px] m-0 grid h-[52px] w-[52px] place-items-center rounded-full bg-brand-surface text-[25px] font-bold leading-none text-brand-blue xl:left-[26px] xl:top-[26px] xl:h-[58px] xl:w-[58px] xl:text-[29px]"
        aria-hidden="true"
      >
        {number}
      </p>

      <div
        className="mx-auto grid h-[127px] w-[104px] place-items-end justify-center text-brand-blue xl:h-[136px]"
        aria-hidden="true"
      >
        <Icon className="block h-[88px] w-[88px] overflow-visible xl:h-24 xl:w-24" />
      </div>

      <h3 className="mt-5 text-[30px] font-bold leading-[1.14] tracking-[-0.035em] text-brand-navy xl:mt-[26px] xl:text-[34px]">
        {title}
      </h3>
      <p className="mx-auto mt-[18px] max-w-[285px] text-lg leading-[1.65] text-slate-600 xl:mt-[22px] xl:max-w-[255px] xl:text-xl xl:leading-[1.72]">
        {description}
      </p>
    </>
  );
}

function ProcessConnector() {
  return (
    <div
      className={cn(
        'pointer-events-none relative z-[2] mx-auto my-3 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#e5eff7] bg-brand-surface text-brand-blue shadow-[0_6px_14px_rgba(30,83,124,0.09)]',
        'md:hidden xl:grid xl:my-0 xl:mx-[-1px] xl:h-[58px] xl:w-[58px] xl:self-center',
        'rotate-90 xl:rotate-0',
      )}
      aria-hidden="true"
    >
      <ProcessFlowConnectorIcon className="block h-[26px] w-[26px] xl:h-[30px] xl:w-[30px]" />
    </div>
  );
}

export const AuditLedProcessSection = () => {
  const reveal = useRevealMotion();

  return (
    <section
      id="delivery-process"
      className="scroll-mt-28 overflow-hidden bg-[radial-gradient(circle_at_50%_100%,rgba(229,240,249,0.14),transparent_43%)] bg-white px-4 py-[58px] sm:px-5 md:px-7 md:py-[68px] xl:px-6 xl:pb-[154px] xl:pt-[73px]"
      aria-labelledby="delivery-process-title"
    >
      <div className="mx-auto w-full max-w-[1438px]">
        <motion.header
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-[38px] max-w-[1110px] text-center md:mb-[42px] xl:mb-[50px]"
        >
          <p className={shellClasses.sectionEyebrow}>One delivery process</p>
          <h2
            id="delivery-process-title"
            className="mt-5 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-[2.625rem] xl:mt-7 xl:text-[3.625rem] xl:leading-[1.08]"
          >
            Review
            <span className="mx-[0.04em] inline-block translate-y-[-0.02em] font-medium text-brand-blue xl:mx-[0.11em]">
              →
            </span>
            Prioritise
            <span className="mx-[0.04em] inline-block translate-y-[-0.02em] font-medium text-brand-blue xl:mx-[0.11em]">
              →
            </span>
            Improve
            <span className="mx-[0.04em] inline-block translate-y-[-0.02em] font-medium text-brand-blue xl:mx-[0.11em]">
              →
            </span>
            Track
          </h2>
          <p className={`mx-auto mt-6 max-w-[820px] ${shellClasses.sectionLead}`}>{DELIVERY_PROCESS_INTRO}</p>
        </motion.header>

        <div
          className="flex w-full flex-col md:grid md:grid-cols-2 md:gap-7 xl:grid xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] xl:items-center xl:gap-0"
          role="list"
        >
          {deliveryProcessSteps.flatMap((step, index) => {
            const items = [
              <motion.article
                key={step.id}
                role="listitem"
                initial={reveal.initial({ opacity: 0, y: 20 })}
                whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className={cn(processCardClassName, 'h-full min-h-0')}
              >
                <ProcessStepCard {...step} />
              </motion.article>,
            ];

            if (index < deliveryProcessSteps.length - 1) {
              items.push(<ProcessConnector key={`connector-${step.id}`} />);
            }

            return items;
          })}
        </div>
      </div>
    </section>
  );
};
