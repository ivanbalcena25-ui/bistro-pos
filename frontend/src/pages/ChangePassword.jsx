import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateUser } from '../api'

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

// Must match the backend rule in server.js: validatePassword()
function passwordIssue(pwd) {
  if (!pwd || pwd.length < 8) return 'Password must be at least 8 characters.'
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must include at least one symbol (e.g. ! @ # $ %).'
  return null
}

function ChangePassword() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!user || !user.token) { navigate('/login', { replace: true }); return null }

  const goHome = () => {
    if (['Admin', 'Supervisor', 'Manager'].includes(user.role)) navigate('/dashboard')
    else if (user.role === 'Kitchen') navigate('/kitchen')
    else navigate('/transaction')
  }

  const handleSubmit = async () => {
    setError('')
    if (!currentPassword) return setError('Enter your current (temporary) password.')
    const issue = passwordIssue(password)
    if (issue) return setError(issue)
    if (password !== confirm) return setError('Passwords do not match.')
    if (password === currentPassword) return setError('New password must be different from your current password.')

    setLoading(true)
    try {
      const res = await updateUser(user.id, { currentPassword, password, password_mode: 'manual' })
      if (res?.error) { setError(res.error); setLoading(false); return }
      const next = { ...user, mustChangePassword: false }
      localStorage.setItem('user', JSON.stringify(next))
      goHome()
    } catch {
      setError('Cannot connect to server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #052e16 0%, #0e3a1e 40%, #14532d 75%, #1a6638 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: F, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.11) 0%, transparent 70%)', top: -200, left: -200, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.09) 0%, transparent 70%)', bottom: -120, right: -120, pointerEvents: 'none' }} />

      <div style={{
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(74,222,128,0.16)',
        borderRadius: 28,
        padding: '48px 44px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 40px 100px rgba(0,0,0,0.50), 0 0 0 1px rgba(74,222,128,0.09)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ marginBottom: 30, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 54, height: 54, borderRadius: 16,
            background: 'rgba(74,222,128,0.13)',
            border: '1.5px solid rgba(74,222,128,0.28)',
            marginBottom: 18, boxShadow: '0 0 28px rgba(74,222,128,0.14)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 style={{ color: '#4ade80', fontSize: 22, fontWeight: 900, margin: '0 0 8px', letterSpacing: '0.5px', textShadow: '0 0 32px rgba(74,222,128,0.38)' }}>
            Set a new password
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            For security, you need to set your own password before continuing, {user.username}.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.28)',
            color: '#fca5a5', padding: '12px 16px', borderRadius: 12,
            fontSize: 13.5, marginBottom: 18, fontWeight: 500,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Current (temporary) password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                placeholder="The password you were given"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={{ ...inp, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowCurrent(s => !s)} style={eyeBtn}>
                {showCurrent ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>

          <div>
            <label style={lbl}>New password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters, incl. a symbol"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ ...inp, paddingRight: 48 }}
              />
              <button type="button" onClick={() => setShowNew(s => !s)} style={eyeBtn}>
                {showNew ? <EyeClosed /> : <EyeOpen />}
              </button>
            </div>
          </div>

          <div>
            <label style={lbl}>Confirm new password</label>
            <input
              type={showNew ? 'text' : 'password'}
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inp}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? 'rgba(22,163,74,0.45)' : 'linear-gradient(135deg, #16a34a 0%, #14532d 100%)',
              color: 'white', border: 'none', borderRadius: 13,
              fontSize: 16, fontWeight: 800, marginTop: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 6px 24px rgba(22,163,74,0.42)',
              fontFamily: F,
            }}
          >
            {loading ? 'Saving...' : 'Save and continue'}
          </button>
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
  fontFamily: F, fontWeight: 400,
}
const lbl = {
  color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700,
  letterSpacing: '0.3px', fontFamily: F, display: 'block', marginBottom: 8,
}
const eyeBtn = {
  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)',
  cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center',
}

export default ChangePassword
