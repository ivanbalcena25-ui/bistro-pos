import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import AdminProfileMenu from '../components/AdminProfileMenu'
import { getUsers, addUser, deleteUser, updateUser } from '../api'
import { SkeletonTableRows } from '../components/Skeleton'

const F = "'Plus Jakarta Sans', sans-serif"
const roles = ['Admin', 'Cashier', 'Supervisor', 'Manager', 'Kitchen']
const roleColors = { Admin: '#6366f1', Cashier: '#16a34a', Supervisor: '#f59e0b', Manager: '#3b82f6', Kitchen: '#d97706' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Must match the backend rule in server.js: validatePassword()
const passwordIssue = (pwd) => {
  if (!pwd || pwd.length < 8) return 'Password must be at least 8 characters.'
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must include at least one symbol (e.g. ! @ # $ %).'
  return null
}

const IconPlus  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconTrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/></svg>
const IconSave  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IconKey   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="15" r="4"/><line x1="10.8" y1="12.2" x2="20" y2="3"/><line x1="17" y1="6" x2="20" y2="9"/><line x1="14" y1="9" x2="17" y2="12"/></svg>
const IconX     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconMail  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2.5 6.5 12 13 21.5 6.5"/></svg>
const IconOut   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

/* Custom circle-dot radio */
function RadioOption({ checked, onChange, title, hint }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 11, width: '100%',
        padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
        background: checked ? 'var(--primary-light)' : 'var(--surface)',
        border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 12, fontFamily: F, transition: 'all 0.14s',
      }}
    >
      <span style={{
        width: 18, height: 18, borderRadius: '50%', marginTop: 2, flexShrink: 0,
        border: `2px solid ${checked ? 'var(--primary)' : 'var(--border-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'white', transition: 'border-color 0.14s',
      }}>
        {checked && <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--primary)' }} />}
      </span>
      <span>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: checked ? 'var(--primary)' : 'var(--text)' }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{hint}</span>
      </span>
    </button>
  )
}

const emptyForm = { username: '', email: '', role: 'Cashier', passwordMode: 'auto', password: '' }

function Users() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [resetPass, setResetPass] = useState({ show: false, userId: null, username: '', email: '', mode: 'auto', newPass: '', confirmPass: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [showLogout, setShowLogout] = useState(false)

  const me = JSON.parse(localStorage.getItem('user') || '{}')

  const load = async () => {
    try { const data = await getUsers(); if (Array.isArray(data)) setUsers(data) } catch {}
    setInitialLoad(false)
  }
  useEffect(() => { load() }, [])

  const flash = (text) => { setSuccess(text); setTimeout(() => setSuccess(''), 6000) }

  const handleAdd = async () => {
    setError(''); setNotice('')
    if (!form.username.trim()) return setError('Username is required.')
    if (!EMAIL_RE.test(form.email.trim())) return setError('A valid email address is required — the password is sent there.')
    if (form.passwordMode === 'manual') {
      const issue = passwordIssue(form.password)
      if (issue) return setError(issue)
    }
    setLoading(true)
    try {
      const data = await addUser({
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
        password_mode: form.passwordMode,
        password: form.passwordMode === 'manual' ? form.password : undefined,
      })
      if (data.error) { setError(data.error); setLoading(false); return }
      if (data.email_sent) {
        flash(`User "${data.username}" created. The password was emailed to ${data.email}.`)
      } else {
        flash(`User "${data.username}" created, but the email could not be sent.`)
        setNotice(
          data.temp_password
            ? `Give this password to the user manually: ${data.temp_password}` +
              (data.email_error ? ` (mail error: ${data.email_error})` : '')
            : `Mail error: ${data.email_error || 'unknown'}`
        )
      }
      setShowForm(false)
      setForm(emptyForm)
      load()
    } catch { setError('Cannot connect to server.') }
    setLoading(false)
  }

  const handleDelete = async (id, username) => {
    if (username === 'admin') return alert('Cannot delete the admin account.')
    if (!window.confirm(`Delete user "${username}"? This cannot be undone.`)) return
    try { await deleteUser(id); load() } catch {}
  }

  const handleResetPass = async () => {
    setError(''); setNotice('')
    if (resetPass.mode === 'manual') {
      const issue = passwordIssue(resetPass.newPass)
      if (issue) return setError(issue)
      if (resetPass.newPass !== resetPass.confirmPass) return setError('Passwords do not match.')
    }
    try {
      const data = await updateUser(resetPass.userId, {
        password_mode: resetPass.mode,
        password: resetPass.mode === 'manual' ? resetPass.newPass : undefined,
        notify: true,
      })
      if (data?.error) return setError(data.error)
      if (data?.email_sent) flash(`New password emailed to ${resetPass.email || 'the user'}.`)
      else {
        flash('Password updated, but the email could not be sent.')
        if (data?.temp_password) setNotice(`Give this password to the user manually: ${data.temp_password}`)
      }
      setResetPass({ show: false, userId: null, username: '', email: '', mode: 'auto', newPass: '', confirmPass: '' })
    } catch { setError('Cannot connect to server.') }
  }

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/login') }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">

        {/* Admin profile — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <AdminProfileMenu />
        </div>

        <div className="page-header">
          <div>
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">{users.length} {users.length === 1 ? 'user' : 'users'} in the system — passwords are delivered by email</p>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError(''); setNotice('') }}>
            <IconPlus /> Add User
          </button>
        </div>

        {success && (
          <div className="alert alert-success" style={{ marginBottom: 12 }}>
            <IconCheck /> {success}
          </div>
        )}
        {notice && (
          <div className="alert alert-warning" style={{ marginBottom: 20, wordBreak: 'break-all' }}>
            {notice}
          </div>
        )}

        {showForm && (
          <div className="form-card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: F }}>Add New User</h3>
              <button className="btn-ghost btn-sm" onClick={() => { setShowForm(false); setError('') }}><IconX /></button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label>Username *</label>
                <input placeholder="Enter username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Email * — password is sent here</label>
                <input type="email" placeholder="name@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="divider" />

            <div className="form-group">
              <label>Password</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
                <RadioOption
                  checked={form.passwordMode === 'auto'}
                  onChange={() => setForm({ ...form, passwordMode: 'auto', password: '' })}
                  title="Auto-generate password"
                  hint="A strong password is created and emailed to the user."
                />
                <RadioOption
                  checked={form.passwordMode === 'manual'}
                  onChange={() => setForm({ ...form, passwordMode: 'manual' })}
                  title="Set my own password"
                  hint="You choose it; it is still emailed to the user."
                />
              </div>
            </div>

            {form.passwordMode === 'manual' && (
              <div className="form-group" style={{ maxWidth: 340 }}>
                <label>Custom password *</label>
                <input type="password" placeholder="At least 8 characters, incl. a symbol" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, fontFamily: F }}>
              <IconMail /> Credentials are delivered over Google SMTP to the address above.
            </div>

            <div className="form-actions">
              <button className="btn-primary" onClick={handleAdd} disabled={loading}>
                <IconSave /> {loading ? 'Creating and sending...' : 'Create user and send email'}
              </button>
              <button className="btn-secondary" onClick={() => { setShowForm(false); setError('') }}>
                <IconX /> Cancel
              </button>
            </div>
          </div>
        )}

        {resetPass.show && (
          <div className="modal-overlay">
            <div className="modal">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontFamily: F }}>Reset password</h2>
                <button className="btn-ghost" onClick={() => { setResetPass({ ...resetPass, show: false }); setError('') }}><IconX /></button>
              </div>
              <p>New password for <strong>{resetPass.username}</strong> — it will be emailed to {resetPass.email || 'their address on file'}.</p>
              {error && <div className="alert alert-danger">{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <RadioOption
                  checked={resetPass.mode === 'auto'}
                  onChange={() => setResetPass({ ...resetPass, mode: 'auto', newPass: '', confirmPass: '' })}
                  title="Auto-generate password"
                  hint="Created for you and emailed to the user."
                />
                <RadioOption
                  checked={resetPass.mode === 'manual'}
                  onChange={() => setResetPass({ ...resetPass, mode: 'manual' })}
                  title="Set my own password"
                  hint="You choose it; still emailed to the user."
                />
              </div>
              {resetPass.mode === 'manual' && (
                <>
                  <div className="form-group">
                    <label>New password</label>
                    <input type="password" placeholder="At least 8 characters, incl. a symbol" value={resetPass.newPass} onChange={e => setResetPass({ ...resetPass, newPass: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Confirm new password</label>
                    <input type="password" placeholder="Repeat new password" value={resetPass.confirmPass} onChange={e => setResetPass({ ...resetPass, confirmPass: e.target.value })} />
                  </div>
                </>
              )}
              <div className="form-actions">
                <button className="btn-primary" onClick={handleResetPass}><IconSave /> Save and email</button>
                <button className="btn-secondary" onClick={() => { setResetPass({ ...resetPass, show: false }); setError('') }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>#</th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialLoad ? (
                <SkeletonTableRows rows={6} columns={6} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 56, color: 'var(--text-subtle)', fontSize: 16, fontFamily: F }}>
                    No users found. Add one to get started.
                  </td>
                </tr>
              ) : users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text-subtle)', fontWeight: 700, fontSize: 14 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm" style={{ background: roleColors[u.role] || '#16a34a' }}>
                        {(u.username || '?')[0]}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{u.username}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 14 }}>{u.email || '—'}</td>
                  <td><span className="role-badge" style={{ background: roleColors[u.role] || '#16a34a' }}>{u.role}</span></td>
                  <td><span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>{u.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-secondary btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => {
                          setError('')
                          setResetPass({ show: true, userId: u.id, username: u.username, email: u.email || '', mode: 'auto', newPass: '', confirmPass: '' })
                        }}
                      >
                        <IconKey /> Password
                      </button>
                      {u.username !== 'admin' && (
                        <button className="btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => handleDelete(u.id, u.username)}>
                          <IconTrash /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SIGN OUT — bottom of Users page */}
        <div className="panel" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', fontFamily: F }}>Signed in as {me.username}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500, fontFamily: F }}>End your session on this device.</div>
          </div>
          <button
            onClick={() => setShowLogout(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '11px 22px', background: '#fef2f2', color: '#ef4444',
              border: '1.5px solid #fca5a5', borderRadius: 12, cursor: 'pointer',
              fontSize: 15, fontWeight: 700, fontFamily: F,
            }}
          >
            <IconOut /> Sign out
          </button>
        </div>

        {showLogout && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 380, alignItems: 'center', textAlign: 'center' }}>
              <h2 style={{ fontFamily: F }}>Sign out?</h2>
              <p>You're signed in as <strong>{me.username}</strong>. This will end your current session.</p>
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowLogout(false)}>Cancel</button>
                <button
                  style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 15, fontWeight: 700, fontFamily: F }}
                  onClick={handleLogout}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Users
