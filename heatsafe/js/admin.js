/* ============================================================
   HEATSAFE — ADMIN PORTAL LOGIC
   ============================================================ */

const hsAllAssessed = hsAssessWorkers(HS_WORKERS);

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

/* ---------- Overview ---------- */
function hsRenderOverview() {
  const lower = hsAllAssessed.filter(a => a.assessment.riskLevel === "Lower").length;
  const elevated = hsAllAssessed.filter(a => a.assessment.riskLevel === "Elevated").length;
  const high = hsAllAssessed.filter(a => a.assessment.riskLevel === "High").length;

  const kpis = document.getElementById("overview-kpis");
  kpis.innerHTML = `
    <div class="hs-kpi"><div class="hs-kpi-label">Active Locations</div><div class="hs-kpi-value">${HS_LOCATIONS.length}</div></div>
    <div class="hs-kpi"><div class="hs-kpi-label">Workers</div><div class="hs-kpi-value">${HS_WORKERS.length}</div></div>
    <div class="hs-kpi"><div class="hs-kpi-label">Supervisors</div><div class="hs-kpi-value">${HS_SUPERVISORS.length}</div></div>
    <div class="hs-kpi risk-red"><div class="hs-kpi-label">High-Risk Workers</div><div class="hs-kpi-value">${high}</div></div>
    <div class="hs-kpi risk-yellow"><div class="hs-kpi-label">Elevated Risk</div><div class="hs-kpi-value">${elevated}</div></div>
    <div class="hs-kpi risk-green"><div class="hs-kpi-label">Lower Risk</div><div class="hs-kpi-value">${lower}</div></div>
  `;

  const locStats = HS_LOCATIONS.map(loc => hsLocationStats(loc.name)).sort((a, b) => b.red - a.red).slice(0, 6);
  const topWrap = document.getElementById("overview-top-locations");
  topWrap.innerHTML = "";
  locStats.forEach(stat => {
    const div = document.createElement("div");
    div.className = "hs-reco-item";
    div.innerHTML = `<span class="hs-reco-emoji">📍</span><span class="hs-reco-text">${stat.name} — ${stat.red} high risk of ${stat.total} workers</span>`;
    topWrap.appendChild(div);
  });

  hsRenderRecommendationsInto("overview-recommendations", hsAllAssessed, null);
}

