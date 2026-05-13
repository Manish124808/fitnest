/**
 * healthConnectReader.js
 * ─────────────────────────────────────────────────────────────────
 * Reads today's health data from the Health Connect Web Bridge
 * (navigator.health) on Android 13+.
 *
 * This module is a plain JS utility — no React — so it can be
 * imported from both components and the Dashboard auto-sync effect
 * without creating circular dependencies.
 */

/**
 * Returns true when the Health Connect Web Bridge is available
 * (Chrome on Android with Health Connect installed).
 */
export function isHealthConnectAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.health;
}

/**
 * Request permissions and read all supported health data types for today.
 * Returns a flat object ready to POST to /api/healthconnect/sync.
 *
 * @throws {Error} if Health Connect is unavailable or permissions are denied.
 */
export async function readHealthConnectData() {
  if (!isHealthConnectAvailable()) {
    throw new Error('Health Connect Web Bridge is not available. Open FitNest in Chrome on Android with Health Connect installed.');
  }

  const health = navigator.health;

  const permissions = [
    { healthDataType: 'steps',             accessType: 'read' },
    { healthDataType: 'active_calories',   accessType: 'read' },
    { healthDataType: 'distance',          accessType: 'read' },
    { healthDataType: 'heart_rate',        accessType: 'read' },
    { healthDataType: 'sleep',             accessType: 'read' },
    { healthDataType: 'weight',            accessType: 'read' },
    { healthDataType: 'oxygen_saturation', accessType: 'read' },
    { healthDataType: 'exercise',          accessType: 'read' },
  ];

  let granted = [];
  try {
    granted = await health.requestPermission(permissions);
  } catch (e) {
    throw new Error('Health Connect permissions denied. Open the Health Connect app and grant FitNest access.');
  }

  // grantedTypes may be an array of strings or objects
  const grantedTypes = new Set(
    Array.isArray(granted) ? granted.map(p => (typeof p === 'string' ? p : p?.healthDataType)) : []
  );

  const safe = async (fn) => { try { return await fn(); } catch { return null; } };

  const now   = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const startTime = start.toISOString();
  const endTime   = now.toISOString();

  // ── Steps ────────────────────────────────────────────────────
  let steps = 0;
  if (!grantedTypes.size || grantedTypes.has('steps')) {
    const r = await safe(() => health.aggregate({ healthDataTypes: ['steps'], aggregationType: 'sum', startTime, endTime }));
    steps = r?.steps ?? r?.data?.steps ?? 0;
  }

  // ── Calories ─────────────────────────────────────────────────
  let caloriesBurned = 0;
  if (!grantedTypes.size || grantedTypes.has('active_calories')) {
    const r = await safe(() => health.aggregate({ healthDataTypes: ['active_calories'], aggregationType: 'sum', startTime, endTime }));
    caloriesBurned = r?.active_calories ?? r?.data?.active_calories ?? 0;
  }

  // ── Distance (metres) ────────────────────────────────────────
  let distance = 0;
  if (!grantedTypes.size || grantedTypes.has('distance')) {
    const r = await safe(() => health.aggregate({ healthDataTypes: ['distance'], aggregationType: 'sum', startTime, endTime }));
    distance = r?.distance ?? r?.data?.distance ?? 0;
  }

  // ── Exercise sessions → active minutes ───────────────────────
  let activeMinutes = 0;
  let workoutSessions = [];
  if (!grantedTypes.size || grantedTypes.has('exercise')) {
    const r = await safe(() => health.query({ healthDataType: 'exercise', startTime, endTime }));
    const sessions = r?.data ?? r ?? [];
    if (Array.isArray(sessions)) {
      workoutSessions = sessions.slice(0, 20).map(s => ({
        type:        s.exerciseType ?? s.type ?? 'Unknown',
        startTimeMs: new Date(s.startTime ?? s.startDate ?? startTime).getTime(),
        endTimeMs:   new Date(s.endTime   ?? s.endDate   ?? endTime).getTime(),
        calories:    s.totalEnergyBurned ?? s.calories ?? 0,
      }));
      activeMinutes = workoutSessions.reduce((acc, s) =>
        acc + Math.round((s.endTimeMs - s.startTimeMs) / 60000), 0);
    }
  }

  // ── Heart rate ───────────────────────────────────────────────
  let heartRate = 0;
  if (!grantedTypes.size || grantedTypes.has('heart_rate')) {
    const r = await safe(() => health.aggregate({ healthDataTypes: ['heart_rate'], aggregationType: 'average', startTime, endTime }));
    heartRate = Math.round(r?.heart_rate ?? r?.data?.heart_rate ?? 0);
  }

  // ── Sleep (yesterday 20:00 → today 12:00) ───────────────────
  let sleep = 0;
  if (!grantedTypes.size || grantedTypes.has('sleep')) {
    const sleepStart = new Date(start); sleepStart.setDate(sleepStart.getDate() - 1); sleepStart.setHours(20, 0, 0, 0);
    const sleepEnd   = new Date(start); sleepEnd.setHours(12, 0, 0, 0);
    const r = await safe(() => health.aggregate({
      healthDataTypes: ['sleep'], aggregationType: 'sum',
      startTime: sleepStart.toISOString(), endTime: sleepEnd.toISOString(),
    }));
    const raw = r?.sleep ?? r?.data?.sleep ?? 0;
    // Health Connect may return ms or hours depending on OS/library version
    sleep = raw > 1000 ? Math.round((raw / 3600000) * 10) / 10 : Math.round(raw * 10) / 10;
  }

  // ── Weight (last 30 days average) ────────────────────────────
  let weight = 0;
  if (!grantedTypes.size || grantedTypes.has('weight')) {
    const wStart = new Date(now); wStart.setDate(wStart.getDate() - 30);
    const r = await safe(() => health.aggregate({
      healthDataTypes: ['weight'], aggregationType: 'average',
      startTime: wStart.toISOString(), endTime,
    }));
    weight = Math.round((r?.weight ?? r?.data?.weight ?? 0) * 10) / 10;
  }

  // ── SpO2 ─────────────────────────────────────────────────────
  let spo2 = 0;
  if (!grantedTypes.size || grantedTypes.has('oxygen_saturation')) {
    const r = await safe(() => health.aggregate({ healthDataTypes: ['oxygen_saturation'], aggregationType: 'average', startTime, endTime }));
    const raw = r?.oxygen_saturation ?? r?.data?.oxygen_saturation ?? 0;
    spo2 = Math.round(raw * 100) || 0;
    if (spo2 > 0 && spo2 <= 1) spo2 = Math.round(spo2 * 100); // fraction → percent
  }

  return { steps, caloriesBurned, distance, activeMinutes, heartRate, sleep, weight, spo2, workoutSessions };
}
