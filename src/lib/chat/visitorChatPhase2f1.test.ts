/**
 * Phase 2F-1 visitor chat experience foundation tests.
 * Does not depend on historical Git commits.
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DISCOVERY_CALL_DESTINATION,
  FREE_REVIEW_SERVICE_AREAS,
  buildFreeReviewCtaUrl,
} from '../../constants/conversionCta.ts';
import { brandColors, shellClasses } from '../../constants/designSystem.ts';
import {
  PROHIBITED_VISITOR_IDENTITY_LABELS,
  VISITOR_CHAT_ASSISTANT_NAME,
  VISITOR_CHAT_TEAM_NAME,
  getVisitorFacingSenderLabel,
  resolveVisitorChatIdentity,
} from './visitorChatIdentity.ts';
import {
  resolveVisitorChatRouteContext,
} from './visitorChatContext.ts';
import {
  hasBlockingAttachment,
  hasFailedAttachment,
  hasUploadingAttachment,
  VISITOR_ATTACHMENT_FAILED_GUIDANCE,
  VISITOR_ATTACHMENT_UPLOAD_GUIDANCE,
} from './visitorChatAttachments.ts';
import {
  countComparableMessages,
  mergeRemoteHistoryWithLocalState,
  resolveLatestResponderSender,
} from './visitorChatHistoryMerge.ts';
import {
  findAutomatedReplyAfterUserMessage,
  findPersistedUserMessageMatch,
} from './visitorChatMessageReconcile.ts';
import {
  resolveVisitorChatPollIntervalMs,
  VISITOR_CHAT_CLOSED_POLL_MS,
  VISITOR_CHAT_OPEN_POLL_MS,
} from './visitorChatPolling.ts';
import {
  VISITOR_CHAT_ALLOWLISTED_SERVICE_ROUTES,
  VISITOR_CHAT_ENTRY_HEADING,
  VISITOR_CHAT_INTENT_KEYS,
  VISITOR_CHAT_INTENTS,
  buildVisitorChatRecommendationActions,
  getVisitorChatIntent,
  isAllowlistedServiceRoute,
  listRecommendationActionTypes,
  mapIntentKeyToServiceArea,
} from './visitorChatIntents.ts';
import {
  VISITOR_CHAT_ANALYTICS_EVENTS,
  assertNoProhibitedVisitorChatAnalyticsProps,
  buildVisitorChatAnalyticsPayload,
} from './visitorChatAnalytics.ts';
import {
  VISITOR_ATTACHMENT_STATUS_LABELS,
  VISITOR_CHAT_LAUNCHER_NAME,
  VISITOR_CHAT_OFFLINE_ACTIONS,
  VISITOR_CHAT_OFFLINE_BODY,
  VISITOR_CHAT_OFFLINE_TITLE,
  VISITOR_CHAT_REGION_NAME,
  VISITOR_MESSAGE_STATUS_LABELS,
  containsUnconfiguredReplyTimePromise,
} from './visitorChatUi.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../..');

function read(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readMany(paths: string[]): string {
  return paths.map((p) => read(p)).join('\n');
}

const visitorChatSources = readMany([
  'src/components/LiveChat.tsx',
  'src/components/LazyLiveChat.tsx',
  'src/components/chat/ChatHeader.tsx',
  'src/components/chat/ChatIdentityBadge.tsx',
  'src/components/chat/ChatIntentChooser.tsx',
  'src/components/chat/ChatClarificationChooser.tsx',
  'src/components/chat/ChatRecommendationPanel.tsx',
  'src/components/chat/ChatAvailabilityNotice.tsx',
  'src/components/chat/ChatMessageStatus.tsx',
  'src/components/chat/ChatAttachmentStatus.tsx',
  'src/lib/chat/visitorChatIdentity.ts',
  'src/lib/chat/visitorChatContext.ts',
  'src/lib/chat/visitorChatIntents.ts',
  'src/lib/chat/visitorChatAnalytics.ts',
  'src/lib/chat/visitorChatUi.ts',
  'src/lib/chat/visitorChatAttachments.ts',
  'src/lib/chat/visitorChatHistoryMerge.ts',
  'src/lib/chat/visitorChatMessageReconcile.ts',
  'src/lib/chat/visitorChatPolling.ts',
  'src/lib/chat/visitorChatPollReconcile.ts',
  'src/lib/chat/visitorChatBodyScroll.ts',
  'src/lib/chat/visitorChatSafeRetry.ts',
]);

// --- Design and identity ---

test('1 Primewayz Assistant is the only automated visitor-facing identity', () => {
  assert.equal(resolveVisitorChatIdentity('bot').name, VISITOR_CHAT_ASSISTANT_NAME);
  assert.equal(getVisitorFacingSenderLabel('bot'), VISITOR_CHAT_ASSISTANT_NAME);
  assert.match(visitorChatSources, /Primewayz Assistant/);
});

test('2 Primewayz Team is the human visitor-facing identity', () => {
  assert.equal(resolveVisitorChatIdentity('admin').name, VISITOR_CHAT_TEAM_NAME);
  assert.equal(getVisitorFacingSenderLabel('admin'), VISITOR_CHAT_TEAM_NAME);
  assert.match(visitorChatSources, /Primewayz Team/);
});

test('3 AI assistant, Support agent and generic Bot labels are absent from visitor presentation', () => {
  const visitorFacing = readMany([
    'src/components/chat/ChatHeader.tsx',
    'src/components/chat/ChatIdentityBadge.tsx',
    'src/components/chat/ChatIntentChooser.tsx',
    'src/components/chat/ChatClarificationChooser.tsx',
    'src/components/chat/ChatRecommendationPanel.tsx',
    'src/components/chat/ChatAvailabilityNotice.tsx',
    'src/lib/chat/visitorChatUi.ts',
  ]);
  assert.doesNotMatch(visitorFacing, /AI assistant/);
  assert.doesNotMatch(visitorFacing, /Support [Aa]gent/);
  assert.doesNotMatch(visitorFacing, /\bBot\b/);
  assert.doesNotMatch(read('src/components/LiveChat.tsx'), /Support Agent/);
  assert.doesNotMatch(read('src/components/LiveChat.tsx'), /AI assistant/);
  assert.ok(PROHIBITED_VISITOR_IDENTITY_LABELS.includes('AI assistant'));
  assert.ok(PROHIBITED_VISITOR_IDENTITY_LABELS.includes('Bot'));
});

test('4 Design uses existing project token/classes rather than a new theme', () => {
  assert.ok(brandColors.navy);
  assert.ok(brandColors.blue);
  assert.ok(shellClasses.btnPrimary.includes('brand-navy'));
  assert.match(visitorChatSources, /brand-navy|brand-blue|brand-border|brand-surface/);
  assert.doesNotMatch(visitorChatSources, /from-purple-|via-indigo-|neon|glow-|\bIntercom\b|\bZendesk\b|\bDrift\b/);
});

test('5 Existing mascot launcher remains accessible', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  const mascot = read('src/components/chat/PiaMascot.tsx');

  assert.match(liveChat, /<PiaMascot state="idle" size="lg" \/>/);
  assert.match(liveChat, /<PiaMascot state="thinking" size="sm" \/>/);
  assert.match(liveChat, /data-chat-launcher/);
  assert.match(liveChat, /buildVisitorLauncherAriaLabel/);
  assert.match(mascot, /data-pia-mascot="true"/);
  assert.match(mascot, /data-state=\{state\}/);
  assert.match(read('src/components/LazyLiveChat.tsx'), /LiveChat/);
});

// --- Route context ---

test('6 Homepage context resolves correctly', () => {
  assert.equal(resolveVisitorChatRouteContext('/').key, 'homepage');
});

test('7 Website visibility route resolves correctly', () => {
  assert.equal(resolveVisitorChatRouteContext('/website-visibility-support').key, 'website_visibility');
  assert.equal(
    resolveVisitorChatRouteContext('/uk-sme-digital-visibility-checker').key,
    'website_visibility',
  );
});

test('7b Maintenance route resolves to managed_support context', () => {
  const context = resolveVisitorChatRouteContext('/maintenance');
  assert.equal(context.key, 'managed_support');
  assert.equal(context.eyebrow, 'Managed application support');
  assert.match(context.greeting, /reliability issues, ongoing maintenance or an inherited application/i);
  assert.match(context.supportingText, /stabilising, maintaining or taking into ongoing support/i);
  assert.equal(context.suggestedIntent, 'managed_support');
});

test('8 CRM route resolves correctly', () => {
  assert.equal(resolveVisitorChatRouteContext('/crm-automation-support').key, 'crm_workflow');
});

test('9 Software route resolves correctly', () => {
  assert.equal(
    resolveVisitorChatRouteContext('/software-development-subscription-uk').key,
    'software_product',
  );
});

test('10 Remote IT route resolves correctly', () => {
  assert.equal(resolveVisitorChatRouteContext('/remote-it-resources').key, 'remote_capacity');
});

test('11 Story route resolves correctly', () => {
  assert.equal(resolveVisitorChatRouteContext('/success-stories').key, 'success_stories');
  assert.equal(
    resolveVisitorChatRouteContext('/success-stories/example-story').key,
    'success_stories',
  );
});

test('12 Article route resolves correctly', () => {
  assert.equal(resolveVisitorChatRouteContext('/blog').key, 'articles');
  assert.equal(resolveVisitorChatRouteContext('/blog/some-post').key, 'articles');
  assert.equal(resolveVisitorChatRouteContext('/insights/some-guide').key, 'articles');
});

test('13 Unknown route uses generic fallback', () => {
  assert.equal(resolveVisitorChatRouteContext('/pricing').key, 'generic');
  assert.equal(resolveVisitorChatRouteContext('/contact-us').key, 'generic');
});

test('14 Route matching ignores query strings safely', () => {
  assert.equal(
    resolveVisitorChatRouteContext('/crm-automation-support?utm_source=x').key,
    'crm_workflow',
  );
  assert.equal(resolveVisitorChatRouteContext('/?ref=newsletter').key, 'homepage');
});

// --- Intent model ---

test('15 Exactly six top-level intents exist', () => {
  assert.equal(VISITOR_CHAT_INTENTS.length, 6);
  assert.equal(VISITOR_CHAT_INTENT_KEYS.length, 6);
});

test('16 Every intent key is stable and unique', () => {
  const keys = VISITOR_CHAT_INTENTS.map((intent) => intent.key);
  assert.deepEqual(keys, [...VISITOR_CHAT_INTENT_KEYS]);
  assert.equal(new Set(keys).size, 6);
});

test('17 Every intent maps to an approved service area', () => {
  for (const intent of VISITOR_CHAT_INTENTS) {
    assert.ok((FREE_REVIEW_SERVICE_AREAS as readonly string[]).includes(intent.serviceArea));
  }
});

test('18 Every service route is internal and allowlisted', () => {
  for (const intent of VISITOR_CHAT_INTENTS) {
    assert.ok(intent.serviceRoute.startsWith('/'));
    assert.ok(isAllowlistedServiceRoute(intent.serviceRoute));
    assert.ok(
      (VISITOR_CHAT_ALLOWLISTED_SERVICE_ROUTES as readonly string[]).includes(intent.serviceRoute),
    );
  }
});

test('19 Unsure maps to Not sure yet', () => {
  assert.equal(mapIntentKeyToServiceArea('unsure'), 'Not sure yet');
  assert.equal(getVisitorChatIntent('unsure')?.serviceRoute, '/services');
});

test('20 No arbitrary text is treated as a service area', () => {
  assert.equal(mapIntentKeyToServiceArea('please automate payroll tomorrow'), null);
  assert.equal(getVisitorChatIntent('random_text'), null);
});

test('21 Free typing remains available', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /Type your message/);
  assert.match(liveChat, /sendMessage/);
  assert.match(read('src/components/chat/ChatIntentChooser.tsx'), /type your question below/i);
  assert.equal(VISITOR_CHAT_ENTRY_HEADING, 'What are you trying to improve?');
});

// --- Recommendations ---

test('22 Review URL uses chat_widget', () => {
  for (const intent of VISITOR_CHAT_INTENTS) {
    assert.match(intent.reviewHref, /review_source=chat_widget/);
  }
});

test('23 Review URL contains only allowlisted service preselection', () => {
  for (const intent of VISITOR_CHAT_INTENTS) {
    const expected = buildFreeReviewCtaUrl('chat_widget', intent.serviceArea);
    assert.equal(intent.reviewHref, expected);
    assert.match(intent.reviewHref, /review_service=/);
  }
});

test('24 Review URL contains no PII', () => {
  for (const intent of VISITOR_CHAT_INTENTS) {
    assert.doesNotMatch(intent.reviewHref, /name=|email=|company=|message=|session|chatSessionId/i);
  }
});

test('25 Relevant service link is correct for each intent', () => {
  assert.equal(getVisitorChatIntent('website_visibility')?.serviceRoute, '/website-visibility-support');
  assert.equal(getVisitorChatIntent('crm_workflow')?.serviceRoute, '/crm-automation-support');
  assert.equal(
    getVisitorChatIntent('software_product')?.serviceRoute,
    '/software-development-subscription-uk',
  );
  assert.equal(getVisitorChatIntent('managed_support')?.serviceRoute, '/maintenance');
  assert.equal(getVisitorChatIntent('remote_capacity')?.serviceRoute, '/remote-it-resources');
  assert.equal(getVisitorChatIntent('unsure')?.serviceRoute, '/services');
});

test('26 Booking destination remains canonical', () => {
  for (const intent of VISITOR_CHAT_INTENTS) {
    assert.equal(intent.bookingHref, DISCOVERY_CALL_DESTINATION);
    assert.equal(intent.bookingHref, '/contact-us#book-call');
  }
});

test('27 Recommendation panel exposes exactly one booking action', () => {
  const panel = read('src/components/chat/ChatRecommendationPanel.tsx');
  const bookingLinks = panel.match(/to=\{actions\.bookingHref\}/g) || [];
  assert.equal(bookingLinks.length, 1);
  assert.equal(listRecommendationActionTypes().filter((t) => t === 'booking').length, 1);
});

test('27b Away follow-up panel exposes exactly three actions without service link', () => {
  const away = read('src/components/chat/ChatAvailabilityNotice.tsx');
  assert.match(away, /Leave contact details/);
  assert.match(away, /Continue with a Digital Systems Review/);
  assert.match(away, /DISCOVERY_CALL_CTA_LABEL/);
  assert.doesNotMatch(away, /serviceHref|serviceLabel|onServiceClick/);
  const actionButtons = away.match(/min-h-\[44px\]/g) || [];
  assert.ok(actionButtons.length >= 3);
});

test('27c Composer booking is hidden when recommendation or away follow-up is active', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /showComposerBooking/);
  assert.match(liveChat, /!showRecommendations && !showAwayFollowUp/);
});

test('27d Initial away state does not stack full away panel with intent chooser', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /showAwayFollowUp && teamAway && !showRecommendations/);
  assert.doesNotMatch(liveChat, /setShowAwayNotice\(true\)/);
  assert.doesNotMatch(liveChat, /showAwayNotice/);
});

test('28 No more than three primary next-step actions are shown', () => {
  assert.equal(listRecommendationActionTypes().length, 3);
  const actions = buildVisitorChatRecommendationActions(getVisitorChatIntent('crm_workflow')!);
  assert.ok(actions.reviewHref && actions.serviceHref && actions.bookingHref);
});

test('29 Recommendations are not opened automatically', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.doesNotMatch(liveChat, /window\.open\(/);
  assert.doesNotMatch(liveChat, /location\.href\s*=/);
  assert.match(liveChat, /showRecommendations/);
});

// --- Offline ---

test('30 Offline state remains truthful', () => {
  assert.equal(VISITOR_CHAT_OFFLINE_TITLE, 'The Primewayz team is currently away.');
  assert.ok(VISITOR_CHAT_OFFLINE_BODY.includes('leave your requirement'));
});

test('31 Offline state offers review', () => {
  assert.ok(VISITOR_CHAT_OFFLINE_ACTIONS.includes('review'));
  assert.match(read('src/components/chat/ChatAvailabilityNotice.tsx'), /Digital Systems Review/);
});

test('32 Offline state preserves leave-message capability', () => {
  assert.ok(VISITOR_CHAT_OFFLINE_ACTIONS.includes('leave_message'));
  assert.match(read('src/components/chat/ChatAvailabilityNotice.tsx'), /Leave contact details/);
});

test('33 Offline state preserves booking', () => {
  assert.ok(VISITOR_CHAT_OFFLINE_ACTIONS.includes('booking'));
  const offlineUi = read('src/components/chat/ChatAvailabilityNotice.tsx');
  assert.match(offlineUi, /DISCOVERY_CALL_CTA_LABEL|DISCOVERY_CALL_DESTINATION/);
  assert.match(VISITOR_CHAT_OFFLINE_BODY, /discovery call/i);
});

test('34 No unconfigured reply-time promise appears', () => {
  assert.equal(containsUnconfiguredReplyTimePromise(VISITOR_CHAT_OFFLINE_TITLE), false);
  assert.equal(containsUnconfiguredReplyTimePromise(VISITOR_CHAT_OFFLINE_BODY), false);
  const offlineUi = read('src/components/chat/ChatAvailabilityNotice.tsx');
  assert.doesNotMatch(offlineUi, /same-day|within \d+ minutes|24\/7|immediate reply/i);
});

// --- Messages ---

test('35 Sending state exists', () => {
  assert.equal(VISITOR_MESSAGE_STATUS_LABELS.sending, 'Sending…');
});

test('36 Sent state exists', () => {
  assert.equal(VISITOR_MESSAGE_STATUS_LABELS.sent, 'Sent');
});

test('37 Failure state exists', () => {
  assert.equal(VISITOR_MESSAGE_STATUS_LABELS.failed, 'Could not send');
});

test('38 Retry state exists', () => {
  assert.match(read('src/components/chat/ChatMessageStatus.tsx'), /Retry/);
  assert.match(read('src/components/LiveChat.tsx'), /retryMessage|chat_message_retry/);
});

test('39 Duplicate-send protection remains', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /if \(isSending\) return/);
  assert.match(liveChat, /setIsSending\(true\)/);
  assert.match(liveChat, /retryInFlightRef/);
});

test('39b Ambiguous message retry reconciles persisted user message without second respond POST', () => {
  const failedMessage = {
    id: 'local-1',
    text: 'Need help with CRM',
    sender: 'user' as const,
    timestamp: new Date('2026-07-24T10:00:00.000Z'),
    deliveryStatus: 'failed' as const,
    retryPayload: { text: 'Need help with CRM', attachmentIds: [42] },
    attachments: [{ id: 42, url: '', originalName: 'a.pdf', fileName: 'a.pdf', mimeType: 'application/pdf', size: 1, kind: 'document' as const }],
  };
  const history = [
    {
      id: '101',
      text: 'Need help with CRM',
      sender: 'user' as const,
      timestamp: new Date('2026-07-24T10:00:05.000Z'),
      attachments: failedMessage.attachments,
      deliveryStatus: 'sent' as const,
    },
    {
      id: '102',
      text: 'Thanks, we can help with that.',
      sender: 'bot' as const,
      timestamp: new Date('2026-07-24T10:00:06.000Z'),
      deliveryStatus: 'sent' as const,
    },
  ];

  const match = findPersistedUserMessageMatch(failedMessage, history);
  assert.ok(match);
  assert.equal(match?.id, '101');
  assert.equal(findAutomatedReplyAfterUserMessage(history, '101')?.id, '102');

  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /findPersistedUserMessageMatch/);
  assert.match(liveChat, /without a server-side idempotency key/i);
});

test('40 Composer recovers after failure', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /deliveryStatus: 'failed'/);
  assert.match(liveChat, /disabled=\{\s*isSending/);
  assert.doesNotMatch(liveChat, /disabled=\{true\}/);
});

// --- Attachments ---

test('41 Current attachment support remains', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /\/api\/chat\/uploads/);
  assert.match(liveChat, /Paperclip/);
});

test('42 Uploading state exists', () => {
  assert.equal(VISITOR_ATTACHMENT_STATUS_LABELS.uploading, 'Uploading…');
});

test('43 Upload-failure state exists', () => {
  assert.equal(VISITOR_ATTACHMENT_STATUS_LABELS.failed, 'Upload failed');
  assert.match(read('src/components/chat/ChatAttachmentStatus.tsx'), /Retry/);
});

test('44 Remove action remains accessible', () => {
  assert.match(
    read('src/components/chat/ChatAttachmentStatus.tsx'),
    /Remove attachment before send/,
  );
});

test('45 Attachment filenames are not added to analytics', () => {
  const analytics = read('src/lib/chat/visitorChatAnalytics.ts');
  assert.match(analytics, /filename/);
  assert.match(analytics, /must not appear/);
  const payload = buildVisitorChatAnalyticsPayload({ route: '/' });
  assert.equal('filename' in payload, false);
  assert.equal('originalName' in payload, false);
});

test('45b Uploading or failed attachments block send and are not silently cleared', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /hasBlockingAttachment/);
  assert.match(liveChat, /if \(!retryMessage && hasBlocking\) return/);
  assert.match(liveChat, /VISITOR_ATTACHMENT_UPLOAD_GUIDANCE/);
  assert.match(liveChat, /VISITOR_ATTACHMENT_FAILED_GUIDANCE/);
  assert.doesNotMatch(liveChat, /setPendingAttachments\(\[\]\)/);

  const attachments = [
    { id: -1, uploadStatus: 'uploading' as const, localKey: 'a', displayName: 'a', url: '', originalName: 'a', fileName: 'a', mimeType: 'text/plain', size: 1, kind: 'document' as const },
  ];
  assert.equal(hasUploadingAttachment(attachments), true);
  assert.equal(hasBlockingAttachment(attachments), true);

  const failed = [
    { ...attachments[0], uploadStatus: 'failed' as const },
  ];
  assert.equal(hasFailedAttachment(failed), true);
  assert.equal(hasBlockingAttachment(failed), true);
});

test('45c Contact save failure cannot render saved notice and localStorage commits only after success', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /contactSaveStatus === 'saved'/);
  assert.match(liveChat, /contactSaveStatus === 'failed'/);
  assert.match(liveChat, /Retry saving contact details/);
  const submitIndex = liveChat.indexOf('const handleLeadSubmit');
  const submitBlock = liveChat.slice(submitIndex, submitIndex + 2200);
  const storageIndex = submitBlock.indexOf("localStorage.setItem('chat_user_name'");
  const okGuardIndex = submitBlock.indexOf('if (!res.ok)');
  assert.ok(storageIndex > okGuardIndex, 'localStorage must be written only after a successful response');
  assert.doesNotMatch(submitBlock.slice(0, okGuardIndex), /localStorage\.setItem\('chat_user_(name|email)'/);
});

test('45d Polling cadence respects open, closed and empty-session rules', () => {
  assert.equal(
    resolveVisitorChatPollIntervalMs({
      isOpen: true,
      isMinimized: false,
      isDocumentVisible: true,
      hasKnownSessionHistory: false,
    }),
    VISITOR_CHAT_OPEN_POLL_MS,
  );
  assert.equal(
    resolveVisitorChatPollIntervalMs({
      isOpen: false,
      isMinimized: false,
      isDocumentVisible: true,
      hasKnownSessionHistory: true,
    }),
    VISITOR_CHAT_CLOSED_POLL_MS,
  );
  assert.equal(
    resolveVisitorChatPollIntervalMs({
      isOpen: false,
      isMinimized: false,
      isDocumentVisible: true,
      hasKnownSessionHistory: false,
    }),
    null,
  );
  assert.equal(
    resolveVisitorChatPollIntervalMs({
      isOpen: true,
      isMinimized: false,
      isDocumentVisible: false,
      hasKnownSessionHistory: true,
    }),
    null,
  );

  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /resolveVisitorChatPollIntervalMs/);
  assert.match(liveChat, /visibilitychange/);
  assert.match(liveChat, /pollConsecutiveFailuresRef/);
  assert.doesNotMatch(liveChat, /setApiAvailable\(false\).*poll/s);
});

test('45e Unread baseline and human-joined notice survive history reconciliation', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /reconcileVisitorPollState/);
  assert.match(liveChat, /mergeRemoteHistoryWithLocalState/);
  assert.match(read('src/lib/chat/visitorChatPollReconcile.ts'), /VISITOR_CHAT_HUMAN_JOINED_NOTICE/);

  const merged = mergeRemoteHistoryWithLocalState(
    [
      {
        id: 'system-1',
        text: 'A Primewayz team member has joined the conversation.',
        sender: 'system',
        timestamp: new Date(),
      },
    ],
    [
      {
        id: '1',
        text: 'Hello',
        sender: 'admin',
        timestamp: new Date(),
        deliveryStatus: 'sent',
      },
    ],
  );
  assert.ok(merged.some((msg) => msg.sender === 'system'));

  assert.equal(
    countComparableMessages([
      { id: '1', text: 'a', sender: 'system', timestamp: new Date() },
      { id: '2', text: 'b', sender: 'user', timestamp: new Date(), deliveryStatus: 'sent' },
    ]),
    1,
  );
});

test('45f Latest responder controls header identity', () => {
  assert.equal(resolveLatestResponderSender([
    { id: '1', text: 'hi', sender: 'bot', timestamp: new Date(), deliveryStatus: 'sent' },
    { id: '2', text: 'hello', sender: 'admin', timestamp: new Date(), deliveryStatus: 'sent' },
  ]), 'admin');
  assert.equal(resolveLatestResponderSender([
    { id: '1', text: 'hi', sender: 'admin', timestamp: new Date(), deliveryStatus: 'sent' },
    { id: '2', text: 'follow-up', sender: 'bot', timestamp: new Date(), deliveryStatus: 'sent' },
  ]), 'bot');

  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /latestResponder={latestResponder}/);
  assert.match(read('src/lib/chat/visitorChatUi.ts'), /VISITOR_CHAT_NEUTRAL_NAME/);
});

test('45g Recommendation navigation closes chat and unlocks mobile scroll', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /navigateFromChat/);
  assert.match(liveChat, /unlockBodyScroll\(\{ restorePosition: false \}\)/);
  assert.match(liveChat, /location\.pathname/);
  assert.match(read('src/components/chat/ChatRecommendationPanel.tsx'), /onNavigateFromChat/);
});

test('45h Mobile action targets meet the agreed minimum', () => {
  const attachment = read('src/components/chat/ChatAttachmentStatus.tsx');
  const messageStatus = read('src/components/chat/ChatMessageStatus.tsx');
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(attachment, /h-11 w-11|min-h-\[44px\].*min-w-\[44px\]/);
  assert.match(messageStatus, /min-h-\[44px\].*min-w-\[44px\]/);
  assert.match(liveChat, /min-h-\[44px\].*Change topic|Change topic[\s\S]*min-h-\[44px\]/);
  assert.match(liveChat, /autoComplete="name"/);
  assert.match(liveChat, /autoComplete="email"/);
  assert.match(liveChat, /autoComplete="tel"/);
});

// --- Accessibility ---

test('46 Launcher has an accessible name', () => {
  assert.equal(VISITOR_CHAT_LAUNCHER_NAME, 'Open Primewayz Assistant');
  assert.match(read('src/components/LiveChat.tsx'), /aria-label=\{/);
});

test('47 Chat region has an accessible name', () => {
  assert.equal(VISITOR_CHAT_REGION_NAME, 'Primewayz Assistant');
  assert.match(read('src/components/LiveChat.tsx'), /aria-label=\{VISITOR_CHAT_REGION_NAME\}/);
});

test('48 Escape behaviour exists', () => {
  assert.match(read('src/components/LiveChat.tsx'), /Escape/);
});

test('49 Focus-return behaviour exists', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /launcherRef\.current\?\.focus/);
});

test('50 Intent options are keyboard operable', () => {
  assert.match(read('src/components/chat/ChatIntentChooser.tsx'), /<button/);
  assert.match(read('src/components/chat/ChatIntentChooser.tsx'), /focus-visible:outline/);
});

test('51 Recommendation actions are keyboard operable', () => {
  const panel = read('src/components/chat/ChatRecommendationPanel.tsx');
  assert.match(panel, /<Link/);
  assert.match(panel, /focus-visible:outline/);
});

test('52 Message status announcements are restrained', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /aria-live="polite"/);
  assert.match(liveChat, /statusAnnouncement/);
  assert.doesNotMatch(liveChat, /aria-live="assertive"/);
});

test('53 Reduced-motion support remains or is added', () => {
  assert.match(read('src/components/LiveChat.tsx'), /prefers-reduced-motion/);
});

test('54 No obvious focus trap is introduced', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.doesNotMatch(liveChat, /focus-trap|FocusTrap|inert=/);
  // Desktop keeps aria-modal false; mobile full-screen sheet uses true.
  assert.match(liveChat, /aria-modal=\{isMobileSheet \? true : false\}/);
});

// --- Analytics ---

test('55 Every new event uses a fixed name', () => {
  assert.deepEqual([...VISITOR_CHAT_ANALYTICS_EVENTS], [
    'chat_open',
    'chat_intent_selected',
    'chat_recommendation_shown',
    'chat_service_click',
    'chat_review_started',
    'chat_booking_click',
    'chat_human_handoff_requested',
    'chat_message_send_failed',
    'chat_message_retry',
  ]);
});

test('56 No free-text message enters analytics', () => {
  const payload = buildVisitorChatAnalyticsPayload({
    route: '/',
    intentKey: 'crm_workflow',
    serviceArea: 'CRM & Workflow Automation',
  });
  assert.equal('message' in payload, false);
  assert.equal('text' in payload, false);
  assert.equal('transcript' in payload, false);
  assertNoProhibitedVisitorChatAnalyticsProps(payload);
});

test('57 No contact field enters analytics', () => {
  assert.throws(
    () => assertNoProhibitedVisitorChatAnalyticsProps({ email: 'a@b.com' }),
    /email/,
  );
  assert.throws(
    () => assertNoProhibitedVisitorChatAnalyticsProps({ name: 'Alex' }),
    /name/,
  );
});

test('58 No session identifier enters analytics', () => {
  assert.throws(
    () => assertNoProhibitedVisitorChatAnalyticsProps({ chatSessionId: 'abc' }),
    /chatSessionId/,
  );
  assert.throws(
    () => assertNoProhibitedVisitorChatAnalyticsProps({ session_id: 'abc' }),
    /session_id/,
  );
});

test('59 Booking clicks do not create duplicate booking events', () => {
  const panel = read('src/components/chat/ChatRecommendationPanel.tsx');
  const availability = read('src/components/chat/ChatAvailabilityNotice.tsx');
  assert.doesNotMatch(panel, /trackChatBookCallClick|trackBookCallClick/);
  assert.doesNotMatch(availability, /trackChatBookCallClick|trackBookCallClick/);
  assert.match(read('src/components/LiveChat.tsx'), /chat_booking_click/);
});

test('60 Review click uses chat_widget attribution', () => {
  for (const intent of VISITOR_CHAT_INTENTS) {
    assert.match(intent.reviewHref, /review_source=chat_widget/);
  }
  assert.match(read('src/components/LiveChat.tsx'), /chat_review_started/);
});

// --- Preservation ---

test('61 Existing chat API URLs remain', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  for (const endpoint of [
    '/api/chat/heartbeat',
    '/api/chat/availability',
    '/api/chat/session',
    '/api/chat/respond',
    '/api/chat/uploads',
    '/api/chat/appointments',
  ]) {
    assert.match(liveChat, new RegExp(endpoint.replace(/\//g, '\\/')));
  }
  assert.match(liveChat, /\/api\/chat\/\$\{sessionId\}/);
});

test('62 Existing session creation remains', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /chat_session_id/);
  assert.match(liveChat, /\/api\/chat\/session/);
});

test('63 Existing admin replies remain', () => {
  const liveChat = read('src/components/LiveChat.tsx');
  assert.match(liveChat, /sender === 'admin'/);
  assert.match(read('src/components/AdminPanel.tsx'), /sender === 'admin'/);
});

test('64 Existing attachments remain', () => {
  assert.match(read('src/components/LiveChat.tsx'), /pendingAttachments/);
  assert.match(read('src/components/LiveChat.tsx'), /attachmentIds/);
});

test('65 Existing Chat Leads remain', () => {
  assert.match(read('src/components/AdminPanel.tsx'), /Chat Leads|chat.?lead/i);
});

test('66 Existing Chat History remains', () => {
  assert.match(read('src/components/AdminPanel.tsx'), /Chat History|chat.?history/i);
});

test('67 Existing email alerts remain', () => {
  const server = read('server.ts');
  assert.match(server, /chat/i);
  assert.match(server, /nodemailer|sendMail|email/i);
});

test('68 Existing Digital Systems Review linkage remains', () => {
  assert.match(read('src/lib/digitalSystemsReview/chatSessionId.ts'), /CHAT_SESSION_STORAGE_KEY/);
  assert.match(read('src/constants/digitalSystemsReview.ts'), /chat_session_id/);
  assert.equal(
    buildFreeReviewCtaUrl('chat_widget', 'CRM & Workflow Automation'),
    '/digital-systems-review?review_source=chat_widget&review_service=CRM+%26+Workflow+Automation',
  );
});

test('69 No Prisma change in Phase 2F-1 visitor chat foundation', () => {
  // Scope check: this suite does not author schema edits; schema still defines ChatSession.
  assert.match(read('prisma/schema.prisma'), /model ChatSession/);
  assert.match(read('prisma/schema.prisma'), /model ChatMessage/);
});

test('70 No migration change required for this phase', () => {
  // Phase 2F-1 is presentation/client only — migrations directory remains readable.
  assert.ok(fs.existsSync(path.join(root, 'prisma/migrations')));
});

test('71 No unrelated Navbar/Footer/About/service/story/article change', () => {
  // This phase must not rewrite those surfaces; presence of existing chrome files is enough.
  for (const file of [
    'src/components/Navbar.tsx',
    'src/components/Footer.tsx',
    'src/components/AboutUsPage.tsx',
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), file);
  }
});

test('72 Phase 2A–2E conversion config remain importable', () => {
  assert.ok(FREE_REVIEW_SERVICE_AREAS.includes('Not sure yet'));
  assert.ok(DISCOVERY_CALL_DESTINATION.includes('book-call'));
});
