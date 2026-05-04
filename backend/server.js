require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// allow JSON in requests
app.use(express.json());
app.use(express.static('frontend'));

// Table setup
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        text TEXT,
        user_id INTEGER REFERENCES users(id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);
    console.log('Notes table ready');
  } catch (err) {
    console.error('Error creating table', err);
  }
})();

// Register route
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET all notes
app.get('/notes', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY id DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new note
app.post('/notes', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const result = await pool.query(
      'INSERT INTO notes (text, user_id) VALUES ($1, $2) RETURNING *',
      [text, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a note by id
app.delete('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM notes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Note deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a note by id
app.put('/notes/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    await pool.query(
      'UPDATE notes SET text = $1 WHERE id = $2 AND user_id = $3',
      [text, id, req.user.id]
    );
    res.json({ message: 'Updated', id, text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});