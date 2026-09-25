/**
 * Emergency Events Auditor for Cloud Functions
 */

const admin = require('firebase-admin')

async function logEvent(eventData) {
  await admin.firestore().collection('emergencyEvents').add({
    ...eventData,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  })
}

module.exports = {
  logEvent,
}
