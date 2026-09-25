/* ============================================================
   Intersections Page — Smart Intersection Directory
   Features: Intersection list, map, signal status, current phase,
   traffic density, queue status, camera status, MQTT status, emergency mode filter.
   ============================================================ */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSimulation } from '../context/SimulationContext'
import TrafficSignal from '../components/TrafficSignal'
import TrafficMap from '../components/TrafficMap'
import { ArrowRight, Camera, Wifi, Activity } from 'lucide-react'

export default function Intersections() {
  const sim = useSimulation()
  const [filterEmergency, setFilterEmergency] = useState(false)

  const intersections = sim.intersections.filter((int) => {
    if (!filterEmergency) return true
    const sig = sim.signalStates[int.id]
    return sig && sig.mode !== 'NORMAL'
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Intersections Directory</h1>
          <p className="page-desc">
            Signal controllers, camera sensors, MQTT communication & emergency corridor status
          </p>
        </div>
        <button
          className={`btn ${filterEmergency ? 'btn-danger' : 'btn-outline'}`}
          onClick={() => setFilterEmergency(!filterEmergency)}
        >
          {filterEmergency ? 'Showing Emergency Corridors' : 'Filter Emergency Only'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Map */}
        <div className="card" style={{ padding: 'var(--space-md)' }}>
          <TrafficMap height="500px" />
        </div>

        {/* Intersection List Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {intersections.map((int) => {
            const sig = sim.signalStates[int.id]
            const ts = sim.trafficStates[int.id]
            const isEmergency = sig && sig.mode !== 'NORMAL'

            return (
              <div
                key={int.id}
                className={`card ${isEmergency ? 'emergency-active' : ''}`}
                style={{ padding: 'var(--space-md)' }}
              >
                <div className="card-header">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{int.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>{int.name}</div>
                  </div>
                  <span className={`badge ${isEmergency ? 'badge-danger' : 'badge-success'}`}>
                    {sig?.mode || 'NORMAL'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', margin: 'var(--space-sm) 0' }}>
                  <TrafficSignal label="N" color={sig?.north} compact />
                  <TrafficSignal label="S" color={sig?.south} compact />
                  <TrafficSignal label="E" color={sig?.east} compact />
                  <TrafficSignal label="W" color={sig?.west} compact />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-xs)', borderTop: '1px solid var(--clr-border)' }}>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                    <span><Camera size={12} style={{ verticalAlign: 'middle', color: 'var(--clr-warning)' }} /> SIMULATED</span>
                    <span><Wifi size={12} style={{ verticalAlign: 'middle', color: 'var(--clr-text-muted)' }} /> DISCONNECTED</span>
                  </div>
                  <Link to={`/intersections/${int.id}`} className="btn btn-outline btn-sm">
                    Inspect <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
