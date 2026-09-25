/* ============================================================
   EmergencyStatus — Banner showing current emergency state
   ============================================================ */
import React from 'react'
import { MdWarning, MdCheckCircle } from 'react-icons/md'

export default function EmergencyStatus({ signalStates }) {
  const emergencyIntersections = Object.values(signalStates || {}).filter(
    (s) => s.mode && s.mode !== 'NORMAL'
  )

  if (emergencyIntersections.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <MdCheckCircle style={{ color: 'var(--clr-success)', fontSize: '1.3rem' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--clr-success)' }}>
              All Clear
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
              No active emergency. All intersections operating normally.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="emergency-banner">
      <div className="emergency-banner-icon">🚨</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-danger)' }}>
          Emergency Active
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
          {emergencyIntersections.length} intersection{emergencyIntersections.length > 1 ? 's' : ''} in emergency mode
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
        {emergencyIntersections.map((s) => (
          <span key={s.intersectionId} className="badge badge-danger">
            {s.intersectionId} — {s.mode}
          </span>
        ))}
      </div>
    </div>
  )
}
