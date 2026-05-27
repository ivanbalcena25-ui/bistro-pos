import { Link, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/dashboard',   label: 'Dashboard',  icon: '📊', roles: ['Admin'] },
  { path: '/transaction', label: 'Transaction', icon: '💳', roles: ['Admin', 'Cashier'] },
  { path: '/kitchen',     label: 'Kitchen',     icon: '🍳', roles: ['Admin', 'Kitchen'] },
  { path: '/tables',      label: 'Tables',      icon: '🪑', roles: ['Admin', 'Cashier'] },
  { path: '/menu',        label: 'Menu',        icon: '🍽️', roles: ['Admin'] },
  { path: '/reports',     label: 'Reports',     icon: '📈', roles: ['Admin'] },
  { path: '/users',       label: 'Users',       icon: '👥', roles: ['Admin'] },
]

function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const visibleItems = navItems.filter(item => item.roles.includes(user.role))

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside style={{
        width: 200, minHeight: '100vh',
        background: 'linear-gradient(180deg, #14532d 0%, #166534 100%)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 20px rgba(22,163,74,0.15)',
        flexShrink: 0, position: 'sticky', top: 0,
        height: '100vh', overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 9
        }}>
          <span style={{ fontSize: 26, lineHeight: 1 }}>🏨</span>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: 800, letterSpacing: '2.5px' }}>VS HOTEL</div>
            <div style={{ color: '#4ade80', fontSize: 14, fontWeight: 900, letterSpacing: '3px', lineHeight: 1.2 }}>BISTRO</div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          {visibleItems.map(item => {
            const isActive = location.pathname === item.path
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '10px 12px', borderRadius: 10, textDecoration: 'none',
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? 'white' : 'rgba(255,255,255,0.65)',
                fontWeight: isActive ? 700 : 500, fontSize: 13.5,
                transition: 'all 0.15s',
                borderLeft: isActive ? '3px solid #4ade80' : '3px solid transparent',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User + Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '0 4px' }}>
            <span style={{ fontSize: 18 }}>
              {user.role === 'Admin' ? '👑' : user.role === 'Cashier' ? '🧑‍💼' : '🍳'}
            </span>
            <div>
              <div style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{user.username}</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>{user.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', padding: '8px',
            background: 'rgba(239,68,68,0.15)', color: '#fca5a5',
            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 600
          }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-nav">
        {visibleItems.slice(0, 5).map(item => {
          const isActive = location.pathname === item.path
          return (
            <Link key={item.path} to={item.path} className={isActive ? 'active' : ''}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
        <button onClick={handleLogout} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
          fontSize: 10, fontWeight: 600, cursor: 'pointer', flex: 1, padding: '6px 4px'
        }}>
          <span style={{ fontSize: 20 }}>🚪</span>
          Logout
        </button>
      </nav>
    </>
  )
}

export default Navbar