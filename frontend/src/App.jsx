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

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth()
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
  return children
}

// App Shell Layout for authenticated routes
function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Topbar />
        <div className="app-content">
          <Breadcrumbs />
          <Routes>
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

            {/* Protected Application Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
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
