/**
 * Provider-neutral Scheduling types.
 * Calendly is provider implementation #1 — domain models must not be Calendly-named.
 */

export type SchedulingProviderId =
  | 'CALENDLY'
  | 'CAL_COM'
  | 'MICROSOFT_BOOKINGS'
  | 'GOOGLE_CALENDAR'
  | 'CUSTOM';

export type SchedulingConnectionStatus = 'active' | 'inactive' | 'needs_credentials' | 'error';

export type SchedulingCredentialMode = 'environment' | 'encrypted_oauth_future';

export type SchedulingConnectionRef = {
  /** Stable server-side key — never accepted from the browser. */
  connectionKey: string;
  tenantId: string;
  provider: SchedulingProviderId;
  status: SchedulingConnectionStatus;
  credentialMode: SchedulingCredentialMode;
  /** Provider organization / user URI used for webhook ownership mapping. */
  providerOrganizationUri: string | null;
  providerUserUri: string | null;
  /** Env var name for webhook signing secret (never the secret itself). */
  webhookSigningSecretEnv: string | null;
  /** When true, client analytics already emit calendly_* / generate_lead — webhook skips conversion. */
  clientSideAnalyticsOwned: boolean;
};

export type SchedulingEventTypeRef = {
  key: string;
  label: string;
  active: boolean;
  providerEventTypeUri: string | null;
  publicBookingUrl: string | null;
};

export type PublicSchedulingAvailability = {
  enabled: boolean;
  provider: Lowercase<SchedulingProviderId> | null;
  eventTypeKey: string | null;
  publicBookingUrl: string | null;
  canBookFromChat: boolean;
};

export type SchedulingWebhookProcessResult =
  | { status: 'processed'; tenantId: string; appointmentId: string | null; duplicate: false }
  | { status: 'duplicate'; tenantId: string; appointmentId: string | null; duplicate: true }
  | { status: 'ignored'; reason: string }
  | { status: 'rejected'; reason: string };
