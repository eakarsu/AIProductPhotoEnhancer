import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all background removals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, p.name as product_name, p.category
       FROM background_removals br
       JOIN products p ON br.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get background removals error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single background removal
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, p.name as product_name, p.category, p.description as product_description
       FROM background_removals br
       JOIN products p ON br.product_id = p.id
       WHERE br.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Background removal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get background removal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create background removal with AI analysis
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

    // Get AI analysis
    const aiAnalysis = await openRouterService.analyzeForBackgroundRemoval(
      image_description || `${product.name} - ${product.description}`
    );

    const result = await pool.query(
      `INSERT INTO background_removals (product_id, original_image, ai_analysis, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product_id, product.original_image, JSON.stringify(aiAnalysis), 'completed']
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create background removal error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update background removal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, processed_image } = req.body;

    const result = await pool.query(
      `UPDATE background_removals br
       SET status = COALESCE($1, br.status),
           processed_image = COALESCE($2, br.processed_image),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE br.id = $3 AND br.product_id = p.id AND p.user_id = $4
       RETURNING br.*`,
      [status, processed_image, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Background removal not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update background removal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete background removal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM background_removals br
       USING products p
       WHERE br.id = $1 AND br.product_id = p.id AND p.user_id = $2
       RETURNING br.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Background removal not found' });
    }

    res.json({ message: 'Background removal deleted successfully' });
  } catch (error) {
    console.error('Delete background removal error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { image_description } = req.body;

    const existing = await pool.query(
      `SELECT br.*, p.name, p.description, p.category
       FROM background_removals br
       JOIN products p ON br.product_id = p.id
       WHERE br.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Background removal not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.analyzeForBackgroundRemoval(
      image_description || `${record.name} - ${record.description}`
    );

    await pool.query(
      `UPDATE background_removals SET ai_analysis = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [JSON.stringify(aiAnalysis), req.params.id]
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
