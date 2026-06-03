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
import { getAllBlogPosts, getBlogPostById } from './src/data/blog/utils.ts';
import type { BlogPost } from './src/data/blog/types.ts';
import { homepageSeoContent } from './src/content/homepageSeoContent.ts';
import { sanitizeBlogHtml } from './src/utils/sanitizeHtml.ts';

import nodemailer from 'nodemailer';
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

const UNANSWERED_CHAT_ALERT_TYPE = 'unanswered_chat';
const UNANSWERED_CHAT_ALERT_AFTER_MINUTES = Number(process.env.CHAT_ALERT_AFTER_MINUTES || 5);
const UNANSWERED_CHAT_ALERT_INTERVAL_MS = Number(process.env.CHAT_ALERT_INTERVAL_MS || 5 * 60 * 1000);
const UNANSWERED_CHAT_ALERT_STARTUP_DELAY_MS = Number(process.env.CHAT_ALERT_STARTUP_DELAY_MS || 30 * 1000);
const UNANSWERED_CHAT_ALERT_MAX_PER_RUN = Number(process.env.CHAT_ALERT_MAX_PER_RUN || 10);

const DAILY_LEAD_SUMMARY_ENABLED = process.env.DAILY_LEAD_SUMMARY_ENABLED !== 'false';
const DAILY_LEAD_SUMMARY_TIMEZONE = process.env.DAILY_LEAD_SUMMARY_TIMEZONE || 'Europe/London';
const DAILY_LEAD_SUMMARY_HOUR = Number(process.env.DAILY_LEAD_SUMMARY_HOUR || 18);
const DAILY_LEAD_SUMMARY_MINUTE = Number(process.env.DAILY_LEAD_SUMMARY_MINUTE || 30);
const DAILY_LEAD_SUMMARY_INTERVAL_MS = Number(process.env.DAILY_LEAD_SUMMARY_INTERVAL_MS || 60 * 1000);
const DAILY_LEAD_SUMMARY_STARTUP_DELAY_MS = Number(process.env.DAILY_LEAD_SUMMARY_STARTUP_DELAY_MS || 60 * 1000);
const DAILY_LEAD_SUMMARY_TYPE = 'daily_lead_summary';
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
const BLOG_UPLOAD_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const BLOG_UPLOAD_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const BLOG_UPLOAD_MIME_TYPES: Record<string, { extension: string; kind: 'image' | 'document'; maxBytes: number }> = {
  'image/jpeg': { extension: 'jpg', kind: 'image', maxBytes: BLOG_UPLOAD_IMAGE_MAX_BYTES },
  'image/png': { extension: 'png', kind: 'image', maxBytes: BLOG_UPLOAD_IMAGE_MAX_BYTES },
  'image/webp': { extension: 'webp', kind: 'image', maxBytes: BLOG_UPLOAD_IMAGE_MAX_BYTES },
  'application/pdf': { extension: 'pdf', kind: 'document', maxBytes: BLOG_UPLOAD_DOCUMENT_MAX_BYTES },
  'application/msword': { extension: 'doc', kind: 'document', maxBytes: BLOG_UPLOAD_DOCUMENT_MAX_BYTES },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extension: 'docx', kind: 'document', maxBytes: BLOG_UPLOAD_DOCUMENT_MAX_BYTES },
  'application/vnd.ms-excel': { extension: 'xls', kind: 'document', maxBytes: BLOG_UPLOAD_DOCUMENT_MAX_BYTES },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { extension: 'xlsx', kind: 'document', maxBytes: BLOG_UPLOAD_DOCUMENT_MAX_BYTES },
  'application/vnd.ms-powerpoint': { extension: 'ppt', kind: 'document', maxBytes: BLOG_UPLOAD_DOCUMENT_MAX_BYTES },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { extension: 'pptx', kind: 'document', maxBytes: BLOG_UPLOAD_DOCUMENT_MAX_BYTES },
};
const CHAT_UPLOAD_MIME_TYPES = BLOG_UPLOAD_MIME_TYPES;
const CHAT_APPOINTMENT_STATUSES = new Set(['pending', 'confirmed', 'completed', 'cancelled']);
const CHAT_PRESENCE_MODES = new Set(['auto', 'online', 'away', 'offline']);
const CHAT_PRESENCE_ACTIVE_MS = 5 * 60 * 1000;
const CHAT_BUSINESS_HOURS_LABEL = 'Mon-Fri, 10:00-19:00 UK time';
const CHAT_BUSINESS_HOURS_TIME_ZONE = 'Europe/London';
const CHAT_BUSINESS_HOURS_DAYS = new Set(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
const CHAT_BUSINESS_HOURS_START = 10;
const CHAT_BUSINESS_HOURS_END = 19;
const CHAT_OFFLINE_AUTO_REPLY = 'Thanks for your message. Please share your requirement and contact details. Our representative will contact you soon.';

type ChatAvailabilityStatus = 'online' | 'away' | 'offline' | 'assistant';

function getUkBusinessTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CHAT_BUSINESS_HOURS_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === 'weekday')?.value || '';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);

  return { weekday, hour };
}

function isWithinUkBusinessHours(date = new Date()) {
  const { weekday, hour } = getUkBusinessTimeParts(date);
  return CHAT_BUSINESS_HOURS_DAYS.has(weekday) && hour >= CHAT_BUSINESS_HOURS_START && hour < CHAT_BUSINESS_HOURS_END;
}

function getAvailabilityCopy(status: ChatAvailabilityStatus, customMessage?: string | null) {
  const copy = {
    online: {
      title: 'Primewayz is online',
      subtitle: 'Usually replies in a few minutes',
      responseExpectation: 'Usually replies in a few minutes',
      canBookCall: true,
    },
    away: {
      title: 'Primewayz is away',
      subtitle: "Send your message - we'll reply soon",
      responseExpectation: "Send your message - we'll reply soon",
      canBookCall: true,
    },
    offline: {
      title: 'Primewayz is offline',
      subtitle: `Available ${CHAT_BUSINESS_HOURS_LABEL}`,
      responseExpectation: `Available ${CHAT_BUSINESS_HOURS_LABEL}`,
      canBookCall: true,
    },
    assistant: {
      title: 'Primewayz Assistant is active',
      subtitle: 'Human team replies during business hours',
      responseExpectation: 'Human team replies during business hours',
      canBookCall: true,
    },
  }[status];

  return {
    ...copy,
    subtitle: customMessage?.trim() || copy.subtitle,
    responseExpectation: customMessage?.trim() || copy.responseExpectation,
  };
}

async function getChatPresenceSetting() {
  const model = (prisma as any).chatPresenceSetting;
  let setting = await model.findFirst({ orderBy: { id: 'asc' } });
  if (!setting) {
    setting = await model.create({ data: { mode: 'auto' } });
  }
  return setting;
}

async function getLatestAdminPresence() {
  return (prisma as any).adminPresence.findFirst({ orderBy: { lastSeenAt: 'desc' } });
}

