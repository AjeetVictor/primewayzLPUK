import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { blogPosts } from './src/data/blogPosts.ts';
import { extraBlogPosts } from './src/data/extraBlogPosts.ts';

const allBlogPosts = [...blogPosts, ...extraBlogPosts];
const SYSTEM_INSTRUCTION = `You are the Primewayz Support Bot.
Primewayz is an elite software development agency that provides Engineering as a Service.
Key features:
- No contracts, cancel anytime.
- Elite engineering talent.
- Scalable development teams.
- Fixed monthly pricing.
- Fast delivery.

Your goal is to be helpful, professional, and encourage users to book a call or fill out the contact form.
Keep responses concise and friendly. If you do not know something, suggest speaking with a human expert.`;

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureDatabaseUrl() {
  const explicitDatabaseUrl = process.env.DATABASE_URL?.trim();
  if (explicitDatabaseUrl) {
    process.env.DATABASE_URL = explicitDatabaseUrl;
    return;
  }

  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '3306';
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  // Fallback to DB_* pieces when DATABASE_URL is not set.
  if (host && user && dbName) {
    const encodedUser = encodeURIComponent(user);
    const encodedPassword = encodeURIComponent(password || '');
    const auth = encodedPassword ? `${encodedUser}:${encodedPassword}` : encodedUser;
    process.env.DATABASE_URL = `mysql://${auth}@${host}:${port}/${dbName}`;
    return;
  }

  throw new Error(
    'Database config missing. Set DATABASE_URL or provide DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, and DB_NAME.',
  );
}

function logDatabaseTarget() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return;

  try {
    const parsed = new URL(dbUrl);
    const safeUser = parsed.username ? decodeURIComponent(parsed.username) : 'unknown-user';
    const safeHost = parsed.hostname || 'unknown-host';
    const safePort = parsed.port || '3306';
    const safeDb = parsed.pathname?.replace(/^\//, '') || 'unknown-db';
    console.log(`[db] target mysql://${safeUser}@${safeHost}:${safePort}/${safeDb}`);
  } catch {
    console.log('[db] DATABASE_URL is set but could not be parsed');
  }
}

function backendLog(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.log(`[backend] ${message}`, meta);
    return;
  }
  console.log(`[backend] ${message}`);
}

function dbLog(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.log(`[db] ${message}`, meta);
    return;
  }
  console.log(`[db] ${message}`);
}

ensureDatabaseUrl();
logDatabaseTarget();

const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'error', emit: 'event' },
  ],
});
(prisma as any).$on('warn', (e: any) => dbLog('prisma warn', { message: e?.message }));
(prisma as any).$on('error', (e: any) => dbLog('prisma error', { message: e?.message }));

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'your-secret-min-32-chars';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PORT = Number(process.env.PORT || 3000);
const rawAppBasePath = process.env.APP_BASE_PATH || '/';
const APP_BASE_PATH = rawAppBasePath === '/'
  ? '/'
  : `/${rawAppBasePath.replace(/^\/+|\/+$/g, '')}`;
const IS_ROOT_BASE_PATH = APP_BASE_PATH === '/';
const cookieSecure = process.env.COOKIE_SECURE === 'true';
const cookieSameSite: 'none' | 'lax' = cookieSecure ? 'none' : 'lax';
const CHAT_API_KEY = process.env.CHAT_API_KEY || '';
const CHAT_API_BASE = process.env.CHAT_API_BASE || 'https://api.openai.com/v1';
const CHAT_MODEL = process.env.CHAT_MODEL || 'gpt-4o-mini';
const CONTACT_NAME_REGEX = /^[a-zA-Z\s.'-]+$/;
const CONTACT_NAME_MIN = 2;
const CONTACT_NAME_MAX = 80;
const CONTACT_MESSAGE_MIN = 10;
const CONTACT_MESSAGE_MAX = 2000;
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

function getClientIp(req: express.Request): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  const xri = req.headers['x-real-ip'];
  if (typeof xri === 'string' && xri.length > 0) {
    return xri.trim();
  }
  return req.socket.remoteAddress || '';
}

function normalizeContactPhoneE164(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format('E.164');
}

async function verifyRecaptchaToken(token: unknown): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      backendLog('recaptcha: RECAPTCHA_SECRET_KEY not set; accepting submissions in development only');
      return true;
    }
    backendLog('recaptcha: RECAPTCHA_SECRET_KEY missing in production');
    return false;
  }
  if (typeof token !== 'string' || !token.trim()) {
    return false;
  }
  try {
    const params = new URLSearchParams();
    params.set('secret', secret);
    params.set('response', token.trim());
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (e) {
    backendLog('recaptcha: verification request failed', { error: String(e) });
    return false;
  }
}
const SEO_SITE_NAME = 'Primewayz';
const SEO_DEFAULT_OG_IMAGE = 'https://picsum.photos/seed/software/1200/630';
const SEO_DEFAULT_TWITTER_HANDLE = '@software_saas';

