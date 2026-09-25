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
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart City Command Center</h1>
          <p className="page-desc">
            Dynamic Lane Assignment & Rolling Green Corridor Overview
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <span className={`badge ${sim.running ? 'badge-success' : 'badge-neutral'}`}>
            <span className={`badge-dot ${sim.running ? 'green' : ''}`} />
            {sim.running ? 'SYSTEM ACTIVE' : 'SYSTEM PAUSED'}
          </span>
        </div>
      </div>

      <EmergencyStatus signalStates={sim.signalStates} />

      {/* Stats row */}
      <div className="stat-grid" style={{ marginTop: 'var(--space-md)' }}>
        <div className="stat-card">
          <div className="stat-label">Intersections</div>
          <div className="stat-value">{sim.intersections.length}</div>
          <div className="stat-change positive">
            <MdTraffic /> Connected
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Ambulances</div>
          <div className="stat-value" style={{ color: activeAmbulance ? 'var(--clr-danger)' : 'var(--clr-text-heading)' }}>
            {Object.values(sim.ambulances).filter((a) => a.status === 'ACTIVE').length}
          </div>
          <div className="stat-change">
            <MdLocalHospital /> Priority Monitoring
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Emergency Corridors</div>
          <div className="stat-value" style={{ color: emergencySignals.length > 0 ? 'var(--clr-warning)' : 'var(--clr-text-heading)' }}>
            {emergencySignals.length}
          </div>
          <div className="stat-change positive">
            {emergencySignals.length > 0 ? 'Active Priority' : 'All Normal'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Avg Queue Length</div>
          <div className="stat-value">{avgQueue.toFixed(1)}</div>
          <div className="stat-change">Vehicles / Lane</div>
        </div>
      </div>

      {/* Main Grid: Map + Side Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 'var(--space-lg)',
          marginTop: 'var(--space-lg)',
        }}
      >
        {/* Left Column: Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
              <div className="card-title">🗺️ Live Network Map</div>
              <span className="badge badge-neutral">Leaflet Realtime</span>
            </div>
            <TrafficMap height="460px" />
          </div>

          {/* Intersections Quick View */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🚦 Signal States Summary</div>
            </div>
            <div className="grid-4">
              {sim.intersections.map((int) => {
                const sig = sim.signalStates[int.id]
                return (
                  <div
                    key={int.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${sig?.mode !== 'NORMAL' ? 'var(--clr-danger)' : 'var(--clr-border)'}`,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', marginBottom: 4 }}>
                      {int.id}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: 8 }}>
                      {sig?.mode}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      <TrafficSignal label="N" color={sig?.north} compact />
                      <TrafficSignal label="S" color={sig?.south} compact />
                      <TrafficSignal label="E" color={sig?.east} compact />
                      <TrafficSignal label="W" color={sig?.west} compact />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Controls & Active Ambulance & Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Active Ambulance Card */}
          {activeAmbulance ? (
            <AmbulanceCard ambulance={activeAmbulance} />
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
              <MdLocalHospital style={{ fontSize: '2rem', color: 'var(--clr-text-dim)', marginBottom: 8 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                No Active Ambulance
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)', marginTop: 4 }}>
                Use simulation controls below to spawn an emergency vehicle.
              </p>
            </div>
          )}

          {/* Controls */}
          <SimulationControls compact />

          {/* Real-time Event Log */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <MdHistory style={{ color: 'var(--clr-primary)' }} /> Live Event Log
              </div>
              <span className="badge badge-neutral">{sim.eventLog.length} events</span>
            </div>
            <div className="event-list">
              {sim.eventLog.slice(-10).reverse().map((evt, i) => (
                <div key={i} className="event-item">
                  <span className="event-time">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="event-content">
                    <span
                      className={`badge ${
                        evt.type === 'EMERGENCY' || evt.type === 'EMERGENCY_GREEN'
                          ? 'badge-danger'
                          : evt.type === 'PRIORITY'
                          ? 'badge-warning'
                          : evt.type === 'RECOVERY'
                          ? 'badge-success'
                          : 'badge-neutral'
                      }`}
                      style={{ marginRight: 6, fontSize: '0.65rem' }}
                    >
                      {evt.type}
                    </span>
                    <span>{evt.message}</span>
                  </div>
                </div>
              ))}
              {sim.eventLog.length === 0 && (
                <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
                  <div className="empty-state-text">No events recorded yet</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
