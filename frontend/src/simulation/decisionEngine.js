/* ============================================================
   Decision Engine — Combines all inputs to produce an
   explainable intersection control decision.

   Input: medical priority, ambulance ETA, movement, traffic
          density, queue, predicted clearance, occupancy,
          other ambulances, signal state.

   Output: action + reasons (explainable).

   Architecture:
     AI MODEL → PREDICTION → DECISION ENGINE → SAFETY CONTROLLER → SIGNAL
   ============================================================ */

/**
 * Possible decision actions (ordered by severity).
 */
export const DECISION_ACTIONS = {
  NORMAL_OPERATION: 'NORMAL_OPERATION',
  MONITOR: 'MONITOR',
  PRE_CLEAR: 'PRE_CLEAR',
  EXTEND_GREEN: 'EXTEND_GREEN',
  END_CURRENT_PHASE: 'END_CURRENT_PHASE',
  YELLOW: 'YELLOW',
  ALL_RED_CLEARANCE: 'ALL_RED_CLEARANCE',
  AMBULANCE_GREEN: 'AMBULANCE_GREEN',
  HOLD_RED: 'HOLD_RED',
  RECOVERY: 'RECOVERY',
}

/**
 * Configurable thresholds for decision logic.
 */
const DEFAULT_THRESHOLDS = {
  monitorETASeconds: 120,      // start monitoring when ETA < 120s
  preClearETASeconds: 60,      // pre-clear when ETA < 60s
  emergencyETASeconds: 30,     // emergency when ETA < 30s
  criticalETASeconds: 15,      // critical when ETA < 15s
  highTrafficDensity: 0.6,
  mediumTrafficDensity: 0.3,
  earlyPreClearBuffer: 15,     // start clearance this many seconds before ETA
}

/**
 * Make a decision for a single intersection regarding an ambulance.
 *
 * @param {Object} params
 * @param {Object} params.ambulance       - { priority, speed, eta, movement, id }
 * @param {Object} params.intersection    - enhanced traffic state
 * @param {Object} params.signalState     - current signal controller state
 * @param {Object} params.clearancePrediction - { predictedClearanceTime, source }
 * @param {Array}  params.otherAmbulances - other ambulances targeting this intersection
 * @param {Object} [params.thresholds]    - override default thresholds
 * @returns {{ action, reasons, score, details }}
 */
