import { useState, useEffect } from react
import Navbar from ../components/Navbar
import { FaPlus, FaTrash, FaSave, FaTimes, FaKey } from react-icons/fa
import { getUsers, addUser, deleteUser, updateUser } from ../api

const roles = [Admin, Cashier, Supervisor, Manager]
const roleColors = { Admin: #6366f1, Cashier: #10b981, Supervisor: #f59e0b, Manager: #3b82f6 }

function Users() {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ username: , password: , email: , role: Cashier })
  const [editPass, setEditPass] = useState({ show: false, userId: null, newPass: , confirmPass:  })
  const [error, setError] = useState()
  const [success, setSuccess] = useState()
  const [loading, setLoading] = useState(false)

  const load = async () => { try { const data = await getUsers(); if (Array.isArray(data)) setUsers(data) } catch {} }
  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    setError()
    if (!form.username || !form.password) return setError(Username and password required!)
    setLoading(true)
    try {
      const data = await addUser(form)
      if (data.error) return setError(data.error)
      setSuccess(User added!); setShowForm(false)
      setForm({ username: , password: , email: , role: Cashier })
      load(); setTimeout(() => setSuccess(), 2000)
    } catch { setError(Cannot connect to server!) }
    setLoading(false)
  }

  const handleDelete = async (id, username) => {
    if (username === admin) return alert(Cannot delete admin!)
    if (!window.confirm(`Delete user "${username}"?`)) return
    try { await deleteUser(id); load() } catch {}
  }

  const handleChangePass = async () => {
    setError()
    if (!editPass.newPass) return setError(Enter new password!)
    if (editPass.newPass.length < 6) return setError(Password must be at least 6 characters!)
    if (editPass.newPass !== editPass.confirmPass) return setError(Passwords do not match!)
    try {
      await updateUser(editPass.userId, { password: editPass.newPass })
      setSuccess(Password updated!); setEditPass({ show: false, userId: null, newPass: , confirmPass:  })
      setTimeout(() => setSuccess(), 2000)
    } catch { setError(Cannot connect to server!) }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
          </div>
          <button className="btn-primary" onClick={() => { setShowForm(!showForm); setError() }}><FaPlus size={13} /> Add User</button>
        </div>

        {success && <div style={{ background: #ecfdf5, border: 1px solid #a7f3d0, color: #059669, padding: 12px 18px, borderRadius: 12, marginBottom: 18, fontSize: 14, fontWeight: 600 }}> {success}</div>}

        {showForm && (
          <div className="form-card" style={{ marginBottom: 22 }}>
            <h3> Add New User</h3>
            {error && <div style={{ background: #fef2f2, color: #ef4444, padding: 10px 14px, borderRadius: 10, fontSize: 14 }}> {error}</div>}
            <div style={{ display: grid, gridTemplateColumns: 1fr 1fr 1fr 1fr, gap: 14 }}>
              <div><label style={lbl}>Username *</label><input placeholder="Enter username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
              <div><label style={lbl}>Password *</label><input type="password" placeholder="Enter password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
              <div><label style={lbl}>Email</label><input type="email" placeholder="Enter email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label style={lbl}>Role</label><select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            </div>
            <div style={{ display: flex, gap: 8, marginTop: 4 }}>
              <button className="btn-primary" onClick={handleAdd} disabled={loading}><FaSave size={13} /> {loading ? Saving... : Save User}</button>
              <button className="btn-secondary" onClick={() => { setShowForm(false); setError() }}><FaTimes size={13} /> Cancel</button>
            </div>
          </div>
        )}

        {editPass.show && (
          <div className="modal-overlay">
            <div className="modal">
              <h2> Change Password</h2>
              {error && <div style={{ background: #fef2f2, color: #ef4444, padding: 10px 14px, borderRadius: 10, fontSize: 14 }}> {error}</div>}
              <div><label style={lbl}>New Password</label><input type="password" placeholder="Min 6 characters" value={editPass.newPass} onChange={e => setEditPass({ ...editPass, newPass: e.target.value })} /></div>
              <div><label style={lbl}>Confirm Password</label><input type="password" placeholder="Repeat new password" value={editPass.confirmPass} onChange={e => setEditPass({ ...editPass, confirmPass: e.target.value })} /></div>
              <div className="form-actions">
                <button className="btn-primary" onClick={handleChangePass}><FaSave size={13} /> Save</button>
                <button className="btn-secondary" onClick={() => { setEditPass({ show: false, userId: null, newPass: , confirmPass:  }); setError() }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="users-table">
          <table>
            <thead>
              <tr><th>#</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: center, padding: 48, color: #94a3b8, fontSize: 15 }}>No users found.</td></tr>
              ) : users.map((u, i) => (
                <tr key={u.id}>
                  <td style={{ color: #94a3b8, fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ fontWeight: 700, fontSize: 15 }}> {u.username}</td>
                  <td style={{ color: #475569, fontSize: 14 }}>{u.email || —}</td>
                  <td><span style={{ background: roleColors[u.role] || #94a3b8, color: white, padding: 4px 14px, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{u.role}</span></td>
                  <td><span style={{ background: u.status === Active ? #ecfdf5 : #fef2f2, color: u.status === Active ? #059669 : #ef4444, padding: 4px 14px, borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{u.status}</span></td>
                  <td>
                    <div style={{ display: flex, gap: 7 }}>
                      <button onClick={() => { setEditPass({ show: true, userId: u.id, newPass: , confirmPass:  }); setError() }} style={{ padding: 7px 14px, background: #eef2ff, color: #6366f1, border: none, borderRadius: 9, cursor: pointer, fontSize: 13, fontWeight: 600, display: flex, alignItems: center, gap: 6 }}>
                        <FaKey size={12} /> Password
                      </button>
                      {u.username !== admin && (
                        <button className="btn-danger" onClick={() => handleDelete(u.id, u.username)} style={{ padding: 7px 14px, display: flex, alignItems: center, gap: 6, fontSize: 13, borderRadius: 9 }}>
                          <FaTrash size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const lbl = { fontSize: 13, fontWeight: 600, color: #475569, display: block, marginBottom: 6 }

export default Users