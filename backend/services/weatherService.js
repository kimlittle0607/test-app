const fetch = require('node-fetch');

// Simple weather fetch using Open-Meteo (no API key required)
async function getWeather({ lat, lon }) {
  if (!lat || !lon) {
    const err = new Error('Latitude and longitude required');
    err.status = 400;
    throw err;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m&daily=temperature_2m_max&timezone=auto`;

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

    return {
      currentTemperature: currentTemp,
      highTemperature: todayHigh,
      hourlyTimes: data.hourly.time,
      hourlyTemps: data.hourly.temperature_2m,
      todayDateStr: data.daily.time[0],
      tomorrowHigh: data.daily.temperature_2m_max[1]
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
