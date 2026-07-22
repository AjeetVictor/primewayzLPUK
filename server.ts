import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getAllBlogPosts, getBlogPostById, getPostTimestamp } from './src/data/blog/utils.ts';
import {
  buildArticleBreadcrumbs,
  buildCategoryBreadcrumbs,
  getArticleCategoryDisplayName,
  getArticlePrimaryCategory,
  getBlogCategoryBySlug,
  getCategoryPageArticles,
  isPublishableCategoryPage,
  normaliseBlogPostCategories,
} from './src/data/blog/categories.ts';
import { runDigitalVisibilityCheck } from './src/lib/digitalVisibilityCheck.ts';
import { runWebPresenceAudit } from './src/lib/audit/runWebPresenceAudit.ts';
import { AuditInputError } from './src/lib/audit/types.ts';
import { createSharedReport, getSharedReport } from './src/lib/audit/share/shareReportService.ts';
import { ensureReportStoreReady } from './src/lib/audit/share/reportStore.ts';
import { isValidPublicToken } from './src/lib/audit/share/publicToken.ts';
import { emailAuditReport, EmailReportValidationError } from './src/lib/audit/email/emailReportService.ts';
import { ensureLeadStoreReady } from './src/lib/audit/leads/leadStore.ts';
import {
  addAdminAuditLeadNote,
  getAdminAuditLeadById,
  listAdminAuditLeads,
  updateAdminAuditLeadStatus,
  validateAuditLeadAdminStatus,
} from './src/lib/audit/leads/adminAuditLeadsService.ts';
import { registerAutopilotAdminRoutes } from './src/lib/autopilot/registerAutopilotAdminRoutes.ts';
import type { NextFunction, Request, Response } from 'express';
import type { BlogCategory, BlogPost, BreadcrumbItem } from './src/data/blog/types.ts';
import { LEGACY_ROUTE_REDIRECTS } from './src/constants/canonicalRoutes.ts';
import {
  buildRedirectLocation,
  isLiveInsightsSlug,
  normalizeInsightsPathname,
  resolveInsightsToBlogRedirect,
} from './src/data/blog/legacyRedirects.ts';
import { SDAAS_DEFINITION, SDAAS_SEO, sdaasFaqs } from './src/data/sdaas/commercialPage.ts';
import {
  buildSdaasImageObjectSchema,
  SDAAS_CLUSTER_REUSABLE_IMAGES,
  SDAAS_COMMERCIAL_IMAGES,
} from './src/data/sdaas/images.ts';
import {
  pillarFaqs,
  SDAAS_PILLAR_OG_IMAGE,
  SDAAS_PILLAR_PATH,
  SDAAS_PILLAR_SEO,
} from './src/data/sdaas/pillarArticle.ts';
import {
  comparisonFaqs,
  SDAAS_COMPARISON_OG_IMAGE,
  SDAAS_COMPARISON_PATH,
  SDAAS_COMPARISON_SEO,
} from './src/data/sdaas/comparisonArticle.ts';
import {
  useCasesFaqs,
  SDAAS_USE_CASES_OG_IMAGE,
  SDAAS_USE_CASES_PATH,
  SDAAS_USE_CASES_SEO,
} from './src/data/sdaas/useCasesArticle.ts';
import {
  SDAAS_SUPPORTING_ARTICLES,
  getSdaasSupportingArticleByPath,
} from './src/data/sdaas/supportingArticlesRegistry.ts';
import type { SupportingArticleDefinition } from './src/data/sdaas/supportingArticleTypes.ts';
import { getPublishedSuccessStoryBySlug, type SuccessStory } from './src/data/successStories.ts';

dotenv.config({ path: '.env.local', override: false });
dotenv.config({ override: false });

const isProd = process.env.NODE_ENV === 'production';
// console.log('[debug] NODE_ENV:', process.env.NODE_ENV, '| isProd:', isProd);
const app = express();

const adminNoindexMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === '/admin' || req.path.startsWith('/admin/')) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
};

const sharedAuditReportNoindexMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    req.path.startsWith('/web-presence-audit/report/')
    || req.path.startsWith('/api/tools/web-presence-audit/report/')
  ) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  }
  next();
};

app.use(adminNoindexMiddleware);
app.use(sharedAuditReportNoindexMiddleware);
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

const CONVERSATION_STATUSES = [
  'new',
  'bot_replied',
  'admin_needed',
  'admin_replied',
  'lead_qualified',
  'follow_up_due',
  'booked_call',
  'closed',
  'spam',
] as const;

const TERMINAL_CONVERSATION_STATUSES = new Set(['closed', 'spam']);

const chatMessageInclude = {
  attachments: true,
  replyTo: {
    select: {
      id: true,
      text: true,
      sender: true,
      deletedAt: true,
      isInternalNote: true,
    },
  },
};

function isValidConversationStatus(status: string) {
  return CONVERSATION_STATUSES.includes(status as (typeof CONVERSATION_STATUSES)[number]);
}

function formatVisitorMessage(message: {
  id: number;
  sessionId: string;
  sender: string;
  text: string;
  timestamp: Date;
  answered: boolean;
  replyToId: number | null;
  isInternalNote: boolean;
  deletedAt: Date | null;
  deletedBy: number | null;
  editedAt: Date | null;
  replyTo?: {
    id: number;
    text: string;
    sender: string;
    deletedAt: Date | null;
    isInternalNote: boolean;
  } | null;
  attachments?: unknown[];
}) {
  if (message.isInternalNote) return null;

  const replyTo = message.replyTo?.isInternalNote
    ? null
    : message.replyTo
      ? {
          ...message.replyTo,
          text: message.replyTo.deletedAt ? 'Message deleted' : message.replyTo.text,
        }
      : null;

  return {
    ...message,
    text: message.deletedAt ? 'Message deleted' : message.text,
    replyTo,
  };
}

function buildSessionSourceData(body: Record<string, unknown>) {
  const pickString = (key: string) =>
    typeof body[key] === 'string' && body[key] ? (body[key] as string) : undefined;

  return {
    firstLandingPage: pickString('firstLandingPage'),
    currentPageUrl: pickString('currentPageUrl'),
    referrer: pickString('referrer'),
    utmSource: pickString('utmSource'),
    utmMedium: pickString('utmMedium'),
    utmCampaign: pickString('utmCampaign'),
    utmContent: pickString('utmContent'),
    deviceType: pickString('deviceType'),
    browser: pickString('browser'),
    serviceInterest: pickString('serviceInterest'),
  };
}

async function getAdminUserFromRequest(req: AdminRequest) {
  try {
    const token = req.cookies?.[adminCookieName];
    if (!token) return null;
    const decoded = jwt.verify(token, getJwtSecret()) as { email?: string };
    if (!decoded.email) return null;
    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user || !isOperationsRole(user.role)) return null;
    return user;
  } catch {
    return null;
  }
}

async function updateConversationStatus(
  sessionId: string,
  status: string,
  extra: Record<string, unknown> = {},
) {
  if (!isValidConversationStatus(status)) return;
  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      status,
      ...extra,
    },
  });
}

async function autoUpdateConversationStatus(sessionId: string, status: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: { status: true },
  });
  if (!session || TERMINAL_CONVERSATION_STATUSES.has(session.status)) return;
  await updateConversationStatus(sessionId, status);
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

function isDatabaseUnavailableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return (
    err.name === 'PrismaClientInitializationError'
    || err.message.includes("Can't reach database server")
    || err.message.includes('ECONNREFUSED')
    || err.message.includes('Connection refused')
    || err.message.includes('P1001')
  );
}

function logChatDbFallback(context: string, err: unknown) {
  console.warn(`[local-safe] ${context}:`, err instanceof Error ? err.message : err);
}

const OFFLINE_CHAT_BOT_REPLY =
  'Thanks for your message. We have received it and the Primewayz UK team will follow up shortly.';

function offlineChatSessionStub(sessionId: string, extra: Record<string, unknown> = {}) {
  return {
    id: sessionId,
    status: 'new',
    unavailable: true,
    ...extra,
  };
}

