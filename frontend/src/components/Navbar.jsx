import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/dashboard',   label: 'Dashboard',   roles: ['Admin', 'Supervisor', 'Manager'] },
  { path: '/transaction', label: 'Transaction', roles: ['Admin', 'Cashier'] },
  { path: '/menu',        label: 'Menu',        roles: ['Admin'] },
  { path: '/reports',     label: 'Reports',     roles: ['Admin', 'Supervisor', 'Manager'] },
  { path: '/users',       label: 'Users',       roles: ['Admin'] },
]

const NavIcons = {
  Dashboard:   () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
  Transaction: () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  Menu:        () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  Reports:     () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  Users:       () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
}

const F = "'Plus Jakarta Sans', sans-serif"

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(user.role))

  return (
    <>
      {showLogoutModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(5,46,22,0.60)', backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            background: 'white', borderRadius: 22, padding: '36px 32px',
            width: '100%', maxWidth: 370,
            boxShadow: '0 32px 80px rgba(22,163,74,0.22)',
            border: '1px solid #d1fae5',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
            textAlign: 'center', fontFamily: F,
          }}>
            <div style={{
              width: 62, height: 62, borderRadius: 18,
              background: '#fef2f2', border: '2px solid #fca5a5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 8px rgba(239,68,68,0.07)',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#052e16', marginBottom: 8 }}>Sign out?</h2>
              <p style={{ color: '#166534', fontSize: 15, lineHeight: 1.6, fontWeight: 500 }}>
                You're signed in as <strong style={{ color: '#052e16' }}>{user.username}</strong>.
                <br />This will end your current session.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                style={{
                  flex: 1, padding: '12px', background: '#f0fdf4', color: '#166534',
                  border: '1.5px solid #d1fae5', borderRadius: 12,
                  cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: F,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                style={{
                  flex: 1, padding: '12px', background: '#ef4444',
                  color: 'white', border: 'none', borderRadius: 12,
                  cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: F,
                  boxShadow: '0 4px 14px rgba(239,68,68,0.32)',
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside style={{
        width: 240, minWidth: 240, maxWidth: 240, minHeight: '100vh',
        background: 'linear-gradient(180deg, #052e16 0%, #0f3d22 55%, #14532d 100%)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '3px 0 20px rgba(22,163,74,0.15)',
        flexShrink: 0, position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto',
        fontFamily: F,
      }}>
        <div style={{
          padding: '28px 22px 22px',
          borderBottom: '1px solid rgba(74,222,128,0.10)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14,
            background: 'rgba(74,222,128,0.13)',
            border: '1.5px solid rgba(74,222,128,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14, boxShadow: '0 0 20px rgba(74,222,128,0.13)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/>
              <line x1="10" y1="1" x2="10" y2="4"/>
              <line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.30)', fontSize: 10, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 3 }}>
            VS Hotel
          </div>
          <div style={{ color: '#4ade80', fontSize: 24, fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', lineHeight: 1.1, textShadow: '0 0 24px rgba(74,222,128,0.38)' }}>
            Bistro
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10,
            padding: '4px 12px', background: 'rgba(74,222,128,0.10)',
            border: '1px solid rgba(74,222,128,0.22)', borderRadius: 24,
            fontSize: 11, fontWeight: 700, color: '#86efac', letterSpacing: '0.8px',
          }}>
            <span style={{ width: 7, height: 7, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}/>
            POS System
          </div>
        </div>

        <div style={{ padding: '18px 22px 6px' }}>
          <span style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10, fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Navigation
          </span>
        </div>

        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {visibleItems.map(item => {
            const isActive = location.pathname === item.path
            const Icon = NavIcons[item.label] || (() => null)
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 11,
                  textDecoration: 'none',
                  background: isActive ? 'rgba(74,222,128,0.16)' : 'transparent',
                  color: isActive ? '#4ade80' : 'rgba(255,255,255,0.48)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14.5,
                  transition: 'all 0.13s',
                  borderLeft: isActive ? '3px solid #4ade80' : '3px solid transparent',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(74,222,128,0.14)' : 'none',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.82)'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.48)'
                  }
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.65, flexShrink: 0 }}><Icon /></span>
                {item.label}
                {isActive && (
                  <span style={{
                    marginLeft: 'auto', width: 7, height: 7,
                    background: '#4ade80', borderRadius: '50%', flexShrink: 0,
                    boxShadow: '0 0 8px rgba(74,222,128,0.60)',
                  }}/>
                )}
              </Link>
            )
          })}
        </nav>

        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid rgba(74,222,128,0.10)' }}>
          <button
            onClick={() => setShowLogoutModal(true)}
            style={{
              width: '100%', padding: '11px',
              background: 'rgba(239,68,68,0.10)', color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10,
              cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: F,
              transition: 'background 0.12s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.10)'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav className="mobile-nav">
        {visibleItems.map(item => {
          const isActive = location.pathname === item.path
          const Icon = NavIcons[item.label] || (() => null)
          return (
            <Link key={item.path} to={item.path} className={isActive ? 'active' : ''} style={{ flexShrink: 0, minWidth: 52 }}>
              <span className="icon"><Icon /></span>
              {item.label}
            </Link>
          )
        })}
        <button
          onClick={() => setShowLogoutModal(true)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'none', border: 'none', color: 'rgba(255,255,255,0.32)',
            fontSize: 9.5, fontWeight: 600, cursor: 'pointer',
            flexShrink: 0, minWidth: 52, padding: '6px 4px',
            letterSpacing: '0.4px', fontFamily: F,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign out
        </button>
      </nav>
    </>
  )
}

export default Navbar
