require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const db      = require('./db');
const authRoutes      = require('./routes/auth');
const recipeRoutes    = require('./routes/recipes');
const commentRoutes   = require('./routes/comments');
const challengeRoutes = require('./routes/challenges');
const userRoutes      = require('./routes/users');
const forumRoutes     = require('./routes/forums');
const activityRoutes  = require('./routes/activity');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: function(origin, callback) { callback(null, true); },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.options('*', cors());
app.use(express.json());

app.use('/auth',           authRoutes);
app.use('/api/recipes',    recipeRoutes);
app.use('/api/comments',   commentRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/forums',     forumRoutes);
app.use('/api/activity',   activityRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'Database connected' });
  } catch (err) {
    res.status(500).json({ status: 'Database error', error: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function ensureInitialAdmin() {
  const { INIT_ADMIN_EMAIL, INIT_ADMIN_USERNAME, INIT_ADMIN_PASSWORD } = process.env;
  if (!INIT_ADMIN_EMAIL || !INIT_ADMIN_USERNAME || !INIT_ADMIN_PASSWORD) return;
  try {
    const [adminRows] = await db.query('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    if (adminRows.length) return console.log('Admin user already exists.');
    const [duplicate] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [INIT_ADMIN_EMAIL, INIT_ADMIN_USERNAME]
    );
    if (duplicate.length) return console.log('Initial admin skipped: email/username exists.');
    const hash = await bcrypt.hash(INIT_ADMIN_PASSWORD, 10);
    await db.query(
      'INSERT INTO users (email, username, password_hash, role) VALUES (?, ?, ?, ?)',
      [INIT_ADMIN_EMAIL, INIT_ADMIN_USERNAME, hash, 'admin']
    );
    console.log(`Initial admin created: ${INIT_ADMIN_EMAIL}`);
  } catch (err) {
    console.error('Failed to create initial admin account:', err.message);
  }
}

async function runMigrations() {
  const fs = require('fs');
  const path = require('path');
  const migDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migDir)) return;
  const files = fs.readdirSync(migDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migDir, file), 'utf8');
    const statements = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      try { await db.query(stmt); } catch (err) {
        if (!err.message.includes('already exists')) console.error(`Migration ${file} error:`, err.message);
      }
    }
  }
  console.log('Migrations done');
}

async function start() {
  try {
    await db.query('SELECT 1');
    console.log('MySQL connected');
    await runMigrations();
    await ensureInitialAdmin();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }
}
start();
