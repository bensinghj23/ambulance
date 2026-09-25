/* ============================================================
   Topbar Component — Global Header Shell
   Features: Search bar, system connection indicator, emergency status,
   notification bell badge, user profile menu, breadcrumbs.
   ============================================================ */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSimulation } from '../context/SimulationContext'
import NotificationsDrawer from './NotificationsDrawer'
import {
  Search,
  Bell,
  User,
  LogOut,
  Shield,
  Wifi,
  Activity,
  ChevronDown,
  AlertCircle,
} from 'lucide-react'

export default function Topbar() {
  const { currentUser, logout } = useAuth()
  const sim = useSimulation()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const activeAmbulance = Object.values(sim.ambulances).find(
    (a) => a.status === 'ACTIVE'
  )

  const emergencySignals = Object.values(sim.signalStates).filter(
    (s) => s.mode !== 'NORMAL'
  )

  // Generate notifications list from simulation events
  const notifications = sim.eventLog
    .filter((e) => ['PRIORITY', 'EMERGENCY', 'EMERGENCY_GREEN'].includes(e.type))
    .slice(-10)
    .map((e, idx) => ({
      id: idx,
      title: `${e.type.replace('_', ' ')} Alert`,
      message: e.message,
      severity: e.type.includes('EMERGENCY') ? 'HIGH' : 'WARNING',
      createdAt: e.timestamp,
    }))

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.toLowerCase()
    if (q.includes('amb') || q.includes('vehicle')) navigate('/ambulances')
    else if (q.includes('int') || q.includes('signal')) navigate('/intersections')
    else if (q.includes('cv') || q.includes('camera')) navigate('/computer-vision')
    else if (q.includes('emerg')) navigate('/emergencies')
    else if (q.includes('sim')) navigate('/simulation')
    else if (q.includes('analyt')) navigate('/analytics')
    else navigate('/events')
  }

  return (
    <header className="app-topbar">
      {/* Global Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', flex: 1, maxWidth: 360 }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search ambulances, intersections, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 34, height: 34, fontSize: '0.8rem' }}
          />
        </div>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginLeft: 'auto' }}>
        {/* System Connection Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
          <Wifi size={14} style={{ color: 'var(--clr-success)' }} />
          <span>MQTT: Connected</span>
        </div>

        {/* Emergency Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {emergencySignals.length > 0 ? (
            <span className="badge badge-danger">
              <Activity size={12} />
              CORRIDOR ACTIVE ({emergencySignals.length})
            </span>
          ) : (
            <span className="badge badge-success">
              SYSTEM STANDBY
            </span>
          )}
        </div>

        {/* Notifications Icon Button */}
        <button
          className="btn btn-ghost btn-icon tooltip"
          data-tooltip="Alerts"
          onClick={() => setShowNotifications(true)}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {notifications.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                background: 'var(--clr-danger)',
                borderRadius: '50%',
              }}
            />
          )}
        </button>

        {/* User Profile Dropdown Menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-ghost"
            style={{ gap: 8, padding: '4px 8px' }}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--clr-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: '#fff',
              }}
            >
              {currentUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-text-heading)' }}>
                {currentUser?.name || 'Operator'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>
                {currentUser?.role || 'COMMAND_CENTER'}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--clr-text-muted)' }} />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 6,
                width: 200,
                background: 'var(--clr-bg-card)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: 4,
                zIndex: 200,
              }}
            >
              <Link
                to="/profile"
                className="sidebar-link"
                onClick={() => setShowProfileMenu(false)}
              >
                <User size={16} /> User Profile
              </Link>
              <Link
                to="/settings"
                className="sidebar-link"
                onClick={() => setShowProfileMenu(false)}
              >
                <Shield size={16} /> Permissions & Role
              </Link>
              <button
                className="sidebar-link"
                style={{ width: '100%', color: 'var(--clr-danger)', border: 'none', background: 'transparent' }}
                onClick={() => {
                  setShowProfileMenu(false)
                  logout()
                  navigate('/login')
                }}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <NotificationsDrawer
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
      />
    </header>
  )
}
