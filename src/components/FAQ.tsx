import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'Why not just hire a full-time developer?',
    answer: 'The annual cost of a full-time senior-level developer now exceeds ₹80,00,000, plus benefits (and good luck finding one available). Aside from that, you may not always have enough work to keep them busy at all times, so you’re stuck paying for time you aren’t able to utilize. With our monthly plan, you can pause and resume your subscription as often as you need to ensure you’re only paying your developer when you have work available for them.',
  },
  {
    question: 'Is there a limit to how many requests I can have?',
    answer: 'Once subscribed, you’re able to add as many development requests to your queue as you’d like, and they will be delivered one by one.',
  },
  {
    question: 'How fast will I receive my requests?',
    answer: 'On average, most requests are completed in just two days or less. However, more complex requests can take longer.',
  },
  {
    question: 'Who are the developers?',
    answer: 'You might be surprised to hear this, but Primewayz is actually an agency of one. This means you’ll work directly with me, the founder of Primewayz Infortech Private Limited. However, power-ups requests such as custom illustrations or complex animations are provided by partner designers.',
  },
  {
    question: 'What if I don’t like the code?',
    answer: 'No worries! We’ll continue to revise the code until you’re 100% satisfied.',
  },
  {
    question: 'What if I only have a single request?',
    answer: 'That’s fine. You can pause your subscription when finished and return when you have additional development needs. There’s no need to let the remainder of your subscription go to waste.',
  },
];

export const FAQ = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4"
          >
            Common questions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600"
          >
            Everything you need to know about our productized service.
          </motion.p>
        </div>

        <motion.div 
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="border border-zinc-200 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 transition-colors"
              >
                <span className="text-lg font-bold text-zinc-900">{faq.question}</span>
                {activeIndex === index ? (
                  <Minus className="w-5 h-5 text-zinc-500" />
                ) : (
                  <Plus className="w-5 h-5 text-zinc-500" />
                )}
              </button>
              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-6 text-zinc-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
