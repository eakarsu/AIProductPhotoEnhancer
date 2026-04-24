import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

// Get all 360 views
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, p.name as product_name, p.category
       FROM view_360 v
       JOIN products p ON v.product_id = p.id
       WHERE p.user_id = $1
       ORDER BY v.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get 360 views error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single 360 view
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.*, p.name as product_name, p.category, p.description as product_description
       FROM view_360 v
       JOIN products p ON v.product_id = p.id
       WHERE v.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '360 view not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get 360 view error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create 360 view with AI analysis
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product_id, frame_count, rotation_speed } = req.body;

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
    const aiAnalysis = await openRouterService.analyze360View(
      `${product.name} - ${product.description}`,
      frame_count || 36
    );

    const aiFrameCount = aiAnalysis.data?.recommendedFrameCount || aiAnalysis.data?.estimatedFrames || frame_count || 36;
    const aiRotationSpeed = aiAnalysis.data?.recommendedRotationSpeed || rotation_speed || 30;

    const result = await pool.query(
      `INSERT INTO view_360 (product_id, image_paths, ai_analysis, rotation_speed, frame_count, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [product_id, JSON.stringify([product.original_image]), JSON.stringify(aiAnalysis), aiRotationSpeed, aiFrameCount, 'completed']
    );

    res.status(201).json({
      ...result.rows[0],
      ai_analysis: aiAnalysis
    });
  } catch (error) {
    console.error('Create 360 view error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update 360 view
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, rotation_speed, frame_count } = req.body;

    const result = await pool.query(
      `UPDATE view_360 v
       SET status = COALESCE($1, v.status),
           rotation_speed = COALESCE($2, v.rotation_speed),
           frame_count = COALESCE($3, v.frame_count),
           updated_at = CURRENT_TIMESTAMP
       FROM products p
       WHERE v.id = $4 AND v.product_id = p.id AND p.user_id = $5
       RETURNING v.*`,
      [status, rotation_speed, frame_count, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '360 view not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update 360 view error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete 360 view
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM view_360 v
       USING products p
       WHERE v.id = $1 AND v.product_id = p.id AND p.user_id = $2
       RETURNING v.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: '360 view not found' });
    }

    res.json({ message: '360 view deleted successfully' });
  } catch (error) {
    console.error('Delete 360 view error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Re-analyze with AI
router.post('/:id/analyze', authenticateToken, async (req, res) => {
  try {
    const { frame_count } = req.body;

    const existing = await pool.query(
      `SELECT v.*, p.name, p.description, p.category
       FROM view_360 v
       JOIN products p ON v.product_id = p.id
       WHERE v.id = $1 AND p.user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: '360 view not found' });
    }

    const record = existing.rows[0];
    const aiAnalysis = await openRouterService.analyze360View(
      `${record.name} - ${record.description}`,
      frame_count || record.frame_count
    );

    const aiFrameCount = aiAnalysis.data?.recommendedFrameCount || aiAnalysis.data?.estimatedFrames || record.frame_count;
    const aiRotationSpeed = aiAnalysis.data?.recommendedRotationSpeed || record.rotation_speed;

    await pool.query(
      `UPDATE view_360 SET ai_analysis = $1, frame_count = $2, rotation_speed = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`,
      [JSON.stringify(aiAnalysis), aiFrameCount, aiRotationSpeed, req.params.id]
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
