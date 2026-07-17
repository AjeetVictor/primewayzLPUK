import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle, Loader2, PartyPopper } from 'lucide-react';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import confetti from 'canvas-confetti';
import { apiUrl } from '../utils/apiUrl';
import { trackEvent } from '../lib/analytics';
import { getFirstUtmParams, getLatestUtmParams } from '../lib/utm';

interface FormData {
  name: string;
  email: string;
  company: string;
  supportArea: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
  phone?: string;
  supportArea?: string;
}

const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
const NAME_MIN = 2;
const NAME_MAX = 80;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

const SUPPORT_AREA_OPTIONS = [
  'Website updates & maintenance',
  'Technical SEO & visibility',
  'CRM & automation',
  'Integrations & systems',
  'Monthly digital support',
  'Software / product delivery',
  'Other',
] as const;

const inputBaseClass =
  'w-full min-h-[48px] rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/25';

type ContactFormProps = {
  variant?: 'full';
};

export function normalizeUkPhoneNumber(raw: string): string | null {
  const compact = raw.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  let normalized = compact.startsWith('0044') ? `+44${compact.slice(4)}` : compact;

  if (normalized.startsWith('+440')) {
    normalized = `+44${normalized.slice(4)}`;
  } else if (normalized.startsWith('00440')) {
    normalized = `+44${normalized.slice(5)}`;
  } else if (/^44\d{10,11}$/.test(normalized)) {
    normalized = `+${normalized}`;
  }

  if (normalized.startsWith('+44')) {
    const national = normalized.slice(3).replace(/\D/g, '').replace(/^0/, '');
    return national.length === 10 ? `+44${national}` : null;
  }

  const digits = normalized.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `+44${digits.slice(1)}`;
  }

  return null;
}

export function validateUkMobileOrLandline(e164: string): boolean {
  return /^\+44[1-9]\d{9}$/.test(e164);
}

export function parseUkPhoneNumbers(input: string): string[] {
  const matches = input.match(/(?:\+?44|0044|0)\s*\d(?:[\s().-]*\d){9,10}/g) || [];
  const normalized = matches
    .map((match) => normalizeUkPhoneNumber(match))
    .filter((phone): phone is string => Boolean(phone && validateUkMobileOrLandline(phone) && isValidPhoneNumber(phone)));

  return Array.from(new Set(normalized));
}

export function cleanUkPhoneInput(value?: string): string {
  if (!value) return '';
  return normalizeUkPhoneNumber(value) || value;
}

export function formatUkPhoneNumber(e164: string): string {
  const national = e164.replace(/^\+44/, '');
  return `+44 ${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`.trim();
}

const emptyForm: FormData = {
  name: '',
  email: '',
  company: '',
  supportArea: '',
  message: '',
};

