import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { FaMoneyBillWave, FaShoppingCart, FaUsers, FaCoffee, FaSyncAlt, FaReceipt, FaChartLine, FaCrown } from 'react-icons/fa'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const loadData = async () => {
    setLoading(true)
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
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const dayTx = all.filter(t => new Date(t.created_at).toDateString() === d.toDateString() && !t.voided)
        days.push({ day: label, sales: dayTx.reduce((s, t) => s + Number(t.total), 0), orders: dayTx.length })
      }
      setChartData(days)
    } catch { console.error('Failed to load dashboard data!') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData(); const id = setInterval(loadData, 30000); return () => clearInterval(id) }, [])

  const cards = [
    { icon: <FaMoneyBillWave />, label: "Today's Sales", value: `₱${stats.sales.toLocaleString()}`, color: '#10b981', bg: '#ecfdf5', trend: '+12%' },
    { icon: <FaShoppingCart />, label: 'Orders', value: stats.orders, color: '#3b82f6', bg: '#eff6ff', trend: '+8%' },
    { icon: <FaUsers />, label: 'Customers', value: stats.customers, color: '#f59e0b', bg: '#fffbeb', trend: '+5%' },
    { icon: <FaCoffee />, label: 'Items Sold', value: stats.items, color: '#ef4444', bg: '#fef2f2', trend: '+15%' },
  ]

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        
        {/* HERO SECTION */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2b1d 0%, #1a4a2a 50%, #0f2b1d 100%)',
          borderRadius: 28,
          padding: isMobile ? '24px 20px' : '32px 40px',
          marginBottom: 28,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, opacity: 0.05 }}>
            <FaChartLine size={200} color="white" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 40 }}>🏨</span>
                <div>
                  <div style={{ color: '#86efac', fontSize: 11, fontWeight: 600, letterSpacing: 3 }}>VS HOTEL</div>
                  <div style={{ color: 'white', fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>BISTRO</div>
                </div>
              </div>
              <h1 style={{ color: 'white', fontSize: isMobile ? 20 : 28, fontWeight: 700, margin: 0 }}>
                {greeting}, {user.username || 'Admin'}! 👋
              </h1>
              <p style={{ color: '#bbf7d0', fontSize: 13, marginTop: 6, opacity: 0.8 }}>
                Welcome back! Here's what's happening with your bistro today.
              </p>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                background: 'rgba(255,255,255,0.12)',
                color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 40, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                backdropFilter: 'blur(10px)',
              }}
            >
              <FaSyncAlt size={12} className={loading ? 'spin' : ''} /> {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}>
          {cards.map((card, i) => (
            <div key={i} style={{
              background: 'white',
              borderRadius: 20,
              padding: isMobile ? '16px' : '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              border: '1px solid #e2e8f0',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{
                  width: 44, height: 44,
                  borderRadius: 14,
                  background: card.bg,
                  color: card.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {card.icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: '#ecfdf5', padding: '2px 8px', borderRadius: 20 }}>
                  {card.trend}
                </span>
              </div>
              <h3 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {card.value}
              </h3>
              <p style={{ color: '#64748b', fontSize: 12, marginTop: 6, fontWeight: 500 }}>
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* CHARTS SECTION */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 20,
          marginBottom: 28,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>📈 Sales Trend (Last 7 Days)</h2>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>vs previous week</span>
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: isMobile ? 9 : 10, fill: '#64748b' }} angle={isMobile ? -15 : 0} textAnchor="end" height={isMobile ? 50 : 30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={isMobile ? 55 : 65} tickFormatter={(v) => `₱${v/1000}k`} />
                <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString()}`, 'Sales']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>📊 Orders Overview (Last 7 Days)</h2>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>daily count</span>
            </div>
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: isMobile ? 9 : 10, fill: '#64748b' }} angle={isMobile ? -15 : 0} textAnchor="end" height={isMobile ? 50 : 30} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={30} />
                <Tooltip formatter={(v) => [v, 'Orders']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="orders" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 0.8fr',
          gap: 20,
        }}>
          {/* Recent Transactions */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaReceipt size={14} color="#10b981" /> Recent Transactions
              </h2>
              <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>Last 5 orders</span>
            </div>
            {recent.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🧾</div>
                <p style={{ fontWeight: 500 }}>No transactions yet today</p>
              </div>
            ) : (
              recent.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0',
                  borderBottom: i < recent.length - 1 ? '1px solid #f1f5f9' : 'none',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                      Table {t.table_no} - {t.customer_name}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#94a3b8' }}>
                      <span>{t.payment_method || 'Cash'}</span>
                      <span>•</span>
                      <span>{new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#10b981' }}>
                    ₱{Number(t.total).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Top Selling Items */}
          <div style={{
            background: 'white',
            borderRadius: 20,
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCrown size={14} color="#f59e0b" /> Top Selling Items
              </h2>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>by quantity</span>
            </div>
            {topItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
                <p style={{ fontWeight: 500 }}>No items sold yet</p>
              </div>
            ) : (
              topItems.map(([name, qty], i) => {
                const maxQty = topItems[0][1]
                const percentage = (qty / maxQty) * 100
                const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
                return (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 12,
                          background: colors[i % colors.length] + '20',
                          color: colors[i % colors.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700,
                        }}>{i + 1}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{name}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{qty} sold</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[i % colors.length]}aa)`,
                        borderRadius: 10,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{
          marginTop: 32,
          padding: '20px 0',
          textAlign: 'center',
          borderTop: '1px solid #e2e8f0',
          color: '#94a3b8',
          fontSize: 11,
        }}>
          <p>VS Hotel Bistro POS System — Secured with Row Level Security</p>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

export default Dashboard