import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all product descriptions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const countResult = await pool.query(`SELECT COUNT(*) FROM product_descriptions pd JOIN products p ON pd.product_id = p.id WHERE p.user_id = $1`, [req.user.id]);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT pd.*, p.name as product_name, p.category
       FROM product_descriptions pd
       JOIN products p ON pd.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY pd.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ data: result.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Get product descriptions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product description
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pd.*, p.name as product_name, p.category, p.description as product_desc
       FROM product_descriptions pd
       JOIN products p ON pd.product_id = p.id
       WHERE pd.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product description not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product description error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate product description with AI
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

    // Generate AI description
    const aiAnalysis = await openRouterService.generateProductDescription(
      image_description || `${product.name} - ${product.description}`,
      product.category || 'General'
    );

    const result = await pool.query(
      `INSERT INTO product_descriptions (product_id, ai_analysis, short_description, long_description, seo_keywords)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        product_id,
        JSON.stringify(aiAnalysis),
        aiAnalysis.data?.shortDescription || '',
        aiAnalysis.data?.longDescription || '',
        JSON.stringify(aiAnalysis.data?.seoKeywords || [])
      ]
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create product description error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Delete product description
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM product_descriptions pd
       USING products p
       WHERE pd.id = $1 AND pd.product_id = p.id AND p.user_id = $2
       RETURNING pd.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product description not found' });
    }

    res.json({ message: 'Product description deleted successfully' });
  } catch (error) {
    console.error('Delete product description error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Regenerate with AI
router.post('/:id/regenerate', authenticateToken, async (req, res) => {
  try {
    const { image_description } = req.body;

    const existing = await pool.query(
      `SELECT pd.*, p.name, p.description, p.category
       FROM product_descriptions pd
       JOIN products p ON pd.product_id = p.id
       WHERE pd.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Product description not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.generateProductDescription(
      image_description || `${record.name} - ${record.description}`,
      record.category || 'General'
    );

    await pool.query(
      `UPDATE product_descriptions
       SET ai_analysis = $1, short_description = $2, long_description = $3, seo_keywords = $4
       WHERE id = $5`,
      [
        JSON.stringify(aiAnalysis),
        aiAnalysis.data?.shortDescription || '',
        aiAnalysis.data?.longDescription || '',
        JSON.stringify(aiAnalysis.data?.seoKeywords || []),
        req.params.id
      ]
    );

    res.json({
      ...record,
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Regenerate error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;
