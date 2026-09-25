/* ============================================================
   Simulation Engine — Browser-based traffic simulation
   Integrates all sub-engines (route, traffic, AI, decision,
   corridor, conflict) into a cohesive architecture loop.
   ============================================================ */
import { v4 as uuidv4 } from 'uuid'
import { createDefaultNetwork, buildRouteGraph, findRoute } from './intersectionData'
import { createInitialSignalState, tickSignalState, triggerEmergency, markAmbulancePassed, SIGNAL_STATES } from './signalController'
import { setIntersection, setTrafficState, setSignalState, setAmbulance, updateAmbulance, addEmergencyEvent } from '../services/firestore'
import { interpolateAlongRoute, polylineLength, haversineDistance } from '../services/mapService'
import { buildEmergencyCorridor, distanceToIntersection } from '../services/intersectionService'

import { planRoute, detectMovementAtIntersection } from './routeEngine'
import { computeEnhancedTrafficState, applyTrafficMultiplier } from './trafficEngine'
import { makeDecision, DECISION_ACTIONS, requiresSignalAction } from './decisionEngine'
import { predictClearanceTime, checkAIServiceHealth } from '../services/aiService'
import { computeCorridorStates, getIntersectionsToActivate, getCorridorSummary } from './greenCorridorEngine'
import { detectConflicts, advanceConflictQueue, playConflictAlert, CONFLICT_STATES } from './conflictEngine'
import { createCVOutput, mergeCVIntoTrafficState } from '../services/cvService'
import { initMqtt } from '../services/mqttService'
import { createTelemetryUpdate } from '../services/telemetryService'
import { sendSignalCommandToSUMO, syncTrafficStateFromSUMO } from './sumoAdapter'

class SimulationEngine {
  constructor() {
    this.intersections = []
    this.routeGraph = {}
    this.signalStates = {}
    this.trafficStates = {} // Enhanced traffic states
    this.rawTrafficStates = {} // Raw basic counts before CV/SUMO
    this.ambulances = {}
    this.vehicles = {}
    this.conflicts = []
    this.eventLog = []
    
    this.running = false
    this.speed = 1
    this.trafficMultiplier = 1.0 // For demo controls
    this.tickInterval = null
    this.simTime = 0
    this.listeners = new Set()
  }

  async initialize() {
    this.intersections = createDefaultNetwork()
    this.routeGraph = buildRouteGraph(this.intersections)

    initMqtt()
    checkAIServiceHealth()

    for (const int of this.intersections) {
      this.signalStates[int.id] = createInitialSignalState(int.id, int.signalConfig)
      this.rawTrafficStates[int.id] = this._createRawTrafficState(int.id)
      this.trafficStates[int.id] = computeEnhancedTrafficState(this.rawTrafficStates[int.id], this.signalStates[int.id])

      await setIntersection(int.id, int)
      await setSignalState(int.id, this.signalStates[int.id])
      await setTrafficState(int.id, this.trafficStates[int.id])
    }

    this._spawnRandomVehicles(40)
    this.log('SYSTEM', 'Simulation initialized')
    this._notify()
  }

  _createRawTrafficState(intersectionId) {
    return {
      intersectionId,
      queueLengthByLane: {},
      occupancyByLane: {},
      densityByLane: {},
      averageSpeedByLane: {},
      vehicleCountsByLane: {},
      detectedAmbulances: [],
      intersectionOccupied: false,
    }
  }

