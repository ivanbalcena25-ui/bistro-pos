import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!form.username || !form.password) return setError('Please fill in all fields!')
    setLoading(true)
    setError('')
    try {
      const user = await login(form.username, form.password)
      if (user.error) { setError(user.error); setLoading(false); return }
      localStorage.setItem('user', JSON.stringify(user))

      // Route based on role
      if (['Admin', 'Supervisor', 'Manager'].includes(user.role)) {
        navigate('/dashboard')
      } else if (user.role === 'Kitchen') {
        navigate('/kitchen')
      } else {
        navigate('/transaction')
      }
    } catch {
      setError('Cannot connect to server!')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a1f 0%, #0f5e38 50%, #16a34a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Background elements */}
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,163,74,0.1)', top: -120, left: -120, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 350, height: 350, borderRadius: '50%', background: 'rgba(22,163,74,0.08)', bottom: -80, right: -80, pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(22,163,74,0.1)',
        borderRadius: '16px',
        padding: '40px 36px',
        width: '100%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '14px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, marginBottom: 16,
            boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
            color: 'white', fontWeight: 'bold'
          }}>B</div>
          <h1 style={{ color: '#0f172a', fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '1px' }}>
            BISTRO
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>
            Point of Sale System
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#dc2626',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: 13,
            marginBottom: 20,
            textAlign: 'center',
            fontWeight: 600
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#0f172a', fontSize: 13, fontWeight: 600 }}>Username</label>
            <input type="text" placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={{
                width: '100%', padding: '11px 14px',
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px', fontSize: 14, color: '#0f172a',
                outline: 'none', boxSizing: 'border-box',
                transition: 'all 0.15s'
              }} onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ color: '#0f172a', fontSize: 13, fontWeight: 600 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{
                  width: '100%', padding: '11px 14px',
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '8px', fontSize: 14, color: '#0f172a',
                  outline: 'none', boxSizing: 'border-box',
                  paddingRight: '44px',
                  transition: 'all 0.15s'
                }} onFocus={e => e.target.style.borderColor = '#16a34a'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              <button onClick={() => setShowPass(!showPass)} type="button" style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: '#94a3b8',
                cursor: 'pointer', fontSize: 16, userSelect: 'none',
                padding: '4px'
              }}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} style={{
            width: '100%', padding: '12px',
            background: loading ? '#a7f3d0' : 'linear-gradient(135deg, #16a34a, #15803d)',
            color: loading ? '#0f172a' : 'white',
            border: 'none', borderRadius: '8px',
            fontSize: 14, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s'
          }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, margin: 0 }}>
            Contact Admin if you forgot your password.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
