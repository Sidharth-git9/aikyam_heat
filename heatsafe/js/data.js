/* ============================================================
   HEATSAFE — SHARED PROTOTYPE DATASET
   All representative / fictional. No live data. No real people.
   ============================================================ */

/* ---------- 1. LOCATIONS + REPRESENTATIVE WEATHER ---------- */
/* zone: "Coastal Belt" | "Inland Corridor"                    */
const HS_LOCATIONS = [
  { name: "Kundapura",      zone: "Coastal Belt",   temp: 33, humidity: 82, wind: 3.1, solar: "High" },
  { name: "Udupi",          zone: "Coastal Belt",   temp: 35, humidity: 72, wind: 2.5, solar: "High" },
  { name: "Manipal",        zone: "Coastal Belt",   temp: 34, humidity: 70, wind: 2.3, solar: "High" },
  { name: "Kaup",           zone: "Coastal Belt",   temp: 34, humidity: 80, wind: 3.4, solar: "High" },
  { name: "Mulki",          zone: "Coastal Belt",   temp: 33, humidity: 78, wind: 3.0, solar: "High" },
  { name: "Mangaluru",      zone: "Coastal Belt",   temp: 35, humidity: 79, wind: 2.8, solar: "High" },
  { name: "Ullal",          zone: "Coastal Belt",   temp: 34, humidity: 81, wind: 3.2, solar: "High" },
  { name: "Kasaragod",      zone: "Coastal Belt",   temp: 33, humidity: 83, wind: 2.9, solar: "High" },
  { name: "Kanhangad",      zone: "Coastal Belt",   temp: 33, humidity: 82, wind: 2.7, solar: "Moderate" },
  { name: "Payyanur",       zone: "Coastal Belt",   temp: 32, humidity: 84, wind: 2.6, solar: "Moderate" },
  { name: "Kannur",         zone: "Coastal Belt",   temp: 32, humidity: 80, wind: 3.3, solar: "Moderate" },
  { name: "Sakleshpur",     zone: "Inland Corridor",temp: 27, humidity: 68, wind: 1.6, solar: "Moderate" },
  { name: "Hassan",         zone: "Inland Corridor",temp: 30, humidity: 55, wind: 2.0, solar: "High" },
  { name: "Chikkamagaluru", zone: "Inland Corridor",temp: 28, humidity: 62, wind: 1.8, solar: "Moderate" },
  { name: "Bengaluru",      zone: "Inland Corridor",temp: 29, humidity: 52, wind: 2.4, solar: "Moderate" },
];

const HS_LOCATION_NAMES = HS_LOCATIONS.map(l => l.name);

function hsGetWeather(locationName) {
  return HS_LOCATIONS.find(l => l.name === locationName) || HS_LOCATIONS[1];
}

/* ---------- 2. OCCUPATIONS ---------- */
const HS_OCCUPATIONS = [
  "Construction Worker",
  "Road Worker",
  "Agricultural Worker",
  "Fisher",
  "Loading / Unloading Worker",
  "Street Vendor",
  "Delivery Worker",
  "Sanitation Worker",
  "Landscaping Worker",
  "Manual Labourer",
];

const HS_INTENSITIES = ["Light", "Moderate", "Heavy"];
const HS_EXPOSURES = ["< 1 hour", "1–2 hours", "2–4 hours", "4–6 hours", "6+ hours"];
const HS_HYDRATION = ["Good", "Moderate", "Low"];
const HS_ACCLIMATIZATION = ["Acclimatized", "Not Acclimatized"];

/* ---------- 3. SUPERVISORS ---------- */
const HS_SUPERVISORS = [
  { id: "S-001", name: "Supervisor 1",  site: "Udupi Coastal Zone" },
  { id: "S-002", name: "Supervisor 2",  site: "Mangaluru Port Corridor" },
  { id: "S-003", name: "Supervisor 3",  site: "Manipal Construction Belt" },
  { id: "S-004", name: "Supervisor 4",  site: "Kundapura Fishing Harbour" },
  { id: "S-005", name: "Supervisor 5",  site: "Kaup–Mulki Roadworks" },
  { id: "S-006", name: "Supervisor 6",  site: "Ullal Coastal Works" },
  { id: "S-007", name: "Supervisor 7",  site: "Kasaragod Agri Belt" },
  { id: "S-008", name: "Supervisor 8",  site: "Kanhangad Sanitation Zone" },
  { id: "S-009", name: "Supervisor 9",  site: "Payyanur–Kannur Corridor" },
  { id: "S-010", name: "Supervisor 10", site: "Sakleshpur Plantation Zone" },
  { id: "S-011", name: "Supervisor 11", site: "Hassan–Chikkamagaluru Works" },
  { id: "S-012", name: "Supervisor 12", site: "Bengaluru Urban Sites" },
];

