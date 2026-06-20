import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  ArrowUpRight,
  Check,
  ClipboardCopy,
  ExternalLink,
  RefreshCcw,
  StickyNote,
  X,
} from 'lucide-react';
import { apiUrl } from '../../utils/apiUrl';
import {
  AUDIT_LEAD_ADMIN_STATUSES,
  type AuditLeadAdminStatus,
  type SafeAuditLeadDetail,
  type SafeAuditLeadListItem,
} from '../../lib/audit/leads/adminAuditLeadsService';

type AdminAuditLeadsPanelProps = {
  globalSearch?: string;
};

const STATUS_LABELS: Record<AuditLeadAdminStatus, string> = {
  new: 'New',
  reviewed: 'Reviewed',
  contacted: 'Contacted',
  follow_up: 'Follow up',
  converted: 'Converted',
  not_fit: 'Not fit',
};

function statusBadgeClass(status: AuditLeadAdminStatus): string {
  if (status === 'new') return 'bg-blue-50 text-blue-700';
  if (status === 'reviewed') return 'bg-zinc-100 text-zinc-700';
  if (status === 'contacted') return 'bg-emerald-50 text-emerald-700';
  if (status === 'follow_up') return 'bg-amber-50 text-amber-700';
  if (status === 'converted') return 'bg-emerald-100 text-emerald-800';
  return 'bg-rose-50 text-rose-700';
}

async function adminRequest(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    credentials: 'include',
    ...init,
  });
}

