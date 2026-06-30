import { useMemo, useState, type FormEvent, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Send, X } from 'lucide-react';
import { useRevealMotion } from '../hooks/useRevealMotion';
import { apiUrl } from '../utils/apiUrl';

type StackFormData = {
  name: string;
  email: string;
  company: string;
  requirement: string;
};

const stackRows = [
  ['React', 'Next.js', 'TypeScript', 'Node.js', 'Java', 'Python', 'C#', 'Go', 'Swift'],
  ['Angular', 'Vue.js', 'PHP', 'Rails', '.NET', 'Android', 'iOS', 'Kotlin', 'PostgreSQL'],
];

const initialFormData: StackFormData = {
  name: '',
  email: '',
  company: '',
  requirement: '',
};

export const TechStack = () => {
  const reveal = useRevealMotion();
  const [selectedStack, setSelectedStack] = useState<string | null>(null);
  const [formData, setFormData] = useState<StackFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const allStacks = useMemo(() => stackRows.flat(), []);

  const closeModal = () => {
    setSelectedStack(null);
    setSubmitMessage(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setFormData(initialFormData);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedStack) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    const messageLines = [
      `Interested stack: ${selectedStack}`,
      formData.company.trim() ? `Company: ${formData.company.trim()}` : null,
      '',
      formData.requirement.trim() || 'Customer asked for stack consultation.',
    ].filter(Boolean);

    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          message: messageLines.join('\n'),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Unable to submit stack request right now.');
      }

      setSubmitMessage(`Thanks! We received your request for ${selectedStack}.`);
      setFormData(initialFormData);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-zinc-100 py-20 md:py-24 overflow-hidden">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          initial={reveal.initial({ opacity: 0, y: 20 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-100px' }}
          className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900"
        >
          Yes. We cover your tech stack<span className="text-orange-500">.</span>
        </motion.h2>
        <motion.p
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          transition={{ delay: 0.1 }}
          viewport={{ once: true, margin: '-100px' }}
          className="mx-auto mt-4 max-w-2xl text-base md:text-lg text-zinc-600"
        >
          Our 4,000+ team has expertise across almost every programming language.
        </motion.p>
      </div>

      <div className="mt-14 space-y-4">
        {stackRows.map((row, rowIndex) => {
          const marqueeItems = [...row, ...row];
          return (
            <div key={rowIndex} className="tech-marquee-row group relative overflow-hidden">
              <div
                className={`tech-marquee-track ${rowIndex % 2 === 0 ? 'tech-marquee-track-left' : 'tech-marquee-track-right'}`}
              >
                {marqueeItems.map((stack, idx) => (
                  <button
                    key={`${stack}-${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedStack(stack);
                      setSubmitMessage(null);
                      setSubmitError(null);
                    }}
                    className="whitespace-nowrap text-4xl md:text-6xl leading-[1.25] py-1 font-bold text-zinc-300 hover:text-zinc-700 focus-visible:text-zinc-700 transition-colors duration-300"
                    aria-label={`Open enquiry form for ${stack}`}
                  >
                    {stack}
                  </button>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-zinc-100 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-zinc-100 to-transparent" />
            </div>
          );
        })}
      </div>

      <div className="mt-10 flex justify-center">
        <button
          type="button"
          onClick={() => setSelectedStack(allStacks[0])}
          className="group inline-flex items-center gap-2 border-b border-zinc-400 pb-1 text-sm font-semibold text-zinc-700 hover:text-zinc-900 hover:border-zinc-800 transition-colors"
        >
          Our full repertoire
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <AnimatePresence>
        {selectedStack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-zinc-900/60 backdrop-blur-[2px] p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="mx-auto mt-10 w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Stack Enquiry</p>
                  <h3 className="mt-2 text-2xl font-bold text-zinc-900">{selectedStack}</h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    Share your requirement and our team will reach out with the right plan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 transition-colors"
                  aria-label="Close stack enquiry form"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    required
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                  />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Work email"
                    required
                    className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                  />
                </div>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Company name (optional)"
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                />
                <textarea
                  name="requirement"
                  value={formData.requirement}
                  onChange={handleChange}
                  rows={4}
                  placeholder={`What do you need help with in ${selectedStack}?`}
                  required
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none transition resize-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                />

                {submitError && <p className="text-sm text-rose-600">{submitError}</p>}
                {submitMessage && <p className="text-sm text-emerald-700">{submitMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-wait disabled:opacity-75"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Sending...' : `Send for ${selectedStack}`}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
