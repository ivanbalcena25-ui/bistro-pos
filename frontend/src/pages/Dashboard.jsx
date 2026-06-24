import { useState, useEffect } from react
import Navbar from ../components/Navbar
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from recharts
import { getTransactions } from ../api

function Dashboard() {
  const user = JSON.parse(localStorage.getItem(user) || {})
  const [stats, setStats] = useState({ sales: 0, orders: 0, customers: 0, items: 0 })
  const [recent, setRecent] = useState([])
  const [topItems, setTopItems] = useState([])
  const [chartData, setChartData] = useState([])
  const [greeting, setGreeting] = useState()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener(resize, handleResize)
    return () => window.removeEventListener(resize, handleResize)
  }, [])

  const loadData = async () => {
    setLoading(true)
    const h = new Date().getHours()
    setGreeting(h < 12 ? Good morning : h < 18 ? Good afternoon : Good evening)
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
        const label = d.toLocaleDateString(en-US, { month: short, day: numeric })
        const dayTx = all.filter(t => new Date(t.created_at).toDateString() === d.toDateString() && !t.voided)
        days.push({ day: label, sales: dayTx.reduce((s, t) => s + Number(t.total), 0), orders: dayTx.length })
      }
      setChartData(days)
    } catch { console.error(Failed to load dashboard data!) }
    setLoading(false)
  }

  useEffect(() => { loadData(); const id = setInterval(loadData, 30000); return () => clearInterval(id) }, [])

  const cards = [
    { label: Sales Today, value: `₱${stats.sales.toLocaleString()}`, color: #16a34a },
    { label: Orders Today, value: stats.orders, color: #0d9488 },
    { label: Customers Today, value: stats.customers, color: #d97706 },
    { label: Items Sold, value: stats.items, color: #dc2626 },
  ]
  const barColors = [#16a34a, #22c55e, #4ade80, #86efac, #bbf7d0]

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        {/* HEADER */}
        <div style={{
          display: flex,
          flexDirection: row,
          justifyContent: space-between,
          alignItems: center,
          gap: 20,
          marginBottom: 24,
          flexWrap: wrap,
        }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: #0f172a, margin: 0 0 8px 0 }}>
              {greeting}, {user.username}
            </h1>
            <p style={{ color: #64748b, fontSize: 14, margin: 0 }}>
              Here is your bistro overview for today.
            </p>
          </div>
          <button
            onClick={loadData}
            className="btn-primary"
            style={{ display: flex, alignItems: center, gap: 8, whiteSpace: nowrap }}
            disabled={loading}
          >
            {loading ? Loading... : Refresh}
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-4" style={{ marginBottom: 24 }}>
          {cards.map((s, i) => (
            <div key={i} className="stat-card" style={{ borderTopColor: s.color }}>
              <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
                {i === 0 ? ₱ : i === 1 ?  : i === 2 ?  : }
              </div>
              <div className="stat-content">
                <h3 style={{ fontSize: 22, margin: 0 }}>{s.value}</h3>
                <p style={{ marginTop: 4 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CHARTS */}
        {loading ? (
          <div style={{ display: grid, gridTemplateColumns: isMobile ? 1fr : 1fr 1fr, gap: 16, marginBottom: 16 }}>
            <div className="card" style={{ height: 250 }}></div>
            <div className="card" style={{ height: 250 }}></div>
          </div>
        ) : (
          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            <div className="card">
              <h2 style={{ marginBottom: 16 }}>Sales — Last 7 Days</h2>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: #64748b }} />
                  <YAxis tick={{ fontSize: 12, fill: #64748b }} />
                  <Tooltip formatter={(v) => [`₱${v.toLocaleString()}`, Sales]} contentStyle={{ borderRadius: 8, border: 1px solid #e2e8f0, fontSize: 12 }} />
                  <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: #16a34a, r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h2 style={{ marginBottom: 16 }}>Orders — Last 7 Days</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: #64748b }} />
                  <YAxis tick={{ fontSize: 12, fill: #64748b }} />
                  <Tooltip formatter={(v) => [v, Orders]} contentStyle={{ borderRadius: 8, border: 1px solid #e2e8f0, fontSize: 12 }} />
                  <Bar dataKey="orders" fill="#16a34a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* BOTTOM PANELS */}
        <div className="grid grid-2">
          {/* Recent Transactions */}
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Recent Transactions</h2>
            {recent.length === 0 ? (
              <div style={{ textAlign: center, color: #94a3b8, padding: 32 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>No transactions yet</p>
              </div>
            ) : (
              <div style={{ display: flex, flexDirection: column, gap: 0 }}>
                {recent.map((t, i) => (
                  <div key={i} style={{
                    display: flex, justifyContent: space-between, alignItems: center,
                    padding: 12px 0, borderBottom: i < recent.length - 1 ? 1px solid #f1f5f9 : none,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: #0f172a, overflow: hidden, textOverflow: ellipsis, whiteSpace: nowrap }}>
                        {t.customer_name}
                      </div>
                      <div style={{ fontSize: 12, color: #64748b, marginTop: 2 }}>
                        Table {t.table_no} • {t.payment_method || Cash}
                      </div>
                    </div>
                    <div style={{ textAlign: right, flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, color: #16a34a, fontSize: 14 }}>
                        ₱{Number(t.total).toLocaleString()}
                      </div>
                      <div style={{ fontSize: 12, color: #94a3b8, marginTop: 2 }}>
                        {new Date(t.created_at).toLocaleTimeString([], { hour: 2-digit, minute: 2-digit })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Selling Items */}
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Top Selling Items</h2>
            {topItems.length === 0 ? (
              <div style={{ textAlign: center, color: #94a3b8, padding: 32 }}>
                <p style={{ fontWeight: 600, fontSize: 14 }}>No data yet</p>
              </div>
            ) : (
              <div style={{ display: flex, flexDirection: column, gap: 16 }}>
                {topItems.map(([name, qty], i) => {
                  const pct = Math.round((qty / topItems[0][1]) * 100)
                  return (
                    <div key={i}>
                      <div style={{ display: flex, justifyContent: space-between, marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: #0f172a, overflow: hidden, textOverflow: ellipsis, whiteSpace: nowrap, maxWidth: 75% }}>
                          {i + 1}. {name}
                        </span>
                        <span style={{ fontWeight: 700, color: barColors[i], fontSize: 12, flexShrink: 0 }}>
                          {qty} sold
                        </span>
                      </div>
                      <div style={{ height: 6, background: #f1f5f9, borderRadius: 8, overflow: hidden }}>
                        <div style={{ height: 100%, width: `${pct}%`, background: barColors[i], borderRadius: 8, transition: width 0.3s }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard
