import { useEffect, useState, type ReactNode } from 'react';
import type {
  AutopilotBusinessAlignment,
  AutopilotContentArchitecture,
  AutopilotRiskAssessment,
  AutopilotSearchIntent,
  AutopilotSerpEvidence,
  AutopilotSerpEvidenceRow,
} from '../../../data/autopilot/types';
import {
  adminAutopilotApi,
  AutopilotClientError,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  AUTOPILOT_EVIDENCE_QUALITY_VALUES,
  buildConfirmationPayload,
  buildResearchUpdatePayload,
  formatCompletenessDisplay,
  formatReadinessSummary,
  getEvidenceQualityLabel,
  getOverlapFindingLabel,
  getResearchSnapshotStatusLabel,
  isResearchSnapshotReadOnly,
  RESEARCH_CONFIRMATION_COPY,
  SERP_EVIDENCE_MANUAL_NOTICE,
} from '../../../lib/autopilot/adminResearchHelpers';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import { useToast } from '../../ui/AppToast';
import { AutopilotErrorState } from './AutopilotErrorState';

type ResearchEditorProps = {
  topicId: number;
  canContribute: boolean;
  initialSnapshotId?: number | null;
  onMutated?: () => void;
};

type SnapshotDto = Record<string, unknown>;

function asObject<T extends object>(value: unknown): T {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : ({} as T);
}

function emptySerpRow(): AutopilotSerpEvidenceRow {
  return {
    title: '',
    url: '',
    domain: '',
    contentType: 'unknown',
    source: 'manual',
  };
}

