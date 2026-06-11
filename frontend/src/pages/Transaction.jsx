import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { FaPrint, FaTimes, FaFileAlt, FaQrcode, FaCog, FaPlus, FaTrash } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import {
  getMenu, getTables, updateTableByNumber,
  addTransaction, getTransactions, voidTransaction,
  getActiveShift, openShift, closeShift, addKitchenOrder,
  getLowStockAlerts
} from '../api'

const categoryIcons = { Coffee: '☕', 'Non-Coffee': '🧃', Beer: '🍺', Pulutan: '🍗' }
const categories = ['Coffee', 'Non-Coffee', 'Beer', 'Pulutan']
const DEFAULT_DISCOUNTS = {
  'None': 0, 'Senior (20%)': 0.20, 'PWD (20%)': 0.20,
  'Employee (15%)': 0.15, 'Happy Hour (10%)': 0.10, 'Promo (5%)': 0.05,
}
const DEFAULT_QR = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/220px-QR_code_for_mobile_English_Wikipedia.svg.png'
const E_WALLETS = ['GCash', 'Maya', 'ShopeePay', 'GrabPay']
const TOTAL_TABLES = 10

const loadSettings = () => {
  try { const s = localStorage.getItem('pos_settings'); if (s) return JSON.parse(s) } catch {}
  return {
    qrImages: { GCash: DEFAULT_QR, Maya: DEFAULT_QR, ShopeePay: DEFAULT_QR, GrabPay: DEFAULT_QR },
    discounts: Object.entries(DEFAULT_DISCOUNTS).map(([label, rate]) => ({ label, rate: rate * 100 })),
    vatEnabled: false, vatRate: 12,
  }
}
const saveSettings = (s) => localStorage.setItem('pos_settings', JSON.stringify(s))

const formatCashInput = (raw) => {
  if (raw === '') return ''
  const parts = raw.split('.')
  parts[0] = Number(parts[0]).toLocaleString('en-PH')
  return parts.length > 1 ? parts[0] + '.' + parts[1] : parts[0]
}

