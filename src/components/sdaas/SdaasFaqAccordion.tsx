import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { sdaasFaqs } from '../../data/sdaas/commercialPage';
import type { SdaasEventName } from '../../lib/sdaasAnalytics';
import { trackSdaasEvent } from '../../lib/sdaasAnalytics';

export type FaqItem = {
  question: string;
  answer: string;
};

type SdaasFaqAccordionProps = {
  faqs?: readonly FaqItem[];
  eventName?: SdaasEventName;
  contentCluster?: string;
  extraParams?: Record<string, string | number | boolean | undefined>;
};

/**
 * Accessible FAQ accordion. Answers remain in the DOM for crawlers and screen readers.
 */
export function SdaasFaqAccordion({
  faqs = sdaasFaqs,
  eventName = 'sdaas_faq_open',
  contentCluster = 'sdaas',
  extraParams,
}: SdaasFaqAccordionProps = {}) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        const isOpen = openIndex === index;

        return (
          <div
            key={faq.question}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => {
                  const next = isOpen ? null : index;
                  setOpenIndex(next);
                  if (next !== null) {
                    trackSdaasEvent(eventName, {
                      cta_location: 'faq',
                      faq_index: index,
                      question_index: index,
                      question_slug: faq.question
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, '')
                        .slice(0, 80),
                      faq_question: faq.question,
                      question_text: faq.question,
                      content_cluster: contentCluster,
                      ...extraParams,
                    });
                  }
                }}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 sm:p-6"
              >
                <span className="pr-2 text-base font-semibold leading-6 text-slate-950 sm:text-lg">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                />
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className={isOpen ? 'border-t border-slate-100' : undefined}
            >
              <p className="px-5 pb-5 pt-4 text-sm leading-7 text-slate-600 sm:px-6 sm:pb-6">
                {faq.answer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
