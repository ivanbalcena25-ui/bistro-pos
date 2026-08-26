import { useState, useEffect, useRef, useCallback } from 'react'
import Navbar from '../components/Navbar'
import { FaPrint, FaTimes, FaFileAlt, FaQrcode, FaCog, FaPlus, FaTrash } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import { SkeletonCardGrid } from '../components/Skeleton'
import AdminProfileMenu from '../components/AdminProfileMenu'
import {
  getMenu, getTables, updateTableByNumber,
  addTransaction, getTransactions, voidTransaction,
  getActiveShift, openShift, closeShift, addKitchenOrder,
  getLowStockAlerts
} from '../api'

// Must match the categories used in Menu.jsx, since that's where items are created.
const categories = ['Coffee', 'Non-Coffee', 'Beer', 'Pulutan']
const categoryIcons = { Coffee: '☕', 'Non-Coffee': '🧃', Beer: '🍺', Pulutan: '🍗' }
const DEFAULT_DISCOUNTS = {
  'None': 0, 'Senior (20%)': 0.20, 'PWD (20%)': 0.20,
  'Employee (15%)': 0.15, 'Happy Hour (10%)': 0.10, 'Promo (5%)': 0.05,
}
const DEFAULT_QR = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/220px-QR_code_for_mobile_English_Wikipedia.svg.png'
const E_WALLETS = ['GCash', 'Maya', 'ShopeePay', 'GrabPay']
const TOTAL_TABLES = 10

