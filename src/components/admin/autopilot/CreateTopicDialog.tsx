import { useEffect, useId, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { CreateTopicInput } from '../../../lib/autopilot/adminAutopilotService';

type CreateTopicDialogProps = {
  open: boolean;
  isSubmitting: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateTopicInput) => Promise<void> | void;
};

type FormState = {
  workingTitle: string;
  primaryKeyword: string;
  userProblem: string;
  audience: string;
  supportingKeywords: string;
  keywordVariants: string;
  market: string;
  language: string;
  location: string;
  proposedSlug: string;
};

const EMPTY_FORM: FormState = {
  workingTitle: '',
  primaryKeyword: '',
  userProblem: '',
  audience: '',
  supportingKeywords: '',
  keywordVariants: '',
  market: 'United Kingdom',
  language: 'en-GB',
  location: '',
  proposedSlug: '',
};

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CreateTopicDialog({
  open,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: CreateTopicDialogProps) {
  const titleId = useId();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setLocalError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open || isSubmitting) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError('');

    if (!form.workingTitle.trim() || !form.primaryKeyword.trim() || !form.userProblem.trim() || !form.audience.trim()) {
      setLocalError('Working title, primary keyword, user problem, and audience are required.');
      return;
    }

    const payload: CreateTopicInput = {
      workingTitle: form.workingTitle.trim(),
      primaryKeyword: form.primaryKeyword.trim(),
      userProblem: form.userProblem.trim(),
      audience: form.audience.trim(),
      market: form.market.trim() || 'United Kingdom',
      language: form.language.trim() || 'en-GB',
    };

    const supporting = splitList(form.supportingKeywords);
    const variants = splitList(form.keywordVariants);
    if (supporting.length) payload.supportingKeywords = supporting;
    if (variants.length) payload.keywordVariants = variants;
    if (form.location.trim()) payload.location = form.location.trim();
    if (form.proposedSlug.trim()) payload.proposedSlug = form.proposedSlug.trim();

    await onSubmit(payload);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-zinc-900">
              Create topic
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              A topic is a candidate for editorial review — not a published article. No keyword-volume
              fields exist in this foundation phase. Slug conflicts are advisory until publishing
              phases.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
            aria-label="Close create topic dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-title">
              Working title
            </label>
            <input
              id="ap-create-title"
              value={form.workingTitle}
              onChange={(e) => setForm((prev) => ({ ...prev, workingTitle: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-keyword">
              Primary keyword
            </label>
            <input
              id="ap-create-keyword"
              value={form.primaryKeyword}
              onChange={(e) => setForm((prev) => ({ ...prev, primaryKeyword: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-problem">
              User problem
            </label>
            <textarea
              id="ap-create-problem"
              value={form.userProblem}
              onChange={(e) => setForm((prev) => ({ ...prev, userProblem: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-audience">
              Audience
            </label>
            <input
              id="ap-create-audience"
              value={form.audience}
              onChange={(e) => setForm((prev) => ({ ...prev, audience: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-supporting">
                Supporting keywords
              </label>
              <input
                id="ap-create-supporting"
                value={form.supportingKeywords}
                onChange={(e) => setForm((prev) => ({ ...prev, supportingKeywords: e.target.value }))}
                placeholder="Comma-separated"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-variants">
                Keyword variants
              </label>
              <input
                id="ap-create-variants"
                value={form.keywordVariants}
                onChange={(e) => setForm((prev) => ({ ...prev, keywordVariants: e.target.value }))}
                placeholder="Comma-separated"
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-market">
                Market
              </label>
              <input
                id="ap-create-market"
                value={form.market}
                onChange={(e) => setForm((prev) => ({ ...prev, market: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-language">
                Language
              </label>
              <input
                id="ap-create-language"
                value={form.language}
                onChange={(e) => setForm((prev) => ({ ...prev, language: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-location">
                Location
              </label>
              <input
                id="ap-create-location"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-create-slug">
              Proposed slug
            </label>
            <input
              id="ap-create-slug"
              value={form.proposedSlug}
              onChange={(e) => setForm((prev) => ({ ...prev, proposedSlug: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <p className="mt-1 text-xs text-zinc-400">
              Advisory only in Phase 1 — uniqueness is enforced at later publishing gates.
            </p>
          </div>

          {(localError || error) && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600" role="alert">
              {localError || error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating…' : 'Create topic'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
