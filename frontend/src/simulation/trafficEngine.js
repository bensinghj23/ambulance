/* ============================================================
   Traffic Engine — Manages intersection traffic state with
   realistic metrics. Provides traffic density classification
   and queue estimation for the decision engine.
   ============================================================ */

/**
 * Traffic density thresholds
 */
export const TRAFFIC_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
}

/**
 * Create a comprehensive traffic state for an intersection.
 */
export function createTrafficState(intersectionId, signalState) {
  return {
    intersectionId,
    vehicleCount: 0,
    queueLength: 0,           // meters
    averageSpeed: 30,          // km/h
    trafficDensity: 0,         // 0..1
    trafficLevel: TRAFFIC_LEVELS.LOW,
    laneOccupancy: 0,          // 0..1
    currentSignalPhase: signalState?.phase || 'NS_GREEN',
    remainingGreenSeconds: signalState?.phaseDuration ? signalState.phaseDuration - (signalState.phaseTimer || 0) : 30,
    intersectionOccupancy: false,
    timestamp: new Date().toISOString(),
    source: 'SIMULATION',
  }
}

/**
 * Update traffic state from raw simulation data.
 * @param {Object} rawTrafficState - from simulationEngine trafficStates
 * @param {Object} signalState - from simulationEngine signalStates
 * @returns {Object} enhanced traffic state
 */
export function computeEnhancedTrafficState(rawTrafficState, signalState) {
  if (!rawTrafficState) return null

  const queues = Object.values(rawTrafficState.queueLengthByLane || {})
  const densities = Object.values(rawTrafficState.densityByLane || {})
  const speeds = Object.values(rawTrafficState.averageSpeedByLane || {})
  const occupancies = Object.values(rawTrafficState.occupancyByLane || {})
  const vehicleCounts = Object.values(rawTrafficState.vehicleCountsByLane || {})

  const avgQueue = queues.length > 0 ? queues.reduce((a, b) => a + b, 0) / queues.length : 0
  const avgDensity = densities.length > 0 ? densities.reduce((a, b) => a + b, 0) / densities.length : 0
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 30
  const avgOccupancy = occupancies.length > 0 ? occupancies.reduce((a, b) => a + b, 0) / occupancies.length : 0
  const totalVehicles = vehicleCounts.reduce((a, b) => a + b, 0)

  let trafficLevel = TRAFFIC_LEVELS.LOW
  if (avgDensity > 0.6) trafficLevel = TRAFFIC_LEVELS.HIGH
  else if (avgDensity > 0.3) trafficLevel = TRAFFIC_LEVELS.MEDIUM

  // Queue length in meters (~6m per vehicle average)
  const queueLengthMeters = Math.round(avgQueue * 6)

  // Intersection occupancy: true if vehicles detected inside intersection area
  const intersectionOccupied = rawTrafficState.intersectionOccupied || false

  // Remaining green calculation
  let remainingGreenSeconds = 0
  if (signalState) {
    const elapsed = signalState.phaseTimer || 0
    const duration = signalState.phaseDuration || 30
    remainingGreenSeconds = Math.max(0, duration - elapsed)
  }

  return {
    intersectionId: rawTrafficState.intersectionId,
    vehicleCount: totalVehicles,
    queueLength: queueLengthMeters,
    averageSpeed: Math.round(avgSpeed * 10) / 10,
    trafficDensity: Math.round(avgDensity * 100) / 100,
    trafficLevel,
    laneOccupancy: Math.round(avgOccupancy * 100) / 100,
    currentSignalPhase: signalState?.phase || 'UNKNOWN',
    remainingGreenSeconds: Math.round(remainingGreenSeconds),
    intersectionOccupancy: intersectionOccupied,
    detectedAmbulances: rawTrafficState.detectedAmbulances || [],
    timestamp: new Date().toISOString(),
    source: 'SIMULATION',
    // Preserve for UI:
    queueLengthByLane: rawTrafficState.queueLengthByLane || {},
    occupancyByLane: rawTrafficState.occupancyByLane || {},
    densityByLane: rawTrafficState.densityByLane || {},
    averageSpeedByLane: rawTrafficState.averageSpeedByLane || {},
    vehicleCountsByLane: rawTrafficState.vehicleCountsByLane || {},
  }
}

/**
 * Apply traffic multiplier (for demo controls: increase/decrease traffic).
 * @param {Object} trafficStates - raw traffic states
 * @param {number} multiplier - 0.5 = half traffic, 2.0 = double
 * @returns modified traffic states
 */
export function applyTrafficMultiplier(trafficStates, multiplier) {
  const modified = {}
  for (const [intId, ts] of Object.entries(trafficStates)) {
    modified[intId] = { ...ts }
    const queues = { ...ts.queueLengthByLane }
    const densities = { ...ts.densityByLane }
    const occupancies = { ...ts.occupancyByLane }

    for (const key of Object.keys(queues)) {
      queues[key] = Math.min(15, (queues[key] || 0) * multiplier)
      densities[key] = Math.min(1, (densities[key] || 0) * multiplier)
      occupancies[key] = Math.min(1, (occupancies[key] || 0) * multiplier)
    }

    modified[intId].queueLengthByLane = queues
    modified[intId].densityByLane = densities
    modified[intId].occupancyByLane = occupancies
  }
  return modified
}

/**
 * Estimate clearance time using a deterministic simulation model.
 * Used as fallback when AI service is unavailable.
 */
export function estimateClearanceTime({
  vehicleCount = 0,
  queueLength = 0,
  averageSpeed = 30,
  trafficDensity = 0.3,
  laneOccupancy = 0.3,
  currentSignalPhase = 'NS_GREEN',
  remainingGreenSeconds = 15,
  intersectionOccupancy = false,
  ambulanceETA = 60,
}) {
  // Base clearance from queue: ~2s per queued vehicle at saturation flow
  const queueClearance = vehicleCount * 1.8

  // Density factor: high density means slower clearance
  const densityFactor = 1 + trafficDensity * 1.5

  // Signal phase factor: if currently green in approach direction, faster clearance
  const phaseBonus = remainingGreenSeconds > 10 ? -5 : 0

  // Occupancy penalty
  const occupancyPenalty = intersectionOccupancy ? 8 : 0

  const predicted = Math.max(5, (queueClearance * densityFactor) + phaseBonus + occupancyPenalty)

  return {
    predictedClearanceTime: Math.round(predicted),
    source: 'SIMULATION_FALLBACK',
    model: 'deterministic_v1',
    modelVersion: '1.0',
  }
}
