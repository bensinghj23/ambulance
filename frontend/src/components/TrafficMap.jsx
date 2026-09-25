/* ============================================================
   TrafficMap — Leaflet map showing intersections, ambulances,
   signal states, and routes.
   ============================================================ */
import React, { useEffect, useRef } from 'react'
import { useSimulation } from '../context/SimulationContext'

export default function TrafficMap({ height = '500px' }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef({})
  const ambulanceMarkersRef = useRef({})
  const routeLayerRef = useRef(null)
  const sim = useSimulation()

  // Initialize map
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return

    // Use Leaflet from CDN (loaded in index.html)
    const L = window.L
    if (!L) return

    const map = L.map(mapRef.current, {
      center: [8.1833, 77.4119],
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    })

    // Dark tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update markers
  useEffect(() => {
    const L = window.L
    const map = mapInstanceRef.current
    if (!L || !map) return

    // Intersection markers
    sim.intersections.forEach((int) => {
      const sig = sim.signalStates[int.id]
      const isEmergency = sig && sig.mode !== 'NORMAL'
      const color = isEmergency ? '#ff1744' : '#00d4ff'

      if (markersRef.current[int.id]) {
        markersRef.current[int.id].remove()
      }

      // Custom intersection icon
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 32px; height: 32px;
            background: ${isEmergency ? 'rgba(255,23,68,0.3)' : 'rgba(0,212,255,0.2)'};
            border: 2px solid ${color};
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            font-size: 14px;
            box-shadow: 0 0 12px ${color}40;
          ">🚦</div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })

      const marker = L.marker([int.coordinates.lat, int.coordinates.lng], { icon })
        .addTo(map)

      // Popup with signal state
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 150px;">
          <div style="font-weight: 700; margin-bottom: 4px;">${int.name}</div>
          <div style="font-size: 12px; color: #666;">${int.id}</div>
          ${sig ? `
            <div style="margin-top: 8px; font-size: 12px;">
              <div>Mode: <strong>${sig.mode}</strong></div>
              <div style="display: flex; gap: 8px; margin-top: 4px;">
                <span>N: <span style="color: ${sig.north === 'green' ? '#00e676' : sig.north === 'red' ? '#ff1744' : '#ffd600'}">${sig.north?.toUpperCase()}</span></span>
                <span>S: <span style="color: ${sig.south === 'green' ? '#00e676' : sig.south === 'red' ? '#ff1744' : '#ffd600'}">${sig.south?.toUpperCase()}</span></span>
                <span>E: <span style="color: ${sig.east === 'green' ? '#00e676' : sig.east === 'red' ? '#ff1744' : '#ffd600'}">${sig.east?.toUpperCase()}</span></span>
                <span>W: <span style="color: ${sig.west === 'green' ? '#00e676' : sig.west === 'red' ? '#ff1744' : '#ffd600'}">${sig.west?.toUpperCase()}</span></span>
              </div>
            </div>
          ` : ''}
        </div>
      `
      marker.bindPopup(popupHtml)
      markersRef.current[int.id] = marker
    })

    // Draw connections between intersections
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
    }
    const routeGroup = L.layerGroup().addTo(map)
    routeLayerRef.current = routeGroup

    sim.intersections.forEach((int) => {
      Object.values(int.connectedIntersections).forEach((neighborId) => {
        const neighbor = sim.intersections.find((i) => i.id === neighborId)
        if (neighbor) {
          L.polyline(
            [
              [int.coordinates.lat, int.coordinates.lng],
              [neighbor.coordinates.lat, neighbor.coordinates.lng],
            ],
            {
              color: 'rgba(0,212,255,0.25)',
              weight: 3,
              dashArray: '8 4',
            }
          ).addTo(routeGroup)
        }
      })
    })

    // Ambulance markers
    Object.values(sim.ambulances).forEach((amb) => {
      if (ambulanceMarkersRef.current[amb.id]) {
        ambulanceMarkersRef.current[amb.id].remove()
      }

      if (amb.status === 'ARRIVED') return

      const ambIcon = L.divIcon({
        className: 'ambulance-marker',
        html: `
          <div style="
            width: 28px; height: 28px;
            background: rgba(255,23,68,0.8);
            border: 2px solid #ff1744;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
            box-shadow: 0 0 20px rgba(255,23,68,0.6);
          ">🚑</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([amb.location.lat, amb.location.lng], { icon: ambIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Inter, sans-serif;">
            <div style="font-weight: 700;">${amb.id}</div>
            <div style="font-size: 12px;">Speed: ${amb.speed?.toFixed(0)} km/h</div>
            <div style="font-size: 12px;">ETA: ${amb.eta?.toFixed(0)}s</div>
            <div style="font-size: 12px;">Priority: ${amb.priority}</div>
          </div>
        `)

      ambulanceMarkersRef.current[amb.id] = marker

      // Draw ambulance route
      if (amb.route) {
        const routeCoords = amb.route
          .map((intId) => {
            const int = sim.intersections.find((i) => i.id === intId)
            return int ? [int.coordinates.lat, int.coordinates.lng] : null
          })
          .filter(Boolean)

        L.polyline(routeCoords, {
          color: '#ff1744',
          weight: 4,
          opacity: 0.7,
          dashArray: '10 5',
        }).addTo(routeGroup)
      }
    })
  }, [sim.intersections, sim.signalStates, sim.ambulances])

  return (
    <div
      ref={mapRef}
      className="map-container"
      style={{ height, filter: 'none' }}
    />
  )
}
