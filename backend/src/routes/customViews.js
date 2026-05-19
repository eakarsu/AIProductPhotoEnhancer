// Custom Views routes for AIProductPhotoEnhancer
// Provides endpoints supporting 4 frontend views:
//   - Before/After Slider (sample image pairs)
//   - Enhancement Quality Gauge (sharpness/color/lighting scores)
//   - Bulk Image Upload (multer multi-file)
//   - Enhancement Preset Editor (CRUD)

import { Router } from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// ---- Multer setup -----------------------------------------------------------
const uploadDir = join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9._-]/gi, '_');
    cb(null, `bulk_${Date.now()}_${Math.round(Math.random() * 1e6)}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 20 },
});

// ---- DB bootstrap -----------------------------------------------------------
async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS custom_views_presets (
        id SERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        sharpness INTEGER DEFAULT 50,
        brightness INTEGER DEFAULT 50,
        contrast INTEGER DEFAULT 50,
        saturation INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM custom_views_presets`);
    if (rows[0]?.n === 0) {
      await pool.query(
        `INSERT INTO custom_views_presets (name, sharpness, brightness, contrast, saturation)
         VALUES
           ('Studio Bright',  70, 65, 60, 55),
           ('Vivid Pop',      60, 55, 70, 85),
           ('Natural Soft',   45, 50, 45, 50)`
      );
    }
  } catch (e) {
    console.warn('customViews ensureTables:', e.message);
  }
}
ensureTables();

// ---- 1) Before/After sample pairs ------------------------------------------
router.get('/before-after', (_req, res) => {
  const pairs = [
    {
      id: 'pair1',
      title: 'Headphones — Studio Cleanup',
      before: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&q=70',
      after:  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=900&q=70',
      improvement: 0.34,
    },
    {
      id: 'pair2',
      title: 'Sneaker — Color & Contrast',
      before: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=70',
      after:  'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=900&q=70',
      improvement: 0.28,
    },
    {
      id: 'pair3',
      title: 'Watch — Sharpness + Lighting',
      before: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900&q=70',
      after:  'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=900&q=70',
      improvement: 0.41,
    },
  ];
  res.json({ ok: true, pairs });
});

// ---- 2) Quality gauge breakdown --------------------------------------------
router.get('/quality-gauge', (_req, res) => {
  // Deterministic-looking demo metrics for the RadialBar gauge
  const sharpness = 86;
  const color     = 78;
  const lighting  = 91;
  const overall   = Math.round((sharpness + color + lighting) / 3);
  res.json({
    ok: true,
    overall,
    breakdown: [
      { name: 'Sharpness', value: sharpness, fill: '#38bdf8' },
      { name: 'Color',     value: color,     fill: '#a78bfa' },
      { name: 'Lighting',  value: lighting,  fill: '#fbbf24' },
    ],
  });
});

// ---- 3) Bulk image upload --------------------------------------------------
router.post('/bulk-upload', authenticateToken, upload.array('images', 20), (req, res) => {
  const files = (req.files || []).map((f) => ({
    name: f.originalname,
    stored: f.filename,
    size: f.size,
    mimetype: f.mimetype,
    url: `/uploads/${f.filename}`,
    status: 'queued',
  }));
  res.json({
    ok: true,
    count: files.length,
    queue: files.map((f) => ({ name: f.name, status: 'queued', etaSec: Math.ceil(f.size / 200000) })),
    files,
  });
});

// ---- 4) Preset CRUD --------------------------------------------------------
router.get('/presets', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, sharpness, brightness, contrast, saturation, created_at, updated_at
       FROM custom_views_presets ORDER BY id ASC`
    );
    res.json({ ok: true, presets: rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/presets', async (req, res) => {
  try {
    const { name, sharpness = 50, brightness = 50, contrast = 50, saturation = 50 } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ ok: false, error: 'name required' });
    }
    const { rows } = await pool.query(
      `INSERT INTO custom_views_presets (name, sharpness, brightness, contrast, saturation)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [String(name).trim(), +sharpness, +brightness, +contrast, +saturation]
    );
    res.json({ ok: true, preset: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/presets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name, sharpness, brightness, contrast, saturation } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE custom_views_presets
       SET name        = COALESCE($2, name),
           sharpness   = COALESCE($3, sharpness),
           brightness  = COALESCE($4, brightness),
           contrast    = COALESCE($5, contrast),
           saturation  = COALESCE($6, saturation),
           updated_at  = NOW()
       WHERE id = $1 RETURNING *`,
      [id, name ?? null, sharpness ?? null, brightness ?? null, contrast ?? null, saturation ?? null]
    );
    if (!rows[0]) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, preset: rows[0] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.delete('/presets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rowCount } = await pool.query(`DELETE FROM custom_views_presets WHERE id = $1`, [id]);
    if (!rowCount) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, id });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
