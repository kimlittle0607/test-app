const pool = require('../db/pool');

async function getNotes(userId) {
  const result = await pool.query(
    'SELECT * FROM notes WHERE user_id = $1 ORDER BY id DESC',
    [userId]
  );

  return result.rows;
}

async function createNote(userId, text) {
  if (!text) {
    const err = new Error('Text is required');
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    'INSERT INTO notes (text, user_id) VALUES ($1, $2) RETURNING *',
    [text, userId]
  );

  return result.rows[0];
}

async function deleteNote(userId, id) {
  if (!id) {
    const err = new Error('Note id required');
    err.status = 400;
    throw err;
  }

  await pool.query(
    'DELETE FROM notes WHERE id = $1 AND user_id = $2',
    [id, userId]
  );

  return { message: 'Note deleted', id };
}

async function updateNote(userId, id, text) {
  if (!id) {
    const err = new Error('Note id required');
    err.status = 400;
    throw err;
  }

  if (!text) {
    const err = new Error('Text is required');
    err.status = 400;
    throw err;
  }

  await pool.query(
    'UPDATE notes SET text = $1 WHERE id = $2 AND user_id = $3',
    [text, id, userId]
  );

  return { message: 'Updated', id, text };
}

module.exports = {
  getNotes,
  createNote,
  deleteNote,
  updateNote
};
