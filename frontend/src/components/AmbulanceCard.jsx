/* ============================================================
   AmbulanceCard — Shows ambulance status, position, ETA
   ============================================================ */
import React from 'react'
import { MdLocalHospital, MdSpeed, MdTimer, MdRoute } from 'react-icons/md'

export default function AmbulanceCard({ ambulance, compact = false }) {
  if (!ambulance) return null

  const statusColors = {
    ACTIVE: 'var(--clr-danger)',
    ARRIVED: 'var(--clr-success)',
    WAITING: 'var(--clr-warning)',
  }

  const statusBadge = {
    ACTIVE: 'badge-danger',
    ARRIVED: 'badge-success',
    WAITING: 'badge-warning',
  }

  if (compact) {
    return (
      <div className="card" style={{
        padding: 'var(--space-md)',
        borderLeft: `3px solid ${statusColors[ambulance.status] || 'var(--clr-primary)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MdLocalHospital style={{ color: 'var(--clr-danger)', fontSize: '1.2rem' }} />
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{ambulance.id}</span>
          </div>
          <span className={`badge ${statusBadge[ambulance.status] || 'badge-neutral'}`}>
            <span className={`badge-dot ${ambulance.status === 'ACTIVE' ? 'red' : 'green'}`} />
            {ambulance.status}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`card ${ambulance.status === 'ACTIVE' ? 'emergency-active' : ''}`}
      style={{
        borderLeft: `3px solid ${statusColors[ambulance.status] || 'var(--clr-primary)'}`,
      }}
    >
      <div className="card-header">
        <div className="card-title">
          <MdLocalHospital style={{ color: 'var(--clr-danger)' }} />
          {ambulance.id}
        </div>
        <span className={`badge ${statusBadge[ambulance.status] || 'badge-neutral'}`}>
          <span className={`badge-dot ${ambulance.status === 'ACTIVE' ? 'red' : 'green'}`} />
          {ambulance.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-sm)' }}>
        <div>
          <div className="stat-label">Speed</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MdSpeed style={{ color: 'var(--clr-primary)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {ambulance.speed?.toFixed(0)} km/h
            </span>
          </div>
        </div>
        <div>
          <div className="stat-label">ETA</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MdTimer style={{ color: 'var(--clr-warning)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {ambulance.eta != null ? `${ambulance.eta.toFixed(0)}s` : '—'}
            </span>
          </div>
        </div>
        <div>
          <div className="stat-label">Priority</div>
          <span className={`badge ${ambulance.priority === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
            {ambulance.priority}
          </span>
        </div>
        <div>
          <div className="stat-label">Intersection</div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            {ambulance.currentIntersection || '—'}
          </span>
        </div>
      </div>

      {ambulance.route && (
        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--clr-border)' }}>
          <div className="stat-label" style={{ marginBottom: 4 }}>
            <MdRoute style={{ verticalAlign: 'middle' }} /> Route
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {ambulance.route.map((intId, i) => (
              <React.Fragment key={intId}>
                <span
                  className={`badge ${
                    intId === ambulance.currentIntersection
                      ? 'badge-primary'
                      : ambulance.route.indexOf(intId) < ambulance.routeIndex
                      ? 'badge-success'
                      : 'badge-neutral'
                  }`}
                >
                  {intId}
                </span>
                {i < ambulance.route.length - 1 && (
                  <span style={{ color: 'var(--clr-text-dim)' }}>→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
