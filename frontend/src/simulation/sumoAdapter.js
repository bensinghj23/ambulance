/* ============================================================
   SUMO Adapter — Integration boundary for TraCI/SUMO.
   Prepares the project for SUMO integration while keeping the
   React simulation as the MVP fallback.
   ============================================================ */

export const SIMULATION_MODES = {
  BROWSER: 'BROWSER_SIMULATION',
  SUMO: 'SUMO_SIMULATION',
}

let currentMode = SIMULATION_MODES.BROWSER

export function getSimulationMode() {
  return currentMode
}

export function setSimulationMode(mode) {
  if (Object.values(SIMULATION_MODES).includes(mode)) {
    currentMode = mode
  }
}

/**
 * Sync signal state to SUMO via TraCI (if connected).
 */
export function sendSignalCommandToSUMO(intersectionId, signalState) {
  if (currentMode === SIMULATION_MODES.SUMO) {
    // TODO: Implement actual TraCI command over WebSocket/API
    console.log(`[SUMO Adapter] Sent signal state to SUMO for ${intersectionId}:`, signalState.mode)
  }
}

/**
 * Sync traffic state from SUMO.
 */
export function syncTrafficStateFromSUMO(trafficStates) {
  if (currentMode === SIMULATION_MODES.SUMO) {
    // TODO: Pull real traffic metrics (queue, count, speed) from TraCI
    return trafficStates // For now, just return what was passed
  }
  return trafficStates
}
