import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get profile
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, email_verified, created_at, updated_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (email !== undefined) {
      const emailLower = email.trim().toLowerCase();
      // Check if email is already taken by another user
      const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [emailLower, req.user.id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updates.push(`email = $${idx++}`);
      values.push(emailLower);
      updates.push(`email_verified = false`);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.user.id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, email, name, role, email_verified, created_at, updated_at`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete account
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const isValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isValid) {
      return res.status(400).json({ error: 'Password is incorrect' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
