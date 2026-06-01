import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs/promises';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { getAllBlogPosts, getBlogPostById } from './src/data/blog/utils.ts';
import type { BlogPost } from './src/data/blog/types.ts';
import { homepageSeoContent } from './src/content/homepageSeoContent.ts';

const allBlogPosts = getAllBlogPosts();
const BLOG_STATUSES = ['draft', 'submitted', 'published', 'unpublished', 'archived'] as const;
const CMS_ROLE_OPTIONS = ['super_admin', 'blog_editor', 'blog_author', 'admin', 'editor', 'viewer'] as const;
const SUPER_ADMIN_ROLES = ['super_admin', 'admin'];
const BLOG_EDITOR_ROLES = ['super_admin', 'admin', 'blog_editor', 'editor'];
const BLOG_AUTHOR_ROLES = ['super_admin', 'admin', 'blog_editor', 'editor', 'blog_author'];
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
const cmsBlogPostModel = (prisma as any).cmsBlogPost;

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
const PASSWORD_RESET_EXPIRY_MINUTES = Number(process.env.PASSWORD_RESET_EXPIRY_MINUTES || 30);
const PASSWORD_RESET_SUCCESS_MESSAGE = 'If an admin account exists for this email, reset instructions have been sent.';

function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

function getPasswordResetExpiresAt() {
  return new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);
}

function getResetBaseUrl(req: express.Request) {
  const configuredUrl = (process.env.PUBLIC_SITE_URL || process.env.SEO_SITE_URL || '').trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  if (process.env.NODE_ENV === 'production') {
    return 'https://uk.primewayz.com';
  }

  const protocol = req.headers['x-forwarded-proto']?.toString().split(',')[0] || req.protocol || 'http';
  const host = req.get('host') || `localhost:${PORT}`;
  return `${protocol}://${host}`;
}

function buildResetUrl(req: express.Request, token: string) {
  return `${getResetBaseUrl(req)}/admin/reset-password?token=${encodeURIComponent(token)}`;
}

async function sendAdminPasswordResetEmail(email: string, resetUrl: string) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim();

  if (process.env.NODE_ENV !== 'production') {
    backendLog('admin password reset URL for local testing', { email, resetUrl });
  }

  if (!smtpHost || !smtpFrom) {
    if (process.env.NODE_ENV === 'production') {
      backendLog('admin password reset email skipped because SMTP is not configured', { email });
    }
    return;
  }

  backendLog('admin password reset email transport is not configured; reset request accepted safely', {
    email,
    smtpHost,
  });
}

function isSuperAdminRole(role?: string): boolean {
  return Boolean(role && SUPER_ADMIN_ROLES.includes(role));
}

function isBlogEditorRole(role?: string): boolean {
  return Boolean(role && BLOG_EDITOR_ROLES.includes(role));
}

function isBlogAuthorRole(role?: string): boolean {
  return Boolean(role && BLOG_AUTHOR_ROLES.includes(role));
}

function normalizeRole(role: unknown): string {
  const value = typeof role === 'string' ? role.trim() : '';
  return CMS_ROLE_OPTIONS.includes(value as any) ? value : 'viewer';
}

function normalizeBlogStatus(status: unknown, fallback = 'draft'): string {
  const value = typeof status === 'string' ? status.trim().toLowerCase() : '';
  return BLOG_STATUSES.includes(value as any) ? value : fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
}

function normalizeTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 12);
  }

  if (typeof tags === 'string') {
    return tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
  }

  return [];
}

function cmsPostToPublicPost(post: any): BlogPost {
  const publishedDate = post.date || post.publishedAt || post.createdAt;
  const updatedDate = post.updatedDate || post.updatedAt;

  return {
    id: post.slug,
    slug: post.slug,
    title: post.title,
    description: post.description,
    excerpt: post.excerpt || post.description,
    category: post.category,
    tags: normalizeTags(post.tags),
    date: publishedDate ? new Date(publishedDate).toLocaleDateString('en-GB', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }) : '',
    updatedDate: updatedDate ? new Date(updatedDate).toISOString() : undefined,
    author: post.author,
    readTime: post.readTime,
    image: post.image || undefined,
    content: post.content,
    featured: Boolean(post.featured),
    seoTitle: post.seoTitle || undefined,
    seoDescription: post.seoDescription || undefined,
  };
}

