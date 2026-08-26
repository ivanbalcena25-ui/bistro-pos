import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateUser } from '../api'

const F = "'Plus Jakarta Sans', sans-serif"
const roleColors = {
  Admin: '#6366f1', Cashier: '#16a34a', Kitchen: '#d97706',
  Supervisor: '#7c3aed', Manager: '#2563eb',
}

const IconChevron = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const IconCog = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 11.5 4a2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 19.4 11a2 2 0 1 1 0 4z"/></svg>
const IconOut = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconX = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

function AdminProfileMenu() {
  const navigate = useNavigate()
  const stored = JSON.parse(localStorage.getItem('user') || '{}')
  const [user, setUser] = useState(stored)
  const [open, setOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showLogout, setShowLogout] = useState(false)
  const [form, setForm] = useState({ email: stored.email || '', currentPassword: '', password: '', confirm: '' })
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)
  const closeTimer = useRef(null)

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const handleEnter = () => { clearTimeout(closeTimer.current); setOpen(true) }
  const handleLeave = () => { closeTimer.current = setTimeout(() => setOpen(false), 160) }

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login') }

  const handleSave = async () => {
    setMsg({ type: '', text: '' })
    if (form.password) {
      if (form.password.length < 8) return setMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      if (!/[^A-Za-z0-9]/.test(form.password)) return setMsg({ type: 'error', text: 'Password must include at least one symbol (e.g. ! @ # $ %).' })
      if (form.password !== form.confirm) return setMsg({ type: 'error', text: 'Passwords do not match.' })
      if (!form.currentPassword) return setMsg({ type: 'error', text: 'Enter your current password to change it.' })
    }
    setSaving(true)
    try {
      const payload = { email: form.email }
      if (form.password) { payload.password = form.password; payload.currentPassword = form.currentPassword; payload.password_mode = 'manual' }
      const res = await updateUser(user.id, payload)
      if (res?.error) throw new Error(res.error)
      const next = { ...user, email: form.email, ...(form.password ? { mustChangePassword: false } : {}) }
      localStorage.setItem('user', JSON.stringify(next))
      setUser(next)
      setForm(f => ({ ...f, currentPassword: '', password: '', confirm: '' }))
      setMsg({ type: 'ok', text: 'Profile updated successfully.' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Could not update profile.' })
    }
    setSaving(false)
  }

  const item = {
    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
    padding: '11px 14px', background: 'transparent', border: 'none',
    cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: F,
    textAlign: 'left', transition: 'background 0.12s',
  }

  return (
    <>
      <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{ position: 'relative', display: 'inline-block', fontFamily: F }}
      >
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 11,
            background: 'var(--surface)', border: '1.5px solid var(--border)',
            borderRadius: 14, padding: '8px 14px 8px 10px', cursor: 'pointer',
            boxShadow: open ? '0 6px 20px rgba(22,163,74,0.16)' : '0 2px 8px rgba(22,163,74,0.08)',
            transition: 'box-shadow 0.15s, border-color 0.15s',
            borderColor: open ? 'var(--primary)' : 'var(--border)',
            fontFamily: F,
          }}
        >
          <span style={{
            width: 38, height: 38, borderRadius: 11,
            background: roleColors[user.role] || '#16a34a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 900, fontSize: 16, textTransform: 'uppercase',
          }}>
            {(user.username || '?')[0]}
          </span>
          <span style={{ textAlign: 'left', lineHeight: 1.25 }}>
            <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>{user.username}</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{user.role}</span>
          </span>
          <span style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <IconChevron />
          </span>
        </button>

        {open && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 900,
            width: 226, background: 'var(--surface)',
            border: '1px solid var(--border)', borderRadius: 14,
            boxShadow: '0 16px 44px rgba(22,163,74,0.20)', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{user.username}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user.email || 'No email on file'}</div>
            </div>
            <button
              style={{ ...item, color: 'var(--text-2)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setOpen(false); setMsg({ type: '', text: '' }); setShowSettings(true) }}
            >
              <IconCog /> Settings
            </button>
            <button
              style={{ ...item, color: '#ef4444', borderTop: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              onClick={() => { setOpen(false); setShowLogout(true) }}
            >
              <IconOut /> Sign out
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="modal-overlay">
          <div className="modal" style={{ fontFamily: F }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Account settings</h2>
              <button className="btn-ghost" onClick={() => setShowSettings(false)}><IconX /></button>
            </div>
            {msg.text && (
              <div className={msg.type === 'ok' ? 'alert alert-success' : 'alert alert-danger'}>{msg.text}</div>
            )}
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@example.com" />
            </div>
            <div className="divider" />
            <div className="form-group">
              <label>Current password</label>
              <input type="password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} placeholder="Required only when changing password" />
            </div>
            <div className="form-group">
              <label>New password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters, incl. a symbol" />
            </div>
            <div className="form-group">
              <label>Confirm new password</label>
              <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat new password" />
            </div>
            <div className="form-actions">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
              <button className="btn-secondary" onClick={() => setShowSettings(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showLogout && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380, alignItems: 'center', textAlign: 'center', fontFamily: F }}>
            <div style={{
              width: 58, height: 58, borderRadius: 17, background: '#fef2f2',
              border: '2px solid #fca5a5', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#ef4444',
            }}>
              <IconOut />
            </div>
            <h2>Sign out?</h2>
            <p>You're signed in as <strong>{user.username}</strong>. This will end your current session.</p>
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogout(false)}>Cancel</button>
              <button
                style={{
                  flex: 1, padding: '12px', background: '#ef4444', color: 'white',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                  fontSize: 15, fontWeight: 700, fontFamily: F,
                }}
                onClick={handleLogout}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminProfileMenu
