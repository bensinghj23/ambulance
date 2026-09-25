/* ============================================================
   SimulationContext — React context that connects the
   simulation engine to the component tree.
   ============================================================ */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import simulationEngine from '../simulation/simulationEngine'

const SimulationContext = createContext(null)

export function SimulationProvider({ children }) {
  const [snapshot, setSnapshot] = useState(simulationEngine.getSnapshot())
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      simulationEngine.initialize()
    }

    const unsub = simulationEngine.subscribe((snap) => {
      setSnapshot(snap)
    })
    return unsub
  }, [])

  const start = useCallback(() => simulationEngine.start(), [])
  const pause = useCallback(() => simulationEngine.pause(), [])
  const reset = useCallback(() => simulationEngine.reset(), [])
  const setSpeed = useCallback((s) => simulationEngine.setSpeed(s), [])

  const spawnAmbulance = useCallback((opts) => {
    return simulationEngine.spawnAmbulance(opts)
  }, [])

  const getMetrics = useCallback((id) => {
    return simulationEngine.getAmbulanceMetrics(id)
  }, [])

  const value = {
    ...snapshot,
    start,
    pause,
    reset,
    setSpeed,
    spawnAmbulance,
    getMetrics,
  }

  return (
    <SimulationContext.Provider value={value}>
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const ctx = useContext(SimulationContext)
  if (!ctx) throw new Error('useSimulation must be inside SimulationProvider')
  return ctx
}

export default SimulationContext
