import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { FaMoneyBillWave, FaShoppingCart, FaUsers, FaCoffee, FaSyncAlt } from 'react-icons/fa'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { getTransactions } from '../api'

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState({ sales: 0, orders: 0, customers: 0, items: 0 })
  const [recent, setRecent] = useState([])
  const [topItems, setTopItems] = useState([])
  const [chartData, setChartData] = useState([])
  const [greeting, setGreeting] = useState('')

  const loadData = async () => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')

    try {
      const all = await getTransactions()
      if (!Array.isArray(all)) return

      const today = new Date().toDateString()
      const todayTx = all.filter(t => new Date(t.created_at).toDateString() === today && !t.voided)

      setStats({
        sales: todayTx.reduce((s, t) => s + Number(t.total), 0),
        orders: todayTx.length,
        customers: new Set(todayTx.map(t => t.customer_name)).size,
        items: todayTx.reduce((s, t) => s + (t.items?.reduce((ss, i) => ss + i.qty, 0) || 0), 0),
      })

      setRecent([...all].reverse().slice(0, 5))

      const cnt = {}
      all.forEach(t => (t.items || []).forEach(i => {
        const name = i.item_name || i.name
        cnt[name] = (cnt[name] || 0) + i.qty
      }))
      setTopItems(Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5))

      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i)
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayTx = all.filter(t => new Date(t.created_at).toDateString() === d.toDateString() && !t.voided)
        days.push({ day: label, sales: dayTx.reduce((s, t) => s + Number(t.total), 0), orders: dayTx.length })
      }
      setChartData(days)
    } catch {
      console.error('Failed to load dashboard data!')
    }
  }

  useEffect(() => { loadData(); const id = setInterval(loadData, 10000); return () => clearInterval(id) }, [])

  const cards = [
    { icon: <FaMoneyBillWave />, label: "Today's Sales", value: `₱${stats.sales.toLocaleString()}`, color: '#16a34a', bg: '#f0fdf4' },
    { icon: <FaShoppingCart />, label: 'Orders Today', value: stats.orders, color: '#0d9488', bg: '#f0fdfa' },
    { icon: <FaUsers />, label: 'Customers Today', value: stats.customers, color: '#d97706', bg: '#fffbeb' },
    { icon: <FaCoffee />, label: 'Items Sold', value: stats.items, color: '#dc2626', bg: '#fef2f2' },
  ]

  const barColors = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 28, padding: '24px 28px',
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          borderRadius: 18, boxShadow: '0 6px 20px rgba(22,163,74,0.28)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }}>🏨</span>
              <div>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 700, letterSpacing: '2px', opacity: 0.7 }}>VS HOTEL</div>
                <div style={{ color: '#4ade80', fontSize: 15, fontWeight: 800, letterSpacing: '3px' }}>BISTRO</div>
              </div>
            </div>
            <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>{greeting}, {user.username}! 👋</h1>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14, marginTop: 4 }}>Here's your bistro overview for today.</p>
          </div>
          <button onClick={loadData} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', background: 'rgba(255,255,255,0.13)',
            color: 'white', border: '1.5px solid rgba(255,255,255,0.22)',
            borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
          >
            <FaSyncAlt size={13} /> Refresh
          </button>
        </div>

        <div className="stats-grid">
          {cards.map((s, i) => (
            <div className="stat-card" key={i} style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
          <div className="recent-transactions">
            <h2>📈 Sales — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={(v) => [`₱${v.toLocaleString()}`, 'Sales']} contentStyle={{ borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13 }} />
                <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="recent-transactions">
            <h2>📊 Orders — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={{ borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 13 }} />
                <Bar dataKey="orders" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div className="recent-transactions">
            <h2>🧾 Recent Transactions</h2>
            {recent.length === 0 ? (
              <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 8 }}>🧾</div><p style={{ fontWeight: 600 }}>No transactions yet</p></div>
            ) : recent.map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: i < recent.length - 1 ? '1px solid #f0fdf4' : 'none'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: '#0f172a' }}>👤 {t.customer_name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 3 }}>
                    Table {t.table_no} · {t.cashier_name || '—'} · {t.payment_method || 'Cash'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 16 }}>₱{Number(t.total).toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="recent-transactions">
            <h2>🏆 Top Selling Items</h2>
            {topItems.length === 0 ? (
              <div className="empty-state"><div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div><p style={{ fontWeight: 600 }}>No data yet</p></div>
            ) : topItems.map(([name, qty], i) => {
              const pct = Math.round((qty / topItems[0][1]) * 100)
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{i + 1}. {name}</span>
                    <span style={{ fontWeight: 700, color: barColors[i], fontSize: 13 }}>{qty} sold</span>
                  </div>
                  <div style={{ height: 8, background: '#f0fdf4', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: barColors[i], borderRadius: 10, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard