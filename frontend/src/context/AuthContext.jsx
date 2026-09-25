/* ============================================================
   AuthContext — Firebase Auth + Role-Based Access Control (RBAC)
   Roles: ADMIN, TRAFFIC_OPERATOR, ANALYST, VIEWER
   ============================================================ */
import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, isFirebaseReady } from '../services/firebase'
import { getDocument, setDocument } from '../services/firestore'

const AuthContext = createContext(null)

// Default simulated user for offline / dev mode
const DEMO_USER = {
  uid: 'demo_operator_001',
  name: 'Alex Mercer',
  email: 'operator@smartcity.gov',
  role: 'TRAFFIC_OPERATOR', // ADMIN, TRAFFIC_OPERATOR, ANALYST, VIEWER
  department: 'Emergency Operations Center',
  photoURL: null,
  createdAt: new Date().toISOString(),
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(DEMO_USER)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseReady || !auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch role and profile details from Firestore
        const profile = await getDocument('users', user.uid)
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          name: profile?.name || user.displayName || user.email.split('@')[0],
          role: profile?.role || 'TRAFFIC_OPERATOR',
          photoURL: profile?.photoURL || user.photoURL,
          ...profile,
        })
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email, password) => {
    if (isFirebaseReady && auth) {
      const res = await signInWithEmailAndPassword(auth, email, password)
      const profile = await getDocument('users', res.user.uid)
      setCurrentUser({
        uid: res.user.uid,
        email: res.user.email,
        name: profile?.name || res.user.email.split('@')[0],
        role: profile?.role || 'TRAFFIC_OPERATOR',
        ...profile,
      })
      return res.user
    }
    // Simulation fallback
    const role = email.includes('admin')
      ? 'ADMIN'
      : email.includes('analyst')
      ? 'ANALYST'
      : email.includes('viewer')
      ? 'VIEWER'
      : 'TRAFFIC_OPERATOR'

    const simulatedUser = {
      uid: `usr_${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      department: 'Emergency Operations Center',
    }
    setCurrentUser(simulatedUser)
    return simulatedUser
  }

  const register = async (email, password, name, role = 'TRAFFIC_OPERATOR') => {
    if (isFirebaseReady && auth) {
      const res = await createUserWithEmailAndPassword(auth, email, password)
      const profileData = { name, email, role, createdAt: new Date().toISOString() }
      await setDocument('users', res.user.uid, profileData)
      setCurrentUser({ uid: res.user.uid, ...profileData })
      return res.user
    }
    const newUser = {
      uid: `usr_${Date.now()}`,
      name,
      email,
      role,
      department: 'Emergency Operations Center',
    }
    setCurrentUser(newUser)
    return newUser
  }

  const logout = async () => {
    if (isFirebaseReady && auth) {
      await firebaseSignOut(auth)
    }
    setCurrentUser(null)
  }

  const resetPassword = async (email) => {
    if (isFirebaseReady && auth) {
      await sendPasswordResetEmail(auth, email)
    }
    return true
  }

  const updateUserProfile = async (updates) => {
    if (!currentUser) return
    const updated = { ...currentUser, ...updates }
    setCurrentUser(updated)
    if (isFirebaseReady) {
      await setDocument('users', currentUser.uid, updates)
    }
  }

  const value = {
    currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    hasPermission: (allowedRoles) => {
      if (!currentUser) return false
      if (currentUser.role === 'ADMIN') return true
      return allowedRoles.includes(currentUser.role)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
