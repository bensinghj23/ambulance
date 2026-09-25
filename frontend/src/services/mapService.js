/* ============================================================
   Map Service — OSRM routing, distance, duration, geometry
   Uses public OSRM endpoint for MVP. Falls back gracefully
   to straight-line routing when OSRM is unavailable.
   ============================================================ */

const OSRM_BASE = 'https://router.project-osrm.org'
const ROUTE_TIMEOUT_MS = 8000

/**
 * Fetch a driving route between two coordinates via OSRM.
 * @param {{ lat: number, lng: number }} origin
 * @param {{ lat: number, lng: number }} destination
 * @returns {Promise<RouteResult | null>}
 *
 * RouteResult: {
 *   distanceMeters: number,
 *   durationSeconds: number,
 *   geometry: GeoJSON LineString,
 *   coordinates: Array<[lat, lng]>,  // Leaflet order
 *   waypoints: Array<{ lat, lng, name }>,
 *   raw: object
 * }
 */
export async function fetchRoute(origin, destination) {
  // OSRM uses lng,lat order
  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS)

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(`[mapService] OSRM HTTP ${res.status}`)
      return null
    }

    const data = await res.json()

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn(`[mapService] OSRM returned no routes: ${data.code}`)
      return null
    }

    const route = data.routes[0]
    const geojson = route.geometry // GeoJSON LineString

    // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
    const coordinates = geojson.coordinates.map(([lng, lat]) => [lat, lng])

    const waypoints = (data.waypoints || []).map((wp) => ({
      lat: wp.location[1],
      lng: wp.location[0],
      name: wp.name || '',
    }))

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: geojson,
      coordinates,
      waypoints,
      steps: route.legs?.[0]?.steps || [],
      raw: data,
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[mapService] OSRM request timed out')
    } else {
      console.warn('[mapService] OSRM fetch failed:', err.message)
    }
    return null
  }
}

/**
 * Create a fallback straight-line route between two coordinates.
 * Used when OSRM is unavailable.
 */
export function createFallbackRoute(origin, destination) {
  const dist = haversineDistance(origin, destination)
  // Estimate duration at ~40 km/h average speed
  const dur = dist / (40 / 3.6)

  return {
    distanceMeters: dist,
    durationSeconds: dur,
    geometry: {
      type: 'LineString',
      coordinates: [
        [origin.lng, origin.lat],
        [destination.lng, destination.lat],
      ],
    },
    coordinates: [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ],
    waypoints: [
      { lat: origin.lat, lng: origin.lng, name: 'Origin' },
      { lat: destination.lat, lng: destination.lng, name: 'Destination' },
    ],
    steps: [],
    raw: null,
    isFallback: true,
  }
}

/**
 * Fetch a route with automatic fallback.
 */
export async function fetchRouteWithFallback(origin, destination) {
  const route = await fetchRoute(origin, destination)
  if (route) {
    return { ...route, isFallback: false }
  }
  console.warn('[mapService] Using fallback straight-line route')
  return createFallbackRoute(origin, destination)
}

/**
 * Haversine distance in meters between two {lat, lng} points.
 */
export function haversineDistance(pos1, pos2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(pos2.lat - pos1.lat)
  const dLng = toRad(pos2.lng - pos1.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Calculate the total length of a coordinate array in meters.
 * @param {Array<[lat, lng]>} coordinates  — Leaflet order
 */
export function polylineLength(coordinates) {
  let total = 0
  for (let i = 1; i < coordinates.length; i++) {
    total += haversineDistance(
      { lat: coordinates[i - 1][0], lng: coordinates[i - 1][1] },
      { lat: coordinates[i][0], lng: coordinates[i][1] }
    )
  }
  return total
}

/**
 * Given a polyline (array of [lat, lng]), a distance travelled (meters),
 * return the interpolated position and heading.
 *
 * @param {Array<[lat, lng]>} coordinates
 * @param {number} distanceTravelled  — meters from start
 * @returns {{ lat, lng, heading, segmentIndex, fraction }}
 */
export function interpolateAlongRoute(coordinates, distanceTravelled) {
  if (!coordinates || coordinates.length === 0) {
    return { lat: 0, lng: 0, heading: 0, segmentIndex: 0, fraction: 0 }
  }
  if (coordinates.length === 1) {
    return { lat: coordinates[0][0], lng: coordinates[0][1], heading: 0, segmentIndex: 0, fraction: 0 }
  }

  let accumulated = 0

  for (let i = 1; i < coordinates.length; i++) {
    const segStart = { lat: coordinates[i - 1][0], lng: coordinates[i - 1][1] }
    const segEnd = { lat: coordinates[i][0], lng: coordinates[i][1] }
    const segLen = haversineDistance(segStart, segEnd)

    if (accumulated + segLen >= distanceTravelled) {
      // Interpolate within this segment
      const remaining = distanceTravelled - accumulated
      const fraction = segLen > 0 ? remaining / segLen : 0
      const lat = segStart.lat + (segEnd.lat - segStart.lat) * fraction
      const lng = segStart.lng + (segEnd.lng - segStart.lng) * fraction
      const heading = calculateBearing(segStart, segEnd)

      return { lat, lng, heading, segmentIndex: i - 1, fraction }
    }

    accumulated += segLen
  }

  // Past the end — return last coordinate
  const last = coordinates[coordinates.length - 1]
  const prev = coordinates[coordinates.length - 2]
  return {
    lat: last[0],
    lng: last[1],
    heading: calculateBearing(
      { lat: prev[0], lng: prev[1] },
      { lat: last[0], lng: last[1] }
    ),
    segmentIndex: coordinates.length - 2,
    fraction: 1,
  }
}

/**
 * Calculate bearing from pos1 to pos2 in degrees [0, 360).
 */
export function calculateBearing(pos1, pos2) {
  const toRad = (d) => (d * Math.PI) / 180
  const toDeg = (r) => (r * 180) / Math.PI

  const dLng = toRad(pos2.lng - pos1.lng)
  const lat1 = toRad(pos1.lat)
  const lat2 = toRad(pos2.lat)

  const x = Math.sin(dLng) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  return (toDeg(Math.atan2(x, y)) + 360) % 360
}
