import { useState, useEffect, useRef, FormEvent, KeyboardEvent, ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send, User, Bot, Minus, Paperclip, CalendarClock, FileText, Image as ImageIcon } from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';


import {
  trackChatAppointmentRequested,
  trackChatAttachmentUploaded,
  trackChatMessageSent,
  trackChatOpen,
} from '../lib/analytics';

type ChatStatusKey = 'online' | 'away' | 'offline' | 'assistant';

const normalizeChatStatus = (status?: string): ChatStatusKey => {
  if (status === 'online') return 'online';
  if (status === 'away') return 'away';
  if (status === 'assistant') return 'assistant';
  return 'offline';
};

const chatStatusTheme: Record<ChatStatusKey, {
  dot: string;
  softDot: string;
  badge: string;
  badgeText: string;
  launcherRing: string;
  launcherText: string;
}> = {
  online: {
    dot: 'bg-emerald-500',
    softDot: 'bg-emerald-400',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    badgeText: 'ONLINE',
    launcherRing: 'ring-emerald-200',
    launcherText: 'Online',
  },
  away: {
    dot: 'bg-amber-500',
    softDot: 'bg-amber-400',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    badgeText: 'AWAY',
    launcherRing: 'ring-amber-200',
    launcherText: 'Away',
  },
  offline: {
    dot: 'bg-slate-400',
    softDot: 'bg-slate-400',
    badge: 'border-slate-200 bg-slate-100 text-slate-600',
    badgeText: 'OFFLINE',
    launcherRing: 'ring-slate-200',
    launcherText: 'Offline',
  },
  assistant: {
    dot: 'bg-slate-500',
    softDot: 'bg-sky-400',
    badge: 'border-slate-300 bg-slate-100 text-slate-700',
    badgeText: 'ASSISTANT',
    launcherRing: 'ring-sky-200',
    launcherText: 'Assistant',
  },
};

interface ChatAttachment {
  id: number;
  url: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'document';
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'admin';
  timestamp: Date;
  attachments?: ChatAttachment[];
}

type ChatAvailabilityStatus = 'online' | 'away' | 'offline' | 'assistant';

interface ChatAvailability {
  status: ChatAvailabilityStatus;
  title: string;
  subtitle: string;
  responseExpectation: string;
  businessHours: string;
  canAcceptMessages: boolean;
  canBookCall: boolean;
  serverTime: string;
}

const defaultAvailability: ChatAvailability = {
  status: 'assistant',
  title: 'Primewayz Assistant is active',
  subtitle: 'Human team replies during business hours',
  responseExpectation: 'Human team replies during business hours',
  businessHours: 'Mon-Fri, 10:00-19:00 UK time',
  canAcceptMessages: true,
  canBookCall: true,
  serverTime: '',
};

const availabilityStyles: Record<ChatAvailabilityStatus, { dot: string; badge: string; label: string; launcherLabel: string }> = {
  online: {
    dot: 'bg-green-600',
    badge: 'border border-green-300 bg-green-100 text-green-800',
    label: 'Online',
    launcherLabel: 'Online',
  },
  away: {
    dot: 'bg-amber-500',
    badge: 'border border-amber-300 bg-amber-100 text-amber-800',
    label: 'Away',
    launcherLabel: 'Away - leave a message',
  },
  offline: {
    dot: 'bg-slate-400',
    badge: 'border border-slate-300 bg-slate-100 text-slate-700',
    label: 'Offline',
    launcherLabel: 'Offline - leave a message',
  },
  assistant: {
    dot: 'bg-slate-500',
    badge: 'border border-slate-300 bg-slate-100 text-slate-700',
    label: 'Assistant',
    launcherLabel: 'Assistant',
  },
};

