/**
 * Traffic Signal Controller module for Cloud Functions
 * Manages deterministic signal state updates in Firestore.
 */

const admin = require('firebase-admin')

async function triggerEmergencySignal(intersectionId, plan) {
  const signalRef = admin.firestore().collection('signalStates').doc(intersectionId)

  await signalRef.set({
    intersectionId,
    mode: 'EMERGENCY_DETECTED',
    emergencyApproach: plan.approachDirection,
    emergencyMovement: plan.movement,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
}

async function restoreNormalSignal(intersectionId) {
  const signalRef = admin.firestore().collection('signalStates').doc(intersectionId)

  await signalRef.set({
    intersectionId,
    mode: 'RECOVERY',
    emergencyApproach: null,
    emergencyMovement: null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
}

module.exports = {
  triggerEmergencySignal,
  restoreNormalSignal,
}
