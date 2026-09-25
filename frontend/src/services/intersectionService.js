/* ============================================================
   Intersection Service — Detects which controlled intersections
   are near an ambulance route and builds the emergency corridor.
   
   Uses the existing INT_1–INT_4 network as known controlled
   intersections. Given a route geometry, finds which
   intersections are close to the route, sorts them by route
   order, and produces a corridor plan.
   ============================================================ */

import { haversineDistance } from './mapService'

/**
 * Default proximity threshold in meters.
 * An intersection is considered "on the route" if the route
 * passes within this distance of the intersection.
 */
const DEFAULT_PROXIMITY_M = 150

/**
 * Find which controlled intersections lie near a route.
 *
 * @param {Array<Object>} intersections  — Array of intersection objects with { id, coordinates: { lat, lng } }
 * @param {Array<[lat, lng]>} routeCoordinates  — Leaflet-order polyline
 * @param {number} [proximityM=150]  — max distance from route to count as "on route"
 * @returns {Array<{ intersection, minDistance, nearestRouteIndex }>}  — sorted by route order
 */
export function findIntersectionsAlongRoute(intersections, routeCoordinates, proximityM = DEFAULT_PROXIMITY_M) {
  if (!routeCoordinates || routeCoordinates.length === 0) return []

  const results = []

  for (const int of intersections) {
    let minDist = Infinity
    let nearestIdx = 0

    // Check distance from intersection to each route segment point
    for (let i = 0; i < routeCoordinates.length; i++) {
      const routePoint = { lat: routeCoordinates[i][0], lng: routeCoordinates[i][1] }
      const dist = haversineDistance(int.coordinates, routePoint)
      if (dist < minDist) {
        minDist = dist
        nearestIdx = i
      }
    }

    if (minDist <= proximityM) {
      results.push({
        intersection: int,
        minDistance: minDist,
        nearestRouteIndex: nearestIdx,
      })
    }
  }

  // Sort by route order (ascending nearestRouteIndex)
  results.sort((a, b) => a.nearestRouteIndex - b.nearestRouteIndex)

  return results
}

/**
 * Build an emergency corridor from detected intersections.
 *
 * @param {Array<Object>} intersections  — full intersection list
 * @param {Array<[lat, lng]>} routeCoordinates
 * @param {number} [proximityM=150]
 * @returns {Object} corridor
 */
export function buildEmergencyCorridor(intersections, routeCoordinates, proximityM = DEFAULT_PROXIMITY_M) {
  const detected = findIntersectionsAlongRoute(intersections, routeCoordinates, proximityM)

  return {
    intersectionIds: detected.map((d) => d.intersection.id),
    intersections: detected.map((d) => ({
      id: d.intersection.id,
      name: d.intersection.name,
      lat: d.intersection.coordinates.lat,
      lng: d.intersection.coordinates.lng,
      distanceFromRoute: Math.round(d.minDistance),
      routeIndex: d.nearestRouteIndex,
    })),
    count: detected.length,
  }
}

/**
 * Determine the approach direction for an ambulance arriving
 * at an intersection, based on its heading.
 *
 * @param {number} heading — bearing in degrees [0, 360)
 * @returns {string} — 'north', 'south', 'east', 'west'
 */
export function headingToApproach(heading) {
  // Normalize to [0, 360)
  const h = ((heading % 360) + 360) % 360

  // The approach direction is the direction the ambulance is coming FROM,
  // which is the opposite of the heading direction.
  // Heading 0 = moving north → approaching from south
  // Heading 90 = moving east → approaching from west
  // Heading 180 = moving south → approaching from north
  // Heading 270 = moving west → approaching from east

  if (h >= 315 || h < 45) return 'south'    // heading north, approach from south
  if (h >= 45 && h < 135) return 'west'     // heading east, approach from west
  if (h >= 135 && h < 225) return 'north'   // heading south, approach from north
  return 'east'                              // heading west, approach from east
}

/**
 * Given an ambulance's current position and the corridor,
 * find the next intersection ahead on the route.
 *
 * @param {{ lat, lng }} position
 * @param {Array<{ id, lat, lng, routeIndex }>} corridorIntersections
 * @param {number} currentRouteIndex — approximate index on the route polyline
 * @returns {Object | null}
 */
export function findNextIntersection(position, corridorIntersections, currentRouteIndex) {
  // Find the first corridor intersection whose routeIndex is ahead of current position
  for (const ci of corridorIntersections) {
    if (ci.routeIndex > currentRouteIndex) {
      return ci
    }
  }
  return null
}

/**
 * Calculate distance from a position to a specific intersection.
 */
export function distanceToIntersection(position, intersection) {
  return haversineDistance(position, { lat: intersection.lat, lng: intersection.lng })
}
