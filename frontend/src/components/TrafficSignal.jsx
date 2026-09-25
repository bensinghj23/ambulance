/* ============================================================
   TrafficSignal — Visual traffic light component
   ============================================================ */
import React from 'react'

export default function TrafficSignal({ direction, color, label, compact = false }) {
  const size = compact ? 16 : 24

  return (
    <div className="signal-display" style={compact ? { padding: 4, gap: 3 } : {}}>
      <div
        className={`signal-light ${color === 'red' ? 'red' : 'off'}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`signal-light ${color === 'yellow' ? 'yellow' : 'off'}`}
        style={{ width: size, height: size }}
      />
      <div
        className={`signal-light ${color === 'green' ? 'green' : 'off'}`}
        style={{ width: size, height: size }}
      />
      {label && <div className="signal-label">{label}</div>}
    </div>
  )
}
