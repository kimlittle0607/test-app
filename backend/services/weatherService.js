const fetch = require('node-fetch');

// Simple weather fetch using Open-Meteo (no API key required)
async function getWeather(latitude, longitude, threshold = 20) {
  if (!latitude || !longitude) {
    const err = new Error('Latitude and longitude required');
    err.status = 400;
    throw err;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m&daily=temperature_2m_max&timezone=auto`;

  try {
    const res = await fetch(url);

    if (!res.ok) {
      const err = new Error('Failed to fetch weather data');
      err.status = res.status;
      throw err;
    }

    const data = await res.json();

    const currentTemp = data.current_weather.temperature;

    // Today's high
    const todayHigh = data.daily.temperature_2m_max[0];

    // Find first time temperature reaches threshold
    let thresholdTime = null;
    const times = data.hourly.time;
    const temps = data.hourly.temperature_2m;

    for (let i = 0; i < times.length; i++) {
      if (temps[i] >= threshold) {
        thresholdTime = times[i];
        break;
      }
    }

    return {
      currentTemperature: currentTemp,
      highTemperature: todayHigh,
      thresholdTemperature: threshold,
      thresholdTime: thresholdTime
    };
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    throw err;
  }
}

module.exports = {
  getWeather
};