function Transaction() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [showCart, setShowCart] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [settings, setSettings] = useState(loadSettings)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [tmpSettings, setTmpSettings] = useState(null)
  const [availableItems, setAvailableItems] = useState([])
  const [tables, setTables] = useState([])
  const [cart, setCart] = useState([])
  const [tableNo, setTableNo] = useState('')
  const [tableError, setTableError] = useState('')
  const [amountPaid, setAmountPaid] = useState('')
  const [amountPaidDisplay, setAmountPaidDisplay] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [receipt, setReceipt] = useState(null)
  const [activeCategory, setActiveCategory] = useState('Coffee')
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [showZReading, setShowZReading] = useState(false)
  const [showXReading, setShowXReading] = useState(false)
  const [allTransactions, setAllTransactions] = useState([])
  const [lastTxId, setLastTxId] = useState(null)
  const [lastTableNo, setLastTableNo] = useState(null)
  const [showQRModal, setShowQRModal] = useState(false)
  const [activeShift, setActiveShift] = useState(null)
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
  const [openingCashDisplay, setOpeningCashDisplay] = useState('')
  const [closingCash, setClosingCash] = useState('')
  const [closingCashDisplay, setClosingCashDisplay] = useState('')
  const [lowStockAlerts, setLowStockAlerts] = useState({ lowStock: [], outOfStock: [] })
  const [showAlerts, setShowAlerts] = useState(false)
  const [loadingMenu, setLoadingMenu] = useState(true)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [loadingVoid, setLoadingVoid] = useState(false)
  const [error, setError] = useState('')
  const [showReprintModal, setShowReprintModal] = useState(false)
  const [reprintTxId, setReprintTxId] = useState('')

  const activeShiftRef = useRef(null)

  const qrRefGCash = useRef(); const qrRefMaya = useRef()
  const qrRefShopeePay = useRef(); const qrRefGrabPay = useRef()
  const qrInputRefs = { GCash: qrRefGCash, Maya: qrRefMaya, ShopeePay: qrRefShopeePay, GrabPay: qrRefGrabPay }

  const loadMenu = useCallback(async () => {
    setLoadingMenu(true)
    try {
      const d = await getMenu()
      setAvailableItems(Array.isArray(d) ? d.filter(i => i.status !== 'Unavailable') : [])
    } catch (e) { setError('Failed to load menu: ' + e.message) }
    setLoadingMenu(false)
  }, [])

  const loadTablesSilent = useCallback(async () => {
    try { const d = await getTables(); setTables(Array.isArray(d) ? d : []) } catch {}
  }, [])

  const loadTransactions = useCallback(async () => {
    try { const d = await getTransactions(); setAllTransactions(Array.isArray(d) ? d : []) } catch {}
  }, [])

  const loadActiveShift = useCallback(async () => {
    try {
      const s = await getActiveShift()
      setActiveShift(s)
      activeShiftRef.current = s
    } catch {}
  }, [])

  const loadAlertsSilent = useCallback(async () => {
    try { const a = await getLowStockAlerts(10); setLowStockAlerts(a) } catch {}
  }, [])

  useEffect(() => {
    Promise.all([loadMenu(), loadTablesSilent(), loadTransactions(), loadActiveShift(), loadAlertsSilent()])
    const interval = setInterval(() => { loadTablesSilent(); loadAlertsSilent() }, 8000)
    const shiftInterval = setInterval(() => { loadActiveShift() }, 30000)
    return () => { clearInterval(interval); clearInterval(shiftInterval) }
  }, [])

  const getDiscountMap = () => {
    const map = {}
    settings.discounts.forEach(d => { map[d.label] = d.rate / 100 })
    return map
  }

  const getTableStatus = useCallback((num) => {
    const t = tables.find(t => t.number === num)
    return t ? t.status : 'Available'
  }, [tables])

  const handleTableChange = (e) => {
    const val = e.target.value
    setTableNo(val)
    setTableError('')
    if (val) {
      const num = parseInt(val)
      if (num < 1 || num > TOTAL_TABLES) { setTableError(`Table must be 1–${TOTAL_TABLES}.`); return }
      if (getTableStatus(num) === 'Occupied') setTableError(`Table ${num} is occupied!`)
    }
  }

  const addToCart = useCallback(async (item) => {
    const currentShift = activeShiftRef.current
    if (!currentShift) { alert('No active shift! Please open a shift first.'); return }
    if ((item.stock ?? 0) === 0) return
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id)
      const currentQty = exists ? exists.qty : 0
      if (currentQty >= (item.stock ?? 999)) { alert(`Only ${item.stock} left in stock!`); return prev }
      if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, {
        id: item.id, name: item.name, price: item.price,
        category: item.category, stock: item.stock, status: item.status,
        imageUrl: item.image || null, qty: 1, discount: 'None'
      }]
    })
    if (isMobile) setShowCart(true)
  }, [isMobile])

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c
      const newQty = c.qty + delta
      if (newQty < 1) return c
      if (newQty > (c.stock ?? 999)) { alert(`Only ${c.stock} left in stock!`); return c }
      return { ...c, qty: newQty }
    }))
  }, [])

  const updateItemDiscount = useCallback((id, discount) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, discount } : c))
  }, [])

  const removeFromCart = useCallback((id) => {
    setCart(prev => prev.filter(c => c.id !== id))
  }, [])

  const getItemSubtotal = (item) => item.price * item.qty
  const getItemDiscountAmt = (item) => { const map = getDiscountMap(); return getItemSubtotal(item) * (map[item.discount || 'None'] || 0) }
  const getItemTotal = (item) => getItemSubtotal(item) - getItemDiscountAmt(item)
  const getSubtotalBeforeVat = () => cart.reduce((sum, c) => sum + getItemTotal(c), 0)
  const getVatAmount = () => settings.vatEnabled ? getSubtotalBeforeVat() * (settings.vatRate / 100) : 0
  const getTotal = () => getSubtotalBeforeVat() + getVatAmount()
  const getChange = () => Math.max(0, parseFloat(amountPaid || 0) - getTotal())

  const handleAmountPaidChange = (e) => {
    const raw = e.target.value.replace(/,/g, '')
    if (!/^\d*\.?\d*$/.test(raw)) return
    setAmountPaid(raw); setAmountPaidDisplay(formatCashInput(raw))
  }
  const handleOpeningCashChange = (e) => {
    const raw = e.target.value.replace(/,/g, '')
    if (!/^\d*\.?\d*$/.test(raw)) return
    setOpeningCash(raw); setOpeningCashDisplay(formatCashInput(raw))
  }
  const handleClosingCashChange = (e) => {
    const raw = e.target.value.replace(/,/g, '')
    if (!/^\d*\.?\d*$/.test(raw)) return
    setClosingCash(raw); setClosingCashDisplay(formatCashInput(raw))
  }

  const handleCheckout = async () => {
    setError('')
    const currentShift = activeShiftRef.current
    if (!currentShift) { alert('No active shift!'); return }
    if (!tableNo.trim()) return alert('Please enter table number!')
    const num = parseInt(tableNo)
    if (num < 1 || num > TOTAL_TABLES) return alert(`Table must be 1–${TOTAL_TABLES}.`)
    if (getTableStatus(num) === 'Occupied') return alert(`Table ${num} is occupied!`)
    if (cart.length === 0) return alert('Please add at least one item!')
    if (paymentMethod === 'Cash' && !amountPaid) return alert('Please enter amount paid!')
    if (paymentMethod === 'Cash' && parseFloat(amountPaid) < getTotal()) return alert('Insufficient payment!')

    setLoadingCheckout(true)
    const total = getTotal()
    const paid = paymentMethod === 'Cash' ? parseFloat(amountPaid) : total
    const change = paymentMethod === 'Cash' ? getChange() : 0

    try {
      const [result] = await Promise.all([
        addTransaction({
          customer_name: `Table ${num}`, table_no: num, total,
          amount_paid: paid, change_amount: change,
          discount_type: 'None', discount_amount: 0,
          vat_amount: getVatAmount(), payment_method: paymentMethod,
          cashier_name: user.username || 'Cashier',
          created_by: user.username || 'Cashier',
          shift_id: currentShift?.id || null,
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
        }),
      ])

      setLastTxId(result.id)
      setLastTableNo(num)

      Promise.all([
        addKitchenOrder({
          table_no: num, cashier_name: user.username || 'Cashier',
          items: cart.map(i => ({ name: i.name, qty: i.qty }))
        }).catch(() => {}),
        updateTableByNumber(num, { status: 'Occupied', customer: `Table ${num}` })
          .then(() => loadTablesSilent()),
        loadAlertsSilent(),
      ])

      const receiptData = {
        id: result.id, tableNo,
        items: cart.map(i => ({
          name: i.name, price: i.price, qty: i.qty,
          item_discount: i.discount || 'None',
          item_discount_amount: getItemDiscountAmt(i),
          item_total: getItemTotal(i)
        })),
        subtotal: getSubtotalBeforeVat(), vat_enabled: settings.vatEnabled,
        vat_rate: settings.vatRate, vat_amount: getVatAmount(),
        total, paid, change, payment_method: paymentMethod,
        cashier_name: user.username || 'Cashier',
        date: new Date().toLocaleString(), voided: false,
      }

      setReceipt(receiptData)
      setCart([]); setTableNo(''); setTableError('')
      setAmountPaid(''); setAmountPaidDisplay(''); setPaymentMethod('Cash')
      if (isMobile) setShowCart(false)

      if (E_WALLETS.includes(paymentMethod)) setShowQRModal(true)
      else setTimeout(() => printReceipt(receiptData, true), 300)

      loadTransactions()

    } catch (e) { setError('Failed to save transaction! ' + e.message) }
    setLoadingCheckout(false)
  }

  const handleVoid = async () => {
    if (!voidReason.trim()) return alert('Please enter void reason!')
    if (!lastTxId) return alert('No transaction to void!')
    setLoadingVoid(true)
    try {
      await voidTransaction(lastTxId, { void_reason: voidReason, void_by: user.username || 'Cashier' })
      if (lastTableNo) {
        await updateTableByNumber(lastTableNo, { status: 'Available', customer: '' })
        loadTablesSilent()
      }
      setShowVoidModal(false); setVoidReason(''); setReceipt(null)
      setLastTxId(null); setLastTableNo(null)
      loadTransactions()
      alert(`Transaction voided! Table ${lastTableNo} is now free.`)
    } catch (e) { alert('Failed to void transaction! ' + e.message) }
    setLoadingVoid(false)
  }

  const handleOpenShift = async () => {
    try {
      const result = await openShift({ opening_cash: parseFloat(openingCash) || 0 })
      await loadActiveShift()
      setShowShiftModal(false); setOpeningCash(''); setOpeningCashDisplay('')
      alert(`Shift opened! ID: ${result.id}`)
    } catch (e) { alert('Failed to open shift: ' + e.message) }
  }

  const handleCloseShift = async () => {
    if (!activeShift) return
    if (!window.confirm('Close your current shift?')) return
    try {
      const result = await closeShift(activeShift.id, { closing_cash: parseFloat(closingCash) || 0 })
      setActiveShift(null); activeShiftRef.current = null
      setClosingCash(''); setClosingCashDisplay('')
      alert(`Shift closed!\nTotal Sales: ₱${Number(result.totalSales).toLocaleString()}\nTransactions: ${result.txCount}`)
    } catch (e) { alert('Failed to close shift: ' + e.message) }
  }

  const handleReprintById = () => {
    const id = parseInt(reprintTxId)
    const tx = allTransactions.find(t => t.id === id)
    if (!tx) return alert('Transaction not found!')
    if (tx.voided) return alert('This transaction is voided.')
    const r = {
      id: tx.id, tableNo: tx.table_no,
      items: (tx.items || []).map(i => ({
        name: i.item_name, price: i.price, qty: i.qty,
        item_discount: 'None', item_discount_amount: 0, item_total: i.price * i.qty
      })),
      subtotal: tx.total, vat_enabled: false, vat_amount: 0, vat_rate: 0,
      total: tx.total, paid: tx.amount_paid, change: tx.change_amount,
      payment_method: tx.payment_method || 'Cash', cashier_name: tx.cashier_name,
      date: new Date(tx.created_at).toLocaleString(), voided: false
    }
    printReceipt(r, true); setShowReprintModal(false); setReprintTxId('')
  }

  const openSettingsModal = () => { setTmpSettings(JSON.parse(JSON.stringify(settings))); setShowSettingsModal(true) }
  const saveSettingsAndClose = () => { setSettings(tmpSettings); saveSettings(tmpSettings); setShowSettingsModal(false) }
  const handleQrUpload = (wallet, file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setTmpSettings(prev => ({ ...prev, qrImages: { ...prev.qrImages, [wallet]: e.target.result } }))
    reader.readAsDataURL(file)
  }
  const addDiscount = () => setTmpSettings(prev => ({ ...prev, discounts: [...prev.discounts, { label: 'New Discount', rate: 10 }] }))
  const updateDiscount = (idx, field, val) => setTmpSettings(prev => { const d = [...prev.discounts]; d[idx] = { ...d[idx], [field]: val }; return { ...prev, discounts: d } })
  const removeDiscount = (idx) => setTmpSettings(prev => ({ ...prev, discounts: prev.discounts.filter((_, i) => i !== idx) }))

  const printReceipt = (r, preview = false) => {
    const receiptHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt #${r.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 302px; margin: 0 auto; padding: 10px 10px ${preview ? '80px' : '10px'}; background: white; color: #000; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 2px solid #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 4px 0; }
    .item-name { flex: 1; word-wrap: break-word; }
    .item-price { text-align: right; min-width: 70px; }
    .discount { font-size: 11px; color: #333; padding-left: 12px; margin-bottom: 2px; }
    .big { font-size: 16px; font-weight: bold; }
    .barcode { font-size: 30px; letter-spacing: 4px; margin: 8px 0; }
    @media print { body { width: 302px; padding-bottom: 10px; } @page { margin: 0; size: 80mm auto; } .preview-controls { display: none !important; } }
    .preview-controls { position: fixed; bottom: 0; left: 0; right: 0; background: #1e293b; padding: 12px 20px; display: flex; gap: 10px; justify-content: center; box-shadow: 0 -4px 12px rgba(0,0,0,0.3); }
    .btn-print { padding: 10px 28px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .btn-close { padding: 10px 28px; background: #475569; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <div class="center" style="margin-bottom:8px">
    <div class="big">VS HOTEL BISTRO</div>
    <div style="font-size:10px; margin-top:2px; letter-spacing:1px;">- - OFFICIAL RECEIPT - -</div>
  </div>
  <div class="divider"></div>
  <div class="row"><span>Transaction #:</span><span><b>TXN-${String(r.id || '').padStart(5, '0')}</b></span></div>
  <div class="row"><span>Date:</span><span>${r.date}</span></div>
  <div class="row"><span>Table:</span><span><b>Table ${r.tableNo}</b></span></div>
  <div class="row"><span>Cashier:</span><span>${r.cashier_name}</span></div>
  <div class="row"><span>Payment:</span><span><b>${r.payment_method}</b></span></div>
  <div class="divider"></div>
  <div style="font-size:11px; font-weight:bold; margin-bottom:4px;">ITEMS ORDERED:</div>
  ${r.items.map(i => `
    <div class="row">
      <span class="item-name">${i.name} x${i.qty}</span>
      <span class="item-price">&#8369;${(i.price * i.qty).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
    </div>
    ${i.item_discount && i.item_discount !== 'None'
      ? `<div class="discount">  Disc (${i.item_discount}): -&#8369;${Number(i.item_discount_amount).toFixed(2)}</div>`
      : ''}
  `).join('')}
  <div class="divider"></div>
  ${r.vat_enabled ? `
    <div class="row"><span>Subtotal</span><span>&#8369;${Number(r.subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
    <div class="row"><span>VAT (${r.vat_rate}%)</span><span>&#8369;${Number(r.vat_amount).toFixed(2)}</span></div>
  ` : ''}
  <div class="double-divider"></div>
  <div class="total-row"><span>TOTAL DUE</span><span>&#8369;${Number(r.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
  <div class="double-divider"></div>
  ${r.payment_method === 'Cash' ? `
    <div class="row"><span>Cash Tendered</span><span>&#8369;${Number(r.paid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
    <div class="row bold"><span>Change</span><span>&#8369;${Number(r.change).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
  ` : `<div class="row center" style="justify-content:center; margin:4px 0;"><span>** Paid via <b>${r.payment_method}</b> **</span></div>`}
  <div class="divider"></div>
  <div class="center" style="margin-top:8px">
    <div class="barcode">|||||||||||||||</div>
    <div style="font-size:10px; letter-spacing:2px; margin-bottom:6px;">${String(r.id || '').padStart(10, '0')}</div>
    <div style="font-size:12px; font-weight:bold;">Thank you for dining with us!</div>
    <div style="font-size:10px; margin-top:3px; color:#333;">Please come again :-)</div>
    <div style="font-size:9px; color:#555; margin-top:6px; letter-spacing:1px;">VS HOTEL BISTRO</div>
  </div>
  ${preview ? `<div class="preview-controls"><button class="btn-print" onclick="window.print()">&#128438; Print Receipt</button><button class="btn-close" onclick="window.close()">&#x2715; Close</button></div>` : ''}
</body>
</html>`
    const win = window.open('', '_blank', `width=380,height=${preview ? 700 : 600},scrollbars=yes`)
    if (!win) { alert('Pop-up blocked! Please allow pop-ups.'); return }
    win.document.write(receiptHTML)
    win.document.close()
    win.focus()
    if (!preview) { setTimeout(() => { win.print(); win.close() }, 600) }
  }

  const getStockBadge = (item) => {
    const s = item.stock ?? 0
    if (s === 0) return { label: 'Out of Stock', color: '#ef4444', bg: '#fef2f2' }
    if (s <= 10) return { label: `⚠️ ${s} left`, color: '#d97706', bg: '#fffbeb' }
    return { label: `${s} left`, color: '#16a34a', bg: '#f0fdf4' }
  }

  const getZData = () => {
    const today = new Date().toDateString()
    const todayTx = allTransactions.filter(t => new Date(t.created_at).toDateString() === today)
    const validTx = todayTx.filter(t => !t.voided)
    const cashiers = [...new Set(validTx.map(t => t.cashier_name))]
    return {
      total: validTx.reduce((s, t) => s + Number(t.total), 0),
      count: validTx.length, voided: todayTx.filter(t => t.voided).length, cashiers,
      byPayment: ['Cash', 'GCash', 'Maya', 'ShopeePay', 'GrabPay'].map(pm => ({
        method: pm,
        amount: validTx.filter(t => t.payment_method === pm).reduce((s, t) => s + Number(t.total), 0),
        count: validTx.filter(t => t.payment_method === pm).length,
      })).filter(p => p.count > 0),
      byCashier: cashiers.map(c => ({
        name: c,
        total: validTx.filter(t => t.cashier_name === c).reduce((s, t) => s + Number(t.total), 0),
        count: validTx.filter(t => t.cashier_name === c).length,
      }))
    }
  }

  const downloadZReadingExcel = () => {
    const today = new Date().toDateString()
    const todayTx = allTransactions.filter(t => new Date(t.created_at).toDateString() === today)
    const validTx = todayTx.filter(t => !t.voided); const voidedTx = todayTx.filter(t => t.voided)
    const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    const wb = XLSX.utils.book_new()
    const summaryData = [
      ['VS HOTEL BISTRO'], ['Z-READING — DAILY SALES REPORT'], [`Date: ${dateStr}`],
      [`Generated: ${new Date().toLocaleString()}`], [`Generated by: ${user.username}`], [],
      ['OVERALL SUMMARY'], ['Total Transactions', validTx.length], ['Voided Transactions', voidedTx.length],
      ['Gross Sales', validTx.reduce((s, t) => s + Number(t.total), 0)],
      ['Net Sales', validTx.reduce((s, t) => s + Number(t.total), 0)], [],
      ['PAYMENT METHOD BREAKDOWN'],
      ...['Cash', 'GCash', 'Maya', 'ShopeePay', 'GrabPay'].map(pm => {
        const pmTx = validTx.filter(t => t.payment_method === pm)
        return pmTx.length > 0 ? [pm, pmTx.length, pmTx.reduce((s, t) => s + Number(t.total), 0)] : null
      }).filter(Boolean),
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')
    const cashiers = [...new Set(validTx.map(t => t.cashier_name))]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['Cashier', 'Transactions', 'Total Sales'],
      ...cashiers.map(c => { const cTx = validTx.filter(t => t.cashier_name === c); return [c, cTx.length, cTx.reduce((s, t) => s + Number(t.total), 0)] })
    ]), 'Per Cashier')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['#', 'Time', 'Table', 'Cashier', 'Payment', 'Total', 'Status'],
      ...todayTx.map((t, i) => [i + 1, new Date(t.created_at).toLocaleTimeString(), `Table ${t.table_no}`, t.cashier_name, t.payment_method || 'Cash', t.total, t.voided ? `VOIDED: ${t.void_reason || ''}` : 'Valid'])
    ]), 'All Transactions')
    XLSX.writeFile(wb, `ZReading_${new Date().toISOString().slice(0, 10)}.xlsx`)
    setShowZReading(false)
  }

  const downloadXReadingExcel = () => {
    const now = new Date(); const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
    const currentTx = allTransactions.filter(t => new Date(t.created_at) >= startOfDay && new Date(t.created_at) <= now)
    const validTx = currentTx.filter(t => !t.voided)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
      ['VS HOTEL BISTRO'], ['X-READING — MID-DAY SNAPSHOT'], [`As of: ${now.toLocaleString()}`], [`Generated by: ${user.username}`], [],
      ['Transactions so far today', validTx.length], ['Voided', currentTx.filter(t => t.voided).length],
      ['Current Sales', validTx.reduce((s, t) => s + Number(t.total), 0)], [],
      ['NOTE: This is a non-resetting snapshot. Use Z-Reading to close the day.']
    ]), 'X-Reading')
    XLSX.writeFile(wb, `XReading_${now.toISOString().slice(0, 16).replace('T', '_')}.xlsx`)
    setShowXReading(false)
  }

  const totalAlerts = lowStockAlerts.lowStock.length + lowStockAlerts.outOfStock.length
  const filtered = availableItems.filter(i => i.category === activeCategory)
  const subtotal = getSubtotalBeforeVat(); const vatAmt = getVatAmount()
  const total = getTotal(); const paid = parseFloat(amountPaid || 0); const change = getChange()

  const CartPanel = (
    <div className="cart-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>🧾 Order Summary</h3>
        {isMobile && (
          <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>
        )}
      </div>
      <div>
        <label style={lbl}>Table Number</label>
        <input type="number" placeholder={`1–${TOTAL_TABLES}`} value={tableNo} onChange={handleTableChange} style={{ borderColor: tableError ? '#ef4444' : undefined }} />
        {tableError && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginTop: 6, fontWeight: 600 }}>🚫 {tableError}</div>}
      </div>
      <div>
        <label style={lbl}>Payment Method</label>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
          <optgroup label="💵 Cash"><option value="Cash">Cash</option></optgroup>
          <optgroup label="📱 E-Wallet">{E_WALLETS.map(w => <option key={w} value={w}>{w}</option>)}</optgroup>
          <optgroup label="💳 Card">
            <option value="Visa">Visa</option><option value="Mastercard">Mastercard</option>
            <option value="Credit Card">Credit Card</option><option value="Debit Card">Debit Card</option>
          </optgroup>
        </select>
      </div>
      {cart.length === 0 ? (
        <div className="empty-state" style={{ padding: 20 }}>
          <div style={{ fontSize: 34 }}>🛒</div>
          <p style={{ marginTop: 8, fontSize: 14 }}>Tap an item to add.</p>
        </div>
      ) : (
        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0', marginBottom: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{item.name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>₱{Number(item.price).toLocaleString()} × {item.qty}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: 24, height: 24, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#ef4444', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: 14, minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: 24, height: 24, border: 'none', borderRadius: 6, background: '#16a34a', cursor: 'pointer', color: 'white', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  <button onClick={() => removeFromCart(item.id)} style={{ width: 24, height: 24, background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Discount:</span>
                <select value={item.discount || 'None'} onChange={e => updateItemDiscount(item.id, e.target.value)} style={{ flex: 1, padding: '4px 8px', border: '1px solid #d1fae5', borderRadius: 6, fontSize: 12, outline: 'none', background: 'white' }}>
                  {settings.discounts.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                </select>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 5 }}>₱{getItemTotal(item).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', marginTop: 4 }}>
        {settings.vatEnabled && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 4 }}><span>Subtotal</span><span>₱{subtotal.toLocaleString()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 4 }}><span>VAT ({settings.vatRate}%)</span><span>₱{vatAmt.toFixed(2)}</span></div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, color: '#0f172a' }}><span>Total</span><span>₱{total.toLocaleString()}</span></div>
      </div>
      {paymentMethod === 'Cash' && (
        <>
          <div>
            <label style={lbl}>Amount Paid (₱)</label>
            <input type="text" inputMode="numeric" placeholder="0.00" value={amountPaidDisplay} onChange={handleAmountPaidChange} />
          </div>
          {paid >= total && total > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#16a34a' }}>Change</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>₱{change.toLocaleString()}</span>
            </div>
          )}
        </>
      )}
      {E_WALLETS.includes(paymentMethod) && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaQrcode /> QR code will appear after checkout.
        </div>
      )}
      <button className="btn-primary btn-checkout" onClick={handleCheckout}
        disabled={!!tableError || loadingCheckout || !activeShift}
        style={{ opacity: (tableError || loadingCheckout || !activeShift) ? 0.6 : 1, cursor: !activeShift ? 'not-allowed' : 'pointer' }}>
        {loadingCheckout ? '⏳ Processing...' : <><FaPrint size={14} /> Checkout & Print</>}
      </button>
      {receipt && (
        <button onClick={() => setShowVoidModal(true)} style={{ width: '100%', padding: '11px', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <FaTimes size={13} /> Void Last Transaction
        </button>
      )}
    </div>
  )

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 26 }}>Transaction</h1>
            {activeShift ? (
              <span style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#16a34a', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>🟢 Shift #{activeShift.id}</span>
            ) : (
              <span style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', color: '#ef4444', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, cursor: 'pointer' }} onClick={() => setShowShiftModal(true)}>🔴 No Shift</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {totalAlerts > 0 && (
              <button onClick={() => setShowAlerts(true)} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#fffbeb', color: '#d97706', border: '1.5px solid #fde68a', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600 }}>⚠️ {totalAlerts}</button>
            )}
            <button onClick={openSettingsModal} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600 }}><FaCog size={isMobile ? 11 : 13} /></button>
            {!isMobile && <>
              <button onClick={() => setShowXReading(true)} style={{ padding: '10px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><FaFileAlt size={12} /> X</button>
              <button onClick={() => setShowZReading(true)} style={{ padding: '10px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><FaFileAlt size={12} /> Z</button>
            </>}
            {activeShift ? (
              <button onClick={() => setShowShiftModal(true)} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600 }}>{isMobile ? 'Close' : 'Close Shift'}</button>
            ) : (
              <button onClick={() => setShowShiftModal(true)} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600 }}>{isMobile ? 'Open' : 'Open Shift'}</button>
            )}
          </div>
        </div>

        {isMobile && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setShowXReading(true)} style={{ flex: 1, padding: '8px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📊 X-Reading</button>
            <button onClick={() => setShowZReading(true)} style={{ flex: 1, padding: '8px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📋 Z-Reading</button>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>❌ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {!isMobile && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: 'white', padding: '12px 16px', borderRadius: 14, marginBottom: 18, boxShadow: '0 1px 4px rgba(22,163,74,0.08)', border: '1px solid #d1fae5' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', alignSelf: 'center', marginRight: 4 }}>Tables:</span>
            {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(num => {
              const occupied = getTableStatus(num) === 'Occupied'
              return (
                <div key={num} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: occupied ? '#fef2f2' : '#f0fdf4', color: occupied ? '#ef4444' : '#16a34a', border: `1.5px solid ${occupied ? '#fca5a5' : '#bbf7d0'}` }}>
                  {occupied ? '🔴' : '🟢'} T{num}
                </div>
              )
            })}
          </div>
        )}

        {isMobile ? (
          <div>
            <div className="category-tabs" style={{ overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
              {categories.map(cat => (
                <button key={cat} className={activeCategory === cat ? 'tab active' : 'tab'} onClick={() => setActiveCategory(cat)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {categoryIcons[cat]} {cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {loadingMenu ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  <div style={{ fontSize: 32 }}>⏳</div>
                  <div style={{ fontWeight: 700, marginTop: 8 }}>Loading...</div>
                </div>
              ) : filtered.map(item => {
                const inCart = cart.find(c => c.id === item.id)
                const oos = (item.stock ?? 0) === 0
                const badge = getStockBadge(item)
                return (
                  <div key={item.id} onClick={() => !oos && addToCart(item)}
                    style={{ background: 'white', borderRadius: 12, overflow: 'hidden', border: `2px solid ${oos ? '#fca5a5' : inCart ? '#16a34a' : '#e2e8f0'}`, opacity: oos ? 0.65 : 1, position: 'relative', cursor: oos ? 'not-allowed' : 'pointer' }}>
                    {oos && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,0.85)', color: 'white', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '4px 0', zIndex: 5 }}>❌ OUT OF STOCK</div>}
                    {inCart && <div style={{ position: 'absolute', top: 6, right: 6, background: '#16a34a', color: 'white', fontSize: 11, fontWeight: 800, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>{inCart.qty}</div>}
                    <div style={{ height: 80, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 30 }}>{categoryIcons[item.category]}</span>}
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#16a34a', marginBottom: 4 }}>₱{Number(item.price).toLocaleString()}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>📦 {badge.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => setShowCart(true)} style={{ position: 'fixed', bottom: 75, right: 16, zIndex: 998, background: '#16a34a', color: 'white', border: 'none', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(22,163,74,0.4)', cursor: 'pointer', fontSize: 20 }}>
              🛒
              {cart.length > 0 && (
                <div style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cart.reduce((s, c) => s + c.qty, 0)}
                </div>
              )}
            </button>
            {showCart && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1500 }} onClick={() => setShowCart(false)}>
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,0.2)' }}>
                  <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 16px' }} />
                  {CartPanel}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="transaction-layout">
            <div>
              <div className="category-tabs">
                {categories.map(cat => (
                  <button key={cat} className={activeCategory === cat ? 'tab active' : 'tab'} onClick={() => setActiveCategory(cat)}>
                    {categoryIcons[cat]} {cat}
                  </button>
                ))}
              </div>
              {loadingMenu ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
                  <div style={{ fontWeight: 700 }}>Loading menu...</div>
                </div>
              ) : (
                <div className="services-grid">
                  {filtered.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      <div style={{ fontSize: 36 }}>🍽️</div>
                      <div style={{ marginTop: 8 }}>No items in this category.</div>
                    </div>
                  )}
                  {filtered.map(item => {
                    const inCart = cart.find(c => c.id === item.id)
                    const oos = (item.stock ?? 0) === 0
                    const badge = getStockBadge(item)
                    return (
                      <div key={item.id} onClick={() => !oos && addToCart(item)}
                        style={{ background: 'white', borderRadius: 14, overflow: 'hidden', border: `2px solid ${oos ? '#fca5a5' : inCart ? '#16a34a' : '#e2e8f0'}`, boxShadow: inCart ? '0 4px 16px rgba(22,163,74,0.15)' : '0 1px 4px rgba(0,0,0,0.05)', transition: 'all 0.18s', opacity: oos ? 0.65 : 1, position: 'relative', cursor: oos ? 'not-allowed' : 'pointer' }}>
                        {oos && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,0.85)', color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 0', zIndex: 5 }}>❌ OUT OF STOCK</div>}
                        {inCart && <div style={{ position: 'absolute', top: 8, right: 8, background: '#16a34a', color: 'white', fontSize: 12, fontWeight: 800, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>{inCart.qty}</div>}
                        <div style={{ height: 105, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 38 }}>{categoryIcons[item.category]}</span>}
                        </div>
                        <div style={{ padding: '11px 13px' }}>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 2 }}>{item.name}</div>
                          <div style={{ fontWeight: 800, fontSize: 17, color: '#16a34a', marginBottom: 6 }}>₱{Number(item.price).toLocaleString()}</div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>📦 {badge.label}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            {CartPanel}
          </div>
        )}

        {receipt && !receipt.voided && (
          <div className="receipt" style={{ marginTop: 26 }}>
            <h2>🏨 VS Hotel Bistro</h2>
            <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Official Receipt</p>
            <hr />
            <p><strong>Transaction #:</strong> TXN-{String(receipt.id).padStart(5, '0')}</p>
            <p><strong>Date:</strong> {receipt.date}</p>
            <p><strong>Table No:</strong> {receipt.tableNo}</p>
            <p><strong>Cashier:</strong> {receipt.cashier_name}</p>
            <p><strong>Payment:</strong> {receipt.payment_method}</p>
            <hr />
            {receipt.items.map((s, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div className="receipt-item"><span>{s.name} ×{s.qty}</span><span>₱{(s.price * s.qty).toLocaleString()}</span></div>
                {s.item_discount !== 'None' && <div style={{ fontSize: 12, color: '#10b981', paddingLeft: 8 }}>Discount ({s.item_discount}): -₱{Number(s.item_discount_amount).toFixed(2)}</div>}
              </div>
            ))}
            <hr />
            <div className="receipt-item" style={{ fontWeight: 700, fontSize: 16 }}><span>Total</span><span>₱{receipt.total.toLocaleString()}</span></div>
            {receipt.payment_method === 'Cash' && <>
              <div className="receipt-item"><span>Amount Paid</span><span>₱{receipt.paid.toLocaleString()}</span></div>
              <div className="receipt-item" style={{ color: '#16a34a', fontWeight: 700 }}><span>Change</span><span>₱{receipt.change.toLocaleString()}</span></div>
            </>}
            <hr />
            <p style={{ textAlign: 'center', fontWeight: 600, fontSize: 14 }}>Thank you for dining with us! 🍽️</p>
            <button className="btn-primary" onClick={() => printReceipt(receipt, true)} style={{ width: '100%' }}><FaPrint size={13} /> Print Again</button>
          </div>
        )}

        {/* SETTINGS MODAL */}
        {showSettingsModal && tmpSettings && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 540, maxHeight: '85vh', overflowY: 'auto' }}>
              <h2><FaCog style={{ marginRight: 8 }} />POS Settings</h2>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 12, paddingBottom: 6, borderBottom: '1.5px solid #f1f5f9' }}>🧾 VAT / Tax</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    <input type="checkbox" checked={tmpSettings.vatEnabled} onChange={e => setTmpSettings(prev => ({ ...prev, vatEnabled: e.target.checked }))} style={{ width: 16, height: 16 }} />
                    Enable VAT
                  </label>
                </div>
                {tmpSettings.vatEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={lbl}>VAT Rate (%)</label>
                    <input type="number" min="0" max="100" value={tmpSettings.vatRate} onChange={e => setTmpSettings(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))} style={{ width: 80, padding: '6px 10px', border: '1.5px solid #d1fae5', borderRadius: 8, fontSize: 14, outline: 'none' }} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 12, paddingBottom: 6, borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🏷️ Discounts</span>
                  <button onClick={addDiscount} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}><FaPlus size={10} /> Add</button>
                </div>
                {tmpSettings.discounts.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input value={d.label} onChange={e => updateDiscount(idx, 'label', e.target.value)} placeholder="Label" style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                    <input type="number" min="0" max="100" value={d.rate} onChange={e => updateDiscount(idx, 'rate', parseFloat(e.target.value) || 0)} style={{ width: 64, padding: '7px 8px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', textAlign: 'center' }} />
                    <span style={{ fontSize: 12, color: '#64748b' }}>%</span>
                    <button onClick={() => removeDiscount(idx)} style={{ width: 28, height: 28, background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTrash size={11} /></button>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 12, paddingBottom: 6, borderBottom: '1.5px solid #f1f5f9' }}>📱 E-Wallet QR Codes</div>
                {E_WALLETS.map(wallet => (
                  <div key={wallet} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <img src={tmpSettings.qrImages[wallet]} alt={wallet} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{wallet}</div>
                      <button onClick={() => qrInputRefs[wallet].current.click()} style={{ padding: '5px 14px', background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>📂 Upload QR</button>
                      <input ref={qrInputRefs[wallet]} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleQrUpload(wallet, e.target.files[0])} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-actions" style={{ marginTop: 20 }}>
                <button onClick={saveSettingsAndClose} style={{ padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>💾 Save</button>
                <button className="btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* QR MODAL */}
        {showQRModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ textAlign: 'center', maxWidth: 360 }}>
              <h2><FaQrcode style={{ marginRight: 8 }} />{paymentMethod} Payment</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16 }}>Ask the customer to scan — <strong>₱{receipt?.total?.toLocaleString()}</strong></p>
              <img src={settings.qrImages[paymentMethod]} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', border: '3px solid #e2e8f0', borderRadius: 12, objectFit: 'contain', background: 'white' }} />
              <div className="form-actions" style={{ justifyContent: 'center' }}>
                <button onClick={() => { setShowQRModal(false); printReceipt(receipt, true) }} style={{ padding: '11px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>✅ Paid — Print</button>
                <button className="btn-secondary" onClick={() => setShowQRModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* VOID MODAL */}
        {showVoidModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2 style={{ color: '#ef4444' }}>🚫 Void Transaction</h2>
              <p>Void <strong>#{lastTxId}</strong> (₱{receipt?.total?.toLocaleString()}) and free <strong>Table {lastTableNo}</strong>?</p>
              <div style={{ marginTop: 14 }}>
                <label style={lbl}>Reason *</label>
                <input placeholder="e.g. Wrong order..." value={voidReason} onChange={e => setVoidReason(e.target.value)} />
              </div>
              <div className="form-actions">
                <button onClick={handleVoid} disabled={loadingVoid} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loadingVoid ? 0.6 : 1 }}>
                  {loadingVoid ? '⏳ Voiding...' : '✅ Confirm Void'}
                </button>
                <button className="btn-secondary" onClick={() => { setShowVoidModal(false); setVoidReason('') }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* SHIFT MODAL */}
        {showShiftModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 400 }}>
              <h2>⏱️ {activeShift ? 'Close Shift' : 'Open Shift'}</h2>
              {activeShift ? (
                <>
                  <p>Shift <strong>#{activeShift.id}</strong> — Opening Cash: <strong>₱{Number(activeShift.opening_cash).toLocaleString()}</strong></p>
                  <div style={{ marginTop: 14 }}>
                    <label style={lbl}>Closing Cash (₱)</label>
                    <input type="text" inputMode="numeric" placeholder="0.00" value={closingCashDisplay} onChange={handleClosingCashChange} />
                  </div>
                  <div className="form-actions" style={{ marginTop: 16 }}>
                    <button onClick={handleCloseShift} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>🔒 Close Shift</button>
                    <button className="btn-secondary" onClick={() => setShowShiftModal(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: '#64748b', fontSize: 14, marginBottom: 14 }}>Open a shift to start accepting transactions.</p>
                  <div>
                    <label style={lbl}>Opening Cash (₱)</label>
                    <input type="text" inputMode="numeric" placeholder="0.00" value={openingCashDisplay} onChange={handleOpeningCashChange} />
                  </div>
                  <div className="form-actions" style={{ marginTop: 16 }}>
                    <button onClick={handleOpenShift} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>🟢 Open Shift</button>
                    <button className="btn-secondary" onClick={() => setShowShiftModal(false)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* REPRINT MODAL */}
        {showReprintModal && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 380 }}>
              <h2><FaPrint style={{ marginRight: 8 }} />Reprint Receipt</h2>
              <div>
                <label style={lbl}>Transaction # (ID)</label>
                <input type="number" placeholder="e.g. 42" value={reprintTxId} onChange={e => setReprintTxId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleReprintById()} />
              </div>
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button onClick={handleReprintById} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>🖨️ Print</button>
                <button className="btn-secondary" onClick={() => { setShowReprintModal(false); setReprintTxId('') }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ALERTS MODAL */}
        {showAlerts && (
          <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 480 }}>
              <h2>⚠️ Stock Alerts</h2>
              {lowStockAlerts.outOfStock.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>❌ Out of Stock ({lowStockAlerts.outOfStock.length})</div>
                  {lowStockAlerts.outOfStock.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, marginBottom: 4, fontSize: 14 }}>
                      <span style={{ fontWeight: 600 }}>{i.name}</span><span style={{ color: '#ef4444', fontWeight: 700 }}>0 left</span>
                    </div>
                  ))}
                </div>
              )}
              {lowStockAlerts.lowStock.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, color: '#d97706', marginBottom: 8 }}>⚠️ Low Stock ({lowStockAlerts.lowStock.length})</div>
                  {lowStockAlerts.lowStock.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fffbeb', borderRadius: 8, marginBottom: 4, fontSize: 14 }}>
                      <span style={{ fontWeight: 600 }}>{i.name}</span><span style={{ color: '#d97706', fontWeight: 700 }}>{i.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="form-actions" style={{ marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setShowAlerts(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Z-READING */}
        {showZReading && (() => {
          const z = getZData()
          return (
            <div className="modal-overlay">
              <div className="modal" style={{ maxWidth: 480 }}>
                <h2>📊 Z-Reading — End of Day</h2>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>Total Transactions</span><span style={{ fontWeight: 700 }}>{z.count}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>Voided</span><span style={{ fontWeight: 700, color: '#ef4444' }}>{z.voided}</span></div>
                  {z.byPayment.map(p => (
                    <div key={p.method} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569' }}>
                      <span>{p.method} ({p.count})</span><span style={{ fontWeight: 600 }}>₱{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px dashed #bbf7d0', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 16 }}>Net Sales</span>
                    <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 18 }}>₱{z.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: 16 }}>
                  <button onClick={downloadZReadingExcel} style={{ padding: '11px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>📥 Download Excel</button>
                  <button className="btn-secondary" onClick={() => setShowZReading(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* X-READING */}
        {showXReading && (() => {
          const now = new Date(); const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
          const currentTx = allTransactions.filter(t => new Date(t.created_at) >= startOfDay)
          const validTx = currentTx.filter(t => !t.voided)
          const xTotal = validTx.reduce((s, t) => s + Number(t.total), 0)
          return (
            <div className="modal-overlay">
              <div className="modal" style={{ maxWidth: 440 }}>
                <h2>📈 X-Reading</h2>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>Transactions</span><span style={{ fontWeight: 700 }}>{validTx.length}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}><span>Voided</span><span style={{ fontWeight: 700, color: '#ef4444' }}>{currentTx.filter(t => t.voided).length}</span></div>
                  <div style={{ borderTop: '1px dashed #ddd6fe', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: 16 }}>Current Sales</span>
                    <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: 18 }}>₱{xTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: 16 }}>
                  <button onClick={downloadXReadingExcel} style={{ padding: '11px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>📥 Download Excel</button>
                  <button className="btn-secondary" onClick={() => setShowXReading(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}

const lbl = { fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }
export default Transaction