async function offlineChatRespondPayload(userText: string) {
  const now = new Date();
  return {
    userMessage: {
      id: `offline-user-${now.getTime()}`,
      text: userText,
      sender: 'user',
      timestamp: now.toISOString(),
    },
    botMessage: {
      id: `offline-bot-${now.getTime()}`,
      text: OFFLINE_CHAT_BOT_REPLY,
      sender: 'bot',
      timestamp: now.toISOString(),
    },
    availability: await getChatAvailabilityPayload(),
    unavailable: true,
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

function toIsoDate(value?: string) {
  const timestamp = value ? Date.parse(value) : NaN;
  return new Date(Number.isNaN(timestamp) ? Date.now() : timestamp).toISOString();
}

function toAbsoluteSiteUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

function cmsPostToBlogPost(post: any): BlogPost {
  const date = post.date || post.publishedAt || post.createdAt;
  const tags = Array.isArray(post.tags)
    ? post.tags.map(String)
    : typeof post.tags === 'string'
      ? post.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      : [];

  const mapped: BlogPost = {
    id: post.slug,
    slug: post.slug,
    title: post.title,
    description: post.description || post.excerpt || stripHtml(post.content || '').slice(0, 160),
    excerpt: post.excerpt || post.description || stripHtml(post.content || '').slice(0, 220),
    category: post.category || 'Digital Operations',
    primaryCategory: typeof post.primaryCategory === 'string' ? post.primaryCategory : undefined,
    secondaryCategories: Array.isArray(post.secondaryCategories)
      ? post.secondaryCategories.map(String)
      : undefined,
    categorySlug: typeof post.categorySlug === 'string' ? post.categorySlug : undefined,
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
    imageAlt: post.imageAlt || undefined,
    content: post.content || '',
    featured: Boolean(post.featured),
    seoTitle: post.seoTitle || undefined,
    seoDescription: post.seoDescription || undefined,
    linkedInEmbedHtml: post.linkedInEmbedHtml || undefined,
    linkedInPostUrl: post.linkedInPostUrl || undefined,
  };

  const normalised = normaliseBlogPostCategories(mapped);
  return {
    ...mapped,
    primaryCategory: normalised.primaryCategory,
    secondaryCategories: normalised.secondaryCategories,
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

function buildSuccessStoryStructuredData(story: SuccessStory, canonical: string) {
  const providerId = `${siteUrl}/#primewayz-infotech`;
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const ogImage = `${siteUrl}${story.ogImage}`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': providerId,
        name: 'Primewayz Infotech',
        url: siteUrl,
        logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: story.seoTitle,
        description: story.seoDescription,
        inLanguage: 'en-GB',
        isPartOf: { '@id': `${siteUrl}/#website` },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        primaryImageOfPage: ogImage,
        about: { '@id': articleId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${siteUrl}/` },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Success Stories',
            item: `${siteUrl}/success-stories`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: story.shortTitle,
            item: canonical,
          },
        ],
      },
      {
        '@type': 'Article',
        '@id': articleId,
        headline: story.title,
        description: story.seoDescription,
        image: ogImage,
        author: {
          '@type': 'Organization',
          '@id': providerId,
          name: 'Primewayz Infotech',
        },
        publisher: {
          '@type': 'Organization',
          '@id': providerId,
          name: 'Primewayz Infotech',
          logo: { '@type': 'ImageObject', url: `${siteUrl}/primewayz-uk-dark-logo.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': webpageId },
        keywords: story.relatedServiceLabels.join(', '),
        inLanguage: 'en-GB',
        about: story.relatedServiceLabels.map((name) => ({ '@type': 'Thing', name })),
      },
    ],
  };
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
      'Website visibility and conversion support',
      'CRM integration and workflow automation',
      'Software and product engineering',
      'Managed application and website support',
      'Remote IT team extension',
    ],
    audience: { '@type': 'BusinessAudience', audienceType: 'UK small businesses and SMEs' },
  };
}

function buildSdaasStructuredData(canonical: string, description: string) {
  const providerId = `${siteUrl}/#primewayz-uk`;
  const webpageId = `${canonical}#webpage`;
  const serviceId = `${canonical}#service`;
  const heroImage = SDAAS_COMMERCIAL_IMAGES.heroWorkflow;
  const heroImageId = `${siteUrl}${heroImage.basePath}.webp#image`;
  const imageObjects = Object.values(SDAAS_COMMERCIAL_IMAGES).map((image) =>
    buildSdaasImageObjectSchema(siteUrl, canonical, image),
  );

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': providerId,
        name: 'Primewayz UK',
        url: siteUrl,
        logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
        parentOrganization: {
          '@type': 'Organization',
          name: 'Primewayz Infotech Pvt. Ltd.',
          url: 'https://primewayz.com/',
        },
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: SDAAS_SEO.title,
        description,
        inLanguage: 'en-GB',
        isPartOf: { '@id': `${siteUrl}/#website` },
        about: { '@id': serviceId },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        primaryImageOfPage: { '@id': heroImageId },
        image: imageObjects.map((image) => ({ '@id': image['@id'] })),
      },
      {
        '@type': 'Service',
        '@id': serviceId,
        name: 'Software Development as a Subscription',
        serviceType: 'Software Development as a Subscription',
        description: SDAAS_DEFINITION,
        url: canonical,
        provider: { '@id': providerId },
        areaServed: { '@type': 'Country', name: 'United Kingdom' },
        audience: {
          '@type': 'BusinessAudience',
          audienceType: 'UK SMEs and growing digital businesses with continuous development needs',
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: `${siteUrl}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Services',
            item: `${siteUrl}/services`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Software Development as a Subscription',
            item: canonical,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: sdaasFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      ...imageObjects,
    ],
  };
}

function buildWebPresenceAuditStructuredData(canonical: string, description: string) {
  const providerId = `${siteUrl}/#primewayz-uk`;
  const applicationId = `${canonical}#web-application`;
  const serviceId = `${canonical}#service`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': providerId,
        name: 'Primewayz UK',
        url: siteUrl,
        logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
      },
      {
        '@type': 'WebApplication',
        '@id': applicationId,
        name: 'Free UK SME Web Presence Audit / Benchmark',
        url: canonical,
        description,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        browserRequirements: 'Requires a modern web browser',
        inLanguage: 'en-GB',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'GBP',
        },
        provider: { '@id': providerId },
        audience: {
          '@type': 'BusinessAudience',
          audienceType: 'UK small businesses and SMEs',
        },
        featureList: [
          'Public website signal review',
          'Technical SEO readiness overview',
          'Trust and enquiry path review',
          'UK and local relevance indicators',
          'Shareable public-signal report',
          'Sector-aware recommendations',
        ],
      },
      {
        '@type': 'Service',
        '@id': serviceId,
        name: 'Free UK SME Web Presence Audit / Benchmark',
        url: canonical,
        description,
        provider: { '@id': providerId },
        areaServed: { '@type': 'Country', name: 'United Kingdom' },
        serviceType: 'Public-signal website readiness audit',
        isRelatedTo: { '@id': applicationId },
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What does the free UK SME web presence audit check?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'It reviews visible public-page signals across website basics, technical SEO readiness, trust, enquiry paths, UK and local relevance, reputation evidence, performance foundations, and analytics readiness.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does this tool verify Google or Bing rankings?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. It does not scrape search engines or claim to verify rankings. Google Search, Bing Search, Google Business Profile, external review platforms, and other authenticated sources are marked as not verified.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I request a deeper audit?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Primewayz UK can provide an in-depth review using verified platform access, manual checks, and business-specific context when those permissions are available.',
            },
          },
        ],
      },
    ],
  };
}

