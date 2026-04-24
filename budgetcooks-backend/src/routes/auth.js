const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db       = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').matches(/^[a-zA-Z0-9_]{3,40}$/),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, username, password } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
      [email, username, hash]
    );

    const token = jwt.sign(
      { id: result.insertId, username, role: 'member' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ token, user: { id: result.insertId, username, email, role: 'member' } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /auth/create-account
router.post('/create-account', authenticate, authorizeAdmin, [
  body('email').isEmail().normalizeEmail(),
  body('username').matches(/^[a-zA-Z0-9_]{3,40}$/),
  body('password').isLength({ min: 8 }),
  body('role').optional().isIn(['member', 'admin']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, username, password, role = 'member' } = req.body;
  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [email, username, hash, role]
    );

    res.status(201).json({ user: { id: result.insertId, username, email, role } });
  } catch (err) {
    res.status(500).json({ error: 'Account creation failed' });
  }
});

// POST /auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, password_hash, role, avatar_url FROM users WHERE email = ?',
      [email]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid email or password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url }
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, username, email, role, avatar_url, created_at FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'User not found' });
  res.json(rows[0]);
});

module.exports = router;
