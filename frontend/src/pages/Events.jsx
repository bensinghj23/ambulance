/* ============================================================
   Events Page — Comprehensive System Audit Log
   Features: Search, multi-type filtering (EMERGENCY, PRIORITY,
   TRANSITION, RECOVERY, SAFETY, MQTT, CV), date/time sort.
   ============================================================ */
import React, { useState } from 'react'
import { useSimulation } from '../context/SimulationContext'
import { History, Search, Filter, ShieldAlert, Cpu, Activity } from 'lucide-react'

export default function Events() {
  const sim = useSimulation()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const filteredEvents = sim.eventLog.filter((evt) => {
    const matchesSearch =
      evt.message.toLowerCase().includes(search.toLowerCase()) ||
      evt.type.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'ALL' || evt.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">System Audit Event Log</h1>
          <p className="page-desc">
            Complete trace log of priority activations, signal transitions, safety holds, & recovery events
          </p>
        </div>
        <span className="badge badge-neutral">{sim.eventLog.length} Total Logged Events</span>
      </div>

      {/* Filter Row */}
      <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-md)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--clr-text-muted)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search event messages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34 }}
            />
          </div>

          <select className="form-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="ALL">All Event Types</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="EMERGENCY_GREEN">EMERGENCY_GREEN</option>
            <option value="PRIORITY">PRIORITY</option>
            <option value="TRANSITION">TRANSITION</option>
            <option value="RECOVERY">RECOVERY</option>
            <option value="PHASE_CHANGE">PHASE_CHANGE</option>
            <option value="SYSTEM">SYSTEM</option>
          </select>
        </div>
      </div>

      {/* Events Timeline List */}
      <div className="card">
        <div className="event-list" style={{ maxHeight: 600 }}>
          {filteredEvents.slice().reverse().map((evt, i) => (
            <div key={i} className="event-item" style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--clr-border)' }}>
              <span className="event-time">
                {new Date(evt.timestamp).toLocaleTimeString()}
              </span>
              <div className="event-content">
                <span
                  className={`badge ${
                    evt.type === 'EMERGENCY' || evt.type === 'EMERGENCY_GREEN'
                      ? 'badge-danger'
                      : evt.type === 'PRIORITY'
                      ? 'badge-warning'
                      : evt.type === 'RECOVERY'
                      ? 'badge-success'
                      : 'badge-neutral'
                  }`}
                  style={{ marginRight: 8 }}
                >
                  {evt.type}
                </span>
                <span style={{ fontSize: '0.85rem' }}>{evt.message}</span>
              </div>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-text">No matching system events found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
