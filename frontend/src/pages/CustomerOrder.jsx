import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaPlus, FaTrash, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa'

const categories = ['Coffee', 'Non-Coffee', 'Beer', 'Pulutan']
const categoryIcons = { Coffee: '☕', 'Non-Coffee': '🧃', Beer: '🍺', Pulutan: '🍗' }

const API = 'https://bistro-pos.onrender.com/api'

function CustomerOrder() {
  const [availableItems, setAvailableItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState([])
  const [tableNo, setTableNo] = useState('')
  const [activeCategory, setActiveCategory] = useState('Coffee')
  const [ordered, setOrdered] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const navigate = useNavigate()

  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    loadMenu()
  }, [])

  const loadMenu = async () => {
    setLoading(true)
    setError('')
    try {
      const token = user.token || ''
      const res = await fetch(`${API}/menu`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load menu')
      const data = await res.json()
      setAvailableItems(Array.isArray(data) ? data.filter(i => i.status === 'Available' && (i.stock ?? 0) > 0) : [])
    } catch (e) {
      setError('Could not load menu. Please check your connection.')
    }
    setLoading(false)
  }

  const addToCart = (item) => {
    const exists = cart.find(c => c.id === item.id)
    const currentQty = exists ? exists.qty : 0
    if (currentQty >= (item.stock ?? 999)) {
      alert(`Only ${item.stock} left in stock!`)
      return
    }
    if (exists) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c))
    } else {
      setCart([...cart, { ...item, qty: 1 }])
    }
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c
      const newQty = c.qty + delta
      if (newQty < 1) return c
      return { ...c, qty: newQty }
    }))
  }

  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id))
  const getTotal = () => cart.reduce((sum, s) => sum + s.price * s.qty, 0)

  const handleCheckout = async () => {
    if (!tableNo || cart.length === 0) {
      alert('Please enter table number and select at least one item!')
      return
    }

    setOrdering(true)
    try {
      const token = user.token || ''
      // Add transaction via API
      const txRes = await fetch(`${API}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          customer_name: `Table ${tableNo}`,
          table_no: parseInt(tableNo),
          total: getTotal(),
          amount_paid: getTotal(),
          change_amount: 0,
          discount_type: 'None',
          discount_amount: 0,
          payment_method: 'Pending Payment',
          cashier_name: user.username || 'Customer',
          created_by: user.username || 'Customer',
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
        })
      })
      if (!txRes.ok) throw new Error('Failed to submit order')

      // Update table status
      await fetch(`${API}/tables/number/${tableNo}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'Occupied', customer: `Table ${tableNo}` })
      })

      // Also save to localStorage as backup so cashier can see pending orders
      const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]')
      localStorage.setItem('pendingOrders', JSON.stringify([...pendingOrders, {
        id: Date.now(), customer: user.username, tableNo,
        items: cart, total: getTotal(), date: new Date().toLocaleString(), status: 'Pending',
      }]))

      setOrdered(true)
    } catch (e) {
      alert('Failed to submit order: ' + e.message)
    }
    setOrdering(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const filtered = availableItems.filter(i => i.category === activeCategory)

  if (ordered) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', textAlign: 'center', boxShadow: '0 8px 40px rgba(108,99,255,0.15)', maxWidth: 400, width: '100%' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#2d3436', marginBottom: 8 }}>Order Placed!</h2>
          <p style={{ color: '#636e72', marginBottom: 8 }}>Your order has been sent to the kitchen and cashier.</p>
          <p style={{ color: '#6c63ff', fontWeight: 700, marginBottom: 24 }}>Table {tableNo} — Please wait for your food!</p>
          <button onClick={() => { setOrdered(false); setCart([]); setTableNo('') }}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6c63ff, #574fd6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 12 }}>
            New Order
          </button>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '14px', background: '#fff5f5', color: '#e74c3c', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2ff', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '0 32px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 20px rgba(108,99,255,0.07)', borderBottom: '1px solid #e8e8f0' }}>
        <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #6c63ff, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ☕ VS Hotel Bistro
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#ede9ff', color: '#6c63ff', padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>👤 {user.username}</span>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: '#fff5f5', color: '#e74c3c', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#2d3436', marginBottom: 4 }}>Place Your Order</h1>
        <p style={{ color: '#b2bec3', marginBottom: 24, fontSize: 14 }}>Select items and our staff will serve you shortly.</p>

        {error && (
          <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', color: '#e74c3c', padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontWeight: 600 }}>
            ❌ {error}
            <button onClick={loadMenu} style={{ marginLeft: 12, background: 'none', border: 'none', color: '#6c63ff', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>Retry</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
          {/* Menu */}
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ padding: '9px 20px', border: `2px solid ${activeCategory === cat ? '#6c63ff' : '#e8e8f0'}`, borderRadius: 25, background: activeCategory === cat ? '#6c63ff' : 'white', color: activeCategory === cat ? 'white' : '#636e72', cursor: 'pointer', fontSize: 14, fontWeight: 600, boxShadow: activeCategory === cat ? '0 4px 14px rgba(108,99,255,0.35)' : 'none' }}>
                  {categoryIcons[cat]} {cat}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#b2bec3' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ fontWeight: 600 }}>Loading menu...</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
                {filtered.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#b2bec3' }}>
                    <div style={{ fontSize: 36 }}>🍽️</div>
                    <div style={{ marginTop: 8 }}>No available items in this category.</div>
                  </div>
                ) : filtered.map(item => {
                  const inCart = cart.find(c => c.id === item.id)
                  return (
                    <div key={item.id} onClick={() => addToCart(item)}
                      style={{ background: 'white', padding: 0, borderRadius: 16, cursor: 'pointer', border: `2px solid ${inCart ? '#6c63ff' : 'transparent'}`, boxShadow: '0 4px 24px rgba(108,99,255,0.08)', transition: 'all 0.2s', overflow: 'hidden', position: 'relative' }}
                      onMouseEnter={e => { if (!inCart) e.currentTarget.style.borderColor = '#a29bfe' }}
                      onMouseLeave={e => { if (!inCart) e.currentTarget.style.borderColor = 'transparent' }}
                    >
                      {inCart && <div style={{ position: 'absolute', top: 8, right: 8, background: '#6c63ff', color: 'white', fontWeight: 800, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, zIndex: 5 }}>{inCart.qty}</div>}
                      <div style={{ height: 90, background: '#f0f2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 36 }}>{categoryIcons[item.category]}</span>}
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: '#2d3436' }}>{item.name}</div>
                        <div style={{ fontWeight: 800, fontSize: 17, color: '#6c63ff', marginBottom: 8 }}>₱{Number(item.price).toLocaleString()}</div>
                        <button style={{ width: '100%', padding: '7px', background: 'linear-gradient(135deg, #6c63ff, #574fd6)', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          <FaPlus style={{ marginRight: 4 }} /> Add
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 24px rgba(108,99,255,0.08)', border: '1px solid #e8e8f0', height: 'fit-content', position: 'sticky', top: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: '#2d3436' }}>
              <FaShoppingCart style={{ marginRight: 8, color: '#6c63ff' }} />Your Order
            </h3>

            <input type="number" placeholder="Table Number"
              value={tableNo} onChange={e => setTableNo(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8f0', borderRadius: 10, fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />

            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#b2bec3' }}>
                <div style={{ fontSize: 36 }}>🛒</div>
                <p style={{ marginTop: 8, fontSize: 13 }}>No items yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto', marginBottom: 12 }}>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f0f2ff', borderRadius: 10 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#b2bec3' }}>₱{item.price} × {item.qty}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: 24, height: 24, border: '1px solid #ddd6fe', borderRadius: 6, background: 'white', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                      <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => addToCart(item)} style={{ width: 24, height: 24, border: 'none', borderRadius: 6, background: '#6c63ff', cursor: 'pointer', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: '#fff5f5', color: '#e74c3c', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer' }}>
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background: '#ede9ff', padding: '12px 14px', borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: '#6c63ff' }}>
                <span>Total</span><span>₱{getTotal().toLocaleString()}</span>
              </div>
            </div>

            <div style={{ background: '#fff8e6', border: '1px solid #f39c12', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#856404' }}>
              💡 After placing your order, please wait for your food. Payment at the cashier.
            </div>

            <button onClick={handleCheckout} disabled={ordering || cart.length === 0 || !tableNo}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6c63ff, #574fd6)', color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: (ordering || cart.length === 0 || !tableNo) ? 'not-allowed' : 'pointer', opacity: (ordering || cart.length === 0 || !tableNo) ? 0.6 : 1, boxShadow: '0 8px 20px rgba(108,99,255,0.4)' }}>
              {ordering ? '⏳ Placing Order...' : '✅ Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerOrder
