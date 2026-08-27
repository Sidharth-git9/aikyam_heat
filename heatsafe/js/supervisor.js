/* ============================================================
   HEATSAFE — SUPERVISOR PORTAL LOGIC
   ============================================================ */

const HS_SUPERVISOR_ID = "S-001";
const hsCrew = hsGetWorkersBySupervisor(HS_SUPERVISOR_ID);
const hsCrewAssessed = hsAssessWorkers(hsCrew);
const hsActionedWorkers = new Set();

/* ---------- Tabs ---------- */
document.querySelectorAll(".nav-tab").forEach(tab => {
  tab.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll(".nav-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".hs-tab-panel").forEach(p => p.classList.add("hs-hidden"));
    document.getElementById("tab-" + tab.dataset.tab).classList.remove("hs-hidden");
  });
});

/* ---------- Dashboard ---------- */
function hsRenderDashboard() {
  const lower = hsCrewAssessed.filter(a => a.assessment.riskLevel === "Lower").length;
  const elevated = hsCrewAssessed.filter(a => a.assessment.riskLevel === "Elevated").length;
  const high = hsCrewAssessed.filter(a => a.assessment.riskLevel === "High").length;

  const kpis = document.getElementById("dash-kpis");
  kpis.innerHTML = `
    <div class="hs-kpi"><div class="hs-kpi-label">Workers</div><div class="hs-kpi-value">${hsCrewAssessed.length}</div></div>
    <div class="hs-kpi risk-green"><div class="hs-kpi-label">🟢 Lower Risk</div><div class="hs-kpi-value">${lower}</div></div>
    <div class="hs-kpi risk-yellow"><div class="hs-kpi-label">🟡 Elevated</div><div class="hs-kpi-value">${elevated}</div></div>
    <div class="hs-kpi risk-red"><div class="hs-kpi-label">🔴 High Risk</div><div class="hs-kpi-value">${high}</div></div>
  `;

  const priority = [...hsCrewAssessed]
    .filter(a => a.assessment.riskLevel === "High")
    .sort((a, b) => b.assessment.score - a.assessment.score)
    .slice(0, 6);
  const tbody = document.querySelector("#dash-priority-table tbody");
  tbody.innerHTML = "";
  priority.forEach(a => {
    const meta = HS_RISK_META[a.assessment.riskLevel];
    const tr = document.createElement("tr");
    tr.className = "hs-row-click";
    tr.onclick = () => hsOpenWorkerDrawer(a.worker.id);
    tr.innerHTML = `
      <td><strong>${a.worker.id}</strong></td>
      <td>${a.worker.occupation}</td>
      <td>${a.worker.exposure}</td>
      <td>${a.worker.hydration}</td>
      <td><span class="hs-risk-badge ${meta.color}">${meta.emoji} ${a.assessment.riskLevel}</span></td>`;
    tbody.appendChild(tr);
  });
  if (priority.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--text-muted);">No high-risk workers currently.</td></tr>`;
  }

  hsRenderRecommendationsInto("dash-recommendations", 4);
}

/* ---------- Recommendations ---------- */
function hsRenderRecommendationsInto(elementId, limit) {
  const items = hsAggregateRecommendations(hsCrewAssessed);
  const list = limit ? items.slice(0, limit) : items;
  const wrap = document.getElementById(elementId);
  wrap.innerHTML = "";
  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "hs-reco-item";
    div.innerHTML = `<span class="hs-reco-emoji">${item.emoji}</span><span class="hs-reco-text">${item.text}</span>`;
    wrap.appendChild(div);
  });
}

/* ---------- Workers tab ---------- */
function hsRenderWorkersTab() {
  const query = (document.getElementById("workers-search").value || "").toLowerCase();
  const tbody = document.querySelector("#workers-table tbody");
  tbody.innerHTML = "";
  hsCrewAssessed
    .filter(a => a.worker.id.toLowerCase().includes(query) || a.worker.occupation.toLowerCase().includes(query))
    .forEach(a => {
      const meta = HS_RISK_META[a.assessment.riskLevel];
      const tr = document.createElement("tr");
      tr.className = "hs-row-click";
      tr.onclick = () => hsOpenWorkerDrawer(a.worker.id);
      tr.innerHTML = `
        <td><strong>${a.worker.id}</strong></td>
        <td>${a.worker.occupation}</td>
        <td>${a.worker.location}</td>
        <td>${a.worker.intensity}</td>
        <td>${a.worker.exposure}</td>
        <td>${a.worker.hydration}</td>
        <td><span class="hs-risk-badge ${meta.color}">${meta.emoji} ${a.assessment.riskLevel}</span></td>`;
      tbody.appendChild(tr);
    });
}

/* ---------- Risk Monitor tab ---------- */
function hsRecommendedActionText(riskLevel) {
  if (riskLevel === "High") return "Prioritize rest & hydration break";
  if (riskLevel === "Elevated") return "Increase rest frequency";
  return "Continue routine precautions";
}

