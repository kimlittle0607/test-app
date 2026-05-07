const express = require('express');
const notesService = require('../services/notesService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get all notes for logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notes = await notesService.getNotes(req.user.id);
    res.json(notes);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Create a new note
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const note = await notesService.createNote(req.user.id, text);
    res.json(note);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Delete a note
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await notesService.deleteNote(req.user.id, id);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Update a note
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    const result = await notesService.updateNote(req.user.id, id, text);
    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
