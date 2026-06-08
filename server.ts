import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getAllBlogPosts, getBlogPostById } from './src/data/blog/utils.ts';
import type { NextFunction, Request, Response } from 'express';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

const isProd = process.env.NODE_ENV === 'production';
// console.log('[debug] NODE_ENV:', process.env.NODE_ENV, '| isProd:', isProd);
const app = express();
const prisma = new PrismaClient();
const __dirname = path.resolve();

const allBlogPosts = getAllBlogPosts();
const adminCookieName = 'primewayz_admin_token';

function getJwtSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_secret';
}

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 8 * 60 * 60 * 1000,
  };
}

function getClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.COOKIE_SECURE === 'true',
  };
}

type AdminRequest = Request & {
  adminUser?: {
    id: number;
    email: string;
    role: string;
  };
};

const isSuperAdmin = (role?: string) => role === 'super_admin' || role === 'admin';
const isBlogAuthor = (role?: string) =>
  isSuperAdmin(role) || role === 'blog_editor' || role === 'editor' || role === 'blog_author';
const isOperationsRole = (role?: string) =>
  isSuperAdmin(role) || role === 'editor' || role === 'viewer';

function parseId(value: string) {
  const id = Number.parseInt(value, 10);
  return Number.isFinite(id) ? id : null;
}

function toTagArray(tags: unknown) {
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
  if (typeof tags === 'string') {
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function normalizeRole(role?: string) {
  if (!role) return 'viewer';
  return role === 'ADMIN' ? 'admin' : role;
}

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function dateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[adminCookieName];
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const decoded = jwt.verify(token, getJwtSecret()) as { email?: string };
    if (!decoded.email) return res.status(401).json({ success: false, error: 'Invalid session' });

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid session' });

    req.adminUser = { id: user.id, email: user.email, role: normalizeRole(user.role) };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }
}

function requireRole(canAccess: (role?: string) => boolean) {
  return (req: AdminRequest, res: Response, next: NextFunction) => {
    if (!canAccess(req.adminUser?.role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    return next();
  };
}

async function getChatAvailabilityPayload() {
  let setting = null;
  let latestPresence = null;
  try {
    [setting, latestPresence] = await Promise.all([
      prisma.chatPresenceSetting.findFirst({ orderBy: { updatedAt: 'desc' } }),
      prisma.adminPresence.findFirst({ orderBy: { lastSeenAt: 'desc' } }),
    ]);
  } catch (err) {
    console.warn('[local-safe] Falling back to default chat availability:', err instanceof Error ? err.message : err);
  }
  const latestAdminSeenAt = latestPresence?.lastSeenAt ?? null;
  const hasActiveAdmin = latestAdminSeenAt
    ? Date.now() - latestAdminSeenAt.getTime() < 5 * 60 * 1000
    : false;
  const mode = (setting?.mode || 'auto') as 'auto' | 'online' | 'away' | 'offline';
  const computedStatus = hasActiveAdmin ? 'online' : 'assistant';
  const status = mode === 'auto' ? computedStatus : mode === 'online' ? 'online' : mode;

  return {
    status,
    title: status === 'online' ? 'We are online' : status === 'away' ? 'We are away' : status === 'offline' ? 'Chat offline' : 'AI assistant available',
    subtitle: setting?.message || (status === 'online' ? 'A team member is available now.' : 'Leave a message and we will follow up.'),
    responseExpectation: status === 'online' ? 'Usually replies shortly.' : 'We usually respond within one business day.',
    businessHours: 'Mon-Fri, UK business hours',
    canAcceptMessages: status !== 'offline',
    canBookCall: true,
    serverTime: new Date().toISOString(),
    mode,
    computedStatus,
    hasActiveAdmin,
    latestAdminSeenAt: latestAdminSeenAt?.toISOString() || null,
    customMessage: setting?.message || '',
  };
}

function publicUser(user: { id: number; email: string; role: string; createdAt?: Date }) {
  return {
    id: user.id,
    email: user.email,
    role: normalizeRole(user.role),
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };
}

// --- Middleware ---
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API routes: keep these above static files and frontend catch-all ---
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: normalizeRole(user.role) },
      getJwtSecret(),
      { expiresIn: '8h' },
    );

    res.cookie(adminCookieName, token, getCookieOptions());
    return res.json({
      success: true,
      authenticated: true,
      user: publicUser(user),
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/admin/check-auth', async (req, res) => {
  try {
    const token = req.cookies?.[adminCookieName];
    if (!token) return res.status(401).json({ success: false, authenticated: false, error: 'Not authenticated' });

    const decoded = jwt.verify(token, getJwtSecret()) as { id?: number; email?: string; role?: string };
    if (!decoded.email) return res.status(401).json({ success: false, authenticated: false, error: 'Invalid session' });

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) return res.status(401).json({ success: false, authenticated: false, error: 'Invalid session' });

    return res.json({
      success: true,
      authenticated: true,
      user: publicUser(user),
    });
  } catch {
    return res.status(401).json({ success: false, authenticated: false, error: 'Invalid session' });
  }
});

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(adminCookieName, getClearCookieOptions());
  return res.json({ success: true });
});

