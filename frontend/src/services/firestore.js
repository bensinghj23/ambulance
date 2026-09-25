/* ============================================================
   Firestore Service — CRUD operations for all collections.
   Falls back to in-memory simulation store when Firebase
   is not configured.
   ============================================================ */
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore'
import { db, isFirebaseReady } from './firebase'

// ── In-memory fallback store (simulation mode) ─────────────
const memStore = {
  intersections: {},
  ambulances: {},
  trafficState: {},
  signalStates: {},
  emergencyEvents: [],
  simulationRuns: [],
  systemConfig: {},
}

const listeners = new Map()

function notifyListeners(collectionName) {
  const key = collectionName
  if (listeners.has(key)) {
    const data = Object.values(memStore[collectionName] || {})
    listeners.get(key).forEach((cb) => cb(data))
  }
}

// ── Generic helpers ────────────────────────────────────────
export async function setDocument(collectionName, docId, data) {
  if (isFirebaseReady) {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } else {
    memStore[collectionName] = memStore[collectionName] || {}
    memStore[collectionName][docId] = { ...data, id: docId, updatedAt: new Date().toISOString() }
    notifyListeners(collectionName)
  }
}

export async function updateDocument(collectionName, docId, data) {
  if (isFirebaseReady) {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } else {
    memStore[collectionName] = memStore[collectionName] || {}
    memStore[collectionName][docId] = {
      ...(memStore[collectionName][docId] || {}),
      ...data,
      id: docId,
      updatedAt: new Date().toISOString(),
    }
    notifyListeners(collectionName)
  }
}

export async function getDocument(collectionName, docId) {
  if (isFirebaseReady) {
    const snap = await getDoc(doc(db, collectionName, docId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  }
  return memStore[collectionName]?.[docId] || null
}

export async function getCollection(collectionName) {
  if (isFirebaseReady) {
    const snap = await getDocs(collection(db, collectionName))
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  }
  return Object.values(memStore[collectionName] || {})
}

export async function removeDocument(collectionName, docId) {
  if (isFirebaseReady) {
    await deleteDoc(doc(db, collectionName, docId))
  } else {
    delete memStore[collectionName]?.[docId]
    notifyListeners(collectionName)
  }
}

/**
 * Subscribe to real-time changes.
 * Returns an unsubscribe function.
 */
export function subscribeCollection(collectionName, callback) {
  if (isFirebaseReady) {
    const q = collection(db, collectionName)
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      callback(data)
    })
  }
  // In-memory listener
  if (!listeners.has(collectionName)) listeners.set(collectionName, new Set())
  listeners.get(collectionName).add(callback)
  // Fire immediately with current state
  callback(Object.values(memStore[collectionName] || {}))
  return () => {
    listeners.get(collectionName)?.delete(callback)
  }
}

export function subscribeDocument(collectionName, docId, callback) {
  if (isFirebaseReady) {
    return onSnapshot(doc(db, collectionName, docId), (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    })
  }
  // In-memory: piggy-back on collection listener
  const cb = () => {
    callback(memStore[collectionName]?.[docId] || null)
  }
  if (!listeners.has(collectionName)) listeners.set(collectionName, new Set())
  listeners.get(collectionName).add(cb)
  cb()
  return () => {
    listeners.get(collectionName)?.delete(cb)
  }
}

// ── Typed helpers ──────────────────────────────────────────
export const setIntersection = (id, data) => setDocument('intersections', id, data)
export const setAmbulance = (id, data) => setDocument('ambulances', id, data)
export const setTrafficState = (id, data) => setDocument('trafficState', id, data)
export const setSignalState = (id, data) => setDocument('signalStates', id, data)
export const updateAmbulance = (id, data) => updateDocument('ambulances', id, data)
export const updateSignalState = (id, data) => updateDocument('signalStates', id, data)

export function addEmergencyEvent(event) {
  const id = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return setDocument('emergencyEvents', id, { ...event, timestamp: new Date().toISOString() })
}

export function addSimulationRun(run) {
  const id = `run_${Date.now()}`
  return setDocument('simulationRuns', id, run)
}

// Expose memStore for simulation engine
export { memStore }
