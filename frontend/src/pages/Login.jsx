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

      // FIX: Supervisor at Manager ay dapat mapunta sa /dashboard din
      if (['Admin', 'Supervisor', 'Manager'].includes(user.role)) {
        navigate('/dashboard')
      } else if (user.role === 'Kitchen') {
        navigate('/kitchen')
      } else {
        // Cashier at iba pa
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
      background: 'linear-gradient(135deg, #052e16 0%, #14532d 50%, #166534 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Background circles */}
      <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'rgba(22,163,74,0.15)', top: -120, left: -120, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 350, height: 350, borderRadius: '50%', background: 'rgba(22,163,74,0.10)', bottom: -80, right: -80, pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 28,
        padding: '48px 44px', width: '100%', maxWidth: 420,
        boxShadow: '0 32px 64px rgba(0,0,0,0.4)', position: 'relative', zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 68, height: 68, borderRadius: 18,
            background: 'linear-gradient(135deg, #16a34a, #4ade80)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, marginBottom: 14,
            boxShadow: '0 8px 24px rgba(22,163,74,0.4)'
          }}>🍽️</div>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: '6px' }}>BISTRO</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5, marginTop: 6 }}>
            Sign in to your account
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Username</label>
            <input type="text" placeholder="Enter your username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={inputStyle} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ ...inputStyle, paddingRight: 44 }} />
              <span onClick={() => setShowPass(!showPass)} style={{
                position: 'absolute', right: 14, top: '50%',
                transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer', fontSize: 14, userSelect: 'none'
              }}>
                {showPass ? '🙈' : '👁️'}
              </span>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} style={{
            ...btnStyle, marginTop: 4, opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 12, margin: 0 }}>
            Contact Admin if you forgot your password.
          </p>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '12px 16px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12, fontSize: 14, color: 'white',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle = { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 500 }
const btnStyle = {
  width: '100%', padding: '13px',
  background: 'linear-gradient(135deg, #16a34a, #15803d)',
  color: 'white', border: 'none', borderRadius: 12,
  fontSize: 14, fontWeight: 700,
  boxShadow: '0 6px 18px rgba(22,163,74,0.4)'
}

export default Login