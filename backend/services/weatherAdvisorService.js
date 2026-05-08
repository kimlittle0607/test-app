const weatherService = require('./weatherService');

// Compute first time (today) temperature crosses a threshold
function findThresholdTimeToday(hourlyTimes, hourlyTemps, threshold, todayDateStr) {
  for (let i = 0; i < hourlyTimes.length; i++) {
    const t = hourlyTimes[i];
    if (!t.startsWith(todayDateStr)) continue; // only today
    if (hourlyTemps[i] >= threshold) {
      return t;
    }
  }
  return null;
}

// Main advisor
async function getWeatherAdvice({ lat, lon, shortsThreshold = 20, jumperThreshold = 18, indoorTarget = 20, blindsThreshold = 24 }) {
  // Fetch base data (no threshold needed for base)
  const base = await weatherService.getWeather({ lat, lon });

  const {
    currentTemperature,
    currentTime,
    highTemperature,
    hourlyTimes,
    hourlyTemps,
    todayDateStr,
    tomorrowHigh
  } = base;

  // --- Trend (Rising / Peak / Cooling) ---
  let trend;

  // Find index of current time from API (timezone-safe)
  // Find index by matching prefix (handles seconds mismatch)
  let currentIndex = hourlyTimes.findIndex(t => t.startsWith(currentTime));

  if (currentIndex === -1) {
    // fallback: find closest past time
    for (let i = hourlyTimes.length - 1; i >= 0; i--) {
      if (hourlyTimes[i] < currentTime) {
        currentIndex = i;
        break;
      }
    }
  }

  let prevTemp = null;
  if (currentIndex > 0) {
    prevTemp = hourlyTemps[currentIndex - 1];
  }

  if (prevTemp !== null) {
    if (currentTemperature > prevTemp) {
      trend = { state: 'rising', message: 'Rising' };
    } else if (currentTemperature < prevTemp) {
      trend = { state: 'cooling', message: 'Cooling' };
    } else {
      trend = { state: 'peak', message: 'Peak reached' };
    }
  } else {
    trend = { state: 'peak', message: 'Peak reached' };
  }

  // Progress
  const progress = highTemperature > 0 ? Math.min(1, currentTemperature / highTemperature) : 0;

  // Shorts
  const shortsTime = findThresholdTimeToday(hourlyTimes, hourlyTemps, shortsThreshold, todayDateStr);
  let shorts;
  if (!shortsTime) {
    shorts = { state: 'none', message: 'No shorts today' };
  } else {
    const now = new Date();
    const t = new Date(shortsTime);
    if (t <= now) {
      shorts = { state: 'now', message: 'Shorts now' };
    } else {
      const s = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      shorts = { state: 'later', time: shortsTime, message: `Shorts from ${s}` };
    }
  }

  // Jumper
  const jumperTime = findThresholdTimeToday(hourlyTimes, hourlyTemps, jumperThreshold, todayDateStr);
  let jumper;
  if (currentTemperature < jumperThreshold) {
    if (jumperTime) {
      const t = new Date(jumperTime);
      const s = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      jumper = { state: 'until', time: jumperTime, message: `Jumper until ${s}` };
    } else {
      jumper = { state: 'needed', message: 'Jumper needed' };
    }
  } else {
    jumper = { state: 'none', message: 'No jumper needed' };
  }

  // Windows
  const windowsTime = findThresholdTimeToday(hourlyTimes, hourlyTemps, indoorTarget, todayDateStr);
  let windows;
  if (currentTemperature < indoorTarget) {
    if (windowsTime) {
      const t = new Date(windowsTime);
      const s = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      windows = { state: 'open', closeAt: windowsTime, message: `Windows can be open → close at ${s}` };
    } else {
      windows = { state: 'open', message: 'Windows can be open' };
    }
  } else {
    windows = { state: 'closed', message: 'Windows should be closed' };
  }

  // Blinds (today)
  let blinds;
  if (highTemperature >= blindsThreshold) {
    blinds = { state: 'down', message: 'Blinds down' };
  } else {
    blinds = { state: 'not_required', message: 'Blinds not required' };
  }

  // Tomorrow
  let tomorrow;
  if (typeof tomorrowHigh === 'number') {
    if (tomorrowHigh >= blindsThreshold) {
      tomorrow = {
        high: Math.round(tomorrowHigh),
        action: 'blinds_tonight',
        message: `🌙 Blinds down tonight (tomorrow ${Math.round(tomorrowHigh)}°)`
      };
    } else {
      tomorrow = {
        high: Math.round(tomorrowHigh),
        action: 'none',
        message: `Tomorrow ${Math.round(tomorrowHigh)}°`
      };
    }
  } else {
    tomorrow = { message: '' };
  }

  return {
    currentTemperature,
    highTemperature,
    progress,
    trend,
    decisions: {
      shorts,
      jumper,
      windows,
      blinds,
      tomorrow
    }
  };
}

module.exports = {
  getWeatherAdvice
};
