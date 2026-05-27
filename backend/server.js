const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

dotenv.config()

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'bistro_secret_key_change_in_production'

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '10mb' }))

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pos_db',
  waitForConnections: true,
  connectionLimit: 10,
})

pool.getConnection()
  .then(conn => { console.log('✅ Connected to MySQL database!'); conn.release() })
  .catch(err => console.error('❌ DB Error:', err.message))

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try { req.user = jwt.verify(token, JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Invalid token' }) }
}

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

app.get('/', (req, res) => res.json({ message: '✅ Bistro POS Backend running!' }))

// ── AUTH ──
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND status = "Active"', [username])
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
    const user = rows[0]
    let valid = false
    if (user.password.startsWith('$2')) {
      valid = await bcrypt.compare(password, user.password)
    } else {
      valid = user.password === password
      if (valid) {
        const hashed = await bcrypt.hash(password, 10)
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user.id])
      }
    }
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ id: user.id, username: user.username, role: user.role, email: user.email || '', token })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── USERS ──
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, role, status, created_at FROM users')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, email, role } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const [result] = await pool.query(
      'INSERT INTO users (username, password, email, role, status) VALUES (?, ?, ?, ?, "Active")',
      [username, hashed, email || '', role]
    )
    res.json({ id: result.insertId, username, email: email || '', role, status: 'Active' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/users/:id', auth, async (req, res) => {
  try {
    const { email, password, currentPassword } = req.body
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(req.params.id))
      return res.status(403).json({ error: 'Unauthorized' })
    if (password) {
      const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.params.id])
      if (!rows.length) return res.status(404).json({ error: 'User not found' })
      if (currentPassword) {
        let valid = rows[0].password.startsWith('$2')
          ? await bcrypt.compare(currentPassword, rows[0].password)
          : rows[0].password === currentPassword
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect!' })
      }
      const hashed = await bcrypt.hash(password, 10)
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.params.id])
    }
    if (email !== undefined) await pool.query('UPDATE users SET email = ? WHERE id = ?', [email || '', req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself!' })
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── MENU ──
app.get('/api/menu', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE status = "Available"')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/menu', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, category, image, stock } = req.body
    const [result] = await pool.query(
      'INSERT INTO menu_items (name, price, category, image, status, stock) VALUES (?, ?, ?, ?, "Available", ?)',
      [name, price, category, image || null, stock ?? 0]
    )
    res.json({ id: result.insertId, name, price, category, image: image || null, status: 'Available', stock: stock ?? 0 })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/menu/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, category, image, stock } = req.body
    await pool.query('UPDATE menu_items SET name = ?, price = ?, category = ?, image = ?, stock = ? WHERE id = ?',
      [name, price, category, image || null, stock ?? 0, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/menu/:id', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('UPDATE menu_items SET status = "Unavailable" WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── TABLES ──
app.get('/api/tables', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM tables_list ORDER BY number')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/tables/number/:number', auth, async (req, res) => {
  try {
    const { status, customer } = req.body
    await pool.query('UPDATE tables_list SET status = ?, customer = ?, updated_at = NOW() WHERE number = ?',
      [status, customer || '', req.params.number])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/tables/:id', auth, async (req, res) => {
  try {
    const { status, customer } = req.body
    await pool.query('UPDATE tables_list SET status = ?, customer = ?, updated_at = NOW() WHERE id = ?',
      [status, customer || '', req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── TRANSACTIONS ──
app.get('/api/transactions', auth, async (req, res) => {
  try {
    const [transactions] = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC')
    const [items] = await pool.query('SELECT * FROM transaction_items')
    res.json(transactions.map(t => ({ ...t, items: items.filter(i => i.transaction_id === t.id) })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/transactions', auth, async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { customer_name, table_no, total, amount_paid, change_amount, discount_type, discount_amount, payment_method, cashier_name, created_by, items, shift_id } = req.body
    const [result] = await conn.query(
      'INSERT INTO transactions (customer_name, table_no, total, amount_paid, change_amount, discount_type, discount_amount, payment_method, cashier_name, created_by, shift_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_name, table_no, total, amount_paid, change_amount, discount_type || 'None', discount_amount || 0, payment_method || 'Cash', cashier_name || 'Cashier', created_by || 'Cashier', shift_id || null]
    )
    const transactionId = result.insertId
    for (const item of items) {
      await conn.query('INSERT INTO transaction_items (transaction_id, item_name, price, qty, subtotal) VALUES (?, ?, ?, ?, ?)',
        [transactionId, item.name, item.price, item.qty, item.price * item.qty])
      await conn.query('UPDATE menu_items SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [item.qty, item.id])
    }
    await conn.commit()
    res.json({ id: transactionId, success: true })
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }) }
  finally { conn.release() }
})

app.put('/api/transactions/:id/void', auth, async (req, res) => {
  try {
    const { void_reason, void_by } = req.body
    await pool.query('UPDATE transactions SET voided = 1, void_reason = ?, void_by = ? WHERE id = ?',
      [void_reason || '', void_by || 'Cashier', req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/transactions', auth, adminOnly, async (req, res) => {
  try {
    await pool.query('DELETE FROM transaction_items')
    await pool.query('DELETE FROM transactions')
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── SHIFTS ──
app.get('/api/shifts', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM shifts ORDER BY opened_at DESC LIMIT 50')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/shifts/active', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM shifts WHERE cashier_id = ? AND status = "Open" ORDER BY opened_at DESC LIMIT 1',
      [req.user.id])
    res.json(rows[0] || null)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/shifts/open', auth, async (req, res) => {
  try {
    const { opening_cash } = req.body
    const [existing] = await pool.query('SELECT id FROM shifts WHERE cashier_id = ? AND status = "Open"', [req.user.id])
    if (existing.length > 0) return res.status(400).json({ error: 'You already have an open shift!' })
    const [result] = await pool.query(
      'INSERT INTO shifts (cashier_id, cashier_name, opening_cash, status, opened_at) VALUES (?, ?, ?, "Open", NOW())',
      [req.user.id, req.user.username, opening_cash || 0])
    res.json({ id: result.insertId, success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/shifts/:id/close', auth, async (req, res) => {
  try {
    const { closing_cash } = req.body
    const [rows] = await pool.query('SELECT * FROM shifts WHERE id = ? AND cashier_id = ?', [req.params.id, req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'Shift not found' })
    const [txRows] = await pool.query(
      'SELECT SUM(total) as total_sales, COUNT(*) as tx_count FROM transactions WHERE shift_id = ? AND voided = 0',
      [req.params.id])
    const totalSales = txRows[0].total_sales || 0
    const txCount = txRows[0].tx_count || 0
    await pool.query('UPDATE shifts SET status = "Closed", closing_cash = ?, total_sales = ?, transaction_count = ?, closed_at = NOW() WHERE id = ?',
      [closing_cash || 0, totalSales, txCount, req.params.id])
    res.json({ success: true, totalSales, txCount })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── KITCHEN ──
app.get('/api/kitchen/orders', auth, async (req, res) => {
  try {
    const [orders] = await pool.query('SELECT * FROM kitchen_orders WHERE status != "Served" ORDER BY created_at ASC')
    const [items] = await pool.query(
      'SELECT * FROM kitchen_order_items WHERE order_id IN (SELECT id FROM kitchen_orders WHERE status != "Served")')
    res.json(orders.map(o => ({ ...o, items: items.filter(i => i.order_id === o.id) })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/kitchen/orders', auth, async (req, res) => {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const { table_no, cashier_name, items } = req.body
    const [result] = await conn.query(
      'INSERT INTO kitchen_orders (table_no, cashier_name, status, created_at) VALUES (?, ?, "Pending", NOW())',
      [table_no, cashier_name])
    const orderId = result.insertId
    for (const item of items) {
      await conn.query('INSERT INTO kitchen_order_items (order_id, item_name, qty, notes) VALUES (?, ?, ?, ?)',
        [orderId, item.name, item.qty, item.notes || ''])
    }
    await conn.commit()
    res.json({ id: orderId, success: true })
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }) }
  finally { conn.release() }
})

app.put('/api/kitchen/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    await pool.query('UPDATE kitchen_orders SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── LOW STOCK ALERTS ──
app.get('/api/alerts/low-stock', auth, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE stock <= ? AND stock > 0 AND status = "Available" ORDER BY stock ASC', [threshold])
    const [outRows] = await pool.query('SELECT * FROM menu_items WHERE stock = 0 AND status = "Available"')
    res.json({ lowStock: rows, outOfStock: outRows })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✅ Bistro POS Backend running on http://localhost:${PORT}`))