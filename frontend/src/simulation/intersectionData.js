/* ============================================================
   Intersection Data Model
   Defines the 3–4 connected intersections in the simulation
   network, with approaches, lanes, signal config, and
   geographic coordinates.
   ============================================================ */

/**
 * Each approach has a direction (N/S/E/W), with lanes for
 * through, left-turn, right-turn, etc.
 */

const DEFAULT_SIGNAL_TIMINGS = {
  greenDuration: 30,      // seconds
  yellowDuration: 4,
  allRedDuration: 2,
  minGreen: 10,
  maxGreen: 60,
  emergencyHoldMax: 90,
}

/**
 * Create the default 4-intersection network:
 *   INT_1 ── INT_2
 *    │         │
 *   INT_3 ── INT_4
 */
export function createDefaultNetwork() {
  const intersections = [
    {
      id: 'INT_1',
      name: 'Main St & 1st Ave',
      coordinates: { lat: 8.1853, lng: 77.4099 },
      approaches: {
        north: { lanes: ['N1', 'N2'], queueCapacity: 15 },
        south: { lanes: ['S1', 'S2'], queueCapacity: 15 },
        east:  { lanes: ['E1', 'E2'], queueCapacity: 15 },
        west:  { lanes: ['W1', 'W2'], queueCapacity: 15 },
      },
      connectedIntersections: {
        east: 'INT_2',
        south: 'INT_3',
      },
      signalConfig: { ...DEFAULT_SIGNAL_TIMINGS },
      status: 'NORMAL',
    },
    {
      id: 'INT_2',
      name: 'Main St & 2nd Ave',
      coordinates: { lat: 8.1853, lng: 77.4139 },
      approaches: {
        north: { lanes: ['N1', 'N2'], queueCapacity: 15 },
        south: { lanes: ['S1', 'S2'], queueCapacity: 15 },
        east:  { lanes: ['E1', 'E2'], queueCapacity: 15 },
        west:  { lanes: ['W1', 'W2'], queueCapacity: 15 },
      },
      connectedIntersections: {
        west: 'INT_1',
        south: 'INT_4',
      },
      signalConfig: { ...DEFAULT_SIGNAL_TIMINGS },
      status: 'NORMAL',
    },
    {
      id: 'INT_3',
      name: 'Park St & 1st Ave',
      coordinates: { lat: 8.1813, lng: 77.4099 },
      approaches: {
        north: { lanes: ['N1', 'N2'], queueCapacity: 15 },
        south: { lanes: ['S1', 'S2'], queueCapacity: 15 },
        east:  { lanes: ['E1', 'E2'], queueCapacity: 15 },
        west:  { lanes: ['W1', 'W2'], queueCapacity: 15 },
      },
      connectedIntersections: {
        north: 'INT_1',
        east: 'INT_4',
      },
      signalConfig: { ...DEFAULT_SIGNAL_TIMINGS },
      status: 'NORMAL',
    },
    {
      id: 'INT_4',
      name: 'Park St & 2nd Ave',
      coordinates: { lat: 8.1813, lng: 77.4139 },
      approaches: {
        north: { lanes: ['N1', 'N2'], queueCapacity: 15 },
        south: { lanes: ['S1', 'S2'], queueCapacity: 15 },
        east:  { lanes: ['E1', 'E2'], queueCapacity: 15 },
        west:  { lanes: ['W1', 'W2'], queueCapacity: 15 },
      },
      connectedIntersections: {
        north: 'INT_2',
        west: 'INT_3',
      },
      signalConfig: { ...DEFAULT_SIGNAL_TIMINGS },
      status: 'NORMAL',
    },
  ]

  return intersections
}

/**
 * Create the route graph for computing paths.
 */
export function buildRouteGraph(intersections) {
  const graph = {}
  intersections.forEach((int) => {
    graph[int.id] = {
      ...int,
      neighbors: Object.entries(int.connectedIntersections).map(([dir, id]) => ({
        direction: dir,
        intersectionId: id,
      })),
    }
  })
  return graph
}

/**
 * Find shortest path between two intersections (BFS).
 */
export function findRoute(graph, fromId, toId) {
  const visited = new Set()
  const queue = [[fromId]]
  visited.add(fromId)

  while (queue.length > 0) {
    const path = queue.shift()
    const current = path[path.length - 1]

    if (current === toId) return path

    const node = graph[current]
    if (!node) continue

    for (const neighbor of node.neighbors) {
      if (!visited.has(neighbor.intersectionId)) {
        visited.add(neighbor.intersectionId)
        queue.push([...path, neighbor.intersectionId])
      }
    }
  }
  return null // no path
}

/**
 * Determine approach direction from one intersection to another.
 */
export function getApproachDirection(graph, fromId, toId) {
  const node = graph[fromId]
  if (!node) return null
  const neighbor = node.neighbors.find((n) => n.intersectionId === toId)
  // The approach direction at toId is the opposite of the link direction
  const opposites = { north: 'south', south: 'north', east: 'west', west: 'east' }
  return neighbor ? opposites[neighbor.direction] : null
}

export { DEFAULT_SIGNAL_TIMINGS }
