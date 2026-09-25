/* ============================================================
   Route Engine — Candidate route selection with traffic-aware
   ETA prediction. Evaluates multiple OSRM routes and selects
   the one with lowest predicted emergency ETA.
   ============================================================ */
import { fetchRoute, createFallbackRoute, polylineLength, haversineDistance, calculateBearing } from '../services/mapService'
import { findIntersectionsAlongRoute } from '../services/intersectionService'

const OSRM_ALTERNATIVES_URL = 'https://router.project-osrm.org'

/**
 * Fetch candidate routes between origin and destination.
 * Requests OSRM alternatives when available.
 * @returns {Array<CandidateRoute>}
 */
export async function fetchCandidateRoutes(origin, destination) {
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const url = `${OSRM_ALTERNATIVES_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true&alternatives=3`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return [createFallbackRoute(origin, destination)]

    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) {
      return [createFallbackRoute(origin, destination)]
    }

    return data.routes.map((route, idx) => {
      const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      return {
        id: `ROUTE_${String.fromCharCode(65 + idx)}`,
        geometry: route.geometry,
        coordinates,
        distanceMeters: route.distance,
        baseTravelTimeSeconds: route.duration,
        steps: route.legs?.[0]?.steps || [],
        isFallback: false,
      }
    })
  } catch (err) {
    console.warn('[routeEngine] OSRM alternatives failed:', err.message)
    return [createFallbackRoute(origin, destination)]
  }
}

/**
 * Evaluate a candidate route against current traffic conditions.
 * @param {Object} route - candidate route
 * @param {Array} intersections - controlled intersection list
 * @param {Object} trafficStates - current traffic states keyed by intersection ID
 * @param {Object} signalStates - current signal states keyed by intersection ID
 * @param {number} ambulanceSpeed - km/h
 * @returns {EvaluatedRoute}
 */
export function evaluateRoute(route, intersections, trafficStates, signalStates, ambulanceSpeed = 48) {
  // Find intersections along this route
  const detected = findIntersectionsAlongRoute(intersections, route.coordinates, 150)

  // Base road travel time
  const roadTravelTime = route.baseTravelTimeSeconds || (route.distanceMeters / (ambulanceSpeed / 3.6))

  // Traffic delay: sum of delays from intersection traffic states
  let trafficDelaySeconds = 0
  let intersectionDelaySeconds = 0
  let signalDelaySeconds = 0
  let totalQueueLength = 0
  let maxDensity = 0

  for (const det of detected) {
    const intId = det.intersection.id
    const ts = trafficStates[intId]
    const sig = signalStates[intId]

    if (ts) {
      // Average queue across all lanes
      const queues = Object.values(ts.queueLengthByLane || {})
      const avgQueue = queues.length > 0 ? queues.reduce((a, b) => a + b, 0) / queues.length : 0
      totalQueueLength += avgQueue

      // Traffic density
      const densities = Object.values(ts.densityByLane || {})
      const avgDensity = densities.length > 0 ? densities.reduce((a, b) => a + b, 0) / densities.length : 0
      maxDensity = Math.max(maxDensity, avgDensity)

      // Traffic delay: ~2s per queued vehicle
      trafficDelaySeconds += avgQueue * 2

      // Intersection clearance delay: based on density
      intersectionDelaySeconds += avgDensity > 0.6 ? 15 : avgDensity > 0.3 ? 8 : 3
    }

    if (sig) {
      // Signal delay: if currently red for likely approach, add remaining red time
      const phase = sig.phase || ''
      if (sig.mode === 'NORMAL') {
        signalDelaySeconds += sig.phaseDuration ? sig.phaseDuration / 2 : 5 // average wait
      }
    }
  }

  // Traffic level classification
  let trafficLevel = 'LOW'
  if (maxDensity > 0.6) trafficLevel = 'HIGH'
  else if (maxDensity > 0.3) trafficLevel = 'MEDIUM'

  // Predicted emergency ETA
  const predictedEmergencyETASec = roadTravelTime + trafficDelaySeconds + intersectionDelaySeconds + signalDelaySeconds

  return {
    ...route,
    trafficDelaySeconds: Math.round(trafficDelaySeconds),
    intersectionDelaySeconds: Math.round(intersectionDelaySeconds),
    signalDelaySeconds: Math.round(signalDelaySeconds),
    predictedEmergencyETASec: Math.round(predictedEmergencyETASec),
    trafficLevel,
    totalQueueLength: Math.round(totalQueueLength),
    corridorIntersections: detected.map(d => d.intersection.id),
    feasible: true,
    selected: false,
  }
}

