/* ============================================================
   LiveTraffic Page — Real-time traffic monitoring & lane stats
   ============================================================ */
import React, { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'
import TrafficMap from '../components/TrafficMap'
import LaneStatus from '../components/LaneStatus'
import TrafficSignal from '../components/TrafficSignal'
import { MdTraffic, MdDirectionsCar, MdLayers } from 'react-icons/md'

export default function LiveTraffic() {
  const sim = useSimulation()
  const [selectedIntersection, setSelectedIntersection] = useState('INT_1')

  const currentInt = sim.intersections.find((i) => i.id === selectedIntersection)
  const currentSignal = sim.signalStates[selectedIntersection]
  const currentTraffic = sim.trafficStates[selectedIntersection]

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Traffic Monitoring</h1>
          <p className="page-desc">
            Real-time lane statistics, queue lengths, vehicle occupancy & signal phases
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <select
            className="form-select"
            value={selectedIntersection}
            onChange={(e) => setSelectedIntersection(e.target.value)}
          >
            {sim.intersections.map((int) => (
              <option key={int.id} value={int.id}>
                {int.id} — {int.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Main Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="card" style={{ padding: 'var(--space-md)' }}>
            <TrafficMap height="500px" />
          </div>

          {/* Intersection Signal Phase Visualizer */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <MdTraffic style={{ color: 'var(--clr-primary)' }} /> Phase Visualizer — {selectedIntersection}
              </div>
              <span className={`badge ${currentSignal?.mode !== 'NORMAL' ? 'badge-danger' : 'badge-success'}`}>
                {currentSignal?.mode || 'NORMAL'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <div className="stat-label">North Approach</div>
                <TrafficSignal direction="north" color={currentSignal?.north} label="North" />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <div className="stat-label">South Approach</div>
                <TrafficSignal direction="south" color={currentSignal?.south} label="South" />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <div className="stat-label">East Approach</div>
                <TrafficSignal direction="east" color={currentSignal?.east} label="East" />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)' }}>
                <div className="stat-label">West Approach</div>
                <TrafficSignal direction="west" color={currentSignal?.west} label="West" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Lane Status & Approach Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <LaneStatus trafficState={currentTraffic} intersectionId={selectedIntersection} simTime={sim.simTime} />

          {/* Connected Intersections Graph info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <MdLayers style={{ color: 'var(--clr-primary)' }} /> Network Topology
              </div>
            </div>
            {currentInt?.connectedIntersections && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {Object.entries(currentInt.connectedIntersections).map(([dir, neighborId]) => (
                  <div
                    key={dir}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-sm) var(--space-md)',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                      {dir} Link
                    </span>
                    <span className="badge badge-primary">{neighborId}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