export function makeDecision({
  ambulance,
  intersection,
  signalState,
  clearancePrediction,
  otherAmbulances = [],
  thresholds = DEFAULT_THRESHOLDS,
}) {
  const reasons = []
  const details = {}
  let action = DECISION_ACTIONS.NORMAL_OPERATION
  let score = 0

  const eta = ambulance?.eta ?? Infinity
  const priority = ambulance?.priority ?? 'LOW'
  const movement = ambulance?.movement ?? 'STRAIGHT'
  const density = intersection?.trafficDensity ?? 0
  const trafficLevel = intersection?.trafficLevel ?? 'LOW'
  const queueLength = intersection?.queueLength ?? 0
  const vehicleCount = intersection?.vehicleCount ?? 0
  const occupied = intersection?.intersectionOccupancy ?? false
  const clearanceTime = clearancePrediction?.predictedClearanceTime ?? 30
  const signalMode = signalState?.mode ?? 'NORMAL'

  details.eta = eta
  details.priority = priority
  details.movement = movement
  details.trafficLevel = trafficLevel
  details.queueLength = queueLength
  details.vehicleCount = vehicleCount
  details.occupied = occupied
  details.clearanceTime = clearanceTime
  details.clearanceSource = clearancePrediction?.source ?? 'UNKNOWN'

  // ── Already in emergency mode ─────────────────────
  if (signalMode !== 'NORMAL' && signalMode !== 'RECOVERY') {
    // Check occupancy safety
    if (signalMode === 'EMERGENCY_GREEN' || signalMode === 'ALL_RED') {
      if (occupied) {
        action = DECISION_ACTIONS.HOLD_RED
        reasons.push('Intersection occupied — holding red for safety')
        return { action, reasons, score: 100, details }
      }
    }
    // Already handling — let signal controller continue
    action = DECISION_ACTIONS.AMBULANCE_GREEN
    reasons.push(`Signal already in ${signalMode} mode`)
    return { action, reasons, score: 90, details }
  }

  // ── No ambulance or very far ──────────────────────
  if (!ambulance || eta > thresholds.monitorETASeconds) {
    action = DECISION_ACTIONS.NORMAL_OPERATION
    reasons.push('No approaching ambulance or ETA > monitoring threshold')
    return { action, reasons, score: 0, details }
  }

  // ── PHASE 16: Occupancy safety ────────────────────
  if (occupied) {
    score += 20
    reasons.push('Intersection occupancy detected — safety constraint active')
  }

  // ── Priority scoring ──────────────────────────────
  if (priority === 'CRITICAL') { score += 40; reasons.push(`Medical priority: CRITICAL (+40)`) }
  else if (priority === 'HIGH') { score += 30; reasons.push(`Medical priority: HIGH (+30)`) }
  else if (priority === 'MEDIUM') { score += 15; reasons.push(`Medical priority: MEDIUM (+15)`) }
  else { score += 5; reasons.push(`Medical priority: LOW (+5)`) }

  // ── ETA-based urgency ─────────────────────────────
  if (eta <= thresholds.criticalETASeconds) {
    score += 40
    reasons.push(`Ambulance ETA ${Math.round(eta)}s — CRITICAL proximity (+40)`)
  } else if (eta <= thresholds.emergencyETASeconds) {
    score += 30
    reasons.push(`Ambulance ETA ${Math.round(eta)}s — EMERGENCY proximity (+30)`)
  } else if (eta <= thresholds.preClearETASeconds) {
    score += 20
    reasons.push(`Ambulance ETA ${Math.round(eta)}s — PRE_CLEAR range (+20)`)
  } else {
    score += 10
    reasons.push(`Ambulance ETA ${Math.round(eta)}s — MONITOR range (+10)`)
  }

  // ── PHASE 15: Traffic density changes the decision ─
  if (trafficLevel === 'HIGH') {
    score += 20
    reasons.push(`Traffic density HIGH (${(density * 100).toFixed(0)}%) — heavier clearance needed (+20)`)
  } else if (trafficLevel === 'MEDIUM') {
    score += 10
    reasons.push(`Traffic density MEDIUM (${(density * 100).toFixed(0)}%) (+10)`)
  } else {
    reasons.push(`Traffic density LOW (${(density * 100).toFixed(0)}%)`)
  }

  // ── Clearance prediction vs ETA ───────────────────
  if (clearanceTime > eta) {
    score += 15
    reasons.push(`Predicted clearance (${clearanceTime}s) EXCEEDS ambulance ETA (${Math.round(eta)}s) — early action needed (+15)`)
  } else {
    reasons.push(`Predicted clearance (${clearanceTime}s) within ambulance ETA (${Math.round(eta)}s)`)
  }

  // ── Movement complexity ───────────────────────────
  if (movement === 'LEFT' || movement === 'U_TURN') {
    score += 10
    reasons.push(`Movement ${movement} requires additional clearance (+10)`)
  }

  // ── Queue impact ──────────────────────────────────
  if (queueLength > 100) {
    score += 10
    reasons.push(`Queue length ${queueLength}m — significant queue (+10)`)
  }

  // ── Other ambulances ──────────────────────────────
  if (otherAmbulances.length > 0) {
    score += 5
    reasons.push(`${otherAmbulances.length} other ambulance(s) in area (+5)`)
  }

  // ── Determine action from score ───────────────────
  // PHASE 15 behavior: traffic density changes the decision

  if (occupied && score >= 60) {
    action = DECISION_ACTIONS.HOLD_RED
    reasons.push('DECISION: HOLD_RED — intersection must clear before emergency green')
  } else if (score >= 80) {
    // High urgency + high traffic
    if (trafficLevel === 'HIGH' && clearanceTime > eta) {
      action = DECISION_ACTIONS.PRE_CLEAR
      reasons.push('DECISION: EMERGENCY PRE_CLEAR — traffic clearance exceeds ETA, high density')
    } else {
      action = DECISION_ACTIONS.END_CURRENT_PHASE
      reasons.push('DECISION: END_CURRENT_PHASE — immediate signal transition needed')
    }
  } else if (score >= 60) {
    if (trafficLevel === 'HIGH' || clearanceTime > eta * 0.8) {
      action = DECISION_ACTIONS.PRE_CLEAR
      reasons.push('DECISION: PRE_CLEAR — begin early clearance for traffic')
    } else {
      action = DECISION_ACTIONS.EXTEND_GREEN
      reasons.push('DECISION: EXTEND_GREEN — allow current phase to assist clearance')
    }
  } else if (score >= 40) {
    action = DECISION_ACTIONS.MONITOR
    reasons.push('DECISION: MONITOR — ambulance approaching, monitoring traffic')
  } else {
    action = DECISION_ACTIONS.NORMAL_OPERATION
    reasons.push('DECISION: NORMAL_OPERATION — no action required')
  }

  return { action, reasons, score, details }
}

/**
 * Determine if a decision requires signal controller activation.
 */
export function requiresSignalAction(action) {
  return [
    DECISION_ACTIONS.PRE_CLEAR,
    DECISION_ACTIONS.END_CURRENT_PHASE,
    DECISION_ACTIONS.AMBULANCE_GREEN,
  ].includes(action)
}

export { DEFAULT_THRESHOLDS }
