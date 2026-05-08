

const express = require('express');
const weatherService = require('../services/weatherService');

const router = express.Router();

// GET /weather?lat=...&lon=...&threshold=...
router.get('/', async (req, res) => {
  try {
    const latitude = parseFloat(req.query.lat);
    const longitude = parseFloat(req.query.lon);

    // Optional threshold override
    const threshold = req.query.threshold
      ? parseFloat(req.query.threshold)
      : undefined;

    const result = await weatherService.getWeather(
      latitude,
      longitude,
      threshold
    );

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;