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
import nodemailer from 'nodemailer';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './src/App'; // named export

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
  res.json(allBlogPosts);
});

app.get('/api/blog/posts/:id', (req, res) => {
  const post = getBlogPostById(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// Production SSR route
app.get('*', async (req, res) => {
  try {
    const indexHtml = await fs.readFile(path.join(__dirname, 'dist/client/index.html'), 'utf-8');

    const appHtml = renderToString(
      createElement(
        MemoryRouter,
        { initialEntries: [req.originalUrl] },
        createElement(App),
      )
    );

    const html = indexHtml.replace('<!--app-html-->', appHtml);

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (err: any) {
    console.error('SSR render error:', err);
    res.status(500).send('Internal Server Error');
  }
});

const port = parseInt(process.env.PORT || '3000');
app.listen(port, () => {
  console.log(`Primewayz UK SSR server running at http://localhost:${port}`);
});
