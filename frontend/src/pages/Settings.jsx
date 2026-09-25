/* ============================================================
   Settings Page — System Configuration & Thresholds
   ============================================================ */
import React, { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { MdSettings, MdSave, MdRefresh } from 'react-icons/md'

export default function Settings() {
  const sim = useSimulation()

  const [threshold, setThreshold] = useState(70)
  const [detectionDistance, setDetectionDistance] = useState(500)
  const [preClearanceBuffer, setPreClearanceBuffer] = useState(10)
  const [greenDuration, setGreenDuration] = useState(30)
  const [yellowDuration, setYellowDuration] = useState(4)
  const [allRedDuration, setAllRedDuration] = useState(2)
  const [maxHoldTime, setMaxHoldTime] = useState(90)
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings & Configuration</h1>
          <p className="page-desc">
            Configure emergency priority activation thresholds, signal timings & ROI parameters
          </p>
        </div>
        {saved && <span className="badge badge-success">✓ Settings Saved</span>}
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Emergency Priority Engine Configuration */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚨 Priority Engine Configuration</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Activation Priority Threshold (Score 0-100)</label>
              <input
                className="form-input"
                type="number"
                min="10"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-dim)' }}>
                Min priority score required to activate emergency signal state (Default: 70)
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Detection Range (Meters)</label>
              <input
                className="form-input"
                type="number"
                min="50"
                max="2000"
                value={detectionDistance}
                onChange={(e) => setDetectionDistance(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Pre-clearance Buffer (Seconds)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="30"
                value={preClearanceBuffer}
                onChange={(e) => setPreClearanceBuffer(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Signal Controller Timings */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚦 Signal Controller Timings</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Normal Green Phase (Seconds)</label>
              <input
                className="form-input"
                type="number"
                min="10"
                max="120"
                value={greenDuration}
                onChange={(e) => setGreenDuration(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Yellow Phase (Seconds)</label>
              <input
                className="form-input"
                type="number"
                min="2"
                max="10"
                value={yellowDuration}
                onChange={(e) => setYellowDuration(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">All-Red Safety Clearance (Seconds)</label>
              <input
                className="form-input"
                type="number"
                min="1"
                max="10"
                value={allRedDuration}
                onChange={(e) => setAllRedDuration(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Emergency Hold Duration (Seconds)</label>
              <input
                className="form-input"
                type="number"
                min="30"
                max="300"
                value={maxHoldTime}
                onChange={(e) => setMaxHoldTime(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-md)' }}>
          <button type="button" className="btn btn-outline" onClick={() => window.location.reload()}>
            <MdRefresh /> Reset Defaults
          </button>
          <button type="submit" className="btn btn-primary">
            <MdSave /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  )
}
