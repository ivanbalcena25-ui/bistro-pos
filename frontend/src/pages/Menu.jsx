import { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { FaPlus, FaTrash, FaEdit, FaImage, FaSave, FaTimes } from 'react-icons/fa'
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../api'

const categories = ['Coffee', 'Non-Coffee', 'Beer', 'Pulutan']
const catIcons = { Coffee: '☕', 'Non-Coffee': '🧃', Beer: '🍺', Pulutan: '🍗' }

const isOutOfStock = (item) => item.outOfStock || (item.stock ?? 0) === 0
const isLowStock = (item) => !isOutOfStock(item) && (item.stock ?? 0) <= 10

function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState('All')
  const [stockFilter, setStockFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ name: '', price: '', category: 'Coffee', image: null, stock: '' })
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingStock, setEditingStock] = useState(null)
  const [stockInput, setStockInput] = useState('')
  const fileRef = useRef()

  useEffect(() => { loadMenu() }, [])

  const loadMenu = async () => {
    setLoading(true)
    try {
      const data = await getMenu()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setError('Cannot connect to server!')
    }
    setLoading(false)
  }

  const filtered = items
    .filter(i => activeCat === 'All' || i.category === activeCat)
    .filter(i => {
      if (stockFilter === 'available') return !isOutOfStock(i) && !isLowStock(i)
      if (stockFilter === 'lowstock') return isLowStock(i)
      if (stockFilter === 'outofstock') return isOutOfStock(i)
      return true
    })

  const handleImage = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => { setPreview(reader.result); setForm(p => ({ ...p, image: reader.result })) }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Please enter item name!')
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) return setError('Please enter a valid price!')
    setError('')
    try {
      if (editItem) {
        await updateMenuItem(editItem.id, {
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image: form.image,
          stock: Number(form.stock) || 0
        })
        setSuccess('Item updated!')
      } else {
        await addMenuItem({
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image: form.image,
          stock: Number(form.stock) || 0
        })
        setSuccess('Item added!')
      }
      await loadMenu()
      cancelForm()
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setError('Failed to save item!')
    }
  }

  const handleEdit = (item) => {
    setEditItem(item)
    setForm({ name: item.name, price: String(item.price), category: item.category, image: item.image, stock: String(item.stock ?? 0) })
    setPreview(item.image); setShowForm(true); setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return
    await deleteMenuItem(id)
    await loadMenu()
  }

  const toggleStock = async (item) => {
    await updateMenuItem(item.id, {
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      stock: isOutOfStock(item) ? 1 : 0
    })
    await loadMenu()
  }

  const saveStock = async (id) => {
    const val = parseInt(stockInput)
    if (isNaN(val) || val < 0) return alert('Invalid stock value!')
    const item = items.find(i => i.id === id)
    await updateMenuItem(id, { ...item, stock: val })
    setEditingStock(null); setStockInput('')
    await loadMenu()
  }

  const cancelForm = () => {
    setShowForm(false); setEditItem(null)
    setForm({ name: '', price: '', category: 'Coffee', image: null, stock: '' })
    setPreview(null); setError('')
  }

  const outOfStockCount = items.filter(i => isOutOfStock(i)).length
  const lowStockCount = items.filter(i => isLowStock(i)).length
  const availableCount = items.filter(i => !isOutOfStock(i)).length

  const getStockColor = (item) => {
    if (isOutOfStock(item)) return { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' }
    if (isLowStock(item)) return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
    return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Menu Management</h1>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ {availableCount} available</span>
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>⚠️ {lowStockCount} low stock</span>
              <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>❌ {outOfStockCount} out of stock</span>
            </div>
          </div>
          <button className="btn-primary" onClick={() => { cancelForm(); setShowForm(true) }}><FaPlus size={13} /> Add Item</button>
        </div>

        {success && <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '12px 18px', borderRadius: 12, marginBottom: 18, fontSize: 14, fontWeight: 600 }}>✅ {success}</div>}
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '12px 18px', borderRadius: 12, marginBottom: 18, fontSize: 14 }}>⚠️ {error}</div>}

        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, border: '2px solid #16a34a', boxShadow: '0 4px 18px rgba(22,163,74,0.12)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 18 }}>{editItem ? `✏️ Editing: ${editItem.name}` : '➕ Add New Item'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={lbl}>Item Name *</label><input type="text" placeholder="e.g. Caramel Macchiato" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label style={lbl}>Price (₱) *</label><input type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} /></div>
              <div><label style={lbl}>Category</label><select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>{categories.map(c => <option key={c} value={c}>{catIcons[c]} {c}</option>)}</select></div>
              <div><label style={lbl}>Stock Qty</label><input type="number" placeholder="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ ...lbl, marginBottom: 8 }}>Product photo (optional)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} style={{ display: 'none' }} />
                <button onClick={() => fileRef.current.click()} style={{ padding: '9px 16px', border: '1.5px dashed #16a34a', borderRadius: 10, background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
                  <FaImage size={14} /> {preview ? 'Change photo' : 'Upload photo'}
                </button>
                {preview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={preview} alt="preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                    <button onClick={() => { setPreview(null); setForm(p => ({ ...p, image: null })) }} style={{ background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Remove</button>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={handleSave}><FaSave size={13} /> {editItem ? 'Save Changes' : 'Add Item'}</button>
              <button className="btn-secondary" onClick={cancelForm}><FaTimes size={13} /> Cancel</button>
            </div>
          </div>
        )}

        <div className="category-tabs">
          <button className={activeCat === 'All' ? 'tab active' : 'tab'} onClick={() => setActiveCat('All')}>🍽️ All ({items.length})</button>
          {categories.map(c => <button key={c} className={activeCat === c ? 'tab active' : 'tab'} onClick={() => setActiveCat(c)}>{catIcons[c]} {c} ({items.filter(i => i.category === c).length})</button>)}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Filter:</span>
          {[
            { val: 'all', label: 'All', activeColor: '#16a34a' },
            { val: 'available', label: `✅ Available (${availableCount})`, activeColor: '#16a34a' },
            { val: 'lowstock', label: `⚠️ Low Stock (${lowStockCount})`, activeColor: '#f59e0b' },
            { val: 'outofstock', label: `❌ Out of Stock (${outOfStockCount})`, activeColor: '#ef4444' },
          ].map(({ val, label, activeColor }) => (
            <button key={val} onClick={() => setStockFilter(val)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${stockFilter === val ? activeColor : '#e2e8f0'}`,
              background: stockFilter === val ? activeColor : 'white',
              color: stockFilter === val ? 'white' : '#64748b',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 56, color: '#94a3b8' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Loading menu...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 56, color: '#94a3b8' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>No items found.</div>
              </div>
            ) : filtered.map(item => {
              const stock = item.stock ?? 0
              const oos = isOutOfStock(item)
              const sc = getStockColor(item)
              return (
                <div key={item.id} style={{ background: 'white', borderRadius: 14, border: `1px solid ${oos ? '#fca5a5' : '#e2e8f0'}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.18s', position: 'relative', display: 'flex', flexDirection: 'column', opacity: oos ? 0.80 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.10)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  {oos && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,0.88)', color: 'white', fontSize: 12, fontWeight: 700, textAlign: 'center', padding: '6px 0', zIndex: 10 }}>❌ OUT OF STOCK</div>}
                  <div style={{ height: 120, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', filter: oos ? 'grayscale(60%)' : 'none' }}>
                    {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 46 }}>{catIcons[item.category]}</span>}
                  </div>
                  <div style={{ padding: '13px 15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{catIcons[item.category]} {item.category}</div>
                      <div style={{ fontWeight: 800, fontSize: 19, color: '#16a34a', marginBottom: 10 }}>₱{Number(item.price).toLocaleString()}</div>
                      {editingStock === item.id ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                          <input type="number" value={stockInput} onChange={e => setStockInput(e.target.value)} placeholder="0" style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #16a34a', borderRadius: 8, fontSize: 13, outline: 'none' }} autoFocus onKeyDown={e => e.key === 'Enter' && saveStock(item.id)} />
                          <button onClick={() => saveStock(item.id)} style={{ padding: '6px 10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✓</button>
                          <button onClick={() => setEditingStock(null)} style={{ padding: '6px 10px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      ) : (
                        <div onClick={() => { setEditingStock(item.id); setStockInput(String(stock)) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 10, transition: 'all 0.15s' }} title="Click to edit stock">
                          📦 {stock} in stock {isLowStock(item) ? '⚠️' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <button onClick={() => toggleStock(item)} style={{ width: '100%', padding: '8px 0', background: oos ? '#ecfdf5' : '#fef2f2', color: oos ? '#16a34a' : '#ef4444', border: `1px solid ${oos ? '#a7f3d0' : '#fecaca'}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        {oos ? '✅ Mark Available' : '❌ Mark Out of Stock'}
                      </button>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={() => handleEdit(item)} style={{ flex: 1, padding: '8px 0', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <FaEdit size={11} /> Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ flex: 1, padding: '8px 0', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <FaTrash size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const lbl = { fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }

export default Menu