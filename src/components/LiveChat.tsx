import {
  useState,
  useEffect,
  useRef,
  useEffectEvent,
  FormEvent,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  CalendarClock,
  FileText,
} from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import {
  trackChatAppointmentRequested,
  trackChatAttachmentUploaded,
  trackChatBookCallClick,
  trackChatLeadCaptured,
  trackChatMessageSent,
  trackChatOpen,
} from '../lib/analytics';
import { getChatSourcePayload } from '../lib/chatSource';
import { QuotedMessagePreview } from './chat/QuotedMessagePreview';
import { ChatHeader } from './chat/ChatHeader';
import { ChatIdentityBadge } from './chat/ChatIdentityBadge';
import { ChatIntentChooser } from './chat/ChatIntentChooser';
import { ChatClarificationChooser } from './chat/ChatClarificationChooser';
import { ChatRecommendationPanel } from './chat/ChatRecommendationPanel';
import { ChatAvailabilityNotice } from './chat/ChatAvailabilityNotice';
import { ChatMessageStatus } from './chat/ChatMessageStatus';
import { ChatAttachmentStatus } from './chat/ChatAttachmentStatus';
import {
  resolveVisitorChatIdentity,
} from '../lib/chat/visitorChatIdentity';
import { resolveVisitorChatRouteContext } from '../lib/chat/visitorChatContext';
import {
  getVisitorChatIntent,
  type VisitorChatIntentKey,
} from '../lib/chat/visitorChatIntents';
import { trackVisitorChatEvent } from '../lib/chat/visitorChatAnalytics';
import {
  DEFAULT_CHAT_AVAILABILITY,
  isTeamAwayStatus,
  normalizeChatAvailabilityStatus,
  type ChatAttachment,
  type ChatAvailability,
  type PendingChatAttachment,
  type VisitorChatMessage,
} from '../lib/chat/visitorChatTypes';
import {
  buildVisitorLauncherAriaLabel,
  formatVisitorUnreadBadge,
  resolveVisitorHeaderStatus,
  resolveVisitorPresenceTone,
  VISITOR_CHAT_MESSAGE_SAVED,
  VISITOR_CHAT_REGION_NAME,
  VISITOR_PRESENCE_DOT_CLASS,
  VISITOR_PRESENCE_STATUS_LABELS,
} from '../lib/chat/visitorChatUi';
import {
  hasBlockingAttachment,
  hasFailedAttachment,
  hasUploadingAttachment,
  VISITOR_ATTACHMENT_FAILED_GUIDANCE,
  VISITOR_ATTACHMENT_UPLOAD_GUIDANCE,
} from '../lib/chat/visitorChatAttachments';
import {
  countComparableMessages,
  findLatestAdminMessage,
  mergeRemoteHistoryWithLocalState,
  resolveLatestResponderSender,
} from '../lib/chat/visitorChatHistoryMerge';
import {
  findAutomatedReplyAfterUserMessage,
  findPersistedUserMessageMatch,
} from '../lib/chat/visitorChatMessageReconcile';
import { resolveVisitorChatPollIntervalMs } from '../lib/chat/visitorChatPolling';
import {
  isVisitorChatLocalValidationHost,
  reconcileVisitorPollState,
} from '../lib/chat/visitorChatPollReconcile';
import {
  clearBodyScrollStyles as clearBodyScrollStylesHelper,
  lockBodyScroll as lockBodyScrollHelper,
} from '../lib/chat/visitorChatBodyScroll';

function mapHistoryMessage(m: Record<string, unknown>): VisitorChatMessage {
  return {
    id: String(m.id),
    text: String(m.text || ''),
    sender: (m.sender as VisitorChatMessage['sender']) || 'bot',
    timestamp: new Date(String(m.timestamp || Date.now())),
    editedAt: (m.editedAt as string | null | undefined) ?? null,
    deletedAt: (m.deletedAt as string | null | undefined) ?? null,
    replyToId: (m.replyToId as number | null | undefined) ?? null,
    replyTo: (m.replyTo as VisitorChatMessage['replyTo']) ?? null,
    attachments: (m.attachments as ChatAttachment[] | undefined) || [],
    deliveryStatus: 'sent',
  };
}

function createClientMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export const LiveChat = () => {
  const location = useLocation();
  const routeContext = resolveVisitorChatRouteContext(location.pathname || '/');

  const [isOpen, setIsOpen] = useState(false);
  const [hasTrackedChatOpen, setHasTrackedChatOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('primewayz_chat_open_tracked') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<VisitorChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [availability, setAvailability] = useState<ChatAvailability>(DEFAULT_CHAT_AVAILABILITY);
  const [userName, setUserName] = useState(() => localStorage.getItem('chat_user_name') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('chat_user_email') || '');
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSavedNotice, setLeadSavedNotice] = useState(false);
  const [contactSaveStatus, setContactSaveStatus] = useState<
    'idle' | 'saving' | 'saved' | 'failed'
  >('idle');
  const [contactSaveError, setContactSaveError] = useState('');
  const [apiAvailable, setApiAvailable] = useState(true);
  const [serviceDegraded, setServiceDegraded] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<PendingChatAttachment[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    name: userName,
    email: userEmail,
    phone: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
  });
  const [appointmentError, setAppointmentError] = useState('');
  const [selectedIntentKey, setSelectedIntentKey] = useState<VisitorChatIntentKey | null>(
    null,
  );
  const [selectedClarificationKey, setSelectedClarificationKey] = useState<string | null>(null);
  const [showIntentChooser, setShowIntentChooser] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendationTracked, setRecommendationTracked] = useState(false);
  const [showAwayFollowUp, setShowAwayFollowUp] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [humanJoinedNoticeShown, setHumanJoinedNoticeShown] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAwaitingAutomatedReply, setIsAwaitingAutomatedReply] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  );
  const [hasKnownSessionHistory, setHasKnownSessionHistory] = useState(false);

  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('chat_session_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem('chat_session_id', newId);
    return newId;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);
  const lastSeenAdminIdRef = useRef<string | null>(null);
  const messagesRef = useRef<VisitorChatMessage[]>([]);
  const chatIsOpenRef = useRef(false);
  const hasKnownSessionHistoryRef = useRef(false);
  const humanJoinedNoticeShownRef = useRef(false);
  const unreadCountRef = useRef(0);
  const forcePollRef = useRef<(() => void) | null>(null);
  const failedFileByKeyRef = useRef<Map<string, File>>(new Map());
  const retryInFlightRef = useRef<Set<string>>(new Set());
  const pollConsecutiveFailuresRef = useRef(0);

  messagesRef.current = messages;
  // Sync during render; open/close/minimise also write these immediately so
  // in-flight polls never reconcile a closed surface as still open.
  chatIsOpenRef.current = isOpen && !isMinimized;
  hasKnownSessionHistoryRef.current = hasKnownSessionHistory;
  humanJoinedNoticeShownRef.current = humanJoinedNoticeShown;
  unreadCountRef.current = unreadCount;

  const selectedIntent = getVisitorChatIntent(selectedIntentKey);
  const latestResponder = resolveLatestResponderSender(messages);
  const hasAdminReply = latestResponder === 'admin';
  const waitingForTeam = messages.some(
    (msg) => msg.sender === 'user' && msg.deliveryStatus !== 'failed',
  ) && !hasAdminReply && isSending === false;
  const serviceAvailable = apiAvailable && !serviceDegraded;
  const availabilityStatus = normalizeChatAvailabilityStatus(availability.status);
  const presenceTone = resolveVisitorPresenceTone({
    availabilityStatus,
    serviceAvailable,
  });
  const headerStatus = resolveVisitorHeaderStatus({
    availabilityStatus,
    hasAdminReply,
    waitingForTeam: waitingForTeam && Boolean(userEmail),
    serviceAvailable,
  });
  const teamAway = isTeamAwayStatus(availabilityStatus);
  const launcherAriaLabel = buildVisitorLauncherAriaLabel({
    presence: presenceTone,
    unreadCount,
  });
  const unreadBadgeLabel = formatVisitorUnreadBadge(unreadCount);
  const showLauncherChrome = !(isOpen && !isMinimized);
  const hasUploading = hasUploadingAttachment(pendingAttachments);
  const hasFailed = hasFailedAttachment(pendingAttachments);
  const hasBlocking = hasBlockingAttachment(pendingAttachments);
  const showComposerBooking = !showRecommendations && !showAwayFollowUp;
  const prefersReducedMotion =
    typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const announceStatus = useEffectEvent((text: string) => {
    setStatusAnnouncement(text);
  });

  useEffect(() => {
    if (!isOpen || !sessionId) return;

    let cancelled = false;

    const sendVisitorHeartbeat = async () => {
      try {
        await fetch(apiUrl('/api/chat/heartbeat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            userName,
            userEmail,
            ...getChatSourcePayload(),
          }),
        });
      } catch (error) {
        if (!cancelled) {
          console.warn('Chat heartbeat failed', error);
        }
      }
    };

    sendVisitorHeartbeat();
    const heartbeatTimer = window.setInterval(sendVisitorHeartbeat, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeatTimer);
    };
  }, [isOpen, sessionId, userName, userEmail]);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsDocumentVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(apiUrl(`/api/chat/${sessionId}`));
        if (res.ok) {
          const history = await res.json();
          if (!Array.isArray(history)) {
            pollConsecutiveFailuresRef.current += 1;
            setHistoryLoaded(true);
            return;
          }
          setApiAvailable(true);
          pollConsecutiveFailuresRef.current = 0;
          if (history.length > 0) {
            const mapped = history.map((m: Record<string, unknown>) => mapHistoryMessage(m));
            // Baseline load: do not count historical admin messages as unread.
            const baseline = reconcileVisitorPollState({
              previousMessages: [],
              remoteMessages: mapped,
              previousAdminId: null,
              hasKnownSessionHistory: false,
              chatIsOpen: true,
              noticeAlreadyShown: false,
            }, {
              createNoticeId: () => createClientMessageId('system'),
            });
            messagesRef.current = baseline.messages;
            lastSeenAdminIdRef.current = baseline.latestAdminId;
            humanJoinedNoticeShownRef.current = baseline.humanJoinedNoticeShown;
            hasKnownSessionHistoryRef.current = true;
            setHumanJoinedNoticeShown(baseline.humanJoinedNoticeShown);
            setMessages(baseline.messages);
            setShowIntentChooser(false);
            setHasKnownSessionHistory(true);
          }
          setHistoryLoaded(true);
          return;
        }
        if (res.status === 404) {
          pollConsecutiveFailuresRef.current += 1;
        }
      } catch {
        pollConsecutiveFailuresRef.current += 1;
      }
      setHistoryLoaded(true);
    };
    fetchHistory();
  }, [sessionId]);

  const applyPolledHistory = useEffectEvent((mapped: VisitorChatMessage[]) => {
    const result = reconcileVisitorPollState({
      previousMessages: messagesRef.current,
      remoteMessages: mapped,
      previousAdminId: lastSeenAdminIdRef.current,
      hasKnownSessionHistory: hasKnownSessionHistoryRef.current,
      chatIsOpen: chatIsOpenRef.current,
      noticeAlreadyShown: humanJoinedNoticeShownRef.current,
    }, {
      createNoticeId: () => createClientMessageId('system'),
    });

    messagesRef.current = result.messages;
    lastSeenAdminIdRef.current = result.latestAdminId;
    setMessages(result.messages);

    if (result.humanJoinedNoticeShown && !humanJoinedNoticeShownRef.current) {
      humanJoinedNoticeShownRef.current = true;
      setHumanJoinedNoticeShown(true);
    }
    if (result.unreadDelta > 0) {
      const next = unreadCountRef.current + result.unreadDelta;
      unreadCountRef.current = next;
      setUnreadCount(next);
      announceStatus(
        next === 1 ? '1 unread reply' : `${next} unread replies`,
      );
    }
  });

  useEffect(() => {
    const pollIntervalMs = resolveVisitorChatPollIntervalMs({
      isOpen,
      isMinimized,
      isDocumentVisible,
      hasKnownSessionHistory,
    });

    if (pollIntervalMs == null) {
      forcePollRef.current = null;
      return undefined;
    }

    const pollHistory = async () => {
      try {
        const res = await fetch(apiUrl(`/api/chat/${sessionId}`));
        if (!res.ok) {
          pollConsecutiveFailuresRef.current += 1;
          if (pollConsecutiveFailuresRef.current >= 3) {
            setServiceDegraded(true);
          }
          return;
        }
        const history = await res.json();
        if (!Array.isArray(history)) {
          pollConsecutiveFailuresRef.current += 1;
          if (pollConsecutiveFailuresRef.current >= 3) {
            setServiceDegraded(true);
          }
          return;
        }

        setApiAvailable(true);
        setServiceDegraded(false);
        pollConsecutiveFailuresRef.current = 0;

        const mapped = history.map((m: Record<string, unknown>) => mapHistoryMessage(m));
        if (mapped.length > 0) {
          hasKnownSessionHistoryRef.current = true;
          setHasKnownSessionHistory(true);
        }

        const latestRemoteComparable = [...mapped]
          .reverse()
          .find((msg) => msg.sender !== 'system');
        const latestLocalComparable = [...messagesRef.current]
          .reverse()
          .find(
            (msg) =>
              msg.sender !== 'system'
              && !String(msg.id).startsWith('local-')
              && msg.deliveryStatus !== 'failed',
          );
        const latestAdminId = findLatestAdminMessage(mapped)?.id ?? null;

        const shouldApply =
          mapped.length > 0
          && (
            countComparableMessages(mapped)
              !== countComparableMessages(messagesRef.current)
            || latestRemoteComparable?.id !== latestLocalComparable?.id
            || latestAdminId !== lastSeenAdminIdRef.current
          );

        if (shouldApply) {
          applyPolledHistory(mapped);
        }
      } catch {
        pollConsecutiveFailuresRef.current += 1;
        if (pollConsecutiveFailuresRef.current >= 3) {
          setServiceDegraded(true);
        }
      }
    };

    forcePollRef.current = () => {
      void pollHistory();
    };

    const effectiveInterval =
      pollConsecutiveFailuresRef.current >= 3
        ? pollIntervalMs * 2
        : pollIntervalMs;

    void pollHistory();
    const pollTimer = window.setInterval(pollHistory, effectiveInterval);
    return () => {
      forcePollRef.current = null;
      window.clearInterval(pollTimer);
    };
  }, [
    apiAvailable,
    sessionId,
    isOpen,
    isMinimized,
    isDocumentVisible,
    hasKnownSessionHistory,
    applyPolledHistory,
  ]);

  useEffect(() => {
    const isLocalValidationHost = isVisitorChatLocalValidationHost(
      window.location.hostname,
    );
    if (!isLocalValidationHost) {
      return undefined;
    }
    const onForcePoll = () => {
      forcePollRef.current?.();
    };
    window.addEventListener('primewayz-visitor-chat-force-poll', onForcePoll);
    return () => {
      window.removeEventListener('primewayz-visitor-chat-force-poll', onForcePoll);
    };
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(apiUrl('/api/chat/availability'));
        if (res.ok) {
          setAvailability(await res.json());
          setServiceDegraded(false);
        } else {
          setServiceDegraded(true);
        }
      } catch {
        setAvailability(DEFAULT_CHAT_AVAILABILITY);
        setServiceDegraded(true);
      }
    };

    fetchAvailability();
    const interval = window.setInterval(fetchAvailability, 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showRecommendations || recommendationTracked || !selectedIntent) return;
    trackVisitorChatEvent('chat_recommendation_shown', {
      route: location.pathname,
      intentKey: selectedIntent.key,
      serviceArea: selectedIntent.serviceArea,
      recommendationType: 'panel',
      availabilityState: availability.status,
    });
    setRecommendationTracked(true);
  }, [
    showRecommendations,
    recommendationTracked,
    selectedIntent,
    location.pathname,
    availability.status,
  ]);

  const clearBodyScrollStyles = useEffectEvent(() => {
    clearBodyScrollStylesHelper(document.body.style);
  });

  const unlockBodyScroll = useEffectEvent((options: { restorePosition: boolean }) => {
    clearBodyScrollStyles();
    if (options.restorePosition) {
      window.scrollTo(0, scrollYRef.current);
    }
  });

  const lockBodyScroll = useEffectEvent(() => {
    scrollYRef.current = lockBodyScrollHelper({
      currentScrollY: window.scrollY,
      bodyStyle: document.body.style,
    });
  });

  const navigateFromChat = useEffectEvent(() => {
    // Clear saved scroll before close cleanup so a later restore cannot jump
    // back to the previous route's position.
    scrollYRef.current = 0;
    chatIsOpenRef.current = false;
    setIsOpen(false);
    setIsMinimized(false);
    unlockBodyScroll({ restorePosition: false });
    window.scrollTo(0, 0);
  });

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    if (isMobile) {
      // Route-change cleanup must not restore the previous page's scroll.
      unlockBodyScroll({ restorePosition: false });
    }
  }, [location.pathname, unlockBodyScroll]);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 639px)').matches;
    if (isOpen && !isMinimized && isMobile) {
      lockBodyScroll();
      // Ordinary same-route close / minimise restores the previous scroll.
      return () => unlockBodyScroll({ restorePosition: true });
    }
    return undefined;
  }, [isOpen, isMinimized, lockBodyScroll, unlockBodyScroll]);

  useEffect(() => {
    if (!isOpen || isMinimized) return undefined;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        chatIsOpenRef.current = false;
        setIsMinimized(true);
        setIsOpen(false);
        window.setTimeout(() => launcherRef.current?.focus(), 0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  useEffect(() => {
    if (!isOpen || isMinimized) return;
    messagesEndRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [messages, isOpen, isMinimized, prefersReducedMotion, showRecommendations]);

  const openChatWidget = () => {
    // Polling / history baseline own lastSeenAdminId — opening must not
    // regress it from stale messagesRef before React applies polled messages.
    chatIsOpenRef.current = true;
    setIsOpen(true);
    setIsMinimized(false);
    unreadCountRef.current = 0;
    setUnreadCount(0);

    if (!hasTrackedChatOpen) {
      trackChatOpen({
        chatStatus: availability.status,
        chatTitle: 'Primewayz Assistant',
        ctaLocation: 'chat_launcher',
      });
      trackVisitorChatEvent('chat_open', {
        route: location.pathname,
        availabilityState: availability.status,
      });

      setHasTrackedChatOpen(true);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('primewayz_chat_open_tracked', 'true');
      }
    }
  };

  const closeChatWidget = () => {
    chatIsOpenRef.current = false;
    setIsOpen(false);
    setIsMinimized(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  };

  const minimizeChatWidget = () => {
    chatIsOpenRef.current = false;
    setIsMinimized(true);
    setIsOpen(false);
    window.setTimeout(() => launcherRef.current?.focus(), 0);
  };

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;
    if (contactSaveStatus === 'saving') return;

    setContactSaveStatus('saving');
    setContactSaveError('');

    try {
      const res = await fetch(apiUrl('/api/chat/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: userName,
          email: userEmail,
          ...getChatSourcePayload(),
        }),
      });
      if (!res.ok) {
        setContactSaveStatus('failed');
        setContactSaveError('Could not save your contact details. Please try again.');
        announceStatus('Contact save failed');
        return;
      }

      localStorage.setItem('chat_user_name', userName);
      localStorage.setItem('chat_user_email', userEmail);
      setApiAvailable(true);
      pollConsecutiveFailuresRef.current = 0;
      setContactSaveStatus('saved');
      setShowLeadForm(false);
      setLeadSavedNotice(true);
      setShowAwayFollowUp(true);
      announceStatus(VISITOR_CHAT_MESSAGE_SAVED);
      trackChatLeadCaptured({
        chatStatus: availability.status,
        ctaLocation: 'chat_lead_form',
      });
      trackVisitorChatEvent('chat_human_handoff_requested', {
        route: location.pathname,
        intentKey: selectedIntent?.key,
        serviceArea: selectedIntent?.serviceArea,
        availabilityState: availability.status,
      });
    } catch {
      setContactSaveStatus('failed');
      setContactSaveError('Could not save your contact details. Please check your connection and try again.');
      announceStatus('Contact save failed');
    }
  };

  const syncAppointmentContactDetails = () => {
    const storedName =
      typeof window !== 'undefined' ? window.localStorage.getItem('chat_user_name') || '' : '';
    const storedEmail =
      typeof window !== 'undefined' ? window.localStorage.getItem('chat_user_email') || '' : '';

    setAppointmentForm((prev) => ({
      ...prev,
      name: prev.name || userName || storedName,
      email: prev.email || userEmail || storedEmail,
    }));
  };

  const toggleAppointmentForm = () => {
    syncAppointmentContactDetails();
    setShowAppointmentForm((value) => !value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const uploadChatFile = async (file: File, existingLocalKey?: string) => {
    setUploadError('');
    const localKey = existingLocalKey || createClientMessageId('upload');
    failedFileByKeyRef.current.set(localKey, file);

    const optimistic: PendingChatAttachment = {
      id: -1,
      url: '',
      originalName: file.name,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      kind: file.type.startsWith('image/') ? 'image' : 'document',
      uploadStatus: 'uploading',
      localKey,
      displayName: file.name,
    };

    setPendingAttachments((prev) => {
      const without = prev.filter((item) => item.localKey !== localKey);
      return [...without, optimistic];
    });

    const body = new FormData();
    body.append('sessionId', sessionId);
    body.append('file', file);

    try {
      const res = await fetch(apiUrl('/api/chat/uploads'), {
        method: 'POST',
        body,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setUploadError(data?.error || 'Upload failed.');
        setPendingAttachments((prev) =>
          prev.map((item) =>
            item.localKey === localKey ? { ...item, uploadStatus: 'failed' } : item,
          ),
        );
        announceStatus('Upload failed');
        return;
      }

      failedFileByKeyRef.current.delete(localKey);
      setPendingAttachments((prev) =>
        prev.map((item) =>
          item.localKey === localKey
            ? {
                ...data,
                uploadStatus: 'uploaded' as const,
                localKey,
                displayName: data.originalName || file.name,
              }
            : item,
        ),
      );
      trackChatAttachmentUploaded({
        chatStatus: availability.status,
        attachmentKind: data?.kind,
        sizeBytes: file.size,
        ctaLocation: 'live_chat_attachment',
      });
      announceStatus('Uploaded');
    } catch {
      setUploadError('Upload failed. Please try again.');
      setPendingAttachments((prev) =>
        prev.map((item) =>
          item.localKey === localKey ? { ...item, uploadStatus: 'failed' } : item,
        ),
      );
      announceStatus('Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(event.clipboardData.files).find((item) =>
      item.type.startsWith('image/'),
    );
    if (file) void uploadChatFile(file);
  };

  const submitAppointmentRequest = async (event: FormEvent) => {
    event.preventDefault();
    setAppointmentError('');

    try {
      const res = await fetch(apiUrl('/api/chat/appointments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...appointmentForm,
          name: appointmentForm.name || userName,
          email: appointmentForm.email || userEmail,
          timezone: 'Europe/London',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setAppointmentError(data?.error || 'Could not send appointment request.');
        return;
      }
      trackChatAppointmentRequested({
        chatStatus: availability.status,
        hasMessage: Boolean(appointmentForm.message.trim()),
        ctaLocation: 'chat_appointment_form',
      });
      setShowAppointmentForm(false);
      setMessages((prev) => [
        ...prev,
        {
          id: createClientMessageId('appointment'),
          text: 'Thanks, your appointment request has been received. Our team will confirm during UK business hours.',
          sender: 'bot',
          timestamp: new Date(),
          deliveryStatus: 'sent',
        },
      ]);
    } catch {
      setAppointmentError('Could not send appointment request.');
    }
  };

  const sendMessage = async (retryMessage?: VisitorChatMessage) => {
    const outgoingMessageText = retryMessage?.retryPayload?.text ?? message.trim();
    const outgoingAttachments = retryMessage
      ? []
      : pendingAttachments.filter((item) => item.uploadStatus === 'uploaded' && item.id > 0);
    const attachmentIds =
      retryMessage?.retryPayload?.attachmentIds
      ?? outgoingAttachments.map((attachment) => attachment.id);

    if (!outgoingMessageText && attachmentIds.length === 0) return;
    if (isSending) return;
    if (!retryMessage && hasBlocking) return;

    setIsSending(true);
    announceStatus('Sending…');
    if (teamAway) {
      setShowAwayFollowUp(true);
    }

    const localId = retryMessage?.id || createClientMessageId('local');
    const userMessage: VisitorChatMessage = {
      id: localId,
      text: outgoingMessageText || 'Shared an attachment',
      sender: 'user',
      timestamp: new Date(),
      attachments: retryMessage?.attachments || outgoingAttachments,
      deliveryStatus: 'sending',
      retryPayload: {
        text: outgoingMessageText || 'Shared an attachment',
        attachmentIds,
      },
    };

    setMessages((prev) => {
      if (retryMessage) {
        return prev.map((msg) => (msg.id === retryMessage.id ? userMessage : msg));
      }
      return [...prev, userMessage];
    });

    if (!retryMessage) {
      setMessage('');
      setPendingAttachments((prev) =>
        prev.filter((item) => !outgoingAttachments.some((sent) => sent.localKey === item.localKey)),
      );
    }

    try {
      const res = await fetch(apiUrl('/api/chat/respond'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userMessage.text,
          userName: userName || undefined,
          attachmentIds,
        }),
      });
      if (!res.ok) throw new Error('Backend chat request failed');
      const payload = await res.json();

      setApiAvailable(true);
      pollConsecutiveFailuresRef.current = 0;
      setHasKnownSessionHistory(true);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === localId
            ? {
                ...msg,
                id: String(payload?.userMessage?.id || localId),
                deliveryStatus: 'sent',
                retryPayload: undefined,
              }
            : msg,
        ),
      );

      trackChatMessageSent({
        chatStatus: payload?.availability?.status || availability.status,
        messageLength: outgoingMessageText.length,
        attachmentCount: attachmentIds.length,
        botReplySent: Boolean(payload?.botMessage),
        ctaLocation: 'live_chat',
      });

      if (payload?.botMessage?.text) {
        setIsAwaitingAutomatedReply(true);
        const botMessage: VisitorChatMessage = {
          id: String(payload.botMessage.id || createClientMessageId('bot')),
          text: payload.botMessage.text,
          sender: 'bot',
          timestamp: new Date(payload.botMessage.timestamp || Date.now()),
          deliveryStatus: 'sent',
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsAwaitingAutomatedReply(false);
      }

      if (payload?.availability) {
        setAvailability(payload.availability);
      }

      announceStatus('Sent');
      if (userEmail) {
        setLeadSavedNotice(true);
      } else if (teamAway) {
        setShowLeadForm(true);
      }
    } catch (error) {
      console.warn('Chat send failed; visitor can retry.', error instanceof Error ? error.message : error);
      pollConsecutiveFailuresRef.current += 1;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === localId ? { ...msg, deliveryStatus: 'failed' } : msg,
        ),
      );
      announceStatus('Could not send');
      trackVisitorChatEvent('chat_message_send_failed', {
        route: location.pathname,
        intentKey: selectedIntent?.key,
        serviceArea: selectedIntent?.serviceArea,
        availabilityState: availability.status,
      });
    } finally {
      setIsSending(false);
    }
  };

  const reconcileBeforeRetry = async (msg: VisitorChatMessage): Promise<boolean> => {
    // Residual limitation (Phase 2F-1): without a server-side idempotency key,
    // reconciliation uses text, attachment IDs, sender and a timestamp window.
    try {
      const res = await fetch(apiUrl(`/api/chat/${sessionId}`));
      if (res.ok) {
        const history = await res.json();
        if (Array.isArray(history)) {
          setApiAvailable(true);
          pollConsecutiveFailuresRef.current = 0;
          const mapped = history.map((m: Record<string, unknown>) => mapHistoryMessage(m));
          setHasKnownSessionHistory(mapped.length > 0);

          const persistedMatch = findPersistedUserMessageMatch(msg, mapped);
          if (persistedMatch) {
            const automatedReply = findAutomatedReplyAfterUserMessage(mapped, persistedMatch.id);
            setMessages((prev) => {
              const withoutFailed = prev.filter((item) => item.id !== msg.id);
              const merged = mergeRemoteHistoryWithLocalState(withoutFailed, mapped);
              if (
                automatedReply
                && !merged.some((item) => item.id === automatedReply.id)
              ) {
                return [...merged, automatedReply];
              }
              return merged;
            });
            announceStatus('Sent');
            return true;
          }
        }
      }
    } catch {
      pollConsecutiveFailuresRef.current += 1;
    }
    return false;
  };

  const retryMessage = async (msg: VisitorChatMessage) => {
    // Residual limitation (Phase 2F-1): without a server-side idempotency key,
    // reconciliation uses text, attachment IDs, sender and a timestamp window.
    trackVisitorChatEvent('chat_message_retry', {
      route: location.pathname,
      intentKey: selectedIntent?.key,
      serviceArea: selectedIntent?.serviceArea,
      availabilityState: availability.status,
    });

    // Keep the in-flight lock across history fetch, reconciliation, optional
    // resend, response handling, and failure handling.
    if (retryInFlightRef.current.has(msg.id)) return;
    retryInFlightRef.current.add(msg.id);

    try {
      const reconciled = await reconcileBeforeRetry(msg);

      if (reconciled) {
        return;
      }

      await sendMessage(msg);
    } finally {
      retryInFlightRef.current.delete(msg.id);
    }
  };

  const handleIntentSelect = (key: VisitorChatIntentKey) => {
    const intent = getVisitorChatIntent(key);
    if (!intent) return;
    setSelectedIntentKey(key);
    setSelectedClarificationKey(null);
    setShowRecommendations(false);
    setRecommendationTracked(false);
    setShowIntentChooser(false);
    trackVisitorChatEvent('chat_intent_selected', {
      route: location.pathname,
      intentKey: key,
      serviceArea: intent.serviceArea,
      availabilityState: availability.status,
    });
  };

  const handleClarificationSelect = (clarificationKey: string) => {
    setSelectedClarificationKey(clarificationKey);
    setShowRecommendations(true);
  };

  const isEmptyConversation = historyLoaded && messages.length === 0;
  const showGuidance = isEmptyConversation || showIntentChooser || Boolean(selectedIntent);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col items-end p-1 sm:bottom-6 sm:right-6">
      <span className="sr-only" aria-live="polite">
        {statusAnnouncement}
      </span>

      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label={VISITOR_CHAT_REGION_NAME}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: 16 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            className="mb-3 flex h-[min(100dvh-5.5rem,640px)] w-[calc(100vw-2rem)] max-w-[420px] flex-col overflow-hidden rounded-2xl border border-brand-border bg-white shadow-[0_24px_48px_-24px_rgba(0,10,45,0.18)] max-[390px]:h-[calc(100dvh-4.5rem)] max-[390px]:w-[calc(100vw-1rem)] max-[390px]:rounded-xl sm:mb-4 sm:h-[min(82vh,560px)] sm:w-[400px]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <ChatHeader
              headerStatus={headerStatus}
              latestResponder={latestResponder}
              onMinimize={minimizeChatWidget}
              onClose={closeChatWidget}
            />

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain bg-brand-surface/50 p-3 sm:p-4">
              {isEmptyConversation && (
                <div className="rounded-xl border border-brand-border bg-white p-3 shadow-sm">
                  <ChatIdentityBadge identity={resolveVisitorChatIdentity('bot')} />
                  {routeContext.eyebrow ? (
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-blue">
                      {routeContext.eyebrow}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-semibold text-brand-navy">
                    {routeContext.greeting}
                  </p>
                  <p className="mt-1 text-[12px] leading-5 text-slate-600">
                    {routeContext.supportingText}
                  </p>
                </div>
              )}

              {showAwayFollowUp && teamAway && !showRecommendations && (
                <ChatAvailabilityNotice
                  serviceArea={selectedIntent?.serviceArea}
                  onLeaveMessage={() => {
                    setShowAwayFollowUp(true);
                    setShowLeadForm(true);
                    textareaRef.current?.focus();
                  }}
                  onReviewClick={() => {
                    trackVisitorChatEvent('chat_review_started', {
                      route: location.pathname,
                      intentKey: selectedIntent?.key,
                      serviceArea: selectedIntent?.serviceArea,
                      recommendationType: 'review',
                      availabilityState: availability.status,
                    });
                  }}
                  onBookingClick={() => {
                    trackVisitorChatEvent('chat_booking_click', {
                      route: location.pathname,
                      intentKey: selectedIntent?.key,
                      serviceArea: selectedIntent?.serviceArea,
                      recommendationType: 'booking',
                      availabilityState: availability.status,
                    });
                  }}
                  onNavigateFromChat={navigateFromChat}
                />
              )}

              {showGuidance && showIntentChooser && (
                <ChatIntentChooser
                  selectedIntentKey={selectedIntentKey}
                  onSelect={handleIntentSelect}
                />
              )}

              {selectedIntent && !showRecommendations && (
                <ChatClarificationChooser
                  intent={selectedIntent}
                  selectedKey={selectedClarificationKey}
                  onSelect={handleClarificationSelect}
                />
              )}

              {selectedIntent && showRecommendations && (
                <ChatRecommendationPanel
                  intent={selectedIntent}
                  onReviewClick={() => {
                    trackVisitorChatEvent('chat_review_started', {
                      route: location.pathname,
                      intentKey: selectedIntent.key,
                      serviceArea: selectedIntent.serviceArea,
                      recommendationType: 'review',
                      availabilityState: availability.status,
                    });
                  }}
                  onServiceClick={() => {
                    trackVisitorChatEvent('chat_service_click', {
                      route: location.pathname,
                      intentKey: selectedIntent.key,
                      serviceArea: selectedIntent.serviceArea,
                      recommendationType: 'service',
                      availabilityState: availability.status,
                    });
                  }}
                  onBookingClick={() => {
                    trackVisitorChatEvent('chat_booking_click', {
                      route: location.pathname,
                      intentKey: selectedIntent.key,
                      serviceArea: selectedIntent.serviceArea,
                      recommendationType: 'booking',
                      availabilityState: availability.status,
                    });
                  }}
                  onNavigateFromChat={navigateFromChat}
                />
              )}

              {selectedIntent && !showIntentChooser && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowIntentChooser(true);
                      setShowRecommendations(false);
                      setSelectedClarificationKey(null);
                    }}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-2 text-[11px] font-semibold text-brand-blue underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                  >
                    Change topic
                  </button>
                </div>
              )}

              {messages.map((msg) => {
                if (msg.sender === 'system') {
                  return (
                    <div
                      key={msg.id}
                      role="status"
                      className="rounded-lg border border-brand-border bg-white px-3 py-2 text-center text-[11px] text-slate-600"
                    >
                      {msg.text}
                    </div>
                  );
                }

                const identity = resolveVisitorChatIdentity(msg.sender);
                const isUser = msg.sender === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2.5 text-sm ${
                        isUser
                          ? 'rounded-br-md bg-brand-navy text-white'
                          : msg.sender === 'admin'
                            ? 'rounded-bl-md border border-brand-border bg-white text-brand-ink shadow-sm'
                            : 'rounded-bl-md border border-brand-border bg-white text-brand-ink shadow-sm'
                      }`}
                    >
                      {!isUser && <ChatIdentityBadge identity={identity} />}
                      <QuotedMessagePreview replyTo={msg.replyTo} variant="visitor" />
                      <p className="whitespace-pre-wrap break-words leading-5">{msg.text}</p>
                      {msg.editedAt && !msg.deletedAt && (
                        <span className="ml-1 text-[10px] opacity-60">(edited)</span>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.attachments.map((attachment) =>
                            attachment.kind === 'image' ? (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={attachment.url}
                                  alt={attachment.originalName}
                                  className="max-h-36 rounded-xl border border-white/20 object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                key={attachment.id}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-wrap items-center gap-2 rounded-xl bg-black/5 p-2 text-xs font-semibold underline-offset-2 hover:underline"
                              >
                                <FileText className="h-4 w-4" />
                                {attachment.originalName}
                              </a>
                            ),
                          )}
                        </div>
                      )}
                      <div
                        className={`mt-1 text-[10px] opacity-60 ${isUser ? 'text-right' : 'text-left'}`}
                      >
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {isUser && (
                        <ChatMessageStatus
                          status={msg.deliveryStatus}
                          onRetry={
                            msg.deliveryStatus === 'failed'
                              ? () => {
                                  void retryMessage(msg);
                                }
                              : undefined
                          }
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {isAwaitingAutomatedReply && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-brand-border bg-white px-3 py-2">
                    <ChatIdentityBadge identity={resolveVisitorChatIdentity('bot')} />
                    <p className="text-[12px] text-slate-500">Preparing a response…</p>
                  </div>
                </div>
              )}

              {leadSavedNotice && contactSaveStatus === 'saved' && userEmail && (
                <div
                  role="status"
                  className="rounded-lg border border-brand-border bg-white px-3 py-2 text-[12px] text-slate-600"
                >
                  {VISITOR_CHAT_MESSAGE_SAVED}
                  {userEmail ? ` We will use ${userEmail} for follow-up.` : ''}
                </div>
              )}

              {showLeadForm && (
                <form
                  onSubmit={handleLeadSubmit}
                  className="space-y-2 rounded-xl border border-brand-border bg-white p-3 shadow-sm"
                >
                  <p className="text-sm font-semibold text-brand-navy">
                    Leave your contact for follow-up
                  </p>
                  <p className="text-[12px] text-slate-600">
                    Optional until you want a human response. Guidance above remains available.
                  </p>
                  <label htmlFor="chat-lead-name" className="sr-only">
                    Your name
                  </label>
                  <input
                    id="chat-lead-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    required
                    disabled={contactSaveStatus === 'saving'}
                  />
                  <label htmlFor="chat-lead-email" className="sr-only">
                    Work email
                  </label>
                  <input
                    id="chat-lead-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="Work email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full rounded-lg border border-brand-border px-3 py-2.5 text-sm outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    required
                    disabled={contactSaveStatus === 'saving'}
                  />
                  {contactSaveStatus === 'failed' && contactSaveError ? (
                    <p role="alert" className="text-xs font-semibold text-red-600">
                      {contactSaveError}
                    </p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={contactSaveStatus === 'saving'}
                    className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-navy px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {contactSaveStatus === 'saving' ? 'Saving…' : 'Save contact details'}
                  </button>
                  {contactSaveStatus === 'failed' ? (
                    <button
                      type="button"
                      onClick={() => {
                        void handleLeadSubmit({
                          preventDefault: () => undefined,
                        } as FormEvent);
                      }}
                      className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-blue/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    >
                      Retry saving contact details
                    </button>
                  ) : null}
                </form>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-brand-border bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <div className="mb-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex h-[44px] min-h-[44px] items-center gap-1.5 rounded-lg border border-brand-border bg-brand-surface px-3 text-xs font-semibold text-brand-ink transition hover:border-brand-blue/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                >
                  <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                  Attach
                </button>
                {showComposerBooking ? (
                  <button
                    type="button"
                    onClick={() => {
                      trackChatBookCallClick({
                        chatStatus: availability.status,
                        ctaLocation: 'chat_panel',
                      });
                      toggleAppointmentForm();
                    }}
                    className="inline-flex h-[44px] min-h-[44px] items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 text-xs font-semibold text-brand-navy transition hover:border-brand-blue/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                  >
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    Book a call
                  </button>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadChatFile(file);
                  }}
                />
              </div>

              {showAppointmentForm && (
                <form
                  onSubmit={submitAppointmentRequest}
                  className="mb-3 space-y-2 rounded-xl border border-brand-border bg-brand-surface p-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <label htmlFor="chat-appointment-name" className="sr-only">
                      Name
                    </label>
                    <input
                      id="chat-appointment-name"
                      name="name"
                      autoComplete="name"
                      value={appointmentForm.name}
                      onChange={(e) =>
                        setAppointmentForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Name"
                      className="rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    />
                    <label htmlFor="chat-appointment-email" className="sr-only">
                      Email
                    </label>
                    <input
                      id="chat-appointment-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={appointmentForm.email}
                      onChange={(e) =>
                        setAppointmentForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Email"
                      className="rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    />
                    <label htmlFor="chat-appointment-phone" className="sr-only">
                      Phone
                    </label>
                    <input
                      id="chat-appointment-phone"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      value={appointmentForm.phone}
                      onChange={(e) =>
                        setAppointmentForm((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Phone"
                      className="rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    />
                    <label htmlFor="chat-appointment-date" className="sr-only">
                      Preferred date
                    </label>
                    <input
                      id="chat-appointment-date"
                      type="date"
                      value={appointmentForm.preferredDate}
                      onChange={(e) =>
                        setAppointmentForm((prev) => ({
                          ...prev,
                          preferredDate: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    />
                    <label htmlFor="chat-appointment-time" className="sr-only">
                      Preferred time
                    </label>
                    <input
                      id="chat-appointment-time"
                      type="time"
                      value={appointmentForm.preferredTime}
                      onChange={(e) =>
                        setAppointmentForm((prev) => ({
                          ...prev,
                          preferredTime: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                    />
                  </div>
                  <label htmlFor="chat-appointment-message" className="sr-only">
                    Appointment message
                  </label>
                  <textarea
                    id="chat-appointment-message"
                    value={appointmentForm.message}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder="What would you like to discuss?"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-brand-border px-3 py-2 text-xs outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                  />
                  {appointmentError && (
                    <p role="alert" className="text-xs font-semibold text-red-600">{appointmentError}</p>
                  )}
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center rounded-lg bg-brand-navy px-3 py-2 text-xs font-semibold text-white hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
                  >
                    Send request
                  </button>
                </form>
              )}

              {hasUploading && (
                <p role="status" className="mb-2 text-xs font-medium text-slate-600">
                  {VISITOR_ATTACHMENT_UPLOAD_GUIDANCE}
                </p>
              )}

              {hasFailed && (
                <p role="alert" className="mb-2 text-xs font-semibold text-red-600">
                  {VISITOR_ATTACHMENT_FAILED_GUIDANCE}
                </p>
              )}

              {uploadError && (
                <p className="mb-2 text-xs font-semibold text-red-600">{uploadError}</p>
              )}

              {pendingAttachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment) => (
                    <ChatAttachmentStatus
                      key={attachment.localKey}
                      displayName={attachment.displayName}
                      kind={attachment.kind}
                      status={attachment.uploadStatus}
                      onRemove={() => {
                        failedFileByKeyRef.current.delete(attachment.localKey);
                        setPendingAttachments((prev) =>
                          prev.filter((item) => item.localKey !== attachment.localKey),
                        );
                      }}
                      onRetry={
                        attachment.uploadStatus === 'failed'
                          ? () => {
                              const file = failedFileByKeyRef.current.get(attachment.localKey);
                              if (file) void uploadChatFile(file, attachment.localKey);
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendMessage();
                }}
                className="flex items-end gap-2"
              >
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Type your message…"
                  aria-label="Chat message"
                  className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-xl border border-brand-border bg-brand-surface px-3 py-2.5 text-sm outline-none transition-[height] duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue/40"
                />
                <button
                  type="submit"
                  disabled={
                    isSending
                    || hasBlocking
                    || (!message.trim()
                      && pendingAttachments.filter((item) => item.uploadStatus === 'uploaded')
                        .length === 0)
                  }
                  aria-label="Send message"
                  className="inline-flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white transition hover:bg-brand-navy/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={launcherRef}
        type="button"
        aria-label={launcherAriaLabel}
        data-chat-launcher="true"
        data-presence={presenceTone}
        data-unread={unreadCount > 0 ? String(unreadCount) : '0'}
        onClick={() => {
          if (isOpen && !isMinimized) {
            closeChatWidget();
            return;
          }
          openChatWidget();
        }}
        whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        className={`relative inline-flex h-14 w-14 items-center justify-center rounded-full shadow-[0_12px_28px_-16px_rgba(0,10,45,0.35)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy ${
          isOpen && !isMinimized
            ? 'bg-brand-navy text-white'
            : 'bg-brand-blue text-white'
        }`}
      >
        {isOpen && !isMinimized ? (
          <X className="h-6 w-6" aria-hidden="true" />
        ) : (
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
        )}
        {showLauncherChrome && unreadBadgeLabel && (
          <span
            data-testid="chat-unread-badge"
            className="absolute -right-1 -top-1 z-10 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white"
            aria-hidden="true"
          >
            {unreadBadgeLabel}
          </span>
        )}
        {showLauncherChrome && (
          <span
            data-testid="chat-presence-dot"
            data-presence={presenceTone}
            className={`absolute -bottom-0.5 -right-0.5 z-10 h-3.5 w-3.5 rounded-full ring-2 ring-white ${VISITOR_PRESENCE_DOT_CLASS[presenceTone]}`}
            aria-hidden="true"
          />
        )}
        <span className="sr-only">
          {VISITOR_PRESENCE_STATUS_LABELS[presenceTone]}
          {unreadCount > 0
            ? `. ${unreadCount === 1 ? '1 unread reply' : `${unreadCount} unread replies`}`
            : ''}
        </span>
      </motion.button>
    </div>
  );
};
