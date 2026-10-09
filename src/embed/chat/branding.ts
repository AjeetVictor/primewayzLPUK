/**
 * Tenant branding for the embedded chat, read from `chatWidget` in the capabilities
 * response. Without it the widget keeps the Primewayz labels and palette it has always used,
 * so existing WordPress installs render exactly as before.
 */

import {
  VISITOR_CHAT_ASSISTANT_NAME,
  VISITOR_CHAT_HUMAN_JOINED_NOTICE,
  VISITOR_CHAT_NEUTRAL_NAME,
  VISITOR_CHAT_TEAM_NAME,
} from '../../lib/chat/visitorChatIdentity.ts';
import { DEFAULT_CHAT_AVAILABILITY } from '../../lib/chat/visitorChatTypes.ts';
import {
  VISITOR_CHAT_LAUNCHER_NAME,
  VISITOR_CHAT_REGION_NAME,
  VISITOR_HEADER_STATUS_LABELS,
} from '../../lib/chat/visitorChatUi.ts';
import {
  TENANT_CHAT_THEME_TOKENS,
  type TenantChatThemeToken,
} from '../../lib/chat/tenantChatWidget.ts';
import type { PwChatIntentConfig, PwChatLauncherConfig } from './config.ts';
import { parseLauncherConfig, parseIntentList } from './config.ts';

export type PwChatBranding = {
  /** Tenant site key from the server; null when the tenant publishes no branding. */
  publicSiteKey: string | null;
  panelTitle: string;
  assistantName: string;
  teamName: string;
  launcherLabel: string;
  regionName: string;
  waitingForTeamLabel: string;
  humanJoinedNotice: string;
  /** Shown only until the tenant's availability loads (or when it cannot be loaded). */
  fallbackResponseExpectation: string;
  leadPrompt: string;
  greeting: string;
  supportingText: string;
  theme: Partial<Record<TenantChatThemeToken, string>>;
  launcher: PwChatLauncherConfig;
  intents: PwChatIntentConfig[];
};

export const DEFAULT_PW_CHAT_BRANDING: PwChatBranding = {
  publicSiteKey: null,
  panelTitle: VISITOR_CHAT_NEUTRAL_NAME,
  assistantName: VISITOR_CHAT_ASSISTANT_NAME,
  teamName: VISITOR_CHAT_TEAM_NAME,
  launcherLabel: VISITOR_CHAT_LAUNCHER_NAME,
  regionName: VISITOR_CHAT_REGION_NAME,
  waitingForTeamLabel: VISITOR_HEADER_STATUS_LABELS.waiting_for_team,
  humanJoinedNotice: VISITOR_CHAT_HUMAN_JOINED_NOTICE,
  fallbackResponseExpectation: DEFAULT_CHAT_AVAILABILITY.responseExpectation,
  leadPrompt: 'Leave your details so the Primewayz team can follow up.',
  greeting: 'How can we help?',
  supportingText: 'Ask a question or describe what you need. The Primewayz team reviews every conversation.',
  theme: {},
  launcher: { collisionSelectors: [], bottomOffsetPx: null },
  intents: [],
};

/** CSS custom property set on the shadow root for each theme token. */
export const PW_CHAT_THEME_PROPERTIES: Record<TenantChatThemeToken, string> = {
  text: '--pw-chat-navy',
  launcherBackground: '--pw-chat-launcher-bg',
  launcherHoverBackground: '--pw-chat-launcher-hover-bg',
  headerBackground: '--pw-chat-header-bg',
  headerMuted: '--pw-chat-header-muted',
  action: '--pw-chat-action',
  actionHover: '--pw-chat-action-hover',
  actionDisabled: '--pw-chat-action-disabled',
  accent: '--pw-chat-accent',
  surface: '--pw-chat-surface',
  surfaceAlt: '--pw-chat-surface-alt',
  border: '--pw-chat-border',
  borderSoft: '--pw-chat-border-soft',
  muted: '--pw-chat-muted',
  focusRing: '--pw-chat-focus-ring',
};

const KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const HEX_COLOUR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= max ? trimmed : null;
}

function parseTheme(value: unknown): PwChatBranding['theme'] {
  const theme: PwChatBranding['theme'] = {};
  if (!isObject(value)) return theme;
  for (const token of TENANT_CHAT_THEME_TOKENS) {
    const colour = value[token];
    if (typeof colour === 'string' && HEX_COLOUR.test(colour)) theme[token] = colour;
  }
  return theme;
}

/**
 * Returns the default branding when `chatWidget` is absent or has no valid site key.
 * Individual malformed fields fall back to defaults; nothing from the server is parsed as HTML.
 */
export function resolvePwChatBranding(chatWidget: unknown): PwChatBranding {
  if (!isObject(chatWidget)) return DEFAULT_PW_CHAT_BRANDING;
  const publicSiteKey = typeof chatWidget.publicSiteKey === 'string' && KEY_PATTERN.test(chatWidget.publicSiteKey)
    ? chatWidget.publicSiteKey
    : null;
  if (!publicSiteKey) return DEFAULT_PW_CHAT_BRANDING;

  const panelTitle = text(chatWidget.panelTitle, 80) ?? DEFAULT_PW_CHAT_BRANDING.panelTitle;
  const teamName = text(chatWidget.teamName, 80) ?? DEFAULT_PW_CHAT_BRANDING.teamName;
  return {
    publicSiteKey,
    panelTitle,
    assistantName: text(chatWidget.assistantName, 80) ?? panelTitle,
    teamName,
    launcherLabel: `Open ${panelTitle}`,
    regionName: panelTitle,
    waitingForTeamLabel: `Waiting for the ${teamName}`,
    humanJoinedNotice: `A ${teamName} member has joined the conversation.`,
    fallbackResponseExpectation: `The ${teamName} replies during business hours.`,
    leadPrompt: text(chatWidget.leadPrompt, 200) ?? DEFAULT_PW_CHAT_BRANDING.leadPrompt,
    greeting: text(chatWidget.greeting, 200) ?? DEFAULT_PW_CHAT_BRANDING.greeting,
    supportingText: text(chatWidget.supportingText, 400) ?? '',
    theme: parseTheme(chatWidget.theme),
    launcher: parseLauncherConfig(chatWidget.launcher),
    intents: parseIntentList(chatWidget.intents),
  };
}
