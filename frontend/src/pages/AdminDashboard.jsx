import React from 'react'
import { useAuth } from '../context/AuthContext'
import { MdSettings, MdPeople, MdSecurity, MdHistory } from 'react-icons/md'

export default function AdminDashboard() {
  const { currentUser } = useAuth()

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div style={{ padding: 'var(--space-xl)', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view the Admin Dashboard.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-desc">System configuration, users, and logs</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--space-md)' }}>
        <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
          <MdPeople size={32} style={{ color: 'var(--clr-primary)', marginBottom: '8px' }} />
          <h3>User Management</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Manage operators and drivers</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
          <MdSecurity size={32} style={{ color: 'var(--clr-primary)', marginBottom: '8px' }} />
          <h3>Roles & Permissions</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Configure access levels</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
          <MdSettings size={32} style={{ color: 'var(--clr-primary)', marginBottom: '8px' }} />
          <h3>System Settings</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Global simulation parameters</p>
        </div>
        <div className="card" style={{ padding: 'var(--space-md)', textAlign: 'center' }}>
          <MdHistory size={32} style={{ color: 'var(--clr-primary)', marginBottom: '8px' }} />
          <h3>Audit Logs</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>System event history</p>
        </div>
      </div>
    </div>
  )
}
