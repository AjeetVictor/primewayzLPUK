import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { ChatConfirmDialog } from './ChatConfirmDialog';
import type { AppConfirmVariant } from '../ui/AppConfirmDialog';
import {
  AdminEmpty,
  AdminError,
  AdminField,
  AdminLoading,
  AdminPageIntro,
  AdminStatus,
  adminControlClass,
  adminPrimaryButtonClass,
  type AdminStatusTone,
} from './adminUx';

type EntitlementStatus = 'entitled' | 'suspended' | 'revoked';

type Change = {
  status: EntitlementStatus;
  reason: string;
  actorUserId: number | null;
  createdAt: string;
};

type TenantEntitlement = {
  tenantId: string;
  displayName: string;
  brand: string;
  market: string;
  registryActive: boolean;
  activationControlled: boolean;
  compileTimeChat: boolean;
  entitlement: null | {
    status: EntitlementStatus;
    reason: string;
    updatedAt: string;
    updatedByUserId: number | null;
  };
  effective: { allowed: boolean; basis: string };
  recentChanges: Change[];
};

type ListResponse = {
  success?: boolean;
  error?: string;
  canManage?: boolean;
  tenants?: TenantEntitlement[];
};

const STATUS_LABEL: Record<EntitlementStatus, string> = {
  entitled: 'Entitled',
  suspended: 'Suspended',
  revoked: 'Revoked',
};

const STATUS_TONE: Record<EntitlementStatus, AdminStatusTone> = {
  entitled: 'positive',
  suspended: 'warning',
  revoked: 'danger',
};

const CONFIRM_VARIANT: Record<EntitlementStatus, AppConfirmVariant> = {
  entitled: 'default',
  suspended: 'warning',
  revoked: 'danger',
};

const BASIS_LABEL: Record<string, string> = {
  allowed_existing: 'Existing chat behavior, no central record',
  allowed_entitled: 'Entitled, and the platform already allows chat',
  unknown_tenant: 'Unknown tenant',
  inactive_tenant: 'Tenant activation gate is closed',
  capability_disabled: 'Chat is off in the platform build',
  suspended: 'Centrally suspended',
  revoked: 'Centrally revoked',
  store_unavailable: 'Entitlement store unavailable',
};

function stamp(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not recorded';
  return format(parsed, 'MMM d, yyyy h:mm a');
}

function tenantText(tenant: TenantEntitlement): string {
  return `${tenant.displayName} ${tenant.brand} ${tenant.market} ${tenant.tenantId}`.toLowerCase();
}

