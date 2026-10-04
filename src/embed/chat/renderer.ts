/**
 * Plain DOM renderer for the embedded chat. All visitor and server text is
 * written with textContent; no HTML strings are parsed anywhere in the widget.
 */

import { getVisitorFacingSenderLabel } from '../../lib/chat/visitorChatIdentity.ts';
import { PUBLIC_CHAT_INPUT_LIMITS } from '../../lib/chat/publicChatInputLimits.ts';
import {
  VISITOR_CHAT_REGION_NAME,
  VISITOR_MESSAGE_STATUS_LABELS,
} from '../../lib/chat/visitorChatUi.ts';
import type { VisitorChatMessage } from '../../lib/chat/visitorChatTypes.ts';
import type { PwChatIntentConfig } from './config.ts';
import { PW_CHAT_STYLES } from './styles.ts';

export const PW_CHAT_HOST_ID = 'pw-chat-root';
const PANEL_ID = 'pw-chat-panel';
const TITLE_ID = 'pw-chat-title';
const SVG_NS = 'http://www.w3.org/2000/svg';

export type PwChatTone = 'online' | 'away' | 'automated' | 'unavailable';
const TONE_CLASSES: readonly string[] = [
  'pw-chat-tone-online',
  'pw-chat-tone-away',
  'pw-chat-tone-automated',
  'pw-chat-tone-unavailable',
];

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function chatIcon(doc: Document): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const path = doc.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.9-.9L3 20.5l1.6-4.7A8.4 8.4 0 1 1 21 11.5z');
  svg.appendChild(path);
  return svg;
}

export type PwChatDom = ReturnType<typeof buildPwChatDom>;

export function buildPwChatDom(doc: Document, shadow: ShadowRoot) {
  const style = el(doc, 'style');
  style.textContent = PW_CHAT_STYLES;

  const root = el(doc, 'div', 'pw-chat-root');

  const launcher = el(doc, 'button', 'pw-chat-launcher');
  launcher.type = 'button';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.setAttribute('aria-expanded', 'false');
  launcher.setAttribute('aria-controls', PANEL_ID);
  const launcherDot = el(doc, 'span', 'pw-chat-launcher-dot');
  launcherDot.setAttribute('aria-hidden', 'true');
  const badge = el(doc, 'span', 'pw-chat-badge');
  badge.setAttribute('aria-hidden', 'true');
  badge.hidden = true;
  launcher.append(chatIcon(doc), launcherDot, badge);

  const panel = el(doc, 'section', 'pw-chat-panel');
  panel.id = PANEL_ID;
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.setAttribute('aria-labelledby', TITLE_ID);

  const header = el(doc, 'div', 'pw-chat-header');
  const heading = el(doc, 'div', 'pw-chat-heading');
  const title = el(doc, 'h2', 'pw-chat-title');
  title.id = TITLE_ID;
  const status = el(doc, 'div', 'pw-chat-status');
  const statusDot = el(doc, 'span', 'pw-chat-status-dot');
  statusDot.setAttribute('aria-hidden', 'true');
  const statusText = el(doc, 'span');
  status.append(statusDot, statusText);
  heading.append(title, status);
  const closeButton = el(doc, 'button', 'pw-chat-close', '\u00d7');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close chat');
  header.append(heading, closeButton);

  const log = el(doc, 'div', 'pw-chat-log');
  log.setAttribute('aria-label', `${VISITOR_CHAT_REGION_NAME} conversation`);
  log.tabIndex = 0;
  const intro = el(doc, 'div', 'pw-chat-intro');
  const introGreeting = el(doc, 'p', 'pw-chat-intro-greeting');
  const introText = el(doc, 'p', 'pw-chat-intro-text');
  const expectation = el(doc, 'p', 'pw-chat-expectation');
  const intents = el(doc, 'div', 'pw-chat-intents');
  intro.append(introGreeting, introText, expectation, intents);
  const messageList = el(doc, 'div');
  messageList.style.display = 'contents';
  log.append(intro, messageList);

  const leadForm = el(doc, 'form', 'pw-chat-lead');
  leadForm.hidden = true;
  leadForm.noValidate = true;
  const leadTitle = el(doc, 'p', 'pw-chat-lead-title', 'Leave your details so the Primewayz team can follow up.');
  const leadName = el(doc, 'input', 'pw-chat-input');
  leadName.type = 'text';
  leadName.autocomplete = 'name';
  leadName.placeholder = 'Your name';
  leadName.maxLength = PUBLIC_CHAT_INPUT_LIMITS.name;
  leadName.setAttribute('aria-label', 'Your name');
  const leadEmail = el(doc, 'input', 'pw-chat-input');
  leadEmail.type = 'email';
  leadEmail.autocomplete = 'email';
  leadEmail.placeholder = 'Email address';
  leadEmail.maxLength = PUBLIC_CHAT_INPUT_LIMITS.email;
  leadEmail.setAttribute('aria-label', 'Email address');
  const leadError = el(doc, 'p', 'pw-chat-msg-meta');
  leadError.hidden = true;
  const leadRow = el(doc, 'div', 'pw-chat-lead-row');
  const leadSave = el(doc, 'button', 'pw-chat-btn', 'Save details');
  leadSave.type = 'submit';
  const leadDismiss = el(doc, 'button', 'pw-chat-btn pw-chat-btn--quiet', 'Not now');
  leadDismiss.type = 'button';
  leadRow.append(leadSave, leadDismiss);
  leadForm.append(leadTitle, leadName, leadEmail, leadError, leadRow);

  const notice = el(doc, 'div', 'pw-chat-notice');
  notice.hidden = true;
  notice.setAttribute('role', 'alert');
  const noticeText = el(doc, 'span', 'pw-chat-notice-text');
  const noticeRetry = el(doc, 'button', 'pw-chat-btn pw-chat-btn--quiet', 'Retry');
  noticeRetry.type = 'button';
  noticeRetry.hidden = true;
  notice.append(noticeText, noticeRetry);

  const composer = el(doc, 'form', 'pw-chat-composer');
  const textarea = el(doc, 'textarea', 'pw-chat-input pw-chat-textarea');
  textarea.rows = 1;
  textarea.maxLength = PUBLIC_CHAT_INPUT_LIMITS.message;
  textarea.placeholder = 'Type your message';
  textarea.setAttribute('aria-label', 'Message');
  const sendButton = el(doc, 'button', 'pw-chat-btn', 'Send');
  sendButton.type = 'submit';
  composer.append(textarea, sendButton);

  const booking = el(doc, 'div', 'pw-chat-booking');
  booking.hidden = true;
  const bookingLink = el(doc, 'a', undefined, 'Book a call with the team');
  bookingLink.target = '_blank';
  bookingLink.rel = 'noopener noreferrer';
  booking.append(bookingLink);

  const announcer = el(doc, 'div', 'pw-chat-sr');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');

  panel.append(header, log, leadForm, notice, composer, booking);
  root.append(launcher, panel, announcer);
  shadow.append(style, root);

  return {
    root, launcher, launcherDot, badge, panel, title, statusDot, statusText, closeButton,
    log, introGreeting, introText, expectation, intents, messageList,
    leadForm, leadName, leadEmail, leadError, leadSave, leadDismiss,
    notice, noticeText, noticeRetry, composer, textarea, sendButton,
    booking, bookingLink, announcer,
  };
}

