const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

dotenv.config()

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'bistro_secret_key_change_in_production'

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '10mb' }))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

pool.connect()
  .then(client => { console.log('✅ Connected to PostgreSQL database!'); client.release() })
  .catch(err => console.error('❌ DB Error:', err.message))

const query = async (text, params) => {
  const res = await pool.query(text, params)
  return [res.rows, res]
}

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
    const [rows] = await query("SELECT * FROM users WHERE username = $1 AND status = 'Active'", [username])
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })
    const user = rows[0]
    let valid = false
    if (user.password.startsWith('$2')) {
      valid = await bcrypt.compare(password, user.password)
    } else {
      valid = user.password === password
      if (valid) {
        const hashed = await bcrypt.hash(password, 10)
        await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id])
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
    const [rows] = await query('SELECT id, username, email, role, status, created_at FROM users')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, email, role } = req.body
    const hashed = await bcrypt.hash(password, 10)
    const [rows] = await query(
      "INSERT INTO users (username, password, email, role, status) VALUES ($1, $2, $3, $4, 'Active') RETURNING id",
      [username, hashed, email || '', role]
    )
    res.json({ id: rows[0].id, username, email: email || '', role, status: 'Active' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/users/:id', auth, async (req, res) => {
  try {
    const { email, password, currentPassword } = req.body
    if (req.user.role !== 'Admin' && req.user.id !== parseInt(req.params.id))
      return res.status(403).json({ error: 'Unauthorized' })
    if (password) {
      const [rows] = await query('SELECT password FROM users WHERE id = $1', [req.params.id])
      if (!rows.length) return res.status(404).json({ error: 'User not found' })
      if (currentPassword) {
        let valid = rows[0].password.startsWith('$2')
          ? await bcrypt.compare(currentPassword, rows[0].password)
          : rows[0].password === currentPassword
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect!' })
      }
      const hashed = await bcrypt.hash(password, 10)
      await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.params.id])
    }
    if (email !== undefined) await query('UPDATE users SET email = $1 WHERE id = $2', [email || '', req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/users/:id', auth, adminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ error: 'Cannot delete yourself!' })
    await query('DELETE FROM users WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── MENU ──
app.get('/api/menu', auth, async (req, res) => {
  try {
    const [rows] = await query("SELECT id, name, price, category, status, stock, image FROM menu_items WHERE status = 'Available'")
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/menu', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, category, image, stock } = req.body
    const [rows] = await query(
      "INSERT INTO menu_items (name, price, category, image, status, stock) VALUES ($1, $2, $3, $4, 'Available', $5) RETURNING id",
      [name, price, category, image || null, stock ?? 0]
    )
    res.json({ id: rows[0].id, name, price, category, image: image || null, status: 'Available', stock: stock ?? 0 })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/menu/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, category, image, stock } = req.body
    await query('UPDATE menu_items SET name = $1, price = $2, category = $3, image = $4, stock = $5 WHERE id = $6',
      [name, price, category, image || null, stock ?? 0, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/menu/:id', auth, adminOnly, async (req, res) => {
  try {
    await query("UPDATE menu_items SET status = 'Unavailable' WHERE id = $1", [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── TABLES ──
app.get('/api/tables', auth, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM tables_list ORDER BY number')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/tables/number/:number', auth, async (req, res) => {
  try {
    const { status, customer } = req.body
    await query('UPDATE tables_list SET status = $1, customer = $2, updated_at = NOW() WHERE number = $3',
      [status, customer || '', req.params.number])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/tables/:id', auth, async (req, res) => {
  try {
    const { status, customer } = req.body
    await query('UPDATE tables_list SET status = $1, customer = $2, updated_at = NOW() WHERE id = $3',
      [status, customer || '', req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── TRANSACTIONS ──
app.get('/api/transactions', auth, async (req, res) => {
  try {
    const [transactions] = await query('SELECT * FROM transactions ORDER BY created_at DESC')
    const [items] = await query('SELECT * FROM transaction_items')
    res.json(transactions.map(t => ({
      ...t,
      items: items.filter(i => i.transaction_id === t.id)
    })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/transactions', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const {
      customer_name, table_no, total, amount_paid, change_amount,
      discount_type, discount_amount, payment_method, cashier_name,
      created_by, items, shift_id
    } = req.body

    const result = await client.query(
      'INSERT INTO transactions (customer_name, table_no, total, amount_paid, change_amount, discount_type, discount_amount, payment_method, cashier_name, created_by, shift_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [customer_name, table_no, total, amount_paid, change_amount,
       discount_type || 'None', discount_amount || 0,
       payment_method || 'Cash', cashier_name || 'Cashier',
       created_by || 'Cashier', shift_id || null]
    )
    const transactionId = result.rows[0].id

    for (const item of items) {
      const itemName = String(item.name || '').trim()
      const itemPrice = Number(item.price) || 0
      const itemQty = Number(item.qty) || 1
      await client.query(
        'INSERT INTO transaction_items (transaction_id, item_name, price, qty, subtotal) VALUES ($1,$2,$3,$4,$5)',
        [transactionId, itemName, itemPrice, itemQty, itemPrice * itemQty]
      )
      await client.query(
        'UPDATE menu_items SET stock = GREATEST(stock - $1, 0) WHERE id = $2',
        [itemQty, item.id]
      )
    }

    await client.query('COMMIT')
    res.json({ id: transactionId, success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Transaction error:', err.message)
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.put('/api/transactions/:id/void', auth, async (req, res) => {
  try {
    const { void_reason, void_by } = req.body
    await query('UPDATE transactions SET voided = 1, void_reason = $1, void_by = $2 WHERE id = $3',
      [void_reason || '', void_by || 'Cashier', req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/transactions', auth, adminOnly, async (req, res) => {
  try {
    await query('DELETE FROM transaction_items')
    await query('DELETE FROM transactions')
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── SHIFTS ──
app.get('/api/shifts', auth, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM shifts ORDER BY opened_at DESC LIMIT 50')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/shifts/active', auth, async (req, res) => {
  try {
    const [rows] = await query(
      "SELECT * FROM shifts WHERE cashier_id = $1 AND status = 'Open' ORDER BY opened_at DESC LIMIT 1",
      [req.user.id])
    res.json(rows[0] || null)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/shifts/open', auth, async (req, res) => {
  try {
    const { opening_cash } = req.body
    const [existing] = await query("SELECT id FROM shifts WHERE cashier_id = $1 AND status = 'Open'", [req.user.id])
    if (existing.length > 0) return res.status(400).json({ error: 'You already have an open shift!' })
    const [rows] = await query(
      "INSERT INTO shifts (cashier_id, cashier_name, opening_cash, status, opened_at) VALUES ($1,$2,$3,'Open',NOW()) RETURNING id",
      [req.user.id, req.user.username, opening_cash || 0])
    res.json({ id: rows[0].id, success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/shifts/:id/close', auth, async (req, res) => {
  try {
    const { closing_cash } = req.body
    const [rows] = await query('SELECT * FROM shifts WHERE id = $1 AND cashier_id = $2', [req.params.id, req.user.id])
    if (!rows.length) return res.status(404).json({ error: 'Shift not found' })
    const [txRows] = await query(
      'SELECT SUM(total) as total_sales, COUNT(*) as tx_count FROM transactions WHERE shift_id = $1 AND voided = 0',
      [req.params.id])
    const totalSales = txRows[0].total_sales || 0
    const txCount = txRows[0].tx_count || 0
    await query(
      "UPDATE shifts SET status = 'Closed', closing_cash = $1, total_sales = $2, transaction_count = $3, closed_at = NOW() WHERE id = $4",
      [closing_cash || 0, totalSales, txCount, req.params.id])
    res.json({ success: true, totalSales, txCount })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── KITCHEN ──
app.get('/api/kitchen/orders', auth, async (req, res) => {
  try {
    const [orders] = await query("SELECT * FROM kitchen_orders WHERE status != 'Served' ORDER BY created_at ASC")
    const [items] = await query(
      "SELECT * FROM kitchen_order_items WHERE order_id IN (SELECT id FROM kitchen_orders WHERE status != 'Served')")
    res.json(orders.map(o => ({ ...o, items: items.filter(i => i.order_id === o.id) })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/kitchen/orders', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { table_no, cashier_name, items } = req.body
    const result = await client.query(
      "INSERT INTO kitchen_orders (table_no, cashier_name, status, created_at) VALUES ($1,$2,'Pending',NOW()) RETURNING id",
      [table_no, cashier_name])
    const orderId = result.rows[0].id
    for (const item of items) {
      await client.query(
        'INSERT INTO kitchen_order_items (order_id, item_name, qty, notes) VALUES ($1,$2,$3,$4)',
        [orderId, item.name, item.qty, item.notes || ''])
    }
    await client.query('COMMIT')
    res.json({ id: orderId, success: true })
  } catch (err) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }) }
  finally { client.release() }
})

app.put('/api/kitchen/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    await query('UPDATE kitchen_orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── LOW STOCK ALERTS ──
app.get('/api/alerts/low-stock', auth, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10
    const [rows] = await query(
      "SELECT * FROM menu_items WHERE stock <= $1 AND stock > 0 AND status = 'Available' ORDER BY stock ASC",
      [threshold])
    const [outRows] = await query("SELECT * FROM menu_items WHERE stock = 0 AND status = 'Available'")
    res.json({ lowStock: rows, outOfStock: outRows })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✅ Bistro POS Backend running on http://localhost:${PORT}`))