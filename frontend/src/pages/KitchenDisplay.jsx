import { useState, useEffect, useRef, useCallback } from react
import Navbar from ../components/Navbar
import { getKitchenOrders, updateKitchenOrderStatus } from ../api

const STATUS_CONFIG = {
  Pending:   { color: #ef4444, bg: #fef2f2, border: #fca5a5, next: Preparing, nextLabel: 👨‍🍳 Start Cooking, icon: 🆕 },
  Preparing: { color: #d97706, bg: #fffbeb, border: #fde68a, next: Ready,     nextLabel:  Mark Ready,    icon: 🍳 },
  Ready:     { color: #16a34a, bg: #f0fdf4, border: #bbf7d0, next: Served,    nextLabel:  Mark Served,   icon:  },
  Served:    { color: #94a3b8, bg: #f8fafc, border: #e2e8f0, next: null,        nextLabel: null,               icon: 🏁 },
}

function getElapsed(createdAt) {
  const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function getUrgencyColor(createdAt, status) {
  if (status !== Pending && status !== Preparing) return null
  const mins = (Date.now() - new Date(createdAt)) / 60000
  if (mins > 15) return #ef4444
  if (mins > 8) return #d97706
  return null
}

function playBeep(soundOn) {
  if (!soundOn) return
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const playDing = (freq, start, vol = 0.6) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc2.connect(gain2); gain2.connect(ctx.destination)
      osc.frequency.value = freq
      osc2.frequency.value = freq * 2.5
      osc.type = triangle
      osc2.type = sine
      gain.gain.setValueAtTime(vol, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 1.2)
      gain2.gain.setValueAtTime(vol * 0.3, ctx.currentTime + start)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.8)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 1.2)
      osc2.start(ctx.currentTime + start)
      osc2.stop(ctx.currentTime + start + 0.8)
    }
    playDing(900, 0)
    playDing(900, 0.45)
    playDing(900, 0.9)
  } catch {}
}

function requestNotifPermission() {
  if (Notification in window && Notification.permission === default) {
    Notification.requestPermission()
  }
}

function showBrowserNotif(count) {
  if (Notification in window && Notification.permission === granted) {
    new Notification( New Kitchen Order!, {
      body: `${count} new order${count > 1 ? s : } waiting in the kitchen!`,
      icon: /favicon.ico,
      tag: kitchen-order,
      renotify: true,
    })
  }
}

function OrderCard({ order, onStatusChange, updating, isNew }) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending
  const urgency = getUrgencyColor(order.created_at, order.status)
  const [elapsed, setElapsed] = useState(getElapsed(order.created_at))

  useEffect(() => {
    const t = setInterval(() => setElapsed(getElapsed(order.created_at)), 10000)
    return () => clearInterval(t)
  }, [order.created_at])

  return (
    <div style={{
      background: white, borderRadius: 16, overflow: hidden,
      border: `2px solid ${urgency || cfg.border}`,
      boxShadow: urgency ? `0 4px 20px ${urgency}30` : 0 2px 8px rgba(0,0,0,0.06),
      transition: all 0.2s,
      animation: isNew ? newOrderPulse 1s ease-in-out 3 : none,
    }}>
      <div style={{ background: cfg.bg, padding: 12px 16px, display: flex, justifyContent: space-between, alignItems: center, borderBottom: `1px solid ${cfg.border}` }}>
        <div style={{ display: flex, alignItems: center, gap: 10 }}>
          <span style={{ fontSize: 20 }}>{cfg.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: #0f172a }}>Table {order.table_no}</div>
            <div style={{ fontSize: 12, color: #94a3b8 }}>Order #{order.id}</div>
          </div>
        </div>
        <div style={{ textAlign: right }}>
          <div style={{ background: cfg.bg, color: cfg.color, border: `1.5px solid ${cfg.border}`, borderRadius: 20, padding: 3px 12px, fontSize: 12, fontWeight: 700 }}>
            {order.status}
          </div>
          <div style={{ fontSize: 12, color: urgency || #94a3b8, fontWeight: urgency ? 700 : 400, marginTop: 4 }}>
            {urgency ?   : ⏱️ }{elapsed}
          </div>
        </div>
      </div>

      <div style={{ padding: 12px 16px }}>
        {(order.items || []).map((item, i) => (
          <div key={i} style={{ display: flex, justifyContent: space-between, alignItems: center, padding: 8px 0, borderBottom: i < order.items.length - 1 ? 1px solid #f1f5f9 : none }}>
            <div style={{ display: flex, alignItems: center, gap: 8 }}>
              <span style={{ background: #16a34a, color: white, fontWeight: 800, fontSize: 13, width: 26, height: 26, borderRadius: 50%, display: flex, alignItems: center, justifyContent: center, flexShrink: 0 }}>{item.qty}</span>
              <span style={{ fontWeight: 600, fontSize: 15, color: #0f172a }}>{item.item_name}</span>
            </div>
            {item.notes && <span style={{ fontSize: 12, color: #64748b, fontStyle: italic }}> {item.notes}</span>}
          </div>
        ))}
      </div>

      <div style={{ padding: 8px 16px, background: #f8fafc, borderTop: 1px solid #f1f5f9, fontSize: 12, color: #94a3b8 }}>
        🧑‍💼 {order.cashier_name} · {new Date(order.created_at).toLocaleTimeString()}
      </div>

      {cfg.next && (
        <div style={{ padding: 12px 16px }}>
          <button
            onClick={() => onStatusChange(order.id, cfg.next)}
            disabled={updating === order.id}
            style={{
              width: 100%, padding: 11px, background: cfg.color, color: white,
              border: none, borderRadius: 10, cursor: updating === order.id ? not-allowed : pointer,
              fontSize: 14, fontWeight: 700, opacity: updating === order.id ? 0.6 : 1, transition: all 0.15s
            }}>
            {updating === order.id ?  Updating... : cfg.nextLabel}
          </button>
        </div>
      )}
    </div>
  )
}

function KitchenDisplay() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState()
  const [updating, setUpdating] = useState(null)
  const [activeFilter, setActiveFilter] = useState(Active)
  const [newOrderIds, setNewOrderIds] = useState(new Set())
  const prevOrderIdsRef = useRef(new Set())
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [notification, setNotification] = useState(null)
  const [soundOn, setSoundOn] = useState(true)
  const [unacked, setUnacked] = useState(0)
  const soundOnRef = useRef(true)

  useEffect(() => { soundOnRef.current = soundOn }, [soundOn])

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError()
    try {
      const data = await getKitchenOrders()
      const list = Array.isArray(data) ? data : []

      const currentIds = new Set(list.map(o => o.id))
      const newIds = new Set([...currentIds].filter(id => !prevOrderIdsRef.current.has(id)))

      if (newIds.size > 0 && prevOrderIdsRef.current.size > 0) {
        playBeep(soundOnRef.current)
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200])
        setNewOrderIds(newIds)
        const newPending = list.filter(o => newIds.has(o.id) && o.status === Pending)
        const newCount = newPending.length
        if (newCount > 0) {
          setUnacked(prev => prev + newCount)
          setNotification(` ${newCount} new order${newCount > 1 ? s : }!`)
          document.title = ` ${newCount} New Order${newCount > 1 ? s : }! — Kitchen`
          showBrowserNotif(newCount)
          setTimeout(() => {
            setNotification(null)
            document.title = Kitchen Display — Bistro POS
          }, 5000)
        }
        setTimeout(() => setNewOrderIds(new Set()), 3500)
      }

      prevOrderIdsRef.current = currentIds
      setOrders(list)
      setLastRefresh(new Date())
    } catch (e) {
      setError(Failed to load orders:  + e.message)
    }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    document.title = Kitchen Display — Bistro POS
    requestNotifPermission()
    loadOrders()
    const interval = setInterval(() => loadOrders(true), 3000)
    return () => {
      clearInterval(interval)
      document.title = Bistro POS
    }
  }, [loadOrders])

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(id)
    try {
      await updateKitchenOrderStatus(id, newStatus)
      await loadOrders(true)
    } catch (e) {
      alert(Failed to update:  + e.message)
    }
    setUpdating(null)
  }

  const filters = [Active, Pending, Preparing, Ready, All]

  const getFiltered = () => {
    if (activeFilter === Active) return orders.filter(o => [Pending, Preparing, Ready].includes(o.status))
    if (activeFilter === All) return orders
    return orders.filter(o => o.status === activeFilter)
  }

  const filtered = getFiltered()
  const pendingCount = orders.filter(o => o.status === Pending).length
  const preparingCount = orders.filter(o => o.status === Preparing).length
  const readyCount = orders.filter(o => o.status === Ready).length

  return (
    <div className="page-container">
      <style>{`
        @keyframes newOrderPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
          50% { transform: scale(1.02); box-shadow: 0 8px 30px rgba(239,68,68,0.3); }
        }
        @keyframes bannerPulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.05); }
        }
      `}</style>
      <Navbar />
      <div className="page-content">

        {/* New Order Notification Banner */}
        {notification && (
          <div style={{
            position: fixed, top: 20, left: 50%, transform: translateX(-50%),
            background: linear-gradient(135deg, #ef4444, #dc2626),
            color: white, padding: 16px 32px, borderRadius: 50,
            fontWeight: 800, fontSize: 18, zIndex: 9999,
            boxShadow: 0 8px 40px rgba(239,68,68,0.6),
            animation: bannerPulse 0.5s ease-in-out infinite,
            display: flex, alignItems: center, gap: 10, whiteSpace: nowrap,
          }}>
            <span style={{ fontSize: 24 }}></span>
            {notification}
            <button onClick={() => { setNotification(null); setUnacked(0) }} style={{ background: rgba(255,255,255,0.25), border: none, color: white, borderRadius: 50%, width: 26, height: 26, cursor: pointer, fontSize: 14, fontWeight: 700, display: flex, alignItems: center, justifyContent: center, marginLeft: 6 }}>✕</button>
          </div>
        )}

        {/* Unacked badge at top if no banner */}
        {!notification && unacked > 0 && (
          <div style={{ background: #fef2f2, border: 1.5px solid #fca5a5, borderRadius: 12, padding: 10px 16px, marginBottom: 16, display: flex, justifyContent: space-between, alignItems: center }}>
            <span style={{ color: #ef4444, fontWeight: 700, fontSize: 14 }}> {unacked} new order{unacked > 1 ? s : } since last check</span>
            <button onClick={() => setUnacked(0)} style={{ background: #ef4444, color: white, border: none, borderRadius: 8, padding: 5px 14px, cursor: pointer, fontSize: 13, fontWeight: 700 }}>✓ Got it</button>
          </div>
        )}

        {/* Header */}
        <div style={{ display: flex, justifyContent: space-between, alignItems: center, marginBottom: 20, flexWrap: wrap, gap: 12 }}>
          <div style={{ display: flex, alignItems: center, gap: 14, flexWrap: wrap }}>
            <h1 style={{ margin: 0 }}>🍳 Kitchen Display</h1>
            <div style={{ display: flex, gap: 8, flexWrap: wrap }}>
              {pendingCount > 0 && <span style={{ background: #fef2f2, color: #ef4444, border: 1.5px solid #fca5a5, borderRadius: 20, padding: 4px 12px, fontSize: 13, fontWeight: 700 }}>🆕 {pendingCount} Pending</span>}
              {preparingCount > 0 && <span style={{ background: #fffbeb, color: #d97706, border: 1.5px solid #fde68a, borderRadius: 20, padding: 4px 12px, fontSize: 13, fontWeight: 700 }}>🍳 {preparingCount} Cooking</span>}
              {readyCount > 0 && <span style={{ background: #f0fdf4, color: #16a34a, border: 1.5px solid #bbf7d0, borderRadius: 20, padding: 4px 12px, fontSize: 13, fontWeight: 700 }}> {readyCount} Ready</span>}
            </div>
          </div>
          <div style={{ display: flex, alignItems: center, gap: 10 }}>
            <span style={{ fontSize: 12, color: #94a3b8 }}>🟢 Live · {lastRefresh.toLocaleTimeString()}</span>
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundOn(prev => !prev)}
              title={soundOn ? Mute sound : Unmute sound}
              style={{ padding: 10px 14px, background: soundOn ? #f0fdf4 : #fef2f2, color: soundOn ? #16a34a : #ef4444, border: `1.5px solid ${soundOn ? #bbf7d0 : #fca5a5}`, borderRadius: 10, cursor: pointer, fontSize: 16, fontWeight: 700 }}>
              {soundOn ?  : 🔕}
            </button>
            <button onClick={() => loadOrders()} style={{ padding: 10px 18px, background: #f8fafc, color: #475569, border: 1.5px solid #e2e8f0, borderRadius: 10, cursor: pointer, fontSize: 13, fontWeight: 600 }}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: #fef2f2, border: 1px solid #fca5a5, color: #ef4444, padding: 10px 16px, borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
             {error}
          </div>
        )}

        <div style={{ display: flex, gap: 8, marginBottom: 20, flexWrap: wrap, alignItems: center }}>
          {filters.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: 8px 20px, borderRadius: 20, fontSize: 14, fontWeight: 600, border: `1.5px solid ${activeFilter === f ? #16a34a : #e2e8f0}`, background: activeFilter === f ? #16a34a : white, color: activeFilter === f ? white : #64748b, cursor: pointer, transition: all 0.15s }}>
              {f}
            </button>
          ))}
          <span style={{ marginLeft: auto, fontSize: 12, color: #94a3b8 }}>Auto-refresh every 3s</span>
        </div>

        {loading ? (
          <div style={{ textAlign: center, padding: 80, color: #94a3b8 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}></div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Loading kitchen orders...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: center, padding: 80, color: #94a3b8 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}></div>
            <div style={{ fontWeight: 700, fontSize: 18, color: #475569 }}>All Clear!</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>No {activeFilter === Active ? active : activeFilter.toLowerCase()} orders right now.</div>
          </div>
        ) : (
          <div style={{ display: grid, gridTemplateColumns: repeat(auto-fill, minmax(300px, 1fr)), gap: 18 }}>
            {filtered.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                updating={updating}
                isNew={newOrderIds.has(order.id)}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

export default KitchenDisplay