function buildSdaasPillarStructuredData(canonical: string) {
  const providerId = `${siteUrl}/#primewayz-uk`;
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const ogImage = `${siteUrl}${SDAAS_PILLAR_OG_IMAGE}`;
  const reusableImages = SDAAS_CLUSTER_REUSABLE_IMAGES.slice(0, 4).map((image) =>
    buildSdaasImageObjectSchema(siteUrl, canonical, image),
  );

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': providerId,
        name: 'Primewayz UK',
        url: siteUrl,
        logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: SDAAS_PILLAR_SEO.title,
        description: SDAAS_PILLAR_SEO.description,
        inLanguage: 'en-GB',
        isPartOf: { '@id': `${siteUrl}/#website` },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        primaryImageOfPage: { '@id': `${ogImage}#image` },
        about: { '@id': articleId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: `${siteUrl}/blog` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Subscription-Based Software Development',
            item: canonical,
          },
        ],
      },
      {
        '@type': 'Article',
        '@id': articleId,
        headline: SDAAS_PILLAR_SEO.h1,
        description: SDAAS_PILLAR_SEO.description,
        image: [ogImage, ...reusableImages.map((image) => image.contentUrl)],
        datePublished: `${SDAAS_PILLAR_SEO.datePublished}T09:00:00+01:00`,
        dateModified: `${SDAAS_PILLAR_SEO.dateModified}T09:00:00+01:00`,
        author: { '@type': 'Organization', '@id': providerId, name: SDAAS_PILLAR_SEO.author },
        publisher: {
          '@type': 'Organization',
          '@id': providerId,
          name: 'Primewayz UK',
          logo: { '@type': 'ImageObject', url: `${siteUrl}/primewayz-uk-dark-logo.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': webpageId },
        articleSection: SDAAS_PILLAR_SEO.category,
        keywords: SDAAS_PILLAR_SEO.keywords.join(', '),
        inLanguage: 'en-GB',
        about: [
          { '@type': 'Thing', name: 'Subscription-based software development' },
          { '@type': 'Thing', name: 'Software Development as a Subscription' },
          { '@type': 'Thing', name: 'SaaS subscription model' },
        ],
        mentions: [
          { '@type': 'Thing', name: 'Monthly development capacity' },
          { '@type': 'Thing', name: 'Fixed-price software development' },
          { '@type': 'Thing', name: 'Shared backlog' },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: pillarFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      ...reusableImages,
    ],
  };
}

function buildSdaasComparisonStructuredData(canonical: string) {
  const providerId = `${siteUrl}/#primewayz-uk`;
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const ogImage = `${siteUrl}${SDAAS_COMPARISON_OG_IMAGE}`;
  const comparisonImages = [
    SDAAS_COMMERCIAL_IMAGES.subscriptionVsFixedPrice,
    SDAAS_COMMERCIAL_IMAGES.monthlyCapacity,
  ].map((image) => buildSdaasImageObjectSchema(siteUrl, canonical, image));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': providerId,
        name: 'Primewayz UK',
        url: siteUrl,
        logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: SDAAS_COMPARISON_SEO.title,
        description: SDAAS_COMPARISON_SEO.description,
        inLanguage: 'en-GB',
        isPartOf: { '@id': `${siteUrl}/#website` },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        primaryImageOfPage: { '@id': `${ogImage}#image` },
        about: { '@id': articleId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: `${siteUrl}/blog` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Software Development Subscription vs Fixed-Price',
            item: canonical,
          },
        ],
      },
      {
        '@type': 'Article',
        '@id': articleId,
        headline: SDAAS_COMPARISON_SEO.h1,
        description: SDAAS_COMPARISON_SEO.description,
        image: [ogImage, ...comparisonImages.map((image) => image.contentUrl)],
        datePublished: `${SDAAS_COMPARISON_SEO.datePublished}T09:00:00+01:00`,
        dateModified: `${SDAAS_COMPARISON_SEO.dateModified}T09:00:00+01:00`,
        author: {
          '@type': 'Organization',
          '@id': providerId,
          name: SDAAS_COMPARISON_SEO.author,
        },
        publisher: {
          '@type': 'Organization',
          '@id': providerId,
          name: 'Primewayz UK',
          logo: { '@type': 'ImageObject', url: `${siteUrl}/primewayz-uk-dark-logo.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': webpageId },
        articleSection: SDAAS_COMPARISON_SEO.category,
        keywords: SDAAS_COMPARISON_SEO.keywords.join(', '),
        inLanguage: 'en-GB',
        about: [
          { '@type': 'Thing', name: 'Fixed-price software development' },
          { '@type': 'Thing', name: 'Software Development as a Subscription' },
          { '@type': 'Thing', name: 'Software procurement' },
        ],
        mentions: [
          { '@type': 'Thing', name: 'Monthly development capacity' },
          { '@type': 'Thing', name: 'Software project planning' },
          { '@type': 'Thing', name: 'Hybrid delivery model' },
          { '@type': 'Thing', name: 'Discovery phase' },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: comparisonFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      ...comparisonImages,
    ],
  };
}

function buildSdaasUseCasesStructuredData(canonical: string) {
  const providerId = `${siteUrl}/#primewayz-uk`;
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const ogImage = `${siteUrl}${SDAAS_USE_CASES_OG_IMAGE}`;
  const useCaseImages = [
    SDAAS_COMMERCIAL_IMAGES.scatteredToStructured,
    SDAAS_COMMERCIAL_IMAGES.monthlyCapacity,
    SDAAS_COMMERCIAL_IMAGES.deliveryProcess,
  ].map((image) => buildSdaasImageObjectSchema(siteUrl, canonical, image));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': providerId,
        name: 'Primewayz UK',
        url: siteUrl,
        logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: SDAAS_USE_CASES_SEO.title,
        description: SDAAS_USE_CASES_SEO.description,
        inLanguage: 'en-GB',
        isPartOf: { '@id': `${siteUrl}/#website` },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        primaryImageOfPage: { '@id': `${ogImage}#image` },
        about: { '@id': articleId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: `${siteUrl}/blog` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Software Development Subscription Use Cases',
            item: canonical,
          },
        ],
      },
      {
        '@type': 'Article',
        '@id': articleId,
        headline: SDAAS_USE_CASES_SEO.h1,
        description: SDAAS_USE_CASES_SEO.description,
        image: [ogImage, ...useCaseImages.map((image) => image.contentUrl)],
        datePublished: `${SDAAS_USE_CASES_SEO.datePublished}T09:00:00+01:00`,
        dateModified: `${SDAAS_USE_CASES_SEO.dateModified}T09:00:00+01:00`,
        author: {
          '@type': 'Organization',
          '@id': providerId,
          name: SDAAS_USE_CASES_SEO.author,
        },
        publisher: {
          '@type': 'Organization',
          '@id': providerId,
          name: 'Primewayz UK',
          logo: { '@type': 'ImageObject', url: `${siteUrl}/primewayz-uk-dark-logo.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': webpageId },
        articleSection: SDAAS_USE_CASES_SEO.category,
        keywords: SDAAS_USE_CASES_SEO.keywords.join(', '),
        inLanguage: 'en-GB',
        about: [
          { '@type': 'Thing', name: 'Software Development as a Subscription' },
          { '@type': 'Thing', name: 'SaaS product development' },
          { '@type': 'Thing', name: 'Application modernisation' },
          { '@type': 'Thing', name: 'Monthly development capacity' },
        ],
        mentions: [
          { '@type': 'Thing', name: 'API integration' },
          { '@type': 'Thing', name: 'Business-process automation' },
          { '@type': 'Thing', name: 'Technical debt' },
          { '@type': 'Thing', name: 'Software maintenance' },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: useCasesFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      ...useCaseImages,
    ],
  };
}

function buildSdaasSupportingArticleStructuredData(
  article: SupportingArticleDefinition,
  canonical: string,
) {
  const providerId = `${siteUrl}/#primewayz-uk`;
  const webpageId = `${canonical}#webpage`;
  const articleId = `${canonical}#article`;
  const ogImage = `${siteUrl}${article.ogImage}`;
  const supportingImages = Object.values(SDAAS_COMMERCIAL_IMAGES)
    .filter((image) => article.reusableVisuals.includes(image.basePath))
    .slice(0, 2)
    .map((image) => buildSdaasImageObjectSchema(siteUrl, canonical, image));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': providerId,
        name: 'Primewayz UK',
        url: siteUrl,
        logo: `${siteUrl}/primewayz-uk-dark-logo.png`,
      },
      {
        '@type': 'WebPage',
        '@id': webpageId,
        url: canonical,
        name: article.seo.title,
        description: article.seo.description,
        inLanguage: 'en-GB',
        isPartOf: { '@id': `${siteUrl}/#website` },
        breadcrumb: { '@id': `${canonical}#breadcrumb` },
        primaryImageOfPage: { '@id': `${ogImage}#image` },
        about: { '@id': articleId },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Insights', item: `${siteUrl}/blog` },
          {
            '@type': 'ListItem',
            position: 3,
            name: article.breadcrumbLabel,
            item: canonical,
          },
        ],
      },
      {
        '@type': 'Article',
        '@id': articleId,
        headline: article.seo.h1,
        description: article.seo.description,
        image: [ogImage, ...supportingImages.map((image) => image.contentUrl)],
        datePublished: `${article.seo.datePublished}T09:00:00+01:00`,
        dateModified: `${article.seo.dateModified}T09:00:00+01:00`,
        author: {
          '@type': 'Organization',
          '@id': providerId,
          name: article.seo.author,
        },
        publisher: {
          '@type': 'Organization',
          '@id': providerId,
          name: 'Primewayz UK',
          logo: { '@type': 'ImageObject', url: `${siteUrl}/primewayz-uk-dark-logo.png` },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': webpageId },
        articleSection: article.seo.category,
        keywords: article.seo.keywords.join(', '),
        inLanguage: 'en-GB',
        about: article.aboutEntities.map((name) => ({ '@type': 'Thing', name })),
        mentions: article.mentionEntities.map((name) => ({ '@type': 'Thing', name })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${canonical}#faq`,
        mainEntity: article.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
      ...supportingImages,
    ],
  };
}

function buildBreadcrumbList(items: BreadcrumbItem[], siteBaseUrl: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href
        ? { item: `${siteBaseUrl}${item.href === '/' ? '/' : item.href}` }
        : {}),
    })),
  };
}

