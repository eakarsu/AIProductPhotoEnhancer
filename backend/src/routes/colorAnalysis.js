import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all color analyses
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ca.*, p.name as product_name, p.category
       FROM color_analyses ca
       JOIN products p ON ca.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY ca.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get color analyses error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single color analysis
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ca.*, p.name as product_name, p.category, p.description as product_description
       FROM color_analyses ca
       JOIN products p ON ca.product_id = p.id
       WHERE ca.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Color analysis not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get color analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create color analysis with AI
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

    // Get AI color analysis
    const aiAnalysis = await openRouterService.analyzeColors(
      image_description || `${product.name} - ${product.description} - Category: ${product.category}`
    );

    const result = await pool.query(
      `INSERT INTO color_analyses (product_id, image_path, ai_analysis, dominant_colors)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        product_id,
        product.original_image,
        JSON.stringify(aiAnalysis),
        JSON.stringify(aiAnalysis.data?.dominantColors || [])
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create color analysis error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete color analysis
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM color_analyses ca
       USING products p
       WHERE ca.id = $1 AND ca.product_id = p.id AND p.user_id = $2
       RETURNING ca.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Color analysis not found' });
    }

    res.json({ message: 'Color analysis deleted successfully' });
  } catch (error) {
    console.error('Delete color analysis error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze colors with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { image_description } = req.body;

    const existing = await pool.query(
      `SELECT ca.*, p.name, p.description, p.category
       FROM color_analyses ca
       JOIN products p ON ca.product_id = p.id
       WHERE ca.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Color analysis not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.analyzeColors(
      image_description || `${record.name} - ${record.description} - Category: ${record.category}`
    );

    await pool.query(
      `UPDATE color_analyses SET ai_analysis = $1, dominant_colors = $2 WHERE id = $3`,
      [JSON.stringify(aiAnalysis), JSON.stringify(aiAnalysis.data?.dominantColors || []), req.params.id]
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
