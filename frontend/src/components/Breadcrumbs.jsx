/* ============================================================
   Breadcrumbs Component
   ============================================================ */
import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export default function Breadcrumbs() {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  const labelMap = {
    dashboard: 'Overview',
    'live-traffic': 'Live Traffic',
    'computer-vision': 'Computer Vision (CV)',
    emergencies: 'Emergencies',
    ambulances: 'Ambulances',
    intersections: 'Intersections',
    simulation: 'Simulation Environment',
    analytics: 'Analytics & Evaluation',
    events: 'System Audit Events',
    settings: 'System Configuration',
    profile: 'User Profile',
  }

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginBottom: 8 }}>
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'var(--clr-text-muted)' }}>
        <Home size={14} />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const label = labelMap[value] || value.toUpperCase()

        return (
          <React.Fragment key={to}>
            <ChevronRight size={12} style={{ color: 'var(--clr-text-dim)' }} />
            {isLast ? (
              <span style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>{label}</span>
            ) : (
              <Link to={to} style={{ color: 'var(--clr-text-muted)' }}>
                {label}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
