import { useState, type ChangeEvent, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Lock,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiUrl } from '../../utils/apiUrl';
import { useRevealMotion } from '../../hooks/useRevealMotion';
import { trackEvent } from '../../lib/analytics';
import { getFirstUtmParams, getLatestUtmParams } from '../../lib/utm';
import {
  cleanUkPhoneInput,
  parseUkPhoneNumbers,
} from '../ContactForm';
import { COMPANY_TRUST_LINKS } from '../../constants/companyTrustLinks';

const TEAL = '#087E8B';
const BORDER = '#D7E7EC';
const ICON_SURFACE = '#EAF7FA';
const SECTION_BG = '#F4F8FC';
const BODY = '#334155';

const HELP_OPTIONS = [
  'Website & visibility support',
  'CRM & automation support',
  'Software & product delivery',
  'Monthly support / pricing',
  'Free website audit',
  'Other',
] as const;

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  helpTopic: string;
  message: string;
  agreed: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  name: '',
  email: '',
  company: '',
  phone: '',
  helpTopic: '',
  message: '',
  agreed: false,
};

const trustPoints = [
  {
    icon: CalendarDays,
    title: 'Quick response',
    text: 'We typically reply within one business day.',
  },
  {
    icon: ShieldCheck,
    title: 'Confidential & secure',
    text: 'Your information is safe with us and never shared.',
  },
  {
    icon: UsersRound,
    title: 'Expert guidance',
    text: 'Get clear advice on the right plan for your goals.',
  },
] as const;

function DotPattern() {
  return (
    <div
      className="pointer-events-none absolute right-8 top-12 hidden grid-cols-3 gap-2 opacity-30 md:grid"
      aria-hidden
    >
      {Array.from({ length: 15 }).map((_, index) => (
        <span key={index} className="h-1.5 w-1.5 rounded-full bg-slate-300" />
      ))}
    </div>
  );
}

