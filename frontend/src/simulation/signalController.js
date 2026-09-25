/* ============================================================
   Signal Controller — Deterministic State Machine
   States: NORMAL → EMERGENCY_DETECTED → PRE_CLEARANCE →
           YELLOW → ALL_RED → EMERGENCY_GREEN →
           PASSAGE_MONITORING → RECOVERY → NORMAL
   ============================================================ */

export const SIGNAL_STATES = {
  NORMAL: 'NORMAL',
  EMERGENCY_DETECTED: 'EMERGENCY_DETECTED',
  PRE_CLEARANCE: 'PRE_CLEARANCE',
  YELLOW: 'YELLOW',
  ALL_RED: 'ALL_RED',
  EMERGENCY_GREEN: 'EMERGENCY_GREEN',
  PASSAGE_MONITORING: 'PASSAGE_MONITORING',
  RECOVERY: 'RECOVERY',
}

export const LIGHT_COLORS = {
  RED: 'red',
  YELLOW: 'yellow',
  GREEN: 'green',
  OFF: 'off',
}

/**
 * Create initial signal state for an intersection.
 * North/South green, East/West red by default.
 */
export function createInitialSignalState(intersectionId, config = {}) {
  return {
    intersectionId,
    north: LIGHT_COLORS.GREEN,
    south: LIGHT_COLORS.GREEN,
    east: LIGHT_COLORS.RED,
    west: LIGHT_COLORS.RED,
    phase: 'NS_GREEN',        // current phase name
    mode: SIGNAL_STATES.NORMAL,
    phaseTimer: 0,             // seconds into current phase
    phaseDuration: config.greenDuration || 30,
    yellowDuration: config.yellowDuration || 4,
    allRedDuration: config.allRedDuration || 2,
    emergencyApproach: null,    // e.g. 'north'
    emergencyMovement: null,    // e.g. 'NORTH_TO_EAST'
    emergencyHoldTimer: 0,
    emergencyHoldMax: config.emergencyHoldMax || 90,
    updatedAt: new Date().toISOString(),
  }
}

/** Normal signal cycle phases */
const NORMAL_PHASES = [
  { name: 'NS_GREEN',   north: 'green',  south: 'green',  east: 'red',    west: 'red' },
  { name: 'NS_YELLOW',  north: 'yellow', south: 'yellow', east: 'red',    west: 'red' },
  { name: 'ALL_RED_1',  north: 'red',    south: 'red',    east: 'red',    west: 'red' },
  { name: 'EW_GREEN',   north: 'red',    south: 'red',    east: 'green',  west: 'green' },
  { name: 'EW_YELLOW',  north: 'red',    south: 'red',    east: 'yellow', west: 'yellow' },
  { name: 'ALL_RED_2',  north: 'red',    south: 'red',    east: 'red',    west: 'red' },
]

function getPhaseIndex(phaseName) {
  return NORMAL_PHASES.findIndex((p) => p.name === phaseName)
}

function getPhaseDuration(phase, state) {
  if (phase.name.includes('YELLOW')) return state.yellowDuration
  if (phase.name.includes('ALL_RED')) return state.allRedDuration
  return state.phaseDuration
}

/**
 * Advance signal state by dt seconds.
 * Returns new state + array of decision log entries.
 */
