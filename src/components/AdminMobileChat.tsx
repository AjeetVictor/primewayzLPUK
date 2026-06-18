import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Lock, LogOut, MessageSquare, Send, User as UserIcon, XCircle } from 'lucide-react';
import { apiUrl } from '../utils/apiUrl';
import { PasswordInput } from './ui/PasswordInput';
import {
  CHAT_STATUS_FILTERS,
  QUICK_REPLY_TEMPLATES,
  formatConversationStatus,
  getMessageDisplayText,
  getStatusBadgeClass,
  type ChatMessageRecord,
  type ChatSessionRecord,
  type ChatStatusFilterKey,
} from '../lib/chatTypes';
import { QuotedMessagePreview } from './chat/QuotedMessagePreview';
import { trackAdminChatReply, trackChatLeadConverted } from '../lib/analytics';

interface CurrentUser {
  id: number;
  email: string;
  role: string;
}

const adminRequest = (path: string, init: RequestInit = {}) =>
  fetch(apiUrl(path), { ...init, credentials: 'include', headers: init.headers });

const isOperationsRole = (role?: string) =>
  role === 'super_admin' || role === 'admin' || role === 'editor' || role === 'viewer';

export const AdminMobileChat = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [sessions, setSessions] = useState<ChatSessionRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChatStatusFilterKey>('all');
  const [unreadBySession, setUnreadBySession] = useState<Record<string, number>>({});
  const [replyingToMessageId, setReplyingToMessageId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);

  const checkAuth = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/check-auth'), { credentials: 'include' });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        setUser(data.user);
        if (!isOperationsRole(data.user?.role)) {
          setLoginError('Your account does not have chat access.');
          setIsAuthenticated(false);
        }
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const fetchSessions = async () => {
    const [sessionsRes, messagesRes] = await Promise.all([
      adminRequest('/api/admin/sessions'),
      adminRequest('/api/admin/chats'),
    ]);
    if (sessionsRes.status === 401 || messagesRes.status === 401) {
      setIsAuthenticated(false);
      return;
    }
    if (sessionsRes.ok) setSessions(await sessionsRes.json());
    if (messagesRes.ok) {
      const allMessages: ChatMessageRecord[] = await messagesRes.json();
      setMessages(allMessages);

      const userMessages = allMessages.filter((message) => message.sender === 'user');
      setUnreadBySession((prev) => {
        const next = { ...prev };
        userMessages.forEach((message) => {
          if (selectedSessionId && message.sessionId === selectedSessionId) return;
          if (!next[message.sessionId]) next[message.sessionId] = 0;
        });
        return next;
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, selectedSessionId]);

  useEffect(() => {
    if (!selectedSessionId) return;
    setUnreadBySession((prev) => ({ ...prev, [selectedSessionId]: 0 }));
  }, [selectedSessionId]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Login failed');
        return;
      }
      setIsAuthenticated(true);
      setUser(data.user);
      setPassword('');
    } catch {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    await adminRequest('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setUser(null);
    setSelectedSessionId(null);
  };

  const sessionMessages = useMemo(() => {
    if (!selectedSessionId) return [];
    return messages
      .filter((message) => message.sessionId === selectedSessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedSessionId]);

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) || null;

  const filteredSessions = useMemo(() => {
    return sessions
      .filter((session) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'unread') return (unreadBySession[session.id] || 0) > 0;
        return (session.status || 'new') === statusFilter;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sessions, statusFilter, unreadBySession]);

  const sendReply = async (text: string, options?: { isQuickReply?: boolean }) => {
    if (!selectedSessionId || !text.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'admin',
          text,
          sessionId: selectedSessionId,
          replyToId: replyingToMessageId,
        }),
      });
      if (res.ok) {
        trackAdminChatReply({
          sessionId: selectedSessionId,
          isQuickReply: options?.isQuickReply,
          conversationStatus: selectedSession?.status,
        });
        setReplyText('');
        setReplyingToMessageId(null);
        await fetchSessions();
      }
    } finally {
      setIsSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedSessionId) return;
    const res = await adminRequest(`/api/admin/sessions/${selectedSessionId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      if (status === 'lead_qualified' || status === 'booked_call') {
        trackChatLeadConverted({
          sessionId: selectedSessionId,
          conversionType: status,
          serviceInterest: selectedSession?.serviceInterest,
          sourcePage: selectedSession?.firstLandingPage,
        });
      }
      await fetchSessions();
    }
  };

  if (isAuthenticated === null) {
    return <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-sm text-zinc-500">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Mobile Chat Admin</h1>
              <p className="text-sm text-zinc-500">Sign in to manage live conversations</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Email</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 py-3 pl-10 pr-12 outline-none focus:ring-2 focus:ring-emerald-500/20"
                leftIcon={<Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />}
                toggleLabel="mobile admin password"
                required
              />
            </div>
            {loginError && <p className="text-center text-sm font-medium text-red-500">{loginError}</p>}
            <button type="submit" className="w-full rounded-xl bg-zinc-900 py-3 font-bold text-white">
              Sign In
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-500">
            <Link to="/admin" className="font-semibold text-emerald-700">Open full admin dashboard</Link>
          </p>
        </div>
      </div>
    );
  }

  if (selectedSessionId && selectedSession) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedSessionId(null);
                setReplyText('');
                setReplyingToMessageId(null);
              }}
              className="rounded-lg p-2 hover:bg-zinc-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-zinc-900">{selectedSession.name || selectedSession.email || 'Visitor'}</p>
              <p className="truncate text-xs text-zinc-500">{selectedSession.serviceInterest || selectedSession.firstLandingPage || 'No source captured'}</p>
            </div>
            <button type="button" onClick={handleLogout} className="rounded-lg p-2 hover:bg-zinc-100">
              <LogOut className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${getStatusBadgeClass(selectedSession.status)}`}>
              {formatConversationStatus(selectedSession.status)}
            </span>
            <button type="button" onClick={() => updateStatus('lead_qualified')} className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
              Qualify lead
            </button>
            <button type="button" onClick={() => updateStatus('closed')} className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">
              <XCircle className="h-3 w-3" />
              Close
            </button>
          </div>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {sessionMessages.map((message) => {
            const isAdmin = message.sender === 'admin';
            const isInternal = message.isInternalNote;
            return (
              <div key={message.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <button
                  type="button"
                  onClick={() => message.sender === 'user' && setReplyingToMessageId(message.id)}
                  className={`max-w-[88%] rounded-2xl border px-3 py-2 text-left text-sm ${
                    isInternal
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : isAdmin
                        ? 'border-emerald-100 bg-emerald-600 text-white'
                        : 'border-zinc-200 bg-white text-zinc-800'
                  }`}
                >
                  <div className="mb-1 text-[10px] font-bold uppercase opacity-70">
                    {isInternal ? 'Internal note' : message.sender}
                  </div>
                  <QuotedMessagePreview
                    replyTo={message.replyTo}
                    variant={isAdmin ? 'admin' : isInternal ? 'internal' : 'visitor'}
                  />
                  <p>{getMessageDisplayText(message)}</p>
                  {message.editedAt && !message.deletedAt && (
                    <span className="text-[10px] opacity-70">edited</span>
                  )}
                  <p className="mt-1 text-[10px] opacity-60">{format(new Date(message.timestamp), 'h:mm a')}</p>
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-zinc-200 bg-white p-4">
          <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
            {QUICK_REPLY_TEMPLATES.slice(0, 3).map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => sendReply(template, { isQuickReply: true })}
                className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-600"
              >
                Quick reply
              </button>
            ))}
          </div>
          {replyingToMessageId && (
            <p className="mb-2 text-xs text-zinc-500">Replying to message #{replyingToMessageId}</p>
          )}
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              placeholder="Type a reply..."
              className="flex-1 rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              disabled={!replyText.trim() || isSending}
              onClick={() => sendReply(replyText)}
              className="self-end rounded-xl bg-emerald-600 p-3 text-white disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Chat Inbox</h1>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
          <button type="button" onClick={handleLogout} className="rounded-lg p-2 hover:bg-zinc-100">
            <LogOut className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {CHAT_STATUS_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setStatusFilter(filter.key)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                statusFilter === filter.key ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="divide-y divide-zinc-100">
        {filteredSessions.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-zinc-400">No conversations in this filter.</p>
        ) : (
          filteredSessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSelectedSessionId(session.id)}
              className="w-full px-4 py-4 text-left hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-zinc-900">{session.name || session.email || 'Anonymous visitor'}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {session.serviceInterest || session.firstLandingPage || session.currentPageUrl || 'No page source'}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{session.messages[0]?.text || 'No messages yet'}</p>
                </div>
                <div className="shrink-0 text-right">
                  {(unreadBySession[session.id] || 0) > 0 && (
                    <span className="mb-2 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {unreadBySession[session.id]}
                    </span>
                  )}
                  <span className={`block rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${getStatusBadgeClass(session.status)}`}>
                    {formatConversationStatus(session.status)}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <p className="px-4 py-6 text-center text-sm text-zinc-500">
        <Link to="/admin" className="font-semibold text-emerald-700">Open full admin dashboard</Link>
      </p>
    </div>
  );
};
