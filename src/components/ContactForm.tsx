import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, PartyPopper, Linkedin } from 'lucide-react';
import confetti from 'canvas-confetti';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { apiUrl } from '../utils/apiUrl';
import { CONTACT_SOCIAL_LINKS } from '../constants/contactSocial';
import { trackEvent } from '../lib/analytics';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
  phone?: string;
}

const NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
const NAME_MIN = 2;
const NAME_MAX = 80;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;
const CALENDLY_URL = 'https://calendly.com/primewayz-info/30min';
const CALENDLY_SCRIPT_URL = 'https://assets.calendly.com/assets/external/widget.js';

function SocialIcon({ label }: { label: string }) {
  const cls = 'w-4 h-4 shrink-0';
  switch (label) {
    case 'LinkedIn':
      return <Linkedin className={cls} aria-hidden />;
    default:
      return null;
  }
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });
  const [phone, setPhone] = useState<string | undefined>(undefined);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const message = formData.message.trim();

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

    if (!message) {
      newErrors.message = 'Please describe your enquiry';
    } else if (message.length < MESSAGE_MIN) {
      newErrors.message = `Message must be at least ${MESSAGE_MIN} characters`;
    } else if (message.length > MESSAGE_MAX) {
      newErrors.message = `Message must be at most ${MESSAGE_MAX} characters`;
    }

    if (!phone || !isValidPhoneNumber(phone)) {
      newErrors.phone = 'Enter a valid contact number';
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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        message: formData.message.trim(),
        phone,
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
        setFormData({ name: '', email: '', message: '' });
        setPhone(undefined);
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  useEffect(() => {
    const existingScript = document.querySelector(`script[src="${CALENDLY_SCRIPT_URL}"]`);

    if (!existingScript) {
      const script = document.createElement('script');
      script.src = CALENDLY_SCRIPT_URL;
      script.async = true;
      document.body.appendChild(script);
    }

    const handleCalendlyEvent = (event: MessageEvent) => {
      if (event.origin !== 'https://calendly.com') return;

      const calendlyEventName = event.data?.event;

      if (calendlyEventName === 'calendly.event_scheduled') {
        trackEvent('calendly_event_scheduled', {
          calendly_url: CALENDLY_URL,
          lead_type: 'discovery_call',
          cta_location: 'contact_calendly_inline',
        });
      }
    };

    window.addEventListener('message', handleCalendlyEvent);

    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, []);

  useEffect(() => {
    if (isSubmitted) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: ReturnType<typeof setInterval> = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <section id="contact" className="py-24 bg-white" aria-labelledby="contact-heading">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="text-center py-16 px-6 bg-emerald-50 rounded-3xl border border-emerald-100 relative overflow-hidden"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, ease: 'backOut' }}
              className="relative z-10"
            >
              <div className="relative inline-block">
                <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                <motion.div
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 0, 0.5],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald-200 rounded-full -z-10 blur-xl"
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h3 className="text-3xl font-bold text-emerald-900 mb-3 flex items-center justify-center gap-3">
                <PartyPopper className="w-8 h-8 text-emerald-600" />
                Message Sent!
              </h3>
              <p className="text-xl text-emerald-700 mb-8 max-w-md mx-auto">
                Thank you for reaching out. Our team will review your enquiry and get back to you shortly.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSubmitted(false)}
                className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20"
              >
                Send another message
              </motion.button>
            </motion.div>

            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 0.5, 0],
                    scale: [0.5, 1.5, 0.5],
                    x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                    y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                  className="absolute w-2 h-2 bg-emerald-300 rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-24 bg-white" aria-labelledby="contact-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h2 id="contact-heading" className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Choose how you want to connect
          </h2>
          <p className="text-xl text-gray-600">
            Tell us what your UK business needs help with — website updates, SEO, CRM, automation, integrations, or monthly digital support.
          </p>
          <p className="mt-3 text-sm text-gray-500">
            Primewayz UK currently supports UK-based small businesses and UK-facing teams only.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          <div className="bg-gray-50 p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Option 1</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">Send us your enquiry</h3>
              <p className="mt-2 text-sm text-gray-600">
                Share your requirement and we will review it before getting back to you.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Name"
                      autoComplete="name"
                      aria-required="true"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      className={`w-full px-4 py-3 rounded-lg border bg-white ${
                        errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-slate-600'
                      } focus:ring-2 focus:ring-slate-400/30 outline-none transition-all`}
                    />
                    {errors.name && (
                      <p id="name-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                        <AlertCircle className="w-3 h-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email Address"
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={`w-full px-4 py-3 rounded-lg border bg-white ${
                        errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-slate-600'
                      } focus:ring-2 focus:ring-slate-400/30 outline-none transition-all`}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                        <AlertCircle className="w-3 h-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span id="phone-label" className="block text-sm font-semibold text-gray-700">
                      Contact Number
                    </span>
                    <div
                      className={`phone-field rounded-lg border bg-white overflow-hidden ${
                        errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'
                      } focus-within:ring-2 focus-within:ring-slate-400/30`}
                    >
                      <PhoneInput
                        defaultCountry="GB"
                        countryCallingCodeEditable={false}
                        value={phone}
                        onChange={(v) => {
                          setPhone(v);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                        }}
                        placeholder="Contact Number"
                        aria-labelledby="phone-label"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'phone-error' : undefined}
                        className="phone-input-custom w-full"
                      />
                    </div>
                    {errors.phone && (
                      <p id="phone-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                        <AlertCircle className="w-3 h-3" /> {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6 flex flex-col">
                  <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                      What does your UK business need help with?
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={8}
                      placeholder="Tell us about your website, SEO, CRM, automation, integration, or monthly support requirement..."
                      aria-required="true"
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'message-error' : undefined}
                      className={`flex-1 min-h-[200px] w-full px-4 py-3 rounded-lg border bg-white resize-y ${
                        errors.message ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-slate-600'
                      } focus:ring-2 focus:ring-slate-400/30 outline-none transition-all`}
                    />
                    {errors.message && (
                      <p id="message-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                        <AlertCircle className="w-3 h-3" /> {errors.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {submitError && (
                <div
                  className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2"
                  role="alert"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" /> {submitError}
                </div>
              )}

              <div className="flex flex-col items-center gap-3 pt-2">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                  whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                  className={`w-full max-w-md px-8 py-3.5 rounded-lg font-semibold text-white transition-all shadow-md ${
                    isSubmitting
                      ? 'bg-slate-500 cursor-not-allowed opacity-80'
                      : 'bg-slate-800 hover:bg-slate-900 shadow-slate-900/20'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending…
                    </span>
                  ) : (
                    'Submit UK Enquiry'
                  )}
                </motion.button>
                <p className="text-sm text-gray-500 text-center max-w-lg">
                  We will use the information you provide to us to contact you in response to your submission.
                </p>
              </div>
            </form>

            <div className="social-media-btn-wrapper mt-10 pt-8 border-t border-gray-200">
              <p className="flex flex-wrap justify-center items-center gap-2 sm:gap-3">
                {CONTACT_SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.ariaLabel}
                    className="social-btns inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <SocialIcon label={link.label} />
                    {link.label}
                  </a>
                ))}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-600">Option 2</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">Book a 30-minute discovery call</h3>
              <p className="mt-2 text-sm text-gray-600">Pick a convenient slot directly from our calendar.</p>
            </div>

            <div
              className="calendly-inline-widget overflow-hidden rounded-2xl border border-gray-100"
              data-url={CALENDLY_URL}
              style={{ minWidth: '320px', height: '700px' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
