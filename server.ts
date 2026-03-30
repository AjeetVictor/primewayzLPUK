import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { blogPosts } from './src/data/blogPosts.ts';
import { extraBlogPosts } from './src/data/extraBlogPosts.ts';

const allBlogPosts = [...blogPosts, ...extraBlogPosts];

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'your-secret-min-32-chars';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

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
    console.log('Default admin user seeded');
  }
}

async function startServer() {
  await seedAdmin();
  
  const app = express();
  const PORT = 3000;

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
          secure: true, // Required for SameSite=None in iframe
          sameSite: 'none',
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

  // Contact Form Submission
  app.post('/api/contact', async (req, res) => {
    const { email, name, message } = req.body;
    try {
      const response = await prisma.formResponse.create({
        data: { name, email, message }
      });
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
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR to prevent WebSocket connection errors in AI Studio
      },
      appType: 'spa',
      base: '/pwlpageuk'
    });
    app.use('/pwlpageuk', vite.middlewares);
    
    // Redirect root to /pwlpageuk for convenience
    app.get('/', (req, res) => res.redirect('/pwlpageuk'));
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use('/pwlpageuk', express.static(distPath));
    app.get('/pwlpageuk/*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    
    // Redirect root to /pwlpageuk for convenience
    app.get('/', (req, res) => res.redirect('/pwlpageuk'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
