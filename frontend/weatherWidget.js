// ---- Weather Widget Module ----
// Responsible for fetching weather, computing decisions, and rendering the widget

// NOTE: expects `API` (base URL) to be defined globally (from app.js)

// ---- State ----
let currentLat = 51.5;
let currentLon = -0.12;

// ---- Persistence ----
function loadPrefs() {
  const ids = ['shortsThresholdInput','jumperThresholdInput','indoorTargetInput','blindsThresholdInput'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    const saved = localStorage.getItem(id);
    if (el && saved !== null) el.value = saved;
  });
}

function savePrefs() {
  const ids = ['shortsThresholdInput','jumperThresholdInput','indoorTargetInput','blindsThresholdInput'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) localStorage.setItem(id, el.value);
  });
}

// ---- Threshold helpers ----
function getShortsThreshold() {
  const el = document.getElementById('shortsThresholdInput');
  return el ? parseFloat(el.value) || 20 : 20;
}

function getJumperThreshold() {
  const el = document.getElementById('jumperThresholdInput');
  return el ? parseFloat(el.value) || 18 : 18;
}

function getIndoorTarget() {
  const el = document.getElementById('indoorTargetInput');
  return el ? parseFloat(el.value) || 20 : 20;
}

function getBlindsThreshold() {
  const el = document.getElementById('blindsThresholdInput');
  return el ? parseFloat(el.value) || 24 : 24;
}

// ---- Public API ----
window.refreshWeather = function () {
  loadWeather(getShortsThreshold());
};

window.initWeather = function () {
  loadPrefs();

  const ids = ['shortsThresholdInput','jumperThresholdInput','indoorTargetInput','blindsThresholdInput'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => {
      savePrefs();
      loadWeather(getShortsThreshold());
    });
  });

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        currentLat = pos.coords.latitude;
        currentLon = pos.coords.longitude;
        loadWeather(getShortsThreshold());
      },
      () => loadWeather(getShortsThreshold())
    );
  } else {
    loadWeather(getShortsThreshold());
  }
};

// ---- Core logic ----
async function loadWeather(shortsThreshold = 20) {
  try {
    const lat = currentLat;
    const lon = currentLon;

    const shorts = getShortsThreshold();
    const jumper = getJumperThreshold();
    const indoor = getIndoorTarget();
    const blinds = getBlindsThreshold();

    // Fetch for all thresholds (single call)
    const res = await fetch(`${API}/weather?lat=${lat}&lon=${lon}&shorts=${shorts}&jumper=${jumper}&indoor=${indoor}&blinds=${blinds}`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Failed to load weather');
      return;
    }

    const weatherDiv = document.getElementById('weatherSection');

    const current = data.currentTemperature;
    const high = data.highTemperature;

    const trendMessage = data.trend?.message || '';

    // ---- Decisions (from backend) ----
    const shortsMessage = data.decisions?.shorts?.message || '';
    const jumperMessage = data.decisions?.jumper?.message || '';
    const windowsMessage = data.decisions?.windows?.message || '';
    const blindsMessage = data.decisions?.blinds?.message || '';
    const shortsHint = `(below ${shorts}°)`;
    const jumperHint = `(above ${jumper}°)`;
    const windowsHint = `(below ${indoor}°)`;
    const blindsHint = `(below ${blinds}°)`;
    let tomorrowMessage = '';
    if (data.decisions?.tomorrow?.high) {
      tomorrowMessage = `${data.decisions.tomorrow.high}° tomorrow`;
    }

    // ---- Render ----
    weatherDiv.innerHTML = `
      <div style="
        background:#111;
        color:#fff;
        padding:16px;
        border-radius:12px;
        max-width:280px;
        font-family:-apple-system, BlinkMacSystemFont, sans-serif;
      ">
        <!-- removed label for cleaner UI -->
        <div style="font-size:40px; font-weight:600;">
          ${high}&deg;
          <span style="font-size:14px; font-weight:400; opacity:0.7; margin-left:6px;">High</span>
        </div>
        <div style="font-size:18px; margin-top:4px;">Now ${current}&deg; • ${trendMessage}</div>
        <div style="margin-top:12px; font-size:11px; opacity:0.5;">Environment</div>
        <div style="margin-top:4px; font-size:16px; font-weight:500;">🪟 ${windowsMessage}</div>
        <div style="font-size:12px; opacity:0.5; margin-left:22px;">${windowsHint}</div>
        <div style="margin-top:4px; font-size:16px;">🪟 ${blindsMessage}</div>
        <div style="font-size:12px; opacity:0.5; margin-left:22px;">${blindsHint}</div>

        <div style="margin-top:12px; font-size:11px; opacity:0.5;">Clothing</div>
        <div style="margin-top:4px; font-size:16px; font-weight:500;">🩳 ${shortsMessage}</div>
        <div style="font-size:12px; opacity:0.5; margin-left:22px;">${shortsHint}</div>
        <div style="margin-top:4px; font-size:16px;">🧥 ${jumperMessage}</div>
        <div style="font-size:12px; opacity:0.5; margin-left:22px;">${jumperHint}</div>

        <div style="margin-top:12px; font-size:11px; opacity:0.5;">Tomorrow</div>
        <div style="margin-top:4px; font-size:18px; font-weight:500;">🌙 ${tomorrowMessage}</div>
      </div>
    `;
  } catch (err) {
    alert('Failed to fetch weather');
  }
}