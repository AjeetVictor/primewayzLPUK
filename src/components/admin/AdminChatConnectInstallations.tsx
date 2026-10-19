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
  adminDangerButtonClass,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
  type AdminStatusTone,
} from './adminUx';

type Installation = {
  id: string;
  tenantBrand: string | null;
  tenantDisplayName: string | null;
  tenantKey: string;
  integrationTechnology: string;
  addonVersion: string | null;
  widgetVersion: string | null;
  authorizationStatus: 'registered' | 'active' | 'suspended' | 'revoked';
  connectionHealth: 'unknown' | 'connected' | 'stale' | 'disconnected';
  frontendVisibility: 'unset' | 'visible' | 'hidden';
  registeredAt: string | null;
  provisionedAt: string | null;
  activatedAt: string | null;
  lastVerifiedHeartbeatAt: string | null;
  lastAuthenticatedActivityAt: string | null;
  legacyEnvBinding: boolean;
  classification?: 'first-party' | 'legacy-environment' | 'connector';
};

type TenantOption = {
  tenantId: string;
  brand: string;
  displayName: string;
  registryActive: boolean;
  activationControlled: boolean;
};

type IssuedCredential = { keyId: string; secret: string };

type ListResponse = {
  success?: boolean;
  error?: string;
  heartbeatIntervalSeconds?: number;
  connectorTechnologies?: string[];
  installations?: Installation[];
  tenants?: TenantOption[];
  credential?: IssuedCredential;
  installation?: Installation;
};

type InstallationAction = 'suspend' | 'reactivate' | 'revoke' | 'rotate-credentials';

const STATUS_LABEL: Record<Installation['authorizationStatus'], string> = {
  registered: 'Registered',
  active: 'Active',
  suspended: 'Suspended',
  revoked: 'Revoked',
};

const STATUS_TONE: Record<Installation['authorizationStatus'], AdminStatusTone> = {
  registered: 'neutral',
  active: 'positive',
  suspended: 'warning',
  revoked: 'danger',
};

const HEALTH_LABEL: Record<Installation['connectionHealth'], string> = {
  unknown: 'Unknown',
  connected: 'Connected',
  stale: 'Stale',
  disconnected: 'Disconnected',
};

const HEALTH_TONE: Record<Installation['connectionHealth'], AdminStatusTone> = {
  unknown: 'neutral',
  connected: 'positive',
  stale: 'warning',
  disconnected: 'danger',
};

const VISIBILITY_LABEL: Record<Installation['frontendVisibility'], string> = {
  unset: 'Not set',
  visible: 'Visible',
  hidden: 'Hidden',
};

const VISIBILITY_TONE: Record<Installation['frontendVisibility'], AdminStatusTone> = {
  unset: 'neutral',
  visible: 'positive',
  hidden: 'neutral',
};

const ACTION_COPY: Record<InstallationAction, {
  title: string;
  confirm: string;
  variant: AppConfirmVariant;
  body: (name: string) => string;
}> = {
  suspend: {
    title: 'Suspend installation',
    confirm: 'Suspend installation',
    variant: 'warning',
    body: (name) => `Suspend ${name}? Authenticated connector calls stop. Tenant chat entitlement and other installations stay unchanged.`,
  },
  reactivate: {
    title: 'Reactivate installation',
    confirm: 'Reactivate installation',
    variant: 'default',
    body: (name) => `Reactivate ${name}? Its current credential can connect again. Tenant chat entitlement stays unchanged.`,
  },
  revoke: {
    title: 'Revoke installation',
    confirm: 'Revoke installation',
    variant: 'danger',
    body: (name) => `Revoke ${name} and retire its credential? This cannot be undone from this screen. Tenant chat entitlement stays unchanged.`,
  },
  'rotate-credentials': {
    title: 'Rotate credential',
    confirm: 'Rotate credential',
    variant: 'danger',
    body: (name) => `Rotate the credential for ${name}? The current credential stops working immediately. The new credential is shown once.`,
  },
};

