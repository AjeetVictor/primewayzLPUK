import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote:
      "The monthly delivery model makes planning much easier. We can prioritise website, SEO, and CRM improvements without starting a fresh project every time.",
    author: "UK SME Owner",
    company: "Retail & Services Business",
    image: "https://picsum.photos/seed/uk-owner/100/100",
  },
  {
    quote:
      "Primewayz UK gives us a practical way to keep digital work moving. The focus is clear: small releases, clean communication, and visible progress.",
    author: "Operations Lead",
    company: "UK Professional Services Team",
    image: "https://picsum.photos/seed/uk-ops/100/100",
  },
  {
    quote:
      "We needed regular technical support without hiring a full internal team. The subscription approach fits our budget and our pace.",
    author: "Managing Director",
    company: "UK Local Business",
    image: "https://picsum.photos/seed/uk-md/100/100",
  },
];

export const Testimonials = () => {
  return (
    <section id="testimonials" className="py-24 bg-zinc-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 mb-4"
          >
            Built for <span className="text-emerald-600 italic">UK SME teams</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            Primewayz UK is designed for businesses that need dependable monthly
            digital support without the cost and complexity of building a full in-house team.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <motion.div
              key={testimonial.company}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <Quote className="w-10 h-10 text-emerald-100 absolute top-6 right-8" />

              <p className="text-zinc-700 text-lg leading-relaxed mb-8 relative z-10">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full object-cover grayscale hover:grayscale-0 transition-all"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-zinc-900">{testimonial.author}</h4>
                  <p className="text-sm text-zinc-500">{testimonial.company}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
