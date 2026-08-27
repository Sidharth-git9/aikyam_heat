/* ============================================================
   HEATSAFE — SHARED RISK ENGINE
   Deterministic, rule-based. Not AI. Not a medical diagnosis.
   Used identically by the Worker, Supervisor and Admin portals.
   ============================================================ */

/* Simplified representative heat-stress indicator (WBGT-style).
   This is a demonstration formula only — a real deployment would
   use a validated occupational heat-stress methodology. */
function hsComputeIndicator(weather) {
  const { temp, humidity, wind, solar } = weather;
  const solarBonus = solar === "High" ? 2 : solar === "Moderate" ? 1 : 0;
  const humidityFactor = 0.3 + 0.7 * (humidity / 100);
  const windCooling = wind * 0.3;
  const indicator = temp * humidityFactor - windCooling + solarBonus;
  return Math.round(indicator * 10) / 10;
}

function hsEnvScore(indicator) {
  if (indicator < 27.5) return { score: 0, level: "LOW" };
  if (indicator < 29.4) return { score: 15, level: "MODERATE" };
  if (indicator < 31.1) return { score: 25, level: "HIGH" };
  return { score: 35, level: "HIGH" };
}

function hsIntensityScore(intensity) {
  const map = { "Light": { score: 0, level: "LOW" }, "Moderate": { score: 12, level: "MODERATE" }, "Heavy": { score: 25, level: "HIGH" } };
  return map[intensity] || map["Moderate"];
}

function hsExposureScore(exposure) {
  const map = {
    "< 1 hour":   { score: 0,  level: "LOW" },
    "1–2 hours":  { score: 6,  level: "LOW" },
    "2–4 hours":  { score: 12, level: "MODERATE" },
    "4–6 hours":  { score: 18, level: "HIGH" },
    "6+ hours":   { score: 25, level: "HIGH" },
    "6 hours":    { score: 25, level: "HIGH" },
  };
  return map[exposure] || map["2–4 hours"];
}

function hsHydrationScore(hydration) {
  const map = {
    "Good":     { score: 0,  level: "LOW RISK" },
    "Moderate": { score: 8,  level: "MODERATE RISK" },
    "Low":      { score: 15, level: "HIGH RISK" },
  };
  return map[hydration] || map["Moderate"];
}

function hsAcclimScore(acclimatization) {
  return acclimatization === "Not Acclimatized" ? 5 : 0;
}

function hsClassifyRisk(score) {
  if (score >= 70) return "High";
  if (score >= 40) return "Elevated";
  return "Lower";
}

const HS_RISK_META = {
  "Lower":    { color: "green",  emoji: "🟢", label: "LOWER RISK" },
  "Elevated": { color: "yellow", emoji: "🟡", label: "ELEVATED RISK" },
  "High":     { color: "red",    emoji: "🔴", label: "HIGH RISK" },
};

/**
 * calculateHeatRisk(worker, weather)
 * worker: { occupation, intensity, exposure, hydration, acclimatization }
 * weather: { temp, humidity, wind, solar }
 * returns: { score, riskLevel, wbgt, explanation, recommendations, drivers }
 */
function calculateHeatRisk(worker, weather) {
  const wbgt = hsComputeIndicator(weather);
  const env = hsEnvScore(wbgt);
  const intensity = hsIntensityScore(worker.intensity);
  const exposure = hsExposureScore(worker.exposure);
  const hydration = hsHydrationScore(worker.hydration);
  const acclim = hsAcclimScore(worker.acclimatization);

  let score = env.score + intensity.score + exposure.score + hydration.score + acclim;
  score = Math.max(0, Math.min(100, score));

  const riskLevel = hsClassifyRisk(score);

  const explanation = [];
  if (env.level === "HIGH") explanation.push("High environmental heat");
  else if (env.level === "MODERATE") explanation.push("Moderate environmental heat");
  if (worker.intensity === "Heavy") explanation.push("Heavy physical work");
  else if (worker.intensity === "Moderate") explanation.push("Continuous physical work");
  if (worker.exposure === "4–6 hours" || worker.exposure === "6+ hours" || worker.exposure === "6 hours") explanation.push("Long exposure duration");
  else if (worker.exposure === "2–4 hours") explanation.push("Extended exposure duration");
  if (worker.hydration === "Low") explanation.push("Low hydration");
  else if (worker.hydration === "Moderate") explanation.push("Moderate hydration only");
  if (worker.acclimatization === "Not Acclimatized") explanation.push("Not yet heat-acclimatized");

  const recommendations = [];
  if (riskLevel === "High" || riskLevel === "Elevated") {
    recommendations.push({ title: "Take a rest break", detail: "Move to a shaded or cooler area." });
    recommendations.push({ title: "Drink water", detail: "Maintain regular hydration." });
  }
  if (riskLevel === "High") {
    recommendations.push({ title: "Reduce strenuous activity", detail: "Avoid prolonged heavy work during high heat." });
  } else if (riskLevel === "Elevated") {
    recommendations.push({ title: "Monitor closely", detail: "Watch for signs of fatigue and increase rest frequency." });
  } else {
    recommendations.push({ title: "Continue routine precautions", detail: "Maintain normal hydration and shade breaks." });
  }

  const drivers = [
    { label: "Environmental Heat", level: env.level },
    { label: "Work Intensity", level: intensity.level },
    { label: "Exposure", level: exposure.level },
    { label: "Hydration", level: hydration.level },
  ];

  return {
    score: Math.round(score),
    riskLevel,
    wbgt,
    explanation,
    recommendations,
    drivers,
  };
}

/* Convenience: compute risk for a worker object pulled from HS_WORKERS,
   automatically looking up that worker's location weather. */
function hsAssessWorker(worker) {
  const weather = hsGetWeather(worker.location);
  const result = calculateHeatRisk(worker, weather);
  return { ...result, weather };
}

/* Assess a list of workers at once. Returns array of { worker, assessment } */
function hsAssessWorkers(workerList) {
  return workerList.map(worker => ({ worker, assessment: hsAssessWorker(worker) }));
}

/* Derive a set of aggregate "Recommended Actions" panel items from a list
   of already-assessed workers. Used identically by the Supervisor and
   Admin portals so recommendations are always generated, never hardcoded. */
function hsAggregateRecommendations(assessedList) {
  const items = [];
  const highCount = assessedList.filter(a => a.assessment.riskLevel === "High").length;
  const elevatedCount = assessedList.filter(a => a.assessment.riskLevel === "Elevated").length;
  const lowHydrationCount = assessedList.filter(a => a.worker.hydration === "Low").length;
  const hotLocations = new Set(
    assessedList.filter(a => a.assessment.wbgt >= 29.4).map(a => a.worker.location)
  ).size;

  if (highCount > 0) items.push({ emoji: "🔴", text: `${highCount} worker${highCount === 1 ? "" : "s"} require immediate reassessment` });
  if (elevatedCount > 0) items.push({ emoji: "🟡", text: `${elevatedCount} worker${elevatedCount === 1 ? "" : "s"} should increase rest frequency` });
  if (lowHydrationCount > 0) items.push({ emoji: "💧", text: `${lowHydrationCount} worker${lowHydrationCount === 1 ? "" : "s"} have low hydration status` });
  if (hotLocations > 0) items.push({ emoji: "☀️", text: `High environmental heat at ${hotLocations} worksite${hotLocations === 1 ? "" : "s"}` });
  if (items.length === 0) items.push({ emoji: "🟢", text: "No elevated risks detected — conditions currently within safe limits" });

  return items;
}
