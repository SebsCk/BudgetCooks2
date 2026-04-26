const express = require('express');
const db      = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const router  = express.Router();

const log = async (userId, role, action, entity, entityId, meta) => {
  try {
    await db.query(
      'INSERT INTO activity_log (user_id, role, action, entity, entity_id, meta) VALUES (?,?,?,?,?,?)',
      [userId, role, action, entity, entityId, meta ? JSON.stringify(meta) : null]
    );
  } catch {}
};

// GET /api/forums
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.id, f.title, f.body, f.category, f.created_at, f.updated_at,
             u.username AS author, u.role AS author_role,
             COUNT(fr.id) AS reply_count
      FROM forums f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN forum_replies fr ON fr.forum_id = f.id AND fr.deleted = 0
      WHERE f.deleted = 0
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/forums/:id
router.get('/:id', async (req, res) => {
  try {
    const [forums] = await db.query(`
      SELECT f.*, u.username AS author, u.role AS author_role
      FROM forums f JOIN users u ON u.id = f.user_id
      WHERE f.id = ? AND f.deleted = 0`, [req.params.id]);
    if (!forums.length) return res.status(404).json({ error: 'Not found' });
    const [replies] = await db.query(`
      SELECT fr.id, fr.body, fr.created_at, u.username AS author, u.role AS author_role
      FROM forum_replies fr JOIN users u ON u.id = fr.user_id
      WHERE fr.forum_id = ? AND fr.deleted = 0
      ORDER BY fr.created_at ASC`, [req.params.id]);
    res.json({ ...forums[0], replies });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/forums
router.post('/', authenticate, async (req, res) => {
  const { title, body, category = 'General' } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
  try {
    const [r] = await db.query(
      'INSERT INTO forums (user_id, title, body, category) VALUES (?,?,?,?)',
      [req.user.id, title, body, category]
    );
    await log(req.user.id, req.user.role, 'created_forum', 'forum', r.insertId, { title });
    res.status(201).json({ id: r.insertId, message: 'Forum post created' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/forums/:id/replies
router.post('/:id/replies', authenticate, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Body required' });
  try {
    const [r] = await db.query(
      'INSERT INTO forum_replies (forum_id, user_id, body) VALUES (?,?,?)',
      [req.params.id, req.user.id, body]
    );
    await log(req.user.id, req.user.role, 'replied_forum', 'forum', req.params.id, { body: body.slice(0,60) });
    res.status(201).json({ id: r.insertId, message: 'Reply added' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/forums/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id, title FROM forums WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });
    await db.query('UPDATE forums SET deleted = 1 WHERE id = ?', [req.params.id]);
    await log(req.user.id, req.user.role, 'deleted_forum', 'forum', req.params.id, { title: rows[0].title });
    res.json({ message: 'Forum post deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
