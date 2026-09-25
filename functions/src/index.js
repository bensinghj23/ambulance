/**
 * Firebase Cloud Functions — Main Entry Point
 * Implements privileged backend logic for emergency priority,
 * traffic signal control, route planning, and event logging.
 */

const { onRequest, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const admin = require('firebase-admin')

admin.initializeApp()

const priorityEngine = require('./priorityEngine')
const trafficController = require('./trafficController')
const routePlanner = require('./routePlanner')
const emergencyEvents = require('./emergencyEvents')

/**
 * Triggered whenever an ambulance location/status is updated.
 * Evaluates priority for the next intersection on its route.
 */
exports.onAmbulanceUpdate = onDocumentUpdated('ambulances/{ambulanceId}', async (event) => {
  const newAmbulance = event.data.after.data()
  const oldAmbulance = event.data.before.data()

  if (!newAmbulance || newAmbulance.status !== 'ACTIVE') return null

  const nextIntersectionId = newAmbulance.nextIntersection
  if (!nextIntersectionId) return null

  // Fetch traffic state
  const trafficSnap = await admin.firestore()
    .collection('trafficState')
    .doc(nextIntersectionId)
    .get()

  const trafficState = trafficSnap.exists ? trafficSnap.data() : {}

  // Calculate priority score
  const priorityResult = priorityEngine.calculatePriorityScore(newAmbulance, trafficState)

  if (priorityResult.activated) {
    // Plan safe signal transition
    const plan = routePlanner.planIntersectionClearance(newAmbulance, nextIntersectionId)

    // Execute safe signal state transition
    await trafficController.triggerEmergencySignal(nextIntersectionId, plan)

    // Log emergency event
    await emergencyEvents.logEvent({
      ambulanceId: event.params.ambulanceId,
      intersectionId: nextIntersectionId,
      eventType: 'PRIORITY_ACTIVATED',
      priorityScore: priorityResult.score,
      eta: newAmbulance.eta,
      requiredLane: plan.requiredLane,
      requiredPath: plan.movement,
      decision: 'ACTIVATE_EMERGENCY',
      reason: priorityResult.reasons.join('; '),
    })
  }

  return null
})