function hsRenderRiskMonitor() {
  const tbody = document.querySelector("#riskmonitor-table tbody");
  tbody.innerHTML = "";
  const sorted = [...hsCrewAssessed].sort((a, b) => b.assessment.score - a.assessment.score);
  sorted.forEach(a => {
    const meta = HS_RISK_META[a.assessment.riskLevel];
    const tr = document.createElement("tr");
    tr.className = "hs-row-click";
    tr.onclick = () => hsOpenWorkerDrawer(a.worker.id);
    tr.innerHTML = `
      <td><strong>${a.worker.id}</strong></td>
      <td>${a.worker.occupation}</td>
      <td>${a.worker.location}</td>
      <td>${a.worker.intensity}</td>
      <td>${a.worker.exposure}</td>
      <td>${a.worker.hydration}</td>
      <td><span class="hs-risk-badge ${meta.color}">${meta.emoji} ${a.assessment.riskLevel}</span></td>
      <td>${hsRecommendedActionText(a.assessment.riskLevel)}</td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- Worker Detail Drawer ---------- */
function hsDriverBar(driver) {
  const levelClass = driver.level === "HIGH" || driver.level === "HIGH RISK" ? "high" : (driver.level === "MODERATE" || driver.level === "MODERATE RISK" ? "moderate" : "low");
  return `
    <div class="hs-driver-row">
      <div class="hs-driver-labels"><span>${driver.label}</span><span>${driver.level}</span></div>
      <div class="hs-driver-track"><div class="hs-driver-fill ${levelClass}"></div></div>
    </div>`;
}

function hsOpenWorkerDrawer(workerId) {
  const worker = hsGetWorker(workerId);
  const assessment = hsAssessWorker(worker);
  const meta = HS_RISK_META[assessment.riskLevel];
  const w = assessment.weather;

  const drawer = document.getElementById("worker-drawer");
  const actioned = hsActionedWorkers.has(workerId);

  drawer.innerHTML = `
    <button class="hs-drawer-close" onclick="hsCloseDrawer()">✕</button>
    <div class="hs-drawer-title">Worker ${worker.id}</div>
    <div class="hs-drawer-sub">${worker.occupation} · ${worker.location}</div>

    <div class="hs-drawer-section">
      <h5>Environmental Conditions</h5>
      <div class="hs-kv-grid">
        <div class="hs-kv"><div class="k">Temperature</div><div class="v">${w.temp}°C</div></div>
        <div class="hs-kv"><div class="k">Humidity</div><div class="v">${w.humidity}%</div></div>
        <div class="hs-kv"><div class="k">Wind</div><div class="v">${w.wind} m/s</div></div>
        <div class="hs-kv"><div class="k">Solar Exposure</div><div class="v">${w.solar}</div></div>
      </div>
    </div>

    <div class="hs-drawer-section">
      <h5>Work Conditions</h5>
      <div class="hs-kv-grid">
        <div class="hs-kv"><div class="k">Intensity</div><div class="v">${worker.intensity}</div></div>
        <div class="hs-kv"><div class="k">Exposure</div><div class="v">${worker.exposure}</div></div>
        <div class="hs-kv"><div class="k">Hydration</div><div class="v">${worker.hydration}</div></div>
        <div class="hs-kv"><div class="k">Acclimatization</div><div class="v">${worker.acclimatization}</div></div>
      </div>
    </div>

    <div class="hs-drawer-section">
      <h5>Risk</h5>
      <span class="hs-risk-badge ${meta.color}" style="font-size:14px; padding:8px 16px;">${meta.emoji} ${meta.label}</span>
      <div style="font-size:12.5px; color:var(--text-muted); margin-top:8px;">Estimated Heat-Stress Indicator: <strong>${assessment.wbgt}°C</strong> · Score ${assessment.score}/100</div>
    </div>

    <div class="hs-drawer-section">
      <h5>Main Risk Drivers</h5>
      ${assessment.drivers.map(hsDriverBar).join("")}
    </div>

    <div class="hs-drawer-section">
      <h5>Recommended Supervisor Action</h5>
      <p style="font-size:13.5px; color:var(--text-primary);">
        ${assessment.riskLevel === "High" ? "Prioritize a rest and hydration break. Consider reducing strenuous work during the current high-heat period." :
          assessment.riskLevel === "Elevated" ? "Encourage additional water breaks and monitor the worker through the shift." :
          "No immediate action required. Continue routine hydration and shade precautions."}
      </p>
      <button id="btn-mark-actioned" class="hs-btn hs-btn-primary hs-mt-16" onclick="hsMarkActioned('${worker.id}')" ${actioned ? "disabled" : ""}>MARK AS ACTIONED</button>
      <div id="actioned-banner" class="hs-actioned-banner ${actioned ? "show" : ""}">✓ Action recorded</div>
    </div>
  `;

  document.getElementById("worker-drawer-overlay").classList.add("open");
}

function hsMarkActioned(workerId) {
  hsActionedWorkers.add(workerId);
  document.getElementById("btn-mark-actioned").disabled = true;
  document.getElementById("actioned-banner").classList.add("show");
}

function hsCloseDrawer() {
  document.getElementById("worker-drawer-overlay").classList.remove("open");
}
function hsCloseDrawerOnBg(e) {
  if (e.target.id === "worker-drawer-overlay") hsCloseDrawer();
}

/* ---------- Worksite Map ---------- */
function hsLocationRiskSummary(locationName) {
  const workersHere = HS_WORKERS.filter(w => w.location === locationName);
  const assessed = hsAssessWorkers(workersHere);
  const green = assessed.filter(a => a.assessment.riskLevel === "Lower").length;
  const yellow = assessed.filter(a => a.assessment.riskLevel === "Elevated").length;
  const red = assessed.filter(a => a.assessment.riskLevel === "High").length;
  let overall = "green";
  if (red >= yellow && red >= green && red > 0) overall = "red";
  else if (yellow >= green) overall = "yellow";
  return { workersHere, green, yellow, red, overall, total: assessed.length };
}

function hsRenderMap() {
  const mapCard = document.getElementById("map-card");
  mapCard.innerHTML = `
    <div class="hs-map-zone-label" style="left:6%; top:2%;">Coastal Belt</div>
    <div class="hs-map-zone-label" style="left:56%; top:14%;">Inland Corridor</div>
  `;
  HS_LOCATIONS.forEach(loc => {
    const pos = HS_MAP_POSITIONS[loc.name];
    const summary = hsLocationRiskSummary(loc.name);
    const marker = document.createElement("div");
    marker.className = "hs-map-marker";
    marker.style.left = pos.x + "%";
    marker.style.top = pos.y + "%";
    marker.onclick = () => hsOpenLocationDrawer(loc.name);
    marker.innerHTML = `<div class="dot ${summary.overall}"></div><div class="name">${loc.name}</div>`;
    mapCard.appendChild(marker);
  });
}

function hsOpenLocationDrawer(locationName) {
  const weather = hsGetWeather(locationName);
  const summary = hsLocationRiskSummary(locationName);
  const drawer = document.getElementById("location-drawer");
  drawer.innerHTML = `
    <button class="hs-drawer-close" onclick="hsCloseLocationDrawer()">✕</button>
    <div class="hs-drawer-title">${locationName}</div>
    <div class="hs-drawer-sub">${weather.zone}</div>

    <div class="hs-drawer-section">
      <h5>Representative Weather</h5>
      <div class="hs-kv-grid">
        <div class="hs-kv"><div class="k">Temperature</div><div class="v">${weather.temp}°C</div></div>
        <div class="hs-kv"><div class="k">Humidity</div><div class="v">${weather.humidity}%</div></div>
        <div class="hs-kv"><div class="k">Wind</div><div class="v">${weather.wind} m/s</div></div>
        <div class="hs-kv"><div class="k">Solar Exposure</div><div class="v">${weather.solar}</div></div>
      </div>
    </div>

    <div class="hs-drawer-section">
      <h5>Workers at this Location</h5>
      <div class="hs-kv-grid">
        <div class="hs-kv"><div class="k">Total Workers</div><div class="v">${summary.total}</div></div>
        <div class="hs-kv"><div class="k">High Risk</div><div class="v">${summary.red}</div></div>
      </div>
    </div>

    <div class="hs-drawer-section">
      <h5>Risk Distribution</h5>
      <div class="hs-donut-legend">
        <div class="item"><span class="left"><span class="hs-dot green"></span>Lower Risk</span><span>${summary.green}</span></div>
        <div class="item"><span class="left"><span class="hs-dot yellow"></span>Elevated</span><span>${summary.yellow}</span></div>
        <div class="item"><span class="left"><span class="hs-dot red"></span>High Risk</span><span>${summary.red}</span></div>
      </div>
    </div>
  `;
  document.getElementById("location-drawer-overlay").classList.add("open");
}
function hsCloseLocationDrawer() {
  document.getElementById("location-drawer-overlay").classList.remove("open");
}
function hsCloseLocationDrawerOnBg(e) {
  if (e.target.id === "location-drawer-overlay") hsCloseLocationDrawer();
}

/* ---------- Recommendations tab (full panel) ---------- */
function hsRenderFullRecommendations() {
  hsRenderRecommendationsInto("reco-full-panel", null);
}

/* ---------- Init ---------- */
hsRenderDashboard();
hsRenderWorkersTab();
hsRenderRiskMonitor();
hsRenderMap();
hsRenderFullRecommendations();
