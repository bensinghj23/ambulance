/* ============================================================
   Ambulances Page — Fleet Management & Telemetry
   Features: Fleet list, online/offline status, GPS location,
   speed, direction, destination, priority, ETA, current emergency,
   telemetry history.
   ============================================================ */
import React from 'react'
import { useSimulation } from '../context/SimulationContext'
import AmbulanceCard from '../components/AmbulanceCard'
import { Activity, Wifi, MapPin, Gauge } from 'lucide-react'

export default function Ambulances() {
  const sim = useSimulation()

  const ambulances = Object.values(sim.ambulances)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Ambulance Fleet Management</h1>
          <p className="page-desc">
            Real-time GPS telemetry, vehicle priority status, & dispatch tracking
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() =>
            sim.spawnAmbulance({
              origin: 'INT_1',
              destination: 'INT_4',
              priority: 'HIGH',
              speed: 50,
            })
          }
        >
          + Spawn Dispatch Ambulance
        </button>
      </div>

      <div className="grid-3" style={{ marginBottom: 'var(--space-lg)' }}>
        {ambulances.map((amb) => (
          <AmbulanceCard key={amb.id} ambulance={amb} />
        ))}
        {ambulances.length === 0 && (
          <div className="card" style={{ gridColumn: 'span 3', textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <div className="empty-state-text">No active or historical ambulances in current run</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 'var(--space-md)' }}
              onClick={() =>
                sim.spawnAmbulance({
                  origin: 'INT_1',
                  destination: 'INT_4',
                  priority: 'HIGH',
                  speed: 50,
                })
              }
            >
              Spawn Demo Ambulance
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
