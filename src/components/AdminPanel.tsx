import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as Tabs from '@radix-ui/react-tabs';
import { LayoutDashboard, MessageSquare, ClipboardList, LogOut, Trash2, RefreshCcw, Lock, User as UserIcon, Search, Users, UserPlus, Shield, Send } from 'lucide-react';
import { format } from 'date-fns';
import { apiUrl } from '../utils/apiUrl';

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

interface User {
  id: number;
  email: string;
  role: string;
  createdAt: string;
}

interface BlogPostComment {
  id: number;
  postId: string;
  name: string;
  text: string;
  createdAt: string;
}

export const AdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [blogComments, setBlogComments] = useState<BlogPostComment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyingToMessageId, setReplyingToMessageId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const checkAuth = async () => {
    try {
      const res = await fetch(apiUrl('/api/admin/check-auth'));
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        setUser(data.user);
        fetchData();
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
      const interval = setInterval(() => fetchData(true), 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const endpoints = [
        fetch(apiUrl('/api/admin/forms')),
        fetch(apiUrl('/api/admin/chats')),
        fetch(apiUrl('/api/admin/sessions')),
        fetch(apiUrl('/api/admin/blog-comments'))
      ];

      // Only fetch users if admin
      if (user?.role === 'admin') {
        endpoints.push(fetch(apiUrl('/api/admin/users')));
      }

      const results = await Promise.all(endpoints);
      
      // Handle unauthorized
      if (results.some(r => r.status === 401)) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      if (results[0].ok) setFormResponses(await results[0].json());
      if (results[1].ok) setChatMessages(await results[1].json());
      if (results[2].ok) setChatSessions(await results[2].json());
      if (results[3].ok) setBlogComments(await results[3].json());
      if (results[4]?.ok) setUsers(await results[4].json());
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
        fetchData();
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

  const filteredChats = chatMessages.filter(msg => 
    msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    msg.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (msg.session?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (msg.session?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );

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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
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

  return (
    <div className="min-h-screen bg-zinc-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-zinc-900">Admin Dashboard</h1>
              {user && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'admin' ? 'bg-red-100 text-red-600' : 
                  user.role === 'editor' ? 'bg-blue-100 text-blue-600' : 
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

        <Tabs.Root defaultValue="forms" className="space-y-6">
          <Tabs.List className="flex gap-2 p-1 bg-zinc-200/50 rounded-2xl w-fit">
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
                {filteredChats.length}
              </span>
            </Tabs.Trigger>
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
            {user?.role === 'admin' && (
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
                          <td className="px-6 py-4 text-sm text-zinc-600 font-mono whitespace-nowrap">{res.phone || '—'}</td>
                          <td className="px-6 py-4 text-sm text-zinc-500 max-w-xs truncate">{res.message}</td>
                          <td className="px-6 py-4 text-right">
                            {(user?.role === 'admin' || user?.role === 'editor') && (
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
                            setReplyText('');
                          }}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Reply
                        </button>
                        <Tabs.Trigger 
                          value="chats"
                          onClick={() => setSearchTerm(session.id)}
                          className="text-xs font-bold text-zinc-500 hover:text-zinc-900"
                        >
                          View Full Chat
                        </Tabs.Trigger>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChats.length === 0 ? (
                <div className="col-span-full py-12 text-center text-zinc-400 italic bg-white rounded-3xl border border-zinc-200">
                  {searchTerm ? `No results matching "${searchTerm}"` : 'No chat history found.'}
                </div>
              ) : (
                filteredChats.map((msg) => (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                            msg.sender === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {msg.sender}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                            ID: {msg.sessionId}
                          </span>
                        </div>
                        {msg.session?.name && (
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                            <span className="text-zinc-900 font-bold">{msg.session.name}</span>
                            <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                            <span>{msg.session.email}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-700 leading-relaxed">
                      {msg.text}
                    </p>
                    {msg.replyToId && (
                      <div className="mt-1 pl-3 border-l-2 border-emerald-200">
                        <p className="text-[10px] text-zinc-400 font-medium">Replying to message ID: {msg.replyToId}</p>
                      </div>
                    )}
                    <div className="mt-2 pt-3 border-t border-zinc-50 flex flex-col gap-3">
                      {replyingToMessageId === msg.id ? (
                        <div className="w-full space-y-2">
                          <textarea 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`Replying to message ${msg.id}...`}
                            className="w-full p-3 text-sm rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => setReplyingToMessageId(null)}
                              className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleAdminReply(msg.sessionId, msg.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                            >
                              Send Reply
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => {
                              setReplyingToMessageId(msg.id);
                              setReplyingTo(null);
                              setReplyText('');
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                          >
                            <Send className="w-3 h-3" />
                            Reply to Message
                          </button>
                          
                          {replyingTo === msg.sessionId ? (
                            <div className="w-full space-y-2">
                              <textarea 
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Type your reply to session..."
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
                                  onClick={() => handleAdminReply(msg.sessionId)}
                                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                  Send Reply
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setReplyingTo(msg.sessionId);
                                setReplyingToMessageId(null);
                                setReplyText('');
                              }}
                              className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                              Reply to Session
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Tabs.Content>

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
                            {(user?.role === 'admin' || user?.role === 'editor') && (
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

          {user?.role === 'admin' && (
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
                    <input 
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 outline-none"
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
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
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
                              <option value="admin">Admin</option>
                              <option value="editor">Editor</option>
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
