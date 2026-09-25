/* ============================================================
   Simulation Engine — Browser-based traffic simulation
   Manages the simulation loop, vehicle spawning, ambulance
   movement, signal control, and metric collection.
   ============================================================ */
import { v4 as uuidv4 } from 'uuid'
import {
  createDefaultNetwork,
  buildRouteGraph,
  findRoute,
  getApproachDirection,
} from './intersectionData'
import {
  createInitialSignalState,
  tickSignalState,
  triggerEmergency,
  markAmbulancePassed,
  SIGNAL_STATES,
} from './signalController'
import {
  calculatePriority,
  planEmergencyMovement,
  calculateETA,
} from './priorityEngine'
import {
  setIntersection,
  setTrafficState,
  setSignalState,
  setAmbulance,
  updateAmbulance,
  updateSignalState,
  addEmergencyEvent,
} from '../services/firestore'

class SimulationEngine {
  constructor() {
    this.intersections = []
    this.routeGraph = {}
    this.signalStates = {}
    this.trafficStates = {}
    this.ambulances = {}
    this.vehicles = {}
    this.eventLog = []
    this.metrics = {
      baseline: null,
      proposed: null,
    }

    this.running = false
    this.speed = 1
    this.tickInterval = null
    this.simTime = 0 // simulation seconds elapsed
    this.listeners = new Set()
  }

  /* ── Initialization ─────────────────────────── */
  async initialize() {
    this.intersections = createDefaultNetwork()
    this.routeGraph = buildRouteGraph(this.intersections)

    // Initialize signal states
    for (const int of this.intersections) {
      this.signalStates[int.id] = createInitialSignalState(int.id, int.signalConfig)
      this.trafficStates[int.id] = this._createTrafficState(int.id)

      // Persist
      await setIntersection(int.id, int)
      await setSignalState(int.id, this.signalStates[int.id])
      await setTrafficState(int.id, this.trafficStates[int.id])
    }

    // Spawn initial vehicles
    this._spawnRandomVehicles(40)

    this.log('SYSTEM', 'Simulation initialized with 4 intersections')
    this._notify()
  }

  _createTrafficState(intersectionId) {
    return {
      intersectionId,
      timestamp: new Date().toISOString(),
      vehicleCountsByLane: {},
      queueLengthByLane: {},
      occupancyByLane: {},
      densityByLane: {},
      averageSpeedByLane: {},
      detectedAmbulances: [],
      intersectionOccupied: false,
    }
  }

  /* ── Simulation Loop ────────────────────────── */
  start() {
    if (this.running) return
    this.running = true
    const tickMs = Math.max(50, 1000 / this.speed)
    this.tickInterval = setInterval(() => this.tick(1), tickMs)
    this.log('SYSTEM', `Simulation started (speed: ${this.speed}x)`)
    this._notify()
  }

  pause() {
    this.running = false
    if (this.tickInterval) clearInterval(this.tickInterval)
    this.tickInterval = null
    this.log('SYSTEM', 'Simulation paused')
    this._notify()
  }

  reset() {
    this.pause()
    this.simTime = 0
    this.ambulances = {}
    this.vehicles = {}
    this.eventLog = []
    this.initialize()
  }

  setSpeed(speed) {
    this.speed = Math.max(0.25, Math.min(10, speed))
    if (this.running) {
      clearInterval(this.tickInterval)
      const tickMs = Math.max(50, 1000 / this.speed)
      this.tickInterval = setInterval(() => this.tick(1), tickMs)
    }
    this._notify()
  }

  tick(dt = 1) {
    this.simTime += dt

    // 1. Tick signals
    this._tickSignals(dt)

    // 2. Update traffic / vehicle simulation
    this._tickTraffic(dt)

    // 3. Move ambulances
    this._tickAmbulances(dt)

    // 4. Evaluate priority
    this._evaluatePriority()

    // 5. Update traffic state
    this._updateTrafficStates()

    this._notify()
  }

