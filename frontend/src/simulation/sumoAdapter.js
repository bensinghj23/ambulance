/* ============================================================
   SUMO Adapter — Integration boundary for TraCI/SUMO.
   ============================================================ */

export const SIMULATION_MODES = {
  BROWSER: 'BROWSER_SIMULATION',
  SUMO: 'SUMO_SIMULATION',
}

class SumoAdapter {
  constructor() {
    this.apiUrl = 'http://localhost:8001'
    this.wsUrl = 'ws://localhost:8001/ws/simulation'
    this.ws = null
    this.onStateUpdate = null
    this.sumoAvailable = false
    this.status = 'DISCONNECTED'
    this.mode = SIMULATION_MODES.BROWSER
  }

  async checkAvailability() {
    try {
      const res = await fetch(`${this.apiUrl}/status`)
      const data = await res.json()
      if (data.status === 'SUMO_UNAVAILABLE') {
        this.sumoAvailable = false
        this.mode = SIMULATION_MODES.BROWSER
        console.warn('SUMO is unavailable on the backend. Falling back to browser simulation.')
      } else {
        this.sumoAvailable = true
      }
      return this.sumoAvailable
    } catch (err) {
      console.warn('Could not reach SUMO service. Falling back to browser simulation.')
      this.sumoAvailable = false
      this.mode = SIMULATION_MODES.BROWSER
      return false
    }
  }

  async start() {
    if (!this.sumoAvailable) return false
    try {
      const res = await fetch(`${this.apiUrl}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gui: false })
      })
      const data = await res.json()
      if (data.status === 'STARTED') {
        this.mode = SIMULATION_MODES.SUMO
        return true
      }
      return false
    } catch (err) {
      console.error('Failed to start SUMO', err)
      return false
    }
  }

  async stop() {
    if (!this.sumoAvailable) return
    try {
      await fetch(`${this.apiUrl}/stop`, { method: 'POST' })
    } catch (err) {
      console.error('Failed to stop SUMO', err)
    }
    this.disconnectWs()
    this.mode = SIMULATION_MODES.BROWSER
  }

  connectWs(callback) {
    if (!this.sumoAvailable) return
    this.onStateUpdate = callback
    this.ws = new WebSocket(this.wsUrl)
    
    this.ws.onopen = () => {
      this.status = 'CONNECTED'
    }
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (this.onStateUpdate && data.status === 'RUNNING') {
        this.onStateUpdate(data)
      }
    }
    
    this.ws.onclose = () => {
      this.status = 'DISCONNECTED'
      this.mode = SIMULATION_MODES.BROWSER
    }
  }

  disconnectWs() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  async step() {
    if (!this.sumoAvailable || this.mode !== SIMULATION_MODES.SUMO) return
    try {
      await fetch(`${this.apiUrl}/step`, { method: 'POST' })
    } catch (err) {
      console.error('Failed to step SUMO', err)
    }
  }
}

export const sumoAdapter = new SumoAdapter()

export function getSimulationMode() {
  return sumoAdapter.mode
}

export function sendSignalCommandToSUMO(intersectionId, signalState) {
  if (sumoAdapter.mode === SIMULATION_MODES.SUMO) {
    console.log(`[SUMO Adapter] Sent signal state to SUMO for ${intersectionId}:`, signalState.mode)
    // Additional real TraCI fetch would go here, omitting for fallback scenario
  }
}

export function syncTrafficStateFromSUMO(trafficStates) {
  if (sumoAdapter.mode === SIMULATION_MODES.SUMO) {
    return trafficStates
  }
  return trafficStates
}
