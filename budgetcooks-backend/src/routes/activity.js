const express = require('express');
const db      = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const router  = express.Router();

// GET /api/activity/stats — dashboard statistics
router.get('/stats', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [[users]]      = await db.query('SELECT COUNT(*) AS c FROM users');
    const [[recipes]]    = await db.query('SELECT COUNT(*) AS c FROM recipes');
    const [[comments]]   = await db.query('SELECT COUNT(*) AS c FROM comments');
    const [[challenges]] = await db.query('SELECT COUNT(*) AS c FROM challenges');
    let totalLikes = 0;
    try { const [[likes]] = await db.query('SELECT COUNT(*) AS c FROM likes'); totalLikes = likes.c; } catch {}
    let openReports = 0;
    try { const [[reports]] = await db.query("SELECT COUNT(*) AS c FROM reports WHERE status = 'open'"); openReports = reports.c; } catch {}
    res.json({
      totalUsers: users.c,
      totalRecipes: recipes.c,
      totalComments: comments.c,
      totalChallenges: challenges.c,
      totalLikes,
      openReports,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/activity/users-list — all users for admin panel
router.get('/users-list', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, email, username, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/activity/deletions — soft-deleted content
router.get('/deletions', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [forums] = await db.query(`
      SELECT 'forum' AS type, f.title AS name, u.username AS deleted_by, f.updated_at AS deleted_at
      FROM forums f JOIN users u ON u.id = f.user_id
      WHERE f.deleted = 1
    `);
    const [replies] = await db.query(`
      SELECT 'forum_reply' AS type, CONCAT('Reply #', fr.id) AS name, u.username AS deleted_by, fr.created_at AS deleted_at
      FROM forum_replies fr JOIN users u ON u.id = fr.user_id
      WHERE fr.deleted = 1
    `);
    const all = [...forums, ...replies].sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
    res.json(all);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/activity — activity log entries
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.id, a.user_id, a.role, a.action, a.entity, a.entity_id, a.meta, a.created_at,
             u.username
      FROM activity_log a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