  /* ── Signal Ticking ─────────────────────────── */
  _tickSignals(dt) {
    for (const intId of Object.keys(this.signalStates)) {
      const result = tickSignalState(this.signalStates[intId], dt)
      this.signalStates[intId] = result.state
      result.logs.forEach((l) => this.log(l.type, l.message))
      setSignalState(intId, this.signalStates[intId])
    }
  }

  /* ── Traffic Simulation ─────────────────────── */
  _tickTraffic(dt) {
    // Simple: randomize queue lengths, counts, etc.
    for (const int of this.intersections) {
      const ts = this.trafficStates[int.id]
      for (const [dir, approach] of Object.entries(int.approaches)) {
        for (const lane of approach.lanes) {
          const key = `${dir}_${lane}`
          // Simulate vehicles arriving/departing
          const signal = this.signalStates[int.id]?.[dir]
          let q = ts.queueLengthByLane[key] || Math.floor(Math.random() * 8)

          if (signal === 'green') {
            q = Math.max(0, q - dt * 0.8) // vehicles depart
          } else {
            q = Math.min(approach.queueCapacity, q + dt * 0.3) // vehicles arrive
          }

          ts.queueLengthByLane[key] = Math.round(q * 10) / 10
          ts.vehicleCountsByLane[key] = Math.ceil(q)
          ts.occupancyByLane[key] = Math.min(1, q / approach.queueCapacity)
          ts.densityByLane[key] = ts.occupancyByLane[key]
          ts.averageSpeedByLane[key] = signal === 'green'
            ? 25 + Math.random() * 15
            : Math.max(0, 5 - q)
        }
      }
      ts.timestamp = new Date().toISOString()
    }
  }

  /* ── Vehicle Spawning ───────────────────────── */
  _spawnRandomVehicles(count) {
    for (let i = 0; i < count; i++) {
      const int = this.intersections[Math.floor(Math.random() * this.intersections.length)]
      const dirs = Object.keys(int.approaches)
      const dir = dirs[Math.floor(Math.random() * dirs.length)]
      const lane = int.approaches[dir].lanes[0]

      const id = `VEH_${uuidv4().slice(0, 6)}`
      this.vehicles[id] = {
        id,
        type: ['car', 'car', 'car', 'bus', 'truck', 'motorcycle'][Math.floor(Math.random() * 6)],
        intersectionId: int.id,
        approach: dir,
        lane,
        speed: 20 + Math.random() * 30,
        waiting: Math.random() > 0.5,
      }
    }
  }

  /* ── Ambulance Management ───────────────────── */
  spawnAmbulance({
    origin = 'INT_1',
    destination = 'INT_4',
    priority = 'HIGH',
    speed = 48,
  } = {}) {
    const route = findRoute(this.routeGraph, origin, destination)
    if (!route) {
      this.log('ERROR', `No route from ${origin} to ${destination}`)
      return null
    }

    const originInt = this.intersections.find((i) => i.id === origin)
    const id = `AMB_${Date.now()}`

    const ambulance = {
      id,
      vehicleId: id,
      vehicleType: 'ambulance',
      location: { ...originInt.coordinates },
      speed,
      direction: 'north',
      route,
      routeIndex: 0,
      currentIntersection: origin,
      nextIntersection: route[1] || null,
      priority,
      status: 'ACTIVE',
      eta: 0,
      startTime: this.simTime,
      totalWaitTime: 0,
      signalInterruptions: 0,
      createdAt: new Date().toISOString(),
    }

    this.ambulances[id] = ambulance
    setAmbulance(id, ambulance)
    this.log('AMBULANCE', `Spawned ${id}: ${origin} → ${destination} via ${route.join(' → ')}`)
    addEmergencyEvent({
      ambulanceId: id,
      intersectionId: origin,
      eventType: 'SPAWNED',
      priorityScore: 0,
      eta: 0,
      requiredLane: null,
      requiredPath: route.join(' → '),
      decision: 'SPAWN',
      reason: `Ambulance spawned from ${origin} to ${destination}`,
    })

    this._notify()
    return ambulance
  }

