/* ============================================================
   App Shell & Route Declarations — Full-Fledged Web App (v2.0)
   ============================================================ */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SimulationProvider } from './context/SimulationContext'

import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Breadcrumbs from './components/Breadcrumbs'

// Pages
import Dashboard from './pages/Dashboard'
import LiveTraffic from './pages/LiveTraffic'
import ComputerVision from './pages/ComputerVision'
import Emergencies from './pages/Emergencies'
import EmergencyDetails from './pages/EmergencyDetails'
import Ambulances from './pages/Ambulances'
import Intersections from './pages/Intersections'
import IntersectionDetails from './pages/IntersectionDetails'
import Simulation from './pages/Simulation'
import Analytics from './pages/Analytics'
import Events from './pages/Events'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

// Auth Pages
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

import AdminDashboard from './pages/AdminDashboard'
import DriverDashboard from './pages/DriverDashboard'

// Protected Route Wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, loading, hasPermission } = useAuth()
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg-base)' }}>
        <div className="spinner" />
      </div>
    )
  }
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  if (allowedRoles && !hasPermission(allowedRoles) && currentUser.role !== 'ADMIN') {
    // Basic redirect for unauthorized roles
    return <Navigate to={currentUser.role === 'AMBULANCE_DRIVER' ? '/driver' : '/dashboard'} replace />
  }
  return children
}

// Redirect root based on role
function RootRedirect() {
  const { currentUser } = useAuth()
  if (!currentUser) return <Navigate to="/login" replace />
  
  switch (currentUser.role) {
    case 'AMBULANCE_DRIVER':
      return <Navigate to="/driver" replace />
    case 'COMMAND_CENTER':
    case 'VIEWER':
      return <Navigate to="/dashboard" replace />
    case 'ANALYST':
      return <Navigate to="/analytics" replace />
    case 'ADMIN':
      return <Navigate to="/admin" replace />
    default:
      return <Navigate to="/dashboard" replace />
  }
}

// App Shell Layout for authenticated routes (Operators, Admins)
function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar />
        <div className="app-content">
          <Breadcrumbs />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live-traffic" element={<LiveTraffic />} />
            <Route path="/computer-vision" element={<ComputerVision />} />
            <Route path="/emergencies" element={<Emergencies />} />
            <Route path="/emergencies/:id" element={<EmergencyDetails />} />
            <Route path="/ambulances" element={<Ambulances />} />
            <Route path="/intersections" element={<Intersections />} />
            <Route path="/intersections/:id" element={<IntersectionDetails />} />
            <Route path="/simulation" element={<Simulation />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/events" element={<Events />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SimulationProvider>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Standalone Driver App */}
            <Route 
              path="/driver/*" 
              element={
                <ProtectedRoute allowedRoles={['AMBULANCE_DRIVER', 'ADMIN']}>
                  <div style={{ minHeight: '100vh', background: 'var(--clr-bg-base)' }}>
                    <Routes>
                      <Route path="/" element={<DriverDashboard />} />
                      <Route path="*" element={<Navigate to="/driver" replace />} />
                    </Routes>
                  </div>
                </ProtectedRoute>
              } 
            />

            {/* Protected Application Routes (Operator, Admin) */}
            <Route
              path="/*"
              element={
                <ProtectedRoute allowedRoles={['COMMAND_CENTER', 'ADMIN', 'ANALYST', 'VIEWER']}>
                  <AppLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </SimulationProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
