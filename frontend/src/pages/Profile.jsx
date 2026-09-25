/* ============================================================
   Profile Page — User Account & RBAC Permissions Matrix
   ============================================================ */
import React from 'react'
import { useAuth } from '../context/AuthContext'
import { User, Shield, Key, Mail, Building, CheckCircle } from 'lucide-react'

export default function Profile() {
  const { currentUser } = useAuth()

  const permissionsMatrix = {
    ADMIN: ['System Configuration', 'User Management', 'Manual Signal Override', 'View Analytics', 'Emergency Priority Controls'],
    TRAFFIC_OPERATOR: ['Manual Signal Override', 'View Analytics', 'Emergency Priority Controls', 'Simulation Control'],
    ANALYST: ['View Analytics', 'Export Metrics', 'View Event Audit Logs'],
    VIEWER: ['Read-only Dashboard', 'Live Map Monitoring'],
  }

  const role = currentUser?.role || 'TRAFFIC_OPERATOR'
  const userPermissions = permissionsMatrix[role] || []

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Profile & Permissions</h1>
          <p className="page-desc">
            Account details, Role-Based Access Control (RBAC) permissions matrix, & session status
          </p>
        </div>
      </div>

      <div className="grid-2">
        {/* User Account Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <User size={18} style={{ color: 'var(--clr-primary)' }} /> Operator Account Details
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', margin: 'var(--space-md) 0' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'var(--clr-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {currentUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--clr-text-heading)' }}>
                {currentUser?.name || 'Alex Mercer'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Mail size={14} /> {currentUser?.email || 'operator@smartcity.gov'}
              </div>
              <div style={{ marginTop: 4 }}>
                <span className="badge badge-primary">{role}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--clr-border)', paddingTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-text-muted)' }}>Department:</span>
              <span>Emergency Operations Center</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-text-muted)' }}>User ID:</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{currentUser?.uid || 'usr_001'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--clr-text-muted)' }}>Session Persistence:</span>
              <span style={{ color: 'var(--clr-success)' }}>Active (Firebase Auth)</span>
            </div>
          </div>
        </div>

        {/* RBAC Permissions Matrix Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Shield size={18} style={{ color: 'var(--clr-success)' }} /> Role-Based Access Permissions ({role})
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
            {userPermissions.map((perm, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 'var(--space-sm) var(--space-md)',
                  background: 'rgba(0,230,118,0.06)',
                  border: '1px solid rgba(0,230,118,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                }}
              >
                <CheckCircle size={16} style={{ color: 'var(--clr-success)' }} />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