  _tickAmbulances(dt) {
    for (const amb of Object.values(this.ambulances)) {
      if (amb.status !== 'ACTIVE') continue

      const currentInt = this.intersections.find((i) => i.id === amb.currentIntersection)
      const nextInt = this.intersections.find((i) => i.id === amb.nextIntersection)
      if (!nextInt) {
        // Arrived at destination
        amb.status = 'ARRIVED'
        amb.arrivalTime = this.simTime
        updateAmbulance(amb.id, { status: 'ARRIVED' })
        this.log('AMBULANCE', `${amb.id} arrived at destination ${amb.currentIntersection}`)
        addEmergencyEvent({
          ambulanceId: amb.id,
          intersectionId: amb.currentIntersection,
          eventType: 'ARRIVED',
          priorityScore: 0,
          eta: 0,
          decision: 'COMPLETE',
          reason: 'Ambulance arrived at destination',
        })
        continue
      }

      // Calculate distance to next intersection
      const dist = this._haversine(amb.location, nextInt.coordinates)
      amb.distance = dist
      amb.eta = calculateETA(dist, amb.speed)

      // Check if signal is green for the ambulance's approach
      const approach = getApproachDirection(this.routeGraph, amb.currentIntersection, amb.nextIntersection)
      const signal = this.signalStates[amb.nextIntersection]

      // Move towards next intersection
      const moveRate = (amb.speed / 3.6) * dt // m/s * dt
      const fraction = moveRate / Math.max(dist, 1)

      if (dist <= 30) {
        // Check if we can pass through
        const canPass =
          signal && signal[approach] === 'green' &&
          signal.mode !== SIGNAL_STATES.NORMAL

        if (canPass || signal?.mode === SIGNAL_STATES.EMERGENCY_GREEN) {
          // Pass through the intersection
          const sigState = this.signalStates[amb.nextIntersection]
          if (sigState.mode === SIGNAL_STATES.EMERGENCY_GREEN) {
            this.signalStates[amb.nextIntersection] = markAmbulancePassed(sigState)
            setSignalState(amb.nextIntersection, this.signalStates[amb.nextIntersection])
            amb.signalInterruptions++
          }

          amb.routeIndex++
          amb.currentIntersection = amb.nextIntersection
          amb.nextIntersection = amb.route[amb.routeIndex + 1] || null
          amb.location = { ...nextInt.coordinates }
          this.log('AMBULANCE', `${amb.id} passed through ${amb.currentIntersection}`)
        } else if (signal && signal[approach] !== 'green') {
          // Waiting at red — count wait time
          amb.totalWaitTime += dt
          amb.speed = Math.max(5, amb.speed - dt * 2) // slow down
        }
      } else {
        // Interpolate position
        const dlat = nextInt.coordinates.lat - amb.location.lat
        const dlng = nextInt.coordinates.lng - amb.location.lng
        amb.location.lat += dlat * Math.min(fraction, 1)
        amb.location.lng += dlng * Math.min(fraction, 1)
        amb.speed = Math.min(60, amb.speed + dt * 1) // speed up
      }

      updateAmbulance(amb.id, {
        location: amb.location,
        speed: amb.speed,
        eta: amb.eta,
        currentIntersection: amb.currentIntersection,
        nextIntersection: amb.nextIntersection,
        status: amb.status,
      })
    }
  }

