import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

type BlogFaqItem = {
  question: string;
  answer: string;
};

type BlogFaqSectionProps = {
  faqs: BlogFaqItem[];
};

export const BlogFaqSection = ({ faqs }: BlogFaqSectionProps) => {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="mt-16 border-t border-zinc-200 pt-10" aria-labelledby="blog-faq-heading">
      <h2 id="blog-faq-heading" className="text-2xl font-bold tracking-tight text-zinc-900">
        Frequently asked questions
      </h2>

      <div className="mt-8 space-y-3">
        {faqs.map((faq, index) => {
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;
          const isOpen = openIndex === index;

          return (
            <div key={faq.question} className="border border-zinc-200 bg-white">
              <h3 className="m-0">
                <button
                  id={buttonId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <span className="pr-2 text-base font-semibold leading-6 text-zinc-900">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className="border-t border-zinc-100 px-5 pb-5 pt-4 text-sm leading-7 text-zinc-600"
              >
                {faq.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
