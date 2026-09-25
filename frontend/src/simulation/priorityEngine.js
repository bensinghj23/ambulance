/* ============================================================
   Priority Engine — Deterministic scoring for emergency
   activation decisions.
   ============================================================ */

const DEFAULT_WEIGHTS = {
  ambulance_detected: 50,
  distance_under_500m: 20,
  distance_under_200m: 30,
  high_traffic: 20,
  high_emergency_priority: 30,
  multiple_vehicles_queued: 10,
  speed_above_30: 10,
}

const DEFAULT_THRESHOLD = 70

/**
 * Calculate priority score for an ambulance at an intersection.
 * @param {Object} params
 * @param {Object} params.ambulance   - { priority, speed, distance }
 * @param {Object} params.traffic     - { density, queueLength, occupancy }
 * @param {Object} [params.weights]   - custom score weights
 * @returns {{ score: number, reasons: string[], activated: boolean }}
 */
export function calculatePriority({
  ambulance,
  traffic = {},
  weights = DEFAULT_WEIGHTS,
  threshold = DEFAULT_THRESHOLD,
}) {
  let score = 0
  const reasons = []

  // Ambulance detected
  if (ambulance) {
    score += weights.ambulance_detected
    reasons.push(`Ambulance detected (+${weights.ambulance_detected})`)
  }

  // Distance scoring
  const dist = ambulance?.distance ?? Infinity
  if (dist < 200) {
    score += weights.distance_under_200m
    reasons.push(`Distance < 200m (+${weights.distance_under_200m})`)
  } else if (dist < 500) {
    score += weights.distance_under_500m
    reasons.push(`Distance < 500m (+${weights.distance_under_500m})`)
  }

  // Priority level
  if (ambulance?.priority === 'HIGH' || ambulance?.priority === 'CRITICAL') {
    score += weights.high_emergency_priority
    reasons.push(`Priority=${ambulance.priority} (+${weights.high_emergency_priority})`)
  }

  // Traffic conditions
  if ((traffic.density ?? 0) > 0.6) {
    score += weights.high_traffic
    reasons.push(`High traffic density (${(traffic.density * 100).toFixed(0)}%) (+${weights.high_traffic})`)
  }

  if ((traffic.queueLength ?? 0) > 8) {
    score += weights.multiple_vehicles_queued
    reasons.push(`Queue > 8 vehicles (+${weights.multiple_vehicles_queued})`)
  }

  // Speed
  if ((ambulance?.speed ?? 0) > 30) {
    score += weights.speed_above_30
    reasons.push(`Speed > 30 km/h (+${weights.speed_above_30})`)
  }

  const activated = score >= threshold

  return { score, reasons, activated, threshold }
}

/**
 * Determine the required lane, movement, and conflicting movements.
 * @param {string} approachDir  - 'north', 'south', 'east', 'west'
 * @param {string} turnIntent   - 'through', 'left', 'right'
 * @returns {Object}
 */
export function planEmergencyMovement(approachDir, turnIntent = 'through') {
  const opposites = { north: 'south', south: 'north', east: 'west', west: 'east' }
  const leftTurns = { north: 'west', south: 'east', east: 'north', west: 'south' }
  const rightTurns = { north: 'east', south: 'west', east: 'south', west: 'north' }

  let exitDir
  if (turnIntent === 'left') exitDir = leftTurns[approachDir]
  else if (turnIntent === 'right') exitDir = rightTurns[approachDir]
  else exitDir = opposites[approachDir]

  const movement = `${approachDir.toUpperCase()}_TO_${exitDir.toUpperCase()}`

  // Conflicting movements: any approach that crosses the path
  const allDirs = ['north', 'south', 'east', 'west']
  const conflicting = allDirs
    .filter((d) => d !== approachDir && d !== opposites[approachDir])
    .map((d) => d.toUpperCase())

  return {
    approachDirection: approachDir,
    exitDirection: exitDir,
    movement,
    requiredLane: `${approachDir[0].toUpperCase()}1`, // Primary lane
    conflictingApproaches: conflicting,
    clearanceRequired: true,
  }
}

/**
 * Estimate time for queue to clear (simple model).
 */
export function estimateQueueClearance(queueLength, saturationFlow = 1800) {
  // saturationFlow vehicles/hour → vehicles/second
  const rate = saturationFlow / 3600
  return queueLength / rate
}

/**
 * Calculate ETA (seconds) from distance (meters) and speed (km/h).
 */
export function calculateETA(distanceMeters, speedKmh) {
  if (speedKmh <= 0) return Infinity
  const speedMs = speedKmh / 3.6
  return distanceMeters / speedMs
}

export { DEFAULT_WEIGHTS, DEFAULT_THRESHOLD }
