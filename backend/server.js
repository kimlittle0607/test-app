const express = require('express');
const cors = require('cors');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./notes.db');

// ensure table exists
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT
    )
  `);
});

// Promise wrappers for sqlite3
const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

// allow JSON in requests
app.use(express.json());
app.use(express.static('frontend'));

// GET all notes
app.get('/notes', async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM notes');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST a new note
app.post('/notes', async (req, res) => {
  try {
    const { text } = req.body;
    const result = await dbRun('INSERT INTO notes (text) VALUES (?)', [text]);
    res.json({ id: result.lastID, text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a note by id
app.delete('/notes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await dbRun('DELETE FROM notes WHERE id = ?', [id]);
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
    await dbRun('UPDATE notes SET text = ? WHERE id = ?', [text, id]);
    res.json({ message: 'Updated', id, text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});