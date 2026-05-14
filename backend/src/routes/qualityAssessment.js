import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all quality assessments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM quality_assessments qa JOIN products p ON qa.product_id = p.id WHERE p.user_id = $1`,
      [req.user.id]
    );
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT qa.*, p.name as product_name, p.category
       FROM quality_assessments qa
       JOIN products p ON qa.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY qa.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get quality assessments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single quality assessment
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT qa.*, p.name as product_name, p.category, p.description as product_description
       FROM quality_assessments qa
       JOIN products p ON qa.product_id = p.id
       WHERE qa.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quality assessment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get quality assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create quality assessment with AI
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, image_description } = req.body;

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

    // Get AI quality assessment
    const aiAnalysis = await openRouterService.assessImageQuality(
      image_description || `${product.name} - ${product.description} - Category: ${product.category}`
    );

    const overallScore = aiAnalysis.data?.overallScore || 0;

    const result = await pool.query(
      `INSERT INTO quality_assessments (product_id, image_path, ai_analysis, overall_score)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product_id, product.original_image, JSON.stringify(aiAnalysis), overallScore]
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create quality assessment error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete quality assessment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM quality_assessments qa
       USING products p
       WHERE qa.id = $1 AND qa.product_id = p.id AND p.user_id = $2
       RETURNING qa.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Quality assessment not found' });
    }

    res.json({ message: 'Quality assessment deleted successfully' });
  } catch (error) {
    console.error('Delete quality assessment error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-assess quality with AI
router.post('/:id/assess', authenticateToken, async (req, res) => {
  try {
    const { image_description } = req.body;

    const existing = await pool.query(
      `SELECT qa.*, p.name, p.description, p.category
       FROM quality_assessments qa
       JOIN products p ON qa.product_id = p.id
       WHERE qa.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Quality assessment not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.assessImageQuality(
      image_description || `${record.name} - ${record.description} - Category: ${record.category}`
    );

    const overallScore = aiAnalysis.data?.overallScore || 0;

    await pool.query(
      `UPDATE quality_assessments SET ai_analysis = $1, overall_score = $2 WHERE id = $3`,
      [JSON.stringify(aiAnalysis), overallScore, req.params.id]
    );

    res.json({
      ...record,
      ai_analysis: aiAnalysis,
      overall_score: overallScore
    });
  } catch (error) {
    console.error('Re-assess error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;