export function AdminTenantChatEntitlements({
  canManage,
  request,
}: {
  canManage: boolean;
  request: (path: string, init?: RequestInit) => Promise<Response>;
}) {
  const titleId = useId();
  const statusFieldId = useId();
  const reasonFieldId = useId();
  const statusRef = useRef<HTMLSelectElement>(null);
  const reasonRef = useRef<HTMLInputElement>(null);
  const [tenants, setTenants] = useState<TenantEntitlement[]>([]);
  const [manage, setManage] = useState(canManage);
  const [selectedId, setSelectedId] = useState('');
  const [status, setStatus] = useState<EntitlementStatus | ''>('');
  const [reason, setReason] = useState('');
  const [query, setQuery] = useState('');
  const [recordFilter, setRecordFilter] = useState<'all' | 'none' | EntitlementStatus>('all');
  const [error, setError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    const response = await request('/api/admin/tenant-chat-entitlements');
    const body = await response.json() as ListResponse;
    if (!response.ok || !body.success) {
      setError(body.error || 'Tenant chat entitlements could not be loaded.');
      return;
    }
    setError('');
    setManage(Boolean(body.canManage));
    setTenants(body.tenants ?? []);
    setSelectedId((current) => current || body.tenants?.[0]?.tenantId || '');
  };

  useEffect(() => {
    load()
      .catch(() => setError('Tenant chat entitlements could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  const selected = tenants.find((tenant) => tenant.tenantId === selectedId) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const visible = tenants.filter((tenant) => {
    if (normalizedQuery && !tenantText(tenant).includes(normalizedQuery)) return false;
    if (recordFilter === 'all') return true;
    if (recordFilter === 'none') return !tenant.entitlement;
    return tenant.entitlement?.status === recordFilter;
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextStatusError = status ? '' : 'Choose a status.';
    const nextReasonError = reason.trim() ? '' : 'Write a reason. It is stored in the audit.';
    setStatusError(nextStatusError);
    setReasonError(nextReasonError);
    if (nextStatusError) {
      statusRef.current?.focus();
      return;
    }
    if (nextReasonError) {
      reasonRef.current?.focus();
      return;
    }
    setError('');
    setConfirming(true);
  };

  const save = async () => {
    if (!selected || !status || pending) return;
    setPending(true);
    setError('');
    try {
      const response = await request(`/api/admin/tenant-chat-entitlements/${selected.tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reason.trim() }),
      });
      const body = await response.json() as ListResponse;
      if (!response.ok || !body.success) {
        setError(body.error || 'The entitlement change failed.');
        setConfirming(false);
        return;
      }
      setReason('');
      setStatus('');
      setConfirming(false);
      await load();
    } catch {
      setError('The entitlement change failed.');
      setConfirming(false);
    } finally {
      setPending(false);
    }
  };

  const confirmBody = selected && status
    ? `${selected.displayName} will be recorded as ${STATUS_LABEL[status]}. Reason: ${reason.trim()}. Installation authorization and connector health stay unchanged.${
      status === 'entitled'
        ? ' Entitled does not open a tenant the platform build or activation gate already keeps closed.'
        : ' This closes chat for the tenant.'
    }`
    : 'Confirm this entitlement change.';

  return (
    <section className="space-y-6" aria-labelledby={titleId} aria-busy={loading}>
      <AdminPageIntro id={titleId} title="Tenant chat entitlement">
        <p>
          Host/Owner sets whether a tenant may use chat. This is separate from installation authorization and connector health.
          No central record keeps the tenant on its current chat behavior. Suspended or revoked closes chat.
          Entitled does not open a tenant the platform build or activation gate already keeps closed.
        </p>
      </AdminPageIntro>

      {error ? <AdminError message={error} onRetry={loading ? undefined : () => { void load().catch(() => setError('Tenant chat entitlements could not be loaded.')); }} /> : null}

      {loading ? <AdminLoading label="Loading tenant chat entitlements." /> : null}

      {!loading && !error && tenants.length === 0 ? (
        <AdminEmpty
          title="No tenants are visible"
          description="No tenant records are assigned to this account."
        />
      ) : null}

      {!loading && tenants.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField id={`${titleId}-search`} label="Search tenants" hint="Matches the tenant name, brand, market, or id already loaded for this account.">
            {({ id, describedBy }) => (
              <input
                id={id}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-describedby={describedBy}
                className={adminControlClass}
              />
            )}
          </AdminField>
          <AdminField id={`${titleId}-record`} label="Central record" hint="Filters the list. It does not change a tenant.">
            {({ id, describedBy }) => (
              <select
                id={id}
                value={recordFilter}
                onChange={(event) => setRecordFilter(event.target.value as typeof recordFilter)}
                aria-describedby={describedBy}
                className={adminControlClass}
              >
                <option value="all">All records</option>
                <option value="none">No central record</option>
                <option value="entitled">Entitled</option>
                <option value="suspended">Suspended</option>
                <option value="revoked">Revoked</option>
              </select>
            )}
          </AdminField>
        </div>
      ) : null}

      {!loading && tenants.length > 0 ? (
        <p aria-live="polite" className="text-sm text-zinc-700">
          {visible.length === tenants.length
            ? `${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'}`
            : `${visible.length} of ${tenants.length} tenants`}
        </p>
      ) : null}

      {!loading && tenants.length > 0 && visible.length === 0 ? (
        <AdminEmpty
          title="No tenants match"
          description="Nothing matches the current search. Clear the search and record filter to see every tenant assigned to this account."
        />
      ) : null}

      {!loading && visible.length > 0 ? (
        <>
          <ul className="space-y-3 xl:hidden">
            {visible.map((tenant) => (
              <li key={tenant.tenantId}>
                <TenantChoice
                  tenant={tenant}
                  selected={tenant.tenantId === selectedId}
                  onSelect={() => setSelectedId(tenant.tenantId)}
                />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-2xl border border-zinc-500 bg-white xl:block">
            <table className="w-full text-left">
              <caption className="sr-only">Tenant chat entitlement records</caption>
              <thead>
                <tr className="border-b border-zinc-200">
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Tenant</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Activation</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Central record</th>
                  <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Effective chat</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((tenant) => {
                  const current = tenant.tenantId === selectedId;
                  return (
                    <tr key={tenant.tenantId} className={current ? 'border-t border-zinc-200 bg-emerald-50' : 'border-t border-zinc-200'}>
                      <td className="px-4 py-3">
                        <TenantChoice
                          tenant={tenant}
                          selected={current}
                          compact
                          onSelect={() => setSelectedId(tenant.tenantId)}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-800">{activationLabel(tenant)}</td>
                      <td className="px-4 py-3"><RecordStatus entitlement={tenant.entitlement} /></td>
                      <td className="px-4 py-3"><EffectiveStatus tenant={tenant} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {selected && !loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border-l-4 border-zinc-900 bg-zinc-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">{selected.displayName}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-700">
              Compile-time chat is {selected.compileTimeChat ? 'present' : 'absent'} in this platform build.
              Latest reason: {selected.entitlement?.reason ?? 'none recorded'}.
              {selected.entitlement ? ` Updated ${stamp(selected.entitlement.updatedAt)}.` : ''}
            </p>
            {selected.recentChanges.length > 0 ? (
              <div className="mt-3">
                <h4 className="text-sm font-semibold text-zinc-900">Recent changes</h4>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-zinc-700">
                  {selected.recentChanges.map((change) => (
                    <li key={`${change.createdAt}-${change.status}-${change.reason}`}>
                      {STATUS_LABEL[change.status]}. {stamp(change.createdAt)}. Actor {change.actorUserId ?? 'unknown'}. {change.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {manage ? (
            <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-500 bg-white p-4 sm:p-6" noValidate>
              <AdminField
                id={statusFieldId}
                label="New status"
                hint="Required. Entitled does not bypass a closed activation gate."
                error={statusError}
              >
                {({ id, describedBy, invalid }) => (
                  <select
                    ref={statusRef}
                    id={id}
                    value={status}
                    onChange={(event) => {
                      setStatus(event.target.value as EntitlementStatus | '');
                      setStatusError('');
                    }}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    className={adminControlClass}
                  >
                    <option value="">Select a status</option>
                    <option value="entitled">Entitled</option>
                    <option value="suspended">Suspended</option>
                    <option value="revoked">Revoked</option>
                  </select>
                )}
              </AdminField>
              <AdminField
                id={reasonFieldId}
                label="Reason"
                hint="Required. Stored with the entitlement audit, up to 512 characters."
                error={reasonError}
              >
                {({ id, describedBy, invalid }) => (
                  <input
                    ref={reasonRef}
                    id={id}
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      setReasonError('');
                    }}
                    maxLength={512}
                    aria-describedby={describedBy}
                    aria-invalid={invalid || undefined}
                    aria-required="true"
                    className={adminControlClass}
                  />
                )}
              </AdminField>
              <button type="submit" disabled={pending} className={adminPrimaryButtonClass}>
                Save entitlement
              </button>
            </form>
          ) : (
            <p className="text-sm leading-6 text-zinc-700">Entitlement changes are limited to the platform Host/Owner.</p>
          )}
        </div>
      ) : null}

      <ChatConfirmDialog
        open={confirming}
        title="Change tenant chat entitlement"
        body={confirmBody}
        confirmLabel="Save entitlement"
        variant={status ? CONFIRM_VARIANT[status] : 'default'}
        isConfirming={pending}
        onCancel={() => { if (!pending) setConfirming(false); }}
        onConfirm={() => { void save(); }}
      />
    </section>
  );
}

function activationLabel(tenant: TenantEntitlement): string {
  return `${tenant.registryActive ? 'Registered active' : 'Registered inactive'}${tenant.activationControlled ? '. Environment gate' : ''}`;
}

function RecordStatus({ entitlement }: { entitlement: TenantEntitlement['entitlement'] }) {
  if (!entitlement) return <AdminStatus label="No central record" tone="neutral" />;
  return <AdminStatus label={STATUS_LABEL[entitlement.status]} tone={STATUS_TONE[entitlement.status]} />;
}

function EffectiveStatus({ tenant }: { tenant: TenantEntitlement }) {
  return (
    <div>
      <AdminStatus label={tenant.effective.allowed ? 'Open' : 'Closed'} tone={tenant.effective.allowed ? 'positive' : 'danger'} />
      <p className="mt-1 text-xs leading-5 text-zinc-700">{BASIS_LABEL[tenant.effective.basis] ?? tenant.effective.basis}</p>
    </div>
  );
}

function TenantChoice({
  tenant,
  selected,
  compact = false,
  onSelect,
}: {
  tenant: TenantEntitlement;
  selected: boolean;
  compact?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={`w-full rounded-2xl border px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 ${
        compact ? 'border-transparent bg-transparent px-0 py-0' : selected ? 'border-zinc-900 bg-emerald-50' : 'border-zinc-500 bg-white'
      }`}
    >
      <span className="block text-sm font-semibold text-zinc-900">
        {tenant.displayName}
        {selected ? <span className="ml-2 text-xs font-semibold text-emerald-900">Selected</span> : null}
      </span>
      <span className="mt-1 block text-xs leading-5 text-zinc-700">{tenant.brand}. {tenant.market}. {tenant.tenantId}</span>
      {compact ? null : (
        <span className="mt-3 grid gap-2 text-sm text-zinc-800">
          <span>{activationLabel(tenant)}</span>
          <RecordStatus entitlement={tenant.entitlement} />
          <EffectiveStatus tenant={tenant} />
        </span>
      )}
    </button>
  );
}
