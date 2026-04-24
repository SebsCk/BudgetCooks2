const express = require('express');
const db      = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/challenges — list active + pending (admin sees all)
router.get('/', async (req, res) => {
  const { status = 'active' } = req.query;
  const [rows] = await db.query(`
    SELECT ch.*, u.username AS created_by_username,
           COUNT(DISTINCT ce.id) AS entry_count
    FROM challenges ch
    LEFT JOIN users u ON u.id = ch.created_by
    LEFT JOIN challenge_entries ce ON ce.challenge_id = ch.id
    WHERE ch.status = ?
    GROUP BY ch.id
    ORDER BY ch.created_at DESC
  `, [status]);
  res.json(rows);
});

// GET /api/challenges/:id
router.get('/:id', async (req, res) => {
  const [rows] = await db.query(`
    SELECT ch.*, u.username AS created_by_username,
           COUNT(DISTINCT ce.id) AS entry_count
    FROM challenges ch
    LEFT JOIN users u ON u.id = ch.created_by
    LEFT JOIN challenge_entries ce ON ce.challenge_id = ch.id
    WHERE ch.id = ?
    GROUP BY ch.id
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Challenge not found' });

  const [entries] = await db.query(`
    SELECT ce.submitted_at,
           r.id AS recipe_id, r.title, r.estimated_cost, r.image_url,
           CASE WHEN r.anonymous = 1 THEN 'Anonymous' ELSE u.username END AS author
    FROM challenge_entries ce
    JOIN recipes r ON r.id = ce.recipe_id
    JOIN users u ON u.id = ce.user_id
    WHERE ce.challenge_id = ?
    ORDER BY ce.submitted_at DESC
  `, [req.params.id]);

  res.json({ ...rows[0], entries });
});

// POST /api/challenges — member proposes a challenge (status = pending)
router.post('/', authenticate, async (req, res) => {
  const { title, description, budget_limit, starts_at, ends_at } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  const [result] = await db.query(
    `INSERT INTO challenges (created_by, title, description, budget_limit, status, starts_at, ends_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`,
    [req.user.id, title, description, budget_limit || null, starts_at || null, ends_at || null]
  );
  res.status(201).json({ id: result.insertId, message: 'Challenge submitted for review' });
});

// PATCH /api/challenges/:id/status — admin approves/rejects
router.patch('/:id/status', authenticate, authorizeAdmin, async (req, res) => {
  const { status } = req.body;
  const valid = ['active', 'rejected', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  await db.query('UPDATE challenges SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ message: `Challenge ${status}` });
});

// POST /api/challenges/:id/enter — submit a recipe to a challenge
router.post('/:id/enter', authenticate, async (req, res) => {
  const { recipe_id } = req.body;
  if (!recipe_id) return res.status(400).json({ error: 'recipe_id required' });

  const [challenge] = await db.query(
    'SELECT status FROM challenges WHERE id = ?', [req.params.id]
  );
  if (!challenge.length) return res.status(404).json({ error: 'Challenge not found' });
  if (challenge[0].status !== 'active') return res.status(400).json({ error: 'Challenge is not active' });

  const [owned] = await db.query(
    'SELECT id FROM recipes WHERE id = ? AND user_id = ?', [recipe_id, req.user.id]
  );
  if (!owned.length) return res.status(403).json({ error: 'You can only submit your own recipes' });

  try {
    await db.query(
      'INSERT INTO challenge_entries (challenge_id, recipe_id, user_id) VALUES (?, ?, ?)',
      [req.params.id, recipe_id, req.user.id]
    );
    res.status(201).json({ message: 'Entered challenge' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Already entered this challenge' });
    }
    res.status(500).json({ error: 'Failed to enter challenge' });
  }
});

module.exports = router;
