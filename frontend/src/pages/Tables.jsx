import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import AdminProfileMenu from '../components/AdminProfileMenu'
import { getTables, updateTableByNumber, addTable, deleteTable } from '../api'
import { SkeletonBlock, SkeletonCardGrid } from '../components/Skeleton'

const F = "'Plus Jakarta Sans', sans-serif"

const IconPlus  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const IconCheck = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconX     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconTable = ({ size = 26, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="3" rx="1"/>
    <line x1="5" y1="10" x2="5" y2="17"/>
    <line x1="19" y1="10" x2="19" y2="17"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
)

function Tables() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin = user.role === 'Admin'
  const [tables, setTables] = useState([])
  const [loadingAdd, setLoadingAdd] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)

  const loadTables = async () => {
    try { const data = await getTables(); if (Array.isArray(data)) setTables(data) }
    catch { console.error('Failed to load tables!') }
    setInitialLoad(false)
  }

  useEffect(() => {
    loadTables()
    const interval = setInterval(loadTables, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleToggle = async (table) => {
    const isOccupied = table.status === 'Occupied'
    if (isOccupied) {
      if (!window.confirm(`Free Table ${table.number}?`)) return
      try { await updateTableByNumber(table.number, { status: 'Available', customer: '' }); await loadTables() }
      catch { alert('Failed to update table!') }
    } else {
      try { await updateTableByNumber(table.number, { status: 'Occupied', customer: '' }); await loadTables() }
      catch { alert('Failed to update table!') }
    }
  }

  const handleAddTable = async () => {
    setLoadingAdd(true)
    try { await addTable(); await loadTables() }
    catch (e) { alert('Failed to add table: ' + e.message) }
    setLoadingAdd(false)
  }

  const handleDeleteTable = async (table) => {
    if (table.status === 'Occupied') return alert(`Cannot delete Table ${table.number} — it is currently occupied!`)
    if (!window.confirm(`Delete Table ${table.number}? This cannot be undone.`)) return
    try { await deleteTable(table.id); await loadTables() }
    catch (e) { alert('Failed to delete table: ' + e.message) }
  }

  const available = tables.filter(t => t.status === 'Available').length
  const occupied  = tables.filter(t => t.status === 'Occupied').length

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        {/* Admin profile — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <AdminProfileMenu />
        </div>

        <div className="page-header">
          <div>
            <h1 className="page-title">Tables</h1>
            <p className="page-subtitle">Live table status — auto-refreshes every 5 seconds</p>
          </div>
          {isAdmin && (
            <button className="btn-primary" onClick={handleAddTable} disabled={loadingAdd}>
              <IconPlus /> {loadingAdd ? 'Adding...' : 'Add Table'}
            </button>
          )}
        </div>

        {/* STATS ROW */}
        {initialLoad ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 16,
                padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <SkeletonBlock width={40} height={40} radius={10} />
                <div style={{ flex: 1 }}>
                  <SkeletonBlock width={50} height={26} style={{ marginBottom: 6 }} />
                  <SkeletonBlock width={80} height={13} />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { Icon: IconCheck, count: available,     label: 'Available',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { Icon: IconX,     count: occupied,      label: 'Occupied',     color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
            { Icon: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
              count: tables.length, label: 'Total Tables', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
          ].map(({ Icon, count, label, color, bg, border }, i) => (
            <div key={i} style={{
              background: bg, border: `1.5px solid ${border}`, borderRadius: 16,
              padding: '18px 24px',
              display: 'flex', flexDirection: 'row',
              alignItems: 'center', gap: 14,
              boxShadow: `0 2px 10px ${color}18`,
            }}>
              <span style={{ color }}><Icon /></span>
              <div>
                <div style={{ fontWeight: 900, fontSize: 30, color, lineHeight: 1, fontFamily: F }}>{count}</div>
                <div style={{ fontSize: 13, color, fontWeight: 700, marginTop: 3, fontFamily: F }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* TABLES GRID */}
        {initialLoad ? (
          <SkeletonCardGrid count={8} minWidth={175} cardHeight={185} />
        ) : tables.length === 0 ? (
          <div className="panel">
            <div className="empty-state">
              <p>No tables yet</p>
              <span>Add a table using the button above to get started.</span>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
            gap: 18,
          }}>
            {tables.map(table => {
              const occ = table.status === 'Occupied'
              return (
                <div key={table.id} style={{ position: 'relative' }}>
                  {isAdmin && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteTable(table) }}
                      title="Delete table"
                      style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 10,
                        width: 30, height: 30, borderRadius: 9,
                        background: '#fef2f2', color: '#ef4444',
                        border: '1px solid #fca5a5', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#fef2f2' }}
                    >
                      <IconTrash />
                    </button>
                  )}
                  <div
                    onClick={() => handleToggle(table)}
                    style={{
                      padding: '30px 20px',
                      borderRadius: 18, textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.18s',
                      background: occ ? '#fef2f2' : '#f0fdf4',
                      border: `2px solid ${occ ? '#fca5a5' : '#bbf7d0'}`,
                      boxShadow: occ ? '0 2px 12px rgba(239,68,68,0.10)' : '0 2px 12px rgba(22,163,74,0.10)',
                      minHeight: 185,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-5px)'
                      e.currentTarget.style.boxShadow = occ ? '0 12px 32px rgba(239,68,68,0.22)' : '0 12px 32px rgba(22,163,74,0.24)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = occ ? '0 2px 12px rgba(239,68,68,0.10)' : '0 2px 12px rgba(22,163,74,0.10)'
                    }}
                  >
                    <div style={{
                      width: 60, height: 60, borderRadius: '50%',
                      background: occ ? '#fca5a5' : '#86efac',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: occ ? '0 0 0 6px rgba(239,68,68,0.10)' : '0 0 0 6px rgba(22,163,74,0.13)',
                      marginBottom: 4,
                    }}>
                      <IconTable size={26} color={occ ? '#ef4444' : '#14532d'} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 19, color: '#052e16', fontFamily: F }}>
                      Table {table.number}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: occ ? '#ef4444' : '#16a34a', fontFamily: F }}>
                      {table.status}
                    </div>
                    <div style={{
                      fontSize: 12, fontWeight: 700,
                      color: occ ? '#ef4444' : '#16a34a',
                      background: occ ? 'rgba(239,68,68,0.10)' : 'rgba(22,163,74,0.12)',
                      borderRadius: 24, padding: '5px 14px',
                      border: `1px solid ${occ ? '#fca5a5' : '#bbf7d0'}`,
                      fontFamily: F,
                    }}>
                      {occ ? 'Tap to Free' : 'Tap to Occupy'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export default Tables