import { useState, useEffect } from 'react
import Navbar from ../components/Navbar
import { FaUserFriends, FaCheckCircle, FaTimesCircle, FaPlus, FaTrash } from 'react-icons/fa
import { getTables, updateTableByNumber, addTable, deleteTable } from '../api'

function Tables() {
  const user = JSON.parse(localStorage.getItem(user) || {})
  const isAdmin = user.role === Admin
  const [tables, setTables] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [loadingAdd, setLoadingAdd] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener(resize, handleResize)
    return () => window.removeEventListener(resize, handleResize)
  }, [])

  const loadTables = async () => {
    try {
      const data = await getTables()
      if (Array.isArray(data)) setTables(data)
    } catch {
      console.error(Failed to load tables!)
    }
  }

  useEffect(() => {
    loadTables()
    const interval = setInterval(loadTables, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleToggle = async (table) => {
    const isOccupied = table.status === Occupied
    if (isOccupied) {
      if (!window.confirm(`Free Table ${table.number}?`)) return
      try {
        await updateTableByNumber(table.number, { status: Available, customer:  })
        await loadTables()
      } catch { alert(Failed to update table!) }
    } else {
      try {
        await updateTableByNumber(table.number, { status: Occupied, customer:  })
        await loadTables()
      } catch { alert(Failed to update table!) }
    }
  }

  const handleAddTable = async () => {
    setLoadingAdd(true)
    try {
      await addTable()
      await loadTables()
    } catch (e) { alert(Failed to add table:  + e.message) }
    setLoadingAdd(false)
  }

  const handleDeleteTable = async (table) => {
    if (table.status === Occupied) return alert(`Cannot delete Table ${table.number} — it is currently occupied!`)
    if (!window.confirm(`Delete Table ${table.number}? This cannot be undone.`)) return
    try {
      await deleteTable(table.id)
      await loadTables()
    } catch (e) { alert(Failed to delete table:  + e.message) }
  }

  const available = tables.filter(t => t.status === Available).length
  const occupied  = tables.filter(t => t.status === Occupied).length

  const stats = [
    { icon: <FaCheckCircle />, count: available,     label: Available,    color: #16a34a, bg: #f0fdf4, border: #bbf7d0 },
    { icon: <FaTimesCircle />, count: occupied,      label: Occupied,     color: #ef4444, bg: #fef2f2, border: #fca5a5 },
    { icon: <FaUserFriends />, count: tables.length, label: Total Tables, color: #0d9488, bg: #f0fdfa, border: #99f6e4 },
  ]

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        {/* ── HEADER ── */}
        <div style={{ display: flex, justifyContent: space-between, alignItems: center, marginBottom: isMobile ? 16 : 24, flexWrap: wrap, gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 26 }}>Tables</h1>
          {isAdmin && (
            <button
              onClick={handleAddTable}
              disabled={loadingAdd}
              style={{ display: flex, alignItems: center, gap: 7, padding: isMobile ? 8px 14px : 10px 20px, background: #16a34a, color: white, border: none, borderRadius: 10, cursor: pointer, fontSize: isMobile ? 13 : 14, fontWeight: 700, opacity: loadingAdd ? 0.7 : 1 }}
            >
              <FaPlus size={12} /> {loadingAdd ? Adding... : Add Table}
            </button>
          )}
        </div>

        {/* ── STATS ROW ── */}
        <div style={{
          display: grid,
          gridTemplateColumns: isMobile ? repeat(3, 1fr) : repeat(3, auto),
          justifyContent: isMobile ? stretch : start,
          gap: isMobile ? 8 : 14,
          marginBottom: isMobile ? 16 : 24,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12,
              padding: isMobile ? 12px 8px : 16px 24px,
              display: flex, flexDirection: isMobile ? column : row,
              alignItems: center, gap: isMobile ? 4 : 12,
              textAlign: isMobile ? center : left,
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
          display: grid,
          gridTemplateColumns: isMobile ? repeat(2, 1fr) : repeat(auto-fill, minmax(160px, 1fr)),
          gap: isMobile ? 10 : 16,
        }}>
          {tables.map(table => {
            const occ = table.status === Occupied
            return (
              <div key={table.id} style={{ position: relative }}>

                {/* DELETE button — admin only */}
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTable(table) }}
                    title="Delete table"
                    style={{
                      position: absolute, top: 8, right: 8, zIndex: 10,
                      width: 26, height: 26, borderRadius: 7,
                      background: #fef2f2, color: #ef4444,
                      border: 1px solid #fca5a5, cursor: pointer,
                      display: flex, alignItems: center, justifyContent: center,
                    }}
                  >
                    <FaTrash size={10} />
                  </button>
                )}

                {/* TABLE CARD */}
                <div
                  onClick={() => handleToggle(table)}
                  style={{
                    padding: isMobile ? 16px 10px : 24px 16px,
                    borderRadius: 14, textAlign: center, cursor: pointer,
                    transition: all 0.18s,
                    background: occ ? #fef2f2 : #f0fdf4,
                    border: `2px solid ${occ ? #fca5a5 : #bbf7d0}`,
                    boxShadow: 0 2px 8px rgba(22,163,74,0.07),
                    minHeight: isMobile ? 130 : 160,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = translateY(-3px)
                    e.currentTarget.style.boxShadow = 0 8px 20px rgba(22,163,74,0.18)
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = translateY(0)
                    e.currentTarget.style.boxShadow = 0 2px 8px rgba(22,163,74,0.07)
                  }}
                >
                  <div style={{ fontSize: isMobile ? 28 : 34, marginBottom: 8 }}>
                    {occ ? 🔴 : 🟢}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: isMobile ? 15 : 17, color: #0f172a, marginBottom: 3 }}>
                    Table {table.number}
                  </div>
                  <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 700, color: occ ? #ef4444 : #16a34a, marginBottom: 6 }}>
                    {table.status}
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 600,
                    color: occ ? #ef4444 : #16a34a,
                    background: occ ? #fef2f2 : #dcfce7,
                    border: `1px solid ${occ ? #fca5a5 : #bbf7d0}`,
                    borderRadius: 20, padding: 3px 10px, display: inline-block
                  }}>
                    {occ ? Tap to Free : Tap to Occupy}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}

export default Tables