export const HomepageContactSection = () => {
  const reveal = useRevealMotion();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasStartedForm, setHasStartedForm] = useState(false);

  const handleStart = () => {
    if (hasStartedForm) return;
    setHasStartedForm(true);
    trackEvent('contact_form_start', {
      form_name: 'primewayz_uk_homepage_contact',
      cta_location: 'homepage_contact_section',
    });
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const message = form.message.trim();

    if (!name) nextErrors.name = 'Full name is required';
    if (!email) nextErrors.email = 'Work email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email';
    if (!form.helpTopic) nextErrors.helpTopic = 'Please select how we can help';
    if (!message) nextErrors.message = 'Please tell us more about your project';
    if (!form.agreed) nextErrors.agreed = 'Please accept the Privacy Policy and Terms of Service';

    if (form.phone.trim()) {
      const parsed = parseUkPhoneNumbers(form.phone);
      if (parsed.length === 0) {
        nextErrors.phone = 'Enter a valid UK number, for example 07522 146 354';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = event.target;
    const checked = type === 'checkbox' ? (event.target as HTMLInputElement).checked : undefined;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setForm((prev) => ({ ...prev, phone: cleanUkPhoneInput(value) }));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);

    const parsedPhoneNumbers = parseUkPhoneNumbers(form.phone);
    const messageLines = [
      `How can we help: ${form.helpTopic}`,
      form.company.trim() ? `Company: ${form.company.trim()}` : null,
      '',
      form.message.trim(),
    ].filter((line) => line !== null);

    const firstUtm = getFirstUtmParams();
    const latestUtm = getLatestUtmParams();

    try {
      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          message: messageLines.join('\n'),
          phone: parsedPhoneNumbers[0] || null,
          phoneNumbers: parsedPhoneNumbers,
          firstUtmSource: firstUtm.utm_source,
          firstUtmMedium: firstUtm.utm_medium,
          firstUtmCampaign: firstUtm.utm_campaign,
          firstUtmContent: firstUtm.utm_content,
          firstUtmTerm: firstUtm.utm_term,
          latestUtmSource: latestUtm.utm_source,
          latestUtmMedium: latestUtm.utm_medium,
          latestUtmCampaign: latestUtm.utm_campaign,
          latestUtmContent: latestUtm.utm_content,
          latestUtmTerm: latestUtm.utm_term,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Something went wrong. Please try again later.');
      }

      trackEvent('contact_form_submit', {
        form_name: 'primewayz_uk_homepage_contact',
        lead_type: 'homepage_contact_enquiry',
        cta_location: 'homepage_contact_section',
      });

      setIsSubmitted(true);
      setForm(initialForm);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden py-20 md:py-24"
      style={{ backgroundColor: SECTION_BG }}
      aria-labelledby="homepage-contact-heading"
    >
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, #D9F3F7 0%, transparent 70%)' }}
        aria-hidden
      />
      <DotPattern />

      <div className="relative mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
          <motion.div
            initial={reveal.initial({ opacity: 0, y: 20 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-bold uppercase tracking-[0.22em]" style={{ color: TEAL }}>
              Get in touch
            </p>

            <h2
              id="homepage-contact-heading"
              className="mt-6 text-[2rem] font-bold leading-[1.12] tracking-[-0.04em] text-brand-navy sm:text-4xl md:text-5xl"
            >
              Let&apos;s talk about your
              <br />
              roadmap.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 sm:text-lg" style={{ color: BODY }}>
              Share a few details and we&apos;ll get back to you within one business day.
            </p>

            <ul className="mt-10 space-y-6">
              {trustPoints.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.7} aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">{title}</h3>
                    <p className="mt-1 text-sm leading-6 sm:text-base" style={{ color: BODY }}>
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={reveal.initial({ opacity: 0, y: 24 })}
            whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="rounded-[22px] border bg-white p-6 shadow-[0_20px_50px_-36px_rgba(0,10,45,0.28)] sm:p-8"
            style={{ borderColor: BORDER }}
          >
            <h3 className="text-2xl font-bold text-brand-navy">Send us a message</h3>
            <p className="mt-2 text-sm" style={{ color: BODY }}>
              Fields marked with <span className="text-brand-navy">*</span> are required.
            </p>

            {isSubmitted ? (
              <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900">
                <p className="text-lg font-bold">Thank you — your message has been sent.</p>
                <p className="mt-2 text-sm leading-6">
                  We typically reply within one business day.
                </p>
              </div>
            ) : (
              <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="homepage-contact-name" className="mb-2 block text-sm font-semibold text-brand-navy">
                      Full name <span aria-hidden>*</span>
                    </label>
                    <input
                      id="homepage-contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={handleChange}
                      onFocus={handleStart}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/15"
                      style={{ borderColor: BORDER }}
                    />
                    {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="homepage-contact-email" className="mb-2 block text-sm font-semibold text-brand-navy">
                      Work email <span aria-hidden>*</span>
                    </label>
                    <input
                      id="homepage-contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={handleChange}
                      onFocus={handleStart}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/15"
                      style={{ borderColor: BORDER }}
                    />
                    {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
                  </div>
                </div>

                <div>
                  <label htmlFor="homepage-contact-company" className="mb-2 block text-sm font-semibold text-brand-navy">
                    Company name
                  </label>
                  <input
                    id="homepage-contact-company"
                    name="company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Your company"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/15"
                    style={{ borderColor: BORDER }}
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="homepage-contact-phone" className="mb-2 block text-sm font-semibold text-brand-navy">
                      Phone number
                    </label>
                    <input
                      id="homepage-contact-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+44 7XXX XXXXXX"
                      value={form.phone}
                      onChange={(event) => handlePhoneChange(event.target.value)}
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/15"
                      style={{ borderColor: BORDER }}
                    />
                    {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
                  </div>

                  <div>
                    <label htmlFor="homepage-contact-help" className="mb-2 block text-sm font-semibold text-brand-navy">
                      How can we help you? <span aria-hidden>*</span>
                    </label>
                    <select
                      id="homepage-contact-help"
                      name="helpTopic"
                      value={form.helpTopic}
                      onChange={handleChange}
                      className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/15"
                      style={{ borderColor: BORDER }}
                    >
                      <option value="">Select an option</option>
                      {HELP_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.helpTopic ? (
                      <p className="mt-1 text-xs text-red-600">{errors.helpTopic}</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label htmlFor="homepage-contact-message" className="mb-2 block text-sm font-semibold text-brand-navy">
                    Tell us more about your project
                  </label>
                  <textarea
                    id="homepage-contact-message"
                    name="message"
                    rows={4}
                    placeholder="Share a few details about your goals and challenges..."
                    value={form.message}
                    onChange={handleChange}
                    className="w-full resize-y rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-brand-blue/50 focus:ring-2 focus:ring-brand-blue/15"
                    style={{ borderColor: BORDER }}
                  />
                  {errors.message ? <p className="mt-1 text-xs text-red-600">{errors.message}</p> : null}
                </div>

                <label className="flex items-start gap-3 text-sm leading-6" style={{ color: BODY }}>
                  <input
                    type="checkbox"
                    name="agreed"
                    checked={form.agreed}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  <span>
                    I agree to the{' '}
                    <Link to={COMPANY_TRUST_LINKS.privacyPolicy} className="font-semibold underline" style={{ color: TEAL }}>
                      Privacy Policy
                    </Link>{' '}
                    and{' '}
                    <Link to={COMPANY_TRUST_LINKS.termsOfService} className="font-semibold underline" style={{ color: TEAL }}>
                      Terms of Service
                    </Link>
                    .
                  </span>
                </label>
                {errors.agreed ? <p className="text-xs text-red-600">{errors.agreed}</p> : null}

                {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-brand-navy px-6 py-3 text-base font-bold text-white transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? 'Sending…' : 'Send message'}
                  <ArrowRight className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                </button>
              </form>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={reveal.initial({ opacity: 0, y: 16 })}
          whileInView={reveal.whileInView({ opacity: 1, y: 0 })}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="mt-10 rounded-[22px] border bg-white/90 p-6 sm:mt-12 sm:p-8"
          style={{ borderColor: BORDER }}
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
              >
                <Lock className="h-6 w-6" strokeWidth={1.7} aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-navy">Your data is protected.</h3>
                <p className="mt-1 text-sm leading-6 sm:text-base" style={{ color: BODY }}>
                  We follow industry-standard security practices and never share your information.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: ICON_SURFACE, color: TEAL }}
              >
                <Clock className="h-6 w-6" strokeWidth={1.7} aria-hidden />
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-navy">No commitment.</h3>
                <p className="mt-1 text-sm leading-6 sm:text-base" style={{ color: BODY }}>
                  Book a call or request an audit — it&apos;s completely free.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
