/* ============================================================
   Simulation Page — Scenario Runner & Controls
   ============================================================ */
import React from 'react'
import { useSimulation } from '../context/SimulationContext'
import SimulationControls from '../components/SimulationControls'
import TrafficMap from '../components/TrafficMap'
import AmbulanceCard from '../components/AmbulanceCard'
import { MdPlayCircle, MdReplay, MdAssessment } from 'react-icons/md'

export default function Simulation() {
  const sim = useSimulation()

  const ambulances = Object.values(sim.ambulances)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Traffic & Emergency Simulation</h1>
          <p className="page-desc">
            Simulation-first MVP environment with SUMO/Browser fallback
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-lg)' }}>
        {/* Left Column: Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <SimulationControls />

          {/* Preset Scenarios */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🎬 Preset Scenarios</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  sim.reset()
                  sim.start()
                  sim.spawnAmbulance({ origin: 'INT_1', destination: 'INT_4', priority: 'HIGH', speed: 50 })
                }}
              >
                1. Diagonal Corridor (INT_1 → INT_4)
              </button>

              <button
                className="btn btn-outline"
                onClick={() => {
                  sim.reset()
                  sim.start()
                  sim.spawnAmbulance({ origin: 'INT_3', destination: 'INT_2', priority: 'CRITICAL', speed: 60 })
                }}
              >
                2. Cross Corridor (INT_3 → INT_2)
              </button>

              <button
                className="btn btn-outline"
                onClick={() => {
                  sim.reset()
                  sim.start()
                  sim.spawnAmbulance({ origin: 'INT_1', destination: 'INT_2', priority: 'HIGH', speed: 45 })
                  setTimeout(() => {
                    sim.spawnAmbulance({ origin: 'INT_3', destination: 'INT_4', priority: 'HIGH', speed: 45 })
                  }, 3000)
                }}
              >
                3. Multi-Ambulance Concurrent Corridor
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Simulation View & Active Vehicles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <TrafficMap height="450px" />
          </div>

          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--clr-text-heading)' }}>
            Ambulance Tracker ({ambulances.length})
          </h2>

          <div className="grid-2">
            {ambulances.map((amb) => (
              <AmbulanceCard key={amb.id} ambulance={amb} />
            ))}
            {ambulances.length === 0 && (
              <div className="card" style={{ gridColumn: 'span 2', textAlign: 'center', padding: 'var(--space-xl)' }}>
                <div style={{ color: 'var(--clr-text-dim)' }}>
                  No ambulances in current simulation run. Click "Spawn Ambulance" or select a preset scenario.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