const txStyles = `
  

  .tx-root * { font-family: 'Plus Jakarta Sans', sans-serif; box-sizing: border-box; }

  .tx-root input,
  .tx-root select,
  .tx-root textarea {
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
  .tx-root input:focus,
  .tx-root select:focus {
    border-color: #16a34a;
    box-shadow: 0 0 0 3px rgba(22,163,74,.12);
  }

  .tx-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,.45);
    backdrop-filter: blur(4px);
    z-index: 2000;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .tx-modal {
    background: white;
    border-radius: 20px;
    padding: 28px 28px 24px;
    width: 100%; max-width: 480px;
    box-shadow: 0 24px 60px rgba(0,0,0,.18);
    max-height: 90vh; overflow-y: auto;
  }
  .tx-modal h2 {
    font-size: 18px; font-weight: 800; color: #0f172a;
    margin: 0 0 18px; display: flex; align-items: center; gap: 8px;
  }

  .tx-cart-panel {
    background: white;
    border-radius: 18px;
    border: 1.5px solid #d1fae5;
    padding: 18px 16px;
    display: flex; flex-direction: column; gap: 12px;
    box-shadow: 0 4px 20px rgba(22,163,74,.08);
    width: 320px; flex-shrink: 0;
    height: fit-content;
    position: sticky; top: 20px;
  }
  .tx-cart-panel h3 {
    font-size: 15px; font-weight: 800; color: #0f172a; margin: 0;
  }

  .tx-item-card {
    background: white;
    border-radius: 14px;
    border: 2px solid #e2e8f0;
    overflow: hidden;
    cursor: pointer;
    transition: all .18s;
    position: relative;
  }
  .tx-item-card:hover {
    border-color: #16a34a;
    box-shadow: 0 6px 20px rgba(22,163,74,.15);
    transform: translateY(-2px);
  }
  .tx-item-card.in-cart { border-color: #16a34a; box-shadow: 0 4px 16px rgba(22,163,74,.15); }
  .tx-item-card.oos { opacity: .6; cursor: not-allowed; border-color: #fca5a5; }

  .tx-cat-tab {
    padding: 8px 18px; border-radius: 25px; font-size: 13px;
    font-weight: 600; border: 1.5px solid #e2e8f0;
    background: white; color: #64748b; cursor: pointer; transition: all .15s;
    white-space: nowrap; font-family: 'Plus Jakarta Sans', sans-serif;
  }
  .tx-cat-tab.active {
    background: #16a34a; color: white; border-color: #16a34a;
    box-shadow: 0 4px 12px rgba(22,163,74,.3);
  }

  .tx-btn-primary {
    background: linear-gradient(135deg, #16a34a, #15803d);
    color: white; border: none; border-radius: 11px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 700; font-size: 14px;
    padding: 12px 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: all .18s; box-shadow: 0 4px 14px rgba(22,163,74,.3);
    width: 100%;
  }
  .tx-btn-primary:hover { box-shadow: 0 6px 20px rgba(22,163,74,.4); transform: translateY(-1px); }
  .tx-btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }

  .tx-btn-secondary {
    background: #f8fafc; color: #475569;
    border: 1.5px solid #e2e8f0; border-radius: 10px;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-weight: 600; font-size: 14px;
    padding: 10px 20px; cursor: pointer;
  }

  .tx-badge-shift-on {
    background: #f0fdf4; border: 1.5px solid #bbf7d0;
    color: #16a34a; font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 20px;
  }
  .tx-badge-shift-off {
    background: #fef2f2; border: 1.5px solid #fca5a5;
    color: #ef4444; font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 20px; cursor: pointer;
  }

  .tx-table-indicator {
    padding: 4px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 700;
    font-family: 'Plus Jakarta Sans', sans-serif;
  }
`

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
    try { const d = await getMenu(); setAvailableItems(Array.isArray(d) ? d : []) }
    catch (e) { setError('Failed to load menu: ' + e.message) }
    setLoadingMenu(false)
  }, [])

  const loadTablesSilent = useCallback(async () => {
    try { const d = await getTables(); setTables(Array.isArray(d) ? d : []) } catch {}
  }, [])

  const loadTransactions = useCallback(async () => {
    try { const d = await getTransactions(); setAllTransactions(Array.isArray(d) ? d : []) } catch {}
  }, [])

  const loadActiveShift = useCallback(async () => {
    try { const s = await getActiveShift(); setActiveShift(s); activeShiftRef.current = s } catch {}
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
    setTableNo(val); setTableError('')
    if (val) {
      const num = parseInt(val)
      if (num < 1 || num > TOTAL_TABLES) { setTableError(`Table must be 1–${TOTAL_TABLES}.`); return }
      if (getTableStatus(num) === 'Occupied') setTableError(`Table ${num} is occupied!`)
    }
  }

  const addToCart = useCallback(async (item) => {
    const currentShift = activeShiftRef.current
    if (!currentShift) { alert('No active shift! Please open a shift first.'); return }
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id)
      if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { id: item.id, name: item.name, price: item.price, category: item.category, stock: item.stock, status: item.status, imageUrl: item.image || null, qty: 1, discount: 'None' }]
    })
    if (isMobile) setShowCart(true)
  }, [isMobile])

  const updateQty = useCallback((id, delta) => {
    setCart(prev => prev.map(c => {
      if (c.id !== id) return c
      const newQty = c.qty + delta
      if (newQty < 1) return c
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
    const cartSnapshot = [...cart]

    try {
      const result = await addTransaction({
        customer_name: `Table ${num}`, table_no: num, total,
        amount_paid: paid, change_amount: change,
        discount_type: 'None', discount_amount: 0,
        vat_amount: getVatAmount(), payment_method: paymentMethod,
        cashier_name: user.username || 'Cashier',
        created_by: user.username || 'Cashier',
        shift_id: currentShift?.id || null,
        items: cartSnapshot.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }))
      })

      setLastTxId(result.id); setLastTableNo(num)
      await loadMenu()

      Promise.all([
        addKitchenOrder({ table_no: num, cashier_name: user.username || 'Cashier', items: cartSnapshot.map(i => ({ name: i.name, qty: i.qty })) }).catch(() => {}),
        updateTableByNumber(num, { status: 'Occupied', customer: `Table ${num}` }).then(() => loadTablesSilent()),
        loadAlertsSilent(), loadTransactions(),
      ])

      const receiptData = {
        id: result.id, tableNo,
        items: cartSnapshot.map(i => ({ name: i.name, price: i.price, qty: i.qty, item_discount: i.discount || 'None', item_discount_amount: getItemDiscountAmt(i), item_total: getItemTotal(i) })),
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

    } catch (e) { setError('Failed to save transaction! ' + e.message) }
    setLoadingCheckout(false)
  }

  const handleVoid = async () => {
    if (!voidReason.trim()) return alert('Please enter void reason!')
    if (!lastTxId) return alert('No transaction to void!')
    setLoadingVoid(true)
    try {
      await voidTransaction(lastTxId, { void_reason: voidReason, void_by: user.username || 'Cashier' })
      if (lastTableNo) { await updateTableByNumber(lastTableNo, { status: 'Available', customer: '' }); loadTablesSilent() }
      setShowVoidModal(false); setVoidReason(''); setReceipt(null); setLastTxId(null); setLastTableNo(null)
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
      items: (tx.items || []).map(i => ({ name: i.item_name, price: i.price, qty: i.qty, item_discount: 'None', item_discount_amount: 0, item_total: i.price * i.qty })),
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
    const receiptHTML = `<!DOCTYPE html><html><head><title>Receipt #${r.id}</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',Courier,monospace;font-size:12px;width:302px;margin:0 auto;padding:10px 10px ${preview ? '80px' : '10px'};background:white;color:#000;}.center{text-align:center;}.bold{font-weight:bold;}.divider{border-top:1px dashed #000;margin:6px 0;}.double-divider{border-top:2px solid #000;margin:6px 0;}.row{display:flex;justify-content:space-between;margin:3px 0;}.total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin:4px 0;}.item-name{flex:1;word-wrap:break-word;}.item-price{text-align:right;min-width:70px;}.discount{font-size:11px;color:#333;padding-left:12px;margin-bottom:2px;}.big{font-size:16px;font-weight:bold;}.barcode{font-size:30px;letter-spacing:4px;margin:8px 0;}@media print{body{width:302px;padding-bottom:10px;}@page{margin:0;size:80mm auto;}.preview-controls{display:none!important;}}.preview-controls{position:fixed;bottom:0;left:0;right:0;background:#1e293b;padding:12px 20px;display:flex;gap:10px;justify-content:center;}.btn-print{padding:10px 28px;background:#16a34a;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;}.btn-close{padding:10px 28px;background:#475569;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;}</style></head><body><div class="center" style="margin-bottom:8px"><div class="big">VS HOTEL BISTRO</div><div style="font-size:10px;margin-top:2px;letter-spacing:1px;">- - OFFICIAL RECEIPT - -</div></div><div class="divider"></div><div class="row"><span>Transaction #:</span><span><b>TXN-${String(r.id || '').padStart(5, '0')}</b></span></div><div class="row"><span>Date:</span><span>${r.date}</span></div><div class="row"><span>Table:</span><span><b>Table ${r.tableNo}</b></span></div><div class="row"><span>Cashier:</span><span>${r.cashier_name}</span></div><div class="row"><span>Payment:</span><span><b>${r.payment_method}</b></span></div><div class="divider"></div><div style="font-size:11px;font-weight:bold;margin-bottom:4px;">ITEMS ORDERED:</div>${r.items.map(i => `<div class="row"><span class="item-name">${i.name} x${i.qty}</span><span class="item-price">&#8369;${(i.price * i.qty).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>${i.item_discount && i.item_discount !== 'None' ? `<div class="discount">  Disc (${i.item_discount}): -&#8369;${Number(i.item_discount_amount).toFixed(2)}</div>` : ''}`).join('')}<div class="divider"></div>${r.vat_enabled ? `<div class="row"><span>Subtotal</span><span>&#8369;${Number(r.subtotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div><div class="row"><span>VAT (${r.vat_rate}%)</span><span>&#8369;${Number(r.vat_amount).toFixed(2)}</span></div>` : ''}<div class="double-divider"></div><div class="total-row"><span>TOTAL DUE</span><span>&#8369;${Number(r.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div><div class="double-divider"></div>${r.payment_method === 'Cash' ? `<div class="row"><span>Cash Tendered</span><span>&#8369;${Number(r.paid).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div><div class="row bold"><span>Change</span><span>&#8369;${Number(r.change).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>` : `<div class="row center" style="justify-content:center;margin:4px 0;"><span>** Paid via <b>${r.payment_method}</b> **</span></div>`}<div class="divider"></div><div class="center" style="margin-top:8px"><div class="barcode">|||||||||||||||</div><div style="font-size:10px;letter-spacing:2px;margin-bottom:6px;">${String(r.id || '').padStart(10, '0')}</div><div style="font-size:12px;font-weight:bold;">Thank you for dining with us!</div><div style="font-size:10px;margin-top:3px;color:#333;">Please come again :-)</div></div>${preview ? `<div class="preview-controls"><button class="btn-print" onclick="window.print()">&#128438; Print Receipt</button><button class="btn-close" onclick="window.close()">&#x2715; Close</button></div>` : ''}</body></html>`
    const win = window.open('', '_blank', `width=380,height=${preview ? 700 : 600},scrollbars=yes`)
    if (!win) { alert('Pop-up blocked! Please allow pop-ups.'); return }
    win.document.write(receiptHTML); win.document.close(); win.focus()
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
      byCashier: cashiers.map(c => ({ name: c, total: validTx.filter(t => t.cashier_name === c).reduce((s, t) => s + Number(t.total), 0), count: validTx.filter(t => t.cashier_name === c).length }))
    }
  }

  const downloadZReadingExcel = () => {
    const today = new Date().toDateString()
    const todayTx = allTransactions.filter(t => new Date(t.created_at).toDateString() === today)
    const validTx = todayTx.filter(t => !t.voided); const voidedTx = todayTx.filter(t => t.voided)
    const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    const wb = XLSX.utils.book_new()
    const summaryData = [['VS HOTEL BISTRO'], ['Z-READING — DAILY SALES REPORT'], [`Date: ${dateStr}`], [`Generated: ${new Date().toLocaleString()}`], [`Generated by: ${user.username}`], [], ['OVERALL SUMMARY'], ['Total Transactions', validTx.length], ['Voided Transactions', voidedTx.length], ['Gross Sales', validTx.reduce((s, t) => s + Number(t.total), 0)], ['Net Sales', validTx.reduce((s, t) => s + Number(t.total), 0)], [], ['PAYMENT METHOD BREAKDOWN'], ...['Cash', 'GCash', 'Maya', 'ShopeePay', 'GrabPay'].map(pm => { const pmTx = validTx.filter(t => t.payment_method === pm); return pmTx.length > 0 ? [pm, pmTx.length, pmTx.reduce((s, t) => s + Number(t.total), 0)] : null }).filter(Boolean)]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary')
    const cashiers = [...new Set(validTx.map(t => t.cashier_name))]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Cashier', 'Transactions', 'Total Sales'], ...cashiers.map(c => { const cTx = validTx.filter(t => t.cashier_name === c); return [c, cTx.length, cTx.reduce((s, t) => s + Number(t.total), 0)] })]), 'Per Cashier')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['#', 'Time', 'Table', 'Cashier', 'Payment', 'Total', 'Status'], ...todayTx.map((t, i) => [i + 1, new Date(t.created_at).toLocaleTimeString(), `Table ${t.table_no}`, t.cashier_name, t.payment_method || 'Cash', t.total, t.voided ? `VOIDED: ${t.void_reason || ''}` : 'Valid'])]), 'All Transactions')
    XLSX.writeFile(wb, `ZReading_${new Date().toISOString().slice(0, 10)}.xlsx`)
    setShowZReading(false)
  }

  const downloadXReadingExcel = () => {
    const now = new Date(); const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
    const currentTx = allTransactions.filter(t => new Date(t.created_at) >= startOfDay && new Date(t.created_at) <= now)
    const validTx = currentTx.filter(t => !t.voided)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['VS HOTEL BISTRO'], ['X-READING — MID-DAY SNAPSHOT'], [`As of: ${now.toLocaleString()}`], [`Generated by: ${user.username}`], [], ['Transactions so far today', validTx.length], ['Voided', currentTx.filter(t => t.voided).length], ['Current Sales', validTx.reduce((s, t) => s + Number(t.total), 0)], [], ['NOTE: This is a non-resetting snapshot. Use Z-Reading to close the day.']]), 'X-Reading')
    XLSX.writeFile(wb, `XReading_${now.toISOString().slice(0, 16).replace('T', '_')}.xlsx`)
    setShowXReading(false)
  }

  const totalAlerts = lowStockAlerts.lowStock.length + lowStockAlerts.outOfStock.length
  const filtered = availableItems.filter(i => i.category === activeCategory)
  const subtotal = getSubtotalBeforeVat(); const vatAmt = getVatAmount()
  const total = getTotal(); const paid = parseFloat(amountPaid || 0); const change = getChange()

  const CartPanel = (
    <div className={isMobile ? '' : 'tx-cart-panel'} style={isMobile ? {} : {}}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 15, color: '#0f172a', margin: 0 }}>🧾 Order Summary</h3>
        {isMobile && <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }}>✕</button>}
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
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#94a3b8' }}>
          <div style={{ fontSize: 36 }}>🛒</div>
          <p style={{ marginTop: 8, fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tap an item to add.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
          {cart.map(item => (
            <div key={item.id} style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{Number(item.price).toLocaleString()} × {item.qty}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => updateQty(item.id, -1)} style={{ width: 24, height: 24, border: '1px solid #e2e8f0', borderRadius: 6, background: 'white', cursor: 'pointer', color: '#ef4444', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>−</button>
                  <span style={{ fontWeight: 700, fontSize: 14, minWidth: 18, textAlign: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} style={{ width: 24, height: 24, border: 'none', borderRadius: 6, background: '#16a34a', cursor: 'pointer', color: 'white', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>+</button>
                  <button onClick={() => removeFromCart(item.id)} style={{ width: 24, height: 24, background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>✕</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Discount:</span>
                <select value={item.discount || 'None'} onChange={e => updateItemDiscount(item.id, e.target.value)} style={{ flex: 1, padding: '4px 8px', border: '1px solid #d1fae5', borderRadius: 6, fontSize: 11, outline: 'none', background: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {settings.discounts.map(d => <option key={d.label} value={d.label}>{d.label}</option>)}
                </select>
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#16a34a', marginTop: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{getItemTotal(item).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 14px' }}>
        {settings.vatEnabled && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span>Subtotal</span><span>₱{subtotal.toLocaleString()}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span>VAT ({settings.vatRate}%)</span><span>₱{vatAmt.toFixed(2)}</span></div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, color: '#15803d', fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span>Total</span><span>₱{total.toLocaleString()}</span></div>
      </div>

      {paymentMethod === 'Cash' && (
        <>
          <div>
            <label style={lbl}>Amount Paid (₱)</label>
            <input type="text" inputMode="numeric" placeholder="0.00" value={amountPaidDisplay} onChange={handleAmountPaidChange} />
          </div>
          {paid >= total && total > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Change</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{change.toLocaleString()}</span>
            </div>
          )}
        </>
      )}

      {E_WALLETS.includes(paymentMethod) && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <FaQrcode /> QR code will appear after checkout.
        </div>
      )}

      <button className="tx-btn-primary" onClick={handleCheckout}
        disabled={!!tableError || loadingCheckout || !activeShift}>
        {loadingCheckout ? '⏳ Processing...' : <><FaPrint size={13} /> Checkout & Print</>}
      </button>

      {lastTxId && (
        <button onClick={() => setShowVoidModal(true)} style={{ width: '100%', padding: '11px', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fca5a5', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <FaTimes size={13} /> Void Last Transaction
        </button>
      )}
    </div>
  )

  return (
    <div className="tx-root page-container">
      <style>{txStyles}</style>
      <Navbar />
      <div className="page-content">

        {/* Admin profile — top right */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <AdminProfileMenu />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? 18 : 26, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, color: '#0f172a' }}>Transaction</h1>
            {activeShift
              ? <span className="tx-badge-shift-on">🟢 Shift #{activeShift.id}</span>
              : <span className="tx-badge-shift-off" onClick={() => setShowShiftModal(true)}>🔴 No Shift</span>
            }
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {totalAlerts > 0 && (
              <button onClick={() => setShowAlerts(true)} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#fffbeb', color: '#d97706', border: '1.5px solid #fde68a', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>⚠️ {totalAlerts}</button>
            )}
            <button onClick={openSettingsModal} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><FaCog size={isMobile ? 11 : 13} /></button>
            {!isMobile && <>
              <button onClick={() => setShowXReading(true)} style={{ padding: '10px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><FaFileAlt size={12} /> X</button>
              <button onClick={() => setShowZReading(true)} style={{ padding: '10px 16px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><FaFileAlt size={12} /> Z</button>
            </>}
            {activeShift
              ? <button onClick={() => setShowShiftModal(true)} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{isMobile ? 'Close' : 'Close Shift'}</button>
              : <button onClick={() => setShowShiftModal(true)} style={{ padding: isMobile ? '7px 10px' : '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: isMobile ? 11 : 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{isMobile ? 'Open' : 'Open Shift'}</button>
            }
          </div>
        </div>

        {isMobile && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setShowXReading(true)} style={{ flex: 1, padding: '8px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📊 X-Reading</button>
            <button onClick={() => setShowZReading(true)} style={{ flex: 1, padding: '8px', background: '#1e40af', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📋 Z-Reading</button>
          </div>
        )}

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'space-between', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <span>❌ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* Table Status Bar */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', background: 'white', padding: '12px 16px', borderRadius: 14, marginBottom: 18, boxShadow: '0 1px 4px rgba(22,163,74,.08)', border: '1px solid #d1fae5' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', alignSelf: 'center', marginRight: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tables:</span>
            {Array.from({ length: TOTAL_TABLES }, (_, i) => i + 1).map(num => {
              const occupied = getTableStatus(num) === 'Occupied'
              return (
                <div key={num} className="tx-table-indicator" style={{ background: occupied ? '#fef2f2' : '#f0fdf4', color: occupied ? '#ef4444' : '#16a34a', border: `1.5px solid ${occupied ? '#fca5a5' : '#bbf7d0'}` }}>
                  {occupied ? '🔴' : '🟢'} T{num}
                </div>
              )
            })}
          </div>
        )}

        {/* Main Layout */}
        {isMobile ? (
          <div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
              {categories.map(cat => (
                <button key={cat} className={activeCategory === cat ? 'tx-cat-tab active' : 'tx-cat-tab'} onClick={() => setActiveCategory(cat)} style={{ flexShrink: 0 }}>
                  {categoryIcons[cat]} {cat}
                </button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {loadingMenu ? (
                <div style={{ gridColumn: '1/-1' }}>
                  <SkeletonCardGrid count={6} minWidth={140} cardHeight={150} />
                </div>
              ) : filtered.map(item => {
                const inCart = cart.find(c => c.id === item.id)
                const oos = (item.stock ?? 0) === 0
                const badge = getStockBadge(item)
                return (
                  <div key={item.id} className={`tx-item-card${oos ? ' oos' : inCart ? ' in-cart' : ''}`} onClick={() => !oos && addToCart(item)}>
                    {oos && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,.85)', color: 'white', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '4px 0', zIndex: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>❌ OUT OF STOCK</div>}
                    {inCart && <div style={{ position: 'absolute', top: 6, right: 6, background: '#16a34a', color: 'white', fontSize: 11, fontWeight: 800, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{inCart.qty}</div>}
                    <div style={{ height: 80, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 30 }}>{categoryIcons[item.category]}</span>}
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.name}</div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#16a34a', marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{Number(item.price).toLocaleString()}</div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: badge.bg, color: badge.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📦 {badge.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Floating Cart Button */}
            <button onClick={() => setShowCart(true)} style={{ position: 'fixed', bottom: 75, right: 16, zIndex: 998, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(22,163,74,.45)', cursor: 'pointer', fontSize: 20 }}>
              🛒
              {cart.length > 0 && (
                <div style={{ position: 'absolute', top: -4, right: -4, background: '#ef4444', color: 'white', fontSize: 11, fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {cart.reduce((s, c) => s + c.qty, 0)}
                </div>
              )}
            </button>
            {showCart && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,.5)', zIndex: 1500 }} onClick={() => setShowCart(false)}>
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white', borderRadius: '20px 20px 0 0', padding: '20px 16px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 32px rgba(0,0,0,.2)' }}>
                  <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 16px' }} />
                  {CartPanel}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {categories.map(cat => (
                  <button key={cat} className={activeCategory === cat ? 'tx-cat-tab active' : 'tx-cat-tab'} onClick={() => setActiveCategory(cat)}>
                    {categoryIcons[cat]} {cat}
                  </button>
                ))}
              </div>
              {loadingMenu ? (
                <SkeletonCardGrid count={10} minWidth={160} cardHeight={170} />
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
                  {filtered.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      <div style={{ fontSize: 36 }}>🍽️</div>
                      <div style={{ marginTop: 8, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No items in this category.</div>
                    </div>
                  )}
                  {filtered.map(item => {
                    const inCart = cart.find(c => c.id === item.id)
                    const oos = (item.stock ?? 0) === 0
                    const badge = getStockBadge(item)
                    return (
                      <div key={item.id} className={`tx-item-card${oos ? ' oos' : inCart ? ' in-cart' : ''}`} onClick={() => !oos && addToCart(item)}>
                        {oos && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239,68,68,.85)', color: 'white', fontSize: 11, fontWeight: 700, textAlign: 'center', padding: '5px 0', zIndex: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>❌ OUT OF STOCK</div>}
                        {inCart && <div style={{ position: 'absolute', top: 8, right: 8, background: '#16a34a', color: 'white', fontSize: 12, fontWeight: 800, width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{inCart.qty}</div>}
                        <div style={{ height: 105, background: 'linear-gradient(180deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          {item.image ? <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 38 }}>{categoryIcons[item.category]}</span>}
                        </div>
                        <div style={{ padding: '11px 13px' }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 2, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{item.name}</div>
                          <div style={{ fontWeight: 800, fontSize: 17, color: '#16a34a', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{Number(item.price).toLocaleString()}</div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📦 {badge.label}</div>
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

        {/* ── MODALS ── */}
        {showSettingsModal && tmpSettings && (
          <div className="tx-modal-overlay">
            <div className="tx-modal" style={{ maxWidth: 540 }}>
              <h2><FaCog style={{ marginRight: 8 }} />POS Settings</h2>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 10, paddingBottom: 6, borderBottom: '1.5px solid #f1f5f9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>🧾 VAT / Tax</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>
                  <input type="checkbox" checked={tmpSettings.vatEnabled} onChange={e => setTmpSettings(prev => ({ ...prev, vatEnabled: e.target.checked }))} style={{ width: 16, height: 16 }} />
                  Enable VAT
                </label>
                {tmpSettings.vatEnabled && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label style={lbl}>VAT Rate (%)</label>
                    <input type="number" min="0" max="100" value={tmpSettings.vatRate} onChange={e => setTmpSettings(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))} style={{ width: 80 }} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 10, paddingBottom: 6, borderBottom: '1.5px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  <span>🏷️ Discounts</span>
                  <button onClick={addDiscount} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><FaPlus size={10} /> Add</button>
                </div>
                {tmpSettings.discounts.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <input value={d.label} onChange={e => updateDiscount(idx, 'label', e.target.value)} placeholder="Label" style={{ flex: 1 }} />
                    <input type="number" min="0" max="100" value={d.rate} onChange={e => updateDiscount(idx, 'rate', parseFloat(e.target.value) || 0)} style={{ width: 64, textAlign: 'center' }} />
                    <span style={{ fontSize: 12, color: '#64748b', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>%</span>
                    <button onClick={() => removeDiscount(idx)} style={{ width: 28, height: 28, background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTrash size={11} /></button>
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 10, paddingBottom: 6, borderBottom: '1.5px solid #f1f5f9', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📱 E-Wallet QR Codes</div>
                {E_WALLETS.map(wallet => (
                  <div key={wallet} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <img src={tmpSettings.qrImages[wallet]} alt={wallet} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{wallet}</div>
                      <button onClick={() => qrInputRefs[wallet].current.click()} style={{ padding: '5px 12px', background: '#eff6ff', color: '#1d4ed8', border: '1.5px solid #bfdbfe', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📂 Upload QR</button>
                      <input ref={qrInputRefs[wallet]} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleQrUpload(wallet, e.target.files[0])} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button className="tx-btn-primary" onClick={saveSettingsAndClose} style={{ width: 'auto', padding: '10px 24px' }}>💾 Save</button>
                <button className="tx-btn-secondary" onClick={() => setShowSettingsModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showQRModal && (
          <div className="tx-modal-overlay">
            <div className="tx-modal" style={{ textAlign: 'center', maxWidth: 360 }}>
              <h2 style={{ justifyContent: 'center' }}><FaQrcode style={{ marginRight: 8 }} />{paymentMethod} Payment</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ask the customer to scan — <strong>₱{receipt?.total?.toLocaleString()}</strong></p>
              <img src={settings.qrImages[paymentMethod]} alt="QR Code" style={{ width: 200, height: 200, margin: '0 auto 16px', display: 'block', border: '3px solid #e2e8f0', borderRadius: 12, objectFit: 'contain', background: 'white' }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="tx-btn-primary" onClick={() => { setShowQRModal(false); printReceipt(receipt, true) }} style={{ width: 'auto', padding: '11px 24px' }}>✅ Paid — Print</button>
                <button className="tx-btn-secondary" onClick={() => setShowQRModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showVoidModal && (
          <div className="tx-modal-overlay">
            <div className="tx-modal">
              <h2 style={{ color: '#ef4444' }}>🚫 Void Transaction</h2>
              <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, marginBottom: 14 }}>Void <strong>#{lastTxId}</strong> and free <strong>Table {lastTableNo}</strong>?</p>
              <label style={lbl}>Reason *</label>
              <input placeholder="e.g. Wrong order..." value={voidReason} onChange={e => setVoidReason(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={handleVoid} disabled={loadingVoid} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, opacity: loadingVoid ? .6 : 1, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  {loadingVoid ? '⏳ Voiding...' : '✅ Confirm Void'}
                </button>
                <button className="tx-btn-secondary" onClick={() => { setShowVoidModal(false); setVoidReason('') }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showShiftModal && (
          <div className="tx-modal-overlay">
            <div className="tx-modal" style={{ maxWidth: 400 }}>
              <h2>⏱️ {activeShift ? 'Close Shift' : 'Open Shift'}</h2>
              {activeShift ? (
                <>
                  <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, marginBottom: 14 }}>Shift <strong>#{activeShift.id}</strong> — Opening Cash: <strong>₱{Number(activeShift.opening_cash).toLocaleString()}</strong></p>
                  <label style={lbl}>Closing Cash (₱)</label>
                  <input type="text" inputMode="numeric" placeholder="0.00" value={closingCashDisplay} onChange={handleClosingCashChange} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button onClick={handleCloseShift} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>🔒 Close Shift</button>
                    <button className="tx-btn-secondary" onClick={() => setShowShiftModal(false)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{ color: '#64748b', fontSize: 14, marginBottom: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Open a shift to start accepting transactions.</p>
                  <label style={lbl}>Opening Cash (₱)</label>
                  <input type="text" inputMode="numeric" placeholder="0.00" value={openingCashDisplay} onChange={handleOpeningCashChange} />
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="tx-btn-primary" onClick={handleOpenShift} style={{ width: 'auto', padding: '10px 20px' }}>🟢 Open Shift</button>
                    <button className="tx-btn-secondary" onClick={() => setShowShiftModal(false)}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showAlerts && (
          <div className="tx-modal-overlay">
            <div className="tx-modal" style={{ maxWidth: 480 }}>
              <h2>⚠️ Stock Alerts</h2>
              {lowStockAlerts.outOfStock.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>❌ Out of Stock ({lowStockAlerts.outOfStock.length})</div>
                  {lowStockAlerts.outOfStock.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, marginBottom: 4, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span style={{ fontWeight: 600 }}>{i.name}</span><span style={{ color: '#ef4444', fontWeight: 700 }}>0 left</span>
                    </div>
                  ))}
                </div>
              )}
              {lowStockAlerts.lowStock.length > 0 && (
                <div>
                  <div style={{ fontWeight: 700, color: '#d97706', marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>⚠️ Low Stock ({lowStockAlerts.lowStock.length})</div>
                  {lowStockAlerts.lowStock.map(i => (
                    <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fffbeb', borderRadius: 8, marginBottom: 4, fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span style={{ fontWeight: 600 }}>{i.name}</span><span style={{ color: '#d97706', fontWeight: 700 }}>{i.stock} left</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <button className="tx-btn-secondary" onClick={() => setShowAlerts(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {showZReading && (() => {
          const z = getZData()
          return (
            <div className="tx-modal-overlay">
              <div className="tx-modal" style={{ maxWidth: 480 }}>
                <h2>📊 Z-Reading — End of Day</h2>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span>Total Transactions</span><span style={{ fontWeight: 700 }}>{z.count}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span>Voided</span><span style={{ fontWeight: 700, color: '#ef4444' }}>{z.voided}</span></div>
                  {z.byPayment.map(p => (
                    <div key={p.method} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span>{p.method} ({p.count})</span><span style={{ fontWeight: 600 }}>₱{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px dashed #bbf7d0', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#16a34a', fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Net Sales</span>
                    <span style={{ fontWeight: 800, color: '#16a34a', fontSize: 18, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{z.total.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="tx-btn-primary" onClick={downloadZReadingExcel} style={{ width: 'auto', padding: '11px 20px' }}>📥 Download Excel</button>
                  <button className="tx-btn-secondary" onClick={() => setShowZReading(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )
        })()}

        {showXReading && (() => {
          const now = new Date(); const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0)
          const currentTx = allTransactions.filter(t => new Date(t.created_at) >= startOfDay)
          const validTx = currentTx.filter(t => !t.voided)
          const xTotal = validTx.reduce((s, t) => s + Number(t.total), 0)
          return (
            <div className="tx-modal-overlay">
              <div className="tx-modal" style={{ maxWidth: 440 }}>
                <h2>📈 X-Reading</h2>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span>Transactions</span><span style={{ fontWeight: 700 }}>{validTx.length}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: "'Plus Jakarta Sans', sans-serif" }}><span>Voided</span><span style={{ fontWeight: 700, color: '#ef4444' }}>{currentTx.filter(t => t.voided).length}</span></div>
                  <div style={{ borderTop: '1px dashed #ddd6fe', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#7c3aed', fontSize: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Current Sales</span>
                    <span style={{ fontWeight: 800, color: '#7c3aed', fontSize: 18, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>₱{xTotal.toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={downloadXReadingExcel} style={{ padding: '11px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>📥 Download Excel</button>
                  <button className="tx-btn-secondary" onClick={() => setShowXReading(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )
        })()}

      </div>
    </div>
  )
}

const lbl = { fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5, fontFamily: "'Plus Jakarta Sans', sans-serif" }
export default Transaction