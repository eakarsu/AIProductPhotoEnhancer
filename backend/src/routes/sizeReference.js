import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all size references
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM size_references sr JOIN products p ON sr.product_id = p.id WHERE p.user_id = $1`, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT sr.*, p.name as product_name, p.category
       FROM size_references sr
       JOIN products p ON sr.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY sr.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get size references error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single size reference
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, p.name as product_name, p.category, p.description as product_description
       FROM size_references sr
       JOIN products p ON sr.product_id = p.id
       WHERE sr.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Size reference not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get size reference error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create size reference with AI analysis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, reference_object, dimensions } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Verify product belongs to user
    const productCheck = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND user_id = $2',
      [product_id, req.user.id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productCheck.rows[0];

    // Get AI analysis
    const aiAnalysis = await openRouterService.analyzeSizeReference(
      `${product.name} - ${product.description}`,
      reference_object
    );

    const aiDimensions = aiAnalysis.data?.productDimensions || aiAnalysis.data?.dimensions || dimensions || {};

    const result = await pool.query(
      `INSERT INTO size_references (product_id, image_path, reference_object, ai_analysis, dimensions, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_id, product.original_image, reference_object, JSON.stringify(aiAnalysis), JSON.stringify(aiDimensions), 'completed']
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create size reference error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update size reference
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, reference_object, dimensions } = req.body;

    const result = await pool.query(
      `UPDATE size_references sr
       SET status = COALESCE($1, sr.status),
           reference_object = COALESCE($2, sr.reference_object),
           dimensions = COALESCE($3, sr.dimensions),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE sr.id = $4 AND sr.product_id = p.id AND p.user_id = $5
       RETURNING sr.*`,
      [status, reference_object, JSON.stringify(dimensions), req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Size reference not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update size reference error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete size reference
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM size_references sr
       USING products p
       WHERE sr.id = $1 AND sr.product_id = p.id AND p.user_id = $2
       RETURNING sr.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Size reference not found' });
    }

    res.json({ message: 'Size reference deleted successfully' });
  } catch (error) {
    console.error('Delete size reference error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { reference_object } = req.body;

    const existing = await pool.query(
      `SELECT sr.*, p.name, p.description, p.category
       FROM size_references sr
       JOIN products p ON sr.product_id = p.id
       WHERE sr.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Size reference not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.analyzeSizeReference(
      `${record.name} - ${record.description}`,
      reference_object || record.reference_object
    );

    const aiDimensions = aiAnalysis.data?.productDimensions || aiAnalysis.data?.dimensions || {};

    await pool.query(
      `UPDATE size_references SET ai_analysis = $1, dimensions = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [JSON.stringify(aiAnalysis), JSON.stringify(aiDimensions), req.params.id]
    );

    res.json({
      ...record,
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Re-analyze error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;
