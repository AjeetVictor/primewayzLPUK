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
import type { BlogPost } from './src/data/blog/types.ts';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

const isProd = process.env.NODE_ENV === 'production';
// console.log('[debug] NODE_ENV:', process.env.NODE_ENV, '| isProd:', isProd);
const app = express();
const prisma = new PrismaClient();
const __dirname = path.resolve();

const allBlogPosts = getAllBlogPosts();
const adminCookieName = 'primewayz_admin_token';
const siteUrl = (process.env.SITE_URL || 'https://uk.primewayz.com').replace(/\/$/, '');

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

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeJson(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function getPostTimestamp(post: BlogPost) {
  const timestamp = Date.parse(post.updatedDate || post.date);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function toIsoDate(value?: string) {
  const timestamp = value ? Date.parse(value) : NaN;
  return new Date(Number.isNaN(timestamp) ? Date.now() : timestamp).toISOString();
}

function cmsPostToBlogPost(post: any): BlogPost {
  const date = post.date || post.publishedAt || post.createdAt;
  const tags = Array.isArray(post.tags)
    ? post.tags.map(String)
    : typeof post.tags === 'string'
      ? post.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [];

  return {
    id: post.slug,
    slug: post.slug,
    title: post.title,
    description: post.description || post.excerpt || stripHtml(post.content || '').slice(0, 160),
    excerpt: post.excerpt || post.description || stripHtml(post.content || '').slice(0, 220),
    category: post.category || 'Digital Operations',
    tags,
    date: date ? new Date(date).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
    updatedDate: post.updatedDate
      ? new Date(post.updatedDate).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })
      : post.updatedAt
        ? new Date(post.updatedAt).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' })
        : undefined,
    author: post.author || 'Primewayz UK Team',
    readTime: post.readTime || '5 min read',
    image: post.image || undefined,
    content: post.content || '',
    featured: Boolean(post.featured),
    seoTitle: post.seoTitle || undefined,
    seoDescription: post.seoDescription || undefined,
  };
}

async function getPublishedCmsBlogPosts() {
  try {
    const posts = await prisma.cmsBlogPost.findMany({
      where: { status: 'published' },
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });
    return posts.map(cmsPostToBlogPost);
  } catch (err) {
    console.warn('[local-safe] Using static blog posts only:', err instanceof Error ? err.message : err);
    return [];
  }
}

async function getPublicBlogPosts() {
  const cmsPosts = await getPublishedCmsBlogPosts();
  const byId = new Map<string, BlogPost>();

  [...cmsPosts, ...allBlogPosts].forEach((post) => {
    byId.set(post.id, post);
    byId.set(post.slug, post);
  });

  return Array.from(new Set(byId.values())).sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
}

async function getPublicBlogPost(id?: string) {
  if (!id) return undefined;
  const localPost = getBlogPostById(id);
  if (localPost) return localPost;

  try {
    const post = await prisma.cmsBlogPost.findFirst({
      where: {
        status: 'published',
        OR: [{ slug: id }],
      },
    });
    return post ? cmsPostToBlogPost(post) : undefined;
  } catch (err) {
    console.warn('[local-safe] Could not load CMS blog post:', err instanceof Error ? err.message : err);
    return undefined;
  }
}

function buildDefaultStructuredData(canonical: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteUrl}/#primewayz-uk`,
    name: 'Primewayz UK',
    url: siteUrl,
    logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
    description,
    areaServed: { '@type': 'Country', name: 'United Kingdom' },
    serviceType: [
      'Software Development Subscription',
      'Website maintenance',
      'CRM integration',
      'Business automation',
      'SEO foundation support',
      'Ongoing digital delivery support',
    ],
    audience: { '@type': 'BusinessAudience', audienceType: 'UK small businesses and SMEs' },
  };
}

function buildArticleStructuredData(post: BlogPost, canonical: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seoDescription || post.description || post.excerpt,
    image: post.image ? [post.image] : [`${siteUrl}/og-primewayz-uk.jpg`],
    datePublished: toIsoDate(post.date),
    dateModified: toIsoDate(post.updatedDate || post.date),
    author: { '@type': 'Organization', name: post.author || 'Primewayz UK Team' },
    publisher: {
      '@type': 'Organization',
      name: 'Primewayz UK',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/primewayz-uk-dark-logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection: post.category,
    keywords: post.tags.join(', '),
  };
}

function buildSeoTags(options: {
  title: string;
  description: string;
  canonical: string;
  ogType?: 'website' | 'article';
  image?: string;
  structuredData: unknown;
}) {
  const image = options.image || `${siteUrl}/og-primewayz-uk.jpg`;
  return `
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeHtml(options.description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(options.canonical)}" />
    <meta property="og:type" content="${options.ogType || 'website'}" />
    <meta property="og:locale" content="en_GB" />
    <meta property="og:site_name" content="Primewayz UK" />
    <meta property="og:title" content="${escapeHtml(options.title)}" />
    <meta property="og:description" content="${escapeHtml(options.description)}" />
    <meta property="og:url" content="${escapeHtml(options.canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(options.title)}" />
    <meta name="twitter:description" content="${escapeHtml(options.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <script type="application/ld+json">${safeJson(options.structuredData)}</script>
  `;
}

