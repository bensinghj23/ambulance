/* ============================================================
   Sidebar Navigation Component — Smart City EOC Shell
   ============================================================ */
import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Activity,
  Eye,
  AlertTriangle,
  Ambulance,
  GitMerge,
  PlayCircle,
  BarChart3,
  History,
  Settings,
  User,
  Radio,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'COMMAND CENTER', section: true },
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/live-traffic', label: 'Live Traffic', icon: Activity },
  { path: '/computer-vision', label: 'Computer Vision', icon: Eye },
  { path: '/emergencies', label: 'Emergencies', icon: AlertTriangle },

  { label: 'FLEET & INFRASTRUCTURE', section: true },
  { path: '/ambulances', label: 'Ambulance Fleet', icon: Ambulance },
  { path: '/intersections', label: 'Intersections', icon: GitMerge },

  { label: 'SIMULATION & METRICS', section: true },
  { path: '/simulation', label: 'Simulation', icon: PlayCircle },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/events', label: 'Audit Log', icon: History },

  { label: 'SYSTEM & ACCOUNT', section: true },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/profile', label: 'User Profile', icon: User },
]

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🚑</div>
        <div className="sidebar-logo-text">
          Traffic Management
          <small>Command Center</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item, i) =>
          item.section ? (
            <div key={i} className="sidebar-section-label">{item.label}</div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-link-icon">
                <item.icon size={18} />
              </span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>

      <div className="sidebar-status">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
          <Radio size={14} style={{ color: 'var(--clr-success)' }} />
          <span style={{ color: 'var(--clr-text-muted)' }}>Engine: Active</span>
        </div>
      </div>
    </aside>
  )
}
