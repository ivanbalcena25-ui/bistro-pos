import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { FaUserFriends, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'
import { getTables, updateTableByNumber } from '../api'

function Tables() {
  const [tables, setTables] = useState([])
  const [selected, setSelected] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadTables = async () => {
    try {
      const data = await getTables()
      if (Array.isArray(data)) setTables(data)
    } catch {
      console.error('Failed to load tables!')
    }
  }

  useEffect(() => {
    loadTables()
    const interval = setInterval(loadTables, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleOccupy = async () => {
    if (!customerName.trim()) return alert('Please enter guest name!')
    try {
      await updateTableByNumber(selected.number, { status: 'Occupied', customer: customerName })
      await loadTables()
      setSelected(null); setCustomerName('')
    } catch {
      alert('Failed to update table!')
    }
  }

  const handleFree = async (table) => {
    if (!window.confirm(`Free Table ${table.number}?`)) return
    try {
      await updateTableByNumber(table.number, { status: 'Available', customer: '' })
      await loadTables()
      setSelected(null)
    } catch {
      alert('Failed to update table!')
    }
  }

  const available = tables.filter(t => t.status === 'Available').length
  const occupied  = tables.filter(t => t.status === 'Occupied').length

  const stats = [
    { icon: <FaCheckCircle />, count: available,      label: 'Available',    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { icon: <FaTimesCircle />, count: occupied,       label: 'Occupied',     color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
    { icon: <FaUserFriends />, count: tables.length,  label: 'Total Tables', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  ]

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        {/* ── STATS ROW ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(3, auto)',
          justifyContent: isMobile ? 'stretch' : 'start',
          gap: isMobile ? 8 : 14,
          marginBottom: isMobile ? 16 : 24,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: 12,
              padding: isMobile ? '12px 8px' : '16px 24px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              gap: isMobile ? 4 : 12,
              textAlign: isMobile ? 'center' : 'left',
            }}>
              <span style={{ color: s.color, fontSize: isMobile ? 20 : 24 }}>{s.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: isMobile ? 20 : 26, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: isMobile ? 10 : 13, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── TABLES GRID ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile
            ? 'repeat(2, 1fr)'
            : 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: isMobile ? 10 : 16,
        }}>
          {tables.map(table => {
            const occ = table.status === 'Occupied'
            return (
              <div
                key={table.id}
                onClick={() => { setSelected(table); setCustomerName(table.customer || '') }}
                style={{
                  padding: isMobile ? '16px 10px' : '24px 16px',
                  borderRadius: 14,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  background: occ ? '#fef2f2' : '#f0fdf4',
                  border: `2px solid ${occ ? '#fca5a5' : '#bbf7d0'}`,
                  boxShadow: '0 2px 8px rgba(22,163,74,0.07)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(22,163,74,0.18)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(22,163,74,0.07)'
                }}
              >
                <div style={{ fontSize: isMobile ? 28 : 34, marginBottom: 8 }}>
                  {occ ? '🔴' : '🟢'}
                </div>
                <div style={{ fontWeight: 800, fontSize: isMobile ? 15 : 17, color: '#0f172a', marginBottom: 3 }}>
                  Table {table.number}
                </div>
                <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: occ ? '#ef4444' : '#16a34a', marginBottom: 4 }}>
                  {table.status}
                </div>
                {table.customer && (
                  <div style={{
                    fontSize: isMobile ? 11 : 12,
                    color: '#64748b',
                    background: 'rgba(0,0,0,0.05)',
                    borderRadius: 8,
                    padding: '3px 8px',
                    marginTop: 5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    👤 {table.customer}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── MODAL ── */}
        {selected && (
          <div className="modal-overlay">
            <div className="modal">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 30 }}>
                  {selected.status === 'Occupied' ? '🔴' : '🟢'}
                </div>
                <h2 style={{ margin: 0 }}>Table {selected.number}</h2>
              </div>

              <p>
                Status: <strong>{selected.status}</strong>
                {selected.customer && ` · Guest: ${selected.customer}`}
              </p>

              {selected.status === 'Available' ? (
                <>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                      Guest Name
                    </label>
                    <input
                      placeholder="Enter guest name"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleOccupy()}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-primary" onClick={handleOccupy}>✅ Occupy Table</button>
                    <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p>Click <strong>Free Table</strong> to mark this table as available again.</p>
                  <div className="form-actions">
                    <button
                      onClick={() => handleFree(selected)}
                      style={{
                        padding: '10px 20px',
                        background: '#f0fdf4', color: '#16a34a',
                        border: '1px solid #bbf7d0', borderRadius: 10,
                        cursor: 'pointer', fontSize: 14, fontWeight: 600,
                        flex: 1,
                      }}
                    >
                      ✅ Free Table
                    </button>
                    <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Tables