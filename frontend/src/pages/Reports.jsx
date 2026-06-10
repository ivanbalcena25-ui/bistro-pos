import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { FaMoneyBillWave, FaShoppingCart, FaCoffee, FaDownload, FaCalendarAlt, FaChevronLeft, FaChevronRight, FaUser, FaPrint } from 'react-icons/fa'
import { getTransactions } from '../api'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function CalendarPicker({ value, onChange, label, minDate, maxDate }) {
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(value ? new Date(value).getFullYear() : new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(value ? new Date(value).getMonth() : new Date().getMonth())
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getDays = () => ({ first: new Date(viewYear, viewMonth, 1).getDay(), total: new Date(viewYear, viewMonth + 1, 0).getDate() })
  const selectDay = (day) => { onChange(new Date(viewYear, viewMonth, day).toISOString().slice(0, 10)); setOpen(false) }
  const isSelected = (day) => value && new Date(viewYear, viewMonth, day).toISOString().slice(0, 10) === value
  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day).toISOString().slice(0, 10)
    return (minDate && d < minDate) || (maxDate && d > maxDate)
  }
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) } else setViewMonth(m => m - 1) }
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) } else setViewMonth(m => m + 1) }
  const { first, total } = getDays()
  const displayValue = value ? new Date(value + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 5 }}>{label}</label>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${open ? '#16a34a' : '#e2e8f0'}`, background: 'white', cursor: 'pointer', fontSize: 14, color: value ? '#1e1e2e' : '#94a3b8', fontWeight: value ? 600 : 400, minWidth: 170, boxShadow: open ? '0 0 0 3px rgba(22,163,74,0.12)' : 'none', transition: 'all 0.15s' }}>
        <FaCalendarAlt style={{ color: '#16a34a', fontSize: 14, flexShrink: 0 }} />
        {displayValue || 'Select date'}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 999, marginTop: 6, background: 'white', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.14)', border: '1.5px solid #e2e8f0', padding: 18, width: 290 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <button onClick={prevMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><FaChevronLeft size={12} /></button>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1e1e2e' }}>{MONTHS[viewMonth]} {viewYear}</span>
            <button onClick={nextMonth} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}><FaChevronRight size={12} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', padding: '4px 0' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: total }, (_, i) => i + 1).map(day => {
              const sel = isSelected(day); const dis = isDisabled(day)
              return (
                <button key={day} onClick={() => !dis && selectDay(day)} style={{ width: '100%', aspectRatio: '1', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: sel ? 700 : 500, background: sel ? '#16a34a' : 'transparent', color: sel ? 'white' : dis ? '#cbd5e1' : '#1e1e2e', cursor: dis ? 'default' : 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { if (!sel && !dis) e.currentTarget.style.background = '#f0fdf4' }}
                  onMouseLeave={e => { if (!sel && !dis) e.currentTarget.style.background = 'transparent' }}
                >{day}</button>
              )
            })}
          </div>
          {value && <button onClick={() => { onChange(''); setOpen(false) }} style={{ marginTop: 12, width: '100%', padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Clear date</button>}
        </div>
      )}
    </div>
  )
}

function Reports() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showVoided, setShowVoided] = useState(true)
  const [cashierFilter, setCashierFilter] = useState('All')
  const [expandedRows, setExpandedRows] = useState(new Set())

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getTransactions()
      setTransactions(Array.isArray(data) ? data : [])
    } catch (e) {
      setError('Failed to load transactions: ' + e.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000)
    return () => clearInterval(interval)
  }, [])

  const toggleRow = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const getFiltered = () => {
    const now = new Date()
    return [...transactions].filter(t => {
      const d = new Date(t.created_at)
      let passTime = true
      if (filter === 'today') passTime = d.toDateString() === now.toDateString()
      else if (filter === 'week') passTime = (now - d) / 86400000 <= 7
      else if (filter === 'month') passTime = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      else if (filter === 'year') passTime = d.getFullYear() === now.getFullYear()
      else if (filter === 'custom') {
        if (!startDate && !endDate) passTime = true
        else {
          const start = startDate ? new Date(startDate) : null
          const end = endDate ? new Date(endDate) : null
          if (end) end.setHours(23, 59, 59, 999)
          if (start && end) passTime = d >= start && d <= end
          else if (start) passTime = d >= start
          else if (end) passTime = d <= end
        }
      }
      const passCashier = cashierFilter === 'All' || t.cashier_name === cashierFilter
      return passTime && passCashier
    }).reverse()
  }

  const getFilteredStats = (list) => {
    const valid = list.filter(t => !t.voided)
    const voided = list.filter(t => t.voided)
    return {
      sales: valid.reduce((s, t) => s + Number(t.total), 0),
      orders: valid.length,
      items: valid.reduce((s, t) => s + (t.items?.reduce((ss, i) => ss + i.qty, 0) || 0), 0),
      voidedCount: voided.length,
      voidedAmount: voided.reduce((s, t) => s + Number(t.total), 0),
    }
  }

  const handleExport = () => {
    const list = displayed
    if (list.length === 0) return alert('No transactions to export!')
    let csv = 'Transaction #,Date,Table,Cashier,Payment,Items Ordered,Total,Status,Void Reason\n'
    list.forEach(t => {
      const itemsSummary = (t.items || []).map(i => `${i.item_name || i.name} x${i.qty}`).join(' | ')
      csv += `${t.id},"${t.created_at}","Table ${t.table_no}","${t.cashier_name || '—'}","${t.payment_method || 'Cash'}","${itemsSummary}",${t.total},"${t.voided ? 'VOIDED' : 'Valid'}","${t.void_reason || ''}"\n`
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  const printReceipt = (t) => {
    const items = t.items || []
    const date = new Date(t.created_at).toLocaleString('en-PH')
    const receiptHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Receipt TXN-${String(t.id).padStart(5, '0')}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 302px; margin: 0 auto; padding: 10px 10px 80px; background: white; color: #000; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 2px solid #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 4px 0; }
    .item-name { flex: 1; word-wrap: break-word; }
    .item-price { text-align: right; min-width: 70px; }
    .big { font-size: 16px; font-weight: bold; }
    .barcode { font-size: 30px; letter-spacing: 4px; margin: 8px 0; }
    @media print {
      body { width: 302px; padding-bottom: 10px; }
      @page { margin: 0; size: 80mm auto; }
      .preview-controls { display: none !important; }
    }
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
  <div class="row"><span>Transaction #:</span><span><b>TXN-${String(t.id).padStart(5, '0')}</b></span></div>
  <div class="row"><span>Date:</span><span>${date}</span></div>
  <div class="row"><span>Table:</span><span><b>Table ${t.table_no}</b></span></div>
  <div class="row"><span>Cashier:</span><span>${t.cashier_name || '—'}</span></div>
  <div class="row"><span>Payment:</span><span><b>${t.payment_method || 'Cash'}</b></span></div>
  <div class="divider"></div>
  <div style="font-size:11px; font-weight:bold; margin-bottom:4px;">ITEMS ORDERED:</div>
  ${items.map(i => `
    <div class="row">
      <span class="item-name">${i.item_name || i.name} x${i.qty}</span>
      <span class="item-price">&#8369;${(Number(i.price) * Number(i.qty)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
    </div>
  `).join('')}
  ${items.length === 0 ? '<div style="font-size:11px;color:#666;padding-left:4px;">No item details available.</div>' : ''}
  <div class="divider"></div>
  <div class="double-divider"></div>
  <div class="total-row"><span>TOTAL DUE</span><span>&#8369;${Number(t.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
  <div class="double-divider"></div>
  ${(t.payment_method || 'Cash') === 'Cash' ? `
    <div class="row"><span>Cash Tendered</span><span>&#8369;${Number(t.amount_paid || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
    <div class="row bold"><span>Change</span><span>&#8369;${Number(t.change_amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span></div>
  ` : `
    <div class="row center" style="justify-content:center; margin:4px 0;"><span>** Paid via <b>${t.payment_method}</b> **</span></div>
  `}
  ${t.voided ? `
    <div class="divider"></div>
    <div class="center" style="color:#ef4444; font-weight:bold; font-size:13px;">*** VOIDED ***</div>
    ${t.void_reason ? `<div class="center" style="font-size:11px; color:#666;">Reason: ${t.void_reason}</div>` : ''}
  ` : ''}
  <div class="divider"></div>
  <div class="center" style="margin-top:8px">
    <div class="barcode">|||||||||||||||</div>
    <div style="font-size:10px; letter-spacing:2px; margin-bottom:6px;">${String(t.id).padStart(10, '0')}</div>
    <div style="font-size:12px; font-weight:bold;">Thank you for dining with us!</div>
    <div style="font-size:10px; margin-top:3px; color:#333;">Please come again :-)</div>
    <div style="font-size:9px; color:#555; margin-top:6px; letter-spacing:1px;">VS HOTEL BISTRO</div>
  </div>
  <div class="preview-controls">
    <button class="btn-print" onclick="window.print()">&#128438; Print Receipt</button>
    <button class="btn-close" onclick="window.close()">&#x2715; Close</button>
  </div>
</body>
</html>`
    const win = window.open('', '_blank', 'width=380,height=700,scrollbars=yes')
    if (!win) { alert('Pop-up blocked! Please allow pop-ups.'); return }
    win.document.write(receiptHTML)
    win.document.close()
    win.focus()
  }

  const allFiltered = getFiltered()
  const displayed = showVoided ? allFiltered : allFiltered.filter(t => !t.voided)
  const stats = getFilteredStats(allFiltered)
  const allCashiers = ['All', ...new Set(transactions.map(t => t.cashier_name).filter(Boolean))]

  const filters = [
    { val: 'all', label: 'All Time' }, { val: 'today', label: 'Today' },
    { val: 'week', label: 'This Week' }, { val: 'month', label: 'This Month' },
    { val: 'year', label: 'This Year' }, { val: 'custom', label: '📅 Custom Date' },
  ]

  const statCards = [
    { icon: <FaMoneyBillWave />, label: 'Net Sales', value: `₱${stats.sales.toLocaleString()}`, color: '#16a34a', bg: '#f0fdf4' },
    { icon: <FaShoppingCart />, label: 'Valid Orders', value: stats.orders, color: '#10b981', bg: '#ecfdf5' },
    { icon: <FaCoffee />, label: 'Items Sold', value: stats.items, color: '#ef4444', bg: '#fef2f2' },
  ]

  return (
    <div className="page-container">
      <Navbar />
      <div className="page-content">
        <div className="page-header">
          <div><h1>Reports</h1></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={loadData} style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0' }}>🔄 Refresh</button>
            <button className="btn-primary" onClick={handleExport}><FaDownload size={13} /> Export CSV</button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', padding: '10px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>❌ {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <div className="stats-grid" style={{ marginBottom: 16 }}>
          {statCards.map((s, i) => (
            <div key={i} className="stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-info"><h3>{s.value}</h3><p>{s.label}</p></div>
            </div>
          ))}
        </div>

        {stats.voidedCount > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🚫</span>
            <div>
              <span style={{ fontWeight: 700, color: '#ef4444', fontSize: 14 }}>{stats.voidedCount} Voided Transaction{stats.voidedCount > 1 ? 's' : ''}</span>
              <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 8 }}>Total voided amount: <strong style={{ color: '#ef4444' }}>₱{stats.voidedAmount.toLocaleString()}</strong></span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {filters.map(({ val, label }) => (
            <button key={val} onClick={() => { setFilter(val); if (val !== 'custom') { setStartDate(''); setEndDate('') } }} style={{ padding: '8px 18px', borderRadius: 20, fontSize: 14, fontWeight: 600, border: `1.5px solid ${filter === val ? '#16a34a' : '#e2e8f0'}`, background: filter === val ? '#16a34a' : 'white', color: filter === val ? 'white' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
              {label}
            </button>
          ))}
          <button onClick={() => setShowVoided(v => !v)} style={{ marginLeft: 'auto', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1.5px solid ${showVoided ? '#fca5a5' : '#e2e8f0'}`, background: showVoided ? '#fef2f2' : 'white', color: showVoided ? '#ef4444' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
            {showVoided ? '🚫 Hide Voided' : '👁 Show Voided'}
          </button>
        </div>

        {allCashiers.length > 2 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <FaUser style={{ color: '#94a3b8', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Cashier:</span>
            {allCashiers.map(c => (
              <button key={c} onClick={() => setCashierFilter(c)} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1.5px solid ${cashierFilter === c ? '#16a34a' : '#e2e8f0'}`, background: cashierFilter === c ? '#16a34a' : 'white', color: cashierFilter === c ? 'white' : '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}>
                {c === 'All' ? '👥 All' : `🧑‍💼 ${c}`}
              </button>
            ))}
          </div>
        )}

        {filter === 'custom' && (
          <div style={{ background: 'white', borderRadius: 16, padding: '20px 24px', marginBottom: 20, border: '1.5px solid #16a34a', boxShadow: '0 2px 16px rgba(22,163,74,0.08)', display: 'flex', alignItems: 'flex-end', gap: 22, flexWrap: 'wrap' }}>
            <CalendarPicker label="FROM" value={startDate} onChange={setStartDate} maxDate={endDate || undefined} />
            <span style={{ color: '#94a3b8', fontWeight: 700, paddingBottom: 10, fontSize: 20 }}>—</span>
            <CalendarPicker label="TO" value={endDate} onChange={setEndDate} minDate={startDate || undefined} />
            <div style={{ marginLeft: 'auto', fontSize: 14, color: '#16a34a', fontWeight: 700, paddingBottom: 8 }}>
              {displayed.length} result{displayed.length !== 1 ? 's' : ''} found
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 56, color: '#94a3b8' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>⏳</div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Loading transactions...</div>
          </div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Transaction #</th>
                  <th>Date & Time</th>
                  <th>Table</th>
                  <th>Cashier</th>
                  <th>Payment</th>
                  <th>Ordered</th>
                  <th>Total</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 56, color: '#94a3b8' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>No transactions found.</div>
                  </td></tr>
                ) : displayed.map((t, i) => {
                  const isVoided = !!t.voided
                  const items = t.items || []
                  const isExpanded = expandedRows.has(t.id)
                  const previewItems = isExpanded ? items : items.slice(0, 2)

                  return (
                    <tr key={t.id} style={{ background: isVoided ? '#fff5f5' : 'inherit' }}>

                      <td style={{ color: '#94a3b8', fontWeight: 700, fontSize: 14 }}>{i + 1}</td>

                      <td>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                          TXN-{String(t.id).padStart(5, '0')}
                        </span>
                      </td>

                      <td style={{ fontSize: 13, color: '#475569' }}>{new Date(t.created_at).toLocaleString()}</td>

                      <td>
                        <span style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, border: '1px solid #bbf7d0' }}>
                          Table {t.table_no}
                        </span>
                      </td>

                      <td>
                        {t.cashier_name
                          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, border: '1px solid #bbf7d0' }}>🧑‍💼 {t.cashier_name}</span>
                          : <span style={{ color: '#cbd5e1', fontSize: 14 }}>—</span>}
                      </td>

                      <td>
                        <span style={{ background: '#f8fafc', color: '#475569', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, border: '1px solid #e2e8f0' }}>
                          {t.payment_method || 'Cash'}
                        </span>
                      </td>

                      {/* Ordered — item names + qty */}
                      <td style={{ maxWidth: 240 }}>
                        {items.length === 0 ? (
                          <span style={{ color: '#cbd5e1', fontSize: 13 }}>—</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {previewItems.map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '3px 10px', fontSize: 12, color: '#166534', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {item.item_name || item.name}
                                  <span style={{ background: '#16a34a', color: 'white', borderRadius: 20, padding: '1px 6px', fontSize: 11, fontWeight: 700, marginLeft: 6 }}>
                                    x{item.qty}
                                  </span>
                                </span>
                              </div>
                            ))}
                            {items.length > 2 && (
                              <button
                                onClick={() => toggleRow(t.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 11, fontWeight: 700, textAlign: 'left', padding: '1px 0' }}
                              >
                                {isExpanded ? '▲ Show less' : `▼ +${items.length - 2} more`}
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 800, color: isVoided ? '#94a3b8' : '#16a34a', fontSize: 15, textDecoration: isVoided ? 'line-through' : 'none' }}>
                            ₱{Number(t.total).toLocaleString()}
                          </span>
                          {isVoided && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ background: '#fef2f2', color: '#ef4444', padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: '1px solid #fca5a5' }}>🚫 VOIDED</span>
                              {t.void_reason && <span style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 2 }}>"{t.void_reason}"</span>}
                              {t.void_by && <span style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 2 }}>by {t.void_by}</span>}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Receipt */}
                      <td>
                        <button
                          onClick={() => printReceipt(t)}
                          title="Print Receipt"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            background: isVoided ? '#f1f5f9' : '#f0fdf4',
                            color: isVoided ? '#94a3b8' : '#16a34a',
                            cursor: 'pointer', fontSize: 12, fontWeight: 700,
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { if (!isVoided) e.currentTarget.style.background = '#dcfce7' }}
                          onMouseLeave={e => { e.currentTarget.style.background = isVoided ? '#f1f5f9' : '#f0fdf4' }}
                        >
                          <FaPrint size={11} /> {isVoided ? 'Voided' : 'Print'}
                        </button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Reports