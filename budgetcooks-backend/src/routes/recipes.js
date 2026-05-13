const express  = require('express');
const db       = require('../db');
const jwt      = require('jsonwebtoken');  // ← add this at the top
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// GET /api/recipes — feed with infinite scroll
router.get('/', async (req, res) => {
  const { sort = 'hot', category, q, limit = 10, offset = 0, mine } = req.query;

  // optionally decode user from Authorization header (no hard auth required)
  let userId = null;
  try {
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      userId = payload.id || payload.userId || null;
    }
  } catch {}

  const orderMap = {
    hot:       '(like_count + comment_count * 2) DESC',
    new:       'r.created_at DESC',
    top:       'like_count DESC',
  };
  const order = orderMap[sort] || 'r.created_at DESC';

  let where = 'WHERE 1=1';
  const params = [];

  if (category) { where += ' AND c.slug = ?'; params.push(category); }
  if (q)        { where += ' AND r.title LIKE ?'; params.push(`%${q}%`); }
  if (mine && userId) { where += ' AND r.user_id = ?'; params.push(userId); }

  const userBookmarkedCol = userId
    ? `MAX(CASE WHEN bm.user_id = ${parseInt(userId)} THEN 1 ELSE 0 END) AS user_bookmarked,`
    : `0 AS user_bookmarked,`;
  const userBookmarkedJoin = userId
    ? `LEFT JOIN bookmarks bm ON bm.recipe_id = r.id AND bm.user_id = ${parseInt(userId)}`
    : '';

  const userLikedCol = userId
    ? `MAX(CASE WHEN ul.user_id = ${parseInt(userId)} THEN 1 ELSE 0 END) AS user_liked,`
    : `0 AS user_liked,`;

  const userLikedJoin = userId
    ? `LEFT JOIN likes ul ON ul.recipe_id = r.id AND ul.user_id = ${parseInt(userId)}`
    : '';

const sql = `
    SELECT r.id, r.title, r.description, r.estimated_cost,
           r.prep_time_mins, r.cook_time_mins, r.servings,
           r.image_url, r.created_at,
           CASE WHEN u.is_deleted = 1 THEN 'Deleted User' WHEN r.anonymous = 1 THEN 'Anonymous' ELSE u.username END AS author,
           CASE WHEN u.is_deleted = 1 OR r.anonymous = 1 THEN NULL ELSE u.avatar_url END AS author_avatar,
           c.name AS category,
           COUNT(DISTINCT l.id) AS like_count,
           COUNT(DISTINCT cm.id) AS comment_count,
           ${userLikedCol}
           ${userBookmarkedCol}
           r.pinned,
           MAX(ce.challenge_id) AS challenge_id
    FROM recipes r
    LEFT JOIN users u    ON u.id = r.user_id
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN likes l    ON l.recipe_id = r.id
    LEFT JOIN comments cm ON cm.recipe_id = r.id
    LEFT JOIN challenge_entries ce ON ce.recipe_id = r.id
    ${userLikedJoin}
    ${userBookmarkedJoin}
    ${where}
    GROUP BY r.id
    ORDER BY r.pinned DESC, ${order}
    LIMIT ? OFFSET ?
  `;
  params.push(parseInt(limit), parseInt(offset));

  const [rows] = await db.query(sql, params);
  res.json(rows);
});

// GET /api/recipes/:id — single recipe with steps + ingredients
router.get('/:id', async (req, res) => {
  const [recipes] = await db.query(`
    SELECT r.*, 
           CASE WHEN u.is_deleted = 1 THEN 'Deleted User' WHEN r.anonymous = 1 THEN 'Anonymous' ELSE u.username END AS author,
           CASE WHEN u.is_deleted = 1 OR r.anonymous = 1 THEN NULL ELSE u.avatar_url END AS author_avatar,
           u.id AS author_id,
           c.name AS category, c.slug AS category_slug,
           COUNT(DISTINCT l.id) AS like_count,
           COUNT(DISTINCT cm.id) AS comment_count
    FROM recipes r
    LEFT JOIN users u ON u.id = r.user_id
    LEFT JOIN categories c ON c.id = r.category_id
    LEFT JOIN likes l ON l.recipe_id = r.id
    LEFT JOIN comments cm ON cm.recipe_id = r.id
    WHERE r.id = ?
    GROUP BY r.id
  `, [req.params.id]);

  if (!recipes.length) return res.status(404).json({ error: 'Recipe not found' });

  const [steps] = await db.query(
    'SELECT * FROM steps WHERE recipe_id = ? ORDER BY step_number', [req.params.id]
  );
  const [ingredients] = await db.query(`
    SELECT ri.quantity, ri.notes, i.name, i.unit
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    WHERE ri.recipe_id = ?
  `, [req.params.id]);

  res.json({ ...recipes[0], steps, ingredients });
});