export function setTone(node: HTMLElement, tone: PwChatTone): void {
  node.classList.remove(...TONE_CLASSES);
  node.classList.add(`pw-chat-tone-${tone}`);
}

export function renderIntents(
  doc: Document,
  container: HTMLElement,
  intents: readonly PwChatIntentConfig[],
  selectedKey: string | null,
  onSelect: (intent: PwChatIntentConfig) => void,
): void {
  container.replaceChildren();
  container.hidden = intents.length === 0;
  for (const intent of intents) {
    const button = el(doc, 'button', 'pw-chat-intent', intent.label);
    button.type = 'button';
    button.setAttribute('aria-pressed', intent.key === selectedKey ? 'true' : 'false');
    button.addEventListener('click', () => onSelect(intent));
    container.append(button);
  }
}

function renderMessage(doc: Document, message: VisitorChatMessage): HTMLElement {
  const item = el(doc, 'div', `pw-chat-msg pw-chat-msg--${message.sender}`);
  if (message.sender !== 'system') {
    item.append(el(doc, 'span', 'pw-chat-msg-label', getVisitorFacingSenderLabel(message.sender)));
  }
  if (message.deletedAt) {
    item.append(el(doc, 'p', 'pw-chat-msg-text pw-chat-msg-deleted', 'This message was deleted.'));
    return item;
  }
  if (message.text) item.append(el(doc, 'p', 'pw-chat-msg-text', message.text));
  for (const attachment of message.attachments ?? []) {
    const name = typeof attachment?.originalName === 'string' ? attachment.originalName : 'file';
    item.append(el(doc, 'span', 'pw-chat-msg-meta', `Attachment: ${name}`));
  }
  if (message.sender === 'user' && message.deliveryStatus === 'sending') {
    item.append(el(doc, 'span', 'pw-chat-msg-meta', VISITOR_MESSAGE_STATUS_LABELS.sending));
  }
  return item;
}

export function renderMessages(
  doc: Document,
  log: HTMLElement,
  list: HTMLElement,
  messages: readonly VisitorChatMessage[],
): void {
  const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  list.replaceChildren(...messages.map((message) => renderMessage(doc, message)));
  if (nearBottom || messages[messages.length - 1]?.sender === 'user') {
    log.scrollTop = log.scrollHeight;
  }
}