async function copyText(value: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function AdminAuditLeadsPanel({ globalSearch = '' }: AdminAuditLeadsPanelProps) {
  const [items, setItems] = useState<SafeAuditLeadListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scoreBandFilter, setScoreBandFilter] = useState<string>('all');
  const [reminderFilter, setReminderFilter] = useState<string>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [selectedLead, setSelectedLead] = useState<SafeAuditLeadDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (globalSearch.trim()) params.set('q', globalSearch.trim());
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (scoreBandFilter !== 'all') params.set('scoreBand', scoreBandFilter);
    if (reminderFilter !== 'all') params.set('reminderOptIn', reminderFilter);
    params.set('limit', '50');
    return params.toString();
  }, [globalSearch, statusFilter, scoreBandFilter, reminderFilter]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const res = await adminRequest(`/api/admin/audit-leads?${queryString}`);
      if (!res.ok) {
        setError('Unable to load audit leads.');
        return;
      }

      const data = await res.json() as { total: number; items: SafeAuditLeadListItem[] };
      setItems(data.items);
      setTotal(data.total);
    } catch {
      setError('Unable to load audit leads.');
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const fetchLeadDetail = useCallback(async (id: number) => {
    setDetailLoading(true);
    setActionMessage('');

    try {
      const res = await adminRequest(`/api/admin/audit-leads/${id}`);
      if (!res.ok) {
        setActionMessage('Unable to load lead details.');
        return;
      }

      const data = await res.json() as SafeAuditLeadDetail;
      setSelectedLead(data);
    } catch {
      setActionMessage('Unable to load lead details.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (selectedLeadId === null) {
      setSelectedLead(null);
      return;
    }
    fetchLeadDetail(selectedLeadId);
  }, [selectedLeadId, fetchLeadDetail]);

  const openLead = (id: number) => {
    setSelectedLeadId(id);
    setNoteDraft('');
  };

  const closeLead = () => {
    setSelectedLeadId(null);
    setSelectedLead(null);
    setNoteDraft('');
    setActionMessage('');
  };

  const refreshSelectedLead = async () => {
    if (selectedLeadId === null) return;
    await fetchLeadDetail(selectedLeadId);
    await fetchLeads();
  };

  const updateStatus = async (status: AuditLeadAdminStatus) => {
    if (selectedLeadId === null) return;
    setIsSaving(true);
    setActionMessage('');

    try {
      const res = await adminRequest(`/api/admin/audit-leads/${selectedLeadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        setActionMessage('Status update failed.');
        return;
      }

      const updated = await res.json() as SafeAuditLeadDetail;
      setSelectedLead(updated);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setActionMessage(`Status updated to ${STATUS_LABELS[status]}.`);
    } catch {
      setActionMessage('Status update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const addNote = async () => {
    if (selectedLeadId === null || !noteDraft.trim()) return;
    setIsSaving(true);
    setActionMessage('');

    try {
      const res = await adminRequest(`/api/admin/audit-leads/${selectedLeadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteDraft }),
      });

      if (!res.ok) {
        setActionMessage('Could not save note.');
        return;
      }

      const updated = await res.json() as SafeAuditLeadDetail;
      setSelectedLead(updated);
      setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setNoteDraft('');
      setActionMessage('Note saved.');
    } catch {
      setActionMessage('Could not save note.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async (value: string | null | undefined, label: string) => {
    if (!value) return;
    try {
      await copyText(value);
      setActionMessage(`${label} copied.`);
    } catch {
      setActionMessage(`Could not copy ${label.toLowerCase()}.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-zinc-200 bg-white px-6 py-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Audit Leads</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Web Presence Audit email-report submissions with safe admin actions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
          >
            <option value="all">All statuses</option>
            {AUDIT_LEAD_ADMIN_STATUSES.map((status) => (
              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
            ))}
          </select>
          <select
            value={scoreBandFilter}
            onChange={(event) => setScoreBandFilter(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
          >
            <option value="all">All scores</option>
            <option value="low">0-39</option>
            <option value="moderate">40-59</option>
            <option value="good">60-79</option>
            <option value="strong">80-100</option>
            <option value="unknown">Unknown</option>
          </select>
          <select
            value={reminderFilter}
            onChange={(event) => setReminderFilter(event.target.value)}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
          >
            <option value="all">All reminders</option>
            <option value="true">Reminder opted in</option>
            <option value="false">No reminder</option>
          </select>
          <button
            type="button"
            onClick={fetchLeads}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Business</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Website</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Contact</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Score</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Type</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Reminder</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-400 italic">
                    Loading audit leads...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-zinc-400 italic">
                    {globalSearch ? `No audit leads matching "${globalSearch}"` : 'No audit leads found.'}
                  </td>
                </tr>
              ) : (
                items.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50/50">
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {format(new Date(lead.createdAt), 'MMM d, h:mm a')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900">
                      {lead.businessName || lead.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 max-w-[180px] truncate">
                      {lead.websiteUrl}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      <div>{lead.name || '-'}</div>
                      <div className="text-xs text-zinc-500">{lead.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-zinc-900">
                      {lead.score ?? '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {lead.businessType || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600">
                      {lead.details.reminderOptIn ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(lead.details.admin.status)}`}>
                        {STATUS_LABELS[lead.details.admin.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openLead(lead.id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                      >
                        View
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-100 px-6 py-3 text-xs text-zinc-500">
          Showing {items.length} of {total} audit leads
        </div>
      </div>

      {selectedLeadId !== null ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <div>
                <h4 className="text-lg font-bold text-zinc-900">Audit lead details</h4>
                <p className="text-xs text-zinc-500">
                  Lead #{selectedLeadId}
                  {selectedLead ? ` · ${format(new Date(selectedLead.createdAt), 'MMM d, yyyy h:mm a')}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={closeLead}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Close audit lead details"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(90vh-72px)] overflow-y-auto px-6 py-5">
              {detailLoading || !selectedLead ? (
                <p className="py-8 text-center text-sm text-zinc-400 italic">Loading lead details...</p>
              ) : (
                <div className="space-y-6">
                  {actionMessage ? (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      {actionMessage}
                    </div>
                  ) : null}

                  <section>
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Contact</h5>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                      <div><span className="font-semibold text-zinc-900">Name:</span> {selectedLead.name || '-'}</div>
                      <div><span className="font-semibold text-zinc-900">Email:</span> {selectedLead.email || '-'}</div>
                      <div><span className="font-semibold text-zinc-900">Phone:</span> {selectedLead.phone || '-'}</div>
                      {selectedLead.message ? (
                        <div className="sm:col-span-2"><span className="font-semibold text-zinc-900">Message:</span> {selectedLead.message}</div>
                      ) : null}
                    </div>
                  </section>

                  <section>
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Website / report</h5>
                    <div className="mt-3 space-y-2 text-sm text-zinc-700">
                      <div><span className="font-semibold text-zinc-900">Website:</span> {selectedLead.websiteUrl}</div>
                      <div><span className="font-semibold text-zinc-900">Business:</span> {selectedLead.businessName || '-'}</div>
                      {selectedLead.details.shareUrl ? (
                        <a
                          href={selectedLead.details.shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
                        >
                          Open shared report
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      ) : null}
                    </div>
                  </section>

                  <section>
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Score and business type</h5>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                      <div><span className="font-semibold text-zinc-900">Score:</span> {selectedLead.score ?? '-'}</div>
                      <div><span className="font-semibold text-zinc-900">Label:</span> {selectedLead.details.scoreLabel || '-'}</div>
                      <div><span className="font-semibold text-zinc-900">Type:</span> {selectedLead.businessType || '-'}</div>
                    </div>
                  </section>

                  <section>
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Campaign source</h5>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                      <div><span className="font-semibold text-zinc-900">CTA location:</span> {selectedLead.details.cta_location || '-'}</div>
                      <div><span className="font-semibold text-zinc-900">UTM source:</span> {selectedLead.details.utm?.source || '-'}</div>
                      <div><span className="font-semibold text-zinc-900">UTM medium:</span> {selectedLead.details.utm?.medium || '-'}</div>
                      <div><span className="font-semibold text-zinc-900">UTM campaign:</span> {selectedLead.details.utm?.campaign || '-'}</div>
                      <div><span className="font-semibold text-zinc-900">UTM content:</span> {selectedLead.details.utm?.content || '-'}</div>
                    </div>
                  </section>

                  <section>
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Consent / reminder</h5>
                    <div className="mt-3 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
                      <div><span className="font-semibold text-zinc-900">Consent:</span> {selectedLead.details.consentAccepted ? 'Yes' : 'No'}</div>
                      <div><span className="font-semibold text-zinc-900">Consent at:</span> {selectedLead.details.consentAt ? format(new Date(selectedLead.details.consentAt), 'MMM d, yyyy h:mm a') : '-'}</div>
                      <div><span className="font-semibold text-zinc-900">Reminder opt-in:</span> {selectedLead.details.reminderOptIn ? 'Yes' : 'No'}</div>
                    </div>
                  </section>

                  <section>
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Internal notes</h5>
                    <div className="mt-3 space-y-3">
                      {selectedLead.details.admin.notes.length === 0 ? (
                        <p className="text-sm italic text-zinc-400">No notes yet.</p>
                      ) : (
                        selectedLead.details.admin.notes.map((note) => (
                          <div key={note.id} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                            <p className="text-sm text-zinc-700">{note.note}</p>
                            <p className="mt-1 text-[11px] text-zinc-400">
                              {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        ))
                      )}
                      <div className="rounded-2xl border border-zinc-200 p-4">
                        <label htmlFor="audit-lead-note" className="mb-2 block text-xs font-bold uppercase tracking-widest text-zinc-400">
                          Add note
                        </label>
                        <textarea
                          id="audit-lead-note"
                          value={noteDraft}
                          onChange={(event) => setNoteDraft(event.target.value)}
                          maxLength={500}
                          rows={3}
                          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-emerald-500/20"
                          placeholder="Short internal note"
                        />
                        <button
                          type="button"
                          onClick={addNote}
                          disabled={isSaving || !noteDraft.trim()}
                          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          <StickyNote className="h-4 w-4" />
                          Save note
                        </button>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h5 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Actions</h5>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedLead.details.shareUrl ? (
                        <>
                          <a
                            href={selectedLead.details.shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open report
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(selectedLead.details.shareUrl, 'Report link')}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                          >
                            <ClipboardCopy className="h-4 w-4" />
                            Copy report link
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedLead.email, 'Email')}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <ClipboardCopy className="h-4 w-4" />
                        Copy email
                      </button>
                      {selectedLead.phone ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(selectedLead.phone, 'Phone')}
                          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                        >
                          <ClipboardCopy className="h-4 w-4" />
                          Copy phone
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => updateStatus('reviewed')}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Mark reviewed
                      </button>
                      <select
                        value={selectedLead.details.admin.status}
                        onChange={(event) => updateStatus(event.target.value as AuditLeadAdminStatus)}
                        disabled={isSaving}
                        className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700"
                      >
                        {AUDIT_LEAD_ADMIN_STATUSES.map((status) => (
                          <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={refreshSelectedLead}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Refresh
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