function buildCategoryStructuredData(
  category: BlogCategory,
  posts: BlogPost[],
  canonical: string,
) {
  const { featured, articles, essentialGuides } = getCategoryPageArticles(category.slug, posts);
  const visibleArticles = [
    ...(featured ? [featured] : []),
    ...essentialGuides,
    ...articles,
  ];
  const breadcrumbs = buildCategoryBreadcrumbs(category);
  const breadcrumb = buildBreadcrumbList(breadcrumbs, siteUrl);
  const itemList = {
    '@type': 'ItemList',
    '@id': `${canonical}#itemlist`,
    itemListElement: visibleArticles.map((post, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${siteUrl}/blog/${post.id}`,
      name: post.title,
    })),
  };

  const collectionPage: Record<string, unknown> = {
    '@type': 'CollectionPage',
    '@id': `${canonical}#collection`,
    name: category.title,
    description: category.seoDescription || category.description,
    url: canonical,
    isPartOf: {
      '@type': 'Blog',
      '@id': `${siteUrl}/blog#blog`,
      name: 'Primewayz UK Insights',
      url: `${siteUrl}/blog`,
    },
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
    mainEntity: { '@id': `${canonical}#itemlist` },
  };

  const heroImage = category.heroImage || featured?.image || featured?.thumbnailImage;
  if (heroImage) {
    collectionPage.primaryImageOfPage = {
      '@type': 'ImageObject',
      url: toAbsoluteSiteUrl(heroImage),
      ...(category.heroImageAlt ? { caption: category.heroImageAlt } : {}),
    };
  }

  const graph: Record<string, unknown>[] = [
    collectionPage,
    { ...breadcrumb, '@id': `${canonical}#breadcrumb` },
    itemList,
  ];

  if (category.faq?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: category.faq.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function buildArticleStructuredData(post: BlogPost, canonical: string) {
  const primarySlug = getArticlePrimaryCategory(post);
  const primaryCategory = primarySlug ? getBlogCategoryBySlug(primarySlug) : undefined;
  const articleSection = getArticleCategoryDisplayName(post);
  const breadcrumbs = buildArticleBreadcrumbs(post, primaryCategory);
  const breadcrumb = buildBreadcrumbList(breadcrumbs, siteUrl);

  const article = {
    '@type': 'Article',
    '@id': `${canonical}#article`,
    headline: post.title,
    description: post.seoDescription || post.description || post.excerpt,
    image: [
      toAbsoluteSiteUrl(
        post.image || '/images/blog/primewayzuk-article-banner-placeholder.webp',
      ),
    ],
    datePublished: toIsoDate(post.date),
    dateModified: toIsoDate(post.updatedDate || post.date),
    author: { '@type': 'Organization', name: post.author || 'Primewayz UK Team' },
    publisher: {
      '@type': 'Organization',
      name: 'Primewayz UK',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/primewayz-uk-dark-logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    articleSection,
    keywords: post.tags.join(', '),
  };

  const graph: Record<string, unknown>[] = [
    article,
    { ...breadcrumb, '@id': `${canonical}#breadcrumb` },
  ];

  if (post.faqs?.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      mainEntity: post.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

function buildSeoTags(options: {
  title: string;
  description: string;
  canonical: string;
  ogType?: 'website' | 'article';
  image?: string;
  noindex?: boolean;
  structuredData: unknown;
}) {
  const image = toAbsoluteSiteUrl(options.image) || `${siteUrl}/og-primewayz-uk.jpg`;
  const robots = options.noindex
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large';

  const cleanImageUrl = image.split('?')[0].toLowerCase();
  const imageType = cleanImageUrl.endsWith('.png')
    ? 'image/png'
    : cleanImageUrl.endsWith('.webp')
      ? 'image/webp'
      : cleanImageUrl.endsWith('.gif')
        ? 'image/gif'
        : 'image/jpeg';

  return `
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeHtml(options.description)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${escapeHtml(options.canonical)}" />
    <meta property="og:type" content="${options.ogType || 'website'}" />
    <meta property="og:locale" content="en_GB" />
    <meta property="og:site_name" content="Primewayz UK" />
    <meta property="og:title" content="${escapeHtml(options.title)}" />
    <meta property="og:description" content="${escapeHtml(options.description)}" />
    <meta property="og:url" content="${escapeHtml(options.canonical)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
    <meta property="og:image:type" content="${imageType}" />
    <meta property="og:image:alt" content="${escapeHtml(options.title)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(options.title)}" />
    <meta name="twitter:description" content="${escapeHtml(options.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(options.title)}" />
    <script type="application/ld+json">${safeJson(options.structuredData)}</script>
  `;
}

function buildNoIndexSeoTags(options: { title: string; description: string }) {
  return `
    <title>${escapeHtml(options.title)}</title>
    <meta name="description" content="${escapeHtml(options.description)}" />
    <meta name="robots" content="noindex, nofollow" />
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

function normalizePagePathname(pathname: string): string {
  if (!pathname || pathname === '/') return '/';

  const withoutTrailingSlash = pathname.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

async function getInitialDataAndSeo(pathname: string): Promise<{
  initialData: Record<string, unknown>;
  seoTags: string;
  statusCode?: number;
}> {
  const pagePathname = normalizePagePathname(pathname);
  const canonical = `${siteUrl}${pagePathname === '/' ? '/' : pagePathname}`;

  const sharedReportMatch = pagePathname.match(/^\/web-presence-audit\/report\/([^/]+)$/);
  if (sharedReportMatch && isValidPublicToken(sharedReportMatch[1])) {
    return {
      initialData: {},
      seoTags: buildNoIndexSeoTags({
        title: 'Shared Web Presence Audit Report | Primewayz UK',
        description: 'Shared public-signal web presence audit overview from Primewayz UK.',
      }),
    };
  }

  if (pagePathname === '/blog') {
    const blogPosts = await getPublicBlogPosts();
    return {
      initialData: { blogPosts },
      seoTags: buildSeoTags({
        title: 'Primewayz UK Insights | Digital Support for UK SMEs',
        description: 'Practical guidance for UK SMEs on websites, SEO, CRM workflows, automation, AI readiness, maintenance, and ongoing digital delivery.',
        canonical,
        structuredData: {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          '@id': `${canonical}#blog`,
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

  const blogCategoryMatch = pagePathname.match(/^\/blog\/category\/([^/]+)$/);
  if (blogCategoryMatch) {
    const slug = decodeURIComponent(blogCategoryMatch[1]);
    const blogPosts = await getPublicBlogPosts();
    const blogCategory = getBlogCategoryBySlug(slug);

    if (!blogCategory || !isPublishableCategoryPage(slug, blogPosts)) {
      return {
        initialData: { blogCategory: null, blogPosts, notFound: true },
        statusCode: 404,
        seoTags: buildNoIndexSeoTags({
          title: 'Category Not Found | Primewayz UK',
          description: 'This blog category is not available on Primewayz UK.',
        }),
      };
    }

    const categoryCanonical = `${siteUrl}${blogCategory.canonicalPath}`;
    const { featured } = getCategoryPageArticles(blogCategory.slug, blogPosts);

    return {
      initialData: { blogCategory, blogPosts },
      seoTags: buildSeoTags({
        title: blogCategory.seoTitle,
        description: blogCategory.seoDescription,
        canonical: categoryCanonical,
        ogType: 'website',
        image: blogCategory.heroImage || featured?.image || featured?.thumbnailImage,
        structuredData: buildCategoryStructuredData(blogCategory, blogPosts, categoryCanonical),
      }),
    };
  }

  const blogMatch = pagePathname.match(/^\/blog\/([^/]+)$/);
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

    return {
      initialData: { blogPost: null, notFound: true },
      statusCode: 404,
      seoTags: buildNoIndexSeoTags({
        title: 'Article Not Found | Primewayz UK',
        description: 'This blog article is not available on Primewayz UK.',
      }),
    };
  }

  const successStoryMatch = pagePathname.match(/^\/success-stories\/([^/]+)$/);
  if (successStoryMatch) {
    let storySlug: string;
    try {
      storySlug = decodeURIComponent(successStoryMatch[1]);
    } catch {
      return {
        initialData: { successStory: null, notFound: true },
        statusCode: 404,
        seoTags: buildNoIndexSeoTags({
          title: 'Success Story Not Found | Primewayz UK',
          description: 'This success story is not available on Primewayz UK.',
        }),
      };
    }

    const story = getPublishedSuccessStoryBySlug(storySlug);

    if (!story) {
      return {
        initialData: { successStory: null, notFound: true },
        statusCode: 404,
        seoTags: buildNoIndexSeoTags({
          title: 'Success Story Not Found | Primewayz UK',
          description: 'This success story is not available on Primewayz UK.',
        }),
      };
    }

    return {
      initialData: { successStory: story },
      seoTags: buildSeoTags({
        title: story.seoTitle,
        description: story.seoDescription,
        canonical,
        ogType: 'article',
        image: story.ogImage,
        structuredData: buildSuccessStoryStructuredData(story, canonical),
      }),
    };
  }

  const staticPageSeo: Record<string, { title: string; description: string }> = {
    '/': {
      title: 'Digital Systems & Software Delivery for UK SMEs | Primewayz',
      description:
        'Primewayz helps UK SMEs improve website visibility, connect CRM workflows, build and modernise software, support applications and extend technical delivery capacity.',
    },
    '/services': {
      title: 'Software, CRM, Application Support & Digital Services | Primewayz UK',
      description:
        'Practical technical support across website visibility, CRM workflows, software engineering, managed application support and remote IT team extension for UK SMEs.',
    },
    '/software-development-subscription-uk': {
      title: SDAAS_SEO.title,
      description: SDAAS_SEO.description,
    },
    [SDAAS_PILLAR_PATH]: {
      title: `${SDAAS_PILLAR_SEO.title} | Primewayz UK`,
      description: SDAAS_PILLAR_SEO.description,
    },
    [SDAAS_COMPARISON_PATH]: {
      title: `${SDAAS_COMPARISON_SEO.title} | Primewayz UK`,
      description: SDAAS_COMPARISON_SEO.description,
    },
    [SDAAS_USE_CASES_PATH]: {
      title: `${SDAAS_USE_CASES_SEO.title} | Primewayz UK`,
      description: SDAAS_USE_CASES_SEO.description,
    },
    ...Object.fromEntries(
      SDAAS_SUPPORTING_ARTICLES.map((article) => [
        article.path,
        {
          title: `${article.seo.title} | Primewayz UK`,
          description: article.seo.description,
        },
      ]),
    ),
    '/software-development-subscription-uk/request-capacity': {
      title: 'Request Capacity Recommendation | Primewayz UK',
      description:
        'Request a recommended monthly software development capacity plan from Primewayz UK.',
    },
    '/website-maintenance-subscription-uk': {
      title: 'Managed Application & Website Support UK | Primewayz',
      description:
        'Maintain the reliability, security and performance of existing websites and applications through monitoring, fixes, updates and controlled ongoing improvements.',
    },
    '/crm-integration-support-uk': {
      title: 'CRM Integration & Workflow Automation for UK SMEs | Primewayz',
      description:
        'Connect website enquiries, CRM records, follow-up workflows and reporting so leads move through the business consistently.',
    },
    '/professional-services-crm-support-uk': {
      title: 'Professional Services CRM Support UK | Primewayz UK',
      description:
        'CRM integration, lead-flow cleanup, website enquiry tracking, follow-up workflows, and reporting support for UK professional services firms.',
    },
    '/success-stories': {
      title: 'Software & Digital Delivery Success Stories | Primewayz UK',
      description:
        'Explore how Primewayz has helped organisations improve software delivery, connect business systems, support critical applications and strengthen digital operations.',
    },
    '/uk-sme-digital-visibility-checker': {
      title: 'Free UK SME Website Visibility Checker | Primewayz UK',
      description:
        'Check if your UK SME website is clear, discoverable, trustworthy, and enquiry-ready with a free website visibility score from Primewayz UK.',
    },
    '/about-us': {
      title: 'About Primewayz UK | Digital Systems & Delivery Partner',
      description:
        'Primewayz is a digital systems and delivery partner for UK SMEs, helping businesses improve websites, CRM workflows, software applications and technical delivery.',
    },
    '/contact-us': {
      title: 'Contact Primewayz UK | Discuss Your Digital Priorities',
      description:
        'Contact Primewayz UK to discuss website visibility, CRM workflows, software delivery, managed support or remote technical capacity.',
    },
    '/website-visibility-support': {
      title: 'Website Visibility & Conversion Support for UK SMEs | Primewayz',
      description:
        'Primewayz helps UK SMEs identify and resolve the technical, content and conversion barriers that prevent websites from generating qualified enquiries.',
    },
    '/maintenance': {
      title: 'Managed Application & Website Support UK | Primewayz',
      description:
        'Maintain the reliability, security and performance of existing websites and applications through monitoring, fixes, updates and controlled ongoing improvements.',
    },
    '/crm-automation-support': {
      title: 'CRM Integration & Workflow Automation for UK SMEs | Primewayz',
      description:
        'Connect website enquiries, CRM records, follow-up workflows and reporting so leads move through the business consistently.',
    },
    '/software-product-delivery': {
      title: SDAAS_SEO.title,
      description: SDAAS_SEO.description,
    },
    '/remote-it-resources': {
      title: 'Remote IT Team Extension for UK Businesses | Primewayz',
      description:
        'Add dependable developers, QA professionals, analysts and technical specialists when your internal team needs additional delivery capacity.',
    },
    '/pricing': {
      title: 'Primewayz UK Pricing & Engagement Options',
      description:
        'Review Primewayz UK engagement options including Foundation Sprint, fixed-scope project, structured monthly delivery, Maintenance Mode and dedicated technical capacity.',
    },
  };

  const pageSeo = staticPageSeo[pagePathname] || staticPageSeo['/'];

  let structuredData: unknown = buildDefaultStructuredData(canonical, pageSeo.description);
  let ogType: 'website' | 'article' | undefined;
  let image: string | undefined;

  if (pagePathname === '/uk-sme-digital-visibility-checker') {
    structuredData = buildWebPresenceAuditStructuredData(canonical, pageSeo.description);
  } else if (pagePathname === '/software-development-subscription-uk') {
    structuredData = buildSdaasStructuredData(canonical, pageSeo.description);
  } else if (pagePathname === SDAAS_PILLAR_PATH) {
    structuredData = buildSdaasPillarStructuredData(canonical);
    ogType = 'article';
    image = SDAAS_PILLAR_OG_IMAGE;
  } else if (pagePathname === SDAAS_COMPARISON_PATH) {
    structuredData = buildSdaasComparisonStructuredData(canonical);
    ogType = 'article';
    image = SDAAS_COMPARISON_OG_IMAGE;
  } else if (pagePathname === SDAAS_USE_CASES_PATH) {
    structuredData = buildSdaasUseCasesStructuredData(canonical);
    ogType = 'article';
    image = SDAAS_USE_CASES_OG_IMAGE;
  } else if (getSdaasSupportingArticleByPath(pagePathname)) {
    const article = getSdaasSupportingArticleByPath(pagePathname)!;
    structuredData = buildSdaasSupportingArticleStructuredData(article, canonical);
    ogType = 'article';
    image = article.ogImage;
  }

  return {
    initialData: {},
    seoTags: buildSeoTags({
      title: pageSeo.title,
      description: pageSeo.description,
      canonical,
      ogType,
      image,
      noindex: pagePathname === '/software-development-subscription-uk/request-capacity',
      structuredData,
    }),
  };
}

type SsrRenderFn = (
  url: string,
  basePath: string,
  initialData: Record<string, unknown>,
) => { html: string };

async function sendSsrPage(req: Request, res: Response, indexHtml: string, render: SsrRenderFn) {
  const pathname = new URL(req.originalUrl, siteUrl).pathname;
  const { initialData, seoTags, statusCode = 200 } = await getInitialDataAndSeo(pathname);
  const { html: appHtml } = render(req.originalUrl, '/', initialData);
  const cleanAppHtml = stripExistingSeoTags(appHtml);
  const initialDataScript = `<script>window.__PRIMEWAYZ_INITIAL_DATA__=${safeJson(initialData)};</script>`;
  const headInjectedHtml = stripExistingSeoTags(indexHtml)
    .replace('</head>', `${seoTags}\n</head>`);

  // Keep SSR resilient to dev-template transforms by handling both the outlet comment
  // and full root container replacement.
  const htmlWithApp = headInjectedHtml
    .replace(/<!--\s*ssr-outlet\s*-->/i, cleanAppHtml)
    .replace(
      /<div id=["']root["']>\s*<\/div>/i,
      `<div id="root">${cleanAppHtml}</div>`,
    );

  const html = htmlWithApp.replace(
    '<script type="module"',
    `${initialDataScript}\n<script type="module"`,
  );

  return res.status(statusCode).set({ 'Content-Type': 'text/html' }).end(html);
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

app.get('/api/admin/tool-leads', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const leads = await prisma.toolLead.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(leads);
});

app.delete('/api/admin/tool-leads/:id', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid tool lead id' });
  await prisma.toolLead.delete({ where: { id } });
  res.json({ success: true });
});

app.get('/api/admin/audit-leads', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  try {
    const result = await listAdminAuditLeads(prisma, {
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      scoreBand: typeof req.query.scoreBand === 'string' ? req.query.scoreBand : undefined,
      reminderOptIn: typeof req.query.reminderOptIn === 'string' ? req.query.reminderOptIn : undefined,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
      offset: typeof req.query.offset === 'string' ? Number(req.query.offset) : undefined,
    });
    res.json(result);
  } catch (error) {
    console.error('[admin-audit-leads] list failed');
    res.status(500).json({ error: 'Failed to load audit leads' });
  }
});

app.get('/api/admin/audit-leads/:id', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid audit lead id' });

    const lead = await getAdminAuditLeadById(prisma, id);
    if (!lead) return res.status(404).json({ error: 'Audit lead not found' });

    res.json(lead);
  } catch (error) {
    console.error('[admin-audit-leads] detail failed');
    res.status(500).json({ error: 'Failed to load audit lead' });
  }
});

app.patch('/api/admin/audit-leads/:id/status', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid audit lead id' });

    const status = validateAuditLeadAdminStatus(req.body?.status);
    if (!status) return res.status(400).json({ error: 'Invalid status' });

    const lead = await updateAdminAuditLeadStatus(prisma, id, status);
    if (!lead) return res.status(404).json({ error: 'Audit lead not found' });

    res.json(lead);
  } catch (error) {
    console.error('[admin-audit-leads] status update failed');
    res.status(500).json({ error: 'Failed to update audit lead status' });
  }
});

app.post('/api/admin/audit-leads/:id/notes', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid audit lead id' });

    const lead = await addAdminAuditLeadNote(prisma, id, req.body?.note);
    if (!lead) return res.status(400).json({ error: 'Invalid note or audit lead not found' });

    res.json(lead);
  } catch (error) {
    console.error('[admin-audit-leads] note create failed');
    res.status(500).json({ error: 'Failed to add audit lead note' });
  }
});