  start() {
    if (this.running) return
    this.running = true
    const tickMs = Math.max(50, 1000 / this.speed)
    this.tickInterval = setInterval(() => this.tick(1), tickMs)
    this.log('SYSTEM', `Simulation started (${this.speed}x)`)
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
    this.conflicts = []
    this.eventLog = []
    this.trafficMultiplier = 1.0
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

  setTrafficMultiplier(multiplier) {
    this.trafficMultiplier = Math.max(0.1, Math.min(3.0, multiplier))
    this.log('SYSTEM', `Traffic modified: ${(this.trafficMultiplier * 100).toFixed(0)}%`)
    this._notify()
  }

  async tick(dt = 1) {
    this.simTime += dt

    this._tickSignals(dt)
    this._tickTraffic(dt)
    this._tickAmbulances(dt)
    await this._evaluateSystemState()

    this._notify()
  }

  _tickSignals(dt) {
    for (const intId of Object.keys(this.signalStates)) {
      const result = tickSignalState(this.signalStates[intId], dt)
      this.signalStates[intId] = result.state
      result.logs.forEach((l) => this.log(l.type, l.message))
      setSignalState(intId, this.signalStates[intId])
      sendSignalCommandToSUMO(intId, this.signalStates[intId])
    }
  }

  _tickTraffic(dt) {
    for (const int of this.intersections) {
      const ts = this.rawTrafficStates[int.id]
      let maxDensity = 0
      
      for (const [dir, approach] of Object.entries(int.approaches)) {
        for (const lane of approach.lanes) {
          const key = `${dir}_${lane}`
          const signal = this.signalStates[int.id]?.[dir]
          
          let q = ts.queueLengthByLane[key] || Math.floor(Math.random() * 5)
          if (signal === 'green') q = Math.max(0, q - dt * 0.8)
          else q = Math.min(approach.queueCapacity, q + dt * 0.3)

          ts.queueLengthByLane[key] = Math.round(q * 10) / 10
          ts.vehicleCountsByLane[key] = Math.ceil(q)
          ts.occupancyByLane[key] = Math.min(1, q / approach.queueCapacity)
          ts.densityByLane[key] = ts.occupancyByLane[key]
          ts.averageSpeedByLane[key] = signal === 'green' ? 25 + Math.random() * 15 : Math.max(0, 5 - q)
          
          maxDensity = Math.max(maxDensity, ts.densityByLane[key])
        }
      }
      
      ts.intersectionOccupied = maxDensity > 0.8 && Math.random() > 0.7
    }

    const modifiedRawStates = applyTrafficMultiplier(this.rawTrafficStates, this.trafficMultiplier)
    
    for (const int of this.intersections) {
      const raw = modifiedRawStates[int.id]
      const sig = this.signalStates[int.id]
      
      let enhanced = computeEnhancedTrafficState(raw, sig)
      const cvOutput = createCVOutput(int.id) 
      enhanced = mergeCVIntoTrafficState(enhanced, cvOutput)
      enhanced = syncTrafficStateFromSUMO(enhanced)
      
      enhanced.detectedAmbulances = Object.values(this.ambulances)
        .filter((a) => a.status === 'ACTIVE' && a.nextIntersection === int.id)
        .map((a) => a.id)
        
      if (enhanced.detectedAmbulances.length > 0 && Math.random() > 0.5) {
        enhanced.intersectionOccupancy = true
      }

      this.trafficStates[int.id] = enhanced
      setTrafficState(int.id, enhanced)
    }
  }

  async spawnAmbulance({ origin = 'INT_1', destination = 'INT_4', priority = 'HIGH', speed = 48 } = {}) {
    const originInt = this.intersections.find((i) => i.id === origin)
    const destInt = this.intersections.find((i) => i.id === destination)
    if (!originInt || !destInt) return null

    const id = `AMB_${Date.now()}`
    
    this.log('ROUTING', `Fetching candidate routes: ${origin} → ${destination}`)
    const routeData = await planRoute(originInt.coordinates, destInt.coordinates, this.intersections, this.trafficStates, this.signalStates, speed)
    const bestRoute = routeData.selected

    const corridor = buildEmergencyCorridor(this.intersections, bestRoute.coordinates, 150)
    const routeTotalDistance = bestRoute.distanceMeters || polylineLength(bestRoute.coordinates)

    const ambulance = {
      id,
      vehicleType: 'ambulance',
      location: { lat: originInt.coordinates.lat, lng: originInt.coordinates.lng },
      speed,
      heading: 0,
      priority,
      status: 'ACTIVE',
      origin,
      destination,
      route: bestRoute.corridorIntersections || findRoute(this.routeGraph, origin, destination),
      routeIndex: 0,
      routeGeometry: bestRoute.coordinates,
      routeDistanceTotal: routeTotalDistance,
      routeDistanceTravelled: 0,
      
      corridor: corridor.intersections,
      corridorIds: corridor.intersectionIds,
      corridorStates: [],
      
      currentIntersection: origin,
      nextIntersection: corridor.intersectionIds[0],
      eta: bestRoute.predictedEmergencyETASec || 0,
      distanceRemaining: routeTotalDistance,
      distanceToNextIntersection: 0,
      movement: 'STRAIGHT',
      
      candidates: routeData.candidates,
      startTime: this.simTime,
      totalWaitTime: 0,
      createdAt: new Date().toISOString(),
      isReal: false
    }

    this.ambulances[id] = ambulance
    setAmbulance(id, ambulance)

    this.log('AMBULANCE', `Spawned ${id}: Selected route with ETA ${Math.round(ambulance.eta)}s`)
    addEmergencyEvent({
      ambulanceId: id,
      intersectionId: origin,
      eventType: 'SPAWNED',
      priorityScore: 0,
      eta: ambulance.eta,
      decision: 'SPAWN',
      reason: `Spawned ${id}`,
    })

    this._notify()
    return ambulance
  }

  _tickAmbulances(dt) {
    for (const amb of Object.values(this.ambulances)) {
      if (amb.status !== 'ACTIVE') continue

      if (amb.routeDistanceTravelled >= amb.routeDistanceTotal) {
        this._markArrived(amb)
        continue
      }

      const pos = interpolateAlongRoute(amb.routeGeometry, amb.routeDistanceTravelled)
      amb.location = { lat: pos.lat, lng: pos.lng }
      amb.heading = pos.heading
      
      amb.distanceRemaining = amb.routeDistanceTotal - amb.routeDistanceTravelled
      // Only recalculate simple ETA for moving, intelligent ETA is handled by routeEngine
      if (amb.speed > 0) {
          // simple time-to-distance update, will be refined in _evaluateSystemState
          amb.eta = amb.distanceRemaining / (amb.speed / 3.6) 
      }

      const nextIntInfo = this._findNextCorridorIntersection(amb, pos.segmentIndex)
      
      if (nextIntInfo) {
        amb.nextIntersection = nextIntInfo.id
        amb.distanceToNextIntersection = distanceToIntersection(amb.location, nextIntInfo)
        
        const moveDetails = detectMovementAtIntersection(amb.routeGeometry, nextIntInfo.coordinates, pos.segmentIndex)
        amb.movement = moveDetails.movement
        amb.approach = moveDetails.approach
      }

      const nearNext = amb.distanceToNextIntersection <= 30 && amb.nextIntersection
      const signal = amb.nextIntersection ? this.signalStates[amb.nextIntersection] : null

      let canPass = false
      if (nearNext && signal) {
         const approach = amb.approach || 'north'
         canPass = (signal[approach] === 'green' && signal.mode !== SIGNAL_STATES.NORMAL) || signal.mode === SIGNAL_STATES.EMERGENCY_GREEN
         
         // Conflict check: if we are in conflict and QUEUED, we cannot pass
         const conflict = this.conflicts.find(c => c.intersectionId === amb.nextIntersection && c.state !== CONFLICT_STATES.CLEARED)
         if (conflict && conflict.servingAmbulanceId !== amb.id) {
             canPass = false
         }
      }

      if (nearNext && signal && canPass) {
        if (signal.mode === SIGNAL_STATES.EMERGENCY_GREEN) {
          this.signalStates[amb.nextIntersection] = markAmbulancePassed(signal)
          setSignalState(amb.nextIntersection, this.signalStates[amb.nextIntersection])
          
          // clear conflict if any
          const conflictIdx = this.conflicts.findIndex(c => c.intersectionId === amb.nextIntersection && c.state !== CONFLICT_STATES.CLEARED)
          if (conflictIdx >= 0) {
              this.conflicts[conflictIdx] = advanceConflictQueue(this.conflicts[conflictIdx], amb.id)
          }
        }
        amb.currentIntersection = amb.nextIntersection
        amb.corridorIndex++
        amb.routeDistanceTravelled += (amb.speed / 3.6) * dt
        amb.speed = Math.min(60, amb.speed + dt * 1)
      } else if (nearNext && signal && !canPass) {
        amb.totalWaitTime += dt
        amb.speed = Math.max(0, amb.speed - dt * 5)
      } else {
        amb.routeDistanceTravelled += (amb.speed / 3.6) * dt
        amb.speed = Math.min(60, amb.speed + dt * 0.5)
      }
      
      amb.corridorStates = computeCorridorStates(amb, amb.corridor, this.signalStates, pos.segmentIndex)

      updateAmbulance(amb.id, {
        location: amb.location,
        speed: amb.speed,
        heading: amb.heading,
        eta: amb.eta,
        distanceRemaining: amb.distanceRemaining,
        currentIntersection: amb.currentIntersection,
        nextIntersection: amb.nextIntersection,
        routeDistanceTravelled: amb.routeDistanceTravelled,
        status: amb.status,
      })
      
      createTelemetryUpdate(amb) // generate telemetry for demo purposes
    }
  }
  
  _findNextCorridorIntersection(amb, currentSegmentIndex) {
      if (!amb.corridor || amb.corridor.length === 0) return null
      for (const ci of amb.corridor) {
        if (ci.routeIndex > currentSegmentIndex) return ci
      }
      return null
  }
  
  _markArrived(amb) {
      amb.status = 'ARRIVED'
      amb.arrivalTime = this.simTime
      amb.distanceRemaining = 0
      amb.eta = 0
      updateAmbulance(amb.id, { status: 'ARRIVED' })
      this.log('AMBULANCE', `${amb.id} arrived`)
      addEmergencyEvent({
        ambulanceId: amb.id,
        intersectionId: amb.destination,
        eventType: 'ARRIVED',
        priorityScore: 0,
        eta: 0,
        decision: 'COMPLETE',
        reason: 'Arrived',
      })
  }

  async _evaluateSystemState() {
    // 1. Detect conflicts
    this.conflicts = detectConflicts(this.ambulances)
    for (const c of this.conflicts) {
        if (c.state === CONFLICT_STATES.DETECTED) {
            playConflictAlert(c.id)
            this.log('CONFLICT', `Conflict at ${c.intersectionId}: ${c.reason}`)
            addEmergencyEvent({
                ambulanceId: c.servingAmbulanceId,
                intersectionId: c.intersectionId,
                eventType: 'CONFLICT_DETECTED',
                priorityScore: 0,
                eta: 0,
                decision: 'SERVE_FIRST',
                reason: c.reason,
            })
        }
    }

    // 2. Evaluate decision engine and dynamic rerouting for active ambulances
    for (const amb of Object.values(this.ambulances)) {
      if (amb.status !== 'ACTIVE' || !amb.nextIntersection) continue

      // --- PHASE 22: Continuous Route Re-evaluation ---
      // Check if we should recalculate the route (every 10s of simulation time)
      if (Math.floor(this.simTime) % 10 === 0 && amb.distanceRemaining > 200) {
        try {
          const routeData = await planRoute(
            amb.location, 
            this.intersections.find(i => i.id === amb.destination).coordinates, 
            this.intersections, 
            this.trafficStates, 
            this.signalStates, 
            amb.speed
          )
          
          if (routeData.selected && routeData.selected.predictedEmergencyETASec < amb.eta - 15) {
            // Found a route that is at least 15 seconds faster
            this.log('ROUTE', `${amb.id}: Rerouting to faster path (saves ${Math.round(amb.eta - routeData.selected.predictedEmergencyETASec)}s)`)
            
            const corridor = buildEmergencyCorridor(this.intersections, routeData.selected.coordinates, 150)
            amb.routeGeometry = routeData.selected.coordinates
            amb.routeDistanceTotal = routeData.selected.distanceMeters || polylineLength(routeData.selected.coordinates)
            amb.routeDistanceTravelled = 0 // Relative to the new sub-route
            amb.corridor = corridor.intersections
            amb.corridorIds = corridor.intersectionIds
            amb.eta = routeData.selected.predictedEmergencyETASec
            amb.distanceRemaining = amb.routeDistanceTotal
            amb.candidates = routeData.candidates
            
            // Clear old corridor states
            for (const id of Object.keys(this.signalStates)) {
                if (this.signalStates[id].mode !== SIGNAL_STATES.NORMAL && !amb.corridorIds.includes(id)) {
                    this.signalStates[id].mode = SIGNAL_STATES.NORMAL // forceful recovery for dropped intersections
                }
            }
            
            addEmergencyEvent({
              ambulanceId: amb.id,
              intersectionId: amb.currentIntersection,
              eventType: 'ROUTE_RECALCULATED',
              priorityScore: 0,
              eta: amb.eta,
              decision: 'REROUTE',
              reason: `Found faster route saving ${Math.round(amb.eta - routeData.selected.predictedEmergencyETASec)}s`,
            })
          }
        } catch (e) {
          // keep existing route on error
        }
      }

      const nextInt = amb.nextIntersection
      const ts = this.trafficStates[nextInt]
      const sig = this.signalStates[nextInt]
      
      // Conflict check for decision engine
      const conflict = this.conflicts.find(c => c.intersectionId === nextInt && c.state !== CONFLICT_STATES.CLEARED)
      if (conflict && conflict.servingAmbulanceId !== amb.id) {
          continue // Let the serving ambulance control the signal
      }
      
      const clearancePrediction = await predictClearanceTime({
          ...ts,
          ambulanceETA: amb.eta
      })
      
      const decision = makeDecision({
          ambulance: amb,
          intersection: ts,
          signalState: sig,
          clearancePrediction,
          otherAmbulances: conflict ? conflict.queuedAmbulanceIds : []
      })
      
      if (requiresSignalAction(decision.action)) {
          const approach = amb.approach || 'north'
          this.signalStates[nextInt] = triggerEmergency(sig, approach, amb.movement)
          setSignalState(nextInt, this.signalStates[nextInt])
          
          this.log('DECISION', `${nextInt}: ${decision.action} - ${decision.reasons[0]}`)
          
          addEmergencyEvent({
            ambulanceId: amb.id,
            intersectionId: nextInt,
            eventType: 'DECISION_MADE',
            priorityScore: decision.score,
            eta: amb.eta,
            decision: decision.action,
            reason: decision.reasons.join('; '),
          })
      }
    }
  }

  log(type, message) {
    this.eventLog.push({
      time: this.simTime,
      timestamp: new Date().toISOString(),
      type,
      message,
    })
    if (this.eventLog.length > 200) this.eventLog = this.eventLog.slice(-200)
  }

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
      trafficMultiplier: this.trafficMultiplier,
      simTime: this.simTime,
      intersections: this.intersections,
      signalStates: { ...this.signalStates },
      trafficStates: { ...this.trafficStates },
      ambulances: { ...this.ambulances },
      vehicles: { ...this.vehicles },
      conflicts: [...this.conflicts],
      eventLog: [...this.eventLog],
    }
  }
}

export const simulationEngine = new SimulationEngine()
export default simulationEngine