export function ContactForm({ variant = 'full' }: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasStartedForm, setHasStartedForm] = useState(false);

  const handleFormStart = () => {
    if (hasStartedForm) return;
    setHasStartedForm(true);
    trackEvent('contact_form_start', {
      form_name: 'primewayz_uk_contact_form',
      cta_location: 'contact_form',
    });
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const message = formData.message.trim();
    const parsedPhoneNumbers = parseUkPhoneNumbers(phone);

    if (!name) {
      newErrors.name = 'Name is required';
    } else if (name.length < NAME_MIN) {
      newErrors.name = `Name must be at least ${NAME_MIN} characters`;
    } else if (name.length > NAME_MAX) {
      newErrors.name = `Name must be at most ${NAME_MAX} characters`;
    } else if (!NAME_REGEX.test(name)) {
      newErrors.name = 'Name contains invalid characters';
    }

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.supportArea) {
      newErrors.supportArea = 'Please select a support area';
    }

    if (!message) {
      newErrors.message = 'Please describe your enquiry';
    } else if (message.length < MESSAGE_MIN) {
      newErrors.message = `Message must be at least ${MESSAGE_MIN} characters`;
    } else if (message.length > MESSAGE_MAX) {
      newErrors.message = `Message must be at most ${MESSAGE_MAX} characters`;
    }

    if (phone.trim() && parsedPhoneNumbers.length === 0) {
      newErrors.phone = 'Enter a valid UK number, for example 07522 146 354 or +44 7522 146354';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const parsedPhoneNumbers = parseUkPhoneNumbers(phone);
      const firstUtm = getFirstUtmParams();
      const latestUtm = getLatestUtmParams();
      const messageLines = [
        `Main area of support: ${formData.supportArea}`,
        formData.company.trim() ? `Company: ${formData.company.trim()}` : null,
        '',
        formData.message.trim(),
      ].filter((line): line is string => line !== null);

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
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
      };

      const response = await fetch(apiUrl('/api/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        trackEvent('contact_form_submit', {
          form_name: 'primewayz_uk_contact_form',
          lead_type: 'contact_enquiry',
          cta_location: 'contact_form',
        });

        setIsSubmitted(true);
        setFormData(emptyForm);
        setPhone('');
      } else {
        const data = await response.json().catch(() => null);
        setSubmitError(data?.error || 'Something went wrong. Please try again later.');
      }
    } catch {
      setSubmitError('Failed to send message. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (name === 'email') {
      processedValue = value.replace(/[^a-zA-Z0-9@._+-]/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePhoneChange = (value?: string) => {
    setPhone(cleanUkPhoneInput(value));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
  };

  const parsedPhoneNumbers = parseUkPhoneNumbers(phone);
  const isPhoneValid = parsedPhoneNumbers.length > 0;
  const showPhoneValidState = phone.trim().length > 0 && isPhoneValid;

  useEffect(() => {
    if (!isSubmitted) return undefined;

    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: ReturnType<typeof setInterval> = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [isSubmitted]);

  // Keep prop for API compatibility with callers that pass variant="full"
  void variant;

  if (isSubmitted) {
    return (
      <div
        id="enquiry-form"
        className="rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-12 text-center shadow-sm shadow-slate-900/5"
      >
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
          <CheckCircle className="mx-auto mb-5 h-14 w-14 text-emerald-500" aria-hidden />
          <h3
            id="enquiry-heading"
            className="flex items-center justify-center gap-2 text-2xl font-bold text-emerald-900"
          >
            <PartyPopper className="h-6 w-6 text-emerald-600" aria-hidden />
            Message sent
          </h3>
          <p className="mx-auto mt-3 max-w-md text-base leading-7 text-emerald-700">
            Thank you for reaching out. Our team will review your enquiry and get back to you shortly.
          </p>
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            Send another message
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      id="enquiry-form"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8"
    >
      <div className="mb-6">
        <h2 id="enquiry-heading" className="text-xl font-bold tracking-tight text-brand-navy sm:text-2xl">
          Send us your enquiry
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share your requirement and we&apos;ll review it before getting back to you.
        </p>
      </div>

      <form onSubmit={handleSubmit} onFocus={handleFormStart} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={`${inputBaseClass} ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.name ? (
              <p id="name-error" className="flex items-center gap-1 text-xs text-red-500" role="alert">
                <AlertCircle className="h-3 w-3" aria-hidden /> {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Email address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`${inputBaseClass} ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
            />
            {errors.email ? (
              <p id="email-error" className="flex items-center gap-1 text-xs text-red-500" role="alert">
                <AlertCircle className="h-3 w-3" aria-hidden /> {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <span id="phone-label" className="block text-sm font-semibold text-slate-700">
              Phone number
            </span>
            <div
              className={`flex overflow-hidden rounded-lg border bg-white ${
                errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200'
              } focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/25`}
            >
              <PhoneInput
                id="phone"
                name="phone"
                international={false}
                defaultCountry="GB"
                countries={['GB']}
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Optional UK number"
                autoComplete="tel"
                aria-labelledby="phone-label"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? 'phone-error' : showPhoneValidState ? 'phone-valid' : undefined}
                className="primewayz-phone-input min-h-[48px] min-w-0 flex-1"
              />
            </div>
            {showPhoneValidState ? (
              <div id="phone-valid" className="flex flex-wrap gap-2 pt-0.5" aria-label="Validated UK phone number">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle className="h-3 w-3" aria-hidden />
                  {formatUkPhoneNumber(parsedPhoneNumbers[0])}
                </span>
              </div>
            ) : null}
            {errors.phone ? (
              <p id="phone-error" className="flex items-center gap-1 text-xs text-red-500" role="alert">
                <AlertCircle className="h-3 w-3" aria-hidden /> {errors.phone}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="company" className="block text-sm font-semibold text-slate-700">
              Business / company name
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Optional"
              autoComplete="organization"
              className={`${inputBaseClass} border-slate-200`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="supportArea" className="block text-sm font-semibold text-slate-700">
            Main area of support
          </label>
          <select
            id="supportArea"
            name="supportArea"
            value={formData.supportArea}
            onChange={handleChange}
            aria-required="true"
            aria-invalid={!!errors.supportArea}
            aria-describedby={errors.supportArea ? 'supportArea-error' : undefined}
            className={`${inputBaseClass} ${errors.supportArea ? 'border-red-500 bg-red-50' : 'border-slate-200'}`}
          >
            <option value="">Select an option</option>
            {SUPPORT_AREA_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.supportArea ? (
            <p id="supportArea-error" className="flex items-center gap-1 text-xs text-red-500" role="alert">
              <AlertCircle className="h-3 w-3" aria-hidden /> {errors.supportArea}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="message" className="block text-sm font-semibold text-slate-700">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            placeholder="Briefly describe what you need help with"
            aria-required="true"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
            className={`min-h-[160px] w-full resize-y rounded-lg border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/25 ${
              errors.message ? 'border-red-500 bg-red-50' : 'border-slate-200'
            }`}
          />
          {errors.message ? (
            <p id="message-error" className="flex items-center gap-1 text-xs text-red-500" role="alert">
              <AlertCircle className="h-3 w-3" aria-hidden /> {errors.message}
            </p>
          ) : null}
        </div>

        {submitError ? (
          <div
            className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden /> {submitError}
          </div>
        ) : null}

        <div className="space-y-3 pt-1">
          <motion.button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            whileHover={!isSubmitting ? { scale: 1.01 } : {}}
            whileTap={!isSubmitting ? { scale: 0.99 } : {}}
            className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-lg px-8 py-3 text-sm font-bold text-white transition-all sm:w-auto sm:min-w-[200px] ${
              isSubmitting
                ? 'cursor-not-allowed bg-slate-500 opacity-80'
                : 'bg-brand-navy shadow-sm hover:bg-brand-navy/90'
            }`}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Sending…
              </span>
            ) : (
              'Send enquiry'
            )}
          </motion.button>
          <p className="text-sm text-slate-500">Usually answered within one UK business day.</p>
        </div>
      </form>
    </div>
  );
}
