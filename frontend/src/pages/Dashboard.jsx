/* ============================================================
   Dashboard Page — Command Center Overview
   ============================================================ */
import React from 'react'
import { useSimulation } from '../context/SimulationContext'
import TrafficMap from '../components/TrafficMap'
import AmbulanceCard from '../components/AmbulanceCard'
import EmergencyStatus from '../components/EmergencyStatus'
import SimulationControls from '../components/SimulationControls'
import TrafficSignal from '../components/TrafficSignal'
import {
  MdLocalHospital,
  MdTraffic,
  MdSpeed,
  MdTimer,
  MdHistory,
} from 'react-icons/md'

export default function Dashboard() {
  const sim = useSimulation()

  const emergencySignals = Object.values(sim.signalStates).filter(
    (s) => s.mode !== 'NORMAL'
  )

  // Total active vehicles
  const totalVehicles = Object.keys(sim.vehicles).length

  // Average queue length across all intersections
  const avgQueue = Object.values(sim.trafficStates).reduce((acc, ts) => {
    const queues = Object.values(ts.queueLengthByLane || {})
    if (queues.length === 0) return acc
    const sum = queues.reduce((a, b) => a + b, 0)
    return acc + sum / queues.length
  }, 0) / (Object.keys(sim.trafficStates).length || 1)

  // Determine active conflict
  const activeAmbulances = Object.values(sim.ambulances).filter(a => a.status === 'ACTIVE')
  const intersectionCounts = {}
  let conflictIntersection = null
  let conflictingAmbs = []
  activeAmbulances.forEach(a => {
    if (a.nextIntersection) {
      intersectionCounts[a.nextIntersection] = (intersectionCounts[a.nextIntersection] || 0) + 1
      if (intersectionCounts[a.nextIntersection] > 1) {
        conflictIntersection = a.nextIntersection
      }
    }
  })
  if (conflictIntersection) {
    conflictingAmbs = activeAmbulances.filter(a => a.nextIntersection === conflictIntersection)
  }

  // Get decision log for the active ambulance
  const activeAmbulance = activeAmbulances[0]
  let decisionLog = null
  if (activeAmbulance) {
    decisionLog = [...sim.eventLog]
      .reverse()
      .find(e => e.eventType === 'PRIORITY_ACTIVATED' && e.ambulanceId === activeAmbulance.id && e.intersectionId === activeAmbulance.nextIntersection)
  }

  // Audio alert state
  let audioState = 'LISTENING'
  let audioMsg = 'Monitoring for emergency alerts.'
  if (conflictingAmbs.length > 0) {
    audioState = 'CONFLICT DETECTED'
    audioMsg = 'Emergency vehicle conflict detected.'
  } else if (activeAmbulance) {
    audioState = 'ALERT ACTIVE'
    audioMsg = `Emergency vehicle ${activeAmbulance.id} tracking.`
  }

  return (
    <div>
      <div className="page-header" style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '22px' }}>Emergency Traffic Control</h1>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <span className={`badge ${sim.running ? 'badge-success' : 'badge-neutral'}`}>
            <span className={`badge-dot ${sim.running ? 'green' : ''}`} />
            {sim.running ? 'System Online' : 'System Paused'}
          </span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN: Map + Metrics + Event Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* System Metrics */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ marginBottom: 'var(--space-md)', fontSize: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <span>OPERATIONAL METRICS</span>
              <span className="badge badge-primary">
                {sim.simulationBackend === 'SUMO' ? 'SUMO + TraCI' : 'Browser Simulation'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Active Emergencies</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: activeAmbulances.length > 0 ? 'var(--clr-danger)' : 'inherit' }}>{activeAmbulances.length}</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Signals in Priority</div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{emergencySignals.length}</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Active Conflicts</div>
                <div style={{ fontSize: '24px', fontWeight: '600', color: conflictingAmbs.length > 0 ? 'var(--clr-warning)' : 'inherit' }}>{conflictingAmbs.length > 0 ? 1 : 0}</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Avg. Delay (sim)</div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{(avgQueue * 1.5).toFixed(1)}s</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Green Corridor</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: emergencySignals.length > 0 ? 'var(--clr-success)' : 'var(--clr-text-muted)', marginTop: '8px' }}>
                  {emergencySignals.length > 0 ? 'ACTIVE' : 'STANDBY'}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px', color: 'var(--clr-text-muted)', borderTop: '1px solid var(--clr-border)', paddingTop: '12px' }}>
              <div>Traffic Source: <strong style={{ color: 'var(--clr-text-heading)' }}>{sim.simulationBackend === 'SUMO' ? 'SUMO' : 'SIMULATION'}</strong></div>
              <div style={{ textAlign: 'center' }}>Telemetry Source: <strong style={{ color: 'var(--clr-text-heading)' }}>{sim.simulationBackend === 'SUMO' ? 'SUMO' : 'SIMULATION'}</strong></div>
              <div style={{ textAlign: 'right' }}>Signal Source: <strong style={{ color: 'var(--clr-text-heading)' }}>{sim.simulationBackend === 'SUMO' ? 'SUMO' : 'SIMULATION'}</strong></div>
            </div>
          </div>

          {/* Map */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <TrafficMap height="500px" />
          </div>

          {/* Decision Engine Panel */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              DECISION ENGINE
            </div>
            {activeAmbulance && decisionLog ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: '600' }}>{activeAmbulance.id} → {activeAmbulance.nextIntersection}</span>
                  <span style={{ fontWeight: '600', color: 'var(--clr-success)' }}>STATUS: ACTIVATED</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                  <div>Priority Score: {decisionLog.priorityScore}</div>
                  <div>Activation Threshold: 70</div>
                </div>
                
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--clr-text-muted)' }}>WHY?</div>
                  <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {decisionLog.reason.split(';').map((rsn, idx) => {
                      const txt = rsn.trim()
                      if (!txt) return null
                      return <div key={idx}>✓ {txt}</div>
                    })}
                  </div>
                </div>

                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--clr-text-muted)' }}>ACTION</div>
                  <div style={{ paddingLeft: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>→ Clear conflicting traffic</div>
                    <div>→ Safe signal transition</div>
                    <div>→ Grant emergency GREEN ({decisionLog.requiredPath})</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--clr-text-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: '600' }}>STATUS: STANDBY</div>
                <div>Waiting for emergency vehicle detection.</div>
                <div style={{ fontSize: '11px', marginTop: '8px' }}>Input sources: GPS, Speed, Heading, Traffic state, ETA</div>
              </div>
            )}
          </div>
          
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              EMERGENCY TIMELINE (EVENT LOG)
            </div>
            <div className="event-list" style={{ maxHeight: '180px' }}>
              {sim.eventLog.slice(-8).reverse().map((evt, i) => (
                <div key={i} className="event-item" style={{ padding: '4px 0', border: 'none' }}>
                  <span className="event-time" style={{ fontSize: '12px', width: '60px' }}>
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <div className="event-content" style={{ fontSize: '13px' }}>
                    {evt.message}
                  </div>
                </div>
              ))}
              {sim.eventLog.length === 0 && (
                <div style={{ fontSize: '13px', color: 'var(--clr-text-muted)' }}>No events recorded yet.</div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Emergency Status, Signals, Conflict */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {/* Signal Transition Visualization */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              TRAFFIC SIGNAL STATUS
            </div>
            {emergencySignals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.keys(sim.signalStates).filter(id => sim.signalStates[id].mode !== 'NORMAL').map(id => {
                  const sig = sim.signalStates[id];
                  const m = sig.mode;
                  
                  let remaining = '—';
                  if (m === 'YELLOW') remaining = Math.max(0, sig.yellowDuration - sig.phaseTimer).toFixed(1) + 's';
                  else if (m === 'ALL_RED') remaining = Math.max(0, sig.allRedDuration - sig.phaseTimer).toFixed(1) + 's';
                  else if (m === 'EMERGENCY_GREEN') remaining = Math.max(0, sig.emergencyHoldMax - sig.emergencyHoldTimer).toFixed(1) + 's';
                  else if (m === 'RECOVERY') remaining = Math.max(0, sig.yellowDuration - sig.phaseTimer).toFixed(1) + 's';

                  const timeline = [
                    'EMERGENCY_DETECTED',
                    'PRE_CLEARANCE',
                    'YELLOW',
                    'ALL_RED',
                    'EMERGENCY_GREEN',
                    'PASSAGE_MONITORING',
                    'RECOVERY'
                  ]

                  return (
                    <div key={id} style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px' }}>INTERSECTION {id}</div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                        {timeline.map((step) => {
                          const isActive = m === step
                          return (
                            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isActive ? 'var(--clr-text-heading)' : 'var(--clr-text-muted)' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActive ? 'var(--clr-primary)' : 'var(--clr-border)' }}></div>
                              <span style={{ fontWeight: isActive ? '700' : '400' }}>{step.replace('_', ' ')}</span>
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--clr-border)' }}>
                        <div style={{ color: 'var(--clr-text-muted)' }}>Phase Timer:</div>
                        <div style={{ textAlign: 'right', fontWeight: '500' }}>{remaining}</div>
                        <div style={{ color: 'var(--clr-text-muted)' }}>Approach:</div>
                        <div style={{ textAlign: 'right', fontWeight: '500', color: 'var(--clr-danger)', textTransform: 'uppercase' }}>{sig.emergencyApproach || '—'}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--clr-text-muted)', textAlign: 'center', padding: '12px 0' }}>
                All signals operating normally.
              </div>
            )}
          </div>

          {/* Active Emergencies (List) */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              ACTIVE EMERGENCIES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeAmbulances.length > 0 ? (
                activeAmbulances.map(amb => (
                  <div key={amb.id} style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdLocalHospital style={{ color: 'var(--clr-danger)' }} /> {amb.id}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: amb.status === 'ACTIVE' ? 'var(--clr-danger)' : 'var(--clr-warning)' }}>
                        PROCEEDING
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
                      <div style={{ color: 'var(--clr-text-muted)' }}>ETA</div>
                      <div style={{ textAlign: 'right', fontWeight: '500' }}>{amb.eta?.toFixed(0)}s</div>
                      <div style={{ color: 'var(--clr-text-muted)' }}>Next Int.</div>
                      <div style={{ textAlign: 'right', fontWeight: '500' }}>{amb.nextIntersection || '—'}</div>
                      <div style={{ color: 'var(--clr-text-muted)' }}>Priority</div>
                      <div style={{ textAlign: 'right', fontWeight: '500' }}>{amb.priority}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--clr-text-muted)', textAlign: 'center', padding: '20px 0' }}>
                  No active emergencies.
                </div>
              )}
            </div>
          </div>

          {/* Multi-Ambulance Conflict Panel */}
          {conflictingAmbs.length > 1 && (
            <div className="card" style={{ padding: 'var(--space-md)', borderColor: 'var(--clr-warning)', backgroundColor: '#FFFBEB' }}>
              <div className="card-title" style={{ fontSize: '15px', color: '#92400E', marginBottom: '12px' }}>
                EMERGENCY CONFLICT
              </div>
              <div style={{ fontSize: '12px', color: '#92400E', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: '600' }}>{conflictingAmbs[0].id}</div>
                  <div style={{ fontWeight: '600' }}>VS</div>
                  <div style={{ fontWeight: '600' }}>{conflictingAmbs[1].id}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>ETA: {conflictingAmbs[0].eta?.toFixed(0)}s</div>
                  <div></div>
                  <div>ETA: {conflictingAmbs[1].eta?.toFixed(0)}s</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>Priority: {conflictingAmbs[0].priority}</div>
                  <div></div>
                  <div>Priority: {conflictingAmbs[1].priority}</div>
                </div>
                <div style={{ borderTop: '1px solid #FCD34D', paddingTop: '8px', marginTop: '4px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>CONFLICT TYPE</div>
                  <div>Same intersection / competing emergency movement</div>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>RESOLUTION</div>
                  <div>Deterministic emergency queue (simulated proximity fallback)</div>
                  <div style={{ paddingLeft: '8px', marginTop: '4px' }}>
                    → {conflictingAmbs[0].distance < conflictingAmbs[1].distance ? conflictingAmbs[0].id : conflictingAmbs[1].id} gets priority<br/>
                    → {conflictingAmbs[0].distance < conflictingAmbs[1].distance ? conflictingAmbs[1].id : conflictingAmbs[0].id} waits
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Alert */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              AUDIO ALERT
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: audioState === 'LISTENING' ? 'var(--clr-success)' : 'var(--clr-danger)' }}></div>
              <span style={{ fontWeight: '600' }}>{audioState}</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--clr-text-muted)', marginTop: '4px', paddingLeft: '16px' }}>
              {audioMsg}
            </div>
          </div>

          {/* Dev Controls */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--clr-border)', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--clr-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Simulation Controls</div>
            <SimulationControls compact />
          </div>

        </div>
      </div>
    </div>
  )
}
