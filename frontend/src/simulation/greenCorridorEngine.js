/* ============================================================
   Green Corridor Engine — Rolling green corridor that moves
   with the ambulance along its route.

   Corridor states per intersection:
     NORMAL → MONITOR → PREPARE → ACTIVE → RECOVERY → NORMAL

   The corridor uses:
   - ambulance position & ETA
   - route geometry
   - intersection state
   - decision engine
   - signal controller
   ============================================================ */

/**
 * Corridor intersection states
 */
export const CORRIDOR_STATES = {
  NORMAL: 'NORMAL',
  MONITOR: 'MONITOR',
  PREPARE: 'PREPARE',
  ACTIVE: 'ACTIVE',
  RECOVERY: 'RECOVERY',
}

/**
 * Build corridor state for all intersections along an ambulance route.
 *
 * @param {Object} ambulance - ambulance with corridor data
 * @param {Array} corridorIntersections - [{id, routeIndex, ...}]
 * @param {Object} signalStates - current signal states
 * @param {number} currentSegmentIndex - ambulance's current position on route
 * @returns {Array<{ intersectionId, corridorState, distanceFromAmbulance, etaFromAmbulance }>}
 */
export function computeCorridorStates(ambulance, corridorIntersections, signalStates, currentSegmentIndex) {
  if (!ambulance || !corridorIntersections || corridorIntersections.length === 0) {
    return []
  }

  const ambSpeed = ambulance.speed || 40 // km/h
  const result = []

  for (const ci of corridorIntersections) {
    let corridorState = CORRIDOR_STATES.NORMAL
    const sigState = signalStates[ci.id]

    // Determine position relative to ambulance
    const isAhead = ci.routeIndex > currentSegmentIndex
    const isPassed = ci.routeIndex <= currentSegmentIndex

    if (isPassed) {
      // Ambulance has passed — check if in recovery
      if (sigState && sigState.mode === 'PASSAGE_MONITORING') {
        corridorState = CORRIDOR_STATES.RECOVERY
      } else if (sigState && sigState.mode === 'RECOVERY') {
        corridorState = CORRIDOR_STATES.RECOVERY
      } else {
        corridorState = CORRIDOR_STATES.NORMAL
      }
    } else if (isAhead) {
      // How far ahead on the route?
      const segmentDiff = ci.routeIndex - currentSegmentIndex

      if (sigState && (sigState.mode === 'EMERGENCY_GREEN' || sigState.mode === 'ALL_RED' || sigState.mode === 'YELLOW')) {
        corridorState = CORRIDOR_STATES.ACTIVE
      } else if (sigState && (sigState.mode === 'EMERGENCY_DETECTED' || sigState.mode === 'PRE_CLEARANCE')) {
        corridorState = CORRIDOR_STATES.PREPARE
      } else if (segmentDiff < 5) {
        // Very close — should be active or preparing
        corridorState = CORRIDOR_STATES.PREPARE
      } else if (segmentDiff < 15) {
        corridorState = CORRIDOR_STATES.MONITOR
      } else {
        corridorState = CORRIDOR_STATES.NORMAL
      }
    }

    result.push({
      intersectionId: ci.id,
      corridorState,
      routeIndex: ci.routeIndex,
      isAhead,
      isPassed,
    })
  }

  return result
}

/**
 * Determine which intersections need signal activation based on corridor states.
 * Returns list of intersection IDs that should receive emergency trigger.
 */
export function getIntersectionsToActivate(corridorStates, signalStates) {
  const toActivate = []

  for (const cs of corridorStates) {
    if (cs.corridorState === CORRIDOR_STATES.PREPARE) {
      const sig = signalStates[cs.intersectionId]
      if (sig && sig.mode === 'NORMAL') {
        toActivate.push(cs.intersectionId)
      }
    }
  }

  return toActivate
}

/**
 * Get a human-readable summary of corridor status.
 */
export function getCorridorSummary(corridorStates) {
  const counts = {
    NORMAL: 0,
    MONITOR: 0,
    PREPARE: 0,
    ACTIVE: 0,
    RECOVERY: 0,
  }

  for (const cs of corridorStates) {
    counts[cs.corridorState] = (counts[cs.corridorState] || 0) + 1
  }

  return {
    total: corridorStates.length,
    ...counts,
    active: corridorStates.filter(cs => cs.corridorState !== CORRIDOR_STATES.NORMAL),
  }
}