export function tickSignalState(state, dt = 1) {
  const logs = []
  let s = { ...state }

  // ── NORMAL MODE ──────────────────────────────
  if (s.mode === SIGNAL_STATES.NORMAL) {
    s.phaseTimer += dt
    const phaseIdx = getPhaseIndex(s.phase)
    const phase = NORMAL_PHASES[phaseIdx >= 0 ? phaseIdx : 0]
    const dur = getPhaseDuration(phase, s)

    if (s.phaseTimer >= dur) {
      s.phaseTimer = 0
      const nextIdx = (phaseIdx + 1) % NORMAL_PHASES.length
      const nextPhase = NORMAL_PHASES[nextIdx]
      s.phase = nextPhase.name
      s.north = nextPhase.north
      s.south = nextPhase.south
      s.east = nextPhase.east
      s.west = nextPhase.west
      logs.push({
        type: 'PHASE_CHANGE',
        message: `${s.intersectionId}: Phase → ${nextPhase.name}`,
      })
    }
    return { state: s, logs }
  }

  // ── EMERGENCY_DETECTED ──────────────────────
  if (s.mode === SIGNAL_STATES.EMERGENCY_DETECTED) {
    logs.push({
      type: 'EMERGENCY',
      message: `${s.intersectionId}: Emergency detected, approach=${s.emergencyApproach}`,
    })
    s.mode = SIGNAL_STATES.PRE_CLEARANCE
    s.phaseTimer = 0
    return { state: s, logs }
  }

  // ── PRE_CLEARANCE ───────────────────────────
  if (s.mode === SIGNAL_STATES.PRE_CLEARANCE) {
    // Skip directly to YELLOW if we need to stop conflicting traffic
    s.mode = SIGNAL_STATES.YELLOW
    s.phaseTimer = 0
    // Set all to yellow
    s.north = LIGHT_COLORS.YELLOW
    s.south = LIGHT_COLORS.YELLOW
    s.east = LIGHT_COLORS.YELLOW
    s.west = LIGHT_COLORS.YELLOW
    logs.push({
      type: 'TRANSITION',
      message: `${s.intersectionId}: All Yellow — clearing intersection`,
    })
    return { state: s, logs }
  }

  // ── YELLOW ──────────────────────────────────
  if (s.mode === SIGNAL_STATES.YELLOW) {
    s.phaseTimer += dt
    if (s.phaseTimer >= s.yellowDuration) {
      s.mode = SIGNAL_STATES.ALL_RED
      s.phaseTimer = 0
      s.north = LIGHT_COLORS.RED
      s.south = LIGHT_COLORS.RED
      s.east = LIGHT_COLORS.RED
      s.west = LIGHT_COLORS.RED
      logs.push({
        type: 'TRANSITION',
        message: `${s.intersectionId}: All Red — safety clearance`,
      })
    }
    return { state: s, logs }
  }

  // ── ALL_RED ─────────────────────────────────
  if (s.mode === SIGNAL_STATES.ALL_RED) {
    s.phaseTimer += dt
    if (s.phaseTimer >= s.allRedDuration) {
      s.mode = SIGNAL_STATES.EMERGENCY_GREEN
      s.phaseTimer = 0
      s.emergencyHoldTimer = 0
      // Green for the emergency approach, red for all others
      const approach = s.emergencyApproach || 'north'
      s.north = approach === 'north' ? LIGHT_COLORS.GREEN : LIGHT_COLORS.RED
      s.south = approach === 'south' ? LIGHT_COLORS.GREEN : LIGHT_COLORS.RED
      s.east = approach === 'east' ? LIGHT_COLORS.GREEN : LIGHT_COLORS.RED
      s.west = approach === 'west' ? LIGHT_COLORS.GREEN : LIGHT_COLORS.RED
      logs.push({
        type: 'EMERGENCY_GREEN',
        message: `${s.intersectionId}: Emergency GREEN for ${approach} approach`,
      })
    }
    return { state: s, logs }
  }

  // ── EMERGENCY_GREEN ─────────────────────────
  if (s.mode === SIGNAL_STATES.EMERGENCY_GREEN) {
    s.emergencyHoldTimer += dt
    if (s.emergencyHoldTimer >= s.emergencyHoldMax) {
      // Safety timeout
      logs.push({
        type: 'WARNING',
        message: `${s.intersectionId}: Emergency hold timeout — forcing recovery`,
      })
      s.mode = SIGNAL_STATES.RECOVERY
      s.phaseTimer = 0
    }
    return { state: s, logs }
  }

  // ── PASSAGE_MONITORING ──────────────────────
  if (s.mode === SIGNAL_STATES.PASSAGE_MONITORING) {
    s.phaseTimer += dt
    // After 3 seconds of monitoring, begin recovery
    if (s.phaseTimer >= 3) {
      s.mode = SIGNAL_STATES.RECOVERY
      s.phaseTimer = 0
      logs.push({
        type: 'RECOVERY',
        message: `${s.intersectionId}: Ambulance passed — starting recovery`,
      })
    }
    return { state: s, logs }
  }

  // ── RECOVERY ────────────────────────────────
  if (s.mode === SIGNAL_STATES.RECOVERY) {
    // Transition back to normal through yellow → all-red → NS_GREEN
    s.north = LIGHT_COLORS.YELLOW
    s.south = LIGHT_COLORS.YELLOW
    s.east = LIGHT_COLORS.YELLOW
    s.west = LIGHT_COLORS.YELLOW
    s.phaseTimer += dt
    if (s.phaseTimer >= s.yellowDuration) {
      s.mode = SIGNAL_STATES.NORMAL
      s.phase = 'NS_GREEN'
      s.phaseTimer = 0
      s.emergencyApproach = null
      s.emergencyMovement = null
      s.emergencyHoldTimer = 0
      s.north = LIGHT_COLORS.GREEN
      s.south = LIGHT_COLORS.GREEN
      s.east = LIGHT_COLORS.RED
      s.west = LIGHT_COLORS.RED
      logs.push({
        type: 'RECOVERY',
        message: `${s.intersectionId}: Recovered — Normal NS_GREEN`,
      })
    }
    return { state: s, logs }
  }

  return { state: s, logs }
}

/**
 * Trigger emergency mode on a signal.
 */
export function triggerEmergency(state, approachDirection, movement) {
  return {
    ...state,
    mode: SIGNAL_STATES.EMERGENCY_DETECTED,
    emergencyApproach: approachDirection,
    emergencyMovement: movement,
    phaseTimer: 0,
  }
}

/**
 * Notify that the ambulance has passed this intersection.
 */
export function markAmbulancePassed(state) {
  return {
    ...state,
    mode: SIGNAL_STATES.PASSAGE_MONITORING,
    phaseTimer: 0,
  }
}