app.get('/api/admin/forms', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const forms = await prisma.formResponse.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(forms);
});

app.delete('/api/admin/forms/:id', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid form id' });
  await prisma.formResponse.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/api/admin/chats', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { timestamp: 'desc' },
    include: {
      session: { select: { name: true, email: true } },
      attachments: true,
    },
  });
  res.json(messages);
});

app.get('/api/admin/sessions', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: { text: true, timestamp: true },
      },
    },
  });
  res.json(sessions);
});

app.get('/api/admin/blog-comments', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const comments = await prisma.blogPostComment.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(comments);
});

app.delete('/api/admin/blog-comments/:id', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid comment id' });
  await prisma.blogPostComment.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/api/admin/chat/appointments', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const appointments = await prisma.chatAppointmentRequest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(appointments);
});

app.patch('/api/admin/chat/appointments/:id', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid appointment id' });
  const appointment = await prisma.chatAppointmentRequest.update({
    where: { id },
    data: {
      status: typeof req.body.status === 'string' ? req.body.status : undefined,
      adminNote: typeof req.body.adminNote === 'string' ? req.body.adminNote : undefined,
    },
  });
  res.json(appointment);
});

app.get('/api/admin/blog-posts', requireAdmin, requireRole(isBlogAuthor), async (_req, res) => {
  const posts = await prisma.cmsBlogPost.findMany({ orderBy: { updatedAt: 'desc' } });
  res.json(posts.map((post) => ({ ...post, tags: toTagArray(post.tags) })));
});

app.post('/api/admin/blog-posts', requireAdmin, requireRole(isBlogAuthor), async (req: AdminRequest, res) => {
  const data = req.body;
  if (!data.title || !data.slug) return res.status(400).json({ error: 'Title and slug are required' });
  const post = await prisma.cmsBlogPost.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description || '',
      excerpt: data.excerpt || '',
      category: data.category || 'Digital Operations',
      tags: toTagArray(data.tags),
      date: data.date ? new Date(data.date) : null,
      author: data.author || 'Primewayz UK Team',
      readTime: data.readTime || '5 min read',
      image: data.image || null,
      content: data.content || '',
      featured: Boolean(data.featured),
      seoTitle: data.seoTitle || null,
      seoDescription: data.seoDescription || null,
      status: data.status || 'draft',
      createdById: req.adminUser!.id,
      updatedById: req.adminUser!.id,
      publishedAt: data.status === 'published' ? new Date() : null,
    },
  });
  res.status(201).json({ ...post, tags: toTagArray(post.tags) });
});

