const express = require('express');
const db      = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/stats — public home-page stats
router.get('/stats', async (req, res) => {
  try {
    const [[users]]    = await db.query('SELECT COUNT(*) AS c FROM users');
    const [[recipes]]  = await db.query('SELECT COUNT(*) AS c FROM recipes');
    const [[challs]]   = await db.query('SELECT COUNT(*) AS c FROM challenges');
    let avgMealCost = null;
    try {
      const [[avg]] = await db.query('SELECT ROUND(AVG(estimated_cost), 0) AS c FROM recipes WHERE estimated_cost IS NOT NULL');
      avgMealCost = avg.c;
    } catch {}
    res.json({
      totalRecipes:    recipes.c,
      totalUsers:      users.c,
      avgMealCost:     avgMealCost,
      totalChallenges: challs.c,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/users/top-cooks — public leaderboard
router.get('/top-cooks', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username,
             COUNT(DISTINCT r.id)  AS recipe_count,
             COALESCE(SUM(l.cnt),0) AS total_likes
      FROM users u
      LEFT JOIN recipes r ON r.user_id = u.id
      LEFT JOIN (
        SELECT recipe_id, COUNT(*) AS cnt FROM likes GROUP BY recipe_id
      ) l ON l.recipe_id = r.id
      GROUP BY u.id, u.username
      ORDER BY total_likes DESC, recipe_count DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

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

// GET /api/users — admin: list all users
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/users/:id/role — admin: change role
router.put('/:id/role', authenticate, authorizeAdmin, async (req, res) => {
  const { role } = req.body;
  if (!['member','admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Role updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/:id — admin: delete user
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