type SeoPayload = {
  title: string;
  description: string;
  canonical: string;
  ogType: 'website' | 'article';
  ogImage: string;
  twitterHandle: string;
  robots: string;
  structuredData: Record<string, unknown>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function joinUrl(base: string, pathname: string): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${cleanBase}${cleanPath}`;
}

function removeSeoTags(html: string): string {
  let output = html;
  output = output.replace(/<title>[\s\S]*?<\/title>/gi, '');
  output = output.replace(/<meta[^>]+name=["']description["'][^>]*>/gi, '');
  output = output.replace(/<meta[^>]+name=["']robots["'][^>]*>/gi, '');
  output = output.replace(/<meta[^>]+name=["']twitter:[^"']+["'][^>]*>/gi, '');
  output = output.replace(/<meta[^>]+property=["']og:[^"']+["'][^>]*>/gi, '');
  output = output.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
  output = output.replace(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,
    '',
  );
  return output;
}

function withSeoTags(html: string, seo: SeoPayload): string {
  const siteTitle = `${seo.title} | ${SEO_SITE_NAME}`;
  const structuredDataJson = JSON.stringify(seo.structuredData).replace(/</g, '\\u003c');
  const headTags = `
    <title>${escapeHtml(siteTitle)}</title>
    <meta name="description" content="${escapeHtml(seo.description)}" />
    <link rel="canonical" href="${escapeHtml(seo.canonical)}" />
    <meta name="robots" content="${escapeHtml(seo.robots)}" />
    <meta property="og:title" content="${escapeHtml(siteTitle)}" />
    <meta property="og:description" content="${escapeHtml(seo.description)}" />
    <meta property="og:type" content="${escapeHtml(seo.ogType)}" />
    <meta property="og:url" content="${escapeHtml(seo.canonical)}" />
    <meta property="og:image" content="${escapeHtml(seo.ogImage)}" />
    <meta property="og:site_name" content="${escapeHtml(SEO_SITE_NAME)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(siteTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(seo.description)}" />
    <meta name="twitter:image" content="${escapeHtml(seo.ogImage)}" />
    <meta name="twitter:site" content="${escapeHtml(seo.twitterHandle)}" />
    <meta name="twitter:creator" content="${escapeHtml(seo.twitterHandle)}" />
    <script type="application/ld+json">${structuredDataJson}</script>
  `;

  return removeSeoTags(html).replace('</head>', `${headTags}\n  </head>`);
}

function getOrigin(req: express.Request): string {
  const configured = process.env.SEO_SITE_URL?.trim() || process.env.PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = typeof forwardedProto === 'string' ? forwardedProto : req.protocol;
  return `${proto}://${req.get('host')}`;
}

