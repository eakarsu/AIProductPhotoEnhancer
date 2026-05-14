import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all return predictions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM return_predictions rp JOIN products p ON rp.product_id = p.id WHERE p.user_id = $1`, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT rp.*, p.name as product_name, p.category
       FROM return_predictions rp
       JOIN products p ON rp.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY rp.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get return predictions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single return prediction
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rp.*, p.name as product_name, p.category, p.description as product_description, p.price
       FROM return_predictions rp
       JOIN products p ON rp.product_id = p.id
       WHERE rp.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Return prediction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get return prediction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create return prediction with AI analysis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, customer_history } = req.body;

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
    const aiAnalysis = await openRouterService.predictReturn(
      `${product.name} - ${product.description}. Price: $${product.price || 'N/A'}`,
      customer_history || {},
      product.category
    );

    const returnProbability = aiAnalysis.data?.returnProbability || 25;
    const riskFactors = aiAnalysis.data?.riskFactors || [];

    const result = await pool.query(
      `INSERT INTO return_predictions (product_id, customer_history, ai_analysis, return_probability, risk_factors, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_id, JSON.stringify(customer_history || {}), JSON.stringify(aiAnalysis), returnProbability, JSON.stringify(riskFactors), 'completed']
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create return prediction error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update return prediction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, customer_history } = req.body;

    const result = await pool.query(
      `UPDATE return_predictions rp
       SET status = COALESCE($1, rp.status),
           customer_history = COALESCE($2, rp.customer_history),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE rp.id = $3 AND rp.product_id = p.id AND p.user_id = $4
       RETURNING rp.*`,
      [status, JSON.stringify(customer_history), req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Return prediction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update return prediction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete return prediction
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM return_predictions rp
       USING products p
       WHERE rp.id = $1 AND rp.product_id = p.id AND p.user_id = $2
       RETURNING rp.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Return prediction not found' });
    }

    res.json({ message: 'Return prediction deleted successfully' });
  } catch (error) {
    console.error('Delete return prediction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { customer_history } = req.body;

    const existing = await pool.query(
      `SELECT rp.*, p.name, p.description, p.category, p.price
       FROM return_predictions rp
       JOIN products p ON rp.product_id = p.id
       WHERE rp.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Return prediction not found' });
    }

    const record = existing.rows[0];
    const history = customer_history || (typeof record.customer_history === 'string' ? JSON.parse(record.customer_history) : record.customer_history);

    const aiAnalysis = await openRouterService.predictReturn(
      `${record.name} - ${record.description}. Price: $${record.price || 'N/A'}`,
      history,
      record.category
    );

    await pool.query(
      `UPDATE return_predictions SET ai_analysis = $1, return_probability = $2, risk_factors = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [JSON.stringify(aiAnalysis), aiAnalysis.data?.returnProbability || 25, JSON.stringify(aiAnalysis.data?.riskFactors || []), req.params.id]
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
