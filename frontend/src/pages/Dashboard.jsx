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

  const activeAmbulance = Object.values(sim.ambulances).find(
    (a) => a.status === 'ACTIVE'
  )

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
          {/* Map */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <TrafficMap height="500px" />
          </div>

          {/* System Metrics */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ marginBottom: 'var(--space-md)', fontSize: '15px' }}>
              System Metrics
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-md)' }}>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Active Ambulances</div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{Object.values(sim.ambulances).filter((a) => a.status === 'ACTIVE').length}</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Emergency Signals</div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{emergencySignals.length}</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Conflicts</div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{Object.values(sim.ambulances).filter(a => a.status === 'WAITING').length > 0 ? 1 : 0}</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Avg. Delay</div>
                <div style={{ fontSize: '24px', fontWeight: '600' }}>{(avgQueue * 1.5).toFixed(1)}s</div>
              </div>
              <div>
                <div className="stat-label" style={{ fontSize: '11px' }}>Green Corridor</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: emergencySignals.length > 0 ? 'var(--clr-success)' : 'var(--clr-text-muted)', marginTop: '8px' }}>
                  {emergencySignals.length > 0 ? 'ACTIVE' : 'STANDBY'}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row: Decision Engine & Detection */}
          <div className="grid-2">
            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
                DECISION ENGINE
              </div>
              <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Status:</span>
                <span style={{ fontWeight: '600', color: 'var(--clr-success)' }}>ACTIVE</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--clr-text-muted)', marginBottom: '8px' }}>
                Inputs: GPS, Speed, Heading, Traffic state, ETA
              </div>
              <div style={{ fontSize: '13px', display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--clr-border)' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Decision:</span>
                <span style={{ fontWeight: '500' }}>Emergency signal priority</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--clr-text-dim)', marginTop: '12px' }}>
                Prediction model: Active • Confidence: 94%
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-md)' }}>
              <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
                DETECTION
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--clr-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
                <div>Camera</div>
                <div>↓</div>
                <div>YOLO</div>
                <div>↓</div>
                <div>Vehicle detection</div>
                <div>↓</div>
                <div style={{ color: 'var(--clr-text)', fontWeight: '600' }}>Emergency vehicle classification</div>
              </div>
            </div>
          </div>
          
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              EVENT LOG
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
          
          {/* Active Emergencies */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              ACTIVE EMERGENCIES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.values(sim.ambulances).filter(a => a.status !== 'ARRIVED').length > 0 ? (
                Object.values(sim.ambulances).filter(a => a.status !== 'ARRIVED').map(amb => (
                  <div key={amb.id} style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MdLocalHospital style={{ color: 'var(--clr-danger)' }} /> {amb.id}
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: amb.status === 'ACTIVE' ? 'var(--clr-danger)' : 'var(--clr-warning)' }}>
                        {amb.status === 'ACTIVE' ? 'PROCEEDING' : 'QUEUED'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
                      <div style={{ color: 'var(--clr-text-muted)' }}>ETA</div>
                      <div style={{ textAlign: 'right', fontWeight: '500' }}>{amb.eta?.toFixed(0)}s</div>
                      <div style={{ color: 'var(--clr-text-muted)' }}>Intersection</div>
                      <div style={{ textAlign: 'right', fontWeight: '500' }}>{amb.currentIntersection || '—'}</div>
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

          {/* Signal Status */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              TRAFFIC SIGNAL STATUS
            </div>
            {emergencySignals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(sim.signalStates).filter(id => sim.signalStates[id].mode !== 'NORMAL').map(id => {
                  const sig = sim.signalStates[id];
                  return (
                    <div key={id} style={{ border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>INTERSECTION {id}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '12px' }}>
                        <div style={{ color: 'var(--clr-text-muted)' }}>Signal state:</div>
                        <div style={{ textAlign: 'right', fontWeight: '600', color: 'var(--clr-success)' }}>GREEN</div>
                        <div style={{ color: 'var(--clr-text-muted)' }}>Remaining:</div>
                        <div style={{ textAlign: 'right', fontWeight: '500' }}>18s</div>
                        <div style={{ color: 'var(--clr-text-muted)' }}>Priority:</div>
                        <div style={{ textAlign: 'right', fontWeight: '500', color: 'var(--clr-danger)' }}>ACTIVE</div>
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

          {/* Conflict Handling (Example when needed) */}
          {Object.values(sim.ambulances).filter(a => a.status === 'WAITING').length > 0 && (
            <div className="card" style={{ padding: 'var(--space-md)', borderColor: 'var(--clr-warning)', backgroundColor: '#FFFBEB' }}>
              <div className="card-title" style={{ fontSize: '15px', color: '#92400E', marginBottom: '12px' }}>
                EMERGENCY CONFLICT
              </div>
              <div style={{ fontSize: '12px', color: '#92400E', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: '600' }}>Decision: Emergency queue</div>
                <div>Priority:</div>
                <div style={{ paddingLeft: '8px' }}>
                  • AMB-001 → Proceeding<br/>
                  • AMB-002 → Queued
                </div>
                <div style={{ marginTop: '4px', fontStyle: 'italic' }}>Reason: Equal ETA, request timestamp used.</div>
              </div>
            </div>
          )}

          {/* Audio Alert */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-title" style={{ fontSize: '15px', marginBottom: '12px' }}>
              AUDIO ALERT
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--clr-success)' }}></div>
              <span style={{ color: 'var(--clr-text-muted)' }}>Listening</span>
            </div>
          </div>

          {/* Dev Controls (Hidden or compact) */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--clr-border)', paddingTop: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--clr-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Simulation Controls</div>
            <SimulationControls compact />
          </div>

        </div>
      </div>
    </div>
  )
}