app.get('/api/admin/chats', requireAdmin, requireRole(isOperationsRole), async (_req, res) => {
  const messages = await prisma.chatMessage.findMany({
    orderBy: { timestamp: 'desc' },
    include: {
      session: {
        select: {
          name: true,
          email: true,
          status: true,
          serviceInterest: true,
          firstLandingPage: true,
          currentPageUrl: true,
        },
      },
      ...chatMessageInclude,
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
        select: { text: true, timestamp: true, sender: true },
      },
    },
  });
  res.json(sessions);
});

app.patch('/api/admin/sessions/:sessionId/status', requireAdmin, requireRole(isOperationsRole), async (req: AdminRequest, res) => {
  const { sessionId } = req.params;
  const status = typeof req.body.status === 'string' ? req.body.status : '';
  if (!isValidConversationStatus(status)) {
    return res.status(400).json({ error: 'Invalid conversation status' });
  }

  const data: Record<string, unknown> = { status };
  if (status === 'closed' || status === 'spam') {
    data.closedAt = new Date();
    data.closedById = req.adminUser!.id;
  } else {
    data.closedAt = null;
    data.closedById = null;
  }

  const session = await prisma.chatSession.update({
    where: { id: sessionId },
    data,
  });
  res.json(session);
});

app.patch('/api/admin/chat/messages/:id', requireAdmin, requireRole(isOperationsRole), async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid message id' });

  const existing = await prisma.chatMessage.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  if (existing.sender !== 'admin') {
    return res.status(400).json({ error: 'Only admin messages can be edited' });
  }
  if (existing.deletedAt) return res.status(400).json({ error: 'Deleted messages cannot be edited' });

  const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'Message text is required' });

  const message = await prisma.chatMessage.update({
    where: { id },
    data: { text, editedAt: new Date() },
    include: chatMessageInclude,
  });
  res.json(message);
});

