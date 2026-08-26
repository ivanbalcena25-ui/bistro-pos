import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

const EyeOpen = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeClosed = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const F = "'Plus Jakarta Sans', sans-serif"

function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!form.username || !form.password) return setError('Please fill in all fields.')
    setLoading(true); setError('')
    try {
      const user = await login(form.username, form.password)
      if (user.error) { setError(user.error); setLoading(false); return }
      localStorage.setItem('user', JSON.stringify(user))
      if (user.mustChangePassword) { navigate('/change-password'); setLoading(false); return }
      if (['Admin', 'Supervisor', 'Manager'].includes(user.role)) navigate('/dashboard')
      else if (user.role === 'Kitchen') navigate('/kitchen')
      else navigate('/transaction')
    } catch {
      setError('Cannot connect to server. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #052e16 0%, #0e3a1e 40%, #14532d 75%, #1a6638 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: F, position: 'relative', overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.11) 0%, transparent 70%)', top: -200, left: -200, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.09) 0%, transparent 70%)', bottom: -120, right: -120, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)', top: '35%', right: '8%', pointerEvents: 'none' }} />

      {/* Grid overlay */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(74,222,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Card */}
      <div style={{
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(74,222,128,0.16)',
        borderRadius: 28,
        padding: '52px 44px',
        width: '100%', maxWidth: 420,
        boxShadow: '0 40px 100px rgba(0,0,0,0.50), 0 0 0 1px rgba(74,222,128,0.09)',
        position: 'relative', zIndex: 1,
      }}>

        {/* Brand — fully centered */}
        <div style={{ marginBottom: 38, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, borderRadius: 16,
            background: 'rgba(74,222,128,0.13)',
            border: '1.5px solid rgba(74,222,128,0.28)',
            marginBottom: 20, boxShadow: '0 0 28px rgba(74,222,128,0.14)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
              <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
            </svg>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 5 }}>
            VS Hotel
          </div>
          <h1 style={{ color: '#4ade80', fontSize: 30, fontWeight: 900, margin: '0 0 10px', letterSpacing: '5px', textTransform: 'uppercase', textShadow: '0 0 32px rgba(74,222,128,0.38)' }}>
            Bistro
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.22)', borderRadius: 24 }}>
            <span style={{ width: 7, height: 7, background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}/>
            <span style={{ color: '#86efac', fontSize: 11, fontWeight: 700, letterSpacing: '0.8px' }}>POS System</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.32)', fontSize: 14, marginTop: 16, fontWeight: 400, margin: '16px 0 0' }}>
            Sign in to your account to continue
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.28)',
            color: '#fca5a5', padding: '13px 16px', borderRadius: 12,
            fontSize: 14, marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 9, fontWeight: 500,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={lbl}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={inp}
              onFocus={e => { e.target.style.borderColor = 'rgba(74,222,128,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.13)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.13)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={lbl}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ ...inp, paddingRight: 48 }}
                onFocus={e => { e.target.style.borderColor = 'rgba(74,222,128,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.13)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.13)'; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                {showPass ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? 'rgba(22,163,74,0.45)' : 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)',
              color: 'white', border: 'none', borderRadius: 13,
              fontSize: 16, fontWeight: 800, marginTop: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 24px rgba(22,163,74,0.42)',
              transition: 'all 0.15s', letterSpacing: '0.4px', fontFamily: F,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 10px 32px rgba(22,163,74,0.55)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = '0 6px 24px rgba(22,163,74,0.42)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: 13, margin: 0 }}>
            Forgot password? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}

const inp = {
  width: '100%', padding: '13px 15px',
  background: 'rgba(255,255,255,0.07)',
  border: '1.5px solid rgba(255,255,255,0.13)',
  borderRadius: 12, fontSize: 15, color: 'white',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.14s, box-shadow 0.14s',
  fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 400,
}

const lbl = {
  color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700,
  letterSpacing: '0.3px', fontFamily: "'Plus Jakarta Sans', sans-serif",
  display: 'block', marginBottom: 8,
}

export default Login