function hsRenderRecommendationsInto(elementId, assessedList, limit) {
  const items = hsAggregateRecommendations(assessedList);
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

/* ---------- Shared location stats helper ---------- */
function hsLocationStats(locationName) {
  const workersHere = HS_WORKERS.filter(w => w.location === locationName);
  const assessed = hsAssessWorkers(workersHere);
  const green = assessed.filter(a => a.assessment.riskLevel === "Lower").length;
  const yellow = assessed.filter(a => a.assessment.riskLevel === "Elevated").length;
  const red = assessed.filter(a => a.assessment.riskLevel === "High").length;
  const avgScore = assessed.length ? Math.round(assessed.reduce((s, a) => s + a.assessment.score, 0) / assessed.length) : 0;
  let status = "green";
  if (red >= yellow && red >= green && red > 0) status = "red";
  else if (yellow >= green) status = "yellow";
  return { name: locationName, total: assessed.length, green, yellow, red, avgScore, status };
}

/* ---------- Locations table ---------- */
function hsRenderLocationsTable() {
  const tbody = document.querySelector("#locations-table tbody");
  tbody.innerHTML = "";
  HS_LOCATIONS.forEach(loc => {
    const stat = hsLocationStats(loc.name);
    const meta = HS_RISK_META[stat.status === "red" ? "High" : stat.status === "yellow" ? "Elevated" : "Lower"];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${loc.name}</strong></td>
      <td>${loc.zone}</td>
      <td>${stat.total}</td>
      <td>${stat.green}</td>
      <td>${stat.yellow}</td>
      <td>${stat.red}</td>
      <td><span class="hs-risk-badge ${meta.color}">${meta.emoji} ${stat.status === "red" ? "High" : stat.status === "yellow" ? "Elevated" : "Lower"}</span></td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- Worker Directory ---------- */
function hsRenderAdminWorkers() {
  const query = (document.getElementById("admin-worker-search").value || "").toLowerCase();
  const riskFilter = document.getElementById("admin-risk-filter").value;
  const tbody = document.querySelector("#admin-workers-table tbody");
  tbody.innerHTML = "";

  hsAllAssessed
    .filter(a => {
      const matchesQuery = !query ||
        a.worker.id.toLowerCase().includes(query) ||
        a.worker.occupation.toLowerCase().includes(query) ||
        a.worker.location.toLowerCase().includes(query);
      const matchesRisk = !riskFilter || a.assessment.riskLevel === riskFilter;
      return matchesQuery && matchesRisk;
    })
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

/* ---------- Worker Detail Drawer (mirrors Supervisor Portal) ---------- */
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
  const supervisor = HS_SUPERVISORS.find(s => s.id === worker.supervisorId);

  const drawer = document.getElementById("worker-drawer");
  drawer.innerHTML = `
    <button class="hs-drawer-close" onclick="hsCloseDrawer()">✕</button>
    <div class="hs-drawer-title">Worker ${worker.id}</div>
    <div class="hs-drawer-sub">${worker.occupation} · ${worker.location} · Supervised by ${supervisor ? supervisor.name : "—"}</div>

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
  `;
  document.getElementById("worker-drawer-overlay").classList.add("open");
}
function hsCloseDrawer() {
  document.getElementById("worker-drawer-overlay").classList.remove("open");
}
function hsCloseDrawerOnBg(e) {
  if (e.target.id === "worker-drawer-overlay") hsCloseDrawer();
}

/* ---------- Supervisors table ---------- */
function hsRenderSupervisorsTable() {
  const tbody = document.querySelector("#supervisors-table tbody");
  tbody.innerHTML = "";
  HS_SUPERVISORS.forEach(sup => {
    const crew = hsAssessWorkers(hsGetWorkersBySupervisor(sup.id));
    const green = crew.filter(a => a.assessment.riskLevel === "Lower").length;
    const yellow = crew.filter(a => a.assessment.riskLevel === "Elevated").length;
    const red = crew.filter(a => a.assessment.riskLevel === "High").length;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${sup.name}</strong> <span style="color:var(--text-muted); font-size:12px;">(${sup.id})</span></td>
      <td>${sup.site}</td>
      <td>${crew.length}</td>
      <td>${green}</td>
      <td>${yellow}</td>
      <td>${red}</td>`;
    tbody.appendChild(tr);
  });
}

/* ---------- Analytics: donut ---------- */
function hsRenderDonut() {
  const lower = hsAllAssessed.filter(a => a.assessment.riskLevel === "Lower").length;
  const elevated = hsAllAssessed.filter(a => a.assessment.riskLevel === "Elevated").length;
  const high = hsAllAssessed.filter(a => a.assessment.riskLevel === "High").length;
  const total = lower + elevated + high;

  const segments = [
    { value: lower, color: "#17924F" },
    { value: elevated, color: "#B4790A" },
    { value: high, color: "#C22A2A" },
  ];

  const svg = document.getElementById("donut-svg");
  const cx = 90, cy = 90, r = 70, strokeWidth = 26;
  const circumference = 2 * Math.PI * r;
  let offsetAccum = 0;
  let paths = "";
  segments.forEach(seg => {
    const fraction = total ? seg.value / total : 0;
    const dash = fraction * circumference;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" stroke-width="${strokeWidth}"
      stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offsetAccum}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offsetAccum += dash;
  });
  svg.innerHTML = paths + `<text x="90" y="85" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="26" fill="#0F2138">${total}</text>
    <text x="90" y="104" text-anchor="middle" font-family="Inter" font-size="11" fill="#8592A3">WORKERS</text>`;

  document.getElementById("donut-legend").innerHTML = `
    <div class="item"><span class="left"><span class="hs-dot green"></span>Lower Risk</span><span>${lower}</span></div>
    <div class="item"><span class="left"><span class="hs-dot yellow"></span>Elevated Risk</span><span>${elevated}</span></div>
    <div class="item"><span class="left"><span class="hs-dot red"></span>High Risk</span><span>${high}</span></div>
  `;
}

/* ---------- Analytics: occupation bars ---------- */
function hsRenderOccupationBars() {
  const counts = {};
  HS_OCCUPATIONS.forEach(o => counts[o] = 0);
  HS_WORKERS.forEach(w => counts[w.occupation] = (counts[w.occupation] || 0) + 1);
  const max = Math.max(...Object.values(counts), 1);

  const wrap = document.getElementById("occupation-bars");
  wrap.innerHTML = "";
  HS_OCCUPATIONS.forEach(occ => {
    const count = counts[occ];
    const pct = (count / max) * 100;
    const row = document.createElement("div");
    row.className = "hs-bar-row";
    row.innerHTML = `
      <div class="hs-bar-label">${occ}</div>
      <div class="hs-bar-track"><div class="hs-bar-fill" style="width:${pct}%; background:var(--accent);"></div></div>
      <div class="hs-bar-value">${count}</div>`;
    wrap.appendChild(row);
  });
}

/* ---------- Analytics: location risk bars ---------- */
function hsRenderLocationBars() {
  const stats = HS_LOCATIONS.map(loc => hsLocationStats(loc.name)).sort((a, b) => b.avgScore - a.avgScore);
  const wrap = document.getElementById("location-bars");
  wrap.innerHTML = "";
  stats.forEach(stat => {
    const color = stat.status === "red" ? "#C22A2A" : stat.status === "yellow" ? "#B4790A" : "#17924F";
    const row = document.createElement("div");
    row.className = "hs-bar-row";
    row.innerHTML = `
      <div class="hs-bar-label">${stat.name}</div>
      <div class="hs-bar-track"><div class="hs-bar-fill" style="width:${stat.avgScore}%; background:${color};"></div></div>
      <div class="hs-bar-value">${stat.avgScore}</div>`;
    wrap.appendChild(row);
  });
}

/* ---------- Init ---------- */
hsRenderOverview();
hsRenderLocationsTable();
hsRenderAdminWorkers();
hsRenderSupervisorsTable();
hsRenderDonut();
hsRenderOccupationBars();
hsRenderLocationBars();