  /* ── Priority Evaluation ────────────────────── */
  _evaluatePriority() {
    for (const amb of Object.values(this.ambulances)) {
      if (amb.status !== 'ACTIVE' || !amb.nextIntersection) continue

      const approach = getApproachDirection(this.routeGraph, amb.currentIntersection, amb.nextIntersection)
      if (!approach) continue

      const signal = this.signalStates[amb.nextIntersection]
      if (signal.mode !== SIGNAL_STATES.NORMAL) continue // already in emergency mode

      const ts = this.trafficStates[amb.nextIntersection]
      const laneKey = `${approach}_${approach[0].toUpperCase()}1`

      const result = calculatePriority({
        ambulance: {
          priority: amb.priority,
          speed: amb.speed,
          distance: amb.distance || 500,
        },
        traffic: {
          density: ts?.densityByLane?.[laneKey] ?? 0.3,
          queueLength: ts?.queueLengthByLane?.[laneKey] ?? 3,
          occupancy: ts?.occupancyByLane?.[laneKey] ?? 0.3,
        },
      })

      if (result.activated) {
        const plan = planEmergencyMovement(approach, 'through')
        this.signalStates[amb.nextIntersection] = triggerEmergency(
          signal,
          plan.approachDirection,
          plan.movement
        )
        setSignalState(amb.nextIntersection, this.signalStates[amb.nextIntersection])

        this.log('PRIORITY', `${amb.nextIntersection}: Score ${result.score}/${result.threshold} — ACTIVATED`)

        addEmergencyEvent({
          ambulanceId: amb.id,
          intersectionId: amb.nextIntersection,
          eventType: 'PRIORITY_ACTIVATED',
          priorityScore: result.score,
          eta: amb.eta,
          requiredLane: plan.requiredLane,
          requiredPath: plan.movement,
          decision: 'ACTIVATE_EMERGENCY',
          reason: result.reasons.join('; '),
        })

        // Pre-plan next intersection in corridor
        this._prePlanCorridor(amb)
      }
    }
  }

  /* ── Rolling Green Corridor ─────────────────── */
  _prePlanCorridor(ambulance) {
    const routeRemaining = ambulance.route.slice(ambulance.routeIndex + 2)
    for (const intId of routeRemaining) {
      const sig = this.signalStates[intId]
      if (sig && sig.mode === SIGNAL_STATES.NORMAL) {
        // Pre-alert: just log for now, actual trigger happens when closer
        this.log('CORRIDOR', `Pre-alerting ${intId} for ambulance ${ambulance.id}`)
      }
    }
  }

  /* ── Traffic State Updates ──────────────────── */
  _updateTrafficStates() {
    for (const int of this.intersections) {
      const ts = this.trafficStates[int.id]
      // Check for ambulances near this intersection
      ts.detectedAmbulances = Object.values(this.ambulances)
        .filter((a) => a.status === 'ACTIVE' && a.nextIntersection === int.id)
        .map((a) => a.id)

      ts.intersectionOccupied = ts.detectedAmbulances.length > 0
      setTrafficState(int.id, ts)
    }
  }

  /* ── Haversine distance (meters) ────────────── */
  _haversine(pos1, pos2) {
    const R = 6371000
    const toRad = (d) => (d * Math.PI) / 180
    const dLat = toRad(pos2.lat - pos1.lat)
    const dLng = toRad(pos2.lng - pos1.lng)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(pos1.lat)) * Math.cos(toRad(pos2.lat)) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  /* ── Event Log ──────────────────────────────── */
  log(type, message) {
    this.eventLog.push({
      time: this.simTime,
      timestamp: new Date().toISOString(),
      type,
      message,
    })
    // Keep last 200 entries
    if (this.eventLog.length > 200) this.eventLog = this.eventLog.slice(-200)
  }

  /* ── Observer pattern ───────────────────────── */
  subscribe(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  _notify() {
    const snapshot = this.getSnapshot()
    this.listeners.forEach((cb) => cb(snapshot))
  }

  getSnapshot() {
    return {
      running: this.running,
      speed: this.speed,
      simTime: this.simTime,
      intersections: this.intersections,
      signalStates: { ...this.signalStates },
      trafficStates: { ...this.trafficStates },
      ambulances: { ...this.ambulances },
      vehicles: { ...this.vehicles },
      eventLog: [...this.eventLog],
    }
  }

  /* ── Metrics ────────────────────────────────── */
  getAmbulanceMetrics(ambulanceId) {
    const amb = this.ambulances[ambulanceId]
    if (!amb) return null

    const travelTime = (amb.arrivalTime || this.simTime) - amb.startTime
    return {
      ambulanceId,
      travelTime,
      waitingTime: amb.totalWaitTime,
      signalInterruptions: amb.signalInterruptions,
      routeCleared: amb.status === 'ARRIVED',
      route: amb.route,
    }
  }
}

// Singleton
export const simulationEngine = new SimulationEngine()
export default simulationEngine
