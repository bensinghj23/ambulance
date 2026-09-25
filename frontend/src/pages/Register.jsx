/* ============================================================
   Register Page — Controlled Account Creation
   ============================================================ */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Lock, Shield, ArrowRight } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('TRAFFIC_OPERATOR')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(email, password, name, role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg-base)', padding: 'var(--space-md)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 'var(--space-2xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-text-heading)' }}>
            Register Operator Account
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
            Smart City Emergency Operations Center Access
          </p>
        </div>

        {error && (
          <div style={{ padding: 'var(--space-sm) var(--space-md)', background: 'rgba(255,23,68,0.15)', border: '1px solid var(--clr-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--clr-danger)', fontSize: '0.8rem', marginBottom: 'var(--space-md)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Assign Role</label>
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="TRAFFIC_OPERATOR">TRAFFIC_OPERATOR</option>
              <option value="ANALYST">ANALYST</option>
              <option value="ADMIN">ADMIN</option>
              <option value="VIEWER">VIEWER</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)', width: '100%' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--clr-primary)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
