import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import { generateToken, authenticateToken, blacklistToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role || 'user', email_verified: user.email_verified || false }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const emailLower = email.trim().toLowerCase();

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [emailLower]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const result = await pool.query(
      `INSERT INTO users (email, password, name, role, email_verified, verification_token)
       VALUES ($1, $2, $3, 'user', false, $4) RETURNING id, email, name, role, email_verified`,
      [emailLower, hashedPassword, name || '', verificationToken]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, email_verified: user.email_verified },
      message: 'Account created. Please verify your email.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout - invalidate token
router.post('/logout', authenticateToken, (req, res) => {
  blacklistToken(req.token);
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
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
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Request password reset
router.post('/password-reset/request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await pool.query('SELECT id, email FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    // Always return success to prevent email enumeration
    if (user.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [user.rows[0].id, resetToken, expiresAt]
    );

    // In production, send email here. For demo, return token directly.
    console.log(`Password reset token for ${email}: ${resetToken}`);
    res.json({ message: 'If that email exists, a reset link has been sent.', resetToken });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Confirm password reset
router.post('/password-reset/confirm', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and new password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const result = await pool.query(
      `SELECT prt.user_id, prt.expires_at FROM password_reset_tokens prt WHERE prt.token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const { user_id, expires_at } = result.rows[0];
    if (new Date() > new Date(expires_at)) {
      await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
      return res.status(400).json({ error: 'Reset token has expired' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, user_id]);
    await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user_id]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset confirm error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Verification token is required' });

    const result = await pool.query(
      'UPDATE users SET email_verified = true, verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE verification_token = $1 RETURNING id, email, name, role, email_verified',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    res.json({ message: 'Email verified successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Resend verification email
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [verificationToken, req.user.id]
    );
    console.log(`Verification token for user ${req.user.id}: ${verificationToken}`);
    res.json({ message: 'Verification email resent', verificationToken });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
