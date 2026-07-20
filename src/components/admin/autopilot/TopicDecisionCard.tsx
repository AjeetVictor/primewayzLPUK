import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, RefreshCcw } from 'lucide-react';
import { BLOG_CATEGORIES } from '../../../data/blog/categories';
import { AUTOPILOT_SCORE_DIMENSION_KEYS } from '../../../data/autopilot/scoringConfig';
import type {
  AutopilotBusinessAlignment,
  AutopilotCategoryRecommendation,
  AutopilotContentArchitecture,
  AutopilotRiskAssessment,
  AutopilotSearchIntent,
  AutopilotSerpEvidence,
  AutopilotTopicRecord,
} from '../../../data/autopilot/types';
import {
  AutopilotClientError,
  adminAutopilotApi,
  type AutopilotTopicDetailDto,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  buildSafeEventSummary,
  formatAutopilotDate,
  getActivityActorLabel,
} from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import {
  APPROVAL_CONFIRMATION_COPY,
  dedupeSecondaryCategories,
  extractChangedPatchFields,
  getPermittedDecisionActions,
  SCORE_INPUT_BOUNDS,
} from '../../../lib/autopilot/adminAutopilotDecisionHelpers';
import { getScoreDimensionLabel } from '../../../lib/autopilot/adminAutopilotLabels';
import type { AutopilotDecisionAction } from '../../../lib/autopilot/apiValidation';
import { AppConfirmDialog } from '../../ui/AppConfirmDialog';
import { useToast } from '../../ui/AppToast';
import { TopicStatusBadge } from './TopicStatusBadge';
import { DecisionStatusBadge } from './DecisionStatusBadge';
import { ScoreBadge } from './ScoreBadge';
import { AutopilotErrorState } from './AutopilotErrorState';
import { ResearchEditor } from './ResearchEditor';

type TopicDecisionCardProps = {
  topicId: number;
  role?: string;
  canContribute: boolean;
  canEditorial: boolean;
  onBack: () => void;
  onArchived: () => void;
  onOpenActivityForTopic: (topicId: number) => void;
  onMutated: () => void;
};

type EditSection = 'identity' | 'research' | 'business' | 'architecture' | 'categories' | 'score' | null;

type ConfirmState = {
  kind: 'decision' | 'archive';
  action?: AutopilotDecisionAction;
  title: string;
  body: string;
  variant: 'default' | 'warning' | 'danger';
};

function asObject<T extends object>(value: unknown): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : ({} as T);
}

function joinList(values: string[] | null | undefined): string {
  return (values || []).join(', ');
}

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
          {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <div className="mt-1 text-sm text-zinc-800 whitespace-pre-wrap">{value || '—'}</div>
    </div>
  );
}

