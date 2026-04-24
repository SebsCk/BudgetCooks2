const express = require('express');
const db      = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/comments?recipe_id=X — get all comments for a recipe
router.get('/', async (req, res) => {
  const { recipe_id } = req.query;
  if (!recipe_id) return res.status(400).json({ error: 'recipe_id required' });

  const [rows] = await db.query(`
    SELECT c.id, c.body, c.parent_id, c.created_at,
           u.username AS author, u.avatar_url AS author_avatar
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.recipe_id = ?
    ORDER BY c.created_at ASC
  `, [recipe_id]);

  // nest replies under their parent
  const map = {};
  const roots = [];
  rows.forEach(r => { map[r.id] = { ...r, replies: [] }; });
  rows.forEach(r => {
    if (r.parent_id && map[r.parent_id]) {
      map[r.parent_id].replies.push(map[r.id]);
    } else {
      roots.push(map[r.id]);
    }
  });

  res.json(roots);
});

// POST /api/comments — post a comment or reply
router.post('/', authenticate, async (req, res) => {
  const { recipe_id, body, parent_id } = req.body;
  if (!recipe_id || !body?.trim()) {
    return res.status(400).json({ error: 'recipe_id and body are required' });
  }

  // enforce max depth of 1 (only one level of replies)
  if (parent_id) {
    const [parent] = await db.query('SELECT parent_id FROM comments WHERE id = ?', [parent_id]);
    if (!parent.length) return res.status(404).json({ error: 'Parent comment not found' });
    if (parent[0].parent_id !== null) {
      return res.status(400).json({ error: 'Max reply depth reached' });
    }
  }

  const [result] = await db.query(
    'INSERT INTO comments (recipe_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)',
    [recipe_id, req.user.id, parent_id || null, body.trim()]
  );

  res.status(201).json({ id: result.insertId, message: 'Comment posted' });
});

// POST /api/comments/:id/report
router.post('/:id/report', authenticate, async (req, res) => {
  const { reason } = req.body;
  await db.query(
    'INSERT INTO reports (comment_id, reported_by, reason) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, reason]
  );
  res.json({ message: 'Report submitted' });
});

module.exports = router;
