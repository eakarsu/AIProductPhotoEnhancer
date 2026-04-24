import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get recent activity for dashboard
router.get('/recent', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent background removals
    const bgRemovals = await pool.query(`
      SELECT br.id, br.status, br.created_at, p.name as product_name, 'background_removal' as type
      FROM background_removals br
      JOIN products p ON br.product_id = p.id
      WHERE p.user_id = $1
      ORDER BY br.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // Get recent enhancements
    const enhancements = await pool.query(`
      SELECT e.id, e.status, e.enhancement_type, e.created_at, p.name as product_name, 'enhancement' as type
      FROM enhancements e
      JOIN products p ON e.product_id = p.id
      WHERE p.user_id = $1
      ORDER BY e.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // Get recent lifestyle shots
    const lifestyleShots = await pool.query(`
      SELECT ls.id, ls.status, ls.style, ls.created_at, p.name as product_name, 'lifestyle_shot' as type
      FROM lifestyle_shots ls
      JOIN products p ON ls.product_id = p.id
      WHERE p.user_id = $1
      ORDER BY ls.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // Get recent color analyses
    const colorAnalyses = await pool.query(`
      SELECT ca.id, ca.created_at, p.name as product_name, 'color_analysis' as type
      FROM color_analyses ca
      JOIN products p ON ca.product_id = p.id
      WHERE p.user_id = $1
      ORDER BY ca.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // Get recent quality assessments
    const qualityAssessments = await pool.query(`
      SELECT qa.id, qa.overall_score, qa.created_at, p.name as product_name, 'quality_assessment' as type
      FROM quality_assessments qa
      JOIN products p ON qa.product_id = p.id
      WHERE p.user_id = $1
      ORDER BY qa.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    // Combine and sort all activities
    const allActivities = [
      ...bgRemovals.rows.map(r => ({
        ...r,
        action: 'Background removed',
        icon: 'eraser'
      })),
      ...enhancements.rows.map(r => ({
        ...r,
        action: `Enhancement applied (${r.enhancement_type})`,
        icon: 'sparkles'
      })),
      ...lifestyleShots.rows.map(r => ({
        ...r,
        action: `Lifestyle concepts generated (${r.style || 'Modern'})`,
        icon: 'camera'
      })),
      ...colorAnalyses.rows.map(r => ({
        ...r,
        action: 'Colors analyzed',
        status: 'completed',
        icon: 'palette'
      })),
      ...qualityAssessments.rows.map(r => ({
        ...r,
        action: `Quality assessed (Score: ${r.overall_score})`,
        status: 'completed',
        icon: 'award'
      }))
    ];

    // Sort by created_at descending and limit
    allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const recentActivities = allActivities.slice(0, limit);

    res.json(recentActivities);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE user_id = $1) as products,
        (SELECT COUNT(*) FROM background_removals br JOIN products p ON br.product_id = p.id WHERE p.user_id = $1) as background_removals,
        (SELECT COUNT(*) FROM enhancements e JOIN products p ON e.product_id = p.id WHERE p.user_id = $1) as enhancements,
        (SELECT COUNT(*) FROM lifestyle_shots ls JOIN products p ON ls.product_id = p.id WHERE p.user_id = $1) as lifestyle_shots,
        (SELECT COUNT(*) FROM color_analyses ca JOIN products p ON ca.product_id = p.id WHERE p.user_id = $1) as color_analyses,
        (SELECT COUNT(*) FROM quality_assessments qa JOIN products p ON qa.product_id = p.id WHERE p.user_id = $1) as quality_assessments,
        (SELECT COUNT(*) FROM background_removals br JOIN products p ON br.product_id = p.id WHERE p.user_id = $1 AND br.status = 'completed') as completed_removals,
        (SELECT AVG(overall_score) FROM quality_assessments qa JOIN products p ON qa.product_id = p.id WHERE p.user_id = $1) as avg_quality_score
    `, [userId]);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