function stripExistingSeoTags(html: string) {
  return html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '')
    .replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:[^"']+["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:[^"']+["'][^>]*>/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '');
}

async function getInitialDataAndSeo(pathname: string) {
  const canonical = `${siteUrl}${pathname === '/' ? '/' : pathname}`;

  if (pathname === '/blog') {
    const blogPosts = await getPublicBlogPosts();
    return {
      initialData: { blogPosts },
      seoTags: buildSeoTags({
        title: 'Primewayz UK Insights | Digital Support for UK SMEs',
        description: 'Practical UK SME guidance on websites, SEO, CRM workflows, automation, AI readiness, maintenance, and digital delivery.',
        canonical,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Primewayz UK Insights',
          url: canonical,
          blogPost: blogPosts.slice(0, 10).map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: `${siteUrl}/blog/${post.id}`,
            description: post.description,
          })),
        },
      }),
    };
  }

  const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const blogPost = await getPublicBlogPost(decodeURIComponent(blogMatch[1]));
    if (blogPost) {
      return {
        initialData: { blogPost },
        seoTags: buildSeoTags({
          title: `${blogPost.seoTitle || blogPost.title} | Primewayz UK`,
          description: blogPost.seoDescription || blogPost.description || blogPost.excerpt,
          canonical,
          ogType: 'article',
          image: blogPost.image,
          structuredData: buildArticleStructuredData(blogPost, canonical),
        }),
      };
    }
  }

  const staticPageSeo: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'Software Development Subscription for UK SMEs | Primewayz UK',
      description:
        'Primewayz UK helps UK SMEs with monthly software, website, CRM, automation, technical SEO foundation, maintenance, and ongoing digital delivery support.',
    },
    '/services': {
      title: 'Software, Website & CRM Support Services for UK SMEs | Primewayz UK',
      description:
        'Explore Primewayz UK services for UK SMEs, including monthly software development support, website maintenance, CRM integration, automation, technical SEO foundations, analytics checks, and ongoing digital delivery.',
    },
    '/software-development-subscription-uk': {
      title: 'Software Development Subscription for UK SMEs | Primewayz UK',
      description:
        'Monthly software development subscription for UK SMEs covering website improvements, CRM workflows, automation, integrations, dashboards, technical SEO foundations, maintenance, testing, and ongoing digital delivery support.',
    },
    '/website-maintenance-subscription-uk': {
      title: 'Website Maintenance Subscription for UK SMEs | Primewayz UK',
      description:
        'Website maintenance subscription for UK SMEs covering website updates, bug fixes, landing page improvements, technical SEO checks, GA4 and Search Console reviews, form fixes, speed checks, testing, and monthly website support.',
    },
    '/crm-integration-support-uk': {
      title: 'CRM Integration Support for UK SMEs | Primewayz UK',
      description:
        'CRM integration support for UK SMEs covering website form integration, enquiry routing, lead tracking, CRM workflow cleanup, automation, notifications, reporting, and operational visibility.',
    },
    '/professional-services-crm-support-uk': {
      title: 'Professional Services CRM Support UK | Primewayz UK',
      description:
        'CRM integration, lead-flow cleanup, website enquiry tracking, follow-up workflows, and reporting support for UK professional services firms.',
    },
    '/success-stories/local-trades-lead-capture': {
      title: 'Local Trades Lead Capture Success Story | Primewayz UK',
      description:
        'See how Primewayz UK supports local trades and service businesses with lead capture, enquiry routing, quote request flows, tracking, and monthly website improvements.',
    },
    '/success-stories/professional-services-crm-cleanup': {
      title: 'Professional Services CRM Cleanup Success Story | Primewayz UK',
      description:
        'See how Primewayz UK helps professional services firms improve CRM workflows, website enquiry capture, lead tracking, reminders, and reporting visibility.',
    },
    '/success-stories/ecommerce-store-stability-support': {
      title: 'E-commerce Store Stability Support Success Story | Primewayz UK',
      description:
        'See how Primewayz UK supports e-commerce stores with website stability, product and checkout improvements, tracking, technical fixes, and ongoing monthly support.',
    },
  };

  const pageSeo = staticPageSeo[pathname] || staticPageSeo['/'];

  return {
    initialData: {},
    seoTags: buildSeoTags({
      title: pageSeo.title,
      description: pageSeo.description,
      canonical,
      structuredData: buildDefaultStructuredData(canonical, pageSeo.description),
    }),
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

app.get('/api/blog/posts', async (_req, res) => {
  res.json(await getPublicBlogPosts());
});
app.get('/api/blog/posts/:id', async (req, res) => {
  const post = await getPublicBlogPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

app.get('/api/blog/:id/comments', async (req, res) => {
  const comments = await prisma.blogPostComment.findMany({
    where: { postId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(comments);
});

app.post('/api/blog/:id/comments', async (req, res) => {
  const { name, text } = req.body;
  if (!name || !text) return res.status(400).json({ error: 'Name and comment are required' });

  const post = await getPublicBlogPost(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = await prisma.blogPostComment.create({
    data: {
      postId: post.id,
      name,
      text,
    },
  });

  res.status(201).json(comment);
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
        const pathname = new URL(req.originalUrl, siteUrl).pathname;
        const { initialData, seoTags } = await getInitialDataAndSeo(pathname);
        const { html: appHtml } = render(req.originalUrl, '/', initialData);
        const cleanAppHtml = stripExistingSeoTags(appHtml);
        const initialDataScript = `<script>window.__PRIMEWAYZ_INITIAL_DATA__=${safeJson(initialData)};</script>`;
        const html = stripExistingSeoTags(indexHtml)
          .replace('</head>', `${seoTags}\n</head>`)
          .replace('<!--ssr-outlet-->', cleanAppHtml)
          .replace('<script type="module"', `${initialDataScript}\n<script type="module"`);
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
