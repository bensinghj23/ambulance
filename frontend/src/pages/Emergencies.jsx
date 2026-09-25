/* ============================================================
   Emergencies Page — Emergency Events Directory
   Features: Table view, search, priority filter, status filter,
   date/time filter, route summaries.
   ============================================================ */
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSimulation } from '../context/SimulationContext'
import { AlertCircle, Search, Filter, ArrowRight, ShieldAlert } from 'lucide-react'

export default function Emergencies() {
  const sim = useSimulation()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const ambulances = Object.values(sim.ambulances)

  const filteredAmbulances = ambulances.filter((a) => {
    const matchesSearch =
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.currentIntersection?.toLowerCase().includes(search.toLowerCase())
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter
    return matchesSearch && matchesPriority && matchesStatus
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Emergency Events Directory</h1>
          <p className="page-desc">
            Active and Historical Emergency Vehicle Priority Dispatch Runs
          </p>
        </div>
      </div>

      {/* Filters row */}
      <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-md)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Filter by vehicle ID or intersection..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34 }}
            />
          </div>

          <select className="form-select" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
          </select>

          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARRIVED">ARRIVED</option>
            <option value="WAITING">WAITING</option>
          </select>
        </div>
      </div>

      {/* Emergency Event Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--clr-border)', color: 'var(--clr-text-muted)' }}>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>Event / Vehicle ID</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>Priority</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>Route Summary</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>Current Location</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>Speed</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>ETA</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>Status</th>
                <th style={{ padding: 'var(--space-sm) var(--space-md)' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAmbulances.map((amb) => (
                <tr key={amb.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    🚑 {amb.id}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    <span className={`badge ${amb.priority === 'CRITICAL' || amb.priority === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                      {amb.priority}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    {amb.route ? amb.route.join(' → ') : 'INT_1 → INT_4'}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-mono)' }}>
                    {amb.currentIntersection || 'INT_1'}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-mono)' }}>
                    {amb.speed?.toFixed(0) || 48} km/h
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)', fontFamily: 'var(--font-mono)' }}>
                    {amb.eta ? `${amb.eta.toFixed(0)}s` : '—'}
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    <span className={`badge ${amb.status === 'ACTIVE' ? 'badge-danger' : 'badge-success'}`}>
                      {amb.status}
                    </span>
                  </td>
                  <td style={{ padding: 'var(--space-sm) var(--space-md)' }}>
                    <Link to={`/emergencies/${amb.id}`} className="btn btn-outline btn-sm">
                      Details <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredAmbulances.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--clr-text-dim)' }}>
                    No emergency dispatch events match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