app.patch('/api/admin/blog-posts/:id', requireAdmin, requireRole(isBlogAuthor), async (req: AdminRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid blog post id' });
  const data = req.body;
  const post = await prisma.cmsBlogPost.update({
    where: { id },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      excerpt: data.excerpt,
      category: data.category,
      tags: data.tags === undefined ? undefined : toTagArray(data.tags),
      date: data.date ? new Date(data.date) : undefined,
      author: data.author,
      readTime: data.readTime,
      image: data.image === undefined ? undefined : data.image || null,
      content: data.content,
      featured: data.featured === undefined ? undefined : Boolean(data.featured),
      seoTitle: data.seoTitle === undefined ? undefined : data.seoTitle || null,
      seoDescription: data.seoDescription === undefined ? undefined : data.seoDescription || null,
      status: data.status,
      updatedById: req.adminUser!.id,
      publishedAt: data.status === 'published' ? new Date() : undefined,
      archivedAt: data.status === 'archived' ? new Date() : undefined,
    },
  });
  res.json({ ...post, tags: toTagArray(post.tags) });
});

app.delete('/api/admin/blog-posts/:id', requireAdmin, requireRole(isBlogAuthor), async (req: AdminRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid blog post id' });
  await prisma.cmsBlogPost.update({
    where: { id },
    data: { status: 'archived', archivedAt: new Date(), updatedById: req.adminUser!.id },
  });
  res.json({ success: true });
});

app.get('/api/admin/users', requireAdmin, requireRole(isSuperAdmin), async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users.map(publicUser));
});

app.post('/api/admin/users', requireAdmin, requireRole(isSuperAdmin), async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const user = await prisma.user.create({
    data: {
      email,
      password: bcrypt.hashSync(password, 12),
      role: normalizeRole(role),
    },
  });
  res.status(201).json(publicUser(user));
});

app.patch('/api/admin/users/:id', requireAdmin, requireRole(isSuperAdmin), async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid user id' });
  const user = await prisma.user.update({ where: { id }, data: { role: normalizeRole(req.body.role) } });
  res.json(publicUser(user));
});

app.delete('/api/admin/users/:id', requireAdmin, requireRole(isSuperAdmin), async (req: AdminRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid user id' });
  if (id === req.adminUser!.id) return res.status(400).json({ error: 'You cannot delete your own account' });
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/api/admin/chat/availability', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  res.json(await getChatAvailabilityPayload());
});

app.patch('/api/admin/chat/availability', requireAdmin, requireRole(isOperationsRole), async (req: AdminRequest, res) => {
  const mode = ['auto', 'online', 'away', 'offline'].includes(req.body.mode) ? req.body.mode : 'auto';
  await prisma.chatPresenceSetting.create({
    data: {
      mode,
      message: typeof req.body.message === 'string' ? req.body.message : null,
      updatedById: req.adminUser!.id,
    },
  });
  res.json(await getChatAvailabilityPayload());
});

app.post('/api/admin/presence/heartbeat', requireAdmin, requireRole(isOperationsRole), async (req: AdminRequest, res) => {
  await prisma.adminPresence.upsert({
    where: { userId: req.adminUser!.id },
    update: { lastSeenAt: new Date() },
    create: { userId: req.adminUser!.id, lastSeenAt: new Date() },
  });
  res.json({ success: true });
});

