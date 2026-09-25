/* ============================================================
   LaneStatus — Per-lane traffic statistics display
   ============================================================ */
import React from 'react'

function LaneBar({ label, value, max = 1, color = 'var(--clr-primary)' }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <span style={{
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--clr-text-muted)',
        width: 48,
        flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{
        flex: 1,
        height: 6,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 3,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: pct > 80 ? 'var(--clr-danger)' : pct > 50 ? 'var(--clr-warning)' : color,
          borderRadius: 3,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <span style={{
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--clr-text)',
        width: 32,
        textAlign: 'right',
      }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </span>
    </div>
  )
}

export default function LaneStatus({ trafficState, intersectionId, simTime = 1 }) {
  if (!trafficState || simTime === 0) {
    return (
      <div className="card">
        <div className="card-title">Lane Status</div>
        <div className="empty-state" style={{ padding: 'var(--space-md)' }}>
          <div className="empty-state-text">Simulation paused<br/>No live traffic data</div>
        </div>
      </div>
    )
  }

  const { queueLengthByLane = {}, occupancyByLane = {}, averageSpeedByLane = {} } = trafficState

  const lanes = Object.keys(queueLengthByLane).sort()

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          🛣️ {intersectionId || 'Lane Status'}
        </div>
        <span className="badge badge-neutral">{lanes.length} lanes</span>
      </div>

      <div style={{ marginTop: 'var(--space-sm)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--clr-text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
          Queue Length
        </div>
        {lanes.map((lane) => (
          <LaneBar
            key={`q-${lane}`}
            label={lane}
            value={queueLengthByLane[lane] || 0}
            max={15}
          />
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-md)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--clr-text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
          Occupancy
        </div>
        {lanes.map((lane) => (
          <LaneBar
            key={`o-${lane}`}
            label={lane}
            value={occupancyByLane[lane] || 0}
            max={1}
            color="var(--clr-warning)"
          />
        ))}
      </div>
    </div>
  )
}
