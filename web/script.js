/* ==========================================================================
   HEATSAFE — Prototype logic
   All data below is representative / simulated for demonstration only.
   No network requests, no ML, no live weather API.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. LOCATION DATASET  — SIMULATED / REPRESENTATIVE DATA
   -------------------------------------------------------------------------- */
const locationData = {
  "Kundapura":       { region: "Coastal", x: 118, y: 40,  temperature: 34, humidity: 78, windSpeed: 3.0, exposure: "High" },
  "Udupi":           { region: "Coastal", x: 128, y: 92,  temperature: 35, humidity: 72, windSpeed: 2.5, exposure: "High" },
  "Manipal":         { region: "Coastal", x: 172, y: 108, temperature: 33, humidity: 70, windSpeed: 2.2, exposure: "Moderate" },
  "Kaup":            { region: "Coastal", x: 122, y: 132, temperature: 34, humidity: 76, windSpeed: 3.2, exposure: "High" },
  "Mulki":           { region: "Coastal", x: 130, y: 172, temperature: 34, humidity: 75, windSpeed: 2.8, exposure: "High" },
  "Mangaluru":       { region: "Coastal", x: 138, y: 214, temperature: 35, humidity: 74, windSpeed: 3.0, exposure: "High" },
  "Ullal":           { region: "Coastal", x: 126, y: 246, temperature: 35, humidity: 77, windSpeed: 3.4, exposure: "High" },
  "Kasaragod":       { region: "Coastal", x: 146, y: 288, temperature: 34, humidity: 79, windSpeed: 2.9, exposure: "High" },
  "Kanhangad":       { region: "Coastal", x: 150, y: 328, temperature: 33, humidity: 78, windSpeed: 2.6, exposure: "Moderate" },
  "Payyanur":        { region: "Coastal", x: 146, y: 368, temperature: 33, humidity: 80, windSpeed: 2.4, exposure: "Moderate" },
  "Kannur":          { region: "Coastal", x: 142, y: 410, temperature: 34, humidity: 79, windSpeed: 2.7, exposure: "High" },
  "Sakleshpur":      { region: "Inland",  x: 296, y: 216, temperature: 27, humidity: 68, windSpeed: 1.8, exposure: "Moderate" },
  "Hassan":          { region: "Inland",  x: 372, y: 190, temperature: 29, humidity: 60, windSpeed: 2.0, exposure: "Moderate" },
  "Chikkamagaluru":  { region: "Inland",  x: 336, y: 260, temperature: 28, humidity: 65, windSpeed: 1.9, exposure: "Moderate" },
  "Bengaluru":       { region: "Inland",  x: 470, y: 150, temperature: 30, humidity: 55, windSpeed: 2.3, exposure: "Moderate" }
};

const coastalOrder = ["Kundapura","Udupi","Manipal","Kaup","Mulki","Mangaluru","Ullal","Kasaragod","Kanhangad","Payyanur","Kannur"];
const inlandOrder = ["Mangaluru","Sakleshpur","Hassan","Chikkamagaluru"];
const inlandBranch2 = ["Sakleshpur","Bengaluru"];

/* --------------------------------------------------------------------------
   2. OCCUPATIONS
   -------------------------------------------------------------------------- */
const occupations = [
  { name: "Construction Worker",        defaultIntensity: "Heavy",    description: "Structural and site-based physical labour" },
  { name: "Road Worker",                defaultIntensity: "Heavy",    description: "Surface work with direct sun exposure" },
  { name: "Agricultural Worker",        defaultIntensity: "Heavy",    description: "Field labour, often exposed for long stretches" },
  { name: "Fisher",                     defaultIntensity: "Moderate", description: "Coastal and near-shore work" },
  { name: "Loading / Unloading Worker", defaultIntensity: "Heavy",    description: "Repeated lifting at depots and markets" },
  { name: "Street Vendor",              defaultIntensity: "Light",    description: "Stationary or mobile outdoor selling" },
  { name: "Delivery Worker",            defaultIntensity: "Moderate", description: "Mobile, sustained outdoor movement" },
  { name: "Sanitation Worker",          defaultIntensity: "Moderate", description: "Public cleaning and waste-handling duties" },
  { name: "Landscaping Worker",         defaultIntensity: "Moderate", description: "Ground maintenance and planting work" },
  { name: "Manual Labourer",            defaultIntensity: "Heavy",    description: "General-purpose physical work" }
];

