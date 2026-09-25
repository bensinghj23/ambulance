/**
 * Priority Engine module for Cloud Functions
 * Deterministic scoring for ambulance priority requests.
 */

const WEIGHTS = {
  ambulance_detected: 50,
  distance_under_500m: 20,
  distance_under_200m: 30,
  high_traffic: 20,
  high_emergency_priority: 30,
}

const THRESHOLD = 70

function calculatePriorityScore(ambulance, trafficState = {}) {
  let score = 0
  const reasons = []

  if (ambulance) {
    score += WEIGHTS.ambulance_detected
    reasons.push('Ambulance detected (+50)')
  }

  const dist = ambulance?.distance ?? 500
  if (dist < 200) {
    score += WEIGHTS.distance_under_200m
    reasons.push('Distance < 200m (+30)')
  } else if (dist < 500) {
    score += WEIGHTS.distance_under_500m
    reasons.push('Distance < 500m (+20)')
  }

  if (ambulance?.priority === 'HIGH' || ambulance?.priority === 'CRITICAL') {
    score += WEIGHTS.high_emergency_priority
    reasons.push(`Priority level ${ambulance.priority} (+30)`)
  }

  const activated = score >= THRESHOLD

  return { score, reasons, activated, threshold: THRESHOLD }
}

module.exports = {
  calculatePriorityScore,
}
