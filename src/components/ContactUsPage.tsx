import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ContactForm } from './ContactForm';
import { SelfAuditCta } from './SelfAuditCta';

export const ContactUsPage = () => (
  <main className="min-h-screen bg-white">
    <section className="border-b border-slate-200 bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Primewayz UK
        </Link>
        <h1 className="mt-6 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Contact Primewayz UK</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Request a free digital visibility review, ask about monthly delivery, or discuss website,
          CRM, analytics, and maintenance support for your UK business.
        </p>
      </div>
    </section>
    <SelfAuditCta variant="inline" utmContent="contact_page" ctaLocation="contact_page" />
    <ContactForm />
  </main>
);
