import { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { FaPlus, FaTrash, FaImage, FaSave, FaTimes, FaSearch } from 'react-icons/fa'
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../api'

const categories = ['Coffee', 'Non-Coffee', 'Beer', 'Pulutan']
const catIcons = { Coffee: '☕', 'Non-Coffee': '🧃', Beer: '🍺', Pulutan: '🍗' }

const isOutOfStock = (item) => item.outOfStock || (item.stock ?? 0) === 0
const isLowStock = (item) => !isOutOfStock(item) && (item.stock ?? 0) <= 10

const emptyForm = { name: '', price: '', category: 'Coffee', image: null, stock: '' }

function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState('All')
  const [stockFilter, setStockFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
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
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  const handleImage = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => { setPreview(reader.result); setForm(p => ({ ...p, image: reader.result })) }
    reader.readAsDataURL(file)
  }

  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setForm({ name: item.name, price: String(item.price), category: item.category, image: item.image, stock: String(item.stock ?? 0) })
    setPreview(item.image)
    setError('')
    setSuccess('')
  }

  const handleAddNew = () => {
    setSelectedItem('new')
    setForm(emptyForm)
    setPreview(null)
    setError('')
    setSuccess('')
  }

  const handleClose = () => {
    setSelectedItem(null)
    setForm(emptyForm)
    setPreview(null)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Please enter item name!')
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) return setError('Please enter a valid price!')
    setError('')
    setSaving(true)
    try {
      if (selectedItem && selectedItem !== 'new') {
        const updated = {
          ...selectedItem,
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image: form.image,
          stock: Number(form.stock) || 0
        }
        // Optimistic update
        setItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i))
        setSelectedItem(updated)
        setSuccess('Item updated!')
        await updateMenuItem(selectedItem.id, updated)
      } else {
        const payload = {
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image: form.image,
          stock: Number(form.stock) || 0
        }
        // Call API first to get the real ID
        const res = await addMenuItem(payload)
        setItems(prev => [...prev, res])
        setSuccess('Item added!')
        setTimeout(() => { setSuccess(''); handleClose() }, 1000)
      }
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setError('Failed to save item!')
      loadMenu() // re-sync if error
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedItem || selectedItem === 'new') return
    if (!window.confirm(`Delete "${selectedItem.name}"?`)) return
    // Optimistic delete
    setItems(prev => prev.filter(i => i.id !== selectedItem.id))
    handleClose()
    try {
      await deleteMenuItem(selectedItem.id)
    } catch {
      loadMenu() // re-sync if error
    }
  }

  const handleToggleStock = async () => {
    if (!selectedItem || selectedItem === 'new') return
    const oos = isOutOfStock(selectedItem)
    const updated = { ...selectedItem, stock: oos ? 1 : 0, outOfStock: false }
    // Optimistic update
    setItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i))
    setSelectedItem(updated)
    try {
      await updateMenuItem(selectedItem.id, updated)
    } catch {
      loadMenu()
    }
  }

  const getStockColor = (item) => {
    if (isOutOfStock(item)) return { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' }
    if (isLowStock(item)) return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
    return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
  }

  const outOfStockCount = items.filter(i => isOutOfStock(i)).length
  const lowStockCount = items.filter(i => isLowStock(i)).length
  const availableCount = items.filter(i => !isOutOfStock(i)).length
  const isEditing = selectedItem !== null

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content" style={{ padding: '24px 28px' }}>

        <div className="page-header">
          <div>
            <h1>Menu Management</h1>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>✅ {availableCount} available</span>
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>⚠️ {lowStockCount} low stock</span>
              <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>❌ {outOfStockCount} out of stock</span>
            </div>
          </div>
          <button className="btn-primary" onClick={handleAddNew}>
            <FaPlus size={13} /> Add Item
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 360px' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT: Product List */}
          <div>
            <div className="category-tabs">
              <button className={activeCat === 'All' ? 'tab active' : 'tab'} onClick={() => setActiveCat('All')}>
                🍽️ All ({items.length})
              </button>
              {categories.map(c => (
                <button key={c} className={activeCat === c ? 'tab active' : 'tab'} onClick={() => setActiveCat(c)}>
                  {catIcons[c]} {c} ({items.filter(i => i.category === c).length})
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: 160 }}>
                <FaSearch size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 32, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 20, border: '1.5px solid #e2e8f0', outline: 'none', width: '100%', background: 'white' }}
                />
              </div>
              {[
                { val: 'all', label: 'All', color: '#16a34a' },
                { val: 'available', label: '✅ Available', color: '#16a34a' },
                { val: 'lowstock', label: '⚠️ Low Stock', color: '#f59e0b' },
                { val: 'outofstock', label: '❌ Out of Stock', color: '#ef4444' },
              ].map(({ val, label, color }) => (
                <button key={val} onClick={() => setStockFilter(val)} style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${stockFilter === val ? color : '#e2e8f0'}`,
                  background: stockFilter === val ? color : 'white',
                  color: stockFilter === val ? 'white' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
                }}>{label}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 56, color: '#94a3b8' }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Loading menu...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                {filtered.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 56, color: '#94a3b8' }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>No items found.</div>
                  </div>
                ) : filtered.map(item => {
                  const oos = isOutOfStock(item)
                  const sc = getStockColor(item)
                  const isSelected = selectedItem && selectedItem !== 'new' && selectedItem.id === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectItem(item)}
                      style={{
                        background: 'white', borderRadius: 14,
                        border: isSelected ? '2.5px solid #16a34a' : `1px solid ${oos ? '#fca5a5' : '#e2e8f0'}`,
                        overflow: 'hidden',
                        boxShadow: isSelected ? '0 0 0 4px rgba(22,163,74,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                        transition: 'all 0.18s', cursor: 'pointer',
                        opacity: oos ? 0.80 : 1, position: 'relative',
                      }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.10)' } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' } }}
                    >
                      {oos && !isSelected && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,0.88)', color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 0', zIndex: 10 }}>
                          ❌ OUT OF STOCK
                        </div>
                      )}
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(22,163,74,0.90)', color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 0', zIndex: 10 }}>
                          ✏️ EDITING
                        </div>
                      )}
                      <div style={{ height: 100, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', filter: oos ? 'grayscale(60%)' : 'none' }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 38 }}>{catIcons[item.category]}</span>
                        }
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5 }}>{catIcons[item.category]} {item.category}</div>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#16a34a', marginBottom: 7 }}>₱{Number(item.price).toLocaleString()}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          📦 {item.stock ?? 0} in stock {isLowStock(item) ? '⚠️' : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Edit Panel */}
          {isEditing && (
            <div style={{
              background: 'white', borderRadius: 16,
              border: '2px solid #16a34a',
              boxShadow: '0 4px 24px rgba(22,163,74,0.14)',
              position: 'sticky', top: 20, overflow: 'hidden'
            }}>
              <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>
                  {selectedItem === 'new' ? '➕ Add New Item' : '✏️ Edit Item'}
                </div>
                <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaTimes size={13} />
                </button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {success && <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>✅ {success}</div>}
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13 }}>⚠️ {error}</div>}

                {/* Photo */}
                <div>
                  <label style={lbl}>Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f0fdf4', border: '1.5px dashed #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {preview
                        ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: 28 }}>{catIcons[form.category]}</span>
                      }
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} style={{ display: 'none' }} />
                      <button onClick={() => fileRef.current.click()} style={{ padding: '7px 14px', border: '1.5px dashed #16a34a', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FaImage size={12} /> {preview ? 'Change' : 'Upload'}
                      </button>
                      {preview && (
                        <button onClick={() => { setPreview(null); setForm(p => ({ ...p, image: null })) }} style={{ padding: '7px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Item Name *</label>
                  <input type="text" placeholder="e.g. Caramel Macchiato" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={{ fontSize: 14 }} />
                </div>

                <div>
                  <label style={lbl}>Price (₱) *</label>
                  <input type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={{ fontSize: 14 }} />
                </div>

                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ fontSize: 14 }}>
                    {categories.map(c => <option key={c} value={c}>{catIcons[c]} {c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Stock Quantity</label>
                  <input type="number" placeholder="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} style={{ fontSize: 14 }} />
                </div>

                {selectedItem && selectedItem !== 'new' && (() => {
                  const oos = isOutOfStock(selectedItem)
                  return (
                    <div style={{ background: oos ? '#fef2f2' : '#f0fdf4', border: `1px solid ${oos ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 2 }}>Stock Status</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: oos ? '#ef4444' : '#16a34a' }}>
                          {oos ? '❌ Out of Stock' : isLowStock(selectedItem) ? '⚠️ Low Stock' : '✅ Available'}
                        </div>
                      </div>
                      <button onClick={handleToggleStock} style={{ padding: '7px 12px', background: oos ? '#16a34a' : '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                        {oos ? 'Mark Available' : 'Mark OOS'}
                      </button>
                    </div>
                  )
                })()}

                <div style={{ borderTop: '1px solid #f1f5f9' }} />

                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ width: '100%', padding: '12px', background: saving ? '#86efac' : 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 2px 8px rgba(22,163,74,0.35)' }}>
                  <FaSave size={13} /> {saving ? 'Saving...' : selectedItem === 'new' ? 'Add Item' : 'Save Changes'}
                </button>

                {selectedItem && selectedItem !== 'new' && (
                  <button onClick={handleDelete} style={{ width: '100%', padding: '11px', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <FaTrash size={12} /> Delete Item
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const lbl = { fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }

export default Menu