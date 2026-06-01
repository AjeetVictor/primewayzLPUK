import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import * as Tabs from '@radix-ui/react-tabs';
import { LayoutDashboard, MessageSquare, ClipboardList, LogOut, Trash2, RefreshCcw, Lock, User as UserIcon, Search, Users, UserPlus, Shield, Send, FileText, Save, UploadCloud, Archive, Star, Bell, BellOff } from 'lucide-react';
import { format } from 'date-fns';
import { apiUrl } from '../utils/apiUrl';
import { PasswordInput } from './ui/PasswordInput';

interface FormResponse {
  id: number;
  name: string;
  email: string;
  message: string;
  phone: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  timestamp: string;
  replyToId?: number;
  session?: {
    name: string | null;
    email: string | null;
  };
}

interface ChatSession {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  messages: {
    text: string;
    timestamp: string;
  }[];
}

interface ChatConversation {
  sessionId: string;
  name: string | null;
  email: string | null;
  createdAt: string | null;
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  lastMessageAt: string | null;
  status: 'open' | 'replied' | 'bot-replied';
  unreadCount: number;
}

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

interface CurrentUser {
  id: number;
  email: string;
  role: string;
}

interface CmsBlogPost {
  id: number;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  category: string;
  tags: string[];
  date: string | null;
  author: string;
  readTime: string;
  image: string | null;
  content: string;
  featured: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  createdById: number;
  updatedAt: string;
}

type BlogFormState = {
  id?: number;
  title: string;
  slug: string;
  description: string;
  excerpt: string;
  category: string;
  tags: string;
  author: string;
  readTime: string;
  image: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  status: string;
};

const emptyBlogForm: BlogFormState = {
  title: '',
  slug: '',
  description: '',
  excerpt: '',
  category: 'Digital Operations',
  tags: '',
  author: 'Primewayz UK Team',
  readTime: '5 min read',
  image: '',
  content: '',
  seoTitle: '',
  seoDescription: '',
  featured: false,
  status: 'draft',
};

const isSuperAdmin = (role?: string) => role === 'super_admin' || role === 'admin';
const isBlogEditor = (role?: string) => isSuperAdmin(role) || role === 'blog_editor' || role === 'editor';
const isBlogAuthor = (role?: string) => isBlogEditor(role) || role === 'blog_author';
const isOperationsRole = (role?: string) => isSuperAdmin(role) || role === 'editor' || role === 'viewer';
const getDefaultAdminTab = (role?: string) => isOperationsRole(role) ? 'forms' : 'blog';

interface BlogPostComment {
  id: number;
  postId: string;
  name: string;
  text: string;
  createdAt: string;
}

