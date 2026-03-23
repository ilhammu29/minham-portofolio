import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Prisma, PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || '';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || '';
const ADMIN_JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES || '12h';
const UPLOAD_DIR = process.env.UPLOAD_DIR || '/app/data/uploads/portfolio';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ext && ext.length <= 8 ? ext : '.bin';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 }
});

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));
app.use('/uploads/portfolio', express.static(UPLOAD_DIR));

const optionalUrl = z
  .union([z.string().url().max(220), z.literal(''), z.null(), z.undefined()])
  .transform((value) => (value ? value : null));

const adminLoginSchema = z.object({
  username: z.string().min(3).max(80),
  password: z.string().min(8).max(120)
});

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  message: z.string().min(10).max(1200)
});

const profileSchema = z.object({
  fullName: z.string().min(2).max(120),
  role: z.string().min(2).max(120),
  bio: z.string().min(20).max(600),
  location: z.string().min(2).max(120),
  email: z.string().email().max(160),
  website: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl
});

const projectSchema = z.object({
  slug: z.string().min(2).max(120).optional(),
  title: z.string().min(3).max(140),
  description: z.string().min(20).max(700),
  longDescription: z.string().max(3000).optional().nullable(),
  problem: z.string().max(2000).optional().nullable(),
  solution: z.string().max(2000).optional().nullable(),
  architecture: z.string().max(2000).optional().nullable(),
  impact: z.string().max(2000).optional().nullable(),
  stack: z.string().min(3).max(250),
  repoUrl: optionalUrl,
  liveUrl: optionalUrl,
  coverImageUrl: optionalUrl,
  videoUrl: optionalUrl,
  highlight: z.boolean().default(false)
});

const experienceSchema = z.object({
  company: z.string().min(2).max(140),
  role: z.string().min(2).max(140),
  startDate: z.string().min(2).max(30),
  endDate: z.string().min(2).max(30),
  summary: z.string().min(20).max(600)
});

const projectMediaSchema = z.object({
  projectId: z.number().int().positive(),
  type: z.enum(['image', 'video']).default('image'),
  url: z.string().url().max(220),
  caption: z.union([z.string().max(220), z.literal(''), z.null(), z.undefined()]).transform((value) => (value ? value : null)),
  sortOrder: z.number().int().min(0).default(0)
});

const contentItemSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(800),
  sortOrder: z.number().int().min(0).default(0)
});

const processStepSchema = z.object({
  stepNo: z.string().min(1).max(20),
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(800),
  sortOrder: z.number().int().min(0).default(0)
});

const trackEventSchema = z.object({
  path: z.string().min(1).max(220),
  event: z.string().min(2).max(120),
  metadata: z.union([z.string().max(1500), z.null(), z.undefined()]).transform((value) => (value ? value : null))
});

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isFinite(id) || id < 1) {
    throw new Error('ID tidak valid');
  }
  return id;
}

function ensureAuthConfig() {
  return Boolean(ADMIN_USERNAME && (ADMIN_PASSWORD_HASH || ADMIN_PASSWORD) && ADMIN_JWT_SECRET);
}

function requireAdmin(req, res, next) {
  if (!ensureAuthConfig()) {
    return res.status(503).json({ message: 'Konfigurasi admin auth belum lengkap di server' });
  }

  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET);
    req.admin = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token tidak valid atau expired' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'minham-portfolio-api' });
});

app.get('/api/profile', async (_req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { id: 1 } });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

app.get('/api/projects', async (_req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: [{ highlight: 'desc' }, { createdAt: 'desc' }]
    });
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

app.get('/api/projects/:slug', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { slug: req.params.slug },
      include: {
        media: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project tidak ditemukan' });
    }

    return res.json(project);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/experiences', async (_req, res, next) => {
  try {
    const experiences = await prisma.experience.findMany({
      orderBy: { createdAt: 'asc' }
    });
    res.json(experiences);
  } catch (error) {
    next(error);
  }
});

