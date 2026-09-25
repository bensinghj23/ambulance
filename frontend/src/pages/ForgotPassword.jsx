/* ============================================================
   ForgotPassword Page
   ============================================================ */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    await resetPassword(email)
    setSubmitted(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg-base)', padding: 'var(--space-md)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420, padding: 'var(--space-2xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--clr-text-heading)' }}>
            Reset Password
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
            Enter your email to receive password reset instructions
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
            <CheckCircle size={48} style={{ color: 'var(--clr-success)', marginBottom: 12 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Reset Link Sent</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
              Check your inbox for reset instructions.
            </p>
            <Link to="/login" className="btn btn-outline" style={{ marginTop: 'var(--space-md)' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-sm)', width: '100%' }}>
              Send Reset Link
            </button>

            <div style={{ marginTop: 'var(--space-md)', textAlign: 'center' }}>
              <Link to="/login" style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
