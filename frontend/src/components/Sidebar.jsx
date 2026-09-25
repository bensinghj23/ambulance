/* ============================================================
   Sidebar Navigation Component — Smart City EOC Shell
   ============================================================ */
import React from 'react'
import { useAuth } from '../context/AuthContext'
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
  ShieldAlert,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'COMMAND CENTER', section: true, roles: ['COMMAND_CENTER', 'VIEWER', 'ANALYST', 'ADMIN'] },
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['COMMAND_CENTER', 'VIEWER', 'ANALYST', 'ADMIN'] },
  { path: '/live-traffic', label: 'Live Traffic', icon: Activity, roles: ['COMMAND_CENTER', 'VIEWER', 'ADMIN'] },
  { path: '/computer-vision', label: 'Computer Vision', icon: Eye, roles: ['COMMAND_CENTER', 'ADMIN'] },
  { path: '/emergencies', label: 'Emergencies', icon: AlertTriangle, roles: ['COMMAND_CENTER', 'VIEWER', 'ADMIN'] },

  { label: 'FLEET & INFRASTRUCTURE', section: true, roles: ['COMMAND_CENTER', 'VIEWER', 'ADMIN'] },
  { path: '/ambulances', label: 'Ambulance Fleet', icon: Ambulance, roles: ['COMMAND_CENTER', 'VIEWER', 'ADMIN'] },
  { path: '/intersections', label: 'Intersections', icon: GitMerge, roles: ['COMMAND_CENTER', 'VIEWER', 'ADMIN'] },

  { label: 'SIMULATION & METRICS', section: true, roles: ['COMMAND_CENTER', 'ANALYST', 'ADMIN'] },
  { path: '/simulation', label: 'Simulation', icon: PlayCircle, roles: ['COMMAND_CENTER', 'ADMIN'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['COMMAND_CENTER', 'ANALYST', 'ADMIN'] },
  { path: '/events', label: 'Audit Log', icon: History, roles: ['COMMAND_CENTER', 'ANALYST', 'ADMIN'] },

  { label: 'SYSTEM & ACCOUNT', section: true, roles: ['COMMAND_CENTER', 'VIEWER', 'ANALYST', 'ADMIN'] },
  { path: '/admin', label: 'Admin Dashboard', icon: ShieldAlert, roles: ['ADMIN'] },
  { path: '/settings', label: 'Settings', icon: Settings, roles: ['COMMAND_CENTER', 'ADMIN'] },
  { path: '/profile', label: 'User Profile', icon: User, roles: ['COMMAND_CENTER', 'VIEWER', 'ANALYST', 'ADMIN'] },
]

export default function Sidebar() {
  const { currentUser } = useAuth()
  const role = currentUser?.role || 'COMMAND_CENTER'

  const filteredNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(role))

  // Remove empty sections
  const finalNav = filteredNav.filter((item, i) => {
    if (item.section) {
      const next = filteredNav[i + 1]
      return next && !next.section
    }
    return true
  })

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
        {finalNav.map((item, i) =>
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