/* --------------------------------------------------------------------------
   3. RISK RULE CONFIGURATION — kept in one place so thresholds are easy to tune
   -------------------------------------------------------------------------- */
const RISK_THRESHOLDS = { green: 35, yellow: 65 };

const INTENSITY_SCORES = { "Light": 6, "Moderate": 14, "Heavy": 22 };
const EXPOSURE_SCORES = { "< 1 hour": 2, "1–2 hours": 7, "2–4 hours": 13, "4–6 hours": 19, "> 6 hours": 25 };
const HYDRATION_SCORES = { "Adequately Hydrated": 0, "Moderate": 6, "Low": 13 };
const SOLAR_BONUS = { "High": 6, "Moderate": 3, "Low": 0 };

const INTENSITY_DESC = {
  "Light": "Low physical exertion",
  "Moderate": "Continuous physical activity",
  "Heavy": "High physical exertion / strenuous labour"
};

const RECOMMENDATIONS = {
  GREEN: [
    "Continue work with normal hydration and scheduled rest periods.",
    "Recheck conditions if intensity or exposure duration increases."
  ],
  YELLOW: [
    "Increase hydration frequency.",
    "Take more frequent rest breaks.",
    "Reduce prolonged direct-sun exposure where possible.",
    "Monitor worker condition through the shift."
  ],
  RED: [
    "Stop or reduce strenuous work immediately.",
    "Move the worker to a cooler or shaded rest area.",
    "Rehydrate and increase rest frequency.",
    "Supervisor should reassess work conditions before resuming."
  ]
};

/* --------------------------------------------------------------------------
   4. HEAT-STRESS CALCULATION ENGINE
   Deterministic and rule-based. No randomness, no machine learning.
   Same inputs will always produce the same output.
   -------------------------------------------------------------------------- */
function calculateHeatRisk(worker, weather) {
  const intensityScore = INTENSITY_SCORES[worker.intensity];
  const exposureScore = EXPOSURE_SCORES[worker.exposure];
  const hydrationScore = HYDRATION_SCORES[worker.hydration];
  const acclimAdjustment = worker.acclimatization === "Acclimatized" ? -4 : 4;
  const solarBonus = SOLAR_BONUS[weather.exposure];

  const envRaw = (weather.temperature - 25) * 1.4
               + (weather.humidity - 50) * 0.25
               - weather.windSpeed * 1.2
               + solarBonus;
  const envScore = Math.max(0, envRaw);

  const rawScore = envScore + intensityScore + exposureScore + hydrationScore + acclimAdjustment;
  const score = Math.max(0, Math.round(rawScore * 10) / 10);

  const estimatedWBGT = Math.round(
    (weather.temperature * 0.7 + weather.humidity * 0.08 + solarBonus * 0.5
     - weather.windSpeed * 0.4 + intensityScore * 0.15) * 10
  ) / 10;

  let riskLevel;
  if (score <= RISK_THRESHOLDS.green) riskLevel = "GREEN";
  else if (score <= RISK_THRESHOLDS.yellow) riskLevel = "YELLOW";
  else riskLevel = "RED";

  const drivers = [];
  if (envScore >= 20) drivers.push("High environmental heat");
  if (worker.intensity === "Heavy") drivers.push("Heavy physical activity");
  if (exposureScore >= 19) drivers.push("Prolonged exposure duration");
  if (worker.hydration === "Low") drivers.push("Low hydration");
  if (worker.acclimatization === "Not Acclimatized") drivers.push("Not acclimatized to heat");
  if (drivers.length === 0) drivers.push("Conditions currently within manageable range");

  const explanationMap = {
    GREEN: "Current environmental and work conditions remain within a manageable range for this worker.",
    YELLOW: "A combination of environmental heat and work conditions is beginning to raise this worker's heat-stress risk.",
    RED: "Heavy or prolonged work combined with elevated environmental heat and reduced hydration is significantly increasing this worker's heat-stress risk."
  };

  return {
    score,
    riskLevel,
    estimatedWBGT,
    explanation: explanationMap[riskLevel],
    recommendations: RECOMMENDATIONS[riskLevel],
    drivers,
    factors: {
      environmental: Math.min(100, Math.round((envScore / 30) * 100)),
      intensity: Math.round((intensityScore / 22) * 100),
      exposure: Math.round((exposureScore / 25) * 100),
      hydration: Math.round((hydrationScore / 13) * 100),
      acclimatization: worker.acclimatization === "Not Acclimatized" ? 60 : 25
    }
  };
}

