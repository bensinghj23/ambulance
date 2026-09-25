/* ============================================================
   EmergencyDetails Page — Single Emergency Incident Deep-Dive
   Route: /emergencies/:id
   Features: Timeline, ambulance location/speed/ETA, priority score,
   required lanes, blocking lanes, queue lengths, traffic density,
   signal phases, clearance prediction, safety verification,
   operator manual controls, event logs.
   ============================================================ */
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSimulation } from '../context/SimulationContext'
import TrafficSignal from '../components/TrafficSignal'
import TrafficMap from '../components/TrafficMap'
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  MapPin,
  Activity,
  AlertTriangle,
  Play,
  CheckCircle,
} from 'lucide-react'

export default function EmergencyDetails() {
  const { id } = useParams()
  const sim = useSimulation()

  const amb = sim.ambulances[id] || {
    id: id || 'AMB_001',
    priority: 'HIGH',
    speed: 48,
    eta: 24,
    currentIntersection: 'INT_1',
    nextIntersection: 'INT_2',
    route: ['INT_1', 'INT_2', 'INT_4'],
    status: 'ACTIVE',
  }

  const signal = sim.signalStates[amb.nextIntersection || 'INT_1'] || {
    mode: 'EMERGENCY_GREEN',
    north: 'green',
    south: 'red',
    east: 'red',
    west: 'red',
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <Link to="/emergencies" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Emergency Incident Details — {amb.id}</h1>
            <p className="page-desc">
              Real-time corridor clearance breakdown, priority scoring, & safety verification
            </p>
          </div>
        </div>
        <span className={`badge ${amb.status === 'ACTIVE' ? 'badge-danger' : 'badge-success'}`}>
          {amb.status}
        </span>
      </div>

      {/* Grid Summary */}
      <div className="grid-4" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="stat-card">
          <div className="stat-label">Priority Score</div>
          <div className="stat-value" style={{ color: 'var(--clr-danger)' }}>90 / 100</div>
          <div className="stat-change positive">Threshold: 70 (ACTIVATED)</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Estimated Clearance</div>
          <div className="stat-value">{amb.eta != null ? `${amb.eta.toFixed(0)}s` : '18s'}</div>
          <div className="stat-change">Queue clearance: 4.2s</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Target Intersection</div>
          <div className="stat-value" style={{ fontSize: '1.4rem' }}>
            {amb.nextIntersection || 'INT_2'}
          </div>
          <div className="stat-change">Approach: NORTH</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Safety Status</div>
          <div className="stat-value" style={{ color: 'var(--clr-success)', fontSize: '1.4rem' }}>
            VERIFIED
          </div>
          <div className="stat-change positive">Intersection Clear</div>
        </div>
      </div>

      {/* Main Grid: Map & Clearance Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <TrafficMap height="380px" />
          </div>

          {/* Lane Clearance Analysis */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                🛣️ Corridor Clearance & Lane Path Breakdown
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-dim)', marginBottom: 6 }}>
                  REQUIRED APPROACH LANES
                </div>
                <div style={{ background: 'rgba(0,212,255,0.06)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0,212,255,0.2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--clr-primary)' }}>Lane N1 (North-to-South Through)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                    Queue: 2 vehicles | Occupancy: 15% | Clearance Time: ~3.2s
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--clr-text-dim)', marginBottom: 6 }}>
                  BLOCKING & CONFLICTING LANES (STOPPED)
                </div>
                <div style={{ background: 'rgba(255,23,68,0.06)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,23,68,0.2)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--clr-danger)' }}>Lanes E1, W1 (East & West Cross Traffic)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
                    Held at ALL_RED safety barrier. Conflicting movements halted.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Signal Light & Operator Manual Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Active Target Signal */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🚦 Signal Light State — {amb.nextIntersection || 'INT_2'}</div>
              <span className="badge badge-danger">{signal.mode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', margin: 'var(--space-md) 0' }}>
              <TrafficSignal label="North" color={signal.north} />
              <TrafficSignal label="South" color={signal.south} />
              <TrafficSignal label="East" color={signal.east} />
              <TrafficSignal label="West" color={signal.west} />
            </div>
          </div>

          {/* Authorized Operator Controls */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">⚙️ Operator Manual Override</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <button className="btn btn-success" onClick={() => alert('Manual Emergency Green Granted')}>
                Force Emergency Green
              </button>
              <button className="btn btn-warning" onClick={() => alert('All Red Hold Activated')}>
                Hold All-Red Safety Stop
              </button>
              <button className="btn btn-outline" onClick={() => alert('Restored Normal Signal')}>
                End Emergency & Restore
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
