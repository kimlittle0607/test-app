const express = require('express');
const cors = require('cors');

const { Pool } = require('pg');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// allow JSON in requests
app.use(express.json());
app.use(express.static('frontend'));

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        text TEXT
      )
    `);
    console.log('Notes table ready');
  } catch (err) {
    console.error('Error creating table', err);
  }
})();

// GET all notes
app.get('/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new note
app.post('/notes', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await pool.query(
      'INSERT INTO notes (text) VALUES ($1) RETURNING *',
      [text]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a note by id
app.delete('/notes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await pool.query('DELETE FROM notes WHERE id = $1', [id]);
    res.json({ message: 'Note deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE a note by id
app.put('/notes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    await pool.query(
      'UPDATE notes SET text = $1 WHERE id = $2',
      [text, id]
    );
    res.json({ message: 'Updated', id, text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});