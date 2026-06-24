import { useState, useRef, useEffect } from react
import Navbar from ../components/Navbar
import { FaPlus, FaTrash, FaImage, FaSave, FaTimes, FaSearch, FaBox, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from react-icons/fa
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from ../api

const categories = [Coffee, Non-Coffee, Beer, Pulutan]
const catLabels = { Coffee: Coffee, Non-Coffee: Non-Coffee, Beer: Beer, Pulutan: Snacks }

const isOutOfStock = (item) => item.outOfStock || (item.stock ?? 0) === 0
const isLowStock = (item) => !isOutOfStock(item) && (item.stock ?? 0) <= 10

const emptyForm = { name: , price: , category: Coffee, image: null, stock:  }

function Menu() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCat, setActiveCat] = useState(All)
  const [stockFilter, setStockFilter] = useState(all)
  const [search, setSearch] = useState()
  const [selectedItem, setSelectedItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState()
  const [success, setSuccess] = useState()
  const [saving, setSaving] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const fileRef = useRef()

  useEffect(() => { loadMenu() }, [])

  const loadMenu = async () => {
    setLoading(true)
    try {
      const data = await getMenu()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setError(Cannot connect to server!)
    }
    setLoading(false)
  }

  const filtered = items
    .filter(i => activeCat === All || i.category === activeCat)
    .filter(i => {
      if (stockFilter === available) return !isOutOfStock(i) && !isLowStock(i)
      if (stockFilter === lowstock) return isLowStock(i)
      if (stockFilter === outofstock) return isOutOfStock(i)
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
    setError()
    setSuccess()
    setPanelOpen(true)
  }

  const handleAddNew = () => {
    setSelectedItem(null)
    setForm(emptyForm)
    setPreview(null)
    setError()
    setSuccess()
    setPanelOpen(true)
  }

  const handleClose = () => {
    setPanelOpen(false)
    setSelectedItem(null)
    setForm(emptyForm)
    setPreview(null)
    setError()
    setSuccess()
  }

  const resetToAddMode = () => {
    setSelectedItem(null)
    setForm(emptyForm)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = 
  }

  const handleSave = async () => {
    if (!form.name.trim()) return setError(Please enter item name!)
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) return setError(Please enter a valid price!)
    setError()
    setSaving(true)
    try {
      if (selectedItem) {
        const updated = {
          ...selectedItem,
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image: form.image,
          stock: Number(form.stock) || 0,
          status: Available
        }
        await updateMenuItem(selectedItem.id, updated)
        setItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i))
        setSuccess(Item updated!)
        resetToAddMode()
        setTimeout(() => setSuccess(), 2000)
      } else {
        const payload = {
          name: form.name.trim(),
          price: Number(form.price),
          category: form.category,
          image: form.image,
          stock: Number(form.stock) || 0,
          status: Available
        }
        const res = await addMenuItem(payload)
        setItems(prev => [...prev, res])
        setSuccess(Item added!)
        resetToAddMode()
        setTimeout(() => setSuccess(), 2000)
      }
    } catch {
      setError(Failed to save item!)
      loadMenu()
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (!selectedItem) return
    if (!window.confirm(`Delete "${selectedItem.name}"?`)) return
    setItems(prev => prev.filter(i => i.id !== selectedItem.id))
    setSuccess(Item deleted!)
    resetToAddMode()
    setTimeout(() => setSuccess(), 2000)
    try {
      await deleteMenuItem(selectedItem.id)
    } catch {
      loadMenu()
    }
  }

  const handleToggleStock = async () => {
    if (!selectedItem) return
    const oos = isOutOfStock(selectedItem)
    const updated = { ...selectedItem, stock: oos ? 1 : 0, outOfStock: false }
    setItems(prev => prev.map(i => i.id === selectedItem.id ? updated : i))
    setSelectedItem(updated)
    try {
      await updateMenuItem(selectedItem.id, updated)
    } catch {
      loadMenu()
    }
  }

  const getStockColor = (item) => {
    if (isOutOfStock(item)) return { color: #ef4444, bg: #fef2f2, border: #fca5a5 }
    if (isLowStock(item)) return { color: #f59e0b, bg: #fffbeb, border: #fde68a }
    return { color: #16a34a, bg: #f0fdf4, border: #bbf7d0 }
  }

  const outOfStockCount = items.filter(i => isOutOfStock(i)).length
  const lowStockCount = items.filter(i => isLowStock(i)).length
  const availableCount = items.filter(i => !isOutOfStock(i)).length
  const isAddMode = panelOpen && !selectedItem
  const isEditMode = panelOpen && !!selectedItem

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content" style={{ padding: 24px 28px }}>

        <div className="page-header">
          <div>
            <h1>Menu Management</h1>
            <div style={{ display: flex, gap: 14, marginTop: 8, flexWrap: wrap }}>
              <span style={{ fontSize: 13, color: #16a34a, fontWeight: 600, display: flex, alignItems: center, gap: 6 }}>
                <FaCheckCircle size={14} /> {availableCount} available
              </span>
              <span style={{ fontSize: 13, color: #f59e0b, fontWeight: 600, display: flex, alignItems: center, gap: 6 }}>
                <FaExclamationTriangle size={14} /> {lowStockCount} low stock
              </span>
              <span style={{ fontSize: 13, color: #ef4444, fontWeight: 600, display: flex, alignItems: center, gap: 6 }}>
                <FaTimesCircle size={14} /> {outOfStockCount} out of stock
              </span>
            </div>
          </div>
          <button className="btn-primary" onClick={handleAddNew}>
            <FaPlus size={13} /> Add Item
          </button>
        </div>

        <div style={{ display: grid, gridTemplateColumns: panelOpen ? 1fr 360px : 1fr, gap: 20, alignItems: start }}>

          {/* LEFT: Product List */}
          <div>
            <div className="category-tabs">
              <button className={activeCat === All ? tab active : tab} onClick={() => setActiveCat(All)}>
                All ({items.length})
              </button>
              {categories.map(c => (
                <button key={c} className={activeCat === c ? tab active : tab} onClick={() => setActiveCat(c)}>
                  {catLabels[c]} ({items.filter(i => i.category === c).length})
                </button>
              ))}
            </div>

            <div style={{ display: flex, gap: 8, marginBottom: 16, alignItems: center, flexWrap: wrap }}>
              <div style={{ position: relative, flex: 1, minWidth: 160 }}>
                <FaSearch size={12} style={{ position: absolute, left: 12, top: 50%, transform: translateY(-50%), color: #94a3b8 }} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 32, paddingTop: 8, paddingBottom: 8, fontSize: 13, borderRadius: 20, border: 1.5px solid #e2e8f0, outline: none, width: 100%, background: white }}
                />
              </div>
              {[
                { val: all, label: All, color: #16a34a },
                { val: available, label: Available, color: #16a34a },
                { val: lowstock, label: Low Stock, color: #f59e0b },
                { val: outofstock, label: Out of Stock, color: #ef4444 },
              ].map(({ val, label, color }) => (
                <button key={val} onClick={() => setStockFilter(val)} style={{
                  padding: 7px 14px, borderRadius: 20, fontSize: 12, fontWeight: 600,
                  border: `1.5px solid ${stockFilter === val ? color : #e2e8f0}`,
                  background: stockFilter === val ? color : white,
                  color: stockFilter === val ? white : #64748b,
                  cursor: pointer, transition: all 0.15s, whiteSpace: nowrap
                }}>{label}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: center, padding: 56, color: #94a3b8 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Loading menu...</div>
              </div>
            ) : (
              <div style={{ display: grid, gridTemplateColumns: repeat(auto-fill, minmax(170px, 1fr)), gap: 14 }}>
                {filtered.length === 0 ? (
                  <div style={{ gridColumn: 1/-1, textAlign: center, padding: 56, color: #94a3b8 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>No items found.</div>
                  </div>
                ) : filtered.map(item => {
                  const oos = isOutOfStock(item)
                  const sc = getStockColor(item)
                  const isSelected = selectedItem && selectedItem.id === item.id
                  return (
                    <div
                      key={item.id}
                      onClick={() => panelOpen && handleSelectItem(item)}
                      style={{
                        background: white, borderRadius: 14,
                        border: isSelected ? 2.5px solid #16a34a : `1px solid ${oos ? #fca5a5 : #e2e8f0}`,
                        overflow: hidden,
                        boxShadow: isSelected ? 0 0 0 4px rgba(22,163,74,0.12) : 0 1px 4px rgba(0,0,0,0.06),
                        transition: all 0.18s,
                        cursor: panelOpen ? pointer : default,
                        opacity: oos ? 0.80 : 1, position: relative,
                      }}
                      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.transform = translateY(-2px); e.currentTarget.style.boxShadow = 0 6px 16px rgba(0,0,0,0.10) } }}
                      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.transform = translateY(0); e.currentTarget.style.boxShadow = 0 1px 4px rgba(0,0,0,0.06) } }}
                    >
                      {oos && !isSelected && (
                        <div style={{ position: absolute, top: 0, left: 0, right: 0, background: rgba(239,68,68,0.90), color: white, fontSize: 11, fontWeight: 700, textAlign: center, padding: 5px 0, zIndex: 10 }}>
                          OUT OF STOCK
                        </div>
                      )}
                      {isSelected && (
                        <div style={{ position: absolute, top: 0, left: 0, right: 0, background: rgba(22,163,74,0.90), color: white, fontSize: 11, fontWeight: 700, textAlign: center, padding: 5px 0, zIndex: 10 }}>
                          EDITING
                        </div>
                      )}
                      <div style={{ height: 100, background: #f8fafc, display: flex, alignItems: center, justifyContent: center, overflow: hidden, filter: oos ? grayscale(60%) : none }}>
                        {item.image
                          ? <img src={item.image} alt={item.name} style={{ width: 100%, height: 100%, objectFit: cover }} />
                          : <FaBox size={32} color="#cbd5e1" />
                        }
                      </div>
                      <div style={{ padding: 10px 12px }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: #0f172a, whiteSpace: nowrap, overflow: hidden, textOverflow: ellipsis, marginBottom: 4 }}>{item.name}</div>
                        <div style={{ fontSize: 12, color: #94a3b8, marginBottom: 6 }}>{catLabels[item.category]}</div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: #16a34a, marginBottom: 8 }}>₱{Number(item.price).toLocaleString()}</div>
                        <div style={{ display: flex, alignItems: center, gap: 6, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, padding: 4px 10px, borderRadius: 6, fontSize: 11, fontWeight: 600, width: fit-content }}>
                          <FaBox size={10} /> {item.stock ?? 0} stock
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Edit/Add Panel */}
          {panelOpen && (
            <div style={{
              background: white, borderRadius: 12,
              border: 1px solid #e2e8f0,
              boxShadow: 0 4px 12px rgba(0,0,0,0.1),
              position: sticky, top: 20, overflow: hidden
            }}>
              <div style={{
                background: var(--primary),
                padding: 16px,
                display: flex, justifyContent: space-between, alignItems: center,
                borderBottom: 1px solid #e2e8f0
              }}>
                <div style={{ color: white, fontWeight: 700, fontSize: 14 }}>
                  {isAddMode ? Add New Item : Edit Item}
                </div>
                <button onClick={handleClose} style={{ background: transparent, border: none, borderRadius: 6, width: 32, height: 32, cursor: pointer, color: white, display: flex, alignItems: center, justifyContent: center, transition: all 0.15s }}>
                  <FaTimes size={16} />
                </button>
              </div>

              <div style={{ padding: 16, display: flex, flexDirection: column, gap: 12 }}>
                {success && <div className="alert alert-success" style={{ marginBottom: 0 }}>{success}</div>}
                {error && <div className="alert alert-error" style={{ marginBottom: 0 }}>{error}</div>}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: #475569, display: block, marginBottom: 8 }}>Photo</label>
                  <div style={{ display: flex, alignItems: flex-start, gap: 12 }}>
                    <div style={{ width: 72, height: 72, borderRadius: 10, background: #f8fafc, border: 2px dashed #e2e8f0, display: flex, alignItems: center, justifyContent: center, overflow: hidden, flexShrink: 0 }}>
                      {preview
                        ? <img src={preview} alt="preview" style={{ width: 100%, height: 100%, objectFit: cover }} />
                        : <FaBox size={28} color="#cbd5e1" />
                      }
                    </div>
                    <div style={{ display: flex, flexDirection: column, gap: 6 }}>
                      <input type="file" accept="image/*" ref={fileRef} onChange={handleImage} style={{ display: none }} />
                      <button onClick={() => fileRef.current.click()} className="btn-secondary" style={{ padding: 8px 12px, fontSize: 12, display: flex, alignItems: center, gap: 6, width: fit-content }}>
                        <FaImage size={12} /> {preview ? Change : Upload}
                      </button>
                      {preview && (
                        <button onClick={() => { setPreview(null); setForm(p => ({ ...p, image: null })) }} className="btn-danger" style={{ padding: 8px 12px, fontSize: 12, display: flex, alignItems: center, gap: 6, width: fit-content }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Item Name *</label>
                  <input type="text" placeholder="e.g. Caramel Macchiato" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label>Price (₱) *</label>
                  <input type="number" placeholder="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {categories.map(c => <option key={c} value={c}>{catLabels[c]}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Stock Quantity</label>
                  <input type="number" placeholder="0" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
                </div>

                {isEditMode && (() => {
                  const oos = isOutOfStock(selectedItem)
                  const statusBg = oos ? #fef2f2 : #f0fdf4
                  const statusColor = oos ? #ef4444 : #16a34a
                  const statusText = oos ? Out of Stock : isLowStock(selectedItem) ? Low Stock : Available
                  return (
                    <div style={{ background: statusBg, border: `1px solid ${statusColor}20`, borderRadius: 8, padding: 12px, display: flex, justifyContent: space-between, alignItems: center }}>
                      <div>
                        <div style={{ fontSize: 11, color: #64748b, fontWeight: 600, marginBottom: 2 }}>Stock Status</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: statusColor }}>
                          {statusText}
                        </div>
                      </div>
                      <button onClick={handleToggleStock} style={{ padding: 8px 12px, background: oos ? #16a34a : #ef4444, color: white, border: none, borderRadius: 6, cursor: pointer, fontSize: 12, fontWeight: 600 }}>
                        {oos ? Mark Available : Mark OOS}
                      </button>
                    </div>
                  )
                })()}

                <div style={{ borderTop: 1px solid #e2e8f0, marginTop: 4 }} />

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                  style={{
                    width: 100%, marginTop: 12,
                    cursor: saving ? not-allowed : pointer,
                    opacity: saving ? 0.7 : 1,
                    display: flex, alignItems: center, justifyContent: center, gap: 8,
                  }}>
                  <FaSave size={13} /> {saving ? Saving... : isAddMode ? Add Item : Save Changes}
                </button>

                {isEditMode && (
                  <button onClick={handleDelete} className="btn-danger" style={{ width: 100%, marginTop: 8, display: flex, alignItems: center, justifyContent: center, gap: 8 }}>
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

export default Menu
