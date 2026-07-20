import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowLeft, Plus, RefreshCcw, Upload } from 'lucide-react';
import {
  AUTOPILOT_KEYWORD_CANDIDATE_STATUSES,
  AUTOPILOT_KEYWORD_IMPORT_SOURCE_TYPES,
} from '../../../data/autopilot/keywordImportStatus';
import {
  AutopilotClientError,
  adminAutopilotApi,
} from '../../../lib/autopilot/adminAutopilotService';
import {
  DEFAULT_CANDIDATE_FILTERS,
  KEYWORD_IMPORT_CONVERSION_COPY,
  buildConversionPayload,
  formatNotSupplied,
  manualKeywordRow,
  parseCsvFileText,
  parseJsonCandidates,
  serialiseCandidateFilters,
  suggestWorkingTitleFromKeyword,
  validateImportFileSize,
  type CandidateListFilters,
} from '../../../lib/autopilot/adminKeywordImportHelpers';
import type { AutopilotColumnMapping } from '../../../lib/autopilot/keywordImportMapping';
import { detectColumnMapping } from '../../../lib/autopilot/keywordImportMapping';
import { calculatePaginationRange } from '../../../lib/autopilot/adminAutopilotPipelineHelpers';
import { formatAutopilotDate } from '../../../lib/autopilot/adminAutopilotActivityHelpers';
import { useToast } from '../../ui/AppToast';
import { AutopilotEmptyState } from './AutopilotEmptyState';
import { AutopilotErrorState } from './AutopilotErrorState';

type KeywordImportsPanelProps = {
  refreshKey: number;
  canContribute: boolean;
  onOpenTopic: (id: number) => void;
  onMutated: () => void;
};

type WizardStep = 'choose' | 'map' | 'preview' | 'results';

type ImportDraft = {
  sourceType: string;
  sourceName: string;
  originalFileName: string;
  headers: string[];
  rows: Array<Record<string, unknown>>;
  mapping: AutopilotColumnMapping;
  duplicateHandling: 'import_and_mark' | 'skip_exact_duplicates';
};

const EMPTY_DRAFT: ImportDraft = {
  sourceType: 'csv',
  sourceName: '',
  originalFileName: '',
  headers: [],
  rows: [],
  mapping: {},
  duplicateHandling: 'import_and_mark',
};

function metricCell(value: unknown) {
  return formatNotSupplied(value);
}