app.delete('/api/admin/chat/messages/:id', requireAdmin, requireRole(isOperationsRole), async (req: AdminRequest, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Invalid message id' });

  const existing = await prisma.chatMessage.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Message not found' });
  if (existing.sender !== 'admin') {
    return res.status(400).json({ error: 'Only admin messages can be deleted' });
  }

  const message = await prisma.chatMessage.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      deletedBy: req.adminUser!.id,
    },
    include: chatMessageInclude,
  });
  res.json(message);
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

registerAutopilotAdminRoutes({
  app,
  prisma,
  requireAdmin,
  requireRole,
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

app.post('/api/tools/digital-visibility-check', async (req, res) => {
  try {
    const { websiteUrl, businessType, location } = req.body;
    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return res.status(400).json({ error: 'websiteUrl is required' });
    }

    const result = await runDigitalVisibilityCheck({
      websiteUrl,
      businessType: typeof businessType === 'string' ? businessType : undefined,
      location: typeof location === 'string' ? location : undefined,
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not check this website.';
    const status = message.includes('cannot be checked') || message.includes('valid website') ? 400 : 502;
    console.error('Digital visibility check error:', err);
    res.status(status).json({ error: message });
  }
});

app.post('/api/tools/web-presence-audit', async (req, res) => {
  try {
    const report = await runWebPresenceAudit(req.body);
    res.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The web presence audit could not be completed.';
    const status = error instanceof AuditInputError ? 400 : 500;
    console.error('Web presence audit error:', error);
    res.status(status).json({ error: message });
  }
});

app.post('/api/tools/web-presence-audit/share', async (req, res) => {
  try {
    const { report } = req.body;
    if (!report || typeof report !== 'object') {
      return res.status(400).json({ error: 'A valid audit report is required.' });
    }

    const result = await createSharedReport(report, siteUrl);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create a shareable report.';
    const status = message.includes('required') ? 400 : 500;
    console.error('Web presence audit share error:', error);
    res.status(status).json({ error: message });
  }
});

app.get('/api/tools/web-presence-audit/report/:publicToken', async (req, res) => {
  try {
    const { publicToken } = req.params;
    if (!isValidPublicToken(publicToken)) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const record = await getSharedReport(publicToken);
    if (!record) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({
      publicToken: record.publicToken,
      createdAt: record.createdAt,
      report: record.report,
    });
  } catch (error) {
    console.error('Web presence audit shared report error:', error);
    res.status(500).json({ error: 'Could not load this shared report.' });
  }
});

app.post('/api/tools/web-presence-audit/email-report', async (req, res) => {
  try {
    const result = await emailAuditReport(prisma, req.body, siteUrl);
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof EmailReportValidationError
      ? error.message
      : 'Could not save your report request.';
    const status = error instanceof EmailReportValidationError ? 400 : 500;
    if (!(error instanceof EmailReportValidationError)) {
      console.error('[audit-lead] email-report request failed');
    }
    res.status(status).json({ error: message });
  }
});

app.post('/api/tools/digital-visibility-check/lead', async (req, res) => {
  try {
    const { name, email, phone, message, websiteUrl, score, businessType, location } = req.body;
    if (!name || !email || !websiteUrl) {
      return res.status(400).json({ error: 'Name, email, and website URL are required' });
    }

    const lead = await prisma.toolLead.create({
      data: {
        source: 'Digital Visibility Checker',
        websiteUrl: String(websiteUrl),
        score: typeof score === 'number' ? score : Number(score) || null,
        businessType: businessType ? String(businessType) : null,
        location: location ? String(location) : null,
        name: String(name),
        email: String(email),
        phone: phone ? String(phone) : null,
        message: message ? String(message) : null,
      },
    });

    res.status(201).json({ success: true, lead });
  } catch (err) {
    console.error('Digital visibility lead error:', err);
    res.status(500).json({ error: 'Could not save your request' });
  }
});

app.get('/api/chat/availability', async (_req, res) => {
  res.json(await getChatAvailabilityPayload());
});

app.post('/api/chat/session', async (req, res) => {
  const { sessionId, name, email } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const sourceData = buildSessionSourceData(req.body);
    const session = await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: {
        name: name || undefined,
        email: email || undefined,
        currentPageUrl: sourceData.currentPageUrl,
        referrer: sourceData.referrer,
        utmSource: sourceData.utmSource,
        utmMedium: sourceData.utmMedium,
        utmCampaign: sourceData.utmCampaign,
        utmContent: sourceData.utmContent,
        deviceType: sourceData.deviceType,
        browser: sourceData.browser,
        serviceInterest: sourceData.serviceInterest,
        firstLandingPage: sourceData.firstLandingPage,
      },
      create: {
        id: sessionId,
        name: name || null,
        email: email || null,
        status: 'new',
        ...sourceData,
      },
    });

    return res.json(session);
  } catch (err) {
    if (!isDatabaseUnavailableError(err)) throw err;
    logChatDbFallback('Chat session unavailable', err);
    return res.json(offlineChatSessionStub(sessionId, { name: name || null, email: email || null }));
  }
});

app.post('/api/chat/heartbeat', async (req, res) => {
  const { sessionId, userName, userEmail } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
    const sourceData = buildSessionSourceData(req.body);
    const session = await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: {
        visitorLastSeenAt: new Date(),
        name: userName || undefined,
        email: userEmail || undefined,
        currentPageUrl: sourceData.currentPageUrl,
        referrer: sourceData.referrer,
        utmSource: sourceData.utmSource,
        utmMedium: sourceData.utmMedium,
        utmCampaign: sourceData.utmCampaign,
        utmContent: sourceData.utmContent,
        deviceType: sourceData.deviceType,
        browser: sourceData.browser,
        serviceInterest: sourceData.serviceInterest,
        firstLandingPage: sourceData.firstLandingPage,
      },
      create: {
        id: sessionId,
        name: userName || null,
        email: userEmail || null,
        visitorLastSeenAt: new Date(),
        status: 'new',
        ...sourceData,
      },
    });

    return res.json(session);
  } catch (err) {
    if (!isDatabaseUnavailableError(err)) throw err;
    logChatDbFallback('Chat heartbeat unavailable', err);
    return res.json(
      offlineChatSessionStub(sessionId, {
        name: userName || null,
        email: userEmail || null,
        visitorLastSeenAt: new Date().toISOString(),
      }),
    );
  }
});

app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { timestamp: 'asc' },
      include: chatMessageInclude,
    });
    return res.json(
      messages
        .map((message) => formatVisitorMessage(message))
        .filter(Boolean),
    );
  } catch (err) {
    if (!isDatabaseUnavailableError(err)) throw err;
    logChatDbFallback('Chat messages unavailable', err);
    return res.json([]);
  }
});