export function ResearchEditor({
  topicId,
  canContribute,
  initialSnapshotId = null,
  onMutated,
}: ResearchEditorProps) {
  const { showToast } = useToast();
  const [history, setHistory] = useState<SnapshotDto[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotDto | null>(null);
  const [completeness, setCompleteness] = useState<Record<string, unknown> | null>(null);
  const [readiness, setReadiness] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);
  const [confirmationNote, setConfirmationNote] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [intent, setIntent] = useState<AutopilotSearchIntent>({});
  const [serp, setSerp] = useState<AutopilotSerpEvidence>({ rows: [] });
  const [business, setBusiness] = useState<AutopilotBusinessAlignment>({});
  const [architecture, setArchitecture] = useState<AutopilotContentArchitecture>({});
  const [risk, setRisk] = useState<AutopilotRiskAssessment>({});
  const [meta, setMeta] = useState({
    query: '',
    market: '',
    language: '',
    location: '',
    researchNotes: '',
    evidenceQuality: 'not_assessed',
    sourceType: 'manual',
  });

  const readOnly = isResearchSnapshotReadOnly(String(snapshot?.status || ''));

  const hydrateFromSnapshot = (snap: SnapshotDto) => {
    setSnapshot(snap);
    setIntent(asObject<AutopilotSearchIntent>(snap.searchIntent));
    setSerp({
      ...asObject<AutopilotSerpEvidence>(snap.serpEvidence),
      rows: Array.isArray(asObject<AutopilotSerpEvidence>(snap.serpEvidence).rows)
        ? [...(asObject<AutopilotSerpEvidence>(snap.serpEvidence).rows as AutopilotSerpEvidenceRow[])]
        : [],
    });
    setBusiness(asObject<AutopilotBusinessAlignment>(snap.businessAlignment));
    setArchitecture(asObject<AutopilotContentArchitecture>(snap.contentArchitecture));
    setRisk(asObject<AutopilotRiskAssessment>(snap.riskAssessment));
    setMeta({
      query: String(snap.query || ''),
      market: String(snap.market || ''),
      language: String(snap.language || ''),
      location: String(snap.location || ''),
      researchNotes: String(snap.researchNotes || ''),
      evidenceQuality: String(snap.evidenceQuality || 'not_assessed'),
      sourceType: String(snap.sourceType || 'manual'),
    });
  };

  const load = async (preferredId?: number | null) => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminAutopilotApi.listResearchSnapshots(topicId, { limit: 50 });
      setHistory(list.items);
      let targetId = preferredId ?? initialSnapshotId;
      if (targetId == null) {
        const editable = list.items.find(
          (item) => item.status === 'draft' || item.status === 'ready_for_confirmation',
        );
        const confirmed = list.items.find((item) => item.status === 'confirmed');
        targetId = Number((editable || confirmed || list.items[0])?.id || 0) || null;
      }
      if (targetId) {
        const detail = await adminAutopilotApi.getResearchSnapshot(targetId);
        hydrateFromSnapshot(detail.snapshot);
        setCompleteness(detail.completeness);
        setReadiness(detail.readiness);
      } else {
        setSnapshot(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load research'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [topicId, initialSnapshotId]);

  const startOrContinue = async (createNewVersion = false, prefillFromConfirmed = false) => {
    setSaving(true);
    setError(null);
    try {
      const result = await adminAutopilotApi.createResearchSnapshot(topicId, {
        createNewVersion,
        prefillFromConfirmed,
      });
      hydrateFromSnapshot(result.snapshot);
      setCompleteness(result.completeness);
      setReadiness(result.readiness);
      showToast({
        type: 'success',
        message: result.reusedExistingDraft
          ? 'Opened existing draft research snapshot.'
          : createNewVersion
            ? 'Created a new auditable research version.'
            : 'Research snapshot created.',
      });
      onMutated?.();
      await load(Number(result.snapshot.id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start research'));
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!snapshot?.id || readOnly) return;
    setSaving(true);
    setError(null);
    try {
      const payload = buildResearchUpdatePayload({
        ...meta,
        searchIntent: intent,
        serpEvidence: serp,
        businessAlignment: business,
        contentArchitecture: architecture,
        riskAssessment: risk,
      });
      const result = await adminAutopilotApi.patchResearchSnapshot(
        Number(snapshot.id),
        payload,
      );
      hydrateFromSnapshot(result.snapshot);
      setCompleteness(result.completeness);
      setReadiness(result.readiness);
      showToast({ type: 'success', message: 'Research snapshot saved.' });
      onMutated?.();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save research'));
    } finally {
      setSaving(false);
    }
  };

  const runOverlap = async () => {
    if (!snapshot?.id || readOnly) return;
    setSaving(true);
    try {
      await saveDraft();
      const result = await adminAutopilotApi.analyseResearchOverlap(Number(snapshot.id));
      hydrateFromSnapshot(result.snapshot);
      setCompleteness(result.completeness);
      showToast({ type: 'success', message: 'Deterministic overlap analysis completed.' });
      onMutated?.();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Overlap analysis failed'));
    } finally {
      setSaving(false);
    }
  };

  const markReady = async () => {
    if (!snapshot?.id || readOnly) return;
    setSaving(true);
    try {
      await saveDraft();
      const result = await adminAutopilotApi.markResearchReady(Number(snapshot.id));
      hydrateFromSnapshot(result.snapshot);
      setCompleteness(result.completeness);
      setReadiness(result.readiness);
      showToast({ type: 'success', message: 'Research marked ready for confirmation.' });
      onMutated?.();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Mark ready failed'));
    } finally {
      setSaving(false);
    }
  };

  const confirm = async () => {
    if (!snapshot?.id || !confirmationNote.trim()) return;
    setSaving(true);
    try {
      const result = await adminAutopilotApi.confirmResearchSnapshot(
        Number(snapshot.id),
        buildConfirmationPayload(confirmationNote),
      );
      hydrateFromSnapshot(result.snapshot);
      setConfirmOpen(false);
      setConfirmationNote('');
      showToast({
        type: 'success',
        message: 'Research confirmed. Topic research is complete — not scored, approved, or published.',
      });
      onMutated?.();
      await load(Number(result.snapshot.id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Confirmation failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-10 text-center text-sm text-zinc-500">
        Loading research workspace…
      </div>
    );
  }

  if (error && !snapshot) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  const overlap = asObject<{
    findings?: Array<Record<string, unknown>>;
    summary?: Record<string, unknown>;
    inventoryCounts?: Record<string, number>;
    clusterHints?: Array<Record<string, unknown>>;
    internalLinkHints?: Array<Record<string, unknown>>;
    version?: string;
  }>(snapshot?.overlapAnalysis);

  const completenessValue =
    typeof completeness?.completeness === 'number'
      ? completeness.completeness
      : typeof snapshot?.evidenceCompleteness === 'number'
        ? snapshot.evidenceCompleteness
        : null;

  const blockers = Array.isArray(readiness?.blockers)
    ? (readiness.blockers as Array<{ code: string; message: string }>)
    : [];
  const warnings = Array.isArray(readiness?.warnings)
    ? (readiness.warnings as Array<{ code: string; message: string }>)
    : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-zinc-900">Research workspace</h4>
          <p className="text-sm text-zinc-500">
            Manual evidence capture with deterministic overlap advisories. No live search, scraping, or AI generation.
          </p>
          {snapshot ? (
            <p className="mt-2 text-xs text-zinc-500">
              {getResearchSnapshotStatusLabel(String(snapshot.status))} · v{String(snapshot.version)} ·{' '}
              Completeness {formatCompletenessDisplay(completenessValue as number | null)} ·{' '}
              Quality {getEvidenceQualityLabel(String(snapshot.evidenceQuality))}
            </p>
          ) : null}
        </div>
        {canContribute ? (
          <div className="flex flex-wrap gap-2">
            {!snapshot ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void startOrContinue(false)}
                className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
              >
                Start Research
              </button>
            ) : null}
            {snapshot && !readOnly ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void saveDraft()}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void runOverlap()}
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold"
                >
                  Analyse overlap
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void markReady()}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
                >
                  Mark ready
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmOpen(true)}
                  className="rounded-xl bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"
                >
                  Confirm research
                </button>
              </>
            ) : null}
            {snapshot ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void startOrContinue(true, true)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold"
                title="Creates a new auditable version; does not mutate the prior snapshot"
              >
                Create new version
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {error ? <AutopilotErrorState error={error} onRetry={() => setError(null)} /> : null}

      {readiness ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
          <p className="font-semibold text-zinc-900">
            {formatReadinessSummary(Boolean(readiness.ready), blockers.length, warnings.length)}
          </p>
          {blockers.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-rose-700">
              {blockers.map((item) => (
                <li key={item.code}>{item.message}</li>
              ))}
            </ul>
          ) : null}
          {warnings.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-800">
              {warnings.slice(0, 8).map((item) => (
                <li key={`${item.code}-${item.message}`}>{item.message}</li>
              ))}
            </ul>
          ) : null}
          {Array.isArray(completeness?.missingItems) &&
          (completeness.missingItems as string[]).length > 0 ? (
            <div className="mt-2">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Missing research checklist
              </p>
              <ul className="mt-1 list-disc pl-5 text-zinc-600">
                {(completeness.missingItems as string[]).slice(0, 12).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* History */}
      {history.length > 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h5 className="text-sm font-bold text-zinc-900">Snapshot history</h5>
          <ul className="mt-3 space-y-2">
            {history.map((item) => (
              <li key={String(item.id)} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => void load(Number(item.id))}
                  className="font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  v{String(item.version)} · {getResearchSnapshotStatusLabel(String(item.status))}
                </button>
                <span className="text-xs text-zinc-500">
                  {formatCompletenessDisplay(
                    typeof item.evidenceCompleteness === 'number'
                      ? item.evidenceCompleteness
                      : null,
                  )}{' '}
                  · created {formatAutopilotDate(String(item.createdAt || ''))}
                  {item.confirmedAt
                    ? ` · confirmed ${formatAutopilotDate(String(item.confirmedAt))}`
                    : ''}
                  {item.supersededAt
                    ? ` · superseded ${formatAutopilotDate(String(item.supersededAt))}`
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!snapshot ? (
        <p className="text-sm text-zinc-500">No research snapshot yet. Start research to create version 1.</p>
      ) : (
        <div className={`space-y-5 ${readOnly ? 'opacity-95' : ''}`}>
          {readOnly ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This snapshot is {getResearchSnapshotStatusLabel(String(snapshot.status)).toLowerCase()} and read-only.
              Create a new version to make corrections.
            </p>
          ) : null}

          <Section title="Snapshot metadata">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Query" value={meta.query} disabled={readOnly} onChange={(v) => setMeta((p) => ({ ...p, query: v }))} />
              <Field label="Market" value={meta.market} disabled={readOnly} onChange={(v) => setMeta((p) => ({ ...p, market: v }))} />
              <Field label="Language" value={meta.language} disabled={readOnly} onChange={(v) => setMeta((p) => ({ ...p, language: v }))} />
              <Field label="Location" value={meta.location} disabled={readOnly} onChange={(v) => setMeta((p) => ({ ...p, location: v }))} />
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400">Evidence quality</label>
                <select
                  disabled={readOnly}
                  value={meta.evidenceQuality}
                  onChange={(e) => setMeta((p) => ({ ...p, evidenceQuality: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                >
                  {AUTOPILOT_EVIDENCE_QUALITY_VALUES.map((value) => (
                    <option key={value} value={value}>
                      {getEvidenceQualityLabel(value)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <TextArea
              label="Research notes"
              value={meta.researchNotes}
              disabled={readOnly}
              onChange={(v) => setMeta((p) => ({ ...p, researchNotes: v }))}
            />
          </Section>

          <Section title="Search intent">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <SelectField
                label="Primary intent"
                value={intent.primaryIntent || intent.dominantIntent || ''}
                disabled={readOnly}
                options={[
                  '',
                  'informational',
                  'commercial_investigation',
                  'transactional',
                  'navigational',
                  'mixed',
                  'unknown',
                ]}
                onChange={(v) => setIntent((p) => ({ ...p, primaryIntent: v as AutopilotSearchIntent['primaryIntent'] }))}
              />
              <SelectField
                label="Journey stage"
                value={intent.journeyStage || ''}
                disabled={readOnly}
                options={[
                  '',
                  'problem_awareness',
                  'solution_awareness',
                  'vendor_evaluation',
                  'purchase_decision',
                  'post_purchase',
                  'unknown',
                ]}
                onChange={(v) => setIntent((p) => ({ ...p, journeyStage: v as AutopilotSearchIntent['journeyStage'] }))}
              />
            </div>
            <TextArea label="User need" value={intent.userNeed || ''} disabled={readOnly} onChange={(v) => setIntent((p) => ({ ...p, userNeed: v }))} />
            <TextArea label="Expected answer format" value={intent.expectedAnswerFormat || ''} disabled={readOnly} onChange={(v) => setIntent((p) => ({ ...p, expectedAnswerFormat: v }))} />
            <TextArea label="Decision context" value={intent.decisionContext || ''} disabled={readOnly} onChange={(v) => setIntent((p) => ({ ...p, decisionContext: v }))} />
            <TextArea label="Notes" value={intent.notes || ''} disabled={readOnly} onChange={(v) => setIntent((p) => ({ ...p, notes: v }))} />
          </Section>

          <Section title="SERP evidence">
            <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
              {SERP_EVIDENCE_MANUAL_NOTICE}
            </p>
            <TextArea
              label="Evidence limitation (required if fewer than 3 rows)"
              value={serp.evidenceLimitation || ''}
              disabled={readOnly}
              onChange={(v) => setSerp((p) => ({ ...p, evidenceLimitation: v }))}
            />
            {(serp.rows || []).map((row, index) => (
              <div key={index} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Row {index + 1}
                  </span>
                  {!readOnly ? (
                    <button
                      type="button"
                      className="text-xs font-bold text-rose-600"
                      onClick={() =>
                        setSerp((p) => ({
                          ...p,
                          rows: (p.rows || []).filter((_, i) => i !== index),
                        }))
                      }
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Field label="Position" value={row.position != null ? String(row.position) : ''} disabled={readOnly} onChange={(v) => {
                    const rows = [...(serp.rows || [])];
                    rows[index] = { ...row, position: v ? Number(v) : undefined };
                    setSerp((p) => ({ ...p, rows }));
                  }} />
                  <Field label="Title" value={row.title || ''} disabled={readOnly} onChange={(v) => {
                    const rows = [...(serp.rows || [])];
                    rows[index] = { ...row, title: v };
                    setSerp((p) => ({ ...p, rows }));
                  }} />
                  <Field label="URL" value={row.url || ''} disabled={readOnly} onChange={(v) => {
                    const rows = [...(serp.rows || [])];
                    rows[index] = { ...row, url: v };
                    setSerp((p) => ({ ...p, rows }));
                  }} />
                  <Field label="Domain" value={row.domain || ''} disabled={readOnly} onChange={(v) => {
                    const rows = [...(serp.rows || [])];
                    rows[index] = { ...row, domain: v };
                    setSerp((p) => ({ ...p, rows }));
                  }} />
                  <Field label="Observed date" value={row.observedAt || ''} disabled={readOnly} onChange={(v) => {
                    const rows = [...(serp.rows || [])];
                    rows[index] = { ...row, observedAt: v };
                    setSerp((p) => ({ ...p, rows }));
                  }} />
                  <Field label="Source / provenance" value={row.source || ''} disabled={readOnly} onChange={(v) => {
                    const rows = [...(serp.rows || [])];
                    rows[index] = { ...row, source: v };
                    setSerp((p) => ({ ...p, rows }));
                  }} />
                </div>
                <TextArea label="Notes" value={row.notes || ''} disabled={readOnly} onChange={(v) => {
                  const rows = [...(serp.rows || [])];
                  rows[index] = { ...row, notes: v };
                  setSerp((p) => ({ ...p, rows }));
                }} />
              </div>
            ))}
            {!readOnly ? (
              <button
                type="button"
                onClick={() => setSerp((p) => ({ ...p, rows: [...(p.rows || []), emptySerpRow()] }))}
                className="text-xs font-bold text-emerald-700"
              >
                Add SERP row
              </button>
            ) : null}
          </Section>

          <Section title="Business alignment">
            <TextArea label="Service relevance" value={business.serviceRelevanceNotes || ''} disabled={readOnly} onChange={(v) => setBusiness((p) => ({ ...p, serviceRelevanceNotes: v }))} />
            <TextArea label="Business value" value={business.businessValueNotes || ''} disabled={readOnly} onChange={(v) => setBusiness((p) => ({ ...p, businessValueNotes: v }))} />
            <TextArea label="Buyer intent" value={business.buyerIntentNotes || ''} disabled={readOnly} onChange={(v) => setBusiness((p) => ({ ...p, buyerIntentNotes: v }))} />
            <TextArea label="Commercial-page support" value={business.commercialPageSupportNotes || ''} disabled={readOnly} onChange={(v) => setBusiness((p) => ({ ...p, commercialPageSupportNotes: v }))} />
            <TextArea label="Internal-link opportunities" value={business.internalLinkOpportunityNotes || ''} disabled={readOnly} onChange={(v) => setBusiness((p) => ({ ...p, internalLinkOpportunityNotes: v }))} />
            <Field
              label="Target service paths (comma-separated)"
              value={(business.targetServicePaths || []).join(', ')}
              disabled={readOnly}
              onChange={(v) =>
                setBusiness((p) => ({
                  ...p,
                  targetServicePaths: v.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
            <Field
              label="Target commercial paths (comma-separated)"
              value={(business.targetCommercialPaths || []).join(', ')}
              disabled={readOnly}
              onChange={(v) =>
                setBusiness((p) => ({
                  ...p,
                  targetCommercialPaths: v.split(',').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
            <TextArea label="No suitable path reason" value={business.noSuitablePathReason || ''} disabled={readOnly} onChange={(v) => setBusiness((p) => ({ ...p, noSuitablePathReason: v }))} />
            <TextArea label="Notes" value={business.notes || ''} disabled={readOnly} onChange={(v) => setBusiness((p) => ({ ...p, notes: v }))} />
          </Section>

          <Section title="Content architecture">
            <Field label="Proposed page type" value={String(architecture.proposedPageType || architecture.intendedPageType || '')} disabled={readOnly} onChange={(v) => setArchitecture((p) => ({ ...p, proposedPageType: v }))} />
            <Field label="Topic cluster" value={architecture.topicCluster || ''} disabled={readOnly} onChange={(v) => setArchitecture((p) => ({ ...p, topicCluster: v }))} />
            <Field label="Content role" value={String(architecture.contentRole || '')} disabled={readOnly} onChange={(v) => setArchitecture((p) => ({ ...p, contentRole: v }))} />
            <TextArea label="Differentiation angle" value={architecture.differentiationAngle || ''} disabled={readOnly} onChange={(v) => setArchitecture((p) => ({ ...p, differentiationAngle: v }))} />
            <TextArea label="Direct-answer opportunity" value={architecture.directAnswerOpportunity || ''} disabled={readOnly} onChange={(v) => setArchitecture((p) => ({ ...p, directAnswerOpportunity: v }))} />
            <TextArea
              label="Required sections (one per line)"
              value={(architecture.requiredSections || []).join('\n')}
              disabled={readOnly}
              onChange={(v) =>
                setArchitecture((p) => ({
                  ...p,
                  requiredSections: v.split('\n').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
            <TextArea
              label="Supporting questions (one per line)"
              value={(architecture.supportingQuestions || []).join('\n')}
              disabled={readOnly}
              onChange={(v) =>
                setArchitecture((p) => ({
                  ...p,
                  supportingQuestions: v.split('\n').map((s) => s.trim()).filter(Boolean),
                }))
              }
            />
            <TextArea label="Notes" value={architecture.notes || ''} disabled={readOnly} onChange={(v) => setArchitecture((p) => ({ ...p, notes: v }))} />
          </Section>

          <Section title="Risk assessment">
            <TextArea label="Potential cannibalisation / overlap" value={risk.cannibalisationNotes || risk.cannibalisationRisk || ''} disabled={readOnly} onChange={(v) => setRisk((p) => ({ ...p, cannibalisationNotes: v }))} />
            <TextArea label="Unsupported claim risks" value={risk.unsupportedClaimRisks || risk.unsupportedClaimRisk || ''} disabled={readOnly} onChange={(v) => setRisk((p) => ({ ...p, unsupportedClaimRisks: v }))} />
            <TextArea label="Compliance notes" value={risk.legalOrComplianceNotes || risk.legalComplianceNotes || ''} disabled={readOnly} onChange={(v) => setRisk((p) => ({ ...p, legalOrComplianceNotes: v }))} />
            <TextArea label="Evidence limitations" value={risk.evidenceLimitations || ''} disabled={readOnly} onChange={(v) => setRisk((p) => ({ ...p, evidenceLimitations: v }))} />
            <TextArea label="Freshness risks" value={risk.freshnessRisks || risk.outdatedEvidenceRisk || ''} disabled={readOnly} onChange={(v) => setRisk((p) => ({ ...p, freshnessRisks: v }))} />
            <TextArea label="Notes" value={risk.notes || ''} disabled={readOnly} onChange={(v) => setRisk((p) => ({ ...p, notes: v }))} />
          </Section>

          <Section title="Analysis (server-generated)">
            <p className="text-sm text-zinc-500">
              Findings are produced by the server overlap engine. The client does not generate authoritative results.
              {overlap.version ? ` Analysis version: ${overlap.version}.` : ' Run Analyse overlap to generate findings.'}
            </p>
            {overlap.inventoryCounts ? (
              <p className="text-xs text-zinc-500">
                Inventory: {Object.entries(overlap.inventoryCounts).map(([k, v]) => `${k}=${v}`).join(', ')}
              </p>
            ) : null}
            {overlap.summary ? (
              <p className="text-sm text-zinc-700">
                Exact conflicts: {Number(overlap.summary.exactConflictCount || 0)} · High overlap advisories:{' '}
                {Number(overlap.summary.highOverlapCount || 0)} · Phrase containment:{' '}
                {Number(overlap.summary.phraseContainmentCount || 0)}
              </p>
            ) : null}
            <ul className="space-y-2">
              {(overlap.findings || []).slice(0, 30).map((finding, index) => (
                <li key={index} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm">
                  <p className="font-semibold text-zinc-900">
                    {getOverlapFindingLabel(String(finding.matchType))}
                  </p>
                  <p className="text-zinc-600">{String(finding.explanation || '')}</p>
                  {finding.sourceTitle || finding.sourceRoute ? (
                    <p className="text-xs text-zinc-500">
                      {String(finding.sourceTitle || '')} {finding.sourceRoute ? `· ${String(finding.sourceRoute)}` : ''}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {Array.isArray(snapshot.clusterHints) && (snapshot.clusterHints as unknown[]).length > 0 ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Cluster hints</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600">
                  {(snapshot.clusterHints as Array<Record<string, unknown>>).map((hint, i) => (
                    <li key={i}>{String(hint.label || hint.explanation || '')}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {Array.isArray(snapshot.internalLinkHints) &&
            (snapshot.internalLinkHints as unknown[]).length > 0 ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Internal-link hints
                </p>
                <ul className="mt-1 list-disc pl-5 text-sm text-zinc-600">
                  {(snapshot.internalLinkHints as Array<Record<string, unknown>>)
                    .slice(0, 10)
                    .map((hint, i) => (
                      <li key={i}>{String(hint.label || hint.explanation || '')}</li>
                    ))}
                </ul>
              </div>
            ) : null}
          </Section>
        </div>
      )}

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h5 className="text-lg font-bold text-zinc-900">Confirm research</h5>
            <p className="mt-2 text-sm text-zinc-600">{RESEARCH_CONFIRMATION_COPY}</p>
            <TextArea
              label="Confirmation note (required)"
              value={confirmationNote}
              onChange={setConfirmationNote}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || !confirmationNote.trim()}
                onClick={() => void confirm()}
                className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Confirm research complete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h5 className="mb-3 text-sm font-bold text-zinc-900">{title}</h5>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      <input
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-zinc-50"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-zinc-50"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  options: string[];
  onChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50"
      >
        {options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || '—'}
          </option>
        ))}
      </select>
    </div>
  );
}