export function KeywordImportsPanel({
  refreshKey,
  canContribute,
  onOpenTopic,
  onMutated,
}: KeywordImportsPanelProps) {
  const { showToast } = useToast();
  const convertTitleId = useId();

  const [batches, setBatches] = useState<Array<Record<string, unknown>>>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const [candidates, setCandidates] = useState<Array<Record<string, unknown>>>([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidateFilters, setCandidateFilters] =
    useState<CandidateListFilters>(DEFAULT_CANDIDATE_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AutopilotClientError | Error | null>(null);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>('choose');
  const [draft, setDraft] = useState<ImportDraft>(EMPTY_DRAFT);
  const [pasteText, setPasteText] = useState('');
  const [manualKeyword, setManualKeyword] = useState('');
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importResult, setImportResult] = useState<Record<string, unknown> | null>(null);

  const [selectedCandidate, setSelectedCandidate] = useState<Record<string, unknown> | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({
    workingTitle: '',
    userProblem: '',
    audience: '',
    market: 'United Kingdom',
    language: 'en-GB',
  });
  const [convertError, setConvertError] = useState<string | null>(null);

  const candidateQuery = useMemo(
    () => serialiseCandidateFilters(candidateFilters),
    [candidateFilters],
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchData, candidateData] = await Promise.all([
        adminAutopilotApi.listKeywordImports({ limit: 20, offset: 0 }),
        adminAutopilotApi.listKeywordCandidates(candidateQuery),
      ]);
      setBatches(batchData.items);
      setBatchTotal(batchData.total);
      setCandidates(candidateData.items);
      setCandidateTotal(candidateData.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load keyword imports'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [refreshKey, candidateQuery.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  const openWizard = () => {
    setDraft(EMPTY_DRAFT);
    setPasteText('');
    setManualKeyword('');
    setPreview(null);
    setPreviewError(null);
    setImportResult(null);
    setWizardStep('choose');
    setWizardOpen(true);
  };

  const applyParsedRows = (
    sourceType: string,
    headers: string[],
    rows: Array<Record<string, unknown>>,
    mapping: AutopilotColumnMapping,
    fileName = '',
  ) => {
    setDraft({
      sourceType,
      sourceName: fileName || sourceType,
      originalFileName: fileName,
      headers,
      rows,
      mapping,
      duplicateHandling: 'import_and_mark',
    });
    setWizardStep('map');
  };

  const handleCsvFile = async (file: File) => {
    const sizeError = validateImportFileSize(file.size);
    if (sizeError) {
      setPreviewError(sizeError);
      return;
    }
    const text = await file.text();
    const parsed = parseCsvFileText(text);
    if (parsed.errors.length && parsed.rows.length === 0) {
      setPreviewError(parsed.errors[0]?.message || 'CSV parse failed.');
      return;
    }
    applyParsedRows(
      file.name.toLowerCase().includes('gsc') || file.name.toLowerCase().includes('search')
        ? 'gsc_export'
        : 'csv',
      parsed.headers,
      parsed.rows,
      parsed.mapping,
      file.name,
    );
  };

  const handlePasteCsv = () => {
    const parsed = parseCsvFileText(pasteText);
    if (parsed.errors.length && parsed.rows.length === 0) {
      setPreviewError(parsed.errors[0]?.message || 'CSV parse failed.');
      return;
    }
    applyParsedRows('csv', parsed.headers, parsed.rows, parsed.mapping);
  };

  const handlePasteJson = () => {
    try {
      const rows = parseJsonCandidates(pasteText);
      const headers = rows[0] ? Object.keys(rows[0]) : ['keyword'];
      const { mapping } = detectColumnMapping(headers);
      applyParsedRows('json', headers, rows, mapping);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleManual = () => {
    if (!manualKeyword.trim()) {
      setPreviewError('Enter a keyword.');
      return;
    }
    applyParsedRows('manual', ['keyword'], [manualKeywordRow(manualKeyword)], { keyword: 'keyword' });
  };

  const runPreview = async () => {
    setBusy(true);
    setPreviewError(null);
    try {
      const result = await adminAutopilotApi.previewKeywordImport({
        sourceType: draft.sourceType,
        sourceName: draft.sourceName || null,
        originalFileName: draft.originalFileName || null,
        headers: draft.headers,
        columnMapping: draft.mapping,
        rows: draft.rows,
        duplicateHandling: draft.duplicateHandling,
      });
      setPreview(result);
      setWizardStep('preview');
    } catch (err) {
      setPreviewError(err instanceof AutopilotClientError ? err.message : 'Preview failed.');
    } finally {
      setBusy(false);
    }
  };

  const runCommit = async () => {
    setBusy(true);
    setPreviewError(null);
    try {
      const result = await adminAutopilotApi.commitKeywordImport({
        sourceType: draft.sourceType,
        sourceName: draft.sourceName || null,
        originalFileName: draft.originalFileName || null,
        headers: draft.headers,
        columnMapping: draft.mapping,
        rows: draft.rows,
        duplicateHandling: draft.duplicateHandling,
      });
      setImportResult(result);
      setWizardStep('results');
      showToast({ type: 'success', message: 'Keyword import completed.' });
      onMutated();
      void load();
    } catch (err) {
      setPreviewError(err instanceof AutopilotClientError ? err.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  const openConvert = (candidate: Record<string, unknown>) => {
    const keyword = String(candidate.keyword || '');
    setSelectedCandidate(candidate);
    setConvertForm({
      workingTitle: suggestWorkingTitleFromKeyword(keyword),
      userProblem: '',
      audience: '',
      market: String(candidate.country || 'United Kingdom'),
      language: String(candidate.language || 'en-GB'),
    });
    setConvertError(null);
    setConvertOpen(true);
  };

  const submitConvert = async () => {
    if (!selectedCandidate) return;
    setBusy(true);
    setConvertError(null);
    try {
      const payload = buildConversionPayload(convertForm);
      const result = await adminAutopilotApi.convertKeywordCandidate(
        Number(selectedCandidate.id),
        payload,
      );
      showToast({ type: 'success', message: 'Topic created from keyword candidate.' });
      setConvertOpen(false);
      onMutated();
      onOpenTopic(result.topic.id);
    } catch (err) {
      setConvertError(err instanceof AutopilotClientError ? err.message : 'Conversion failed.');
    } finally {
      setBusy(false);
    }
  };

  const reviewCandidate = async (id: number, status: string, reason: string) => {
    try {
      await adminAutopilotApi.patchKeywordCandidate(id, { status, reason });
      showToast({ type: 'success', message: `Candidate marked ${status}.` });
      void load();
    } catch (err) {
      showToast({
        type: 'error',
        message: err instanceof AutopilotClientError ? err.message : 'Review failed.',
      });
    }
  };

  const candidateRange = calculatePaginationRange(
    candidateTotal,
    candidateFilters.limit,
    candidateFilters.offset,
  );

  if (loading && batches.length === 0 && !error) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center text-sm text-zinc-500 shadow-sm">
        Loading keyword imports…
      </div>
    );
  }

  if (error && batches.length === 0) {
    return <AutopilotErrorState error={error} onRetry={() => void load()} />;
  }

  const previewRows = Array.isArray(preview?.rows) ? (preview.rows as Array<Record<string, unknown>>) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Keyword imports</h3>
          <p className="text-sm text-zinc-500">
            Import and triage keyword candidates. This does not generate research or publish articles.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            aria-label="Refresh keyword imports"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          {canContribute ? (
            <button
              type="button"
              onClick={openWizard}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              New import
            </button>
          ) : null}
        </div>
      </div>

      {!wizardOpen ? (
        <>
          <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-zinc-100 px-6 py-4">
              <h4 className="text-sm font-bold text-zinc-900">Recent import batches ({batchTotal})</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Source</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Rows</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Converted</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-sm italic text-zinc-400">
                        No imports yet
                      </td>
                    </tr>
                  ) : (
                    batches.map((batch) => (
                      <tr key={String(batch.id)}>
                        <td className="px-6 py-4 text-sm">
                          <p className="font-semibold text-zinc-900">
                            {String(batch.sourceName || batch.originalFileName || batch.sourceType)}
                          </p>
                          <p className="text-xs text-zinc-500">{String(batch.sourceType)}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-700">{String(batch.status)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {String(batch.totalRows)} total · {String(batch.validRows)} valid ·{' '}
                          {String(batch.invalidRows)} invalid · {String(batch.duplicateRows)} duplicate
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{String(batch.createdTopicCount ?? 0)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {formatAutopilotDate(batch.createdAt as string)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-kw-search">
                  Search keywords
                </label>
                <input
                  id="ap-kw-search"
                  value={candidateFilters.q}
                  onChange={(e) =>
                    setCandidateFilters((prev) => ({ ...prev, q: e.target.value, offset: 0 }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-kw-status">
                  Status
                </label>
                <select
                  id="ap-kw-status"
                  value={candidateFilters.status}
                  onChange={(e) =>
                    setCandidateFilters((prev) => ({ ...prev, status: e.target.value, offset: 0 }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="">All</option>
                  {AUTOPILOT_KEYWORD_CANDIDATE_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={candidateFilters.duplicatesOnly}
                    onChange={(e) =>
                      setCandidateFilters((prev) => ({
                        ...prev,
                        duplicatesOnly: e.target.checked,
                        offset: 0,
                      }))
                    }
                  />
                  Duplicates only
                </label>
              </div>
              <div className="flex items-end gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={candidateFilters.unconvertedOnly}
                    onChange={(e) =>
                      setCandidateFilters((prev) => ({
                        ...prev,
                        unconvertedOnly: e.target.checked,
                        offset: 0,
                      }))
                    }
                  />
                  Unconverted only
                </label>
              </div>
            </div>
          </div>

          {candidates.length === 0 ? (
            <AutopilotEmptyState
              title="No keyword candidates yet"
              description="Import GSC exports, CSV, JSON, or a single keyword to begin triage."
              actionLabel={canContribute ? 'New import' : undefined}
              onAction={canContribute ? openWizard : undefined}
            />
          ) : (
            <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Keyword</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Source</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Clicks</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Impressions</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">CTR</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Position</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Volume</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">KD</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                      <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {candidates.map((candidate) => (
                      <tr key={String(candidate.id)} className="hover:bg-zinc-50/50">
                        <td className="px-6 py-4 text-sm font-semibold text-zinc-900">
                          {String(candidate.keyword)}
                          {candidate.duplicateReason ? (
                            <p className="mt-1 text-xs text-amber-700">{String(candidate.duplicateReason)}</p>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{String(candidate.sourceType)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{metricCell(candidate.clicks)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{metricCell(candidate.impressions)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{metricCell(candidate.ctr)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{metricCell(candidate.averagePosition)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{metricCell(candidate.searchVolume)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{metricCell(candidate.keywordDifficulty)}</td>
                        <td className="px-6 py-4 text-sm text-zinc-700">{String(candidate.status)}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {canContribute && candidate.status !== 'converted' ? (
                            <>
                              <button
                                type="button"
                                className="text-xs font-bold text-zinc-600 hover:text-zinc-900"
                                onClick={() =>
                                  void reviewCandidate(Number(candidate.id), 'accepted', 'Accepted after review')
                                }
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                onClick={() => openConvert(candidate)}
                              >
                                Convert
                              </button>
                            </>
                          ) : candidate.convertedTopicId ? (
                            <button
                              type="button"
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                              onClick={() => onOpenTopic(Number(candidate.convertedTopicId))}
                            >
                              Open topic
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-6 py-4">
                <p className="text-sm text-zinc-500">
                  {candidateRange.total === 0
                    ? 'No results'
                    : `Showing ${candidateRange.from}–${candidateRange.to} of ${candidateRange.total}`}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={!candidateRange.hasPrev}
                    onClick={() =>
                      setCandidateFilters((prev) => ({
                        ...prev,
                        offset: Math.max(0, prev.offset - prev.limit),
                      }))
                    }
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!candidateRange.hasNext}
                    onClick={() =>
                      setCandidateFilters((prev) => ({
                        ...prev,
                        offset: prev.offset + prev.limit,
                      }))
                    }
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (wizardStep === 'choose') setWizardOpen(false);
                else if (wizardStep === 'map') setWizardStep('choose');
                else if (wizardStep === 'preview') setWizardStep('map');
                else setWizardOpen(false);
              }}
              className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Step: {wizardStep}
            </p>
          </div>

          {wizardStep === 'choose' ? (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-zinc-900">Choose input</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="rounded-2xl border border-dashed border-zinc-300 p-4 cursor-pointer hover:bg-zinc-50">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800">
                    <Upload className="h-4 w-4" />
                    Select CSV file
                  </div>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="mt-3 block w-full text-sm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleCsvFile(file);
                    }}
                  />
                </label>
                <div className="rounded-2xl border border-zinc-200 p-4 space-y-2">
                  <p className="text-sm font-semibold text-zinc-800">Paste CSV or JSON</p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    rows={6}
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Paste CSV or JSON rows…"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handlePasteCsv} className="rounded-xl bg-zinc-900 px-3 py-2 text-xs font-semibold text-white">
                      Use as CSV
                    </button>
                    <button type="button" onClick={handlePasteJson} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700">
                      Use as JSON
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-200 p-4">
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-manual-kw">
                  Add one keyword manually
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="ap-manual-kw"
                    value={manualKeyword}
                    onChange={(e) => setManualKeyword(e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button type="button" onClick={handleManual} className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">
                    Continue
                  </button>
                </div>
              </div>
              {previewError ? <p className="text-sm text-red-600" role="alert">{previewError}</p> : null}
            </div>
          ) : null}

          {wizardStep === 'map' ? (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-zinc-900">Map columns</h4>
              <p className="text-sm text-zinc-500">
                Source: {draft.sourceType}
                {draft.originalFileName ? ` · ${draft.originalFileName}` : ''} · {draft.rows.length} rows
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(
                  [
                    ['keyword', 'Keyword / query (required)'],
                    ['clicks', 'Clicks'],
                    ['impressions', 'Impressions'],
                    ['ctr', 'CTR'],
                    ['averagePosition', 'Average position'],
                    ['searchVolume', 'Search volume (explicit only)'],
                    ['keywordDifficulty', 'Keyword difficulty (explicit only)'],
                    ['currentUrl', 'Current URL / page'],
                    ['country', 'Country'],
                    ['language', 'Language'],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor={`ap-map-${field}`}>
                      {label}
                    </label>
                    <select
                      id={`ap-map-${field}`}
                      value={draft.mapping[field] || ''}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          mapping: { ...prev.mapping, [field]: e.target.value || undefined },
                        }))
                      }
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="">Not mapped</option>
                      {draft.headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-dup-handling">
                  Duplicate handling
                </label>
                <select
                  id="ap-dup-handling"
                  value={draft.duplicateHandling}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      duplicateHandling: e.target.value as ImportDraft['duplicateHandling'],
                    }))
                  }
                  className="w-full max-w-md rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="import_and_mark">Import and mark duplicates</option>
                  <option value="skip_exact_duplicates">Skip exact duplicates</option>
                </select>
              </div>
              {previewError ? <p className="text-sm text-red-600" role="alert">{previewError}</p> : null}
              <button
                type="button"
                disabled={busy || !draft.mapping.keyword}
                onClick={() => void runPreview()}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Previewing…' : 'Preview validation'}
              </button>
            </div>
          ) : null}

          {wizardStep === 'preview' && preview ? (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-zinc-900">Preview validation</h4>
              <p className="text-sm text-zinc-600">
                {String(preview.validRows)} valid · {String(preview.invalidRows)} invalid ·{' '}
                {String(preview.duplicateRows)} duplicate · {String(preview.totalRows)} total
              </p>
              <div className="overflow-x-auto rounded-2xl border border-zinc-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Row</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Keyword</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Normalised</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">CTR store</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                      <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {previewRows.slice(0, 100).map((row) => (
                      <tr key={`${row.sourceRowNumber}-${row.normalisedKeyword}`}>
                        <td className="px-4 py-2 text-sm text-zinc-500">{String(row.sourceRowNumber ?? '—')}</td>
                        <td className="px-4 py-2 text-sm font-medium text-zinc-900">{String(row.originalKeyword || '—')}</td>
                        <td className="px-4 py-2 text-sm text-zinc-600">{String(row.normalisedKeyword || '—')}</td>
                        <td className="px-4 py-2 text-sm text-zinc-600">{String(row.ctrDisplay || 'Not supplied')}</td>
                        <td className="px-4 py-2 text-sm text-zinc-700">{String(row.status)}</td>
                        <td className="px-4 py-2 text-xs text-zinc-500">
                          {Array.isArray(row.errors) && row.errors.length
                            ? (row.errors as string[]).join('; ')
                            : row.duplicateReason
                              ? String(row.duplicateReason)
                              : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewError ? <p className="text-sm text-red-600" role="alert">{previewError}</p> : null}
              <button
                type="button"
                disabled={busy || !preview.hasKeywordColumn}
                onClick={() => void runCommit()}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Importing…' : 'Confirm import'}
              </button>
            </div>
          ) : null}

          {wizardStep === 'results' && importResult ? (
            <div className="space-y-3">
              <h4 className="text-lg font-bold text-zinc-900">Import results</h4>
              <p className="text-sm text-zinc-600">
                Batch #{String((importResult.batch as Record<string, unknown> | undefined)?.id ?? '—')} ·{' '}
                {JSON.stringify(importResult.previewSummary)}
              </p>
              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Back to keyword imports
              </button>
            </div>
          ) : null}
        </div>
      )}

      {convertOpen && selectedCandidate ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={convertTitleId}
            className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl"
          >
            <h2 id={convertTitleId} className="text-lg font-bold text-zinc-900">
              Convert to topic
            </h2>
            <p className="mt-2 text-sm text-zinc-600">{KEYWORD_IMPORT_CONVERSION_COPY}</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-convert-title">
                  Working title
                </label>
                <input
                  id="ap-convert-title"
                  value={convertForm.workingTitle}
                  onChange={(e) => setConvertForm((prev) => ({ ...prev, workingTitle: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <p className="text-xs text-zinc-500">
                Primary keyword will be: <strong>{String(selectedCandidate.keyword)}</strong>
              </p>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-convert-problem">
                  User problem
                </label>
                <textarea
                  id="ap-convert-problem"
                  rows={3}
                  value={convertForm.userProblem}
                  onChange={(e) => setConvertForm((prev) => ({ ...prev, userProblem: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-zinc-400" htmlFor="ap-convert-audience">
                  Audience
                </label>
                <input
                  id="ap-convert-audience"
                  value={convertForm.audience}
                  onChange={(e) => setConvertForm((prev) => ({ ...prev, audience: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
            {convertError ? <p className="mt-3 text-sm text-red-600" role="alert">{convertError}</p> : null}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConvertOpen(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitConvert()}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy ? 'Converting…' : 'Create topic'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Keep source types referenced for lint/accessibility documentation */}
      <span className="sr-only">{AUTOPILOT_KEYWORD_IMPORT_SOURCE_TYPES.join(', ')}</span>
    </div>
  );
}