app.post('/api/chat', async (req: AdminRequest, res) => {
  const { sessionId, sender, text, replyToId, attachmentIds, isInternalNote } = req.body;
  if (!sessionId || !sender) return res.status(400).json({ error: 'sessionId and sender are required' });

  try {
    const wantsInternalNote = Boolean(isInternalNote);
    let adminUser: { id: number } | null = null;
    if (wantsInternalNote || sender === 'admin') {
      adminUser = await getAdminUserFromRequest(req);
      if (wantsInternalNote && !adminUser) {
        return res.status(401).json({ error: 'Admin authentication required for internal notes' });
      }
    }

    await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: {},
      create: { id: sessionId, status: 'new' },
    });

    const message = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender,
        text: text || 'Shared an attachment',
        answered: sender === 'admin' || sender === 'bot',
        isInternalNote: wantsInternalNote,
        replyToId: replyToId || null,
        attachments: Array.isArray(attachmentIds)
          ? { connect: attachmentIds.map((id: number) => ({ id })) }
          : undefined,
      },
      include: chatMessageInclude,
    });

    if (sender === 'admin' && !wantsInternalNote) {
      await prisma.chatMessage.updateMany({
        where: { sessionId, sender: 'user', answered: false },
        data: { answered: true },
      });
      await autoUpdateConversationStatus(sessionId, 'admin_replied');
    }

    return res.status(201).json(message);
  } catch (err) {
    if (!isDatabaseUnavailableError(err)) throw err;
    logChatDbFallback('Chat message create unavailable', err);
    return res.status(503).json({ error: 'Chat is temporarily unavailable', unavailable: true });
  }
});

app.post('/api/chat/respond', async (req, res) => {
  const { sessionId, message, userName, attachmentIds, replyToId } = req.body;
  if (!sessionId || !message) return res.status(400).json({ error: 'sessionId and message are required' });

  try {
    await prisma.chatSession.upsert({
      where: { id: sessionId },
      update: { name: userName || undefined, visitorLastSeenAt: new Date() },
      create: { id: sessionId, name: userName || null, visitorLastSeenAt: new Date(), status: 'new' },
    });

    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'user',
        text: message,
        answered: false,
        replyToId: replyToId || null,
        attachments: Array.isArray(attachmentIds)
          ? { connect: attachmentIds.map((id: number) => ({ id })) }
          : undefined,
      },
      include: chatMessageInclude,
    });

    await autoUpdateConversationStatus(sessionId, 'admin_needed');

    const botMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        sender: 'bot',
        text: OFFLINE_CHAT_BOT_REPLY,
        answered: true,
        replyToId: userMessage.id,
      },
      include: chatMessageInclude,
    });

    await autoUpdateConversationStatus(sessionId, 'bot_replied');

    return res.json({
      userMessage: formatVisitorMessage(userMessage),
      botMessage: formatVisitorMessage(botMessage),
      availability: await getChatAvailabilityPayload(),
    });
  } catch (err) {
    if (!isDatabaseUnavailableError(err)) throw err;
    logChatDbFallback('Chat respond unavailable', err);
    return res.json(await offlineChatRespondPayload(String(message)));
  }
});

app.post('/api/chat/uploads', (_req, res) => {
  res.status(501).json({ error: 'Chat uploads are not configured on this server yet.' });
});

app.post('/api/chat/appointments', async (req, res) => {
  const { sessionId, name, email, phone, preferredDate, preferredTime, timezone, message } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'sessionId is required' });

  try {
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

    await autoUpdateConversationStatus(sessionId, 'booked_call');

    return res.status(201).json(appointment);
  } catch (err) {
    if (!isDatabaseUnavailableError(err)) throw err;
    logChatDbFallback('Chat appointment unavailable', err);
    return res.status(503).json({ error: 'Chat booking is temporarily unavailable', unavailable: true });
  }
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
  try {
    const comments = await prisma.blogPostComment.findMany({
      where: { postId: req.params.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(comments);
  } catch (err) {
    console.warn('[local-safe] Blog comments unavailable:', err instanceof Error ? err.message : err);
    res.json([]);
  }
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

// Bing Webmaster Tools XML verification â€” must run before static files and SSR catch-all.
const BING_SITE_AUTH_XML = `<?xml version="1.0"?>
<users>
\t<user>503A5E857E52D99A468198CE6BD47F45</user>
</users>
`;

function serveBingSiteAuth(_req: Request, res: Response) {
  res
    .status(200)
    .type('application/xml')
    .set('Cache-Control', 'public, max-age=3600')
    .send(BING_SITE_AUTH_XML);
}

app.get('/BingSiteAuth.xml', serveBingSiteAuth);

// IndexNow key verification â€” must run before static files and SSR catch-all.
const INDEXNOW_KEY = 'b477408d1a358457fb3b6d0b8e032ee3';

app.get(`/${INDEXNOW_KEY}.txt`, (_req: Request, res: Response) => {
  res
    .status(200)
    .type('text/plain')
    .set('Cache-Control', 'public, max-age=3600')
    .send(INDEXNOW_KEY);
});

// Legacy marketing URLs → canonical routes (before static files and SPA catch-all).
for (const [fromPath, toPath] of Object.entries(LEGACY_ROUTE_REDIRECTS)) {
  app.get([fromPath, `${fromPath}/`], (req, res) => {
    const queryIndex = req.originalUrl.indexOf('?');
    const search = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : '';
    res.redirect(301, `${toPath}${search}`);
  });
}

/**
 * Legacy `/insights/:slug` → `/blog/:slug` (or explicit mapped slug) when a published
 * blog article exists. Live SDaaS educational pages under `/insights/*` are not redirected.
 * Unknown non-SDaaS insights slugs return 404 without React SSR HTML.
 */
app.get(['/insights/:slug', '/insights/:slug/'], async (req, res, next) => {
  const slugParam = typeof req.params.slug === 'string' ? req.params.slug : '';
  const normalizedSlug = normalizeInsightsPathname(`/insights/${slugParam}`) || slugParam.replace(/\/+$/, '');

  if (!normalizedSlug) {
    return next();
  }

  try {
    const publishedPosts = await getPublicBlogPosts();
    const publishedSlugs = new Set(publishedPosts.flatMap((post) => [post.id, post.slug]));
    const destination = resolveInsightsToBlogRedirect(normalizedSlug, { publishedSlugs });

    if (destination) {
      const location = buildRedirectLocation(destination, req.originalUrl);
      return res.redirect(301, location);
    }

    if (isLiveInsightsSlug(normalizedSlug)) {
      return next();
    }

    return res
      .status(404)
      .type('html')
      .set('Cache-Control', 'no-store')
      .send(`<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Insight Not Found | Primewayz UK</title>
</head>
<body>
  <p>This insight page is not available.</p>
  <p><a href="/blog">Browse Primewayz UK insights</a></p>
</body>
</html>`);
  } catch (error) {
    console.error('Insights redirect handling failed:', error);
    return next();
  }
});

// --- Agent discovery headers ---
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.append('Link', '</.well-known/api-catalog>; rel="api-catalog"');
    res.append('Link', '</openapi.json>; rel="service-desc"; type="application/vnd.oai.openapi+json"');
    res.append('Link', '</docs/api.md>; rel="service-doc"; type="text/markdown"');
    res.append('Link', '</api/health>; rel="status"; type="application/json"');
    res.append('Link', '</llms.txt>; rel="llms"');
    res.append('Link', '</auth.md>; rel="agent-auth"');
    res.append('Link', '</.well-known/agent-skills/index.json>; rel="agent-skills"');
    res.append('Link', '</.well-known/mcp/server-card.json>; rel="mcp-server-card"');
  }
  next();
});

app.get('/api/health', (_req, res) => {
  res
    .status(200)
    .type('application/json')
    .set('Cache-Control', 'public, max-age=300')
    .json({
      status: 'ok',
      service: 'primewayz-uk',
      publicApi: true,
      timestamp: new Date().toISOString(),
    });
});

app.get('/.well-known/api-catalog', (_req, res) => {
  res
    .status(200)
    .type('application/linkset+json')
    .set('Cache-Control', 'public, max-age=3600')
    .json({
      linkset: [
        {
          anchor: 'https://uk.primewayz.com/api/blog/posts',
          'service-desc': [
            {
              href: 'https://uk.primewayz.com/openapi.json',
              type: 'application/vnd.oai.openapi+json'
            }
          ],
          'service-doc': [
            {
              href: 'https://uk.primewayz.com/docs/api.md',
              type: 'text/markdown'
            }
          ],
          status: [
            {
              href: 'https://uk.primewayz.com/api/health',
              type: 'application/json'
            }
          ]
        },
        {
          anchor: 'https://uk.primewayz.com/api/tools/web-presence-audit/report/{publicToken}',
          'service-desc': [
            {
              href: 'https://uk.primewayz.com/openapi.json',
              type: 'application/vnd.oai.openapi+json'
            }
          ],
          'service-doc': [
            {
              href: 'https://uk.primewayz.com/docs/api.md',
              type: 'text/markdown'
            }
          ],
          status: [
            {
              href: 'https://uk.primewayz.com/api/health',
              type: 'application/json'
            }
          ]
        }
      ]
    });
});

const SDAAS_SUPPORTING_ARTICLE_MARKDOWN_LINKS = SDAAS_SUPPORTING_ARTICLES.map(
  (article) => `- [${article.seo.title}](https://uk.primewayz.com${article.path})`,
).join('\n');

