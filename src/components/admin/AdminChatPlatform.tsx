import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { format } from 'date-fns';
import { ChatConfirmDialog } from './ChatConfirmDialog';
import {
  AdminEmpty,
  AdminError,
  AdminField,
  AdminLoading,
  AdminPageIntro,
  AdminStatus,
  adminControlClass,
  adminDangerButtonClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  type AdminStatusTone,
} from './adminUx';

export const CHAT_PLATFORM_SECTIONS = [
  { id: 'chat-platform', label: 'Overview', ownerOnly: false },
  { id: 'leads', label: 'Inbox & Leads', ownerOnly: false },
  { id: 'chats', label: 'History', ownerOnly: false },
  { id: 'platform-team', label: 'Team & Presence', ownerOnly: false },
  { id: 'platform-tenants', label: 'Tenants', ownerOnly: false },
  { id: 'platform-sites', label: 'Sites & Domains', ownerOnly: false },
  { id: 'chat-connect', label: 'Integrations', ownerOnly: false },
  { id: 'platform-users', label: 'Users & Permissions', ownerOnly: false },
  { id: 'platform-audit', label: 'Audit & Activity', ownerOnly: false },
  { id: 'platform-settings', label: 'Settings', ownerOnly: false },
] as const;

export type ChatPlatformSectionId = (typeof CHAT_PLATFORM_SECTIONS)[number]['id'];

const SECTION_IDS = new Set<string>(CHAT_PLATFORM_SECTIONS.map((section) => section.id));

export function isChatPlatformSection(tab: string): tab is ChatPlatformSectionId {
  return SECTION_IDS.has(tab);
}

const GOVERNANCE_SECTIONS = new Set([
  'chat-platform',
  'platform-team',
  'platform-tenants',
  'platform-sites',
  'chat-connect',
  'platform-users',
  'platform-audit',
  'platform-settings',
]);

export function chatPlatformHidesDashboardSearch(tab: string): boolean {
  return GOVERNANCE_SECTIONS.has(tab);
}

type RequestFn = (path: string, init?: RequestInit) => Promise<Response>;

type TenantRow = {
  tenantId: string;
  displayName: string;
  brand: string;
  market: string;
  organizationName: string;
  primaryContactName: string;
  primaryContactEmail: string;
  lifecycleStatus: 'draft' | 'active' | 'suspended' | 'archived';
  capabilities: Record<string, boolean>;
  sourceKind: string;
  explicitEntitlement: boolean;
  createdAt: string;
  activatedAt: string | null;
  suspendedAt: string | null;
  archivedAt: string | null;
  compileTime: boolean;
};

type CatalogRow = {
  tenantId: string;
  displayName: string;
  hasCommercialRecord: boolean;
  compileTimeActive: boolean;
};

const LIFECYCLE_TONE: Record<TenantRow['lifecycleStatus'], AdminStatusTone> = {
  draft: 'neutral',
  active: 'positive',
  suspended: 'warning',
  archived: 'danger',
};

function stamp(value: string | null | undefined): string {
  if (!value) return 'Not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not recorded';
  return format(parsed, 'MMM d, yyyy h:mm a');
}

function navClass(current: boolean): string {
  const base = 'inline-flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:w-auto';
  return current
    ? `${base} bg-white text-emerald-800 shadow-sm`
    : `${base} text-zinc-700 hover:bg-white hover:text-zinc-900 active:bg-zinc-100`;
}

