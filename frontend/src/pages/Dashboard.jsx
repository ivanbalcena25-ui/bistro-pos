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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    } catch { console.error('Failed to load dashboard data!') }
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

        {/* HEADER */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          marginBottom: 20,
          padding: isMobile ? '16px' : '22px 24px',
          background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
          borderRadius: 16,
          boxShadow: '0 6px 20px rgba(22,163,74,0.28)',
          gap: 12,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: isMobile ? 22 : 26 }}>🏨</span>
              <div>
                <div style={{ color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '2px', opacity: 0.7 }}>VS HOTEL</div>
                <div style={{ color: '#4ade80', fontSize: 12, fontWeight: 800, letterSpacing: '3px' }}>BISTRO</div>
              </div>
            </div>
            <h1 style={{ color: 'white', fontSize: isMobile ? 18 : 22, fontWeight: 800, margin: 0 }}>
              {greeting}, {user.username}! 👋
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: isMobile ? 12 : 13, marginTop: 4 }}>
              Here's your bistro overview for today.
            </p>
          </div>
          <button
            onClick={loadData}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '9px 16px',
              width: isMobile ? '100%' : 'auto',
              background: 'rgba(255,255,255,0.13)',
              color: 'white', border: '1.5px solid rgba(255,255,255,0.22)',
              borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.13)'}
          >
            <FaSyncAlt size={12} /> Refresh
          </button>
        </div>

        {/* STAT CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? 10 : 16,
          marginBottom: 20,
        }}>
          {cards.map((s, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 14,
              padding: isMobile ? '14px 12px' : '20px 22px',
              display: 'flex', alignItems: 'center',
              gap: isMobile ? 10 : 16,
              boxShadow: '0 1px 4px rgba(22,163,74,0.08)',
              border: '1px solid #d1fae5',
              borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{
                width: isMobile ? 40 : 52, height: isMobile ? 40 : 52,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: isMobile ? 10 : 14, flexShrink: 0,
                fontSize: isMobile ? 17 : 22,
                background: s.bg, color: s.color,
              }}>{s.icon}</div>
              <div>
                <h3 style={{ fontSize: isMobile ? 18 : 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value}</h3>
                <p style={{ color: '#475569', fontSize: isMobile ? 11 : 13, marginTop: 4, fontWeight: 500 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16, marginBottom: 16,
        }}>
          <div style={{ background: 'white', padding: isMobile ? '14px 12px' : '20px 22px', borderRadius: 14, border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(22,163,74,0.08)' }}>
            <h2 style={{ marginBottom: 14, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>📈 Sales — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="day" tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }} width={isMobile ? 50 : 65} />
                <Tooltip formatter={(v) => [`₱${v.toLocaleString()}`, 'Sales']} contentStyle={{ borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 12 }} />
                <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: 'white', padding: isMobile ? '14px 12px' : '20px 22px', borderRadius: 14, border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(22,163,74,0.08)' }}>
            <h2 style={{ marginBottom: 14, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>📊 Orders — Last 7 Days</h2>
            <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
                <XAxis dataKey="day" tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748b' }} width={30} />
                <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={{ borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 12 }} />
                <Bar dataKey="orders" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM PANELS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16,
        }}>
          {/* Recent Transactions */}
          <div style={{ background: 'white', padding: isMobile ? '14px 12px' : '20px 22px', borderRadius: 14, border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(22,163,74,0.08)' }}>
            <h2 style={{ marginBottom: 14, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🧾 Recent Transactions</h2>
            {recent.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>No transactions yet</p>
              </div>
            ) : recent.map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: i < recent.length - 1 ? '1px solid #f0fdf4' : 'none', gap: 8,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    👤 {t.customer_name}
                  </div>
                  <div style={{ fontSize: isMobile ? 11 : 12, color: '#64748b', marginTop: 2 }}>
                    Table {t.table_no} · {t.payment_method || 'Cash'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, color: '#16a34a', fontSize: isMobile ? 13 : 15 }}>
                    ₱{Number(t.total).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Selling Items */}
          <div style={{ background: 'white', padding: isMobile ? '14px 12px' : '20px 22px', borderRadius: 14, border: '1px solid #d1fae5', boxShadow: '0 1px 4px rgba(22,163,74,0.08)' }}>
            <h2 style={{ marginBottom: 14, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>🏆 Top Selling Items</h2>
            {topItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🍽️</div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>No data yet</p>
              </div>
            ) : topItems.map(([name, qty], i) => {
              const pct = Math.round((qty / topItems[0][1]) * 100)
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, fontSize: isMobile ? 12 : 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {i + 1}. {name}
                    </span>
                    <span style={{ fontWeight: 700, color: barColors[i], fontSize: 12, flexShrink: 0 }}>
                      {qty} sold
                    </span>
                  </div>
                  <div style={{ height: 7, background: '#f0fdf4', borderRadius: 10, overflow: 'hidden' }}>
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