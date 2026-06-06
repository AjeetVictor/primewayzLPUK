import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { getAllBlogPosts, getBlogPostById } from './src/data/blog/utils.ts';
import type { BlogPost } from './src/data/blog/types.ts';
import { homepageSeoContent } from './src/content/homepageSeoContent.ts';
import { sanitizeBlogHtml } from './src/utils/sanitizeHtml.ts';
import { App } from './src/App';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';

dotenv.config({ override: true });

const app = express();
const prisma = new PrismaClient();
const __dirname = path.resolve();

const allBlogPosts = getAllBlogPosts();
const BLOG_STATUSES = ['draft', 'submitted', 'published', 'unpublished', 'archived'] as const;

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static client assets
app.use('/assets', express.static(path.join(__dirname, 'dist/client/assets')));
app.use('/favicon.ico', express.static(path.join(__dirname, 'dist/client/favicon.ico')));

// Blog APIs
app.get('/api/blog/posts', (req, res) => {
  const publishedPosts = allBlogPosts.filter(p => p.status === 'published');
  res.json(publishedPosts);
});

app.get('/api/blog/posts/:id', (req, res) => {
  const post = getBlogPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// -------------------------
// Local-safe Prisma wrappers
// -------------------------

async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;

  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: process.env.ADMIN_EMAIL }
    });

    if (!adminExists) {
      await prisma.user.create({
        data: {
          email: process.env.ADMIN_EMAIL,
          password: process.env.ADMIN_PASSWORD,
          role: 'ADMIN'
        }
      });
    }
  } catch (e) {
    console.warn('[local-safe] Skipping admin seed: DB not available', e.message);
  }
}

async function getChatPresenceSetting() {
  try {
    const model = (prisma as any).chatPresenceSetting;
    let setting = await model.findFirst();
    return setting;
  } catch (e) {
    console.warn('[local-safe] Skipping chat presence fetch: DB not available', e.message);
    return null;
  }
}

async function findUnansweredChatMessages() {
  try {
    return await prisma.chatMessage.findMany({
      where: { answered: false }
    });
  } catch (e) {
    console.warn('[local-safe] Skipping unanswered chat messages: DB not available', e.message);
    return [];
  }
}

// -------------------------
// Schedule background jobs
// -------------------------
setInterval(async () => {
  const messages = await findUnansweredChatMessages();
  // handle messages...
}, 5 * 60 * 1000);

setInterval(async () => {
  // daily lead summary job
}, 60 * 1000);

// -------------------------
// Production SSR route
// -------------------------
app.get('*', async (req, res) => {
  try {
    const indexHtml = await fs.readFile(path.join(__dirname, 'dist/client/index.html'), 'utf-8');

    const appHtml = renderToString(
      createElement(
        MemoryRouter,
        { initialEntries: [req.originalUrl] },
        createElement(App)
      )
    );

    const html = indexHtml.replace('<!--ssr-outlet-->', appHtml);

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (err: any) {
    console.error('SSR render error:', err);
    res.status(500).send('Internal Server Error');
  }
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`[local-safe] SSR server running at http://localhost:${port}`);
});