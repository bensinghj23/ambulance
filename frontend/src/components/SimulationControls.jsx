/* ============================================================
   SimulationControls — Start/pause/reset, speed, ambulance
   spawning controls
   ============================================================ */
import React, { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'
import {
  MdPlayArrow,
  MdPause,
  MdReplay,
  MdLocalHospital,
  MdSpeed,
  MdTimer,
} from 'react-icons/md'

export default function SimulationControls({ compact = false }) {
  const sim = useSimulation()
  const [origin, setOrigin] = useState('INT_1')
  const [destination, setDestination] = useState('INT_4')
  const [priority, setPriority] = useState('HIGH')
  const [speed, setSpeed] = useState(48)

  const intersectionIds = sim.intersections.map((i) => i.id)

  const handleSpawn = () => {
    sim.spawnAmbulance({
      origin,
      destination,
      priority,
      speed: Number(speed),
    })
  }

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <MdPlayArrow style={{ color: 'var(--clr-primary)' }} />
          Simulation Controls
        </div>
        <span className={`badge ${sim.running ? 'badge-success' : 'badge-neutral'}`}>
          <span className={`badge-dot ${sim.running ? 'green' : ''}`} />
          {sim.running ? 'Running' : 'Paused'}
        </span>
      </div>

      {/* Playback controls */}
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        {sim.running ? (
          <button className="btn btn-outline" onClick={sim.pause}>
            <MdPause /> Pause
          </button>
        ) : (
          <button className="btn btn-primary" onClick={sim.start}>
            <MdPlayArrow /> Start
          </button>
        )}
        <button className="btn btn-outline" onClick={sim.reset}>
          <MdReplay /> Reset
        </button>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 var(--space-md)',
          background: 'rgba(255,255,255,0.03)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: 'var(--clr-text-heading)',
        }}>
          <MdTimer style={{ color: 'var(--clr-text-muted)' }} />
          {formatTime(sim.simTime)}
        </div>
      </div>

      {/* Speed slider */}
      <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
        <label className="form-label">
          <MdSpeed style={{ verticalAlign: 'middle' }} /> Speed: {sim.speed}x
        </label>
        <input
          type="range"
          min="0.25"
          max="10"
          step="0.25"
          value={sim.speed}
          onChange={(e) => sim.setSpeed(Number(e.target.value))}
        />
      </div>

      {!compact && (
        <>
          {/* Ambulance spawn */}
          <div style={{
            borderTop: '1px solid var(--clr-border)',
            paddingTop: 'var(--space-md)',
            marginTop: 'var(--space-sm)',
          }}>
            <div style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--clr-text-dim)',
              marginBottom: 'var(--space-sm)',
            }}>
              🚑 Spawn Ambulance
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <div className="form-group">
                <label className="form-label">Origin</label>
                <select className="form-select" value={origin} onChange={(e) => setOrigin(e.target.value)}>
                  {intersectionIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Destination</label>
                <select className="form-select" value={destination} onChange={(e) => setDestination(e.target.value)}>
                  {intersectionIds.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Speed (km/h)</label>
                <input
                  className="form-input"
                  type="number"
                  min="10"
                  max="100"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                />
              </div>
            </div>

            <button
              className="btn btn-danger"
              style={{ width: '100%', marginTop: 'var(--space-md)' }}
              onClick={handleSpawn}
              disabled={origin === destination}
            >
              <MdLocalHospital /> Spawn Ambulance
            </button>
          </div>
        </>
      )}
    </div>
  )
}