app.get('/api/about-highlights', async (_req, res, next) => {
  try {
    const items = await prisma.aboutHighlight.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.get('/api/services', async (_req, res, next) => {
  try {
    const items = await prisma.serviceItem.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.get('/api/process-steps', async (_req, res, next) => {
  try {
    const items = await prisma.processStep.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }]
    });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

app.post('/api/contact', async (req, res, next) => {
  try {
    const payload = contactSchema.parse(req.body);
    const message = await prisma.contactMessage.create({ data: payload });
    res.status(201).json({
      id: message.id,
      message: 'Pesan berhasil dikirim. Terima kasih!'
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/track', async (req, res, next) => {
  try {
    const payload = trackEventSchema.parse(req.body);
    await prisma.pageEvent.create({ data: payload });
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/login', async (req, res, next) => {
  try {
    if (!ensureAuthConfig()) {
      return res.status(503).json({ message: 'Konfigurasi admin auth belum lengkap di server' });
    }

    const payload = adminLoginSchema.parse(req.body);
    const usernameMatch = payload.username === ADMIN_USERNAME;
    const passwordMatch = ADMIN_PASSWORD_HASH
      ? await bcrypt.compare(payload.password, ADMIN_PASSWORD_HASH)
      : payload.password === ADMIN_PASSWORD;

    if (!usernameMatch || !passwordMatch) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const token = jwt.sign({ role: 'admin', username: ADMIN_USERNAME }, ADMIN_JWT_SECRET, {
      expiresIn: ADMIN_JWT_EXPIRES
    });

    return res.json({ token, expiresIn: ADMIN_JWT_EXPIRES });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/admin/session', requireAdmin, (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/admin/uploads', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'File wajib diupload' });
  }

  const publicUrl = `/uploads/portfolio/${req.file.filename}`;
  return res.status(201).json({
    filename: req.file.filename,
    url: publicUrl,
    size: req.file.size,
    mimetype: req.file.mimetype
  });
});

app.get('/api/admin/analytics/summary', requireAdmin, async (_req, res, next) => {
  try {
    const [pageviews, contactSends, detailClicks, liveClicks, sourceClicks] = await Promise.all([
      prisma.pageEvent.count({ where: { event: 'pageview' } }),
      prisma.pageEvent.count({ where: { event: 'contact_submit' } }),
      prisma.pageEvent.count({ where: { event: 'project_detail_open' } }),
      prisma.pageEvent.count({ where: { event: 'project_live_click' } }),
      prisma.pageEvent.count({ where: { event: 'project_source_click' } })
    ]);

    res.json({
      pageviews,
      contactSends,
      detailClicks,
      liveClicks,
      sourceClicks
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/analytics/timeseries', requireAdmin, async (req, res, next) => {
  try {
    const daysRaw = Number.parseInt(String(req.query.days || '14'), 10);
    const days = Number.isFinite(daysRaw) && daysRaw > 0 && daysRaw <= 90 ? daysRaw : 14;

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        DATE(createdAt) AS day,
        SUM(CASE WHEN event = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
        SUM(CASE WHEN event = 'contact_submit' THEN 1 ELSE 0 END) AS contacts,
        SUM(CASE WHEN event = 'project_detail_open' THEN 1 ELSE 0 END) AS detailClicks,
        SUM(CASE WHEN event = 'project_live_click' THEN 1 ELSE 0 END) AS liveClicks,
        SUM(CASE WHEN event = 'project_source_click' THEN 1 ELSE 0 END) AS sourceClicks
      FROM PageEvent
      WHERE createdAt >= datetime('now', ?)
      GROUP BY DATE(createdAt)
      ORDER BY day ASC
      `,
      `-${days} day`
    );

    res.json({
      days,
      rows
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/admin/messages', requireAdmin, async (_req, res, next) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/messages/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await prisma.contactMessage.delete({ where: { id } });
    res.json({ message: 'Pesan dihapus' });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/profile', requireAdmin, async (req, res, next) => {
  try {
    const payload = profileSchema.parse(req.body);
    const profile = await prisma.profile.upsert({
      where: { id: 1 },
      update: payload,
      create: { id: 1, ...payload }
    });
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/projects', requireAdmin, async (req, res, next) => {
  try {
    const payload = projectSchema.parse(req.body);
    const slug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
    const project = await prisma.project.create({
      data: {
        ...payload,
        slug
      }
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/projects/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const payload = projectSchema.parse(req.body);
    const current = await prisma.project.findUnique({ where: { id } });

    if (!current) {
      return res.status(404).json({ message: 'Project tidak ditemukan' });
    }

    const slug = payload.slug ? slugify(payload.slug) : current.slug;
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...payload,
        slug
      }
    });

    return res.json(project);
  } catch (error) {
    return next(error);
  }
});

app.delete('/api/admin/projects/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Project dihapus' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/project-media', requireAdmin, async (req, res, next) => {
  try {
    const payload = projectMediaSchema.parse(req.body);
    const media = await prisma.projectMedia.create({ data: payload });
    res.status(201).json(media);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/project-media/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const payload = projectMediaSchema.partial({ projectId: true }).parse(req.body);
    const media = await prisma.projectMedia.update({
      where: { id },
      data: payload
    });
    res.json(media);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/project-media/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await prisma.projectMedia.delete({ where: { id } });
    res.json({ message: 'Media project dihapus' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/experiences', requireAdmin, async (req, res, next) => {
  try {
    const payload = experienceSchema.parse(req.body);
    const experience = await prisma.experience.create({ data: payload });
    res.status(201).json(experience);
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/about-highlights', requireAdmin, async (req, res, next) => {
  try {
    const payload = contentItemSchema.parse(req.body);
    const item = await prisma.aboutHighlight.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/about-highlights/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const payload = contentItemSchema.parse(req.body);
    const item = await prisma.aboutHighlight.update({
      where: { id },
      data: payload
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/about-highlights/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await prisma.aboutHighlight.delete({ where: { id } });
    res.json({ message: 'Highlight dihapus' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/services', requireAdmin, async (req, res, next) => {
  try {
    const payload = contentItemSchema.parse(req.body);
    const item = await prisma.serviceItem.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/services/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const payload = contentItemSchema.parse(req.body);
    const item = await prisma.serviceItem.update({
      where: { id },
      data: payload
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/services/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await prisma.serviceItem.delete({ where: { id } });
    res.json({ message: 'Service dihapus' });
  } catch (error) {
    next(error);
  }
});

app.post('/api/admin/process-steps', requireAdmin, async (req, res, next) => {
  try {
    const payload = processStepSchema.parse(req.body);
    const item = await prisma.processStep.create({ data: payload });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/process-steps/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const payload = processStepSchema.parse(req.body);
    const item = await prisma.processStep.update({
      where: { id },
      data: payload
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/process-steps/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await prisma.processStep.delete({ where: { id } });
    res.json({ message: 'Step dihapus' });
  } catch (error) {
    next(error);
  }
});

app.put('/api/admin/experiences/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    const payload = experienceSchema.parse(req.body);
    const experience = await prisma.experience.update({
      where: { id },
      data: payload
    });
    res.json(experience);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/admin/experiences/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = parseId(req.params.id);
    await prisma.experience.delete({ where: { id } });
    res.json({ message: 'Pengalaman dihapus' });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validasi gagal',
      details: error.issues.map((item) => ({
        field: item.path.join('.'),
        message: item.message
      }))
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Data unik sudah digunakan (slug/url). Silakan ubah nilai.' });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Data tidak ditemukan' });
    }
  }

  if (error instanceof Error && error.message === 'ID tidak valid') {
    return res.status(400).json({ message: 'ID tidak valid' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
});

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
