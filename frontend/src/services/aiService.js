/* ============================================================
   AI Service — Abstraction layer for clearance prediction.
   Sources: AI_SERVICE (Python FastAPI) or SIMULATION_FALLBACK.
   ============================================================ */

import { estimateClearanceTime } from '../simulation/trafficEngine'

const AI_SERVICE_URL = 'http://localhost:8000'
const AI_TIMEOUT_MS = 3000

let aiServiceAvailable = null // null = unknown, true/false after first check

/**
 * Check if the Python AI service is running.
 */
export async function checkAIServiceHealth() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
    const res = await fetch(`${AI_SERVICE_URL}/health`, { signal: controller.signal })
    clearTimeout(timeout)
    aiServiceAvailable = res.ok
    return aiServiceAvailable
  } catch {
    aiServiceAvailable = false
    return false
  }
}

/**
 * Predict intersection clearance time.
 * Tries AI service first, falls back to simulation model.
 *
 * @param {Object} input
 * @returns {{ predictedClearanceTime, source, model, modelVersion }}
 */
export async function predictClearanceTime(input) {
  // Try AI service if available or unknown
  if (aiServiceAvailable !== false) {
    try {
      const result = await callAIService(input)
      if (result) {
        aiServiceAvailable = true
        return {
          ...result,
          source: 'AI_SERVICE',
        }
      }
    } catch {
      aiServiceAvailable = false
    }
  }

  // Simulation fallback
  return estimateClearanceTime(input)
}

/**
 * Call the Python FastAPI prediction endpoint.
 */
async function callAIService(input) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

    const res = await fetch(`${AI_SERVICE_URL}/predict-clearance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleCount: input.vehicleCount || 0,
        queueLength: input.queueLength || 0,
        averageSpeed: input.averageSpeed || 30,
        trafficDensity: input.trafficDensity || 0.3,
        laneOccupancy: input.laneOccupancy || 0.3,
        currentSignalPhase: input.currentSignalPhase || 'NS_GREEN',
        remainingGreen: input.remainingGreenSeconds || 15,
        intersectionOccupancy: input.intersectionOccupancy ? 1 : 0,
        ambulanceETA: input.ambulanceETA || 60,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) return null

    const data = await res.json()
    return {
      predictedClearanceTime: data.predictedClearanceTime,
      model: data.model || 'unknown',
      modelVersion: data.modelVersion || '0',
    }
  } catch {
    return null
  }
}

/**
 * Get current AI service status.
 */
export function getAIServiceStatus() {
  if (aiServiceAvailable === true) return 'CONNECTED'
  if (aiServiceAvailable === false) return 'DISCONNECTED'
  return 'UNKNOWN'
}
