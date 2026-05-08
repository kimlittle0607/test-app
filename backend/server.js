require('dotenv').config();
const express = require('express');
const cors = require('cors');

const pool = require('./db/pool');

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('frontend'));

// Table setup
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        text TEXT,
        user_id INTEGER REFERENCES users(id)
      )
    `);
    console.log('Database tables ready');
  } catch (err) {
    console.error('Error creating table', err);
  }
})();

const authRoutes = require('./routes/authRoutes');
const notesRoutes = require('./routes/notesRoutes');
const weatherRoutes = require('./routes/weatherRoutes');

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/weather', weatherRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});