function stamp(value: string | null): string {
  if (!value) return 'Not known';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not known';
  return format(parsed, 'MMM d, yyyy h:mm a');
}

function registeredStamp(installation: Installation): { label: string; value: string } {
  if (installation.registeredAt) return { label: 'Registered', value: stamp(installation.registeredAt) };
  if (installation.provisionedAt) return { label: 'Provisioned', value: stamp(installation.provisionedAt) };
  return { label: 'Registered or provisioned', value: 'Not recorded' };
}

function installationName(installation: Installation): string {
  return installation.tenantDisplayName || installation.tenantBrand || installation.tenantKey;
}

function installationText(installation: Installation): string {
  return [
    installation.tenantBrand,
    installation.tenantDisplayName,
    installation.tenantKey,
    installation.id,
    installation.integrationTechnology,
    installation.addonVersion,
    installation.widgetVersion,
  ].filter(Boolean).join(' ').toLowerCase();
}

export function AdminChatConnectInstallations({
  canManage,
  request,
  tenantFilter,
}: {
  canManage: boolean;
  request: (path: string, init?: RequestInit) => Promise<Response>;
  tenantFilter?: string;
}) {
  const titleId = useId();
  const credentialTitleId = useId();
  const credentialHelpId = useId();
  const credentialFieldId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const credentialRef = useRef<HTMLDivElement>(null);
  const credentialInputRef = useRef<HTMLInputElement>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [intervalSeconds, setIntervalSeconds] = useState(300);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [issued, setIssued] = useState<IssuedCredential | null>(null);
  const [copyMessage, setCopyMessage] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [addonVersion, setAddonVersion] = useState('');
  const [widgetVersion, setWidgetVersion] = useState('');
  const [frontendVisibility, setFrontendVisibility] = useState<'hidden' | 'visible'>('hidden');
  const [technologies, setTechnologies] = useState<string[]>(['wordpress']);
  const [integrationTechnology, setIntegrationTechnology] = useState('wordpress');
  const [query, setQuery] = useState('');
  const [authorizationFilter, setAuthorizationFilter] = useState<'all' | Installation['authorizationStatus']>('all');
  const [healthFilter, setHealthFilter] = useState<'all' | Installation['connectionHealth']>('all');
  const [pendingAction, setPendingAction] = useState<{ installation: Installation; action: InstallationAction } | null>(null);

  const load = async () => {
    const response = await request('/api/admin/chat-connect/installations');
    const body = await response.json() as ListResponse;
    if (!response.ok || !body.success) {
      setError(body.error || 'Installations could not be loaded.');
      return;
    }
    setError('');
    setInstallations(body.installations ?? []);
    setTenants(body.tenants ?? []);
    if (body.connectorTechnologies && body.connectorTechnologies.length > 0) {
      setTechnologies(body.connectorTechnologies);
      setIntegrationTechnology((current) => (
        body.connectorTechnologies?.includes(current) ? current : body.connectorTechnologies?.[0] || 'wordpress'
      ));
    }
    if (body.heartbeatIntervalSeconds) setIntervalSeconds(body.heartbeatIntervalSeconds);
    setTenantId((current) => current || body.tenants?.[0]?.tenantId || '');
  };

  useEffect(() => {
    load()
      .catch(() => setError('Installations could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!issued) return;
    credentialRef.current?.focus();
  }, [issued]);

  const run = async (path: string, init: RequestInit) => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const response = await request(path, init);
      const body = await response.json() as ListResponse;
      if (!response.ok || !body.success) {
        setError(body.error || 'The installation action failed.');
        return;
      }
      if (body.credential) {
        setCopyMessage('');
        setIssued(body.credential);
      }
      await load();
    } catch {
      setError('The installation action failed.');
    } finally {
      setPending(false);
      setPendingAction(null);
    }
  };

  const register = async (event: FormEvent) => {
    event.preventDefault();
    await run('/api/admin/chat-connect/installations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId,
        integrationTechnology,
        addonVersion: addonVersion.trim() || undefined,
        widgetVersion: widgetVersion.trim() || undefined,
        frontendVisibility,
      }),
    });
  };

  const copyCredential = async () => {
    if (!issued) return;
    const value = `${issued.keyId}.${issued.secret}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopyMessage('Credential copied to the clipboard.');
    } catch {
      credentialInputRef.current?.select();
      setCopyMessage('Clipboard is unavailable. Select the credential and copy it manually.');
    }
  };

  const dismissCredential = () => {
    setIssued(null);
    setCopyMessage('');
    titleRef.current?.focus();
  };

  const normalizedQuery = query.trim().toLowerCase();
  const visible = installations.filter((installation) => {
    if (tenantFilter && tenantFilter !== 'all' && installation.tenantKey !== tenantFilter) return false;
    if (normalizedQuery && !installationText(installation).includes(normalizedQuery)) return false;
    if (authorizationFilter !== 'all' && installation.authorizationStatus !== authorizationFilter) return false;
    if (healthFilter !== 'all' && installation.connectionHealth !== healthFilter) return false;
    return true;
  });
  const clearFilters = () => {
    setQuery('');
    setAuthorizationFilter('all');
    setHealthFilter('all');
  };
  const filtersActive = Boolean(normalizedQuery) || authorizationFilter !== 'all' || healthFilter !== 'all';
  const actionCopy = pendingAction ? ACTION_COPY[pendingAction.action] : null;

  return (
    <section className="space-y-6" aria-labelledby={titleId} aria-busy={loading}>
      <AdminPageIntro id={titleId} title="Chat Connect installations" headingRef={titleRef}>
          <p>
            Authorization, frontend visibility, and connection health are separate from tenant chat entitlement.
            A verified heartbeat is expected about every {Math.round(intervalSeconds / 60)} minutes.
            Unknown means no verified heartbeat has been recorded. The central API being available does not mark an installation Connected.
          </p>
      </AdminPageIntro>

      {error ? (
        <AdminError
          message={error}
          onRetry={() => { void load().catch(() => setError('Installations could not be loaded.')); }}
        />
      ) : null}

      {issued ? (
        <div
          ref={credentialRef}
          tabIndex={-1}
          role="region"
          aria-labelledby={credentialTitleId}
          className="border-l-4 border-amber-800 bg-amber-50 px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        >
          <h3 id={credentialTitleId} className="text-sm font-semibold text-zinc-900">Credential shown once</h3>
          <p id={credentialHelpId} className="mt-1 text-sm leading-6 text-zinc-800">
            Copy it into the connector server configuration. It is not stored in this browser and will not be shown again.
          </p>
          <p role="status" className="sr-only">A new installation credential is ready.</p>
          <label htmlFor={credentialFieldId} className="mt-3 block text-sm font-semibold text-zinc-900">
            Installation credential
          </label>
          <input
            ref={credentialInputRef}
            id={credentialFieldId}
            readOnly
            value={`${issued.keyId}.${issued.secret}`}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={credentialHelpId}
            className={`${adminControlClass} font-mono text-xs break-all`}
          />
          {copyMessage ? <p role="status" className="mt-2 text-sm text-zinc-800">{copyMessage}</p> : null}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => { void copyCredential(); }} className={adminSecondaryButtonClass}>
              Copy credential
            </button>
            <button type="button" onClick={dismissCredential} className={adminPrimaryButtonClass}>
              I have stored this credential
            </button>
          </div>
        </div>
      ) : null}

      {loading ? <AdminLoading label="Loading Chat Connect installations." /> : null}

      {canManage && !loading ? (
        <form onSubmit={register} className="grid gap-4 rounded-2xl border border-zinc-500 bg-white p-4 sm:p-6 md:grid-cols-2">
          <h3 className="text-base font-semibold text-zinc-900 md:col-span-2">Register an installation</h3>
          <AdminField id={`${titleId}-tenant`} label="Tenant" hint="Required. Registering an installation does not activate the tenant.">
            {({ id, describedBy }) => (
              <select id={id} value={tenantId} onChange={(event) => setTenantId(event.target.value)} aria-describedby={describedBy} className={adminControlClass}>
                {tenants.map((tenant) => (
                  <option key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.displayName} ({tenant.tenantId})
                  </option>
                ))}
              </select>
            )}
          </AdminField>
          <AdminField id={`${titleId}-technology`} label="Integration technology" hint="The connector technology for this registration.">
            {({ id, describedBy }) => (
              <select id={id} value={integrationTechnology} onChange={(event) => setIntegrationTechnology(event.target.value)} aria-describedby={describedBy} className={adminControlClass}>
                {technologies.map((technology) => (
                  <option key={technology} value={technology}>{technology}</option>
                ))}
              </select>
            )}
          </AdminField>
          <AdminField id={`${titleId}-addon`} label="Add-on version" hint="Optional. Leave blank if the connector has not reported one.">
            {({ id, describedBy }) => (
              <input id={id} value={addonVersion} onChange={(event) => setAddonVersion(event.target.value)} aria-describedby={describedBy} className={adminControlClass} />
            )}
          </AdminField>
          <AdminField id={`${titleId}-widget`} label="Widget version" hint="Optional. Leave blank if the connector has not reported one.">
            {({ id, describedBy }) => (
              <input id={id} value={widgetVersion} onChange={(event) => setWidgetVersion(event.target.value)} aria-describedby={describedBy} className={adminControlClass} />
            )}
          </AdminField>
          <AdminField id={`${titleId}-visibility`} label="Frontend visibility" hint="Hidden keeps the connector off the storefront until you choose Visible. This does not change tenant entitlement.">
            {({ id, describedBy }) => (
              <select
                id={id}
                value={frontendVisibility}
                onChange={(event) => setFrontendVisibility(event.target.value === 'visible' ? 'visible' : 'hidden')}
                aria-describedby={describedBy}
                className={adminControlClass}
              >
                <option value="hidden">Hidden</option>
                <option value="visible">Visible</option>
              </select>
            )}
          </AdminField>
          <div className="flex items-end">
            <button type="submit" disabled={pending || !tenantId} className={adminPrimaryButtonClass}>
              Register installation
            </button>
          </div>
        </form>
      ) : null}

      {!loading && installations.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <AdminField id={`${titleId}-search`} label="Search installations" hint="Matches tenant, installation id, technology, or version in the loaded list.">
            {({ id, describedBy }) => (
              <input id={id} type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-describedby={describedBy} className={adminControlClass} />
            )}
          </AdminField>
          <AdminField id={`${titleId}-authorization`} label="Authorization" hint="Filters the loaded list.">
            {({ id, describedBy }) => (
              <select id={id} value={authorizationFilter} onChange={(event) => setAuthorizationFilter(event.target.value as typeof authorizationFilter)} aria-describedby={describedBy} className={adminControlClass}>
                <option value="all">All authorization states</option>
                <option value="registered">Registered</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="revoked">Revoked</option>
              </select>
            )}
          </AdminField>
          <AdminField id={`${titleId}-health`} label="Connection" hint="Unknown means no verified heartbeat has been recorded.">
            {({ id, describedBy }) => (
              <select id={id} value={healthFilter} onChange={(event) => setHealthFilter(event.target.value as typeof healthFilter)} aria-describedby={describedBy} className={adminControlClass}>
                <option value="all">All connection states</option>
                <option value="unknown">Unknown</option>
                <option value="connected">Connected</option>
                <option value="stale">Stale</option>
                <option value="disconnected">Disconnected</option>
              </select>
            )}
          </AdminField>
        </div>
      ) : null}

      {!loading ? (
        <p aria-live="polite" className="text-sm text-zinc-700">
          {visible.length === installations.length
            ? `${installations.length} ${installations.length === 1 ? 'installation' : 'installations'}`
            : `${visible.length} of ${installations.length} installations`}
        </p>
      ) : null}

      {!loading && !error && installations.length === 0 ? (
        <AdminEmpty title="No installations are visible" description="No installations are visible for this account." />
      ) : null}

      {!loading && installations.length > 0 && visible.length === 0 ? (
        <div className="space-y-3">
          <AdminEmpty
            title="No installations match"
            description="Nothing matches the current search or filters."
          />
          {filtersActive ? (
            <button type="button" onClick={clearFilters} className={adminSecondaryButtonClass}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && visible.length > 0 ? (
        <>
          <ul className="space-y-3 xl:hidden">
            {visible.map((installation) => (
              <li key={installation.id} className="rounded-2xl border border-zinc-500 bg-white p-4">
                <InstallationSummary installation={installation} />
                <InstallationActions
                  installation={installation}
                  canManage={canManage}
                  pending={pending}
                  onAction={(action) => setPendingAction({ installation, action })}
                />
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-2xl border border-zinc-500 bg-white xl:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Chat Connect installation records</caption>
              <thead>
                <tr className="border-b border-zinc-200">
                  {['Tenant', 'Installation', 'Authorization', 'Connection', 'Visibility', 'Timestamps', ...(canManage ? ['Actions'] : [])].map((heading) => (
                    <th key={heading} scope="col" className="px-4 py-3 text-xs font-semibold text-zinc-600">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((installation) => {
                  const registered = registeredStamp(installation);
                  return (
                    <tr key={installation.id} className="border-t border-zinc-200 align-top">
                      <td className="px-4 py-4 text-sm text-zinc-800">
                        <div className="font-semibold text-zinc-900">{installationName(installation)}</div>
                        <div className="text-zinc-700">{installation.tenantDisplayName}</div>
                        <div className="text-xs text-zinc-700">{installation.tenantKey}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-800">
                        <InstallationIdentity installation={installation} />
                      </td>
                      <td className="px-4 py-4"><AdminStatus label={STATUS_LABEL[installation.authorizationStatus]} tone={STATUS_TONE[installation.authorizationStatus]} /></td>
                      <td className="px-4 py-4"><AdminStatus label={HEALTH_LABEL[installation.connectionHealth]} tone={HEALTH_TONE[installation.connectionHealth]} /></td>
                      <td className="px-4 py-4"><AdminStatus label={VISIBILITY_LABEL[installation.frontendVisibility]} tone={VISIBILITY_TONE[installation.frontendVisibility]} /></td>
                      <td className="px-4 py-4 text-xs leading-5 text-zinc-700">
                        <div>{registered.label}: {registered.value}</div>
                        <div>Verified activation: {installation.activatedAt ? stamp(installation.activatedAt) : 'Not known'}</div>
                        <div>Last verified heartbeat: {installation.lastVerifiedHeartbeatAt ? stamp(installation.lastVerifiedHeartbeatAt) : 'None'}</div>
                        <div>Last authenticated activity: {installation.lastAuthenticatedActivityAt ? stamp(installation.lastAuthenticatedActivityAt) : 'None'}</div>
                      </td>
                      {canManage ? (
                        <td className="px-4 py-4">
                          <InstallationActions
                            installation={installation}
                            canManage={canManage}
                            pending={pending}
                            onAction={(action) => setPendingAction({ installation, action })}
                          />
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <ChatConfirmDialog
        open={Boolean(pendingAction && actionCopy)}
        title={actionCopy?.title ?? 'Confirm installation change'}
        body={pendingAction && actionCopy ? actionCopy.body(installationName(pendingAction.installation)) : 'Confirm this installation change.'}
        confirmLabel={actionCopy?.confirm ?? 'Confirm'}
        variant={actionCopy?.variant ?? 'danger'}
        isConfirming={pending}
        onCancel={() => { if (!pending) setPendingAction(null); }}
        onConfirm={() => {
          if (!pendingAction) return;
          void run(`/api/admin/chat-connect/installations/${pendingAction.installation.id}/${pendingAction.action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
          });
        }}
      />
    </section>
  );
}

