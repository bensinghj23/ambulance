/* ============================================================
   Hospital Service — Simulated MVP hospital dataset
   ============================================================ */
import { haversineDistance } from './mapService'

const HOSPITALS = [
  {
    id: "HOSP-001",
    name: "City Central Hospital",
    latitude: 51.510,
    longitude: -0.100,
    address: "Downtown",
    emergencyCapable: true
  },
  {
    id: "HOSP-002",
    name: "Government General Hospital",
    latitude: 51.520,
    longitude: -0.090,
    address: "North District",
    emergencyCapable: true
  },
  {
    id: "HOSP-003",
    name: "St. Mary's Medical Center",
    latitude: 51.505,
    longitude: -0.115,
    address: "West End",
    emergencyCapable: true
  }
]

export function getHospitals() {
  return HOSPITALS
}

export function getHospitalById(id) {
  return HOSPITALS.find(h => h.id === id)
}

export function getNearbyHospitals(latitude, longitude) {
  const currentLoc = { lat: latitude, lng: longitude }
  return HOSPITALS.map(h => {
    const dist = calculateHospitalDistance(currentLoc, { lat: h.latitude, lng: h.longitude })
    return {
      ...h,
      distanceKm: dist
    }
  }).sort((a, b) => a.distanceKm - b.distanceKm)
}

export function calculateHospitalDistance(locA, locB) {
  // uses mapService's haversineDistance which returns meters, we return km
  return haversineDistance(locA, locB) / 1000
}
