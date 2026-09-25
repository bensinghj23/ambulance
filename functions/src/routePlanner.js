/**
 * Route Planner & Clearance Manager for Cloud Functions
 */

function planIntersectionClearance(ambulance, intersectionId) {
  const approachDirection = ambulance.direction || 'north'
  const exitDirection = 'south'
  const movement = `${approachDirection.toUpperCase()}_TO_${exitDirection.toUpperCase()}`

  return {
    intersectionId,
    approachDirection,
    exitDirection,
    movement,
    requiredLane: `${approachDirection[0].toUpperCase()}1`,
    preClearanceSeconds: 10,
  }
}

module.exports = {
  planIntersectionClearance,
}
