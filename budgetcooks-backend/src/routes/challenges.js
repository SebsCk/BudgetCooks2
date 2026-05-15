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
           CASE WHEN r.anonymous = 1 THEN 'Anonymous' ELSE u.username END AS author,
           COUNT(DISTINCT l.id) AS like_count
    FROM challenge_entries ce
    JOIN recipes r ON r.id = ce.recipe_id
    JOIN users u ON u.id = ce.user_id
    LEFT JOIN likes l ON l.recipe_id = r.id
    WHERE ce.challenge_id = ?
    GROUP BY ce.id, r.id, u.username
    ORDER BY like_count DESC, ce.submitted_at ASC
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

// PATCH /api/challenges/:id/status — admin approves/rejects/closes
router.patch('/:id/status', authenticate, authorizeAdmin, async (req, res) => {
  const { status } = req.body;
  const valid = ['active', 'rejected', 'closed'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  if (status === 'closed') {
    // Determine winner by most likes among entries
    const [entries] = await db.query(`
      SELECT r.id AS recipe_id, r.title, r.image_url,
             CASE WHEN r.anonymous = 1 THEN 'Anonymous' ELSE u.username END AS author,
             COUNT(DISTINCT l.id) AS like_count
      FROM challenge_entries ce
      JOIN recipes r ON r.id = ce.recipe_id
      JOIN users u ON u.id = ce.user_id
      LEFT JOIN likes l ON l.recipe_id = r.id
      WHERE ce.challenge_id = ?
      GROUP BY ce.id, r.id, u.username
      ORDER BY like_count DESC
      LIMIT 1
    `, [req.params.id]);

    const [[challenge]] = await db.query('SELECT title FROM challenges WHERE id = ?', [req.params.id]);

    if (entries.length > 0) {
      const winner = entries[0];

      // Save winner to challenge
      await db.query(
        `UPDATE challenges SET status = 'closed',
          winner_recipe_id = ?, winner_username = ?,
          winner_title = ?, winner_image_url = ?
         WHERE id = ?`,
        [winner.recipe_id, winner.author, winner.title, winner.image_url, req.params.id]
      );

      // Get winner's user id
      const [winnerUser] = await db.query(
        'SELECT id FROM users WHERE username = ?', [winner.author]
      );

      if (winnerUser.length > 0) {
        // Increment their challenge_wins count
        await db.query(
          'UPDATE users SET challenge_wins = challenge_wins + 1 WHERE id = ?',
          [winnerUser[0].id]
        );

        // Insert win notification
        await db.query(
          `INSERT INTO notifications (user_id, type, challenge_id, message)
           VALUES (?, 'win', ?, ?)`,
          [winnerUser[0].id, req.params.id, `🏆 You won the "${challenge.title}" challenge!`]
        );
      }
    } else {
      await db.query("UPDATE challenges SET status = 'closed' WHERE id = ?", [req.params.id]);
    }
    return res.json({ message: 'Challenge closed' });
  }

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
    'SELECT id, estimated_cost FROM recipes WHERE id = ? AND user_id = ?', [recipe_id, req.user.id]
  );
  if (!owned.length) return res.status(403).json({ error: 'You can only submit your own recipes' });

  const budgetLimit = challenge[0].budget_limit;
  if (budgetLimit && owned[0].estimated_cost > budgetLimit) {
    return res.status(400).json({
      error: `Your recipe costs ₱${owned[0].estimated_cost} which exceeds the ₱${budgetLimit} budget limit for this challenge.`
    });
  }

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