/* --------------------------------------------------------------------------
   5. UI BOOTSTRAP
   -------------------------------------------------------------------------- */
const riskMeta = {
  GREEN:  { label: "Lower Heat-Stress Risk", cls: "risk-green", dot: "dot-green", color: "#1E8A5F", gaugePct: 0.18 },
  YELLOW: { label: "Elevated Heat-Stress Risk", cls: "risk-yellow", dot: "dot-yellow", color: "#A87A0B", gaugePct: 0.55 },
  RED:    { label: "High Heat-Stress Risk", cls: "risk-red", dot: "dot-red", color: "#B23A3A", gaugePct: 0.9 }
};

const state = {
  location: "Udupi",
  occupation: "Construction Worker",
  intensity: "Heavy",
  exposure: "4–6 hours",
  hydration: "Low",
  acclimatization: "Not Acclimatized"
};

function populateSelect(id, items) {
  const el = document.getElementById(id);
  el.innerHTML = items.map(v => `<option value="${v}">${v}</option>`).join("");
}

function renderWeatherPanel(locationName) {
  const w = locationData[locationName];
  const body = document.getElementById("weather-body");
  body.innerHTML = `
    <div class="weather-stat">
      <span class="weather-stat-label">Location</span>
      <span class="weather-stat-value">${locationName}</span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Temperature</span>
      <span class="weather-stat-value">${w.temperature}°C</span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Relative Humidity</span>
      <span class="weather-stat-value">${w.humidity}%</span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Wind Speed</span>
      <span class="weather-stat-value">${w.windSpeed} m/s</span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Solar / Exposure</span>
      <span class="weather-stat-value">${w.exposure}</span>
    </div>
    <div class="weather-stat">
      <span class="weather-stat-label">Data Status</span>
      <span class="weather-stat-value" style="font-size:13px;">Prototype Data</span>
    </div>
  `;
}

function setSegmentGroup(groupId, value) {
  const group = document.getElementById(groupId);
  group.querySelectorAll(".segment").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });
}