function getAppPathname(requestPath: string): string {
  if (IS_ROOT_BASE_PATH) {
    return requestPath || '/';
  }
  if (requestPath === APP_BASE_PATH) {
    return '/';
  }
  const trimmed = requestPath.startsWith(APP_BASE_PATH)
    ? requestPath.slice(APP_BASE_PATH.length)
    : requestPath;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed || ''}`;
}

function getCanonicalPath(pathname: string): string {
  if (IS_ROOT_BASE_PATH) return pathname;
  if (pathname === '/') return APP_BASE_PATH;
  return `${APP_BASE_PATH}${pathname}`;
}

function getSeoPayload(pathname: string, origin: string): SeoPayload {
  const canonical = joinUrl(origin, getCanonicalPath(pathname));
  const defaultDescription = 'Primewayz offers elite software development as a service with predictable pricing and high-velocity delivery.';
  const baseOrg = {
    '@type': 'Organization',
    name: 'Primewayz Infortech Private Limited',
    url: joinUrl(origin, getCanonicalPath('/')),
    logo: 'https://picsum.photos/seed/logo/200/200',
  };

  if (pathname.startsWith('/blog/')) {
    const postId = pathname.replace('/blog/', '').replace(/\/+$/, '');
    const post = allBlogPosts.find((item) => item.id === postId);
    if (post) {
      return {
        title: post.title,
        description: post.excerpt,
        canonical,
        ogType: 'article',
        ogImage: post.image || SEO_DEFAULT_OG_IMAGE,
        twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
        robots: 'index,follow',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          image: [post.image || SEO_DEFAULT_OG_IMAGE],
          author: { '@type': 'Person', name: post.author },
          publisher: baseOrg,
          datePublished: post.date,
          dateModified: post.date,
          mainEntityOfPage: canonical,
        },
      };
    }
  }

  if (pathname.startsWith('/admin')) {
    return {
      title: 'Admin',
      description: 'Primewayz admin panel.',
      canonical,
      ogType: 'website',
      ogImage: SEO_DEFAULT_OG_IMAGE,
      twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
      robots: 'noindex,nofollow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Primewayz Admin',
        url: canonical,
      },
    };
  }

  return {
    title: 'Predictable Software Development as a Service',
    description: defaultDescription,
    canonical,
    ogType: 'website',
    ogImage: SEO_DEFAULT_OG_IMAGE,
    twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
    robots: 'index,follow',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Software Development as a Service',
      name: `${SEO_SITE_NAME} - Elite Engineering`,
      description: defaultDescription,
      provider: baseOrg,
      areaServed: 'Global',
    },
  };
}

async function generateBotReply(userMessage: string, userName?: string) {
  if (!CHAT_API_KEY) {
    return "Thanks for your message. Our assistant is currently unavailable. Please use the contact form and our team will get back to you shortly.";
  }

  const systemInstruction = userName?.trim()
    ? `${SYSTEM_INSTRUCTION}\nThe user's name is ${userName.trim()}. Acknowledge them by name occasionally.`
    : SYSTEM_INSTRUCTION;

  const response = await fetch(`${CHAT_API_BASE.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CHAT_API_KEY}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Chat provider error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as any;
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== 'string') {
    throw new Error('Chat provider returned an empty response');
  }

  return text.trim();
}

// Seed initial admin if not exists
async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;

  const adminExists = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL }
  });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin'
      }
    });
    backendLog('default admin user seeded');
  }
}

async function startServer() {
  await seedAdmin();

  const app = express();
  let viteDevServer: Awaited<ReturnType<typeof createViteServer>> | null = null;
  let productionTemplate = '';

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authorize = (roles: string[] = []) => {
    return (req: any, res: any, next: any) => {
      const token = req.cookies.admin_token;
      if (!token) return res.status(401).json({ error: 'Unauthorized' });

      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        if (roles.length > 0 && !roles.includes(decoded.role)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
  };

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Primewayz API is running' });
  });

  // Admin Login
  app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.cookie('admin_token', token, {
          httpOnly: true,
          secure: cookieSecure,
          sameSite: cookieSameSite,
          maxAge: 3600000 // 1 hour
        });

        return res.json({
          success: true,
          user: { email: user.email, role: user.role }
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }

    res.status(401).json({ error: 'Invalid credentials' });
  });

  app.post('/api/admin/logout', (req, res) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
  });

  app.get('/api/admin/check-auth', (req, res) => {
    const token = req.cookies.admin_token;
    if (!token) return res.json({ authenticated: false });

    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      res.json({
        authenticated: true,
        user: { email: decoded.email, role: decoded.role }
      });
    } catch (error) {
      res.json({ authenticated: false });
    }
  });

  // Default country for phone input (CF header or IP lookup; falls back to GB for UK site)
  app.get('/api/contact/phone-default', async (req, res) => {
    const cf = req.headers['cf-ipcountry'];
    if (typeof cf === 'string' && /^[A-Z]{2}$/.test(cf.trim())) {
      return res.json({ countryCode: cf.trim() });
    }
    const ip = getClientIp(req);
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1') {
      return res.json({ countryCode: 'GB' });
    }
    try {
      const lookup = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=countryCode`);
      if (lookup.ok) {
        const data = (await lookup.json()) as { countryCode?: string };
        if (data.countryCode && /^[A-Z]{2}$/.test(data.countryCode)) {
          return res.json({ countryCode: data.countryCode });
        }
      }
    } catch {
      // ignore
    }
    res.json({ countryCode: 'GB' });
  });

  // Contact Form Submission
  app.post('/api/contact', async (req, res) => {
    const rawName = typeof req.body?.name === 'string' ? req.body.name : '';
    const rawEmail = typeof req.body?.email === 'string' ? req.body.email : '';
    const rawMessage = typeof req.body?.message === 'string' ? req.body.message : '';
    const recaptchaToken = req.body?.recaptchaToken;

    const name = rawName.trim();
    const email = rawEmail.trim().toLowerCase();
    const message = rawMessage.trim();
    const phoneE164 = normalizeContactPhoneE164(req.body?.phone);

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
    }
    if (!phoneE164) {
      return res.status(400).json({ success: false, error: 'Please provide a valid contact number with country code.' });
    }
    if (name.length < CONTACT_NAME_MIN || name.length > CONTACT_NAME_MAX || !CONTACT_NAME_REGEX.test(name)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid full name.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
    }
    if (message.length < CONTACT_MESSAGE_MIN || message.length > CONTACT_MESSAGE_MAX) {
      return res.status(400).json({ success: false, error: `Message must be between ${CONTACT_MESSAGE_MIN} and ${CONTACT_MESSAGE_MAX} characters.` });
    }

    const captchaOk = await verifyRecaptchaToken(recaptchaToken);
    if (!captchaOk) {
      return res.status(400).json({
        success: false,
        error: 'Please complete the security verification (reCAPTCHA) and try again.',
      });
    }

    try {
      const response = await prisma.formResponse.create({
        data: { name, email, message, phone: phoneE164 },
      });
      backendLog('contact inquiry saved', { id: response.id, email });
      res.status(200).json({ success: true, data: response });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ success: false, error: 'Failed to save response' });
    }
  });

  // Chat Session Management
  app.post('/api/chat/session', async (req, res) => {
    const { sessionId, name, email } = req.body;
    try {
      const session = await prisma.chatSession.upsert({
        where: { id: sessionId },
        update: { name, email },
        create: { id: sessionId, name, email }
      });
      res.status(200).json({ success: true, data: session });
    } catch (error) {
      console.error('Chat session error:', error);
      res.status(500).json({ success: false, error: 'Failed to update session' });
    }
  });

  // Chat Message Submission
  app.post('/api/chat', async (req, res) => {
    const { sender, text, sessionId, replyToId } = req.body;
    try {
      // Ensure session exists
      await prisma.chatSession.upsert({
        where: { id: sessionId || 'default' },
        update: {},
        create: { id: sessionId || 'default' }
      });

      const message = await prisma.chatMessage.create({
        data: {
          sender,
          text,
          sessionId: sessionId || 'default',
          replyToId: replyToId ? parseInt(replyToId) : null
        }
      });
      res.status(200).json({ success: true, data: message });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ success: false, error: 'Failed to save message' });
    }
  });

  // Chat AI Response (server-side provider call + DB persistence)
  app.post('/api/chat/respond', async (req, res) => {
    const { sessionId, message, userName } = req.body as { sessionId?: string; message?: string; userName?: string };
    const safeSessionId = sessionId || 'default';
    const safeMessage = message?.trim();

    if (!safeMessage) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    backendLog('chat respond request', { sessionId: safeSessionId, textLength: safeMessage.length });

    try {
      await prisma.chatSession.upsert({
        where: { id: safeSessionId },
        update: {},
        create: { id: safeSessionId, name: userName || null },
      });

      const savedUserMessage = await prisma.chatMessage.create({
        data: {
          sender: 'user',
          text: safeMessage,
          sessionId: safeSessionId,
        },
      });

      const botText = await generateBotReply(safeMessage, userName);
      const savedBotMessage = await prisma.chatMessage.create({
        data: {
          sender: 'bot',
          text: botText,
          sessionId: safeSessionId,
        },
      });

      backendLog('chat respond success', { sessionId: safeSessionId, botLength: botText.length });
      return res.status(200).json({
        success: true,
        userMessage: savedUserMessage,
        botMessage: savedBotMessage,
      });
    } catch (error: any) {
      backendLog('chat respond failed', { sessionId: safeSessionId, error: error?.message || 'unknown error' });
      return res.status(500).json({ success: false, error: 'Failed to generate response' });
    }
  });

  app.get('/api/chat/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
      const messages = await prisma.chatMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  // Blog Post Comments
  app.get('/api/blog/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    try {
      const comments = await prisma.blogPostComment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' }
      });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  app.get('/api/blog/posts', (req, res) => {
    res.json(allBlogPosts);
  });

  app.get('/api/blog/posts/:id', (req, res) => {
    const { id } = req.params;
    const post = allBlogPosts.find(p => p.id === id);
    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ error: 'Post not found' });
    }
  });

  app.post('/api/blog/:postId/comments', async (req, res) => {
    const { postId } = req.params;
    const { name, text } = req.body;
    try {
      const comment = await prisma.blogPostComment.create({
        data: { postId, name, text }
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to post comment' });
    }
  });

  // Admin Routes (Protected)
  // Viewers can see forms and chats
  app.get('/api/admin/forms', authorize(['admin', 'editor', 'viewer']), async (req: any, res: any) => {
    try {
      const responses = await prisma.formResponse.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(responses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch forms' });
    }
  });

  app.get('/api/admin/chats', authorize(['admin', 'editor', 'viewer']), async (req: any, res: any) => {
    try {
      const messages = await prisma.chatMessage.findMany({
        include: { session: true },
        orderBy: { timestamp: 'desc' }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chats' });
    }
  });

  app.get('/api/admin/sessions', authorize(['admin', 'editor', 'viewer']), async (req: any, res: any) => {
    try {
      const sessions = await prisma.chatSession.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1
          }
        }
      });
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.get('/api/admin/blog-comments', authorize(['admin', 'editor', 'viewer']), async (req: any, res: any) => {
    try {
      const comments = await prisma.blogPostComment.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blog comments' });
    }
  });

  app.delete('/api/admin/blog-comments/:id', authorize(['admin', 'editor']), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await prisma.blogPostComment.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete comment' });
    }
  });

  // Only Admins and Editors can delete forms
  app.delete('/api/admin/forms/:id', authorize(['admin', 'editor']), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      await prisma.formResponse.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete form' });
    }
  });

  // Admin Management (Admin only)
  app.get('/api/admin/users', authorize(['admin']), async (req: any, res: any) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', authorize(['admin']), async (req: any, res: any) => {
    const { email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, role }
      });
      res.json({ success: true, user: { email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.patch('/api/admin/users/:id', authorize(['admin']), async (req: any, res: any) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { role },
        select: { id: true, email: true, role: true }
      });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.delete('/api/admin/users/:id', authorize(['admin']), async (req: any, res: any) => {
    const { id } = req.params;
    try {
      // Prevent deleting self
      if (req.user.id === parseInt(id)) {
        return res.status(400).json({ error: 'Cannot delete yourself' });
      }
      await prisma.user.delete({
        where: { id: parseInt(id) }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    viteDevServer = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false // Disable HMR to prevent WebSocket connection errors in AI Studio
      },
      appType: 'spa',
      base: APP_BASE_PATH
    });
    if (IS_ROOT_BASE_PATH) {
      app.use(viteDevServer.middlewares);
    } else {
      app.use(APP_BASE_PATH, viteDevServer.middlewares);
      // Redirect root to app base path for convenience.
      app.get('/', (req, res) => res.redirect(APP_BASE_PATH));
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    productionTemplate = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');
    if (IS_ROOT_BASE_PATH) {
      app.use(express.static(distPath, { index: false }));
    } else {
      app.use(APP_BASE_PATH, express.static(distPath, { index: false }));
      // Redirect root to app base path for convenience.
      app.get('/', (req, res) => res.redirect(APP_BASE_PATH));
    }
  }

  function looksLikeNonHtmlRequest(pathname: string): boolean {
    const lastSegment = pathname.split('/').pop() || '';

    // Block dot files like /.env, /.git, /.htaccess
    if (pathname.includes('/.')) return true;

    // Block source/config/file-like URLs if they were not served by express.static
    // Example: /server.ts, /package.json, /vite.config.ts, /abc.xml
    if (/\.[a-zA-Z0-9]{1,10}$/.test(lastSegment)) return true;

    return false;
  }

  const htmlRoutePattern = IS_ROOT_BASE_PATH ? '*' : `${APP_BASE_PATH}/*`;
  app.get(htmlRoutePattern, async (req, res, next) => {
    try {
      const origin = getOrigin(req);
      const appPathname = getAppPathname(req.path);

      if (looksLikeNonHtmlRequest(appPathname)) {
        return res
          .status(404)
          .set('X-Robots-Tag', 'noindex, nofollow')
          .type('text/plain')
          .send('Not found');
      }

      const seo = getSeoPayload(appPathname, origin);

      let htmlTemplate: string;
      if (viteDevServer) {
        const indexPath = path.join(process.cwd(), 'index.html');
        const rawTemplate = await fs.readFile(indexPath, 'utf-8');
        htmlTemplate = await viteDevServer.transformIndexHtml(req.originalUrl, rawTemplate);
      } else {
        htmlTemplate = productionTemplate;
      }

      const html = withSeoTags(htmlTemplate, seo);
      res.status(200).type('text/html').send(html);
    } catch (error) {
      if (viteDevServer) {
        viteDevServer.ssrFixStacktrace(error as Error);
      }
      next(error);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    backendLog(`server running on http://localhost:${PORT}`);
  });
}

startServer();
