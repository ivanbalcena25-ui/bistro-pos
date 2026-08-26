import { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { FaPlus, FaTrash, FaImage, FaSave, FaTimes, FaSearch } from 'react-icons/fa'
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../api'
import { SkeletonCardGrid } from '../components/Skeleton'
import AdminProfileMenu from '../components/AdminProfileMenu'

const categories = ['Coffee', 'Non-Coffee', 'Beer', 'Pulutan']
const catIcons = { Coffee: '☕', 'Non-Coffee': '🧃', Beer: '🍺', Pulutan: '🍗' }

const menuStyles = `
  

  .menu-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

  .menu-root input,
  .menu-root select,
  .menu-root textarea {
    font-family: 'Plus Jakarta Sans', sans-serif;
    border: 1.5px solid #d1fae5;
    border-radius: 10px;
    padding: 9px 13px;
    font-size: 14px;
    width: 100%;
    outline: none;
    transition: border-color .18s, box-shadow .18s;
    background: white;
    color: #0f172a;
  }
  .menu-root input:focus,
  .menu-root select:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22,163,74,.12);
  }

  .menu-cat-tab {
    padding: 8px 18px; border-radius: 25px; font-size: 13px;
    font-weight: 600; border: 1.5px solid #e2e8f0;
    background: white; color: #64748b; cursor: pointer;
    transition: all .15s; white-space: nowrap;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .menu-cat-tab.active {
    background: #16a34a; color: white; border-color: #16a34a;
    box-shadow: 0 4px 12px rgba(22,163,74,.3);
  }

  .menu-stock-filter {
    padding: 7px 14px; border-radius: 20px; font-size: 12px;
    font-weight: 600; cursor: pointer; transition: all .15s;
    white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif;
    border: 1.5px solid #e2e8f0; background: white; color: #64748b;
  }
  .menu-stock-filter.active-all   { border-color: #16a34a; background: #16a34a; color: white; }
  .menu-stock-filter.active-avail { border-color: #16a34a; background: #16a34a; color: white; }
  .menu-stock-filter.active-low   { border-color: #f59e0b; background: #f59e0b; color: white; }
  .menu-stock-filter.active-oos   { border-color: #ef4444; background: #ef4444; color: white; }

  .menu-item-card {
    background: white; border-radius: 14px;
    border: 1px solid #e2e8f0; overflow: hidden;
    cursor: default; position: relative;
    transition: all .18s;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }
  .menu-item-card.clickable { cursor: pointer; }
  .menu-item-card.clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,.10);
  }
  .menu-item-card.selected {
    border: 2.5px solid #16a34a;
    box-shadow: 0 0 0 4px rgba(22,163,74,.12);
  }
  .menu-item-card.oos { border-color: #fca5a5; opacity: .82; }

  .menu-save-btn {
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: white; border: none; border-radius: 10px;
    cursor: pointer; font-size: 14px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    box-shadow: 0 2px 8px rgba(22,163,74,.35);
    transition: all .18s; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .menu-save-btn:hover { box-shadow: 0 4px 16px rgba(22,163,74,.45); transform: translateY(-1px); }
  .menu-save-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
`

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
  const [panelOpen, setPanelOpen] = useState(false)
  const fileRef = useRef()

  useEffect(() => { loadMenu() }, [])

  const loadMenu = async () => {
    setLoading(true)
    try { const data = await getMenu(); setItems(Array.isArray(data) ? data : []) }
    catch { setError('Cannot connect to server!') }
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
    setPreview(item.image); setError(''); setSuccess(''); setPanelOpen(true)
  }

  const handleAddNew = () => {
    setSelectedItem(null); setForm(emptyForm); setPreview(null)
    setError(''); setSuccess(''); setPanelOpen(true)
  }

  const handleClose = () => {
    setPanelOpen(false); setSelectedItem(null); setForm(emptyForm)
    setPreview(null); setError(''); setSuccess('')
  }

  const resetToAddMode = () => {
    setSelectedItem(null); setForm(emptyForm); setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError('Please enter item name!')
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) return setError('Please enter a valid price!')
    setError(''); setSaving(true)
    try {
      if (selectedItem) {
        const updated = { ...selectedItem, name: form.name.trim(), price: Number(form.price), category: form.category, image: form.image, stock: Number(form.stock) || 0, status: 'Available' }
        await updateMenuItem(selectedItem.id, updated)
        setItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i))
        setSuccess('Item updated!'); resetToAddMode(); setTimeout(() => setSuccess(''), 2000)
      } else {
        const payload = { name: form.name.trim(), price: Number(form.price), category: form.category, image: form.image, stock: Number(form.stock) || 0, status: 'Available' }
        const res = await addMenuItem(payload)
        setItems(prev => [...prev, res]); setSuccess('Item added!'); resetToAddMode(); setTimeout(() => setSuccess(''), 2000)
      }
    } catch { setError('Failed to save item!'); loadMenu() }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    if (!window.confirm(`Delete "${selectedItem.name}"?`)) return
    setItems(prev => prev.filter(i => i.id !== selectedItem.id))
    setSuccess('Item deleted!'); resetToAddMode(); setTimeout(() => setSuccess(''), 2000)
    try { await deleteMenuItem(selectedItem.id) } catch { loadMenu() }
  }

  const handleToggleStock = async () => {
    if (!selectedItem) return
    const oos = isOutOfStock(selectedItem)
    const updated = { ...selectedItem, stock: oos ? 1 : 0, outOfStock: false }
    setItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i)); setSelectedItem(updated)
    try { await updateMenuItem(selectedItem.id, updated) } catch { loadMenu() }
  }

  const getStockColor = (item) => {
    if (isOutOfStock(item)) return { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' }
    if (isLowStock(item)) return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' }
    return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' }
  }

  const outOfStockCount = items.filter(i => isOutOfStock(i)).length
  const lowStockCount = items.filter(i => isLowStock(i)).length
  const availableCount = items.filter(i => !isOutOfStock(i)).length
  const isAddMode = panelOpen && !selectedItem
  const isEditMode = panelOpen && !!selectedItem

  const stockFilters = [
    { val: 'all', label: 'All', cls: 'active-all' },
    { val: 'available', label: '✅ Available', cls: 'active-avail' },
    { val: 'lowstock', label: '⚠️ Low Stock', cls: 'active-low' },
    { val: 'outofstock', label: '❌ Out of Stock', cls: 'active-oos' },
  ]

  return (
    <div className="menu-root page-container">
      <style>{menuStyles}</style>
      <Navbar />
      <div className="page-content" style={{ padding: '24px 28px' }}>

        {/* Admin profile — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <AdminProfileMenu />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Menu Management</h1>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✅ {availableCount} available</span>
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>⚠️ {lowStockCount} low stock</span>
              <span style={{ fontSize: 13, color: '#ef4444', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>❌ {outOfStockCount} out of stock</span>
            </div>
          </div>
          <button onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 20px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 4px 14px rgba(22,163,74,.3)', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all .18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,163,74,.4)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,.3)' }}>
            <FaPlus size={13} /> Edit Items
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: panelOpen ? '1fr 360px' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* LEFT: Item Grid */}
          <div>
            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <button className={activeCat === 'All' ? 'menu-cat-tab active' : 'menu-cat-tab'} onClick={() => setActiveCat('All')}>
                🍽️ All ({items.length})
              </button>
              {categories.map(c => (
                <button key={c} className={activeCat === c ? 'menu-cat-tab active' : 'menu-cat-tab'} onClick={() => setActiveCat(c)}>
                  {catIcons[c]} {c} ({items.filter(i => i.category === c).length})
                </button>
              ))}
            </div>

            {/* Search + Stock Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: 160 }}>
                <FaSearch size={12} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text" placeholder="Search items..." value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 34, paddingTop: 9, paddingBottom: 9, fontSize: 13 }}
                />
              </div>
              {stockFilters.map(({ val, label, cls }) => (
                <button key={val} className={`menu-stock-filter${stockFilter === val ? ' ' + cls : ''}`} onClick={() => setStockFilter(val)}>{label}</button>
              ))}
            </div>

            {loading ? (
              <SkeletonCardGrid count={10} minWidth={170} cardHeight={190} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 14 }}>
                {filtered.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 56, color: '#94a3b8' }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>🍽️</div>
                    <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No items found.</div>
                  </div>
                ) : filtered.map(item => {
                  const oos = isOutOfStock(item)
                  const sc = getStockColor(item)
                  const isSelected = selectedItem && selectedItem.id === item.id
                  return (
                    <div
                      key={item.id}
                      className={`menu-item-card${panelOpen ? ' clickable' : ''}${isSelected ? ' selected' : ''}${oos ? ' oos' : ''}`}
                      onClick={() => panelOpen && handleSelectItem(item)}
                      onMouseEnter={e => { if (panelOpen && !isSelected) { e.currentTarget.style.borderColor = '#16a34a' } }}
                      onMouseLeave={e => { if (panelOpen && !isSelected) { e.currentTarget.style.borderColor = oos ? '#fca5a5' : '#e2e8f0' } }}
                    >
                      {oos && !isSelected && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,.88)', color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 0', zIndex: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>❌ OUT OF STOCK</div>
                      )}
                      {isSelected && (
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(22,163,74,.90)', color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 0', zIndex: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✏️ EDITING</div>
                      )}
                      <div style={{ height: 100, background: 'linear-gradient(180deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', filter: oos ? 'grayscale(60%)' : 'none' }}>
                        {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 38 }}>{catIcons[item.category]}</span>}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{catIcons[item.category]} {item.category}</div>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#16a34a', marginBottom: 7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{Number(item.price).toLocaleString()}</div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          📦 {item.stock ?? 0} in stock {isLowStock(item) ? '⚠️' : ''}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Add/Edit Panel */}
          {panelOpen && (
            <div style={{ background: 'white', borderRadius: 18, border: '2px solid #16a34a', boxShadow: '0 4px 24px rgba(22,163,74,.14)', position: 'sticky', top: 20, overflow: 'hidden' }}>
              {/* Panel Header */}
              <div style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {isAddMode ? '➕ Add New Item' : '✏️ Edit Item'}
                </div>
                <button onClick={handleClose} style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaTimes size={13} />
                </button>
              </div>

              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {success && <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✅ {success}</div>}
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>⚠️ {error}</div>}

                {/* Photo */}
                <div>
                  <label style={lbl}>Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f0fdf4', border: '1.5px dashed #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {preview ? <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>{catIcons[form.category]}</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} style={{ display: 'none' }} />
                      <button onClick={() => fileRef.current.click()} style={{ padding: '7px 14px', border: '1.5px dashed #16a34a', borderRadius: 8, background: '#f0fdf4', color: '#16a34a', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <FaImage size={12} /> {preview ? 'Change' : 'Upload'}
                      </button>
                      {preview && (
                        <button onClick={() => { setPreview(null); setForm(p => ({ ...p, image: null })) }} style={{ padding: '7px 14px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Remove</button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label style={lbl}>Item Name *</label>
                  <input type="text" placeholder="e.g. Caramel Macchiato" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div>
                  <label style={lbl}>Price (₱) *</label>
                  <input type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                </div>

                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{catIcons[c]} {c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={lbl}>Stock Quantity</label>
                  <input type="number" placeholder="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
                </div>

                {isEditMode && (() => {
                  const oos = isOutOfStock(selectedItem)
                  return (
                    <div style={{ background: oos ? '#fef2f2' : '#f0fdf4', border: `1px solid ${oos ? '#fecaca' : '#bbf7d0'}`, borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Stock Status</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: oos ? '#ef4444' : '#16a34a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                          {oos ? '❌ Out of Stock' : isLowStock(selectedItem) ? '⚠️ Low Stock' : '✅ Available'}
                        </div>
                      </div>
                      <button onClick={handleToggleStock} style={{ padding: '7px 12px', background: oos ? '#16a34a' : '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        {oos ? 'Mark Available' : 'Mark OOS'}
                      </button>
                    </div>
                  )
                })()}

                <div style={{ borderTop: '1px solid #f1f5f9' }} />

                <button className="menu-save-btn" onClick={handleSave} disabled={saving}>
                  <FaSave size={13} /> {saving ? 'Saving...' : isAddMode ? 'Add Item' : 'Save Changes'}
                </button>

                {isEditMode && (
                  <button onClick={handleDelete} style={{ width: '100%', padding: '11px', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
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

const lbl = { fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }
export default Menu