export const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [blogComments, setBlogComments] = useState<BlogPostComment[]>([]);
  const [cmsBlogPosts, setCmsBlogPosts] = useState<CmsBlogPost[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [blogForm, setBlogForm] = useState<BlogFormState>(emptyBlogForm);
  const [blogError, setBlogError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToMessageId, setReplyingToMessageId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState('forms');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [unreadBySession, setUnreadBySession] = useState<Record<string, number>>({});
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('primewayz-admin-sound-alerts') === 'true';
  });
  const seenUserMessageIdsRef = useRef<Set<number>>(new Set());
  const hasInitializedMessageWatchRef = useRef(false);

  const checkAuth = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/check-auth'));
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        setUser(data.user);
        setActiveTab(getDefaultAdminTab(data.user?.role));
        fetchData(false, data.user);
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => fetchData(true), 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const playNotificationSound = () => {
    if (typeof window === 'undefined') return;
    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    const audioContext = new AudioContextCtor();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(740, audioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.18);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const enableSoundAlerts = () => {
    setSoundAlertsEnabled((enabled) => {
      const next = !enabled;
      window.localStorage.setItem('primewayz-admin-sound-alerts', String(next));
      if (next) playNotificationSound();
      return next;
    });
  };

  const fetchData = async (silent = false, currentUser = user) => {
    if (!silent) setLoading(true);
    try {
      const endpoints = [];

      if (isOperationsRole(currentUser?.role)) {
        endpoints.push(
          fetch(apiUrl('/api/admin/forms')),
          fetch(apiUrl('/api/admin/chats')),
          fetch(apiUrl('/api/admin/sessions')),
          fetch(apiUrl('/api/admin/blog-comments')),
        );
      }

      if (isBlogAuthor(currentUser?.role)) {
        endpoints.push(fetch(apiUrl('/api/admin/blog-posts')));
      }

      // Only fetch users if Super Admin
      if (isSuperAdmin(currentUser?.role)) {
        endpoints.push(fetch(apiUrl('/api/admin/users')));
      }

      const results = await Promise.all(endpoints);
      
      // Handle unauthorized
      if (results.some(r => r.status === 401)) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      let resultIndex = 0;
      if (isOperationsRole(currentUser?.role)) {
        if (results[resultIndex]?.ok) setFormResponses(await results[resultIndex].json());
        resultIndex += 1;
        if (results[resultIndex]?.ok) setChatMessages(await results[resultIndex].json());
        resultIndex += 1;
        if (results[resultIndex]?.ok) setChatSessions(await results[resultIndex].json());
        resultIndex += 1;
        if (results[resultIndex]?.ok) setBlogComments(await results[resultIndex].json());
        resultIndex += 1;
      }
      if (isBlogAuthor(currentUser?.role)) {
        if (results[resultIndex]?.ok) setCmsBlogPosts(await results[resultIndex].json());
        resultIndex += 1;
      }
      if (isSuperAdmin(currentUser?.role)) {
        if (results[resultIndex]?.ok) setUsers(await results[resultIndex].json());
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(apiUrl('/api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
        setActiveTab(getDefaultAdminTab(data.user?.role));
        fetchData(false, data.user);
      } else {
        setLoginError(data.error || 'Invalid credentials');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(apiUrl('/api/admin/logout'), { method: 'POST' });
      setIsAuthenticated(false);
      setUser(null);
      setFormResponses([]);
      setChatMessages([]);
      setBlogComments([]);
      setCmsBlogPosts([]);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const deleteFormResponse = async (id: number) => {
    if (!confirm('Are you sure you want to delete this response?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/forms/${id}`), { method: 'DELETE' });
      if (res.ok) {
        setFormResponses(prev => prev.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const deleteBlogComment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/blog-comments/${id}`), { method: 'DELETE' });
      if (res.ok) {
        setBlogComments(prev => prev.filter(c => c.id !== id));
      }
    } catch (error) {
      console.error('Delete comment failed:', error);
    }
  };

  const updateUserRole = async (id: number, role: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
      }
    } catch (error) {
      console.error('Update role failed:', error);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${id}`), { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user failed:', error);
    }
  };

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('viewer');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/admin/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newUserEmail, password: newUserPassword, role: newUserRole })
      });
      if (res.ok) {
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserRole('viewer');
        fetchData();
      }
    } catch (error) {
      console.error('Create user failed:', error);
    }
  };

  const resetBlogForm = () => {
    setBlogForm(emptyBlogForm);
    setBlogError('');
  };

  const editBlogPost = (post: CmsBlogPost) => {
    setBlogForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description,
      excerpt: post.excerpt,
      category: post.category,
      tags: Array.isArray(post.tags) ? post.tags.join(', ') : '',
      author: post.author,
      readTime: post.readTime,
      image: post.image || '',
      content: post.content,
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      featured: post.featured,
      status: post.status,
    });
    setBlogError('');
  };

  const saveBlogPost = async (statusOverride?: string) => {
    setBlogError('');
    const payload = {
      ...blogForm,
      status: statusOverride || blogForm.status,
      tags: blogForm.tags,
    };

    try {
      const res = await fetch(apiUrl(blogForm.id ? `/api/admin/blog-posts/${blogForm.id}` : '/api/admin/blog-posts'), {
        method: blogForm.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlogError(data.error || 'Failed to save blog post');
        return;
      }
      resetBlogForm();
      fetchData();
    } catch (error) {
      setBlogError('Failed to save blog post');
    }
  };

  const archiveBlogPost = async (id: number) => {
    if (!confirm('Archive this blog post?')) return;
    try {
      const res = await fetch(apiUrl(`/api/admin/blog-posts/${id}`), { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Archive blog post failed:', error);
    }
  };

  const updateBlogStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/blog-posts/${id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error('Update blog status failed:', error);
    }
  };

  const handleAdminReply = async (sessionId: string, replyToId?: number) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'admin', text: replyText, sessionId, replyToId })
      });
      if (res.ok) {
        setReplyText('');
        setReplyingTo(null);
        setReplyingToMessageId(null);
        fetchData();
      }
    } catch (error) {
      console.error('Admin reply failed:', error);
    }
  };

  const filteredForms = formResponses.filter(res => 
    res.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (res.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const chatConversations = useMemo<ChatConversation[]>(() => {
    const bySession = new Map<string, ChatConversation>();

    chatSessions.forEach((session) => {
      bySession.set(session.id, {
        sessionId: session.id,
        name: session.name,
        email: session.email,
        createdAt: session.createdAt,
        messages: [],
        lastMessage: null,
        lastMessageAt: session.messages[0]?.timestamp || session.createdAt,
        status: 'open',
        unreadCount: unreadBySession[session.id] || 0,
      });
    });

    chatMessages.forEach((message) => {
      const existing = bySession.get(message.sessionId);
      if (existing) {
        existing.name = existing.name || message.session?.name || null;
        existing.email = existing.email || message.session?.email || null;
        existing.messages.push(message);
        return;
      }

      bySession.set(message.sessionId, {
        sessionId: message.sessionId,
        name: message.session?.name || null,
        email: message.session?.email || null,
        createdAt: message.timestamp,
        messages: [message],
        lastMessage: null,
        lastMessageAt: message.timestamp,
        status: 'open',
        unreadCount: unreadBySession[message.sessionId] || 0,
      });
    });

    return Array.from(bySession.values())
      .map((conversation) => {
        const messages = [...conversation.messages].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );
        const lastMessage = messages[messages.length - 1] || null;
        const lastSender = lastMessage?.sender?.toLowerCase();
        const status: ChatConversation['status'] = lastSender === 'admin'
          ? 'replied'
          : lastSender === 'bot'
            ? 'bot-replied'
            : 'open';

        return {
          ...conversation,
          messages,
          lastMessage,
          lastMessageAt: lastMessage?.timestamp || conversation.lastMessageAt,
          status,
          unreadCount: unreadBySession[conversation.sessionId] || 0,
        };
      })
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0).getTime() - new Date(a.lastMessageAt || a.createdAt || 0).getTime());
  }, [chatMessages, chatSessions, unreadBySession]);

  const filteredChatConversations = chatConversations.filter((conversation) => {
    const term = searchTerm.toLowerCase();
    const lastText = conversation.lastMessage?.text || '';
    return (
      conversation.sessionId.toLowerCase().includes(term) ||
      (conversation.name?.toLowerCase().includes(term) || false) ||
      (conversation.email?.toLowerCase().includes(term) || false) ||
      lastText.toLowerCase().includes(term)
    );
  });

  const selectedConversation = chatConversations.find(
    (conversation) => conversation.sessionId === selectedConversationId,
  ) || filteredChatConversations[0] || null;

  useEffect(() => {
    if (!selectedConversationId && filteredChatConversations[0]?.sessionId && !replyText.trim()) {
      setSelectedConversationId(filteredChatConversations[0].sessionId);
    }
  }, [filteredChatConversations, replyText, selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId) return;
    setUnreadBySession((prev) => {
      if (!prev[selectedConversationId]) return prev;
      return { ...prev, [selectedConversationId]: 0 };
    });
  }, [selectedConversationId]);

  useEffect(() => {
    const currentUserMessageIds = new Set(
      chatMessages
        .filter((message) => message.sender?.toLowerCase() === 'user')
        .map((message) => message.id),
    );

    if (!hasInitializedMessageWatchRef.current) {
      seenUserMessageIdsRef.current = currentUserMessageIds;
      hasInitializedMessageWatchRef.current = true;
      return;
    }

    const newUserMessages = chatMessages.filter(
      (message) => message.sender?.toLowerCase() === 'user' && !seenUserMessageIdsRef.current.has(message.id),
    );

    if (newUserMessages.length > 0) {
      setUnreadBySession((prev) => {
        const next = { ...prev };
        newUserMessages.forEach((message) => {
          if (message.sessionId !== selectedConversationId) {
            next[message.sessionId] = (next[message.sessionId] || 0) + 1;
          }
        });
        return next;
      });

      if (soundAlertsEnabled) {
        playNotificationSound();
      }
    }

    seenUserMessageIdsRef.current = currentUserMessageIds;
  }, [chatMessages, selectedConversationId, soundAlertsEnabled]);

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'chats' || !selectedConversationId) return;

    const refreshSelectedConversation = async () => {
      try {
        const response = await fetch(apiUrl(`/api/chat/${selectedConversationId}`));
        if (!response.ok) return;
        const sessionMessages = await response.json() as ChatMessage[];
        setChatMessages((prev) => [
          ...prev.filter((message) => message.sessionId !== selectedConversationId),
          ...sessionMessages.map((message) => ({
            ...message,
            session: {
              name: selectedConversation?.name || null,
              email: selectedConversation?.email || null,
            },
          })),
        ]);
      } catch (error) {
        console.error('Failed to refresh selected chat:', error);
      }
    };

    const interval = setInterval(refreshSelectedConversation, 3000);
    return () => clearInterval(interval);
  }, [activeTab, isAuthenticated, selectedConversation?.email, selectedConversation?.name, selectedConversationId]);

  const filteredLeads = chatSessions.filter(session => 
    (session.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (session.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    session.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4">
              <Lock className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Admin Login</h2>
            <p className="text-zinc-500 text-sm">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Email Address</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="admin@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Password</label>
              <div className="relative">
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  leftIcon={<Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />}
                  toggleLabel="admin password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="mt-2 text-right">
                <Link to="/admin/forgot-password" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">
                  Forgot password?
                </Link>
              </div>
            </div>

            {loginError && (
              <p className="text-red-500 text-sm text-center font-medium">{loginError}</p>
            )}

            <button 
              type="submit"
              className="w-full bg-zinc-900 text-white py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
            >
              Sign In
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const canViewOperations = isOperationsRole(user?.role);

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-zinc-900">Admin Dashboard</h1>
              {user && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isSuperAdmin(user.role) ? 'bg-red-100 text-red-600' : 
                  isBlogEditor(user.role) ? 'bg-blue-100 text-blue-600' : 
                  'bg-zinc-100 text-zinc-600'
                }`}>
                  {user.role}
                </span>
              )}
            </div>
            <p className="text-zinc-500">Manage your site responses and chat history</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchData()}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm font-medium hover:bg-zinc-50 transition-colors"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={enableSoundAlerts}
              className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                soundAlertsEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {soundAlertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {soundAlertsEnabled ? 'Sound alerts on' : 'Enable sound alerts'}
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search by name, email, or content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <Tabs.List className="flex flex-wrap gap-2 p-1 bg-zinc-200/50 rounded-2xl w-fit">
            {canViewOperations && (
              <>
                <Tabs.Trigger 
                  value="forms"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500"
                >
                  <ClipboardList className="w-4 h-4" />
                  Form Responses
                  <span className="ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400">
                    {filteredForms.length}
                  </span>
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="leads"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500"
                >
                  <Users className="w-4 h-4" />
                  Chat Leads
                  <span className="ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400">
                    {filteredLeads.length}
                  </span>
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="chats"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat History
                  <span className="ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400">
                    {filteredChatConversations.length}
                  </span>
                </Tabs.Trigger>
              </>
            )}
            {isBlogAuthor(user?.role) && (
              <Tabs.Trigger 
                value="blog"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500"
              >
                <FileText className="w-4 h-4" />
                Blog CMS
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400">
                  {cmsBlogPosts.length}
                </span>
              </Tabs.Trigger>
            )}
            {canViewOperations && (
              <Tabs.Trigger 
                value="comments"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500"
              >
                <MessageSquare className="w-4 h-4" />
                Blog Comments
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400">
                  {blogComments.length}
                </span>
              </Tabs.Trigger>
            )}
            {isSuperAdmin(user?.role) && (
              <Tabs.Trigger 
                value="users"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm text-zinc-500"
              >
                <Users className="w-4 h-4" />
                User Management
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-100 rounded-md text-[10px] text-zinc-400">
                  {users.length}
                </span>
              </Tabs.Trigger>
            )}
          </Tabs.List>

          {canViewOperations && (
            <>
          <Tabs.Content value="forms" className="outline-none">
            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-bottom border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Email</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Phone</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Message</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {filteredForms.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                          {searchTerm ? `No results matching "${searchTerm}"` : 'No form responses found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredForms.map((res) => (
                        <tr key={res.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {format(new Date(res.createdAt), 'MMM d, h:mm a')}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-zinc-900">{res.name}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600">{res.email}</td>
                          <td className="px-6 py-4 text-sm text-zinc-600 font-mono whitespace-nowrap">{res.phone || '-'}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{res.message}</td>
                          <td className="px-6 py-4 text-right">
                            {(isSuperAdmin(user?.role) || user?.role === 'editor') && (
                              <button 
                                onClick={() => deleteFormResponse(res.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="leads" className="outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeads.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-400 italic bg-white rounded-3xl border border-zinc-200">
                  {searchTerm ? `No results matching "${searchTerm}"` : 'No chat leads found.'}
                </div>
              ) : (
                filteredLeads.map((session) => (
                  <div key={session.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-zinc-900">{session.name || 'Anonymous'}</h3>
                        <p className="text-sm text-zinc-500">{session.email || 'No email provided'}</p>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {session.id.slice(0, 8)}...
                      </span>
                    </div>
                    
                    {session.messages[0] && (
                      <div className="bg-zinc-50 p-3 rounded-xl">
                        <p className="text-xs text-zinc-400 uppercase font-bold tracking-wider mb-1 text-[10px]">Last Message</p>
                        <p className="text-sm text-zinc-700 line-clamp-2 italic">"{session.messages[0].text}"</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-zinc-100">
                      <span className="text-[10px] text-zinc-400">
                        Started {format(new Date(session.createdAt), 'MMM d, h:mm a')}
                      </span>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => {
                            setReplyingTo(session.id);
                            setSelectedConversationId(session.id);
                            setReplyText('');
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm(session.id);
                            setSelectedConversationId(session.id);
                            setReplyingTo(session.id);
                            setActiveTab('chats');
                          }}
                          className="text-xs font-bold text-zinc-500 hover:text-zinc-900"
                        >
                          View Full Chat
                        </button>
                      </div>
                    </div>

                    {replyingTo === session.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-2"
                      >
                        <textarea 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type your reply..."
                          className="w-full p-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => setReplyingTo(null)}
                            className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => handleAdminReply(session.id)}
                            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            Send Reply
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Tabs.Content>

          <Tabs.Content value="chats" className="outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)] gap-6">
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Conversations</h3>
                    <p className="text-xs text-zinc-500">Updates every 5 seconds</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-zinc-100 text-[10px] font-bold text-zinc-500">
                    {filteredChatConversations.length}
                  </span>
                </div>

                <div className="max-h-[680px] overflow-y-auto divide-y divide-zinc-100">
                  {filteredChatConversations.length === 0 ? (
                    <div className="px-5 py-12 text-center text-sm text-zinc-400 italic">
                      {searchTerm ? `No conversations matching "${searchTerm}"` : 'No chat conversations found.'}
                    </div>
                  ) : (
                    filteredChatConversations.map((conversation) => (
                      <button
                        key={conversation.sessionId}
                        type="button"
                        onClick={() => {
                          if (conversation.sessionId !== selectedConversationId) {
                            setReplyText('');
                          }
                          setSelectedConversationId(conversation.sessionId);
                          setReplyingTo(conversation.sessionId);
                          setReplyingToMessageId(null);
                          setActiveTab('chats');
                        }}
                        className={`w-full text-left px-5 py-4 transition-colors ${
                          selectedConversation?.sessionId === conversation.sessionId
                            ? 'bg-emerald-50'
                            : 'bg-white hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-zinc-900">
                                {conversation.name || conversation.email || 'Anonymous visitor'}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-zinc-500">
                              {conversation.email || `Session ${conversation.sessionId.slice(0, 8)}`}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] text-zinc-400">
                            {conversation.lastMessageAt ? format(new Date(conversation.lastMessageAt), 'MMM d, h:mm a') : '-'}
                          </span>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm text-zinc-600">
                          {conversation.lastMessage?.text || 'No messages yet.'}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            conversation.status === 'replied'
                              ? 'bg-emerald-100 text-emerald-700'
                              : conversation.status === 'bot-replied'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                          }`}>
                            {conversation.status}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {conversation.messages.length} messages
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden min-h-[520px]">
                {selectedConversation ? (
                  <div className="flex h-full min-h-[520px] flex-col">
                    <div className="px-6 py-5 border-b border-zinc-100 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900">
                          {selectedConversation.name || selectedConversation.email || 'Anonymous visitor'}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          {selectedConversation.email || 'No email provided'} · {selectedConversation.sessionId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {selectedConversation.messages.length} messages
                        </span>
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                          selectedConversation.status === 'replied'
                            ? 'bg-emerald-100 text-emerald-700'
                            : selectedConversation.status === 'bot-replied'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedConversation.status}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-50 px-6 py-6">
                      {selectedConversation.messages.map((message) => {
                        const sender = message.sender.toLowerCase();
                        const isAdminMessage = sender === 'admin';
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[86%] rounded-2xl border px-4 py-3 shadow-sm ${
                              isAdminMessage
                                ? 'border-emerald-100 bg-emerald-600 text-white'
                                : sender === 'bot'
                                  ? 'border-blue-100 bg-blue-50 text-zinc-800'
                                  : 'border-zinc-200 bg-white text-zinc-800'
                            }`}>
                              <div className="mb-1 flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                  isAdminMessage ? 'text-emerald-50' : sender === 'bot' ? 'text-blue-700' : 'text-zinc-500'
                                }`}>
                                  {sender === 'admin' ? 'Admin' : sender === 'bot' ? 'Bot' : 'Visitor'}
                                </span>
                                <span className={`text-[10px] ${isAdminMessage ? 'text-emerald-50/80' : 'text-zinc-400'}`}>
                                  {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                              {message.replyToId && (
                                <p className={`mt-2 border-l-2 pl-2 text-[10px] ${
                                  isAdminMessage ? 'border-emerald-200 text-emerald-50/80' : 'border-zinc-200 text-zinc-400'
                                }`}>
                                  Replying to message ID {message.replyToId}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="border-t border-zinc-100 bg-white p-5">
                      <textarea
                        value={replyingTo === selectedConversation.sessionId ? replyText : ''}
                        onChange={(e) => {
                          setReplyingTo(selectedConversation.sessionId);
                          setReplyingToMessageId(null);
                          setReplyText(e.target.value);
                        }}
                        placeholder="Type your reply to this conversation..."
                        className="w-full rounded-xl border border-zinc-200 p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-emerald-500/20"
                        rows={3}
                      />
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-xs text-zinc-400">Selected thread refreshes every 3 seconds.</p>
                        <button
                          type="button"
                          onClick={() => handleAdminReply(selectedConversation.sessionId)}
                          disabled={!replyText.trim() || replyingTo !== selectedConversation.sessionId}
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-[520px] items-center justify-center px-6 text-center text-sm text-zinc-400">
                    Select a conversation to view the full thread.
                  </div>
                )}
              </div>
            </div>
          </Tabs.Content>

            </>
          )}

          {isBlogAuthor(user?.role) && (
            <Tabs.Content value="blog" className="outline-none space-y-8">
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-8">
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-emerald-600" />
                      <h3 className="text-xl font-bold text-zinc-900">{blogForm.id ? 'Edit Blog Post' : 'Create Blog Draft'}</h3>
                    </div>
                    {blogForm.id && (
                      <button onClick={resetBlogForm} className="text-xs font-bold text-zinc-500 hover:text-zinc-900">
                        New Draft
                      </button>
                    )}
                  </div>

                  {blogError && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{blogError}</p>}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Title</label>
                      <input
                        value={blogForm.title}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        placeholder="Article title"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Slug</label>
                        <input
                          value={blogForm.slug}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, slug: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          placeholder="auto-created from title"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Category</label>
                        <input
                          value={blogForm.category}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Description</label>
                      <textarea
                        value={blogForm.description}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Excerpt</label>
                      <textarea
                        value={blogForm.excerpt}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, excerpt: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Tags</label>
                        <input
                          value={blogForm.tags}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, tags: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          placeholder="SEO, CRM, Automation"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Read Time</label>
                        <input
                          value={blogForm.readTime}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, readTime: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Author</label>
                        <input
                          value={blogForm.author}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, author: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Image URL</label>
                        <input
                          value={blogForm.image}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, image: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">Content HTML</label>
                      <textarea
                        value={blogForm.content}
                        onChange={(e) => setBlogForm(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 font-mono text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none resize-y"
                        rows={10}
                        placeholder="<p>Write the article content...</p>"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">SEO Title</label>
                        <input
                          value={blogForm.seoTitle}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-1">SEO Description</label>
                        <input
                          value={blogForm.seoDescription}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        />
                      </div>
                    </div>
                    {isSuperAdmin(user?.role) && (
                      <label className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                        <input
                          type="checkbox"
                          checked={blogForm.featured}
                          onChange={(e) => setBlogForm(prev => ({ ...prev, featured: e.target.checked }))}
                          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Featured article
                      </label>
                    )}
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button onClick={() => saveBlogPost('draft')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800">
                        <Save className="w-4 h-4" />
                        Save Draft
                      </button>
                      <button onClick={() => saveBlogPost('submitted')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700">
                        <UploadCloud className="w-4 h-4" />
                        Submit for Review
                      </button>
                      {isBlogEditor(user?.role) && (
                        <>
                          <button onClick={() => saveBlogPost('published')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700">
                            <Star className="w-4 h-4" />
                            Publish
                          </button>
                          <button onClick={() => saveBlogPost('unpublished')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 text-zinc-700 text-sm font-bold hover:bg-zinc-200">
                            Unpublish
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-zinc-100">
                    <h3 className="text-xl font-bold text-zinc-900">Blog Workflow</h3>
                    <p className="text-sm text-zinc-500">Authors see their own posts. Editors and Super Admins can review the queue.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50 border-bottom border-zinc-100">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Post</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Status</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Featured</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Updated</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {cmsBlogPosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">No CMS blog posts yet.</td>
                          </tr>
                        ) : (
                          cmsBlogPosts.map((post) => (
                            <tr key={post.id} className="hover:bg-zinc-50/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="max-w-sm">
                                  <p className="font-bold text-zinc-900 line-clamp-1">{post.title}</p>
                                  <p className="text-xs text-zinc-400 font-mono">/blog/{post.slug}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                  post.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                                  post.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                  post.status === 'archived' ? 'bg-zinc-200 text-zinc-600' :
                                  'bg-amber-100 text-amber-700'
                                }`}>
                                  {post.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-zinc-500">{post.featured ? 'Yes' : 'No'}</td>
                              <td className="px-6 py-4 text-sm text-zinc-500">{format(new Date(post.updatedAt), 'MMM d, yyyy')}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button onClick={() => editBlogPost(post)} className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                                    Edit
                                  </button>
                                  {isBlogEditor(user?.role) && post.status !== 'published' && (
                                    <button onClick={() => updateBlogStatus(post.id, 'published')} className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                                      Publish
                                    </button>
                                  )}
                                  {isSuperAdmin(user?.role) && (
                                    <button onClick={() => archiveBlogPost(post.id)} className="p-2 text-zinc-400 hover:text-red-600 transition-colors" title="Archive">
                                      <Archive className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </Tabs.Content>
          )}

          {canViewOperations && (
          <Tabs.Content value="comments" className="outline-none">
            <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-bottom border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Post ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Comment</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {blogComments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-400 italic">
                          No blog comments found.
                        </td>
                      </tr>
                    ) : (
                      blogComments.map((comment) => (
                        <tr key={comment.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {format(new Date(comment.createdAt), 'MMM d, h:mm a')}
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-zinc-600">{comment.postId}</td>
                          <td className="px-6 py-4 text-sm font-bold text-zinc-900">{comment.name}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{comment.text}</td>
                          <td className="px-6 py-4 text-right">
                            {isBlogEditor(user?.role) && (
                              <button 
                                onClick={() => deleteBlogComment(comment.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Tabs.Content>
          )}

          {isSuperAdmin(user?.role) && (
            <Tabs.Content value="users" className="outline-none space-y-8">
              {/* Create User Form */}
              <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm max-w-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <UserPlus className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-bold text-zinc-900">Create New User</h3>
                </div>
                <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Email</label>
                    <input 
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Password</label>
                    <PasswordInput
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-4 pr-12 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                      toggleLabel="new user password"
                      autoComplete="new-password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="col-span-full md:col-span-1">
                    <label className="block text-sm font-semibold text-zinc-700 mb-1">Role</label>
                    <select 
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="blog_editor">Blog Editor</option>
                      <option value="blog_author">Blog Author</option>
                      <option value="admin">Legacy Admin</option>
                      <option value="editor">Legacy Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="col-span-full flex items-end">
                    <button 
                      type="submit"
                      className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/10"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-bottom border-zinc-100">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">User</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Role</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Joined</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-zinc-400" />
                              </div>
                              <span className="text-sm font-bold text-zinc-900">{u.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={u.role}
                              onChange={(e) => updateUserRole(u.id, e.target.value)}
                              disabled={u.email === user.email}
                              className="text-sm border-none bg-transparent focus:ring-0 font-medium text-zinc-600 cursor-pointer disabled:cursor-not-allowed"
                            >
                              <option value="super_admin">Super Admin</option>
                              <option value="blog_editor">Blog Editor</option>
                              <option value="blog_author">Blog Author</option>
                              <option value="admin">Legacy Admin</option>
                              <option value="editor">Legacy Editor</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500">
                            {format(new Date(u.createdAt), 'MMM d, yyyy')}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.email !== user.email && (
                              <button 
                                onClick={() => deleteUser(u.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Tabs.Content>
          )}
        </Tabs.Root>
      </div>
    </div>
  );
};
