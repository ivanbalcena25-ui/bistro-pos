const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
dotenv.config()

const app = express()
const JWT_SECRET = process.env.JWT_SECRET || 'bistro_secret_key_change_in_production'

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

pool.connect()
  .then(client => { console.log('✅ Connected to PostgreSQL!'); client.release() })
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
    console.log('DEBUG login:', { received: username, rowCount: rows.length, storedPassword: rows[0]?.password, receivedPassword: password })
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' })
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
    res.json({ id: user.id, username: user.username, role: user.role, email: user.email || '', mustChangePassword: !!user.must_change_password, token })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── USERS ──
app.get('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const [rows] = await query('SELECT id, username, email, role, status, created_at FROM users ORDER BY id ASC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/users', auth, adminOnly, async (req, res) => {
  try {
    const username = String(req.body.username || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const role = req.body.role || 'Cashier'
    const mode = req.body.password_mode === 'manual' ? 'manual' : 'auto'

    if (!username) return res.status(400).json({ error: 'Username is required' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'A valid email address is required' })

    const [dupe] = await query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email])
    if (dupe.length) return res.status(400).json({ error: 'Username or email already exists' })

    const plain = mode === 'manual' ? String(req.body.password || '') : generatePassword(12)
    const pwdError = validatePassword(plain)
    if (pwdError) return res.status(400).json({ error: pwdError })

    const hashed = await bcrypt.hash(plain, 10)
    const [rows] = await query(
      "INSERT INTO users (username, password, email, role, status, must_change_password) VALUES ($1,$2,$3,$4,'Active',TRUE) RETURNING id",
      [username, hashed, email, role]
    )

    let email_sent = false
    let email_error = null
    try {
      await sendCredentials({ to: email, username, password: plain, role })
      email_sent = true
    } catch (e) {
      email_error = e.message
    }

    res.json({
      id: rows[0].id, username, email, role, status: 'Active',
      email_sent, email_error,
      temp_password: email_sent ? undefined : plain,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/users/:id', auth, async (req, res) => {
  try {
    const targetId = parseInt(req.params.id)
    const isAdmin = req.user.role === 'Admin'
    if (!isAdmin && req.user.id !== targetId) return res.status(403).json({ error: 'Unauthorized' })

    const [found] = await query('SELECT id, username, email, role, password FROM users WHERE id = $1', [targetId])
    if (!found.length) return res.status(404).json({ error: 'User not found' })
    const target = found[0]

    const { email, currentPassword, notify } = req.body
    const mode = req.body.password_mode === 'auto' ? 'auto' : (req.body.password ? 'manual' : null)
    const isSelf = req.user.id === targetId

    let plain = null
    if (mode === 'auto' && isAdmin) plain = generatePassword(12)
    else if (mode === 'manual') plain = String(req.body.password || '')

    if (plain !== null) {
      const pwdError = validatePassword(plain)
      if (pwdError) return res.status(400).json({ error: pwdError })
      if (!isAdmin) {
        if (!currentPassword) return res.status(400).json({ error: 'Current password is required' })
        const valid = target.password.startsWith('$2')
          ? await bcrypt.compare(currentPassword, target.password)
          : target.password === currentPassword
        if (!valid) return res.status(400).json({ error: 'Current password is incorrect' })
      }
      // Self-chosen password → no longer forced to change it. Admin resetting
      // someone else's password → flag them to change it on next login.
      await query(
        'UPDATE users SET password = $1, must_change_password = $2 WHERE id = $3',
        [await bcrypt.hash(plain, 10), !isSelf, targetId]
      )
    }

    let newEmail = target.email
    if (email !== undefined) {
      newEmail = String(email || '').trim().toLowerCase()
      if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail))
        return res.status(400).json({ error: 'Invalid email address' })
      await query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, targetId])
    }

    let email_sent = false
    let email_error = null
    if (plain !== null && notify) {
      try {
        await sendCredentials({ to: newEmail, username: target.username, password: plain, role: target.role, isReset: true })
        email_sent = true
      } catch (e) { email_error = e.message }
    }

    res.json({
      success: true, email_sent, email_error,
      temp_password: (plain !== null && notify && !email_sent) ? plain : undefined,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})