export function TopicDecisionCard({
  topicId,
  role,
  canContribute,
  canEditorial,
  onBack,
  onArchived,
  onOpenActivityForTopic,
  onMutated,
}: TopicDecisionCardProps) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState<AutopilotTopicDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [editSection, setEditSection] = useState<EditSection>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [reason, setReason] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [decisionRationale, setDecisionRationale] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmProcessing, setConfirmProcessing] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [recommendForm, setRecommendForm] = useState({
    primaryCategory: '',
    secondaryCategories: '',
    confidence: '',
    reasoning: '',
  });
  const [missingDimensions, setMissingDimensions] = useState<string[]>([]);

  const topic = detail?.topic;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminAutopilotApi.getTopic(topicId);
      setDetail(data);
      setDecisionRationale(data.topic.decisionRationale || '');
      const rec = asObject<AutopilotCategoryRecommendation>(data.topic.categoryRecommendation);
      setRecommendForm({
        primaryCategory: rec.primaryCategory || '',
        secondaryCategories: joinList(rec.secondaryCategories),
        confidence: rec.confidence != null ? String(rec.confidence) : '',
        reasoning: rec.reasoning || '',
      });
      setMissingDimensions([]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load topic'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [topicId]);

  const permittedActions = useMemo(
    () => (topic ? getPermittedDecisionActions(topic.decisionStatus, role) : []),
    [topic, role],
  );

  const beginEdit = (section: EditSection) => {
    if (!topic || !section) return;
    const next: Record<string, unknown> = {};
    if (section === 'identity') {
      Object.assign(next, {
        workingTitle: topic.workingTitle,
        primaryKeyword: topic.primaryKeyword,
        supportingKeywords: joinList(topic.supportingKeywords),
        keywordVariants: joinList(topic.keywordVariants),
        userProblem: topic.userProblem,
        audience: topic.audience,
        market: topic.market,
        language: topic.language,
        location: topic.location || '',
        source: topic.source,
        proposedSlug: topic.proposedSlug || '',
      });
    } else if (section === 'research') {
      const intent = asObject<AutopilotSearchIntent>(topic.searchIntent);
      const serp = asObject<AutopilotSerpEvidence>(topic.serpEvidence);
      Object.assign(next, {
        searchIntentNotes: intent.notes || '',
        dominantIntent: intent.dominantIntent || '',
        funnelStage: intent.funnelStage || '',
        serpNotes: serp.notes || '',
        researchedAt: serp.researchedAt || '',
        peopleAlsoAsk: joinList(serp.peopleAlsoAsk),
        competitorDomains: joinList(serp.competitorDomains),
      });
    } else if (section === 'business') {
      const biz = asObject<AutopilotBusinessAlignment>(topic.businessAlignment);
      Object.assign(next, {
        serviceFit: biz.serviceFit || biz.relevantService || '',
        commercialValue: biz.commercialValue || '',
        buyerFit: biz.buyerFit || '',
        relevantMoneyPage: biz.relevantMoneyPage || '',
        internalLinkingOpportunity: biz.internalLinkingOpportunity || '',
        notes: biz.notes || '',
      });
    } else if (section === 'architecture') {
      const arch = asObject<AutopilotContentArchitecture>(topic.contentArchitecture);
      const risk = asObject<AutopilotRiskAssessment>(topic.riskAssessment);
      Object.assign(next, {
        intendedPageType: arch.intendedPageType || '',
        topicCluster: arch.topicCluster || '',
        contentGap: arch.contentGap || '',
        notes: arch.notes || '',
        cannibalisationRisk: risk.cannibalisationRisk || '',
        unsupportedClaimRisk: risk.unsupportedClaimRisk || '',
        riskNotes: risk.notes || '',
      });
    } else if (section === 'categories') {
      Object.assign(next, {
        primaryCategory: topic.primaryCategory || '',
        secondaryCategories: [...(topic.secondaryCategories || [])],
      });
    } else if (section === 'score') {
      for (const key of AUTOPILOT_SCORE_DIMENSION_KEYS) {
        next[key] = topic[key] ?? '';
      }
      next.cannibalisationPenalty = topic.cannibalisationPenalty ?? '';
      next.unsupportedClaimRiskPenalty = topic.unsupportedClaimRiskPenalty ?? '';
    }
    setDraft(next);
    setReason('');
    setSectionError('');
    setEditSection(section);
  };

  const cancelEdit = () => {
    setEditSection(null);
    setDraft({});
    setReason('');
    setSectionError('');
  };

  const saveSection = async () => {
    if (!topic || !editSection) return;
    setSaving(true);
    setSectionError('');

    try {
      let payloadDraft: Record<string, unknown> = {};
      const original: Record<string, unknown> = { ...topic };

      if (editSection === 'identity') {
        payloadDraft = {
          workingTitle: String(draft.workingTitle || '').trim(),
          primaryKeyword: String(draft.primaryKeyword || '').trim(),
          supportingKeywords: splitList(String(draft.supportingKeywords || '')),
          keywordVariants: splitList(String(draft.keywordVariants || '')),
          userProblem: String(draft.userProblem || '').trim(),
          audience: String(draft.audience || '').trim(),
          market: String(draft.market || '').trim(),
          language: String(draft.language || '').trim(),
          location: String(draft.location || '').trim() || null,
          source: String(draft.source || '').trim(),
          proposedSlug: String(draft.proposedSlug || '').trim() || null,
        };
      } else if (editSection === 'research') {
        const prevIntent = asObject<AutopilotSearchIntent>(topic.searchIntent);
        const prevSerp = asObject<AutopilotSerpEvidence>(topic.serpEvidence);
        payloadDraft = {
          searchIntent: {
            ...prevIntent,
            notes: String(draft.searchIntentNotes || '').trim() || undefined,
            dominantIntent: String(draft.dominantIntent || '').trim() || undefined,
            funnelStage: String(draft.funnelStage || '').trim() || undefined,
          },
          serpEvidence: {
            ...prevSerp,
            notes: String(draft.serpNotes || '').trim() || undefined,
            researchedAt: String(draft.researchedAt || '').trim() || undefined,
            peopleAlsoAsk: splitList(String(draft.peopleAlsoAsk || '')),
            competitorDomains: splitList(String(draft.competitorDomains || '')),
          },
        };
      } else if (editSection === 'business') {
        const prev = asObject<AutopilotBusinessAlignment>(topic.businessAlignment);
        payloadDraft = {
          businessAlignment: {
            ...prev,
            serviceFit: String(draft.serviceFit || '').trim() || undefined,
            commercialValue: String(draft.commercialValue || '').trim() || undefined,
            buyerFit: String(draft.buyerFit || '').trim() || undefined,
            relevantMoneyPage: String(draft.relevantMoneyPage || '').trim() || undefined,
            internalLinkingOpportunity:
              String(draft.internalLinkingOpportunity || '').trim() || undefined,
            notes: String(draft.notes || '').trim() || undefined,
          },
        };
      } else if (editSection === 'architecture') {
        const prevArch = asObject<AutopilotContentArchitecture>(topic.contentArchitecture);
        const prevRisk = asObject<AutopilotRiskAssessment>(topic.riskAssessment);
        payloadDraft = {
          contentArchitecture: {
            ...prevArch,
            intendedPageType: String(draft.intendedPageType || '').trim() || undefined,
            topicCluster: String(draft.topicCluster || '').trim() || undefined,
            contentGap: String(draft.contentGap || '').trim() || undefined,
            notes: String(draft.notes || '').trim() || undefined,
          },
          riskAssessment: {
            ...prevRisk,
            cannibalisationRisk: String(draft.cannibalisationRisk || '').trim() || undefined,
            unsupportedClaimRisk: String(draft.unsupportedClaimRisk || '').trim() || undefined,
            notes: String(draft.riskNotes || '').trim() || undefined,
          },
        };
      } else if (editSection === 'categories') {
        const primary = String(draft.primaryCategory || '').trim() || null;
        const secondary = dedupeSecondaryCategories(
          primary,
          Array.isArray(draft.secondaryCategories)
            ? (draft.secondaryCategories as string[])
            : [],
        );
        payloadDraft = { primaryCategory: primary, secondaryCategories: secondary };
      } else if (editSection === 'score') {
        for (const key of AUTOPILOT_SCORE_DIMENSION_KEYS) {
          const raw = draft[key];
          if (raw === '' || raw == null) continue;
          payloadDraft[key] = Number(raw);
        }
        if (draft.cannibalisationPenalty !== '' && draft.cannibalisationPenalty != null) {
          payloadDraft.cannibalisationPenalty = Number(draft.cannibalisationPenalty);
        }
        if (draft.unsupportedClaimRiskPenalty !== '' && draft.unsupportedClaimRiskPenalty != null) {
          payloadDraft.unsupportedClaimRiskPenalty = Number(draft.unsupportedClaimRiskPenalty);
        }
      }

      const extracted = extractChangedPatchFields({
        original,
        draft: payloadDraft,
        section: editSection,
        reason,
      });

      if (extracted.error) {
        setSectionError(extracted.error);
        return;
      }
      if (extracted.changedKeys.length === 0) {
        setSectionError('No changes to save.');
        return;
      }

      const result = await adminAutopilotApi.patchTopic(topicId, extracted.payload);
      setDetail((prev) => (prev ? { ...prev, topic: result.topic } : prev));
      cancelEdit();
      onMutated();
      showToast({
        type: 'success',
        message:
          editSection === 'categories'
            ? 'Final categories updated.'
            : editSection === 'score'
              ? 'Score inputs updated. Recalculate to refresh totals.'
              : 'Topic updated.',
      });
    } catch (err) {
      const message =
        err instanceof AutopilotClientError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to save changes.';
      setSectionError(message);
    } finally {
      setSaving(false);
    }
  };

  const recalculateScore = async () => {
    setSaving(true);
    setMissingDimensions([]);
    try {
      const result = await adminAutopilotApi.scoreTopic(topicId);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              topic: result.topic,
              recommendationBand: result.calculation.recommendationBand,
            }
          : prev,
      );
      onMutated();
      showToast({ type: 'success', message: 'Score recalculated.' });
    } catch (err) {
      if (err instanceof AutopilotClientError) {
        const missing = (err.details as { missing?: string[] } | undefined)?.missing;
        if (Array.isArray(missing)) setMissingDimensions(missing);
        showToast({ type: 'error', message: err.message });
      } else {
        showToast({ type: 'error', message: 'Failed to recalculate score.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const saveRecommendation = async () => {
    setSaving(true);
    try {
      const body = {
        primaryCategory: recommendForm.primaryCategory.trim() || undefined,
        secondaryCategories: dedupeSecondaryCategories(
          recommendForm.primaryCategory.trim() || null,
          splitList(recommendForm.secondaryCategories),
        ),
        confidence: recommendForm.confidence.trim()
          ? Number(recommendForm.confidence)
          : undefined,
        reasoning: recommendForm.reasoning.trim() || undefined,
        source: 'human' as const,
      };
      const result = await adminAutopilotApi.recommendCategory(topicId, body);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              topic: result.topic,
              categoryValidation: result.categoryValidation,
            }
          : prev,
      );
      onMutated();
      showToast({ type: 'success', message: 'Category recommendation saved.' });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof AutopilotClientError ? err.message : 'Failed to save recommendation.',
      });
    } finally {
      setSaving(false);
    }
  };

  const runDecision = async (action: AutopilotDecisionAction) => {
    setConfirmProcessing(true);
    try {
      const result = await adminAutopilotApi.submitDecision(topicId, {
        action,
        rationale: decisionRationale.trim() || undefined,
      });
      setDetail((prev) => (prev ? { ...prev, topic: result.topic } : prev));
      setConfirm(null);
      onMutated();
      showToast({
        type: 'success',
        message:
          action === 'submit'
            ? 'Decision submitted for review.'
            : action === 'approve'
              ? 'Topic decision approved.'
              : 'Decision updated.',
      });
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof AutopilotClientError ? err.message : 'Decision action failed.',
      });
    } finally {
      setConfirmProcessing(false);
    }
  };

  const runArchive = async () => {
    if (!archiveReason.trim()) {
      showToast({ type: 'error', message: 'Archive reason is required.' });
      return;
    }
    setConfirmProcessing(true);
    try {
      await adminAutopilotApi.archiveTopic(topicId, archiveReason.trim());
      setConfirm(null);
      showToast({ type: 'success', message: 'Topic archived. Audit history is retained.' });
      onArchived();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof AutopilotClientError ? err.message : 'Failed to archive topic.',
      });
    } finally {
      setConfirmProcessing(false);
    }
  };

  const requestAction = (action: AutopilotDecisionAction) => {
    const meta = permittedActions.find((item) => item.action === action);
    if (!meta) return;
    if (meta.requiresRationale && !decisionRationale.trim()) {
      showToast({ type: 'error', message: 'Decision rationale is required for this action.' });
      return;
    }
    if (meta.requiresConfirm) {
      setConfirm({
        kind: 'decision',
        action,
        title: meta.confirmTitle,
        body: action === 'approve' ? APPROVAL_CONFIRMATION_COPY : meta.confirmBody,
        variant: meta.variant,
      });
      return;
    }
    void runDecision(action);
  };

  if (loading && !detail) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500 shadow-sm">
        Loading topic decision card…
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <AutopilotErrorState error={error} onRetry={() => void load()} />
      </div>
    );
  }

  if (!topic || !detail) return null;

  const searchIntent = asObject<AutopilotSearchIntent>(topic.searchIntent);
  const serp = asObject<AutopilotSerpEvidence>(topic.serpEvidence);
  const business = asObject<AutopilotBusinessAlignment>(topic.businessAlignment);
  const architecture = asObject<AutopilotContentArchitecture>(topic.contentArchitecture);
  const risk = asObject<AutopilotRiskAssessment>(topic.riskAssessment);
  const recommendation = asObject<AutopilotCategoryRecommendation>(topic.categoryRecommendation);
  const slug = detail.slugAdvisory;
  const readiness = detail.decisionReadiness;
  const scoreStale = topic.rawScore == null || topic.totalScore == null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to pipeline
          </button>
          <h2 className="text-2xl font-bold text-zinc-900">{topic.workingTitle}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Topic decision card — approves editorial readiness only, not publication.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TopicStatusBadge status={topic.topicStatus} />
            <DecisionStatusBadge status={topic.decisionStatus} />
            <ScoreBadge totalScore={topic.totalScore} band={detail.recommendationBand} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            aria-label="Refresh topic"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          {canEditorial && !topic.archivedAt ? (
            <button
              type="button"
              onClick={() =>
                setConfirm({
                  kind: 'archive',
                  title: 'Archive topic',
                  body: 'Archive this topic? Archival does not delete audit history. There is no hard delete.',
                  variant: 'warning',
                })
              }
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              Archive
            </button>
          ) : null}
        </div>
      </div>

      {topic.archivedAt ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          This topic was archived on {formatAutopilotDate(topic.archivedAt)}.
        </p>
      ) : null}

      {/* A. Identity */}
      <SectionShell
        title="Identity"
        actions={
          canContribute && editSection !== 'identity' ? (
            <button type="button" onClick={() => beginEdit('identity')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
              Edit identity
            </button>
          ) : null
        }
      >
        {editSection === 'identity' ? (
          <div className="space-y-3">
            {(['workingTitle', 'primaryKeyword', 'userProblem', 'audience', 'market', 'language', 'location', 'source', 'proposedSlug'] as const).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor={`ap-id-${key}`}>
                  {key}
                </label>
                {key === 'userProblem' ? (
                  <textarea
                    id={`ap-id-${key}`}
                    value={String(draft[key] || '')}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                ) : (
                  <input
                    id={`ap-id-${key}`}
                    value={String(draft[key] || '')}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                )}
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-id-supporting">
                Supporting keywords
              </label>
              <input
                id="ap-id-supporting"
                value={String(draft.supportingKeywords || '')}
                onChange={(e) => setDraft((prev) => ({ ...prev, supportingKeywords: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-id-variants">
                Keyword variants
              </label>
              <input
                id="ap-id-variants"
                value={String(draft.keywordVariants || '')}
                onChange={(e) => setDraft((prev) => ({ ...prev, keywordVariants: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {sectionError ? <p className="text-sm text-red-600" role="alert">{sectionError}</p> : null}
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void saveSection()} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Save
              </button>
              <button type="button" disabled={saving} onClick={cancelEdit} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Working title" value={topic.workingTitle} />
            <Field label="Primary keyword" value={topic.primaryKeyword} />
            <Field label="Supporting keywords" value={joinList(topic.supportingKeywords)} />
            <Field label="Keyword variants" value={joinList(topic.keywordVariants)} />
            <Field label="User problem" value={topic.userProblem} />
            <Field label="Audience" value={topic.audience} />
            <Field label="Market" value={topic.market} />
            <Field label="Language" value={topic.language} />
            <Field label="Location" value={topic.location} />
            <Field label="Source" value={topic.source} />
            <Field label="Proposed slug" value={topic.proposedSlug} />
          </div>
        )}
      </SectionShell>

      {/* B. Research workspace (Phase 2B) */}
      <SectionShell
        title="Research evidence"
        description="Versioned research snapshots with deterministic overlap advisories. Confirmation copies evidence to the topic — it does not score, approve, generate, or publish."
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Field
            label="Confirmed topic intent"
            value={searchIntent.primaryIntent || searchIntent.dominantIntent || searchIntent.notes}
          />
          <Field
            label="Confirmed SERP rows / notes"
            value={
              Array.isArray(serp.rows) && serp.rows.length > 0
                ? `${serp.rows.length} evidence row(s)`
                : serp.notes || serp.evidenceLimitation
            }
          />
        </div>
        <ResearchEditor
          topicId={topicId}
          canContribute={canContribute && !topic.archivedAt}
          onMutated={() => {
            onMutated();
            void load();
          }}
        />
      </SectionShell>

      {/* C. Business */}
      <SectionShell
        title="Business alignment"
        actions={
          canContribute && editSection !== 'business' ? (
            <button type="button" onClick={() => beginEdit('business')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Edit business alignment</button>
          ) : null
        }
      >
        {editSection === 'business' ? (
          <div className="space-y-3">
            {(['serviceFit', 'commercialValue', 'buyerFit', 'relevantMoneyPage', 'internalLinkingOpportunity', 'notes'] as const).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor={`ap-biz-${key}`}>{key}</label>
                <textarea id={`ap-biz-${key}`} rows={2} value={String(draft[key] || '')} onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            ))}
            {sectionError ? <p className="text-sm text-red-600" role="alert">{sectionError}</p> : null}
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void saveSection()} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
              <button type="button" disabled={saving} onClick={cancelEdit} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Service relevance" value={business.serviceFit || business.relevantService} />
            <Field label="Business value" value={business.commercialValue} />
            <Field label="Buyer intent" value={business.buyerFit} />
            <Field label="Commercial-page support" value={business.relevantMoneyPage} />
            <Field label="Internal-link opportunities" value={business.internalLinkingOpportunity} />
            <Field label="Notes" value={business.notes} />
          </div>
        )}
      </SectionShell>

      {/* D. Architecture / risk */}
      <SectionShell
        title="Content architecture and risk"
        actions={
          canContribute && editSection !== 'architecture' ? (
            <button type="button" onClick={() => beginEdit('architecture')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Edit architecture</button>
          ) : null
        }
      >
        {editSection === 'architecture' ? (
          <div className="space-y-3">
            {(['intendedPageType', 'topicCluster', 'contentGap', 'notes', 'cannibalisationRisk', 'unsupportedClaimRisk', 'riskNotes'] as const).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor={`ap-arch-${key}`}>{key}</label>
                <textarea id={`ap-arch-${key}`} rows={2} value={String(draft[key] || '')} onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            ))}
            {sectionError ? <p className="text-sm text-red-600" role="alert">{sectionError}</p> : null}
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void saveSection()} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
              <button type="button" disabled={saving} onClick={cancelEdit} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Proposed page type" value={architecture.intendedPageType} />
            <Field label="Topic cluster" value={architecture.topicCluster} />
            <Field label="Content gap" value={architecture.contentGap} />
            <Field label="Differentiation / notes" value={architecture.notes} />
            <Field label="Cannibalisation observations" value={risk.cannibalisationRisk} />
            <Field label="Unsupported-claim risks" value={risk.unsupportedClaimRisk} />
            <Field label="Risk notes" value={risk.notes} />
          </div>
        )}
      </SectionShell>

      {/* E. Recommendation */}
      <SectionShell
        title="Category recommendation"
        description="Recommendation only — submitting this does not change final categories."
      >
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 rounded-2xl bg-zinc-50 p-4">
          <Field label="Recommended primary" value={recommendation.primaryCategory} />
          <Field label="Recommended secondary" value={joinList(recommendation.secondaryCategories)} />
          <Field label="Confidence" value={recommendation.confidence != null ? String(recommendation.confidence) : null} />
          <Field label="Source" value={recommendation.source} />
          <Field label="Reasoning" value={recommendation.reasoning} />
          <Field label="Recommended at" value={recommendation.recommendedAt} />
        </div>
        {canContribute ? (
          <div className="space-y-3 border-t border-zinc-100 pt-4">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Recommendation form</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-rec-primary">Primary category</label>
                <select id="ap-rec-primary" value={recommendForm.primaryCategory} onChange={(e) => setRecommendForm((p) => ({ ...p, primaryCategory: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20">
                  <option value="">Select…</option>
                  {BLOG_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-rec-confidence">Confidence (0–1)</label>
                <input id="ap-rec-confidence" value={recommendForm.confidence} onChange={(e) => setRecommendForm((p) => ({ ...p, confidence: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-rec-secondary">Secondary categories</label>
              <select
                id="ap-rec-secondary"
                multiple
                value={splitList(recommendForm.secondaryCategories)}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setRecommendForm((p) => ({ ...p, secondaryCategories: selected.join(', ') }));
                }}
                className="min-h-[110px] w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {BLOG_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-rec-reasoning">Reasoning</label>
              <textarea id="ap-rec-reasoning" rows={2} value={recommendForm.reasoning} onChange={(e) => setRecommendForm((p) => ({ ...p, reasoning: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <button type="button" disabled={saving} onClick={() => void saveRecommendation()} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Save recommendation
            </button>
          </div>
        ) : null}
      </SectionShell>

      {/* F. Final categories */}
      <SectionShell
        title="Final category assignment"
        description="Editorial override. Distinct from recommendation — reason required."
        actions={
          canEditorial && editSection !== 'categories' ? (
            <button type="button" onClick={() => beginEdit('categories')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">Edit final categories</button>
          ) : null
        }
      >
        {editSection === 'categories' ? (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-final-primary">Primary category</label>
              <select
                id="ap-final-primary"
                value={String(draft.primaryCategory || '')}
                onChange={(e) => setDraft((p) => ({ ...p, primaryCategory: e.target.value }))}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="">Select…</option>
                {BLOG_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-final-secondary">Secondary categories</label>
              <select
                id="ap-final-secondary"
                multiple
                value={Array.isArray(draft.secondaryCategories) ? (draft.secondaryCategories as string[]) : []}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                  setDraft((p) => ({
                    ...p,
                    secondaryCategories: dedupeSecondaryCategories(String(p.primaryCategory || ''), selected),
                  }));
                }}
                className="min-h-[110px] w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                {BLOG_CATEGORIES.map((cat) => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-final-reason">Reason (required)</label>
              <textarea id="ap-final-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            {sectionError ? <p className="text-sm text-red-600" role="alert">{sectionError}</p> : null}
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void saveSection()} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
              <button type="button" disabled={saving} onClick={cancelEdit} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Final primary category" value={topic.primaryCategory} />
            <Field label="Final secondary categories" value={joinList(topic.secondaryCategories)} />
          </div>
        )}
      </SectionShell>

      {/* G. Scoring */}
      <SectionShell
        title="Scoring"
        description="Totals are calculated on the server. Clients never submit raw or total scores."
        actions={
          <div className="flex flex-wrap gap-2">
            {canContribute ? (
              <button type="button" disabled={saving} onClick={() => void recalculateScore()} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50">
                Recalculate score
              </button>
            ) : null}
            {canEditorial && editSection !== 'score' ? (
              <button type="button" onClick={() => beginEdit('score')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                Edit score inputs
              </button>
            ) : null}
          </div>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3 text-sm">
          <ScoreBadge totalScore={topic.totalScore} band={detail.recommendationBand} />
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
            Raw weighted: {topic.rawScore != null ? topic.rawScore : '—'}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">
            Version: {topic.scoringVersion || '—'}
          </span>
          {scoreStale ? (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
              Totals stale or unscored — recalculate after dimension edits
            </span>
          ) : null}
        </div>
        {missingDimensions.length > 0 ? (
          <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
            Missing dimensions: {missingDimensions.map(getScoreDimensionLabel).join(', ')}
          </p>
        ) : null}
        {editSection === 'score' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {AUTOPILOT_SCORE_DIMENSION_KEYS.map((key) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor={`ap-score-${key}`}>
                    {getScoreDimensionLabel(key)} ({SCORE_INPUT_BOUNDS.dimension.min}–{SCORE_INPUT_BOUNDS.dimension.max})
                  </label>
                  <input
                    id={`ap-score-${key}`}
                    type="number"
                    min={SCORE_INPUT_BOUNDS.dimension.min}
                    max={SCORE_INPUT_BOUNDS.dimension.max}
                    value={draft[key] === '' || draft[key] == null ? '' : Number(draft[key])}
                    onChange={(e) => setDraft((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-score-cannibalisation">
                  Cannibalisation penalty (0–30)
                </label>
                <input id="ap-score-cannibalisation" type="number" min={0} max={30} value={draft.cannibalisationPenalty === '' || draft.cannibalisationPenalty == null ? '' : Number(draft.cannibalisationPenalty)} onChange={(e) => setDraft((p) => ({ ...p, cannibalisationPenalty: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-score-claim">
                  Unsupported-claim penalty (0–20)
                </label>
                <input id="ap-score-claim" type="number" min={0} max={20} value={draft.unsupportedClaimRiskPenalty === '' || draft.unsupportedClaimRiskPenalty == null ? '' : Number(draft.unsupportedClaimRiskPenalty)} onChange={(e) => setDraft((p) => ({ ...p, unsupportedClaimRiskPenalty: e.target.value }))} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-score-reason">Reason (required)</label>
              <textarea id="ap-score-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            {sectionError ? <p className="text-sm text-red-600" role="alert">{sectionError}</p> : null}
            <div className="flex gap-2">
              <button type="button" disabled={saving} onClick={() => void saveSection()} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Save</button>
              <button type="button" disabled={saving} onClick={cancelEdit} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {AUTOPILOT_SCORE_DIMENSION_KEYS.map((key) => (
              <Field key={key} label={getScoreDimensionLabel(key)} value={topic[key] != null ? String(topic[key]) : 'Missing'} />
            ))}
            <Field label="Cannibalisation penalty" value={topic.cannibalisationPenalty != null ? String(topic.cannibalisationPenalty) : '—'} />
            <Field label="Unsupported-claim penalty" value={topic.unsupportedClaimRiskPenalty != null ? String(topic.unsupportedClaimRiskPenalty) : '—'} />
          </div>
        )}
      </SectionShell>

      {/* H. Decision */}
      <SectionShell title="Decision" description="Approving a topic decides editorial readiness only — it does not create or publish an article.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Topic status" value={<TopicStatusBadge status={topic.topicStatus} />} />
          <Field label="Decision status" value={<DecisionStatusBadge status={topic.decisionStatus} />} />
          <Field label="Readiness" value={readiness.ok ? 'Ready for decision actions that require readiness' : 'Blocked or incomplete'} />
          <Field label="Decided by" value={topic.decidedById != null ? `User #${topic.decidedById}` : '—'} />
          <Field label="Decided at" value={formatAutopilotDate(topic.decidedAt)} />
          <Field label="Current rationale" value={topic.decisionRationale} />
        </div>
        {readiness.errors.length > 0 ? (
          <ul className="mt-4 space-y-1 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" aria-label="Blocking validation errors">
            {readiness.errors.map((issue) => (
              <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        ) : null}
        {readiness.warnings.length > 0 ? (
          <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800" aria-label="Decision warnings">
            {readiness.warnings.map((issue) => (
              <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        ) : null}
        {permittedActions.length > 0 ? (
          <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-decision-rationale">
                Decision rationale
              </label>
              <textarea
                id="ap-decision-rationale"
                rows={3}
                value={decisionRationale}
                onChange={(e) => setDecisionRationale(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {permittedActions.map((action) => (
                <button
                  key={action.action}
                  type="button"
                  disabled={saving || confirmProcessing}
                  onClick={() => requestAction(action.action)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                    action.variant === 'danger'
                      ? 'bg-red-600 hover:bg-red-700'
                      : action.variant === 'warning'
                        ? 'bg-amber-600 hover:bg-amber-700'
                        : 'bg-zinc-900 hover:bg-zinc-800'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-500">No decision actions available for your role and the current status.</p>
        )}
      </SectionShell>

      {/* I. Slug advisory */}
      <SectionShell
        title="Slug advisory"
        description="Advisory in Phase 1D — slug conflicts do not block topic approval. Future publishing gates will enforce uniqueness."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Proposed slug" value={slug.proposedSlug} />
          <Field label="Normalised slug" value={slug.normalisedSlug || '—'} />
          <Field
            label="Reservation check"
            value={
              slug.blocking.conflict
                ? `Conflict (${slug.blocking.conflictSource}): ${slug.blocking.message || slug.blocking.conflictValue || 'conflict detected'}`
                : slug.blocking.message || 'No blocking reservation conflict'
            }
          />
          <Field
            label="Case-insensitive warning"
            value={slug.caseInsensitiveWarning?.message || 'None'}
          />
          <Field
            label="Peer Autopilot candidate warning"
            value={slug.candidateTopicWarning?.message || 'None'}
          />
        </div>
      </SectionShell>

      {/* J. Activity */}
      <SectionShell
        title="Recent topic activity"
        actions={
          <button
            type="button"
            onClick={() => onOpenActivityForTopic(topic.id)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            Open full activity log
          </button>
        }
      >
        <ul className="space-y-3">
          {detail.recentActivity.length === 0 ? (
            <li className="text-sm italic text-zinc-400">No activity yet</li>
          ) : (
            detail.recentActivity.map((row) => (
              <li key={row.id} className="border-b border-zinc-50 pb-3 last:border-0">
                <p className="text-sm font-medium text-zinc-900">{buildSafeEventSummary(row)}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {formatAutopilotDate(row.createdAt)} · {getActivityActorLabel(row)}
                  {row.reason ? ` · ${row.reason}` : ''}
                </p>
              </li>
            ))
          )}
        </ul>
      </SectionShell>

      {confirm ? (
        <div>
          {confirm.kind === 'archive' ? (
            <div className="fixed inset-0 z-[101] flex items-center justify-center bg-zinc-900/50 p-4">
              <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl" role="dialog" aria-modal="true">
                <h2 className="text-lg font-bold text-zinc-900">{confirm.title}</h2>
                <p className="mt-2 text-sm text-zinc-600">{confirm.body}</p>
                <label className="mt-4 mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-archive-reason">
                  Reason (required)
                </label>
                <textarea
                  id="ap-archive-reason"
                  rows={3}
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" disabled={confirmProcessing} onClick={() => setConfirm(null)} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700">
                    Cancel
                  </button>
                  <button type="button" disabled={confirmProcessing} onClick={() => void runArchive()} className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                    Archive topic
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <AppConfirmDialog
              open
              title={confirm.title}
              body={confirm.body}
              variant={confirm.variant}
              confirmLabel="Confirm"
              isProcessing={confirmProcessing}
              onCancel={() => {
                if (!confirmProcessing) setConfirm(null);
              }}
              onConfirm={() => {
                if (confirm.action) void runDecision(confirm.action);
              }}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
