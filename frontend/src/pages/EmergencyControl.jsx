/* ============================================================
   EmergencyControl Page — Priority Engine & Corridor Control
   ============================================================ */
import React from 'react'
import { useSimulation } from '../context/SimulationContext'
import AmbulanceCard from '../components/AmbulanceCard'
import TrafficSignal from '../components/TrafficSignal'
import {
  MdLocalHospital,
  MdCheckCircle,
  MdWarning,
  MdShield,
  MdFlashOn,
} from 'react-icons/md'

export default function EmergencyControl() {
  const sim = useSimulation()

  const ambulances = Object.values(sim.ambulances)
  const activeAmbulances = ambulances.filter((a) => a.status === 'ACTIVE')
  const activeEmergencySignals = Object.values(sim.signalStates).filter(
    (s) => s.mode !== 'NORMAL'
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Emergency Priority Control</h1>
          <p className="page-desc">
            Deterministic Priority Engine, Safe Signal Transitions & Rolling Corridor Clearance
          </p>
        </div>
        <span className={`badge ${activeAmbulances.length > 0 ? 'badge-danger' : 'badge-success'}`}>
          {activeAmbulances.length} Active Emergency Vehicles
        </span>
      </div>

      {/* Active Corridor Panel */}
      <div className="grid-2" style={{ marginBottom: 'var(--space-lg)' }}>
        {/* Left: Active Ambulances */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--clr-text-heading)' }}>
            🚑 Active Emergency Vehicles
          </h2>
          {activeAmbulances.length > 0 ? (
            activeAmbulances.map((amb) => (
              <AmbulanceCard key={amb.id} ambulance={amb} />
            ))
          ) : (
            <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <MdCheckCircle style={{ fontSize: '2.5rem', color: 'var(--clr-success)', marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No Active Emergency Vehicles</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                All traffic signals operating under standard automated scheduling.
              </p>
            </div>
          )}
        </div>

        {/* Right: Active Emergency Corridors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--clr-text-heading)' }}>
            🚦 Active Corridor Intersections
          </h2>
          {activeEmergencySignals.length > 0 ? (
            activeEmergencySignals.map((sig) => (
              <div key={sig.intersectionId} className="card emergency-active">
                <div className="card-header">
                  <div className="card-title">
                    <MdFlashOn style={{ color: 'var(--clr-danger)' }} />
                    {sig.intersectionId}
                  </div>
                  <span className="badge badge-danger">{sig.mode}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
                  <div>
                    <div className="stat-label">Approach</div>
                    <span className="badge badge-warning" style={{ marginTop: 4 }}>
                      {sig.emergencyApproach?.toUpperCase() || 'NORTH'}
                    </span>
                  </div>
                  <div>
                    <div className="stat-label">Required Movement</div>
                    <span className="badge badge-primary" style={{ marginTop: 4 }}>
                      {sig.emergencyMovement || 'NORTH_TO_SOUTH'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: 'var(--space-sm)', borderTop: '1px solid var(--clr-border)' }}>
                  <TrafficSignal label="North" color={sig.north} compact />
                  <TrafficSignal label="South" color={sig.south} compact />
                  <TrafficSignal label="East" color={sig.east} compact />
                  <TrafficSignal label="West" color={sig.west} compact />
                </div>
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
              <MdShield style={{ fontSize: '2.5rem', color: 'var(--clr-primary)', marginBottom: 8 }} />
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No Active Corridors</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                Signal priority controller standby mode.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Priority Engine Decision Log */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <MdShield style={{ color: 'var(--clr-primary)' }} /> Deterministic Decision Audit Log
          </div>
        </div>
        <div className="event-list">
          {sim.eventLog
            .filter((e) => ['PRIORITY', 'EMERGENCY', 'EMERGENCY_GREEN', 'RECOVERY', 'TRANSITION'].includes(e.type))
            .slice(-15)
            .reverse()
            .map((evt, i) => (
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
                        : 'badge-success'
                    }`}
                    style={{ marginRight: 6 }}
                  >
                    {evt.type}
                  </span>
                  <span>{evt.message}</span>
                </div>
              </div>
            ))}
          {sim.eventLog.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-text">No controller decisions logged yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