async function getPublishedCmsBlogPosts(): Promise<BlogPost[]> {
  if (!cmsBlogPostModel) return [];

  try {
    const posts = await cmsBlogPostModel.findMany({
      where: { status: 'published' },
      orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });
    return posts.map(cmsPostToPublicPost);
  } catch (error) {
    backendLog('cms blog public fetch failed; using static posts only', {
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

async function getPublicBlogPosts(): Promise<BlogPost[]> {
  const cmsPosts = await getPublishedCmsBlogPosts();
  return [...cmsPosts, ...allBlogPosts];
}

async function getPublicBlogPostById(id: string): Promise<BlogPost | undefined> {
  if (cmsBlogPostModel) {
    try {
      const cmsPost = await cmsBlogPostModel.findFirst({
        where: { slug: id, status: 'published' },
      });
      if (cmsPost) return cmsPostToPublicPost(cmsPost);
    } catch (error) {
      backendLog('cms blog post lookup failed; using static fallback', {
        slug: id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return getBlogPostById(id);
}

function normalizeContactPhoneE164(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = parsePhoneNumberFromString(trimmed);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.format('E.164');
}

function getClientIp(req: express.Request): string | null {
  const forwardedFor = req.headers['x-forwarded-for'];
  const firstForwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0];

  return firstForwardedIp?.trim() || req.socket.remoteAddress || req.ip || null;
}

const SEO_SITE_NAME = 'Primewayz UK';
const SEO_DEFAULT_OG_IMAGE = 'https://uk.primewayz.com/assets/primewayz-infotech-logo-gn3jDBiM.svg';
const SEO_DEFAULT_TWITTER_HANDLE = '@Primewayz';

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

function renderSeoBlocks(): string {
  return homepageSeoContent
    .map((block) => {
      const headingTag = `h${block.level}`;
      const heading = `<${headingTag}>${escapeHtml(block.heading)}</${headingTag}>`;
      const paragraphs = (block.paragraphs || [])
        .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
        .join('');

      return `<section>${heading}${paragraphs}</section>`;
    })
    .join('');
}

function getSeoFallbackBody(pathname: string): string {
  if (pathname.startsWith('/admin')) return '';

  return `<main>${renderSeoBlocks()}</main>`;
}

function withSeoTags(html: string, seo: SeoPayload, pathname = '/'): string {
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

  const htmlWithHead = removeSeoTags(html).replace('</head>', `${headTags}\n  </head>`);
  const fallbackBody = getSeoFallbackBody(pathname);

  if (!fallbackBody) return htmlWithHead;

  return htmlWithHead.replace(
    '<div id="root"></div>',
    `<div id="root">${fallbackBody}</div>`,
  );
}


function optimizeHeadAssetOrder(html: string): string {
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  if (!headMatch) return html;

  const originalHead = headMatch[0];
  const stylesheetRegex = /\s*<link\s+[^>]*rel=["']stylesheet["'][^>]*>\s*/gi;
  const stylesheets = originalHead.match(stylesheetRegex) || [];

  if (!stylesheets.length) return html;

  let optimizedHead = originalHead;

  for (const stylesheet of stylesheets) {
    optimizedHead = optimizedHead.replace(stylesheet, '\n');
  }

  const firstModuleScript = optimizedHead.match(/\s*<script\s+[^>]*type=["']module["'][^>]*><\/script>\s*/i);

  if (firstModuleScript) {
    optimizedHead = optimizedHead.replace(
      firstModuleScript[0],
      `\n${stylesheets.join('\n')}\n${firstModuleScript[0]}`
    );
  } else {
    optimizedHead = optimizedHead.replace('</head>', `${stylesheets.join('\n')}\n</head>`);
  }

  const firstStylesheetHref = stylesheets[0]?.match(/href=["']([^"']+)["']/i)?.[1];

  if (firstStylesheetHref && !optimizedHead.includes(`rel="preload" as="style" href="${firstStylesheetHref}"`)) {
    const preloadTag = `<link rel="preload" as="style" href="${firstStylesheetHref}" />`;
    optimizedHead = optimizedHead.replace(
      stylesheets[0].trim(),
      `${preloadTag}\n  ${stylesheets[0].trim()}`
    );
  }

  return html.replace(originalHead, optimizedHead);
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

async function getSeoPayload(pathname: string, origin: string): Promise<SeoPayload> {
  const canonical = joinUrl(origin, getCanonicalPath(pathname));
  const defaultDescription = 'Primewayz offers elite software development as a service with predictable pricing and high-velocity delivery.';
  const baseOrg = {
    '@type': 'Organization',
    name: 'Primewayz Infotech Private Limited',
    url: joinUrl(origin, getCanonicalPath('/')),
    logo: 'https://uk.primewayz.com/assets/primewayz-infotech-logo-gn3jDBiM.svg',
  };


  if (pathname === '/software-development-subscription-uk') {
    return {
      title: 'Software Development Subscription for UK SMEs',
      description:
        'Primewayz UK provides subscription-based software development for UK SMEs, covering websites, CRM integrations, automation, SEO foundations, maintenance, and ongoing monthly delivery support.',
      canonical,
      ogType: 'website',
      ogImage: SEO_DEFAULT_OG_IMAGE,
      twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
      robots: 'index,follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Software Development Subscription for UK SMEs',
        serviceType: 'Subscription-based software development',
        description:
          'Monthly software delivery support for UK SMEs, including websites, CRM integrations, automation, SEO foundations, maintenance, and digital system improvements.',
        provider: baseOrg,
        areaServed: {
          '@type': 'Country',
          name: 'United Kingdom',
        },
        availableLanguage: 'en-GB',
        audience: {
          '@type': 'BusinessAudience',
          audienceType: 'UK small businesses and SMEs',
        },
      },
    };
  }

  if (pathname === '/blog') {
    return {
      title: 'Primewayz UK Insights',
      description:
        'Practical articles for UK SMEs on AI automation, website support, CRM, SEO, and digital operations.',
      canonical,
      ogType: 'website',
      ogImage: SEO_DEFAULT_OG_IMAGE,
      twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
      robots: 'index,follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Primewayz UK Insights',
        description:
          'Practical articles for UK SMEs on AI automation, website support, CRM, SEO, and digital operations.',
        url: canonical,
        publisher: baseOrg,
        inLanguage: 'en-GB',
      },
    };
  }

  if (pathname.startsWith('/blog/')) {
    const postId = pathname.replace('/blog/', '').replace(/\/+$/, '');
    const post = await getPublicBlogPostById(postId);
    if (post) {
      return {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.description || post.excerpt,
        canonical,
        ogType: 'article',
        ogImage: post.image || SEO_DEFAULT_OG_IMAGE,
        twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
        robots: 'index,follow',
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.description || post.excerpt,
          image: [post.image || SEO_DEFAULT_OG_IMAGE],
          author: { '@type': 'Person', name: post.author },
          publisher: baseOrg,
          datePublished: post.date,
          dateModified: post.updatedDate || post.date,
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
        role: 'super_admin'
      }
    });
    backendLog('default admin user seeded');
  }
}

async function startServer() {
  if (process.env.SKIP_ADMIN_SEED === 'true') {
    backendLog('admin seed skipped by SKIP_ADMIN_SEED');
  } else {
    await seedAdmin();
  }

  const app = express();
  let viteDevServer: Awaited<ReturnType<typeof createViteServer>> | null = null;
  let productionTemplate = '';
  let ssrRender: null | ((url: string, basePath?: string) => { html: string }) = null;

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
          user: { id: user.id, email: user.email, role: user.role }
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }

    res.status(401).json({ error: 'Invalid credentials' });
  });

  app.post('/api/admin/forgot-password', async (req, res) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';

    try {
      if (email) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
          const { token, tokenHash } = createPasswordResetToken();
          const resetPasswordExpiresAt = getPasswordResetExpiresAt();

          await prisma.user.update({
            where: { id: user.id },
            data: {
              resetPasswordTokenHash: tokenHash,
              resetPasswordExpiresAt,
            },
          });

          await sendAdminPasswordResetEmail(user.email, buildResetUrl(req, token));
        }
      }
    } catch (error) {
      backendLog('admin password reset request failed internally', {
        error: error instanceof Error ? error.message : String(error),
      });
    }

    res.json({ success: true, message: PASSWORD_RESET_SUCCESS_MESSAGE });
  });

  app.post('/api/admin/reset-password', async (req, res) => {
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!token || password.length < 8) {
      return res.status(400).json({ error: 'This reset link is invalid or expired. Please request a new one.' });
    }

    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const user = await prisma.user.findFirst({
        where: {
          resetPasswordTokenHash: tokenHash,
          resetPasswordExpiresAt: { gt: new Date() },
        },
      });

      if (!user) {
        return res.status(400).json({ error: 'This reset link is invalid or expired. Please request a new one.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordTokenHash: null,
          resetPasswordExpiresAt: null,
        },
      });

      res.json({ success: true });
    } catch (error) {
      backendLog('admin password reset failed internally', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'We could not reset your password. Please try again.' });
    }
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
        user: { id: decoded.id, email: decoded.email, role: decoded.role }
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

  app.get('/api/blog/posts', async (req, res) => {
    const posts = await getPublicBlogPosts();
    res.json(posts);
  });

  app.get('/api/blog/posts/:id', async (req, res) => {
    const { id } = req.params;
    const post = await getPublicBlogPostById(id);
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

  app.get('/api/admin/blog-posts', authorize(BLOG_AUTHOR_ROLES), async (req: any, res: any) => {
    if (!cmsBlogPostModel) return res.status(503).json({ error: 'Blog CMS is not available. Run Prisma generate after applying the schema.' });

    try {
      const where = isBlogEditorRole(req.user?.role)
        ? {}
        : { createdById: Number(req.user.id) };
      const posts = await cmsBlogPostModel.findMany({
        where,
        orderBy: [{ updatedAt: 'desc' }],
      });
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  });

  app.post('/api/admin/blog-posts', authorize(BLOG_AUTHOR_ROLES), async (req: any, res: any) => {
    if (!cmsBlogPostModel) return res.status(503).json({ error: 'Blog CMS is not available. Run Prisma generate after applying the schema.' });

    const title = String(req.body?.title || '').trim();
    const content = String(req.body?.content || '').trim();
    const description = String(req.body?.description || req.body?.excerpt || '').trim();
    if (!title || !content || !description) {
      return res.status(400).json({ error: 'Title, description, and content are required.' });
    }

    const requestedStatus = normalizeBlogStatus(req.body?.status, 'draft');
    const canPublish = isBlogEditorRole(req.user?.role);
    const status = canPublish
      ? requestedStatus
      : requestedStatus === 'submitted' ? 'submitted' : 'draft';
    const baseSlug = slugify(String(req.body?.slug || title)) || `post-${Date.now()}`;

    try {
      let slug = baseSlug;
      for (let attempt = 1; attempt < 20; attempt += 1) {
        const existing = await cmsBlogPostModel.findUnique({ where: { slug } });
        if (!existing) break;
        slug = `${baseSlug}-${attempt + 1}`;
      }

      const now = new Date();
      const post = await cmsBlogPostModel.create({
        data: {
          slug,
          title,
          description,
          excerpt: String(req.body?.excerpt || description).trim(),
          category: String(req.body?.category || 'Digital Operations').trim(),
          tags: normalizeTags(req.body?.tags),
          date: req.body?.date ? new Date(req.body.date) : status === 'published' ? now : null,
          updatedDate: req.body?.updatedDate ? new Date(req.body.updatedDate) : null,
          author: String(req.body?.author || req.user.email || 'Primewayz UK Team').trim(),
          readTime: String(req.body?.readTime || '5 min read').trim(),
          image: String(req.body?.image || '').trim() || null,
          content,
          featured: isSuperAdminRole(req.user?.role) ? Boolean(req.body?.featured) : false,
          seoTitle: String(req.body?.seoTitle || '').trim() || null,
          seoDescription: String(req.body?.seoDescription || '').trim() || null,
          status,
          createdById: Number(req.user.id),
          updatedById: Number(req.user.id),
          reviewedById: canPublish && ['published', 'unpublished', 'archived'].includes(status) ? Number(req.user.id) : null,
          publishedAt: status === 'published' ? now : null,
          archivedAt: status === 'archived' ? now : null,
        },
      });
      res.status(201).json(post);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  });

  app.patch('/api/admin/blog-posts/:id', authorize(BLOG_AUTHOR_ROLES), async (req: any, res: any) => {
    if (!cmsBlogPostModel) return res.status(503).json({ error: 'Blog CMS is not available. Run Prisma generate after applying the schema.' });

    const postId = Number(req.params.id);
    if (!Number.isFinite(postId)) return res.status(400).json({ error: 'Invalid blog post id.' });

    try {
      const existing = await cmsBlogPostModel.findUnique({ where: { id: postId } });
      if (!existing) return res.status(404).json({ error: 'Blog post not found.' });

      const isOwner = existing.createdById === Number(req.user.id);
      const canEditAny = isBlogEditorRole(req.user?.role);
      const canManageAny = isSuperAdminRole(req.user?.role);
      if (!canEditAny && !isOwner) {
        return res.status(403).json({ error: 'You can only manage your own blog drafts.' });
      }

      const requestedStatus = req.body?.status !== undefined
        ? normalizeBlogStatus(req.body.status, existing.status)
        : existing.status;
      if (!canEditAny && !['draft', 'submitted'].includes(requestedStatus)) {
        return res.status(403).json({ error: 'Blog authors can only save drafts or submit for review.' });
      }
      if (!canEditAny && !['draft', 'unpublished'].includes(existing.status)) {
        return res.status(403).json({ error: 'Submitted or published posts require editor review.' });
      }
      if (requestedStatus === 'archived' && !canManageAny) {
        return res.status(403).json({ error: 'Only Super Admin can archive blog posts.' });
      }

      const nextSlug = req.body?.slug !== undefined
        ? slugify(String(req.body.slug)) || existing.slug
        : existing.slug;
      const now = new Date();
      const data: Record<string, unknown> = {
        slug: nextSlug,
        title: req.body?.title !== undefined ? String(req.body.title).trim() : existing.title,
        description: req.body?.description !== undefined ? String(req.body.description).trim() : existing.description,
        excerpt: req.body?.excerpt !== undefined ? String(req.body.excerpt).trim() : existing.excerpt,
        category: req.body?.category !== undefined ? String(req.body.category).trim() : existing.category,
        tags: req.body?.tags !== undefined ? normalizeTags(req.body.tags) : existing.tags,
        date: req.body?.date !== undefined ? (req.body.date ? new Date(req.body.date) : null) : existing.date,
        updatedDate: req.body?.updatedDate !== undefined ? (req.body.updatedDate ? new Date(req.body.updatedDate) : null) : existing.updatedDate,
        author: req.body?.author !== undefined ? String(req.body.author).trim() : existing.author,
        readTime: req.body?.readTime !== undefined ? String(req.body.readTime).trim() : existing.readTime,
        image: req.body?.image !== undefined ? (String(req.body.image).trim() || null) : existing.image,
        content: req.body?.content !== undefined ? String(req.body.content).trim() : existing.content,
        seoTitle: req.body?.seoTitle !== undefined ? (String(req.body.seoTitle).trim() || null) : existing.seoTitle,
        seoDescription: req.body?.seoDescription !== undefined ? (String(req.body.seoDescription).trim() || null) : existing.seoDescription,
        status: requestedStatus,
        updatedById: Number(req.user.id),
      };

      if (req.body?.featured !== undefined) {
        if (!canManageAny) return res.status(403).json({ error: 'Only Super Admin can control featured articles.' });
        data.featured = Boolean(req.body.featured);
      }

      if (requestedStatus === 'published' && existing.status !== 'published') {
        data.publishedAt = now;
        data.date = data.date || now;
        data.reviewedById = Number(req.user.id);
      }
      if (['published', 'unpublished', 'archived'].includes(requestedStatus) && canEditAny) {
        data.reviewedById = Number(req.user.id);
      }
      if (requestedStatus === 'archived' && existing.status !== 'archived') {
        data.archivedAt = now;
      }

      const updated = await cmsBlogPostModel.update({
        where: { id: postId },
        data,
      });
      res.json(updated);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return res.status(409).json({ error: 'A blog post with that slug already exists.' });
      }
      res.status(500).json({ error: 'Failed to update blog post' });
    }
  });

  app.delete('/api/admin/blog-posts/:id', authorize(SUPER_ADMIN_ROLES), async (req: any, res: any) => {
    if (!cmsBlogPostModel) return res.status(503).json({ error: 'Blog CMS is not available. Run Prisma generate after applying the schema.' });

    const postId = Number(req.params.id);
    if (!Number.isFinite(postId)) return res.status(400).json({ error: 'Invalid blog post id.' });

    try {
      const archived = await cmsBlogPostModel.update({
        where: { id: postId },
        data: {
          status: 'archived',
          featured: false,
          archivedAt: new Date(),
          updatedById: Number(req.user.id),
          reviewedById: Number(req.user.id),
        },
      });
      res.json(archived);
    } catch (error) {
      res.status(500).json({ error: 'Failed to archive blog post' });
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
  app.get('/api/admin/users', authorize(SUPER_ADMIN_ROLES), async (req: any, res: any) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, createdAt: true }
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users', authorize(SUPER_ADMIN_ROLES), async (req: any, res: any) => {
    const { email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, role: normalizeRole(role) }
      });
      res.json({ success: true, user: { email: user.email, role: user.role } });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.patch('/api/admin/users/:id', authorize(SUPER_ADMIN_ROLES), async (req: any, res: any) => {
    const { id } = req.params;
    const { role } = req.body;
    try {
      const user = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { role: normalizeRole(role) },
        select: { id: true, email: true, role: true }
      });
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user role' });
    }
  });

  app.delete('/api/admin/users/:id', authorize(SUPER_ADMIN_ROLES), async (req: any, res: any) => {
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
    const distPath = path.join(process.cwd(), 'dist/client');
    productionTemplate = await fs.readFile(path.join(distPath, 'index.html'), 'utf-8');

    const ssrEntryPath = path.join(process.cwd(), 'dist/server/entry-server.js');
    const ssrModule = await import(pathToFileURL(ssrEntryPath).href);
    ssrRender = ssrModule.render;

    const staticOptions = {
      index: false,
      setHeaders: (res: any, filePath: string) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          return;
        }

        if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=604800');
          return;
        }

        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      },
    };

    if (IS_ROOT_BASE_PATH) {
      app.use(express.static(distPath, staticOptions));
    } else {
      app.use(APP_BASE_PATH, express.static(distPath, staticOptions));
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

      const seo = await getSeoPayload(appPathname, origin);

      let htmlTemplate: string;
      if (viteDevServer) {
        const indexPath = path.join(process.cwd(), 'index.html');
        const rawTemplate = await fs.readFile(indexPath, 'utf-8');
        htmlTemplate = await viteDevServer.transformIndexHtml(req.originalUrl, rawTemplate);
      } else {
        htmlTemplate = productionTemplate;
      }

      let ssrHtml = '';

      if (ssrRender && !appPathname.startsWith('/admin')) {
        try {
          const rendered = ssrRender(appPathname, APP_BASE_PATH);
          ssrHtml = rendered?.html || '';
        } catch (e) {
          backendLog('ssr render failed; using SEO fallback body', {
            path: appPathname,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }

      htmlTemplate = htmlTemplate.replace('<!--app-html-->', ssrHtml);

      const html = withSeoTags(htmlTemplate, seo, appPathname);
      const optimizedHtml = optimizeHeadAssetOrder(html);
      res.status(200).type('text/html').send(optimizedHtml);
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
