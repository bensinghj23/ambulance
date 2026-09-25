/* ============================================================
   Telemetry Service — Abstraction for ambulance GPS updates.
   Supports SIMULATION or REAL modes.
   ============================================================ */

/**
 * Format telemetry update from simulated or real ambulance.
 */
export function createTelemetryUpdate(ambulance) {
  return {
    ambulanceId: ambulance.id,
    latitude: ambulance.location?.lat,
    longitude: ambulance.location?.lng,
    speed: ambulance.speed,
    heading: ambulance.heading,
    priority: ambulance.priority,
    destination: ambulance.destination,
    timestamp: new Date().toISOString(),
    source: ambulance.isReal ? 'REAL' : 'SIMULATION',
  }
}

/**
 * In a real implementation, this would handle incoming MQTT
 * telemetry and update the decision engine.
 * For MVP, the simulationEngine drives the updates directly.
 */
export function handleIncomingTelemetry(telemetryPayload, engineCallback) {
  if (telemetryPayload.source === 'REAL') {
    engineCallback(telemetryPayload)
  }
}