app.get('/api/admin/notifications/summary', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const { start, end } = todayRange();
  const [
    todayContactForms,
    todayChatSessions,
    todayVisitorMessages,
    todayAdminReplies,
    todayAppointments,
    pendingAppointments,
    todayUnansweredAlerts,
    todayEmailSentAlerts,
    todayEmailFailedAlerts,
    todayEmailSkippedAlerts,
    recentAlertCount,
    latestAlerts,
    latestDailySummary,
  ] = await Promise.all([
    prisma.formResponse.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.chatSession.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.chatMessage.count({ where: { sender: 'user', timestamp: { gte: start, lt: end } } }),
    prisma.chatMessage.count({ where: { sender: 'admin', timestamp: { gte: start, lt: end } } }),
    prisma.chatAppointmentRequest.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.chatAppointmentRequest.count({ where: { status: 'pending' } }),
    prisma.chatAlert.count({ where: { alertType: 'unanswered_chat', createdAt: { gte: start, lt: end } } }),
    prisma.chatAlert.count({ where: { status: 'sent', createdAt: { gte: start, lt: end } } }),
    prisma.chatAlert.count({ where: { status: 'failed', createdAt: { gte: start, lt: end } } }),
    prisma.chatAlert.count({ where: { status: 'skipped', createdAt: { gte: start, lt: end } } }),
    prisma.chatAlert.count({ where: { createdAt: { gte: start, lt: end } } }),
    prisma.chatAlert.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.leadSummaryEmail.findFirst({ orderBy: { createdAt: 'desc' } }),
  ]);

  res.json({
    dateKey: dateKey(),
    generatedAt: new Date().toISOString(),
    priority: pendingAppointments || todayUnansweredAlerts ? 'medium' : 'normal',
    counts: {
      todayContactForms,
      todayChatSessions,
      todayVisitorMessages,
      todayAdminReplies,
      todayAppointments,
      pendingAppointments,
      todayUnansweredAlerts,
      todayEmailSentAlerts,
      todayEmailFailedAlerts,
      todayEmailSkippedAlerts,
      recentAlertCount,
    },
    latestAlerts,
    latestDailySummary,
  });
});

app.patch('/api/admin/chat-alerts/:id/status', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid alert id' });
  const status = typeof req.body.status === 'string' ? req.body.status : 'reviewed';
  const alert = await prisma.chatAlert.update({ where: { id }, data: { status } });
  res.json(alert);
});

app.post('/api/admin/uploads', requireAdmin, requireRole(isBlogAuthor), (_req, res) => {
  res.status(501).json({ error: 'File uploads are not configured on this server yet.' });
});

app.post('/api/admin/chat/uploads', requireAdmin, requireRole(isOperationsRole), (_req, res) => {
  res.status(501).json({ error: 'Chat uploads are not configured on this server yet.' });
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message, phone } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const form = await prisma.formResponse.create({
      data: {
        name,
        email,
        message,
        phone: phone || null,
      },
    });

    res.status(201).json({ success: true, form });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Could not save contact request' });
  }
});

app.get('/api/chat/availability', async (_req, res) => {
  res.json(await getChatAvailabilityPayload());
});

app.post('/api/chat/session', async (req, res) => {
  const { sessionId, name, email } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const session = await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: { name: name || undefined, email: email || undefined },
    create: { id: sessionId, name: name || null, email: email || null },
  });

  res.json(session);
});

app.post('/api/chat/heartbeat', async (req, res) => {
  const { sessionId, userName, userEmail } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  const session = await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: {
      visitorLastSeenAt: new Date(),
      name: userName || undefined,
      email: userEmail || undefined,
    },
    create: {
      id: sessionId,
      name: userName || null,
      email: userEmail || null,
      visitorLastSeenAt: new Date(),
    },
  });

  res.json(session);
});

app.get('/api/chat/:sessionId', async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId: req.params.sessionId },
    orderBy: { timestamp: 'asc' },
    include: { attachments: true },
  });
  res.json(messages);
});

app.post('/api/chat', async (req, res) => {
  const { sessionId, sender, text, replyToId, attachmentIds } = req.body;
  if (!sessionId || !sender) return res.status(400).json({ error: 'sessionId and sender are required' });

  await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: {},
    create: { id: sessionId },
  });

  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      sender,
      text: text || 'Shared an attachment',
      answered: sender === 'admin' || sender === 'bot',
      replyToId: replyToId || null,
      attachments: Array.isArray(attachmentIds)
        ? { connect: attachmentIds.map((id: number) => ({ id })) }
        : undefined,
    },
    include: { attachments: true },
  });

  if (sender === 'admin') {
    await prisma.chatMessage.updateMany({
      where: { sessionId, sender: 'user', answered: false },
      data: { answered: true },
    });
  }

  res.status(201).json(message);
});

