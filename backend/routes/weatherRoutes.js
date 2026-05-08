const express = require('express');
const weatherAdvisorService = require('../services/weatherAdvisorService');

const router = express.Router();

// GET /weather?lat=...&lon=...&shorts=...&jumper=...&indoor=...&blinds=...
router.get('/', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);

    const shortsThreshold = req.query.shorts ? parseFloat(req.query.shorts) : 20;
    const jumperThreshold = req.query.jumper ? parseFloat(req.query.jumper) : 18;
    const indoorTarget = req.query.indoor ? parseFloat(req.query.indoor) : 22;
    const blindsThreshold = req.query.blinds ? parseFloat(req.query.blinds) : 24;

    const result = await weatherAdvisorService.getWeatherAdvice({
      lat,
      lon,
      shortsThreshold,
      jumperThreshold,
      indoorTarget,
      blindsThreshold
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;