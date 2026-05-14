import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all lifestyle shots
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM lifestyle_shots ls JOIN products p ON ls.product_id = p.id WHERE p.user_id = $1`, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT ls.*, p.name as product_name, p.category
       FROM lifestyle_shots ls
       JOIN products p ON ls.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY ls.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get lifestyle shots error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single lifestyle shot
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ls.*, p.name as product_name, p.category, p.description as product_description
       FROM lifestyle_shots ls
       JOIN products p ON ls.product_id = p.id
       WHERE ls.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lifestyle shot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get lifestyle shot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create lifestyle shot with AI generation
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, target_audience, style, product_description } = req.body;

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

    // Generate AI lifestyle concepts
    const aiAnalysis = await openRouterService.generateLifestyleConcepts(
      product_description || `${product.name} - ${product.description}`,
      target_audience || 'General consumers',
      style || 'Modern'
    );

    const result = await pool.query(
      `INSERT INTO lifestyle_shots (product_id, original_image, generated_concepts, target_audience, style, ai_analysis, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        product_id,
        product.original_image,
        JSON.stringify(aiAnalysis.data?.concepts || []),
        target_audience || 'General consumers',
        style || 'Modern',
        JSON.stringify(aiAnalysis),
        'completed'
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create lifestyle shot error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update lifestyle shot
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, target_audience, style, generated_concepts } = req.body;

    const result = await pool.query(
      `UPDATE lifestyle_shots ls
       SET status = COALESCE($1, ls.status),
           target_audience = COALESCE($2, ls.target_audience),
           style = COALESCE($3, ls.style),
           generated_concepts = COALESCE($4, ls.generated_concepts),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE ls.id = $5 AND ls.product_id = p.id AND p.user_id = $6
       RETURNING ls.*`,
      [status, target_audience, style, generated_concepts ? JSON.stringify(generated_concepts) : null, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lifestyle shot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lifestyle shot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete lifestyle shot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM lifestyle_shots ls
       USING products p
       WHERE ls.id = $1 AND ls.product_id = p.id AND p.user_id = $2
       RETURNING ls.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lifestyle shot not found' });
    }

    res.json({ message: 'Lifestyle shot deleted successfully' });
  } catch (error) {
    console.error('Delete lifestyle shot error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate concepts with AI
router.post('/:id/regenerate', authenticateToken, async (req, res) => {
  try {
    const { target_audience, style, product_description } = req.body;

    const existing = await pool.query(
      `SELECT ls.*, p.name, p.description, p.category
       FROM lifestyle_shots ls
       JOIN products p ON ls.product_id = p.id
       WHERE ls.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Lifestyle shot not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.generateLifestyleConcepts(
      product_description || `${record.name} - ${record.description}`,
      target_audience || record.target_audience,
      style || record.style
    );

    await pool.query(
      `UPDATE lifestyle_shots
       SET ai_analysis = $1, generated_concepts = $2, target_audience = $3, style = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        JSON.stringify(aiAnalysis),
        JSON.stringify(aiAnalysis.data?.concepts || []),
        target_audience || record.target_audience,
        style || record.style,
        req.params.id
      ]
    );

    res.json({
      ...record,
      ai_analysis: aiAnalysis,
      generated_concepts: aiAnalysis.data?.concepts || []
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;
