import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [showLogout, setShowLogout] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const menuItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Menu', path: '/menu' },
    { label: 'Orders', path: '/transaction' },
    { label: 'Tables', path: '/tables' },
    { label: 'Reports', path: '/reports' },
    { label: 'Users', path: '/users' },
  ]

  return (
    <aside style={{
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', marginBottom: '8px' }}>
          VS HOTEL
        </div>
        <div style={{ color: '#16a34a', fontSize: '22px', fontWeight: '900', letterSpacing: '2px' }}>
          BISTRO
        </div>
      </div>

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '11px 13px',
              borderRadius: '10px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '500',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.target.style.background = '#f8fafc' }}
            onMouseLeave={(e) => { e.target.style.background = 'transparent' }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* User Section */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ padding: '0 4px', marginBottom: '10px' }}>
          <div style={{ color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>
            {user.username || 'User'}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px' }}>
            {user.role || 'Guest'}
          </div>
        </div>
        <button
          onClick={() => setShowLogout(true)}
          style={{
            width: '100%',
            padding: '9px',
            background: '#fef2f2',
            color: '#ef4444',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          Logout
        </button>
      </div>

      {/* Logout Modal */}
      {showLogout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15,23,42,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            maxWidth: '400px'
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 12px 0' }}>
              Confirm Logout
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 20px 0' }}>
              Are you sure you want to logout?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowLogout(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#475569'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default Navbar