// POST /api/recipes — create recipe
router.post('/', authenticate, async (req, res) => {
  let { title, description, category_id, category, prep_time_mins, cook_time_mins,
          servings, estimated_cost, image_url, steps = [], ingredients = [] } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  // Look up category_id from category name if not provided
  if (!category_id && category) {
    try {
      const [cats] = await db.query(
        'SELECT id FROM categories WHERE name = ? LIMIT 1', [category]
      );
      if (cats.length) category_id = cats[0].id;
    } catch {}
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO recipes (user_id, category_id, title, description,
        prep_time_mins, cook_time_mins, servings, estimated_cost, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id, title, description,
       prep_time_mins, cook_time_mins, servings, estimated_cost, image_url]
    );
    const recipeId = result.insertId;

    for (const [i, step] of steps.entries()) {
      await conn.query(
        'INSERT INTO steps (recipe_id, step_number, instruction) VALUES (?, ?, ?)',
        [recipeId, i + 1, step.instruction]
      );
    }

    for (const ing of ingredients) {
      let [rows] = await conn.query('SELECT id FROM ingredients WHERE name = ?', [ing.name]);
      let ingId = rows[0]?.id;
      if (!ingId) {
        const [r] = await conn.query('INSERT INTO ingredients (name, unit) VALUES (?, ?)', [ing.name, ing.unit]);
        ingId = r.insertId;
      }
      await conn.query(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, notes) VALUES (?, ?, ?, ?)',
        [recipeId, ingId, ing.quantity, ing.notes]
      );
    }

    await conn.commit();
    res.status(201).json({ id: recipeId, message: 'Recipe created' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Failed to create recipe' });
  } finally {
    conn.release();
  }
});

// PATCH /api/recipes/:id — edit title/description only (author only)
router.patch('/:id', authenticate, async (req, res) => {
  const { title, description, estimated_cost } = req.body;
  const [rows] = await db.query('SELECT user_id FROM recipes WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not your recipe' });

  await db.query(
    'UPDATE recipes SET title = COALESCE(?, title), description = COALESCE(?, description), estimated_cost = COALESCE(?, estimated_cost), updated_at = NOW() WHERE id = ?',
    [title, description, estimated_cost, req.params.id]
  );
  res.json({ message: 'Recipe updated' });
});

// PATCH /api/recipes/:id/anonymous — hide author name
router.patch('/:id/anonymous', authenticate, async (req, res) => {
  const [rows] = await db.query('SELECT user_id FROM recipes WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
  if (rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not your recipe' });

  await db.query('UPDATE recipes SET anonymous = 1 WHERE id = ?', [req.params.id]);
  res.json({ message: 'Author hidden' });
});

// POST /api/recipes/:id/like — toggle like
router.post('/:id/like', authenticate, async (req, res) => {
  const [existing] = await db.query(
    'SELECT id FROM likes WHERE recipe_id = ? AND user_id = ?',
    [req.params.id, req.user.id]
  );
  if (existing.length) {
    await db.query('DELETE FROM likes WHERE recipe_id = ? AND user_id = ?', [req.params.id, req.user.id]);
    return res.json({ liked: false });
  }
  await db.query('INSERT INTO likes (recipe_id, user_id) VALUES (?, ?)', [req.params.id, req.user.id]);
  res.json({ liked: true });
});

// POST /api/recipes/:id/report
router.post('/:id/report', authenticate, async (req, res) => {
  const { reason } = req.body;
  await db.query(
    'INSERT INTO reports (recipe_id, reported_by, reason) VALUES (?, ?, ?)',
    [req.params.id, req.user.id, reason]
  );
  res.json({ message: 'Report submitted' });
});


// DELETE /api/recipes/:id — author or admin
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id FROM recipes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    await db.query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Recipe deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

// DELETE /api/recipes/:id — author or admin can delete
const { authorizeAdmin } = require('../middleware/auth');
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id FROM recipes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    await db.query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Recipe deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/recipes/:id — full edit for author or admin
router.put('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT user_id FROM recipes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
    if (rows[0].user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Not authorized' });
    const { title, description, estimated_cost, category_id, servings, prep_time_mins, cook_time_mins } = req.body;
    await db.query(
      `UPDATE recipes SET title=COALESCE(?,title), description=COALESCE(?,description),
       estimated_cost=COALESCE(?,estimated_cost), category_id=COALESCE(?,category_id),
       servings=COALESCE(?,servings), prep_time_mins=COALESCE(?,prep_time_mins),
       cook_time_mins=COALESCE(?,cook_time_mins), updated_at=NOW() WHERE id=?`,
      [title,description,estimated_cost,category_id,servings,prep_time_mins,cook_time_mins,req.params.id]
    );
    res.json({ message: 'Recipe updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
