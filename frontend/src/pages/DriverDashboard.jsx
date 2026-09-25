import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useSimulation } from '../context/SimulationContext'
import { getNearbyHospitals } from '../services/hospitalService'
import TrafficMap from '../components/TrafficMap'
import { MdLocalHospital, MdNavigation, MdCheckCircle, MdWarning } from 'react-icons/md'

export default function DriverDashboard() {
  const { currentUser, logout } = useAuth()
  const sim = useSimulation()
  const [hospitals, setHospitals] = useState([])
  
  // Simulated initial driver location (e.g., near INT_3)
  const initialLocation = { lat: 28.6139, lng: 77.2090 } // Center map approx

  useEffect(() => {
    // 28.6139, 77.2090 is around INT_1/INT_3
    setHospitals(getNearbyHospitals(28.6110, 77.2070))
  }, [])

  const ambulanceId = currentUser?.ambulanceId || 'AMB-001'
  const myAmbulance = sim.ambulances[ambulanceId]

  const handleStartEmergency = (hospitalId) => {
    if (!sim.running) {
      sim.start()
    }
    let destInt = 'INT_4'
    if (hospitalId === 'HOSP-001') destInt = 'INT_4'
    else if (hospitalId === 'HOSP-002') destInt = 'INT_1'
    else if (hospitalId === 'HOSP-003') destInt = 'INT_2'

    // We pass the specific ambulanceId so it overrides the default random one.
    sim.spawnAmbulance({
      id: ambulanceId,
      origin: 'INT_3', // MVP fixed start
      destination: destInt,
      priority: 'HIGH'
    })
  }

  // State: READY, SELECTING_DEST
  const [viewState, setViewState] = useState('READY')

  if (myAmbulance && (myAmbulance.status === 'ACTIVE' || myAmbulance.status === 'ARRIVED')) {
    // ACTIVE OR ARRIVED
    return (
      <div style={{ padding: 'var(--space-md)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Driver: {ambulanceId}</h2>
          <button onClick={logout} className="btn btn-outline" style={{ padding: '4px 8px' }}>Logout</button>
        </div>

        {myAmbulance.status === 'ARRIVED' ? (
          <div className="card" style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
            <MdCheckCircle size={48} style={{ color: 'var(--clr-success)', marginBottom: '16px' }} />
            <h2 style={{ margin: 0, marginBottom: '8px' }}>ARRIVED</h2>
            <p style={{ color: 'var(--clr-text-muted)' }}>Emergency completed.</p>
            <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => {
              window.location.reload()
            }}>
              Return to Ready
            </button>
          </div>
        ) : (
          <>
            {(() => {
              const recentReroute = sim.eventLog
                .slice(-10)
                .reverse()
                .find(e => e.ambulanceId === myAmbulance.id && e.eventType === 'ROUTE_RECALCULATED' && (sim.simTime - e.time) < 15)
              if (recentReroute) {
                return (
                  <div style={{ background: 'var(--clr-warning)', color: '#000', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)', fontWeight: '600', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MdNavigation size={18} />
                      ROUTE UPDATED
                    </div>
                    <div style={{ fontWeight: '400', fontSize: '0.8rem', marginTop: '4px' }}>
                      Traffic conditions changed. New ETA: {Math.round(recentReroute.eta)}s
                    </div>
                  </div>
                )
              }
              return null
            })()}

            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>GPS Status</div>
                  <div style={{ fontWeight: '600', color: 'var(--clr-success)' }}>ACTIVE</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Destination</div>
                  <div style={{ fontWeight: '600' }}>{myAmbulance.destination}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--clr-border)', paddingTop: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>ETA</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{Math.round(myAmbulance.eta)}s</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase' }}>Distance</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{Math.round(myAmbulance.distanceRemaining)}m</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>CORRIDOR STATUS</div>
              {(() => {
                const activeConflict = sim.conflicts.find(c => c.queuedAmbulanceIds?.includes(myAmbulance.id))
                if (activeConflict) {
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MdWarning style={{ color: 'var(--clr-warning)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--clr-warning)' }}>CORRIDOR DELAYED</span>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--clr-text-muted)' }}>Intersection:</div>
                        <div style={{ fontWeight: '500' }}>{activeConflict.intersectionId}</div>
                        <div style={{ color: 'var(--clr-text-muted)', marginTop: '4px' }}>Reason:</div>
                        <div style={{ fontWeight: '500' }}>Emergency traffic coordination</div>
                      </div>
                    </>
                  )
                }
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--clr-success)' }}></div>
                      <span style={{ fontWeight: '600' }}>ACTIVE</span>
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                      <div style={{ color: 'var(--clr-text-muted)' }}>Next Intersection:</div>
                      <div style={{ fontWeight: '500' }}>{myAmbulance.nextIntersection || 'None'}</div>
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', height: '300px' }}>
              <TrafficMap height="100%" />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: 'var(--space-md)', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Driver: {ambulanceId}</h2>
        <button onClick={logout} className="btn btn-outline" style={{ padding: '4px 8px' }}>Logout</button>
      </div>

      {viewState === 'READY' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>GPS</div>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--clr-success)', fontWeight: '600', fontSize: '0.85rem' }}>
              ACTIVE
            </div>
          </div>
          
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Status</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>READY</div>
          </div>

          <button 
            className="btn btn-danger" 
            style={{ width: '100%', padding: '24px', fontSize: '1.2rem', fontWeight: '700', borderRadius: 'var(--radius-lg)' }}
            onClick={() => setViewState('SELECTING_DEST')}
          >
            START EMERGENCY
          </button>
        </div>
      )}

      {viewState === 'SELECTING_DEST' && (
        <div>
          <h3 style={{ margin: 0, marginBottom: '16px' }}>Select Destination</h3>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>NEARBY HOSPITALS</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {hospitals.map(h => (
              <div key={h.id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{h.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                    {h.distanceKm.toFixed(1)} km &middot; Estimated arrival: ~{Math.round(h.distanceKm * 2)} min
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStartEmergency(h.id)}
                >
                  SELECT
                </button>
              </div>
            ))}
          </div>

          <button 
            className="btn btn-outline" 
            style={{ width: '100%', marginTop: '24px' }}
            onClick={() => setViewState('READY')}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