function animateNumber(el, target, decimals) {
  const start = 0;
  const duration = 700;
  const startTime = performance.now();
  function step(now) {
    const p = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = start + (target - start) * eased;
    el.textContent = val.toFixed(decimals);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function runAssessment() {
  const weather = locationData[state.location];
  const result = calculateHeatRisk(state, weather);
  const meta = riskMeta[result.riskLevel];

  document.getElementById("result-empty").classList.add("hidden");
  const resultBody = document.getElementById("result-body");
  resultBody.classList.remove("hidden");

  // Gauge arc: circumference of the arc path ~= 283
  const circumference = 283;
  const pct = meta.gaugePct;
  const arc = document.getElementById("gauge-arc");
  requestAnimationFrame(() => {
    arc.style.transition = "stroke-dashoffset 0.8s ease, stroke 0.3s ease";
    arc.setAttribute("stroke", meta.color);
    arc.style.strokeDashoffset = String(circumference * (1 - pct));
  });

  const chip = document.getElementById("risk-chip");
  chip.textContent = result.riskLevel;
  chip.className = "risk-chip " + meta.cls;
  document.getElementById("risk-title").textContent = meta.label;

  animateNumber(document.getElementById("wbgt-number"), result.estimatedWBGT, 1);

  document.getElementById("why-text").textContent = result.explanation;

  const actionList = document.getElementById("action-list");
  actionList.innerHTML = result.recommendations.map(r => `<li>${r}</li>`).join("");

  // Explainability
  document.getElementById("explain-panel").classList.remove("hidden");
  const bars = [
    { label: "Environmental Heat", pct: result.factors.environmental, tag: weather.exposure.toUpperCase() + " EXPOSURE" },
    { label: "Work Intensity", pct: result.factors.intensity, tag: state.intensity.toUpperCase() },
    { label: "Exposure Duration", pct: result.factors.exposure, tag: state.exposure.toUpperCase() },
    { label: "Hydration", pct: result.factors.hydration, tag: state.hydration.toUpperCase() },
    { label: "Acclimatization", pct: result.factors.acclimatization, tag: state.acclimatization.toUpperCase() }
  ];
  document.getElementById("explain-bars").innerHTML = bars.map(b => `
    <div class="explain-row">
      <span class="explain-label">${b.label}</span>
      <div class="explain-track"><div class="explain-fill" style="width:${b.pct}%; background:${meta.color};"></div></div>
      <span class="explain-value">${b.tag}</span>
    </div>
  `).join("");

  document.getElementById("drivers-list").innerHTML = result.drivers.map(d => `<li>${d}</li>`).join("");

  // Worker summary
  document.getElementById("summary-panel").classList.remove("hidden");
  const summaryItems = [
    { label: "Occupation", value: state.occupation },
    { label: "Location", value: state.location },
    { label: "Work Intensity", value: state.intensity },
    { label: "Exposure", value: state.exposure },
    { label: "Hydration", value: state.hydration },
    { label: "Acclimatization", value: state.acclimatization }
  ];
  document.getElementById("summary-grid").innerHTML = summaryItems.map(i => `
    <div class="summary-item">
      <span class="summary-label">${i.label}</span>
      <span class="summary-value">${i.value}</span>
    </div>
  `).join("");

  document.getElementById("result-panel").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* --------------------------------------------------------------------------
   6. LOCATION MAP (stylized SVG, no external map API)
   -------------------------------------------------------------------------- */
function buildMap() {
  const svg = document.getElementById("map-svg");
  const NS = "http://www.w3.org/2000/svg";

  function pathFor(order) {
    return order.map(name => {
      const l = locationData[name];
      return `${l.x},${l.y}`;
    }).join(" L ");
  }

  let html = "";
  html += `<path class="map-path" d="M ${pathFor(coastalOrder)}" />`;
  html += `<path class="map-path map-path-inland" d="M ${pathFor(inlandOrder)}" />`;
  html += `<path class="map-path map-path-inland" d="M ${pathFor(inlandBranch2)}" />`;

  Object.keys(locationData).forEach(name => {
    const l = locationData[name];
    const labelDx = l.region === "Inland" ? 12 : 12;
    html += `
      <g class="map-node" data-location="${name}" transform="translate(${l.x},${l.y})">
        <circle r="6"></circle>
        <text x="${labelDx}" y="4">${name}</text>
      </g>
    `;
  });

  svg.innerHTML = html;

  svg.querySelectorAll(".map-node").forEach(node => {
    node.addEventListener("click", () => {
      const name = node.dataset.location;
      svg.querySelectorAll(".map-node").forEach(n => n.classList.remove("active"));
      node.classList.add("active");
      showMapDetail(name);
      state.location = name;
      document.getElementById("location").value = name;
      renderWeatherPanel(name);
    });
  });
}

function showMapDetail(name) {
  const w = locationData[name];
  document.getElementById("map-detail-body").innerHTML = `
    <span class="map-detail-name">${name}</span>
    <p style="font-size:12.5px;color:var(--ink-faint);margin-top:4px;">${w.region} corridor</p>
    <div class="map-detail-stats" style="margin-top:14px;">
      <div class="map-detail-stat">
        <span class="weather-stat-label">Temperature</span>
        <span class="weather-stat-value">${w.temperature}°C</span>
      </div>
      <div class="map-detail-stat">
        <span class="weather-stat-label">Humidity</span>
        <span class="weather-stat-value">${w.humidity}%</span>
      </div>
      <div class="map-detail-stat">
        <span class="weather-stat-label">Wind</span>
        <span class="weather-stat-value">${w.windSpeed} m/s</span>
      </div>
      <div class="map-detail-stat">
        <span class="weather-stat-label">Solar Exposure</span>
        <span class="weather-stat-value">${w.exposure}</span>
      </div>
    </div>
  `;
}

/* --------------------------------------------------------------------------
   7. SUPERVISOR DASHBOARD — simulated crew, fictional IDs only
   -------------------------------------------------------------------------- */
const crew = [
  { id: "Worker 01", occupation: "Construction Worker",        location: "Udupi",          intensity: "Heavy",    exposure: "4–6 hours",  hydration: "Low",                    acclimatization: "Not Acclimatized" },
  { id: "Worker 02", occupation: "Road Worker",                 location: "Mangaluru",      intensity: "Moderate", exposure: "2–4 hours",  hydration: "Moderate",               acclimatization: "Acclimatized" },
  { id: "Worker 03", occupation: "Agricultural Worker",         location: "Kasaragod",      intensity: "Heavy",    exposure: "1–2 hours",  hydration: "Moderate",               acclimatization: "Acclimatized" },
  { id: "Worker 04", occupation: "Loading / Unloading Worker",  location: "Udupi",          intensity: "Heavy",    exposure: "> 6 hours",  hydration: "Low",                    acclimatization: "Not Acclimatized" },
  { id: "Worker 05", occupation: "Street Vendor",                location: "Kannur",         intensity: "Light",    exposure: "2–4 hours",  hydration: "Adequately Hydrated",    acclimatization: "Acclimatized" },
  { id: "Worker 06", occupation: "Delivery Worker",              location: "Manipal",        intensity: "Moderate", exposure: "1–2 hours",  hydration: "Adequately Hydrated",    acclimatization: "Acclimatized" },
  { id: "Worker 07", occupation: "Sanitation Worker",            location: "Mulki",          intensity: "Moderate", exposure: "4–6 hours",  hydration: "Moderate",               acclimatization: "Not Acclimatized" },
  { id: "Worker 08", occupation: "Landscaping Worker",           location: "Bengaluru",      intensity: "Light",    exposure: "< 1 hour",   hydration: "Adequately Hydrated",    acclimatization: "Acclimatized" },
  { id: "Worker 09", occupation: "Manual Labourer",              location: "Ullal",          intensity: "Heavy",    exposure: "2–4 hours",  hydration: "Moderate",               acclimatization: "Not Acclimatized" },
  { id: "Worker 10", occupation: "Fisher",                       location: "Kaup",           intensity: "Moderate", exposure: "1–2 hours",  hydration: "Adequately Hydrated",    acclimatization: "Acclimatized" },
  { id: "Worker 11", occupation: "Construction Worker",          location: "Hassan",         intensity: "Light",    exposure: "2–4 hours",  hydration: "Adequately Hydrated",    acclimatization: "Acclimatized" },
  { id: "Worker 12", occupation: "Road Worker",                  location: "Kanhangad",      intensity: "Heavy",    exposure: "4–6 hours",  hydration: "Low",                    acclimatization: "Not Acclimatized" }
];

function buildSupervisorDashboard() {
  const results = crew.map(w => {
    const weather = locationData[w.location];
    const r = calculateHeatRisk(w, weather);
    return { ...w, risk: r.riskLevel };
  });

  const counts = { GREEN: 0, YELLOW: 0, RED: 0 };
  results.forEach(r => counts[r.risk]++);

  // KPI cards
  document.getElementById("kpi-grid").innerHTML = `
    <div class="kpi-card"><div class="kpi-value">${results.length}</div><div class="kpi-label">Workers Assessed</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:var(--red)">${counts.RED}</div><div class="kpi-label">High Risk</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:var(--yellow)">${counts.YELLOW}</div><div class="kpi-label">Elevated Risk</div></div>
    <div class="kpi-card"><div class="kpi-value" style="color:var(--green)">${counts.GREEN}</div><div class="kpi-label">Lower Risk</div></div>
    <div class="kpi-card"><div class="kpi-value" style="font-size:19px;">${state.location}</div><div class="kpi-label">Current Location</div></div>
  `;

  // Table
  document.getElementById("crew-tbody").innerHTML = results.map(r => {
    const meta = riskMeta[r.risk];
    return `
      <tr>
        <td>${r.id}</td>
        <td>${r.occupation}</td>
        <td>${r.location}</td>
        <td>${r.intensity}</td>
        <td>${r.exposure}</td>
        <td><span class="risk-pill ${meta.cls}"><span class="risk-pill-dot ${meta.dot}"></span>${r.risk}</span></td>
      </tr>
    `;
  }).join("");

  // Donut chart
  buildDonut(counts);
}

function buildDonut(counts) {
  const total = counts.GREEN + counts.YELLOW + counts.RED;
  const svg = document.getElementById("donut-svg");
  const r = 60, cx = 80, cy = 80, circumference = 2 * Math.PI * r;

  const segments = [
    { key: "GREEN", value: counts.GREEN, color: "#1E8A5F" },
    { key: "YELLOW", value: counts.YELLOW, color: "#A87A0B" },
    { key: "RED", value: counts.RED, color: "#B23A3A" }
  ];

  let offsetAcc = 0;
  let circles = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#ECEFEE" stroke-width="18"></circle>`;
  segments.forEach(seg => {
    const frac = total ? seg.value / total : 0;
    const dash = frac * circumference;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="18"
      stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offsetAcc}"
      transform="rotate(-90 ${cx} ${cy})" stroke-linecap="butt"></circle>`;
    offsetAcc += dash;
  });
  circles += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Manrope, sans-serif" font-weight="800" font-size="22" fill="#12213B">${total}</text>`;
  circles += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="Inter, sans-serif" font-size="10" fill="#7C889A">WORKERS</text>`;
  svg.innerHTML = circles;

  document.getElementById("donut-legend").innerHTML = segments.map(seg => `
    <li>
      <span class="legend-key"><span class="legend-dot" style="background:${seg.color}"></span>${seg.key.charAt(0) + seg.key.slice(1).toLowerCase()}</span>
      <span>${seg.value}</span>
    </li>
  `).join("");
}

/* --------------------------------------------------------------------------
   8. EVENT WIRING
   -------------------------------------------------------------------------- */
function initEvents() {
  populateSelect("location", Object.keys(locationData));
  populateSelect("occupation", occupations.map(o => o.name));

  document.getElementById("location").value = state.location;
  document.getElementById("occupation").value = state.occupation;
  document.getElementById("exposure").value = state.exposure;
  setSegmentGroup("intensity-group", state.intensity);
  setSegmentGroup("hydration-group", state.hydration);
  setSegmentGroup("acclim-group", state.acclimatization);

  renderWeatherPanel(state.location);

  document.getElementById("location").addEventListener("change", e => {
    state.location = e.target.value;
    renderWeatherPanel(state.location);
    document.querySelectorAll("#map-svg .map-node").forEach(n => {
      n.classList.toggle("active", n.dataset.location === state.location);
    });
  });

  document.getElementById("occupation").addEventListener("change", e => {
    state.occupation = e.target.value;
  });

  document.getElementById("exposure").addEventListener("change", e => {
    state.exposure = e.target.value;
  });

  document.getElementById("intensity-group").addEventListener("click", e => {
    const btn = e.target.closest(".segment");
    if (!btn) return;
    state.intensity = btn.dataset.value;
    setSegmentGroup("intensity-group", state.intensity);
    document.getElementById("intensity-hint").textContent = INTENSITY_DESC[state.intensity];
  });

  document.getElementById("hydration-group").addEventListener("click", e => {
    const btn = e.target.closest(".segment");
    if (!btn) return;
    state.hydration = btn.dataset.value;
    setSegmentGroup("hydration-group", state.hydration);
  });

  document.getElementById("acclim-group").addEventListener("click", e => {
    const btn = e.target.closest(".segment");
    if (!btn) return;
    state.acclimatization = btn.dataset.value;
    setSegmentGroup("acclim-group", state.acclimatization);
  });

  document.getElementById("assess-btn").addEventListener("click", runAssessment);

  document.getElementById("intensity-hint").textContent = INTENSITY_DESC[state.intensity];

  // Mobile nav toggle
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("nav-open");
  });
  mainNav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mainNav.classList.remove("nav-open");
  }));
}

/* --------------------------------------------------------------------------
   9. INIT
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initEvents();
  buildMap();
  buildSupervisorDashboard();
});