/* ---------- 4. WORKER DATASET (GENERATED, DETERMINISTIC) ----------
   ~120 fictional workers. No real names — IDs only.
   The first 24 workers belong to S-001 (Udupi Coastal Zone) and are
   used to drive the Supervisor Portal demo. Worker slots 1–5 are
   hand-set to match the SIH demo script exactly.
------------------------------------------------------------------ */
function hsGenerateWorkers(total = 120) {
  const workers = [];

  // Hand-set demo workers for the Supervisor Portal walkthrough (W-001..W-005)
  const demoWorkers = [
    { occupation: "Construction Worker",         location: "Udupi", intensity: "Heavy",    exposure: "4–6 hours", hydration: "Low",      acclimatization: "Not Acclimatized" },
    { occupation: "Road Worker",                 location: "Udupi", intensity: "Moderate", exposure: "2–4 hours", hydration: "Moderate", acclimatization: "Acclimatized" },
    { occupation: "Agricultural Worker",         location: "Udupi", intensity: "Heavy",    exposure: "1–2 hours", hydration: "Good",     acclimatization: "Not Acclimatized" },
    { occupation: "Loading / Unloading Worker",  location: "Udupi", intensity: "Heavy",    exposure: "4–6 hours", hydration: "Low",      acclimatization: "Not Acclimatized" },
    { occupation: "Street Vendor",               location: "Udupi", intensity: "Light",    exposure: "1–2 hours", hydration: "Good",     acclimatization: "Acclimatized" },
  ];

  demoWorkers.forEach((w, i) => {
    workers.push({
      id: `W-${String(i + 1).padStart(3, "0")}`,
      ...w,
      supervisorId: "S-001",
    });
  });

  // Fill remaining workers deterministically (no Math.random — reproducible demo)
  for (let i = workers.length; i < total; i++) {
    const occupation = HS_OCCUPATIONS[(i * 3 + 1) % HS_OCCUPATIONS.length];
    const location = HS_LOCATION_NAMES[i % HS_LOCATION_NAMES.length];
    const intensity = HS_INTENSITIES[(i * 2) % HS_INTENSITIES.length];
    const exposure = HS_EXPOSURES[(i * 5 + 2) % HS_EXPOSURES.length];
    const hydration = HS_HYDRATION[(i * 7 + 1) % HS_HYDRATION.length];
    const acclimatization = HS_ACCLIMATIZATION[(i * 11) % HS_ACCLIMATIZATION.length];

    // Supervisor assignment: first 24 -> S-001, remainder split across the other 11
    let supervisorId;
    if (i < 24) {
      supervisorId = "S-001";
    } else {
      const others = HS_SUPERVISORS.slice(1);
      supervisorId = others[(i - 24) % others.length].id;
    }

    workers.push({
      id: `W-${String(i + 1).padStart(3, "0")}`,
      occupation,
      location,
      intensity,
      exposure,
      hydration,
      acclimatization,
      supervisorId,
    });
  }

  return workers;
}

const HS_WORKERS = hsGenerateWorkers(120);

function hsGetWorker(id) {
  return HS_WORKERS.find(w => w.id === id);
}

function hsGetWorkersBySupervisor(supervisorId) {
  return HS_WORKERS.filter(w => w.supervisorId === supervisorId);
}

/* ---------- 4b. STYLIZED MAP POSITIONS (percent-based, shared) ---------- */
const HS_MAP_POSITIONS = {
  "Kundapura":      { x: 16, y: 8   },
  "Udupi":          { x: 20, y: 16.4 },
  "Manipal":        { x: 15, y: 24.8 },
  "Kaup":           { x: 19, y: 33.2 },
  "Mulki":          { x: 15, y: 41.6 },
  "Mangaluru":      { x: 20, y: 50   },
  "Ullal":          { x: 15, y: 58.4 },
  "Kasaragod":      { x: 19, y: 66.8 },
  "Kanhangad":      { x: 15, y: 75.2 },
  "Payyanur":       { x: 20, y: 83.6 },
  "Kannur":         { x: 15, y: 92   },
  "Sakleshpur":     { x: 55, y: 26   },
  "Hassan":         { x: 68, y: 42   },
  "Chikkamagaluru": { x: 56, y: 58   },
  "Bengaluru":      { x: 78, y: 76   },
};

/* ---------- 5. WORKER HISTORY (fictional, for Worker Portal) ---------- */
const HS_WORKER_HISTORY = [
  { date: "Today",   location: "Udupi",   riskLevel: "High" },
  { date: "Yesterday", location: "Udupi", riskLevel: "Elevated" },
  { date: "Aug 25",  location: "Manipal", riskLevel: "Lower" },
  { date: "Aug 24",  location: "Manipal", riskLevel: "Lower" },
  { date: "Aug 22",  location: "Udupi",   riskLevel: "Elevated" },
];
