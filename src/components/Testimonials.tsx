import { motion } from 'motion/react';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: "The most predictable development experience we've ever had. It's like having a senior team on tap.",
    author: "Sarah Chen",
    company: "CTO at FinFlow",
    image: "https://picsum.photos/seed/sarah/100/100"
  },
  {
    quote: "Primewayz transformed how we ship features. No more hiring headaches, just pure output.",
    author: "Marcus Thorne",
    company: "Founder of Nexus AI",
    image: "https://picsum.photos/seed/marcus/100/100"
  },
  {
    quote: "The subscription model is a game-changer for our budget planning. Highly recommended.",
    author: "Elena Rodriguez",
    company: "VP Engineering at CloudScale",
    image: "https://picsum.photos/seed/elena/100/100"
  }
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
            Trusted by <span className="text-emerald-600 italic">visionary teams</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-600 max-w-2xl mx-auto"
          >
            Don't just take our word for it. Here's how we're helping companies 
            build better software, faster.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
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
