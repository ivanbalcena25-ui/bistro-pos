import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/dashboard',   label: 'Dashboard',  icon: '📊', roles: ['Admin', 'Supervisor', 'Manager'] },
  { path: '/transaction', label: 'Transaction', icon: '💳', roles: ['Admin', 'Cashier'] },
  { path: '/kitchen',     label: 'Kitchen',     icon: '🍳', roles: ['Admin', 'Kitchen'] },
  { path: '/tables',      label: 'Tables',      icon: '🪑', roles: ['Admin', 'Cashier'] },
  { path: '/menu',        label: 'Menu',        icon: '🍽️', roles: ['Admin'] },
  { path: '/reports',     label: 'Reports',     icon: '📈', roles: ['Admin', 'Supervisor', 'Manager'] },
  { path: '/users',       label: 'Users',       icon: '👥', roles: ['Admin'] },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(user.role))

  return (
    <>
      {/* LOGOUT CONFIRM MODAL */}
      {showLogoutModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: 16,
        }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: '32px 28px',
            width: '100%', maxWidth: 360,
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '1px solid #d1fae5',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 52 }}>🚪</div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
                Logout Confirmation
              </h2>
              <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
                Are you sure you want to logout?<br />
                <strong style={{ color: '#0f172a' }}>{user.username}</strong> will be signed out.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '12px',
                  background: '#f0fdf4', color: '#475569',
                  border: '1.5px solid #d1fae5', borderRadius: 12,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#dcfce7'}
                onMouseLeave={e => e.currentTarget.style.background = '#f0fdf4'}
              >
                ✕ Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '12px',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white', border: 'none', borderRadius: 12,
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                🚪 Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={{
          width: 220, minHeight: '100vh',
          background: 'linear-gradient(180deg, #14532d 0%, #166534 100%)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(22,163,74,0.15)',
          flexShrink: 0, position: 'sticky', top: 0,
          height: '100vh', overflowY: 'auto',
        }}>

          {/* ── LOGO ── */}
          <div style={{
            padding: '24px 20px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>🏨</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{
                color: 'rgba(255,255,255,0.65)',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '3px',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>
                VS HOTEL
              </div>
              <div style={{
                color: '#4ade80',
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: '4px',
                lineHeight: 1.1,
                textTransform: 'uppercase',
              }}>
                BISTRO
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {visibleItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 13px', borderRadius: 10, textDecoration: 'none',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                  fontWeight: isActive ? 700 : 500, fontSize: 13.5,
                  transition: 'all 0.15s',
                  borderLeft: isActive ? '3px solid #4ade80' : '3px solid transparent',
                }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ fontSize: 17 }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '0 4px' }}>
              <span style={{ fontSize: 20 }}>
                {user.role === 'Admin' ? '👑' : user.role === 'Cashier' ? '🧑‍💼' : user.role === 'Kitchen' ? '🍳' : '📊'}
              </span>
              <div>
                <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{user.username}</div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{user.role}</div>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                width: '100%', padding: '9px',
                background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            >
              🚪 Logout
            </button>
          </div>
        </aside>
      )}

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav" style={{ overflowX: 'auto', justifyContent: 'flex-start' }}>
        {visibleItems.map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link key={item.path} to={item.path} className={isActive ? 'active' : ''}
              style={{ flexShrink: 0, minWidth: 56 }}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={() => setShowLogoutModal(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
            fontSize: 9, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0, minWidth: 56, padding: '5px 4px',
          }}
        >
          <span style={{ fontSize: 18 }}>🚪</span>
          Logout
        </button>
      </nav>
    </>
  )
}

export default Navbar