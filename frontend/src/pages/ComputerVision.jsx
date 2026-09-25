/* ============================================================
   Computer Vision (CV) Page
   Features: Camera/video feed simulation, YOLO detection overlay,
   tracked IDs, lane ROIs, vehicle counts, queue estimation,
   occupancy, density, speed, intersection occupancy, emergency
   detection, confidence score, CV processing status.
   ============================================================ */
import React, { useState, useEffect } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { Camera, Eye, Cpu, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'

export default function ComputerVision() {
  const sim = useSimulation()
  const [selectedCamera, setSelectedCamera] = useState('CAM_INT_1')
  const [showROIs, setShowROIs] = useState(true)
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)
  const [confidence, setConfidence] = useState(0.88)

  const activeAmbulance = Object.values(sim.ambulances).find((a) => a.status === 'ACTIVE')

  // Simulated object detections for overlay
  const detections = [
    { id: 'CAR_101', label: 'car', confidence: 0.94, bbox: { x: 120, y: 180, w: 90, h: 50 }, speed: 38, lane: 'N1' },
    { id: 'CAR_102', label: 'car', confidence: 0.89, bbox: { x: 240, y: 220, w: 85, h: 45 }, speed: 42, lane: 'N2' },
    { id: 'BUS_201', label: 'bus', confidence: 0.91, bbox: { x: 420, y: 150, w: 140, h: 70 }, speed: 25, lane: 'S1' },
    { id: 'TRUCK_301', label: 'truck', confidence: 0.86, bbox: { x: 180, y: 310, w: 120, h: 65 }, speed: 30, lane: 'W1' },
    ...(activeAmbulance
      ? [{ id: 'AMB_001', label: 'ambulance', confidence: 0.98, bbox: { x: 310, y: 190, w: 110, h: 55 }, speed: activeAmbulance.speed || 48, lane: 'N1', isEmergency: true }]
      : []),
  ]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Computer Vision Analysis</h1>
          <p className="page-desc">
            OpenCV + YOLO + ByteTrack Object Detection, Tracking & Lane ROI Safety Verification
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <span className="badge badge-success">
            <Cpu size={12} /> YOLOv8 Inference Active (30 FPS)
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Left Column: Camera Feed & Video Overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
              <div className="card-title">
                <Camera size={18} style={{ color: 'var(--clr-primary)' }} /> Camera Feed — {selectedCamera}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <select
                  className="form-select"
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  style={{ padding: '2px 24px 2px 8px', fontSize: '0.75rem' }}
                >
                  <option value="CAM_INT_1">INT_1 — North Camera</option>
                  <option value="CAM_INT_2">INT_2 — East Camera</option>
                  <option value="CAM_INT_3">INT_3 — South Camera</option>
                  <option value="CAM_INT_4">INT_4 — West Camera</option>
                </select>
              </div>
            </div>

            {/* Simulated Video Canvas with Bounding Boxes & ROIs */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16/9',
                background: '#0a0d14',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                border: '1px solid var(--clr-border)',
              }}
            >
              {/* Simulated Road Lane Markings background */}
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Lane Dividers */}
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeDasharray="10,10" strokeWidth="2" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(0,212,255,0.3)" strokeWidth="3" />
                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="rgba(255,255,255,0.1)" strokeDasharray="10,10" strokeWidth="2" />

                {/* Polygonal Lane ROIs */}
                {showROIs && (
                  <>
                    <polygon points="50,20 280,20 280,380 50,380" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x="60" y="45" fill="#00d4ff" fontSize="12" fontFamily="JetBrains Mono">ROI: Lane N1 (Through)</text>

                    <polygon points="300,20 540,20 540,380 300,380" fill="rgba(0,230,118,0.06)" stroke="rgba(0,230,118,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x="310" y="45" fill="#00e676" fontSize="12" fontFamily="JetBrains Mono">ROI: Lane N2 (Left Turn)</text>
                  </>
                )}
              </svg>

              {/* Vehicle Bounding Boxes Overlay */}
              {showBoundingBoxes &&
                detections.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      position: 'absolute',
                      left: `${d.bbox.x}px`,
                      top: `${d.bbox.y}px`,
                      width: `${d.bbox.w}px`,
                      height: `${d.bbox.h}px`,
                      border: `2px solid ${d.isEmergency ? 'var(--clr-danger)' : d.label === 'bus' ? 'var(--clr-warning)' : 'var(--clr-primary)'}`,
                      borderRadius: 4,
                      background: d.isEmergency ? 'rgba(255,23,68,0.2)' : 'rgba(0,212,255,0.1)',
                      boxShadow: d.isEmergency ? '0 0 16px rgba(255,23,68,0.6)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: -20,
                        left: 0,
                        background: d.isEmergency ? 'var(--clr-danger)' : '#1e293b',
                        color: '#fff',
                        fontSize: '10px',
                        padding: '1px 4px',
                        borderRadius: 2,
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {d.label.toUpperCase()} #{d.id.slice(-3)} ({(d.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                ))}

              {/* Feed Timestamp Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  background: 'rgba(0,0,0,0.7)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#00e676',
                }}
              >
                ● LIVE REC {new Date().toLocaleTimeString()} | 1080p@30FPS
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={showROIs} onChange={(e) => setShowROIs(e.target.checked)} />
                Show Lane ROIs
              </label>
              <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={showBoundingBoxes} onChange={(e) => setShowBoundingBoxes(e.target.checked)} />
                Show YOLO Bounding Boxes & Track IDs
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Detection Stats & Safety Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* CV Safety Verification */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <ShieldAlert size={18} style={{ color: 'var(--clr-warning)' }} /> Safety Verification
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Center Intersection Occupied:</span>
                <span className="badge badge-success">CLEAR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Emergency Vehicle Detected:</span>
                <span className={`badge ${activeAmbulance ? 'badge-danger' : 'badge-neutral'}`}>
                  {activeAmbulance ? 'AMBULANCE AMB_001' : 'NONE'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Conflicting Pedestrians:</span>
                <span className="badge badge-success">0 DETECTED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>YOLO Avg Confidence:</span>
                <span className="badge badge-primary">{(confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>

          {/* Real-time Object Tracking List */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Eye size={18} style={{ color: 'var(--clr-primary)' }} /> Tracked Objects ({detections.length})
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {detections.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.id}</span>
                  <span className={`badge ${d.isEmergency ? 'badge-danger' : 'badge-neutral'}`}>
                    {d.label.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--clr-text-muted)' }}>{d.speed} km/h</span>
                  <span style={{ color: 'var(--clr-primary)', fontFamily: 'var(--font-mono)' }}>{d.lane}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
