import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  Shield,
  Sparkles,
} from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { trackEvent } from '../lib/analytics';

type CheckStatus = 'pass' | 'partial' | 'fail';

type CategoryCheck = {
  id: string;
  name: string;
  status: CheckStatus;
  points: number;
  maxPoints: number;
  explanation: string;
  recommendations: string[];
};

type CheckResult = {
  score: number;
  label: string;
  summary: string;
  checks: CategoryCheck[];
  recommendations: string[];
};

type PageState = 'form' | 'loading' | 'error' | 'result';

const statusStyles: Record<CheckStatus, { badge: string; ring: string; icon: string }> = {
  pass: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'border-emerald-200',
    icon: 'text-emerald-600',
  },
  partial: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    ring: 'border-amber-200',
    icon: 'text-amber-600',
  },
  fail: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    ring: 'border-red-200',
    icon: 'text-red-600',
  },
};

const statusLabel: Record<CheckStatus, string> = {
  pass: 'Good',
  partial: 'Needs work',
  fail: 'Gap',
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" strokeWidth="10" className="text-white/10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-emerald-400 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <span className="text-4xl font-black">{score}</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">/ 100</span>
      </div>
    </div>
  );
}

function LeadCaptureForm({
  websiteUrl,
  score,
  businessType,
  location,
}: {
  websiteUrl: string;
  score: number;
  businessType: string;
  location: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/tools/digital-visibility-check/lead'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          websiteUrl,
          score,
          businessType: businessType || undefined,
          location: location || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit your request.');
      }

      trackEvent('visibility_checker_lead_submit', {
        score,
        website_url: websiteUrl,
        has_phone: Boolean(phone.trim()),
        has_message: Boolean(message.trim()),
      });

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
        <h3 className="text-lg font-bold text-emerald-900">Request received</h3>
        <p className="mt-2 text-sm text-emerald-800">
          Thanks — we will review your website visibility score and be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
      <h3 className="text-xl font-bold text-slate-950">Request a Free 15-Minute Digital Visibility Review</h3>
      <p className="mt-2 text-sm text-slate-600">
        Get practical next steps from the Primewayz UK team based on your score.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Name *
          </label>
          <input
            id="lead-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-500/0 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div>
          <label htmlFor="lead-email" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Email *
          </label>
          <input
            id="lead-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-500/0 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div>
          <label htmlFor="lead-phone" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Phone (optional)
          </label>
          <input
            id="lead-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-500/0 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lead-message" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Message (optional)
          </label>
          <textarea
            id="lead-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-emerald-500/0 transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20"
            placeholder="Anything specific you want us to look at?"
          />
        </div>
      </div>

      {error && (
        <p className="mt-4 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#000A2D] px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          'Request free review'
        )}
      </button>
    </form>
  );
}

export const UkSmeDigitalVisibilityCheckerPage = () => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [pageState, setPageState] = useState<PageState>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    trackEvent('visibility_checker_start', { page: 'uk_sme_digital_visibility_checker' });
  }, []);

  const handleFormStart = () => {
    if (hasStarted) return;
    setHasStarted(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!websiteUrl.trim()) {
      setErrorMessage('Please enter your website URL.');
      setPageState('error');
      return;
    }

    setPageState('loading');
    setErrorMessage('');
    trackEvent('visibility_checker_submit', {
      has_business_type: Boolean(businessType.trim()),
      has_location: Boolean(location.trim()),
    });

    try {
      const res = await fetch(apiUrl('/api/tools/digital-visibility-check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: websiteUrl.trim(),
          businessType: businessType.trim() || undefined,
          location: location.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not check this website.');
      }

      setResult(data);
      setPageState('result');
      trackEvent('visibility_checker_result_view', {
        score: data.score,
        score_label: data.label,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Could not check this website. Please try again.');
      setPageState('error');
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[#000A2D] px-4 pb-16 pt-24 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_34%)]" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Primewayz UK
          </Link>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-200">
                <Sparkles className="h-3.5 w-3.5" />
                Free UK SME Tool
              </p>

              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Free UK SME Digital Visibility Checker
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-200">
                Check if your website is clear, discoverable, trustworthy, and enquiry-ready.
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Enter your website URL and get a practical visibility score in under 60 seconds.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
              {pageState === 'result' && result ? (
                <div className="text-center">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                    Digital Visibility Score
                  </p>
                  <ScoreRing score={result.score} />
                  <p className="mt-4 text-lg font-bold text-white">{result.label}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                    <Search className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-emerald-200">Digital Visibility Score</p>
                  <p className="mt-2 text-3xl font-black text-white">0–100</p>
                  <p className="mt-3 max-w-xs text-xs leading-6 text-slate-300">
                    Covers website basics, SEO, trust, lead capture, local signals, and maintenance risk.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {(pageState === 'form' || pageState === 'loading' || pageState === 'error') && (
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-600" />
                <p className="text-sm text-slate-600">
                  We only check public pages. Private and internal addresses are blocked for security.
                </p>
              </div>

              <div className="grid gap-4">
                <div>
                  <label htmlFor="website-url" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Website URL *
                  </label>
                  <input
                    id="website-url"
                    type="url"
                    required
                    placeholder="https://yourbusiness.co.uk"
                    value={websiteUrl}
                    onFocus={handleFormStart}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    disabled={pageState === 'loading'}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="business-type" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Business type (optional)
                    </label>
                    <input
                      id="business-type"
                      type="text"
                      placeholder="e.g. Local service business"
                      value={businessType}
                      onFocus={handleFormStart}
                      onChange={(e) => setBusinessType(e.target.value)}
                      disabled={pageState === 'loading'}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label htmlFor="location" className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      Location (optional)
                    </label>
                    <input
                      id="location"
                      type="text"
                      placeholder="e.g. London"
                      value={location}
                      onFocus={handleFormStart}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={pageState === 'loading'}
                      className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {pageState === 'error' && errorMessage && (
                <p className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={pageState === 'loading'}
                className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {pageState === 'loading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking your website…
                  </>
                ) : (
                  <>
                    Check My Website
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {pageState === 'result' && result && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Your score</p>
                    <p className="mt-2 text-4xl font-black text-slate-950">
                      {result.score}
                      <span className="text-lg font-semibold text-slate-500"> / 100</span>
                    </p>
                    <p className="mt-2 text-lg font-bold text-slate-800">{result.label}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPageState('form');
                      setResult(null);
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                  >
                    Check another website
                  </button>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{result.summary}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {result.checks.map((check) => {
                  const styles = statusStyles[check.status];
                  return (
                    <article
                      key={check.id}
                      className={`rounded-2xl border bg-white p-5 shadow-sm ${styles.ring}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-base font-bold text-slate-950">{check.name}</h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                          {statusLabel[check.status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {check.points} / {check.maxPoints} points
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{check.explanation}</p>
                      {check.recommendations.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                          {check.recommendations.map((rec) => (
                            <li key={rec} className="flex gap-2">
                              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${styles.icon.replace('text-', 'bg-')}`} />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                  );
                })}
              </div>

              {result.recommendations.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-slate-950">Top priorities</h3>
                  <ul className="mt-4 space-y-2">
                    {result.recommendations.map((rec) => (
                      <li key={rec} className="flex gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <LeadCaptureForm
                websiteUrl={websiteUrl.trim()}
                score={result.score}
                businessType={businessType}
                location={location}
              />
            </motion.div>
          )}
        </div>
      </section>
    </main>
  );
};