// ── MENU ──
app.get('/api/menu', auth, async (req, res) => {
  try {
    const [rows] = await query(
      "SELECT id, name, price, category, status, stock, image FROM menu_items WHERE status IS NULL OR status = 'Available' ORDER BY category, name ASC"
    )
    const normalized = rows.map(r => ({ ...r, status: r.status || 'Available' }))
    res.json(normalized)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/menu', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, category, image, stock } = req.body
    const [rows] = await query(
      "INSERT INTO menu_items (name, price, category, image, status, stock) VALUES ($1,$2,$3,$4,'Available',$5) RETURNING id",
      [name, price, category, image || null, stock ?? 0]
    )
    res.json({ id: rows[0].id, name, price, category, image: image || null, status: 'Available', stock: stock ?? 0 })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/menu/:id', auth, adminOnly, async (req, res) => {
  try {
    const { name, price, category, image, stock, status } = req.body
    await query(
      'UPDATE menu_items SET name=$1, price=$2, category=$3, image=$4, stock=$5, status=$6, updated_at=NOW() WHERE id=$7',
      [name, price, category, image || null, stock ?? 0, status || 'Available', req.params.id]
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/menu/:id', auth, adminOnly, async (req, res) => {
  try {
    await query("UPDATE menu_items SET status='Unavailable' WHERE id=$1", [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── TABLES ──
app.get('/api/tables', auth, async (req, res) => {
  try {
    const [rows] = await query('SELECT * FROM tables_list ORDER BY number ASC')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/tables', auth, adminOnly, async (req, res) => {
  try {
    const [existing] = await query('SELECT MAX(number) AS max FROM tables_list')
    const nextNumber = (existing[0].max || 0) + 1
    const [rows] = await query(
      "INSERT INTO tables_list (number, status, capacity) VALUES ($1, 'Available', 4) RETURNING *",
      [nextNumber]
    )
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/tables/:id', auth, adminOnly, async (req, res) => {
  try {
    await query('DELETE FROM tables_list WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/tables/number/:number', auth, async (req, res) => {
  try {
    const { status, customer } = req.body
    await query(
      'UPDATE tables_list SET status=$1, customer=$2, updated_at=NOW() WHERE number=$3',
      [status, customer || '', req.params.number]
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/tables/:id', auth, async (req, res) => {
  try {
    const { status, customer } = req.body
    await query(
      'UPDATE tables_list SET status=$1, customer=$2, updated_at=NOW() WHERE id=$3',
      [status, customer || '', req.params.id]
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── TRANSACTIONS ──
app.get('/api/transactions', auth, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  try {
    const [rows] = await query(`
      SELECT
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',             ti.id,
              'transaction_id', ti.transaction_id,
              'item_name',      ti.item_name,
              'price',          ti.price,
              'qty',            ti.qty,
              'subtotal',       ti.subtotal
            ) ORDER BY ti.id
          ) FILTER (WHERE ti.id IS NOT NULL),
          '[]'
        ) AS items
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/transactions/:id', auth, async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT
        t.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',             ti.id,
              'transaction_id', ti.transaction_id,
              'item_name',      ti.item_name,
              'price',          ti.price,
              'qty',            ti.qty,
              'subtotal',       ti.subtotal
            ) ORDER BY ti.id
          ) FILTER (WHERE ti.id IS NOT NULL),
          '[]'
        ) AS items
      FROM transactions t
      LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Transaction not found' })
    res.json(rows[0])
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

    if (!items || !Array.isArray(items) || items.length === 0) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'No items provided' })
    }

    const result = await client.query(
      `INSERT INTO transactions
        (customer_name, table_no, total, amount_paid, change_amount,
         discount_type, discount_amount, payment_method, cashier_name,
         created_by, shift_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        customer_name, table_no, total, amount_paid, change_amount,
        discount_type || 'None', discount_amount || 0,
        payment_method || 'Cash', cashier_name || 'Cashier',
        created_by || 'Cashier', shift_id || null
      ]
    )
    const transactionId = result.rows[0].id

    for (const item of items) {
      const itemName = String(item.name || '').trim()
      const itemPrice = Number(item.price) || 0
      const itemQty = Number(item.qty) || 1
      const itemId = Number(item.id)

      await client.query(
        'INSERT INTO transaction_items (transaction_id, item_name, price, qty, subtotal) VALUES ($1,$2,$3,$4,$5)',
        [transactionId, itemName, itemPrice, itemQty, itemPrice * itemQty]
      )

      if (itemId && itemId > 0) {
        await client.query(
          'UPDATE menu_items SET stock = GREATEST(stock - $1, 0) WHERE id = $2',
          [itemQty, itemId]
        )
      }
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
    await query(
      'UPDATE transactions SET voided=1, void_reason=$1, void_by=$2 WHERE id=$3',
      [void_reason || '', void_by || 'Cashier', req.params.id]
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/transactions', auth, adminOnly, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM transaction_items')
    await client.query('DELETE FROM transactions')
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
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
      "SELECT * FROM shifts WHERE cashier_id=$1 AND status='Open' ORDER BY opened_at DESC LIMIT 1",
      [req.user.id]
    )
    res.json(rows[0] || null)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/shifts/open', auth, async (req, res) => {
  try {
    const { opening_cash } = req.body
    const [existing] = await query(
      "SELECT id FROM shifts WHERE cashier_id=$1 AND status='Open'",
      [req.user.id]
    )
    if (existing.length > 0) return res.status(400).json({ error: 'You already have an open shift!' })
    const [rows] = await query(
      "INSERT INTO shifts (cashier_id, cashier_name, opening_cash, status, opened_at) VALUES ($1,$2,$3,'Open',NOW()) RETURNING id",
      [req.user.id, req.user.username, opening_cash || 0]
    )
    res.json({ id: rows[0].id, success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/shifts/:id/close', auth, async (req, res) => {
  try {
    const { closing_cash } = req.body
    const [rows] = await query(
      'SELECT * FROM shifts WHERE id=$1 AND cashier_id=$2',
      [req.params.id, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Shift not found' })
    const [txRows] = await query(
      'SELECT COALESCE(SUM(total),0) AS total_sales, COUNT(*) AS tx_count FROM transactions WHERE shift_id=$1 AND voided=0',
      [req.params.id]
    )
    const totalSales = txRows[0].total_sales || 0
    const txCount = txRows[0].tx_count || 0
    await query(
      "UPDATE shifts SET status='Closed', closing_cash=$1, total_sales=$2, transaction_count=$3, closed_at=NOW() WHERE id=$4",
      [closing_cash || 0, totalSales, txCount, req.params.id]
    )
    res.json({ success: true, totalSales, txCount })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── KITCHEN ──
app.get('/api/kitchen/orders', auth, async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT
        ko.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id',        koi.id,
              'order_id',  koi.order_id,
              'item_name', koi.item_name,
              'qty',       koi.qty,
              'notes',     koi.notes
            ) ORDER BY koi.id
          ) FILTER (WHERE koi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM kitchen_orders ko
      LEFT JOIN kitchen_order_items koi ON koi.order_id = ko.id
      WHERE ko.status != 'Served'
      GROUP BY ko.id
      ORDER BY ko.created_at ASC
    `)
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/kitchen/orders', auth, async (req, res) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { table_no, cashier_name, items } = req.body
    const result = await client.query(
      "INSERT INTO kitchen_orders (table_no, cashier_name, status, created_at) VALUES ($1,$2,'Pending',NOW()) RETURNING id",
      [table_no, cashier_name]
    )
    const orderId = result.rows[0].id
    for (const item of items) {
      await client.query(
        'INSERT INTO kitchen_order_items (order_id, item_name, qty, notes) VALUES ($1,$2,$3,$4)',
        [orderId, item.name, item.qty, item.notes || '']
      )
    }
    await client.query('COMMIT')
    res.json({ id: orderId, success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: err.message })
  } finally {
    client.release()
  }
})

app.put('/api/kitchen/orders/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    await query(
      'UPDATE kitchen_orders SET status=$1, updated_at=NOW() WHERE id=$2',
      [status, req.params.id]
    )
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ── LOW STOCK ALERTS ──
app.get('/api/alerts/low-stock', auth, async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 10
    const [rows] = await query(
      `SELECT id, name, category, stock,
        CASE WHEN stock = 0 THEN 'out' ELSE 'low' END AS alert_type
       FROM menu_items
       WHERE stock <= $1 AND (status IS NULL OR status = 'Available')
       ORDER BY stock ASC`,
      [threshold]
    )
    res.json({
      lowStock: rows.filter(r => r.alert_type === 'low' && r.stock > 0),
      outOfStock: rows.filter(r => r.alert_type === 'out')
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`✅ Bistro POS Backend running on http://localhost:${PORT}`))

// ── GOOGLE SMTP MAILER ─────────────────────────────────────────────
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''
const APP_NAME  = process.env.APP_NAME  || 'VS Hotel Bistro POS'
const APP_URL   = process.env.APP_URL   || 'http://localhost:5173'

const mailer = (SMTP_USER && SMTP_PASS)
  ? nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null

if (mailer) {
  mailer.verify()
    .then(() => console.log('Google SMTP ready as ' + SMTP_USER))
    .catch(err => console.error('SMTP verify failed:', err.message))
} else {
  console.warn('SMTP not configured — set SMTP_USER and SMTP_PASS in .env')
}

const generatePassword = (len = 12) => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '@#$%&*'
  const all = letters + digits + symbols
  const bytes = crypto.randomBytes(len)
  let out = ''
  for (let i = 0; i < len; i++) out += all[bytes[i] % all.length]
  // Guarantee at least one digit and one symbol so every auto-generated
  // password satisfies validatePassword() below, no matter the random draw.
  const pick = (set, seedByte) => set[seedByte % set.length]
  out = pick(symbols, bytes[0]) + pick(digits, bytes[1]) + out.slice(2)
  return out
}

// Security rule: at least 8 characters and at least one symbol (non-alphanumeric).
const validatePassword = (pwd) => {
  if (!pwd || pwd.length < 8) return 'Password must be at least 8 characters.'
  if (!/[^A-Za-z0-9]/.test(pwd)) return 'Password must include at least one symbol (e.g. ! @ # $ %).'
  return null
}

const credentialsHtml = ({ username, password, role, isReset }) => `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;border:1px solid #d1fae5;border-radius:14px;overflow:hidden">
  <div style="background:#052e16;padding:22px 26px">
    <div style="color:#4ade80;font-size:20px;font-weight:800;letter-spacing:3px;text-transform:uppercase">BISTRO</div>
    <div style="color:rgba(255,255,255,0.55);font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px">${APP_NAME}</div>
  </div>
  <div style="padding:26px;color:#0a2e18">
    <h2 style="margin:0 0 12px;font-size:18px">${isReset ? 'Your password was reset' : 'Your account has been created'}</h2>
    <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#1a5c35">
      ${isReset
        ? 'An administrator reset the password for your account. Use the credentials below to sign in.'
        : 'An administrator created a POS account for you. Use the credentials below to sign in.'}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:9px 0;color:#5a9a72">Username</td><td style="padding:9px 0;text-align:right;font-weight:700">${username}</td></tr>
      <tr><td style="padding:9px 0;color:#5a9a72">Password</td><td style="padding:9px 0;text-align:right;font-weight:700;font-family:monospace;font-size:15px">${password}</td></tr>
      <tr><td style="padding:9px 0;color:#5a9a72">Role</td><td style="padding:9px 0;text-align:right;font-weight:700">${role}</td></tr>
    </table>
    <p style="margin:20px 0 0">
      <a href="${APP_URL}/login" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:700;font-size:14px">Sign in now</a>
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#5a9a72;line-height:1.6">
      For security, change this password after your first sign in from the profile menu.
      If you did not expect this email, contact your administrator.
    </p>
  </div>
</div>`

const sendCredentials = async ({ to, username, password, role, isReset = false }) => {
  if (!mailer) throw new Error('SMTP is not configured on the server')
  if (!to) throw new Error('No email address on file for this user')
  await mailer.sendMail({
    from: `"${APP_NAME}" <${SMTP_USER}>`,
    to,
    subject: isReset ? `${APP_NAME} — your password was reset` : `${APP_NAME} — your account credentials`,
    html: credentialsHtml({ username, password, role, isReset }),
  })
}