async function computeChatAvailability() {
  const setting = await getChatPresenceSetting();
  const latestPresence = await getLatestAdminPresence();
  const latestSeenAt = latestPresence?.lastSeenAt ? new Date(latestPresence.lastSeenAt) : null;
  const hasActiveAdmin = Boolean(latestSeenAt && Date.now() - latestSeenAt.getTime() <= CHAT_PRESENCE_ACTIVE_MS);
  const mode = CHAT_PRESENCE_MODES.has(setting.mode) ? setting.mode : 'auto';
  const computedStatus: ChatAvailabilityStatus = hasActiveAdmin
    ? 'online'
    : isWithinUkBusinessHours()
      ? 'away'
      : 'offline';
  const status = mode === 'auto' ? computedStatus : mode as ChatAvailabilityStatus;
  const copy = getAvailabilityCopy(status, setting.message);

  return {
    status,
    title: copy.title,
    subtitle: copy.subtitle,
    responseExpectation: copy.responseExpectation,
    businessHours: CHAT_BUSINESS_HOURS_LABEL,
    canAcceptMessages: true,
    canBookCall: copy.canBookCall,
    serverTime: new Date().toISOString(),
    mode,
    computedStatus,
    hasActiveAdmin,
    latestAdminSeenAt: latestSeenAt?.toISOString() || null,
    customMessage: setting.message || '',
    updatedAt: setting.updatedAt,
  };
}

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


type SmtpEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

function getSmtpPort() {
  const rawPort = Number(process.env.SMTP_PORT || 587);
  return Number.isFinite(rawPort) ? rawPort : 587;
}

function getSmtpRecipients(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeEmailHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function sendSmtpEmail(payload: SmtpEmailPayload) {
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpFrom = process.env.SMTP_FROM?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = getSmtpPort();

  if (!smtpHost || !smtpFrom) {
    backendLog('smtp email skipped because SMTP_HOST or SMTP_FROM is missing', {
      to: payload.to,
      subject: payload.subject,
    });
    return { sent: false, skipped: true, reason: 'smtp_not_configured' };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
  });

  await transporter.sendMail({
    from: smtpFrom,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });

  return { sent: true, skipped: false };
}


async function sendAdminPasswordResetEmail(email: string, resetUrl: string) {
  if (process.env.NODE_ENV !== 'production') {
    backendLog('admin password reset URL for local testing', { email, resetUrl });
  }

  const subject = 'Reset your Primewayz admin password';
  const safeResetUrl = escapeEmailHtml(resetUrl);

  const result = await sendSmtpEmail({
    to: email,
    subject,
    text: `Reset your Primewayz admin password using this secure link: ${resetUrl}

This link expires soon. If you did not request it, you can ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2>Reset your Primewayz admin password</h2>
        <p>Use the secure link below to reset your admin password.</p>
        <p><a href="${safeResetUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700">Reset password</a></p>
        <p style="font-size:13px;color:#6b7280">If the button does not work, copy this link:</p>
        <p style="font-size:13px;word-break:break-all;color:#374151">${safeResetUrl}</p>
        <p style="font-size:13px;color:#6b7280">If you did not request this, you can ignore this email.</p>
      </div>
    `,
  });

  if (result.sent) {
    backendLog('admin password reset email sent', { email });
  }
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

function normalizeUkContactPhoneE164(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const compact = raw.replace(/[^\d+]/g, '');
  const normalized = compact.startsWith('0044') ? `+44${compact.slice(4)}` : compact;

  if (normalized.startsWith('+44')) {
    const national = normalized.slice(3).replace(/\D/g, '');
    const e164 = national.length === 10 ? `+44${national}` : null;
    return e164 && /^\+44[1-9]\d{9}$/.test(e164) ? e164 : null;
  }

  const digits = normalized.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    const e164 = `+44${digits.slice(1)}`;
    return /^\+44[1-9]\d{9}$/.test(e164) ? e164 : null;
  }

  return null;
}

function parseUkContactPhoneNumbers(raw: unknown): string[] {
  if (typeof raw !== 'string') return [];
  const matches = raw.match(/(?:\+44|0044|0)\s*\d(?:[\s().-]*\d){9}/g) || [];
  const normalized = matches
    .map(normalizeUkContactPhoneE164)
    .filter((phone): phone is string => Boolean(phone));

  return Array.from(new Set(normalized));
}

function sanitizeUploadBaseName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'upload';
}

async function readRequestBuffer(req: express.Request, maxBytes: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > maxBytes) {
      throw new Error('Upload is too large.');
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
}

function parseSingleMultipartFile(body: Buffer, contentType: string) {
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];
  if (!boundary) throw new Error('Invalid upload request.');

  const boundaryText = `--${boundary}`;
  const raw = body.toString('binary');
  const parts = raw.split(boundaryText);

  for (const part of parts) {
    if (!part.includes('name="file"')) continue;

    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) throw new Error('Invalid file upload.');

    const header = part.slice(0, headerEnd);
    let fileBinary = part.slice(headerEnd + 4);
    fileBinary = fileBinary.replace(/\r\n--$/, '').replace(/\r\n$/, '');

    const filenameMatch = header.match(/filename="([^"]*)"/i);
    const mimeMatch = header.match(/content-type:\s*([^\r\n]+)/i);
    const originalName = filenameMatch?.[1] || 'upload';
    const mimeType = (mimeMatch?.[1] || 'application/octet-stream').trim().toLowerCase();

    return {
      originalName,
      mimeType,
      buffer: Buffer.from(fileBinary, 'binary'),
    };
  }

  throw new Error('No file was uploaded.');
}