/**
 * Select the best route from evaluated candidates.
 * Objective: lowest predicted emergency ETA.
 */
export function selectBestRoute(evaluatedRoutes) {
  if (!evaluatedRoutes || evaluatedRoutes.length === 0) return null

  const feasible = evaluatedRoutes.filter(r => r.feasible)
  if (feasible.length === 0) return evaluatedRoutes[0]

  feasible.sort((a, b) => a.predictedEmergencyETASec - b.predictedEmergencyETASec)

  const selected = { ...feasible[0], selected: true }
  return selected
}

/**
 * Full pipeline: fetch candidates, evaluate, select best.
 */
export async function planRoute(origin, destination, intersections, trafficStates, signalStates, ambulanceSpeed = 48) {
  const candidates = await fetchCandidateRoutes(origin, destination)

  const evaluated = candidates.map(c =>
    evaluateRoute(c, intersections, trafficStates, signalStates, ambulanceSpeed)
  )

  const best = selectBestRoute(evaluated)

  return {
    candidates: evaluated.map((r, i) => ({ ...r, selected: r.id === best?.id })),
    selected: best,
  }
}

/* ── Phase 6: Intelligent ETA ──────────────────── */

/**
 * Calculate predicted ETA with component breakdown.
 */
export function calculatePredictedETA({ roadTravelTime, trafficDelay, intersectionDelay, signalDelay }) {
  const totalETA = (roadTravelTime || 0) + (trafficDelay || 0) + (intersectionDelay || 0) + (signalDelay || 0)
  return {
    totalETA: Math.round(totalETA),
    roadTravelTime: Math.round(roadTravelTime || 0),
    trafficDelay: Math.round(trafficDelay || 0),
    intersectionDelay: Math.round(intersectionDelay || 0),
    signalDelay: Math.round(signalDelay || 0),
  }
}

/* ── Phase 7: Movement Direction ───────────────── */

/**
 * Determine movement direction at an intersection from route geometry.
 * @param {Array<[lat,lng]>} routeCoords
 * @param {{ lat, lng }} intersectionPos
 * @param {number} nearestRouteIndex
 * @returns {{ approach, exit, movement, turnAngle }}
 */
export function detectMovementAtIntersection(routeCoords, intersectionPos, nearestRouteIndex) {
  if (!routeCoords || routeCoords.length < 3 || nearestRouteIndex < 1) {
    return { approach: 'north', exit: 'north', movement: 'STRAIGHT', turnAngle: 0 }
  }

  // Points before and after intersection on route
  const beforeIdx = Math.max(0, nearestRouteIndex - 3)
  const afterIdx = Math.min(routeCoords.length - 1, nearestRouteIndex + 3)

  const before = { lat: routeCoords[beforeIdx][0], lng: routeCoords[beforeIdx][1] }
  const at = { lat: routeCoords[nearestRouteIndex][0], lng: routeCoords[nearestRouteIndex][1] }
  const after = { lat: routeCoords[afterIdx][0], lng: routeCoords[afterIdx][1] }

  // Bearing approaching intersection
  const approachBearing = calculateBearing(before, at)
  // Bearing leaving intersection
  const exitBearing = calculateBearing(at, after)

  // Turn angle (positive = right, negative = left)
  let turnAngle = exitBearing - approachBearing
  if (turnAngle > 180) turnAngle -= 360
  if (turnAngle < -180) turnAngle += 360

  // Classify movement
  let movement = 'STRAIGHT'
  if (Math.abs(turnAngle) < 30) movement = 'STRAIGHT'
  else if (turnAngle >= 30 && turnAngle < 150) movement = 'RIGHT'
  else if (turnAngle <= -30 && turnAngle > -150) movement = 'LEFT'
  else movement = 'U_TURN'

  // Cardinal approach/exit
  const approach = bearingToCardinal(approachBearing)
  const exit = bearingToCardinal(exitBearing)

  return { approach, exit, movement, turnAngle: Math.round(turnAngle) }
}

function bearingToCardinal(bearing) {
  const b = ((bearing % 360) + 360) % 360
  if (b >= 315 || b < 45) return 'north'
  if (b >= 45 && b < 135) return 'east'
  if (b >= 135 && b < 225) return 'south'
  return 'west'
}