app.post('/api/chat/respond', async (req, res) => {
  const { sessionId, message, userName, attachmentIds } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message are required' });

  await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: { name: userName || undefined, visitorLastSeenAt: new Date() },
    create: { id: sessionId, name: userName || null, visitorLastSeenAt: new Date() },
  });

  const userMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      sender: 'user',
      text: message,
      answered: false,
      attachments: Array.isArray(attachmentIds)
        ? { connect: attachmentIds.map((id: number) => ({ id })) }
        : undefined,
    },
  });

  const botText = 'Thanks for your message. We have received it and the Primewayz UK team will follow up shortly.';
  const botMessage = await prisma.chatMessage.create({
    data: {
      sessionId,
      sender: 'bot',
      text: botText,
      answered: true,
      replyToId: userMessage.id,
    },
  });

  res.json({
    userMessage,
    botMessage,
    availability: await getChatAvailabilityPayload(),
  });
});

app.post('/api/chat/uploads', (_req, res) => {
  res.status(501).json({ error: 'Chat uploads are not configured on this server yet.' });
});

app.post('/api/chat/appointments', async (req, res) => {
  const { sessionId, name, email, phone, preferredDate, preferredTime, timezone, message } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  await prisma.chatSession.upsert({
    where: { id: sessionId },
    update: { name: name || undefined, email: email || undefined },
    create: { id: sessionId, name: name || null, email: email || null },
  });

  const appointment = await prisma.chatAppointmentRequest.create({
    data: {
      sessionId,
      name: name || null,
      email: email || null,
      phone: phone || null,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      timezone: timezone || 'Europe/London',
      message: message || null,
    },
  });

  res.status(201).json(appointment);
});

app.get('/api/blog/posts', (req, res) => {
  const publishedPosts = allBlogPosts.filter(p => p.status === 'published');
  res.json(publishedPosts);
});
app.get('/api/blog/posts/:id', (req, res) => {
  const post = getBlogPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// --- Static files ---
if (isProd) {
  app.use(express.static(path.join(__dirname, 'dist/client'), { index: false }));
}
app.use(express.static(path.join(__dirname, 'public')));

// -------------------------
// Local-safe Prisma wrappers
// -------------------------
async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  try {
    const adminExists = await prisma.user.findUnique({ where: { email: process.env.ADMIN_EMAIL } });
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12);
      await prisma.user.create({
        data: { email: process.env.ADMIN_EMAIL, password: hashedPassword, role: 'admin' }
      });
    }
  } catch (e: any) {
    console.warn('[local-safe] Skipping admin seed:', e.message);
  }
}

async function findUnansweredChatMessages() {
  try {
    return await prisma.chatMessage.findMany({ where: { answered: false } });
  } catch (e: any) {
    console.warn('[local-safe] Skipping unanswered chat messages:', e.message);
    return [];
  }
}

setInterval(async () => { await findUnansweredChatMessages(); }, 5 * 60 * 1000);
setInterval(async () => { /* daily lead summary */ }, 60 * 1000);

// -------------------------
// SSR / Dev catch-all
// -------------------------
async function createServer() {
  if (!isProd) {
    // In dev: use Vite as middleware — handles HMR, TS/JSX transforms automatically
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res) => {
      try {
        let html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
        // Vite transforms the HTML (injects HMR client etc.)
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        console.error('Dev render error:', err);
        res.status(500).send(err.message);
      }
    });
  } else {
    // In production: full SSR
    app.get('*', async (req, res) => {
      try {
        const indexHtml = await fs.readFile(path.join(__dirname, 'dist/client/index.html'), 'utf-8');
        const { render } = await import('./dist/server/entry-server.js');
        const { html: appHtml } = render(req.originalUrl);
        const html = indexHtml.replace('<!--ssr-outlet-->', appHtml);
        return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err: any) {
        console.error('SSR render error:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  seedAdmin();

  const port = parseInt(process.env.PORT || '3000');
  app.listen(port, () => {
    console.log(`[${isProd ? 'production' : 'dev'}] Server running at http://localhost:${port}`);
  });
}

createServer();
