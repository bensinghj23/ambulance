/* ============================================================
   NotificationsDrawer Component — Live alert stream
   ============================================================ */
import React from 'react'
import { X, Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function NotificationsDrawer({ open, onClose, notifications = [] }) {
  if (!open) return null

  const getIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return <ShieldAlert size={18} style={{ color: 'var(--clr-danger)' }} />
      case 'WARNING':
        return <AlertTriangle size={18} style={{ color: 'var(--clr-warning)' }} />
      case 'SUCCESS':
        return <CheckCircle2 size={18} style={{ color: 'var(--clr-success)' }} />
      default:
        return <Info size={18} style={{ color: 'var(--clr-primary)' }} />
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 360,
        background: 'rgba(17, 24, 39, 0.98)',
        borderLeft: '1px solid var(--clr-border)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderBottom: '1px solid var(--clr-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
          <Bell size={18} style={{ color: 'var(--clr-primary)' }} />
          Notifications & System Alerts
        </div>
        <button className="btn btn-ghost btn-icon" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)' }}>
        {notifications.length > 0 ? (
          notifications.map((n, i) => (
            <div
              key={n.id || i}
              style={{
                padding: 'var(--space-md)',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-sm)',
                borderLeft: `3px solid ${
                  n.severity === 'HIGH' || n.severity === 'CRITICAL'
                    ? 'var(--clr-danger)'
                    : n.severity === 'WARNING'
                    ? 'var(--clr-warning)'
                    : 'var(--clr-primary)'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {getIcon(n.severity)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--clr-text-heading)' }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-dim)', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                    {new Date(n.createdAt || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <Bell size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <div className="empty-state-text">No active notifications</div>
          </div>
        )}
      </div>
    </div>
  )
}
