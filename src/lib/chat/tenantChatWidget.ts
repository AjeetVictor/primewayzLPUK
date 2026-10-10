/**
 * Tenant-owned visitor chat presentation and approved answers.
 *
 * Served to the embed through GET /api/platform/capabilities (`chatWidget`), so a host page
 * never has to ship branding. Tenants without this config keep the existing Primewayz defaults.
 */

export const TENANT_CHAT_THEME_TOKENS = [
  'text',
  'launcherBackground',
  'launcherHoverBackground',
  'headerBackground',
  'headerMuted',
  'action',
  'actionHover',
  'actionDisabled',
  'accent',
  'surface',
  'surfaceAlt',
  'border',
  'borderSoft',
  'muted',
  'focusRing',
] as const;

export type TenantChatThemeToken = (typeof TENANT_CHAT_THEME_TOKENS)[number];

/** Hex colours only (#rgb, #rrggbb, #rrggbbaa); the widget rejects anything else. */
export type TenantChatTheme = Readonly<Partial<Record<TenantChatThemeToken, string>>>;

export type TenantChatIntent = Readonly<{ key: string; label: string }>;

export type TenantChatLauncherConfig = Readonly<{
  /** Host elements the launcher must sit above. Read only; never moved or hidden. */
  collisionSelectors?: readonly string[];
  /** Minimum launcher distance from the viewport bottom, in px. */
  bottomOffsetPx?: number;
}>;

export type TenantChatWidgetConfig = Readonly<{
  /** Must equal the host's `siteKey`; the widget will not render for a mismatched tenant. */
  publicSiteKey: string;
  panelTitle: string;
  assistantName: string;
  teamName: string;
  greeting: string;
  supportingText: string;
  leadPrompt: string;
  theme: TenantChatTheme;
  launcher?: TenantChatLauncherConfig;
  intents: readonly TenantChatIntent[];
}>;

/** Approved bot answers keyed by intent key. Only the owning tenant's answers are ever used. */
export type TenantChatApprovedAnswers = Readonly<Record<string, string>>;

/**
 * software_services: Primewayz delivery quick replies (discovery calls, plans).
 * reading_membership: no software-service wording reaches the visitor.
 */
export type TenantQuickReplyProfile = 'software_services' | 'reading_membership';