async function handleChatUpload(req: express.Request, res: express.Response, uploadedBy: 'user' | 'admin') {
  try {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Upload must use multipart/form-data.' });
    }

    const body = await readRequestBuffer(req, BLOG_UPLOAD_DOCUMENT_MAX_BYTES + 1024 * 1024);
    const file = parseSingleMultipartFile(body, contentType);
    const sessionIdMatch = body.toString('utf8').match(/name="sessionId"\r\n\r\n([^\r\n]+)/);
    const sessionId = (sessionIdMatch?.[1] || 'default').trim() || 'default';
    const rule = CHAT_UPLOAD_MIME_TYPES[file.mimeType];

    if (!rule) {
      return res.status(415).json({ error: 'Unsupported file type.' });
    }

    if (file.buffer.length > rule.maxBytes) {
      return res.status(413).json({
        error: rule.kind === 'image'
          ? 'Images must be 5 MB or smaller.'
          : 'Documents must be 10 MB or smaller.',
      });
    }

    await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: {},
      create: { id: sessionId },
    });

    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat', year, month);
    await fs.mkdir(uploadDir, { recursive: true });

    const originalBase = sanitizeUploadBaseName(path.parse(file.originalName).name);
    const fileName = `${originalBase}-${crypto.randomBytes(8).toString('hex')}.${rule.extension}`;
    const filePath = path.join(uploadDir, fileName);
    const resolvedUploadDir = path.resolve(uploadDir);
    const resolvedFilePath = path.resolve(filePath);

    if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid upload path.' });
    }

    await fs.writeFile(resolvedFilePath, file.buffer, { flag: 'wx' });

    const attachment = await prisma.chatAttachment.create({
      data: {
        sessionId,
        url: `/uploads/chat/${year}/${month}/${fileName}`,
        originalName: file.originalName.replace(/[<>]/g, ''),
        fileName,
        mimeType: file.mimeType,
        size: file.buffer.length,
        kind: rule.kind,
        uploadedBy,
      },
    });

    return res.status(201).json(attachment);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Upload failed.',
    });
  }
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
  const defaultDescription = 'Primewayz UK helps UK SMEs improve websites, CRM integrations, automation, reporting, SEO foundations, and monthly software delivery through practical technology support.';
  const baseOrg = {
    '@type': 'Organization',
    name: 'Primewayz Infotech Private Limited',
    url: joinUrl(origin, getCanonicalPath('/')),
    logo: 'https://uk.primewayz.com/assets/primewayz-infotech-logo-gn3jDBiM.svg',
  };


  if (pathname === '/website-maintenance-subscription-uk') {
    return {
      title: 'Website Maintenance Subscription UK for SMEs',
      description:
        'Ongoing website maintenance subscription for UK SMEs covering website updates, bug fixes, landing page improvements, technical SEO checks, analytics support, and monthly digital improvements.',
      canonical,
      ogType: 'website',
      ogImage: SEO_DEFAULT_OG_IMAGE,
      twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
      robots: 'index,follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'Website Maintenance Subscription UK for SMEs',
        serviceType: 'Website maintenance subscription',
        description:
          'Monthly website maintenance support for UK SMEs, including website updates, bug fixes, landing page improvements, technical SEO checks, analytics support, and conversion-focused improvements.',
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



  if (pathname === '/crm-integration-support-uk') {
    return {
      title: 'CRM Integration & Support for UK SMEs',
      description:
        'Primewayz helps UK SMEs connect CRM, ERP, websites, forms, email, support and reporting workflows with reliable CRM integration and long-term support.',
      canonical,
      ogType: 'website',
      ogImage: SEO_DEFAULT_OG_IMAGE,
      twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
      robots: 'index,follow',
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: 'CRM Integration & Support for UK SMEs',
        serviceType: 'CRM integration and support',
        description:
          'CRM integration and support services for UK SMEs, including CRM workflow automation, ERP and website integration, reporting, data flow reliability and ongoing technical support.',
        provider: baseOrg,
        areaServed: {
          '@type': 'Country',
          name: 'United Kingdom',
        },
      },
    };
  }
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
    title: 'Software Development Subscription for UK SMEs',
    description: defaultDescription,
    canonical,
    ogType: 'website',
    ogImage: SEO_DEFAULT_OG_IMAGE,
    twitterHandle: SEO_DEFAULT_TWITTER_HANDLE,
    robots: 'index,follow',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: 'Software development subscription for UK SMEs',
      name: 'Primewayz UK - Software Development Subscription for UK SMEs',
      description: defaultDescription,
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



async function sendUnansweredChatAlertEmail(message: any) {
  const recipients = getSmtpRecipients(
    process.env.CHAT_ALERT_EMAIL_TO ||
      process.env.ADMIN_EMAIL ||
      process.env.SMTP_FROM
  );

  if (recipients.length === 0) {
    backendLog('unanswered chat alert email skipped because no recipient is configured', {
      sessionId: message.sessionId,
      messageId: message.id,
    });
    return { sent: false, skipped: true, reason: 'recipient_not_configured' };
  }

  const visitorName = message.session?.name || 'Anonymous visitor';
  const visitorEmail = message.session?.email || 'No email provided';
  const preview = getChatAlertPreview(message.text);
  const adminUrl = buildAdminChatUrl();

  const subject = `Unanswered Primewayz chat lead: ${visitorName}`;
  const safeVisitorName = escapeEmailHtml(visitorName);
  const safeVisitorEmail = escapeEmailHtml(visitorEmail);
  const safePreview = escapeEmailHtml(preview);
  const safeSessionId = escapeEmailHtml(message.sessionId);
  const safeAdminUrl = escapeEmailHtml(adminUrl);
  const safeTimestamp = escapeEmailHtml(new Date(message.timestamp).toLocaleString('en-GB', {
    timeZone: CHAT_BUSINESS_HOURS_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }));

  const result = await sendSmtpEmail({
    to: recipients.join(','),
    subject,
    text: [
      'New unanswered Primewayz chat lead',
      '',
      `Visitor: ${visitorName}`,
      `Email: ${visitorEmail}`,
      `Session: ${message.sessionId}`,
      `Message time: ${safeTimestamp}`,
      '',
      `Message preview: ${preview}`,
      '',
      `Open admin panel: ${adminUrl}`,
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 12px">New unanswered Primewayz chat lead</h2>
        <p>A visitor message has been waiting for more than ${UNANSWERED_CHAT_ALERT_AFTER_MINUTES} minutes without an admin reply.</p>
        <table style="border-collapse:collapse;width:100%;max-width:640px">
          <tr><td style="padding:6px 0;color:#6b7280">Visitor</td><td style="padding:6px 0;font-weight:700">${safeVisitorName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0">${safeVisitorEmail}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Session</td><td style="padding:6px 0;font-family:monospace">${safeSessionId}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Message time</td><td style="padding:6px 0">${safeTimestamp}</td></tr>
        </table>
        <div style="margin:16px 0;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px">
          <strong>Message preview</strong>
          <p style="margin:8px 0 0">${safePreview}</p>
        </div>
        <p>
          <a href="${safeAdminUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700">
            Open admin panel
          </a>
        </p>
      </div>
    `,
  });

  if (result.sent) {
    backendLog('unanswered chat alert email sent', {
      sessionId: message.sessionId,
      messageId: message.id,
      to: recipients.join(','),
    });
  }

  return result;
}


async function findUnansweredChatMessages() {
  const threshold = new Date(Date.now() - UNANSWERED_CHAT_ALERT_AFTER_MINUTES * 60 * 1000);

  const userMessages = await prisma.chatMessage.findMany({
    where: {
      sender: 'user',
      timestamp: { lte: threshold },
    },
    orderBy: { timestamp: 'asc' },
    take: Math.max(1, UNANSWERED_CHAT_ALERT_MAX_PER_RUN),
    include: {
      session: true,
      attachments: true,
    },
  });

  const unansweredMessages = [];

  for (const message of userMessages) {
    const existingAlert = await (prisma as any).chatAlert.findFirst({
      where: {
        messageId: message.id,
        alertType: UNANSWERED_CHAT_ALERT_TYPE,
      },
      select: { id: true },
    });

    if (existingAlert) continue;

    const laterAdminReply = await prisma.chatMessage.findFirst({
      where: {
        sessionId: message.sessionId,
        sender: 'admin',
        timestamp: { gt: message.timestamp },
      },
      select: { id: true },
    });

    if (laterAdminReply) continue;

    const laterVisitorMessage = await prisma.chatMessage.findFirst({
      where: {
        sessionId: message.sessionId,
        sender: 'user',
        timestamp: { gt: message.timestamp },
      },
      select: { id: true },
    });

    // Alert only for the latest unanswered visitor message in a thread.
    if (laterVisitorMessage) continue;

    unansweredMessages.push(message);
  }

  return unansweredMessages;
}

function buildAdminChatUrl() {
  const configuredUrl = (process.env.PUBLIC_SITE_URL || process.env.SEO_SITE_URL || '').trim();
  const baseUrl = configuredUrl
    ? configuredUrl.replace(/\/+$/, '')
    : process.env.NODE_ENV === 'production'
      ? 'https://uk.primewayz.com'
      : `http://localhost:${PORT}`;

  return `${baseUrl}/admin`;
}

function getChatAlertPreview(text: string) {
  return text.replace(/\s+/g, ' ').trim().slice(0, 180);
}

async function runUnansweredChatAlertJob(source = 'interval') {
  try {
    if (!(prisma as any).chatAlert) {
      backendLog('unanswered chat alert job skipped: ChatAlert model unavailable. Run prisma generate.', { source });
      return { checked: false, created: 0, reason: 'chat_alert_model_unavailable' };
    }

    const messages = await findUnansweredChatMessages();
    let created = 0;

    for (const message of messages) {
      try {
        const alert = await (prisma as any).chatAlert.create({
          data: {
            sessionId: message.sessionId,
            messageId: message.id,
            alertType: UNANSWERED_CHAT_ALERT_TYPE,
            status: 'logged',
          },
        });

        created += 1;

        backendLog('unanswered chat alert created', {
          source,
          sessionId: message.sessionId,
          messageId: message.id,
          visitorName: message.session?.name || 'Anonymous',
          visitorEmail: message.session?.email || 'No email',
          messagePreview: getChatAlertPreview(message.text),
          adminUrl: buildAdminChatUrl(),
        });

        try {
          const emailResult = await sendUnansweredChatAlertEmail(message);
          await (prisma as any).chatAlert.update({
            where: { id: alert.id },
            data: {
              status: emailResult.sent
                ? 'email_sent'
                : emailResult.skipped
                  ? 'email_skipped'
                  : 'email_failed',
            },
          });
        } catch (emailError) {
          await (prisma as any).chatAlert.update({
            where: { id: alert.id },
            data: { status: 'email_failed' },
          });

          backendLog('unanswered chat alert email failed', {
            source,
            sessionId: message.sessionId,
            messageId: message.id,
            error: emailError instanceof Error ? emailError.message : String(emailError),
          });
        }
      } catch (error: any) {
        if (error?.code === 'P2002') continue;

        backendLog('unanswered chat alert create failed', {
          source,
          sessionId: message.sessionId,
          messageId: message.id,
          error: error?.message || String(error),
        });
      }
    }

    if (created > 0 || source !== 'interval') {
      backendLog('unanswered chat alert job completed', {
        source,
        candidates: messages.length,
        created,
      });
    }

    return { checked: true, candidates: messages.length, created };
  } catch (error) {
    backendLog('unanswered chat alert job failed', {
      source,
      error: error instanceof Error ? error.message : String(error),
    });

    return { checked: false, created: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

function startUnansweredChatAlertJob() {
  if (process.env.CHAT_ALERTS_ENABLED === 'false') {
    backendLog('unanswered chat alert job disabled by CHAT_ALERTS_ENABLED=false');
    return;
  }

  const run = () => {
    void runUnansweredChatAlertJob('interval');
  };

  setTimeout(run, Math.max(0, UNANSWERED_CHAT_ALERT_STARTUP_DELAY_MS));
  setInterval(run, Math.max(60_000, UNANSWERED_CHAT_ALERT_INTERVAL_MS));

  backendLog('unanswered chat alert job scheduled', {
    afterMinutes: UNANSWERED_CHAT_ALERT_AFTER_MINUTES,
    intervalMs: Math.max(60_000, UNANSWERED_CHAT_ALERT_INTERVAL_MS),
    startupDelayMs: Math.max(0, UNANSWERED_CHAT_ALERT_STARTUP_DELAY_MS),
  });
}


function getTimeZoneDateParts(date = new Date(), timeZone = DAILY_LEAD_SUMMARY_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function getUtcDateForTimeZoneLocalDate(year: number, month: number, day: number, hour = 0, minute = 0, timeZone = DAILY_LEAD_SUMMARY_TIMEZONE) {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const guessDate = new Date(utcGuess);
  const guessParts = getTimeZoneDateParts(guessDate, timeZone);

  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const actualAsUtc = Date.UTC(
    guessParts.year,
    guessParts.month - 1,
    guessParts.day,
    guessParts.hour,
    guessParts.minute,
    0,
    0,
  );

  return new Date(utcGuess - (actualAsUtc - targetAsUtc));
}

function addDaysToDateParts(year: number, month: number, day: number, days: number) {
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0, 0));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

function getDailyLeadSummaryWindow(now = new Date()) {
  const parts = getTimeZoneDateParts(now, DAILY_LEAD_SUMMARY_TIMEZONE);
  const nextDay = addDaysToDateParts(parts.year, parts.month, parts.day, 1);

  const start = getUtcDateForTimeZoneLocalDate(parts.year, parts.month, parts.day, 0, 0, DAILY_LEAD_SUMMARY_TIMEZONE);
  const end = getUtcDateForTimeZoneLocalDate(nextDay.year, nextDay.month, nextDay.day, 0, 0, DAILY_LEAD_SUMMARY_TIMEZONE);
  const dateKey = `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;

  return {
    dateKey,
    start,
    end,
    localParts: parts,
  };
}

function hasDailyLeadSummarySchedulePassed(now = new Date()) {
  const parts = getTimeZoneDateParts(now, DAILY_LEAD_SUMMARY_TIMEZONE);

  return parts.hour > DAILY_LEAD_SUMMARY_HOUR ||
    (parts.hour === DAILY_LEAD_SUMMARY_HOUR && parts.minute >= DAILY_LEAD_SUMMARY_MINUTE);
}

function formatUkSummaryDateTime(date?: Date | string | null) {
  if (!date) return '-';

  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: DAILY_LEAD_SUMMARY_TIMEZONE,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(date));
  } catch {
    return String(date);
  }
}

function renderSummaryRows(rows: string[]) {
  return rows.map((row) => `<li>${row}</li>`).join('');
}

async function collectDailyLeadSummary(window: { start: Date; end: Date; dateKey: string }) {
  const range = { gte: window.start, lt: window.end };

  const [
    contactFormsToday,
    chatSessionsToday,
    visitorMessagesToday,
    adminRepliesToday,
    botRepliesToday,
    appointmentsToday,
    pendingAppointments,
    unansweredAlertsToday,
    emailSentAlertsToday,
    emailFailedAlertsToday,
    latestForms,
    latestAppointments,
    latestAlerts,
  ] = await Promise.all([
    prisma.formResponse.count({ where: { createdAt: range } }),
    prisma.chatSession.count({ where: { createdAt: range } }),
    prisma.chatMessage.count({ where: { sender: 'user', timestamp: range } }),
    prisma.chatMessage.count({ where: { sender: 'admin', timestamp: range } }),
    prisma.chatMessage.count({ where: { sender: 'bot', timestamp: range } }),
    prisma.chatAppointmentRequest.count({ where: { createdAt: range } }),
    prisma.chatAppointmentRequest.count({ where: { status: 'pending' } }),
    (prisma as any).chatAlert.count({ where: { createdAt: range } }),
    (prisma as any).chatAlert.count({ where: { createdAt: range, status: 'email_sent' } }),
    (prisma as any).chatAlert.count({ where: { createdAt: range, status: 'email_failed' } }),
    prisma.formResponse.findMany({
      where: { createdAt: range },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.chatAppointmentRequest.findMany({
      where: { createdAt: range },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    (prisma as any).chatAlert.findMany({
      where: { createdAt: range },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    contactFormsToday,
    chatSessionsToday,
    visitorMessagesToday,
    adminRepliesToday,
    botRepliesToday,
    appointmentsToday,
    pendingAppointments,
    unansweredAlertsToday,
    emailSentAlertsToday,
    emailFailedAlertsToday,
    latestForms,
    latestAppointments,
    latestAlerts,
  };
}

async function sendDailyLeadSummaryEmail(window: { start: Date; end: Date; dateKey: string }, summary: any) {
  const recipients = getSmtpRecipients(
    process.env.DAILY_LEAD_SUMMARY_EMAIL_TO ||
      process.env.CHAT_ALERT_EMAIL_TO ||
      process.env.ADMIN_EMAIL ||
      process.env.SMTP_FROM
  );

  if (recipients.length === 0) {
    backendLog('daily lead summary email skipped because no recipient is configured', {
      dateKey: window.dateKey,
    });
    return { sent: false, skipped: true, reason: 'recipient_not_configured' };
  }

  const adminUrl = buildAdminChatUrl();
  const safeAdminUrl = escapeEmailHtml(adminUrl);
  const subject = `Primewayz UK daily lead summary - ${window.dateKey}`;

  const metricRows = [
    `Contact forms: <strong>${summary.contactFormsToday}</strong>`,
    `New chat sessions: <strong>${summary.chatSessionsToday}</strong>`,
    `Visitor messages: <strong>${summary.visitorMessagesToday}</strong>`,
    `Admin replies: <strong>${summary.adminRepliesToday}</strong>`,
    `Bot replies: <strong>${summary.botRepliesToday}</strong>`,
    `Appointment requests: <strong>${summary.appointmentsToday}</strong>`,
    `Pending appointments: <strong>${summary.pendingAppointments}</strong>`,
    `Unanswered chat alerts: <strong>${summary.unansweredAlertsToday}</strong>`,
    `Alert emails sent: <strong>${summary.emailSentAlertsToday}</strong>`,
    `Alert email failures: <strong>${summary.emailFailedAlertsToday}</strong>`,
  ];

  const latestFormsRows = summary.latestForms.length
    ? summary.latestForms.map((form: any) =>
        `${escapeEmailHtml(form.name)} — ${escapeEmailHtml(form.email)} — ${escapeEmailHtml(formatUkSummaryDateTime(form.createdAt))}`
      )
    : ['No contact form submissions today.'];

  const latestAppointmentRows = summary.latestAppointments.length
    ? summary.latestAppointments.map((appointment: any) =>
        `${escapeEmailHtml(appointment.name || 'Unknown')} — ${escapeEmailHtml(appointment.email || 'No email')} — ${escapeEmailHtml(appointment.status)} — ${escapeEmailHtml(formatUkSummaryDateTime(appointment.createdAt))}`
      )
    : ['No appointment requests today.'];

  const latestAlertRows = summary.latestAlerts.length
    ? summary.latestAlerts.map((alert: any) =>
        `Session ${escapeEmailHtml(alert.sessionId)} — message ${escapeEmailHtml(alert.messageId)} — ${escapeEmailHtml(alert.status)} — ${escapeEmailHtml(formatUkSummaryDateTime(alert.createdAt))}`
      )
    : ['No unanswered chat alerts today.'];

  const text = [
    `Primewayz UK daily lead summary - ${window.dateKey}`,
    '',
    `Contact forms: ${summary.contactFormsToday}`,
    `New chat sessions: ${summary.chatSessionsToday}`,
    `Visitor messages: ${summary.visitorMessagesToday}`,
    `Admin replies: ${summary.adminRepliesToday}`,
    `Bot replies: ${summary.botRepliesToday}`,
    `Appointment requests: ${summary.appointmentsToday}`,
    `Pending appointments: ${summary.pendingAppointments}`,
    `Unanswered chat alerts: ${summary.unansweredAlertsToday}`,
    `Alert emails sent: ${summary.emailSentAlertsToday}`,
    `Alert email failures: ${summary.emailFailedAlertsToday}`,
    '',
    `Admin panel: ${adminUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2 style="margin:0 0 12px">Primewayz UK daily lead summary</h2>
      <p style="margin:0 0 16px;color:#6b7280">Summary for ${escapeEmailHtml(window.dateKey)} (${escapeEmailHtml(DAILY_LEAD_SUMMARY_TIMEZONE)}).</p>

      <div style="margin:16px 0;padding:14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px">
        <h3 style="margin:0 0 8px">Key numbers</h3>
        <ul>${renderSummaryRows(metricRows)}</ul>
      </div>

      <div style="margin:16px 0;padding:14px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px">
        <h3 style="margin:0 0 8px">Latest contact forms</h3>
        <ul>${renderSummaryRows(latestFormsRows)}</ul>
      </div>

      <div style="margin:16px 0;padding:14px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px">
        <h3 style="margin:0 0 8px">Latest appointment requests</h3>
        <ul>${renderSummaryRows(latestAppointmentRows)}</ul>
      </div>

      <div style="margin:16px 0;padding:14px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px">
        <h3 style="margin:0 0 8px">Unanswered chat alerts</h3>
        <ul>${renderSummaryRows(latestAlertRows)}</ul>
      </div>

      <p>
        <a href="${safeAdminUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700">
          Open admin panel
        </a>
      </p>
    </div>
  `;

  const result = await sendSmtpEmail({
    to: recipients.join(','),
    subject,
    text,
    html,
  });

  if (result.sent) {
    backendLog('daily lead summary email sent', {
      dateKey: window.dateKey,
      to: recipients.join(','),
    });
  }

  return result;
}

async function runDailyLeadSummaryJob(source = 'interval', force = false) {
  try {
    if (!DAILY_LEAD_SUMMARY_ENABLED) {
      return { checked: false, sent: false, reason: 'disabled' };
    }

    if (!(prisma as any).leadSummaryEmail) {
      backendLog('daily lead summary job skipped: LeadSummaryEmail model unavailable. Run prisma generate.', { source });
      return { checked: false, sent: false, reason: 'lead_summary_model_unavailable' };
    }

    const window = getDailyLeadSummaryWindow();

    if (!force && !hasDailyLeadSummarySchedulePassed()) {
      return { checked: true, sent: false, reason: 'not_due', dateKey: window.dateKey };
    }

    const summaryType = force ? `daily_lead_summary_manual_${Date.now()}` : DAILY_LEAD_SUMMARY_TYPE;

    const existing = await (prisma as any).leadSummaryEmail.findFirst({
      where: {
        dateKey: window.dateKey,
        summaryType,
      },
      select: { id: true, status: true },
    });

    if (existing) {
      return { checked: true, sent: false, reason: 'already_sent_or_attempted', dateKey: window.dateKey, status: existing.status };
    }

    const record = await (prisma as any).leadSummaryEmail.create({
      data: {
        dateKey: window.dateKey,
        summaryType,
        status: 'pending',
      },
    });

    const summary = await collectDailyLeadSummary(window);
    let emailResult;

    try {
      emailResult = await sendDailyLeadSummaryEmail(window, summary);
    } catch (emailError) {
      await (prisma as any).leadSummaryEmail.update({
        where: { id: record.id },
        data: {
          status: 'email_failed',
          sentAt: new Date(),
        },
      });

      backendLog('daily lead summary email failed', {
        source,
        dateKey: window.dateKey,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      });

      return { checked: true, sent: false, dateKey: window.dateKey, status: 'email_failed' };
    }

    const status = emailResult.sent
      ? 'email_sent'
      : emailResult.skipped
        ? 'email_skipped'
        : 'email_failed';

    await (prisma as any).leadSummaryEmail.update({
      where: { id: record.id },
      data: {
        status,
        sentAt: new Date(),
      },
    });

    backendLog('daily lead summary job completed', {
      source,
      dateKey: window.dateKey,
      status,
      contactFormsToday: summary.contactFormsToday,
      chatSessionsToday: summary.chatSessionsToday,
      visitorMessagesToday: summary.visitorMessagesToday,
      appointmentsToday: summary.appointmentsToday,
      unansweredAlertsToday: summary.unansweredAlertsToday,
    });

    return { checked: true, sent: emailResult.sent, dateKey: window.dateKey, status };
  } catch (error) {
    backendLog('daily lead summary job failed', {
      source,
      error: error instanceof Error ? error.message : String(error),
    });

    return { checked: false, sent: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function startDailyLeadSummaryJob() {
  if (!DAILY_LEAD_SUMMARY_ENABLED) {
    backendLog('daily lead summary job disabled by DAILY_LEAD_SUMMARY_ENABLED=false');
    return;
  }

  const run = () => {
    void runDailyLeadSummaryJob('interval', false);
  };

  setTimeout(run, Math.max(0, DAILY_LEAD_SUMMARY_STARTUP_DELAY_MS));
  setInterval(run, Math.max(60_000, DAILY_LEAD_SUMMARY_INTERVAL_MS));

  backendLog('daily lead summary job scheduled', {
    timezone: DAILY_LEAD_SUMMARY_TIMEZONE,
    hour: DAILY_LEAD_SUMMARY_HOUR,
    minute: DAILY_LEAD_SUMMARY_MINUTE,
    intervalMs: Math.max(60_000, DAILY_LEAD_SUMMARY_INTERVAL_MS),
  });
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
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads'), {
    index: false,
    setHeaders: (res: any) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=604800');
    },
  }));

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


  app.post('/api/chat/heartbeat', async (req: any, res: any) => {
    try {
      const rawSessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';
      const safeSessionId = rawSessionId.slice(0, 120);

      if (!safeSessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const safeUserName = typeof req.body?.userName === 'string' ? req.body.userName.trim().slice(0, 120) : '';
      const safeUserEmail = typeof req.body?.userEmail === 'string' ? req.body.userEmail.trim().slice(0, 160) : '';
      const now = new Date();

      const session = await prisma.chatSession.upsert({
        where: { id: safeSessionId },
        update: {
          visitorLastSeenAt: now,
          ...(safeUserName ? { name: safeUserName } : {}),
          ...(safeUserEmail ? { email: safeUserEmail } : {}),
        },
        create: {
          id: safeSessionId,
          name: safeUserName || null,
          email: safeUserEmail || null,
          visitorLastSeenAt: now,
        },
      });

      res.json({
        success: true,
        sessionId: session.id,
        visitorLastSeenAt: session.visitorLastSeenAt,
      });
    } catch (error) {
      backendLog('chat visitor heartbeat failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to update visitor activity' });
    }
  });

  app.get('/api/chat/availability', async (req, res) => {
    try {
      const availability = await computeChatAvailability();
      const { mode, computedStatus, hasActiveAdmin, latestAdminSeenAt, customMessage, updatedAt, ...publicAvailability } = availability;
      res.json(publicAvailability);
    } catch (error) {
      backendLog('chat availability failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      const fallback = getAvailabilityCopy('assistant');
      res.json({
        status: 'assistant',
        title: fallback.title,
        subtitle: fallback.subtitle,
        responseExpectation: fallback.responseExpectation,
        businessHours: CHAT_BUSINESS_HOURS_LABEL,
        canAcceptMessages: true,
        canBookCall: true,
        serverTime: new Date().toISOString(),
      });
    }
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

  app.post('/api/admin/presence/heartbeat', authorize(), async (req: any, res: any) => {
    try {
      const userId = Number(req.user?.id);
      if (!Number.isFinite(userId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const presence = await (prisma as any).adminPresence.upsert({
        where: { userId },
        update: { lastSeenAt: new Date() },
        create: { userId, lastSeenAt: new Date() },
      });

      res.json({ success: true, lastSeenAt: presence.lastSeenAt });
    } catch (error) {
      backendLog('admin presence heartbeat failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to update presence' });
    }
  });



  app.post('/api/admin/chat/send-daily-summary', authorize(['admin', 'editor']), async (_req: any, res: any) => {
    const result = await runDailyLeadSummaryJob('manual', true);
    res.json(result);
  });

  app.post('/api/admin/chat/run-unanswered-alerts', authorize(['admin', 'editor']), async (_req: any, res: any) => {
    const result = await runUnansweredChatAlertJob('manual');
    res.json(result);
  });

  app.get('/api/admin/chat/availability', authorize(), async (req, res) => {
    try {
      const availability = await computeChatAvailability();
      res.json(availability);
    } catch (error) {
      backendLog('admin chat availability failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to load availability' });
    }
  });

  app.patch('/api/admin/chat/availability', authorize(), async (req: any, res: any) => {
    const mode = typeof req.body?.mode === 'string' ? req.body.mode.trim().toLowerCase() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 180) : '';

    if (!CHAT_PRESENCE_MODES.has(mode)) {
      return res.status(400).json({ error: 'Choose auto, online, away, or offline.' });
    }

    try {
      const existing = await getChatPresenceSetting();
      await (prisma as any).chatPresenceSetting.update({
        where: { id: existing.id },
        data: {
          mode,
          message: message || null,
          updatedById: Number(req.user?.id) || null,
        },
      });

      const availability = await computeChatAvailability();
      res.json(availability);
    } catch (error) {
      backendLog('admin chat availability update failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({ error: 'Failed to update availability' });
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
    const phoneNumbers = parseUkContactPhoneNumbers(req.body?.phone);
    const phoneE164 = phoneNumbers[0] || null;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Name, email and message are required.' });
    }
    if (!phoneE164) {
      return res.status(400).json({ success: false, error: 'Please provide a valid UK contact number.' });
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

  app.post('/api/chat/uploads', async (req, res) => {
    return handleChatUpload(req, res, 'user');
  });

  // Chat Message Submission
  app.post('/api/chat', async (req, res) => {
    const { sender, text, sessionId, replyToId, attachmentIds } = req.body;
    const safeSessionId = sessionId || 'default';
    const safeText = typeof text === 'string' ? text.trim() : '';
    const safeAttachmentIds = Array.isArray(attachmentIds)
      ? attachmentIds.map((id) => Number(id)).filter(Number.isFinite).slice(0, 5)
      : [];

    if (!safeText && safeAttachmentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Message or attachment is required' });
    }

    try {
      // Ensure session exists
      await prisma.chatSession.upsert({
        where: { id: safeSessionId },
        update: {},
        create: { id: safeSessionId }
      });

      const message = await prisma.chatMessage.create({
        data: {
          sender,
          text: safeText || 'Shared an attachment',
          sessionId: safeSessionId,
          replyToId: replyToId ? parseInt(replyToId) : null
        }
      });

      if (safeAttachmentIds.length > 0) {
        await prisma.chatAttachment.updateMany({
          where: { id: { in: safeAttachmentIds }, sessionId: safeSessionId, messageId: null },
          data: { messageId: message.id },
        });
      }

      const messageWithAttachments = await prisma.chatMessage.findUnique({
        where: { id: message.id },
        include: { attachments: true },
      });
      res.status(200).json({ success: true, data: messageWithAttachments });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ success: false, error: 'Failed to save message' });
    }
  });

  // Chat AI Response (server-side provider call + DB persistence)
  app.post('/api/chat/respond', async (req, res) => {
    const { sessionId, message, userName, attachmentIds } = req.body as { sessionId?: string; message?: string; userName?: string; attachmentIds?: number[] };
    const safeSessionId = sessionId || 'default';
    const safeMessage = message?.trim();
    const safeAttachmentIds = Array.isArray(attachmentIds)
      ? attachmentIds.map((id) => Number(id)).filter(Number.isFinite).slice(0, 5)
      : [];

    if (!safeMessage && safeAttachmentIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    backendLog('chat respond request', { sessionId: safeSessionId, textLength: safeMessage?.length || 0 });

    try {
      await prisma.chatSession.upsert({
        where: { id: safeSessionId },
        update: {},
        create: { id: safeSessionId, name: userName || null },
      });

      const savedUserMessage = await prisma.chatMessage.create({
        data: {
          sender: 'user',
          text: safeMessage || 'Shared an attachment',
          sessionId: safeSessionId,
        },
      });

      if (safeAttachmentIds.length > 0) {
        await prisma.chatAttachment.updateMany({
          where: { id: { in: safeAttachmentIds }, sessionId: safeSessionId, messageId: null },
          data: { messageId: savedUserMessage.id },
        });
      }

      const availability = await computeChatAvailability();
      let savedBotMessage: any = null;

      if (availability.status !== 'online') {
        savedBotMessage = await prisma.chatMessage.create({
          data: {
            sender: 'bot',
            text: CHAT_OFFLINE_AUTO_REPLY,
            sessionId: safeSessionId,
          },
        });
      }

      backendLog('chat respond success', {
        sessionId: safeSessionId,
        availabilityStatus: availability.status,
        botSent: Boolean(savedBotMessage),
      });
      return res.status(200).json({
        success: true,
        userMessage: await prisma.chatMessage.findUnique({ where: { id: savedUserMessage.id }, include: { attachments: true } }),
        botMessage: savedBotMessage,
        availability: {
          status: availability.status,
          title: availability.title,
          subtitle: availability.subtitle,
        },
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
        orderBy: { timestamp: 'asc' },
        include: { attachments: true },
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat history' });
    }
  });

  app.post('/api/chat/appointments', async (req, res) => {
    const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : 'default';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0, 120) : null;
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : null;
    const phone = typeof req.body?.phone === 'string' ? (parseUkContactPhoneNumbers(req.body.phone)[0] || req.body.phone.trim().slice(0, 40)) : null;
    const preferredDate = typeof req.body?.preferredDate === 'string' ? req.body.preferredDate.trim().slice(0, 40) : null;
    const preferredTime = typeof req.body?.preferredTime === 'string' ? req.body.preferredTime.trim().slice(0, 40) : null;
    const timezone = typeof req.body?.timezone === 'string' ? req.body.timezone.trim().slice(0, 80) : 'Europe/London';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim().slice(0, 1000) : null;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!preferredDate && !preferredTime && !message) {
      return res.status(400).json({ error: 'Please include appointment details.' });
    }

    try {
      await prisma.chatSession.upsert({
        where: { id: sessionId || 'default' },
        update: { name: name || undefined, email: email || undefined },
        create: { id: sessionId || 'default', name, email },
      });

      const appointment = await prisma.chatAppointmentRequest.create({
        data: {
          sessionId: sessionId || 'default',
          name,
          email,
          phone,
          preferredDate,
          preferredTime,
          timezone,
          message,
        },
      });

      await prisma.chatMessage.create({
        data: {
          sessionId: sessionId || 'default',
          sender: 'user',
          text: `Appointment request: ${preferredDate || 'date flexible'} ${preferredTime || ''}`.trim(),
        },
      });

      return res.status(201).json(appointment);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create appointment request.' });
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

  app.post('/api/admin/uploads', authorize(BLOG_AUTHOR_ROLES), async (req: any, res: any) => {
    try {
      const contentType = req.headers['content-type'] || '';
      if (!contentType.toLowerCase().includes('multipart/form-data')) {
        return res.status(400).json({ error: 'Upload must use multipart/form-data.' });
      }

      const body = await readRequestBuffer(req, BLOG_UPLOAD_DOCUMENT_MAX_BYTES + 1024 * 1024);
      const file = parseSingleMultipartFile(body, contentType);
      const rule = BLOG_UPLOAD_MIME_TYPES[file.mimeType];

      if (!rule) {
        return res.status(415).json({ error: 'Unsupported file type.' });
      }

      if (file.buffer.length > rule.maxBytes) {
        return res.status(413).json({
          error: rule.kind === 'image'
            ? 'Images must be 5 MB or smaller.'
            : 'Documents must be 10 MB or smaller.',
        });
      }

      const now = new Date();
      const year = String(now.getFullYear());
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog', year, month);
      await fs.mkdir(uploadDir, { recursive: true });

      const originalBase = sanitizeUploadBaseName(path.parse(file.originalName).name);
      const fileName = `${originalBase}-${crypto.randomBytes(8).toString('hex')}.${rule.extension}`;
      const filePath = path.join(uploadDir, fileName);
      const resolvedUploadDir = path.resolve(uploadDir);
      const resolvedFilePath = path.resolve(filePath);

      if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep)) {
        return res.status(400).json({ error: 'Invalid upload path.' });
      }

      await fs.writeFile(resolvedFilePath, file.buffer, { flag: 'wx' });

      return res.status(201).json({
        url: `/uploads/blog/${year}/${month}/${fileName}`,
        originalName: file.originalName,
        fileName,
        mimeType: file.mimeType,
        size: file.buffer.length,
        kind: rule.kind,
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : 'Upload failed.',
      });
    }
  });

  app.post('/api/admin/chat/uploads', authorize(['admin', 'editor', 'viewer', ...BLOG_AUTHOR_ROLES]), async (req: any, res: any) => {
    return handleChatUpload(req, res, 'admin');
  });

  app.post('/api/admin/blog-posts', authorize(BLOG_AUTHOR_ROLES), async (req: any, res: any) => {
    if (!cmsBlogPostModel) return res.status(503).json({ error: 'Blog CMS is not available. Run Prisma generate after applying the schema.' });

    const title = String(req.body?.title || '').trim();
    const content = sanitizeBlogHtml(String(req.body?.content || '').trim());
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
        content: req.body?.content !== undefined ? sanitizeBlogHtml(String(req.body.content).trim()) : existing.content,
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

  const ACTIVE_CHAT_ALERT_STATUSES = ['logged', 'email_sent', 'email_failed', 'email_skipped'];
  const ALLOWED_CHAT_ALERT_STATUSES = [...ACTIVE_CHAT_ALERT_STATUSES, 'reviewed', 'resolved'];

  app.get('/api/admin/notifications/summary', authorize(['admin', 'editor', 'viewer']), async (_req: any, res: any) => {
    try {
      const window = getDailyLeadSummaryWindow();
      const todayRange = { gte: window.start, lt: window.end };
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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
        latestAppointments,
        latestForms,
        latestSessions,
        latestDailySummary,
      ] = await Promise.all([
        prisma.formResponse.count({ where: { createdAt: todayRange } }),
        prisma.chatSession.count({ where: { createdAt: todayRange } }),
        prisma.chatMessage.count({ where: { sender: 'user', timestamp: todayRange } }),
        prisma.chatMessage.count({ where: { sender: 'admin', timestamp: todayRange } }),
        prisma.chatAppointmentRequest.count({ where: { createdAt: todayRange } }),
        prisma.chatAppointmentRequest.count({ where: { status: 'pending' } }),
        (prisma as any).chatAlert.count({ where: { createdAt: todayRange, status: { in: ACTIVE_CHAT_ALERT_STATUSES } } }),
        (prisma as any).chatAlert.count({ where: { createdAt: todayRange, status: 'email_sent' } }),
        (prisma as any).chatAlert.count({ where: { createdAt: todayRange, status: 'email_failed' } }),
        (prisma as any).chatAlert.count({ where: { createdAt: todayRange, status: 'email_skipped' } }),
        (prisma as any).chatAlert.count({ where: { createdAt: { gte: sevenDaysAgo }, status: { in: ACTIVE_CHAT_ALERT_STATUSES } } }),
        (prisma as any).chatAlert.findMany({
          where: { createdAt: { gte: sevenDaysAgo }, status: { in: ACTIVE_CHAT_ALERT_STATUSES } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.chatAppointmentRequest.findMany({
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.formResponse.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
        prisma.chatSession.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            messages: {
              orderBy: { timestamp: 'desc' },
              take: 1,
            },
          },
        }),
        (prisma as any).leadSummaryEmail.findFirst({
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const priority = todayEmailFailedAlerts > 0 || pendingAppointments > 0
        ? 'high'
        : todayUnansweredAlerts > 0 || todayContactForms > 0 || todayChatSessions > 0
          ? 'medium'
          : 'normal';

      res.json({
        dateKey: window.dateKey,
        generatedAt: new Date().toISOString(),
        priority,
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
        latestAppointments,
        latestForms,
        latestSessions,
        latestDailySummary,
      });
    } catch (error) {
      backendLog('admin notification summary failed', {
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({ error: 'Failed to load notification summary' });
    }
  });


  app.patch('/api/admin/chat-alerts/:id/status', authorize(['admin', 'editor']), async (req: any, res: any) => {
    const alertId = Number(req.params.id);
    const status = String(req.body?.status || '').trim();

    if (!Number.isFinite(alertId) || alertId <= 0) {
      return res.status(400).json({ error: 'Invalid alert id' });
    }

    if (!ALLOWED_CHAT_ALERT_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid alert status' });
    }

    try {
      const updated = await (prisma as any).chatAlert.update({
        where: { id: alertId },
        data: { status },
      });

      backendLog('chat alert status updated', {
        alertId,
        status,
        sessionId: updated.sessionId,
        messageId: updated.messageId,
      });

      res.json(updated);
    } catch (error) {
      backendLog('chat alert status update failed', {
        alertId,
        status,
        error: error instanceof Error ? error.message : String(error),
      });

      res.status(500).json({ error: 'Failed to update chat alert status' });
    }
  });

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
        include: { session: true, attachments: true },
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
            take: 1,
            include: { attachments: true },
          }
        }
      });
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.get('/api/admin/chat/appointments', authorize(['admin', 'editor', 'viewer']), async (req: any, res: any) => {
    const sessionId = typeof req.query?.sessionId === 'string' ? req.query.sessionId : undefined;
    try {
      const appointments = await prisma.chatAppointmentRequest.findMany({
        where: sessionId ? { sessionId } : {},
        orderBy: { createdAt: 'desc' },
      });
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch appointment requests' });
    }
  });

  app.patch('/api/admin/chat/appointments/:id', authorize(['admin', 'editor', 'viewer']), async (req: any, res: any) => {
    const id = Number(req.params.id);
    const status = typeof req.body?.status === 'string' ? req.body.status : undefined;
    const adminNote = typeof req.body?.adminNote === 'string' ? req.body.adminNote.trim().slice(0, 1000) : undefined;

    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid appointment id.' });
    if (status && !CHAT_APPOINTMENT_STATUSES.has(status)) return res.status(400).json({ error: 'Invalid appointment status.' });

    try {
      const updated = await prisma.chatAppointmentRequest.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(adminNote !== undefined ? { adminNote } : {}),
        },
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update appointment request' });
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

  startUnansweredChatAlertJob();
  startDailyLeadSummaryJob();

  app.listen(PORT, '0.0.0.0', () => {
    backendLog(`server running on http://localhost:${PORT}`);
  });
}

startServer();
