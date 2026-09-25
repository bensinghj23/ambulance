/* ============================================================
   IntersectionDetails Page — Single Intersection Operational View
   Route: /intersections/:id
   Features: Approach lanes, lane ROIs, turning movement analysis,
   signal phases, current signal state, traffic metrics,
   emergency corridor safety state, simulated camera feed,
   manual signal controls, event history.
   ============================================================ */
import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSimulation } from '../context/SimulationContext'
import TrafficSignal from '../components/TrafficSignal'
import LaneStatus from '../components/LaneStatus'
import {
  ArrowLeft,
  Camera,
  Wifi,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'

export default function IntersectionDetails() {
  const { id } = useParams()
  const sim = useSimulation()
  const intersectionId = id || 'INT_1'

  const currentInt = sim.intersections.find((i) => i.id === intersectionId) || {
    id: intersectionId,
    name: 'Main St & 1st Ave',
  }
  const signal = sim.signalStates[intersectionId] || {
    mode: 'NORMAL',
    north: 'green',
    south: 'green',
    east: 'red',
    west: 'red',
  }
  const trafficState = sim.trafficStates[intersectionId]

  const [overrideActive, setOverrideActive] = useState(false)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Link to="/intersections" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">{currentInt.id} — {currentInt.name}</h1>
            <p className="page-desc">
              Approach Lanes, Signal Phase Control, & Camera Analytics
            </p>
          </div>
        </div>
        <span className={`badge ${signal.mode !== 'NORMAL' ? 'badge-danger' : 'badge-success'}`}>
          {signal.mode}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Left Column: Signal Visualizer & Camera Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Signal Phase Visualizer */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🚦 Signal Head Status</div>
              <span className="badge badge-neutral">Phase: {signal.phase || 'NS_GREEN'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', textAlign: 'center', margin: 'var(--space-md) 0' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <TrafficSignal label="NORTH" color={signal.north} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <TrafficSignal label="SOUTH" color={signal.south} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <TrafficSignal label="EAST" color={signal.east} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <TrafficSignal label="WEST" color={signal.west} />
              </div>
            </div>
          </div>

          {/* Simulated Intersection Camera Feed */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Camera size={18} style={{ color: 'var(--clr-primary)' }} /> Live Sensor Feed — {intersectionId}
              </div>
            </div>
            <div
              style={{
                width: '100%',
                aspectRatio: '16/9',
                background: '#090d16',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                border: '1px solid var(--clr-border)',
              }}
            >
              <div style={{ textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                <Camera size={48} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontSize: '0.85rem' }}>4K Optical Traffic Sensor Stream</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-success)', marginTop: 4 }}>
                  YOLO Object Analytics Engine Connected (30 FPS)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Lane Status & Manual Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <LaneStatus trafficState={trafficState} intersectionId={intersectionId} />

          {/* Authorized Manual Controls */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Sliders size={18} style={{ color: 'var(--clr-warning)' }} /> Authorized Manual Controls
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <button
                className="btn btn-warning"
                onClick={() => {
                  setOverrideActive(true)
                  alert(`All-Red Force Triggered for ${intersectionId}`)
                }}
              >
                Force All-Red Hold
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setOverrideActive(true)
                  alert(`North-South Green Triggered for ${intersectionId}`)
                }}
              >
                Force NS Green Phase
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setOverrideActive(false)
                  alert(`Restored Automated Control for ${intersectionId}`)
                }}
              >
                <RefreshCw size={14} /> Restore Auto Timing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
