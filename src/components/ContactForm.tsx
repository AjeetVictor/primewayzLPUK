import { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, CheckCircle, AlertCircle, PartyPopper } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitError('Something went wrong. Please try again later.');
      }
    } catch (error) {
      setSubmitError('Failed to send message. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'email') {
      // Only allow characters valid for email addresses as the user types
      // This includes alphanumeric characters and common symbols: @, ., _, -, +
      processedValue = value.replace(/[^a-zA-Z0-9@._+-]/g, '');
    }

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  useEffect(() => {
    if (isSubmitted) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isSubmitted]);

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="text-center py-16 px-6 bg-emerald-50 rounded-3xl border border-emerald-100 relative overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.5, ease: "backOut" }}
          className="relative z-10"
        >
          <div className="relative inline-block">
            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
            <motion.div
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-emerald-200 rounded-full -z-10 blur-xl"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-3xl font-bold text-emerald-900 mb-3 flex items-center justify-center gap-3">
            <PartyPopper className="w-8 h-8 text-emerald-600" />
            Message Sent!
          </h3>
          <p className="text-xl text-emerald-700 mb-8 max-w-md mx-auto">
            Thank you for reaching out. Our team of elite engineers will review your message and get back to you shortly.
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

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.5, 0],
                scale: [0.5, 1.5, 0.5],
                x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
                y: [Math.random() * 100 - 50, Math.random() * 100 - 50]
              }}
              transition={{ 
                duration: 3 + Math.random() * 2, 
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute w-2 h-2 bg-emerald-300 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <section id="contact" className="py-24 bg-white" aria-labelledby="contact-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 id="contact-heading" className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-gray-600">
            Have a project in mind? Let's discuss how we can help you scale.
          </p>
        </div>

        <div className="bg-gray-50 p-8 md:p-12 rounded-3xl border border-gray-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  Full Name <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all`}
                />
                {errors.name && (
                  <p id="name-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all`}
                />
                {errors.email && (
                  <p id="email-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                    <AlertCircle className="w-3 h-3" /> {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                Message <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                placeholder="Tell us about your project..."
                required
                aria-required="true"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "message-error" : undefined}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.message ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-emerald-500'
                } focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none`}
              />
              {errors.message && (
                <p id="message-error" className="text-red-500 text-xs mt-1 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3 h-3" /> {errors.message}
                </p>
              )}
            </div>

            {submitError && (
              <div 
                className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4" /> {submitError}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              whileHover={!isSubmitting ? { scale: 1.02, y: -2 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              className={`w-full md:w-auto px-8 py-4 rounded-full font-bold transition-all shadow-lg flex items-center justify-center gap-2 relative overflow-hidden group ${
                isSubmitting 
                  ? 'bg-emerald-800 text-emerald-200 cursor-wait shadow-none' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/20'
              } disabled:opacity-80 disabled:grayscale-[0.5]`}
            >
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    <span>Send Message</span>
                  </>
                )}
              </span>
              {!isSubmitting && (
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                  style={{ skewX: -20 }}
                />
              )}
            </motion.button>
          </form>
        </div>
      </div>
    </section>
  );
}