export const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasTrackedChatOpen, setHasTrackedChatOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('primewayz_chat_open_tracked') === 'true';
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [availability, setAvailability] = useState<ChatAvailability>(defaultAvailability);

  const chatStatusKey = normalizeChatStatus(availability?.status);
  const currentStatusTheme = chatStatusTheme[chatStatusKey];
  const [userName, setUserName] = useState(() => localStorage.getItem('chat_user_name') || '');
  const [userEmail, setUserEmail] = useState(() => localStorage.getItem('chat_user_email') || '');



  const [showLeadForm, setShowLeadForm] = useState(!userName || !userEmail);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [pendingAttachments, setPendingAttachments] = useState<ChatAttachment[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
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
  const [sessionId] = useState(() => {
    const saved = localStorage.getItem('chat_session_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(7);
    localStorage.setItem('chat_session_id', newId);
    return newId;
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



  // Fetch persistent chat history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(apiUrl(`/api/chat/${sessionId}`));
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            setMessages(history.map((m: any) => ({
              ...m,
              id: m.id.toString(),
              timestamp: new Date(m.timestamp),
              attachments: m.attachments || [],
            })));
          } else {
            // Default welcome message if no history
            setMessages([{
              id: '1',
              text: 'Hi there! 👋 Welcome to Primewayz UK. How can we help your UK business with website, SEO, CRM, automation, or monthly digital support?',
              sender: 'bot',
              timestamp: new Date(),
            }]);
          }
        } else if (res.status === 404) {
          setApiAvailable(false);
          setMessages([{
            id: '1',
            text: 'Hi there! 👋 Welcome to Primewayz UK. How can we help your UK business with website, SEO, CRM, automation, or monthly digital support?',
            sender: 'bot',
            timestamp: new Date(),
          }]);
        }
      } catch (error) {
        setApiAvailable(false);
        setMessages([{
          id: '1',
          text: 'Hi there! 👋 Welcome to Primewayz UK. How can we help your UK business with website, SEO, CRM, automation, or monthly digital support?',
          sender: 'bot',
          timestamp: new Date(),
        }]);
      }
    };
    fetchHistory();
  }, [sessionId]);

  // Polling for new messages (especially admin replies)
  useEffect(() => {
    if (!isOpen || !apiAvailable) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/chat/${sessionId}`));
        if (res.ok) {
          const history = await res.json();
          if (history.length > messages.length) {
            setMessages(history.map((m: any) => ({
              ...m,
              id: m.id.toString(),
              timestamp: new Date(m.timestamp),
              attachments: m.attachments || [],
            })));
          }
        }
      } catch (error) {
        setApiAvailable(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isOpen, sessionId, messages.length, apiAvailable]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(apiUrl('/api/chat/availability'));
        if (res.ok) {
          setAvailability(await res.json());
        }
      } catch {
        setAvailability(defaultAvailability);
      }
    };

    fetchAvailability();
    const interval = setInterval(fetchAvailability, 60000);
    return () => clearInterval(interval);
  }, []);

  const availabilityStyle = availabilityStyles[availability.status] || availabilityStyles.assistant;


  const openChatWidget = () => {
    setIsOpen(true);
    setIsMinimized(false);

    if (!hasTrackedChatOpen) {
      trackChatOpen({
        chatStatus: availability.status,
        chatTitle: availability.title,
        ctaLocation: 'chat_launcher',
      });

      setHasTrackedChatOpen(true);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('primewayz_chat_open_tracked', 'true');
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleLeadSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    localStorage.setItem('chat_user_name', userName);
    localStorage.setItem('chat_user_email', userEmail);
    
    try {
      const res = await fetch(apiUrl('/api/chat/session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, name: userName, email: userEmail })
      });
      if (!res.ok) {
        setApiAvailable(false);
      }
      setShowLeadForm(false);
    } catch (error) {
      setApiAvailable(false);
      setShowLeadForm(false);
    }
  };


  const syncAppointmentContactDetails = () => {
    const storedName = typeof window !== 'undefined' ? window.localStorage.getItem('chat_user_name') || '' : '';
    const storedEmail = typeof window !== 'undefined' ? window.localStorage.getItem('chat_user_email') || '' : '';

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
      handleSend(e as unknown as FormEvent);
    }
  };

  const uploadChatFile = async (file: File) => {
    setUploadError('');
    setIsUploading(true);
    const body = new FormData();
    body.append('sessionId', sessionId);
    body.append('file', file);

    try {
      const res = await fetch(apiUrl('/api/chat/uploads'), {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed.');
        return;
      }
      setPendingAttachments((prev) => [...prev, data]);
      trackChatAttachmentUploaded({
        chatStatus: availability.status,
        attachmentKind: data?.kind,
        sizeBytes: file.size,
        ctaLocation: 'live_chat_attachment',
      });
    } catch {
      setUploadError('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const file = Array.from(event.clipboardData.files).find((item) => item.type.startsWith('image/'));
    if (file) uploadChatFile(file);
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
          id: `appointment-${Date.now()}`,
          text: 'Thanks, your appointment request has been received. Our team will confirm shortly.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } catch {
      setAppointmentError('Could not send appointment request.');
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() && pendingAttachments.length === 0) return;

    const outgoingMessageText = message.trim();
    const outgoingAttachmentCount = pendingAttachments.length;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: outgoingMessageText || 'Shared an attachment',
      sender: 'user',
      timestamp: new Date(),
      attachments: pendingAttachments,
    };

    setMessages((prev) => [...prev, userMessage]);
    const attachmentIds = pendingAttachments.map((attachment) => attachment.id);
    setMessage('');
    setPendingAttachments([]);
    setIsTyping(true);

    // Generate bot response via backend (also persists user+bot messages in DB)
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
      setIsTyping(false);
      trackChatMessageSent({
        chatStatus: payload?.availability?.status || availability.status,
        messageLength: outgoingMessageText.length,
        attachmentCount: outgoingAttachmentCount,
        botReplySent: Boolean(payload?.botMessage),
        ctaLocation: 'live_chat',
      });
      if (payload?.botMessage?.text) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: payload.botMessage.text,
          sender: 'bot',
          timestamp: new Date(payload.botMessage.timestamp || Date.now()),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      setApiAvailable(false);
      setIsTyping(false);
      
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having a little trouble connecting right now. Please try again in a moment or use our contact form!",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorBotMessage]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-[calc(100vw-48px)] max-w-[400px] h-[min(82vh,560px)] bg-white rounded-2xl shadow-2xl shadow-emerald-900/20 border border-zinc-200 flex flex-col overflow-hidden sm:mb-4 sm:w-[400px] sm:h-[560px] sm:rounded-3xl max-[360px]:w-[calc(100vw-32px)]"
          >
            {/* Header */}
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-zinc-900 rounded-full ${availabilityStyle.dot}`} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm">{availability.title}</h3>
                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${availabilityStyle.badge}`}>
                      <div className={`w-1 h-1 rounded-full ${availabilityStyle.dot}`} />
                      <span className="text-[8px] font-bold uppercase tracking-tighter">{availabilityStyle.label}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400">{availability.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(true)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
              {showLeadForm ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900">Welcome to Primewayz!</h4>
                    <p className="text-xs text-zinc-500 mt-1">Please introduce yourself to start chatting with our team.</p>
                  </div>
                  <form onSubmit={handleLeadSubmit} className="w-full space-y-3">
                    <input 
                      type="text"
                      placeholder="Your Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <input 
                      type="email"
                      placeholder="Your Email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <button 
                      type="submit"
                      className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/10 hover:bg-emerald-700 transition-all"
                    >
                      Start Chatting
                    </button>
                  </form>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-600 text-white rounded-br-none shadow-lg shadow-emerald-900/10' 
                          : msg.sender === 'admin'
                            ? 'bg-zinc-900 text-white rounded-bl-none shadow-lg'
                            : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-none shadow-sm'
                      }`}>
                        {msg.sender === 'admin' && (
                          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">Support Agent</div>
                        )}
                        {msg.text}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {msg.attachments.map((attachment) => (
                              attachment.kind === 'image' ? (
                                <a key={attachment.id} href={attachment.url} target="_blank" rel="noopener noreferrer">
                                  <img src={attachment.url} alt={attachment.originalName} className="max-h-36 rounded-xl border border-white/20 object-cover" />
                                </a>
                              ) : (
                                <a
                                  key={attachment.id}
                                  href={attachment.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex flex-wrap items-center gap-2 rounded-xl bg-white/10 p-2 text-xs font-bold underline-offset-2 hover:underline"
                                >
                                  <FileText className="h-4 w-4" />
                                  {attachment.originalName}
                                </a>
                              )
                            ))}
                          </div>
                        )}
                        <div className={`text-[10px] mt-1 opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-zinc-200 p-3 rounded-2xl rounded-bl-none flex gap-1">
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            {!showLeadForm && (
              <div className="border-t border-zinc-100 bg-white p-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-200"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Attach
                  </button>
                  <button
                    type="button"
                    onClick={toggleAppointmentForm}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                      availability.status === 'online'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <CalendarClock className="h-3.5 w-3.5" />
                    Book a call
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadChatFile(file);
                    }}
                  />
                </div>
                {showAppointmentForm && (
                  <form onSubmit={submitAppointmentRequest} className="mb-3 space-y-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={appointmentForm.name} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Name" className="rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" />
                      <input value={appointmentForm.email} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" />
                      <input value={appointmentForm.phone} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" />
                      <input type="date" value={appointmentForm.preferredDate} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, preferredDate: e.target.value }))} className="rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" />
                      <input type="time" value={appointmentForm.preferredTime} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, preferredTime: e.target.value }))} className="rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none" />
                    </div>
                    <textarea value={appointmentForm.message} onChange={(e) => setAppointmentForm((prev) => ({ ...prev, message: e.target.value }))} placeholder="What would you like to discuss?" rows={2} className="w-full rounded-lg border border-emerald-100 px-3 py-2 text-xs outline-none resize-none" />
                    {appointmentError && <p className="text-xs font-bold text-red-600">{appointmentError}</p>}
                    <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700">Send request</button>
                  </form>
                )}
                {uploadError && <p className="mb-2 text-xs font-bold text-red-600">{uploadError}</p>}
                {isUploading && <p className="mb-2 text-xs font-bold text-zinc-500">Uploading file...</p>}
                {pendingAttachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {pendingAttachments.map((attachment) => (
                      <span key={attachment.id} className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">
                        {attachment.kind === 'image' ? <ImageIcon className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                        {attachment.originalName}
                      </span>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSend} className="flex items-end gap-2">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={availability.status === 'online' ? 'Message Primewayz team...' : 'Leave your message and contact details...'}
                    className="flex-1 bg-zinc-100 border-none rounded-2xl px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none max-h-[120px] transition-[height] duration-100"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() && pendingAttachments.length === 0}
                    className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20 flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        {!isOpen && (
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${availabilityStyle.badge}`}>
            <span className={`h-2 w-2 rounded-full ${availabilityStyle.dot}`} />
            {availabilityStyle.launcherLabel}
          </span>
        )}
        <motion.button
          aria-label={`Open chat. ${availability.title}. ${availability.subtitle}`}
          onClick={openChatWidget}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
            isOpen && !isMinimized ? 'bg-zinc-900 text-white rotate-90' : 'bg-emerald-600 text-white'
          }`}
        >
          {isOpen && !isMinimized ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          {!isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`absolute -top-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${availabilityStyle.dot}`}
            />
          )}
        </motion.button>
      </div>
      <motion.button
        aria-label={`Open chat. ${availability.title}. ${availability.subtitle}`}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`sm:hidden relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen && !isMinimized ? 'bg-zinc-900 text-white rotate-90' : 'bg-emerald-600 text-white'
        }`}
      >
        {isOpen && !isMinimized ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${availabilityStyle.dot}`}
          />
        )}
      </motion.button>
    </div>
  );
};
