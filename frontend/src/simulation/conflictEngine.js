/* ============================================================
   Conflict Engine — Multi-ambulance conflict detection,
   resolution, and queueing.

   Detects when multiple ambulances approach the same
   intersection with conflicting movements or overlapping
   service windows.

   Resolution uses: medical priority, ETA, distance,
   movement, request timestamp. Never random.
   ============================================================ */

/**
 * Conflict states
 */
export const CONFLICT_STATES = {
  NONE: 'NONE',
  DETECTED: 'DETECTED',
  QUEUED: 'QUEUED',
  SERVING: 'SERVING',
  CLEARED: 'CLEARED',
}

/**
 * Detect conflicts across all active ambulances.
 * @param {Object} ambulances - keyed by ID
 * @returns {Array<Conflict>}
 */
export function detectConflicts(ambulances) {
  const active = Object.values(ambulances).filter(a => a.status === 'ACTIVE' && a.nextIntersection)
  const conflicts = []

  // Group by next intersection
  const byIntersection = {}
  for (const amb of active) {
    const intId = amb.nextIntersection
    if (!byIntersection[intId]) byIntersection[intId] = []
    byIntersection[intId].push(amb)
  }

  // Detect conflicts where multiple ambulances target the same intersection
  for (const [intId, ambs] of Object.entries(byIntersection)) {
    if (ambs.length < 2) continue

    // Check if service windows overlap (both within 60s ETA)
    const close = ambs.filter(a => (a.eta || Infinity) < 120)
    if (close.length < 2) continue

    // Resolve priority order
    const sorted = resolveConflict(close)

    const conflict = {
      id: `CONFLICT_${intId}_${Date.now()}`,
      intersectionId: intId,
      state: CONFLICT_STATES.DETECTED,
      ambulances: sorted.map((amb, idx) => ({
        ambulanceId: amb.id,
        priority: amb.priority,
        eta: Math.round(amb.eta || 0),
        movement: amb.movement || 'STRAIGHT',
        distance: Math.round(amb.distanceToNextIntersection || amb.distance || 0),
        createdAt: amb.createdAt,
        conflictState: idx === 0 ? CONFLICT_STATES.SERVING : CONFLICT_STATES.QUEUED,
        queuePosition: idx,
      })),
      servingAmbulanceId: sorted[0].id,
      queuedAmbulanceIds: sorted.slice(1).map(a => a.id),
      reason: buildConflictReason(sorted),
      timestamp: new Date().toISOString(),
    }

    conflicts.push(conflict)
  }

  return conflicts
}

/**
 * Resolve conflict priority order.
 * Uses: medical priority → ETA → distance → request timestamp.
 * Deterministic — never random.
 */
export function resolveConflict(ambulances) {
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

  return [...ambulances].sort((a, b) => {
    // 1. Medical priority (lower = higher priority)
    const pA = priorityOrder[a.priority] ?? 3
    const pB = priorityOrder[b.priority] ?? 3
    if (pA !== pB) return pA - pB

    // 2. ETA (closer first)
    const etaA = a.eta ?? Infinity
    const etaB = b.eta ?? Infinity
    const etaDiff = etaA - etaB
    if (Math.abs(etaDiff) > 3) return etaDiff  // >3s difference is meaningful

    // 3. Distance (closer first)
    const distA = a.distanceToNextIntersection || a.distance || Infinity
    const distB = b.distanceToNextIntersection || b.distance || Infinity
    const distDiff = distA - distB
    if (Math.abs(distDiff) > 20) return distDiff  // >20m difference is meaningful

    // 4. Tie break: request timestamp (earlier first) — deterministic
    const tA = a.createdAt || ''
    const tB = b.createdAt || ''
    return tA < tB ? -1 : tA > tB ? 1 : 0
  })
}

/**
 * Build explanation string for conflict resolution.
 */
function buildConflictReason(sorted) {
  if (sorted.length < 2) return 'No conflict'
  const winner = sorted[0]
  const loser = sorted[1]

  const parts = []

  const pOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  if ((pOrder[winner.priority] ?? 3) < (pOrder[loser.priority] ?? 3)) {
    parts.push(`${winner.id} has higher medical priority (${winner.priority} > ${loser.priority})`)
  } else if ((winner.eta || 0) < (loser.eta || 0) - 3) {
    parts.push(`${winner.id} has closer ETA (${Math.round(winner.eta || 0)}s vs ${Math.round(loser.eta || 0)}s)`)
  } else {
    parts.push(`${winner.id} has earlier request timestamp (tie-break)`)
  }

  return parts.join('; ')
}

/**
 * Update conflict states when an ambulance passes through.
 * Promotes the next queued ambulance to SERVING.
 */
export function advanceConflictQueue(conflict, passedAmbulanceId) {
  const updated = { ...conflict }
  updated.ambulances = conflict.ambulances.map(a => {
    if (a.ambulanceId === passedAmbulanceId) {
      return { ...a, conflictState: CONFLICT_STATES.CLEARED }
    }
    return a
  })

  // Find next queued
  const nextQueued = updated.ambulances.find(a => a.conflictState === CONFLICT_STATES.QUEUED)
  if (nextQueued) {
    nextQueued.conflictState = CONFLICT_STATES.SERVING
    updated.servingAmbulanceId = nextQueued.ambulanceId
    updated.queuedAmbulanceIds = updated.ambulances
      .filter(a => a.conflictState === CONFLICT_STATES.QUEUED)
      .map(a => a.ambulanceId)
  } else {
    updated.state = CONFLICT_STATES.CLEARED
    updated.servingAmbulanceId = null
    updated.queuedAmbulanceIds = []
  }

  return updated
}

/* ── Phase 21: Audio Alert ─────────────────────── */

let audioAlertPlayed = {}

/**
 * Play conflict audio alert (operator warning only — does NOT determine priority).
 */
export function playConflictAlert(conflictId) {
  if (audioAlertPlayed[conflictId]) return

  try {
    // Web Audio API beep sequence for "conflict detected"
    const ctx = new (window.AudioContext || window.webkitAudioContext)()

    // Three ascending tones
    const frequencies = [440, 554, 659]
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.value = 0.15
      osc.start(ctx.currentTime + i * 0.15)
      osc.stop(ctx.currentTime + i * 0.15 + 0.12)
    })

    audioAlertPlayed[conflictId] = true
  } catch (e) {
    // Audio not available — ignore
  }
}

/**
 * Reset audio alert tracking.
 */
export function resetAudioAlerts() {
  audioAlertPlayed = {}
}
