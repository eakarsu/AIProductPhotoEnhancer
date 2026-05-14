import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimit.js';
import openRouterService from '../services/openrouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

const router = express.Router();

async function persistAIResult(userId, endpoint, productId, result, resultJson) {
  try {
    await pool.query(
      `INSERT INTO ai_results (user_id, endpoint, product_id, result, result_json, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [userId || null, endpoint, productId || null, result, resultJson ? JSON.stringify(resultJson) : null]
    );
  } catch (e) { console.error('Failed to persist AI result:', e.message); }
}

async function loadImageAsBase64(imagePath) {
  const fullPath = imagePath.startsWith('/uploads/')
    ? path.join(UPLOADS_DIR, imagePath.replace('/uploads/', ''))
    : imagePath.startsWith('/')
      ? imagePath
      : path.join(UPLOADS_DIR, imagePath);
  const buf = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
  return { base64: buf.toString('base64'), mimeType: mimeMap[ext] || 'image/jpeg' };
}

// POST /api/photos/:id/analyze - real vision AI analysis
router.post('/:id/analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (productResult.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product = productResult.rows[0];
    if (!product.original_image) return res.status(400).json({ error: 'Product has no image' });

    const { base64, mimeType } = await loadImageAsBase64(product.original_image);

    const systemPrompt = `You are an expert product photography analyst specializing in e-commerce optimization. Analyze the image and return ONLY valid JSON:
{
  "detected_products": ["product1", "product2"],
  "background_quality": "string",
  "lighting_assessment": "string",
  "composition_score": 75,
  "enhancement_suggestions": ["suggestion1", "suggestion2"],
  "detected_colors": ["#hex1", "#hex2"],
  "ecommerce_readiness_score": 80,
  "product_visibility": "string",
  "professional_grade": true,
  "issues": ["issue1"],
  "strengths": ["strength1"]
}`;

    const result = await openRouterService.makeVisionRequest(
      base64, mimeType, systemPrompt,
      `Analyze this product image for e-commerce use. Product: ${product.name}, Category: ${product.category || 'Unknown'}`
    );

    await persistAIResult(req.user.id, 'photo-analyze', product.id, result.rawResponse, result.data);
    res.json({ product_id: product.id, product_name: product.name, analysis: result.data, model: result.model });
  } catch (err) {
    console.error('Photo analyze error:', err);
    res.status(500).json({ error: 'Vision analysis failed', details: err.message });
  }
});

// POST /api/photos/:id/background-analysis - background type detection + removal recommendations
router.post('/:id/background-analysis', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const pr = await pool.query('SELECT * FROM products WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (pr.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product = pr.rows[0];
    if (!product.original_image) return res.status(400).json({ error: 'No image' });

    const { base64, mimeType } = await loadImageAsBase64(product.original_image);

    const systemPrompt = `You are a background removal and replacement expert for e-commerce photography. Return ONLY valid JSON:
{
  "background_type": "solid_white|gradient|textured|lifestyle|outdoor|studio|cluttered",
  "background_color": "#hexcolor or description",
  "removal_difficulty": "easy|medium|hard",
  "removal_method": "string",
  "suggested_backgrounds": [
    {"name": "string", "description": "string", "use_case": "string"}
  ],
  "removal_tips": ["tip1", "tip2"],
  "edge_complexity": "simple|moderate|complex",
  "estimated_quality_after": 85
}`;

    const result = await openRouterService.makeVisionRequest(
      base64, mimeType, systemPrompt,
      `Analyze the background in this product image for removal and replacement recommendations. Product: ${product.name}`
    );

    await persistAIResult(req.user.id, 'background-analysis', product.id, result.rawResponse, result.data);
    res.json({ product_id: product.id, analysis: result.data });
  } catch (err) {
    console.error('Background analysis error:', err);
    res.status(500).json({ error: 'Background analysis failed', details: err.message });
  }
});

// POST /api/photos/:id/generate-alt-text - SEO alt text generator
router.post('/:id/generate-alt-text', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const pr = await pool.query('SELECT * FROM products WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (pr.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product = pr.rows[0];
    if (!product.original_image) return res.status(400).json({ error: 'No image' });

    const { base64, mimeType } = await loadImageAsBase64(product.original_image);

    const systemPrompt = `You are an SEO expert specializing in e-commerce product image optimization. Return ONLY valid JSON:
{
  "alt_texts": [
    {"text": "string", "seo_score": 90, "keywords": ["kw1", "kw2"], "use_case": "primary|social|accessibility"},
    {"text": "string", "seo_score": 85, "keywords": ["kw1"], "use_case": "primary"},
    {"text": "string", "seo_score": 80, "keywords": ["kw1"], "use_case": "accessibility"}
  ],
  "primary_keywords": ["kw1", "kw2"],
  "product_descriptors": ["descriptor1", "descriptor2"],
  "seo_tips": ["tip1", "tip2"]
}`;

    const result = await openRouterService.makeVisionRequest(
      base64, mimeType, systemPrompt,
      `Generate 3-5 SEO-optimized alt text variants for this product image. Product: ${product.name}, Category: ${product.category || 'Unknown'}`
    );

    await persistAIResult(req.user.id, 'generate-alt-text', product.id, result.rawResponse, result.data);
    res.json({ product_id: product.id, product_name: product.name, alt_text_data: result.data });
  } catch (err) {
    console.error('Alt text error:', err);
    res.status(500).json({ error: 'Alt text generation failed', details: err.message });
  }
});

// POST /api/photos/batch-analyze - batch vision analysis
router.post('/batch-analyze', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { product_ids } = req.body;
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: 'product_ids array required' });
    }
    if (product_ids.length > 10) return res.status(400).json({ error: 'Max 10 products per batch' });

    const results = [];
    for (const pid of product_ids) {
      try {
        const pr = await pool.query('SELECT * FROM products WHERE id = $1 AND user_id = $2', [pid, req.user.id]);
        if (pr.rows.length === 0) { results.push({ product_id: pid, error: 'Not found' }); continue; }
        const product = pr.rows[0];
        if (!product.original_image) { results.push({ product_id: pid, product_name: product.name, error: 'No image' }); continue; }

        const { base64, mimeType } = await loadImageAsBase64(product.original_image);
        const systemPrompt = `Analyze this product image for e-commerce and return ONLY JSON: {"quality_score": 80, "ecommerce_ready": true, "main_issues": ["issue"], "top_improvement": "string", "detected_product": "string"}`;
        const result = await openRouterService.makeVisionRequest(base64, mimeType, systemPrompt, `Quick analysis: ${product.name}`);
        await persistAIResult(req.user.id, 'batch-analyze', product.id, result.rawResponse, result.data);
        results.push({ product_id: pid, product_name: product.name, analysis: result.data });
      } catch (err) {
        results.push({ product_id: pid, error: err.message });
      }
    }
    res.json({ batch_results: results, total: results.length });
  } catch (err) {
    console.error('Batch analyze error:', err);
    res.status(500).json({ error: 'Batch analysis failed', details: err.message });
  }
});

// POST /api/photos/:id/generate-description - product description from photo
router.post('/:id/generate-description', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const pr = await pool.query('SELECT * FROM products WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (pr.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const product = pr.rows[0];
    if (!product.original_image) return res.status(400).json({ error: 'No image' });

    const { base64, mimeType } = await loadImageAsBase64(product.original_image);

    const systemPrompt = `You are an expert e-commerce copywriter. Analyze the actual product image and generate compelling descriptions. Return ONLY valid JSON:
{
  "short_description": "1-2 sentence description",
  "long_description": "3-4 paragraph detailed description",
  "key_features": ["feature1", "feature2", "feature3"],
  "visual_attributes": ["color", "material", "style"],
  "target_audience": "string",
  "use_cases": ["use1", "use2"],
  "seo_keywords": ["kw1", "kw2"],
  "headline": "attention-grabbing headline",
  "tagline": "memorable tagline",
  "call_to_action": "compelling CTA"
}`;

    const result = await openRouterService.makeVisionRequest(
      base64, mimeType, systemPrompt,
      `Generate e-commerce product description based on visual analysis. Product name: ${product.name}, Category: ${product.category || 'Unknown'}`
    );

    await persistAIResult(req.user.id, 'generate-description', product.id, result.rawResponse, result.data);

    // Optionally save to product_descriptions table
    if (result.data && result.data.short_description) {
      try {
        await pool.query(
          `INSERT INTO product_descriptions (product_id, ai_analysis, short_description, long_description, seo_keywords)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, JSON.stringify(result.data), result.data.short_description, result.data.long_description, JSON.stringify(result.data.seo_keywords || [])]
        );
      } catch (dbErr) { console.error('Failed to save description:', dbErr.message); }
    }

    res.json({ product_id: product.id, product_name: product.name, description: result.data });
  } catch (err) {
    console.error('Description generation error:', err);
    res.status(500).json({ error: 'Description generation failed', details: err.message });
  }
});

// GET /api/photos/ai-results - paginated AI results
router.get('/ai-results', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const countRes = await pool.query('SELECT COUNT(*) FROM ai_results WHERE user_id = $1', [req.user.id]);
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await pool.query(
      `SELECT id, endpoint, product_id, LEFT(result, 200) as result_preview, result_json, created_at
       FROM ai_results WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({ data: dataRes.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('AI results error:', err);
    res.status(500).json({ error: 'Failed to fetch AI results' });
  }
});

export default router;
