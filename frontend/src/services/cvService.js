/* ============================================================
   CV Service — Computer Vision interface abstraction.
   YOLO detects. It does NOT decide the signal.
   Outputs traffic state for decision engine.
   ============================================================ */

/**
 * CV detection output format.
 */
export function createCVOutput(intersectionId) {
  return {
    cameraId: `CAM_${intersectionId}`,
    timestamp: new Date().toISOString(),
    vehicles: [],
    vehicleCount: 0,
    emergencyVehicles: [],
    queueLength: 0,
    occupancy: 0,
    averageSpeed: 0,
    trafficDensity: 0,
    intersectionOccupancy: false,
    source: 'SIMULATION',
  }
}

/**
 * Merge CV output into traffic state.
 * When real CV is connected, this replaces simulation values.
 */
export function mergeCVIntoTrafficState(trafficState, cvOutput) {
  if (!cvOutput || cvOutput.source === 'SIMULATION') return trafficState
  return {
    ...trafficState,
    vehicleCount: cvOutput.vehicleCount,
    queueLength: cvOutput.queueLength,
    laneOccupancy: cvOutput.occupancy,
    averageSpeed: cvOutput.averageSpeed,
    trafficDensity: cvOutput.trafficDensity,
    intersectionOccupancy: cvOutput.intersectionOccupancy,
    source: 'CV_YOLO',
  }
}

/**
 * Get CV service status.
 */
export function getCVStatus() {
  // For MVP, CV is always simulated
  return 'SIMULATION'
}
