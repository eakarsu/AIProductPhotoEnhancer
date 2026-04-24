import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all enhancements
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, p.name as product_name, p.category
       FROM enhancements e
       JOIN products p ON e.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY e.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get enhancements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single enhancement
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, p.name as product_name, p.category, p.description as product_description
       FROM enhancements e
       JOIN products p ON e.product_id = p.id
       WHERE e.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enhancement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get enhancement error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create enhancement with AI analysis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, enhancement_type, image_description, settings } = req.body;

    if (!product_id || !enhancement_type) {
      return res.status(400).json({ error: 'Product ID and enhancement type are required' });
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
    const aiAnalysis = await openRouterService.analyzeForEnhancement(
      image_description || `${product.name} - ${product.description}`,
      enhancement_type
    );

    const aiSettings = aiAnalysis.data?.recommendations?.suggestedSettings || aiAnalysis.data?.suggestedSettings || settings || {};

    const result = await pool.query(
      `INSERT INTO enhancements (product_id, original_image, enhancement_type, ai_analysis, settings, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_id, product.original_image, enhancement_type, JSON.stringify(aiAnalysis), JSON.stringify(aiSettings), 'completed']
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create enhancement error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update enhancement
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, enhanced_image, settings, enhancement_type } = req.body;

    const result = await pool.query(
      `UPDATE enhancements e
       SET status = COALESCE($1, e.status),
           enhanced_image = COALESCE($2, e.enhanced_image),
           settings = COALESCE($3, e.settings),
           enhancement_type = COALESCE($4, e.enhancement_type),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE e.id = $5 AND e.product_id = p.id AND p.user_id = $6
       RETURNING e.*`,
      [status, enhanced_image, settings ? JSON.stringify(settings) : null, enhancement_type, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enhancement not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update enhancement error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete enhancement
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM enhancements e
       USING products p
       WHERE e.id = $1 AND e.product_id = p.id AND p.user_id = $2
       RETURNING e.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enhancement not found' });
    }

    res.json({ message: 'Enhancement deleted successfully' });
  } catch (error) {
    console.error('Delete enhancement error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { image_description } = req.body;

    const existing = await pool.query(
      `SELECT e.*, p.name, p.description, p.category
       FROM enhancements e
       JOIN products p ON e.product_id = p.id
       WHERE e.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Enhancement not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.analyzeForEnhancement(
      image_description || `${record.name} - ${record.description}`,
      record.enhancement_type
    );

    const aiSettings = aiAnalysis.data?.recommendations?.suggestedSettings || aiAnalysis.data?.suggestedSettings || {};

    await pool.query(
      `UPDATE enhancements SET ai_analysis = $1, settings = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
      [JSON.stringify(aiAnalysis), JSON.stringify(aiSettings), req.params.id]
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
