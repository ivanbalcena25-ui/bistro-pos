import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import AdminProfileMenu from '../components/AdminProfileMenu'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts'
import { getTransactions } from '../api'
import { SkeletonStatCards, SkeletonChartPanel, SkeletonListPanel } from '../components/Skeleton'

const IconSales    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IconOrders   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
const IconCustomer = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const IconItems    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
const IconRefresh  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>

const BAR_COLORS = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0']
const F = "'Plus Jakarta Sans', sans-serif"

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [stats, setStats] = useState({ sales: 0, orders: 0, customers: 0, items: 0 })
  const [recent, setRecent] = useState([])
  const [topItems, setTopItems] = useState([])
  const [chartData, setChartData] = useState([])
  const [greeting, setGreeting] = useState('')
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)

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
        sales:     todayTx.reduce((s, t) => s + Number(t.total), 0),
        orders:    todayTx.length,
        customers: new Set(todayTx.map(t => t.customer_name)).size,
        items:     todayTx.reduce((s, t) => s + (t.items?.reduce((ss, i) => ss + i.qty, 0) || 0), 0),
      })
      setRecent([...all].reverse().slice(0, 6))
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
    } catch { console.error('Failed to load dashboard data.') }
    setLoading(false)
    setInitialLoad(false)
  }

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, 15000)
    return () => clearInterval(id)
  }, [])

  const statCards = [
    { Icon: IconSales,    label: "Today's Sales",   value: `₱${stats.sales.toLocaleString()}`, accent: '#16a34a', bg: '#f0fdf4' },
    { Icon: IconOrders,   label: 'Orders Today',    value: stats.orders,                        accent: '#0d9488', bg: '#f0fdfa' },
    { Icon: IconCustomer, label: 'Customers Today', value: stats.customers,                     accent: '#d97706', bg: '#fffbeb' },
    { Icon: IconItems,    label: 'Items Sold',       value: stats.items,                         accent: '#7c3aed', bg: '#faf5ff' },
  ]

  const tooltipStyle = {
    borderRadius: 12, border: '1px solid #d1fae5',
    fontSize: 13, fontFamily: F,
    boxShadow: '0 6px 20px rgba(22,163,74,0.14)',
    padding: '10px 14px',
  }
  const axisStyle = { fontSize: 12, fill: '#5a9a72', fontFamily: F }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

         {/*  ADMIN PROFILE — top right  */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
          <AdminProfileMenu />
        </div>

        {/* ── BANNER ── */}
        <div className="page-banner">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="banner-eyebrow">
              <span className="banner-eyebrow-dot"/>
              VS Hotel — Bistro POS
            </div>
            <h1 className="banner-title">
              {greeting}, {user.username} 👋
            </h1>
            <p className="banner-sub">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '11px 20px',
              background: loading ? 'rgba(255,255,255,0.06)' : 'rgba(74,222,128,0.14)',
              color: loading ? 'rgba(255,255,255,0.28)' : '#4ade80',
              border: '1px solid rgba(74,222,128,0.25)', borderRadius: 11,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, fontFamily: F,
              transition: 'all 0.14s', zIndex: 1, position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            <IconRefresh />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* ── STAT CARDS ── */}
        {initialLoad ? <SkeletonStatCards count={4} /> : (
          <div className="stats-grid">
            {statCards.map(({ Icon, label, value, accent, bg }, i) => (
              <div key={i} className="stat-card" style={{ borderTopColor: accent }}>
                <div className="stat-icon" style={{ background: bg, color: accent }}>
                  <Icon />
                </div>
                <div className="stat-info">
                  <h3>{value}</h3>
                  <p>{label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CHARTS ── */}
        {initialLoad ? (
          <div className="dash-grid-2" style={{ marginBottom: 16 }}>
            <SkeletonChartPanel height={200} />
            <SkeletonChartPanel height={200} />
          </div>
        ) : (
          <div className="dash-grid-2" style={{ marginBottom: 16 }}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Sales — Last 7 Days</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis dataKey="day" tick={axisStyle} />
                  <YAxis tick={axisStyle} width={68} />
                  <Tooltip formatter={v => [`₱${v.toLocaleString()}`, 'Sales']} contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2.5}
                    dot={{ fill: '#16a34a', r: 4 }} activeDot={{ r: 7, fill: '#4ade80' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Orders — Last 7 Days</span>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis dataKey="day" tick={axisStyle} />
                  <YAxis tick={axisStyle} width={32} />
                  <Tooltip formatter={v => [v, 'Orders']} contentStyle={tooltipStyle} />
                  <Bar dataKey="orders" fill="#16a34a" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── BOTTOM PANELS ── */}
        {initialLoad ? (
          <div className="dash-grid-2">
            <SkeletonListPanel rows={6} />
            <SkeletonListPanel rows={5} />
          </div>
        ) : (
        <div className="dash-grid-2">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Recent Transactions</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{recent.length} records</span>
            </div>
            {recent.length === 0 ? (
              <div className="empty-state">
                <p>No transactions yet</p>
                <span>Transactions will appear here once recorded.</span>
              </div>
            ) : recent.map((t, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 0',
                borderBottom: i < recent.length - 1 ? '1px solid var(--green-50)' : 'none',
                gap: 10,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.customer_name}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3, fontWeight: 500 }}>
                    Table {t.table_no} · {t.payment_method || 'Cash'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>
                    ₱{Number(t.total).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
                    {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Top Selling Items</span>
            </div>
            {topItems.length === 0 ? (
              <div className="empty-state">
                <p>No data yet</p>
                <span>Sales data will appear here once available.</span>
              </div>
            ) : topItems.map(([name, qty], i) => {
              const pct = Math.round((qty / topItems[0][1]) * 100)
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--text-subtle)', marginRight: 8, fontWeight: 700, fontSize: 12 }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {name}
                    </span>
                    <span style={{ fontWeight: 800, color: BAR_COLORS[i], fontSize: 13, flexShrink: 0 }}>
                      {qty} sold
                    </span>
                  </div>
                  <div style={{ height: 8, background: 'var(--green-50)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--green-100)' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: `linear-gradient(90deg, ${BAR_COLORS[i]}, ${BAR_COLORS[Math.min(i + 1, BAR_COLORS.length - 1)]})`,
                      borderRadius: 10, transition: 'width 0.6s ease',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard