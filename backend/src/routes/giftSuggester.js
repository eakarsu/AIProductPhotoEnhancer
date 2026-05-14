import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all gift suggestions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM gift_suggestions gs JOIN products p ON gs.product_id = p.id WHERE p.user_id = $1`, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT gs.*, p.name as product_name, p.category
       FROM gift_suggestions gs
       JOIN products p ON gs.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY gs.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get gift suggestions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single gift suggestion
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT gs.*, p.name as product_name, p.category, p.description as product_description, p.price
       FROM gift_suggestions gs
       JOIN products p ON gs.product_id = p.id
       WHERE gs.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift suggestion not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get gift suggestion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create gift suggestion with AI analysis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, recipient_profile, occasion, budget_range } = req.body;

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
    const aiAnalysis = await openRouterService.suggestGift(
      `${product.name} - ${product.description}. Price: $${product.price || 'N/A'}`,
      recipient_profile || {},
      occasion || 'General',
      budget_range || 'Not specified'
    );

    const matchScore = aiAnalysis.data?.matchScore || 70;

    const result = await pool.query(
      `INSERT INTO gift_suggestions (product_id, recipient_profile, occasion, budget_range, ai_analysis, match_score, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [product_id, JSON.stringify(recipient_profile || {}), occasion, budget_range, JSON.stringify(aiAnalysis), matchScore, 'completed']
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create gift suggestion error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update gift suggestion
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, recipient_profile, occasion, budget_range } = req.body;

    const result = await pool.query(
      `UPDATE gift_suggestions gs
       SET status = COALESCE($1, gs.status),
           recipient_profile = COALESCE($2, gs.recipient_profile),
           occasion = COALESCE($3, gs.occasion),
           budget_range = COALESCE($4, gs.budget_range),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE gs.id = $5 AND gs.product_id = p.id AND p.user_id = $6
       RETURNING gs.*`,
      [status, JSON.stringify(recipient_profile), occasion, budget_range, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift suggestion not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update gift suggestion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete gift suggestion
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM gift_suggestions gs
       USING products p
       WHERE gs.id = $1 AND gs.product_id = p.id AND p.user_id = $2
       RETURNING gs.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Gift suggestion not found' });
    }

    res.json({ message: 'Gift suggestion deleted successfully' });
  } catch (error) {
    console.error('Delete gift suggestion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { recipient_profile, occasion, budget_range } = req.body;

    const existing = await pool.query(
      `SELECT gs.*, p.name, p.description, p.category, p.price
       FROM gift_suggestions gs
       JOIN products p ON gs.product_id = p.id
       WHERE gs.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Gift suggestion not found' });
    }

    const record = existing.rows[0];
    const profile = recipient_profile || (typeof record.recipient_profile === 'string' ? JSON.parse(record.recipient_profile) : record.recipient_profile);

    const aiAnalysis = await openRouterService.suggestGift(
      `${record.name} - ${record.description}. Price: $${record.price || 'N/A'}`,
      profile,
      occasion || record.occasion,
      budget_range || record.budget_range
    );

    await pool.query(
      `UPDATE gift_suggestions SET ai_analysis = $1, match_score = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [JSON.stringify(aiAnalysis), aiAnalysis.data?.matchScore || 70, req.params.id]
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
