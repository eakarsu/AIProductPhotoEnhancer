import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all size recommendations
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM size_recommendations sr JOIN products p ON sr.product_id = p.id WHERE p.user_id = $1`, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT sr.*, p.name as product_name, p.category
       FROM size_recommendations sr
       JOIN products p ON sr.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY sr.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get size recommendations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single size recommendation
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, p.name as product_name, p.category, p.description as product_description
       FROM size_recommendations sr
       JOIN products p ON sr.product_id = p.id
       WHERE sr.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Size recommendation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get size recommendation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create size recommendation with AI analysis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, customer_measurements } = req.body;

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
    const aiAnalysis = await openRouterService.recommendSize(
      `${product.name} - ${product.description}`,
      customer_measurements || {},
      product.category
    );

    const recommendedSize = aiAnalysis.data?.recommendedSize || 'M';
    const confidenceScore = aiAnalysis.data?.confidenceScore || 75;

    const result = await pool.query(
      `INSERT INTO size_recommendations (product_id, customer_measurements, ai_analysis, recommended_size, confidence_score, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_id, JSON.stringify(customer_measurements || {}), JSON.stringify(aiAnalysis), recommendedSize, confidenceScore, 'completed']
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create size recommendation error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update size recommendation
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, customer_measurements } = req.body;

    const result = await pool.query(
      `UPDATE size_recommendations sr
       SET status = COALESCE($1, sr.status),
           customer_measurements = COALESCE($2, sr.customer_measurements),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE sr.id = $3 AND sr.product_id = p.id AND p.user_id = $4
       RETURNING sr.*`,
      [status, JSON.stringify(customer_measurements), req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Size recommendation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update size recommendation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete size recommendation
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM size_recommendations sr
       USING products p
       WHERE sr.id = $1 AND sr.product_id = p.id AND p.user_id = $2
       RETURNING sr.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Size recommendation not found' });
    }

    res.json({ message: 'Size recommendation deleted successfully' });
  } catch (error) {
    console.error('Delete size recommendation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { customer_measurements } = req.body;

    const existing = await pool.query(
      `SELECT sr.*, p.name, p.description, p.category
       FROM size_recommendations sr
       JOIN products p ON sr.product_id = p.id
       WHERE sr.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Size recommendation not found' });
    }

    const record = existing.rows[0];
    const measurements = customer_measurements || (typeof record.customer_measurements === 'string' ? JSON.parse(record.customer_measurements) : record.customer_measurements);

    const aiAnalysis = await openRouterService.recommendSize(
      `${record.name} - ${record.description}`,
      measurements,
      record.category
    );

    const recommendedSize = aiAnalysis.data?.recommendedSize || record.recommended_size;
    const confidenceScore = aiAnalysis.data?.confidenceScore || record.confidence_score;

    await pool.query(
      `UPDATE size_recommendations SET ai_analysis = $1, recommended_size = $2, confidence_score = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [JSON.stringify(aiAnalysis), recommendedSize, confidenceScore, req.params.id]
    );

    res.json({
      ...record,
      ai_analysis: aiAnalysis,
      recommended_size: recommendedSize,
      confidence_score: confidenceScore
    });
  } catch (error) {
    console.error('Re-analyze error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;
