import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const h = new Date().getHours()
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  return (
    <div className="page-container" style={{ display: 'flex', background: '#f8fafc', minHeight: '100vh' }}>
      <Navbar />
      <div className="page-content" style={{ flex: 1, padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
            {greeting}, {user.username}
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            Welcome to your bistro dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
          {[
            { title: 'Sales Today', value: '₱12,450.00', color: '#16a34a' },
            { title: 'Orders Today', value: '24', color: '#0d9488' },
            { title: 'Customers', value: '18', color: '#d97706' },
            { title: 'Items Sold', value: '156', color: '#dc2626' }
          ].map((stat, i) => (
            <div key={i} style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, margin: '0 0 8px 0' }}>
                    {stat.title}
                  </p>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>
                    {stat.value}
                  </div>
                </div>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: stat.color + '15',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: stat.color
                }}>
                  •
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {/* Recent Activity */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              Recent Orders
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Order #1001', 'Order #1002', 'Order #1003', 'Order #1004', 'Order #1005'].map((order, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{order}</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Completed</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 16px 0' }}>
              Top Selling Items
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {['Caramel Macchiato', 'Iced Latte', 'Americano', 'Cappuccino', 'Espresso'].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  fontSize: 13
                }}>
                  <span style={{ color: '#0f172a', fontWeight: 500 }}>{item}</span>
                  <span style={{ color: '#16a34a', fontWeight: 700 }}>{45 - i * 5} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
