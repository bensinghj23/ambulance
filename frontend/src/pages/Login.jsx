/* ============================================================
   Login Page — Firebase Authentication
   ============================================================ */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('operator@smartcity.gov')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--clr-bg-base)',
        padding: 'var(--space-md)',
      }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 420, padding: 'var(--space-2xl)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 'var(--radius-md)',
              background: 'var(--clr-danger)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              boxShadow: 'none',
              marginBottom: 'var(--space-sm)',
            }}
          >
            🚑
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-text-heading)' }}>
            Emergency Corridor
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
            Smart City Traffic Management Dashboard
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: 'var(--space-sm) var(--space-md)',
              background: 'rgba(255,23,68,0.15)',
              border: '1px solid var(--clr-danger)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--clr-danger)',
              fontSize: '0.8rem',
              marginBottom: 'var(--space-md)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
              <input
                type="email"
                className="form-input"
                style={{ width: '100%', paddingLeft: 34 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--clr-primary)' }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
              <input
                type="password"
                className="form-input"
                style={{ width: '100%', paddingLeft: 34 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)', width: '100%' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Access */}
        <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--clr-border-muted, rgba(255,255,255,0.1))' }}>
          <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--clr-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Instant Demo Access
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }}
              onClick={async () => {
                await login('operator@smartcity.gov', 'password123');
                navigate('/dashboard');
              }}
            >
              👮 Demo Operator
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }}
              onClick={async () => {
                await login('admin@smartcity.gov', 'password123');
                navigate('/dashboard');
              }}
            >
              🛡️ Demo Admin
            </button>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-md)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
          Don't have an operator account?{' '}
          <Link to="/register" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>
            Register Operator
          </Link>
        </div>
      </div>
    </div>
  )
}
