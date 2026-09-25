/* ============================================================
   TrafficMap — Leaflet map showing intersections, ambulances,
   signal states, and routes.

   UPGRADED: Renders OSRM route geometry polylines instead of
   straight lines. Shows green corridor on actual road geometry.
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

    // Clean light basemap — OpenStreetMap compatible
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update markers and routes
  useEffect(() => {
    const L = window.L
    const map = mapInstanceRef.current
    if (!L || !map) return

    const activeAmbulances = Object.values(sim.ambulances).filter(a => a.status === 'ACTIVE')
    const allCorridorIds = new Set(activeAmbulances.flatMap(a => a.corridorIds || a.route || []))

    // Clear previous route layer
    if (routeLayerRef.current) {
      routeLayerRef.current.remove()
    }
    const routeGroup = L.layerGroup().addTo(map)
    routeLayerRef.current = routeGroup

    // Draw base connections between intersections (light gray)
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
              color: '#D1D5DB',
              weight: 2,
              opacity: 0.5,
            }
          ).addTo(routeGroup)
        }
      })
    })

    // Draw OSRM route geometry for active ambulances (green corridor)
    activeAmbulances.forEach((amb) => {
      if (amb.routeGeometry && amb.routeGeometry.length > 1) {
        // Real OSRM route polyline
        L.polyline(amb.routeGeometry, {
          color: '#10B981',
          weight: 5,
          opacity: 0.8,
        }).addTo(routeGroup)

        // Auto-fit map to show the full route
        if (amb.routeGeometry.length > 2) {
          try {
            const bounds = L.latLngBounds(amb.routeGeometry)
            map.fitBounds(bounds.pad(0.15), { animate: true, maxZoom: 16 })
          } catch (e) {
            // ignore bounds errors
          }
        }
      } else if (amb.route) {
        // Legacy fallback: straight lines between intersections
        const routeCoords = amb.route
          .map((intId) => {
            const int = sim.intersections.find((i) => i.id === intId)
            return int ? [int.coordinates.lat, int.coordinates.lng] : null
          })
          .filter(Boolean)

        L.polyline(routeCoords, {
          color: '#10B981',
          weight: 4,
          opacity: 0.9,
        }).addTo(routeGroup)
      }
    })

    // Intersection markers
    sim.intersections.forEach((int) => {
      const sig = sim.signalStates[int.id]
      const isEmergency = sig && sig.mode !== 'NORMAL'
      const isCorridor = allCorridorIds.has(int.id)

      let bgColor = '#F3F4F6'
      let borderColor = '#9CA3AF'
      let icon = '🚦'
      let statusText = 'NORMAL'

      if (isEmergency) {
        bgColor = '#D1FAE5'
        borderColor = '#10B981'
        icon = '✓'
        statusText = 'ACTIVE CORRIDOR'
      } else if (isCorridor) {
        bgColor = '#FEF3C7'
        borderColor = '#F59E0B'
        icon = '→'
        statusText = 'PREPARING'
      }

      if (markersRef.current[int.id]) {
        markersRef.current[int.id].remove()
      }

      const divIcon = L.divIcon({
        className: '',
        html: `
          <div style="
            width: 28px; height: 28px;
            background: ${bgColor};
            border: 2px solid ${borderColor};
            border-radius: 6px;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; color: ${borderColor}; font-size: 14px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          ">${icon}</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })

      const marker = L.marker([int.coordinates.lat, int.coordinates.lng], { icon: divIcon })
        .addTo(map)

      // Popup with signal state
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 200px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">INTERSECTION ${int.id}</div>
          <div style="font-size: 11px; font-weight: 600; color: ${isEmergency ? '#10B981' : isCorridor ? '#F59E0B' : '#6B7280'}; margin-bottom: 8px;">${statusText}</div>
          ${sig ? `
            <div style="font-size: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
              <div style="color: #6B7280;">Mode:</div>
              <div style="font-weight: 500;">${sig.mode}</div>
              <div style="color: #6B7280;">Phase:</div>
              <div style="font-weight: 500;">${sig.phase}</div>
              <div style="color: #6B7280;">Emerg. Approach:</div>
              <div style="font-weight: 500;">${sig.emergencyApproach || 'None'}</div>
              <div style="color: #6B7280;">Connected:</div>
              <div style="font-weight: 500;">${Object.values(int.connectedIntersections).join(', ')}</div>
            </div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; font-size: 11px;">
              <span>N: <b style="color: ${sig.north === 'green' ? '#10B981' : sig.north === 'red' ? '#EF4444' : '#F59E0B'}">${sig.north?.toUpperCase()}</b></span>
              <span>S: <b style="color: ${sig.south === 'green' ? '#10B981' : sig.south === 'red' ? '#EF4444' : '#F59E0B'}">${sig.south?.toUpperCase()}</b></span>
              <span>E: <b style="color: ${sig.east === 'green' ? '#10B981' : sig.east === 'red' ? '#EF4444' : '#F59E0B'}">${sig.east?.toUpperCase()}</b></span>
              <span>W: <b style="color: ${sig.west === 'green' ? '#10B981' : sig.west === 'red' ? '#EF4444' : '#F59E0B'}">${sig.west?.toUpperCase()}</b></span>
            </div>
          ` : ''}
        </div>
      `
      marker.bindPopup(popupHtml)
      markersRef.current[int.id] = marker
    })

    // Ambulance markers
    Object.values(sim.ambulances).forEach((amb) => {
      if (ambulanceMarkersRef.current[amb.id]) {
        ambulanceMarkersRef.current[amb.id].remove()
      }

      if (amb.status === 'ARRIVED') return

      // Rotate icon based on heading
      const rotation = amb.heading || 0

      const ambIcon = L.divIcon({
        className: 'ambulance-marker',
        html: `
          <div style="
            width: 24px; height: 24px;
            background: #EF4444;
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            color: white; font-size: 12px;
            transform: rotate(${rotation}deg);
          ">✚</div>
          <div style="
            position: absolute; top: 26px; left: 50%; transform: translateX(-50%);
            background: white; padding: 2px 4px; border-radius: 4px;
            font-size: 10px; font-weight: bold; border: 1px solid #E5E7EB;
            white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          ">${amb.id}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const distRemaining = amb.distanceRemaining != null ? `${Math.round(amb.distanceRemaining)}m` : '—'
      const routeType = amb.routeIsFallback ? 'FALLBACK' : 'OSRM'

      const marker = L.marker([amb.location.lat, amb.location.lng], { icon: ambIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: Inter, sans-serif; min-width: 200px;">
            <div style="font-weight: 700; margin-bottom: 8px;">${amb.id}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
              <div style="color: #6B7280;">Status:</div>
              <div style="font-weight: 600; color: #DC2626;">PROCEEDING</div>
              <div style="color: #6B7280;">Speed:</div>
              <div style="font-weight: 500;">${amb.speed?.toFixed(0)} km/h</div>
              <div style="color: #6B7280;">ETA:</div>
              <div style="font-weight: 500;">${amb.eta?.toFixed(0)}s</div>
              <div style="color: #6B7280;">Heading:</div>
              <div style="font-weight: 500;">${amb.heading?.toFixed(0)}°</div>
              <div style="color: #6B7280;">Distance Left:</div>
              <div style="font-weight: 500;">${distRemaining}</div>
              <div style="color: #6B7280;">Priority:</div>
              <div style="font-weight: 500;">${amb.priority}</div>
              <div style="color: #6B7280;">Current Int:</div>
              <div style="font-weight: 500;">${amb.currentIntersection || '—'}</div>
              <div style="color: #6B7280;">Next Int:</div>
              <div style="font-weight: 500;">${amb.nextIntersection || '—'}</div>
              <div style="color: #6B7280;">Route:</div>
              <div style="font-weight: 500;">${routeType}</div>
            </div>
          </div>
        `)

      ambulanceMarkersRef.current[amb.id] = marker
    })
  }, [sim.intersections, sim.signalStates, sim.ambulances])

  return (
    <div
      ref={mapRef}
      className="map-container"
      style={{ height, background: '#E5E7EB' }}
    />
  )
}
