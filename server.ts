import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getAllBlogPosts, getBlogPostById } from './src/data/blog/utils.ts';

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
      { id: user.id, email: user.email, role: user.role },
      getJwtSecret(),
      { expiresIn: '8h' },
    );

    res.cookie(adminCookieName, token, getCookieOptions());
    return res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/admin/check-auth', async (req, res) => {
  try {
    const token = req.cookies?.[adminCookieName];
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });

    const decoded = jwt.verify(token, getJwtSecret()) as { id?: number; email?: string; role?: string };
    if (!decoded.email) return res.status(401).json({ success: false, error: 'Invalid session' });

    const user = await prisma.user.findUnique({ where: { email: decoded.email } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid session' });

    return res.json({
      success: true,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid session' });
  }
});

app.post('/api/admin/logout', (_req, res) => {
  res.clearCookie(adminCookieName, getClearCookieOptions());
  return res.json({ success: true });
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