function InstallationIdentity({ installation }: { installation: Installation }) {
  return (
    <>
      <div>{installation.integrationTechnology}</div>
      <div className="font-mono text-xs break-all text-zinc-700">{installation.id}</div>
      <div>Add-on {installation.addonVersion ?? 'Not reported'}</div>
      <div>Widget {installation.widgetVersion ?? 'Not reported'}</div>
      {installation.classification === 'first-party' ? <div className="text-zinc-700">First-party site chat</div> : null}
      {installation.legacyEnvBinding ? <div className="text-zinc-700">Established environment binding</div> : null}
    </>
  );
}

function InstallationSummary({ installation }: { installation: Installation }) {
  const registered = registeredStamp(installation);
  return (
    <>
      <h3 className="text-base font-semibold text-zinc-900">{installationName(installation)}</h3>
      <p className="mt-1 text-sm text-zinc-700">{installation.tenantKey}</p>
      <div className="mt-3 text-sm text-zinc-800">
        <InstallationIdentity installation={installation} />
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        <div>
          <dt className="text-xs font-semibold text-zinc-600">Authorization</dt>
          <dd className="mt-1"><AdminStatus label={STATUS_LABEL[installation.authorizationStatus]} tone={STATUS_TONE[installation.authorizationStatus]} /></dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-zinc-600">Connection</dt>
          <dd className="mt-1"><AdminStatus label={HEALTH_LABEL[installation.connectionHealth]} tone={HEALTH_TONE[installation.connectionHealth]} /></dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-zinc-600">Visibility</dt>
          <dd className="mt-1"><AdminStatus label={VISIBILITY_LABEL[installation.frontendVisibility]} tone={VISIBILITY_TONE[installation.frontendVisibility]} /></dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-zinc-600">{registered.label}</dt>
          <dd className="text-zinc-800">{registered.value}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-zinc-600">Last verified heartbeat</dt>
          <dd className="text-zinc-800">{installation.lastVerifiedHeartbeatAt ? stamp(installation.lastVerifiedHeartbeatAt) : 'None'}</dd>
        </div>
      </dl>
    </>
  );
}

function InstallationActions({
  installation,
  canManage,
  pending,
  onAction,
}: {
  installation: Installation;
  canManage: boolean;
  pending: boolean;
  onAction: (action: InstallationAction) => void;
}) {
  if (!canManage) return null;
  return (
    <div className="mt-4 flex flex-col items-stretch gap-2 xl:mt-0 xl:items-start">
      {installation.authorizationStatus === 'active' ? (
        <button type="button" disabled={pending} className={adminSecondaryButtonClass} onClick={() => onAction('suspend')}>Suspend</button>
      ) : null}
      {installation.authorizationStatus === 'suspended' ? (
        <button type="button" disabled={pending} className={adminSecondaryButtonClass} onClick={() => onAction('reactivate')}>Reactivate</button>
      ) : null}
      {installation.authorizationStatus !== 'revoked' ? (
        <>
          <button type="button" disabled={pending} className={adminDangerButtonClass} onClick={() => onAction('revoke')}>Revoke</button>
          <button type="button" disabled={pending} className={adminSecondaryButtonClass} onClick={() => onAction('rotate-credentials')}>Rotate credentials</button>
        </>
      ) : null}
    </div>
  );
}