export function AdminChatPlatform({
  section,
  onSection,
  canManage,
  request,
  team,
  integrations,
  entitlements,
  onOpenUserManagement,
}: {
  section: string;
  onSection: (section: ChatPlatformSectionId) => void;
  canManage: boolean;
  request: RequestFn;
  team?: ReactNode;
  integrations?: ReactNode;
  entitlements?: ReactNode;
  onOpenUserManagement?: () => void;
}) {
  const titleId = useId();
  const navLabel = CHAT_PLATFORM_SECTIONS.find((item) => item.id === section)?.label ?? 'Overview';
  const heading = section === 'leads' ? 'Chat leads' : section === 'chats' ? 'Chat history' : navLabel;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-500 bg-white p-4 sm:p-6">
        <p className="text-sm font-semibold text-zinc-700">Primewayz Chat Platform</p>
        <AdminPageIntro id={titleId} title={heading}>
          <p>
            Primewayz Chat Connect is the add-on installed on a tenant site. This workspace is the central platform that authorizes tenants, sites, and connectors.
          </p>
        </AdminPageIntro>
        <nav aria-label="Chat Platform sections" className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {CHAT_PLATFORM_SECTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={navClass(section === item.id)}
              aria-current={section === item.id ? 'page' : undefined}
              onClick={() => onSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {section === 'chat-platform' ? <Overview request={request} /> : null}
      {section === 'leads' ? (
        <p className="text-sm leading-6 text-zinc-700">Inbox and chat leads for the entity selected above. Search in the dashboard field filters these records.</p>
      ) : null}
      {section === 'chats' ? (
        <p className="text-sm leading-6 text-zinc-700">Conversation history stays readable when chat is suspended. Replies follow the central entitlement decision.</p>
      ) : null}
      {section === 'platform-team' ? team : null}
      {section === 'platform-tenants' ? <Tenants canManage={canManage} request={request} /> : null}
      {section === 'platform-sites' ? <Sites canManage={canManage} request={request} /> : null}
      {section === 'chat-connect' ? integrations : null}
      {section === 'platform-users' ? (
        <UsersPermissions canManage={canManage} onOpenUserManagement={onOpenUserManagement} />
      ) : null}
      {section === 'platform-audit' ? <Audit request={request} /> : null}
      {section === 'platform-settings' ? (
        <Settings canManage={canManage} entitlements={entitlements} />
      ) : null}
    </div>
  );
}

function Overview({ request }: { request: RequestFn }) {
  const [body, setBody] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await request('/api/admin/chat-platform/overview');
    const payload = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !payload.success) {
      setError(payload.error || 'The operational overview could not be loaded.');
      return;
    }
    setError('');
    setBody(payload);
  };

  useEffect(() => {
    load().catch(() => setError('The operational overview could not be loaded.')).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLoading label="Loading the Chat Platform overview." />;
  if (error) return <AdminError message={error} onRetry={() => { setLoading(true); load().catch(() => setError('The operational overview could not be loaded.')).finally(() => setLoading(false)); }} />;
  if (!body) return null;
  const tenants = body.tenants ?? {};
  const installations = body.installations ?? {};
  const entitlements = body.entitlements ?? {};
  const alerts = (body.alerts ?? []) as Array<{ tone: AdminStatusTone; text: string }>;
  return (
    <div className="space-y-6">
      <p role="status" className="text-sm text-zinc-700">
        {tenants.registered ?? 0} registered tenants. {installations.unreported ?? 0} installations have unreported connection health.
      </p>
      {body.registry === 'legacy' ? (
        <AdminError message="The commercial tenant registry migration has not been applied. Compile-time tenants remain available. Connector health below is from installation heartbeats, not from this notice." />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Registered tenants" value={tenants.registered} />
        <Metric label="Active commercial records" value={tenants.active} />
        <Metric label="Suspended tenants" value={tenants.suspended} />
        <Metric label="Enabled chat entitlements" value={entitlements.entitled} />
        <Metric label="Authorized installations" value={installations.authorized} />
        <Metric label="Connected" value={installations.connected} />
        <Metric label="Stale or disconnected" value={(installations.stale ?? 0) + (installations.disconnected ?? 0)} />
        <Metric label="Unreported health" value={installations.unreported} />
      </div>
      <section className="space-y-3" aria-labelledby="chat-platform-alerts">
        <h3 id="chat-platform-alerts" className="text-base font-semibold text-zinc-900">Operational alerts</h3>
        {alerts.length === 0 ? <AdminEmpty title="No current alerts" description="Suspended tenants, entitlement closures, and heartbeat gaps will appear here." /> : (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.text}><AdminStatus label={alert.text} tone={alert.tone === 'danger' ? 'danger' : alert.tone === 'warning' ? 'warning' : 'neutral'} /></li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3" aria-labelledby="chat-platform-events">
        <h3 id="chat-platform-events" className="text-base font-semibold text-zinc-900">Recent lifecycle events</h3>
        {(body.recentEvents ?? []).length === 0 ? <AdminEmpty title="No lifecycle events yet" description="Registration, suspension, and domain verification are recorded here." /> : (
          <ul className="space-y-2 text-sm text-zinc-700">
            {body.recentEvents.map((event: { tenantId: string; action: string; createdAt: string }) => (
              <li key={`${event.tenantId}-${event.action}-${event.createdAt}`}>{stamp(event.createdAt)} · {event.tenantId} · {event.action.replaceAll('_', ' ')}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-500 bg-white p-4">
      <p className="text-xs font-semibold text-zinc-600">{label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-900">{value ?? 0}</p>
    </div>
  );
}

function Tenants({ canManage, request }: { canManage: boolean; request: RequestFn }) {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [catalog, setCatalog] = useState<CatalogRow[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TenantRow | null>(null);
  const [pending, setPending] = useState<null | { action: 'suspend' | 'reactivate' | 'archive' | 'restore' | 'activate'; tenant: TenantRow }>(null);
  const [busy, setBusy] = useState(false);
  const pageSize = 8;

  const load = async (nextPage = page, nextQuery = query, nextStatus = status) => {
    const params = new URLSearchParams({ page: String(nextPage), pageSize: String(pageSize), status: nextStatus });
    if (nextQuery.trim()) params.set('q', nextQuery.trim());
    const response = await request(`/api/admin/chat-platform/tenants?${params.toString()}`);
    const body = await response.json() as { success?: boolean; error?: string; tenants?: TenantRow[]; total?: number; catalog?: CatalogRow[] };
    if (!response.ok || !body.success) {
      setError(body.error || 'Tenants could not be loaded.');
      return;
    }
    setError('');
    setTenants(body.tenants ?? []);
    setTotal(body.total ?? 0);
    setCatalog(body.catalog ?? []);
  };

  useEffect(() => {
    load(1).catch(() => setError('Tenants could not be loaded.')).finally(() => setLoading(false));
  }, []);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  const runLifecycle = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      const response = await request(`/api/admin/chat-platform/tenants/${pending.tenant.tenantId}/${pending.action}`, { method: 'POST' });
      const body = await response.json() as { success?: boolean; error?: string; tenant?: TenantRow };
      if (!response.ok || !body.success) {
        setError(body.error || 'The lifecycle change failed.');
        setPending(null);
        return;
      }
      setPending(null);
      setSelected(body.tenant ?? null);
      await load();
    } catch {
      setError('The lifecycle change failed.');
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {loading ? <AdminLoading label="Loading tenants." /> : null}
      {error ? <AdminError message={error} onRetry={() => { setLoading(true); load().catch(() => setError('Tenants could not be loaded.')).finally(() => setLoading(false)); }} /> : null}
      {canManage ? <RegisterTenant request={request} catalog={catalog} onCreated={() => load(1)} /> : (
        <p className="text-sm leading-6 text-zinc-700">You can view tenants granted to this account. The Host/Owner registers tenants and changes lifecycle.</p>
      )}
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); setPage(1); setLoading(true); load(1, query, status).finally(() => setLoading(false)); }}>
        <AdminField id="tenant-search" label="Search tenants" hint="Matches display name, organization, id, or contact email in the records already loaded for this account.">
          {({ id, describedBy }) => (
            <input id={id} type="search" value={query} aria-describedby={describedBy} onChange={(event) => setQuery(event.target.value)} className={adminControlClass} />
          )}
        </AdminField>
        <AdminField id="tenant-status-filter" label="Lifecycle" hint="Draft, active, suspended, and archived are account status, not chat entitlement.">
          {({ id, describedBy }) => (
            <select id={id} value={status} aria-describedby={describedBy} onChange={(event) => setStatus(event.target.value)} className={adminControlClass}>
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </select>
          )}
        </AdminField>
        <button type="submit" className={adminSecondaryButtonClass}>Apply filters</button>
      </form>
      <p role="status" className="text-sm text-zinc-700">{total} tenant record{total === 1 ? '' : 's'} match.</p>
      {!loading && tenants.length === 0 ? <AdminEmpty title="No tenant records" description="Nothing matches the current search. Clear the filters or create a commercial record." /> : null}
      <div className="space-y-3 xl:hidden">
        {tenants.map((tenant) => <TenantCard key={tenant.tenantId} tenant={tenant} canManage={canManage} onSelect={setSelected} onAction={(action) => setPending({ action, tenant })} />)}
      </div>
      <div className="hidden xl:block overflow-x-auto rounded-2xl border border-zinc-500 bg-white">
        <table className="w-full text-left">
          <caption className="sr-only">Commercial tenant records</caption>
          <thead>
            <tr>
              <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Tenant</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Status</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Contact</th>
              <th scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.tenantId} className="border-t border-zinc-200">
                <td className="px-4 py-3">
                  <p className="text-base font-semibold text-zinc-900">{tenant.displayName}</p>
                  <p className="text-sm text-zinc-700">{tenant.tenantId}</p>
                </td>
                <td className="px-4 py-3"><AdminStatus label={tenant.lifecycleStatus} tone={LIFECYCLE_TONE[tenant.lifecycleStatus]} /></td>
                <td className="px-4 py-3 text-sm text-zinc-700">{tenant.primaryContactEmail}</td>
                <td className="px-4 py-3"><TenantActions tenant={tenant} canManage={canManage} onSelect={setSelected} onAction={(action) => setPending({ action, tenant })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" className={adminSecondaryButtonClass} disabled={page <= 1} onClick={() => { const next = page - 1; setPage(next); load(next); }}>Previous page</button>
        <button type="button" className={adminSecondaryButtonClass} disabled={page >= pages} onClick={() => { const next = page + 1; setPage(next); load(next); }}>Next page</button>
        <p className="self-center text-sm text-zinc-700">Page {page} of {pages}</p>
      </div>
      {selected ? <TenantEditor tenant={selected} canManage={canManage} request={request} onSaved={(tenant) => { setSelected(tenant); load(); }} /> : null}
      <ChatConfirmDialog
        open={Boolean(pending)}
        title={pending ? `${pending.action} ${pending.tenant.displayName}` : 'Confirm'}
        body={pending ? `${pending.tenant.displayName} will be ${pending.action === 'activate' || pending.action === 'reactivate' ? 'active' : pending.action === 'restore' ? 'a draft' : pending.action}. Chat entitlement, installation authorization, and connector health stay separate.` : ''}
        confirmLabel={pending?.action ?? 'Confirm'}
        variant={pending?.action === 'archive' || pending?.action === 'suspend' ? 'danger' : 'default'}
        isConfirming={busy}
        onCancel={() => { if (!busy) setPending(null); }}
        onConfirm={() => { void runLifecycle(); }}
      />
    </div>
  );
}

function TenantCard({ tenant, canManage, onSelect, onAction }: {
  tenant: TenantRow;
  canManage: boolean;
  onSelect: (tenant: TenantRow) => void;
  onAction: (action: 'suspend' | 'reactivate' | 'archive' | 'restore' | 'activate') => void;
}) {
  return (
    <article className="rounded-2xl border border-zinc-500 bg-white p-4">
      <h3 className="text-base font-semibold text-zinc-900">{tenant.displayName}</h3>
      <p className="mt-1 text-sm text-zinc-700">{tenant.tenantId}</p>
      <div className="mt-3"><AdminStatus label={tenant.lifecycleStatus} tone={LIFECYCLE_TONE[tenant.lifecycleStatus]} /></div>
      <div className="mt-4"><TenantActions tenant={tenant} canManage={canManage} onSelect={onSelect} onAction={onAction} /></div>
    </article>
  );
}

function TenantActions({ tenant, canManage, onSelect, onAction }: {
  tenant: TenantRow;
  canManage: boolean;
  onSelect: (tenant: TenantRow) => void;
  onAction: (action: 'suspend' | 'reactivate' | 'archive' | 'restore' | 'activate') => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button type="button" className={adminSecondaryButtonClass} onClick={() => onSelect(tenant)}>View and edit</button>
      {canManage && tenant.lifecycleStatus === 'draft' ? <button type="button" className={adminPrimaryButtonClass} onClick={() => onAction('activate')}>Activate</button> : null}
      {canManage && tenant.lifecycleStatus === 'active' ? <button type="button" className={adminDangerButtonClass} onClick={() => onAction('suspend')}>Suspend</button> : null}
      {canManage && tenant.lifecycleStatus === 'suspended' ? <button type="button" className={adminPrimaryButtonClass} onClick={() => onAction('reactivate')}>Reactivate</button> : null}
      {canManage && tenant.lifecycleStatus !== 'archived' ? <button type="button" className={adminDangerButtonClass} onClick={() => onAction('archive')}>Archive</button> : null}
      {canManage && tenant.lifecycleStatus === 'archived' ? <button type="button" className={adminSecondaryButtonClass} onClick={() => onAction('restore')}>Restore to draft</button> : null}
    </div>
  );
}

function RegisterTenant({ request, catalog, onCreated }: { request: RequestFn; catalog: CatalogRow[]; onCreated: () => Promise<void> }) {
  const [mode, setMode] = useState<'new' | 'catalog'>('new');
  const [tenantId, setTenantId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [brand, setBrand] = useState('Customer');
  const [market, setMarket] = useState('UK');
  const [organizationName, setOrganizationName] = useState('');
  const [primaryContactName, setPrimaryContactName] = useState('');
  const [primaryContactEmail, setPrimaryContactEmail] = useState('');
  const [catalogId, setCatalogId] = useState(catalog.find((row) => !row.hasCommercialRecord)?.tenantId ?? '');
  const [lifecycleStatus, setLifecycleStatus] = useState('active');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const idRef = useRef<HTMLInputElement>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setFieldError('');
    if (mode === 'new' && !/^[a-z][a-z0-9-]{1,31}$/.test(tenantId.trim())) {
      setFieldError('Use a lowercase id such as acme-uk.');
      idRef.current?.focus();
      return;
    }
    const path = mode === 'new'
      ? '/api/admin/chat-platform/tenants'
      : `/api/admin/chat-platform/tenants/${catalogId}/commercial-record`;
    const payload = mode === 'new'
      ? { tenantId, displayName, brand, market, organizationName, primaryContactName, primaryContactEmail }
      : { organizationName, primaryContactName, primaryContactEmail, lifecycleStatus };
    const response = await request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !body.success) {
      setError(body.error || 'The tenant could not be saved.');
      return;
    }
    setTenantId('');
    setDisplayName('');
    await onCreated();
  };

  return (
    <form onSubmit={(event) => { void submit(event); }} className="grid gap-4 rounded-2xl border border-zinc-500 bg-white p-4 sm:grid-cols-2">
      <h3 className="text-base font-semibold text-zinc-900 sm:col-span-2">Register a tenant</h3>
      {error ? <div className="sm:col-span-2"><AdminError message={error} /></div> : null}
      <AdminField id="tenant-mode" label="Record type" hint="A catalog tenant keeps its existing id. A new customer does not require a code change.">
        {({ id, describedBy }) => (
          <select id={id} aria-describedby={describedBy} value={mode} onChange={(event) => setMode(event.target.value as 'new' | 'catalog')} className={adminControlClass}>
            <option value="new">New database tenant</option>
            <option value="catalog">Commercial record for a catalog tenant</option>
          </select>
        )}
      </AdminField>
      {mode === 'new' ? (
        <AdminField id="new-tenant-id" label="Tenant id" hint="Required. Lowercase letters, numbers, and hyphens." error={fieldError}>
          {({ id, describedBy, invalid }) => (
            <input ref={idRef} id={id} required aria-required="true" aria-invalid={invalid} aria-describedby={describedBy} value={tenantId} onChange={(event) => setTenantId(event.target.value)} className={adminControlClass} />
          )}
        </AdminField>
      ) : (
        <AdminField id="catalog-tenant" label="Catalog tenant" hint="Required. This does not create a second identity.">
          {({ id, describedBy }) => (
            <select id={id} required aria-required="true" aria-describedby={describedBy} value={catalogId} onChange={(event) => setCatalogId(event.target.value)} className={adminControlClass}>
              {catalog.filter((row) => !row.hasCommercialRecord).map((row) => <option key={row.tenantId} value={row.tenantId}>{row.displayName}</option>)}
            </select>
          )}
        </AdminField>
      )}
      {mode === 'new' ? (
        <>
          <AdminField id="new-display-name" label="Display name" hint="Required.">
            {({ id, describedBy }) => <input id={id} required aria-required="true" aria-describedby={describedBy} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={adminControlClass} />}
          </AdminField>
          <AdminField id="new-brand" label="Brand" hint="Required.">
            {({ id, describedBy }) => (
              <select id={id} aria-describedby={describedBy} value={brand} onChange={(event) => setBrand(event.target.value)} className={adminControlClass}>
                <option>Customer</option>
                <option>Primewayz</option>
                <option>RentReadBuy</option>
              </select>
            )}
          </AdminField>
          <AdminField id="new-market" label="Market" hint="Required.">
            {({ id, describedBy }) => (
              <select id={id} aria-describedby={describedBy} value={market} onChange={(event) => setMarket(event.target.value)} className={adminControlClass}>
                {['UK', 'IN', 'US', 'UAE', 'MX', 'OTHER'].map((item) => <option key={item}>{item}</option>)}
              </select>
            )}
          </AdminField>
        </>
      ) : (
        <AdminField id="catalog-lifecycle" label="Starting status" hint="Suspended closes chat for this catalog tenant. Active does not override an environment gate.">
          {({ id, describedBy }) => (
            <select id={id} aria-describedby={describedBy} value={lifecycleStatus} onChange={(event) => setLifecycleStatus(event.target.value)} className={adminControlClass}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="suspended">Suspended</option>
            </select>
          )}
        </AdminField>
      )}
      <AdminField id="org-name" label="Organization" hint="Required.">
        {({ id, describedBy }) => <input id={id} required aria-required="true" aria-describedby={describedBy} value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className={adminControlClass} />}
      </AdminField>
      <AdminField id="contact-name" label="Primary contact" hint="Required.">
        {({ id, describedBy }) => <input id={id} required aria-required="true" aria-describedby={describedBy} value={primaryContactName} onChange={(event) => setPrimaryContactName(event.target.value)} className={adminControlClass} />}
      </AdminField>
      <AdminField id="contact-email" label="Contact email" hint="Required.">
        {({ id, describedBy }) => <input id={id} type="email" required aria-required="true" aria-describedby={describedBy} value={primaryContactEmail} onChange={(event) => setPrimaryContactEmail(event.target.value)} className={adminControlClass} />}
      </AdminField>
      <div className="sm:col-span-2">
        <button type="submit" className={adminPrimaryButtonClass}>{mode === 'new' ? 'Register tenant' : 'Create commercial record'}</button>
      </div>
    </form>
  );
}

function TenantEditor({ tenant, canManage, request, onSaved }: {
  tenant: TenantRow;
  canManage: boolean;
  request: RequestFn;
  onSaved: (tenant: TenantRow) => void;
}) {
  const [displayName, setDisplayName] = useState(tenant.displayName);
  const [organizationName, setOrganizationName] = useState(tenant.organizationName);
  const [primaryContactName, setPrimaryContactName] = useState(tenant.primaryContactName);
  const [primaryContactEmail, setPrimaryContactEmail] = useState(tenant.primaryContactEmail);
  const [error, setError] = useState('');

  useEffect(() => {
    setDisplayName(tenant.displayName);
    setOrganizationName(tenant.organizationName);
    setPrimaryContactName(tenant.primaryContactName);
    setPrimaryContactEmail(tenant.primaryContactEmail);
  }, [tenant]);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const response = await request(`/api/admin/chat-platform/tenants/${tenant.tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, organizationName, primaryContactName, primaryContactEmail }),
    });
    const body = await response.json() as { success?: boolean; error?: string; tenant?: TenantRow };
    if (!response.ok || !body.success || !body.tenant) {
      setError(body.error || 'The tenant could not be saved.');
      return;
    }
    setError('');
    onSaved(body.tenant);
  };

  return (
    <form onSubmit={(event) => { void save(event); }} className="grid gap-4 rounded-2xl border border-zinc-500 bg-white p-4 sm:grid-cols-2">
      <h3 className="text-base font-semibold text-zinc-900 sm:col-span-2">{tenant.displayName}</h3>
      <p className="text-sm leading-6 text-zinc-700 sm:col-span-2">Created {stamp(tenant.createdAt)}. Activated {stamp(tenant.activatedAt)}. Suspended {stamp(tenant.suspendedAt)}. Archived {stamp(tenant.archivedAt)}.</p>
      {error ? <div className="sm:col-span-2"><AdminError message={error} /></div> : null}
      <AdminField id="edit-display" label="Display name" hint="Required.">
        {({ id, describedBy }) => <input id={id} required aria-describedby={describedBy} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={adminControlClass} />}
      </AdminField>
      <AdminField id="edit-org" label="Organization" hint="Required.">
        {({ id, describedBy }) => <input id={id} required aria-describedby={describedBy} value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className={adminControlClass} />}
      </AdminField>
      <AdminField id="edit-contact" label="Primary contact" hint="Required.">
        {({ id, describedBy }) => <input id={id} required aria-describedby={describedBy} value={primaryContactName} onChange={(event) => setPrimaryContactName(event.target.value)} className={adminControlClass} />}
      </AdminField>
      <AdminField id="edit-email" label="Contact email" hint="Required.">
        {({ id, describedBy }) => <input id={id} type="email" required aria-describedby={describedBy} value={primaryContactEmail} onChange={(event) => setPrimaryContactEmail(event.target.value)} className={adminControlClass} />}
      </AdminField>
      <div className="sm:col-span-2">
        <button type="submit" className={adminPrimaryButtonClass} disabled={tenant.lifecycleStatus === 'archived'}>Save tenant</button>
        {!canManage ? <p className="mt-2 text-sm text-zinc-700">Lifecycle and capabilities stay with the Host/Owner.</p> : null}
      </div>
    </form>
  );
}

function Sites({ canManage, request }: { canManage: boolean; request: RequestFn }) {
  const [sites, setSites] = useState<Array<Record<string, any>>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [technology, setTechnology] = useState('wordpress');
  const [originDraft, setOriginDraft] = useState<Record<string, string>>({});
  const [token, setToken] = useState<{ origin: string; verificationToken: string; dnsHost: string } | null>(null);
  const tokenRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const response = await request('/api/admin/chat-platform/sites');
    const body = await response.json() as { success?: boolean; error?: string; sites?: Array<Record<string, any>> };
    if (!response.ok || !body.success) {
      setError(body.error || 'Sites could not be loaded.');
      return;
    }
    setError('');
    setSites(body.sites ?? []);
  };

  useEffect(() => {
    load().catch(() => setError('Sites could not be loaded.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    tokenRef.current?.focus();
  }, [token]);

  const createSite = async (event: FormEvent) => {
    event.preventDefault();
    const response = await request(`/api/admin/chat-platform/tenants/${tenantId}/sites`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName, technology }),
    });
    const body = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !body.success) {
      setError(body.error || 'The site could not be created.');
      return;
    }
    setDisplayName('');
    await load();
  };

  const addOrigin = async (siteId: string) => {
    const response = await request(`/api/admin/chat-platform/sites/${siteId}/origins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: originDraft[siteId] ?? '' }),
    });
    const body = await response.json() as { success?: boolean; error?: string; origin?: { origin: string; verificationToken: string; dnsHost: string } };
    if (!response.ok || !body.success || !body.origin) {
      setError(body.error || 'The origin challenge could not be issued.');
      return;
    }
    setToken(body.origin);
    await load();
  };

  const verify = async (originId: string) => {
    const response = await request(`/api/admin/chat-platform/origins/${originId}/verify`, { method: 'POST' });
    const body = await response.json() as { success?: boolean; error?: string };
    if (!response.ok || !body.success) {
      setError(body.error || 'Ownership was not proved.');
      await load();
      return;
    }
    setError('');
    await load();
  };

  if (loading) return <AdminLoading label="Loading sites and domains." />;
  return (
    <div className="space-y-6">
      {error ? <AdminError message={error} onRetry={() => { setLoading(true); load().finally(() => setLoading(false)); }} /> : null}
      <p className="text-sm leading-6 text-zinc-700">An origin is not authorized because it was typed here. Publish the verification token as a DNS TXT record or at the well-known path, then verify.</p>
      {token ? (
        <div tabIndex={-1} className="border-l-4 border-amber-800 bg-amber-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">Verification token shown once</h3>
          <p className="mt-1 text-sm text-zinc-800">DNS host {token.dnsHost}. File path /.well-known/primewayz-chat-verification.txt on {token.origin}.</p>
          <label htmlFor="origin-token" className="mt-3 block text-sm font-semibold text-zinc-900">Verification token</label>
          <input id="origin-token" ref={tokenRef} readOnly value={token.verificationToken} autoComplete="off" className={`${adminControlClass} font-mono text-xs break-all`} />
          <button type="button" className={`${adminSecondaryButtonClass} mt-3`} onClick={() => setToken(null)}>I have stored this token</button>
        </div>
      ) : null}
      {canManage ? (
        <form onSubmit={(event) => { void createSite(event); }} className="grid gap-4 rounded-2xl border border-zinc-500 bg-white p-4 sm:grid-cols-2">
          <h3 className="text-base font-semibold text-zinc-900 sm:col-span-2">Add a site</h3>
          <AdminField id="site-tenant" label="Tenant id" hint="Required. The tenant needs a commercial record.">
            {({ id, describedBy }) => <input id={id} required aria-describedby={describedBy} value={tenantId} onChange={(event) => setTenantId(event.target.value)} className={adminControlClass} />}
          </AdminField>
          <AdminField id="site-name" label="Site name" hint="Required.">
            {({ id, describedBy }) => <input id={id} required aria-describedby={describedBy} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className={adminControlClass} />}
          </AdminField>
          <AdminField id="site-technology" label="Technology" hint="WordPress, Shopify, and custom share the connector API. React is the first-party Primewayz UK surface. Other technologies can be recorded only as those values.">
            {({ id, describedBy }) => (
              <select id={id} aria-describedby={describedBy} value={technology} onChange={(event) => setTechnology(event.target.value)} className={adminControlClass}>
                <option value="wordpress">WordPress</option>
                <option value="shopify">Shopify</option>
                <option value="custom">Custom</option>
                <option value="react">React first-party</option>
              </select>
            )}
          </AdminField>
          <div className="sm:col-span-2"><button type="submit" className={adminPrimaryButtonClass}>Add site</button></div>
        </form>
      ) : <p className="text-sm text-zinc-700">Site registration is restricted to the Host/Owner.</p>}
      <p role="status" className="text-sm text-zinc-700">{sites.length} site{sites.length === 1 ? '' : 's'} visible.</p>
      {sites.length === 0 ? <AdminEmpty title="No sites" description="No sites are visible for this account." /> : null}
      {sites.map((site) => (
        <article key={site.id} className="space-y-3 rounded-2xl border border-zinc-500 bg-white p-4">
          <h3 className="text-base font-semibold text-zinc-900">{site.displayName}</h3>
          <p className="text-sm text-zinc-700">{site.tenantId} · {site.technology} · {site.id}</p>
          <AdminStatus label={site.status} tone={site.status === 'active' ? 'positive' : site.status === 'suspended' ? 'warning' : 'neutral'} />
          <ul className="space-y-2">
            {(site.origins ?? []).map((origin: { id: string; origin: string; verificationStatus: string }) => (
              <li key={origin.id} className="flex flex-col gap-2 border-t border-zinc-200 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-zinc-800">{origin.origin}</span>
                <AdminStatus label={origin.verificationStatus} tone={origin.verificationStatus === 'verified' ? 'positive' : origin.verificationStatus === 'failed' ? 'danger' : 'neutral'} />
                {canManage && origin.verificationStatus !== 'verified' ? <button type="button" className={adminSecondaryButtonClass} onClick={() => { void verify(origin.id); }}>Verify ownership</button> : null}
              </li>
            ))}
          </ul>
          <p className="text-sm text-zinc-700">Installations: {(site.installations ?? []).join(', ') || 'None linked'}</p>
          {canManage ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`origin-${site.id}`}>Origin for {site.displayName}</label>
              <input id={`origin-${site.id}`} value={originDraft[site.id] ?? ''} onChange={(event) => setOriginDraft({ ...originDraft, [site.id]: event.target.value })} placeholder="https://example.com" className={adminControlClass} />
              <button type="button" className={adminSecondaryButtonClass} onClick={() => { void addOrigin(site.id); }}>Issue challenge</button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function Audit({ request }: { request: RequestFn }) {
  const [entries, setEntries] = useState<Array<{ id: number; tenantId: string; action: string; createdAt: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    request('/api/admin/chat-platform/audit')
      .then(async (response) => {
        const body = await response.json() as { success?: boolean; error?: string; entries?: typeof entries };
        if (!response.ok || !body.success) setError(body.error || 'Audit history could not be loaded.');
        else setEntries(body.entries ?? []);
      })
      .catch(() => setError('Audit history could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <AdminLoading label="Loading audit history." />;
  if (error) return <AdminError message={error} />;
  if (entries.length === 0) return <AdminEmpty title="No audit events" description="Lifecycle and domain events for visible tenants will appear here." />;
  return (
    <ul className="space-y-2">
      {entries.map((entry) => (
        <li key={entry.id} className="rounded-2xl border border-zinc-500 bg-white px-4 py-3 text-sm text-zinc-800">
          {stamp(entry.createdAt)} · {entry.tenantId} · {entry.action.replaceAll('_', ' ')}
        </li>
      ))}
    </ul>
  );
}

function UsersPermissions({ canManage, onOpenUserManagement }: { canManage: boolean; onOpenUserManagement?: () => void }) {
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-500 bg-white p-4">
      <h3 className="text-base font-semibold text-zinc-900">Explicit grants</h3>
      <p className="text-sm leading-6 text-zinc-700">Tenant operators only receive the tenants granted to their account. The Host/Owner retains platform-wide authority. This screen does not invent extra permissions.</p>
      {canManage ? (
        <button type="button" className={adminPrimaryButtonClass} onClick={onOpenUserManagement}>Open platform user management</button>
      ) : (
        <p role="status" className="text-sm text-zinc-700">Permission denied for grant changes. Ask the Host/Owner to update your tenant grants.</p>
      )}
    </div>
  );
}

function Settings({ canManage, entitlements }: { canManage: boolean; entitlements?: ReactNode }) {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-zinc-700">Tenant account status, chat entitlement, installation authorization, connector health, frontend visibility, and operator availability are separate controls.</p>
      {canManage ? entitlements : (
        <p role="status" className="rounded-2xl border border-zinc-500 bg-white px-4 py-3 text-sm text-zinc-800">Central chat activation, suspension, and revocation are restricted to the Host/Owner. Local contact details are edited from Tenants.</p>
      )}
      <p className="text-sm text-zinc-700">Future voice, multimodal conversations, AI agents, workflow automation, and the Connect marketplace stay extension boundaries. They are not switched on here.</p>
    </div>
  );
}