const MARKDOWN_PUBLIC_ROUTES: Record<string, string> = {
  '/': `# Primewayz UK

Primewayz UK helps UK SMEs, founders, consultants, and service businesses improve digital visibility, website performance, CRM workflows, automation, software delivery, and monthly digital support.

## Key resources

- [Services](https://uk.primewayz.com/services)
- [Website visibility support](https://uk.primewayz.com/website-visibility-support)
- [CRM automation support](https://uk.primewayz.com/crm-automation-support)
- [Software Development as a Subscription](https://uk.primewayz.com/software-development-subscription-uk)
- [Subscription-Based Software Development Guide](https://uk.primewayz.com/insights/subscription-based-software-development)
- [Software Development Subscription vs Fixed-Price](https://uk.primewayz.com/insights/software-development-subscription-vs-fixed-price)
- [Software Development Subscription Use Cases](https://uk.primewayz.com/insights/software-development-subscription-use-cases)
${SDAAS_SUPPORTING_ARTICLE_MARKDOWN_LINKS}
- [Website maintenance and monthly support](https://uk.primewayz.com/maintenance)
- [Free website audit](https://uk.primewayz.com/uk-sme-digital-visibility-checker)
- [Blog insights](https://uk.primewayz.com/blog)
- [Contact Primewayz UK](https://uk.primewayz.com/contact-us)
`,
  '/services': `# Primewayz UK Services

Primewayz UK provides website visibility support, CRM automation support, software product delivery, remote IT resources, and monthly website maintenance support for UK SMEs.

## Key services

- [Website visibility support](https://uk.primewayz.com/website-visibility-support)
- [CRM automation support](https://uk.primewayz.com/crm-automation-support)
- [Software Development as a Subscription](https://uk.primewayz.com/software-development-subscription-uk)
- [Remote IT resources](https://uk.primewayz.com/remote-it-resources)
- [Monthly website support](https://uk.primewayz.com/maintenance)

## Software development insights

- [Subscription-Based Software Development Guide](https://uk.primewayz.com/insights/subscription-based-software-development)
- [Software Development Subscription vs Fixed-Price](https://uk.primewayz.com/insights/software-development-subscription-vs-fixed-price)
- [Software Development Subscription Use Cases](https://uk.primewayz.com/insights/software-development-subscription-use-cases)
${SDAAS_SUPPORTING_ARTICLE_MARKDOWN_LINKS}
`,
  '/blog': `# Primewayz UK Insights

Practical guidance for UK SMEs and SaaS founders on monthly digital support, CRM automation, website maintenance, technical SEO, AEO, GEO, and digital visibility.

## Start here

- [Subscription-Based Software Development Guide](https://uk.primewayz.com/insights/subscription-based-software-development)
- [Software Development Subscription vs Fixed-Price](https://uk.primewayz.com/insights/software-development-subscription-vs-fixed-price)
- [Software Development Subscription Use Cases](https://uk.primewayz.com/insights/software-development-subscription-use-cases)
${SDAAS_SUPPORTING_ARTICLE_MARKDOWN_LINKS}
- [Fixed Price vs Time & Material vs Subscription Support](https://uk.primewayz.com/blog/fixed-price-vs-time-material-vs-subscription-support-uk-smes-saas-founders)
- [Monthly Digital Support for UK SMEs](https://uk.primewayz.com/blog/monthly-digital-support-uk-smes)
- [Foundation Sprint Before Monthly Delivery](https://uk.primewayz.com/blog/foundation-sprint-before-monthly-delivery)
`
};

app.get(['/', '/services', '/blog'], (req, res, next) => {
  const wantsMarkdown = req.accepts(['html', 'text/markdown']) === 'text/markdown'
    || String(req.headers.accept || '').includes('text/markdown');

  if (!wantsMarkdown) {
    return next();
  }

  const markdown = MARKDOWN_PUBLIC_ROUTES[req.path];
  if (!markdown) {
    return next();
  }

  res
    .status(200)
    .type('text/markdown')
    .set('Cache-Control', 'public, max-age=300')
    .send(markdown);
});

// --- Static files ---
if (isProd) {
  app.use(
    '/assets',
    express.static(path.join(__dirname, 'dist/client/assets'), {
      index: false,
      immutable: true,
      maxAge: '1y',
    }),
  );

  app.use(
    express.static(path.join(__dirname, 'dist/client'), {
      index: false,
      maxAge: '1h',
    }),
  );
}

app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '7d',
  }),
);

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

function isDatabaseCapacityError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const normalised = message.toLowerCase();
  return (
    normalised.includes('too many connections')
    || normalised.includes('er_con_count_error')
    || normalised.includes('connection limit')
    || normalised.includes('remaining connection slots are reserved')
  );
}

function logBackgroundJobError(taskName: string, error: unknown) {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error ?? 'Unknown error');
  const capacity = isDatabaseCapacityError(error);
  console.warn(
    `[${timestamp}] [background-job:${taskName}] ${capacity ? 'database_capacity_error' : 'error'}: ${message}`,
  );
}

function createNonOverlappingInterval(
  taskName: string,
  intervalMs: number,
  task: () => Promise<void>,
) {
  let running = false;
  let lastCapacityLogAt = 0;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      await task();
    } catch (error) {
      const now = Date.now();
      const capacity = isDatabaseCapacityError(error);
      // Avoid rapid retries and duplicate capacity logs on every tick.
      if (!capacity || now - lastCapacityLogAt > Math.max(intervalMs, 5 * 60 * 1000)) {
        logBackgroundJobError(taskName, error);
        if (capacity) lastCapacityLogAt = now;
      }
    } finally {
      running = false;
    }
  };

  return setInterval(() => {
    void run();
  }, intervalMs);
}

async function findUnansweredChatMessages() {
  return prisma.chatMessage.findMany({ where: { answered: false } });
}

/*
  Daily lead-summary note:
  Historically this interval checked every 60s whether a UK-timezone date/time gate
  had passed before sending one summary email per day. The send implementation is
  currently stubbed in this codebase; the 60s cadence is preserved intentionally
  so restoring the date/time guard later does not change schedule behaviour.
*/
async function runDailyLeadSummaryCheck() {
  // No-op stub preserved for schedule compatibility.
}

createNonOverlappingInterval(
  'findUnansweredChatMessages',
  5 * 60 * 1000,
  async () => {
    await findUnansweredChatMessages();
  },
);

createNonOverlappingInterval(
  'dailyLeadSummary',
  60 * 1000,
  async () => {
    await runDailyLeadSummaryCheck();
  },
);

let prismaShutdownStarted = false;
async function disconnectPrismaOnShutdown(signal: string) {
  if (prismaShutdownStarted) return;
  prismaShutdownStarted = true;
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [shutdown:${signal}] disconnecting Prisma client`);
  try {
    await prisma.$disconnect();
  } catch (error) {
    logBackgroundJobError('prismaShutdown', error);
  } finally {
    process.exit(0);
  }
}

process.once('SIGINT', () => {
  void disconnectPrismaOnShutdown('SIGINT');
});
process.once('SIGTERM', () => {
  void disconnectPrismaOnShutdown('SIGTERM');
});

// -------------------------
// SSR / Dev catch-all
// -------------------------
async function createServer() {
  if (!isProd) {
    // In dev: use Vite as middleware â€” handles HMR, TS/JSX transforms automatically
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });

    app.get('*', async (req, res) => {
      const pathname = new URL(req.originalUrl, siteUrl).pathname;
      const isAssetRequest = /\.[a-z0-9]+$/i.test(pathname);
      const isViteRuntimeRequest = pathname.startsWith('/@vite')
        || pathname.startsWith('/@react-refresh')
        || pathname.startsWith('/__vite_ping')
        || pathname.startsWith('/src/');

      if (isAssetRequest || isViteRuntimeRequest) {
        return vite.middlewares(req, res, () => undefined);
      }

      try {
        let html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        const { render } = await vite.ssrLoadModule('/src/entry-server.tsx');
        await sendSsrPage(req, res, html, render as SsrRenderFn);
      } catch (err: any) {
        vite.ssrFixStacktrace(err);
        console.error('Dev SSR render error:', err);
        res.status(500).send(err.message);
      }
    });

    app.use(vite.middlewares);
  } else {
    // In production: full SSR
    const { render } = await import('./dist/server/entry-server.js');

    app.get('*', async (req, res) => {
      try {
        const indexHtml = await fs.readFile(path.join(__dirname, 'dist/client/index.html'), 'utf-8');
        await sendSsrPage(req, res, indexHtml, render as SsrRenderFn);
      } catch (err: any) {
        console.error('SSR render error:', err);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  seedAdmin();
  await ensureReportStoreReady();
  await ensureLeadStoreReady();

  const port = parseInt(process.env.PORT || '3000');
  app.listen(port, () => {
    console.log(`[${isProd ? 'production' : 'dev'}] Server running at http://localhost:${port}`);
  });
}

createServer();


