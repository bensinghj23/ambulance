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
      <div className="page-header" style={{ borderBottom: '1px solid var(--clr-border)', paddingBottom: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '22px' }}>Computer Vision Analysis</h1>
          <p className="page-desc" style={{ color: 'var(--clr-text-muted)', fontSize: '13px' }}>
            Object Detection, Tracking & Lane ROI Safety Verification [SIMULATED MODULE]
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <span className="badge badge-neutral">
            <Cpu size={12} /> CV SIMULATION MODE
          </span>
        </div>
      </div>

      <div className="grid-2">
        {/* Left Column: Camera Feed & Video Overlay */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-sm)' }}>
              <div className="card-title">
                <Camera size={18} style={{ color: 'var(--clr-text-muted)' }} /> Camera Feed — {selectedCamera}
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <select
                  className="form-select"
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  style={{ padding: '2px 24px 2px 8px', fontSize: '12px' }}
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
                background: '#1F2937', // Dark gray for camera feed
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid #374151',
              }}
            >
              {/* Simulated Road Lane Markings background */}
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Lane Dividers */}
                <line x1="25%" y1="0" x2="25%" y2="100%" stroke="rgba(255,255,255,0.15)" strokeDasharray="10,10" strokeWidth="2" />
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
                <line x1="75%" y1="0" x2="75%" y2="100%" stroke="rgba(255,255,255,0.15)" strokeDasharray="10,10" strokeWidth="2" />

                {/* Polygonal Lane ROIs */}
                {showROIs && (
                  <>
                    <polygon points="50,20 280,20 280,380 50,380" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x="60" y="45" fill="#E5E7EB" fontSize="12" fontFamily="var(--font-mono)">ROI: Lane N1</text>

                    <polygon points="300,20 540,20 540,380 300,380" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4,4" />
                    <text x="310" y="45" fill="#E5E7EB" fontSize="12" fontFamily="var(--font-mono)">ROI: Lane N2</text>
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
                      border: `2px solid ${d.isEmergency ? '#EF4444' : d.label === 'bus' ? '#F59E0B' : '#9CA3AF'}`,
                      background: d.isEmergency ? 'rgba(239,68,68,0.15)' : 'transparent',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: -18,
                        left: -2,
                        background: d.isEmergency ? '#EF4444' : '#4B5563',
                        color: '#fff',
                        fontSize: '10px',
                        padding: '2px 4px',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {d.label.toUpperCase()} {d.id} [SIM]
                    </div>
                  </div>
                ))}

              {/* Feed Timestamp Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  background: 'rgba(0,0,0,0.6)',
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#FFFFFF',
                }}
              >
                ● SIMULATED FEED | {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={showROIs} onChange={(e) => setShowROIs(e.target.checked)} />
                Show Lane ROIs
              </label>
              <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={showBoundingBoxes} onChange={(e) => setShowBoundingBoxes(e.target.checked)} />
                Show Simulated Bounding Boxes
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Detection Stats & Safety Verification */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* CV Safety Verification */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>
                <ShieldAlert size={18} style={{ color: 'var(--clr-warning)', marginRight: '6px' }} /> Safety Verification
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Intersection Occupied:</span>
                <span style={{ fontWeight: '600', color: 'var(--clr-success)' }}>CLEAR</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Emergency Vehicle Detected:</span>
                <span style={{ fontWeight: '600', color: activeAmbulance ? 'var(--clr-danger)' : 'var(--clr-text-muted)' }}>
                  {activeAmbulance ? activeAmbulance.id : 'NONE'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--clr-border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Conflicting Pedestrians:</span>
                <span style={{ fontWeight: '600', color: 'var(--clr-success)' }}>0 DETECTED</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>Data Source:</span>
                <span style={{ fontWeight: '600', color: 'var(--clr-text-dim)' }}>SIMULATION STATE</span>
              </div>
            </div>
          </div>

          {/* Real-time Object Tracking List */}
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <div className="card-title" style={{ fontSize: '15px' }}>
                <Eye size={18} style={{ color: 'var(--clr-text-muted)', marginRight: '6px' }} /> Simulated Objects ({detections.length})
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {detections.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.id}</span>
                  <span style={{ fontWeight: 600, color: d.isEmergency ? 'var(--clr-danger)' : 'var(--clr-text)' }}>
                    {d.label.toUpperCase()}
                  </span>
                  <span style={{ color: 'var(--clr-text-muted)' }}>{d.speed} km/h</span>
                  <span style={{ color: 'var(--clr-text-dim)', fontFamily: 'var(--font-mono)' }}>{d.lane}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
