const express = require('express');
const db      = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:username — public profile
router.get('/:username', async (req, res) => {
  const [users] = await db.query(
    'SELECT id, username, avatar_url, created_at FROM users WHERE username = ?',
    [req.params.username]
  );
  if (!users.length) return res.status(404).json({ error: 'User not found' });
  const user = users[0];

  const [recipes] = await db.query(`
    SELECT r.id, r.title, r.estimated_cost, r.image_url, r.created_at,
           COUNT(DISTINCT l.id) AS like_count
    FROM recipes r
    LEFT JOIN likes l ON l.recipe_id = r.id
    WHERE r.user_id = ? AND r.anonymous = 0
    GROUP BY r.id ORDER BY r.created_at DESC
  `, [user.id]);

  const [liked] = await db.query(`
    SELECT r.id, r.title, r.estimated_cost, r.image_url,
           CASE WHEN r.anonymous = 1 THEN 'Anonymous' ELSE u.username END AS author
    FROM likes l
    JOIN recipes r ON r.id = l.recipe_id
    JOIN users u ON u.id = r.user_id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `, [user.id]);

  const [challenges] = await db.query(`
    SELECT ch.id, ch.title, ch.status, ce.submitted_at,
           r.title AS recipe_title
    FROM challenge_entries ce
    JOIN challenges ch ON ch.id = ce.challenge_id
    JOIN recipes r ON r.id = ce.recipe_id
    WHERE ce.user_id = ?
    ORDER BY ce.submitted_at DESC
  `, [user.id]);

  const [comments] = await db.query(`
    SELECT c.id, c.body, c.created_at, r.title AS recipe_title, r.id AS recipe_id
    FROM comments c
    JOIN recipes r ON r.id = c.recipe_id
    WHERE c.user_id = ?
    ORDER BY c.created_at DESC LIMIT 20
  `, [user.id]);

  res.json({ ...user, recipes, liked, challenges, comments });
});

// GET /api/users/admin/reports — admin: view all reports
router.get('/admin/reports', authenticate, authorizeAdmin, async (req, res) => {
  const [rows] = await db.query(`
    SELECT r.id, r.reason, r.created_at,
           u.username AS reported_by,
           r.recipe_id, r.comment_id,
           rec.title AS recipe_title
    FROM reports r
    LEFT JOIN users u ON u.id = r.reported_by
    LEFT JOIN recipes rec ON rec.id = r.recipe_id
    WHERE r.resolved = 0
    ORDER BY r.created_at DESC
  `);
  res.json(rows);
});

// DELETE /api/users/admin/recipes/:id — admin takedown
router.delete('/admin/recipes/:id', authenticate, authorizeAdmin, async (req, res) => {
  await db.query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
  res.json({ message: 'Recipe removed' });
});

// PATCH /api/users/admin/reports/:id/resolve — mark report resolved
router.patch('/admin/reports/:id/resolve', authenticate, authorizeAdmin, async (req, res) => {
  await db.query('UPDATE reports SET resolved = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Report resolved' });
});

module.exports = router;
