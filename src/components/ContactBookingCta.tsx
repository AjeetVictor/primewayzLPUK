import { motion } from 'motion/react';
import { TrackedLink } from './common/TrackedLink';
import { BOOK_CALL_URL, CONTACT_ENQUIRY_URL } from '../constants/contactBooking';

export function ContactBookingCta() {
  return (
    <section id="contact" className="py-24 bg-slate-50" aria-labelledby="homepage-contact-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          id="homepage-contact-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4"
        >
          Let&apos;s talk. Book your discovery call.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto"
        >
          Ready to discuss your UK website, CRM, or monthly support needs? Pick a time that suits you,
          or send a detailed enquiry if you prefer email first.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <TrackedLink
            href={BOOK_CALL_URL}
            ctaText="Book a discovery call"
            ctaLocation="homepage_booking_cta"
            eventType="book_call_click_home"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            Book a discovery call
          </TrackedLink>
          <TrackedLink
            href={CONTACT_ENQUIRY_URL}
            ctaText="Send an enquiry"
            ctaLocation="homepage_contact_enquiry"
            className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-slate-300 bg-white px-8 py-4 text-base font-semibold text-slate-800 transition hover:border-slate-400"
          >
            Send an enquiry
          </TrackedLink>
        </motion.div>
      </div>
    </section>
  );
}
