import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { getKitchenOrders, updateKitchenOrderStatus } from '../api'

const STATUS_CONFIG = {
  Pending:   { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', next: 'Preparing', nextLabel: '👨‍🍳 Start Cooking', icon: '🆕' },
  Preparing: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', next: 'Ready',     nextLabel: '✅ Mark Ready',    icon: '🍳' },
  Ready:     { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', next: 'Served',    nextLabel: '🍽️ Mark Served',   icon: '✅' },
  Served:    { color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0', next: null,        nextLabel: null,               icon: '🏁' },
}

function getElapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function getUrgencyColor(createdAt, status) {
  if (status !== 'Pending' && status !== 'Preparing') return null
  const mins = (Date.now() - new Date(createdAt)) / 60000
  if (mins > 15) return '#ef4444' // Red — very late
  if (mins > 8) return '#d97706'  // Orange — late
  return null
}

function OrderCard({ order, onStatusChange, updating }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending
  const urgency = getUrgencyColor(order.created_at, order.status)
  const [elapsed, setElapsed] = useState(getElapsed(order.created_at))

  useEffect(() => {
    const t = setInterval(() => setElapsed(getElapsed(order.created_at)), 10000)
    return () => clearInterval(t)
  }, [order.created_at])

  return (
    <div style={{
      background: 'white', borderRadius: 16, overflow: 'hidden',
      border: `2px solid ${urgency || cfg.border}`,
      boxShadow: urgency ? `0 4px 20px ${urgency}30` : '0 2px 8px rgba(0,0,0,0.06)',
      transition: 'all 0.2s',
    }}>
      {/* Card Header */}
      <div style={{ background: cfg.bg, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${cfg.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a' }}>Table {order.table_no}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Order #{order.id}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
            {order.status}
          </div>
          <div style={{ fontSize: 12, color: urgency || '#94a3b8', fontWeight: urgency ? 700 : 400, marginTop: 4 }}>
            {urgency ? '⚠️ ' : '⏱️ '}{elapsed}
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '12px 16px' }}>
        {(order.items || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < order.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ background: '#16a34a', color: 'white', fontWeight: 800, fontSize: 13, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.qty}</span>
              <span style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>{item.item_name}</span>
            </div>
            {item.notes && <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>📝 {item.notes}</span>}
          </div>
        ))}
      </div>

      {/* Cashier */}
      <div style={{ padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: 12, color: '#94a3b8' }}>
        🧑‍💼 {order.cashier_name} · {new Date(order.created_at).toLocaleTimeString()}
      </div>

      {/* Action Button */}
      {cfg.next && (
        <div style={{ padding: '12px 16px' }}>
          <button
            onClick={() => onStatusChange(order.id, cfg.next)}
            disabled={updating === order.id}
            style={{
              width: '100%', padding: '11px', background: cfg.color, color: 'white',
              border: 'none', borderRadius: 10, cursor: updating === order.id ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, opacity: updating === order.id ? 0.6 : 1, transition: 'all 0.15s'
            }}>
            {updating === order.id ? '⏳ Updating...' : cfg.nextLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState(null)
  const [activeFilter, setActiveFilter] = useState('Active')
  const [lastCount, setLastCount] = useState(0)
  const audioRef = useRef(null)

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const data = await getKitchenOrders()
      const list = Array.isArray(data) ? data : []
      // Notify on new orders
      const newCount = list.filter(o => o.status === 'Pending').length
      if (newCount > lastCount && lastCount !== 0) {
        // Flash title
        document.title = `🔔 ${newCount} New Order${newCount > 1 ? 's' : ''}! — Kitchen`
        setTimeout(() => { document.title = 'Kitchen Display — Bistro POS' }, 3000)
      }
      setLastCount(newCount)
      setOrders(list)
    } catch (e) {
      setError('Failed to load orders: ' + e.message)
    }
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    document.title = 'Kitchen Display — Bistro POS'
    loadOrders()
    const interval = setInterval(() => loadOrders(true), 5000)
    return () => {
      clearInterval(interval)
      document.title = 'Bistro POS'
    }
  }, [])

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id)
    try {
      await updateKitchenOrderStatus(id, newStatus)
      await loadOrders(true)
    } catch (e) {
      alert('Failed to update: ' + e.message)
    }
    setUpdating(null)
  }

  const filters = ['Active', 'Pending', 'Preparing', 'Ready', 'All']

  const getFiltered = () => {
    if (activeFilter === 'Active') return orders.filter(o => ['Pending', 'Preparing', 'Ready'].includes(o.status))
    if (activeFilter === 'All') return orders
    return orders.filter(o => o.status === activeFilter)
  }

  const filtered = getFiltered()
  const pendingCount = orders.filter(o => o.status === 'Pending').length
  const preparingCount = orders.filter(o => o.status === 'Preparing').length
  const readyCount = orders.filter(o => o.status === 'Ready').length

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h1 style={{ margin: 0 }}>🍳 Kitchen Display</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              {pendingCount > 0 && <span style={{ background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>🆕 {pendingCount} Pending</span>}
              {preparingCount > 0 && <span style={{ background: '#fffbeb', color: '#d97706', border: '1.5px solid #fde68a', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>🍳 {preparingCount} Cooking</span>}
              {readyCount > 0 && <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1.5px solid #bbf7d0', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>✅ {readyCount} Ready</span>}
            </div>
          </div>
          <button onClick={() => loadOrders()} style={{ padding: '10px 18px', background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            🔄 Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
            ❌ {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 600, border: `1.5px solid ${activeFilter === f ? '#16a34a' : '#e2e8f0'}`, background: activeFilter === f ? '#16a34a' : 'white', color: activeFilter === f ? 'white' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
              {f}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13, color: '#94a3b8' }}>
            Auto-refreshes every 5s
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Loading kitchen orders...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, color: '#94a3b8' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#475569' }}>All Clear!</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>No {activeFilter === 'Active' ? 'active' : activeFilter.toLowerCase()} orders right now.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
            {filtered.map(order => (
              <OrderCard key={order.id} order={order} onStatusChange={handleStatusChange} updating={updating} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default KitchenDisplay