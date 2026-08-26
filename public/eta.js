// ============================================================
// ETA ALGORITHM
// ============================================================
// Calculates Estimated Time of Arrival based on:
//   - distance (km)
//   - average speed (km/h)
//   - traffic condition multiplier
//
// Formula:
//   baseTimeHours = distance / speed
//   adjustedTimeHours = baseTimeHours * trafficMultiplier
//   etaMinutes = adjustedTimeHours * 60
// ============================================================

const TRAFFIC_MULTIPLIERS = {
  low: 1.0,      // no extra delay
  medium: 1.3,   // 30% slower
  high: 1.7,     // 70% slower
};

/**
 * Calculates ETA in minutes and the arrival clock time.
 * @param {Object} params
 * @param {number} params.distanceKm
 * @param {number} params.speedKmh
 * @param {string} params.traffic - "low" | "medium" | "high"
 * @param {Date} [params.startTime] - defaults to now
 * @returns {{ minutes: number, arrival: Date, multiplier: number }}
 */
function calculateETA({ distanceKm, speedKmh, traffic, startTime = new Date() }) {
  if (distanceKm <= 0 || speedKmh <= 0) {
    throw new Error("Distance and speed must be greater than 0.");
  }

  const multiplier = TRAFFIC_MULTIPLIERS[traffic] ?? TRAFFIC_MULTIPLIERS.medium;

  const baseTimeHours = distanceKm / speedKmh;
  const adjustedTimeHours = baseTimeHours * multiplier;
  const minutes = Math.round(adjustedTimeHours * 60);

  const arrival = new Date(startTime.getTime() + minutes * 60 * 1000);

  return { minutes, arrival, multiplier };
}

/**
 * Formats a Date as HH:MM (24-hour).
 */
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
