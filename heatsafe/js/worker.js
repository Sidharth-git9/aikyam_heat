/* ============================================================
   HEATSAFE — WORKER PORTAL LOGIC
   ============================================================ */

const hsWorkerState = {
  location: null,
  occupation: null,
  intensity: null,
  exposure: null,
  hydration: null,
  acclimatization: "Not Acclimatized", // default assumption for a first-time self-check
};

function hsGoTo(screenKey) {
  document.querySelectorAll(".hs-screen").forEach(el => el.classList.add("hs-hidden"));
  const target = document.getElementById("screen-" + screenKey);
  if (target) target.classList.remove("hs-hidden");
  window.scrollTo({ top: 0, behavior: "instant" });

  if (screenKey === "history") hsRenderHistory();
}

/* ---------- populate dropdowns ---------- */
function hsInitDropdowns() {
  const locSelect = document.getElementById("input-location");
  HS_LOCATION_NAMES.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    locSelect.appendChild(opt);
  });

  const occSelect = document.getElementById("input-occupation");
  HS_OCCUPATIONS.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    occSelect.appendChild(opt);
  });
}
hsInitDropdowns();

/* ---------- Step 1: Location -> auto show weather ---------- */
function hsSelectLocation() {
  const val = document.getElementById("input-location").value;
  hsWorkerState.location = val;
  const weather = hsGetWeather(val);

  document.getElementById("weather-loc").textContent = val;
  document.getElementById("weather-temp").textContent = `🌡️ ${weather.temp}°C`;
  document.getElementById("weather-humidity").textContent = `${weather.humidity}%`;
  document.getElementById("weather-wind").textContent = `${weather.wind} m/s`;
  document.getElementById("weather-solar").textContent = weather.solar;

  hsGoTo("weather");
}

/* ---------- Step 2: Occupation ---------- */
function hsSelectOccupation() {
  hsWorkerState.occupation = document.getElementById("input-occupation").value;
  hsGoTo("step-intensity");
}

/* ---------- Step 3: Intensity ---------- */
function hsSelectIntensity(value, btn) {
  hsWorkerState.intensity = value;
  btn.parentElement.querySelectorAll(".hs-choice-card").forEach(c => c.classList.remove("selected"));
  btn.classList.add("selected");
  setTimeout(() => hsGoTo("step-exposure"), 150);
}

/* ---------- Step 4: Exposure ---------- */
function hsSelectExposure() {
  hsWorkerState.exposure = document.getElementById("input-exposure").value;
  hsGoTo("step-hydration");
}

/* ---------- Step 5: Hydration ---------- */
function hsSelectHydration(value, btn) {
  hsWorkerState.hydration = value;
  btn.parentElement.querySelectorAll(".hs-choice-card").forEach(c => c.classList.remove("selected"));
  btn.classList.add("selected");
  document.getElementById("btn-check-risk").disabled = false;
}

/* ---------- Final: Check Risk ---------- */
function hsCheckRisk() {
  const weather = hsGetWeather(hsWorkerState.location);
  const result = calculateHeatRisk(hsWorkerState, weather);
  hsRenderResult(result);
  hsGoTo("result");
}

function hsRenderResult(result) {
  const meta = HS_RISK_META[result.riskLevel];
  const levelEl = document.getElementById("result-level");
  levelEl.textContent = `${meta.emoji} ${meta.label.replace(" RISK", "")}`;
  levelEl.className = "hs-result-level " + meta.color;

  document.getElementById("result-indicator").textContent = `${result.wbgt}°C`;

  const whyList = document.getElementById("result-why");
  whyList.innerHTML = "";
  result.explanation.forEach(reason => {
    const li = document.createElement("li");
    li.textContent = reason;
    whyList.appendChild(li);
  });
  if (result.explanation.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Conditions are currently within safe limits.";
    whyList.appendChild(li);
  }

  const actionsWrap = document.getElementById("result-actions");
  actionsWrap.innerHTML = "";
  result.recommendations.forEach((rec, i) => {
    const div = document.createElement("div");
    div.className = "hs-action-item";
    div.innerHTML = `
      <div class="hs-action-num">${i + 1}</div>
      <div>
        <div class="hs-action-title">${rec.title}</div>
        <div class="hs-action-detail">${rec.detail}</div>
      </div>`;
    actionsWrap.appendChild(div);
  });

  hsDrawGauge(result.score, meta.color);

  // update home status card to reflect the latest self-check
  const homeCard = document.getElementById("home-status-card");
  homeCard.className = "hs-status-card " + meta.color;
  homeCard.innerHTML = `
    <div class="hs-status-emoji">${meta.emoji}</div>
    <div class="hs-status-title">${meta.label}</div>
    <div class="hs-status-msg">${result.recommendations[0] ? result.recommendations[0].detail : "Stay hydrated and monitor conditions."}</div>`;
}

/* ---------- Semi-circle SVG gauge ---------- */
function hsDrawGauge(score, colorKey) {
  const colors = { green: "#17924F", yellow: "#B4790A", red: "#C22A2A" };
  const color = colors[colorKey] || colors.yellow;
  const svg = document.getElementById("gauge-svg");
  const cx = 110, cy = 110, r = 90;
  const startAngle = 180, endAngle = 0; // semicircle
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const sweepAngle = 180 * pct;

  function polar(cx, cy, r, angleDeg) {
    const rad = (Math.PI / 180) * angleDeg;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }

  const bgStart = polar(cx, cy, r, 180);
  const bgEnd = polar(cx, cy, r, 0);
  const fgStart = polar(cx, cy, r, 180);
  const fgEnd = polar(cx, cy, r, 180 - sweepAngle);
  const largeArc = sweepAngle > 180 ? 1 : 0;

  svg.innerHTML = `
    <path d="M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 0 1 ${bgEnd.x} ${bgEnd.y}"
          fill="none" stroke="#E1E7EE" stroke-width="16" stroke-linecap="round"/>
    <path d="M ${fgStart.x} ${fgStart.y} A ${r} ${r} 0 ${largeArc} 1 ${fgEnd.x} ${fgEnd.y}"
          fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round"/>
    <text x="110" y="102" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="34" fill="#0F2138">${Math.round(score)}</text>
    <text x="110" y="122" text-anchor="middle" font-family="Inter, sans-serif" font-size="11" fill="#8592A3">RISK SCORE / 100</text>
  `;
}

/* ---------- Back to home: reset assessment ---------- */
function hsBackToHome() {
  hsWorkerState.location = null;
  hsWorkerState.occupation = null;
  hsWorkerState.intensity = null;
  hsWorkerState.exposure = null;
  hsWorkerState.hydration = null;
  document.getElementById("input-location").selectedIndex = 0;
  document.getElementById("input-occupation").selectedIndex = 0;
  document.getElementById("input-exposure").selectedIndex = 0;
  document.getElementById("btn-check-risk").disabled = true;
  document.querySelectorAll(".hs-choice-card").forEach(c => c.classList.remove("selected"));
  hsGoTo("home");
}

/* ---------- History ---------- */
function hsRenderHistory() {
  const wrap = document.getElementById("history-list");
  wrap.innerHTML = "";
  HS_WORKER_HISTORY.forEach(entry => {
    const meta = HS_RISK_META[entry.riskLevel];
    const div = document.createElement("div");
    div.className = "hs-history-item";
    div.innerHTML = `
      <div>
        <div class="hs-history-date">${entry.date}</div>
        <div class="hs-history-loc">${entry.location}</div>
      </div>
      <span class="hs-risk-badge ${meta.color}">${meta.emoji} ${entry.riskLevel}</span>`;
    wrap.appendChild(div);
  });
}
