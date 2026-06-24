import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', roles: ['Admin', 'Supervisor', 'Manager'] },
  { path: '/transaction', label: 'Transaction', roles: ['Admin', 'Cashier'] },
  { path: '/kitchen', label: 'Kitchen', roles: ['Admin', 'Kitchen'] },
  { path: '/tables', label: 'Tables', roles: ['Admin', 'Cashier'] },
  { path: '/menu', label: 'Menu', roles: ['Admin'] },
  { path: '/reports', label: 'Reports', roles: ['Admin', 'Supervisor', 'Manager'] },
  { path: '/users', label: 'Users', roles: ['Admin'] },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
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
          position: fixed, top: 0, left: 0, width: 100%, height: 100%,
          background: rgba(15,23,42,0.55), backdropFilter: blur(6px),
          display: flex, justifyContent: center, alignItems: center,
          zIndex: 9999, padding: 16,
        }}>
          <div style={{
            background: white, borderRadius: 20, padding: 32px 28px,
            width: 100%, maxWidth: 360,
            boxShadow: 0 20px 60px rgba(0,0,0,0.2),
            border: 1px solid #d1fae5,
            display: flex, flexDirection: column, alignItems: center, gap: 16,
            textAlign: center,
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Logout Confirmation
            </h2>
            <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to logout?<br />
              <strong style={{ color: '#0f172a' }}>{user.username}</strong> will be signed out.
            </p>
            <div style={{ display: 'flex', gap: 10, width: '100%', marginTop: 4 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: 12, background: '#f0fdf4', color: '#475569',
                  border: '1.5px solid #d1fae5', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: 12, background: '#ef4444', color: 'white', 
                  border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      {!isMobile && (
        <aside style={{
          width: 240, minHeight: '100vh', background: '#ffffff', 
          borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
          flexShrink: 0, position: 'sticky', top: 0,
          height: '100vh', overflowY: 'auto',
        }}>

          {/* LOGO */}
          <div style={{
            padding: '24px 20px 20px', borderBottom: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <div style={{
              color: '#64748b', fontSize: 11, fontWeight: 700,
              letterSpacing: '2px', textTransform: 'uppercase', lineHeight: 1,
            }}>
              VS HOTEL
            </div>
            <div style={{
              color: '#16a34a', fontSize: 22, fontWeight: 900,
              letterSpacing: '3px', lineHeight: 1.1, textTransform: 'uppercase',
            }}>
              BISTRO
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {visibleItems.map(item => {
              const isActive = location.pathname === item.path
              return (
                <Link key={item.path} to={item.path} style={{
                  display: 'flex', alignItems: 'center', padding: '11px 13px', 
                  borderRadius: 10, textDecoration: 'none', transition: 'all 0.15s',
                  background: isActive ? '#f0fdf4' : 'transparent',
                  color: isActive ? '#16a34a' : '#64748b', fontWeight: isActive ? 700 : 500, fontSize: 14,
                  borderLeft: isActive ? '3px solid #16a34a' : '3px solid transparent',
                }}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div style={{ padding: '12px 10px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '0 4px' }}>
              <div>
                <div style={{ color: '#0f172a', fontSize: 13, fontWeight: 700 }}>{user.username}</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>{user.role}</div>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                width: '100%', padding: 9, background: '#fef2f2', color: '#ef4444',
                border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </aside>
      )}
    </>
  )
}

export default Navbar
